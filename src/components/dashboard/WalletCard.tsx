'use client';

import { useState, useEffect, useCallback } from 'react';

// Types
interface Token {
  mint: string;
  amount: string;
  decimals: number;
  symbol?: string;
  name?: string;
  logo?: string;
  usdValue?: number;
  price?: number;
}

interface WalletBalance {
  success: boolean;
  wallet: string;
  sol: string;
  solLamports: string;
  tokens: Token[];
  tokenCount: number;
  error?: string;
}

interface TokenMetadata {
  [mint: string]: {
    symbol: string;
    name: string;
    logo?: string;
  };
}

interface WalletCardProps {
  walletAddress: string;
  className?: string;
}

// Well-known token metadata (fallback for common tokens)
const KNOWN_TOKENS: TokenMetadata = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg' },
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Wrapped SOL', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', name: 'Marinade Staked SOL', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png' },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', name: 'Bonk', logo: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I' },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', name: 'Jupiter', logo: 'https://static.jup.ag/jup/icon.png' },
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': { symbol: 'ETH', name: 'Ether (Wormhole)', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/logo.png' },
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': { symbol: 'PYTH', name: 'Pyth Network', logo: 'https://pyth.network/token.svg' },
  'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a': { symbol: 'RLB', name: 'Rollbit Coin', logo: 'https://arweave.net/Hp5lxHh4AKC-fUTnEcJKcWGFEjEH2R-VVxXv8TQdLcs' },
  'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4': { symbol: 'MYRO', name: 'Myro', logo: 'https://arweave.net/4rRiPWrGN5eGU8Dks3tR9mXMLj-JjnPQWm5H7Z5D4R4' },
};

// SOL Mint address for Jupiter API
const SOL_MINT = 'So11111111111111111111111111111111111111112';

export default function WalletCard({ walletAddress, className = '' }: WalletCardProps) {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [solPrice, setSolPrice] = useState<number>(0);
  const [tokenPrices, setTokenPrices] = useState<{ [mint: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch SOL and token prices from Jupiter
  const fetchPrices = useCallback(async (mints: string[]) => {
    try {
      // Always include SOL
      const allMints = [SOL_MINT, ...mints.filter(m => m !== SOL_MINT)];
      const mintIds = allMints.join(',');
      
      const response = await fetch(`https://api.jup.ag/price/v2?ids=${mintIds}`);
      if (!response.ok) throw new Error('Failed to fetch prices');
      
      const data = await response.json();
      
      // Extract SOL price
      if (data.data?.[SOL_MINT]?.price) {
        setSolPrice(parseFloat(data.data[SOL_MINT].price));
      }
      
      // Extract all token prices
      const prices: { [mint: string]: number } = {};
      for (const mint of allMints) {
        if (data.data?.[mint]?.price) {
          prices[mint] = parseFloat(data.data[mint].price);
        }
      }
      setTokenPrices(prices);
    } catch (err) {
      console.error('Error fetching prices:', err);
    }
  }, []);

  // Fetch wallet balance
  const fetchBalance = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`/api/v1/wallet/balance?wallet=${walletAddress}`);
      const data: WalletBalance = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch balance');
      }

      setBalance(data);
      setLastUpdated(new Date());

      // Fetch prices for all tokens
      const mints = data.tokens.map(t => t.mint);
      await fetchPrices(mints);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wallet balance');
      console.error('Balance fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [walletAddress, fetchPrices]);

  // Initial fetch and auto-refresh every 30s
  useEffect(() => {
    fetchBalance();
    
    const interval = setInterval(() => {
      fetchBalance(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchBalance]);

  // Calculate USD values for tokens
  const getEnrichedTokens = useCallback((): Token[] => {
    if (!balance) return [];

    return balance.tokens
      .map(token => {
        const metadata = KNOWN_TOKENS[token.mint];
        const price = tokenPrices[token.mint] || 0;
        const amount = parseFloat(token.amount);
        const usdValue = amount * price;

        return {
          ...token,
          symbol: metadata?.symbol || token.mint.slice(0, 4) + '...',
          name: metadata?.name || 'Unknown Token',
          logo: metadata?.logo,
          price,
          usdValue,
        };
      })
      .filter(t => parseFloat(t.amount) > 0)
      .sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0));
  }, [balance, tokenPrices]);

  // Calculate totals
  const solBalance = balance ? parseFloat(balance.sol) : 0;
  const solUsdValue = solBalance * solPrice;
  const enrichedTokens = getEnrichedTokens();
  const topTokens = enrichedTokens.slice(0, 5);
  const tokensTotalUsd = enrichedTokens.reduce((sum, t) => sum + (t.usdValue || 0), 0);
  const totalPortfolioValue = solUsdValue + tokensTotalUsd;

  // Format currency
  const formatUsd = (value: number) => {
    if (value < 0.01) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format token amount
  const formatAmount = (amount: string, decimals: number) => {
    const num = parseFloat(amount);
    if (num < 0.0001) return '<0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
  };

  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  // Loading state
  if (loading && !balance) {
    return (
      <div className={`bg-gray-900/50 border border-gray-800 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-800 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-800 rounded w-full"></div>
            <div className="h-4 bg-gray-800 rounded w-5/6"></div>
            <div className="h-4 bg-gray-800 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !balance) {
    return (
      <div className={`bg-gray-900/50 border border-red-800 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-red-400">⚠️ Wallet Error</h3>
          <button
            onClick={() => fetchBalance()}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
          >
            Retry
          </button>
        </div>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👛</span>
          <h3 className="text-lg font-bold">Wallet Balance</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">
            {formatLastUpdated()}
          </span>
          <button
            onClick={() => fetchBalance(true)}
            disabled={refreshing}
            className={`p-2 rounded-lg transition ${
              refreshing 
                ? 'bg-gray-800 cursor-not-allowed' 
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
            title="Refresh"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Total Portfolio Value */}
      <div className="mb-6">
        <p className="text-gray-400 text-sm mb-1">Total Portfolio Value</p>
        <p className="text-3xl font-bold text-[#14F195]">
          {formatUsd(totalPortfolioValue)}
        </p>
      </div>

      {/* SOL Balance */}
      <div className="bg-black/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-lg">◎</span>
            </div>
            <div>
              <p className="font-semibold">SOL</p>
              <p className="text-gray-400 text-sm">Solana</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">{solBalance.toFixed(4)} SOL</p>
            <p className="text-[#14F195] text-sm">{formatUsd(solUsdValue)}</p>
          </div>
        </div>
        {solPrice > 0 && (
          <p className="text-gray-500 text-xs mt-2">
            1 SOL = {formatUsd(solPrice)}
          </p>
        )}
      </div>

      {/* Top 5 Tokens */}
      {topTokens.length > 0 && (
        <div>
          <p className="text-gray-400 text-sm mb-3">
            Top Tokens ({balance?.tokenCount || 0} total)
          </p>
          <div className="space-y-2">
            {topTokens.map((token) => (
              <div
                key={token.mint}
                className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg hover:bg-black/50 transition"
              >
                <div className="flex items-center gap-3">
                  {token.logo ? (
                    <img
                      src={token.logo}
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-xs">
                        {token.symbol?.slice(0, 2) || '??'}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{token.symbol}</p>
                    <p className="text-gray-500 text-xs truncate max-w-[100px]">
                      {token.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {formatAmount(token.amount, token.decimals)}
                  </p>
                  <p className="text-[#14F195] text-xs">
                    {token.usdValue && token.usdValue > 0.01
                      ? formatUsd(token.usdValue)
                      : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No tokens message */}
      {topTokens.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No tokens found</p>
        </div>
      )}

      {/* Wallet address */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <p className="text-gray-500 text-xs break-all font-mono">
          {walletAddress}
        </p>
      </div>
    </div>
  );
}
