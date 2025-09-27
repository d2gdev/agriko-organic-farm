import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Award, TrendingUp } from 'lucide-react';

interface ContentScorerProps {
  content: {
    title: string;
    content: string;
    excerpt: string;
    keywords?: string[];
  };
}

export default function ContentScorer({ content }: ContentScorerProps) {
  const calculateScore = () => {
    let score = 0;
    const checks = [];

    // Title checks
    const titleLength = content.title.length;
    if (titleLength >= 20 && titleLength <= 60) {
      score += 10;
      checks.push({ name: 'Title Length', status: 'pass', points: 10 });
    } else {
      checks.push({ name: 'Title Length', status: 'fail', points: 0, message: 'Should be 20-60 characters' });
    }

    // Content length
    const wordCount = content.content.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount >= 300) {
      score += 20;
      checks.push({ name: 'Content Length', status: 'pass', points: 20, message: `${wordCount} words` });
    } else {
      checks.push({ name: 'Content Length', status: 'fail', points: 0, message: `${wordCount} words (min 300)` });
    }

    // Meta description
    const descLength = content.excerpt.length;
    if (descLength >= 120 && descLength <= 160) {
      score += 10;
      checks.push({ name: 'Meta Description', status: 'pass', points: 10 });
    } else {
      checks.push({ name: 'Meta Description', status: 'fail', points: 0, message: 'Should be 120-160 chars' });
    }

    // Keywords
    if (content.keywords && content.keywords.length > 0) {
      score += 10;
      checks.push({ name: 'Keywords', status: 'pass', points: 10, message: `${content.keywords.length} keywords` });
    } else {
      checks.push({ name: 'Keywords', status: 'fail', points: 0, message: 'No keywords' });
    }

    // Readability (simple check for sentence length)
    const sentences = content.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = wordCount / sentences.length;
    if (avgWordsPerSentence <= 20) {
      score += 15;
      checks.push({ name: 'Readability', status: 'pass', points: 15, message: 'Good sentence length' });
    } else {
      checks.push({ name: 'Readability', status: 'warning', points: 5, message: 'Long sentences detected' });
      score += 5;
    }

    // Headings (check for structure)
    const hasHeadings = /#{1,6}\s|<h[1-6]>/i.test(content.content);
    if (hasHeadings) {
      score += 10;
      checks.push({ name: 'Structure', status: 'pass', points: 10, message: 'Has headings' });
    } else {
      checks.push({ name: 'Structure', status: 'warning', points: 0, message: 'Add headings' });
    }

    // Internal links
    const hasLinks = /\[.*?\]\(.*?\)|<a\s+href=/i.test(content.content);
    if (hasLinks) {
      score += 10;
      checks.push({ name: 'Internal Links', status: 'pass', points: 10 });
    } else {
      checks.push({ name: 'Internal Links', status: 'warning', points: 0, message: 'Add internal links' });
    }

    // Images/media
    const hasImages = /!\[.*?\]\(.*?\)|<img\s+src=/i.test(content.content);
    if (hasImages) {
      score += 10;
      checks.push({ name: 'Media', status: 'pass', points: 10, message: 'Has images' });
    } else {
      checks.push({ name: 'Media', status: 'warning', points: 0, message: 'Add images' });
    }

    // Call to action
    const ctaKeywords = ['buy', 'shop', 'order', 'contact', 'learn more', 'sign up', 'subscribe'];
    const hasCTA = ctaKeywords.some(keyword => 
      content.content.toLowerCase().includes(keyword)
    );
    if (hasCTA) {
      score += 5;
      checks.push({ name: 'Call to Action', status: 'pass', points: 5 });
    } else {
      checks.push({ name: 'Call to Action', status: 'warning', points: 0, message: 'Add CTA' });
    }

    const maxScore = 100;
    const percentage = Math.min(100, Math.round((score / maxScore) * 100));

    return { score, maxScore, percentage, checks };
  };

  const { score, maxScore, percentage, checks } = calculateScore();

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade === 'B') return 'text-blue-600';
    if (grade === 'C') return 'text-yellow-600';
    return 'text-red-600';
  };

  const grade = getGrade(percentage);
  const readingTime = Math.ceil(content.content.split(/\s+/).filter(w => w.length > 0).length / 200);

  return (
    <div className="space-y-6">
      {/* Score Circle */}
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444'}
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${percentage * 4.4} 440`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-bold ${getGradeColor(grade)}`}>{grade}</div>
            <div className="text-sm text-gray-500">{percentage}%</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-lg font-semibold text-gray-900">Content Quality Score</div>
          <div className="text-sm text-gray-600">{score}/{maxScore} points • {readingTime} min read</div>
        </div>
      </div>

      {/* Detailed Checks */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Analysis</h3>
        <div className="space-y-2">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {check.status === 'pass' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                ) : check.status === 'warning' ? (
                  <AlertCircle className="w-5 h-5 text-yellow-500 mr-3" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mr-3" />
                )}
                <span className="font-medium text-gray-700">{check.name}</span>
              </div>
              <div className="text-sm text-gray-600">
                {check.message || (check.points ? `+${check.points}` : '0 points')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {percentage < 80 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Improvement Recommendations
          </h4>
          <ul className="space-y-1 text-sm text-blue-800">
            {checks
              .filter(c => c.status === 'fail' || c.status === 'warning')
              .map((check, index) => (
                <li key={index}>• {check.name}: {check.message}</li>
              ))}
          </ul>
        </div>
      )}

      {/* Achievement Badges */}
      {percentage >= 80 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center">
            <Award className="w-4 h-4 mr-2" />
            Excellent Content!
          </h4>
          <p className="text-sm text-green-800">
            Your content scores {percentage}% and meets high quality standards.
            Great job on creating engaging, SEO-friendly content!
          </p>
        </div>
      )}
    </div>
  );
}