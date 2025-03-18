'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  addDocument, 
  getDocuments, 
  updateDocument, 
  deleteDocument 
} from '@/lib/firebase/firebaseUtils';
import LoadingSpinner from './LoadingSpinner';
import { useInvitations } from '@/lib/contexts/InvitationContext';

interface Invitation {
  id: string;
  inviterId: string;
  inviterEmail: string;
  inviteeEmail: string;
  accessLevel: 'view' | 'edit';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt?: string;
}

const InvitationManager = () => {
  const { user } = useAuth();
  const { fetchInvitations: refreshInvitationsContext } = useInvitations();
  const [loading, setLoading] = useState(true);
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
  const [newInviteeEmail, setNewInviteeEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit'>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch invitations when component loads
  useEffect(() => {
    if (user) {
      fetchInvitations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchInvitations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const allInvitations = await getDocuments('invitations');
      
      // Filter sent invitations (where user is inviter)
      const sent = allInvitations.filter(
        (inv: Invitation) => inv.inviterId === user.uid
      );
      
      // Filter received invitations (where user's email matches invitee email)
      const received = allInvitations.filter(
        (inv: Invitation) => inv.inviteeEmail === user.email
      );
      
      // If any existing invitations don't have an accessLevel, assume view-only
      const processedSent = sent.map((inv: any) => ({
        ...inv,
        accessLevel: inv.accessLevel || 'view'
      }));
      
      setSentInvitations(processedSent);
      setReceivedInvitations(received);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setError('Failed to load invitations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be signed in to send invitations');
      return;
    }
    
    if (!newInviteeEmail) {
      setError('Please enter an email address');
      return;
    }
    
    // Check if user is trying to invite themselves
    if (newInviteeEmail === user.email) {
      setError('You cannot invite yourself');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // Check if invitation already exists
      const existingInvitation = sentInvitations.find(
        inv => inv.inviteeEmail === newInviteeEmail && inv.status === 'pending'
      );
      
      if (existingInvitation) {
        setError('An invitation has already been sent to this email address');
        return;
      }
      
      const newInvitation = {
        inviterId: user.uid,
        inviterEmail: user.email || 'Unknown',
        inviteeEmail: newInviteeEmail,
        accessLevel: accessLevel,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      await addDocument('invitations', newInvitation);
      
      // Reset form and refresh invitations
      setNewInviteeEmail('');
      setAccessLevel('view');
      setSuccessMessage('Invitation sent successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!user) return;
    
    try {
      await deleteDocument('invitations', invitationId);
      
      // Refresh local component state
      await fetchInvitations();
      
      // Also refresh the global invitations context to update the notification badge
      await refreshInvitationsContext();
      
      setSuccessMessage('Invitation deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting invitation:', error);
      setError('Failed to delete invitation. Please try again.');
    }
  };

  const handleRespondToInvitation = async (invitationId: string, status: 'accepted' | 'declined') => {
    if (!user) return;
    
    try {
      await updateDocument('invitations', invitationId, {
        status,
        updatedAt: new Date().toISOString()
      });
      
      // Refresh local component state
      await fetchInvitations();
      
      // Also refresh the global invitations context to update the notification badge
      await refreshInvitationsContext();
      
      setSuccessMessage(`Invitation ${status} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error responding to invitation:', error);
      setError('Failed to respond to invitation. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800">
        Please sign in to manage invitations.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Manage Board Access</h2>
      
      {/* Error and success messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-3 rounded-md mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Send invitation form */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Invite a Manager to View Your Board</h3>
        <form onSubmit={handleSendInvitation} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={newInviteeEmail}
            onChange={(e) => setNewInviteeEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-grow rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
          <div>
            <label htmlFor="accessLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Access Level
            </label>
            <div className="mt-1 space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="accessLevel"
                  value="view"
                  checked={accessLevel === 'view'}
                  onChange={() => setAccessLevel('view')}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">View Only</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="accessLevel"
                  value="edit"
                  checked={accessLevel === 'edit'}
                  onChange={() => setAccessLevel('edit')}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Edit Access</span>
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors disabled:bg-blue-400 dark:disabled:bg-blue-500"
          >
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>
      
      {/* Sent invitations */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Invitations You&apos;ve Sent</h3>
        {sentInvitations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">You haven&apos;t sent any invitations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Access Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sentInvitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {invitation.inviteeEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invitation.accessLevel === 'edit' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'}`}
                      >
                        {invitation.accessLevel === 'edit' ? 'Can Edit' : 'View Only'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invitation.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' : 
                          invitation.status === 'accepted' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 
                          'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteInvitation(invitation.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Received invitations */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Invitations You&apos;ve Received</h3>
        {receivedInvitations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">You haven&apos;t received any invitations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Access Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date Received
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {receivedInvitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {invitation.inviterEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invitation.accessLevel === 'edit' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'}`}
                      >
                        {invitation.accessLevel === 'edit' ? 'Can Edit' : 'View Only'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invitation.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' : 
                          invitation.status === 'accepted' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 
                          'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {invitation.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRespondToInvitation(invitation.id, 'accepted')}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespondToInvitation(invitation.id, 'declined')}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          {invitation.status === 'accepted' ? 'Accepted' : 'Declined'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationManager; 