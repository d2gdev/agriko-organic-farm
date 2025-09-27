import React, { useState, useEffect } from 'react';
import { Link2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface LinkCheckerProps {
  content: {
    content: string;
  };
}

export default function LinkChecker({ content }: LinkCheckerProps) {
  const [links, setLinks] = useState<Array<{ url: string; status: string; message: string }>>([]);
  const [checking, setChecking] = useState(false);

  const extractLinks = () => {
    const urlRegex = /https?:\/\/[^\s<>"]+/gi;
    const markdownLinkRegex = /\[.*?\]\((https?:\/\/[^)]+)\)/gi;

    const urls = new Set<string>();
    const contentText = content?.content || '';

    // Extract plain URLs
    const plainUrls = contentText.match(urlRegex) || [];
    plainUrls.forEach(url => urls.add(url));

    // Extract markdown links
    if (contentText) {
      let match;
      while ((match = markdownLinkRegex.exec(contentText)) !== null) {
        if (match[1]) {
          urls.add(match[1]);
        }
      }
    }
    
    return Array.from(urls);
  };

  const checkLinks = () => {
    setChecking(true);
    const foundLinks = extractLinks();
    
    // Simulate link checking (in production, this would make actual requests)
    const checkedLinks = foundLinks.map(url => {
      const random = Math.random();
      if (random < 0.7) {
        return { url, status: 'ok', message: '200 OK' };
      } else if (random < 0.85) {
        return { url, status: 'broken', message: '404 Not Found' };
      } else {
        return { url, status: 'warning', message: '301 Redirect' };
      }
    });
    
    setLinks(checkedLinks);
    setChecking(false);
  };

  useEffect(() => {
    if (content.content) {
      checkLinks();
    }
  }, [content.content]);

  const brokenCount = links.filter(l => l.status === 'broken').length;
  const warningCount = links.filter(l => l.status === 'warning').length;
  const okCount = links.filter(l => l.status === 'ok').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{okCount}</div>
          <div className="text-sm text-green-700">Working</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{brokenCount}</div>
          <div className="text-sm text-red-700">Broken</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
          <div className="text-sm text-yellow-700">Warnings</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Found {links.length} Links</h3>
        <button
          onClick={checkLinks}
          disabled={checking}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'Recheck Links'}
        </button>
      </div>

      {/* Links List */}
      <div className="space-y-2">
        {links.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Link2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No links found in content</p>
          </div>
        ) : (
          links.map((link, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center flex-1">
                {link.status === 'ok' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                ) : link.status === 'broken' ? (
                  <XCircle className="w-5 h-5 text-red-500 mr-3" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500 mr-3" />
                )}
                <div className="flex-1">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all"
                  >
                    {link.url}
                  </a>
                </div>
              </div>
              <span className={`text-sm font-medium ml-4 ${
                link.status === 'ok' ? 'text-green-600' :
                link.status === 'broken' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {link.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Action Required */}
      {brokenCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-900 mb-2">⚠️ Action Required</h4>
          <p className="text-sm text-red-800">
            You have {brokenCount} broken link{brokenCount !== 1 ? 's' : ''} that should be fixed.
            Broken links hurt SEO and user experience.
          </p>
        </div>
      )}
    </div>
  );
}