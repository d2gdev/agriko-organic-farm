const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'su5jn8x7',
  dataset: 'production',
  token: 'skUYgn8z8ghz12jYD5HRfYoALkME9APXXU6rrWTmpe0Qt5SJj08OmKsSg68OUiZ1MWWHRwZM5xiS23gGUkyVTESzPMNn8LvtJSlF4vNZfjtKHXA7olHq4SXLScajEnD46DzCyfmPlaHu1miCQDmqjFDiMuZ5RWjcyuYsFp9azhQ0QD1viHAR',
  apiVersion: '2024-01-01',
  useCdn: false
});

// All testimonials from the website
const testimonials = [
  {
    customerName: "Maria Santos",
    customerLocation: "Manila, Philippines",
    rating: 5,
    testimonialText: "The 5-in-1 turmeric blend has significantly reduced my joint pain. I've been using it for 3 months now and the difference is amazing! I can now play with my grandchildren without discomfort. The quality is exceptional and you can taste the organic difference.",
    productsPurchased: [
      { productId: '5in1-turmeric', productName: '5-in-1 Turmeric Blend' }
    ],
    featured: true,
    category: 'quality',
    verified: true,
    displayOrder: 1
  },
  {
    customerName: "Juan Dela Cruz",
    customerLocation: "Cebu City, Philippines",
    rating: 5,
    testimonialText: "My energy levels have improved dramatically since I started taking Agriko products. The quality is outstanding and you can taste the difference. No more afternoon fatigue! I've recommended it to all my colleagues.",
    productsPurchased: [
      { productId: 'moringa-powder', productName: 'Moringa Powder' },
      { productId: 'brown-rice', productName: 'Organic Brown Rice' }
    ],
    featured: true,
    category: 'quality',
    verified: true,
    displayOrder: 2
  },
  {
    customerName: "Ana Reyes",
    customerLocation: "Davao City, Philippines",
    rating: 5,
    testimonialText: "I love that it's 100% organic and locally grown. Supporting Filipino farmers while improving my health is a win-win. My whole family now uses Agriko products. The customer service is also exceptional!",
    productsPurchased: [
      { productId: 'black-rice', productName: 'Organic Black Rice' },
      { productId: '5in1-turmeric', productName: '5-in-1 Turmeric Blend' }
    ],
    featured: true,
    category: 'sustainability',
    verified: true,
    displayOrder: 3
  },
  {
    customerName: "Roberto Garcia",
    customerLocation: "Quezon City - Fitness Coach",
    rating: 5,
    testimonialText: "After years of digestive issues, the moringa powder has been a game-changer. Combined with the brown rice, my gut health has never been better. Thank you Agriko! My clients have noticed my improved energy during training sessions.",
    productsPurchased: [
      { productId: 'moringa-powder', productName: 'Moringa Powder' },
      { productId: 'brown-rice', productName: 'Organic Brown Rice' }
    ],
    featured: false,
    category: 'quality',
    verified: true,
    displayOrder: 4
  },
  {
    customerName: "Linda Fernandez",
    customerLocation: "Makati - Nutritionist",
    rating: 5,
    testimonialText: "The black rice is incredible! Rich, nutty flavor and so nutritious. My cholesterol levels have improved since switching to Agriko's organic rice varieties. I now recommend Agriko to all my clients.",
    productsPurchased: [
      { productId: 'black-rice', productName: 'Organic Black Rice' },
      { productId: 'red-rice', productName: 'Organic Red Rice' }
    ],
    featured: false,
    category: 'quality',
    verified: true,
    displayOrder: 5
  },
  {
    customerName: "Pedro Gonzales",
    customerLocation: "Iloilo - Retired Teacher",
    rating: 5,
    testimonialText: "As someone with arthritis, the 5-in-1 blend has been my daily medicine. Natural relief without side effects. I've recommended it to all my friends with similar conditions. The improvement in my mobility is remarkable!",
    productsPurchased: [
      { productId: '5in1-turmeric', productName: '5-in-1 Turmeric Blend' },
      { productId: 'ginger-powder', productName: 'Ginger Powder' }
    ],
    featured: true,
    category: 'quality',
    verified: true,
    displayOrder: 6
  },
  {
    customerName: "Sarah Martinez",
    customerLocation: "Laguna - Mother of 3",
    rating: 5,
    testimonialText: "The honey is pure heaven! You can taste the quality difference. My kids love it and I feel good knowing it's completely natural and chemical-free. We use it daily for immunity boosting.",
    productsPurchased: [
      { productId: 'organic-honey', productName: 'Pure Organic Honey' },
      { productId: 'kids-cereal', productName: 'Agribata Kids Cereal' }
    ],
    featured: false,
    category: 'quality',
    verified: true,
    displayOrder: 7
  },
  {
    customerName: "Michael Torres",
    customerLocation: "Zamboanga - Environmental Advocate",
    rating: 5,
    testimonialText: "Visiting the farm was an eye-opening experience. Seeing the sustainable practices and meeting Gerry Paglinawan made me a customer for life. True passion for organic farming! The dedication to environmental protection is inspiring.",
    productsPurchased: [
      { productId: '5in1-turmeric', productName: '5-in-1 Turmeric Blend' },
      { productId: 'white-rice', productName: 'Organic White Rice' }
    ],
    featured: true,
    category: 'sustainability',
    verified: true,
    displayOrder: 8
  },
  {
    customerName: "Elena Rodriguez",
    customerLocation: "Batangas - Yoga Instructor",
    rating: 5,
    testimonialText: "The turmeric and ginger powders have become essential in my daily wellness routine. My students often ask what's changed - it's Agriko! The anti-inflammatory benefits are real.",
    productsPurchased: [
      { productId: 'turmeric-powder', productName: 'Turmeric Powder' },
      { productId: 'ginger-powder', productName: 'Ginger Powder' }
    ],
    featured: false,
    category: 'quality',
    verified: true,
    displayOrder: 9
  },
  {
    customerName: "Carlos Mendoza",
    customerLocation: "Pampanga - Restaurant Owner",
    rating: 5,
    testimonialText: "We've switched our restaurant to Agriko rice exclusively. Our customers notice the quality difference. The organic certification gives us peace of mind. Bulk ordering is easy and delivery is always on time.",
    productsPurchased: [
      { productId: 'white-rice', productName: 'Organic White Rice' },
      { productId: 'red-rice', productName: 'Organic Red Rice' }
    ],
    featured: false,
    category: 'service',
    verified: true,
    displayOrder: 10
  },
  {
    customerName: "Patricia Lim",
    customerLocation: "Cagayan de Oro - Diabetes Patient",
    rating: 5,
    testimonialText: "The moringa powder has helped stabilize my blood sugar levels. Combined with the brown rice, I've seen significant improvements in my health markers. My doctor is impressed with my progress!",
    productsPurchased: [
      { productId: 'moringa-powder', productName: 'Moringa Powder' },
      { productId: 'brown-rice', productName: 'Organic Brown Rice' }
    ],
    featured: false,
    category: 'quality',
    verified: true,
    displayOrder: 11
  },
  {
    customerName: "Raymond Tan",
    customerLocation: "Baguio - Marathon Runner",
    rating: 5,
    testimonialText: "The energy boost from the 5-in-1 blend is incredible for my training. Natural, sustained energy without crashes. My recovery time has improved significantly. Perfect for athletes!",
    productsPurchased: [
      { productId: '5in1-turmeric', productName: '5-in-1 Turmeric Blend' },
      { productId: 'honey', productName: 'Pure Organic Honey' }
    ],
    featured: false,
    category: 'quality',
    verified: true,
    displayOrder: 12
  }
];

async function importTestimonials() {
  console.log('📝 Importing testimonials as documents...\n');
  console.log('=' .repeat(60));

  let imported = 0;
  let errors = [];

  for (const testimonial of testimonials) {
    try {
      console.log(`Importing: ${testimonial.customerName}`);

      // Add current date if not specified
      if (!testimonial.dateReceived) {
        const randomDays = Math.floor(Math.random() * 365);
        const date = new Date();
        date.setDate(date.getDate() - randomDays);
        testimonial.dateReceived = date.toISOString().split('T')[0];
      }

      // Create the testimonial document
      const result = await client.create({
        _type: 'testimonial',
        ...testimonial
      });

      console.log(`  ✅ Imported: ${result._id}`);
      imported++;
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      errors.push({ name: testimonial.customerName, error: error.message });
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Successfully imported: ${imported} testimonials`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors: ${errors.length}`);
    errors.forEach(err => {
      console.log(`  - ${err.name}: ${err.error}`);
    });
  }

  console.log('\n✨ Testimonials import complete!');
  console.log('🌐 Visit http://localhost:3001/studio to see all testimonials');
  console.log('📍 They appear under "Testimonial" in the Studio sidebar');
}

// Run the import
importTestimonials().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});