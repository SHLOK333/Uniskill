// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

interface IPoolModifyLiquidityTest {
    function modifyLiquidity(
        bytes32 poolId,
        int24 tickLower,
        int24 tickUpper,
        int256 liquidityDelta,
        bytes calldata hookData
    ) external returns (int256 delta0, int256 delta1);
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

contract AddLiquidity is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address testToken = vm.envAddress("TEST_TOKEN_ADDRESS");
        address weth = vm.envAddress("WETH_ADDRESS");
        address poolModifyLiquidityTest = vm.envAddress("POOL_MODIFY_LIQUIDITY_TEST_ADDRESS");
        
        console.log("=== Adding Liquidity ===");
        console.log("Deployer:", deployer);
        console.log("TestToken:", testToken);
        console.log("WETH:", weth);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Approve tokens
        uint256 amount = 0.01 ether;
        console.log("\n1. Approving tokens...");
        IERC20(weth).approve(poolModifyLiquidityTest, amount);
        IERC20(testToken).approve(poolModifyLiquidityTest, amount);
        console.log("Tokens approved");
        
        // Calculate pool ID
        (address currency0, address currency1) = testToken < weth 
            ? (testToken, weth) 
            : (weth, testToken);
        
        bytes32 poolId = keccak256(abi.encode(
            currency0,
            currency1,
            uint24(3000),
            int24(60),
            address(0)
        ));
        
        console.log("\n2. Adding liquidity to pool:");
        console.logBytes32(poolId);
        
        // Add full-range liquidity
        try IPoolModifyLiquidityTest(poolModifyLiquidityTest).modifyLiquidity(
            poolId,
            -887220, // tickLower (full range)
            887220,  // tickUpper (full range)
            int256(amount), // liquidityDelta
            "" // hookData
        ) returns (int256 delta0, int256 delta1) {
            console.log("Liquidity added!");
            console.log("Delta0:", uint256(delta0 < 0 ? -delta0 : delta0));
            console.log("Delta1:", uint256(delta1 < 0 ? -delta1 : delta1));
        } catch Error(string memory reason) {
            console.log("Failed to add liquidity:", reason);
        } catch {
            console.log("Failed to add liquidity with unknown error");
        }
        
        vm.stopBroadcast();
        
        console.log("\n=== Liquidity Addition Complete ===");
        console.log("Pool is now ready for swaps!");
    }
}
