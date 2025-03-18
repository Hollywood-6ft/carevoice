'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import VoiceRecorder from '@/components/VoiceRecorder';
import NotesList from '@/components/NotesList';
import SignInWithGoogle from '@/components/SignInWithGoogle';
import { DeepgramProvider } from '@/lib/contexts/DeepgramContext';
import InvitationManager from '@/components/InvitationManager';
import SharedBoardsView from '@/components/SharedBoardsView';
import { useState, useEffect, Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useSearchParams } from 'next/navigation';

function HomeContent() {
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
    <main className="min-h-screen bg-white dark:bg-gray-900 pt-6 pb-20">
      <div className="container mx-auto px-4">
        <div className="w-full max-w-4xl mx-auto">
          {user && (
            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('myBoard')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-base 
                      ${activeTab === 'myBoard' 
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  >
                    My Board
                  </button>
                  <button
                    onClick={() => setActiveTab('sharedWithMe')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-base 
                      ${activeTab === 'sharedWithMe' 
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  >
                    Shared With Me
                  </button>
                  <button
                    onClick={() => setActiveTab('manageInvitations')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-base 
                      ${activeTab === 'manageInvitations' 
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  >
                    Manage Access
                  </button>
                </nav>
              </div>
            </div>
          )}
          
          {user && activeTab === 'myBoard' && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 relative z-[1]">
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
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Welcome to CareVoice</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Sign in to access your assessments and start recording.</p>
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

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <HomeContent />
    </Suspense>
  );
}
