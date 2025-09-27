import React from 'react';
import { Search, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface SEOAnalyzerProps {
  content: {
    title: string;
    content: string;
    excerpt: string;
    keywords?: string[];
  };
}

export default function SEOAnalyzer({ content }: SEOAnalyzerProps) {
  const titleLength = content.title.length;
  const descriptionLength = content.excerpt.length;
  const wordCount = content.content.split(/\s+/).filter(word => word.length > 0).length;

  // SEO Analysis
  const titleOptimal = titleLength >= 30 && titleLength <= 60;
  const descriptionOptimal = descriptionLength >= 120 && descriptionLength <= 160;
  const hasKeywords = content.keywords && content.keywords.length > 0;
  const keywordDensity = hasKeywords && content.content && content.keywords
    ? content.keywords.filter(kw =>
        content.content?.toLowerCase().includes(kw.toLowerCase())
      ).length / content.keywords.length * 100
    : 0;

  const seoScore = [
    titleOptimal ? 25 : titleLength > 0 ? 10 : 0,
    descriptionOptimal ? 25 : descriptionLength > 0 ? 10 : 0,
    hasKeywords ? 25 : 0,
    wordCount >= 300 ? 25 : wordCount >= 100 ? 10 : 0
  ].reduce((a, b) => a + b, 0);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const checks = [
    {
      name: 'Title Length',
      status: titleOptimal ? 'pass' : titleLength === 0 ? 'fail' : 'warning',
      message: `${titleLength} characters (optimal: 30-60)`,
      icon: titleOptimal ? CheckCircle : titleLength === 0 ? XCircle : AlertCircle
    },
    {
      name: 'Meta Description',
      status: descriptionOptimal ? 'pass' : descriptionLength === 0 ? 'fail' : 'warning',
      message: `${descriptionLength} characters (optimal: 120-160)`,
      icon: descriptionOptimal ? CheckCircle : descriptionLength === 0 ? XCircle : AlertCircle
    },
    {
      name: 'Keywords',
      status: hasKeywords ? 'pass' : 'fail',
      message: hasKeywords ? `${content.keywords?.length} keywords defined` : 'No keywords defined',
      icon: hasKeywords ? CheckCircle : XCircle
    },
    {
      name: 'Content Length',
      status: wordCount >= 300 ? 'pass' : wordCount >= 100 ? 'warning' : 'fail',
      message: `${wordCount} words (minimum: 300)`,
      icon: wordCount >= 300 ? CheckCircle : wordCount >= 100 ? AlertCircle : XCircle
    },
    {
      name: 'Keyword Density',
      status: keywordDensity >= 60 ? 'pass' : keywordDensity > 0 ? 'warning' : 'fail',
      message: `${keywordDensity.toFixed(0)}% keywords found in content`,
      icon: keywordDensity >= 60 ? CheckCircle : keywordDensity > 0 ? AlertCircle : XCircle
    }
  ];

  return (
    <div className="space-y-6">
      {/* SEO Score */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gray-100">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(seoScore)}`}>
              {seoScore}%
            </div>
            <div className="text-sm text-gray-500">SEO Score</div>
          </div>
        </div>
      </div>

      {/* Google Search Preview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Search className="w-5 h-5 mr-2" />
          Google Search Preview
        </h3>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-green-700 mb-1">
            www.agrikoph.com › {content.title.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}
          </div>
          <div className="text-xl text-blue-600 hover:underline cursor-pointer mb-1">
            {content.title.substring(0, 60)}{titleLength > 60 && '...'}
          </div>
          <div className="text-sm text-gray-600">
            {content.excerpt.substring(0, 160)}{descriptionLength > 160 && '...'}
          </div>
        </div>
      </div>

      {/* SEO Checks */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">SEO Analysis</h3>
        <div className="space-y-2">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <check.icon className={`w-5 h-5 mr-3 ${
                  check.status === 'pass' ? 'text-green-500' :
                  check.status === 'warning' ? 'text-yellow-500' :
                  'text-red-500'
                }`} />
                <span className="font-medium text-gray-700">{check.name}</span>
              </div>
              <span className="text-sm text-gray-600">{check.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {seoScore < 80 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Recommendations</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            {!titleOptimal && (
              <li>• Adjust title length to 30-60 characters for optimal SEO</li>
            )}
            {!descriptionOptimal && (
              <li>• Optimize meta description to 120-160 characters</li>
            )}
            {!hasKeywords && (
              <li>• Add relevant keywords to improve searchability</li>
            )}
            {wordCount < 300 && (
              <li>• Increase content length to at least 300 words</li>
            )}
            {keywordDensity < 60 && hasKeywords && (
              <li>• Use your target keywords more frequently in the content</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}