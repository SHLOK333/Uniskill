'use client';

import { useState, useEffect } from 'react';

interface Activity {
  id: string;
  type: 'quote' | 'swap' | 'register' | 'deposit' | 'borrow';
  agentName: string;
  details: string;
  amount?: string;
  timestamp: Date;
}

const AGENT_NAMES = [
  'Atlas', 'Nova', 'Cipher', 'Echo', 'Zenith', 'Pulse', 'Drift', 'Spark',
  'Vector', 'Flux', 'Qubit', 'Nexus', 'Orbit', 'Prism', 'Vertex', 'Major'
];

const ACTIVITIES = [
  { type: 'quote', details: 'Requested SOL → USDC quote', icon: '📊' },
  { type: 'quote', details: 'Requested USDC → SOL quote', icon: '📊' },
  { type: 'quote', details: 'Requested JUP → USDC quote', icon: '📊' },
  { type: 'swap', details: 'Swapped 2.5 SOL → USDC via Jupiter', icon: '🔄', amount: '$245.50' },
  { type: 'swap', details: 'Swapped 100 USDC → SOL via Jupiter', icon: '🔄', amount: '$99.80' },
  { type: 'register', details: 'Registered new agent', icon: '🤖' },
  { type: 'deposit', details: 'Deposited SOL to Kamino vault', icon: '🏦', amount: '$500.00' },
  { type: 'borrow', details: 'Borrowed USDC from Kamino', icon: '💸', amount: '$200.00' },
];

function generateActivity(): Activity {
  const activity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
  const agentName = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    type: activity.type as Activity['type'],
    agentName,
    details: activity.details,
    amount: activity.amount,
    timestamp: new Date(),
  };
}

export default function ActivityFeed({ maxItems = 5 }: { maxItems?: number }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Initial activities
    const initial = Array(maxItems).fill(null).map(() => {
      const a = generateActivity();
      a.timestamp = new Date(Date.now() - Math.random() * 60000);
      return a;
    });
    setActivities(initial.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));

    // Add new activity every 5-15 seconds
    const interval = setInterval(() => {
      const newActivity = generateActivity();
      setActivities(prev => [newActivity, ...prev.slice(0, maxItems - 1)]);
    }, 5000 + Math.random() * 10000);

    return () => clearInterval(interval);
  }, [maxItems]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quote': return 'text-blue-400 bg-blue-400/10';
      case 'swap': return 'text-[#14F195] bg-[#14F195]/10';
      case 'register': return 'text-purple-400 bg-purple-400/10';
      case 'deposit': return 'text-yellow-400 bg-yellow-400/10';
      case 'borrow': return 'text-orange-400 bg-orange-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quote': return '📊';
      case 'swap': return '🔄';
      case 'register': return '🤖';
      case 'deposit': return '🏦';
      case 'borrow': return '💸';
      default: return '📌';
    }
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#14F195] rounded-full animate-pulse" />
          <span className="font-bold text-sm">Live Activity</span>
        </div>
        <span className="text-xs text-gray-500">Real-time events</span>
      </div>
      
      <div className="divide-y divide-gray-800/50">
        {activities.map((activity, i) => (
          <div 
            key={activity.id}
            className={`px-4 py-3 hover:bg-gray-800/30 transition ${
              i === 0 ? 'animate-fadeIn' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`text-lg p-2 rounded-lg ${getTypeColor(activity.type)}`}>
                {getTypeIcon(activity.type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{activity.agentName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(activity.type)}`}>
                    {activity.type}
                  </span>
                </div>
                <p className="text-gray-400 text-sm truncate">{activity.details}</p>
                {activity.amount && (
                  <span className="text-[#14F195] text-sm font-medium">{activity.amount}</span>
                )}
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {timeAgo(activity.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
