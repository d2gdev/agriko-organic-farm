// Business Intelligence - Data Validation and Cleaning Pipeline
import { logger } from '@/lib/logger';
import type { SerperSearchResult } from '../types/config';
import type {
  Competitor,
  CompetitorProduct
} from '../types/competitor';
import {
  CompanySize,
  CompetitorCategory,
  MonitoringScope,
  MonitoringFrequency,
  CompetitorStatus
} from '../types/competitor';

// Data validation and cleaning interfaces
export interface DataValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
  confidence: number;
}

export interface CleaningOptions {
  removeHtml: boolean;
  normalizeWhitespace: boolean;
  validateUrls: boolean;
  extractEmails: boolean;
  extractPhones: boolean;
  maxTextLength?: number;
  allowedDomains?: string[];
}

export interface ExtractedData {
  urls: string[];
  emails: string[];
  phones: string[];
  socialMedia: {
    twitter?: string[];
    linkedin?: string[];
    facebook?: string[];
    instagram?: string[];
  };
  addresses: string[];
  keywords: string[];
  pricing: {
    amounts: number[];
    currencies: string[];
    plans: string[];
  };
}

export class DataProcessor {
  private static instance: DataProcessor | null = null;

  // Text processing regex patterns
  private readonly patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /(?:\+?1[-. s]?)?(?:\(?[0-9]{3}\)?[-. s]?)?[0-9]{3}[-. s]?[0-9]{4}/g,
    url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g,
    twitter: /(?:https?:\/\/)?(?:www\.)?twitter\.com\/([a-zA-Z0-9_]+)/g,
    linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9-]+)/g,
    facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9.]+)/g,
    instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/g,
    address: /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Way|Circle|Cir)\b/gi,
    price: /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    currency: /\b(?:USD|EUR|GBP|CAD|AUD|JPY|CNY)\b/g,
    html: /<[^>]*>/g,
    whitespace: /\s+/g
  };

  public static getInstance(): DataProcessor {
    if (!DataProcessor.instance) {
      DataProcessor.instance = new DataProcessor();
    }
    return DataProcessor.instance;
  }

  // Core data cleaning functionality
  cleanText(text: string, options: Partial<CleaningOptions> = {}): string {
    const opts: CleaningOptions = {
      removeHtml: true,
      normalizeWhitespace: true,
      validateUrls: false,
      extractEmails: false,
      extractPhones: false,
      maxTextLength: 10000,
      ...options
    };

    let cleaned = text;

    try {
      // Remove HTML tags
      if (opts.removeHtml) {
        cleaned = cleaned.replace(this.patterns.html, ' ');
      }

      // Normalize whitespace
      if (opts.normalizeWhitespace) {
        cleaned = cleaned.replace(this.patterns.whitespace, ' ').trim();
      }

      // Truncate if too long
      if (opts.maxTextLength && cleaned.length > opts.maxTextLength) {
        cleaned = cleaned.substring(0, opts.maxTextLength) + '...';
      }

      // Remove control characters (ASCII 0-31 and 127)
      cleaned = cleaned.split('').filter(char => {
        const code = char.charCodeAt(0);
        return code > 31 && code !== 127;
      }).join('');

      // Decode common HTML entities
      cleaned = cleaned
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');

      return cleaned;
    } catch (error) {
      logger.error('Text cleaning failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        textLength: text.length
      });
      return text; // Return original if cleaning fails
    }
  }

  // Extract structured data from text
  extractData(text: string): ExtractedData {
    try {
      const extracted: ExtractedData = {
        urls: [],
        emails: [],
        phones: [],
        socialMedia: {},
        addresses: [],
        keywords: [],
        pricing: {
          amounts: [],
          currencies: [],
          plans: []
        }
      };

      // Extract URLs
      const urls = text.match(this.patterns.url) || [];
      extracted.urls = [...new Set(urls)];

      // Extract emails
      const emails = text.match(this.patterns.email) || [];
      extracted.emails = [...new Set(emails)];

      // Extract phone numbers
      const phones = text.match(this.patterns.phone) || [];
      extracted.phones = [...new Set(phones)];

      // Extract social media handles
      const twitterMatches = text.match(this.patterns.twitter) || [];
      if (twitterMatches.length > 0) {
        extracted.socialMedia.twitter = [...new Set(twitterMatches)];
      }

      const linkedinMatches = text.match(this.patterns.linkedin) || [];
      if (linkedinMatches.length > 0) {
        extracted.socialMedia.linkedin = [...new Set(linkedinMatches)];
      }

      const facebookMatches = text.match(this.patterns.facebook) || [];
      if (facebookMatches.length > 0) {
        extracted.socialMedia.facebook = [...new Set(facebookMatches)];
      }

      const instagramMatches = text.match(this.patterns.instagram) || [];
      if (instagramMatches.length > 0) {
        extracted.socialMedia.instagram = [...new Set(instagramMatches)];
      }

      // Extract addresses
      const addresses = text.match(this.patterns.address) || [];
      extracted.addresses = [...new Set(addresses)];

      // Extract pricing information
      const priceMatches = text.match(this.patterns.price) || [];
      extracted.pricing.amounts = priceMatches.map(match => {
        const numStr = match.replace(/[$,]/g, '');
        return parseFloat(numStr);
      }).filter(num => !isNaN(num));

      const currencies = text.match(this.patterns.currency) || [];
      extracted.pricing.currencies = [...new Set(currencies)];

      // Extract common pricing plan keywords
      const planKeywords = ['basic', 'standard', 'premium', 'enterprise', 'pro', 'starter', 'advanced', 'business', 'personal', 'team', 'organization'];
      extracted.pricing.plans = planKeywords.filter(keyword =>
        text.toLowerCase().includes(keyword)
      );

      // Extract general keywords (simple approach)
      const words = this.cleanText(text).toLowerCase().split(/\s+/);
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'cannot']);

      const keywords = words
        .filter(word => word.length > 3 && !stopWords.has(word))
        .reduce((acc: Record<string, number>, word) => {
          acc[word] = (acc[word] || 0) + 1;
          return acc;
        }, {});

      extracted.keywords = Object.entries(keywords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([word]) => word);

      return extracted;
    } catch (error) {
      logger.error('Data extraction failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        textLength: text.length
      });

      return {
        urls: [],
        emails: [],
        phones: [],
        socialMedia: {},
        addresses: [],
        keywords: [],
        pricing: { amounts: [], currencies: [], plans: [] }
      };
    }
  }

  // Validate and process competitor data from search results
  processCompetitorData(searchResults: SerperSearchResult[], competitorName: string): DataValidationResult<Partial<Competitor>> {
    try {
      logger.debug('Processing competitor data', {
        competitorName,
        resultCount: searchResults.length
      });

      const errors: string[] = [];
      const warnings: string[] = [];
      let confidence = 0.5;

      // Combine all search result content
      const combinedText = searchResults
        .map(result => `${result.title} ${result.snippet}`)
        .join(' ');

      const cleanedText = this.cleanText(combinedText);
      const extractedData = this.extractData(cleanedText);

      // Validate competitor name presence
      const nameLower = competitorName.toLowerCase();
      const textLower = cleanedText.toLowerCase();
      const nameOccurrences = (textLower.match(new RegExp(nameLower, 'g')) || []).length;

      if (nameOccurrences === 0) {
        warnings.push(`Competitor name "${competitorName}" not found in search results`);
        confidence -= 0.2;
      } else if (nameOccurrences > 5) {
        confidence += 0.1;
      }

      // Extract potential domain
      let domain = '';
      const relevantUrls = extractedData.urls.filter(url =>
        url.toLowerCase().includes(nameLower.replace(/\s+/g, ''))
      );

      if (relevantUrls.length > 0) {
        const firstUrl = relevantUrls[0];
        if (firstUrl) {
          try {
            const urlObj = new URL(firstUrl);
            domain = urlObj.hostname.replace(/^www\./, '');
            confidence += 0.1;
          } catch {
            warnings.push('Invalid URL found in search results');
          }
        }
      }

      // Extract industry information
      const industryKeywords = [
        'technology', 'software', 'healthcare', 'finance', 'retail', 'manufacturing',
        'education', 'media', 'telecommunications', 'automotive', 'aerospace',
        'biotechnology', 'pharmaceutical', 'energy', 'agriculture', 'construction',
        'consulting', 'marketing', 'advertising', 'logistics', 'transportation'
      ];

      const detectedIndustries = industryKeywords.filter(keyword =>
        textLower.includes(keyword)
      );

      const industry = detectedIndustries.length > 0 ? detectedIndustries[0] : '';

      // Build competitor data
      const competitorData: Partial<Competitor> = {
        name: competitorName,
        domain,
        industry,
        size: this.estimateCompanySize(cleanedText) as CompanySize,
        category: CompetitorCategory.DIRECT, // Default, will be refined later
        monitoringScope: MonitoringScope.FULL_MONITORING,
        monitoringFrequency: MonitoringFrequency.WEEKLY,
        status: CompetitorStatus.ACTIVE
      };

      // Calculate final confidence
      if (domain) confidence += 0.1;
      if (industry) confidence += 0.1;
      if (extractedData.urls.length > 0) confidence += 0.05;
      if (extractedData.emails.length > 0) confidence += 0.05;

      confidence = Math.min(confidence, 1.0);

      // Validation checks
      if (!competitorData.name || competitorData.name.trim().length === 0) {
        errors.push('Competitor name is required');
      }

      if (confidence < 0.3) {
        warnings.push('Low confidence in extracted data quality');
      }

      const isValid = errors.length === 0;

      logger.info('Competitor data processing completed', {
        competitorName,
        isValid,
        confidence,
        errorCount: errors.length,
        warningCount: warnings.length,
        extractedDomain: domain,
        detectedIndustry: industry
      });

      return {
        isValid,
        data: isValid ? competitorData : undefined,
        errors,
        warnings,
        confidence
      };
    } catch (error) {
      logger.error('Competitor data processing failed:', {
        competitorName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        isValid: false,
        errors: ['Failed to process competitor data'],
        warnings: [],
        confidence: 0
      };
    }
  }

  // Process product data from search results
  processProductData(searchResults: SerperSearchResult[], competitorId: string): DataValidationResult<CompetitorProduct[]> {
    try {
      logger.debug('Processing product data', {
        competitorId,
        resultCount: searchResults.length
      });

      const errors: string[] = [];
      const warnings: string[] = [];
      const products: CompetitorProduct[] = [];

      for (const result of searchResults) {
        const combinedText = `${result.title} ${result.snippet}`;
        const cleanedText = this.cleanText(combinedText);
        const extractedData = this.extractData(cleanedText);

        // Try to identify product information
        const productKeywords = ['product', 'service', 'solution', 'software', 'platform', 'tool', 'app', 'system'];
        const hasProductKeywords = productKeywords.some(keyword =>
          cleanedText.toLowerCase().includes(keyword)
        );

        if (hasProductKeywords) {
          // Extract pricing if available
          const prices = extractedData.pricing.amounts;
          const price = prices.length > 0 ? prices[0] : 0;
          const currency = extractedData.pricing.currencies.length > 0
            ? extractedData.pricing.currencies[0]
            : 'USD';

          const product: CompetitorProduct = {
            id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            competitorId,
            name: this.extractProductName(cleanedText) || result.title,
            description: cleanedText.substring(0, 500),
            category: this.extractProductCategory(cleanedText),
            price: price || 0,
            currency: currency || 'USD',
            url: result.link,
            features: extractedData.keywords.slice(0, 10),
            imageUrl: undefined,
            inStock: true, // Default assumption
            createdAt: new Date(),
            updatedAt: new Date()
          };

          products.push(product);
        }
      }

      const confidence = Math.min(products.length / Math.max(searchResults.length * 0.3, 1), 1.0);

      if (products.length === 0) {
        warnings.push('No products identified in search results');
      }

      logger.info('Product data processing completed', {
        competitorId,
        productCount: products.length,
        confidence,
        warningCount: warnings.length
      });

      return {
        isValid: true,
        data: products,
        errors,
        warnings,
        confidence
      };
    } catch (error) {
      logger.error('Product data processing failed:', {
        competitorId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        isValid: false,
        errors: ['Failed to process product data'],
        warnings: [],
        confidence: 0
      };
    }
  }

  // Utility methods for data processing
  private estimateCompanySize(text: string): CompanySize {
    const textLower = text.toLowerCase();

    if (textLower.includes('startup') || textLower.includes('founded')) {
      return CompanySize.STARTUP;
    }
    if (textLower.includes('enterprise') || textLower.includes('fortune') || textLower.includes('multinational')) {
      return CompanySize.ENTERPRISE;
    }
    if (textLower.includes('small business') || textLower.includes('local')) {
      return CompanySize.SMALL;
    }
    if (textLower.includes('medium') || textLower.includes('mid-size')) {
      return CompanySize.MEDIUM;
    }
    if (textLower.includes('large') || textLower.includes('corporation')) {
      return CompanySize.LARGE;
    }

    return CompanySize.MEDIUM; // Default
  }

  private extractProductName(text: string): string | null {
    // Simple heuristic to extract product names
    const sentences = text.split(/[.!?]/);
    for (const sentence of sentences) {
      const productKeywords = ['introducing', 'launches', 'announces', 'releases', 'unveils'];
      for (const keyword of productKeywords) {
        if (sentence.toLowerCase().includes(keyword)) {
          // Extract the next few words as potential product name
          const words = sentence.trim().split(/\s+/);
          const keywordIndex = words.findIndex(word =>
            word.toLowerCase().includes(keyword.toLowerCase())
          );

          if (keywordIndex !== -1 && keywordIndex < words.length - 2) {
            return words.slice(keywordIndex + 1, keywordIndex + 4).join(' ');
          }
        }
      }
    }
    return null;
  }

  private extractProductCategory(text: string): string {
    const categories = [
      'software', 'hardware', 'service', 'platform', 'tool', 'application',
      'system', 'solution', 'product', 'technology', 'device', 'equipment'
    ];

    const textLower = text.toLowerCase();
    for (const category of categories) {
      if (textLower.includes(category)) {
        return category;
      }
    }

    return 'other';
  }

  // Validate URLs
  validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Validate email addresses
  validateEmail(email: string): boolean {
    return this.patterns.email.test(email);
  }

  // Batch process multiple search result sets
  async batchProcess<T>(
    items: Array<{ searchResults: SerperSearchResult[]; metadata: unknown }>,
    processor: (searchResults: SerperSearchResult[], metadata: unknown) => DataValidationResult<T>
  ): Promise<Array<DataValidationResult<T>>> {
    const results: Array<DataValidationResult<T>> = [];

    logger.info('Starting batch data processing', {
      itemCount: items.length
    });

    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];
        if (item) {
          const result = processor(item.searchResults, item.metadata);
          results.push(result);

          logger.debug('Batch processing progress', {
            completed: i + 1,
            total: items.length,
            isValid: result.isValid,
            confidence: result.confidence
          });
        }
      } catch (error) {
        logger.error('Batch processing item failed:', {
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        results.push({
          isValid: false,
          errors: ['Processing failed'],
          warnings: [],
          confidence: 0
        });
      }
    }

    logger.info('Batch data processing completed', {
      total: items.length,
      successful: results.filter(r => r.isValid).length,
      failed: results.filter(r => !r.isValid).length
    });

    return results;
  }
}

// Export singleton instance
export const dataProcessor = DataProcessor.getInstance();