import { getAllProducts } from '@/lib/woocommerce';
import { serializeProducts } from '@/lib/product-serializer';
import ProductCard from '@/components/ProductCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products - Agriko Organic Farm',
  description: 'Browse our organic products',
};

async function ProductsPageSimple() {
  try {
    const rawProducts = await getAllProducts({
      per_page: 12,
      orderby: 'menu_order',
      order: 'asc',
      status: 'publish'
    });

    const products = serializeProducts(rawProducts);

    if (products.length === 0) {
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Products</h1>
          <p>No products available.</p>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">All Products</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={false}
            />
          ))}
        </div>
      </div>
    );

  } catch {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Products</h1>
        <p className="text-red-500">Unable to load products. Please try again later.</p>
      </div>
    );
  }
}

export default ProductsPageSimple;
export const revalidate = 3600;