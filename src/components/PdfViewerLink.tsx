import React from 'react';
import { Eye, AlertCircle } from 'lucide-react';

interface PdfViewerLinkProps {
  pdfUrl: string | null | undefined;
  label?: string;
  className?: string;
  showFallback?: boolean;
}

/**
 * A simple standalone component that renders a button to view a PDF.
 * This is a fallback solution if the main PDF component isn't working.
 */
export default function PdfViewerLink({ 
  pdfUrl, 
  label = 'View PDF', 
  className = '',
  showFallback = true
}: PdfViewerLinkProps) {
  // Check if we have a valid URL
  const hasValidUrl = !!pdfUrl && typeof pdfUrl === 'string' && pdfUrl.startsWith('http');
  
  console.log("PdfViewerLink rendering with URL:", pdfUrl, "Valid:", hasValidUrl);
  
  // If no URL and no fallback, don't render anything
  if (!hasValidUrl && !showFallback) return null;
  
  const baseClasses = "inline-flex items-center px-3 py-1.5 rounded transition-colors";
  const activeClasses = `${baseClasses} bg-blue-500 text-white hover:bg-blue-600`;
  const disabledClasses = `${baseClasses} bg-gray-300 text-gray-600 cursor-not-allowed`;
  
  const finalClasses = className ? 
    `${hasValidUrl ? activeClasses : disabledClasses} ${className}` : 
    (hasValidUrl ? activeClasses : disabledClasses);
  
  // If we don't have a valid URL, show a disabled button
  if (!hasValidUrl) {
    return (
      <div className="flex flex-col">
        <button
          disabled
          className={disabledClasses}
          title="No PDF available to view"
        >
          <AlertCircle className="mr-1.5" size={16} />
          No PDF Available
        </button>
        <p className="text-xs text-red-500 mt-1">
          Save this assessment first to view the PDF
        </p>
      </div>
    );
  }
  
  // If we have a valid URL, show an active link
  return (
    <a
      href={pdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={finalClasses}
      onClick={() => console.log("Opening PDF URL:", pdfUrl)}
    >
      <Eye className="mr-1.5" size={16} />
      {label}
    </a>
  );
} 