import React from 'react';

interface TrustBadge {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'orange' | 'purple' | 'yellow';
}

const trustBadges: TrustBadge[] = [
  {
    id: 'organic',
    title: 'Certified Organic',
    subtitle: 'USDA & Philippine Organic',
    color: 'green',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5c-1.378 0-2.5-1.122-2.5-2.5S10.622 6.5 12 6.5s2.5 1.122 2.5 2.5S13.378 11.5 12 11.5z"/>
      </svg>
    ),
  },
  {
    id: 'fda',
    title: 'FDA Approved',
    subtitle: 'Food & Drug Administration',
    color: 'blue',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11V12z"/>
      </svg>
    ),
  },
  {
    id: 'natural',
    title: '100% Natural',
    subtitle: 'No Artificial Additives',
    color: 'green',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.59c.48-.26 1.6-.33 3.34-.06C12.19 19.69 14 19.85 16 19.85c4 0 8-1.85 8-4.85V8.85C24 7.85 22 8 17 8zm2.71 6.03c-1.78.64-3.56.96-5.35 1-.89.02-1.78-.03-2.67-.14-.89-.11-1.77-.28-2.64-.5C8.36 14.25 7.72 14.05 7.12 13.8L9.4 11.5c.32.2.66.37 1.01.52.7.3 1.43.46 2.17.49.74.03 1.49-.09 2.2-.35.71-.26 1.39-.65 1.99-1.18l.94 2.05z"/>
      </svg>
    ),
  },
  {
    id: 'family-farm',
    title: 'Family Farm Since 2016',
    subtitle: 'Multi-Generational Farming',
    color: 'orange',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12.75c1.63 0 3.07.39 4.24.9c1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73c1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2c0-1.1-.9-2-2-2s-2 .9-2 2c0 1.1.9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1c-.99 0-1.93.21-2.78.58A2.01 2.01 0 000 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2c0-1.1-.9-2-2-2s-2 .9-2 2c0 1.1.9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85A6.95 6.95 0 0020 14c-.39 0-.76.04-1.13.1c.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3c0 1.66-1.34 3-3 3s-3-1.34-3-3c0-1.66 1.34-3 3-3z"/>
      </svg>
    ),
  },
  {
    id: 'guarantee',
    title: 'Money-Back Guarantee',
    subtitle: '30-Day Full Refund',
    color: 'purple',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
  },
  {
    id: 'sustainable',
    title: 'Sustainable Farming',
    subtitle: 'Eco-Friendly Practices',
    color: 'green',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15.5 5.5c1 2 1 3.5 1 3.5s-1.5 0-3.5-1c-1.1-.6-2.3-1.3-2.8-2.1C9.7 5.3 9.6 4.7 10 4.3c.4-.4 1-.3 1.6.1.6.4 1.2 1 1.5 1.1h2.4zm3.5 6c-1.5 0-2.8-.6-3.8-1.5c-.4-.4-.7-.8-.9-1.3c-.2-.4-.3-.9-.2-1.4c.1-.6.4-1.1.8-1.5c.8-.8 2-.8 2.8 0c.4.4.7.9.8 1.5c.1.5 0 1-.2 1.4c-.2.5-.5.9-.9 1.3c-1 .9-2.3 1.5-3.8 1.5zm-7 7l-3.5-3.5h-2c-.6 0-1-.4-1-1s.4-1 1-1h2.4l3.8 3.8c.4.4.4 1 0 1.4c-.2.2-.4.3-.7.3z"/>
      </svg>
    ),
  },
];

const colorMap = {
  green: {
    bg: 'bg-green-50 hover:bg-green-100',
    border: 'border-green-200 hover:border-green-300',
    text: 'text-green-700',
    icon: 'text-green-600',
  },
  blue: {
    bg: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-200 hover:border-blue-300',
    text: 'text-blue-700',
    icon: 'text-blue-600',
  },
  orange: {
    bg: 'bg-orange-50 hover:bg-orange-100',
    border: 'border-orange-200 hover:border-orange-300',
    text: 'text-orange-700',
    icon: 'text-orange-600',
  },
  purple: {
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200 hover:border-purple-300',
    text: 'text-purple-700',
    icon: 'text-purple-600',
  },
  yellow: {
    bg: 'bg-yellow-50 hover:bg-yellow-100',
    border: 'border-yellow-200 hover:border-yellow-300',
    text: 'text-yellow-700',
    icon: 'text-yellow-600',
  },
};

interface TrustBadgesProps {
  layout?: 'grid' | 'flex' | 'compact';
  showSubtitle?: boolean;
  badges?: string[];
  className?: string;
}

export default function TrustBadges({
  layout = 'flex',
  showSubtitle = true,
  badges,
  className = '',
}: TrustBadgesProps) {
  const displayBadges = badges
    ? trustBadges.filter(badge => badges.includes(badge.id))
    : trustBadges;

  if (layout === 'compact') {
    return (
      <div className={`flex flex-wrap justify-center gap-3 ${className}`}>
        {displayBadges.map((badge) => {
          const colors = colorMap[badge.color];
          return (
            <div
              key={badge.id}
              className={`inline-flex items-center px-3 py-2 rounded-full border transition-colors ${colors.bg} ${colors.border}`}
            >
              <span className={`mr-2 ${colors.icon}`}>{badge.icon}</span>
              <span className={`text-sm font-medium ${colors.text}`}>
                {badge.title}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (layout === 'grid') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
        {displayBadges.map((badge) => {
          const colors = colorMap[badge.color];
          return (
            <div
              key={badge.id}
              className={`flex flex-col items-center p-4 rounded-xl border transition-colors text-center ${colors.bg} ${colors.border}`}
            >
              <div className={`mb-3 ${colors.icon}`}>
                {badge.icon}
              </div>
              <h4 className={`font-semibold text-sm mb-1 ${colors.text}`}>
                {badge.title}
              </h4>
              {showSubtitle && badge.subtitle && (
                <p className="text-xs text-gray-600">{badge.subtitle}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Default flex layout
  return (
    <div className={`flex flex-wrap justify-center gap-4 items-center ${className}`}>
      {displayBadges.map((badge) => {
        const colors = colorMap[badge.color];
        return (
          <div
            key={badge.id}
            className={`flex items-center px-4 py-3 rounded-lg border transition-colors ${colors.bg} ${colors.border}`}
          >
            <span className={`mr-3 ${colors.icon}`}>{badge.icon}</span>
            <div>
              <div className={`font-semibold text-sm ${colors.text}`}>
                {badge.title}
              </div>
              {showSubtitle && badge.subtitle && (
                <div className="text-xs text-gray-600">{badge.subtitle}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}