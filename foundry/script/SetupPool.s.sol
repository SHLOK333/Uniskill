// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {ModifyLiquidityParams} from "v4-core/src/types/PoolOperation.sol";
import {IUnlockCallback} from "v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";

contract SetupPool is Script {
    using PoolIdLibrary for PoolKey;

    // Sepolia addresses
    IPoolManager constant POOL_MANAGER = IPoolManager(0xE03A1074c86CFeDd5C142C4F04F1a1536e203543);

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address wethAddress = vm.envAddress("WETH_ADDRESS");
        address tusdcAddress = vm.envAddress("TEST_TOKEN_ADDRESS");
        
        IERC20 weth = IERC20(wethAddress);
        IERC20 tusdc = IERC20(tusdcAddress);
        
        // Sort tokens
        (IERC20 token0, IERC20 token1) = address(tusdc) < address(weth) 
            ? (tusdc, weth) 
            : (weth, tusdc);
        
        console.log("=== Setting up Uniswap v4 Pool ===");
        console.log("Token0:", address(token0));
        console.log("Token1:", address(token1));
        
        // Create pool key
        Currency currency0 = Currency.wrap(address(token0));
        Currency currency1 = Currency.wrap(address(token1));
        
        PoolKey memory poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });
        
        PoolId poolId = poolKey.toId();
        bytes32 poolIdBytes = PoolId.unwrap(poolId);
        
        console.log("Pool ID:");
        console.logBytes32(poolIdBytes);
        
        // Initialize pool
        uint160 sqrtPriceX96 = 79228162514264337593543950336; // 1:1 price
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("\n1. Initializing pool...");
        POOL_MANAGER.initialize(poolKey, sqrtPriceX96);
        console.log("Pool initialized!");
        
        // Deploy PoolExecutor
        console.log("\n2. Deploying PoolExecutor...");
        PoolExecutor executor = new PoolExecutor(POOL_MANAGER, token0, token1);
        console.log("PoolExecutor deployed at:", address(executor));
        
        // Transfer tokens to executor
        uint256 amount = 0.01 ether;
        console.log("\n3. Transferring tokens to executor...");
        token0.transfer(address(executor), amount);
        token1.transfer(address(executor), amount);
        console.log("Transferred", amount, "of each token");
        
        // Approve tokens
        console.log("\n4. Approving tokens...");
        executor.approveMax();
        console.log("Tokens approved");
        
        // Add liquidity
        console.log("\n5. Adding liquidity...");
        ModifyLiquidityParams memory liqParams = ModifyLiquidityParams({
            tickLower: -887220,
            tickUpper: 887220,
            liquidityDelta: int256(amount),
            salt: bytes32(0)
        });
        
        executor.unlockAndRun(
            PoolExecutor.Params({
                poolKey: poolKey,
                liqParams: liqParams
            })
        );
        console.log("Liquidity added!");
        
        vm.stopBroadcast();
        
        console.log("\n=== Pool Setup Complete! ===");
        console.log("Pool is ready for swaps!");
    }
}

/// @notice Executes modifyLiquidity within unlockCallback
contract PoolExecutor is IUnlockCallback {
    IPoolManager public immutable poolManager;
    IERC20 public immutable token0;
    IERC20 public immutable token1;
    Currency public immutable currency0;
    Currency public immutable currency1;

    struct Params {
        PoolKey poolKey;
        ModifyLiquidityParams liqParams;
    }

    constructor(IPoolManager _poolManager, IERC20 _token0, IERC20 _token1) {
        poolManager = _poolManager;
        token0 = _token0;
        token1 = _token1;
        currency0 = Currency.wrap(address(_token0));
        currency1 = Currency.wrap(address(_token1));
    }

    function approveMax() external {
        token0.approve(address(poolManager), type(uint256).max);
        token1.approve(address(poolManager), type(uint256).max);
    }

    function unlockAndRun(Params calldata params) external {
        poolManager.unlock(abi.encode(params));
    }

    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        require(msg.sender == address(poolManager), "not poolManager");

        Params memory params = abi.decode(data, (Params));
        (BalanceDelta liqDelta,) = poolManager.modifyLiquidity(params.poolKey, params.liqParams, bytes(""));
        _settle(liqDelta);
        return bytes("");
    }

    function _settle(BalanceDelta delta) internal {
        int128 amt0 = delta.amount0();
        int128 amt1 = delta.amount1();

        if (amt0 < 0) {
            _pay(currency0, token0, uint128(-amt0));
        }
        if (amt1 < 0) {
            _pay(currency1, token1, uint128(-amt1));
        }

        if (amt0 > 0) {
            poolManager.take(currency0, address(this), uint128(amt0));
        }
        if (amt1 > 0) {
            poolManager.take(currency1, address(this), uint128(amt1));
        }
    }

    function _pay(Currency currency, IERC20 token, uint256 amount) internal {
        poolManager.sync(currency);
        token.transfer(address(poolManager), amount);
        poolManager.settle();
    }
}
