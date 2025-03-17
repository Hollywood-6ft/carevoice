'use client';

import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

export default function PdfUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setPdfContent(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/pdf/process', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process PDF');
      }

      setPdfContent(result.extractedInfo);
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing the PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setFileName('');
    setPdfContent(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">PDF Document Analysis</h2>
      
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex-1 cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-gray-600">{fileName || 'Choose PDF file'}</span>
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
              onClick={handleUpload} 
              disabled={!file || loading}
              className={`px-4 py-2 rounded-lg ${!file || loading 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors`}
            >
              {loading ? 'Processing...' : 'Process PDF'}
            </button>
            
            <button 
              onClick={handleClear} 
              disabled={loading}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        
        {error && (
          <p className="mt-2 text-red-500 text-sm">{error}</p>
        )}
        
        {file && (
          <p className="mt-2 text-sm text-gray-500">
            Selected file: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {loading && (
        <div className="py-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {pdfContent && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Document Content</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-[600px] overflow-y-auto">
            <ReactMarkdown className="prose prose-sm max-w-none">
              {pdfContent}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
} 