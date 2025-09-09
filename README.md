# Agriko - Next.js + WooCommerce E-commerce Store

A modern, full-stack e-commerce application built with Next.js 15, TypeScript, Tailwind CSS, and WooCommerce REST API.

## Features

- 🛍️ **Complete E-commerce Solution**: Product listings, cart, checkout, and order management
- 🎨 **Modern UI/UX**: Built with Tailwind CSS and responsive design
- ⚡ **Next.js 15**: Server-side rendering, static generation, and App Router
- 🛒 **WooCommerce Integration**: Full REST API integration for products, orders, and more
- 📱 **Mobile-First**: Responsive design that works on all devices
- 🎯 **SEO Optimized**: Dynamic meta tags, structured data, and sitemap generation
- 🔄 **State Management**: React Context for cart and user state
- 📊 **Performance**: Optimized images, lazy loading, and caching
- 🔐 **Type Safety**: Full TypeScript coverage

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: WooCommerce REST API
- **State Management**: React Context
- **Image Optimization**: Next.js Image component
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- WooCommerce store with REST API enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd agriko
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your WooCommerce credentials:
```env
NEXT_PUBLIC_WC_API_URL=https://your-store.com/wp-json/wc/v3
WC_CONSUMER_KEY=your_consumer_key
WC_CONSUMER_SECRET=your_consumer_secret
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   ├── product/[slug]/     # Product pages
│   ├── cart/               # Cart page
│   ├── checkout/           # Checkout page
│   └── order/[id]/         # Order confirmation
├── components/             # Reusable UI components
│   ├── ProductCard.tsx     # Product card component
│   ├── Navbar.tsx          # Navigation bar
│   ├── CartDrawer.tsx      # Shopping cart drawer
│   └── Footer.tsx          # Footer component
├── context/                # React Context providers
│   └── CartContext.tsx     # Cart state management
├── lib/                    # Utility functions
│   └── woocommerce.ts      # WooCommerce API helpers
└── types/                  # TypeScript type definitions
    └── woocommerce.ts      # WooCommerce types
```

## Key Pages

### Homepage (`/`)
- Hero section with call-to-action
- Featured products grid
- Latest products showcase
- Company features and benefits

### Product Page (`/product/[slug]`)
- Product image gallery
- Detailed product information
- Add to cart functionality
- Related products
- SEO optimization with structured data

### Cart Page (`/cart`)
- Cart items with quantity controls
- Order summary
- Responsive design for mobile and desktop

### Checkout Page (`/checkout`)
- Billing and shipping forms
- Payment method selection
- Order review and confirmation

### Order Confirmation (`/order/[id]`)
- Order details and status
- Billing and shipping information
- Payment method details

## WooCommerce Integration

The application integrates with WooCommerce using the REST API v3. Key integrations include:

- **Products**: Fetch, search, and filter products
- **Categories**: Product categorization
- **Cart**: Client-side cart management
- **Orders**: Create and retrieve orders
- **Images**: Optimized product images

## Styling and Design

The application uses Tailwind CSS for styling with a custom color palette:

- **Primary**: Green tones for agricultural theme
- **Secondary**: Orange accents for calls-to-action
- **Responsive**: Mobile-first approach with breakpoints
- **Components**: Modular and reusable component library

## Performance Optimization

- **ISR**: Incremental Static Regeneration for product pages
- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Automatic code splitting with App Router
- **Caching**: Strategic caching for API requests
- **Bundle Analysis**: Optimized bundle size

## SEO Features

- **Dynamic Meta Tags**: Automatic generation for all pages
- **Open Graph**: Social media sharing optimization
- **Structured Data**: JSON-LD for products and organization
- **Sitemap**: Automatic sitemap generation
- **Performance**: Core Web Vitals optimization

## Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Deployment (New Git-based System)
npm run deploy       # Complete deployment (build + Git + upload)
npm run deploy:full  # Deployment with quality checks
```

## 🚀 Deployment (Git-Based System)

### Quick Deployment
```bash
npm run deploy
```

**What this does:**
1. Builds the static site locally
2. Commits & pushes changes to Git
3. Uploads files directly to the server

### Available Deployment Commands
- `npm run deploy` - Complete deployment
- `npm run deploy:full` - With linting and type-checking  
- `npm run deploy:git` - Push source to Git only
- `npm run deploy:files` - Upload files only

### Server Details
- **Server:** 143.42.189.57
- **Document Root:** `/var/www/shop/`
- **Repository:** `github.com/d2gdev/agriko-organic-farm`

### Documentation
- **Quick Guide:** `HOW_TO_DEPLOY.md`
- **Detailed Guide:** `DEPLOYMENT_GIT.md`
- **Image Optimization:** `IMAGE_OPTIMIZATION_AUTOMATED.md`

### Legacy Deployment Options

**Vercel (Alternative)**
1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

**Other Platforms**
- Netlify, AWS Amplify, Railway, DigitalOcean App Platform

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_WC_API_URL` | WooCommerce REST API URL | Yes |
| `WC_CONSUMER_KEY` | WooCommerce consumer key | Yes |
| `WC_CONSUMER_SECRET` | WooCommerce consumer secret | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Acknowledgments

- Next.js team for the excellent framework
- WooCommerce for the robust e-commerce platform
- Tailwind CSS for the utility-first CSS framework# Deployment test Tue, Sep  9, 2025  9:33:59 AM
# SSH key fixed Tue, Sep  9, 2025 10:01:22 AM
# Deployment Test
