'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';

interface ApiKeyResponse {
  success: boolean;
  error?: string;
  type?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
}

export default function ApiKeysPage() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('readonly');
  const [tokenType, setTokenType] = useState('service');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const generateApiKey = async () => {
    setLoading(true);
    setError('');
    setApiKey('');

    try {
      const response = await fetch('/api/admin/generate-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: selectedRole,
          tokenType: tokenType,
          description: description || `API key for ${selectedRole} access`
        }),
      });

      const data = await response.json() as ApiKeyResponse;

      if (response.ok && data.success) {
        // Handle different token response formats
        if (data.type === 'token_pair') {
          setApiKey(JSON.stringify({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            type: 'token_pair'
          }, null, 2));
        } else {
          setApiKey(data.token ?? data.accessToken ?? data.apiKey ?? '');
        }
      } else {
        setError(data.error ?? 'Failed to generate API key');
      }
    } catch (error) {
      setError('Network error occurred');
      logger.error('API key generation error', error as Record<string, unknown>, 'admin');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    // You could add a toast notification here
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Key Management</h1>
        <p className="text-gray-600">Generate secure JWT tokens for API access</p>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>API keys provide access to sensitive data. Store them securely and never share them publicly.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Generate New API Key */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate New API Key</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Access Level
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="readonly">Read Only - View data only</option>
              <option value="api-user">API User - Read and write data</option>
              <option value="admin">Admin - Full access (use with caution)</option>
            </select>
          </div>

          <div>
            <label htmlFor="tokenType" className="block text-sm font-medium text-gray-700">
              Token Type
            </label>
            <select
              id="tokenType"
              value={tokenType}
              onChange={(e) => setTokenType(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="service">Service Token - Long-lived (1 year), no refresh needed</option>
              <option value="pair">Token Pair - Auto-refreshing (1h access + 90d refresh)</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Analytics dashboard access for John"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <button
            onClick={generateApiKey}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Secure API Key'}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Generated API Key Display */}
      {apiKey && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3">✅ API Key Generated Successfully!</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Your Secure JWT Token:
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={apiKey}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-l-md text-sm font-mono"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="bg-white border border-green-200 rounded p-4">
              <h4 className="font-semibold text-green-800 mb-2">Usage Example:</h4>
              <code className="block text-sm bg-gray-100 p-2 rounded font-mono break-all">
                {tokenType === 'pair' ? 
                  `curl -H "Authorization: Bearer [ACCESS_TOKEN]" http://localhost:3006/api/analytics/dashboard/` :
                  `curl -H "Authorization: Bearer ${typeof apiKey === 'string' ? apiKey.substring(0, 50) : ''}..." http://localhost:3006/api/analytics/dashboard/`
                }
              </code>
            </div>

            <div className="text-sm text-green-700">
              <p><strong>⏰ Expires:</strong> {tokenType === 'pair' ? 'Access token: 1 hour, Refresh token: 90 days' : '1 year'}</p>
              <p><strong>🔐 Permissions:</strong> {selectedRole === 'readonly' ? 'Read only' : selectedRole === 'api-user' ? 'Read and write' : 'Full admin access'}</p>
              <p><strong>💡 Type:</strong> {tokenType === 'pair' ? 'Auto-refreshing token pair' : 'Long-lived service token'}</p>
              <p><strong>⚠️ Important:</strong> This token will not be shown again. Save it securely.</p>
            </div>
          </div>
        </div>
      )}

      {/* Security Best Practices */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">🔒 Security Best Practices</h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li>• <strong>Store securely:</strong> Never commit API keys to version control</li>
          <li>• <strong>Use environment variables:</strong> Store keys in secure environment variables</li>
          <li>• <strong>Rotate regularly:</strong> Generate new keys periodically and revoke old ones</li>
          <li>• <strong>Principle of least privilege:</strong> Use readonly keys when possible</li>
          <li>• <strong>Monitor usage:</strong> Track API key usage for suspicious activity</li>
          <li>• <strong>Revoke when necessary:</strong> Immediately revoke compromised keys</li>
        </ul>
      </div>
    </div>
  );
}
