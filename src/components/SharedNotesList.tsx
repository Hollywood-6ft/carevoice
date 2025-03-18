'use client';

import { useState, useEffect } from 'react';
import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { ClipboardList, Flag, User, UserCheck, Calendar, AlertCircle, Clock, Edit2, Trash2, Eye } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
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
  userId: string;
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
  'medium': { label: 'In Progress', icon: '🟠', bgColor: 'bg-amber-200 dark:bg-amber-800', textColor: 'text-amber-700 dark:text-amber-200' },
  'high': { label: 'Completed', icon: '🟢', bgColor: 'bg-green-200 dark:bg-green-800', textColor: 'text-green-700 dark:text-green-200' },
  'low': { label: 'Care No longer needed', icon: '🔴', bgColor: 'bg-red-200 dark:bg-red-800', textColor: 'text-red-700 dark:text-red-200' },
};

// Priority styles mapping for visual representation
const priorityStyles = {
  low: { color: 'text-gray-600 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  medium: { color: 'text-yellow-600 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-700' },
  high: { color: 'text-red-600 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-700' },
};

interface SharedNotesListProps {
  notes: Note[];
  canEdit: boolean;
  onEditNote?: (note: Note) => void;
  onViewNote?: (note: Note) => void;
}

export default function SharedNotesList({ notes, canEdit, onEditNote, onViewNote }: SharedNotesListProps) {
  const [assessmentNotes, setAssessmentNotes] = useState<Note[]>([]);
  const [completedNotes, setCompletedNotes] = useState<Note[]>([]);
  const [careNoLongerNeededNotes, setCareNoLongerNeededNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<'assessments' | 'completed' | 'careNoLongerNeeded'>('assessments');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    processNotes();
  }, [notes]);

  const processNotes = () => {
    const assessments: Note[] = [];
    const completed: Note[] = [];
    const careNoLongerNeeded: Note[] = [];
    
    notes.forEach((note) => {
      if (note.status === 'high') {
        // Status 'high' represents 'Completed'
        completed.push(note);
      } else if (note.status === 'low') {
        // Status 'low' represents 'Care No longer needed'
        careNoLongerNeeded.push(note);
      } else {
        // All other notes (including those with no status or 'medium' status)
        // will be in the main assessments tab
        assessments.push(note);
      }
    });
    
    // Sort notes by timestamp (most recent first)
    const sortByTimestamp = (a: Note, b: Note) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    
    assessments.sort(sortByTimestamp);
    completed.sort(sortByTimestamp);
    careNoLongerNeeded.sort(sortByTimestamp);
    
    setAssessmentNotes(assessments);
    setCompletedNotes(completed);
    setCareNoLongerNeededNotes(careNoLongerNeeded);
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

  if (isLoading) {
    return <LoadingSpinner className="py-8" />;
  }

  return (
    <div className="mt-6">
      {/* Tab navigation - styled to match exactly the main page */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('assessments')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
              ${activeTab === 'assessments' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
          >
            Assessments ({assessmentNotes.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
              ${activeTab === 'completed' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
          >
            Completed ({completedNotes.length})
          </button>
          <button
            onClick={() => setActiveTab('careNoLongerNeeded')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
              ${activeTab === 'careNoLongerNeeded' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
          >
            Care No Longer Needed ({careNoLongerNeededNotes.length})
          </button>
        </nav>
      </div>

      {activeTab === 'assessments' && (
        <>
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Assessment Notes</h2>
          {assessmentNotes.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No assessments available.
            </div>
          ) : (
            <div className="space-y-4">
              {assessmentNotes.map((note) => (
                <div key={note.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {format(new Date(note.timestamp), 'MMM d, yyyy - h:mm a')}
                    </div>
                    <div className="flex items-center space-x-2">
                      {onViewNote && (
                        <button 
                          onClick={() => onViewNote(note)}
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          aria-label="View assessment"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {canEdit && onEditNote && (
                        <button 
                          onClick={() => onEditNote(note)}
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          aria-label="Edit assessment"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tags row */}
                  <div className="flex flex-wrap gap-2 my-2">
                    {note.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                        <ClipboardList size={12} className="mr-1" />
                        {note.category}
                      </span>
                    )}
                    
                    {note.priority && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${priorityStyles[note.priority as keyof typeof priorityStyles]?.bgColor || ''} ${priorityStyles[note.priority as keyof typeof priorityStyles]?.color || ''}`}>
                        <Flag size={12} className="mr-1" />
                        {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)} Priority
                      </span>
                    )}
                  </div>
                    
                  {/* Assessor info */}
                  {note.assessor && (
                    <div className="flex items-center my-1 text-sm text-gray-700 dark:text-gray-300">
                      <UserCheck size={14} className="text-gray-500 dark:text-gray-400 mr-1" />
                      <span>Assessor: {note.assessor}</span>
                    </div>
                  )}
                    
                  {/* Content */}
                  <p className="text-gray-800 dark:text-gray-200 mt-2">{note.text}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'completed' && (
        <>
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Completed Assessments</h2>
          {completedNotes.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No completed assessments available.
            </div>
          ) : (
            <div className="space-y-4">
              {completedNotes.map((note) => (
                <div key={note.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {format(new Date(note.timestamp), 'MMM d, yyyy - h:mm a')}
                    </div>
                    <div className="flex items-center space-x-2">
                      {onViewNote && (
                        <button 
                          onClick={() => onViewNote(note)}
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          aria-label="View assessment"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {canEdit && onEditNote && (
                        <button 
                          onClick={() => onEditNote(note)}
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          aria-label="Edit assessment"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tags row */}
                  <div className="flex flex-wrap gap-2 my-2">
                    {note.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                        <ClipboardList size={12} className="mr-1" />
                        {note.category}
                      </span>
                    )}
                    
                    {note.priority && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${priorityStyles[note.priority as keyof typeof priorityStyles]?.bgColor || ''} ${priorityStyles[note.priority as keyof typeof priorityStyles]?.color || ''}`}>
                        <Flag size={12} className="mr-1" />
                        {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)} Priority
                      </span>
                    )}
                    
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200">
                      🟢 Completed
                    </span>
                  </div>
                    
                  {/* Assessor info */}
                  {note.assessor && (
                    <div className="flex items-center my-1 text-sm text-gray-700 dark:text-gray-300">
                      <UserCheck size={14} className="text-gray-500 dark:text-gray-400 mr-1" />
                      <span>Assessor: {note.assessor}</span>
                    </div>
                  )}
                    
                  {/* Content */}
                  <p className="text-gray-800 dark:text-gray-200 mt-2">{note.text}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'careNoLongerNeeded' && (
        <>
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Care No Longer Needed</h2>
          {careNoLongerNeededNotes.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No assessments marked as &quot;Care No longer needed&quot; available.
            </div>
          ) : (
            <div className="space-y-4">
              {careNoLongerNeededNotes.map((note) => (
                <div key={note.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {format(new Date(note.timestamp), 'MMM d, yyyy - h:mm a')}
                    </div>
                    <div className="flex items-center space-x-2">
                      {onViewNote && (
                        <button 
                          onClick={() => onViewNote(note)}
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          aria-label="View assessment"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {canEdit && onEditNote && (
                        <button 
                          onClick={() => onEditNote(note)}
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          aria-label="Edit assessment"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tags row */}
                  <div className="flex flex-wrap gap-2 my-2">
                    {note.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                        <ClipboardList size={12} className="mr-1" />
                        {note.category}
                      </span>
                    )}
                    
                    {note.priority && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${priorityStyles[note.priority as keyof typeof priorityStyles]?.bgColor || ''} ${priorityStyles[note.priority as keyof typeof priorityStyles]?.color || ''}`}>
                        <Flag size={12} className="mr-1" />
                        {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)} Priority
                      </span>
                    )}
                    
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200">
                      🔴 Care No Longer Needed
                    </span>
                  </div>
                    
                  {/* Assessor info */}
                  {note.assessor && (
                    <div className="flex items-center my-1 text-sm text-gray-700 dark:text-gray-300">
                      <UserCheck size={14} className="text-gray-500 dark:text-gray-400 mr-1" />
                      <span>Assessor: {note.assessor}</span>
                    </div>
                  )}
                    
                  {/* Content */}
                  <p className="text-gray-800 dark:text-gray-200 mt-2">{note.text}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 