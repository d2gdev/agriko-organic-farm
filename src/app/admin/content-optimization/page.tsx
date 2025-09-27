'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import {
  Search,
  Share2,
  BarChart3,
  Link2,
  Image,
  Clock,
  Sparkles,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  Target,
  Zap
} from 'lucide-react';

// Import content tools components
import SEOAnalyzer from '@/components/content-tools/SEOAnalyzer';
import SocialMediaPreview from '@/components/content-tools/SocialMediaPreview';
import ContentScorer from '@/components/content-tools/ContentScorer';
import LinkChecker from '@/components/content-tools/LinkChecker';
import ImageOptimizer from '@/components/content-tools/ImageOptimizer';
import RelatedContent from '@/components/content-tools/RelatedContent';

interface ContentData {
  title: string;
  content: string;
  excerpt: string;
  url?: string;
  image?: string;
  keywords?: string[];
  author?: string;
  publishDate?: string;
}

export default function ContentOptimizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('seo');
  const [contentData, setContentData] = useState<ContentData>({
    title: '',
    content: '',
    excerpt: '',
    keywords: []
  });
  const [analysisMode, setAnalysisMode] = useState<'url' | 'paste' | 'sanity'>('paste');
  const [contentUrl, setContentUrl] = useState('');
  const [sanityPosts, setSanityPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    setLoading(false);

    // Fetch Sanity posts if available
    fetchSanityPosts();
  }, [router]);

  const fetchSanityPosts = async () => {
    try {
      const response = await fetch('/api/blog/posts');
      if (response.ok) {
        const data = await response.json();
        setSanityPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to fetch Sanity posts:', error);
    }
  };

  const analyzeContent = async () => {
    if (analysisMode === 'url' && contentUrl) {
      // Fetch content from URL
      try {
        const response = await fetch('/api/content/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: contentUrl })
        });
        if (response.ok) {
          const data = await response.json();
          setContentData(data);
        }
      } catch (error) {
        console.error('Failed to analyze URL:', error);
      }
    } else if (analysisMode === 'sanity' && selectedPost) {
      // Load selected Sanity post
      const post = sanityPosts.find(p => p._id === selectedPost);
      if (post) {
        setContentData({
          title: post.title || '',
          content: post.content || '',
          excerpt: post.excerpt || '',
          keywords: post.seo?.metaKeywords || [],
          author: post.author?.name || '',
          publishDate: post.publishedAt || ''
        });
      }
    }
  };

  const tabs = [
    { id: 'seo', label: 'SEO Analyzer', icon: Search },
    { id: 'social', label: 'Social Preview', icon: Share2 },
    { id: 'score', label: 'Content Score', icon: BarChart3 },
    { id: 'links', label: 'Link Checker', icon: Link2 },
    { id: 'images', label: 'Image Optimizer', icon: Image },
    { id: 'related', label: 'Related Content', icon: Sparkles }
  ];

  const stats = [
    { label: 'SEO Score', value: '85%', icon: Target, color: 'text-green-600' },
    { label: 'Readability', value: 'Good', icon: Eye, color: 'text-blue-600' },
    { label: 'Word Count', value: '1,250', icon: FileText, color: 'text-purple-600' },
    { label: 'Est. Read Time', value: '5 min', icon: Clock, color: 'text-orange-600' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-yellow-500" />
                Content Optimization Tools
              </h1>
              <p className="text-gray-600 mt-1">
                Analyze and optimize your content for SEO, social media, and user engagement
              </p>
            </div>
          </div>
        </div>

        {/* Content Input Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Source</h3>

          {/* Mode Selection */}
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setAnalysisMode('paste')}
              className={`px-4 py-2 rounded-lg font-medium ${
                analysisMode === 'paste'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Paste Content
            </button>
            <button
              onClick={() => setAnalysisMode('url')}
              className={`px-4 py-2 rounded-lg font-medium ${
                analysisMode === 'url'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Analyze URL
            </button>
            <button
              onClick={() => setAnalysisMode('sanity')}
              className={`px-4 py-2 rounded-lg font-medium ${
                analysisMode === 'sanity'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sanity Posts
            </button>
          </div>

          {/* Input Fields */}
          {analysisMode === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={contentData.title}
                  onChange={(e) => setContentData({ ...contentData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your content title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={contentData.content}
                  onChange={(e) => setContentData({ ...contentData, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste your content here..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <textarea
                  value={contentData.excerpt}
                  onChange={(e) => setContentData({ ...contentData, excerpt: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter meta description"
                />
              </div>
            </div>
          )}

          {analysisMode === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL to Analyze
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/blog-post"
                />
                <button
                  onClick={analyzeContent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Analyze
                </button>
              </div>
            </div>
          )}

          {analysisMode === 'sanity' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Post from Sanity
              </label>
              <div className="flex space-x-2">
                <select
                  value={selectedPost}
                  onChange={(e) => setSelectedPost(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a post...</option>
                  {sanityPosts.map((post) => (
                    <option key={post._id} value={post._id}>
                      {post.title} {post.publishedAt && `(${new Date(post.publishedAt).toLocaleDateString()})`}
                    </option>
                  ))}
                </select>
                <button
                  onClick={analyzeContent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={!selectedPost}
                >
                  Load Post
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {contentData.content && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {contentData.content ? (
              <>
                {activeTab === 'seo' && <SEOAnalyzer content={contentData} />}
                {activeTab === 'social' && <SocialMediaPreview content={contentData} />}
                {activeTab === 'score' && <ContentScorer content={contentData} />}
                {activeTab === 'links' && <LinkChecker content={contentData} />}
                {activeTab === 'images' && <ImageOptimizer content={contentData} />}
                {activeTab === 'related' && <RelatedContent content={contentData} />}
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Enter content above to start analyzing
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div className="flex items-start">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <strong>Step 1:</strong> Choose your content source - paste directly, analyze a URL, or select from Sanity
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <strong>Step 2:</strong> Review the analysis across different optimization areas using the tabs
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <strong>Step 3:</strong> Apply recommendations to improve SEO, readability, and engagement
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}