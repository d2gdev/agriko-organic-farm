import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/solid';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  // Generate BreadcrumbList structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://shop.agrikoph.com"
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.name,
        "item": item.href ? `https://shop.agrikoph.com${item.href}` : undefined
      }))
    ]
  };

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />
      
      <nav className="bg-neutral-50 border-b border-neutral-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/" className="text-neutral-600 hover:text-primary-700 transition-colors flex items-center">
              <HomeIcon className="w-4 h-4" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          
          {items.map((item, index) => (
            <li key={index} className="flex items-center space-x-2">
              <ChevronRightIcon className="w-4 h-4 text-neutral-400" />
              {item.href && index < items.length - 1 ? (
                <Link 
                  href={item.href} 
                  className="text-neutral-600 hover:text-primary-700 transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="text-neutral-900 font-medium">
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
    </>
  );
}