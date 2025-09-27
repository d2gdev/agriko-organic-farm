'use client';

import { useState } from 'react';
import { Download, FileText, Database, Calendar } from 'lucide-react';

export type ExportFormat = 'csv' | 'json';
export type ExportData = Record<string, unknown>[] | Record<string, unknown>;

export interface ExportOptions {
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  columns?: string[];
  filename?: string;
  includeHeaders?: boolean;
}

export interface ExportButtonProps {
  data: ExportData;
  filename?: string;
  formats?: ExportFormat[];
  className?: string;
  disabled?: boolean;
  options?: ExportOptions;
  onExportStart?: (format: ExportFormat) => void;
  onExportComplete?: (format: ExportFormat, success: boolean) => void;
}

export default function ExportButton({
  data,
  filename = 'export',
  formats = ['csv', 'json'],
  className = '',
  disabled = false,
  options = {},
  onExportStart,
  onExportComplete
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const convertToCSV = (jsonData: Record<string, unknown>[]): string => {
    if (!jsonData.length) return '';

    // Get headers
    const allKeys = new Set<string>();
    jsonData.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });

    const headers = options.columns || Array.from(allKeys);

    // Create CSV content
    const csvRows: string[] = [];

    // Add headers if requested
    if (options.includeHeaders !== false) {
      csvRows.push(headers.map(header => `"${header}"`).join(','));
    }

    // Add data rows
    jsonData.forEach(item => {
      const row = headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '""';

        // Handle dates
        if (value instanceof Date) {
          return `"${value.toISOString()}"`;
        }

        // Handle objects/arrays
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }

        // Handle strings with quotes/commas
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return `"${stringValue}"`;
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  const filterDataByDateRange = (dataArray: Record<string, unknown>[]): Record<string, unknown>[] => {
    if (!options.dateRange || (!options.dateRange.start && !options.dateRange.end)) {
      return dataArray;
    }

    return dataArray.filter(item => {
      // Try to find a date field
      const dateFields = ['date', 'created_at', 'updated_at', 'timestamp', 'date_created'];
      let itemDate: Date | null = null;

      for (const field of dateFields) {
        if (item[field]) {
          itemDate = new Date(item[field] as string);
          if (!isNaN(itemDate.getTime())) break;
        }
      }

      if (!itemDate) return true; // Include if no date found

      const { start, end } = options.dateRange || {};
      if (start && itemDate < start) return false;
      if (end && itemDate > end) return false;
      return true;
    });
  };

  const handleExport = async (format: ExportFormat) => {
    if (disabled || isExporting) return;

    setIsExporting(true);
    onExportStart?.(format);

    try {
      // Normalize data to array format
      let dataArray: Record<string, unknown>[];
      if (Array.isArray(data)) {
        dataArray = data;
      } else {
        dataArray = [data];
      }

      // Apply date filtering if specified
      const filteredData = filterDataByDateRange(dataArray);

      let content: string;
      let mimeType: string;
      let fileExtension: string;

      if (format === 'csv') {
        content = convertToCSV(filteredData);
        mimeType = 'text/csv';
        fileExtension = 'csv';
      } else {
        content = JSON.stringify(filteredData, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const finalFilename = `${filename}_${timestamp}.${fileExtension}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      onExportComplete?.(format, true);
    } catch (error) {
      console.error('Export failed:', error);
      onExportComplete?.(format, false);
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };

  if (formats.length === 1 && formats[0]) {
    // Single format - simple button
    const format = formats[0];
    return (
      <button
        onClick={() => handleExport(format)}
        disabled={disabled || isExporting}
        className={`
          flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md
          border border-gray-300 bg-white hover:bg-gray-50
          text-gray-700 hover:text-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
        title={`Export as ${format.toUpperCase()}`}
      >
        {isExporting ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" />
        ) : format === 'csv' ? (
          <FileText className="w-4 h-4" />
        ) : (
          <Database className="w-4 h-4" />
        )}
        <span>{isExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}</span>
      </button>
    );
  }

  // Multiple formats - dropdown button
  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={disabled || isExporting}
        className={`
          flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md
          border border-gray-300 bg-white hover:bg-gray-50
          text-gray-700 hover:text-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
      >
        {isExporting ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        {!isExporting && (
          <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {showOptions && !isExporting && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="py-1">
            {formats.map((format) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                {format === 'csv' ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>Export as {format.toUpperCase()}</span>
              </button>
            ))}

            {(options.dateRange?.start || options.dateRange?.end) && (
              <>
                <hr className="my-1" />
                <div className="px-4 py-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Date filtered</span>
                  </div>
                  {options.dateRange.start && (
                    <div>From: {options.dateRange.start.toLocaleDateString()}</div>
                  )}
                  {options.dateRange.end && (
                    <div>To: {options.dateRange.end.toLocaleDateString()}</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}