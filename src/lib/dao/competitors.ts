import { query, CacheManager } from '../database';
import { Competitor, CompetitorFilter, CompetitorSummary } from './types';

export class CompetitorDAO {
  private cache = CacheManager.getInstance();

  async findAll(filter: CompetitorFilter = {}): Promise<{
    competitors: Competitor[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const cacheKey = this.cache.generateKey('competitors', JSON.stringify(filter));
    const cached = await this.cache.get<{
      competitors: Competitor[];
      total: number;
      page: number;
      totalPages: number;
    }>(cacheKey);
    if (cached) return cached;

    const {
      page = 1,
      limit = 20,
      industry,
      country,
      is_active = true,
      sort = { field: 'name', direction: 'ASC' }
    } = filter;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramIndex++}`);
      params.push(is_active);
    }

    if (industry) {
      conditions.push(`industry ILIKE $${paramIndex++}`);
      params.push(`%${industry}%`);
    }

    if (country) {
      conditions.push(`country ILIKE $${paramIndex++}`);
      params.push(`%${country}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = `ORDER BY ${sort.field} ${sort.direction}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM competitors
      ${whereClause}
    `;
    const countResult = await query<{ total: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Get paginated results
    const dataQuery = `
      SELECT *
      FROM competitors
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await query<Competitor>(dataQuery, params);

    const response = {
      competitors: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };

    await this.cache.set(cacheKey, response, 300); // 5 minutes cache
    return response;
  }

  async findById(id: string): Promise<Competitor | null> {
    const cacheKey = this.cache.generateKey('competitor', id);
    const cached = await this.cache.get<Competitor>(cacheKey);
    if (cached) return cached;

    const result = await query<Competitor>(
      'SELECT * FROM competitors WHERE id = $1',
      [id]
    );

    const competitor = result.rows[0] || null;
    if (competitor) {
      await this.cache.set(cacheKey, competitor, 600); // 10 minutes cache
    }

    return competitor;
  }

  async findByDomain(domain: string): Promise<Competitor | null> {
    const result = await query<Competitor>(
      'SELECT * FROM competitors WHERE domain = $1',
      [domain]
    );

    return result.rows[0] || null;
  }

  async create(competitor: Omit<Competitor, 'id' | 'created_at' | 'updated_at'>): Promise<Competitor> {
    const result = await query<Competitor>(
      `INSERT INTO competitors (name, domain, industry, size_category, country, is_active, scraping_config)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        competitor.name,
        competitor.domain,
        competitor.industry,
        competitor.size_category,
        competitor.country,
        competitor.is_active,
        JSON.stringify(competitor.scraping_config)
      ]
    );

    const newCompetitor = result.rows[0];
    if (!newCompetitor) {
      throw new Error('Failed to create competitor');
    }

    // Invalidate cache
    await this.cache.del(this.cache.generateKey('competitors', '*'));

    return newCompetitor;
  }

  async update(id: string, updates: Partial<Competitor>): Promise<Competitor | null> {
    const fields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = $${paramIndex++}`);
        params.push(key === 'scraping_config' ? JSON.stringify(value) : value);
      }
    });

    if (fields.length === 0) {
      return await this.findById(id);
    }

    params.push(id);
    const result = await query<Competitor>(
      `UPDATE competitors
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    const updatedCompetitor = result.rows[0] || null;

    if (updatedCompetitor) {
      // Invalidate cache
      await this.cache.del(this.cache.generateKey('competitor', id));
      await this.cache.del(this.cache.generateKey('competitors', '*'));
    }

    return updatedCompetitor;
  }

  async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM competitors WHERE id = $1',
      [id]
    );

    const deleted = result.rowCount > 0;

    if (deleted) {
      // Invalidate cache
      await this.cache.del(this.cache.generateKey('competitor', id));
      await this.cache.del(this.cache.generateKey('competitors', '*'));
    }

    return deleted;
  }

  async getSummary(): Promise<CompetitorSummary[]> {
    const cacheKey = this.cache.generateKey('competitor_summary');
    const cached = await this.cache.get<CompetitorSummary[]>(cacheKey);
    if (cached) return cached;

    const result = await query<CompetitorSummary>(
      'SELECT * FROM competitor_summary ORDER BY product_count DESC, name ASC'
    );

    await this.cache.set(cacheKey, result.rows, 300); // 5 minutes cache
    return result.rows;
  }

  async getActiveCount(): Promise<number> {
    const cacheKey = this.cache.generateKey('competitor_count', 'active');
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null) return cached;

    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM competitors WHERE is_active = true'
    );

    const count = parseInt(result.rows[0]?.count || '0');
    await this.cache.set(cacheKey, count, 600); // 10 minutes cache
    return count;
  }

  async getByIndustry(industry: string): Promise<Competitor[]> {
    const cacheKey = this.cache.generateKey('competitors_industry', industry);
    const cached = await this.cache.get<Competitor[]>(cacheKey);
    if (cached) return cached;

    const result = await query<Competitor>(
      'SELECT * FROM competitors WHERE industry ILIKE $1 AND is_active = true ORDER BY name',
      [`%${industry}%`]
    );

    await this.cache.set(cacheKey, result.rows, 600); // 10 minutes cache
    return result.rows;
  }

  async updateScrapingConfig(id: string, config: Record<string, unknown>): Promise<boolean> {
    const result = await query(
      'UPDATE competitors SET scraping_config = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(config), id]
    );

    const updated = result.rowCount > 0;

    if (updated) {
      await this.cache.del(this.cache.generateKey('competitor', id));
    }

    return updated;
  }
}