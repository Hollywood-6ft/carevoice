'use client';

import { useState, useEffect, useRef } from 'react';
import { updateDocument, getDocuments, addDocument, uploadFile } from '@/lib/firebase/firebaseUtils';
import { Loader2, X, CheckCircle, Calendar, AlertCircle, AlertTriangle, FileText, Eye } from 'lucide-react';
import { format, addWeeks, addMonths } from 'date-fns';
import PdfAssessmentUploader from './PdfAssessmentUploader';
import AiChatModal from './AiChatModal';
import DownloadAssessmentPdf from './DownloadAssessmentPdf';

// Status colors for note personalization
const statusColors = [
  { name: 'In Progress', value: 'medium', color: 'bg-amber-200', textColor: 'text-amber-700' },
  { name: 'Completed', value: 'high', color: 'bg-green-200', textColor: 'text-green-700' },
  { name: 'Care No longer needed', value: 'low', color: 'bg-red-200', textColor: 'text-red-700' },
];

// Note categories for assessments
const noteCategories = [
  'Initial Assessment',
  'Registered Manager Introduction',
  '3-month review',
  '6-month review',
];

// Priority levels
const priorityLevels = [
  { name: 'Low', value: 'low', color: 'bg-gray-200' },
  { name: 'Medium', value: 'medium', color: 'bg-yellow-200' },
  { name: 'High', value: 'high', color: 'bg-red-200' },
];

// Ramp fields with titles
const defaultRampFields = [
  { id: 'ramp1', title: 'Ramp 1: Respiratory Care' },
  { id: 'ramp2', title: 'Ramp 2: Psychological' },
  { id: 'ramp3', title: 'Ramp 3: Nutrition' },
  { id: 'ramp4', title: 'Ramp 4: Skin integrity' },
  { id: 'ramp5', title: 'Ramp 5: Mobility' },
  { id: 'ramp6', title: 'Ramp 6: Personal hygiene' },
  { id: 'ramp7', title: 'Ramp 7: Elimination' },
  { id: 'ramp8', title: 'Ramp 8: Sleeping' },
  { id: 'ramp9', title: 'Ramp 9: End of life care' },
  { id: 'ramp10', title: 'Ramp 10: Sexuality' },
  { id: 'ramp11', title: 'Ramp 11: Living environment' },
  { id: 'ramp12', title: 'Ramp 12: Activities of daily living' },
  { id: 'ramp13', title: 'Ramp 13: Medication' },
  { id: 'ramp14', title: 'Ramp 14: Communication' },
  { id: 'ramp15', title: 'Ramp 15: Moving and handling' },
  { id: 'ramp16', title: 'Ramp 16: Falls and Safety' },
  { id: 'ramp17', title: 'Ramp 17: COSSH' },
  { id: 'ramp18', title: 'Ramp 18: Money Management' },
  { id: 'ramp19', title: 'Ramp 19: Social and Spiritual' },
  { id: 'ramp20', title: 'Ramp 20: Challenging Behaviour' },
];

interface EditNoteModalProps {
  note: {
    id: string;
    text: string;
    timestamp: string;
    serviceUser?: string;
    firstVisitDate?: string;
    assessor?: string;
    status?: string;
    category?: string;
    priority?: string;
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
    // Ramp field titles (optional)
    rampFieldTitles?: { [key: string]: string };
    // Custom ramp fields
    customRampFields?: { id: string; title: string; value: string }[];
    // Additional fields
    accessDetails?: string;
    medicalBackground?: string;
    medicationList?: string;
    supportRequired?: string;
    lpaHealth?: string;
    lpaFinance?: string;
    keyWorker?: string;
    gender?: string;
    ethnicity?: string;
    pdfStorageUrl?: string;
    pdfFilename?: string;
    initialAssessment?: string;
    carePlanApproval?: string;
    userId?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  readOnly?: boolean;
}

export default function EditNoteModal({ note, isOpen, onClose, onSave, readOnly = false }: EditNoteModalProps) {
  const [text, setText] = useState(note.text || '');
  const [serviceUser, setServiceUser] = useState(note.serviceUser || '');
  const [firstVisitDate, setFirstVisitDate] = useState(note.firstVisitDate || '');
  const [assessor, setAssessor] = useState(note.assessor || '');
  const [status, setStatus] = useState(note.status || 'low');
  const [category, setCategory] = useState(note.category || 'Initial Assessment');
  const [priority, setPriority] = useState(note.priority || 'low');
  const [reminders, setReminders] = useState(note.reminders || {});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'ramp' | 'additional'>('basic');
  const [serviceUserError, setServiceUserError] = useState(false);
  const [firstVisitDateError, setFirstVisitDateError] = useState(false);
  const [assessorError, setAssessorError] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  // Ramp field states
  const [rampValues, setRampValues] = useState<{[key: string]: string}>({});
  const [rampErrors, setRampErrors] = useState<{[key: string]: boolean}>({});
  const [rampFields, setRampFields] = useState(
    defaultRampFields.map(field => ({
      ...field,
      title: note.rampFieldTitles?.[field.id] || field.title
    }))
  );
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [carePlanApproval, setCarePlanApproval] = useState('');
  // Additional fields states
  const [accessDetails, setAccessDetails] = useState('');
  const [medicalBackground, setMedicalBackground] = useState('');
  const [medicationList, setMedicationList] = useState('');
  const [supportRequired, setSupportRequired] = useState('');
  const [lpaHealth, setLpaHealth] = useState('');
  const [lpaFinance, setLpaFinance] = useState('');
  const [keyWorker, setKeyWorker] = useState('');
  const [gender, setGender] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [initialAssessment, setInitialAssessment] = useState(note.initialAssessment || '');
  
  const [formError, setFormError] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [noteChanged, setNoteChanged] = useState(false);
  
  // Add new state for PDF content
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  
  // Add state to control AI chat modal visibility
  const [showAiChat, setShowAiChat] = useState(false);
  
  const [customRampFields, setCustomRampFields] = useState<{ id: string; title: string; value: string }[]>(
    note.customRampFields || []
  );
  
  useEffect(() => {
    if (isOpen && note) {
      setText(note.text);
      setServiceUser(note.serviceUser || '');
      setFirstVisitDate(note.firstVisitDate || '');
      setAssessor(note.assessor || '');
      setStatus(note.status || 'low');
      setCategory(note.category || 'Initial Assessment');
      setPriority(note.priority || 'low');
      setReminders(note.reminders || {});
      
      // Set additional fields
      setAccessDetails(note.accessDetails || '');
      setMedicalBackground(note.medicalBackground || '');
      setMedicationList(note.medicationList || '');
      setSupportRequired(note.supportRequired || '');
      setLpaHealth(note.lpaHealth || '');
      setLpaFinance(note.lpaFinance || '');
      setKeyWorker(note.keyWorker || '');
      setGender(note.gender || '');
      setEthnicity(note.ethnicity || '');
      setInitialAssessment(note.initialAssessment || '');
      setCarePlanApproval(note.carePlanApproval || '');
      
      // Reset errors
      setServiceUserError(false);
      setFirstVisitDateError(false);
      setAssessorError(false);
      setShowReminders(note.category === 'Initial Assessment' && note.status === 'high');
      setFormError('');
      setShowErrorMessage(false);
      
      // Initialize ramp values from note
      const initialRampValues: {[key: string]: string} = {};
      defaultRampFields.forEach(field => {
        const fieldId = field.id as keyof typeof note;
        initialRampValues[field.id] = note[fieldId] as string || '';
      });
      setRampValues(initialRampValues);
      
      // Initialize ramp fields with custom titles if available
      setRampFields(
        defaultRampFields.map(field => ({
          ...field,
          title: note.rampFieldTitles?.[field.id] || field.title
        }))
      );
      
      // Reset ramp errors
      const initialRampErrors: {[key: string]: boolean} = {};
      defaultRampFields.forEach(field => {
        initialRampErrors[field.id] = false;
      });
      setRampErrors(initialRampErrors);
      
      // Reset editing title id
      setEditingTitleId(null);
      
      setNoteChanged(false);
      
      // Initialize custom ramp fields if available
      setCustomRampFields(note.customRampFields || []);
    }
  }, [isOpen, note]);

  // Function to calculate reminder dates based on the current date
  const calculateReminderDates = (baseDate: Date) => {
    return {
      registeredManagerDate: addWeeks(baseDate, 2).toISOString(), // 2 weeks after
      threeMonthReviewDate: addMonths(baseDate, 3).toISOString(), // 3 months after
      sixMonthReviewDate: addMonths(baseDate, 6).toISOString(),   // 6 months after
    };
  };

  // Function to create follow-up assessment reminders
  const createFollowUpReminders = async (serviceUserName: string) => {
    const now = new Date();
    const reminderDates = calculateReminderDates(now);
    
    try {
      // Create reminder for Registered Manager Introduction
      await addDocument('notes', {
        text: `Scheduled follow-up for ${serviceUserName}`,
        timestamp: reminderDates.registeredManagerDate,
        serviceUser: serviceUserName,
        firstVisitDate: firstVisitDate,
        category: 'Registered Manager Introduction',
        status: 'low', // Care No longer needed
        priority: 'medium',
        isReminder: true,
        dueDate: reminderDates.registeredManagerDate,
      });

      // Create reminder for 3-month review
      await addDocument('notes', {
        text: `3-month review for ${serviceUserName}`,
        timestamp: reminderDates.threeMonthReviewDate,
        serviceUser: serviceUserName,
        firstVisitDate: firstVisitDate,
        category: '3-month review',
        status: 'low', // Care No longer needed
        priority: 'medium',
        isReminder: true,
        dueDate: reminderDates.threeMonthReviewDate,
      });

      // Create reminder for 6-month review
      await addDocument('notes', {
        text: `6-month review for ${serviceUserName}`,
        timestamp: reminderDates.sixMonthReviewDate,
        serviceUser: serviceUserName,
        firstVisitDate: firstVisitDate,
        category: '6-month review',
        status: 'low', // Care No longer needed
        priority: 'medium',
        isReminder: true,
        dueDate: reminderDates.sixMonthReviewDate,
      });

      return reminderDates;
    } catch (error) {
      console.error('Error creating reminder assessments:', error);
      throw error;
    }
  };

  const handleRampValueChange = (fieldId: string, value: string) => {
    setRampValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error when user types
    if (rampErrors[fieldId]) {
      setRampErrors(prev => ({
        ...prev,
        [fieldId]: false
      }));
    }
    
    // Mark that the note has changed
    setNoteChanged(true);
  };
  
  const handleRampTitleChange = (fieldId: string, newTitle: string) => {
    setRampFields(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, title: newTitle } : field
      )
    );
    
    // Mark that the note has changed
    setNoteChanged(true);
  };

  const handleCustomRampValueChange = (fieldId: string, value: string) => {
    setCustomRampFields(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, value } : field
      )
    );
    
    // Mark that the note has changed
    setNoteChanged(true);
  };
  
  const handleCustomRampTitleChange = (fieldId: string, title: string) => {
    setCustomRampFields(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, title } : field
      )
    );
    
    // Mark that the note has changed
    setNoteChanged(true);
  };

  const removeCustomRampField = (fieldId: string) => {
    setCustomRampFields(prev => prev.filter(field => field.id !== fieldId));
    
    // Mark that the note has changed
    setNoteChanged(true);
  };

  const addCustomRampField = () => {
    const newId = `custom-ramp-${Date.now()}`;
    const newField = {
      id: newId,
      title: `Custom Field ${customRampFields.length + 1}`,
      value: ''
    };
    
    setCustomRampFields(prev => [...prev, newField]);
    
    // Mark that the note has changed
    setNoteChanged(true);
  };

  const validateForm = () => {
    let isValid = true;
    let missingFields: string[] = [];
    
    // Check service user
    if (!serviceUser.trim()) {
      setServiceUserError(true);
      isValid = false;
      missingFields.push('Service User');
    }
    
    // Check first visit date
    if (!firstVisitDate) {
      setFirstVisitDateError(true);
      isValid = false;
      missingFields.push('First Visit Date');
    }
    
    // Check assessor
    if (!assessor.trim()) {
      setAssessorError(true);
      isValid = false;
      missingFields.push('Assessor');
    }
    
    // Check all ramp fields
    const newRampErrors: {[key: string]: boolean} = {};
    rampFields.forEach(field => {
      if (!rampValues[field.id]?.trim()) {
        newRampErrors[field.id] = true;
        isValid = false;
        missingFields.push(field.title);
      } else {
        newRampErrors[field.id] = false;
      }
    });
    
    // Custom ramp fields are not required, so we don't validate them
    
    setRampErrors(newRampErrors);
    
    // Set error message if there are missing fields
    if (missingFields.length > 0) {
      const fieldCount = missingFields.length;
      setFormError(`${fieldCount} required ${fieldCount === 1 ? 'field is' : 'fields are'} missing`);
      setShowErrorMessage(true);
      
      // Scroll to the top of the form to show the error message
      const modalElement = document.querySelector('.modal-container');
      if (modalElement) {
        modalElement.scrollTop = 0;
      }
    }
    
    return isValid;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setFormError('');
      setShowErrorMessage(false);
      
      // Create data object
      const updatedData: any = {
        text: text.trim(),
        serviceUser: serviceUser.trim(),
        firstVisitDate: firstVisitDate,
        assessor: assessor.trim(),
        status,
        category,
        priority,
        // Additional fields
        accessDetails,
        medicalBackground,
        medicationList,
        supportRequired,
        lpaHealth,
        lpaFinance,
        keyWorker,
        gender,
        ethnicity,
        initialAssessment,
        carePlanApproval,
        // Preserve the userId
        userId: note.userId || '',
      };
      
      // Add ramp values
      rampFields.forEach(field => {
        updatedData[field.id] = rampValues[field.id] || '';
      });
      
      // Add custom ramp field titles
      const customTitles: { [key: string]: string } = {};
      rampFields.forEach(field => {
        const defaultField = defaultRampFields.find(df => df.id === field.id);
        if (defaultField && field.title !== defaultField.title) {
          customTitles[field.id] = field.title;
        }
      });
      
      if (Object.keys(customTitles).length > 0) {
        updatedData.rampFieldTitles = customTitles;
      }
      
      // Add custom ramp fields if any exist
      if (customRampFields.length > 0) {
        updatedData.customRampFields = customRampFields;
      }
      
      console.log("Saving data");
      
      // Save to Firebase
      await updateDocument('notes', note.id, updatedData);
      console.log("Document saved successfully");
      
      // Call onSave and close the modal
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
      setFormError("Failed to save changes. Please try again.");
      setShowErrorMessage(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Function to handle AI-generated content
  const handleAiSuggestion = (content: string) => {
    // Set the AI-generated content to the initialAssessment field
    setInitialAssessment(content);
  };

  // Display only the title based on readOnly mode
  const modalTitle = readOnly ? "View Assessment" : "Edit Assessment";

  if (!isOpen) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center overflow-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-blue-500" />
                  {readOnly ? 'View Assessment' : 'Edit Assessment'}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formError && showErrorMessage && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  {formError}
                </div>
              )}

              <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex -mb-px">
                  <button
                    className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                      activeTab === 'basic'
                        ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab('basic')}
                  >
                    Basic Info
                  </button>
                  <button
                    className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                      activeTab === 'ramp'
                        ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab('ramp')}
                  >
                    RAMP Assessment
                  </button>
                  <button
                    className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                      activeTab === 'additional'
                        ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab('additional')}
                  >
                    Additional Info
                  </button>
                </div>
              </div>

              {/* AI care assistant info box */}
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5 text-blue-500">
                    <svg 
                      className="h-6 w-6" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth={2}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" 
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">AI Care Assistant</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      Chat with our AI assistant for help with assessments, drafting care plans, or answering questions about care guidelines.
                    </p>
                    {!readOnly && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setShowAiChat(true)}
                          className="inline-flex items-center px-3 py-1.5 border border-blue-700 text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Open AI Assistant
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}>
                <div className="space-y-6">
                  {/* Basic Info Tab */}
                  {activeTab === 'basic' && (
                    <div>
                      {/* Status Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Status
                        </label>
                        <div className="flex gap-2">
                          {statusColors.map((statusOption) => (
                            <button
                              key={statusOption.value}
                              type="button"
                              onClick={() => {
                                if (!readOnly) {
                                  setStatus(statusOption.value);
                                  if (category === 'Initial Assessment' && statusOption.value === 'high') {
                                    setShowReminders(true);
                                  }
                                }
                              }}
                              className={`px-3 py-1.5 rounded-md border ${
                                status === statusOption.value ? 'ring-2 ring-blue-500' : ''
                              } ${statusOption.color} ${readOnly ? 'opacity-80 cursor-default' : ''}`}
                              disabled={readOnly}
                            >
                              {statusOption.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Priority Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Priority
                        </label>
                        <div className="flex gap-2">
                          {priorityLevels.map((lvl) => (
                            <button
                              key={lvl.value}
                              type="button"
                              onClick={() => {
                                if (!readOnly) {
                                  setPriority(lvl.value);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-md border ${
                                priority === lvl.value ? 'ring-2 ring-blue-500' : ''
                              } ${lvl.color} ${readOnly ? 'opacity-80 cursor-default' : ''}`}
                              disabled={readOnly}
                            >
                              {lvl.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Service User name field */}
                      <div>
                        <label htmlFor="service-user" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Service User <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="service-user"
                          type="text"
                          value={serviceUser}
                          onChange={(e) => {
                            setServiceUser(e.target.value);
                            if (e.target.value.trim()) {
                              setServiceUserError(false);
                            }
                          }}
                          disabled={readOnly}
                          className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            serviceUserError ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                          } ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'dark:bg-gray-700 dark:text-white'}`}
                          placeholder="Enter service user name"
                        />
                        {serviceUserError && (
                          <p className="mt-1 text-sm text-red-600">Service user name is required</p>
                        )}
                      </div>
                      
                      {/* First Visit Date field */}
                      <div className="mt-4">
                        <label htmlFor="first-visit-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          First Visit Date <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="first-visit-date"
                          type="date"
                          value={firstVisitDate}
                          onChange={(e) => {
                            setFirstVisitDate(e.target.value);
                            if (e.target.value) {
                              setFirstVisitDateError(false);
                            }
                          }}
                          disabled={readOnly}
                          className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            firstVisitDateError ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                          } ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'dark:bg-gray-700 dark:text-white'}`}
                        />
                        {firstVisitDateError && (
                          <p className="mt-1 text-sm text-red-600">First visit date is required</p>
                        )}
                      </div>
                      
                      {/* Assessor field */}
                      <div className="mt-4">
                        <label htmlFor="assessor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Assessor <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="assessor"
                          type="text"
                          value={assessor}
                          onChange={(e) => {
                            setAssessor(e.target.value);
                            if (e.target.value.trim()) {
                              setAssessorError(false);
                            }
                          }}
                          disabled={readOnly}
                          className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            assessorError ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                          } ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'dark:bg-gray-700 dark:text-white'}`}
                          placeholder="Enter assessor name"
                        />
                        {assessorError && (
                          <p className="mt-1 text-sm text-red-600">Assessor name is required</p>
                        )}
                      </div>
                      
                      {/* Category Selection */}
                      <div className="mt-4">
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Category
                        </label>
                        <select
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          disabled={readOnly}
                          className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${readOnly ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'dark:bg-gray-700 dark:text-white'}`}
                        >
                          {noteCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Initial Assessment Content */}
                      <div className="mt-4">
                        <label htmlFor="initial-assessment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Social Worker Initial Assessment
                        </label>
                        <div className="relative">
                          <textarea
                            id="initial-assessment"
                            value={initialAssessment}
                            onChange={(e) => setInitialAssessment(e.target.value)}
                            disabled={readOnly}
                            className={`w-full h-32 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
                            placeholder="Enter assessment details..."
                          />
                        </div>
                      </div>
                      
                      {/* Assessment Notes */}
                      <div className="mt-4">
                        <label htmlFor="assessment-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Assessment Notes
                        </label>
                        <textarea
                          id="assessment-notes"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          disabled={readOnly}
                          className={`w-full h-32 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
                          placeholder="Enter assessment notes..."
                        />
                      </div>
                      
                      {/* Reminders information - shown when Initial Assessment is marked completed */}
                      {category === 'Initial Assessment' && status === 'high' && (
                        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                          <div className="flex items-start">
                            <Calendar className="text-blue-500 mr-2 mt-0.5" size={18} />
                            <div>
                              <h3 className="font-medium text-blue-800">Automatic Reminders</h3>
                              <p className="text-sm text-blue-700 mb-2">
                                When you save this completed Initial Assessment, the following follow-up assessments will be automatically scheduled:
                              </p>
                              <ul className="text-sm text-blue-700 pl-5 list-disc">
                                <li>Registered Manager Introduction - in 2 weeks</li>
                                <li>3-month review - in 3 months</li>
                                <li>6-month review - in 6 months</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* RAMP Fields Section */}
                  {activeTab === 'ramp' && (
                    <div className="border-t pt-4 mt-2">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">RAMP Assessment Fields</h3>
                      
                      <div className="space-y-4">
                        {rampFields.map((field) => (
                          <div key={field.id}>
                            <div className="flex items-center mb-1">
                              {editingTitleId === field.id && !readOnly ? (
                                <input
                                  type="text"
                                  value={field.title}
                                  onChange={(e) => handleRampTitleChange(field.id, e.target.value)}
                                  onBlur={() => setEditingTitleId(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setEditingTitleId(null);
                                    }
                                  }}
                                  autoFocus
                                  className="text-sm font-medium text-gray-700 dark:text-white border border-blue-500 rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
                                />
                              ) : (
                                <label 
                                  htmlFor={field.id} 
                                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex-grow"
                                  onClick={() => !readOnly && setEditingTitleId(field.id)}
                                >
                                  {field.title} <span className="text-red-600">*</span>
                                </label>
                              )}
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={() => setEditingTitleId(field.id)}
                                  className="text-blue-600 hover:text-blue-800 ml-2 text-xs"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                            <textarea
                              id={field.id}
                              value={rampValues[field.id] || ''}
                              onChange={(e) => handleRampValueChange(field.id, e.target.value)}
                              disabled={readOnly}
                              className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] ${
                                rampErrors[field.id] ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                              } ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'dark:bg-gray-700 dark:text-white'}`}
                              placeholder={`Enter details for ${field.title}...`}
                            />
                            {rampErrors[field.id] && (
                              <p className="mt-1 text-sm text-red-600">{field.title} is required</p>
                            )}
                          </div>
                        ))}
                        
                        {/* Custom RAMP Fields */}
                        {customRampFields.map((field) => (
                          <div key={field.id} className="mt-4">
                            <div className="flex items-center mb-1">
                              {editingTitleId === field.id && !readOnly ? (
                                <input
                                  type="text"
                                  value={field.title}
                                  onChange={(e) => handleCustomRampTitleChange(field.id, e.target.value)}
                                  onBlur={() => setEditingTitleId(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setEditingTitleId(null);
                                    }
                                  }}
                                  autoFocus
                                  className="text-sm font-medium text-gray-700 dark:text-white border border-blue-500 rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
                                />
                              ) : (
                                <label 
                                  htmlFor={field.id} 
                                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex-grow"
                                  onClick={() => !readOnly && setEditingTitleId(field.id)}
                                >
                                  {field.title}
                                </label>
                              )}
                              {!readOnly && (
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingTitleId(field.id)}
                                    className="text-blue-600 hover:text-blue-800 ml-2 text-xs"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeCustomRampField(field.id)}
                                    className="text-red-600 hover:text-red-800 ml-2 text-xs"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                            <textarea
                              id={field.id}
                              value={field.value}
                              onChange={(e) => handleCustomRampValueChange(field.id, e.target.value)}
                              disabled={readOnly}
                              className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'dark:bg-gray-700 dark:text-white'}`}
                              placeholder={`Enter details for ${field.title}...`}
                            />
                          </div>
                        ))}
                        
                        {/* Add New Field Button */}
                        {!readOnly && (
                          <div className="pt-4 mt-2">
                            <button
                              type="button"
                              onClick={addCustomRampField}
                              className="flex items-center justify-center w-full p-2 border border-dashed border-gray-300 rounded-md text-blue-600 hover:text-blue-800 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="mr-2"
                              >
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                              Add New RAMP Field
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Information Section */}
                  {activeTab === 'additional' && (
                    <div className="border-t pt-4 mt-2">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Additional Information</h3>
                      
                      <div className="space-y-4">
                        {/* Access Details */}
                        <div>
                          <label htmlFor="access-details" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Access Details (Including key Safe)
                          </label>
                          <textarea
                            id="access-details"
                            value={accessDetails}
                            onChange={(e) => setAccessDetails(e.target.value)}
                            disabled={readOnly}
                            className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
                            placeholder="Enter access details including key safe information..."
                          />
                        </div>
                        
                        {/* Medical Background */}
                        <div>
                          <label htmlFor="medical-background" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Outline Medical Background
                          </label>
                          <textarea
                            id="medical-background"
                            value={medicalBackground}
                            onChange={(e) => setMedicalBackground(e.target.value)}
                            disabled={readOnly}
                            className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
                            placeholder="Enter medical background information..."
                          />
                        </div>
                        
                        {/* Current Medication List */}
                        <div>
                          <label htmlFor="medication-list" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Current Medication List
                          </label>
                          <textarea
                            id="medication-list"
                            value={medicationList}
                            onChange={(e) => setMedicationList(e.target.value)}
                            disabled={readOnly}
                            className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
                            placeholder="Enter current medications..."
                          />
                        </div>
                        
                        {/* Support Required */}
                        <div>
                          <label htmlFor="support-required" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Support Required
                          </label>
                          <textarea
                            id="support-required"
                            value={supportRequired}
                            onChange={(e) => setSupportRequired(e.target.value)}
                            disabled={readOnly}
                            className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
                            placeholder="Enter details about required support..."
                          />
                        </div>
                        
                        {/* LPA Health */}
                        <div>
                          <label htmlFor="lpa-health" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            LPA Health
                          </label>
                          <textarea
                            id="lpa-health"
                            value={lpaHealth}
                            onChange={(e) => setLpaHealth(e.target.value)}
                            disabled={readOnly}
                            className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
                            placeholder="Enter LPA Health information..."
                          />
                        </div>
                        
                        {/* LPA Finance */}
                        <div>
                          <label htmlFor="lpa-finance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            LPA Finance
                          </label>
                          <textarea
                            id="lpa-finance"
                            value={lpaFinance}
                            onChange={(e) => setLpaFinance(e.target.value)}
                            disabled={readOnly}
                            className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
                            placeholder="Enter LPA Finance information..."
                          />
                        </div>
                        
                        {/* Key Worker / Project Manager */}
                        <div>
                          <label htmlFor="key-worker" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Key Worker/Project Manager
                          </label>
                          <textarea
                            id="key-worker"
                            value={keyWorker}
                            onChange={(e) => setKeyWorker(e.target.value)}
                            disabled={readOnly}
                            className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
                            placeholder="Enter Key Worker information..."
                          />
                        </div>
                        
                        {/* Gender */}
                        <div>
                          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Gender
                          </label>
                          <input
                            id="gender"
                            type="text"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            disabled={readOnly}
                            className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
                            placeholder="Enter gender information"
                          />
                        </div>
                        
                        {/* Ethnicity */}
                        <div>
                          <label htmlFor="ethnicity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Ethnicity
                          </label>
                          <input
                            id="ethnicity"
                            type="text"
                            value={ethnicity}
                            onChange={(e) => setEthnicity(e.target.value)}
                            disabled={readOnly}
                            className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
                            placeholder="Enter ethnicity information"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Footer buttons */}
                <div className="mt-8 flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <div className="flex space-x-3">
                    {!readOnly && (
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="-ml-1 mr-2 h-4 w-4" />
                            <span>Save Assessment</span>
                          </>
                        )}
                      </button>
                    )}
                    <DownloadAssessmentPdf note={note} />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Modal */}
      {showAiChat && (
        <AiChatModal 
          isOpen={showAiChat} 
          onClose={() => setShowAiChat(false)} 
          onSuggestion={handleAiSuggestion}
          context={{
            status,
            category,
            serviceUser,
            initialAssessment
          }}
        />
      )}
    </>
  );
} 