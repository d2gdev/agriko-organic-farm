#!/usr/bin/env node

/**
 * Business Intelligence System Initialization Script
 *
 * This script initializes the complete business intelligence system:
 * - Sets up database connections
 * - Runs database migrations
 * - Creates default admin user
 * - Initializes sample data
 * - Verifies system health
 */

const { Pool } = require('pg');
const Redis = require('ioredis');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const config = {
  database: {
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/agriko_dev',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@agriko.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    name: 'System Administrator'
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`${colors.bold}[${step}]${colors.reset} ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

class SystemInitializer {
  constructor() {
    this.db = null;
    this.redis = null;
  }

  async initialize() {
    try {
      log('\n🚀 Starting Business Intelligence System Initialization', 'bold');
      log('=' .repeat(60), 'blue');

      await this.checkPrerequisites();
      await this.connectDatabases();
      await this.runMigrations();
      await this.createAdminUser();
      await this.initializeSampleData();
      await this.verifySystemHealth();
      await this.cleanup();

      log('\n🎉 Business Intelligence System initialized successfully!', 'green');
      log('=' .repeat(60), 'green');

      this.printSummary();

    } catch (error) {
      logError(`Initialization failed: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    logStep('1/6', 'Checking prerequisites...');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required. Current version: ${nodeVersion}`);
    }
    logSuccess(`Node.js version: ${nodeVersion}`);

    // Check environment variables
    const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      logWarning(`Missing environment variables: ${missingVars.join(', ')}`);
      logWarning('Using default values for development...');
    } else {
      logSuccess('All required environment variables are set');
    }

    // Check if database initialization script exists
    const dbScriptPath = path.join(__dirname, '../db/init.sql');
    try {
      await fs.access(dbScriptPath);
      logSuccess('Database initialization script found');
    } catch {
      throw new Error(`Database initialization script not found: ${dbScriptPath}`);
    }
  }

  async connectDatabases() {
    logStep('2/6', 'Connecting to databases...');

    // Connect to PostgreSQL
    try {
      this.db = new Pool(config.database);
      await this.db.query('SELECT 1');
      logSuccess('Connected to PostgreSQL database');
    } catch (error) {
      throw new Error(`Failed to connect to PostgreSQL: ${error.message}`);
    }

    // Connect to Redis
    try {
      this.redis = new Redis(config.redis.url, {
        retryDelayOnFailoverMax: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3
      });
      await this.redis.ping();
      logSuccess('Connected to Redis cache');
    } catch (error) {
      throw new Error(`Failed to connect to Redis: ${error.message}`);
    }
  }

  async runMigrations() {
    logStep('3/6', 'Running database migrations...');

    try {
      // Read and execute the database initialization script
      const dbScriptPath = path.join(__dirname, '../db/init.sql');
      const dbScript = await fs.readFile(dbScriptPath, 'utf8');

      // Split by semicolons and execute each statement
      const statements = dbScript
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          await this.db.query(statement);
        }
      }

      logSuccess('Database schema created successfully');

      // Verify key tables exist
      const tableCheckQuery = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('users', 'competitors', 'products', 'alerts')
        ORDER BY table_name;
      `;

      const result = await this.db.query(tableCheckQuery);
      const tables = result.rows.map(row => row.table_name);

      logSuccess(`Verified ${tables.length} core tables: ${tables.join(', ')}`);

    } catch (error) {
      if (error.message.includes('already exists')) {
        logWarning('Database schema already exists, skipping migration');
      } else {
        throw new Error(`Migration failed: ${error.message}`);
      }
    }
  }

  async createAdminUser() {
    logStep('4/6', 'Creating admin user...');

    try {
      // Check if admin user already exists
      const existingUser = await this.db.query(
        'SELECT id FROM users WHERE email = $1',
        [config.admin.email]
      );

      if (existingUser.rows.length > 0) {
        logWarning(`Admin user already exists: ${config.admin.email}`);
        return;
      }

      // Hash the admin password
      const passwordHash = await bcrypt.hash(config.admin.password, 12);

      // Create admin user
      await this.db.query(
        `INSERT INTO users (email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4)`,
        [config.admin.email, passwordHash, 'admin', true]
      );

      logSuccess(`Admin user created: ${config.admin.email}`);
      logWarning(`Default password: ${config.admin.password} (Please change immediately!)`);

    } catch (error) {
      throw new Error(`Failed to create admin user: ${error.message}`);
    }
  }

  async initializeSampleData() {
    logStep('5/6', 'Initializing sample data...');

    try {
      // Check if sample data already exists
      const competitorCount = await this.db.query(
        'SELECT COUNT(*) as count FROM competitors'
      );

      if (parseInt(competitorCount.rows[0].count) > 0) {
        logWarning('Sample data already exists, skipping initialization');
        return;
      }

      // Insert sample competitors
      const sampleCompetitors = [
        {
          name: 'TechCorp Solutions',
          domain: 'techcorp.com',
          industry: 'Technology',
          size_category: 'Enterprise',
          country: 'USA'
        },
        {
          name: 'GreenTech Innovations',
          domain: 'greentech-innovations.com',
          industry: 'Technology',
          size_category: 'Mid-Market',
          country: 'Canada'
        },
        {
          name: 'EcoSmart Systems',
          domain: 'ecosmart-systems.com',
          industry: 'Technology',
          size_category: 'Startup',
          country: 'Germany'
        }
      ];

      for (const competitor of sampleCompetitors) {
        await this.db.query(
          `INSERT INTO competitors (name, domain, industry, size_category, country, scraping_config)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            competitor.name,
            competitor.domain,
            competitor.industry,
            competitor.size_category,
            competitor.country,
            JSON.stringify({ interval: 3600, enabled: true })
          ]
        );
      }

      // Insert sample alert rules
      const sampleAlertRules = [
        {
          rule_name: 'Competitor Price Drop',
          rule_type: 'price_monitoring',
          conditions: JSON.stringify({
            metric: 'price_change',
            threshold: -0.10,
            operator: 'less_than'
          }),
          actions: JSON.stringify({
            notify: ['email', 'dashboard'],
            urgency: 'high'
          })
        },
        {
          rule_name: 'New Competitor Product',
          rule_type: 'product_monitoring',
          conditions: JSON.stringify({
            event: 'new_product',
            category: 'our_categories'
          }),
          actions: JSON.stringify({
            notify: ['dashboard'],
            create_analysis: true
          })
        }
      ];

      for (const rule of sampleAlertRules) {
        await this.db.query(
          `INSERT INTO alert_rules (rule_name, rule_type, conditions, actions, priority)
           VALUES ($1, $2, $3, $4, $5)`,
          [rule.rule_name, rule.rule_type, rule.conditions, rule.actions, 3]
        );
      }

      logSuccess('Sample data initialized successfully');
      logSuccess(`Created ${sampleCompetitors.length} sample competitors`);
      logSuccess(`Created ${sampleAlertRules.length} sample alert rules`);

    } catch (error) {
      throw new Error(`Failed to initialize sample data: ${error.message}`);
    }
  }

  async verifySystemHealth() {
    logStep('6/6', 'Verifying system health...');

    const healthChecks = [];

    try {
      // Database health check
      await this.db.query('SELECT 1');
      healthChecks.push({ component: 'PostgreSQL Database', status: 'healthy' });

      // Redis health check
      await this.redis.ping();
      healthChecks.push({ component: 'Redis Cache', status: 'healthy' });

      // Check table existence and data
      const tables = ['users', 'competitors', 'products', 'alerts', 'alert_rules'];
      for (const table of tables) {
        const result = await this.db.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        healthChecks.push({
          component: `Table: ${table}`,
          status: 'accessible',
          data: `${count} records`
        });
      }

      // Verify admin user
      const adminUser = await this.db.query(
        'SELECT email, role FROM users WHERE role = $1 LIMIT 1',
        ['admin']
      );

      if (adminUser.rows.length > 0) {
        healthChecks.push({
          component: 'Admin User',
          status: 'configured',
          data: adminUser.rows[0].email
        });
      }

      logSuccess('All system health checks passed');

    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }

    return healthChecks;
  }

  async cleanup() {
    if (this.db) {
      await this.db.end();
    }
    if (this.redis) {
      await this.redis.quit();
    }
  }

  printSummary() {
    log('\n📋 System Summary:', 'bold');
    log('─'.repeat(40), 'blue');
    log(`✅ Database: PostgreSQL (${config.database.connectionString.split('@')[1] || 'local'})`);
    log(`✅ Cache: Redis (${config.redis.url})`);
    log(`✅ Admin: ${config.admin.email}`);
    log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);

    log('\n🔗 Next Steps:', 'bold');
    log('1. Start the application: npm run dev');
    log('2. Access admin panel: http://localhost:3000/admin');
    log('3. Change default admin password');
    log('4. Configure competitor scraping');
    log('5. Set up alert notifications');

    log('\n📚 Documentation:', 'bold');
    log('- API docs: /api/docs');
    log('- Health check: /api/health');
    log('- Metrics: /api/metrics');
  }
}

// Run initialization if called directly
if (require.main === module) {
  const initializer = new SystemInitializer();
  initializer.initialize().catch(console.error);
}

module.exports = SystemInitializer;