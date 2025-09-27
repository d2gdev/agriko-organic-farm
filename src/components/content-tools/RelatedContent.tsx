import React, { useState, useEffect } from 'react';
import { Link, RefreshCw, Tag, TrendingUp } from 'lucide-react';

interface RelatedContentProps {
  content: {
    title: string;
    content: string;
    keywords?: string[];
  };
}

export default function RelatedContent({ content }: RelatedContentProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = () => {
    setLoading(true);
    
    // Simulated related content (in production, this would query your database)
    setTimeout(() => {
      const mockSuggestions = [
        {
          id: '1',
          title: 'Organic Farming Best Practices',
          type: 'blog',
          slug: 'organic-farming-best-practices',
          relevanceScore: 92,
          matchedKeywords: ['organic', 'farming', 'sustainable'],
          excerpt: 'Learn the essential techniques for successful organic farming...'
        },
        {
          id: '2',
          title: '5-in-1 Turmeric Blend',
          type: 'product',
          slug: '5in1-turmeric',
          relevanceScore: 85,
          matchedKeywords: ['turmeric', 'health', 'organic'],
          excerpt: 'Our premium turmeric blend with black pepper for maximum absorption...'
        },
        {
          id: '3',
          title: 'Health Benefits of Turmeric',
          type: 'blog',
          slug: 'health-benefits-turmeric',
          relevanceScore: 78,
          matchedKeywords: ['turmeric', 'health', 'benefits'],
          excerpt: 'Discover the scientifically-proven health benefits of turmeric...'
        },
        {
          id: '4',
          title: 'Sustainable Agriculture Guide',
          type: 'page',
          slug: 'sustainable-agriculture',
          relevanceScore: 72,
          matchedKeywords: ['sustainable', 'agriculture'],
          excerpt: 'Our commitment to sustainable and regenerative farming practices...'
        },
        {
          id: '5',
          title: 'Organic Black Rice',
          type: 'product',
          slug: 'organic-black-rice',
          relevanceScore: 65,
          matchedKeywords: ['organic', 'rice'],
          excerpt: 'Premium organic black rice rich in antioxidants...'
        }
      ];
      
      setSuggestions(mockSuggestions);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    if (content.title || content.content) {
      fetchSuggestions();
    }
  }, [content]);

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'blog': return 'bg-blue-100 text-blue-800';
      case 'product': return 'bg-green-100 text-green-800';
      case 'page': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Link className="w-5 h-5 mr-2" />
          Related Content Suggestions
        </h3>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Suggestions List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Finding related content...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Link className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No related content suggestions available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(item.type)}`}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.excerpt}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`font-medium ${getRelevanceColor(item.relevanceScore)}`}>
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      {item.relevanceScore}% relevance
                    </span>
                    <div className="flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-gray-400" />
                      {item.matchedKeywords.map((keyword: string, idx: number) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                  Link
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-2">🤖 AI Insights</h4>
        <div className="space-y-2 text-sm text-purple-800">
          <p>
            <strong>Internal Linking Strategy:</strong> Link to 2-3 related posts to improve SEO and user engagement.
          </p>
          <p>
            <strong>Content Gap:</strong> Consider creating content about "Organic Certification Process" based on keyword analysis.
          </p>
          <p>
            <strong>Product Cross-Sell:</strong> Link to complementary products to increase average order value.
          </p>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Linking Best Practices</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Use descriptive anchor text instead of "click here"</li>
          <li>• Link to content with high relevance scores (≥80%)</li>
          <li>• Balance internal links throughout your content</li>
          <li>• Open external links in new tabs</li>
          <li>• Regularly check for broken links</li>
        </ul>
      </div>
    </div>
  );
}