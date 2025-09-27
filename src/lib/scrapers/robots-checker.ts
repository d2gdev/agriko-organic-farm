/**
 * Robots.txt Compliance Checker
 * Ensures scraping respects website robots.txt files
 */

import axios from 'axios';
import { parse as parseRobotsTxt } from 'robots-txt-parser';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-sanitizer';

// Types for robots-txt-parser
interface RobotsRules {
  isAllowed(path: string, userAgent: string): boolean;
  getCrawlDelay(userAgent: string): number | null;
}

// Cache robots.txt files (domain -> rules)
const robotsCache = new Map<string, RobotsCache>();
const CACHE_TTL = 3600000; // 1 hour

interface RobotsCache {
  rules: RobotsRules;
  timestamp: number;
}

/**
 * Check if a URL is allowed to be scraped according to robots.txt
 */
export async function checkRobotsCompliance(url: string): Promise<{
  allowed: boolean;
  crawlDelay?: number;
  error?: string;
}> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;

    // Check cache
    const cached = robotsCache.get(domain) as RobotsCache;
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return checkPathAgainstRules(cached.rules, path);
    }

    // Fetch robots.txt
    const robotsUrl = `${urlObj.protocol}//${domain}/robots.txt`;

    try {
      const response = await axios.get(robotsUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Agriko-Scraper/1.0 (https://agriko.com/bot)'
        }
      });

      // Parse robots.txt
      const rules = await parseRobotsTxt(robotsUrl, response.data);

      // Cache the rules
      robotsCache.set(domain, {
        rules,
        timestamp: Date.now()
      });

      return checkPathAgainstRules(rules, path);
    } catch (fetchError) {
      // If robots.txt doesn't exist or can't be fetched, assume allowed
      logger.info(`No robots.txt found for ${domain}, assuming allowed`);
      return { allowed: true };
    }
  } catch (error) {
    logger.error('Error checking robots compliance:', handleError(error, 'robots-checker-compliance'));
    return {
      allowed: false,
      error: 'Failed to check robots.txt compliance'
    };
  }
}

/**
 * Check a path against parsed robots.txt rules
 */
function checkPathAgainstRules(rules: RobotsRules, path: string): {
  allowed: boolean;
  crawlDelay?: number;
  error?: string;
} {
  try {
    // Check for our user agent or wildcard
    const userAgent = 'Agriko-Scraper';

    // Check if path is allowed
    const allowed = rules.isAllowed(path, userAgent);

    // Get crawl delay if specified
    const crawlDelay = rules.getCrawlDelay(userAgent) || undefined;

    if (!allowed) {
      return {
        allowed: false,
        error: `Path ${path} is disallowed by robots.txt`
      };
    }

    return {
      allowed: true,
      crawlDelay
    };
  } catch (error) {
    // If parsing fails, be conservative and disallow
    return {
      allowed: false,
      error: 'Failed to parse robots.txt rules'
    };
  }
}

/**
 * Get crawl delay for a domain
 */
export async function getCrawlDelay(domain: string): Promise<number> {
  try {
    const cached = robotsCache.get(domain) as RobotsCache;
    if (cached && cached.rules) {
      const delay = cached.rules.getCrawlDelay('Agriko-Scraper');
      return delay || 1; // Default 1 second if not specified
    }

    // Check robots.txt
    const result = await checkRobotsCompliance(`https://${domain}/`);
    return result.crawlDelay || 1;
  } catch (error) {
    return 1; // Default 1 second on error
  }
}

/**
 * Clean up old cache entries
 */
export function cleanupRobotsCache() {
  const now = Date.now();
  for (const [domain, cache] of robotsCache.entries()) {
    if (now - cache.timestamp > CACHE_TTL * 2) {
      robotsCache.delete(domain);
    }
  }
}
// Store interval ID for cleanup
let cleanupIntervalId: NodeJS.Timeout | undefined;


// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  cleanupIntervalId = setInterval(cleanupRobotsCache, 3600000);
}
/**
 * Cleanup function to clear the interval
 */
export function destroy() {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = undefined;
  }
}
