'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import AiChatModal from './AiChatModal';

interface DocumentAnalysisButtonProps {
  initialContext?: string;
  onApplySuggestion?: (content: string) => void;
}

export default function DocumentAnalysisButton({ 
  initialContext = '',
  onApplySuggestion
}: DocumentAnalysisButtonProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const openChat = () => {
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      <div className="flex mb-4">
        <button
          type="button"
          onClick={openChat}
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors shadow-sm"
        >
          <FileText className="h-4 w-4 mr-2" />
          Analyse Documents
        </button>
      </div>

      <AiChatModal 
        isOpen={isChatOpen} 
        onClose={closeChat} 
        onApplySuggestion={onApplySuggestion}
      />
    </>
  );
} 