-- Agriko Business Intelligence Database Schema
-- Development Environment Initialization

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- API Keys for external integrations
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP
);

-- Competitors tracking
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    industry VARCHAR(100),
    size_category VARCHAR(50),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    scraping_config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products (both ours and competitors')
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
    external_id VARCHAR(255),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(255),
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    availability VARCHAR(50),
    url TEXT,
    image_url TEXT,
    sku VARCHAR(255),
    brand VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price history tracking
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    sale_price DECIMAL(10,2),
    discount_percentage DECIMAL(5,2),
    availability VARCHAR(50),
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(255)
);

-- Business intelligence metrics
CREATE TABLE bi_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    value DECIMAL(15,4),
    string_value TEXT,
    json_value JSONB,
    dimension_1 VARCHAR(255),
    dimension_2 VARCHAR(255),
    dimension_3 VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100),
    confidence_score DECIMAL(3,2)
);

-- Competitive analysis reports
CREATE TABLE competitive_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    detailed_analysis JSONB,
    insights JSONB,
    recommendations JSONB,
    confidence_score DECIMAL(3,2),
    status VARCHAR(50) DEFAULT 'draft',
    generated_by VARCHAR(100),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Predictive analytics models
CREATE TABLE prediction_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    version VARCHAR(50),
    description TEXT,
    parameters JSONB,
    training_data_info JSONB,
    accuracy_metrics JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES prediction_models(id) ON DELETE CASCADE,
    prediction_type VARCHAR(100) NOT NULL,
    target_entity_type VARCHAR(100),
    target_entity_id UUID,
    predicted_value DECIMAL(15,4),
    predicted_string TEXT,
    predicted_json JSONB,
    confidence_score DECIMAL(3,2),
    time_horizon_days INTEGER,
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actual_value DECIMAL(15,4),
    actual_date TIMESTAMP,
    accuracy_score DECIMAL(3,2)
);

-- Alerts and notifications
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    title VARCHAR(500) NOT NULL,
    message TEXT,
    details JSONB,
    entity_type VARCHAR(100),
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    is_acknowledged BOOLEAN DEFAULT false,
    action_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Alert rules configuration
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100) NOT NULL,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 5,
    cooldown_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_triggered TIMESTAMP
);

-- Scraping jobs and status
CREATE TABLE scraping_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(100) NOT NULL,
    target_id UUID,
    status VARCHAR(50) DEFAULT 'pending',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    results_summary JSONB,
    items_processed INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions for authentication
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for security and compliance
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_competitors_domain ON competitors(domain);
CREATE INDEX idx_products_competitor_id ON products(competitor_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_scraped_at ON price_history(scraped_at);
CREATE INDEX idx_bi_metrics_type_name ON bi_metrics(metric_type, metric_name);
CREATE INDEX idx_bi_metrics_timestamp ON bi_metrics(timestamp);
CREATE INDEX idx_predictions_model_id ON predictions(model_id);
CREATE INDEX idx_predictions_type_date ON predictions(prediction_type, prediction_date);
CREATE INDEX idx_alerts_type_created ON alerts(alert_type, created_at);
CREATE INDEX idx_alerts_unread ON alerts(is_read, created_at) WHERE is_read = false;
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status, created_at);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_competitors BEFORE UPDATE ON competitors FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_products BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_prediction_models BEFORE UPDATE ON prediction_models FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_alert_rules BEFORE UPDATE ON alert_rules FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Insert default admin user (password: 'admin123' - change in production!)
INSERT INTO users (email, password_hash, role)
VALUES ('admin@agriko.com', crypt('admin123', gen_salt('bf')), 'admin');

-- Insert sample competitors
INSERT INTO competitors (name, domain, industry, size_category, country) VALUES
('TechCorp Solutions', 'techcorp.com', 'Technology', 'Enterprise', 'USA'),
('GreenTech Innovations', 'greentech-innovations.com', 'Technology', 'Mid-Market', 'Canada'),
('EcoSmart Systems', 'ecosmart-systems.com', 'Technology', 'Startup', 'Germany');

-- Insert sample prediction models
INSERT INTO prediction_models (model_name, model_type, version, description, parameters, accuracy_metrics) VALUES
('Price Prediction Model', 'regression', '1.0', 'Predicts product price changes based on market trends', '{"algorithm": "random_forest", "features": ["competitor_price", "seasonality", "demand"]}', '{"rmse": 0.15, "r2": 0.87}'),
('Demand Forecasting Model', 'time_series', '1.0', 'Forecasts product demand for next 30 days', '{"algorithm": "arima", "seasonality": 7}', '{"mape": 12.3, "accuracy": 0.82}');

-- Insert sample alert rules
INSERT INTO alert_rules (rule_name, rule_type, conditions, actions, priority) VALUES
('Competitor Price Drop', 'price_monitoring', '{"metric": "price_change", "threshold": -0.10, "operator": "less_than"}', '{"notify": ["email", "dashboard"], "urgency": "high"}', 1),
('New Competitor Product', 'product_monitoring', '{"event": "new_product", "category": "our_categories"}', '{"notify": ["dashboard"], "create_analysis": true}', 3);

-- Create views for common queries
CREATE VIEW competitor_summary AS
SELECT
    c.id,
    c.name,
    c.domain,
    c.industry,
    COUNT(p.id) as product_count,
    AVG(p.price) as avg_price,
    MAX(ph.scraped_at) as last_updated
FROM competitors c
LEFT JOIN products p ON c.id = p.competitor_id AND p.is_active = true
LEFT JOIN price_history ph ON p.id = ph.product_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.domain, c.industry;

CREATE VIEW recent_alerts AS
SELECT
    id,
    alert_type,
    severity,
    title,
    message,
    is_read,
    is_acknowledged,
    created_at
FROM alerts
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

CREATE VIEW price_trends AS
SELECT
    p.id as product_id,
    p.name as product_name,
    c.name as competitor_name,
    ph.price,
    ph.scraped_at,
    LAG(ph.price) OVER (PARTITION BY p.id ORDER BY ph.scraped_at) as previous_price,
    (ph.price - LAG(ph.price) OVER (PARTITION BY p.id ORDER BY ph.scraped_at)) / LAG(ph.price) OVER (PARTITION BY p.id ORDER BY ph.scraped_at) * 100 as price_change_percent
FROM products p
JOIN competitors c ON p.competitor_id = c.id
JOIN price_history ph ON p.id = ph.product_id
WHERE p.is_active = true AND c.is_active = true
ORDER BY ph.scraped_at DESC;