'use client';

import { useState, useEffect } from 'react';

interface Stats {
  agents: { total: number; active24h: number };
  activity: { quotes24h: number; swaps24h: number; volumeUsd24h: number };
  protocols: Record<string, { status: string; latencyMs: number }>;
  uptime: string;
}

export default function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/v1/stats');
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
      setLoading(false);
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 animate-pulse">
            <div className="h-8 bg-gray-800 rounded mb-2" />
            <div className="h-4 bg-gray-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          value={stats.agents.total}
          label="Registered Agents"
          icon="🤖"
          color="#14F195"
        />
        <StatCard
          value={stats.activity.quotes24h}
          label="Quotes (24h)"
          icon="📊"
          color="#9945FF"
          animate
        />
        <StatCard
          value={stats.activity.swaps24h}
          label="Swaps (24h)"
          icon="🔄"
          color="#00FFA3"
        />
        <StatCard
          value={`$${(stats.activity.volumeUsd24h / 1000).toFixed(1)}k`}
          label="Volume (24h)"
          icon="💰"
          color="#FF6B6B"
        />
      </div>

      {/* Protocol Status */}
      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Protocol Status</span>
          <span className="text-xs bg-[#14F195]/20 text-[#14F195] px-2 py-1 rounded-full">
            {stats.uptime} Uptime
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(stats.protocols).map(([name, data]) => (
            <div key={name} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                data.status === 'operational' ? 'bg-[#14F195]' : 'bg-yellow-400'
              }`} />
              <span className="text-sm capitalize">{name}</span>
              <span className="text-xs text-gray-500">{data.latencyMs}ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  value, 
  label, 
  icon, 
  color,
  animate = false,
}: { 
  value: string | number; 
  label: string; 
  icon: string;
  color: string;
  animate?: boolean;
}) {
  return (
    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <span 
          className={`text-2xl font-bold ${animate ? 'animate-pulse' : ''}`}
          style={{ color }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}
