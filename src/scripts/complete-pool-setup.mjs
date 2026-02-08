// Quick pool setup script using ethers.js
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const POOL_MANAGER = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543';
const POOL_MODIFY_LIQUIDITY_TEST = '0x0c478023803a644c94c4ce1c1e7b9a087e411b0a';
const WETH = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9';
const TUSDC = '0x607c1fd9fd338ec825799a1068551ce19cacbe52';

const POOL_MANAGER_ABI = [
    'function initialize(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96) external returns (int24 tick)'
];

const ERC20_ABI = [
    'function approve(address spender, uint256 amount) external returns (bool)'
];

const POOL_MODIFY_ABI = [
    'function modifyLiquidity(bytes32 poolId, int24 tickLower, int24 tickUpper, int256 liquidityDelta, bytes hookData) external returns (int256 delta0, int256 delta1)'
];

async function main() {
    console.log('🚀 Starting pool setup...\n');

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log('Wallet:', wallet.address);
    console.log('Balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH\n');

    // Sort tokens
    const [currency0, currency1] = TUSDC.toLowerCase() < WETH.toLowerCase()
        ? [TUSDC, WETH]
        : [WETH, TUSDC];

    console.log('Currency0:', currency0);
    console.log('Currency1:', currency1);

    // Step 1: Initialize pool
    console.log('\n📊 Step 1: Initializing pool...');
    const poolManager = new ethers.Contract(POOL_MANAGER, POOL_MANAGER_ABI, wallet);

    const poolKey = {
        currency0,
        currency1,
        fee: 3000,
        tickSpacing: 60,
        hooks: ethers.ZeroAddress
    };

    const sqrtPriceX96 = BigInt('79228162514264337593543950336'); // 1:1 price

    try {
        const tx = await poolManager.initialize(poolKey, sqrtPriceX96, {
            gasLimit: 3000000
        });
        console.log('Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('✅ Pool initialized! Block:', receipt.blockNumber);

        // Calculate pool ID
        const poolId = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'address', 'uint24', 'int24', 'address'],
            [currency0, currency1, 3000, 60, ethers.ZeroAddress]
        ));
        console.log('Pool ID:', poolId);

        // Step 2: Approve tokens
        console.log('\n💰 Step 2: Approving tokens...');
        const amount = ethers.parseEther('0.01');

        const wethContract = new ethers.Contract(WETH, ERC20_ABI, wallet);
        const tusdcContract = new ethers.Contract(TUSDC, ERC20_ABI, wallet);

        const approveTx1 = await wethContract.approve(POOL_MODIFY_LIQUIDITY_TEST, amount);
        await approveTx1.wait();
        console.log('✅ WETH approved');

        const approveTx2 = await tusdcContract.approve(POOL_MODIFY_LIQUIDITY_TEST, amount);
        await approveTx2.wait();
        console.log('✅ TUSDC approved');

        // Step 3: Add liquidity
        console.log('\n🏊 Step 3: Adding liquidity...');
        const poolModify = new ethers.Contract(POOL_MODIFY_LIQUIDITY_TEST, POOL_MODIFY_ABI, wallet);

        const liqTx = await poolModify.modifyLiquidity(
            poolId,
            -887220, // tickLower
            887220,  // tickUpper
            amount,  // liquidityDelta
            '0x',    // hookData
            { gasLimit: 3000000 }
        );
        console.log('Transaction sent:', liqTx.hash);
        const liqReceipt = await liqTx.wait();
        console.log('✅ Liquidity added! Block:', liqReceipt.blockNumber);

        console.log('\n🎉 Pool setup complete!');
        console.log('Pool is now ready for swaps!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.data) {
            console.error('Error data:', error.data);
        }
    }
}

main().catch(console.error);
