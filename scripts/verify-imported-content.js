const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'su5jn8x7',
  dataset: 'production',
  token: 'skUYgn8z8ghz12jYD5HRfYoALkME9APXXU6rrWTmpe0Qt5SJj08OmKsSg68OUiZ1MWWHRwZM5xiS23gGUkyVTESzPMNn8LvtJSlF4vNZfjtKHXA7olHq4SXLScajEnD46DzCyfmPlaHu1miCQDmqjFDiMuZ5RWjcyuYsFp9azhQ0QD1viHAR',
  apiVersion: '2024-01-01',
  useCdn: false
});

async function verifyContent() {
  console.log('📊 Verifying imported content...\n');
  console.log('=' .repeat(60));

  const pages = await client.fetch('*[_type == "page"]{ title, slug, content }');

  const summary = {
    totalPages: pages.length,
    pagesWithContent: 0,
    specialBlocks: {
      heroBlock: 0,
      statisticBlock: 0,
      ctaBlock: 0,
      testimonialBlock: 0,
      galleryBlock: 0,
      contactFormBlock: 0,
      mapBlock: 0,
      storeLocationsBlock: 0
    }
  };

  pages.forEach(page => {
    const content = page.content || [];
    if (content.length > 0) summary.pagesWithContent++;

    const specialBlocks = content.filter(block => block._type !== 'block');
    const textBlocks = content.filter(block => block._type === 'block');

    console.log(`\n📄 ${page.title} (/${page.slug?.current || ''})`);
    console.log(`   Total blocks: ${content.length}`);
    console.log(`   Text blocks: ${textBlocks.length}`);
    console.log(`   Special blocks: ${specialBlocks.length}`);

    if (specialBlocks.length > 0) {
      console.log('   Components:');
      specialBlocks.forEach(block => {
        console.log(`     - ${block._type}`);
        if (summary.specialBlocks[block._type] !== undefined) {
          summary.specialBlocks[block._type]++;
        }
      });
    }
  });

  console.log('\n' + '=' .repeat(60));
  console.log('📈 CONTENT SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total pages: ${summary.totalPages}`);
  console.log(`Pages with content: ${summary.pagesWithContent}`);
  console.log('\n🧩 Special Blocks Imported:');
  Object.entries(summary.specialBlocks).forEach(([type, count]) => {
    if (count > 0) {
      console.log(`  ✅ ${type}: ${count}`);
    }
  });

  console.log('\n✨ Content verification complete!');
  console.log('Visit http://localhost:3001/studio to view and edit content');
}

verifyContent().catch(console.error);