// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

// Simplified PoolExecutor that works with minimal dependencies
contract PoolExecutor {
    address public immutable poolManager;
    address public immutable token0;
    address public immutable token1;

    constructor(address _poolManager, address _token0, address _token1) {
        poolManager = _poolManager;
        token0 = _token0;
        token1 = _token1;
    }

    function approveTokens() external {
        // Approve PoolManager to spend tokens
        (bool success0,) = token0.call(
            abi.encodeWithSignature("approve(address,uint256)", poolManager, type(uint256).max)
        );
        require(success0, "Token0 approve failed");
        
        (bool success1,) = token1.call(
            abi.encodeWithSignature("approve(address,uint256)", poolManager, type(uint256).max)
        );
        require(success1, "Token1 approve failed");
    }

    function initializePool(
        address currency0,
        address currency1,
        uint24 fee,
        int24 tickSpacing,
        uint160 sqrtPriceX96
    ) external {
        // Call unlock with encoded initialize params
        bytes memory unlockData = abi.encode(
            "INIT",
            currency0,
            currency1,
            fee,
            tickSpacing,
            sqrtPriceX96
        );
        
        (bool success,) = poolManager.call(
            abi.encodeWithSignature("unlock(bytes)", unlockData)
        );
        require(success, "Pool init failed");
    }

    function addLiquidity(
        address currency0,
        address currency1,
        uint24 fee,
        int24 tickSpacing,
        int24 tickLower,
        int24 tickUpper,
        uint256 liquidityAmount
    ) external {
        // Call unlock with encoded liquidity params
        bytes memory unlockData = abi.encode(
            "LIQUIDITY",
            currency0,
            currency1,
            fee,
            tickSpacing,
            tickLower,
            tickUpper,
            liquidityAmount
        );
        
        (bool success,) = poolManager.call(
            abi.encodeWithSignature("unlock(bytes)", unlockData)
        );
        require(success, "Add liquidity failed");
    }

    // Callback from PoolManager
    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        require(msg.sender == poolManager, "Only PoolManager");
        
        (string memory action) = abi.decode(data, (string));
        
        if (keccak256(bytes(action)) == keccak256(bytes("INIT"))) {
            _handleInit(data);
        } else if (keccak256(bytes(action)) == keccak256(bytes("LIQUIDITY"))) {
            _handleLiquidity(data);
        }
        
        return bytes("");
    }

    function _handleInit(bytes calldata data) internal {
        (
            ,
            address currency0,
            address currency1,
            uint24 fee,
            int24 tickSpacing,
            uint160 sqrtPriceX96
        ) = abi.decode(data, (string, address, address, uint24, int24, uint160));
        
        // Call initialize on PoolManager
        bytes memory poolKey = abi.encode(currency0, currency1, fee, tickSpacing, address(0));
        
        (bool success,) = poolManager.call(
            abi.encodeWithSignature(
                "initialize((address,address,uint24,int24,address),uint160)",
                poolKey,
                sqrtPriceX96
            )
        );
        require(success, "Initialize failed");
    }

    function _handleLiquidity(bytes calldata data) internal {
        (
            ,
            address currency0,
            address currency1,
            uint24 fee,
            int24 tickSpacing,
            int24 tickLower,
            int24 tickUpper,
            uint256 liquidityAmount
        ) = abi.decode(data, (string, address, address, uint24, int24, int24, int24, uint256));
        
        // Call modifyLiquidity on PoolManager
        bytes memory poolKey = abi.encode(currency0, currency1, fee, tickSpacing, address(0));
        bytes memory liqParams = abi.encode(tickLower, tickUpper, int256(liquidityAmount), bytes32(0));
        
        (bool success, bytes memory result) = poolManager.call(
            abi.encodeWithSignature(
                "modifyLiquidity((address,address,uint24,int24,address),(int24,int24,int256,bytes32),bytes)",
                poolKey,
                liqParams,
                bytes("")
            )
        );
        require(success, "ModifyLiquidity failed");
        
        // Settle any deltas
        _settle();
    }

    function _settle() internal {
        // Transfer tokens to PoolManager to settle debts
        uint256 balance0 = _getBalance(token0, address(this));
        uint256 balance1 = _getBalance(token1, address(this));
        
        if (balance0 > 0) {
            (bool success,) = token0.call(
                abi.encodeWithSignature("transfer(address,uint256)", poolManager, balance0)
            );
            require(success, "Token0 transfer failed");
        }
        
        if (balance1 > 0) {
            (bool success,) = token1.call(
                abi.encodeWithSignature("transfer(address,uint256)", poolManager, balance1)
            );
            require(success, "Token1 transfer failed");
        }
    }

    function _getBalance(address token, address account) internal view returns (uint256) {
        (bool success, bytes memory data) = token.staticcall(
            abi.encodeWithSignature("balanceOf(address)", account)
        );
        require(success, "Balance check failed");
        return abi.decode(data, (uint256));
    }
}

contract DeployPoolExecutor is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address poolManager = vm.envAddress("POOL_MANAGER_ADDRESS");
        address weth = vm.envAddress("WETH_ADDRESS");
        address tusdc = vm.envAddress("TEST_TOKEN_ADDRESS");
        
        // Sort tokens
        (address token0, address token1) = tusdc < weth ? (tusdc, weth) : (weth, tusdc);
        
        console.log("=== Deploying PoolExecutor ===");
        console.log("PoolManager:", poolManager);
        console.log("Token0:", token0);
        console.log("Token1:", token1);
        
        vm.startBroadcast(deployerPrivateKey);
        
        PoolExecutor executor = new PoolExecutor(poolManager, token0, token1);
        console.log("\nPoolExecutor deployed at:", address(executor));
        
        // Transfer tokens to executor
        uint256 amount = 0.01 ether;
        (bool success0,) = token0.call(
            abi.encodeWithSignature("transfer(address,uint256)", address(executor), amount)
        );
        require(success0, "Token0 transfer failed");
        
        (bool success1,) = token1.call(
            abi.encodeWithSignature("transfer(address,uint256)", address(executor), amount)
        );
        require(success1, "Token1 transfer failed");
        
        console.log("Transferred", amount, "of each token to executor");
        
        // Approve tokens
        executor.approveTokens();
        console.log("Tokens approved");
        
        // Initialize pool
        console.log("\nInitializing pool...");
        executor.initializePool(
            token0,
            token1,
            3000,
            60,
            79228162514264337593543950336
        );
        console.log("Pool initialized!");
        
        // Add liquidity
        console.log("\nAdding liquidity...");
        executor.addLiquidity(
            token0,
            token1,
            3000,
            60,
            -887220,
            887220,
            amount
        );
        console.log("Liquidity added!");
        
        vm.stopBroadcast();
        
        console.log("\n=== Pool Setup Complete! ===");
        console.log("PoolExecutor:", address(executor));
        console.log("Pool is ready for swaps!");
    }
}
