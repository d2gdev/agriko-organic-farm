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

// Generate a random key
function generateKey() {
  return Math.random().toString(36).substr(2, 9);
}

// Extract comprehensive content from JSX file
async function extractFullContent(filePath, pageTitle) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const extractedContent = [];

    // Add page title as first heading
    extractedContent.push({
      _type: 'block',
      _key: generateKey(),
      style: 'h1',
      children: [{
        _type: 'span',
        _key: generateKey(),
        text: pageTitle
      }]
    });

    // Extract all text content with better regex patterns
    const patterns = [
      // H1 headings
      {
        regex: /<h1[^>]*>([^<]+(?:<[^>]+>[^<]+)*)<\/h1>/gi,
        style: 'h1'
      },
      // H2 headings
      {
        regex: /<h2[^>]*>([^<]+(?:<[^>]+>[^<]+)*)<\/h2>/gi,
        style: 'h2'
      },
      // H3 headings
      {
        regex: /<h3[^>]*>([^<]+(?:<[^>]+>[^<]+)*)<\/h3>/gi,
        style: 'h3'
      },
      // Paragraphs
      {
        regex: /<p[^>]*>([^<]+(?:<[^>]+>[^<]+)*)<\/p>/gi,
        style: 'normal'
      },
      // List items
      {
        regex: /<li[^>]*>([^<]+(?:<[^>]+>[^<]+)*)<\/li>/gi,
        style: 'normal',
        prefix: '• '
      },
      // Divs with text content
      {
        regex: /<div[^>]*className="[^"]*text-[^"]*"[^>]*>([^<]+)<\/div>/gi,
        style: 'normal'
      },
      // Spans with meaningful text
      {
        regex: /<span[^>]*>([^<]{20,})<\/span>/gi,
        style: 'normal'
      }
    ];

    // Process each pattern
    patterns.forEach(({ regex, style, prefix = '' }) => {
      const matches = content.matchAll(regex);
      for (const match of matches) {
        let text = match[1]
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\{[^}]*\}/g, '') // Remove JSX expressions
          .replace(/className="[^"]*"/g, '') // Remove className attributes
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();

        if (text && text.length > 10 && !text.includes('{') && !text.includes('(') && !text.includes('=>')) {
          extractedContent.push({
            _type: 'block',
            _key: generateKey(),
            style: style,
            children: [{
              _type: 'span',
              _key: generateKey(),
              text: prefix + text
            }]
          });
        }
      }
    });

    // Look for specific content sections
    const sectionPatterns = [
      { keyword: 'About', description: 'Company information and history' },
      { keyword: 'Mission', description: 'Our mission and values' },
      { keyword: 'Vision', description: 'Our vision for the future' },
      { keyword: 'Products', description: 'Our product offerings' },
      { keyword: 'Services', description: 'Services we provide' },
      { keyword: 'Contact', description: 'Contact information' },
      { keyword: 'Story', description: 'Our story and journey' },
      { keyword: 'Team', description: 'Our team members' },
      { keyword: 'Farm', description: 'Our farming practices' },
      { keyword: 'Organic', description: 'Organic certification and practices' },
      { keyword: 'Health', description: 'Health benefits and information' },
      { keyword: 'Reviews', description: 'Customer testimonials' },
      { keyword: 'FAQ', description: 'Frequently asked questions' },
      { keyword: 'Privacy', description: 'Privacy policy information' },
      { keyword: 'Terms', description: 'Terms and conditions' }
    ];

    // Add metadata about sections found
    const foundSections = sectionPatterns.filter(section =>
      content.toLowerCase().includes(section.keyword.toLowerCase())
    );

    if (foundSections.length > 0) {
      extractedContent.push({
        _type: 'block',
        _key: generateKey(),
        style: 'h2',
        children: [{
          _type: 'span',
          _key: generateKey(),
          text: 'Page Sections'
        }]
      });

      foundSections.forEach(section => {
        extractedContent.push({
          _type: 'block',
          _key: generateKey(),
          style: 'normal',
          children: [{
            _type: 'span',
            _key: generateKey(),
            text: `• ${section.keyword}: ${section.description}`
          }]
        });
      });
    }

    // Extract metadata from the file
    const metadataMatch = content.match(/export async function generateMetadata[^}]*description:\s*['"`]([^'"`]+)['"`]/);
    if (metadataMatch) {
      extractedContent.push({
        _type: 'block',
        _key: generateKey(),
        style: 'h2',
        children: [{
          _type: 'span',
          _key: generateKey(),
          text: 'Page Description'
        }]
      });
      extractedContent.push({
        _type: 'block',
        _key: generateKey(),
        style: 'normal',
        children: [{
          _type: 'span',
          _key: generateKey(),
          text: metadataMatch[1]
        }]
      });
    }

    // Remove duplicates (based on text content)
    const seen = new Set();
    const uniqueContent = extractedContent.filter(block => {
      const text = block.children[0].text;
      if (seen.has(text)) {
        return false;
      }
      seen.add(text);
      return true;
    });

    return uniqueContent.length > 0 ? uniqueContent : [{
      _type: 'block',
      _key: generateKey(),
      style: 'normal',
      children: [{
        _type: 'span',
        _key: generateKey(),
        text: 'Page content will be added here. This page contains complex React components that need to be manually reviewed and converted to content blocks.'
      }]
    }];
  } catch (error) {
    console.error(`Error extracting content from ${filePath}:`, error);
    return [{
      _type: 'block',
      _key: generateKey(),
      style: 'normal',
      children: [{
        _type: 'span',
        _key: generateKey(),
        text: 'Content extraction failed. Please review the original page file.'
      }]
    }];
  }
}

async function updatePageContent() {
  console.log('📚 Extracting FULL content from pages...\n');

  try {
    // Fetch all pages
    const pages = await client.fetch('*[_type == "page"]');
    console.log(`Found ${pages.length} pages to update\n`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const page of pages) {
      try {
        console.log(`📄 Processing: ${page.title}`);

        // Determine the file path based on slug
        const slug = page.slug?.current || '';
        const possiblePaths = [
          `src/app/${slug}/page.tsx`,
          `src/app/${slug.replace('-', '')}/page.tsx`,
          `src/app/${slug.replace('-', '/')}/page.tsx`
        ];

        let filePath = null;
        for (const testPath of possiblePaths) {
          try {
            await fs.access(path.join(process.cwd(), testPath));
            filePath = testPath;
            break;
          } catch {
            // File doesn't exist, try next
          }
        }

        if (!filePath) {
          console.log(`  ⚠️  Could not find source file for ${slug}`);
          continue;
        }

        // Extract comprehensive content
        const fullContent = await extractFullContent(
          path.join(process.cwd(), filePath),
          page.title
        );

        console.log(`  📝 Extracted ${fullContent.length} content blocks`);

        // Update the document with full content
        await client
          .patch(page._id)
          .set({
            content: fullContent,
            _updatedAt: new Date().toISOString()
          })
          .commit();

        console.log(`  ✅ Updated with full content`);
        updatedCount++;

      } catch (error) {
        console.error(`  ❌ Error updating ${page.title}:`, error.message);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} pages`);
    if (errorCount > 0) {
      console.log(`❌ Failed to update: ${errorCount} pages`);
    }

    console.log('\n✨ Full content extraction complete!');
    console.log('\n📝 Note: Your pages contain complex React components.');
    console.log('   For best results, you should:');
    console.log('   1. Review each page in Sanity Studio');
    console.log('   2. Add images manually through the Studio');
    console.log('   3. Format content blocks as needed');
    console.log('   4. Add any missing sections or components');

  } catch (error) {
    console.error('Failed to fetch pages:', error);
    process.exit(1);
  }
}

// Run the update
updatePageContent().catch(error => {
  console.error('Update failed:', error);
  process.exit(1);
});