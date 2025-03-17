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
    <div className="space-y-4">
      <div className="border-b border-gray-200">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'assessments' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('assessments')}
        >
          Assessments ({notes.length})
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'completed' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({completedNotes.length})
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'careNoLongerNeeded' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('careNoLongerNeeded')}
        >
          Care No Longer Needed ({careNoLongerNeededNotes.length})
        </button>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center my-4">
          <LoadingSpinner />
        </div>
      )}

      {activeTab === 'assessments' && (
        <>
          <h2 className="text-xl font-semibold">Your Assessment Notes</h2>
          {notes.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No assessments yet. Start recording to create your first assessment note!
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => {
                const noteStatus = note.status || '';
                const statusDetails = statusMapping[noteStatus as keyof typeof statusMapping];
                const priorityStyle = note.priority ? priorityStyles[note.priority as keyof typeof priorityStyles] : null;
                
                return (
                  <div 
                    key={note.id} 
                    className={`p-4 rounded-lg shadow border hover:shadow-md transition-shadow bg-white`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-500 mb-1">
                          {format(new Date(note.timestamp), 'MMM d, yyyy - h:mm a')}
                        </div>
                        
                        {/* Display status, assessment type and priority if they exist */}
                        <div className="flex flex-wrap gap-1 mt-1 mb-2">
                          {statusDetails && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${statusDetails.bgColor} ${statusDetails.textColor}`}>
                              {statusDetails.icon} {statusDetails.label}
                            </span>
                          )}
                          
                          {note.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                              <ClipboardList size={12} className="mr-1" />
                              {note.category}
                            </span>
                          )}
                          
                          {priorityStyle && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${priorityStyle.bgColor} ${priorityStyle.color}`}>
                              <Flag size={12} className="mr-1" />
                              {note.priority ? note.priority.charAt(0).toUpperCase() + note.priority.slice(1) : ''} Priority
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditNote(note)}
                          className="text-blue-500 hover:text-blue-700"
                          aria-label="Edit assessment"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Delete assessment"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Display service user and assessor information */}
                    <div className="mb-3">
                      {note.serviceUser && (
                        <div className="flex items-center mb-1">
                          <User size={16} className="text-gray-500 mr-2" />
                          <h3 className="text-lg font-medium">Service User: {note.serviceUser}</h3>
                        </div>
                      )}
                      
                      {note.assessor && (
                        <div className="flex items-center">
                          <UserCheck size={16} className="text-gray-500 mr-2" />
                          <span className="text-sm text-gray-700">
                            Assessor: {note.assessor}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-800">{note.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'completed' && (
        <>
          <h2 className="text-xl font-semibold">Completed Assessments</h2>
          {completedNotes.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No completed assessments yet.
            </div>
          ) : (
            <div className="space-y-3">
              {completedNotes.map((note) => {
                const noteStatus = note.status || '';
                const statusDetails = statusMapping[noteStatus as keyof typeof statusMapping];
                const priorityStyle = note.priority ? priorityStyles[note.priority as keyof typeof priorityStyles] : null;
                
                return (
                  <div 
                    key={note.id} 
                    className={`p-4 rounded-lg shadow border hover:shadow-md transition-shadow bg-white`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-500 mb-1">
                          {format(new Date(note.timestamp), 'MMM d, yyyy - h:mm a')}
                        </div>
                        
                        {/* Display status, assessment type and priority if they exist */}
                        <div className="flex flex-wrap gap-1 mt-1 mb-2">
                          {statusDetails && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${statusDetails.bgColor} ${statusDetails.textColor}`}>
                              {statusDetails.icon} {statusDetails.label}
                            </span>
                          )}
                          
                          {note.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                              <ClipboardList size={12} className="mr-1" />
                              {note.category}
                            </span>
                          )}
                          
                          {priorityStyle && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${priorityStyle.bgColor} ${priorityStyle.color}`}>
                              <Flag size={12} className="mr-1" />
                              {note.priority ? note.priority.charAt(0).toUpperCase() + note.priority.slice(1) : ''} Priority
                            </span>
                          )}
                        </div>
                        
                        {/* Service User */}
                        {note.serviceUser && (
                          <div className="flex items-center text-sm text-gray-700 mb-1">
                            <User size={14} className="mr-1 text-gray-400" />
                            <span className="font-medium">Service User:</span>
                            <span className="ml-1">{note.serviceUser}</span>
                          </div>
                        )}
                        
                        {/* Assessor */}
                        {note.assessor && (
                          <div className="flex items-center text-sm text-gray-700 mb-1">
                            <UserCheck size={14} className="mr-1 text-gray-400" />
                            <span className="font-medium">Assessor:</span>
                            <span className="ml-1">{note.assessor}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleEditNote(note)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                          aria-label="Edit note"
                        >
                          <Edit2 size={16} className="text-blue-500" />
                        </button>
                        <button 
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                          aria-label="Delete note"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-800">{note.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'careNoLongerNeeded' && (
        <>
          <h2 className="text-xl font-semibold">Care No Longer Needed</h2>
          {careNoLongerNeededNotes.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No assessments marked as "Care No longer needed" yet.
            </div>
          ) : (
            <div className="space-y-3">
              {careNoLongerNeededNotes.map((note) => {
                const noteStatus = note.status || '';
                const statusDetails = statusMapping[noteStatus as keyof typeof statusMapping];
                const priorityStyle = note.priority ? priorityStyles[note.priority as keyof typeof priorityStyles] : null;
                
                return (
                  <div 
                    key={note.id} 
                    className={`p-4 rounded-lg shadow border hover:shadow-md transition-shadow bg-white`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-500 mb-1">
                          {format(new Date(note.timestamp), 'MMM d, yyyy - h:mm a')}
                        </div>
                        
                        {/* Display status, assessment type and priority if they exist */}
                        <div className="flex flex-wrap gap-1 mt-1 mb-2">
                          {statusDetails && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${statusDetails.bgColor} ${statusDetails.textColor}`}>
                              {statusDetails.icon} {statusDetails.label}
                            </span>
                          )}
                          
                          {note.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                              <ClipboardList size={12} className="mr-1" />
                              {note.category}
                            </span>
                          )}
                          
                          {priorityStyle && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${priorityStyle.bgColor} ${priorityStyle.color}`}>
                              <Flag size={12} className="mr-1" />
                              {note.priority ? note.priority.charAt(0).toUpperCase() + note.priority.slice(1) : ''} Priority
                            </span>
                          )}
                        </div>
                        
                        {/* Service User */}
                        {note.serviceUser && (
                          <div className="flex items-center text-sm text-gray-700 mb-1">
                            <User size={14} className="mr-1 text-gray-400" />
                            <span className="font-medium">Service User:</span>
                            <span className="ml-1">{note.serviceUser}</span>
                          </div>
                        )}
                        
                        {/* Assessor */}
                        {note.assessor && (
                          <div className="flex items-center text-sm text-gray-700 mb-1">
                            <UserCheck size={14} className="mr-1 text-gray-400" />
                            <span className="font-medium">Assessor:</span>
                            <span className="ml-1">{note.assessor}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleEditNote(note)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                          aria-label="Edit note"
                        >
                          <Edit2 size={16} className="text-blue-500" />
                        </button>
                        <button 
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                          aria-label="Delete note"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-800">{note.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {selectedNote && (
        <EditNoteModal 
          note={selectedNote}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleNoteUpdated}
        />
      )}
    </div>
  );
} 