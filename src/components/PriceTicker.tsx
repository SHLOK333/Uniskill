'use client';

import { useState, useEffect } from 'react';

interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  icon: string;
}

const TOKENS_TO_TRACK = [
  { id: 'solana', symbol: 'SOL', icon: '◎' },
  { id: 'bitcoin', symbol: 'BTC', icon: '₿' },
  { id: 'ethereum', symbol: 'ETH', icon: 'Ξ' },
  { id: 'jupiter-ag', symbol: 'JUP', icon: '🪐' },
  { id: 'bonk', symbol: 'BONK', icon: '🐕' },
];

export default function PriceTicker() {
  const [prices, setPrices] = useState<TokenPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = TOKENS_TO_TRACK.map(t => t.id).join(',');
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        const data = await res.json();
        
        const priceData: TokenPrice[] = TOKENS_TO_TRACK.map(token => ({
          symbol: token.symbol,
          icon: token.icon,
          price: data[token.id]?.usd || 0,
          change24h: data[token.id]?.usd_24h_change || 0,
        }));
        
        setPrices(priceData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch prices:', err);
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-black/50 border-y border-gray-800 py-2 overflow-hidden">
        <div className="animate-pulse text-gray-500 text-center text-sm">
          Loading prices...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/50 border-y border-gray-800 py-2 overflow-hidden">
      <div className="flex animate-scroll gap-8">
        {[...prices, ...prices].map((token, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap text-sm">
            <span className="text-lg">{token.icon}</span>
            <span className="font-bold">{token.symbol}</span>
            <span className="text-gray-400">${token.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            <span className={token.change24h >= 0 ? 'text-[#14F195]' : 'text-red-400'}>
              {token.change24h >= 0 ? '↑' : '↓'} {Math.abs(token.change24h).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
