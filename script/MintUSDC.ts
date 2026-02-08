
import { ethers } from 'ethers';
import { TEST_USDC_ADDRESS } from '../src/lib/uniswap-v4';
import { AGENT_CONFIG } from '../src/lib/agent-config';
import * as dotenv from 'dotenv';
dotenv.config();

const MINT_ABI = [
    'function mint(address to, uint256 amount) external',
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)'
];

async function main() {
    console.log('🔄 Minting TestUSDC...');

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error('PRIVATE_KEY not found');

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`👨‍💼 Wallet: ${wallet.address}`);

    const usdc = new ethers.Contract(TEST_USDC_ADDRESS, MINT_ABI, wallet);
    const balance = await usdc.balanceOf(wallet.address);
    const decimals = await usdc.decimals();
    console.log(`💵 Current Balance: ${ethers.formatUnits(balance, decimals)} USDC`);

    const amountToMint = ethers.parseUnits("1000", decimals);

    console.log(`🎁 Minting 1000 USDC...`);
    const tx = await usdc.mint(wallet.address, amountToMint);
    console.log(`Tx sent: ${tx.hash}`);
    await tx.wait();
    console.log('✅ Minted successfully!');

    const newBalance = await usdc.balanceOf(wallet.address);
    console.log(`💵 New Balance: ${ethers.formatUnits(newBalance, decimals)} USDC`);
}

main();
