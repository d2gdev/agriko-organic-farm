import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getOrderById } from '@/lib/woocommerce';
import { formatPrice, getProductMainImage } from '@/lib/utils';
import type { Metadata } from 'next';
import HeroSection from '@/components/HeroSection';

interface OrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Generate metadata for the order page
export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  const orderId = parseInt(id);
  
  if (isNaN(orderId)) {
    return {
      title: 'Invalid Order - Agriko',
      description: 'Invalid order ID provided.',
    };
  }

  try {
    const order = await getOrderById(orderId);
    
    if (!order) {
      return {
        title: 'Order Not Found - Agriko',
        description: 'The requested order could not be found.',
      };
    }

    return {
      title: `Order #${order.number} - Agriko`,
      description: `Order confirmation for order #${order.number} placed on ${new Date(order.date_created).toLocaleDateString()}`,
      robots: 'noindex, nofollow', // Don't index order pages
    };
  } catch (error) {
    return {
      title: 'Order - Agriko',
      description: 'Order confirmation page',
    };
  }
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  const orderId = parseInt(id);
  
  if (isNaN(orderId)) {
    notFound();
  }

  let order;
  try {
    order = await getOrderById(orderId);
  } catch (error) {
    console.error('Error fetching order:', error);
    order = null;
  }

  if (!order) {
    notFound();
  }

  const orderDate = new Date(order.date_created);
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    'on-hold': 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
    failed: 'bg-red-100 text-red-800',
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <HeroSection 
        title="Agriko"
        subtitle="Order Confirmation"
        description={`Thank you for your order #${order.number}! Your organic products will be prepared and delivered fresh from our farm.`}
        showButtons={false}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-green-800">Order Confirmed!</h1>
            <p className="text-green-700 mt-1">
              Thank you for your order. We&#39;ve received your order and will begin processing it shortly.
            </p>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Order #{order.number}
              </h2>
              <p className="text-sm text-gray-600">
                Placed on {orderDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="mt-3 sm:mt-0">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="px-6 py-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.line_items.map((item) => (
              <div key={item.id} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Image
                    src={item.image?.src || '/placeholder-product.jpg'}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-medium text-gray-900 line-clamp-2">
                    {item.name}
                  </h4>
                  {item.sku && (
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </span>
                    <span className="text-base font-medium text-gray-900">
                      {formatPrice(parseFloat(item.total))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Totals */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">
                {formatPrice(parseFloat(order.total) - parseFloat(order.total_tax) - parseFloat(order.shipping_total))}
              </span>
            </div>
            {parseFloat(order.shipping_total) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-medium">{formatPrice(parseFloat(order.shipping_total))}</span>
              </div>
            )}
            {parseFloat(order.total_tax) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">{formatPrice(parseFloat(order.total_tax))}</span>
              </div>
            )}
            <hr className="border-gray-200" />
            <div className="flex justify-between">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(parseFloat(order.total))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Billing Address */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-900">
              {order.billing.first_name} {order.billing.last_name}
            </p>
            {order.billing.company && <p>{order.billing.company}</p>}
            <p>{order.billing.address_1}</p>
            {order.billing.address_2 && <p>{order.billing.address_2}</p>}
            <p>
              {order.billing.city}, {order.billing.state} {order.billing.postcode}
            </p>
            <p>{order.billing.country}</p>
            {order.billing.email && <p className="mt-3">Email: {order.billing.email}</p>}
            {order.billing.phone && <p>Phone: {order.billing.phone}</p>}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-900">
              {order.shipping.first_name} {order.shipping.last_name}
            </p>
            {order.shipping.company && <p>{order.shipping.company}</p>}
            <p>{order.shipping.address_1}</p>
            {order.shipping.address_2 && <p>{order.shipping.address_2}</p>}
            <p>
              {order.shipping.city}, {order.shipping.state} {order.shipping.postcode}
            </p>
            <p>{order.shipping.country}</p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
          <p className="text-sm text-gray-600">
            {order.payment_method_title || order.payment_method}
          </p>
          {order.transaction_id && (
            <p className="text-sm text-gray-600 mt-2">
              Transaction ID: {order.transaction_id}
            </p>
          )}
        </div>

        {/* Order Status & Next Steps */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What&#39;s Next?</h3>
          <div className="text-sm text-gray-600 space-y-2">
            {order.status === 'pending' && (
              <>
                <p>• We&#39;re processing your order</p>
                <p>• You&#39;ll receive a confirmation email shortly</p>
                <p>• We&#39;ll notify you when your order ships</p>
              </>
            )}
            {order.status === 'processing' && (
              <>
                <p>• Your order is being prepared</p>
                <p>• We&#39;ll notify you when your order ships</p>
                <p>• Expected shipping: 1-2 business days</p>
              </>
            )}
            {order.status === 'completed' && (
              <>
                <p>• Your order has been delivered</p>
                <p>• Thank you for your business!</p>
                <p>• Need help? Contact our support team</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Customer Note */}
      {order.customer_note && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Notes</h3>
          <p className="text-sm text-gray-600">{order.customer_note}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center"
        >
          Continue Shopping
        </Link>
        <button
          onClick={() => window.print()}
          className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Print Order
        </button>
        <Link
          href="/contact"
          className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-colors text-center"
        >
          Contact Support
        </Link>
      </div>
      </div>
    </>
  );
}