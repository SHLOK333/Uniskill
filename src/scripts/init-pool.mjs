// Initialize Uniswap v4 Pool
// Run: node --loader ts-node/esm src/scripts/init-pool.mjs
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contract addresses
const POOL_MANAGER = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543';
const WETH = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9';

const POOL_MANAGER_ABI = [
    'function initialize(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96) external returns (int24 tick)',
];

function calculateSqrtPriceX96(price) {
    const sqrtPrice = Math.sqrt(price);
    const Q96 = BigInt(2) ** BigInt(96);
    return BigInt(Math.floor(sqrtPrice * Number(Q96)));
}

function calculatePoolId(poolKey) {
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'address', 'uint24', 'int24', 'address'],
        [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks]
    );
    return ethers.keccak256(encoded);
}

async function main() {
    try {
        console.log('\n=== Initializing Uniswap v4 Pool ===\n');

        // Get token address from env
        const testTokenAddress = process.env.TEST_TOKEN_ADDRESS;
        if (!testTokenAddress) {
            throw new Error('TEST_TOKEN_ADDRESS not set in .env file');
        }

        // Load wallet
        const agentsData = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), '.data', 'agents.json'), 'utf-8')
        );

        const apiKey = 'uniskill_3c6564e39f0649ee9826225403c97cd8';
        const agent = agentsData[apiKey];

        if (!agent) {
            throw new Error('Agent not found');
        }

        // Create provider and wallet
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

        // Decrypt wallet (simplified - in production use proper decryption)
        const encryptionPassword = process.env.WALLET_ENCRYPTION_PASSWORD;
        const crypto = await import('crypto');
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            crypto.scryptSync(encryptionPassword, 'salt', 32),
            Buffer.from(agent.encryptionIv, 'hex')
        );

        // For now, let's use a simpler approach - just use the wallet address
        // You'll need to import the private key manually or use MetaMask

        console.log('⚠️  Manual step required:');
        console.log('Please use MetaMask or manually sign the transaction\n');

        // Sort tokens
        const [currency0, currency1] = WETH.toLowerCase() < testTokenAddress.toLowerCase()
            ? [WETH, testTokenAddress]
            : [testTokenAddress, WETH];

        const poolKey = {
            currency0,
            currency1,
            fee: 3000, // 0.3%
            tickSpacing: 60,
            hooks: ethers.ZeroAddress,
        };

        const poolId = calculatePoolId(poolKey);
        const sqrtPriceX96 = calculateSqrtPriceX96(1.0); // 1:1 price

        console.log('Pool Configuration:');
        console.log('  Currency0:', currency0);
        console.log('  Currency1:', currency1);
        console.log('  Fee: 0.3% (3000)');
        console.log('  Tick Spacing: 60');
        console.log('  Pool ID:', poolId);
        console.log('  Initial Price: 1:1');
        console.log('  sqrtPriceX96:', sqrtPriceX96.toString());

        console.log('\n📋 To initialize the pool:');
        console.log('1. Go to: https://sepolia.etherscan.io/address/' + POOL_MANAGER + '#writeContract');
        console.log('2. Connect your wallet');
        console.log('3. Call initialize() with these parameters:');
        console.log('\nkey (tuple):');
        console.log('  currency0:', currency0);
        console.log('  currency1:', currency1);
        console.log('  fee:', 3000);
        console.log('  tickSpacing:', 60);
        console.log('  hooks:', ethers.ZeroAddress);
        console.log('\nsqrtPriceX96:', sqrtPriceX96.toString());

        // Save pool info
        const poolInfo = {
            poolId,
            currency0,
            currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: ethers.ZeroAddress,
            sqrtPriceX96: sqrtPriceX96.toString(),
            createdAt: new Date().toISOString(),
        };

        fs.writeFileSync(
            path.join(process.cwd(), 'pool-info.json'),
            JSON.stringify(poolInfo, null, 2)
        );

        console.log('\n✅ Pool info saved to pool-info.json');
        console.log('\nAfter initializing on Etherscan, run: npm run add-liquidity');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
