import 'dotenv/config';
import { ethers } from 'ethers';
import { HOOK_ADDRESS } from '../src/lib/agent-config';
import { getProvider, getWallet } from '../src/lib/ethereum';

const HOOK_ABI = [
    "function registerAgent(bytes32 modelHash, bytes32 strategyCommitment, string calldata agentName) external",
    "function agents(address) external view returns (address, bytes32, bytes32, uint256, bool, uint256, uint256)"
];

async function main() {
    console.log('🤖 Registering Agent on UniSkill Hook...');
    console.log('Hook Address:', HOOK_ADDRESS);

    const provider = getProvider(); // Should be Sepolia
    const agentWallet = getWallet(provider);

    console.log('Agent Wallet:', agentWallet.address);
    const balance = await provider.getBalance(agentWallet.address);
    console.log('Balance:', ethers.formatEther(balance), 'ETH');

    const hookData = new ethers.Contract(HOOK_ADDRESS, HOOK_ABI, agentWallet);

    // Check if already registered
    const agentInfo = await hookData.agents(agentWallet.address);
    console.log('On-chain Agent Info:');
    console.log('  Address:', agentInfo[0]);
    console.log('  IsActive:', agentInfo[4]);
    console.log('  ModelHash:', agentInfo[1]);

    if (agentInfo[4] === true) { // isActive bool
        console.log('✅ Agent already registered matches!');
        return;
    }

    const modelHash = ethers.keccak256(ethers.toUtf8Bytes("LLaMA-3-Caracal-70B"));
    const strategyCommitment = ethers.keccak256(ethers.toUtf8Bytes("Risk-Adjusted-Momentum-Alpha-v1"));
    const agentName = "Caracal Alpha";

    console.log('Registering with:');
    console.log('  Model:', "LLaMA-3-Caracal-70B");
    console.log('  Strategy:', "Risk-Adjusted-Momentum-Alpha-v1");

    const tx = await hookData.registerAgent(modelHash, strategyCommitment, agentName);
    console.log('Tx sent:', tx.hash);

    await tx.wait();
    console.log('✅ Agent Registered Successfully!');
}

main().catch(console.error);
