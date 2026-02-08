'use client';

import { useEffect, useState } from 'react';

// Types for API response
interface Deposit {
  reserve: string;
  symbol: string;
  amount: string;
  amountUsd: number;
}

interface Borrow {
  reserve: string;
  symbol: string;
  amount: string;
  amountUsd: number;
}

interface LendingPosition {
  obligationAddress: string;
  market: string;
  deposits: Deposit[];
  totalDepositedUsd: number;
  borrows: Borrow[];
  totalBorrowedUsd: number;
  loanToValue: number;
  liquidationLtv: number;
  netValue: number;
  healthStatus: string;
}

interface VaultPosition {
  strategyAddress: string;
  name: string;
  shares: string;
  sharesUsd: number;
  tokenA: string;
  tokenB: string;
  pendingRewards: any[];
}

interface PositionsSummary {
  totalLendingValueUsd: number;
  totalVaultValueUsd: number;
  totalValueUsd: number;
  lendingPositions: number;
  vaultPositions: number;
}

interface PositionsResponse {
  success: boolean;
  wallet: string;
  positions: {
    lending: LendingPosition[];
    vaults: VaultPosition[];
  };
  summary: PositionsSummary;
  error?: string;
}

interface PositionsCardProps {
  walletAddress: string;
  refreshTrigger?: number; // Optional prop to trigger refresh
}

// Health factor color coding
function getHealthColor(healthStatus: string): string {
  if (healthStatus.includes('CRITICAL')) return 'text-red-500';
  if (healthStatus.includes('WARNING')) return 'text-orange-500';
  if (healthStatus.includes('MODERATE')) return 'text-yellow-500';
  if (healthStatus.includes('HEALTHY')) return 'text-green-500';
  return 'text-gray-400';
}

function getHealthBgColor(healthStatus: string): string {
  if (healthStatus.includes('CRITICAL')) return 'bg-red-500/10 border-red-500/30';
  if (healthStatus.includes('WARNING')) return 'bg-orange-500/10 border-orange-500/30';
  if (healthStatus.includes('MODERATE')) return 'bg-yellow-500/10 border-yellow-500/30';
  if (healthStatus.includes('HEALTHY')) return 'bg-green-500/10 border-green-500/30';
  return 'bg-gray-500/10 border-gray-500/30';
}

// Calculate health factor from LTV
function calculateHealthFactor(ltv: number, liquidationLtv: number): number {
  if (!ltv || !liquidationLtv || ltv === 0) return Infinity;
  return liquidationLtv / ltv;
}

// Format USD amounts
function formatUsd(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0.00';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

// Format percentage
function formatPercent(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '-';
  return `${(value * 100).toFixed(2)}%`;
}

export default function PositionsCard({ walletAddress, refreshTrigger }: PositionsCardProps) {
  const [data, setData] = useState<PositionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    const fetchPositions = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/v1/kamino/positions?wallet=${walletAddress}`);
        const json = await res.json();

        if (json.success) {
          setData(json);
        } else {
          setError(json.error || 'Failed to fetch positions');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error('Positions fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, [walletAddress, refreshTrigger]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-20 bg-gray-800 rounded" />
            <div className="h-20 bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-900/50 border border-red-800/50 rounded-xl p-6">
        <div className="flex items-center gap-3 text-red-400">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold">Error Loading Positions</h3>
            <p className="text-sm text-red-400/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No wallet state
  if (!walletAddress) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">👛</span>
          <h3 className="text-lg font-bold text-gray-300 mb-2">Connect Wallet</h3>
          <p className="text-gray-500 text-sm">Connect your wallet to view DeFi positions</p>
        </div>
      </div>
    );
  }

  const hasLendingPositions = data?.positions?.lending && data.positions.lending.length > 0;
  const hasVaultPositions = data?.positions?.vaults && data.positions.vaults.length > 0;
  const hasAnyPositions = hasLendingPositions || hasVaultPositions;

  // Empty state
  if (!hasAnyPositions) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📊</span> DeFi Positions
        </h3>
        <div className="text-center py-8 border border-dashed border-gray-700 rounded-lg">
          <span className="text-4xl mb-4 block">🦀</span>
          <h4 className="text-lg font-bold text-gray-300 mb-2">No Active Positions</h4>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            You don't have any Kamino lending or vault positions yet.
            Start earning yield on your assets!
          </p>
          <div className="mt-4 flex gap-3 justify-center">
            <button className="px-4 py-2 bg-[#14F195]/20 text-[#14F195] border border-[#14F195]/30 rounded-lg text-sm hover:bg-[#14F195]/30 transition">
              🏦 Lend
            </button>
            <button className="px-4 py-2 bg-[#14F195]/20 text-[#14F195] border border-[#14F195]/30 rounded-lg text-sm hover:bg-[#14F195]/30 transition">
              📈 Vaults
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      {/* Header with Summary */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>📊</span> DeFi Positions
        </h3>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total Value</p>
          <p className="text-xl font-bold text-[#14F195]">
            {formatUsd(data?.summary?.totalValueUsd || 0)}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/50 rounded-lg p-3 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Lending Value</p>
          <p className="text-lg font-bold text-white">
            {formatUsd(data?.summary?.totalLendingValueUsd || 0)}
          </p>
          <p className="text-xs text-gray-500">
            {data?.summary?.lendingPositions || 0} position{data?.summary?.lendingPositions !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="bg-black/50 rounded-lg p-3 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Vault Value</p>
          <p className="text-lg font-bold text-white">
            {formatUsd(data?.summary?.totalVaultValueUsd || 0)}
          </p>
          <p className="text-xs text-gray-500">
            {data?.summary?.vaultPositions || 0} position{data?.summary?.vaultPositions !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Lending Positions */}
      {hasLendingPositions && (
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>🏦</span> Lending Positions
          </h4>
          <div className="space-y-3">
            {data!.positions.lending.map((position, idx) => {
              const healthFactor = calculateHealthFactor(position.loanToValue, position.liquidationLtv);
              const healthColor = getHealthColor(position.healthStatus);
              const healthBg = getHealthBgColor(position.healthStatus);

              return (
                <div
                  key={position.obligationAddress || idx}
                  className={`bg-black/50 rounded-lg p-4 border ${healthBg}`}
                >
                  {/* Health Status Banner */}
                  <div className={`text-xs font-bold ${healthColor} mb-3`}>
                    {position.healthStatus}
                  </div>

                  {/* Position Details */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    {/* Deposits */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Deposited</p>
                      <p className="text-sm font-bold text-green-400">
                        {formatUsd(position.totalDepositedUsd)}
                      </p>
                      {position.deposits?.map((d, i) => (
                        <p key={i} className="text-xs text-gray-500">
                          {d.symbol}: {parseFloat(d.amount).toFixed(4)}
                        </p>
                      ))}
                    </div>

                    {/* Borrows */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Borrowed</p>
                      <p className="text-sm font-bold text-red-400">
                        {formatUsd(position.totalBorrowedUsd)}
                      </p>
                      {position.borrows?.map((b, i) => (
                        <p key={i} className="text-xs text-gray-500">
                          {b.symbol}: {parseFloat(b.amount).toFixed(4)}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="flex items-center justify-between text-xs border-t border-gray-800 pt-3">
                    <div>
                      <span className="text-gray-500">Net Value: </span>
                      <span className="text-white font-bold">{formatUsd(position.netValue)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">LTV: </span>
                      <span className={healthColor}>{formatPercent(position.loanToValue)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Health: </span>
                      <span className={healthColor}>
                        {isFinite(healthFactor) ? healthFactor.toFixed(2) : '∞'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vault Positions */}
      {hasVaultPositions && (
        <div>
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>📈</span> Vault Positions
          </h4>
          <div className="space-y-3">
            {data!.positions.vaults.map((vault, idx) => (
              <div
                key={vault.strategyAddress || idx}
                className="bg-black/50 rounded-lg p-4 border border-gray-800 hover:border-[#14F195]/30 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-white text-sm truncate max-w-[200px]">
                    {vault.name || 'Kamino Vault'}
                  </h5>
                  <span className="text-[#14F195] font-bold">
                    {formatUsd(vault.sharesUsd)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {vault.tokenA && (
                    <span>Token A: {parseFloat(vault.tokenA).toFixed(4)}</span>
                  )}
                  {vault.tokenB && (
                    <span>Token B: {parseFloat(vault.tokenB).toFixed(4)}</span>
                  )}
                </div>

                {vault.pendingRewards && vault.pendingRewards.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-800">
                    <span className="text-xs text-yellow-400">
                      🎁 Pending rewards available
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh hint */}
      <p className="text-center text-xs text-gray-600 mt-4">
        Data from Kamino Finance • Updates on page refresh
      </p>
    </div>
  );
}
