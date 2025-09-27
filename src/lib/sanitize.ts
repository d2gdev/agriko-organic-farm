import DOMPurify from 'isomorphic-dompurify';

import { logger } from '@/lib/logger';

// Default sanitization options for different content types
const DEFAULT_OPTIONS: SanitizeOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 'i', 'b',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'a', 'img'
  ],
  allowedAttributes: {
    '*': ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'width', 'height']
  },
  ADD_ATTR: ['target', 'rel'],
  FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link', 'meta', 'style'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  FORCE_BODY: false,
};

// Strict sanitization for user-generated content
const STRICT_OPTIONS: SanitizeOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'i', 'b'],
  allowedAttributes: {},
  KEEP_CONTENT: true,
  SANITIZE_DOM: true,
};

// Very permissive for admin content (still safe)
const PERMISSIVE_OPTIONS: SanitizeOptions = {
  ...DEFAULT_OPTIONS,
  allowedTags: [
    ...(DEFAULT_OPTIONS.allowedTags || []),
    'div', 'span', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
    'dl', 'dt', 'dd', 'figure', 'figcaption'
  ],
  allowedAttributes: {
    ...(DEFAULT_OPTIONS.allowedAttributes || {}),
    '*': [...(DEFAULT_OPTIONS.allowedAttributes?.['*'] || []), 'style'],
    'data-*': []
  },
};

// Text-only sanitization (strips all HTML)
const TEXT_ONLY_OPTIONS: SanitizeOptions = {
  allowedTags: [],
  allowedAttributes: {},
  KEEP_CONTENT: true,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  allowedSchemes?: string[];
  allowedIframeHostnames?: string[];
  transformTags?: Record<string, string | ((tagName: string, attribs: Record<string, string>) => { tagName: string; attribs: Record<string, string> })>;
  KEEP_CONTENT?: boolean;
  SANITIZE_DOM?: boolean;
  FORBID_TAGS?: string[];
  FORBID_ATTR?: string[];
  ADD_ATTR?: string[];
  RETURN_DOM?: boolean;
  RETURN_DOM_FRAGMENT?: boolean;
  RETURN_DOM_IMPORT?: boolean;
  WHOLE_DOCUMENT?: boolean;
  FORCE_BODY?: boolean;
}

// Add a specific type for DOMPurify config
interface DOMPurifyConfig extends SanitizeOptions {}

export function sanitizeHtml(
  html: string, 
  options: 'default' | 'strict' | 'permissive' | 'textOnly' | SanitizeOptions = 'default'
): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let config: SanitizeOptions;
  
  switch (options) {
    case 'strict':
      config = STRICT_OPTIONS;
      break;
    case 'permissive':
      config = PERMISSIVE_OPTIONS;
      break;
    case 'textOnly':
      config = TEXT_ONLY_OPTIONS;
      break;
    case 'default':
      config = DEFAULT_OPTIONS;
      break;
    default:
      config = { ...DEFAULT_OPTIONS, ...(typeof options === 'object' ? options : {}) } as SanitizeOptions;
  }

  try {
    // Use the specific DOMPurifyConfig type instead of any
    const sanitized = DOMPurify.sanitize(html, config as DOMPurifyConfig);
    return sanitized;
  } catch (error) {
    logger.error('HTML sanitization error:', error as Record<string, unknown>);
    // Return empty string on error for security
    return '';
  }
}

/**
 * Common typo corrections for product descriptions
 */
function correctCommonTypos(text: string): string {
  const corrections: Record<string, string> = {
    'descirptions': 'descriptions',
    'descirption': 'description',
    'reccomend': 'recommend',
    'reccomended': 'recommended',
    'occassion': 'occasion',
    'seperate': 'separate',
    'teh': 'the',
    'adn': 'and',
    'orgainc': 'organic',
    'benifits': 'benefits',
    'benifit': 'benefit',
    'flavour': 'flavor',
    'colour': 'color',
    'favourite': 'favorite'
  };

  let correctedText = text;
  for (const [typo, correction] of Object.entries(corrections)) {
    // Case-insensitive replacement
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    correctedText = correctedText.replace(regex, (match) => {
      // Preserve original case
      if (match === match.toUpperCase()) return correction.toUpperCase();
      if (match[0] && match[0] === match[0].toUpperCase()) return correction.charAt(0).toUpperCase() + correction.slice(1);
      return correction;
    });
  }

  return correctedText;
}

/**
 * Sanitize text content (removes all HTML tags) and corrects common typos
 */
export function sanitizeText(text: string): string {
  const sanitized = sanitizeHtml(text, 'textOnly');
  return correctCommonTypos(sanitized);
}

/**
 * Sanitize user-generated content with strict rules
 */
export function sanitizeUserContent(html: string): string {
  return sanitizeHtml(html, 'strict');
}

/**
 * Sanitize admin content with more permissive rules
 */
export function sanitizeAdminContent(html: string): string {
  return sanitizeHtml(html, 'permissive');
}

/**
 * Sanitize and truncate content
 */
export function sanitizeAndTruncate(
  html: string, 
  maxLength: number = 200,
  options: 'default' | 'strict' | 'permissive' | 'textOnly' = 'default'
): string {
  const sanitized = sanitizeHtml(html, options);
  
  if (sanitized.length <= maxLength) {
    return sanitized;
  }
  
  // Truncate while preserving word boundaries
  const truncated = sanitized.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Check if content contains potentially dangerous elements
 */
export function containsDangerousContent(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return false;
  }
  
  const dangerousPatterns = [
    /<script[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /on\w+\s*=/gi, // Event handlers
    /<iframe[\s\S]*?>/gi,
    /<object[\s\S]*?>/gi,
    /<embed[\s\S]*?>/gi,
    /<form[\s\S]*?>/gi,
    /<meta[\s\S]*?>/gi,
    /<link[\s\S]*?>/gi,
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(html));
}

/**
 * Extract plain text from HTML
 */
export function extractText(html: string, maxLength?: number): string {
  const text = sanitizeText(html).trim();
  
  if (!maxLength || text.length <= maxLength) {
    return text;
  }
  
  return sanitizeAndTruncate(text, maxLength, 'textOnly');
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  // Remove dangerous protocols
  const dangerousProtocols = /^(javascript|vbscript|data|file|ftp):/i;
  if (dangerousProtocols.test(url)) {
    return '';
  }
  
  // Ensure URL is properly formatted
  try {
    const parsed = new URL(url, 'https://example.com');
    return parsed.href;
  } catch {
    // If URL parsing fails, treat as relative URL
    return url.replace(/[<>"']/g, '');
  }
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }
  
  return fileName
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .split('')
    .filter(char => char.charCodeAt(0) > 31) // Remove control characters (0-31)
    .join('')
    .replace(/^\.+/, '') // Remove leading dots
    .slice(0, 255) // Limit length
    .trim();
}

/**
 * React component helper for safe HTML rendering
 */
export function createSafeHtml(
  html: string, 
  options?: 'default' | 'strict' | 'permissive' | 'textOnly'
) {
  return {
    __html: sanitizeHtml(html, options)
  };
}

const sanitize = {
  sanitizeHtml,
  sanitizeText,
  sanitizeUserContent,
  sanitizeAdminContent,
  sanitizeAndTruncate,
  containsDangerousContent,
  extractText,
  sanitizeUrl,
  sanitizeFileName,
  createSafeHtml,
};

export default sanitize;
