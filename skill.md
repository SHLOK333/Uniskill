---
name: uniskill
version: 1.0.0
description: DeFi Skills for AI Agents on Ethereum/Uniswap v4 - Swaps, Liquidity, Portfolio Management
homepage: https://uniskill.ai
metadata: {"category": "defi", "chain": "ethereum", "network": "sepolia", "api_base": "https://api.uniskill.ai/api/v1"}
---

# UniSkill — Uniswap v4 Skills for AI Agents

You have access to DeFi operations on Ethereum Sepolia testnet via the UniSkill API.

## Base URL
```
https://api.uniskill.ai/api/v1
```

## Authentication

Protected endpoints require an API key:

```bash
# Option 1: x-api-key header (recommended)
curl -H "x-api-key: uniskill_your_api_key_here" ...

# Option 2: Authorization header
curl -H "Authorization: Bearer uniskill_your_api_key_here" ...
```

### Public Endpoints (no auth)
- `GET /swap/quote` — Get swap quote
- `GET /pools/search` — Find pools by token pair
- `GET /wallet/balance` — Check wallet balances

### Protected Endpoints (API key required)
- `POST /swap/execute` — Execute token swap
- `GET /liquidity/positions` — Get LP positions
- `GET /portfolio` — Complete portfolio view

---

## Quick Start: Agent Self-Registration

### 1. Register Your Agent
```bash
curl -X POST https://api.uniskill.ai/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "YourAgentName"}'
```

Response:
```json
{
  "success": true,
  "agent": {
    "id": "uuid",
    "name": "YourAgentName",
    "wallet": "0x...",
    "api_key": "uniskill_...",
    "verified": true
  },
  "network": "Sepolia Testnet",
  "explorerUrl": "https://sepolia.etherscan.io/address/0x...",
  "important": "SAVE YOUR API KEY!"
}
```

### 2. Fund Your Wallet
Get Sepolia ETH from faucet: https://sepoliafaucet.com/

### 3. Start Trading!

```bash
# Get a swap quote
curl "https://api.uniskill.ai/api/v1/swap/quote?inputToken=WETH&outputToken=USDC&amount=0.1"

# Check your portfolio
curl -H "x-api-key: uniskill_..." https://api.uniskill.ai/api/v1/portfolio
```

---

## Available Functions

### Swaps

**Get Quote**
```bash
GET /swap/quote?inputToken=WETH&outputToken=USDC&amount=0.1&fee=3000
```

Parameters:
- `inputToken` — Token symbol or address (WETH, USDC, etc.)
- `outputToken` — Token symbol or address
- `amount` — Amount in human-readable format
- `fee` — Optional fee tier (500, 3000, 10000)

Response:
```json
{
  "success": true,
  "quote": {
    "inputAmount": "0.1",
    "outputAmount": "200.5",
    "priceImpact": "0.01",
    "gasEstimate": "150000",
    "route": ["0x...", "0x..."]
  }
}
```

**Execute Swap** (Protected)
```bash
POST /swap/execute
{
  "inputToken": "WETH",
  "outputToken": "USDC",
  "amount": "0.1",
  "slippageBps": 50
}
```

---

### Liquidity Management

**Get Positions** (Protected)
```bash
GET /liquidity/positions
```

Returns all LP positions for your agent wallet.

Response:
```json
{
  "success": true,
  "positions": [
    {
      "tokenId": "123",
      "token0": "0x...",
      "token1": "0x...",
      "fee": 3000,
      "feeTier": "0.3%",
      "liquidity": "1000000",
      "tokensOwed0": "100",
      "tokensOwed1": "200"
    }
  ]
}
```

---

### Pool Operations

**Search Pools**
```bash
GET /pools/search?token0=WETH&token1=USDC
```

Finds all Uniswap v4 pools for a token pair across different fee tiers.

Response:
```json
{
  "success": true,
  "pools": [
    {
      "token0": "0x...",
      "token1": "0x...",
      "fee": 3000,
      "feeTier": "0.3%",
      "liquidity": "5000000",
      "tick": 12345
    }
  ]
}
```

---

### Portfolio

**Get Complete Portfolio** (Protected)
```bash
GET /portfolio
```

Returns ETH balance, token balances, and LP positions.

Response:
```json
{
  "success": true,
  "agent": {
    "id": "agent_...",
    "name": "MyAgent",
    "wallet": "0x..."
  },
  "portfolio": {
    "eth": {
      "balance": "1.5",
      "symbol": "ETH"
    },
    "tokens": [
      {
        "symbol": "USDC",
        "address": "0x...",
        "balance": "500.0"
      }
    ],
    "liquidityPositions": [...]
  }
}
```

---

### Wallet Operations

**Check Balance**
```bash
GET /wallet/balance?wallet=0x...
```

Returns ETH and token balances for any wallet.

---

## Common Token Addresses (Sepolia)

| Token | Address |
|-------|---------|
| WETH | 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9 |
| USDC | 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 |
| USDT | 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0 |
| DAI | 0x68194a729C2450ad26072b3D33ADaCbcef39D574 |

---

## Workflow Examples

### Simple Swap
```bash
# 1. Get quote
curl "https://api.uniskill.ai/api/v1/swap/quote?inputToken=WETH&outputToken=USDC&amount=0.1"

# 2. Execute swap (requires API key)
curl -X POST https://api.uniskill.ai/api/v1/swap/execute \
  -H "x-api-key: uniskill_..." \
  -H "Content-Type: application/json" \
  -d '{"inputToken":"WETH","outputToken":"USDC","amount":"0.1","slippageBps":50}'
```

### Check Portfolio
```bash
curl -H "x-api-key: uniskill_..." https://api.uniskill.ai/api/v1/portfolio
```

### Find Best Pool
```bash
curl "https://api.uniskill.ai/api/v1/pools/search?token0=WETH&token1=USDC"
```

---

## Natural Language Commands

AI agents can use natural language to interact:

- "swap 0.1 ETH for USDC" → `POST /swap/execute`
- "get quote for 100 USDC to WETH" → `GET /swap/quote`
- "show my portfolio" → `GET /portfolio`
- "what are my liquidity positions?" → `GET /liquidity/positions`
- "find WETH/USDC pools" → `GET /pools/search`
- "check balance of 0x..." → `GET /wallet/balance`

---

## Network Information

- **Network**: Ethereum Sepolia Testnet
- **Chain ID**: 11155111
- **Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://sepoliafaucet.com

---

## Uniswap v4 Contracts (Sepolia)

- **PoolManager**: 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543
- **Universal Router**: 0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b
- **Position Manager**: 0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4
- **Quoter**: 0x61b3f2011a92d183c7dbadbda940a7555ccf9227

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400` — Bad request (missing/invalid parameters)
- `401` — Unauthorized (invalid/missing API key)
- `404` — Not found
- `500` — Server error

---

## Rate Limits

- **Public endpoints**: 100 requests/minute per IP
- **Protected endpoints**: 100 requests/minute per API key
- **Transaction endpoints**: 10 transactions/hour per wallet (safety limit)

---

## Security

- Each agent has its own self-custodial Ethereum wallet
- Private keys are encrypted with AES-256-GCM
- API keys provide full access to agent wallets
- All transactions are logged with Etherscan links
- Spending limits enforced per agent

---

## Support

For issues or questions:
- GitHub: https://github.com/yourusername/uniskill
- Documentation: https://docs.uniskill.ai
- Explorer: https://sepolia.etherscan.io
