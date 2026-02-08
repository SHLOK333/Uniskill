import 'dotenv/config';
import { ethers } from 'ethers';
import { TOKENS, SWAP_ROUTER } from '../src/lib/agent-config';
import { getProvider, getWallet } from '../src/lib/ethereum';

const ERC20_ABI = [
    'function approve(address spender, uint256 amount) public returns (bool)',
    'function allowance(address owner, address spender) public view returns (uint256)',
    'function symbol() view returns (string)'
];

async function main() {
    console.log('📝 Approving SwapRouter...');
    console.log(`Router: ${SWAP_ROUTER}`);

    const provider = getProvider();
    const wallet = getWallet(provider);
    console.log(`Agent: ${wallet.address}`);

    const tokens = [TOKENS.USDC, TOKENS.WETH];

    for (const tokenAddr of tokens) {
        const token = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);
        const symbol = await token.symbol();
        console.log(`Approving ${symbol} (${tokenAddr})...`);

        const tx = await token.approve(SWAP_ROUTER, ethers.MaxUint256);
        console.log(`Tx sent: ${tx.hash}`);
        await tx.wait();
        console.log(`✅ ${symbol} Approved.`);
    }
}

main().catch(console.error);
