const { createClient } = require('@sanity/client');
const fs = require('fs').promises;
const path = require('path');

// Sanity client configuration
const client = createClient({
  projectId: 'su5jn8x7',
  dataset: 'production',
  token: 'skUYgn8z8ghz12jYD5HRfYoALkME9APXXU6rrWTmpe0Qt5SJj08OmKsSg68OUiZ1MWWHRwZM5xiS23gGUkyVTESzPMNn8LvtJSlF4vNZfjtKHXA7olHq4SXLScajEnD46DzCyfmPlaHu1miCQDmqjFDiMuZ5RWjcyuYsFp9azhQ0QD1viHAR',
  apiVersion: '2024-01-01',
  useCdn: false
});

// Page configurations - mapping Next.js pages to Sanity page types
const pageConfigs = {
  'about': {
    title: 'About Us',
    pageType: 'about',
    description: 'Learn about Agriko Philippines and our mission to provide quality agricultural products.',
    path: 'src/app/about/page.tsx'
  },
  'contact': {
    title: 'Contact Us',
    pageType: 'contact',
    description: 'Get in touch with Agriko Philippines for inquiries and support.',
    path: 'src/app/contact/page.tsx'
  },
  'privacy': {
    title: 'Privacy Policy',
    pageType: 'privacy',
    description: 'Our privacy policy outlines how we handle your personal information.',
    path: 'src/app/privacy/page.tsx'
  },
  'terms': {
    title: 'Terms of Service',
    pageType: 'terms',
    description: 'Terms and conditions for using Agriko Philippines services.',
    path: 'src/app/terms/page.tsx'
  },
  'products': {
    title: 'Our Products',
    pageType: 'general',
    description: 'Browse our selection of premium agricultural products.',
    path: 'src/app/products/page.tsx'
  },
  'faq': {
    title: 'Frequently Asked Questions',
    pageType: 'general',
    description: 'Find answers to common questions about our products and services.',
    path: 'src/app/faq/page.tsx'
  },
  'find-us': {
    title: 'Where to Find Us',
    pageType: 'general',
    description: 'Discover where to purchase Agriko products in stores near you.',
    path: 'src/app/find-us/page.tsx'
  },
  'farm': {
    title: 'Our Farm',
    pageType: 'general',
    description: 'Learn about our sustainable farming practices and facilities.',
    path: 'src/app/farm/page.tsx'
  },
  'events': {
    title: 'Events',
    pageType: 'general',
    description: 'Stay updated on Agriko events and activities.',
    path: 'src/app/events/page.tsx'
  },
  'reviews': {
    title: 'Customer Reviews',
    pageType: 'general',
    description: 'Read what our customers say about Agriko products.',
    path: 'src/app/reviews/page.tsx'
  },
  'cookies': {
    title: 'Cookie Policy',
    pageType: 'general',
    description: 'Learn how we use cookies on our website.',
    path: 'src/app/cookies/page.tsx'
  }
};

// Extract text content from JSX file
async function extractContentFromFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');

    // Extract key information from the file
    const extractedContent = [];

    // Extract title if present
    const titleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (titleMatch) {
      extractedContent.push({
        _type: 'block',
        style: 'h1',
        children: [{
          _type: 'span',
          text: titleMatch[1].replace(/<[^>]*>/g, '').trim()
        }]
      });
    }

    // Extract paragraphs
    const paragraphMatches = content.matchAll(/<p[^>]*>([^<]+)<\/p>/gi);
    for (const match of paragraphMatches) {
      const text = match[1].replace(/<[^>]*>/g, '').trim();
      if (text && text.length > 20) { // Only include substantial paragraphs
        extractedContent.push({
          _type: 'block',
          style: 'normal',
          children: [{
            _type: 'span',
            text: text
          }]
        });
      }
    }

    // Extract section headings
    const headingMatches = content.matchAll(/<h[2-3][^>]*>([^<]+)<\/h[2-3]>/gi);
    for (const match of headingMatches) {
      const text = match[1].replace(/<[^>]*>/g, '').trim();
      if (text) {
        extractedContent.push({
          _type: 'block',
          style: 'h2',
          children: [{
            _type: 'span',
            text: text
          }]
        });
      }
    }

    return extractedContent.slice(0, 10); // Limit to first 10 blocks for now
  } catch (error) {
    console.error(`Error extracting content from ${filePath}:`, error);
    return [];
  }
}

// Create Sanity page document
async function createSanityPage(slug, config) {
  const content = await extractContentFromFile(config.path);

  const document = {
    _type: 'page',
    title: config.title,
    slug: {
      current: slug
    },
    pageType: config.pageType,
    status: 'published',
    publishedAt: new Date().toISOString(),
    seo: {
      metaDescription: config.description,
      metaKeywords: [slug, 'agriko', 'philippines', config.pageType]
    },
    heroSection: {
      title: config.title,
      subtitle: config.description
    },
    content: content.length > 0 ? content : [
      {
        _type: 'block',
        style: 'normal',
        children: [{
          _type: 'span',
          text: config.description
        }]
      }
    ]
  };

  return document;
}

// Main migration function
async function migratePages() {
  console.log('🚀 Starting page migration to Sanity...\n');

  const results = {
    success: [],
    failed: []
  };

  for (const [slug, config] of Object.entries(pageConfigs)) {
    try {
      console.log(`📄 Processing: ${config.title}`);

      // Check if file exists
      const filePath = path.join(process.cwd(), config.path);
      try {
        await fs.access(filePath);
      } catch {
        console.log(`  ⚠️  File not found: ${config.path}`);
        continue;
      }

      // Create Sanity document
      const document = await createSanityPage(slug, config);

      // Upload to Sanity
      const result = await client.create(document);

      console.log(`  ✅ Successfully created page with ID: ${result._id}`);
      results.success.push(config.title);

    } catch (error) {
      console.error(`  ❌ Failed to migrate ${config.title}:`, error.message);
      results.failed.push(config.title);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`✅ Successfully migrated: ${results.success.length} pages`);
  if (results.success.length > 0) {
    results.success.forEach(title => console.log(`   - ${title}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed to migrate: ${results.failed.length} pages`);
    results.failed.forEach(title => console.log(`   - ${title}`));
  }

  console.log('\n✨ Migration complete! Check your Sanity Studio to see the imported pages.');
  console.log('   Visit: http://localhost:3001/studio');
}

// Run migration
migratePages().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});