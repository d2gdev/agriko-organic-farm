import React from 'react';

export default function AdminFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
          <div className="mb-2 sm:mb-0">
            © {new Date().getFullYear()} Agriko Admin Panel. All rights reserved.
          </div>
          <div className="flex space-x-4">
            <span>Version 2.0.0</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Admin Dashboard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}