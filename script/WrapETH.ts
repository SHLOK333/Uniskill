
import { ethers } from 'ethers';
import { WETH_ADDRESS } from '../src/lib/uniswap-v4';
import { AGENT_CONFIG } from '../src/lib/agent-config';
import * as dotenv from 'dotenv';
dotenv.config();

const WETH_ABI = [
    'function deposit() public payable',
    'function balanceOf(address) view returns (uint256)',
    'function approve(address, uint256) returns (bool)'
];

async function main() {
    console.log('🔄 Wrapping ETH to WETH...');

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error('PRIVATE_KEY not found');

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`👨‍💼 Wallet: ${wallet.address}`);

    const ethBalance = await provider.getBalance(wallet.address);
    console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

    const weth = new ethers.Contract(WETH_ADDRESS, WETH_ABI, wallet);
    const wethBalance = await weth.balanceOf(wallet.address);
    console.log(`💰 WETH Balance: ${ethers.formatEther(wethBalance)} WETH`);

    // Wrap 0.05 ETH if we have enough
    const amountToWrap = ethers.parseEther("0.05");

    if (ethBalance > amountToWrap) {
        console.log(`🎁 Wrapping 0.05 ETH...`);
        const tx = await weth.deposit({ value: amountToWrap });
        console.log(`Tx sent: ${tx.hash}`);
        await tx.wait();
        console.log('✅ Wrapped successfully!');
    } else {
        console.log('⚠️ Insufficient ETH to wrap (need > 0.05 ETH).');
    }
}

main();
