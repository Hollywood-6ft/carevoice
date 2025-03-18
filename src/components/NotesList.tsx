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
  'medium': { label: 'In Progress', icon: '🟠', bgColor: 'bg-amber-200', textColor: 'text-amber-700' },
  'high': { label: 'Completed', icon: '🟢', bgColor: 'bg-green-200', textColor: 'text-green-700' },
  'low': { label: 'Care No longer needed', icon: '🔴', bgColor: 'bg-red-200', textColor: 'text-red-700' },
};

// Priority styles mapping for visual representation
const priorityStyles = {
  low: { color: 'text-gray-600', bgColor: 'bg-gray-100' },
  medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  high: { color: 'text-red-600', bgColor: 'bg-red-100' },
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

  if (loading) {
    return <LoadingSpinner className="py-8" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Assessment Notes</h2>
        <div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 inline-flex">
            <button
              className={`px-4 py-2 text-sm rounded-md ${
                activeTab === 'assessments'
                  ? 'bg-white dark:bg-gray-700 shadow text-gray-800 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('assessments')}
            >
              Assessments ({notes.length})
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md ${
                activeTab === 'completed'
                  ? 'bg-white dark:bg-gray-700 shadow text-gray-800 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('completed')}
            >
              Completed ({completedNotes.length})
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md ${
                activeTab === 'careNoLongerNeeded'
                  ? 'bg-white dark:bg-gray-700 shadow text-gray-800 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('careNoLongerNeeded')}
            >
              Care No Longer Needed ({careNoLongerNeededNotes.length})
            </button>
          </div>
        </div>
      </div>

      {/* Active tab content */}
      <div>
        {isLoading ? (
          <LoadingSpinner className="py-8" />
        ) : (
          <div className="space-y-4">
            {activeTab === 'assessments' && notes.length === 0 && (
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                No assessments found.
              </div>
            )}

            {activeTab === 'completed' && completedNotes.length === 0 && (
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                No completed assessments found.
              </div>
            )}

            {activeTab === 'careNoLongerNeeded' && careNoLongerNeededNotes.length === 0 && (
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                No &apos;care no longer needed&apos; assessments found.
              </div>
            )}

            {activeTab === 'assessments' &&
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {note.timestamp ? format(new Date(note.timestamp), 'MMM d, yyyy - h:mm a') : 'Unknown date'}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {note.status && statusMapping[note.status as keyof typeof statusMapping] && (
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full flex items-center ${statusMapping[note.status as keyof typeof statusMapping].bgColor} ${statusMapping[note.status as keyof typeof statusMapping].textColor}`}>
                          {statusMapping[note.status as keyof typeof statusMapping].label}
                        </span>
                      )}
                      
                      {note.category && (
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                          {note.category}
                        </span>
                      )}

                      {note.priority && priorityStyles[note.priority as keyof typeof priorityStyles] && (
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full flex items-center ${priorityStyles[note.priority as keyof typeof priorityStyles].bgColor} ${priorityStyles[note.priority as keyof typeof priorityStyles].color}`}>
                          <Flag className="w-3 h-3 mr-1" />
                          {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)} Priority
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">Service User: {note.serviceUser || "Unnamed"}</span>
                    </div>
                    
                    {note.assessor && (
                      <div className="flex items-center">
                        <UserCheck className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">Assessor: {note.assessor}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 text-gray-700 dark:text-gray-300">
                    {note.text}
                  </div>
                  
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full"
                      title="Edit Assessment"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"
                      title="Delete Assessment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

            {activeTab === 'completed' &&
              completedNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {note.timestamp ? format(new Date(note.timestamp), 'MMM d, yyyy - h:mm a') : 'Unknown date'}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {note.status && statusMapping[note.status as keyof typeof statusMapping] && (
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full flex items-center ${statusMapping[note.status as keyof typeof statusMapping].bgColor} ${statusMapping[note.status as keyof typeof statusMapping].textColor}`}>
                          {statusMapping[note.status as keyof typeof statusMapping].label}
                        </span>
                      )}
                      
                      {note.category && (
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                          {note.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">Service User: {note.serviceUser || "Unnamed"}</span>
                    </div>
                    
                    {note.assessor && (
                      <div className="flex items-center">
                        <UserCheck className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">Assessor: {note.assessor}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 text-gray-700 dark:text-gray-300">
                    {note.text}
                  </div>
                  
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full"
                      title="View Assessment"
                    >
                      <ClipboardList size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"
                      title="Delete Assessment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

            {activeTab === 'careNoLongerNeeded' &&
              careNoLongerNeededNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {note.timestamp ? format(new Date(note.timestamp), 'MMM d, yyyy - h:mm a') : 'Unknown date'}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {note.status && statusMapping[note.status as keyof typeof statusMapping] && (
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full flex items-center ${statusMapping[note.status as keyof typeof statusMapping].bgColor} ${statusMapping[note.status as keyof typeof statusMapping].textColor}`}>
                          {statusMapping[note.status as keyof typeof statusMapping].label}
                        </span>
                      )}
                      
                      {note.category && (
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                          {note.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">Service User: {note.serviceUser || "Unnamed"}</span>
                    </div>
                    
                    {note.assessor && (
                      <div className="flex items-center">
                        <UserCheck className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">Assessor: {note.assessor}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 text-gray-700 dark:text-gray-300">
                    {note.text}
                  </div>
                  
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full"
                      title="View Assessment"
                    >
                      <ClipboardList size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"
                      title="Delete Assessment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {isEditModalOpen && selectedNote && (
        <EditNoteModal
          note={selectedNote}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedNote(null);
          }}
          onSave={handleNoteUpdated}
          readOnly={selectedNote.status === 'high' || selectedNote.status === 'low'}
        />
      )}
    </div>
  );
} 