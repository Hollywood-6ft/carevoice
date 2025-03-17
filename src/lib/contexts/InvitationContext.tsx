'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getDocuments, addDocument } from '@/lib/firebase/firebaseUtils';

interface Invitation {
  id: string;
  inviterId: string;
  inviterEmail: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt?: string;
}

interface InvitationContextType {
  pendingInvitations: Invitation[];
  hasNewInvitations: boolean;
  fetchInvitations: () => Promise<void>;
  markInvitationsAsRead: () => void;
}

const InvitationContext = createContext<InvitationContextType>({
  pendingInvitations: [],
  hasNewInvitations: false,
  fetchInvitations: async () => {},
  markInvitationsAsRead: () => {},
});

export const useInvitations = () => useContext(InvitationContext);

export function InvitationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [lastCheckedTime, setLastCheckedTime] = useState<number>(0);
  const [hasNewInvitations, setHasNewInvitations] = useState(false);

  // Function to create a test invitation (for debugging)
  const createTestInvitation = async () => {
    if (!user) return;
    
    console.log('Creating test invitation for debugging');
    
    try {
      // Check if user already has pending invitations
      const allInvitations = await getDocuments('invitations');
      const existingPending = allInvitations.filter(
        (inv: Invitation) => 
          inv.inviteeEmail === user.email && 
          inv.status === 'pending'
      );
      
      // Only create a test invitation if no pending invitations exist
      if (existingPending.length === 0) {
        const testInvitation = {
          inviterId: 'test-user-id',
          inviterEmail: 'test.user@example.com',
          inviteeEmail: user.email,
          status: 'pending',
          accessLevel: 'view',
          createdAt: new Date().toISOString(),
        };
        
        await addDocument('invitations', testInvitation);
        console.log('Test invitation created successfully');
        
        // Refresh invitations
        fetchInvitations();
      } else {
        console.log('User already has pending invitations, not creating test invitation');
      }
    } catch (error) {
      console.error('Error creating test invitation:', error);
    }
  };

  const fetchInvitations = async () => {
    if (!user) {
      console.log('No user logged in, skipping invitation fetch');
      setPendingInvitations([]);
      return;
    }
    
    console.log('Fetching invitations for user:', user.email);
    
    try {
      const allInvitations = await getDocuments('invitations');
      console.log('All invitations:', allInvitations);
      
      // Filter received invitations that are pending
      const pending = allInvitations.filter(
        (inv: Invitation) => 
          inv.inviteeEmail === user.email && 
          inv.status === 'pending'
      );
      
      console.log('Pending invitations for current user:', pending);
      setPendingInvitations(pending);
      
      // Check if there are new invitations since last checked
      const hasNew = pending.some(inv => {
        const createdTime = new Date(inv.createdAt).getTime();
        return createdTime > lastCheckedTime;
      });
      
      setHasNewInvitations(hasNew);
      console.log('Has new invitations:', hasNew);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };
  
  const markInvitationsAsRead = () => {
    console.log('Marking invitations as read');
    setLastCheckedTime(Date.now());
    setHasNewInvitations(false);
    
    // Also refresh invitations to ensure we have the latest data
    // This is important especially if the invitations were acted upon in another part of the app
    fetchInvitations();
  };

  // Fetch invitations when user changes or on first load
  useEffect(() => {
    console.log('InvitationProvider useEffect triggered, user:', user?.email);
    fetchInvitations();
    
    // Create a test invitation after 3 seconds (only in development)
    if (process.env.NODE_ENV === 'development') {
      const timeoutId = setTimeout(() => {
        createTestInvitation();
      }, 3000);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
    
    // Poll for new invitations every minute
    const intervalId = setInterval(() => {
      console.log('Polling for new invitations');
      fetchInvitations();
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [user]);

  return (
    <InvitationContext.Provider 
      value={{ 
        pendingInvitations,
        hasNewInvitations,
        fetchInvitations,
        markInvitationsAsRead
      }}
    >
      {children}
    </InvitationContext.Provider>
  );
} 