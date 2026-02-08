import React from 'react';

interface RealtimeIndicatorProps {
  connected: boolean;
  lastUpdate: Date | null;
  error: string | null;
  onReconnect?: () => void;
}

export function RealtimeIndicator({
  connected,
  lastUpdate,
  error,
  onReconnect,
}: RealtimeIndicatorProps) {
  const formatLastUpdate = (date: Date | null): string => {
    if (!date) return 'Never';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString();
  };

  const handleClick = () => {
    if (!connected && onReconnect) {
      onReconnect();
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
        connected
          ? 'bg-green-500/10 text-green-400'
          : 'bg-red-500/10 text-red-400 cursor-pointer hover:bg-red-500/20'
      }`}
      onClick={handleClick}
      role={!connected ? 'button' : undefined}
      title={error || (connected ? 'Connected' : 'Disconnected')}
    >
      {/* Status dot with pulse animation when connected */}
      <span className="relative flex h-2.5 w-2.5">
        {connected && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            connected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      </span>

      {/* Status text */}
      <span className="font-medium">
        {connected ? 'Live' : error ? 'Error' : 'Disconnected'}
      </span>

      {/* Last update timestamp */}
      {connected && lastUpdate && (
        <span className="text-xs opacity-60">
          {formatLastUpdate(lastUpdate)}
        </span>
      )}

      {/* Reconnect hint */}
      {!connected && onReconnect && (
        <span className="text-xs opacity-60">Click to reconnect</span>
      )}
    </div>
  );
}

export default RealtimeIndicator;
