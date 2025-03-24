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
const useCustomChat = (initialContext: string = '') => {
  const [messages, setMessages] = useState<ExtendedMessage[]>([
    {
      id: 'system-message',
      role: 'system',
      content: `You are a helpful AI assistant specializing in care assessments and social work. Help the user complete their care assessment by providing information, drafting content, and answering questions about best practices in care assessments. When appropriate, offer to help write sections of the assessment based on the information provided.`,
      hideFromUI: true
    },
    ...(initialContext ? [
      {
        id: 'initial-context',
        role: 'user' as const,
        content: initialContext
      }
    ] : [])
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create a custom version of messages that filters out hideFromUI messages
  const visibleMessages = messages.filter(msg => !msg.hideFromUI);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage: ExtendedMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages
            .filter(msg => !msg.hideFromUI)
            .concat(userMessage)
            .map(({ role, content }) => ({ role, content }))
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }
      
      const data = await response.json();
      
      // Add assistant message from response
      setMessages(prev => [
        ...prev, 
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.message.content
        }
      ]);
    } catch (err) {
      console.error('Error in chat:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Custom append function that supports the hideFromUI option
  const append = async (message: any, options: { hideFromUI?: boolean } = {}) => {
    // Add the hideFromUI flag to the message if specified
    const messageWithMetadata: ExtendedMessage = {
      id: Date.now().toString(),
      role: message.role,
      content: message.content,
      ...(options.hideFromUI ? { hideFromUI: true } : {})
    };
    
    // Add the message to our local state
    setMessages(prev => [...prev, messageWithMetadata]);
    
    // If it's a user message, we need to get a response
    if (message.role === 'user' && !options.hideFromUI) {
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/openai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [...messages, messageWithMetadata]
              .filter(msg => !msg.hideFromUI)
              .map(({ role, content }) => ({ role, content }))
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get response');
        }
        
        const data = await response.json();
        
        // Add assistant message from response
        setMessages(prev => [
          ...prev, 
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.message.content
          }
        ]);
      } catch (err) {
        console.error('Error in chat append:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    return messageWithMetadata;
  };
  
  return {
    messages: visibleMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append
  };
};

export default function AiChatModal({ isOpen, onClose, onApplySuggestion, initialContext = '' }: AiChatModalProps) {
  // Use our custom chat hook instead of the standard useChat
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, append } = useCustomChat(initialContext);
  
  const [isCopied, setIsCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showApplyButton, setShowApplyButton] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStage, setUploadStage] = useState<'initial' | 'uploading' | 'extracting' | 'analyzing'>('initial');
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
        
        // Use an assistant message instead of system message for confirmation
        append({
          role: 'assistant' as const,
          content: 'I\'ve applied the suggestion to your assessment form.',
        });
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
    
    // Only add a simple message indicating the document is being processed
    const userMessage = {
      role: 'user' as const,
      content: `I've uploaded a document: "${file.name}" for care assessment analysis.`,
      id: Date.now().toString()
    };
    
    // Just add the user message to indicate upload, without any AI response yet
    append(userMessage);
    
    // Add a processing message to set expectations
    append({
      role: 'assistant' as const,
      content: `I'm extracting and analyzing the text from your document "${file.name}". This may take a moment...`,
    });

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
          content: `The file you uploaded is too large (maximum size is 10MB). Please upload a smaller file or extract the relevant portion into a smaller document.`,
        });
        
        setTimeout(() => setAutoScrollDisabled(false), 500);
      }, 500);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Update progress indicators
      setUploadStage('extracting');
      setProcessingProgress(30);
      
      // Call the document analysis API
      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        body: formData,
      });
      
      setProcessingProgress(60);
      setUploadStage('analyzing');
      
      const data = await response.json();
      setProcessingProgress(80);
      
      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`);
      }
      
      if (data.text) {
        const hasWarning = data.warning !== null && data.warning !== undefined;
        
        // Truncate very long documents to avoid token limits
        const truncatedText = data.text.length > 12000 
          ? data.text.substring(0, 12000) + "...\n[Content truncated due to length]" 
          : data.text;
        
        // Metadata for warnings
        const metadataFromFile = hasWarning ? 
          "Note: The system had some difficulty extracting all the text from this document." : "";
        
        setProcessingProgress(100);
        
        // SKIP adding any interim messages - we'll just process the document directly
        
        // Send document content with direct instruction to extract and summarize in one step
        await append({
          role: 'user' as const,
          content: `extract_everything\n\n${truncatedText}`,
        }, { hideFromUI: true });
        
        setTimeout(() => {
          setAutoScrollDisabled(false);
        }, 500);
      } else {
        setTimeout(() => {
          append({
            role: 'assistant' as const,
            content: `I couldn't extract any text from "${file.name}". The file might be password-protected, contain only images, or be corrupted. Please try a different document or describe the key information directly.`,
          });
          
          setAutoScrollDisabled(false);
        }, 500);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = (error as Error).message || 'Failed to upload document';
      setUploadError(errorMessage);
      
      setTimeout(() => {
        append({
          role: 'assistant' as const,
          content: `There was an error processing your document: ${errorMessage}. Please try a different file format or check that the file isn't corrupted.`,
        });
        
        setAutoScrollDisabled(false);
      }, 500);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`relative w-full max-w-4xl mx-auto bg-white rounded-lg shadow-xl flex flex-col h-[80vh] transition-transform duration-300 ${mounted ? 'translate-y-0' : 'translate-y-4'}`}>
        {/* Header - fixed height */}
        <div className="px-6 py-4 border-b flex justify-between items-center flex-shrink-0 h-16">
          <h2 className="text-xl font-semibold text-gray-800">AI Care Assistant</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
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
              {/* Welcome message if no messages */}
              {messages.length <= 1 && (
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <h3 className="font-medium text-blue-800 mb-2">Welcome to the AI Care Assistant</h3>
                  <p className="text-blue-700">
                    Ask any questions about care assessments, request help drafting sections,
                    or get assistance with understanding care guidelines.
                  </p>
                  <div className="mt-3 bg-white p-3 rounded-md border border-blue-200">
                    <div className="flex items-center text-blue-700">
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Attach a document for analysis</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Upload a care document to analyze its content and get assistance with your assessment.
                    </p>
                  </div>
                </div>
              )}
              
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
                          : 'bg-gray-100 text-gray-800'
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
                  <div className="max-w-[80%] rounded-lg p-4 bg-gray-100 text-gray-800 shadow-md">
                    <div className="flex items-center min-h-[36px]">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>AI is responding...</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error message - overlays the loading area */}
              {(error || uploadError) && (
                <div className="absolute bottom-2 left-0 w-full mt-4 px-4">
                  <div className="bg-red-50 p-4 rounded-lg text-red-800 shadow-md">
                    <p>Error: {uploadError || error || 'Something went wrong'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action buttons - fixed height */}
        {messages.length > 1 && messages.some(m => m.role === 'assistant') && (
          <div className="border-t border-b px-4 py-2 flex gap-2 bg-gray-50 flex-shrink-0 h-12">
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
              className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors flex items-center"
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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