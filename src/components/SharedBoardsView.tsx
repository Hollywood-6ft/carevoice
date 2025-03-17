'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getDocuments } from '@/lib/firebase/firebaseUtils';
import LoadingSpinner from './LoadingSpinner';
import Link from 'next/link';

interface Invitation {
  id: string;
  inviterId: string;
  inviterEmail: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt?: string;
  displayName?: string;
}

interface User {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
}

interface UserWithComputedName extends User {
  computedName: string;
}

const SharedBoardsView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [acceptedInvitations, setAcceptedInvitations] = useState<Invitation[]>([]);
  const [inviterUsers, setInviterUsers] = useState<Record<string, UserWithComputedName>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchAcceptedInvitations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAcceptedInvitations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get all invitations
      const allInvitations = await getDocuments('invitations');
      
      // Filter invitations where current user is the invitee and status is 'accepted'
      const accepted = allInvitations.filter(
        (inv: Invitation) => 
          inv.inviteeEmail === user.email && 
          inv.status === 'accepted'
      );
      
      console.log('Accepted invitations:', accepted);
      
      // Pre-compute display names for all invitations
      const acceptedWithDisplayNames = accepted.map(invitation => {
        // Extract name from email: "first.last@example.com" → "First Last"
        const emailName = invitation.inviterEmail.split('@')[0];
        let displayName = '';
        
        if (emailName.includes('.')) {
          displayName = emailName.split('.')
            .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        } else {
          displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        }
        
        return {
          ...invitation,
          displayName
        };
      });
      
      setAcceptedInvitations(acceptedWithDisplayNames);
      
      // Get user info for all inviters to display their names
      if (accepted.length > 0) {
        const users = await getDocuments('users');
        const userMap: Record<string, UserWithComputedName> = {};
        
        users.forEach((u: User) => {
          if (u.id) {
            // Create a computed display name for each user
            let computedName = '';
            
            if (u.displayName) {
              computedName = u.displayName;
            } else {
              const emailName = u.email.split('@')[0];
              if (emailName.includes('.')) {
                computedName = emailName.split('.')
                  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(' ');
              } else {
                computedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
              }
            }
            
            userMap[u.id] = { ...u, computedName };
          }
        });
        
        console.log('User data from Firebase:', users);
        console.log('Mapped user data with computed names:', userMap);
        
        setInviterUsers(userMap);
      }
    } catch (error) {
      console.error('Error fetching shared boards:', error);
      setError('Failed to load shared boards. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getInviterName = (invitation: Invitation): string => {
    const inviter = inviterUsers[invitation.inviterId];
    
    // First try to use pre-computed name from user data if available
    if (inviter && inviter.computedName) {
      return inviter.computedName;
    }
    
    // Otherwise use the display name we computed from the invitation
    if (invitation.displayName) {
      return invitation.displayName;
    }
    
    // Last resort: format from email directly
    const emailName = invitation.inviterEmail.split('@')[0];
    if (emailName.includes('.')) {
      return emailName.split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    
    // Very last resort: capitalize the email username
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
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
        Please sign in to view shared boards.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Boards Shared With You</h2>
      
      {error && (
        <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {acceptedInvitations.length === 0 ? (
        <p className="text-gray-500 italic">No boards have been shared with you yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {acceptedInvitations.map((invitation) => {
            // Get formatted name directly from email
            const emailName = invitation.inviterEmail.split('@')[0];
            let formattedName = '';
            
            if (emailName.includes('.')) {
              formattedName = emailName.split('.')
                .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');
            } else {
              formattedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
            }
            
            return (
              <div 
                key={invitation.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start mb-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    {formattedName.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-lg text-gray-900 truncate">
                      {formattedName}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      Shared their board with you
                    </p>
                  </div>
                </div>
                
                <div className="mt-auto">
                  <p className="text-xs text-gray-500 mb-2">
                    Shared on {new Date(invitation.createdAt).toLocaleDateString()}
                  </p>
                  <Link 
                    href={`/shared-board/${invitation.inviterId}`}
                    className="inline-block bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Board
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SharedBoardsView; 