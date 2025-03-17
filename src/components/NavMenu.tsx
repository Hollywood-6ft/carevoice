'use client';

import Link from 'next/link';
import { useAuth } from '../lib/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import SignInWithGoogle from './SignInWithGoogle';
import { useInvitations } from '@/lib/contexts/InvitationContext';
import { useRouter } from 'next/navigation';

export default function NavMenu() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, signOut } = useAuth();
  const { pendingInvitations, markInvitationsAsRead } = useInvitations();
  const router = useRouter();
  
  // Log pending invitations for debugging
  useEffect(() => {
    if (user) {
      console.log('NavMenu: User is logged in:', user.email);
      console.log('NavMenu: Pending invitations:', pendingInvitations);
    }
  }, [user, pendingInvitations]);
  
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // Get first name from display name or email
  const getFirstName = () => {
    if (user?.displayName) {
      return user.displayName.split(' ')[0];
    } else if (user?.email) {
      // If no display name, just return "Guest" instead of showing email
      return "Guest";
    }
    return 'Guest';
  };
  
  // Handle click on notification icon
  const handleNotificationClick = () => {
    console.log('Notification clicked, navigating to manage invitations tab');
    
    // First fetch the latest invitations to ensure we have up-to-date data
    if (pendingInvitations.length > 0) {
      markInvitationsAsRead();
    }
    
    router.push('/?tab=manageInvitations');
  };

  return (
    <nav className="bg-white shadow z-10 fixed w-full top-0">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                CareVoice Assistant
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            {/* User Profile / Login Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  {/* Notification Bell - Always show it */}
                  <button
                    onClick={handleNotificationClick}
                    className="relative p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={pendingInvitations.length > 0 ? `${pendingInvitations.length} pending invitations` : "No pending invitations"}
                  >
                    <Bell className="h-5 w-5 text-gray-600" />
                    {pendingInvitations.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {pendingInvitations.length}
                      </span>
                    )}
                  </button>
                  
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Hi {getFirstName()}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <SignInWithGoogle />
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden ml-2">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className={`${showMobileMenu ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${showMobileMenu ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
              Dashboard
            </Link>
            
            {/* Notifications for mobile */}
            {user && (
              <button
                onClick={handleNotificationClick}
                className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                <Bell className="h-5 w-5 mr-2 text-gray-600" />
                <span>
                  {pendingInvitations.length > 0 
                    ? `Pending Invitations (${pendingInvitations.length})` 
                    : "No Pending Invitations"}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 