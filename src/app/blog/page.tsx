import { Suspense } from 'react';
import { sanityClient, blogPostQuery } from '@/lib/sanity';
import Link from 'next/link';
import Image from 'next/image';
import { urlFor } from '@/lib/sanity';
import { logger } from '@/lib/logger';
import { SanityBlogPost } from '@/types/sanity';

// Blog post type for listing (subset of full blog post)
interface BlogPost {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  excerpt?: string;
  publishedAt: string;
  mainImage?: SanityBlogPost['mainImage'];
  author?: SanityBlogPost['author'];
  categories?: SanityBlogPost['categories'];
  aiGenerated?: boolean;
}

// Enhanced blog card with modern design
function BlogCard({ post }: { post: BlogPost }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const readingTime = post.excerpt ? Math.ceil(post.excerpt.length / 250) : 2;

  return (
    <article className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-green-100/50 hover:-translate-y-1 transition-all duration-300 ease-out">
      {/* Image with overlay gradient */}
      {post.mainImage && (
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={urlFor(post.mainImage).width(500).height(312).url()}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

          {/* AI badge on image */}
          {post.aiGenerated && (
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/90 text-white backdrop-blur-sm">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" />
                </svg>
                AI Enhanced
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Categories */}
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories.slice(0, 2).map((category) => (
              <span
                key={category.slug.current}
                className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
              >
                {category.title}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-600 transition-colors">
          <Link href={`/blog/${post.slug.current}`}>
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Author and metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {post.author?.image ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-green-100">
                <Image
                  src={urlFor(post.author.image).width(40).height(40).url()}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-semibold text-sm">
                  {post.author?.name?.charAt(0) || 'A'}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {post.author?.name || 'Agriko Team'}
              </p>
              <div className="flex items-center text-xs text-gray-500 space-x-2">
                <time dateTime={post.publishedAt}>
                  {formatDate(post.publishedAt)}
                </time>
                <span>•</span>
                <span>{readingTime} min read</span>
              </div>
            </div>
          </div>

          {/* Read more arrow */}
          <Link
            href={`/blog/${post.slug.current}`}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300"
            aria-label={`Read ${post.title}`}
          >
            <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

// Enhanced loading skeleton matching new design
function BlogCardSkeleton() {
  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[16/10] bg-gray-200"></div>

      <div className="p-6">
        {/* Category badges skeleton */}
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-24"></div>
        </div>

        {/* Title skeleton */}
        <div className="mb-3">
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-4/5"></div>
        </div>

        {/* Excerpt skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>

        {/* Author and metadata skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </article>
  );
}

async function getBlogPosts(): Promise<{ posts: BlogPost[]; error?: string }> {
  try {
    const posts = await sanityClient.fetch(blogPostQuery);
    return { posts: posts || [] };
  } catch (error) {
    logger.error('Failed to fetch blog posts:', error as Record<string, unknown>);
    return {
      posts: [],
      error: error instanceof Error ? error.message : 'Failed to load blog posts'
    };
  }
}

async function BlogPostsGrid() {
  const { posts, error } = await getBlogPosts();

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Posts</h2>
        <p className="text-gray-600 max-w-md mx-auto mb-4">
          We encountered an issue while loading the blog posts. Please try refreshing the page.
        </p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Blog Posts Yet</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          We&apos;re working on creating amazing content for you. Check back soon for insightful articles about organic farming, sustainability, and healthy living.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <BlogCard key={post._id} post={post} />
      ))}
    </div>
  );
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-green-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        Skip to main content
      </a>

      {/* Enhanced Header Section */}
      <header className="relative bg-white border-b border-gray-100" role="banner">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 via-transparent to-green-600/5" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {/* Breadcrumb */}
            <nav className="flex justify-center mb-8" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                  <Link href="/" className="hover:text-green-600 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li className="text-green-600 font-medium">Blog</li>
              </ol>
            </nav>

            {/* Main Header */}
            <div className="mb-8">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-gray-900 bg-clip-text text-transparent mb-6 leading-tight py-2">
                Agricultural Insights
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                Expert knowledge, sustainable practices, and innovative farming techniques
                to help you grow better, naturally.
              </p>
            </div>

            {/* Stats */}
            <div className="flex justify-center space-x-8 text-center">
              <div className="px-4 py-2 bg-white/80 rounded-xl backdrop-blur-sm border border-gray-100">
                <div className="text-2xl font-bold text-green-600">50+</div>
                <div className="text-sm text-gray-600">Expert Articles</div>
              </div>
              <div className="px-4 py-2 bg-white/80 rounded-xl backdrop-blur-sm border border-gray-100">
                <div className="text-2xl font-bold text-green-600">10k+</div>
                <div className="text-sm text-gray-600">Readers</div>
              </div>
              <div className="px-4 py-2 bg-white/80 rounded-xl backdrop-blur-sm border border-gray-100">
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-sm text-gray-600">Organic Focus</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search and Filter Bar */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">Latest Articles</h2>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Updated Weekly
              </span>
            </div>

            {/* Search and filters could go here */}
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500">
                📚 Knowledge that grows with you
              </div>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-label="Loading blog posts">
              {Array.from({ length: 6 }).map((_, i) => (
                <BlogCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <BlogPostsGrid />
        </Suspense>

        {/* Newsletter Signup CTA */}
        <div className="mt-20 text-center">
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
            <p className="text-green-100 mb-6">
              Get the latest farming tips and sustainable agriculture insights delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button className="px-6 py-3 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


export const metadata = {
  title: 'Blog | Agriko - Organic Farming & Sustainability',
  description: 'Discover insights on organic farming, sustainable agriculture, and healthy living from Agriko experts and community.',
  keywords: 'organic farming, sustainable agriculture, healthy living, eco-friendly, pesticide-free, farm-to-table',
  robots: 'index, follow',
};