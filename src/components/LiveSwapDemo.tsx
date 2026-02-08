'use client';

import { useState } from 'react';

const TOKENS = [
  { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9, icon: '◎' },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, icon: '$' },
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, icon: '₮' },
  { symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6, icon: '🪐' },
];

interface QuoteResult {
  inAmount: string;
  outAmount: string;
  inUsdValue: number;
  outUsdValue: number;
  router: string;
  routePlan: any[];
  priceImpactPct: string;
}

export default function LiveSwapDemo() {
  const [inputToken, setInputToken] = useState(TOKENS[0]);
  const [outputToken, setOutputToken] = useState(TOKENS[1]);
  const [amount, setAmount] = useState('1');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [error, setError] = useState('');

  const getQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setLoading(true);
    setError('');
    setQuote(null);

    try {
      const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, inputToken.decimals));
      
      const res = await fetch(
        `/api/v1/jupiter/quote?inputMint=${inputToken.mint}&outputMint=${outputToken.mint}&amount=${amountInSmallestUnit}`
      );
      
      const data = await res.json();
      
      if (data.success) {
        setQuote(data.quote);
      } else {
        setError(data.error || 'Failed to get quote');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    
    setLoading(false);
  };

  const formatAmount = (amount: string, decimals: number) => {
    const num = parseFloat(amount) / Math.pow(10, decimals);
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  const swapTokens = () => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
    setQuote(null);
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">🔴 Live Swap Quote</h3>
        <span className="text-xs bg-[#14F195]/20 text-[#14F195] px-2 py-1 rounded-full flex items-center gap-1">
          <span className="w-2 h-2 bg-[#14F195] rounded-full animate-pulse" />
          Jupiter Ultra
        </span>
      </div>

      {/* Input Token */}
      <div className="bg-black/50 rounded-xl p-4 mb-2">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>You pay</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setQuote(null); }}
            className="flex-1 bg-transparent text-2xl font-bold outline-none"
            placeholder="0"
            min="0"
            step="0.01"
          />
          <select
            value={inputToken.symbol}
            onChange={(e) => {
              const token = TOKENS.find(t => t.symbol === e.target.value);
              if (token) { setInputToken(token); setQuote(null); }
            }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 font-bold"
          >
            {TOKENS.filter(t => t.symbol !== outputToken.symbol).map(t => (
              <option key={t.symbol} value={t.symbol}>{t.icon} {t.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <button 
          onClick={swapTokens}
          className="bg-gray-800 border border-gray-700 rounded-full p-2 hover:bg-gray-700 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Output Token */}
      <div className="bg-black/50 rounded-xl p-4 mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>You receive</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 text-2xl font-bold">
            {loading ? (
              <span className="animate-pulse text-gray-500">...</span>
            ) : quote ? (
              <span className="text-[#14F195]">
                {formatAmount(quote.outAmount, outputToken.decimals)}
              </span>
            ) : (
              <span className="text-gray-500">0</span>
            )}
          </div>
          <select
            value={outputToken.symbol}
            onChange={(e) => {
              const token = TOKENS.find(t => t.symbol === e.target.value);
              if (token) { setOutputToken(token); setQuote(null); }
            }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 font-bold"
          >
            {TOKENS.filter(t => t.symbol !== inputToken.symbol).map(t => (
              <option key={t.symbol} value={t.symbol}>{t.icon} {t.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quote Button */}
      <button
        onClick={getQuote}
        disabled={loading || !amount || parseFloat(amount) <= 0}
        className="w-full py-4 bg-gradient-to-r from-[#14F195] to-[#0fd884] text-black font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Getting Quote...' : 'Get Real-Time Quote'}
      </button>

      {/* Quote Details */}
      {quote && (
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Rate</span>
            <span className="text-white">
              1 {inputToken.symbol} = {(parseFloat(quote.outAmount) / parseFloat(quote.inAmount) * Math.pow(10, inputToken.decimals - outputToken.decimals)).toFixed(4)} {outputToken.symbol}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>USD Value</span>
            <span className="text-white">${quote.outUsdValue?.toFixed(2) || '—'}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Price Impact</span>
            <span className={parseFloat(quote.priceImpactPct) < 0.01 ? 'text-[#14F195]' : 'text-yellow-400'}>
              {(parseFloat(quote.priceImpactPct) * 100).toFixed(4)}%
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Route</span>
            <span className="text-[#9945FF]">{quote.routePlan?.[0]?.swapInfo?.label || quote.router}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-400 text-sm text-center">
          ❌ {error}
        </div>
      )}

      {/* API Badge */}
      <div className="mt-4 pt-4 border-t border-gray-800 text-center">
        <code className="text-xs text-gray-500 bg-black/50 px-3 py-1 rounded">
          GET /api/v1/jupiter/quote
        </code>
      </div>
    </div>
  );
}
