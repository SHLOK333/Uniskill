import { ethers } from 'ethers';
import { HOOK_ADDRESS, TOKENS, POOL_CONFIG, POOL_MANAGER } from '../src/lib/agent-config';

async function main() {
    console.log('--- UNISKILL DEPLOYMENT SUMMARY ---');
    console.log('Network: Sepolia (11155111)');
    console.log('PoolManager:', POOL_MANAGER);
    console.log('ProofOfAgentHook:', HOOK_ADDRESS);
    console.log('TestUSDC Token:', TOKENS.USDC);
    console.log('WETH Token:', TOKENS.WETH);

    // Sort currencies correctly for V4
    const currencies = [TOKENS.USDC, TOKENS.WETH].sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1);

    // Calculate PoolId
    // PoolId = keccak256(abi.encode(currency0, currency1, fee, tickSpacing, hook))
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const encodedKey = abiCoder.encode(
        ['address', 'address', 'uint24', 'int24', 'address'],
        [currencies[0], currencies[1], POOL_CONFIG.fee, POOL_CONFIG.tickSpacing, HOOK_ADDRESS]
    );
    const poolId = ethers.keccak256(encodedKey);

    console.log('--- POOL IDENTITY ---');
    console.log('Currency0:', currencies[0]);
    console.log('Currency1:', currencies[1]);
    console.log('Fee:', POOL_CONFIG.fee);
    console.log('TickSpacing:', POOL_CONFIG.tickSpacing);
    console.log('PoolId:', poolId);
    console.log('-----------------------------------');
}

main().catch(console.error);
