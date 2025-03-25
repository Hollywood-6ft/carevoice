'use client';

import { useState, useEffect } from 'react';
import { getDocuments, deleteDocument } from '@/lib/firebase/firebaseUtils';
import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { Trash2, Edit2, ClipboardList, Flag, User, UserCheck, Calendar, AlertCircle, Clock } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EditNoteModal from './EditNoteModal';
import { useAuth } from '@/lib/hooks/useAuth';

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
  userId?: string;
  reminders?: {
    registeredManagerDate?: string;
    threeMonthReviewDate?: string;
    sixMonthReviewDate?: string;
  };
  // Ramp fields
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
  // Ramp field titles (optional)
  rampFieldTitles?: { [key: string]: string };
  // Custom ramp fields
  customRampFields?: { id: string; title: string; value: string }[];
  // Local storage fields
  _localOnly?: boolean;
  _createdAt?: string;
  _updatedAt?: string;
  // Debug info
  debugInfo?: {
    savedAt?: string;
    browser?: string;
    transcriptLength?: number;
  };
}

// Status mapping for visual representation
const statusMapping = {
  'medium': { label: 'In Progress', icon: '🟠', bgColor: 'bg-amber-200 dark:bg-amber-900', textColor: 'text-amber-700 dark:text-amber-300' },
  'high': { label: 'Completed', icon: '🟢', bgColor: 'bg-green-200 dark:bg-green-900', textColor: 'text-green-700 dark:text-green-300' },
  'low': { label: 'Care No longer needed', icon: '🔴', bgColor: 'bg-red-200 dark:bg-red-900', textColor: 'text-red-700 dark:text-red-300' },
};

// Priority styles mapping for visual representation
const priorityStyles = {
  low: { color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  medium: { color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/40' },
  high: { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/40' },
};

export default function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [completedNotes, setCompletedNotes] = useState<Note[]>([]);
  const [careNoLongerNeededNotes, setCareNoLongerNeededNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState<'assessments' | 'completed' | 'careNoLongerNeeded'>('assessments');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const fetchedNotes = await getDocuments('notes', user?.uid);
        
        // Separate notes based on their status
        const assessmentNotes: Note[] = [];
        const completedNotesList: Note[] = [];
        const careNoLongerNeededList: Note[] = [];
        
        // Type assertion for fetchedNotes
        (fetchedNotes as any[]).forEach((note) => {
          // Ensure the note has the required fields to be a Note
          if ('id' in note && 'text' in note && 'timestamp' in note) {
            const typedNote = note as Note;
            
            // Filter based on status
            if (typedNote.status === 'high') {
              // Status 'high' represents 'Completed'
              completedNotesList.push(typedNote);
            } else if (typedNote.status === 'low') {
              // Status 'low' represents 'Care No longer needed'
              careNoLongerNeededList.push(typedNote);
            } else {
              // All other notes (including those with no status or 'medium' status)
              // will be in the main assessments tab
              assessmentNotes.push(typedNote);
            }
          }
        });
        
        // Sort notes by timestamp (most recent first)
        const sortByTimestamp = (a: Note, b: Note) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        
        assessmentNotes.sort(sortByTimestamp);
        completedNotesList.sort(sortByTimestamp);
        careNoLongerNeededList.sort(sortByTimestamp);
        
        setNotes(assessmentNotes);
        setCompletedNotes(completedNotesList);
        setCareNoLongerNeededNotes(careNoLongerNeededList);
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [user?.uid]);

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteDocument('notes', id);
      setNotes(notes.filter(note => note.id !== id));
      setCompletedNotes(completedNotes.filter(note => note.id !== id));
      setCareNoLongerNeededNotes(careNoLongerNeededNotes.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditModalOpen(true);
  };

  const handleNoteUpdated = async () => {
    setIsEditModalOpen(false);
    setSelectedNote(null);
    
    try {
      setIsLoading(true);
      const fetchedNotes = await getDocuments('notes', user?.uid);
      
      // Separate notes based on their status
      const assessmentNotes: Note[] = [];
      const completedNotesList: Note[] = [];
      const careNoLongerNeededList: Note[] = [];
      
      // Type assertion for fetchedNotes
      (fetchedNotes as any[]).forEach((note) => {
        if ('id' in note && 'text' in note && 'timestamp' in note) {
          const typedNote = note as Note;
          
          // Filter based on status
          if (typedNote.status === 'high') {
            // Status 'high' represents 'Completed'
            completedNotesList.push(typedNote);
          } else if (typedNote.status === 'low') {
            // Status 'low' represents 'Care No longer needed'
            careNoLongerNeededList.push(typedNote);
          } else {
            // All other notes (including those with no status or 'medium' status)
            assessmentNotes.push(typedNote);
          }
        }
      });
      
      // Sort notes by timestamp (most recent first)
      const sortByTimestamp = (a: Note, b: Note) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      
      assessmentNotes.sort(sortByTimestamp);
      completedNotesList.sort(sortByTimestamp);
      careNoLongerNeededList.sort(sortByTimestamp);
      
      setNotes(assessmentNotes);
      setCompletedNotes(completedNotesList);
      setCareNoLongerNeededNotes(careNoLongerNeededList);
    } catch (error) {
      console.error('Error fetching updated notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to render due date status
  const renderDueDate = (dueDate: string) => {
    const dueDateObj = new Date(dueDate);
    const daysUntilDue = differenceInDays(dueDateObj, new Date());
    
    if (isPast(dueDateObj) && !isToday(dueDateObj)) {
      return (
        <span className="flex items-center text-red-600 text-sm font-medium">
          <AlertCircle size={14} className="mr-1" />
          Overdue by {Math.abs(daysUntilDue)} days
        </span>
      );
    } else if (isToday(dueDateObj)) {
      return (
        <span className="flex items-center text-amber-600 text-sm font-medium">
          <Clock size={14} className="mr-1" />
          Due today
        </span>
      );
    } else if (daysUntilDue <= 7) {
      return (
        <span className="flex items-center text-amber-600 text-sm font-medium">
          <Clock size={14} className="mr-1" />
          Due in {daysUntilDue} days
        </span>
      );
    } else {
      return (
        <span className="flex items-center text-green-600 text-sm">
          <Calendar size={14} className="mr-1" />
          Due {format(dueDateObj, 'MMM d, yyyy')}
        </span>
      );
    }
  };

  // Render active tab content based on the selected tab
  const renderTabContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    const displayNotes = activeTab === 'assessments' 
      ? notes 
      : activeTab === 'completed' 
        ? completedNotes 
        : careNoLongerNeededNotes;
      
    if (displayNotes.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">No notes found in this category.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6">
        {displayNotes.map((note) => (
          <div 
            key={note.id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200"
          >
            {/* Note header with timestamp and actions */}
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-500 dark:text-gray-300 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    {format(new Date(note.timestamp), 'MMM d, yyyy - h:mm a')}
                  </span>
                </div>
                
                {/* Due date (if exists) */}
                {note.isReminder && note.dueDate && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" />
                    <span>{renderDueDate(note.dueDate)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditNote(note)}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  aria-label="Edit note"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  aria-label="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Note body with service user, assessor, status, and text content */}
            <div className="p-4">
              {/* Service user and assessor */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                {note.serviceUser && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <User className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" />
                    <span>Service User: {note.serviceUser}</span>
                  </div>
                )}
                
                {note.assessor && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 ml-0 sm:ml-4">
                    <UserCheck className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" />
                    <span>Assessor: {note.assessor}</span>
                  </div>
                )}
              </div>
              
              {/* Status and priority badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {note.status && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMapping[note.status as keyof typeof statusMapping]?.bgColor || 'bg-gray-100 dark:bg-gray-700'} ${statusMapping[note.status as keyof typeof statusMapping]?.textColor || 'text-gray-800 dark:text-gray-200'}`}>
                    {statusMapping[note.status as keyof typeof statusMapping]?.icon} {statusMapping[note.status as keyof typeof statusMapping]?.label || note.status}
                  </span>
                )}
                
                {note.priority && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityStyles[note.priority as keyof typeof priorityStyles]?.bgColor || 'bg-gray-100 dark:bg-gray-700'} ${priorityStyles[note.priority as keyof typeof priorityStyles]?.color || 'text-gray-800 dark:text-gray-200'}`}>
                    <Flag className="h-3 w-3 mr-1" /> 
                    {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)} Priority
                  </span>
                )}
                
                {note.category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                    <ClipboardList className="h-3 w-3 mr-1" /> 
                    {note.category}
                  </span>
                )}
              </div>
              
              {/* Note text content */}
              <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {note.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Assessment Notes</h2>
      </div>
      
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('assessments')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assessments'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            aria-label={`Assessments (${notes.length})`}
          >
            Assessments ({notes.length})
          </button>
          
          <button
            onClick={() => setActiveTab('completed')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'completed'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            aria-label={`Completed (${completedNotes.length})`}
          >
            Completed ({completedNotes.length})
          </button>
          
          <button
            onClick={() => setActiveTab('careNoLongerNeeded')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'careNoLongerNeeded'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            aria-label={`Care No Longer Needed (${careNoLongerNeededNotes.length})`}
          >
            Care No Longer Needed ({careNoLongerNeededNotes.length})
          </button>
        </nav>
      </div>
      
      {renderTabContent()}
      
      {/* Edit modal */}
      {isEditModalOpen && selectedNote && (
        <EditNoteModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedNote(null);
          }}
          onSave={handleNoteUpdated}
          note={selectedNote}
        />
      )}
    </div>
  );
} 