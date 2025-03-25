'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import { Loader2, SendIcon, XIcon, CheckIcon, CopyIcon, Paperclip, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestion?: (content: string) => void;
  initialContext?: string;
}

// Extended Message type that includes our custom properties
interface ExtendedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  hideFromUI?: boolean;
}

// Modify or extend the useChat hook to handle the hideFromUI option
// This is a custom implementation since the standard useChat doesn't support this
const useCustomChat = () => {
  const chatHook = useChat({
    api: '/api/anthropic/chat', // Use the chosen API endpoint
    initialMessages: [],
  });
  
  // Create a custom version of messages that filters out any unwanted messages
  const visibleMessages = chatHook.messages.filter(msg => {
    // Filter out messages marked as hideFromUI
    if ((msg as ExtendedMessage).hideFromUI) {
      return false;
    }
    
    // Filter out any default error messages about being unable to read documents
    if (msg.role === 'assistant' && 
        (msg.content.includes("I'm unable to read") || 
         msg.content.includes("I'm unable to access") ||
         msg.content.includes("I can't view or read") ||
         msg.content.includes("I'm sorry, but I can't") ||
         msg.content.includes("I can't access or analyse") ||
         msg.content.includes("unable to analyse") ||
         msg.content.includes("couldn't analyse"))) {
      return false;
    }
    
    return true;
  });
  
  // Remove duplicate content - look for messages with the exact same content
  const uniqueContentMessages: ExtendedMessage[] = [];
  const seenContent = new Set<string>();
  
  for (const msg of visibleMessages) {
    // For each message, check if we've seen this content before
    if (!seenContent.has(msg.content)) {
      uniqueContentMessages.push(msg as ExtendedMessage);
      seenContent.add(msg.content);
    }
  }
  
  // Remove any "Reading document" messages if we have at least one other message
  const finalMessages = uniqueContentMessages.length > 1 
    ? uniqueContentMessages.filter(msg => !msg.content.startsWith('Reading document:'))
    : uniqueContentMessages;
  
  // Custom append function that supports the hideFromUI option
  const customAppend = async (message: any, options: { hideFromUI?: boolean } = {}) => {
    // Add the hideFromUI flag to the message if specified
    const messageWithMetadata = options.hideFromUI 
      ? { ...message, hideFromUI: true }
      : message;
    
    // Call the original append function
    return chatHook.append(messageWithMetadata);
  };
  
  return {
    ...chatHook,
    messages: finalMessages,
    append: customAppend,
    // Make sure to explicitly include setMessages to avoid linter errors
    setMessages: chatHook.setMessages
  };
};

export default function AiChatModal({ isOpen, onClose, onApplySuggestion, initialContext }: AiChatModalProps) {
  // Use our custom chat hook instead of the standard useChat
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, append, setMessages } = useCustomChat();
  
  const [isCopied, setIsCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showApplyButton, setShowApplyButton] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStage, setUploadStage] = useState<'initial' | 'uploading' | 'extracting' | 'analysing'>('initial');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  // Remove auto-scroll from initial render
  const [autoScrollDisabled, setAutoScrollDisabled] = useState(true);

  // Mount effect to enable smooth transitions
  useEffect(() => {
    setMounted(true);
    
    // After initial render, enable auto-scroll
    setTimeout(() => {
      setAutoScrollDisabled(false);
    }, 1000);
  }, []);

  // Auto-scroll to bottom when messages update - but with more control
  useEffect(() => {
    if (autoScrollDisabled) return;
    
    if (chatContainerRef.current && messages.length > 0) {
      // Calculate if we're already near the bottom
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      // Only auto-scroll if we're near the bottom already
      if (isNearBottom) {
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    }
  }, [messages, autoScrollDisabled]);

  // Prevent auto-scroll during file upload processing
  useEffect(() => {
    if (isUploading) {
      setAutoScrollDisabled(true);
    } else {
      // Re-enable auto-scroll after upload is complete
      setTimeout(() => {
        setAutoScrollDisabled(false);
      }, 500);
    }
  }, [isUploading]);

  // Progress timer effect for better visual feedback during processing
  useEffect(() => {
    let progressTimer: NodeJS.Timeout | null = null;
    
    if (isUploading) {
      setProcessingProgress(0);
      progressTimer = setInterval(() => {
        setProcessingProgress(prev => {
          // Cap progress at 90% until we get actual response
          // Use a more natural progression that slows down as it approaches 90%
          if (prev < 30) {
            return prev + 5; // Move quickly at first
          } else if (prev < 60) {
            return prev + 3; // Slow down a bit
          } else if (prev < 80) {
            return prev + 1.5; // Slow down more
          } else {
            return prev + 0.5; // Very slow near the end
          }
        });
      }, 200);
    } else {
      setProcessingProgress(0);
    }
    
    return () => {
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [isUploading]);

  // Handle "Apply Suggestion" button
  const handleApplySuggestion = () => {
    if (messages.length > 0) {
      const lastAssistantMessage = messages
        .filter(m => m.role === 'assistant')
        .pop();
      
      if (lastAssistantMessage && onApplySuggestion) {
        onApplySuggestion(lastAssistantMessage.content);
        setShowApplyButton(false);
      }
    }
  };

  // Handle copying the last message
  const handleCopyLastMessage = () => {
    const lastAssistantMessage = messages
      .filter(m => m.role === 'assistant')
      .pop();
    
    if (lastAssistantMessage) {
      navigator.clipboard.writeText(lastAssistantMessage.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Modified form submit handler
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e);
    // Show apply button after user sends a message
    setShowApplyButton(true);
  };

  // File attachment handler
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    setUploadError(null);
    setUploadStage('uploading');
    
    // Disable auto-scroll during file upload to prevent jumpiness
    setAutoScrollDisabled(true);
    
    // Add validation for file type and size
    const validFileTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validFileTypes.includes(fileExtension)) {
      setIsUploading(false);
      setUploadError(`Unsupported file type. Please upload a PDF, DOC, DOCX, or TXT file.`);
      
      setTimeout(() => {
        append({
          role: 'assistant' as const,
          content: `Sorry, I can only process PDF, DOC, DOCX, or TXT files. Please upload a file with one of these formats.`,
        });
        
        setTimeout(() => setAutoScrollDisabled(false), 500);
      }, 500);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setIsUploading(false);
      setUploadError(`File size exceeds the 10MB limit.`);
      
      setTimeout(() => {
        append({
          role: 'assistant' as const,
          content: `The file you uploaded is too large. Please upload a file smaller than 10MB.`,
        });
        
        setTimeout(() => setAutoScrollDisabled(false), 500);
      }, 500);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    try {
      // Reset the chat completely
      setMessages([]);
      
      // Create form data for the API call
      const formData = new FormData();
      formData.append('file', file);
      
      setUploadStage('extracting');
      
      // Add a temporary reading message
      await append({
        role: 'assistant' as const,
        content: `Reading document: "${file.name}"...`
      });
      
      // Call the API to extract text from the document and analyse it with AI
      const response = await fetch('/api/ai/analyse-document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setUploadStage('analysing');
      
      // Reset the chat AGAIN to remove the "Reading document" message
      setMessages([]);
      
      // Now add ONLY the analysis to the empty chat
      if (data.analysis) {
        await append({
          role: 'assistant' as const,
          content: data.analysis
        });
      } else {
        await append({
          role: 'assistant' as const,
          content: `I've extracted the text from "${file.name}", but I couldn't perform a full analysis. Please ask me specific questions about the document content.`
        });
      }
      
    } catch (err: any) {
      console.error('Error processing document:', err);
      
      // Reset the chat
      setMessages([]);
      
      // Add only the error message
      append({
        role: 'assistant' as const,
        content: `I encountered an error while processing your document: ${err.message || 'Unknown error'}. Please try again with a different file or format.`,
      });
      
    } finally {
      setIsUploading(false);
      // Re-enable auto-scroll after upload is complete
      setTimeout(() => {
        setAutoScrollDisabled(false);
        
        // Scroll to bottom after everything is done
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 500);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`relative w-full max-w-4xl mx-auto bg-white rounded-lg shadow-xl flex flex-col h-[80vh] transition-transform duration-300 ${mounted ? 'translate-y-0' : 'translate-y-4'}`}>
        {/* Header - fixed height */}
        <div className="px-6 py-4 border-b flex justify-between items-center flex-shrink-0 h-16">
          <h2 className="text-xl font-semibold text-grey-800">Care Assistant</h2>
          <button 
            onClick={onClose}
            className="text-grey-500 hover:text-grey-700 focus:outline-none"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Chat Messages Container - always reserve space at the bottom */}
        <div 
          ref={chatContainerRef}
          className="flex-grow overflow-y-auto p-4"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div className="flex flex-col h-full">
            <div className="flex-grow space-y-4">
              {/* Messages */}
              {messages
                .filter(m => m.role !== 'system') // Don't show system messages
                .map((message, index) => (
                  <div 
                    key={message.id || index} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user' 
                          ? 'bg-blue-100 text-blue-900' 
                          : 'bg-grey-100 text-grey-800'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div>
                          <ReactMarkdown className="prose prose-sm max-w-none">
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                
              {/* Empty div for scroll reference */}
              <div ref={messagesEndRef} className="h-px" />
            </div>
            
            {/* Always reserve space for loading indicators - fixed height */}
            <div className={`h-20 mt-4 transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0'}`}>
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-4 bg-grey-100 text-grey-800 shadow-md">
                    <div className="flex items-center min-h-[36px]">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Assistant is responding...</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error message - overlays the loading area */}
              {(error || uploadError) && (
                <div className="absolute bottom-2 left-0 w-full mt-4 px-4">
                  <div className="bg-red-50 p-4 rounded-lg text-red-800 shadow-md">
                    <p>Error: {error?.message || uploadError || 'Something went wrong'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action buttons - fixed height */}
        {messages.length > 1 && messages.some(m => m.role === 'assistant') && (
          <div className="border-t border-b px-4 py-2 flex gap-2 bg-grey-50 flex-shrink-0 h-12">
            {onApplySuggestion && showApplyButton && (
              <button
                onClick={handleApplySuggestion}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
              >
                <CheckIcon className="h-3 w-3 mr-1" />
                Apply to assessment
              </button>
            )}
            <button
              onClick={handleCopyLastMessage}
              className={`text-sm px-3 py-1 ${isCopied ? 'bg-green-500' : 'bg-grey-200 hover:bg-grey-300'} rounded flex items-center transition-colors`}
            >
              {isCopied ? (
                <>
                  <CheckIcon className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon className="h-3 w-3 mr-1" />
                  Copy response
                </>
              )}
            </button>
          </div>
        )}
        
        {/* File input - hidden */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          disabled={isLoading || isUploading}
        />
        
        {/* Input area - fixed height */}
        <div className="p-4 border-t flex-shrink-0 h-20">
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your question or request..."
                className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || isUploading}
              />
              <button
                type="button"
                onClick={handleAttachClick}
                disabled={isLoading || isUploading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-grey-400 hover:text-grey-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Paperclip className="h-5 w-5" />
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading || isUploading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <SendIcon className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 