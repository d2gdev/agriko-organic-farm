'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  BrainCircuit,
  Globe,
  Package,
  ShoppingCart,
  // DollarSign, // Unused
  Users,
  FileText,
  Settings,
  LogOut,
  Home,
  Bell,
  ChevronDown,
  // TrendingUp, // Unused
  Search,
  Clock,
  Database,
  BookOpen,
  Zap
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/admin/blog', label: 'Blog Management', icon: BookOpen },
    { href: '/admin/content-optimization', label: 'Content Tools', icon: Zap },
    { href: '/admin/analytics/ecommerce', label: 'E-Commerce', icon: ShoppingCart },
    { href: '/admin/analytics/users', label: 'Users', icon: Users },
    { href: '/admin/analytics/search', label: 'Search Analytics', icon: Search },
    { href: '/admin/analytics/realtime', label: 'Real-Time', icon: Clock },
    { href: '/admin/reviews', label: 'Reviews', icon: FileText },
    { href: '/admin/business-intelligence', label: 'BI Suite', icon: BrainCircuit },
    { href: '/admin/competitor-scraper', label: 'Competitors', icon: Globe },
    { href: '/admin/graph', label: 'Graph Database', icon: Database },
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/admin/login');
  };

  // Don't show layout on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 ml-64">Agriko Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Admin</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-16 bottom-0 overflow-y-auto">
          <nav className="px-4 py-6 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'text-gray-900 bg-gray-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-6 mt-6 border-t border-gray-200">
              <Link
                href="/admin/settings"
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname === '/admin/settings'
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-5 h-5 mr-3" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}