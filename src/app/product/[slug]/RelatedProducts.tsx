import { getProductsByCategory } from '@/lib/woocommerce';
import ProductCard from '@/components/ProductCard';

interface RelatedProductsProps {
  categoryId: number;
  currentProductId: number;
}

export default async function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  try {
    const relatedProducts = await getProductsByCategory(categoryId, 8);
    
    // Filter out the current product
    const filteredProducts = relatedProducts.filter(product => product.id !== currentProductId);

    if (filteredProducts.length === 0) {
      return null;
    }

    return (
      <div className="border-t border-gray-200 pt-16">
        <h2 className="text-heading-2 text-gray-900 mb-8 text-center">
          Related Products
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading related products:', error);
    return null;
  }
}