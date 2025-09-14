import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products - Agriko Organic Farm',
  description: 'Browse our organic products',
};

export default function ProductsPageMinimal() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>
      <p>This is a minimal products page to test routing.</p>
      <div className="mt-4">
        <p>If you can see this and it stays visible, the routing works.</p>
        <p>If this disappears and you see a 404, there&apos;s a client-side issue.</p>
      </div>
    </div>
  );
}

export const revalidate = 3600;