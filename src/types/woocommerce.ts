export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  permalink?: string;
  description?: string;
  short_description?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  on_sale?: boolean;
  status?: 'draft' | 'pending' | 'private' | 'publish';
  featured?: boolean;
  catalog_visibility?: 'visible' | 'catalog' | 'search' | 'hidden';
  sku?: string;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity?: number | null;
  manage_stock?: boolean;
  categories?: WCCategory[];
  tags?: WCTag[];
  images?: WCImage[];
  attributes?: WCAttribute[];
  variations?: number[];
  weight?: string;
  dimensions?: WCDimensions;
  meta_data?: WCMetaData[];
  average_rating?: string;
  rating_count?: number;
  total_sales?: number;
  date_created?: string;
  date_modified?: string;
}

export interface WCCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  display: 'default' | 'products' | 'subcategories' | 'both';
  image: WCImage | null;
  menu_order: number;
  count: number;
}

export interface WCTag {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export interface WCImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface WCAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface WCDimensions {
  length: string;
  width: string;
  height: string;
}

export interface WCMetaData {
  id: number;
  key: string;
  value: string;
}

export interface WCCartItem {
  key: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  data_hash: string;
  line_tax_data: object;
  line_subtotal: number;
  line_subtotal_tax: number;
  line_total: number;
  line_tax: number;
  data: WCProduct;
}

export interface WCOrder {
  id: number;
  parent_id: number;
  status: string;
  currency: string;
  version: string;
  prices_include_tax: boolean;
  date_created: string;
  date_modified: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  customer_id: number;
  order_key: string;
  billing: WCAddress;
  shipping: WCAddress;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  customer_ip_address: string;
  customer_user_agent: string;
  created_via: string;
  customer_note: string;
  date_completed: string | null;
  date_paid: string | null;
  cart_hash: string;
  number: string;
  meta_data: WCMetaData[];
  line_items: WCOrderLineItem[];
  tax_lines: WCTaxLine[];
  shipping_lines: WCShippingLine[];
  fee_lines: WCFeeLine[];
  coupon_lines: WCCouponLine[];
  refunds: WCRefund[];
  payment_url: string;
  is_editable: boolean;
  needs_payment: boolean;
  needs_processing: boolean;
  date_created_gmt: string;
  date_modified_gmt: string;
  date_completed_gmt: string | null;
  date_paid_gmt: string | null;
  currency_symbol: string;
}

export interface WCAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface WCOrderLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  tax_class: string;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  taxes: WCTax[];
  meta_data: WCMetaData[];
  sku: string;
  price: number;
  image: WCImage;
  parent_name: string | null;
}

export interface WCTax {
  id: number;
  total: string;
  subtotal: string;
}

export interface WCTaxLine {
  id: number;
  rate_code: string;
  rate_id: number;
  label: string;
  compound: boolean;
  tax_total: string;
  shipping_tax_total: string;
  rate_percent: number;
  meta_data: WCMetaData[];
}

export interface WCShippingLine {
  id: number;
  method_title: string;
  method_id: string;
  instance_id: string;
  total: string;
  total_tax: string;
  taxes: WCTax[];
  meta_data: WCMetaData[];
}

export interface WCFeeLine {
  id: number;
  name: string;
  tax_class: string;
  tax_status: string;
  total: string;
  total_tax: string;
  taxes: WCTax[];
  meta_data: WCMetaData[];
}

export interface WCCouponLine {
  id: number;
  code: string;
  discount: string;
  discount_tax: string;
  meta_data: WCMetaData[];
}

export interface WCRefund {
  id: number;
  reason: string;
  total: string;
}

export interface CartItem extends WCCartItem {
  product: WCProduct;
}

export interface CheckoutData {
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  billing: WCAddress;
  shipping: WCAddress;
  line_items: Array<{
    product_id: number;
    quantity: number;
  }>;
  customer_note?: string;
}