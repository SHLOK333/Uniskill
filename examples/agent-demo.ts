/**
 * SolSkill Agent Demo
 * 
 * This example shows how an AI agent can use SolSkill to:
 * 1. Get market data
 * 2. Find yield opportunities
 * 3. Execute trades via Jupiter
 * 
 * Run: npx ts-node examples/agent-demo.ts
 */

const SOLSKILL_API = 'https://solskill.ai/api/v1';

interface SwapQuote {
  success: boolean;
  quote: {
    inAmount: string;
    outAmount: string;
    outUsdValue: number;
    priceImpactPct: string;
  };
}

interface VaultInfo {
  name: string;
  apy: number;
  tvlUsd: number;
  tokenA: { symbol: string };
  tokenB: { symbol: string };
}

interface MarketInfo {
  symbol: string;
  supplyApy: number;
  borrowApy: number;
}

class SolSkillAgent {
  private apiKey?: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  private async fetch(endpoint: string, options?: RequestInit) {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    const res = await fetch(`${SOLSKILL_API}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options?.headers },
    });

    return res.json();
  }

  // === Market Data ===
  
  async getSwapQuote(inputMint: string, outputMint: string, amount: string): Promise<SwapQuote> {
    return this.fetch(`/jupiter/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}`);
  }

  async getYieldVaults(token?: string): Promise<{ vaults: VaultInfo[] }> {
    const params = token ? `?token=${token}` : '';
    return this.fetch(`/kamino/vaults${params}`);
  }

  async getLendingMarkets(): Promise<{ markets: MarketInfo[] }> {
    return this.fetch('/kamino/markets');
  }

  // === Trading (requires API key) ===
  
  async executeSwap(inputMint: string, outputMint: string, amount: string, slippageBps = 50) {
    if (!this.apiKey) throw new Error('API key required for trading');
    
    return this.fetch('/jupiter/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputMint, outputMint, amount, slippageBps }),
    });
  }

  // === Yield Strategies ===
  
  async findBestYield(token: string): Promise<{ strategy: string; apy: number; action: string }> {
    // Check vaults
    const { vaults } = await this.getYieldVaults(token);
    
    // Check lending
    const { markets } = await this.getLendingMarkets();
    const market = markets.find((m: MarketInfo) => m.symbol === token);
    
    let bestStrategy = { strategy: 'hold', apy: 0, action: 'No yield opportunities found' };
    
    // Compare vault APY
    if (vaults.length > 0 && vaults[0].apy > bestStrategy.apy) {
      bestStrategy = {
        strategy: 'vault',
        apy: vaults[0].apy,
        action: `Deposit to ${vaults[0].name} vault for ${vaults[0].apy}% APY`,
      };
    }
    
    // Compare lending APY
    if (market && market.supplyApy > bestStrategy.apy) {
      bestStrategy = {
        strategy: 'lend',
        apy: market.supplyApy,
        action: `Supply ${token} to Kamino lending for ${market.supplyApy}% APY`,
      };
    }
    
    return bestStrategy;
  }
}

// === Demo Execution ===

async function main() {
  console.log('🤖 SolSkill Agent Demo\n');
  console.log('='.repeat(50));
  
  const agent = new SolSkillAgent();
  
  // 1. Get swap quote
  console.log('\n📊 1. Getting SOL → USDC swap quote...\n');
  
  const SOL = 'So11111111111111111111111111111111111111112';
  const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  const ONE_SOL = '1000000000'; // 1 SOL in lamports
  
  const quote = await agent.getSwapQuote(SOL, USDC, ONE_SOL);
  
  if (quote.success) {
    const outAmount = parseInt(quote.quote.outAmount) / 1e6;
    console.log(`   1 SOL = ${outAmount.toFixed(2)} USDC`);
    console.log(`   USD Value: $${quote.quote.outUsdValue.toFixed(2)}`);
    console.log(`   Price Impact: ${(parseFloat(quote.quote.priceImpactPct) * 100).toFixed(4)}%`);
  }
  
  // 2. Find yield opportunities
  console.log('\n💰 2. Finding best yield for SOL...\n');
  
  const bestYield = await agent.findBestYield('SOL');
  console.log(`   Strategy: ${bestYield.strategy}`);
  console.log(`   APY: ${bestYield.apy.toFixed(2)}%`);
  console.log(`   Action: ${bestYield.action}`);
  
  // 3. Check lending markets
  console.log('\n🏦 3. Lending market rates...\n');
  
  const { markets } = await agent.getLendingMarkets();
  markets.slice(0, 3).forEach((m: MarketInfo) => {
    console.log(`   ${m.symbol}: Supply ${m.supplyApy?.toFixed(2)}% | Borrow ${m.borrowApy?.toFixed(2)}%`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Demo complete! The agent can now make informed DeFi decisions.');
  console.log('\nTo execute trades, register at https://solskill.ai and get an API key.\n');
}

main().catch(console.error);
