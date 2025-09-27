import { createApiHandler, successResponse, errorResponse, AuthenticatedRequest } from '@/lib/api/middleware';
import { wooCommerceAPI } from '@/lib/integrations/woocommerce-api';
import { z } from 'zod';

const querySchema = z.object({
  type: z.enum(['products', 'orders', 'customers', 'sales-report', 'top-selling', 'test-connection']),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  period: z.enum(['week', 'month', 'year']).optional().default('month'),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional()
});

// GET /api/data/woocommerce - Fetch WooCommerce data for BI dashboards
export const GET = createApiHandler(
  async (request: AuthenticatedRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const query = querySchema.parse({
        type: searchParams.get('type'),
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        period: searchParams.get('period'),
        search: searchParams.get('search'),
        category: searchParams.get('category'),
        status: searchParams.get('status')
      });

      let data;

      switch (query.type) {
        case 'products':
          data = await wooCommerceAPI.getProducts({
            page: query.page,
            per_page: query.limit,
            search: query.search,
            category: query.category,
            status: query.status
          });
          break;

        case 'orders':
          data = await wooCommerceAPI.getOrders({
            page: query.page,
            per_page: query.limit,
            status: query.status
          });
          break;

        case 'customers':
          data = await wooCommerceAPI.getCustomers({
            page: query.page,
            per_page: query.limit,
            search: query.search
          });
          break;

        case 'sales-report':
          data = await wooCommerceAPI.getSalesReport(query.period);
          break;

        case 'top-selling':
          data = await wooCommerceAPI.getTopSellingProducts(query.limit);
          break;

        case 'test-connection':
          data = await wooCommerceAPI.testConnection();
          break;

        default:
          return errorResponse('Invalid data type requested', 400);
      }

      return successResponse(data, {
        timestamp: new Date().toISOString(),
        requestId: `wc_${Math.random().toString(36).substr(2, 9)}`
      });

    } catch (error) {
      console.error('WooCommerce API error:', error);

      if (error instanceof Error) {
        if (error.message.includes('configuration is incomplete')) {
          return errorResponse('WooCommerce API not configured', 503);
        }
        if (error.message.includes('WooCommerce API Error')) {
          return errorResponse('WooCommerce API request failed', 502);
        }
      }

      return errorResponse('Failed to fetch WooCommerce data', 500);
    }
  },
  {
    requireAuth: true,
    allowedRoles: ['admin', 'analyst'],
    rateLimit: { maxRequests: 60, windowMs: 60000 }, // 60 requests per minute
    validateQuery: querySchema
  }
);