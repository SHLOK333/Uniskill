'use client';

import { useState, useEffect } from 'react';

interface ChartPoint {
  time: string;
  value: number;
}

export default function PortfolioChart({ totalValue }: { totalValue: number }) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '7D' | '30D'>('24H');

  useEffect(() => {
    // Generate mock historical data based on current value
    const points = generateHistoricalData(totalValue, timeframe);
    setData(points);
  }, [totalValue, timeframe]);

  const generateHistoricalData = (currentValue: number, tf: string): ChartPoint[] => {
    const points: ChartPoint[] = [];
    let numPoints = 24;
    let volatility = 0.02;

    switch (tf) {
      case '1H': numPoints = 12; volatility = 0.005; break;
      case '24H': numPoints = 24; volatility = 0.02; break;
      case '7D': numPoints = 28; volatility = 0.05; break;
      case '30D': numPoints = 30; volatility = 0.1; break;
    }

    let value = currentValue * (1 - volatility * 2); // Start lower
    for (let i = 0; i < numPoints; i++) {
      const change = (Math.random() - 0.4) * volatility * value;
      value = Math.max(0, value + change);
      
      const time = new Date(Date.now() - (numPoints - i) * (86400000 / numPoints * (tf === '7D' ? 7 : tf === '30D' ? 30 : 1)));
      points.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: value,
      });
    }
    
    // Ensure last point is current value
    points[points.length - 1].value = currentValue;
    
    return points;
  };

  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const getY = (value: number) => {
    return 100 - ((value - minValue) / range) * 80;
  };

  const pathD = data.length > 0 
    ? `M 0 ${getY(data[0].value)} ` + data.map((d, i) => 
        `L ${(i / (data.length - 1)) * 100} ${getY(d.value)}`
      ).join(' ')
    : '';

  const areaD = pathD + ` L 100 100 L 0 100 Z`;

  const change = data.length >= 2 
    ? ((data[data.length - 1].value - data[0].value) / data[0].value) * 100 
    : 0;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm text-gray-400 mb-1">Portfolio Value</h3>
          <div className="text-3xl font-bold">${totalValue.toLocaleString()}</div>
          <div className={`text-sm ${change >= 0 ? 'text-[#14F195]' : 'text-red-400'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}% ({timeframe})
          </div>
        </div>
        <div className="flex gap-1">
          {(['1H', '24H', '7D', '30D'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs rounded-lg transition ${
                timeframe === tf
                  ? 'bg-[#14F195]/20 text-[#14F195]'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="h-40 relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={change >= 0 ? '#14F195' : '#FF6B6B'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={change >= 0 ? '#14F195' : '#FF6B6B'} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[20, 40, 60, 80].map(y => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#333" strokeWidth="0.2" />
          ))}
          
          {/* Area */}
          <path d={areaD} fill="url(#chartGradient)" />
          
          {/* Line */}
          <path 
            d={pathD} 
            fill="none" 
            stroke={change >= 0 ? '#14F195' : '#FF6B6B'} 
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Current value dot */}
          {data.length > 0 && (
            <circle
              cx="100"
              cy={getY(data[data.length - 1].value)}
              r="2"
              fill={change >= 0 ? '#14F195' : '#FF6B6B'}
            />
          )}
        </svg>
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{data[0]?.time}</span>
        <span>{data[Math.floor(data.length / 2)]?.time}</span>
        <span>{data[data.length - 1]?.time}</span>
      </div>
    </div>
  );
}
