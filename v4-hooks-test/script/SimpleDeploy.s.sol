// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPositionManager} from "@uniswap/v4-periphery/src/interfaces/IPositionManager.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import "forge-std/console.sol";

contract SimpleDeploy is Script {
    using CurrencyLibrary for Currency;

    // SEPOLIA ADDRESSES
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant HELPER_POSITION_MANAGER = 0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4; // PositionManager
    
    address constant TOKEN0 = 0x607c1FD9FD338EC825799A1068551CE19CACBe52; // USDC
    address constant TOKEN1 = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9; // WETH
    address constant HOOK = 0x9aaef755b63a9c41af4a950c08768763ac46c0c0;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Sort Tokens
        address t0 = TOKEN0;
        address t1 = TOKEN1;
        if (t0 > t1) (t0, t1) = (t1, t0);

        Currency c0 = Currency.wrap(t0);
        Currency c1 = Currency.wrap(t1);

        // 2. Define PoolKey
        PoolKey memory key = PoolKey({
            currency0: c0,
            currency1: c1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });

        // 3. Initialize Pool
        // SqrtPrice 1:1 roughly
        uint160 sqrtPriceX96 = 79228162514264337593543950336; 
        
        IPositionManager pm = IPositionManager(HELPER_POSITION_MANAGER);
        
        try pm.initializePool(key, sqrtPriceX96, new bytes(0)) returns (int24 tick) {
            console.log("Pool Initialized");
        } catch {
            console.log("Pool already initialized");
        }

        // 4. Approvals
        IERC20(t0).approve(address(pm), type(uint256).max);
        IERC20(t1).approve(address(pm), type(uint256).max);
        
        // Also approve Permit2?
        // PM uses Permit2.
        address PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
        IERC20(t0).approve(PERMIT2, type(uint256).max);
        IERC20(t1).approve(PERMIT2, type(uint256).max);

        // Permit2 approve PositionManager
        // IPermit2(PERMIT2).approve(token, spender, amount, expiration);
        // We need interface.
        // Assuming we can call it.
        // Or just use low-level call.
        (bool success, ) = PERMIT2.call(abi.encodeWithSignature("approve(address,address,uint160,uint48)", t0, address(pm), type(uint160).max, uint48(block.timestamp + 10000)));
        require(success, "Permit2 Approve 0 failed");
        
        (success, ) = PERMIT2.call(abi.encodeWithSignature("approve(address,address,uint160,uint48)", t1, address(pm), type(uint160).max, uint48(block.timestamp + 10000)));
        require(success, "Permit2 Approve 1 failed");

        // 5. Add Liquidity
        // Encode Actions
        bytes memory actions = abi.encodePacked(uint8(2)); // MINT_POSITION (0x02)
        
        // Encode Params
        // (PoolKey, tickLower, tickUpper, liquidity, amount0Max, amount1Max, recipient, hookData)
        bytes[] memory params = new bytes[](1);
        params[0] = abi.encode(
            key,
            -600, // tickLower
            600,  // tickUpper
            1e18, // liquidity 1 ether
            100e18, // amount0Max
            100e18, // amount1Max
            vm.addr(deployerPrivateKey), // recipient
            new bytes(0) // hookData
        );

        pm.modifyLiquidities(abi.encode(actions, params), block.timestamp + 60);

        vm.stopBroadcast();
    }
}
