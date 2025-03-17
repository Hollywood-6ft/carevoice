'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import VoiceRecorder from '@/components/VoiceRecorder';
import NotesList from '@/components/NotesList';
import SignInWithGoogle from '@/components/SignInWithGoogle';
import { DeepgramProvider } from '@/lib/contexts/DeepgramContext';
import InvitationManager from '@/components/InvitationManager';
import SharedBoardsView from '@/components/SharedBoardsView';
import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('myBoard');
  const searchParams = useSearchParams();
  
  // Set active tab based on URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['myBoard', 'sharedWithMe', 'manageInvitations'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // Show loading spinner while authentication state is being determined
  if (loading) {
    return <LoadingSpinner fullScreen />
  }
  
  return (
    <main className="min-h-screen bg-white pt-6 pb-20">
      <div className="container mx-auto px-4">
        <div className="w-full max-w-4xl mx-auto">
          {user && (
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('myBoard')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                      ${activeTab === 'myBoard' 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    My Board
                  </button>
                  <button
                    onClick={() => setActiveTab('sharedWithMe')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                      ${activeTab === 'sharedWithMe' 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Shared With Me
                  </button>
                  <button
                    onClick={() => setActiveTab('manageInvitations')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                      ${activeTab === 'manageInvitations' 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Manage Access
                  </button>
                </nav>
              </div>
            </div>
          )}
          
          {user && activeTab === 'myBoard' && (
            <>
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <DeepgramProvider>
                  <VoiceRecorder />
                </DeepgramProvider>
              </div>
              
              <div className="mt-12">
                <NotesList />
              </div>
            </>
          )}
          
          {user && activeTab === 'sharedWithMe' && (
            <SharedBoardsView />
          )}
          
          {user && activeTab === 'manageInvitations' && (
            <InvitationManager />
          )}
          
          {!user && (
            <div className="text-center py-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to CareVoice Assistant</h2>
              <p className="text-gray-600 mb-6">Sign in to access your assessments and start recording.</p>
              <div className="inline-block">
                <SignInWithGoogle />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
