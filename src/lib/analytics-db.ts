// PostgreSQL Analytics Database for Comprehensive Data Storage
import { Pool } from 'pg';
import { logger } from '@/lib/logger';
import { BaseEvent, ProductEvent, SearchEvent, PageEvent, OrderEvent } from './event-system';

// Database connection pool
const pool = new Pool({
  host: process.env.ANALYTICS_DB_HOST || 'localhost',
  port: parseInt(process.env.ANALYTICS_DB_PORT || '5432'),
  database: process.env.ANALYTICS_DB_NAME || 'agriko_analytics',
  user: process.env.ANALYTICS_DB_USER || 'postgres',
  password: process.env.ANALYTICS_DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize analytics database schema
export async function initializeAnalyticsDB(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Events table - stores all raw events
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(255) PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        timestamp BIGINT NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        anonymous_id VARCHAR(255),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),

        INDEX(event_type),
        INDEX(timestamp),
        INDEX(session_id),
        INDEX(user_id),
        INDEX(created_at)
      )
    `);

    // Product interactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_interactions (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(255) REFERENCES events(id),
        product_id INTEGER NOT NULL,
        product_name VARCHAR(500) NOT NULL,
        product_price DECIMAL(10,2),
        product_category VARCHAR(255),
        variant_id INTEGER,
        interaction_type VARCHAR(50) NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        timestamp BIGINT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),

        INDEX(product_id),
        INDEX(interaction_type),
        INDEX(session_id),
        INDEX(user_id),
        INDEX(timestamp)
      )
    `);

    // Search analytics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS search_analytics (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(255) REFERENCES events(id),
        query TEXT NOT NULL,
        results_count INTEGER NOT NULL,
        clicked_result_id INTEGER,
        clicked_position INTEGER,
        filters JSONB DEFAULT '{}',
        session_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),

        INDEX(query),
        INDEX(results_count),
        INDEX(session_id),
        INDEX(user_id),
        INDEX(timestamp),
        FULLTEXT INDEX(query)
      )
    `);

    // Page views table
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(255) REFERENCES events(id),
        page_url TEXT NOT NULL,
        page_title VARCHAR(500),
        referrer TEXT,
        time_spent INTEGER,
        device_type VARCHAR(50),
        browser_type VARCHAR(50),
        viewport_width INTEGER,
        viewport_height INTEGER,
        session_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),

        INDEX(page_url),
        INDEX(device_type),
        INDEX(browser_type),
        INDEX(session_id),
        INDEX(user_id),
        INDEX(timestamp)
      )
    `);

    // Order analytics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_analytics (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(255) REFERENCES events(id),
        order_id VARCHAR(255) NOT NULL UNIQUE,
        order_value DECIMAL(12,2) NOT NULL,
        item_count INTEGER NOT NULL,
        payment_method VARCHAR(100),
        shipping_method VARCHAR(100),
        session_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),

        INDEX(order_id),
        INDEX(order_value),
        INDEX(session_id),
        INDEX(user_id),
        INDEX(timestamp)
      )
    `);

    // Order items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_analytics_id INTEGER REFERENCES order_analytics(id),
        product_id INTEGER NOT NULL,
        product_name VARCHAR(500) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        variant_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),

        INDEX(order_analytics_id),
        INDEX(product_id)
      )
    `);

    // User journeys table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_journeys (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        journey_start BIGINT NOT NULL,
        journey_end BIGINT,
        total_pages INTEGER DEFAULT 0,
        total_time_spent INTEGER DEFAULT 0,
        conversion_event VARCHAR(100),
        conversion_value DECIMAL(12,2),
        entry_page TEXT,
        exit_page TEXT,
        device_type VARCHAR(50),
        browser_type VARCHAR(50),
        traffic_source VARCHAR(100),
        campaign VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),

        INDEX(session_id),
        INDEX(user_id),
        INDEX(journey_start),
        INDEX(conversion_event),
        INDEX(traffic_source)
      )
    `);

    // User profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        total_orders INTEGER DEFAULT 0,
        total_spent DECIMAL(12,2) DEFAULT 0,
        avg_order_value DECIMAL(10,2) DEFAULT 0,
        lifetime_value DECIMAL(12,2) DEFAULT 0,
        preferred_categories TEXT[],
        last_active BIGINT,
        registration_date BIGINT,
        customer_segment VARCHAR(50),
        engagement_score INTEGER DEFAULT 0,
        churn_risk_score DECIMAL(3,2) DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),

        INDEX(user_id),
        INDEX(total_spent),
        INDEX(customer_segment),
        INDEX(last_active)
      )
    `);

    // Product analytics aggregation table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_analytics (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL UNIQUE,
        product_name VARCHAR(500) NOT NULL,
        total_views INTEGER DEFAULT 0,
        total_cart_adds INTEGER DEFAULT 0,
        total_purchases INTEGER DEFAULT 0,
        total_revenue DECIMAL(12,2) DEFAULT 0,
        conversion_rate DECIMAL(5,4) DEFAULT 0,
        avg_time_to_purchase INTEGER DEFAULT 0,
        return_rate DECIMAL(5,4) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        avg_rating DECIMAL(3,2) DEFAULT 0,
        last_interaction BIGINT,
        trending_score DECIMAL(8,4) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),

        INDEX(product_id),
        INDEX(total_views),
        INDEX(conversion_rate),
        INDEX(trending_score)
      )
    `);

    // Performance metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(15,6) NOT NULL,
        metric_unit VARCHAR(50),
        page_url TEXT,
        device_type VARCHAR(50),
        browser_type VARCHAR(50),
        timestamp BIGINT NOT NULL,
        session_id VARCHAR(255),
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),

        INDEX(metric_name),
        INDEX(timestamp),
        INDEX(page_url)
      )
    `);

    await client.query('COMMIT');
    logger.info('✅ Analytics database schema initialized successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Failed to initialize analytics database:', error as Record<string, unknown>);
    throw error;
  } finally {
    client.release();
  }
}

// Save analytics event
export async function saveAnalyticsEvent(event: BaseEvent): Promise<void> {
  const client = await pool.connect();

  try {
    // Save raw event
    await client.query(`
      INSERT INTO events (id, event_type, timestamp, session_id, user_id, anonymous_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
    `, [
      event.id,
      event.type,
      event.timestamp,
      event.sessionId,
      event.userId || null,
      event.anonymousId || null,
      JSON.stringify(event.metadata)
    ]);

    // Save specific event type data
    switch (event.type) {
      case 'product.viewed':
      case 'product.added_to_cart':
      case 'product.purchased':
        await saveProductInteraction(client, event as ProductEvent);
        break;

      case 'search.performed':
        await saveSearchAnalytics(client, event as SearchEvent);
        break;

      case 'page.viewed':
        await savePageView(client, event as PageEvent);
        break;

      case 'order.created':
        await saveOrderAnalytics(client, event as OrderEvent);
        break;
    }

    // Update user journey
    if (event.sessionId) {
      await updateUserJourney(client, event);
    }

    // Update user profile
    if (event.userId) {
      await updateUserProfile(client, event);
    }

  } catch (error) {
    logger.error('Failed to save analytics event:', error as Record<string, unknown>);
    throw error;
  } finally {
    client.release();
  }
}

// Save product interaction
async function saveProductInteraction(client: any, event: ProductEvent): Promise<void> {
  await client.query(`
    INSERT INTO product_interactions (
      event_id, product_id, product_name, product_price, product_category,
      variant_id, interaction_type, session_id, user_id, timestamp, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    event.id,
    event.productId,
    event.productName,
    event.productPrice,
    event.productCategory,
    event.variantId || null,
    event.type,
    event.sessionId,
    event.userId || null,
    event.timestamp,
    JSON.stringify(event.metadata)
  ]);

  // Update product analytics aggregation
  await updateProductAnalytics(client, event);
}

// Save search analytics
async function saveSearchAnalytics(client: any, event: SearchEvent): Promise<void> {
  await client.query(`
    INSERT INTO search_analytics (
      event_id, query, results_count, clicked_result_id, clicked_position,
      filters, session_id, user_id, timestamp
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    event.id,
    event.query,
    event.resultsCount,
    event.clickedResultId || null,
    event.clickedPosition || null,
    JSON.stringify(event.filters || {}),
    event.sessionId,
    event.userId || null,
    event.timestamp
  ]);
}

// Save page view
async function savePageView(client: any, event: PageEvent): Promise<void> {
  await client.query(`
    INSERT INTO page_views (
      event_id, page_url, page_title, referrer, time_spent,
      device_type, browser_type, session_id, user_id, timestamp
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `, [
    event.id,
    event.pageUrl,
    event.pageTitle,
    event.referrer || null,
    event.timeSpent || null,
    event.deviceType,
    event.browserType,
    event.sessionId,
    event.userId || null,
    event.timestamp
  ]);
}

// Save order analytics
async function saveOrderAnalytics(client: any, event: OrderEvent): Promise<void> {
  // Insert order
  const orderResult = await client.query(`
    INSERT INTO order_analytics (
      event_id, order_id, order_value, item_count, payment_method,
      shipping_method, session_id, user_id, timestamp
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `, [
    event.id,
    event.orderId,
    event.orderValue,
    event.itemCount,
    event.paymentMethod || null,
    event.shippingMethod || null,
    event.sessionId,
    event.userId || null,
    event.timestamp
  ]);

  const orderAnalyticsId = orderResult.rows[0].id;

  // Insert order items
  for (const item of event.items) {
    await client.query(`
      INSERT INTO order_items (
        order_analytics_id, product_id, quantity, unit_price, total_price
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      orderAnalyticsId,
      item.productId,
      item.quantity,
      item.price,
      item.quantity * item.price
    ]);
  }
}

// Update user journey
async function updateUserJourney(client: any, event: BaseEvent): Promise<void> {
  await client.query(`
    INSERT INTO user_journeys (session_id, user_id, journey_start, entry_page)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (session_id) DO UPDATE SET
      journey_end = $3,
      total_pages = user_journeys.total_pages + 1,
      user_id = COALESCE(user_journeys.user_id, $2),
      updated_at = NOW()
  `, [
    event.sessionId,
    event.userId || null,
    event.timestamp,
    (event as any).pageUrl || null
  ]);
}

// Update user profile
async function updateUserProfile(client: any, event: BaseEvent): Promise<void> {
  await client.query(`
    INSERT INTO user_profiles (user_id, last_active)
    VALUES ($1, $2)
    ON CONFLICT (user_id) DO UPDATE SET
      last_active = $2,
      updated_at = NOW()
  `, [event.userId, event.timestamp]);
}

// Update product analytics aggregation
async function updateProductAnalytics(client: any, event: ProductEvent): Promise<void> {
  const updateField = event.type === 'product.viewed' ? 'total_views = product_analytics.total_views + 1'
    : event.type === 'product.added_to_cart' ? 'total_cart_adds = product_analytics.total_cart_adds + 1'
    : event.type === 'product.purchased' ? 'total_purchases = product_analytics.total_purchases + 1, total_revenue = product_analytics.total_revenue + $3'
    : '';

  if (updateField) {
    const values = event.type === 'product.purchased'
      ? [event.productId, event.productName, event.productPrice, event.timestamp]
      : [event.productId, event.productName, event.timestamp];

    await client.query(`
      INSERT INTO product_analytics (product_id, product_name, last_interaction, ${updateField.split(' = ')[0]})
      VALUES ($1, $2, $${values.length}, 1)
      ON CONFLICT (product_id) DO UPDATE SET
        ${updateField},
        last_interaction = $${values.length},
        updated_at = NOW()
    `, values);
  }
}

// Export user journey data
export async function saveUserJourney(journeyData: any): Promise<void> {
  // Implementation for comprehensive user journey saving
  logger.info('Saving user journey:', journeyData);
}

// Analytics query functions
export async function getAnalyticsSummary(timeframe: string = '7d'): Promise<any> {
  const client = await pool.connect();

  try {
    const timeframeMs = timeframe === '7d' ? 7 * 24 * 60 * 60 * 1000
      : timeframe === '30d' ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

    const since = Date.now() - timeframeMs;

    const [pageViews, uniqueVisitors, orders, revenue] = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM page_views WHERE timestamp > $1', [since]),
      client.query('SELECT COUNT(DISTINCT session_id) as count FROM page_views WHERE timestamp > $1', [since]),
      client.query('SELECT COUNT(*) as count FROM order_analytics WHERE timestamp > $1', [since]),
      client.query('SELECT SUM(order_value) as total FROM order_analytics WHERE timestamp > $1', [since])
    ]);

    return {
      pageViews: parseInt(pageViews.rows[0].count),
      uniqueVisitors: parseInt(uniqueVisitors.rows[0].count),
      orders: parseInt(orders.rows[0].count),
      revenue: parseFloat(revenue.rows[0].total || '0')
    };
  } finally {
    client.release();
  }
}