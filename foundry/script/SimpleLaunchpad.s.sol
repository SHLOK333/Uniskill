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
import {IUnlockCallback} from "v4-core/src/interfaces/callback/IUnlockCallback.sol";

contract DeployLaunchpad is Script {
    using PoolIdLibrary for PoolKey;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address poolManager = vm.envAddress("POOL_MANAGER_ADDRESS");
        address weth = vm.envAddress("WETH_ADDRESS");
        address tusdc = vm.envAddress("TEST_TOKEN_ADDRESS");
        
        console.log("=== Deploying Simple Launchpad ===");
        console.log("PoolManager:", poolManager);
        console.log("WETH:", weth);
        console.log("TUSDC:", tusdc);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy launchpad
        SimpleLaunchpad launchpad = new SimpleLaunchpad(poolManager);
        console.log("\nLaunchpad deployed at:", address(launchpad));
        
        // Transfer tokens to launchpad
        uint256 amount = 0.01 ether;
        IERC20(weth).transfer(address(launchpad), amount);
        IERC20(tusdc).transfer(address(launchpad), amount);
        console.log("Transferred", amount, "of each token to launchpad");
        
        // Launch pool (initialize + add liquidity)
        (address token0, address token1) = tusdc < weth ? (tusdc, weth) : (weth, tusdc);
        
        PoolId poolId = launchpad.launchPool(token0, token1, amount, amount);
        console.log("\nPool launched!");
        console.log("Pool ID:");
        console.logBytes32(PoolId.unwrap(poolId));
        
        vm.stopBroadcast();
        
        console.log("\n=== SUCCESS! Pool is ready for swaps! ===");
    }
}

/// @notice Simple launchpad that initializes pools and adds liquidity
/// @dev Based on P.A.T's PropLaunchpad pattern
contract SimpleLaunchpad is IUnlockCallback {
    using PoolIdLibrary for PoolKey;

    address public immutable POOL_MANAGER;

    struct CallbackData {
        PoolKey key;
        address asset;
        uint256 amount;
    }

    constructor(address _poolManager) {
        POOL_MANAGER = _poolManager;
    }

    /// @notice Launch a new pool with initial liquidity
    /// @param token0 First token (must be < token1)
    /// @param token1 Second token
    /// @param amount0 Amount of token0 to add
    /// @param amount1 Amount of token1 to add
    function launchPool(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) external returns (PoolId poolId) {
        require(token0 < token1, "Invalid token order");
        
        // Create pool key
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });
        
        poolId = key.toId();
        
        // ✅ DIRECT CALL TO INITIALIZE - This works from a contract!
        uint160 sqrtPriceX96 = 79228162514264337593543950336; // 1:1 price
        IPoolManager(POOL_MANAGER).initialize(key, sqrtPriceX96);
        
        // Add liquidity for both tokens via unlock/callback
        _addLiquidity(key, token0, amount0);
        _addLiquidity(key, token1, amount1);
        
        return poolId;
    }

    /// @notice Add liquidity via unlock/callback pattern
    function _addLiquidity(PoolKey memory key, address asset, uint256 amount) internal {
        // Approve PoolManager
        IERC20(asset).approve(POOL_MANAGER, amount);
        
        // Prepare callback data
        CallbackData memory data = CallbackData({
            key: key,
            asset: asset,
            amount: amount
        });
        
        // Execute via unlock callback
        IPoolManager(POOL_MANAGER).unlock(abi.encode(data));
    }

    /// @notice Unlock callback for liquidity operations
    function unlockCallback(bytes calldata rawData) external override returns (bytes memory) {
        require(msg.sender == POOL_MANAGER, "Only PoolManager");
        
        CallbackData memory data = abi.decode(rawData, (CallbackData));
        
        // Transfer tokens to PoolManager
        IERC20(data.asset).transfer(POOL_MANAGER, data.amount);
        
        return "";
    }
}
