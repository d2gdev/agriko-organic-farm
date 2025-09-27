const { createClient } = require('@sanity/client');

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

// Add keys to content blocks
function addKeysToContent(content) {
  if (!Array.isArray(content)) return content;

  return content.map(block => {
    // Add _key to the block itself
    if (!block._key) {
      block._key = generateKey();
    }

    // Add _key to children if they exist
    if (block.children && Array.isArray(block.children)) {
      block.children = block.children.map(child => {
        if (!child._key) {
          child._key = generateKey();
        }
        return child;
      });
    }

    // Add _key to markDefs if they exist
    if (block.markDefs && Array.isArray(block.markDefs)) {
      block.markDefs = block.markDefs.map(mark => {
        if (!mark._key) {
          mark._key = generateKey();
        }
        return mark;
      });
    }

    return block;
  });
}

async function fixContentKeys() {
  console.log('🔧 Fixing missing keys in page content...\n');

  try {
    // Fetch all pages
    const pages = await client.fetch('*[_type == "page"]');
    console.log(`Found ${pages.length} pages to fix\n`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const page of pages) {
      try {
        console.log(`📄 Processing: ${page.title}`);

        // Check if content exists and needs fixing
        if (!page.content || !Array.isArray(page.content)) {
          console.log('  ⏭️  No content array to fix');
          continue;
        }

        // Add keys to content
        const fixedContent = addKeysToContent(page.content);

        // Update the document
        await client
          .patch(page._id)
          .set({ content: fixedContent })
          .commit();

        console.log('  ✅ Fixed content keys');
        fixedCount++;

      } catch (error) {
        console.error(`  ❌ Error fixing ${page.title}:`, error.message);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Fix Summary:');
    console.log(`✅ Successfully fixed: ${fixedCount} pages`);
    if (errorCount > 0) {
      console.log(`❌ Failed to fix: ${errorCount} pages`);
    }

    console.log('\n✨ Fix complete! Your pages should now be editable in Sanity Studio.');

  } catch (error) {
    console.error('Failed to fetch pages:', error);
    process.exit(1);
  }
}

// Run the fix
fixContentKeys().catch(error => {
  console.error('Fix failed:', error);
  process.exit(1);
});