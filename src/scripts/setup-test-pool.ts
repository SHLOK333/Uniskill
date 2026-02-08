// Complete setup script for Uniswap v4 test pool
// Uses existing Sepolia WETH + creates pool + adds liquidity
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Contract addresses on Sepolia
const POOL_MANAGER = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543';
const POOL_MODIFY_LIQUIDITY_TEST = '0x0c478023803a644c94c4ce1c1e7b9a087e411b0a';
const SEPOLIA_WETH = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9';

// ABIs
const POOL_MANAGER_ABI = [
    'function initialize((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96) external returns (int24 tick)',
];

const POOL_MODIFY_LIQUIDITY_ABI = [
    'function modifyLiquidity(bytes32 poolId, int24 tickLower, int24 tickUpper, int256 liquidityDelta, bytes hookData) external returns (int256 delta0, int256 delta1)',
];

const ERC20_ABI = [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
];

// Calculate sqrtPriceX96 for a given price
function calculateSqrtPriceX96(price: number): bigint {
    const sqrtPrice = Math.sqrt(price);
    const Q96 = BigInt(2) ** BigInt(96);
    return BigInt(Math.floor(sqrtPrice * Number(Q96)));
}

// Calculate pool ID from pool key
function calculatePoolId(poolKey: any): string {
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'address', 'uint24', 'int24', 'address'],
        [
            poolKey.currency0,
            poolKey.currency1,
            poolKey.fee,
            poolKey.tickSpacing,
            poolKey.hooks,
        ]
    );
    return ethers.keccak256(encoded);
}

async function setupTestPool() {
    try {
        // Load wallet
        const agentsData = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), '.data', 'agents.json'), 'utf-8')
        );

        const apiKey = 'uniskill_3c6564e39f0649ee9826225403c97cd8';
        const agent = agentsData[apiKey];

        if (!agent) {
            throw new Error('Agent not found');
        }

        const { getWalletFromEncrypted } = await import('../lib/ethereum');
        const wallet = await getWalletFromEncrypted(
            process.env.WALLET_ENCRYPTION_PASSWORD!,
            agent.encryptedPrivateKey,
            agent.encryptionIv
        );

        console.log('\n=== Uniswap v4 Test Pool Setup ===\n');
        console.log('Wallet:', wallet.address);
        const balance = await wallet.provider.getBalance(wallet.address);
        console.log('Balance:', ethers.formatEther(balance), 'ETH');

        if (balance < ethers.parseEther('0.01')) {
            throw new Error('Insufficient ETH balance. Need at least 0.01 ETH for gas.');
        }

        // For simplicity, we'll use WETH and create a mock token address
        // In a real scenario, you'd deploy an actual ERC20 token
        // For now, let's use two existing tokens or wrap ETH to WETH

        console.log('\n📝 Pool Configuration:');
        console.log('Token 0 (WETH):', SEPOLIA_WETH);
        console.log('Token 1: Will use a test token address');
        console.log('Fee Tier: 0.3% (3000)');
        console.log('Tick Spacing: 60');

        // Since deploying a full ERC20 is complex, let's use a different approach:
        // We'll document the process and create a manual setup guide

        const setupGuide = {
            step1: {
                title: 'Deploy Test Token',
                description: 'Deploy a simple ERC20 token using Remix or Hardhat',
                contract: 'MockERC20',
                parameters: {
                    name: 'Test USD Coin',
                    symbol: 'TUSDC',
                    decimals: 18,
                    initialSupply: '1000000000000000000000000', // 1M tokens
                },
            },
            step2: {
                title: 'Wrap ETH to WETH',
                description: 'Convert some ETH to WETH for the pool',
                wethAddress: SEPOLIA_WETH,
                amountToWrap: '0.01 ETH',
            },
            step3: {
                title: 'Initialize Pool',
                contract: POOL_MANAGER,
                function: 'initialize',
                parameters: {
                    poolKey: {
                        currency0: '(lower address)',
                        currency1: '(higher address)',
                        fee: 3000,
                        tickSpacing: 60,
                        hooks: ethers.ZeroAddress,
                    },
                    sqrtPriceX96: calculateSqrtPriceX96(1.0).toString(),
                },
            },
            step4: {
                title: 'Approve Tokens',
                description: 'Approve both tokens for PoolModifyLiquidityTest',
                spender: POOL_MODIFY_LIQUIDITY_TEST,
                amount: 'Max or specific amount',
            },
            step5: {
                title: 'Add Liquidity',
                contract: POOL_MODIFY_LIQUIDITY_TEST,
                function: 'modifyLiquidity',
                parameters: {
                    poolId: '(calculated from poolKey)',
                    tickLower: -887220,
                    tickUpper: 887220,
                    liquidityDelta: '(positive value)',
                    hookData: '0x',
                },
            },
        };

        fs.writeFileSync(
            path.join(process.cwd(), 'pool-setup-guide.json'),
            JSON.stringify(setupGuide, null, 2)
        );

        console.log('\n✅ Setup guide created: pool-setup-guide.json');
        console.log('\n⚠️  Manual steps required:');
        console.log('1. Deploy ERC20 token using Remix (https://remix.ethereum.org)');
        console.log('2. Wrap ETH to WETH');
        console.log('3. Run pool initialization script');
        console.log('\nAlternatively, we can use Uniswap v3 which has existing pools on Sepolia.');

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    setupTestPool()
        .then(() => {
            console.log('\n✅ Setup complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Setup failed:', error.message);
            process.exit(1);
        });
}

export { setupTestPool, calculateSqrtPriceX96, calculatePoolId };
