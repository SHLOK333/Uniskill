'use client';

import { useState } from 'react';

interface QuickAction {
  id: string;
  icon: string;
  name: string;
  description: string;
  color: string;
  disabled?: boolean;
}

const ACTIONS: QuickAction[] = [
  {
    id: 'swap',
    icon: '🔄',
    name: 'Quick Swap',
    description: 'Swap tokens via Jupiter',
    color: '#14F195',
  },
  {
    id: 'deposit',
    icon: '🏦',
    name: 'Earn Yield',
    description: 'Deposit to Kamino vaults',
    color: '#9945FF',
  },
  {
    id: 'send',
    icon: '📤',
    name: 'Send Tokens',
    description: 'Transfer to another wallet',
    color: '#00FFA3',
  },
  {
    id: 'alert',
    icon: '🔔',
    name: 'Price Alert',
    description: 'Set price notifications',
    color: '#FFD700',
  },
];

export default function QuickActions() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        ⚡ Quick Actions
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={() => setSelectedAction(action.id)}
            disabled={action.disabled}
            className={`p-4 rounded-xl border transition-all hover:scale-105 ${
              selectedAction === action.id
                ? 'border-[#14F195] bg-[#14F195]/10'
                : 'border-gray-700 bg-black/30 hover:border-gray-600'
            } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <div className="font-medium text-sm">{action.name}</div>
            <div className="text-xs text-gray-500">{action.description}</div>
          </button>
        ))}
      </div>

      {selectedAction && (
        <div className="mt-4 p-4 bg-black/30 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              {ACTIONS.find(a => a.id === selectedAction)?.name} coming soon...
            </span>
            <button
              onClick={() => setSelectedAction(null)}
              className="text-xs text-gray-500 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
