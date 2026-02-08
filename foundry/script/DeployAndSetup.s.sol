// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {TestUSDC} from "../src/TestUSDC.sol";

// Minimal interfaces for Uniswap v4
interface IPoolManager {
    struct PoolKey {
        address currency0;
        address currency1;
        uint24 fee;
        int24 tickSpacing;
        address hooks;
    }
    
    function initialize(PoolKey memory key, uint160 sqrtPriceX96) external returns (int24 tick);
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

interface IWETH {
    function deposit() external payable;
}

contract DeployAndSetup is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Get addresses from environment to avoid checksum issues
        address poolManager = vm.envAddress("POOL_MANAGER_ADDRESS");
        address weth = vm.envAddress("WETH_ADDRESS");
        
        console.log("=== Deploying Test Token and Creating Pool ===");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        console.log("PoolManager:", poolManager);
        console.log("WETH:", weth);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Deploy TestUSDC
        console.log("\n1. Deploying TestUSDC...");
        TestUSDC tusdc = new TestUSDC();
        console.log("TestUSDC deployed at:", address(tusdc));
        console.log("Total supply:", tusdc.totalSupply());
        
        // Step 2: Wrap some ETH to WETH
        console.log("\n2. Wrapping ETH to WETH...");
        IWETH(weth).deposit{value: 0.01 ether}();
        console.log("WETH balance:", IERC20(weth).balanceOf(deployer));
        
        // Step 3: Sort tokens for PoolKey
        (address currency0, address currency1) = address(tusdc) < weth 
            ? (address(tusdc), weth) 
            : (weth, address(tusdc));
        
        console.log("\n3. Creating Pool...");
        console.log("Currency0:", currency0);
        console.log("Currency1:", currency1);
        
        // Step 4: Initialize pool
        IPoolManager.PoolKey memory poolKey = IPoolManager.PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000, // 0.3%
            tickSpacing: 60,
            hooks: address(0) // No hooks
        });
        
        // sqrtPriceX96 for 1:1 price
        uint160 sqrtPriceX96 = 79228162514264337593543950336; // sqrt(1) * 2^96
        
        try IPoolManager(poolManager).initialize(poolKey, sqrtPriceX96) returns (int24 tick) {
            console.log("Pool initialized! Tick:", uint256(int256(tick)));
            
            // Calculate and log pool ID
            bytes32 poolId = keccak256(abi.encode(poolKey));
            console.log("Pool ID:");
            console.logBytes32(poolId);
            
        } catch Error(string memory reason) {
            console.log("Pool initialization failed:", reason);
        } catch {
            console.log("Pool initialization failed with unknown error");
        }
        
        vm.stopBroadcast();
        
        // Save addresses to file
        console.log("\n=== Deployment Complete ===");
        console.log("TestUSDC:", address(tusdc));
        console.log("WETH:", weth);
        console.log("PoolManager:", poolManager);
        console.log("\nNext steps:");
        console.log("1. Set TEST_TOKEN_ADDRESS in .env");
        console.log("2. Run: forge script script/AddLiquidity.s.sol --rpc-url sepolia --broadcast");
        console.log("3. Test swap via API");
    }
}
