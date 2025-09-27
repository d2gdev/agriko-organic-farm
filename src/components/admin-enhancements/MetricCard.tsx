'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import MiniChart from './MiniChart';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
    timeframe?: string;
  };
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'yellow';
  status: 'healthy' | 'warning' | 'error' | 'loading';
  href?: string;
  subtitle?: string;
  trendData?: number[];
  showChart?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    trend: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-500',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    trend: 'text-green-600'
  },
  purple: {
    bg: 'bg-purple-500',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    trend: 'text-purple-600'
  },
  orange: {
    bg: 'bg-orange-500',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    trend: 'text-orange-600'
  },
  red: {
    bg: 'bg-red-500',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    trend: 'text-red-600'
  },
  indigo: {
    bg: 'bg-indigo-500',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    trend: 'text-indigo-600'
  },
  yellow: {
    bg: 'bg-yellow-500',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    trend: 'text-yellow-600'
  }
};

const statusIndicatorClasses = {
  healthy: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  loading: 'bg-gray-400'
};

export default function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  status,
  href,
  subtitle,
  trendData,
  showChart = false
}: MetricCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const colors = colorClasses[color];

  const handleClick = async () => {
    if (href && !isLoading) {
      setIsLoading(true);
      router.push(href);
      // Reset loading state after navigation
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'string') {
      return val;
    }
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendArrow = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return '↗️';
      case 'decrease':
        return '↘️';
      default:
        return '→';
    }
  };

  const getTrendColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 cursor-pointer group relative
        ${isLoading || status === 'loading' ? 'opacity-75' : ''}
        ${href ? 'hover:scale-105' : ''}
      `}
      onClick={handleClick}
    >
      {/* Status Indicator */}
      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${statusIndicatorClasses[status]}`} />

      <div className="p-6">
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className={`p-3 rounded-lg ${colors.iconBg} group-hover:scale-110 transition-transform`}>
            {status === 'loading' || isLoading ? (
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            ) : (
              <Icon className={`w-6 h-6 ${colors.iconColor}`} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {title}
              </h3>
            </div>

            {/* Value */}
            <div className="mt-1">
              {status === 'loading' || isLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : status === 'error' ? (
                <p className="text-2xl font-bold text-red-500">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {formatValue(value)}
                </p>
              )}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
            )}

            {/* Mini Chart */}
            {showChart && trendData && trendData.length > 0 && status !== 'loading' && status !== 'error' && (
              <div className="mt-3">
                <MiniChart
                  data={trendData}
                  color={color === 'blue' ? '#3b82f6' :
                         color === 'green' ? '#10b981' :
                         color === 'purple' ? '#8b5cf6' :
                         color === 'orange' ? '#f59e0b' :
                         color === 'red' ? '#ef4444' :
                         color === 'indigo' ? '#6366f1' :
                         '#eab308'}
                  type="area"
                  width={100}
                  height={30}
                />
              </div>
            )}

            {/* Change Indicator */}
            {change && status !== 'loading' && status !== 'error' && (
              <div className={`flex items-center mt-2 text-sm ${getTrendColor(change.type)}`}>
                <span className="mr-1">{getTrendArrow(change.type)}</span>
                <span className="font-medium">
                  {(typeof change.value === 'number' && change.value > 0) ? '+' : ''}{change.value}%
                </span>
                {change.timeframe && (
                  <span className="ml-1 text-gray-500">vs {change.timeframe}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click indicator */}
      {href && !isLoading && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-xs text-gray-400">Click to view →</div>
        </div>
      )}
    </div>
  );
}