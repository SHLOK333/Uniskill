// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolModifyLiquidityTest} from "v4-core/src/test/PoolModifyLiquidityTest.sol";
import {CurrencyLibrary, Currency} from "v4-core/src/types/Currency.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {IERC20Minimal} from "v4-core/src/interfaces/external/IERC20Minimal.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {ModifyLiquidityParams} from "v4-core/src/types/PoolOperation.sol";

contract DeployPoolSimple is Script {
    using CurrencyLibrary for Currency;
    using PoolIdLibrary for PoolKey;

    // Sepolia addresses
    IPoolManager constant poolManager = IPoolManager(0xE03A1074c86CFeDd5C142C4F04F1a1536e203543);
    PoolModifyLiquidityTest constant lpRouter = PoolModifyLiquidityTest(0x0C478023803A644c94C4CE1C1E7B9a087E411B0a);

    function run() external {
        address weth = vm.envAddress("WETH_ADDRESS");
        address tusdc = vm.envAddress("TEST_TOKEN_ADDRESS");
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        // Sort tokens
        (Currency currency0, Currency currency1) = tusdc < weth
            ? (Currency.wrap(tusdc), Currency.wrap(weth))
            : (Currency.wrap(weth), Currency.wrap(tusdc));

        console.log("=== Deploying Pool via PoolManager ===");
        console.log("Currency0:", Currency.unwrap(currency0));
        console.log("Currency1:", Currency.unwrap(currency1));

        // Create pool key
        PoolKey memory key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });

        vm.startBroadcast(privateKey);

        // Initialize pool
        console.log("\n1. Initializing pool...");
        poolManager.initialize(key, TickMath.getSqrtPriceAtTick(0)); // 1:1 price
        console.log("Pool initialized!");

        // Approve tokens
        console.log("\n2. Approving tokens...");
        IERC20Minimal(Currency.unwrap(currency0)).approve(address(lpRouter), type(uint256).max);
        IERC20Minimal(Currency.unwrap(currency1)).approve(address(lpRouter), type(uint256).max);
        console.log("Tokens approved!");

        // Add liquidity
        console.log("\n3. Adding liquidity...");
        lpRouter.modifyLiquidity(
            key,
            ModifyLiquidityParams({
                tickLower: -60,
                tickUpper: 60,
                liquidityDelta: 1e18,
                salt: bytes32(0)
            }),
            ""
        );
        console.log("Liquidity added!");

        vm.stopBroadcast();

        console.log("\n=== SUCCESS! Pool is ready for swaps! ===");
    }
}
