'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getDocuments, updateDocument } from '@/lib/firebase/firebaseUtils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SharedNotesList from '@/components/SharedNotesList';
import EditNoteModal from '@/components/EditNoteModal';

interface Invitation {
  id: string;
  inviterId: string;
  inviterEmail: string;
  inviteeEmail: string;
  accessLevel?: 'view' | 'edit';  // Added access level field
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt?: string;
}

interface Note {
  id: string;
  text: string;
  timestamp: string;
  serviceUser?: string;
  assessor?: string;
  status?: string;
  category?: string;
  priority?: string;
  isReminder?: boolean;
  dueDate?: string;
  userId: string;  // Changed from optional to required to match EditNoteModal
  reminders?: {
    registeredManagerDate?: string;
    threeMonthReviewDate?: string;
    sixMonthReviewDate?: string;
  };
  // Ramp fields that may be needed by EditNoteModal
  ramp1?: string;
  ramp2?: string;
  ramp3?: string;
  ramp4?: string;
  ramp5?: string;
  ramp6?: string;
  ramp7?: string;
  ramp8?: string;
  ramp9?: string;
  ramp10?: string;
  ramp11?: string;
  ramp12?: string;
  ramp13?: string;
  ramp14?: string;
  ramp15?: string;
  ramp16?: string;
  ramp17?: string;
  ramp18?: string;
  ramp19?: string;
  ramp20?: string;
  ramp21?: string;
  rampFieldTitles?: { [key: string]: string };
  customRampFields?: { id: string; title: string; value: string }[];
}

interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
}

export default function SharedBoardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [boardOwner, setBoardOwner] = useState<UserProfile | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit'>('view');
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState(false);

  useEffect(() => {
    if (!user) {
      // If not logged in, redirect to sign-in page
      router.push('/signin');
      return;
    }

    checkAccess();
  }, [user, userId, router]);

  const checkAccess = async () => {
    if (!user || !userId) return;
    
    try {
      setLoading(true);
      
      // Get all invitations
      const allInvitations = await getDocuments('invitations');
      
      // Check if current user has an accepted invitation from the board owner
      const userInvitation = allInvitations.find(
        (inv: Invitation) => 
          inv.inviterId === userId && 
          inv.inviteeEmail === user.email && 
          inv.status === 'accepted'
      );
      
      if (!userInvitation) {
        setError('You do not have access to this board.');
        setHasAccess(false);
        setLoading(false);
        return;
      }
      
      setHasAccess(true);
      
      // Set access level based on invitation (default to view-only if not specified)
      setAccessLevel(userInvitation.accessLevel || 'view');
      
      // Fetch board owner's profile
      const users = await getDocuments('users');
      const owner = users.find((u: UserProfile) => u.id === userId);
      setBoardOwner(owner || null);
      
      // Fetch notes for this user's board
      const allNotes = await getDocuments('notes');
      const userNotes = allNotes.filter((note: any) => note.userId === userId);
      
      setNotes(userNotes as Note[]);
    } catch (error) {
      console.error('Error loading shared board:', error);
      setError('Failed to load the shared board. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = (note: Note) => {
    if (accessLevel === 'edit') {
      setSelectedNote(note);
      setIsEditModalOpen(true);
      setViewMode(false);
    }
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditModalOpen(true);
    setViewMode(true);
  };

  const handleNoteUpdated = async () => {
    setIsEditModalOpen(false);
    setSelectedNote(null);
    setViewMode(false);
    
    try {
      // Refresh notes after update
      const allNotes = await getDocuments('notes');
      const userNotes = allNotes.filter((note: any) => note.userId === userId);
      setNotes(userNotes as Note[]);
    } catch (error) {
      console.error('Error refreshing notes:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to sign-in page
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="bg-red-50 p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Access Denied</h1>
          <p className="text-red-700 mb-4">
            {error || 'You do not have permission to view this board.'}
          </p>
          <Link 
            href="/"
            className="inline-block bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white pt-8 pb-20">
      <div className="container mx-auto px-4">
        <div className="w-full max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link 
                  href="/"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-1"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Back to My Board
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {boardOwner?.displayName || boardOwner?.email?.split('@')[0] || 'User'}&apos;s Board
              </h1>
            </div>
            <div className="inline-block bg-blue-100 text-blue-800 text-sm py-1 px-4 rounded-full">
              Viewing as {accessLevel === 'edit' ? 'Editor' : 'Viewer'}
            </div>
          </header>
          
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <SharedNotesList 
            notes={notes} 
            canEdit={accessLevel === 'edit'} 
            onEditNote={handleEditNote}
            onViewNote={handleViewNote}
          />
          
          {/* Edit Modal */}
          {isEditModalOpen && selectedNote && (
            <EditNoteModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              note={selectedNote}
              onSave={handleNoteUpdated}
              readOnly={viewMode}
            />
          )}
        </div>
      </div>
    </main>
  );
} 