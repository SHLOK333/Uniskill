import 'dotenv/config';
import { ethers } from 'ethers';
import { TOKENS, POOL_CONFIG, HOOK_ADDRESS, POOL_MANAGER } from '../src/lib/agent-config';
import { getProvider, getWallet } from '../src/lib/ethereum';

const POOL_MANAGER_ABI = [
    'function initialize(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96) external returns (int24 tick)',
    'function getSlot0(bytes32 poolId) external view returns (uint160 sqrtPriceX96, int24 tick, uint16 protocolFee, uint24 lpFee)'
];

async function main() {
    console.log('🏊 Deploying Pool via PoolManager...');
    const provider = getProvider();
    const wallet = getWallet(provider);

    console.log(`User: ${wallet.address}`);
    console.log(`Using Hook: ${HOOK_ADDRESS}`);

    const pm = new ethers.Contract(POOL_MANAGER, POOL_MANAGER_ABI, wallet);

    // Sort Tokens
    const tokenA = TOKENS.USDC;
    const tokenB = TOKENS.WETH;
    const isZeroForOne = tokenA.toLowerCase() < tokenB.toLowerCase();
    const currency0 = isZeroForOne ? tokenA : tokenB;
    const currency1 = isZeroForOne ? tokenB : tokenA;

    console.log(`Pool: ${currency0} / ${currency1}`);

    const poolKey = {
        currency0: currency0,
        currency1: currency1,
        fee: POOL_CONFIG.fee,
        tickSpacing: POOL_CONFIG.tickSpacing,
        hooks: HOOK_ADDRESS
    };

    const SQRT_PRICE_1_1 = BigInt("79228162514264337593543950336");

    console.log('Initializing Pool...');
    try {
        console.log("Simulating initialize...");
        await pm.initialize.staticCall(poolKey, SQRT_PRICE_1_1);
        console.log("Simulation succeeded!");

        const tx = await pm.initialize(poolKey, SQRT_PRICE_1_1);
        console.log(`Init Tx: ${tx.hash}`);
        await tx.wait();
        console.log('✅ Pool Initialized.');
    } catch (e: any) {
        console.log('⚠️ Pool Initialization Failed:', e.message);
        if (e.data) {
            console.log('Revert Data:', e.data);
            const selector = e.data.slice(0, 10);
            if (selector === '0x9957df38') console.log('DECODED: PoolAlreadyInitialized() (wait, v4 doesnt have this?)');
            // Check for PoolAlreadyInitialized selector
        }
        if (e.reason) console.log('Revert Reason:', e.reason);
    }
}

main().catch(console.error);
