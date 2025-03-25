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
  
  const handleClearDeclinedInvitations = async () => {
    if (!user) return;
    
    try {
      // Filter for declined invitations only
      const declinedInvitations = receivedInvitations.filter(
        (inv) => inv.status === 'declined'
      );
      
      if (declinedInvitations.length === 0) {
        setError('No declined invitations to clear.');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      // Delete each declined invitation
      const deletePromises = declinedInvitations.map(invitation => 
        deleteDocument('invitations', invitation.id)
      );
      
      await Promise.all(deletePromises);
      
      // Refresh local component state
      await fetchInvitations();
      
      // Also refresh the global invitations context
      await refreshInvitationsContext();
      
      setSuccessMessage(`Cleared ${declinedInvitations.length} declined invitation(s) successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error clearing declined invitations:', error);
      setError('Failed to clear declined invitations. Please try again.');
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Manage Board Access</h2>
      
      {/* Error and success messages */}
      {error && (
        <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 text-green-800 p-3 rounded-md mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Send invitation form */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Invite a Manager to View Your Board</h3>
        <form onSubmit={handleSendInvitation} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={newInviteeEmail}
            onChange={(e) => setNewInviteeEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-grow rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div>
            <label htmlFor="accessLevel" className="block text-sm font-medium text-gray-700">
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
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">View Only</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="accessLevel"
                  value="edit"
                  checked={accessLevel === 'edit'}
                  onChange={() => setAccessLevel('edit')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Edit Access</span>
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>
      
      {/* Sent invitations */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Invitations You&apos;ve Sent</h3>
        {sentInvitations.length === 0 ? (
          <p className="text-gray-500 italic">You haven&apos;t sent any invitations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sentInvitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invitation.inviteeEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invitation.accessLevel === 'edit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'}`}
                      >
                        {invitation.accessLevel === 'edit' ? 'Can Edit' : 'View Only'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          invitation.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-900"
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
        <h3 className="text-lg font-medium text-gray-700 mb-3">Invitations You&apos;ve Received</h3>
        {receivedInvitations.length === 0 ? (
          <p className="text-gray-500 italic">You haven&apos;t received any invitations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            {/* Clear declined invitations button */}
            {receivedInvitations.some(inv => inv.status === 'declined') && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleClearDeclinedInvitations}
                  className="bg-red-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  Clear Declined Invitations
                </button>
              </div>
            )}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Received
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receivedInvitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invitation.inviterEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invitation.accessLevel === 'edit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'}`}
                      >
                        {invitation.accessLevel === 'edit' ? 'Can Edit' : 'View Only'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          invitation.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {invitation.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRespondToInvitation(invitation.id, 'accepted')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespondToInvitation(invitation.id, 'declined')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">
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