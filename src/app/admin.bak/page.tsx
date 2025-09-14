'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

export default function AdminDashboard() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
      // Clear client-side cookies
      document.cookie = 'admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/admin/login');
    } catch (error) {
      // Type-safe error logging
      const errorData = error instanceof Error 
        ? { message: error.message, stack: error.stack } 
        : { message: String(error) };
      logger.error('Logout error', errorData, 'admin');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const dashboardItems = [
    {
      title: 'Analytics Dashboard',
      description: 'View website analytics, user behavior, and performance metrics',
      href: '/analytics-dashboard',
      icon: '📊',
      color: 'bg-blue-500'
    },
    {
      title: 'Review Management',
      description: 'Moderate product reviews and manage feedback',
      href: '/admin/reviews',
      icon: '⭐',
      color: 'bg-yellow-500'
    },
    {
      title: 'Review Requests',
      description: 'Manage automated review request campaigns',
      href: '/admin/review-requests',
      icon: '📧',
      color: 'bg-green-500'
    },
    {
      title: 'Graph Management',
      description: 'Manage knowledge graph and relationships',
      href: '/admin/graph',
      icon: '🕸️',
      color: 'bg-purple-500'
    },
    {
      title: 'Search Testing',
      description: 'Test and debug search functionality',
      href: '/test-search',
      icon: '🔍',
      color: 'bg-indigo-500'
    },
    {
      title: 'Graph Testing',
      description: 'Test graph database connections and queries',
      href: '/test-graph',
      icon: '🔗',
      color: 'bg-red-500'
    },
    {
      title: 'API Key Management',
      description: 'Generate and manage secure JWT API tokens',
      href: '/admin/api-keys',
      icon: '🔑',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your Agriko website and analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Back to Website
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className={`${item.color} rounded-lg p-3 text-white text-2xl mr-4`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-primary-600 text-sm font-medium">
                  Access Dashboard
                  <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Security Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You are accessing sensitive administrative data. Please ensure you log out when finished 
                  and do not share your credentials. All actions are logged for security purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
