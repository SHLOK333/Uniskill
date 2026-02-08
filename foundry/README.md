# 🚀 Foundry Deployment Guide

## Quick Start (3 Commands!)

### 1. Deploy Token & Initialize Pool
```bash
cd foundry
forge script script/DeployAndSetup.s.sol --rpc-url sepolia --broadcast -vvvv
```

This will:
- ✅ Deploy TestUSDC token
- ✅ Wrap 0.01 ETH to WETH
- ✅ Initialize Uniswap v4 pool (WETH/TUSDC)

### 2. Add Liquidity
```bash
# Set the token address from step 1
export TEST_TOKEN_ADDRESS=0xYOUR_TOKEN_ADDRESS

forge script script/AddLiquidity.s.sol --rpc-url sepolia --broadcast -vvvv
```

This will:
- ✅ Approve WETH and TUSDC
- ✅ Add liquidity to the pool
- ✅ Make pool ready for swaps

### 3. Test Swap
```bash
curl -X POST http://localhost:3001/api/v1/swap/execute \
  -H "Content-Type: application/json" \
  -H "x-api-key: uniskill_3c6564e39f0649ee9826225403c97cd8" \
  -d '{
    "inputToken": "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
    "outputToken": "YOUR_TOKEN_ADDRESS",
    "amount": "0.001",
    "slippageBps": 500
  }'
```

---

## Environment Setup

Make sure your `.env` file has:
```bash
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY (optional, for verification)
```

---

## What Each Script Does

### DeployAndSetup.s.sol
1. Deploys TestUSDC token (1M supply)
2. Wraps 0.01 ETH to WETH
3. Creates PoolKey (sorted tokens, 0.3% fee, no hooks)
4. Initializes pool via PoolManager
5. Logs pool ID and addresses

### AddLiquidity.s.sol
1. Approves WETH and TestUSDC for PoolModifyLiquidityTest
2. Calculates pool ID
3. Adds full-range liquidity (-887220 to 887220)
4. Logs deltas

---

## Troubleshooting

### "Insufficient balance"
- Make sure you have at least 0.05 ETH on Sepolia
- Check: `cast balance YOUR_ADDRESS --rpc-url sepolia`

### "Pool already initialized"
- Pool might already exist for this token pair
- Check pool on Etherscan or try different tokens

### "Transaction reverted"
- Check gas limit: add `--gas-limit 3000000`
- Increase verbosity: `-vvvv` to see detailed logs

---

## Verify Contracts (Optional)

```bash
forge verify-contract \
  --chain-id 11155111 \
  --compiler-version 0.8.20 \
  YOUR_TOKEN_ADDRESS \
  src/TestUSDC.sol:TestUSDC
```

---

## Total Time: ~5 minutes

- Deploy: 2 min
- Add Liquidity: 2 min
- Test Swap: 1 min

**Much faster than manual Remix approach!** 🎉
