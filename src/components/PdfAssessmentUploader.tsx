'use client';

import { useState, useRef, useEffect } from 'react';
import { FileText, Upload, X, Loader2, Copy, CheckCircle, Download, AlertCircle, AlertTriangle } from 'lucide-react';

interface PdfAssessmentUploaderProps {
  onContentExtracted?: (content: string) => void;
}

export default function PdfAssessmentUploader({ onContentExtracted }: PdfAssessmentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [formattedContent, setFormattedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Simplified useEffect - just transfer content from PDF to formatted content
  useEffect(() => {
    if (pdfContent) {
      setFormattedContent(pdfContent);
    } else {
      setFormattedContent(null);
    }
  }, [pdfContent]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if file is a PDF
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        setFile(null);
        setFileName('');
        return;
      }
      
      // Check file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        setFile(null);
        setFileName('');
        return;
      }

      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
      setWarning(null);
      setCopied(false);
      setPdfContent(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);
    setCopied(false);
    setPdfContent(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use the new AI-powered document analysis endpoint
      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process document');
      }

      // Set the extracted content
      setPdfContent(result.summary);
      
      // If we have the callback and there's content, automatically use it
      if (result.summary && onContentExtracted) {
        onContentExtracted(result.summary);
        setCopied(true);
        
        // Show copied status for 2 seconds
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Document processing error:', err);
      
      // Set specific error message based on error type
      if (err.message?.includes('too large')) {
        setError('File size exceeds the maximum limit of 10MB.');
      } else if (err.message?.includes('timed out')) {
        setError('Processing timed out. Please try again with a simpler document.');
      } else if (err.message?.includes('API key')) {
        setError('API key is not configured properly. Please check your environment variables.');
      } else if (err.message?.includes('429') || err.message?.includes('rate limit')) {
        setError('API rate limit exceeded. Please try again later.');
      } else {
        setError(err.message || 'An error occurred while processing the document');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setFileName('');
    setPdfContent(null);
    setError(null);
    setWarning(null);
    setCopied(false);
    setExpanded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
      <div className="flex items-center mb-2">
        <FileText className="text-blue-600 mr-2" size={20} />
        <h3 className="font-medium text-blue-900">AI-Powered Document Analysis</h3>
      </div>
      
      <p className="text-sm text-blue-700 mb-3">
        Upload a PDF assessment document and let AI extract key information for your assessment
      </p>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="flex-1 cursor-pointer bg-white border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors">
          <div className="flex items-center justify-center">
            <Upload className="h-4 w-4 text-blue-500 mr-2" />
            <span className="text-sm text-blue-700 truncate">
              {fileName || 'Choose PDF file'}
            </span>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="application/pdf" 
            onChange={handleFileChange} 
            ref={fileInputRef}
          />
        </label>
        
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={handleUpload} 
            disabled={!file || loading}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              !file || loading 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors flex items-center`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Analyzing with AI
              </>
            ) : (
              'Analyze with AI'
            )}
          </button>
          
          <button 
            type="button"
            onClick={handleClear} 
            disabled={loading}
            className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors text-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs flex items-start">
          <AlertTriangle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {warning && !error && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs flex items-start">
          <AlertCircle className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Notice:</p>
            <p className="whitespace-pre-line">{warning}</p>
          </div>
        </div>
      )}
      
      {file && !error && (
        <p className="mt-2 text-xs text-blue-600">
          Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      )}
      
      {pdfContent && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center flex-wrap gap-1">
              <p className="text-xs font-medium text-green-600">
                AI analysis completed successfully
              </p>
              {copied && (
                <span className="ml-2 inline-flex items-center text-xs text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Applied to assessment
                </span>
              )}
            </div>
          </div>
          
          <div className={`relative bg-white border rounded-md p-3 ${
            expanded ? 'max-h-96' : 'max-h-32'
          } overflow-auto transition-all duration-200`}>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
              {formattedContent}
            </pre>
            
            {!expanded && formattedContent && formattedContent.length > 300 && (
              <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white pointer-events-none" />
            )}
          </div>
          
          <div className="flex justify-end mt-2 gap-2">
            {formattedContent && formattedContent.length > 300 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 