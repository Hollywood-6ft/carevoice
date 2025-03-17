'use client';

import React from 'react';
import { useState } from 'react';
import AiChatModal from '@/components/AiChatModal';
import { Upload } from 'lucide-react';

export default function AiChatPage() {
  const [showChat, setShowChat] = useState(true);
  const [initialContext, setInitialContext] = useState('');
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setIsFileUploaded(true);
      
      // Call the document analysis API
      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setInitialContext(`I've uploaded a document called "${file.name}". Here's the content from the document:\n\n${data.text}\n\nPlease help me understand the key care needs and write a care assessment based on this information.`);
      setShowChat(true);
    } catch (error) {
      console.error('Error uploading file:', error);
      setInitialContext(`I've uploaded a document called "${file.name}", but there was an error extracting the text. Please help me write a care assessment from scratch.`);
      setShowChat(true);
    }
  };
  
  return (
    <main className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Care Assistant</h1>
          <p className="text-lg text-gray-600">
            Upload documents or chat directly with our AI assistant for help with care assessments
          </p>
        </div>
        
        {!showChat ? (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h2 className="text-center text-xl font-semibold text-gray-800 mb-2">
                Start with a Document
              </h2>
              <p className="text-center text-gray-600 mb-6">
                Upload a care document and the AI will analyze it to provide tailored guidance
              </p>
              <div className="flex flex-col space-y-4">
                <label className="flex flex-col items-center px-4 py-6 bg-blue-50 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 border-2 border-dashed border-blue-300">
                  <Upload className="h-8 w-8 mb-2" />
                  <span className="text-sm font-medium">Choose a file</span>
                  <span className="text-xs text-blue-500 mt-1">PDF, DOC, TXT (max 10MB)</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.txt" 
                    onChange={handleFileUpload}
                  />
                </label>
                
                <button
                  onClick={() => {
                    setInitialContext('');
                    setShowChat(true);
                  }}
                  className="w-full py-2 px-4 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Continue without a document
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden min-h-[70vh]">
            <AiChatModal 
              isOpen={showChat} 
              onClose={() => setShowChat(false)} 
              initialContext={initialContext}
            />
          </div>
        )}
      </div>
    </main>
  );
} 