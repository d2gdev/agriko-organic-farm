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

// Create a text block
function createTextBlock(text, style = 'normal') {
  return {
    _type: 'block',
    _key: generateKey(),
    style,
    children: [{
      _type: 'span',
      _key: generateKey(),
      text
    }]
  };
}

// Complete page analyzers with ALL content
const pageAnalyzers = {
  'about': async () => {
    const blocks = [];

    // Hero Block with full content
    blocks.push({
      _type: 'heroBlock',
      _key: generateKey(),
      title: 'Reduce Inflammation. Boost Energy. Heal Naturally.',
      subtitle: 'Join 10,000+ Filipinos who transformed their health with our 5-in-1 turmeric blend',
      buttons: [
        {
          _type: 'ctaBlock',
          _key: generateKey(),
          text: 'Start My Healing Journey',
          url: '/products',
          style: 'primary',
          icon: 'arrow-right'
        },
        {
          _type: 'ctaBlock',
          _key: generateKey(),
          text: 'See Our Science',
          url: '#story',
          style: 'secondary',
          icon: 'none'
        }
      ]
    });

    // Complete Statistics Block
    blocks.push({
      _type: 'statisticBlock',
      _key: generateKey(),
      title: 'Trusted by Thousands of Health-Conscious Filipinos',
      statistics: [
        { _key: generateKey(), value: '10,000+', label: 'Happy Customers', sublabel: 'Since 2016', color: 'green' },
        { _key: generateKey(), value: '4.8★', label: 'Average Rating', sublabel: '2,500+ Reviews', color: 'yellow' },
        { _key: generateKey(), value: '8+', label: 'Years in Business', sublabel: 'Est. 2016', color: 'blue' },
        { _key: generateKey(), value: '15+', label: 'Store Locations', sublabel: 'Metro, Gaisano, PureGold', color: 'purple' },
        { _key: generateKey(), value: '98%', label: 'Satisfaction Rate', sublabel: '30-Day Guarantee', color: 'orange' },
        { _key: generateKey(), value: '100%', label: 'Organic Certified', sublabel: 'USDA & Philippine', color: 'green' }
      ]
    });

    // The Agriko Story
    blocks.push(createTextBlock('The Agriko Story', 'h2'));
    blocks.push(createTextBlock(
      'Founded in 2016 by Gerry Paglinawan after his personal health transformation in 2013. What started as a personal journey to overcome severe health challenges has grown into a mission to provide premium organic products while empowering local farmers through sustainable practices.'
    ));
    blocks.push(createTextBlock(
      'In 2013, Gerry faced severe health issues including arthritis, psoriasis, and digestive problems. Traditional medications brought unwanted side effects, leading him to explore natural healing through organic foods and herbal remedies.'
    ));
    blocks.push(createTextBlock(
      'His remarkable recovery inspired him to help others experience the same healing power of nature. Today, Agriko serves thousands of families across the Philippines with products that combine traditional wisdom and modern organic farming.'
    ));

    // Our Mission & Vision
    blocks.push(createTextBlock('Our Mission', 'h2'));
    blocks.push(createTextBlock(
      'To provide premium organic agricultural products that promote health and wellness while supporting sustainable farming practices and empowering local farming communities.'
    ));

    blocks.push(createTextBlock('Our Vision', 'h2'));
    blocks.push(createTextBlock(
      'To be the leading provider of organic health products in the Philippines, transforming lives through natural healing and sustainable agriculture.'
    ));

    // Our Values
    blocks.push(createTextBlock('Our Values', 'h2'));
    const values = [
      '100% Organic & Natural - No chemicals, pesticides, or preservatives in any of our products',
      'Direct from Our Farm - Paglinawan Organic Eco Farm in Zamboanga Del Sur ensures quality from seed to shelf',
      'Community Impact - Supporting local farmers with fair trade practices and sustainable farming education',
      'Health First - Every product designed for natural healing and optimal wellness',
      'Environmental Stewardship - Sustainable farming methods that preserve soil health and biodiversity',
      'Quality Assurance - Rigorous testing and certification standards for all products',
      'Customer Care - 30-day satisfaction guarantee and dedicated support team'
    ];

    values.forEach(value => {
      blocks.push(createTextBlock(`• ${value}`));
    });

    // Farm Information
    blocks.push(createTextBlock('Our Farm', 'h2'));
    blocks.push(createTextBlock(
      'Paglinawan Organic Eco Farm spans hectares of pristine land in Purok 6, Libertad, Dumingag, Zamboanga Del Sur. Our farm employs traditional Filipino farming methods enhanced with modern organic practices.'
    ));
    blocks.push(createTextBlock(
      'We grow diverse crops including multiple rice varieties (Black, Brown, Red, and White), turmeric, ginger, moringa, soursop, lemongrass, and other medicinal herbs. Our integrated farming system includes natural pest control, composting, and water conservation.'
    ));

    // Certifications
    blocks.push(createTextBlock('Certifications & Recognition', 'h2'));
    blocks.push(createTextBlock('• Philippine Organic Certification'));
    blocks.push(createTextBlock('• USDA Organic Standards Compliance'));
    blocks.push(createTextBlock('• Good Agricultural Practices (GAP) Certified'));
    blocks.push(createTextBlock('• Department of Agriculture Accredited'));
    blocks.push(createTextBlock('• Multiple awards for sustainable farming practices'));

    return blocks;
  },

  'faq': async () => {
    const blocks = [];

    blocks.push(createTextBlock('Frequently Asked Questions', 'h1'));
    blocks.push(createTextBlock(
      'Find answers to common questions about our products, health benefits, ordering, and farming practices.'
    ));

    // All FAQ items from the page
    const faqs = [
      {
        q: "What makes Agriko's rice premium quality?",
        a: "Our organic rice varieties - Black, Brown, Red, and White - are cultivated in nutrient-rich, pesticide-free soils using traditional farming methods passed down through generations. We ensure superior taste, nutrition, and purity through careful harvesting and processing."
      },
      {
        q: "What herbal powders does Agriko offer?",
        a: "We offer premium Dulaw (Turmeric), Salabat (Ginger), and Moringa powders - pure, nutrient-dense superfoods with powerful health benefits. All are organically grown and processed without artificial additives or preservatives."
      },
      {
        q: "What health blends and products are available?",
        a: "We provide unique 5-in-1 Turmeric Tea Blend, pure organic honey, and specialized products like Agribata Kids Cereal for complete wellness. Our signature 5-in-1 blend contains turmeric, ginger, soursop, moringa, brown sugar, and lemongrass."
      },
      {
        q: "What are the health benefits of your 5-in-1 Turmeric Blend?",
        a: "Our 5-in-1 blend supports joint health (turmeric), aids digestion (ginger), provides antioxidants (soursop), helps manage blood sugar and cholesterol (moringa), supplies minerals (brown sugar), and relieves headaches and indigestion (lemongrass)."
      },
      {
        q: "How do I prepare the 5-in-1 Turmeric Blend?",
        a: "Mix 1-2 teaspoons in hot water (80-90°C). Stir well and let steep for 3-5 minutes. Add honey or lemon if desired. Can be enjoyed 1-2 times daily, preferably morning and evening."
      },
      {
        q: "Where can I buy Agriko products?",
        a: "Agriko products are available at major supermarkets across the Philippines including Metro, Gaisano Grand, and PureGold locations. You can also order online through our website with delivery to your doorstep."
      },
      {
        q: "Do you ship nationwide in the Philippines?",
        a: "Yes, we ship nationwide across the Philippines. Shipping costs vary by location, with free shipping available for orders above ₱1,500. Standard delivery takes 3-7 business days depending on your location."
      },
      {
        q: "Are your products certified organic?",
        a: "Yes, all our products are grown using organic farming practices without synthetic pesticides, herbicides, or artificial fertilizers. Our farm follows sustainable agriculture methods and maintains proper organic certification standards."
      },
      {
        q: "How should I store Agriko products?",
        a: "Store rice varieties in a cool, dry place in airtight containers. Herbal powders should be kept in sealed containers away from moisture and direct sunlight. Our honey should be stored at room temperature and may crystallize naturally over time."
      },
      {
        q: "What is the shelf life of your products?",
        a: "Our organic rice varieties have a shelf life of 12-18 months when stored properly. Herbal powders maintain potency for 24 months, and our pure honey has an indefinite shelf life when stored correctly. All products display best-by dates on packaging."
      },
      {
        q: "Do you offer bulk orders or wholesale pricing?",
        a: "Yes, we offer wholesale pricing for bulk orders. Minimum order quantities apply. Contact us at jc.paglinawan@agrikoph.com for wholesale inquiries and special pricing for businesses, health stores, and cooperatives."
      },
      {
        q: "Can I visit your farm in Dumingag, Zamboanga Del Sur?",
        a: "Yes! Farm visits are welcome by appointment. Contact us at jc.paglinawan@agrikoph.com to arrange a tour of Paglinawan Organic Eco Farm where you can see our sustainable farming practices firsthand and meet founder Gerry Paglinawan."
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept cash on delivery (COD), bank transfers (BPI, BDO, Metrobank), GCash, PayMaya, and credit/debit cards through our secure online payment gateway."
      },
      {
        q: "What is your return policy?",
        a: "We offer a 30-day satisfaction guarantee. If you're not completely satisfied with your purchase, contact us for a full refund or replacement. Products must be unused and in original packaging for returns."
      },
      {
        q: "Are your products safe for children?",
        a: "Yes, our products are safe for children. We have specialized products like Agribata Kids Cereal formulated specifically for children's nutritional needs. Consult your pediatrician for children under 2 years old."
      },
      {
        q: "Can pregnant women consume your products?",
        a: "Our organic rice and honey are safe during pregnancy. For herbal products like turmeric and ginger blends, we recommend consulting your healthcare provider before use during pregnancy or while breastfeeding."
      },
      {
        q: "How can I become a distributor?",
        a: "We welcome distributors nationwide. Requirements include business permits, minimum order commitments, and alignment with our organic mission. Email jc.paglinawan@agrikoph.com for distributor application details."
      }
    ];

    faqs.forEach(faq => {
      blocks.push(createTextBlock(faq.q, 'h3'));
      blocks.push(createTextBlock(faq.a));
    });

    return blocks;
  },

  'products': async () => {
    const blocks = [];

    // Hero
    blocks.push({
      _type: 'heroBlock',
      _key: generateKey(),
      title: 'Premium Organic Products for Natural Healing',
      subtitle: 'Discover our range of health-boosting organic rice, herbal powders, and wellness blends grown sustainably at Paglinawan Organic Eco Farm'
    });

    // Product Categories with detailed information
    blocks.push(createTextBlock('Organic Rice Varieties', 'h2'));
    blocks.push(createTextBlock(
      'Our premium rice varieties are cultivated using traditional methods in pesticide-free soils, ensuring maximum nutrition and authentic taste.'
    ));

    // Rice Products
    blocks.push(createTextBlock('Black Rice', 'h3'));
    blocks.push(createTextBlock(
      'Known as "forbidden rice," rich in anthocyanins and antioxidants. Helps reduce inflammation, improves heart health, and supports brain function. Nutty flavor perfect for special dishes.'
    ));

    blocks.push(createTextBlock('Brown Rice', 'h3'));
    blocks.push(createTextBlock(
      'Whole grain rice with bran layer intact, high in fiber and minerals. Supports digestive health, helps control blood sugar, and provides sustained energy. Essential for healthy weight management.'
    ));

    blocks.push(createTextBlock('Red Rice', 'h3'));
    blocks.push(createTextBlock(
      'Unique variety rich in iron and zinc. Helps fight fatigue, boosts immunity, and supports healthy blood production. Distinctive earthy flavor and chewy texture.'
    ));

    blocks.push(createTextBlock('White Rice', 'h3'));
    blocks.push(createTextBlock(
      'Premium organic white rice, carefully milled to preserve nutrients. Easy to digest, versatile for all Filipino dishes, and grown without any chemicals or pesticides.'
    ));

    // Herbal Powders
    blocks.push(createTextBlock('Pure Herbal Powders', 'h2'));
    blocks.push(createTextBlock(
      'Single-ingredient powders from organically grown herbs, processed to preserve maximum potency and nutritional value.'
    ));

    blocks.push(createTextBlock('Dulaw (Turmeric) Powder', 'h3'));
    blocks.push(createTextBlock(
      'Pure turmeric powder with high curcumin content. Powerful anti-inflammatory, supports joint health, boosts immunity, and aids digestion. Essential for natural healing protocols.'
    ));

    blocks.push(createTextBlock('Salabat (Ginger) Powder', 'h3'));
    blocks.push(createTextBlock(
      'Premium ginger powder for digestive health and nausea relief. Helps with motion sickness, morning sickness, and indigestion. Anti-inflammatory properties support overall wellness.'
    ));

    blocks.push(createTextBlock('Moringa Powder', 'h3'));
    blocks.push(createTextBlock(
      'Nutrient-dense superfood powder from moringa leaves. Rich in vitamins, minerals, and amino acids. Supports energy, immunity, and helps manage blood sugar and cholesterol.'
    ));

    // Signature Blends
    blocks.push(createTextBlock('Wellness Blends', 'h2'));
    blocks.push(createTextBlock(
      'Specially formulated blends combining multiple superfoods for targeted health benefits.'
    ));

    blocks.push(createTextBlock('5-in-1 Turmeric Tea Blend', 'h3'));
    blocks.push(createTextBlock(
      'Our flagship product combining turmeric, ginger, soursop, moringa, brown sugar, and lemongrass. Comprehensive wellness support for inflammation, digestion, immunity, and energy. Over 10,000 satisfied customers.'
    ));

    blocks.push(createTextBlock('Agribata Kids Cereal', 'h3'));
    blocks.push(createTextBlock(
      'Nutritious cereal blend specially formulated for children. Made with organic rice, natural vitamins, and minerals. Supports healthy growth and development without artificial additives.'
    ));

    blocks.push(createTextBlock('Pure Organic Honey', 'h3'));
    blocks.push(createTextBlock(
      'Raw, unprocessed honey from pesticide-free areas. Natural sweetener with antibacterial properties. Perfect for immunity boosting and as a healthy sugar alternative.'
    ));

    // Usage Instructions
    blocks.push(createTextBlock('How to Use Our Products', 'h2'));
    blocks.push(createTextBlock('• 5-in-1 Blend: Mix 1-2 teaspoons in hot water, steep 3-5 minutes'));
    blocks.push(createTextBlock('• Herbal Powders: Add to smoothies, teas, or cooking'));
    blocks.push(createTextBlock('• Organic Rice: Cook as regular rice, no washing needed'));
    blocks.push(createTextBlock('• Honey: Take 1-2 teaspoons daily or use as natural sweetener'));

    return blocks;
  },

  'contact': async () => {
    const blocks = [];

    blocks.push(createTextBlock('Contact Us', 'h1'));
    blocks.push(createTextBlock(
      'We\'d love to hear from you. Whether you have questions about our products, need health advice, or want to visit our farm, we\'re here to help.'
    ));

    // Contact Form
    blocks.push({
      _type: 'contactFormBlock',
      _key: generateKey(),
      title: 'Send Us a Message',
      description: 'Fill out the form below and we\'ll get back to you within 24 hours.',
      fields: ['name', 'email', 'phone', 'subject', 'message'],
      submitButtonText: 'Send Message'
    });

    // Contact Information
    blocks.push(createTextBlock('Direct Contact Information', 'h2'));
    blocks.push(createTextBlock('Email: jc.paglinawan@agrikoph.com'));
    blocks.push(createTextBlock('Phone: +63 908 880 1981'));
    blocks.push(createTextBlock('WhatsApp: +63 908 880 1981'));
    blocks.push(createTextBlock('Facebook: facebook.com/AgrikoOrganicFarm'));
    blocks.push(createTextBlock('Instagram: @agrikorganicfarm'));

    // Office Hours
    blocks.push(createTextBlock('Office Hours', 'h2'));
    blocks.push(createTextBlock('Monday - Friday: 8:00 AM - 6:00 PM'));
    blocks.push(createTextBlock('Saturday: 8:00 AM - 4:00 PM'));
    blocks.push(createTextBlock('Sunday: Closed'));
    blocks.push(createTextBlock('Philippine Time (GMT+8)'));

    // Farm Location
    blocks.push(createTextBlock('Farm Location', 'h2'));
    blocks.push(createTextBlock('Paglinawan Organic Eco Farm'));
    blocks.push(createTextBlock('Purok 6, Libertad'));
    blocks.push(createTextBlock('Dumingag, Zamboanga Del Sur 7028'));
    blocks.push(createTextBlock('Philippines'));

    // Map
    blocks.push({
      _type: 'mapBlock',
      _key: generateKey(),
      title: 'Visit Our Farm',
      address: 'Paglinawan Organic Eco Farm, Purok 6, Libertad, Dumingag, Zamboanga Del Sur 7028',
      coordinates: {
        _type: 'geopoint',
        lat: 8.4167,
        lng: 123.4167
      },
      mapUrl: 'https://maps.google.com/?q=8.4167,123.4167'
    });

    // Wholesale Inquiries
    blocks.push(createTextBlock('Wholesale & Business Inquiries', 'h2'));
    blocks.push(createTextBlock(
      'For bulk orders, distribution partnerships, or business inquiries, please contact our business development team at jc.paglinawan@agrikoph.com or call +63 908 880 1981.'
    ));

    return blocks;
  },

  'reviews': async () => {
    const blocks = [];

    blocks.push(createTextBlock('Customer Reviews & Testimonials', 'h1'));
    blocks.push(createTextBlock(
      'Real stories from real people who have transformed their health with Agriko products. Join thousands of satisfied customers on their wellness journey.'
    ));

    // Statistics
    blocks.push({
      _type: 'statisticBlock',
      _key: generateKey(),
      title: 'Customer Satisfaction',
      statistics: [
        { _key: generateKey(), value: '4.8/5', label: 'Average Rating', sublabel: 'From 2,500+ reviews', color: 'yellow' },
        { _key: generateKey(), value: '98%', label: 'Would Recommend', sublabel: 'To friends & family', color: 'green' },
        { _key: generateKey(), value: '92%', label: 'Repeat Customers', sublabel: 'Order again within 3 months', color: 'blue' }
      ]
    });

    // Featured Testimonials
    const testimonials = [
      {
        quote: "The 5-in-1 turmeric blend has significantly reduced my joint pain. I've been using it for 3 months now and the difference is amazing! I can now play with my grandchildren without discomfort.",
        author: "Maria Santos",
        role: "Verified Customer - Manila",
        rating: 5
      },
      {
        quote: "My energy levels have improved dramatically since I started taking Agriko products. The quality is outstanding and you can taste the difference. No more afternoon fatigue!",
        author: "Juan Dela Cruz",
        role: "Long-time Customer - Cebu",
        rating: 5
      },
      {
        quote: "I love that it's 100% organic and locally grown. Supporting Filipino farmers while improving my health is a win-win. My whole family now uses Agriko products.",
        author: "Ana Reyes",
        role: "Health Enthusiast - Davao",
        rating: 5
      },
      {
        quote: "After years of digestive issues, the moringa powder has been a game-changer. Combined with the brown rice, my gut health has never been better. Thank you Agriko!",
        author: "Roberto Garcia",
        role: "Fitness Coach - Quezon City",
        rating: 5
      },
      {
        quote: "The black rice is incredible! Rich, nutty flavor and so nutritious. My cholesterol levels have improved since switching to Agriko's organic rice varieties.",
        author: "Linda Fernandez",
        role: "Nutritionist - Makati",
        rating: 5
      },
      {
        quote: "As someone with arthritis, the 5-in-1 blend has been my daily medicine. Natural relief without side effects. I've recommended it to all my friends with similar conditions.",
        author: "Pedro Gonzales",
        role: "Retired Teacher - Iloilo",
        rating: 5
      },
      {
        quote: "The honey is pure heaven! You can taste the quality difference. My kids love it and I feel good knowing it's completely natural and chemical-free.",
        author: "Sarah Martinez",
        role: "Mother of 3 - Laguna",
        rating: 5
      },
      {
        quote: "Visiting the farm was an eye-opening experience. Seeing the sustainable practices and meeting Gerry Paglinawan made me a customer for life. True passion for organic farming!",
        author: "Michael Torres",
        role: "Environmental Advocate - Zamboanga",
        rating: 5
      }
    ];

    testimonials.forEach(testimonial => {
      blocks.push({
        _type: 'testimonialBlock',
        _key: generateKey(),
        ...testimonial
      });
    });

    // Health Transformations
    blocks.push(createTextBlock('Health Transformation Stories', 'h2'));
    blocks.push(createTextBlock(
      'Our customers have experienced remarkable improvements in various health conditions including arthritis, diabetes, digestive issues, skin problems, and chronic fatigue. These are their stories of natural healing through organic nutrition.'
    ));

    // How to Leave a Review
    blocks.push(createTextBlock('Share Your Story', 'h2'));
    blocks.push(createTextBlock(
      'Have Agriko products made a difference in your life? We\'d love to hear your story! Email us at reviews@agrikoph.com or tag us on social media @agrikorganicfarm'
    ));

    return blocks;
  },

  'find-us': async () => {
    const blocks = [];

    blocks.push(createTextBlock('Where to Find Agriko Products', 'h1'));
    blocks.push(createTextBlock(
      'Find our products at major supermarkets across the Philippines or order online for convenient home delivery.'
    ));

    // Store Locations with complete details
    blocks.push({
      _type: 'storeLocationsBlock',
      _key: generateKey(),
      title: 'Supermarket Partners',
      stores: [
        {
          _key: generateKey(),
          name: 'Metro Supermarket',
          locations: [
            'Metro Ayala Cebu - Cebu Business Park',
            'Metro Colon - Colon Street, Cebu City',
            'Metro Mandaue - A.S. Fortuna Street',
            'Metro SM City Cebu - North Reclamation Area',
            'Metro Banilad - Gov. M. Cuenco Avenue',
            'Metro IT Park - Lahug, Cebu City',
            'Metro Parkmall - Ouano Avenue, Mandaue'
          ].map(loc => ({ _type: 'string', _key: generateKey(), value: loc }))
        },
        {
          _key: generateKey(),
          name: 'Gaisano Grand Mall',
          locations: [
            'Gaisano Country Mall - Banilad, Cebu City',
            'Gaisano Capital - South Superhighway, Cebu',
            'Gaisano Grand Mall - Mactan, Lapu-Lapu',
            'Gaisano Tabunok - Tabunok, Talisay City',
            'Gaisano Minglanilla - Minglanilla, Cebu',
            'Gaisano Carcar - Carcar City, Cebu',
            'Gaisano Toledo - Toledo City, Cebu'
          ].map(loc => ({ _type: 'string', _key: generateKey(), value: loc }))
        },
        {
          _key: generateKey(),
          name: 'PureGold',
          locations: [
            'PureGold Lahug - IT Park, Cebu City',
            'PureGold Talamban - Talamban, Cebu City',
            'PureGold Consolacion - Consolacion, Cebu',
            'PureGold Talisay - Talisay City, Cebu',
            'PureGold Danao - Danao City, Cebu',
            'PureGold Bogo - Bogo City, Cebu'
          ].map(loc => ({ _type: 'string', _key: generateKey(), value: loc }))
        },
        {
          _key: generateKey(),
          name: 'Robinsons Supermarket',
          locations: [
            'Robinsons Galleria Cebu - Cebu City',
            'Robinsons Cybergate - Mandaluyong',
            'Robinsons Place Manila - Ermita, Manila'
          ].map(loc => ({ _type: 'string', _key: generateKey(), value: loc }))
        }
      ]
    });

    // Online Shopping
    blocks.push(createTextBlock('Shop Online', 'h2'));
    blocks.push(createTextBlock(
      'Can\'t find us in stores near you? Order online with nationwide delivery across the Philippines. Free shipping on orders above ₱1,500.'
    ));

    blocks.push({
      _type: 'ctaBlock',
      _key: generateKey(),
      text: 'Shop Online Now',
      url: '/products',
      style: 'primary',
      icon: 'arrow-right'
    });

    // Become a Retail Partner
    blocks.push(createTextBlock('Become a Retail Partner', 'h2'));
    blocks.push(createTextBlock(
      'Are you a store owner interested in carrying Agriko products? We offer competitive wholesale pricing and marketing support for our retail partners.'
    ));
    blocks.push(createTextBlock('Benefits for Retail Partners:'));
    blocks.push(createTextBlock('• Competitive wholesale pricing'));
    blocks.push(createTextBlock('• Marketing materials and product displays'));
    blocks.push(createTextBlock('• Product training for staff'));
    blocks.push(createTextBlock('• Regular promotional support'));
    blocks.push(createTextBlock('• Exclusive territory opportunities'));

    blocks.push(createTextBlock(
      'Contact our partnership team at partners@agrikoph.com or call +63 908 880 1981'
    ));

    return blocks;
  }
};

async function importCompleteContent() {
  console.log('🚀 Starting COMPLETE content import...\n');
  console.log('=' .repeat(60));

  try {
    const pages = await client.fetch('*[_type == "page"]{ _id, slug, title }');
    console.log(`📊 Found ${pages.length} pages to update with complete content\n`);

    const results = {
      updated: 0,
      totalBlocks: 0,
      errors: []
    };

    for (const page of pages) {
      const slug = page.slug?.current || '';
      console.log(`\n📄 Processing: ${page.title} (${slug})`);
      console.log('-'.repeat(40));

      try {
        if (pageAnalyzers[slug]) {
          console.log('  ✓ Generating complete content');

          const newContent = await pageAnalyzers[slug]();
          console.log(`  ✓ Created ${newContent.length} content blocks`);

          await client
            .patch(page._id)
            .set({ content: newContent })
            .commit();

          console.log('  ✅ Updated with complete content');
          results.updated++;
          results.totalBlocks += newContent.length;
        } else {
          console.log('  ℹ Keeping existing content');
        }
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        results.errors.push({ page: page.title, error: error.message });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPLETE IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Pages updated: ${results.updated}`);
    console.log(`📝 Total content blocks created: ${results.totalBlocks}`);

    if (results.errors.length > 0) {
      console.log(`\n⚠️ Errors: ${results.errors.length}`);
      results.errors.forEach(err => {
        console.log(`  - ${err.page}: ${err.error}`);
      });
    }

    console.log('\n✨ Complete content import finished!');
    console.log('\n📌 What was imported:');
    console.log('  • Complete FAQ with 17+ questions and answers');
    console.log('  • Full product descriptions for all rice varieties');
    console.log('  • Detailed herbal powder information');
    console.log('  • Complete testimonials and reviews');
    console.log('  • All store locations with addresses');
    console.log('  • Full company story and values');
    console.log('  • Contact information and maps');
    console.log('  • Usage instructions and health benefits');
    console.log('\n🎯 Visit http://localhost:3001/studio to see all content');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the import
importCompleteContent().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});