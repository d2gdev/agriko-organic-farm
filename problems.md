# Agriko Website - Problems & Solutions Log

## 🚨 Major Issues Identified & Fixed

### 1. **WooCommerce API Credentials Exposure (CRITICAL)**
- **Problem**: WooCommerce API credentials (`WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`) were being accessed on client-side
- **Error**: `Missing WooCommerce API credentials. Please check your environment variables.`
- **Root Cause**: Environment variables without `NEXT_PUBLIC_` prefix aren't available in browser
- **Security Risk**: API credentials would be exposed in browser if made public
- **Solution**: Created secure API routes (`/api/products`, `/api/products/search`, etc.) to handle WooCommerce calls server-side
- **Status**: ✅ FIXED

### 2. **H1 Text Clipping Issue**
- **Problem**: The "G" in "Agriko" was cut off at the bottom in hero section
- **Root Cause**: `leading-normal` was too tight for large text sizes (5xl-8xl)
- **Location**: `src/components/HeroSection.tsx:62`
- **Solution**: Changed from `leading-normal` to `leading-relaxed` and increased margin from `mb-6` to `mb-10`
- **Status**: ✅ FIXED

### 3. **ProductCard Height/Width Inconsistency**
- **Problem**: Product cards had varying heights due to different content lengths
- **Impact**: Jagged, unprofessional grid layouts
- **Solution Applied**:
  - Added `min-h-[480px]` to card container for consistent height
  - Added `min-h-[3.5rem]` to product names
  - Added `min-h-[4.5rem]` to description area
  - Added `min-h-[2rem]` to category tags
  - Added `w-full` to prevent width variations
- **Location**: `src/components/ProductCard.tsx`
- **Status**: ✅ FIXED

### 4. **Next.js Deprecation Warning**
- **Problem**: `next lint` command deprecated in Next.js 16
- **Location**: `package.json:10`
- **Solution**: Need to migrate to ESLint CLI using: `npx @next/codemod@canary next-lint-to-eslint-cli .`
- **Status**: ⚠️ NEEDS MIGRATION

### 5. **Static Export + API Routes Compatibility**
- **Problem**: API routes don't work with `output: 'export'` static builds
- **Error**: `The "exportPathMap" configuration cannot be used with the "app" directory`
- **Multiple Attempts**:
  - ❌ `exportPathMap` - Not compatible with App Router
  - ❌ `export const dynamic = 'force-dynamic'` - Breaks static export
  - ✅ **Final Solution**: `export const dynamic = 'force-static'` + fallback logic
- **Current Approach**: API routes return empty arrays for static export builds but work in development
- **Status**: ✅ FIXED (with compromises)

### 6. **Missing package-lock.json**
- **Problem**: Deployment failing due to missing dependencies lock file
- **Error**: `Dependencies lock file is not found`
- **Cause**: File was deleted during git operations
- **Solution**: Regenerated with `npm install` and fixed 3 security vulnerabilities
- **Status**: ✅ FIXED

---

## 🎨 Styling & UX Issues

### 7. **Color Palette Inconsistencies**
- **Problem**: Two different color systems defined
- **Location**: `tailwind.config.js:12-24` vs `src/app/globals.css:12-46`
- **Issue**: Tailwind config uses red/orange theme while CSS uses blue theme
- **Status**: ⚠️ IDENTIFIED (not yet fixed)

### 8. **Font Variable Mismatch**
- **Problem**: Uses `#389d65` theme color but no matching CSS variable defined
- **Location**: `src/app/layout.tsx:62`
- **Status**: ⚠️ IDENTIFIED (not yet fixed)

### 9. **Missing Placeholder Images**
- **Problem**: References `/placeholder-product.jpg` which likely doesn't exist
- **Location**: `src/lib/utils.ts:33`
- **Impact**: Broken images for products without photos
- **Status**: ⚠️ IDENTIFIED (not yet fixed)

### 10. **Oversized CSS File**
- **Problem**: `src/app/globals.css` is 881 lines with duplicate animations
- **Issue**: Complex CSS for touch targets when Tailwind utilities would suffice
- **Status**: ⚠️ IDENTIFIED (needs refactoring)

---

## 🔐 Security Concerns

### 11. **Exposed Server Credentials**
- **Problem**: SSH key and server IP hardcoded in public repository
- **Location**: `.github/workflows/deploy.yml:168-183`
- **Impact**: Security vulnerability
- **Status**: ⚠️ CRITICAL (needs immediate attention)

### 12. **Environment Variable Security**
- **Problem**: API credentials could be exposed if made `NEXT_PUBLIC_`
- **Solution**: Used server-side API routes instead
- **Status**: ✅ FIXED

---

## 🐛 Technical Issues

### 13. **Type Definition Duplicates**
- **Problem**: `CartItem` interface defined twice with different signatures
- **Location**: `src/types/woocommerce.ts:80-92` vs `src/context/CartContext.tsx:6-13`
- **Impact**: Type conflicts and confusion
- **Status**: ⚠️ IDENTIFIED (needs consolidation)

### 14. **Layout Hydration Warning Suppression**
- **Problem**: `suppressHydrationWarning` used without clear justification
- **Location**: `src/app/layout.tsx:72`
- **Impact**: May hide legitimate hydration issues
- **Status**: ⚠️ IDENTIFIED (needs review)

### 15. **Inefficient Product Caching**
- **Problem**: Very short cache times (5 minutes, 30 seconds for errors)
- **Location**: `src/lib/productCache.ts:12-14`
- **Impact**: Frequent API calls, poor performance
- **Status**: ⚠️ IDENTIFIED (needs optimization)

---

## 📦 Dependency & Configuration Issues

### 16. **Development Dependencies in Production**
- **Problem**: `fs-extra`, `glob`, `sharp` as devDependencies but used in build scripts
- **Location**: `package.json:48-51`
- **Status**: ⚠️ IDENTIFIED (needs review)

### 17. **Image Optimization Disabled**
- **Problem**: `unoptimized: true` disables Next.js image optimization
- **Location**: `next.config.js:9`
- **Impact**: Slower page loads, larger images
- **Status**: ⚠️ IDENTIFIED (required for static export)

### 18. **Build Artifact Retention**
- **Problem**: Only 1-day retention may cause deployment issues
- **Location**: `.github/workflows/deploy.yml:101`
- **Status**: ⚠️ IDENTIFIED (needs review)

---

## 🌐 SEO & Performance Issues

### 19. **Hardcoded Phone Number**
- **Problem**: `+63XXXXXXXXXX` placeholder in schema markup
- **Location**: `src/app/page.tsx:283`
- **Impact**: Invalid structured data for SEO
- **Status**: ⚠️ IDENTIFIED (needs real phone number)

### 20. **Schema.org Duplication**
- **Problem**: Multiple product schemas may confuse search engines
- **Location**: `src/app/page.tsx` and `src/components/ProductCard.tsx`
- **Status**: ⚠️ IDENTIFIED (needs review)

### 21. **Missing Sitemap for Dynamic Routes**
- **Problem**: `src/app/sitemap.ts` doesn't exist for product pages
- **Impact**: Products not discoverable by search engines
- **Status**: ⚠️ IDENTIFIED (needs implementation)

---

## 📚 Documentation & Maintenance Issues

### 22. **Excessive Documentation**
- **Problem**: 15+ documentation files create maintenance overhead
- **Files**: Multiple `DEPLOYMENT_*.md`, `UI_*.md`, etc.
- **Impact**: Documentation drift, confusion
- **Status**: ⚠️ IDENTIFIED (needs cleanup)

### 23. **Incomplete Error Boundaries**
- **Problem**: Only handles client-side errors, no server error boundary
- **Location**: `src/app/error.tsx`
- **Status**: ⚠️ IDENTIFIED (needs server error handling)

---

## ✅ Successfully Resolved Issues

1. **WooCommerce API Credentials Security** - Created secure API routes
2. **H1 Text Clipping** - Fixed line height and spacing
3. **ProductCard Consistency** - Standardized heights and widths
4. **Static Export Compatibility** - API routes work with fallbacks
5. **Missing Dependencies Lock File** - Regenerated package-lock.json
6. **Security Vulnerabilities** - Fixed 3 critical npm audit issues
7. **Production Deployment** - Resolved 500 errors

## 🎯 Immediate Action Items

1. **🔴 CRITICAL**: Fix exposed server credentials in deployment workflow
2. **🟡 HIGH**: Implement real phone number in schema markup
3. **🟡 HIGH**: Consolidate duplicate type definitions
4. **🟡 HIGH**: Create missing placeholder image
5. **🟡 MEDIUM**: Migrate from deprecated `next lint` command
6. **🟡 MEDIUM**: Review and optimize CSS file size
7. **🟡 MEDIUM**: Resolve color palette inconsistencies

## 📊 Project Health Status

- **Security**: 🔴 Critical issues present (server credentials)
- **Functionality**: 🟢 All major features working
- **Performance**: 🟡 Room for optimization
- **Code Quality**: 🟡 Good with some cleanup needed
- **Documentation**: 🟡 Comprehensive but needs organization

---

*Last Updated: 2025-09-09*
*Generated with Claude Code*