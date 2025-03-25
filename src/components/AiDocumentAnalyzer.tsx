'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AiDocumentAnalyzerProps {
  onSummaryGenerated: (summary: string) => void;
}

export default function AiDocumentAnalyzer({ onSummaryGenerated }: AiDocumentAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setError(null);
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setFileName('');
  };

  const analyseWithAI = async () => {
    if (!selectedFile) {
      setError('Please select a document first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create FormData for the file upload
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Call the AI document analysis API
      const response = await fetch('/api/ai/analyse-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Send the generated summary back to the parent component
      onSummaryGenerated(data.summary);
      
      // Clear the file selection after successful processing
      clearFileSelection();
    } catch (err) {
      console.error('Error analysing document:', err);
      setError('Failed to analyse document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-blue-50 rounded-md p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0 text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M12 8c2.5 0 5 1.5 5 4 0 1.5-1 2.5-2 3 .5 1.5 2 2 2 2H7s1.5-.5 2-2c-1-.5-2-1.5-2-3 0-2.5 2.5-4 5-4Z"></path>
            <path d="M12 2c3 0 6 1.5 6 5"></path>
            <path d="M6 7c0-3.5 3-5 6-5"></path>
          </svg>
        </div>
        <div className="w-full">
          <h3 className="text-md font-medium text-blue-800">Assist with AI</h3>
          <p className="text-sm text-blue-700 mb-3">
            Upload a document and let AI extract key information and provide a summary to help complete the assessment
          </p>
          
          {error && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded-md">
              {error}
            </div>
          )}
          
          <div className="flex">
            <div className="relative flex-grow">
              <input
                type="file"
                id="file-upload"
                className="sr-only"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex items-center justify-center w-full bg-white border border-grey-300 rounded-l-md py-2 px-4 text-sm font-medium text-grey-700 hover:bg-grey-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                {fileName || 'Choose document'}
              </label>
            </div>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={analyseWithAI}
              disabled={isProcessing || !selectedFile}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                'Analyse with AI'
              )}
            </button>
            {selectedFile && (
              <button
                type="button"
                className="ml-2 inline-flex items-center px-2 py-2 border border-transparent rounded-md text-grey-500 hover:text-grey-700 focus:outline-none"
                onClick={clearFileSelection}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 