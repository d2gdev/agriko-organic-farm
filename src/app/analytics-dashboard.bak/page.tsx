import { Metadata } from 'next';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export const metadata: Metadata = {
  title: 'Analytics Dashboard - Agriko Organic Farm',
  description: 'Comprehensive analytics and performance insights for Agriko e-commerce platform',
  robots: 'noindex, nofollow' // Private admin page
};

export default function AnalyticsDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AnalyticsDashboard />
    </div>
  );
}