# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern e-commerce application built with Next.js 15, TypeScript, Tailwind CSS, and WooCommerce REST API. The project follows a component-based architecture with server-side rendering and static generation capabilities.

## Technology Stack

- **Frontend Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom color palette
- **Backend**: WooCommerce REST API integration
- **State Management**: React Context for cart management
- **Image Optimization**: Next.js Image component

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Type checking
npm run type-check
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css         # Global Tailwind styles
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Homepage with product grids
│   ├── product/[slug]/     # Dynamic product pages with SEO
│   ├── cart/               # Shopping cart page
│   ├── checkout/           # Checkout flow
│   └── order/[id]/         # Order confirmation pages
├── components/             # Reusable UI components
│   ├── ProductCard.tsx     # Product display component
│   ├── Navbar.tsx          # Navigation with cart indicator
│   ├── CartDrawer.tsx      # Sliding cart sidebar
│   └── Footer.tsx          # Site footer
├── context/                # React Context providers
│   └── CartContext.tsx     # Cart state management
├── lib/                    # Utility functions and API
│   └── woocommerce.ts      # WooCommerce API integration
└── types/                  # TypeScript definitions
    └── woocommerce.ts      # WooCommerce data types
```

## Key Architecture Patterns

### API Integration
- All WooCommerce API calls are centralized in `src/lib/woocommerce.ts`
- Uses environment variables for API credentials
- Includes error handling and response transformation
- Supports ISR (Incremental Static Regeneration) for product pages

### State Management
- Cart state managed via React Context (`CartContext.tsx`)
- Persistent storage using localStorage
- Provides cart operations: add, remove, update quantities
- Global cart state accessible throughout the app

### SEO Optimization
- Dynamic metadata generation using `generateMetadata()`
- Structured data (JSON-LD) for products
- Automatic sitemap generation for product pages
- Open Graph and Twitter Card meta tags

### Styling System
- Tailwind CSS with custom color palette (primary green, secondary orange)
- Mobile-first responsive design
- Reusable utility classes for consistent spacing and typography
- Dark/light theme support ready

## Environment Configuration

Required environment variables:
- `NEXT_PUBLIC_WC_API_URL`: WooCommerce REST API endpoint
- `WC_CONSUMER_KEY`: WooCommerce API consumer key
- `WC_CONSUMER_SECRET`: WooCommerce API consumer secret

## Development Guidelines

### Adding New Pages
1. Create page component in appropriate `app/` directory
2. Include proper TypeScript types
3. Add SEO metadata using `generateMetadata()`
4. Implement loading states and error handling
5. Ensure mobile responsiveness

### API Integration
- Use existing WooCommerce helper functions in `lib/woocommerce.ts`
- Add new API functions following existing patterns
- Include proper error handling and TypeScript types
- Consider caching strategies for performance

### Component Development
- Follow existing component patterns in `components/` directory
- Use TypeScript interfaces for props
- Implement proper accessibility (ARIA labels, keyboard navigation)
- Ensure responsive design with Tailwind classes

### Testing Considerations
- Test cart functionality across page navigation
- Verify API integration with WooCommerce backend
- Check responsive design on multiple screen sizes
- Validate SEO metadata generation

## Common Development Tasks

### Adding New Product Features
1. Update WooCommerce types in `src/types/woocommerce.ts`
2. Add API functions in `src/lib/woocommerce.ts`
3. Create or update UI components
4. Test with cart integration

### Customizing Styling
1. Update Tailwind config for new colors/spacing
2. Modify global styles in `src/app/globals.css`
3. Use existing color palette: primary (green), secondary (orange)
4. Maintain mobile-first responsive approach

### Performance Optimization
- Use Next.js Image component for product images
- Implement ISR for product pages (`revalidate` export)
- Optimize bundle size with dynamic imports
- Cache API responses appropriately

## Integration Points

### WooCommerce Backend
- Products: fetch, search, filter by category
- Orders: create new orders from cart items
- Categories: product categorization
- Images: optimized product image handling

### Cart System
- Client-side cart management with persistence
- Real-time updates across components
- Quantity management and item removal
- Checkout integration

### SEO & Analytics
- Dynamic meta tags for all pages
- Structured data for products
- Performance monitoring ready
- Social media sharing optimization

## Troubleshooting

### Common Issues
1. **API Connection**: Check WooCommerce credentials and CORS settings
2. **Build Errors**: Verify all environment variables are set
3. **Cart Issues**: Clear localStorage if cart state becomes corrupted
4. **Image Loading**: Ensure Next.js image domains are configured

### Debugging Tips
- Use browser dev tools for API request inspection
- Check server logs for WooCommerce API errors
- Verify environment variables in build environment
- Test cart functionality in incognito mode

## Deployment

### Vercel (Recommended)
- Add environment variables to Vercel dashboard
- Configure image domains in `next.config.js`
- Enable ISR for product pages

### Other Platforms
- Ensure Node.js 18+ support
- Set environment variables for production
- Configure build and start scripts
- Enable static file serving
- TESTING METHODOLOGY    - Assume tests are correct when they fail
  - Investigate implementation for root causes first
  - Analyze memory, performance, and security implications
  - Fix implementation before considering test adjustments
  - Document learnings for organizational knowledge
- TESTING METHODOLOGY    - Assume tests are correct when they fail
  - Investigate implementation for root causes first
  - Analyze memory, performance, and security implications
  - Fix implementation before considering test adjustments
  - Document learnings for organizational knowledge
- we will never use sentry, please stop mentioning it.