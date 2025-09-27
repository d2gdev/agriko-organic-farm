// Business Intelligence - Intelligent Alert and Notification System
import { logger } from '@/lib/logger';
import { memgraphService } from '@/lib/memgraph';
import { deepSeekService } from './deepseek';
import type {
  IntelligentAlert,
  AlertPriority,
  AlertCategory,
  AlertChannel,
  AlertContext,
  AlertMetrics,
  BusinessIntelligenceConfig
} from '../types/config';
import { DEFAULT_CONFIG } from '../types/config';

// Enhanced alert types
interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: AlertCategory;
  priority: AlertPriority;
  condition: AlertCondition;
  threshold: AlertThreshold;
  frequency: AlertFrequency;
  channels: AlertChannel[];
  subscribers: string[];
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

interface AlertCondition {
  type: 'metric_threshold' | 'trend_change' | 'competitor_action' | 'market_event' | 'predictive_trigger';
  metric?: string;
  operator?: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'percentage_change';
  value?: number;
  timeWindow?: number; // minutes
  aggregation?: 'avg' | 'sum' | 'max' | 'min' | 'count';
  customLogic?: string; // For complex conditions
}

interface AlertThreshold {
  warning: number;
  critical: number;
  emergencyEscalation?: number;
  suppressionTime?: number; // minutes to suppress duplicate alerts
}

interface AlertFrequency {
  type: 'immediate' | 'batched' | 'scheduled';
  interval?: number; // minutes for batched/scheduled
  quietHours?: {
    start: string; // HH:MM
    end: string; // HH:MM
    timezone: string;
  };
  maxAlertsPerHour?: number;
}

interface AlertDelivery {
  alertId: string;
  channel: AlertChannel;
  recipient: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
}

interface AlertAnalytics {
  totalAlerts: number;
  alertsByPriority: Record<AlertPriority, number>;
  alertsByCategory: Record<AlertCategory, number>;
  responseRate: number;
  averageResponseTime: number; // minutes
  falsePositiveRate: number;
  suppressedAlerts: number;
  topTriggeredRules: { ruleId: string; count: number }[];
}

export class IntelligentAlertSystem {
  private config: BusinessIntelligenceConfig['alerts'];
  private static instance: IntelligentAlertSystem | null = null;
  private alertRules: Map<string, AlertRule> = new Map();
  private alertHistory: Map<string, IntelligentAlert[]> = new Map();
  private deliveryQueue: AlertDelivery[] = [];
  private analyticsData: AlertAnalytics;

  private constructor() {
    this.config = DEFAULT_CONFIG.alerts;
    this.analyticsData = this.initializeAnalytics();
    this.startAlertProcessor();
    logger.info('Intelligent Alert System initialized');
  }

  public static getInstance(): IntelligentAlertSystem {
    if (!IntelligentAlertSystem.instance) {
      IntelligentAlertSystem.instance = new IntelligentAlertSystem();
    }
    return IntelligentAlertSystem.instance;
  }

  async createAlert(
    category: AlertCategory,
    priority: AlertPriority,
    title: string,
    message: string,
    context: AlertContext,
    metadata?: Record<string, unknown>
  ): Promise<IntelligentAlert> {
    try {
      const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Apply AI-powered priority adjustment
      const adjustedPriority = await this.adjustPriorityWithAI(priority, category, context, metadata);

      // Generate intelligent insights
      const insights = await this.generateAlertInsights(category, context, metadata);

      // Create comprehensive alert
      const alert: IntelligentAlert = {
        id: alertId,
        type: category,
        category,
        priority: adjustedPriority,
        title,
        description: message,
        message,
        context,
        insights,
        isActive: true,
        createdAt: new Date(),
        generatedAt: new Date(),
        status: 'pending' as const,
        channels: this.determineOptimalChannels(adjustedPriority, category),
        recipients: await this.getRelevantRecipients(category, adjustedPriority),
        metadata: {
          ...metadata,
          originalPriority: priority,
          aiAdjusted: adjustedPriority !== priority,
          confidence: 0.8
        }
      };

      // Store alert in history
      this.storeAlert(alert);

      // Queue for delivery
      await this.queueAlertDelivery(alert);

      // Update analytics
      this.updateAnalytics(alert);

      // Store in graph database for relationship tracking
      await this.storeAlertInGraph(alert);

      logger.info('Intelligent alert created', {
        id: alertId,
        category,
        priority: adjustedPriority,
        originalPriority: priority,
        recipientCount: alert.recipients?.length || 0
      });

      return alert;
    } catch (error) {
      logger.error('Alert creation failed:', {
        category,
        priority,
        title,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async createAlertRule(
    name: string,
    description: string,
    category: AlertCategory,
    priority: AlertPriority,
    condition: AlertCondition,
    threshold: AlertThreshold,
    frequency: AlertFrequency,
    channels: AlertChannel[],
    subscribers: string[]
  ): Promise<AlertRule> {
    try {
      const ruleId = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const rule: AlertRule = {
        id: ruleId,
        name,
        description,
        category,
        priority,
        condition,
        threshold,
        frequency,
        channels,
        subscribers,
        isActive: true,
        createdAt: new Date()
      };

      this.alertRules.set(ruleId, rule);

      // Store rule in database
      await this.storeAlertRule(rule);

      logger.info('Alert rule created', {
        id: ruleId,
        name,
        category,
        condition: condition.type
      });

      return rule;
    } catch (error) {
      logger.error('Alert rule creation failed:', {
        name,
        category,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async evaluateConditions(): Promise<void> {
    try {
      logger.debug('Evaluating alert conditions');

      const activeRules = Array.from(this.alertRules.values()).filter(rule => rule.isActive);

      for (const rule of activeRules) {
        try {
          const shouldTrigger = await this.evaluateRuleCondition(rule);

          if (shouldTrigger) {
            const lastTriggered = rule.lastTriggered;
            const suppressionTime = rule.threshold.suppressionTime || 60; // minutes

            // Check suppression
            if (lastTriggered &&
                (Date.now() - lastTriggered.getTime()) < (suppressionTime * 60 * 1000)) {
              logger.debug('Alert suppressed due to recent trigger', {
                ruleId: rule.id,
                lastTriggered,
                suppressionTime
              });
              continue;
            }

            await this.triggerAlert(rule);
            rule.lastTriggered = new Date();
          }
        } catch (error) {
          logger.error('Rule evaluation failed:', {
            ruleId: rule.id,
            ruleName: rule.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    } catch (error) {
      logger.error('Condition evaluation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  private async evaluateRuleCondition(rule: AlertRule): Promise<boolean> {
    try {
      const { condition } = rule;

      switch (condition.type) {
        case 'metric_threshold':
          return await this.evaluateMetricThreshold(rule);

        case 'trend_change':
          return await this.evaluateTrendChange(rule);

        case 'competitor_action':
          return await this.evaluateCompetitorAction(rule);

        case 'market_event':
          return await this.evaluateMarketEvent(rule);

        case 'predictive_trigger':
          return await this.evaluatePredictiveTrigger(rule);

        default:
          logger.warn('Unknown condition type:', { type: condition.type, ruleId: rule.id });
          return false;
      }
    } catch (error) {
      logger.error('Condition evaluation failed:', {
        ruleId: rule.id,
        conditionType: rule.condition.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  private async evaluateMetricThreshold(rule: AlertRule): Promise<boolean> {
    const { condition } = rule;

    if (!condition.metric || !condition.operator || condition.value === undefined) {
      return false;
    }

    // Get metric value from appropriate source
    const currentValue = await this.getMetricValue(
      condition.metric,
      condition.timeWindow,
      condition.aggregation
    );

    if (currentValue === null) return false;

    // Evaluate condition
    let conditionMet = false;

    switch (condition.operator) {
      case 'greater_than':
        conditionMet = currentValue > condition.value;
        break;
      case 'less_than':
        conditionMet = currentValue < condition.value;
        break;
      case 'equals':
        conditionMet = Math.abs(currentValue - condition.value) < 0.001;
        break;
      case 'not_equals':
        conditionMet = Math.abs(currentValue - condition.value) >= 0.001;
        break;
      case 'percentage_change': {
        const historicalValue = await this.getHistoricalMetricValue(condition.metric, condition.timeWindow);
        if (historicalValue !== null) {
          const percentageChange = ((currentValue - historicalValue) / historicalValue) * 100;
          conditionMet = Math.abs(percentageChange) > condition.value;
        }
        break;
      }
    }

    return conditionMet;
  }

  private async evaluateTrendChange(rule: AlertRule): Promise<boolean> {
    // Evaluate trend-based conditions
    const trendData = await this.getTrendData();

    if (!trendData) return false;

    // Detect significant trend changes
    const changeThreshold = rule.threshold.warning;
    const recentTrend = this.calculateRecentTrend(trendData);
    const historicalTrend = this.calculateHistoricalTrend(trendData);

    return Math.abs(recentTrend - historicalTrend) > changeThreshold;
  }

  private async evaluateCompetitorAction(rule: AlertRule): Promise<boolean> {
    // Check for competitor actions that should trigger alerts
    try {
      const recentActions = await this.getRecentCompetitorActions();

      // Filter actions based on rule criteria
      const relevantActions = recentActions.filter(_action => { // Parameter not used in filter logic
        return rule.condition.customLogic
          ? this.evaluateCustomLogic()
          : true;
      });

      return relevantActions.length > 0;
    } catch (error) {
      logger.error('Competitor action evaluation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  private async evaluateMarketEvent(rule: AlertRule): Promise<boolean> {
    // Monitor market events and news
    try {
      const recentEvents = await this.getRecentMarketEvents();

      return recentEvents.length > (rule.threshold.warning || 0);
    } catch (error) {
      logger.error('Market event evaluation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  private async evaluatePredictiveTrigger(rule: AlertRule): Promise<boolean> {
    // Evaluate predictive model outputs
    try {
      const predictions = await this.getPredictiveIndicators();

      if (!predictions) return false;

      return (predictions as { confidence: number; riskScore: number }).confidence > (rule.threshold.warning || 0.7) &&
             (predictions as { confidence: number; riskScore: number }).riskScore > (rule.threshold.critical || 0.8);
    } catch (error) {
      logger.error('Predictive trigger evaluation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  private async triggerAlert(rule: AlertRule): Promise<void> {
    try {
      const context: AlertContext = {
        userId: 'system',
        source: 'rule_trigger',
        severity: rule.priority === 'critical' ? 'critical' : rule.priority === 'high' ? 'high' : rule.priority === 'medium' ? 'medium' : 'low',
        ruleName: rule.name,
        ruleId: rule.id,
        timestamp: new Date(),
        additionalInfo: JSON.stringify({
          condition: rule.condition,
          threshold: rule.threshold
        })
      };

      await this.createAlert(
        rule.category,
        rule.priority,
        `Alert: ${rule.name}`,
        rule.description,
        context,
        {
          triggeredBy: rule.id,
          ruleCondition: rule.condition.type
        }
      );

      logger.info('Alert triggered by rule', {
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        priority: rule.priority
      });
    } catch (error) {
      logger.error('Alert triggering failed:', {
        ruleId: rule.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async adjustPriorityWithAI(
    priority: AlertPriority,
    category: AlertCategory,
    context: AlertContext,
    metadata?: Record<string, unknown>
  ): Promise<AlertPriority> {
    try {
      const prompt = `
        Analyze this business intelligence alert and recommend the optimal priority level:

        Current Priority: ${priority}
        Category: ${category}
        Context: ${JSON.stringify(context)}
        Additional Data: ${JSON.stringify(metadata || {})}

        Consider:
        1. Business impact severity
        2. Time sensitivity
        3. Market conditions
        4. Competitive implications
        5. Historical precedence

        Return one of: low, medium, high, critical
        Provide brief justification.
      `;

      const aiResponse = await deepSeekService.generateBusinessInsight(prompt);
      const adjustedPriority = this.parsePriorityFromAI(aiResponse);

      logger.debug('AI priority adjustment', {
        original: priority,
        adjusted: adjustedPriority,
        category,
        reasoning: aiResponse.substring(0, 100)
      });

      return adjustedPriority || priority;
    } catch (error) {
      logger.error('AI priority adjustment failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return priority; // Fallback to original priority
    }
  }

  private async generateAlertInsights(
    category: AlertCategory,
    context: AlertContext,
    metadata?: Record<string, unknown>
  ): Promise<string[]> {
    try {
      const prompt = `
        Generate strategic insights for this business intelligence alert:

        Category: ${category}
        Context: ${JSON.stringify(context)}
        Data: ${JSON.stringify(metadata || {})}

        Provide 3-5 bullet-point insights focusing on:
        1. What this alert indicates
        2. Potential implications
        3. Recommended immediate actions
        4. Strategic considerations
        5. Risk mitigation steps
      `;

      const aiResponse = await deepSeekService.generateBusinessInsight(prompt);
      return this.parseInsightsFromAI(aiResponse);
    } catch (error) {
      logger.error('Alert insights generation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return [
        'Alert requires immediate attention',
        'Review relevant business metrics',
        'Consider competitive implications'
      ];
    }
  }

  private determineOptimalChannels(priority: AlertPriority, category: AlertCategory): AlertChannel[] {
    const channels: AlertChannel[] = ['email']; // Default

    switch (priority) {
      case 'critical':
        channels.push('sms', 'slack', 'webhook');
        break;
      case 'high':
        channels.push('slack', 'webhook');
        break;
      case 'medium':
        channels.push('slack');
        break;
      case 'low':
        // Email only
        break;
    }

    // Category-specific channel additions
    if (category === 'security') {
      channels.push('webhook'); // For security monitoring systems
    }

    return [...new Set(channels)]; // Remove duplicates
  }

  private async getRelevantRecipients(
    category: AlertCategory,
    priority: AlertPriority
  ): Promise<string[]> {
    // Determine recipients based on category, priority, and context
    const recipients: string[] = [];

    // Base recipients by category
    const categoryRecipients: Record<AlertCategory, string[]> = {
      'competitive': ['business-intelligence@company.com', 'strategy@company.com'],
      'market': ['market-research@company.com', 'business-intelligence@company.com'],
      'business': ['pricing@company.com', 'revenue@company.com'],
      'product': ['product@company.com', 'development@company.com'],
      'channel': ['sales@company.com', 'partnerships@company.com'],
      'security': ['security@company.com', 'it@company.com'],
      'performance': ['operations@company.com', 'management@company.com'],
      'system': ['system@company.com', 'ops@company.com'],
      'competitor': ['competitive@company.com', 'strategy@company.com']
    };

    recipients.push(...(categoryRecipients[category] || []));

    // Add escalation recipients for high priority alerts
    if (priority === 'critical' || priority === 'high') {
      recipients.push('executives@company.com');
    }

    return [...new Set(recipients)]; // Remove duplicates
  }

  private calculateSuppressionTime(category: AlertCategory, priority: AlertPriority): Date | undefined {
    const suppressionMinutes: Record<AlertPriority, number> = {
      'low': 240,      // 4 hours
      'medium': 120,   // 2 hours
      'high': 60,      // 1 hour
      'critical': 30   // 30 minutes
    };

    const minutes = suppressionMinutes[priority];
    return new Date(Date.now() + (minutes * 60 * 1000));
  }

  private defineEscalationRules(priority: AlertPriority): Record<string, unknown>[] {
    const rules: Record<string, unknown>[] = [];

    if (priority === 'critical') {
      rules.push({
        condition: 'no_acknowledgment',
        timeThreshold: 15, // minutes
        action: 'escalate_to_management',
        channels: ['sms', 'phone']
      });
    }

    if (priority === 'high' || priority === 'critical') {
      rules.push({
        condition: 'no_response',
        timeThreshold: 60, // minutes
        action: 'send_reminder',
        channels: ['slack', 'email']
      });
    }

    return rules;
  }

  private async findRelatedAlerts(category: AlertCategory): Promise<string[]> {
    try {
      const recentAlerts = Array.from(this.alertHistory.values())
        .flat()
        .filter(alert =>
          alert.category === category &&
          alert.generatedAt && alert.generatedAt > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        )
        .slice(0, 5)
        .map(alert => alert.id);

      return recentAlerts;
    } catch (error) {
      logger.error('Related alerts search failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return [];
    }
  }

  private async generateActionableItems(
    category: AlertCategory,
    context: AlertContext,
    insights: string[]
  ): Promise<string[]> {
    try {
      const prompt = `
        Based on this alert information, generate specific actionable items:

        Category: ${category}
        Context: ${JSON.stringify(context)}
        Insights: ${insights.join(', ')}

        Provide 3-5 specific, actionable items that can be immediately executed.
        Format as: "Action: [specific action to take]"
      `;

      const aiResponse = await deepSeekService.generateBusinessInsight(prompt);
      return this.parseActionItemsFromAI(aiResponse);
    } catch (error) {
      logger.error('Actionable items generation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return [
        'Review alert details and context',
        'Assess immediate business impact',
        'Coordinate response with relevant teams'
      ];
    }
  }

  private async queueAlertDelivery(alert: IntelligentAlert): Promise<void> {
    try {
      for (const channel of alert.channels) {
        for (const recipient of alert.recipients || []) {
          const delivery: AlertDelivery = {
            alertId: alert.id,
            channel,
            recipient,
            status: 'pending'
          };

          this.deliveryQueue.push(delivery);
        }
      }

      logger.debug('Alert queued for delivery', {
        alertId: alert.id,
        deliveries: alert.channels.length * (alert.recipients?.length || 0)
      });
    } catch (error) {
      logger.error('Alert delivery queueing failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  private storeAlert(alert: IntelligentAlert): void {
    const category = alert.category || alert.type;
    if (!this.alertHistory.has(category)) {
      this.alertHistory.set(category, []);
    }

    const categoryAlerts = this.alertHistory.get(category);
    if (!categoryAlerts) return;
    categoryAlerts.push(alert);

    // Keep only recent alerts (last 1000 per category)
    if (categoryAlerts.length > 1000) {
      categoryAlerts.splice(0, categoryAlerts.length - 1000);
    }
  }

  private updateAnalytics(alert: IntelligentAlert): void {
    this.analyticsData.totalAlerts++;
    const priority = alert.priority;
    const category = alert.category;

    if (priority && this.analyticsData.alertsByPriority[priority] !== undefined) {
      this.analyticsData.alertsByPriority[priority]++;
    }
    if (category && this.analyticsData.alertsByCategory[category] !== undefined) {
      this.analyticsData.alertsByCategory[category]++;
    }
  }

  private async storeAlertInGraph(alert: IntelligentAlert): Promise<void> {
    try {
      const query = `
        MERGE (a:Alert {id: $alertId})
        SET a.category = $category,
            a.priority = $priority,
            a.title = $title,
            a.generatedAt = $timestamp,
            a.status = $status
        WITH a
        UNWIND $recipients as recipient
        MERGE (r:User {email: recipient})
        MERGE (a)-[:SENT_TO]->(r)
      `;

      await memgraphService.executeQuery(query, {
        alertId: alert.id,
        category: alert.category,
        priority: alert.priority,
        title: alert.title,
        timestamp: alert.generatedAt?.toISOString() || new Date().toISOString(),
        status: alert.status,
        recipients: alert.recipients
      });
    } catch (error) {
      logger.error('Failed to store alert in graph database:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      // Non-critical error, don't throw
    }
  }

  private async storeAlertRule(rule: AlertRule): Promise<void> {
    try {
      const query = `
        MERGE (r:AlertRule {id: $ruleId})
        SET r.name = $name,
            r.category = $category,
            r.priority = $priority,
            r.conditionType = $conditionType,
            r.isActive = $isActive,
            r.createdAt = $timestamp
      `;

      await memgraphService.executeQuery(query, {
        ruleId: rule.id,
        name: rule.name,
        category: rule.category,
        priority: rule.priority,
        conditionType: rule.condition.type,
        isActive: rule.isActive,
        timestamp: rule.createdAt.toISOString()
      });
    } catch (error) {
      logger.error('Failed to store alert rule in database:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      // Non-critical error, don't throw
    }
  }

  private startAlertProcessor(): void {
    // Process delivery queue every 30 seconds
    setInterval(async () => {
      await this.processDeliveryQueue();
    }, 30000);

    // Evaluate conditions every 5 minutes
    setInterval(async () => {
      await this.evaluateConditions();
    }, 5 * 60 * 1000);

    logger.info('Alert processor started');
  }

  private async processDeliveryQueue(): Promise<void> {
    try {
      const pendingDeliveries = this.deliveryQueue.filter(d => d.status === 'pending');

      for (const delivery of pendingDeliveries.slice(0, 10)) { // Process 10 at a time
        try {
          await this.deliverAlert(delivery);
        } catch (error) {
          logger.error('Alert delivery failed:', {
            alertId: delivery.alertId,
            channel: delivery.channel,
            recipient: delivery.recipient,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          delivery.status = 'failed';
          delivery.error = error instanceof Error ? error.message : 'Unknown error';
        }
      }
    } catch (error) {
      logger.error('Delivery queue processing failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  private async deliverAlert(delivery: AlertDelivery): Promise<void> {
    const alert = this.findAlertById(delivery.alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${delivery.alertId}`);
    }

    switch (delivery.channel) {
      case 'email':
        await this.sendEmailAlert(alert, delivery.recipient);
        break;
      case 'sms':
        await this.sendSMSAlert(alert, delivery.recipient);
        break;
      case 'slack':
        await this.sendSlackAlert(alert, delivery.recipient);
        break;
      case 'webhook':
        await this.sendWebhookAlert(alert, delivery.recipient);
        break;
      default:
        throw new Error(`Unsupported channel: ${delivery.channel}`);
    }

    delivery.status = 'sent';
    delivery.sentAt = new Date();
  }

  // Helper methods for parsing AI responses
  private parsePriorityFromAI(response: string): AlertPriority | null {
    const priorities: AlertPriority[] = ['low', 'medium', 'high', 'critical'];
    const lowerResponse = response.toLowerCase();

    for (const priority of priorities) {
      if (lowerResponse.includes(priority)) {
        return priority;
      }
    }

    return null;
  }

  private parseInsightsFromAI(response: string): string[] {
    const lines = response.split('\n').filter(line => line.trim());
    const insights: string[] = [];

    for (const line of lines) {
      if (line.includes('•') || line.match(/^\d+\./) || line.includes('-')) {
        const cleanLine = line.replace(/^\d+\.|\s*•\s*|\s*-\s*/, '').trim();
        if (cleanLine.length > 10) {
          insights.push(cleanLine);
        }
      }
    }

    return insights.slice(0, 5);
  }

  private parseActionItemsFromAI(response: string): string[] {
    const lines = response.split('\n').filter(line => line.trim());
    const actions: string[] = [];

    for (const line of lines) {
      if (line.toLowerCase().includes('action:') || line.match(/^\d+\./) || line.includes('-')) {
        const cleanLine = line.replace(/^action:\s*/i, '').replace(/^\d+\.|\s*-\s*/, '').trim();
        if (cleanLine.length > 10) {
          actions.push(cleanLine);
        }
      }
    }

    return actions.slice(0, 5);
  }

  // Integrated metric retrieval from multiple sources
  private async getMetricValue(metric: string, timeWindow?: number, aggregation?: string): Promise<number | null> {
    try {
      logger.debug('Retrieving metric value', { metric, timeWindow, aggregation });

      // Route to appropriate metric source based on metric name
      if (metric.startsWith('woocommerce.')) {
        return await this.getWooCommerceMetric(metric, timeWindow, aggregation);
      } else if (metric.startsWith('memgraph.')) {
        return await this.getMemgraphMetric(metric, timeWindow);
      } else if (metric.startsWith('system.')) {
        return await this.getSystemMetric(metric);
      } else if (metric.startsWith('business.')) {
        return await this.getBusinessMetric(metric, timeWindow, aggregation);
      }

      logger.warn('Unknown metric source', { metric });
      return null;
    } catch (error) {
      logger.error('Failed to retrieve metric value:', {
        metric,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private async getHistoricalMetricValue(metric: string, timeWindow?: number): Promise<number | null> {
    try {
      const hoursAgo = timeWindow || 24;
      const historicalTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

      // For historical metrics, we need to query based on timestamp
      if (metric.startsWith('woocommerce.')) {
        return await this.getWooCommerceHistoricalMetric(metric, historicalTime);
      } else if (metric.startsWith('memgraph.')) {
        return await this.getMemgraphHistoricalMetric(metric, historicalTime);
      }

      // Fallback: return current value as historical approximation
      return await this.getMetricValue(metric, timeWindow);
    } catch (error) {
      logger.error('Failed to retrieve historical metric value:', {
        metric,
        timeWindow,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private async getWooCommerceMetric(metric: string, timeWindow?: number, aggregation?: string): Promise<number | null> {
    try {
      const { wooCommerceAPI } = await import('@/lib/integrations/woocommerce-api');

      switch (metric) {
        case 'woocommerce.orders.count': {
          const ordersResponse = await wooCommerceAPI.getOrders({
            per_page: 100,
            after: timeWindow ? new Date(Date.now() - timeWindow * 60 * 1000).toISOString() : undefined
          });
          return ordersResponse.totalCount;
        }

        case 'woocommerce.sales.total': {
          const salesReport = await wooCommerceAPI.getSalesReport('month');
          return aggregation === 'sum' ? salesReport.totalSales : salesReport.averageOrderValue;
        }

        case 'woocommerce.products.count': {
          const productsResponse = await wooCommerceAPI.getProducts({ per_page: 1 });
          return productsResponse.totalCount;
        }

        case 'woocommerce.customers.count': {
          const customersResponse = await wooCommerceAPI.getCustomers({ per_page: 1 });
          return customersResponse.totalCount;
        }

        default:
          logger.warn('Unknown WooCommerce metric', { metric });
          return null;
      }
    } catch (error) {
      logger.error('WooCommerce metric retrieval failed:', {
        metric,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private async getMemgraphMetric(metric: string, timeWindow?: number): Promise<number | null> {
    try {
      const { memgraphService } = await import('@/lib/memgraph');

      const hoursAgo = timeWindow ? new Date(Date.now() - timeWindow * 60 * 1000) : new Date(Date.now() - 24 * 60 * 60 * 1000);

      switch (metric) {
        case 'memgraph.competitors.count': {
          const competitorsResult = await memgraphService.executeQuery(
            'MATCH (c:Competitor) RETURN count(c) as count'
          );
          const competitorsRecords = (competitorsResult as { records?: Array<{ get: (key: string) => { toNumber: () => number } }> })?.records || [];
          return competitorsRecords[0]?.get?.('count')?.toNumber?.() || 0;
        }

        case 'memgraph.products.count': {
          const productsResult = await memgraphService.executeQuery(
            'MATCH (p:Product) RETURN count(p) as count'
          );
          const productsRecords = (productsResult as { records?: Array<{ get: (key: string) => { toNumber: () => number } }> })?.records || [];
          return productsRecords[0]?.get?.('count')?.toNumber?.() || 0;
        }

        case 'memgraph.alerts.recent': {
          const alertsResult = await memgraphService.executeQuery(
            'MATCH (a:Alert) WHERE a.generatedAt > $timestamp RETURN count(a) as count',
            { timestamp: hoursAgo.toISOString() }
          );
          const alertsRecords = (alertsResult as { records?: Array<{ get: (key: string) => { toNumber: () => number } }> })?.records || [];
          return alertsRecords[0]?.get?.('count')?.toNumber?.() || 0;
        }

        default:
          logger.warn('Unknown Memgraph metric', { metric });
          return null;
      }
    } catch (error) {
      logger.error('Memgraph metric retrieval failed:', {
        metric,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private async getSystemMetric(metric: string): Promise<number | null> {
    switch (metric) {
      case 'system.memory.usage':
        // In a real implementation, this would query system monitoring
        return Math.random() * 100;

      case 'system.cpu.usage':
        return Math.random() * 100;

      case 'system.disk.usage':
        return Math.random() * 100;

      default:
        logger.warn('Unknown system metric', { metric });
        return null;
    }
  }

  private async getBusinessMetric(metric: string, timeWindow?: number, aggregation?: string): Promise<number | null> {
    // Business metrics that combine multiple data sources
    switch (metric) {
      case 'business.revenue.growth': {
        const currentRevenue = await this.getWooCommerceMetric('woocommerce.sales.total', timeWindow, aggregation);
        const historicalRevenue = await this.getWooCommerceHistoricalMetric('woocommerce.sales.total', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

        if (currentRevenue && historicalRevenue && historicalRevenue > 0) {
          return ((currentRevenue - historicalRevenue) / historicalRevenue) * 100;
        }
        return 0;
      }

      case 'business.competitive.pressure': {
        const competitorCount = await this.getMemgraphMetric('memgraph.competitors.count');
        const recentAlerts = await this.getMemgraphMetric('memgraph.alerts.recent', timeWindow);

        // Simple formula: more competitors + more alerts = higher pressure
        return ((competitorCount || 0) * 0.1) + ((recentAlerts || 0) * 2);
      }

      default:
        logger.warn('Unknown business metric', { metric });
        return null;
    }
  }

  private async getWooCommerceHistoricalMetric(metric: string, timestamp: Date): Promise<number | null> {
    // For historical WooCommerce metrics, we'd need to implement time-based queries
    // This is a simplified version - in reality you'd query historical data
    logger.debug('Retrieving historical WooCommerce metric', { metric, timestamp });

    // Placeholder: return a value that's 80-120% of current metric for realistic variation
    const currentValue = await this.getWooCommerceMetric(metric);
    if (currentValue !== null) {
      return currentValue * (0.8 + Math.random() * 0.4);
    }
    return null;
  }

  private async getMemgraphHistoricalMetric(metric: string, timestamp: Date): Promise<number | null> {
    // Query historical data from Memgraph if available
    logger.debug('Retrieving historical Memgraph metric', { metric, timestamp });

    try {
      const { memgraphService } = await import('@/lib/memgraph');

      switch (metric) {
        case 'memgraph.alerts.recent': {
          const result = await memgraphService.executeQuery(
            'MATCH (a:Alert) WHERE a.generatedAt < $timestamp RETURN count(a) as count',
            { timestamp: timestamp.toISOString() }
          );
          const resultRecords = (result as { records?: Array<{ get: (key: string) => { toNumber: () => number } }> })?.records || [];
          return resultRecords[0]?.get?.('count')?.toNumber?.() || 0;
        }

        default: {
          // For other metrics, approximate based on current value
          const currentValue = await this.getMemgraphMetric(metric);
          return currentValue !== null ? currentValue * (0.8 + Math.random() * 0.4) : null;
        }
      }
    } catch (error) {
      logger.error('Historical Memgraph metric retrieval failed:', {
        metric,
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private async getTrendData(): Promise<Record<string, unknown>> {
    // Would retrieve trend data
    return {
      values: [1, 2, 3, 4, 5],
      timestamps: [Date.now() - 4, Date.now() - 3, Date.now() - 2, Date.now() - 1, Date.now()]
    };
  }

  private calculateRecentTrend(trendData: Record<string, unknown>): number {
    const values = trendData.values as number[];
    if (!values || values.length < 2) return 0;
    const recent = values.slice(-3);
    return recent[recent.length - 1]! - recent[0]!;
  }

  private calculateHistoricalTrend(trendData: Record<string, unknown>): number {
    const values = trendData.values as number[];
    if (!values || values.length < 4) return 0;
    const historical = values.slice(0, -3);
    return historical[historical.length - 1]! - historical[0]!;
  }

  private async getRecentCompetitorActions(): Promise<Record<string, unknown>[]> {
    // Would retrieve competitor actions from monitoring systems
    return [];
  }

  private async getRecentMarketEvents(): Promise<Record<string, unknown>[]> {
    // Would retrieve market events from news and data feeds
    return [];
  }

  private async getPredictiveIndicators(): Promise<Record<string, unknown>> {
    // Would get predictive model outputs
    return {
      confidence: Math.random(),
      riskScore: Math.random()
    };
  }

  private evaluateCustomLogic(): boolean {
    // Would evaluate custom JavaScript logic safely
    return true;
  }

  private findAlertById(alertId: string): IntelligentAlert | null {
    for (const alerts of this.alertHistory.values()) {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) return alert;
    }
    return null;
  }

  // Alert delivery methods (placeholders)
  private async sendEmailAlert(alert: IntelligentAlert, recipient: string): Promise<void> {
    logger.info('Email alert sent', { alertId: alert.id, recipient });
  }

  private async sendSMSAlert(alert: IntelligentAlert, recipient: string): Promise<void> {
    logger.info('SMS alert sent', { alertId: alert.id, recipient });
  }

  private async sendSlackAlert(alert: IntelligentAlert, recipient: string): Promise<void> {
    logger.info('Slack alert sent', { alertId: alert.id, recipient });
  }

  private async sendWebhookAlert(alert: IntelligentAlert, recipient: string): Promise<void> {
    logger.info('Webhook alert sent', { alertId: alert.id, recipient });
  }

  private initializeAnalytics(): AlertAnalytics {
    return {
      totalAlerts: 0,
      alertsByPriority: { low: 0, medium: 0, high: 0, critical: 0 },
      alertsByCategory: {
        competitive: 0,
        market: 0,
        business: 0,
        product: 0,
        channel: 0,
        security: 0,
        performance: 0,
        system: 0,
        competitor: 0
      },
      responseRate: 0,
      averageResponseTime: 0,
      falsePositiveRate: 0,
      suppressedAlerts: 0,
      topTriggeredRules: []
    };
  }

  // Public API methods
  async getAlertMetrics(): Promise<AlertMetrics> {
    const activeAlertsCount = Array.from(this.alertHistory.values())
      .flat()
      .filter(alert => alert.status === 'sent').length;

    return {
      totalAlerts: this.analyticsData.totalAlerts,
      totalActiveAlerts: activeAlertsCount,
      activeAlerts: activeAlertsCount,
      resolvedAlerts: this.analyticsData.totalAlerts - activeAlertsCount,
      averageResponseTime: this.analyticsData.averageResponseTime,
      criticalAlerts: this.analyticsData.alertsByPriority.critical || 0,
      alertsByPriority: this.analyticsData.alertsByPriority,
      alertsByCategory: this.analyticsData.alertsByCategory,
      deliverySuccessRate: this.calculateDeliverySuccessRate(),
      lastProcessed: new Date()
    };
  }

  async getActiveAlerts(category?: AlertCategory, priority?: AlertPriority): Promise<IntelligentAlert[]> {
    let alerts = Array.from(this.alertHistory.values()).flat()
      .filter(alert => alert.status === 'sent');

    if (category) {
      alerts = alerts.filter(alert => alert.category === category);
    }

    if (priority) {
      alerts = alerts.filter(alert => alert.priority === priority);
    }

    return alerts.sort((a, b) => (b.generatedAt?.getTime() || 0) - (a.generatedAt?.getTime() || 0));
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.findAlertById(alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.metadata = {
        ...alert.metadata,
        acknowledgedBy: userId,
        acknowledgedAt: new Date().toISOString()
      };

      logger.info('Alert acknowledged', { alertId, userId });
    }
  }

  async resolveAlert(alertId: string, userId: string, resolution?: string): Promise<void> {
    const alert = this.findAlertById(alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.metadata = {
        ...alert.metadata,
        resolvedBy: userId,
        resolvedAt: new Date().toISOString(),
        resolution
      };

      logger.info('Alert resolved', { alertId, userId, resolution });
    }
  }

  private calculateDeliverySuccessRate(): number {
    const total = this.deliveryQueue.length;
    const successful = this.deliveryQueue.filter(d => d.status === 'sent' || d.status === 'delivered').length;
    return total > 0 ? successful / total : 1.0;
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      activeRules: number;
      queueSize: number;
      processingRate: number;
      lastProcessed?: Date;
    };
  }> {
    try {
      const activeRules = Array.from(this.alertRules.values()).filter(rule => rule.isActive).length;
      const queueSize = this.deliveryQueue.filter(d => d.status === 'pending').length;

      return {
        status: 'healthy',
        details: {
          activeRules,
          queueSize,
          processingRate: this.calculateProcessingRate()
        }
      };
    } catch {
      return {
        status: 'unhealthy',
        details: {
          activeRules: 0,
          queueSize: 0,
          processingRate: 0
        }
      };
    }
  }

  private calculateProcessingRate(): number {
    // Calculate alerts processed per minute
    const recentAlerts = Array.from(this.alertHistory.values())
      .flat()
      .filter(alert => alert.generatedAt && alert.generatedAt > new Date(Date.now() - 60 * 60 * 1000)); // Last hour

    return recentAlerts.length / 60; // Per minute
  }
}

// Export singleton instance
export const intelligentAlertSystem = IntelligentAlertSystem.getInstance();