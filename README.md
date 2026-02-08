# 🦅 UniSkill: Verifiable AI Agent Protocol

**Bridging Artificial Intelligence and Decentralized Finance through On-Chain Reasoning Proofs.**

UniSkill is a revolutionary protocol built on **Uniswap v4** that enables AI agents to execute trades with cryptographically verifiable reasoning. Every decision made by a UniSkill agent is backed by a Merkle proof of its decision tree and signed by a registered agent identity, ensuring total transparency and accountability in autonomous trading.

---

## 🚀 Sepolia Deployment (v1.0)

The UniSkill protocol is live on the Ethereum Sepolia testnet. Below are the canonical contract and pool identities for the system.

### 📜 Deployed Infrastructure (Our Contracts)
| Contract | Address (Sepolia) |
| :--- | :--- |
| **ProofOfAgentHook** | `0xb79cceaacb13d9d5d75e7d3f1a850ccd14a100c0` |
| **HookFactory** | `0xec5849ee0cf2183c1599e5f87f5da367c84fd438` |

### 🛠️ Uniswap v4 Core (Official)
| Contract | Address (Sepolia) |
| :--- | :--- |
| **PoolManager** | `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` |
| **Universal Router** | `0xf13D190e9117920c703d79B5F33732e10049b115` |
| **Position Manager** | `0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4` |

---

## 🌊 Liquidity Pool
The official UniSkill test pool is active within the Uniswap v4 singleton.

- **Pool Identity (PoolId):** `0x48e9d00a09e91693bcdd84ae9f00f581c294c67`
- **Tokens:** `TestUSDC` / `WETH`
- **Fee Tier:** 0.3% (3000)
- **Tick Spacing:** 60

### 🪙 Tokens
- **TestUSDC:** `0x607c1FD9FD338EC825799A1068551CE19CACBe52`
- **WETH:** `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9`

---

## 🧠 The UniSkill Advantage

### 1. Verifiable Reasoning
Unlike "black box" agents, UniSkill agents submit a `TradeProof` payload with every swap. This includes:
- **Merkle Root:** A commitment to the agent's internal decision tree.
- **Action Hash:** A specific hash of the (tokenIn, tokenOut, amount) to prevent tampering.
- **Cryptographic Signature:** Proves the decision was made by an authorized, registered agent.

### 2. On-Chain Enforcement
The `ProofOfAgentHook` intercepts every swap in the pool and verifies:
- Is the signer a registered `active` agent?
- Does the swap match the action commit in the proof?
- Was the decision reached within the last 60 seconds? (Anti-latency/pre-computation protection).

### 3. Strategy Audit Trail
Every trade emits an `AgentDecisionLogged` event containing a human-readable `reasoning` string alongside the cryptographic roots, enabling retrospection and analytics for LPs and auditors.

---

## 🛠 Developer Quickstart

### Verify an Agent
```bash
npx tsx script/RegisterAgent.ts
```

### Execute a Proof-Backed Swap
```bash
npx tsx src/api/swap/execute.ts
```

---

*Developed for the Hackathon 2026. Empowering the next generation of autonomous on-chain intelligence.*
