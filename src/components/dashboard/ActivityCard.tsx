'use client';

import { useState, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ActivityType = 'swap' | 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'vault' | 'quote' | 'balance';

export type ActivityStatus = 'success' | 'pending' | 'failed';

export interface Activity {
  id: string;
  timestamp: Date;
  type: ActivityType;
  action: string;
  details: string;
  status: ActivityStatus;
  txSignature?: string;
  metadata?: {
    fromToken?: string;
    toToken?: string;
    amount?: string;
    amountOut?: string;
    protocol?: string;
    apy?: string;
  };
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
    type: 'swap',
    action: 'Jupiter Swap',
    details: 'Swapped 10 SOL → 245.32 USDC',
    status: 'success',
    txSignature: '5UfDuX7yXwLqkKgAo9KxWc8QhBBB7nSvPwJEEzqKdmVB4CYBHCBnPxF8q5WFNqAqjQVWM8qEUzGVqU8DKzXGzXDE',
    metadata: {
      fromToken: 'SOL',
      toToken: 'USDC',
      amount: '10',
      amountOut: '245.32',
    },
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
    type: 'deposit',
    action: 'Kamino Deposit',
    details: 'Deposited 500 USDC to Main Market',
    status: 'success',
    txSignature: '3xKLmN9pQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCd',
    metadata: {
      amount: '500',
      fromToken: 'USDC',
      protocol: 'Kamino',
      apy: '8.5%',
    },
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
    type: 'vault',
    action: 'Kamino Vault',
    details: 'Entered SOL-USDC vault with 2 SOL',
    status: 'pending',
    txSignature: '2aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789aBcDeFgHiJkLmNoPqRsTuVwXyZ01234',
    metadata: {
      amount: '2',
      fromToken: 'SOL',
      protocol: 'Kamino Vaults',
      apy: '24.3%',
    },
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    type: 'quote',
    action: 'Jupiter Quote',
    details: 'Fetched quote for 100 USDC → SOL',
    status: 'success',
    metadata: {
      fromToken: 'USDC',
      toToken: 'SOL',
      amount: '100',
      amountOut: '4.12',
    },
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    type: 'borrow',
    action: 'Kamino Borrow',
    details: 'Borrowed 200 USDC against SOL collateral',
    status: 'success',
    txSignature: '4xYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKl',
    metadata: {
      amount: '200',
      fromToken: 'USDC',
      protocol: 'Kamino Lending',
    },
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    type: 'balance',
    action: 'Wallet Check',
    details: 'Fetched wallet balances (12 tokens)',
    status: 'success',
  },
  {
    id: '7',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    type: 'swap',
    action: 'Jupiter Swap',
    details: 'Swapped 50 USDC → 0.02 BTC (wormhole)',
    status: 'failed',
    metadata: {
      fromToken: 'USDC',
      toToken: 'BTC',
      amount: '50',
    },
  },
  {
    id: '8',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    type: 'withdraw',
    action: 'Kamino Withdraw',
    details: 'Withdrew 300 USDC from Main Market',
    status: 'success',
    txSignature: '6zAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMn',
    metadata: {
      amount: '300',
      fromToken: 'USDC',
      protocol: 'Kamino',
    },
  },
  {
    id: '9',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    type: 'repay',
    action: 'Kamino Repay',
    details: 'Repaid 100 USDC loan',
    status: 'success',
    txSignature: '7bCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOp',
    metadata: {
      amount: '100',
      fromToken: 'USDC',
      protocol: 'Kamino Lending',
    },
  },
  {
    id: '10',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    type: 'swap',
    action: 'Jupiter Swap',
    details: 'Swapped 1000 BONK → 0.5 SOL',
    status: 'success',
    txSignature: '8cDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPq',
    metadata: {
      fromToken: 'BONK',
      toToken: 'SOL',
      amount: '1000',
      amountOut: '0.5',
    },
  },
  {
    id: '11',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    type: 'deposit',
    action: 'Kamino Deposit',
    details: 'Deposited 1000 USDC to JLP Market',
    status: 'success',
    txSignature: '9dEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQr',
    metadata: {
      amount: '1000',
      fromToken: 'USDC',
      protocol: 'Kamino',
      apy: '12.1%',
    },
  },
  {
    id: '12',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    type: 'vault',
    action: 'Kamino Vault',
    details: 'Exited JitoSOL-SOL vault',
    status: 'success',
    txSignature: '0eFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRs',
    metadata: {
      protocol: 'Kamino Vaults',
    },
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTxExplorerUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}`;
}

function truncateTx(signature: string): string {
  return `${signature.slice(0, 8)}...${signature.slice(-8)}`;
}

// ============================================================================
// Sub-Components
// ============================================================================

const TYPE_CONFIG: Record<ActivityType, { icon: string; label: string; color: string }> = {
  swap: { icon: '🔄', label: 'Swap', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  deposit: { icon: '📥', label: 'Deposit', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  withdraw: { icon: '📤', label: 'Withdraw', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  borrow: { icon: '💳', label: 'Borrow', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  repay: { icon: '💵', label: 'Repay', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  vault: { icon: '🏦', label: 'Vault', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  quote: { icon: '📊', label: 'Quote', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  balance: { icon: '👛', label: 'Balance', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
};

const STATUS_CONFIG: Record<ActivityStatus, { icon: string; color: string }> = {
  success: { icon: '✓', color: 'text-green-400' },
  pending: { icon: '⏳', color: 'text-yellow-400 animate-pulse' },
  failed: { icon: '✗', color: 'text-red-400' },
};

interface ActivityItemProps {
  activity: Activity;
  isLast: boolean;
}

function ActivityItem({ activity, isLast }: ActivityItemProps) {
  const typeConfig = TYPE_CONFIG[activity.type];
  const statusConfig = STATUS_CONFIG[activity.status];

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-px bg-gray-700" />
      )}
      
      {/* Icon */}
      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border ${typeConfig.color}`}>
        {typeConfig.icon}
      </div>
      
      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white">{activity.action}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
              <span className={`text-sm ${statusConfig.color}`}>
                {statusConfig.icon}
              </span>
            </div>
            
            {/* Details */}
            <p className="text-gray-400 text-sm mt-1">{activity.details}</p>
            
            {/* Metadata badges */}
            {activity.metadata && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {activity.metadata.apy && (
                  <span className="text-xs px-2 py-1 rounded bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20">
                    APY: {activity.metadata.apy}
                  </span>
                )}
                {activity.metadata.protocol && (
                  <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">
                    {activity.metadata.protocol}
                  </span>
                )}
              </div>
            )}
            
            {/* TX Link */}
            {activity.txSignature && (
              <a
                href={getTxExplorerUrl(activity.txSignature)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#14F195] hover:text-[#0fd884] mt-2 transition"
              >
                <span>🔗</span>
                <code className="font-mono">{truncateTx(activity.txSignature)}</code>
                <span className="opacity-60">↗</span>
              </a>
            )}
          </div>
          
          {/* Timestamp */}
          <div className="text-right shrink-0">
            <span className="text-gray-500 text-xs" title={formatFullTimestamp(activity.timestamp)}>
              {formatTimestamp(activity.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-lg transition whitespace-nowrap ${
        active
          ? 'bg-[#14F195] text-black font-medium'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface ActivityCardProps {
  activities?: Activity[];
  pageSize?: number;
  title?: string;
  className?: string;
}

export default function ActivityCard({
  activities = MOCK_ACTIVITIES,
  pageSize = 5,
  title = 'Activity Log',
  className = '',
}: ActivityCardProps) {
  const [selectedType, setSelectedType] = useState<ActivityType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (selectedType === 'all') return activities;
    return activities.filter((a) => a.type === selectedType);
  }, [activities, selectedType]);

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / pageSize);
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  // Reset page when filter changes
  const handleTypeChange = (type: ActivityType | 'all') => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  // Get unique types from activities for filter
  const availableTypes = useMemo(() => {
    const types = new Set(activities.map((a) => a.type));
    return Array.from(types) as ActivityType[];
  }, [activities]);

  // Stats
  const stats = useMemo(() => {
    const success = activities.filter((a) => a.status === 'success').length;
    const pending = activities.filter((a) => a.status === 'pending').length;
    const failed = activities.filter((a) => a.status === 'failed').length;
    return { success, pending, failed, total: activities.length };
  }, [activities]);

  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Recent agent API calls and transactions
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">
              <span className="text-green-400 font-medium">{stats.success}</span> success
            </span>
            {stats.pending > 0 && (
              <span className="text-gray-400">
                <span className="text-yellow-400 font-medium">{stats.pending}</span> pending
              </span>
            )}
            {stats.failed > 0 && (
              <span className="text-gray-400">
                <span className="text-red-400 font-medium">{stats.failed}</span> failed
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          <FilterButton
            active={selectedType === 'all'}
            onClick={() => handleTypeChange('all')}
          >
            All ({activities.length})
          </FilterButton>
          {availableTypes.map((type) => {
            const count = activities.filter((a) => a.type === type).length;
            const config = TYPE_CONFIG[type];
            return (
              <FilterButton
                key={type}
                active={selectedType === type}
                onClick={() => handleTypeChange(type)}
              >
                {config.icon} {config.label} ({count})
              </FilterButton>
            );
          })}
        </div>
      </div>

      {/* Activity List */}
      <div className="px-6 py-4">
        {paginatedActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-400">No activities found</p>
            <p className="text-gray-600 text-sm mt-1">
              {selectedType !== 'all' ? 'Try selecting a different filter' : 'Agent activity will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {paginatedActivities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isLast={index === paginatedActivities.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredActivities.length)} of {filteredActivities.length}
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-sm rounded-lg transition ${
                    page === currentPage
                      ? 'bg-[#14F195] text-black font-medium'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export types and mock data for use in other components
export { MOCK_ACTIVITIES, TYPE_CONFIG, STATUS_CONFIG };
