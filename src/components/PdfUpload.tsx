import React, { useState, useRef } from "react";
import { File, X, Eye, Upload } from "lucide-react";

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface PdfUploadProps {
  onPdfChange: (file: File | null) => void;
  isProcessing: boolean;
  processingError?: string | null;
  existingPdfUrl?: string;
  existingPdfName?: string;
}

export default function PdfUpload({ 
  onPdfChange, 
  isProcessing, 
  processingError, 
  existingPdfUrl, 
  existingPdfName 
}: PdfUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Simple flag to check if we have a PDF URL
  const hasPdf = !!existingPdfUrl && existingPdfUrl.length > 0;
  
  console.log("PdfUpload - Received URL:", existingPdfUrl);
  console.log("PdfUpload - Has PDF:", hasPdf);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    
    if (!file) return;
    
    // Validate file type
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted");
      return;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 10MB limit");
      return;
    }
    
    // Notify parent component
    onPdfChange(file);
  };
  
  // Handle removing the file
  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onPdfChange(null);
  };
  
  // Simple component to render the file info
  const FileInfo = () => (
    <div className="border rounded p-3 bg-gray-50">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <File className="text-blue-500 mr-2" size={20} />
          <div>
            <p className="text-sm font-medium">{existingPdfName || "PDF Document"}</p>
            <p className="text-xs text-gray-500">PDF attachment</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {/* View PDF button - plain HTML link */}
          {hasPdf && (
            <a
              href={existingPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              <Eye size={14} className="mr-1" />
              View
            </a>
          )}
          
          {/* Replace button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-2 py-1 text-xs text-white bg-gray-500 rounded hover:bg-gray-600"
            disabled={isProcessing}
          >
            <Upload size={14} className="mr-1" />
            Replace
          </button>
          
          {/* Remove button */}
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center p-1 text-white bg-red-500 rounded-full hover:bg-red-600"
            disabled={isProcessing}
          >
            <X size={14} />
          </button>
        </div>
      </div>
      
      {/* Direct URL for debugging */}
      {hasPdf && (
        <div className="mt-2 text-xs">
          <a 
            href={existingPdfUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Open PDF directly
          </a>
        </div>
      )}
    </div>
  );
  
  // Upload dropzone component
  const UploadDropzone = () => (
    <label
      htmlFor="pdf-upload"
      className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer"
    >
      <File className="mb-2 text-gray-400" size={28} />
      <p className="text-sm text-gray-600 font-medium">Click to upload PDF</p>
      <p className="text-xs text-gray-500 mt-1">PDF files only (Max size: 10MB)</p>
    </label>
  );
  
  return (
    <div className="w-full">
      {/* Error message */}
      {(error || processingError) && (
        <div className="p-3 mb-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error || processingError}
        </div>
      )}
      
      {/* Main content - either file info or upload dropzone */}
      {hasPdf || existingPdfName ? <FileInfo /> : <UploadDropzone />}
      
      {/* Hidden file input */}
      <input
        type="file"
        id="pdf-upload"
        className="hidden"
        accept="application/pdf"
        onChange={handleFileChange}
        ref={fileInputRef}
        disabled={isProcessing}
      />
    </div>
  );
} 