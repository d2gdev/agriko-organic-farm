# UI Testing Guide for Agriko E-commerce

This guide provides various approaches to test your Agriko e-commerce application's user interface.

## 🔧 Current Status
- **Dev Server**: Running on http://localhost:3000 or http://localhost:3003
- **Recent Changes**: Black button in hero section with white text
- **Images**: Fixed loading issues

## 1. 🖱️ Manual Testing (Immediate)

### Quick Visual Tests
1. **Open in Browser**: http://localhost:3000 (or 3003)
2. **Test Hero Section**:
   - ✅ First button (orange/accent color)
   - ✅ Second button (should be BLACK with WHITE text)
   - ✅ Button hover effects
3. **Product Images**: Should load without opacity issues
4. **Responsive Design**: Test on different screen sizes
5. **Interactive Elements**: Cart, navigation, product cards

### Browser Dev Tools Testing
```javascript
// Open browser console and run:

// 1. Check button styles
const heroButtons = document.querySelectorAll('section button, section a button');
console.log('Hero buttons found:', heroButtons.length);
heroButtons.forEach((btn, i) => {
  console.log(`Button ${i}:`, {
    background: getComputedStyle(btn).backgroundColor,
    color: getComputedStyle(btn).color,
    text: btn.textContent.trim()
  });
});

// 2. Check image loading
const images = document.querySelectorAll('img');
console.log('Images found:', images.length);
console.log('Failed images:', [...images].filter(img => !img.complete || img.naturalHeight === 0));

// 3. Check responsive breakpoints
console.log('Viewport:', {
  width: window.innerWidth,
  height: window.innerHeight,
  isMobile: window.innerWidth < 768,
  isTablet: window.innerWidth >= 768 && window.innerWidth < 1024
});
```

## 2. 🧪 Automated Testing Options

### A. Basic Health Check (Current)
```bash
node test-ui-simple.js
```

### B. Advanced Testing Setup

#### Install Testing Dependencies
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

#### Add to package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ui": "node scripts/test-ui-basic.js"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"]
  }
}
```

### C. Component Testing Example
Create `__tests__/Button.test.js`:
```javascript
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../src/components/Button';

describe('Button Component', () => {
  test('renders with correct classes', () => {
    render(<Button variant="secondary">Test Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-white', 'border-2', 'border-primary-600');
  });

  test('applies custom className overrides', () => {
    render(
      <Button 
        variant="secondary" 
        className="!bg-black !text-white"
      >
        Black Button
      </Button>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('!bg-black', '!text-white');
  });
});
```

## 3. 🚀 E2E Testing (Advanced)

### Playwright Setup
```bash
npm install --save-dev @playwright/test
npx playwright install
```

#### E2E Test Example
Create `tests/hero-section.spec.js`:
```javascript
import { test, expect } from '@playwright/test';

test('hero section has correct button styles', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Wait for page to load
  await page.waitForSelector('section');
  
  // Find hero buttons
  const buttons = await page.locator('section button, section a button').all();
  
  if (buttons.length >= 2) {
    // Second button should be black
    const secondButton = buttons[1];
    const backgroundColor = await secondButton.evaluate(el => 
      getComputedStyle(el).backgroundColor
    );
    
    // RGB for black is rgb(0, 0, 0)
    expect(backgroundColor).toContain('rgb(0, 0, 0)');
  }
});

test('product images load correctly', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Wait for images to load
  await page.waitForLoadState('networkidle');
  
  // Check for broken images
  const images = await page.locator('img').all();
  for (const img of images) {
    const naturalWidth = await img.evaluate(el => el.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  }
});
```

## 4. 📱 Mobile Testing

### Device Simulation (Chrome DevTools)
1. Open DevTools (F12)
2. Click device toggle (📱 icon)
3. Test common devices:
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - Galaxy S20 (360x800)

### Touch Target Testing
```javascript
// Check touch target sizes (should be 44px+)
const interactiveElements = document.querySelectorAll('button, a, input, [role="button"]');
interactiveElements.forEach(el => {
  const rect = el.getBoundingClientRect();
  if (rect.width < 44 || rect.height < 44) {
    console.warn('Small touch target:', el, `${rect.width}x${rect.height}`);
  }
});
```

## 5. 🎨 Visual Regression Testing

### Percy (Visual Testing Platform)
```bash
npm install --save-dev @percy/cli @percy/playwright
```

### Storybook for Component Testing
```bash
npx storybook@latest init
```

## 6. ⚡ Performance Testing

### Lighthouse CLI
```bash
npm install -g lighthouse
lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html
```

### Core Web Vitals Check
```javascript
// Add to your page for real-time monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## 7. 🔧 Accessibility Testing

### axe-core Testing
```bash
npm install --save-dev @axe-core/playwright
```

```javascript
import { injectAxe, checkA11y } from '@axe-core/playwright';

test('accessibility check', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await injectAxe(page);
  await checkA11y(page);
});
```

## 8. 📊 Testing Checklist

### ✅ Manual Testing Checklist
- [ ] Hero section buttons (colors, hover effects)
- [ ] Product images load correctly
- [ ] Navigation works on all screen sizes
- [ ] Cart functionality
- [ ] Product card interactions
- [ ] Form submissions
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Touch targets (44px minimum)

### ✅ Automated Testing Checklist
- [ ] Component unit tests
- [ ] Integration tests for API calls
- [ ] E2E user flows
- [ ] Visual regression tests
- [ ] Performance tests
- [ ] Accessibility tests

## 9. 🚀 Quick Start Commands

```bash
# Start development server
npm run dev

# Run basic UI health check
node test-ui-simple.js

# Install and run Playwright tests
npm install --save-dev @playwright/test
npx playwright install
npx playwright test

# Run Lighthouse performance test
npx lighthouse http://localhost:3000

# Check accessibility
npx axe http://localhost:3000
```

## 10. 🎯 Recommended Testing Strategy

### For Current Development:
1. **Manual testing** in browser (immediate feedback)
2. **Browser DevTools** for debugging
3. **Basic health checks** with Node.js scripts

### For Production Readiness:
1. **Unit tests** for components
2. **E2E tests** for critical user flows
3. **Performance monitoring** with Lighthouse
4. **Visual regression** testing for design consistency

## 🔗 Useful Resources

- [Testing Library Docs](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [axe Accessibility Testing](https://www.deque.com/axe/)
- [Web Vitals](https://web.dev/vitals/)

---

**Current Priority**: Test the black button in hero section manually at http://localhost:3000