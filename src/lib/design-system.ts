// Agriko Design System Configuration
// Centralized design tokens for consistent UI across all pages

export const colors = {
  // Primary Actions (Urgency/Shop)
  primary: {
    DEFAULT: '#E53935', // Red
    hover: '#D32F2F',
    light: '#FFEBEE',
    dark: '#C62828',
  },
  // Secondary Actions (Add/Support)
  secondary: {
    DEFAULT: '#388E3C', // Green
    hover: '#2E7D32',
    light: '#E8F5E9',
    dark: '#1B5E20',
  },
  // Accent (Premium/Highlights)
  accent: {
    DEFAULT: '#FBC02D', // Gold/Yellow
    hover: '#F9A825',
    light: '#FFF9C4',
    dark: '#F57F17',
  },
  // Neutral
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  // Background variations
  backgrounds: {
    white: '#FFFFFF',
    cream: '#FFFDF6', // Light beige
    mint: '#F7FBF8', // Faint green
    pearl: '#FAFAF8', // Off-white
  },
};

export const typography = {
  fontFamily: {
    heading: 'var(--font-heading, "Playfair Display", Georgia, serif)',
    body: 'var(--font-body, "Inter", -apple-system, sans-serif)',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
};

export const spacing = {
  section: {
    paddingY: 'py-20', // 80px (5rem)
    paddingX: 'px-4 sm:px-6 lg:px-8',
    gap: 'space-y-16', // 64px between major sections
  },
  card: {
    padding: 'p-6', // 24px
    gap: 'space-y-4', // 16px between card elements
  },
  button: {
    padding: {
      sm: 'px-4 py-2',
      md: 'px-6 py-3',
      lg: 'px-8 py-4',
    },
  },
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  DEFAULT: '0.5rem', // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.25rem',   // 20px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  'glow-primary': '0 0 20px rgba(229, 57, 53, 0.3)',
  'glow-secondary': '0 0 20px rgba(56, 142, 60, 0.3)',
  'glow-accent': '0 0 20px rgba(251, 192, 45, 0.3)',
};

export const icons = {
  detox: '🌿',      // Leaf - Detox/Natural
  immunity: '🛡️',   // Shield - Immunity
  heart: '❤️',       // Heart - Cardiovascular
  rice: '🌾',       // Rice grain - Rice varieties
  hydration: '💧',  // Droplet - Hydration/Antioxidant
  energy: '⚡',     // Lightning - Energy
  wellness: '✨',   // Sparkles - General wellness
  organic: '🌱',    // Seedling - Organic
  farm: '🌻',       // Sunflower - Farm fresh
  quality: '⭐',    // Star - Quality
  location: '📍',   // Pin - Location
  phone: '📞',      // Phone - Contact
  email: '✉️',      // Envelope - Email
  clock: '🕐',      // Clock - Hours
  check: '✅',      // Check - Verified
  info: '💡',       // Lightbulb - Information
  warning: '⚠️',    // Warning - Alert
  cart: '🛒',       // Cart - Shopping
  bag: '🛍️',       // Bag - Shopping
  delivery: '🚚',   // Truck - Delivery
};

// Component styles using the design system
export const componentStyles = {
  card: `
    bg-white
    rounded-xl
    shadow-md
    hover:shadow-lg
    transition-all
    duration-300
    p-6
    border
    border-neutral-100
  `,

  button: {
    base: 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95',
    primary: 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg',
    secondary: 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg',
    outline: 'border-2 border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50',
    ghost: 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100',
  },

  heading: {
    h1: 'text-4xl md:text-5xl lg:text-6xl font-bold',
    h2: 'text-3xl md:text-4xl lg:text-5xl font-bold',
    h3: 'text-2xl md:text-3xl font-bold',
    h4: 'text-xl md:text-2xl font-semibold',
    h5: 'text-lg md:text-xl font-semibold',
    h6: 'text-base md:text-lg font-semibold',
  },

  section: {
    white: 'bg-white',
    cream: 'bg-gradient-to-br from-orange-50/30 to-yellow-50/20',
    mint: 'bg-gradient-to-br from-green-50/30 to-emerald-50/20',
    pearl: 'bg-gradient-to-br from-neutral-50 to-white',
  },
};

// Utility function to get alternating section backgrounds
export const getSectionBackground = (index: number): string => {
  const backgrounds = [
    componentStyles.section.white,
    componentStyles.section.cream,
    componentStyles.section.mint,
    componentStyles.section.pearl,
  ];
  return backgrounds[index % backgrounds.length] || '';
};

// Animation classes
export const animations = {
  fadeIn: 'animate-fade-in',
  fadeInUp: 'animate-fade-in-up',
  fadeInDown: 'animate-fade-in-down',
  fadeInLeft: 'animate-fade-in-left',
  fadeInRight: 'animate-fade-in-right',
  scaleIn: 'animate-scale-in',
  slideInUp: 'animate-slide-in-up',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
};

// Breakpoints for responsive design
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};