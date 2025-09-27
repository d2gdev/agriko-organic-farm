import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { sanityClient, singleBlogPostQuery } from '@/lib/sanity';
import { urlFor } from '@/lib/sanity';
import Image from 'next/image';
import Link from 'next/link';
import BlogContent from '@/components/BlogContent';
import { logger } from '@/lib/logger';
import { SanityBlogPost } from '@/types/sanity';

// Use the proper Sanity blog post type
type BlogPost = SanityBlogPost;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getBlogPost(slug: string): Promise<{ post: BlogPost | null; error?: string }> {
  try {
    const post = await sanityClient.fetch(singleBlogPostQuery, { slug });
    return { post: post || null };
  } catch (error) {
    logger.error('Failed to fetch blog post:', error as Record<string, unknown>);
    return {
      post: null,
      error: error instanceof Error ? error.message : 'Failed to load blog post'
    };
  }
}

function BlogPostSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          <div className="h-4 bg-gray-300 rounded-full w-16"></div>
          <div className="h-4 bg-gray-300 rounded-full w-20"></div>
        </div>
        <div className="h-10 bg-gray-300 rounded mb-4"></div>
        <div className="h-4 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-6"></div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            <div>
              <div className="h-4 bg-gray-300 rounded w-20 mb-1"></div>
              <div className="h-3 bg-gray-300 rounded w-16"></div>
            </div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-24"></div>
        </div>
      </div>

      {/* Image skeleton */}
      <div className="aspect-video bg-gray-300 rounded-lg mb-8"></div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        <div className="h-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded w-4/6"></div>
      </div>
    </div>
  );
}

async function BlogPostContent({ slug }: { slug: string }) {
  const { post, error } = await getBlogPost(slug);

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Error Loading Post</h1>
        <p className="text-gray-600 max-w-md mx-auto mb-4">
          We encountered an issue while loading this blog post. Please try refreshing the page.
        </p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  return (
    <>
      {/* Header */}
      <header className="mb-8">
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories.map((category) => (
              <Link
                key={category.slug.current}
                href={`/blog/category/${category.slug.current}`}
                className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                style={category.color ? { backgroundColor: category.color + '20', color: category.color } : undefined}
              >
                {category.title}
              </Link>
            ))}
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-y border-gray-200">
          {post.author && (
            <div className="flex items-center space-x-3">
              {post.author.image && (
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={urlFor(post.author.image).width(40).height(40).url()}
                    alt={post.author.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{post.author.name}</p>
                <p className="text-sm text-gray-600">Author</p>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <time dateTime={post.publishedAt}>
              Published {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
            {post.aiGenerated && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                AI-Assisted
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.mainImage && (
        <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
          <Image
            src={urlFor(post.mainImage).width(1200).height(675).url()}
            alt={post.title}
            fill
            className="object-cover"
            priority
            placeholder="blur"
            blurDataURL={urlFor(post.mainImage).width(20).height(12).blur(10).quality(10).url()}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
        </div>
      )}

      {/* Article Content */}
      <article className="mb-12">
        <BlogContent content={post.body} />
      </article>

      {/* Author Bio */}
      {post.author && post.author.bio && (
        <div className="border-t border-gray-200 pt-8 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">About the Author</h3>
          <div className="flex items-start space-x-4">
            {post.author.image && (
              <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={urlFor(post.author.image).width(64).height(64).url()}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{post.author.name}</h4>
              <p className="text-gray-600 leading-relaxed">{post.author.bio}</p>
            </div>
          </div>
        </div>
      )}

      {/* Back to Blog */}
      <div className="border-t border-gray-200 pt-8">
        <Link
          href="/blog"
          className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors"
        >
          ← Back to Blog
        </Link>
      </div>
    </>
  );
}

export default async function BlogPostPage({ params }: PageProps) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-white">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-green-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        Skip to main content
      </a>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <main id="main-content" role="main" aria-label="Blog post content">
          <Suspense fallback={<BlogPostSkeleton />}>
            <BlogPostContent slug={resolvedParams.slug} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const { post } = await getBlogPost(resolvedParams.slug);

  if (!post) {
    return {
      title: 'Post Not Found | Agriko Blog',
      description: 'The requested blog post could not be found.',
      robots: 'noindex, nofollow',
    };
  }

  // Use environment variable for domain, fallback to localhost for development
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const canonical = `${baseUrl}/blog/${post.slug.current}`;
  const imageUrl = post.mainImage ? urlFor(post.mainImage).width(1200).height(630).url() : undefined;

  return {
    title: `${post.title} | Agriko Blog`,
    description: post.seo?.metaDescription || post.excerpt || `Read ${post.title} on the Agriko blog.`,
    keywords: post.seo?.metaKeywords?.join(', ') || undefined,
    robots: post.seo?.noIndex ? 'noindex, nofollow' : 'index, follow',
    canonical,
    alternates: {
      canonical,
    },
    authors: post.author ? [{ name: post.author.name }] : undefined,
    publisher: 'Agriko Organic Farm',
    openGraph: {
      title: post.title,
      description: post.seo?.metaDescription || post.excerpt || `Read ${post.title} on the Agriko blog.`,
      type: 'article',
      url: canonical,
      siteName: 'Agriko Blog',
      publishedTime: post.publishedAt,
      modifiedTime: post.publishedAt,
      authors: post.author ? [post.author.name] : undefined,
      section: post.categories?.[0]?.title || 'General',
      tags: post.categories?.map(cat => cat.title) || undefined,
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
          type: 'image/jpeg',
        }
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@agrikofarm', // TODO: Replace with actual Twitter handle
      creator: post.author?.name || '@agrikofarm',
      title: post.title,
      description: post.seo?.metaDescription || post.excerpt,
      images: imageUrl ? [
        {
          url: imageUrl,
          alt: post.title,
        }
      ] : undefined,
    },
    // Removed hardcoded social media URLs - should be configurable
    other: {
      'article:author': post.author?.name || 'Agriko Team',
      'article:published_time': post.publishedAt,
      'article:modified_time': post.publishedAt,
      'article:section': post.categories?.[0]?.title || 'General',
      'article:tag': post.categories?.map(cat => cat.title).join(',') || undefined,
    },
  };
}