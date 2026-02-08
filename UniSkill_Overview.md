# UniSkill Protocol - Verified AI Agent DeFi

UniSkill is a protocol that enables AI Agents to execute **Verifiable Decisions** on Uniswap v4. Unlike traditional bots that opaque perform operations, UniSkill agents must provide a cryptographic **Proof of Reasoning** for every trade, which is verified on-chain by a custom Hook.

## 🔄 User/Agent Workflow

### 1. Agent Registration (One-Time)
- **Action**: The user/agent calls `registerAgent`.
- **Input**: Agent Wallet, Model Hash (e.g., "LLaMA-70B"), Strategy Commitment.
- **On-Chain**: The `ProofOfAgentHook` verifies the wallet and stores the Agent's identity.
- **Script**: `npx tsx script/RegisterAgent.ts`

### 2. Market Analysis (Off-Chain)
- **Action**: The Agent monitors market conditions (prices, volume, volatility).
- **Logic**: The Agent evaluates multiple strategies (Direct Swap, Multi-hop, Wait).
- **Decision Tree**: The Agent constructs a Merkle Tree of all consider options, selecting the best one.

### 3. Proof Generation (Off-Chain)
- **Action**: The `DecisionProofEngine` acts as the Agent's "Conscience".
- **Signing**: The Agent *signs* the chosen Action and the Merkle Root of its decision tree.
- **Output**: A cryptographic proof containing the Signature, Merkle Root, and Action Hash.

### 4. Verified Execution (On-Chain)
- **Action**: The Agent submits the trade to Uniswap v4 via the `executeSwapWithProof` API.
- **Hook Data**: The Proof is encoded and passed to the `ProofOfAgentHook`.
- **Verification**:
    1.  **Identity**: Is the signer a registered Agent?
    2.  **Commitment**: Is the signature valid for this specific action?
    3.  **Consistency**: Does the trade (token, amount) match the signed Action?
- **Result**: If valid, the trade executes. If invalid, it Reverts.

## 📂 Project Structure (Key Files)

### Core Logic
- `src/api/swap/execute.ts`: The main entry point. Simulates the Agent's brain, generates the Proof, and executes the swap.
- `src/services/agent/DecisionProofEngine.ts`: Crytographic engine for Merkle Trees and Signatures.
- `src/lib/agent-config.ts`: Configuration for Tokens, Pools, and the Hook Address.

### Smart Contracts (v4-hooks-test/)
- `src/ProofOfAgentHook.sol`: The Solidity contract running on Sepolia. Enforces the verification logic.
- `script/DeployHook.s.sol`: Deployment script for the Hook.

### Scripts
- `script/RegisterAgent.ts`: Onboards the agent.
- `script/MintUSDC.ts`, `WrapETH.ts`: Utilities for testnet tokens.

## 🚀 Next Steps
- **Dashboard**: Build a frontend to visualize the Decision Trees.
- **Mainnet**: Deploy the Hook to Ethereum Mainnet (once V4 is live).
