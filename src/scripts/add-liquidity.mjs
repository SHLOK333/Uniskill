// Add liquidity to Uniswap v4 Pool
// Run: node --loader ts-node/esm src/scripts/add-liquidity.mjs
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POOL_MODIFY_LIQUIDITY_TEST = '0x0c478023803a644c94c4ce1c1e7b9a087e411b0a';
const WETH = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9';

const ERC20_ABI = [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
];

async function main() {
    try {
        console.log('\n=== Adding Liquidity to Uniswap v4 Pool ===\n');

        // Load pool info
        const poolInfo = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), 'pool-info.json'), 'utf-8')
        );

        const testTokenAddress = process.env.TEST_TOKEN_ADDRESS;
        if (!testTokenAddress) {
            throw new Error('TEST_TOKEN_ADDRESS not set in .env file');
        }

        const amount = ethers.parseEther('0.01'); // 0.01 tokens each

        console.log('Pool ID:', poolInfo.poolId);
        console.log('Amount to add: 0.01 of each token');
        console.log('\n📋 Manual steps:');
        console.log('\n1. Approve WETH:');
        console.log('   Go to: https://sepolia.etherscan.io/address/' + WETH + '#writeContract');
        console.log('   Call approve():');
        console.log('     spender:', POOL_MODIFY_LIQUIDITY_TEST);
        console.log('     amount:', amount.toString());

        console.log('\n2. Approve Test Token:');
        console.log('   Go to: https://sepolia.etherscan.io/address/' + testTokenAddress + '#writeContract');
        console.log('   Call approve():');
        console.log('     spender:', POOL_MODIFY_LIQUIDITY_TEST);
        console.log('     amount:', amount.toString());

        console.log('\n3. Add Liquidity:');
        console.log('   Go to: https://sepolia.etherscan.io/address/' + POOL_MODIFY_LIQUIDITY_TEST + '#writeContract');
        console.log('   Call modifyLiquidity():');
        console.log('     poolId:', poolInfo.poolId);
        console.log('     tickLower:', -887220);
        console.log('     tickUpper:', 887220);
        console.log('     liquidityDelta:', amount.toString(), '(use same as amount)');
        console.log('     hookData: 0x');

        console.log('\n✅ After completing these steps, your pool will have liquidity!');
        console.log('\nThen you can test swaps with: npm run test-swap');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
