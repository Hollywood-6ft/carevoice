'use client';

import {
  createClient,
  LiveClient,
  LiveTranscriptionEvents,
} from "@deepgram/sdk";
import { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";

// Define socket states
export enum SocketState {
  CLOSED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
}

// Define context type
interface DeepgramContextType {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  transcript: string;
  connectionState: SocketState;
  error: string | null;
}

// Create context
const DeepgramContext = createContext<DeepgramContextType | undefined>(undefined);

// Hardcoded API key
const API_KEY = "627a142a89a9350161dd03dec114fde73b5a1b1a";

export function DeepgramProvider({ children }: { children: ReactNode }) {
  const [transcript, setTranscript] = useState("");
  const [connectionState, setConnectionState] = useState<SocketState>(SocketState.CLOSED);
  const [error, setError] = useState<string | null>(null);
  
  const clientRef = useRef<LiveClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript("");
      setConnectionState(SocketState.CONNECTING);

      // Get microphone stream
      console.log("Requesting microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create DeepGram client
      console.log("Creating Deepgram client");
      const deepgramClient = createClient(API_KEY);
      
      // Open connection
      const connection = deepgramClient.listen.live({
        model: "nova-2",
        language: "en",
        smart_format: true,
        punctuate: true,
      });

      // Setup event handlers
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log("Deepgram connection opened");
        setConnectionState(SocketState.CONNECTED);
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log("Deepgram connection closed");
        setConnectionState(SocketState.CLOSED);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const text = data.channel?.alternatives?.[0]?.transcript || "";
        if (text.trim()) {
          console.log("Received transcript:", text);
          setTranscript(prev => {
            const newText = prev + " " + text;
            console.log("Transcript length:", newText.length);
            return newText;
          });
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error("Deepgram error:", err);
        setError(`Connection error: ${err?.message || "Unknown error"}`);
        setConnectionState(SocketState.CLOSED);
      });

      // Create media recorder and set up recording
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && connection.getReadyState() === 1) {
          console.log(`Sending ${event.data.size} bytes of audio data`);
          
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
              connection.send(reader.result);
            }
          };
          reader.readAsArrayBuffer(event.data);
        }
      };

      // Start recording
      recorder.start(1000); // Send data every 1 second for stability
      mediaRecorderRef.current = recorder;
      clientRef.current = connection;
      
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError(`Failed to start recording: ${err instanceof Error ? err.message : "Unknown error"}`);
      setConnectionState(SocketState.CLOSED);
      
      // Clean up on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const stopRecording = () => {
    console.log("Stopping recording");
    
    // Stop the media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error("Error stopping media recorder:", err);
      }
    }
    
    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Close Deepgram connection
    if (clientRef.current) {
      try {
        clientRef.current.finish();
      } catch (err) {
        console.error("Error closing Deepgram connection:", err);
      }
      clientRef.current = null;
    }
    
    setConnectionState(SocketState.CLOSED);
  };

  const value = {
    startRecording,
    stopRecording,
    transcript,
    connectionState,
    error,
  };

  return (
    <DeepgramContext.Provider value={value}>
      {children}
    </DeepgramContext.Provider>
  );
}

export function useDeepgram() {
  const context = useContext(DeepgramContext);
  if (context === undefined) {
    throw new Error("useDeepgram must be used within a DeepgramProvider");
  }
  return context;
} 