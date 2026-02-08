---
name: solskill
version: 3.0.0
description: DeFi Skills for AI Agents on Solana - 45+ endpoints - Swaps, Lending, Vaults, LP, Strategy Engine, Backtesting, Risk Scoring, Simulation, Market Data, TVL, Gas, Rebalancing, P&L, Smart Alerts
homepage: https://solskill.ai
metadata: {"category": "defi", "chain": "solana", "api_base": "https://solskill.ai/api/v1"}
---

# SolSkill — DeFi Skills for AI Agents

You have access to 45+ DeFi operations on Solana via the SolSkill API.

## Base URL
```
https://solskill.ai/api/v1
```

## Authentication

Protected endpoints require an API key:

```bash
# Option 1: x-api-key header (recommended)
curl -H "x-api-key: solskill_your_api_key_here" ...

# Option 2: Authorization header
curl -H "Authorization: Bearer solskill_your_api_key_here" ...
```

### Public Endpoints (no auth)
- `GET /jupiter/tokens` — List tokens
- `GET /jupiter/quote` — Swap quote
- `GET /raydium/quote` — Raydium quote
- `GET /raydium/pools` — List pools
- `GET /kamino/markets` — Lending markets
- `GET /kamino/reserves` — Reserves with APY
- `GET /kamino/vaults` — Yield vaults
- `GET /kamino/positions` — User positions
- `GET /wallet/balance` — Wallet balances
- `GET /stats` — Platform statistics
- `GET /health` — Protocol health check
- `GET /risk/score` — Risk assessment
- `GET /yields/best` — Best yield opportunities
- `POST /strategies/recommend` — Strategy recommendations
- `POST /simulate` — Dry-run simulation
- `GET /market/prices` — Real-time token prices
- `POST /strategies/backtest` — Historical strategy backtest
- `GET /tokens/trending` — Trending Solana tokens
- `GET /defi/tvl` — Solana DeFi TVL tracker
- `GET /gas/estimate` — Priority fee & gas estimates
- `GET /wallet/pnl` — Portfolio P&L
- `GET /protocols/compare` — Compare protocol yields
- `POST /wallet/swap-and-deposit` — Composite swap + deposit
- `POST /portfolio/rebalance` — Portfolio rebalance planner

### Protected Endpoints (API key required)
- `POST /jupiter/swap` — Execute swap
- `POST /raydium/swap` — Raydium swap
- `POST /raydium/pools/add-liquidity` — Add liquidity
- `POST /raydium/pools/remove-liquidity` — Remove liquidity
- `POST /kamino/deposit` — Deposit/withdraw
- `POST /kamino/borrow` — Borrow/repay
- `POST /wallet/send` — Send tokens
- `GET /wallet/receive` — Deposit address
- `GET /wallet/transactions` — Transaction history
- `POST /orders` — Limit orders
- `POST /alerts` — Price alerts
- `POST /alerts/smart` — Smart multi-type alerts
- `GET /alerts/smart` — List smart alerts
- `DELETE /alerts/smart/:id` — Delete smart alert

---

## Quick Start: Agent Self-Registration

### 1. Register Your Agent
```bash
curl -X POST https://solskill.ai/api/v1/agents/register \
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
    "api_key": "solskill_...",
    "verified": true
  },
  "important": "SAVE YOUR API KEY!"
}
```

### 2. Store Credentials
```bash
mkdir -p ~/.config/solskill
cat > ~/.config/solskill/credentials.json << 'EOF'
{
  "api_key": "solskill_your_api_key_here",
  "agent_id": "your_agent_id"
}
EOF
chmod 600 ~/.config/solskill/credentials.json
```

### 3. Use in Requests
```bash
API_KEY=$(jq -r .api_key ~/.config/solskill/credentials.json)
curl -H "x-api-key: $API_KEY" https://solskill.ai/api/v1/...
```

---

## Market Prices (NEW v3)

### Get Real-Time Token Prices
```bash
GET /market/prices
GET /market/prices?tokens=SOL,JUP,BONK
```

Returns live prices from Jupiter Price API for top Solana tokens.

Response:
```json
{
  "success": true,
  "prices": {
    "SOL": {"price": 180.52, "symbol": "SOL", "mint": "So111..."},
    "JUP": {"price": 1.23, "symbol": "JUP", "mint": "JUPy..."},
    "BONK": {"price": 0.00003, "symbol": "BONK", "mint": "DezX..."}
  },
  "timestamp": "2026-02-07T..."
}
```

Supported tokens: SOL, USDC, JUP, RAY, JITO, PYTH, BONK, WIF, ORCA, MNDE

---

## Strategy Backtesting (NEW v3)

### Backtest a Strategy
```bash
POST /strategies/backtest
{
  "strategy": "balanced",
  "token": "USDC",
  "amount": 1000,
  "periodDays": 90
}
```

Strategies: `conservative`, `balanced`, `aggressive`, `yield-farming`, `lending`

Response:
```json
{
  "success": true,
  "backtest": {
    "strategy": "balanced",
    "totalReturn": 85.23,
    "finalBalance": 1085.23,
    "apy": 12.8,
    "maxDrawdown": 3.2,
    "sharpeRatio": 1.45,
    "winRate": 62.5,
    "dailyReturns": [0.03, 0.01, -0.02, ...]
  }
}
```

---

## Trending Tokens (NEW v3)

### Get Top Trending Solana Tokens
```bash
GET /tokens/trending
GET /tokens/trending?limit=10
```

Data from DexScreener with Jupiter price enrichment.

Response:
```json
{
  "success": true,
  "trending": [
    {"rank": 1, "tokenAddress": "...", "symbol": "TOKEN", "price": 0.05, "totalAmount": 500}
  ],
  "source": "dexscreener"
}
```

---

## Swap & Deposit (NEW v3)

### Composite: Swap Then Deposit
```bash
POST /wallet/swap-and-deposit
{
  "fromToken": "SOL",
  "toToken": "USDC",
  "amount": 1.5,
  "depositVault": "USDC Lending"
}
```

Returns Jupiter swap quote + Kamino deposit estimate with projected yield.

Response:
```json
{
  "success": true,
  "swapQuote": {"inAmount": "1500000000", "outAmount": "270000000", "priceImpactPct": "0.01"},
  "depositEstimate": {"vault": "USDC Lending", "apy": 6.5, "projectedYield": {"yearly": 17.55}},
  "totalSteps": 2,
  "estimatedFees": {"totalFee": "~0.00001 SOL"}
}
```

---

## DeFi TVL (NEW v3)

### Solana Ecosystem TVL
```bash
GET /defi/tvl
GET /defi/tvl?limit=10&category=Lending|DEX
```

Real-time TVL data from DefiLlama for all Solana protocols.

Response:
```json
{
  "success": true,
  "chain": "Solana",
  "totalTvl": 8500000000,
  "protocols": [
    {"name": "Marinade Finance", "tvl": 1200000000, "tvlChange24h": 2.1, "category": "Liquid Staking"}
  ],
  "categoryBreakdown": {"Lending": 3000000000, "DEX": 2500000000},
  "source": "defillama"
}
```

---

## Gas Estimator (NEW v3)

### Get Fee Estimates
```bash
GET /gas/estimate
```

Live Solana priority fees from RPC with recommended tiers.

Response:
```json
{
  "success": true,
  "gasEstimate": {
    "baseFee": 0.000005,
    "priorityFee": {
      "low": {"microLamports": 1000, "label": "Economy"},
      "medium": {"microLamports": 10000, "label": "Standard"},
      "high": {"microLamports": 100000, "label": "Fast"}
    },
    "currentTps": 3500,
    "recommendedPriority": "medium"
  }
}
```

---

## Portfolio Rebalancer (NEW v3)

### Generate Rebalance Plan
```bash
POST /portfolio/rebalance
{
  "targetAllocation": {"SOL": 50, "USDC": 30, "yield": 20},
  "totalValue": 10000,
  "currentHoldings": {"USDC": 100}
}
```

Returns step-by-step execution plan with swap and deposit instructions.

Response:
```json
{
  "success": true,
  "rebalance": {
    "steps": [
      {"step": 1, "action": "swap", "from": "USDC", "to": "SOL", "amountUsd": 5000, "endpoint": "POST /api/v1/jupiter/swap"},
      {"step": 2, "action": "deposit", "from": "USDC", "to": "Kamino Lending", "amountUsd": 2000, "endpoint": "POST /api/v1/kamino/deposit"}
    ],
    "estimatedCost": {"totalEstimate": "~$0.04"}
  }
}
```

---

## Portfolio P&L (NEW v3)

### Get Profit & Loss
```bash
GET /wallet/pnl
GET /wallet/pnl?wallet=WALLET_ADDRESS
```

Response:
```json
{
  "success": true,
  "pnl": {
    "totalValue": 4250.00,
    "totalCost": 3800.00,
    "pnlUsd": 450.00,
    "pnlPercent": 11.84,
    "byToken": [
      {"token": "SOL", "balance": 5.2, "currentPrice": 180, "pnlUsd": 120, "pnlPercent": 14.5}
    ]
  }
}
```

---

## Protocol Comparison (NEW v3)

### Compare Protocols
```bash
GET /protocols/compare?action=lend&token=USDC
GET /protocols/compare?action=lp&token=SOL&limit=5
```

Actions: `lend`, `deposit`, `lp`, `liquidity`, `vault`

Response:
```json
{
  "success": true,
  "comparison": {
    "protocols": [
      {"name": "Kamino Lend", "apy": 6.5, "tvl": 150000000, "risk": "low", "fees": "0% deposit"},
      {"name": "Marginfi", "apy": 5.8, "tvl": 80000000, "risk": "low", "fees": "0% deposit"}
    ],
    "recommendation": "Kamino Lend offers the best lend yield for USDC at 6.5% APY with low risk."
  }
}
```

---

## Smart Alerts (NEW v3)

### Create Smart Alert
```bash
POST /alerts/smart
{
  "type": "price",
  "condition": {"token": "SOL", "operator": "above", "value": 200},
  "webhook": "https://your-webhook.com/alert"
}
```

Types: `price`, `yield`, `tvl`, `gas`, `health`
Operators: `above`, `below`, `change_pct`, `crosses`

### List Smart Alerts
```bash
GET /alerts/smart
GET /alerts/smart?type=price&status=active
```

### Delete Smart Alert
```bash
DELETE /alerts/smart/:alertId
```

---

## Strategy Engine

### Get Strategy Recommendation
```bash
POST /strategies/recommend
{
  "goal": "maximize yield",
  "risk": "medium",
  "amount": 1000,
  "token": "USDC"
}
```

Response:
```json
{
  "success": true,
  "strategy": {
    "totalEstimatedApy": 12.5,
    "riskScore": 35,
    "allocations": [
      {
        "protocol": "Kamino Vaults",
        "action": "deposit",
        "allocation": 40,
        "amountUsd": 400,
        "estimatedApy": 15.2,
        "riskLevel": "medium",
        "endpoint": "POST /api/v1/kamino/deposit"
      }
    ]
  }
}
```

Risk levels: `low`, `medium`, `high`

---

## Simulation Mode

### Simulate Any Operation
```bash
POST /simulate
{
  "operation": "swap",
  "params": {
    "inputMint": "SOL",
    "outputMint": "USDC",
    "amount": "1000000000",
    "slippageBps": 50
  }
}
```

Supported operations: `swap`, `deposit`, `withdraw`, `add-liquidity`

Response includes:
- Expected output amounts
- Price impact
- Fee breakdown
- Risk assessment
- Endpoint to execute

---

## Risk Score

### Assess Risk for Any Action
```bash
GET /risk/score?protocol=kamino&action=deposit&token=SOL&amount=100
```

Parameters:
- `protocol` — kamino, raydium, jupiter
- `action` — deposit, withdraw, borrow, swap, lp, add-liquidity
- `token` — Token symbol (SOL, USDC, etc.)
- `amount` — Position size

Response:
```json
{
  "success": true,
  "risk": {
    "overallScore": 22,
    "riskLevel": "MODERATE",
    "breakdown": [
      {"category": "Smart Contract", "score": 10, "weight": 35, "detail": "3 audits..."},
      {"category": "Liquidation", "score": 5, "weight": 28, "detail": "Supply-side only..."},
      {"category": "Protocol TVL & Maturity", "score": 10, "weight": 21, "detail": "TVL: $500M+..."},
      {"category": "Historical Performance", "score": 15, "weight": 14, "detail": "No incidents..."}
    ],
    "recommendation": "Acceptable risk level for most portfolios."
  }
}
```

---

## Health Monitor

### Check Platform & Protocol Health
```bash
GET /health
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "solana": {
    "network": "mainnet-beta",
    "tps": 3500,
    "rpcLatencyMs": 85,
    "medianPriorityFeeMicroLamports": 1000
  },
  "protocols": [
    {"name": "Jupiter", "status": "operational", "responseTimeMs": 280},
    {"name": "Kamino", "status": "operational", "responseTimeMs": 150},
    {"name": "Raydium", "status": "operational", "responseTimeMs": 200},
    {"name": "DefiLlama", "status": "operational", "responseTimeMs": 120}
  ],
  "solskill": {
    "version": "3.0.0",
    "endpoints": 45,
    "uptime": "99.9%"
  }
}
```

---

## Yield Optimizer

### Find Best Yields Across All Protocols
```bash
GET /yields/best?token=USDC&minApy=5&maxRisk=medium&limit=10
```

Parameters:
- `token` — Filter by token symbol
- `minApy` — Minimum APY threshold
- `maxRisk` — Maximum risk level (low, medium, high)
- `limit` — Max results (default 20, max 50)

Response:
```json
{
  "success": true,
  "yields": [
    {
      "protocol": "kamino-lend",
      "type": "lending",
      "token": "USDC",
      "apy": 8.5,
      "tvlUsd": 150000000,
      "riskLevel": "low",
      "endpoint": "POST /api/v1/kamino/deposit"
    }
  ],
  "source": "defillama"
}
```

---

## Token Swaps (Jupiter)

### List Tokens
```bash
GET /jupiter/tokens
GET /jupiter/tokens?all=true  # All verified tokens
```

### Get Quote
```bash
GET /jupiter/quote?inputMint=SOL_MINT&outputMint=USDC_MINT&amount=LAMPORTS&slippageBps=50
```

### Execute Swap (Protected)
```bash
POST /jupiter/swap
{
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": "1000000000",
  "userPublicKey": "YOUR_WALLET",
  "slippageBps": 50
}
```

---

## Token Swaps (Raydium)

### Get Quote
```bash
GET /raydium/quote?inputMint=SOL_MINT&outputMint=USDC_MINT&amount=LAMPORTS
```

### Execute Swap (Protected)
```bash
POST /raydium/swap
{
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": "1000000000",
  "userPublicKey": "YOUR_WALLET",
  "slippageBps": 50
}
```

---

## Liquidity Pools (Raydium)

### List Pools
```bash
GET /raydium/pools?token=SOL&minTvl=1000000&minApy=10
```

### Get Pool Details
```bash
GET /raydium/pools/:poolId
```

### Add Liquidity (Protected)
```bash
POST /raydium/pools/add-liquidity
{
  "poolId": "POOL_ADDRESS",
  "wallet": "YOUR_WALLET",
  "amountA": "1000000000",
  "slippage": 0.5
}
```

### Remove Liquidity (Protected)
```bash
POST /raydium/pools/remove-liquidity
{
  "poolId": "POOL_ADDRESS",
  "wallet": "YOUR_WALLET",
  "lpAmount": "1500000000",
  "slippage": 0.5
}
```

---

## Lending & Vaults (Kamino)

### List Markets
```bash
GET /kamino/markets
```

### Get Reserves (with APY)
```bash
GET /kamino/reserves?token=SOL
```

### List Vaults
```bash
GET /kamino/vaults?token=USDC&minApy=10
```

### Get Positions
```bash
GET /kamino/positions?wallet=WALLET_ADDRESS
```

### Deposit/Withdraw (Protected)
```bash
POST /kamino/deposit
{
  "wallet": "WALLET_ADDRESS",
  "reserve": "RESERVE_ADDRESS",
  "amount": "1000000",
  "action": "deposit"
}
```

### Borrow/Repay (Protected)
```bash
POST /kamino/borrow
{
  "wallet": "WALLET_ADDRESS",
  "reserve": "RESERVE_ADDRESS",
  "amount": "1000000",
  "action": "borrow"
}
```

---

## Wallet Operations

### Check Balance
```bash
GET /wallet/balance?wallet=WALLET_ADDRESS
```

### Send Tokens (Protected)
```bash
POST /wallet/send
{
  "to": "RECIPIENT_ADDRESS",
  "amount": 0.5,
  "mint": "TOKEN_MINT"
}
```

### Get Receive Address (Protected)
```bash
GET /wallet/receive
```

### Transaction History (Protected)
```bash
GET /wallet/transactions?limit=10
```

---

## Limit Orders

### Create Order (Protected)
```bash
POST /orders
{
  "inputMint": "So111...",
  "outputMint": "EPjF...",
  "inAmount": "1000000000",
  "outAmount": "150000000"
}
```

### List Orders (Protected)
```bash
GET /orders?status=open
```

### Cancel Order (Protected)
```bash
DELETE /orders/:orderId
```

---

## Price Alerts

### Create Alert (Protected)
```bash
POST /alerts
{
  "tokenMint": "So111...",
  "tokenSymbol": "SOL",
  "condition": "above",
  "targetPrice": 200,
  "webhookUrl": "https://..."
}
```

### List Alerts (Protected)
```bash
GET /alerts?status=active
```

### Delete Alert (Protected)
```bash
DELETE /alerts/:alertId
```

---

## Common Token Mints

| Token | Mint Address |
|-------|--------------|
| SOL | So11111111111111111111111111111111111111112 |
| USDC | EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v |
| USDT | Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB |
| JUP | JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN |
| KMNO | KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS |
| RAY | 4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R |
| JITO | jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL |
| PYTH | HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3 |
| BONK | DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 |
| WIF | EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm |
| ORCA | orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE |
| MNDE | MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey |

---

## Workflow Examples

### Smart Yield Strategy
```bash
# 1. Check market prices
curl "https://solskill.ai/api/v1/market/prices?tokens=SOL,USDC,JUP"

# 2. Get personalized strategy
curl -X POST https://solskill.ai/api/v1/strategies/recommend \
  -d '{"goal":"maximize yield","risk":"medium","amount":1000,"token":"USDC"}'

# 3. Backtest the strategy
curl -X POST https://solskill.ai/api/v1/strategies/backtest \
  -d '{"strategy":"balanced","token":"USDC","amount":1000,"periodDays":90}'

# 4. Compare protocols
curl "https://solskill.ai/api/v1/protocols/compare?action=lend&token=USDC"

# 5. Simulate before executing
curl -X POST https://solskill.ai/api/v1/simulate \
  -d '{"operation":"deposit","params":{"token":"USDC","amount":400}}'

# 6. Execute (with API key)
curl -X POST https://solskill.ai/api/v1/kamino/deposit \
  -H "x-api-key: $API_KEY" \
  -d '{"reserve":"...","amount":"400000000","action":"deposit"}'
```

### Swap & Deposit in One Flow
```bash
# 1. Get swap + deposit quote
curl -X POST https://solskill.ai/api/v1/wallet/swap-and-deposit \
  -d '{"fromToken":"SOL","toToken":"USDC","amount":1.5,"depositVault":"USDC Lending"}'

# 2. Check gas fees
curl "https://solskill.ai/api/v1/gas/estimate"

# 3. Execute steps with API key
```

### Portfolio Management
```bash
# 1. Check P&L
curl "https://solskill.ai/api/v1/wallet/pnl?wallet=YOUR_WALLET"

# 2. Plan rebalance
curl -X POST https://solskill.ai/api/v1/portfolio/rebalance \
  -d '{"targetAllocation":{"SOL":50,"USDC":30,"yield":20},"totalValue":10000}'

# 3. Set smart alerts
curl -X POST https://solskill.ai/api/v1/alerts/smart \
  -H "x-api-key: $API_KEY" \
  -d '{"type":"price","condition":{"token":"SOL","operator":"above","value":200}}'

# 4. Track DeFi TVL
curl "https://solskill.ai/api/v1/defi/tvl?category=Lending&limit=10"
```

### Find Best Yields
```bash
# 1. Get best opportunities
curl "https://solskill.ai/api/v1/yields/best?token=USDC&minApy=5&maxRisk=medium"

# 2. Check health of protocols
curl "https://solskill.ai/api/v1/health"

# 3. Discover trending tokens
curl "https://solskill.ai/api/v1/tokens/trending?limit=10"

# 4. Assess risk
curl "https://solskill.ai/api/v1/risk/score?protocol=kamino&action=deposit&token=USDC&amount=1000"
```

---

## Error Handling

All endpoints return:
```json
{
  "success": false,
  "error": "Description"
}
```

Status codes:
- `400` — Invalid parameters
- `401` — Invalid API key
- `429` — Rate limited (wait 60s)
- `500` — Server error
- `502` — External API error
- `504` — External timeout (retry)

---

## Rate Limits

- 100 requests/minute per API key
- Rate limit headers in responses
- 429 = wait 60 seconds

---

## Support

- Docs: https://solskill.ai
- Dashboard: https://solskill.ai/dashboard
- GitHub: https://github.com/caiovicentino/solskill
