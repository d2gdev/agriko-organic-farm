declare module 'robots-txt-parser' {
  interface RobotsTxtRules {
    /**
     * Check if a path is allowed for a given user agent
     * @param path - The URL path to check
     * @param userAgent - The user agent to check for (optional, defaults to '*')
     * @returns true if the path is allowed, false otherwise
     */
    isAllowed(path: string, userAgent?: string): boolean;

    /**
     * Get the crawl delay for a given user agent
     * @param userAgent - The user agent to get crawl delay for (optional, defaults to '*')
     * @returns The crawl delay in seconds, or null if not specified
     */
    getCrawlDelay(userAgent?: string): number | null;
  }

  /**
   * Parse robots.txt content from a URL or text
   * @param url - The robots.txt URL
   * @param content - The robots.txt content (optional, will be fetched if not provided)
   * @returns Promise that resolves to parsed robots.txt rules
   */
  export function parse(url: string, content?: string): Promise<RobotsTxtRules>;
}