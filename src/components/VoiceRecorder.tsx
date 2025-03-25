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
                : 'bg-blue-500 hover:bg-blue-600'} 
              text-white shadow-lg
              ${showSpinner ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            {showSpinner ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {isRecording ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </>
            )}
          </button>
        )}
        
        {/* Sound wave visualization */}
        {isRecording && (
          <div className="absolute bottom-0 w-64 flex justify-center items-end space-x-1 z-0">
            {Array.from({ length: 30 }).map((_, index) => (
              <motion.div
                key={index}
                className="w-1 bg-blue-400 dark:bg-blue-500 rounded-t-full"
                style={{ height: '15px' }}
                animate={generateWaveAnimation(index)}
                transition={{
                  duration: 0.5 + Math.random() * 0.5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Status and error messages */}
      <div className="mt-8 text-center">
        {hasError ? (
          <div className="flex items-center text-red-500 dark:text-red-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            <p className="text-sm">
              {error || "Couldn't start recording. Please try again."}
            </p>
          </div>
        ) : (
          <>
            {isConnecting && (
              <p className="text-gray-600 dark:text-gray-300">
                Connecting to speech service...
              </p>
            )}
            {isRecording && isConnected && (
              <p className="text-gray-700 dark:text-gray-200 font-medium">
                Recording... Speak clearly into your microphone
              </p>
            )}
            {saveSuccess && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                <p>Assessment saved successfully!</p>
              </div>
            )}
            {!isRecording && !isSaving && !saveSuccess && (
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-200 text-lg">
                  Record your assessment notes
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                  Click the microphone to start recording. Speak clearly into your microphone to capture your assessment notes.
                </p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Transcript preview (when recording) */}
      {isRecording && transcript && (
        <div className="mt-6 w-full max-w-2xl">
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Live Transcript Preview:
            </h3>
            <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">
              {transcript || "Listening..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 