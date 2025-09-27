'use client';

import { useMemo } from 'react';

export interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  type?: 'line' | 'area';
  className?: string;
}

export default function MiniChart({
  data,
  width = 120,
  height = 40,
  color = '#10b981',
  type = 'line',
  className = ''
}: MiniChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const range = maxValue - minValue;

    // Handle case where all values are the same
    if (range === 0) {
      return {
        points: data.map((_, index) => `${(index / (data.length - 1)) * width},${height / 2}`).join(' '),
        path: `M 0,${height / 2} ` + data.map((_, index) => `L ${(index / (data.length - 1)) * width},${height / 2}`).join(' '),
        areaPath: `M 0,${height} L 0,${height / 2} ` + data.map((_, index) => `L ${(index / (data.length - 1)) * width},${height / 2}`).join(' ') + ` L ${width},${height} Z`
      };
    }

    // Normalize data points to fit chart dimensions
    const normalizedData = data.map(value => {
      const normalized = ((maxValue - value) / range) * (height - 10) + 5;
      return normalized;
    });

    const points = normalizedData
      .map((value, index) => `${(index / (data.length - 1)) * width},${value}`)
      .join(' ');

    const path = `M ${normalizedData
      .map((value, index) => `${(index / (data.length - 1)) * width},${value}`)
      .join(' L ')}`;

    const areaPath = `M 0,${height} L 0,${normalizedData[0]} ` +
      normalizedData
        .map((value, index) => `L ${(index / (data.length - 1)) * width},${value}`)
        .join(' ') +
      ` L ${width},${height} Z`;

    return { points, path, areaPath };
  }, [data, width, height]);

  if (!chartData || !data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-xs text-gray-400 ${className}`}
        style={{ width, height }}
      >
        No data
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {type === 'area' && (
          <path
            d={chartData.areaPath}
            fill={`${color}20`}
            stroke="none"
          />
        )}
        <path
          d={chartData.path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {chartData.points.split(' ').map((point, index) => {
          const [x, y] = point.split(',').map(Number);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              className="opacity-0 hover:opacity-100 transition-opacity duration-200"
            />
          );
        })}
      </svg>
    </div>
  );
}