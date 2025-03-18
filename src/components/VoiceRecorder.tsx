'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useDeepgram, SocketState } from '@/lib/contexts/DeepgramContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { addDocument } from '@/lib/firebase/firebaseUtils';

// Assessment data interface
interface AssessmentData {
  text: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  firstVisitDate: string;
  assessor: string;
  status: string;
  // RAMP fields
  ramp1: string;
  ramp2: string;
  ramp3: string;
  ramp4: string;
  ramp5: string;
  ramp6: string;
  ramp7: string;
  ramp8: string;
  ramp9: string;
  ramp10: string;
  ramp11: string;
  ramp12: string;
  ramp13: string;
  ramp14: string;
  ramp15: string;
  ramp16: string;
  ramp17: string;
  ramp18: string;
  ramp19: string;
  ramp20: string;
  ramp21: string;
  // Ramp field titles (optional)
  rampFieldTitles?: { [key: string]: string };
  // Custom ramp fields
  customRampFields?: { id: string; title: string; value: string }[];
  // Other fields
  accessDetails: string;
  medicalBackground: string;
  medicationList: string;
  supportRequired: string;
  lpaHealth: string;
  lpaFinance: string;
  keyWorker: string;
  gender: string;
  ethnicity: string;
  debugInfo?: {
    savedAt: string;
    browser: string;
    transcriptLength: number;
  };
}

export default function VoiceRecorder() {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Deepgram context
  const { startRecording, stopRecording, transcript, connectionState, error } = useDeepgram();
  
  // Auth context
  const { user } = useAuth();
  
  // Logging for debugging
  useEffect(() => {
    console.log('VoiceRecorder state:', {
      isRecording,
      isSaving,
      connectionState,
      transcriptLength: transcript.length,
      hasError: !!error
    });
  }, [isRecording, isSaving, connectionState, transcript, error]);
  
  // Handle recording start
  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      await startRecording();
    } catch (err) {
      console.error('Error in handleStartRecording:', err);
      setIsRecording(false);
    }
  };
  
  // Handle recording stop
  const handleStopRecording = async () => {
    try {
      setIsSaving(true);
      stopRecording();
      setIsRecording(false);
      
      // Format transcript
      const currentTranscript = transcript.trim();
      console.log('Final transcript length:', currentTranscript.length);
      
      // Save to Firebase
      if (currentTranscript) {
        // Get user info
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Create data object
        const data: AssessmentData = {
          text: currentTranscript,
          timestamp: new Date().toISOString(),
          userId: user?.uid || 'anonymous',
          userEmail: user?.email || 'anonymous',
          firstVisitDate: today,
          assessor: '', // Leave assessor field blank
          status: 'In progress',
          // Initialize empty fields
          ramp1: '', ramp2: '', ramp3: '', ramp4: '', ramp5: '',
          ramp6: '', ramp7: '', ramp8: '', ramp9: '', ramp10: '',
          ramp11: '', ramp12: '', ramp13: '', ramp14: '', ramp15: '',
          ramp16: '', ramp17: '', ramp18: '', ramp19: '', ramp20: '', ramp21: '',
          accessDetails: '',
          medicalBackground: '',
          medicationList: '',
          supportRequired: '',
          lpaHealth: '',
          lpaFinance: '',
          keyWorker: '',
          gender: '',
          ethnicity: '',
          debugInfo: {
            savedAt: new Date().toISOString(),
            browser: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
            transcriptLength: currentTranscript.length
          }
        };
        
        // Save to Firebase
        await addDocument('notes', data);
        setSaveSuccess(true);
        
        // Reload page after delay to refresh the notes list with just the user's notes
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        console.log('No transcript to save');
        setIsSaving(false);
      }
    } catch (err) {
      console.error('Error in handleStopRecording:', err);
      setIsSaving(false);
    }
  };
  
  // Reset recording state
  const handleReset = () => {
    stopRecording();
    setIsRecording(false);
    setIsSaving(false);
  };
  
  // Determine button state
  const isConnecting = connectionState === SocketState.CONNECTING;
  const isConnected = connectionState === SocketState.CONNECTED;
  const showSpinner = isConnecting || isSaving;
  const hasError = !!error;
  
  // Animation variants for sound wave
  const generateWaveAnimation = (index: number) => {
    if (!isRecording || !isConnected) return {};
    
    return {
      height: ['15px', `${15 + Math.random() * 30}px`, '15px']
    };
  };
  
  return (
    <div className="w-full flex flex-col items-center">
      {/* Main recording button */}
      <div className="relative w-full max-w-md flex flex-col items-center">
        {hasError ? (
          <button
            onClick={handleReset}
            className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center 
              bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg transition-all"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={showSpinner}
            className={`
              relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              } 
              ${showSpinner ? 'opacity-70 cursor-not-allowed' : ''}
              ${isRecording ? 'text-white' : 'text-gray-600'} shadow-lg
            `}
          >
            {showSpinner ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        )}
        
        {!isRecording && !hasError && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute z-0 w-16 h-16 rounded-full bg-green-300"
          />
        )}
        
        {isRecording && isConnected && (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute z-0 w-16 h-16 rounded-full bg-blue-200 opacity-70"
          />
        )}
      </div>
      
      {/* Status text */}
      <div className="mt-2 text-center text-sm">
        {hasError ? (
          'Click to retry'
        ) : showSpinner ? (
          isSaving ? 'Saving...' : 'Connecting...'
        ) : isRecording ? (
          'Recording assessment... Click to stop'
        ) : (
          <div className="flex flex-col items-center">
            <span>Click to start recording an assessment</span>
            <span className="text-xs text-gray-500 mt-1 md:hidden">
              This microphone lets you dictate assessment notes using your voice
            </span>
          </div>
        )}
      </div>
      
      {/* Success message */}
      {saveSuccess && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md text-sm flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Recording saved successfully! Reloading page...
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}
      
      {/* Transcript display */}
      {isRecording && !hasError && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow w-full max-w-lg">
          {/* Sound wave visualization */}
          <div className="flex space-x-2 mb-3 justify-center">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={generateWaveAnimation(i)}
                transition={{
                  duration: 0.5 + Math.random() * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1
                }}
                className={`w-1 rounded-full ${isConnected ? 'bg-blue-500' : 'bg-gray-400'}`}
              />
            ))}
          </div>
          
          {/* Transcript text box */}
          <div className="h-32 overflow-y-auto p-2 bg-gray-50 rounded border text-gray-700 relative">
            {transcript ? (
              <p>{transcript}</p>
            ) : (
              <span className="text-gray-400">Speak now to record your assessment...</span>
            )}
            
            {isConnecting && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                <div className="flex items-center text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Connecting to speech service...
                </div>
              </div>
            )}
          </div>
          
          {/* Connection status indicator */}
          <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
            <span>
              {isConnected ? (
                <span className="flex items-center text-green-600">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                  Connected
                </span>
              ) : isConnecting ? (
                <span className="flex items-center">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center text-red-600">
                  <span className="w-2 h-2 bg-red-600 rounded-full mr-1"></span>
                  Disconnected
                </span>
              )}
            </span>
            
            <span>
              {transcript ? `${transcript.length} characters` : 'No text yet'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 