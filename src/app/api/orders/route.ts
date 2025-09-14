import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/woocommerce';
import { CheckoutData } from '@/types/woocommerce';
import { handleError } from '@/lib/error-sanitizer';

export async function POST(request: NextRequest) {
  try {
    const orderData: CheckoutData = await request.json();

    // Validate order data
    if (!orderData.billing || !orderData.line_items || orderData.line_items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      );
    }

    // Create order on server-side (secure)
    const order = await createOrder(orderData);

    return NextResponse.json(order);
  } catch (error) {
    const sanitizedError = handleError(error, 'create-order');

    return NextResponse.json(
      { error: sanitizedError.message },
      { status: 500 }
    );
  }
}