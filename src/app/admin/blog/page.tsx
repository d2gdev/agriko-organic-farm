'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  BookOpen,
  Search,
  ExternalLink,
  Bot,
  User,
  Calendar,
  Eye,
  Edit,
  BarChart3,
  Zap
} from 'lucide-react';

interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  author?: { name: string };
  publishedAt?: string;
  aiGenerated: boolean;
  excerpt?: string;
  categories?: Array<{ title: string }>;
  syncedToSemanticDb: boolean;
  relatedProducts?: Array<{ productId: string; relevanceScore: number }>;
}

export default function BlogManagementPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, ai, human
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    aiGenerated: 0,
    synced: 0
  });

  // Mock data for demonstration
  useEffect(() => {
    // In a real app, you'd fetch from your Sanity API
    const mockPosts: BlogPost[] = [
      {
        _id: '1',
        title: 'Growing Tomatoes Organically',
        slug: { current: 'growing-tomatoes-organically' },
        author: { name: 'AI Assistant' },
        publishedAt: '2025-01-25',
        aiGenerated: true,
        excerpt: 'Learn the best practices for growing healthy, organic tomatoes in your garden.',
        categories: [{ title: 'Gardening Tips' }],
        syncedToSemanticDb: true,
        relatedProducts: [
          { productId: '123', relevanceScore: 0.8 },
          { productId: '456', relevanceScore: 0.6 }
        ]
      },
      {
        _id: '2',
        title: 'Composting for Beginners',
        slug: { current: 'composting-for-beginners' },
        publishedAt: '2025-01-24',
        aiGenerated: true,
        excerpt: 'A complete guide to starting your first compost bin.',
        categories: [{ title: 'Sustainability' }],
        syncedToSemanticDb: false,
        relatedProducts: [
          { productId: '789', relevanceScore: 0.7 }
        ]
      }
    ];

    setTimeout(() => {
      setPosts(mockPosts);
      setStats({
        total: mockPosts.length,
        published: mockPosts.filter(p => p.publishedAt).length,
        drafts: mockPosts.filter(p => !p.publishedAt).length,
        aiGenerated: mockPosts.filter(p => p.aiGenerated).length,
        synced: mockPosts.filter(p => p.syncedToSemanticDb).length
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleGenerateAIContent = async () => {
    const topic = prompt('Enter a topic for AI content generation:');
    if (!topic) return;

    try {
      const response = await fetch('/api/ai-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, tone: 'friendly' })
      });

      if (response.ok) {
        alert('AI content generation started! Check Sanity Studio for the new draft.');
      } else {
        alert('Failed to generate AI content. Check the console for details.');
      }
    } catch (error) {
      alert('Error generating AI content: ' + error);
    }
  };

  const handleTestBlogSystem = async () => {
    try {
      const response = await fetch('/api/blog/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_blog_post_creation' })
      });

      const result = await response.json();
      if (result.success) {
        alert('Blog system test successful! Check the console for details.');
      } else {
        alert('Blog system test failed: ' + result.error);
      }
    } catch (error) {
      alert('Error testing blog system: ' + error);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' ||
      (filterType === 'ai' && post.aiGenerated) ||
      (filterType === 'human' && !post.aiGenerated);
    return matchesSearch && matchesFilter;
  });

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BookOpen className="w-6 h-6 mr-2" />
                Blog Management
              </h1>
              <p className="text-gray-600 mt-1">Manage your blog content and AI generation</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleTestBlogSystem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Test System
              </button>
              <button
                onClick={handleGenerateAIContent}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
              >
                <Bot className="w-4 h-4 mr-2" />
                Generate AI Content
              </button>
              <a
                href="http://localhost:3333"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Sanity Studio
              </a>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-orange-600">{stats.drafts}</p>
              </div>
              <Edit className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Generated</p>
                <p className="text-2xl font-bold text-purple-600">{stats.aiGenerated}</p>
              </div>
              <Bot className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Synced</p>
                <p className="text-2xl font-bold text-blue-600">{stats.synced}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search blog posts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Posts</option>
            <option value="ai">AI Generated</option>
            <option value="human">Human Written</option>
          </select>
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sync Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Loading blog posts...
                    </td>
                  </tr>
                ) : filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No blog posts found. {searchTerm && 'Try adjusting your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr key={post._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{post.title}</div>
                            <div className="text-sm text-gray-500">{post.slug.current}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {post.aiGenerated ? (
                            <Bot className="w-4 h-4 text-purple-600 mr-2" />
                          ) : (
                            <User className="w-4 h-4 text-blue-600 mr-2" />
                          )}
                          <span className="text-sm text-gray-900">
                            {post.author?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          post.publishedAt
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {post.publishedAt ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.publishedAt ? (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          post.syncedToSemanticDb
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {post.syncedToSemanticDb ? 'Synced' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <a
                            href={`http://localhost:3333/desk/blogPost;${post._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </a>
                          <button className="text-green-600 hover:text-green-900">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start">
              <ExternalLink className="w-4 h-4 text-blue-600 mt-0.5 mr-2" />
              <div>
                <strong>Open Sanity Studio:</strong> Access the full content management system at localhost:3333
              </div>
            </div>
            <div className="flex items-start">
              <Bot className="w-4 h-4 text-purple-600 mt-0.5 mr-2" />
              <div>
                <strong>Generate AI Content:</strong> Create new blog posts using AI with the Deepseek API
              </div>
            </div>
            <div className="flex items-start">
              <Zap className="w-4 h-4 text-blue-600 mt-0.5 mr-2" />
              <div>
                <strong>Auto-Sync:</strong> Blog posts automatically sync to your semantic database (Qdrant + Memgraph)
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}