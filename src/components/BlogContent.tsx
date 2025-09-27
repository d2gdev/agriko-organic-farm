import Image from 'next/image';
import { urlFor } from '@/lib/sanity';
import { logger } from '@/lib/logger';
import { SanityPortableTextBlock, SanityTextBlock, SanityImageBlock } from '@/types/sanity';

interface BlogContentProps {
  content: SanityPortableTextBlock[];
}

// Safe text renderer without HTML injection
function renderTextSpan(child: SanityTextBlock['children'][0], markDefs?: SanityTextBlock['markDefs']): JSX.Element[] {
  if (child._type !== 'span') return [<span key={child._key}>{child.text}</span>];

  let elements: JSX.Element[] = [<span key={child._key}>{child.text}</span>];

  // Handle basic marks safely with JSX
  if (child.marks && child.marks.length > 0) {
    child.marks.forEach((mark) => {
      if (mark === 'strong') {
        elements = [<strong key={`${child._key}-strong`}>{elements}</strong>];
      } else if (mark === 'em') {
        elements = [<em key={`${child._key}-em`}>{elements}</em>];
      } else if (mark === 'code') {
        elements = [
          <code key={`${child._key}-code`} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
            {elements}
          </code>
        ];
      } else if (markDefs) {
        // Handle link marks
        const linkDef = markDefs.find(def => def._key === mark);
        if (linkDef && linkDef._type === 'link' && linkDef.href) {
          elements = [
            <a
              key={`${child._key}-link`}
              href={linkDef.href}
              className="text-green-600 hover:text-green-700 underline"
              target={linkDef.href.startsWith('http') ? '_blank' : undefined}
              rel={linkDef.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {elements}
            </a>
          ];
        }
      }
    });
  }

  return elements;
}

// Simple text block renderer
function renderTextBlock(block: SanityTextBlock): JSX.Element {
  if (!block.children) return <div key={block._key} />;

  const content = block.children.map((child) =>
    renderTextSpan(child, block.markDefs)
  ).flat();

  // Render different text styles safely
  switch (block.style) {
    case 'h1':
      return (
        <h1 key={block._key} className="text-4xl font-bold text-gray-900 mb-6 mt-8">
          {content}
        </h1>
      );
    case 'h2':
      return (
        <h2 key={block._key} className="text-3xl font-bold text-gray-900 mb-4 mt-8">
          {content}
        </h2>
      );
    case 'h3':
      return (
        <h3 key={block._key} className="text-2xl font-bold text-gray-900 mb-4 mt-6">
          {content}
        </h3>
      );
    case 'h4':
      return (
        <h4 key={block._key} className="text-xl font-bold text-gray-900 mb-3 mt-6">
          {content}
        </h4>
      );
    case 'blockquote':
      return (
        <blockquote key={block._key} className="border-l-4 border-green-500 pl-6 py-2 my-6 italic text-gray-700 bg-gray-50">
          {content}
        </blockquote>
      );
    default:
      return (
        <p key={block._key} className="text-gray-700 leading-relaxed mb-4">
          {content}
        </p>
      );
  }
}

// Simple image renderer with proper blur placeholders
function renderImage(imageBlock: SanityImageBlock): JSX.Element {
  const imageUrl = urlFor(imageBlock).width(800).height(450).url();
  const blurDataURL = urlFor(imageBlock).width(20).height(12).blur(10).quality(10).url();

  return (
    <div key={imageBlock._key} className="my-8">
      <div className="relative aspect-video w-full rounded-lg overflow-hidden">
        <Image
          src={imageUrl}
          alt={imageBlock.alt || 'Blog image'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
          loading="lazy"
          placeholder="blur"
          blurDataURL={blurDataURL}
        />
      </div>
      {imageBlock.alt && (
        <p className="text-sm text-gray-600 text-center mt-2 italic">
          {imageBlock.alt}
        </p>
      )}
    </div>
  );
}

export default function BlogContent({ content }: BlogContentProps) {
  if (!content || content.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No content available.</p>
      </div>
    );
  }

  return (
    <div className="prose prose-lg max-w-none">
      {content.map((block) => {
        switch (block._type) {
          case 'block':
            return renderTextBlock(block as SanityTextBlock);
          case 'image':
            return renderImage(block as SanityImageBlock);
          default:
            // Handle unknown block types gracefully
            logger.warn('Unknown Sanity block type encountered:', { blockType: 'unknown', blockKey: 'unknown' });
            return <div key={`unknown-${Math.random()}`} />;
        }
      })}
    </div>
  );
}