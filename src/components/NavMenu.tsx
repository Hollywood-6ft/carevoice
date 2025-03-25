'use client';

import Link from 'next/link';
import { useAuth } from '../lib/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Bell, Menu, X } from 'lucide-react';
// Removing the SignInWithGoogle import as we don't want to show it in the navbar
// import SignInWithGoogle from './SignInWithGoogle';
import { useInvitations } from '@/lib/contexts/InvitationContext';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileMenu]);
  
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
    // Close mobile menu if open
    if (showMobileMenu) {
      setShowMobileMenu(false);
    }
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 shadow z-20 fixed w-full top-0 transition-colors duration-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                  CareVoice
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle - Always visible on desktop */}
              <div className="hidden md:block">
                <ThemeToggle />
              </div>

              {/* User Profile / Login Section */}
              <div className="flex items-center">
                {user ? (
                  <div className="flex items-center space-x-3">
                    {/* Notification Bell */}
                    <button
                      onClick={handleNotificationClick}
                      className="relative p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label={pendingInvitations.length > 0 ? `${pendingInvitations.length} pending invitations` : "No pending invitations"}
                    >
                      <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      {pendingInvitations.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {pendingInvitations.length}
                        </span>
                      )}
                    </button>
                    
                    {/* User name and sign out button - always visible on desktop */}
                    <div className="hidden md:flex items-center space-x-3">
                      <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                        Hi {getFirstName()}
                      </span>
                      <button
                        onClick={() => signOut()}
                        className="text-base text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Sign Out
                      </button>
                    </div>
                    
                    {/* Mobile menu button - only visible on mobile */}
                    <button
                      onClick={toggleMobileMenu}
                      className="md:hidden ml-2 inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      aria-label="Toggle mobile menu"
                    >
                      {showMobileMenu ? (
                        <X className="h-6 w-6" />
                      ) : (
                        <Menu className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu with overlay */}
      {showMobileMenu && (
        <>
          {/* Dark overlay behind the menu */}
          <div 
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowMobileMenu(false)}
            aria-hidden="true"
          />
          
          {/* Mobile menu content */}
          <div className="md:hidden fixed top-16 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 pt-3 pb-4 space-y-3">
              {user && (
                <div className="flex items-center pb-2 mb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                    Hi {getFirstName()}
                  </span>
                </div>
              )}
              
              <Link href="/" 
                onClick={() => setShowMobileMenu(false)}
                className="block py-2.5 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Dashboard
              </Link>
              
              {/* Theme toggle for mobile */}
              <div className="py-2.5 md:hidden">
                <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</p>
                <ThemeToggle />
              </div>
              
              {/* Notifications for mobile */}
              {user && (
                <>
                  <button
                    onClick={handleNotificationClick}
                    className="flex items-center w-full py-2.5 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <Bell className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
                    <span>
                      {pendingInvitations.length > 0 
                        ? `Pending Invitations (${pendingInvitations.length})` 
                        : "No Pending Invitations"}
                    </span>
                  </button>
                  
                  {/* Sign out button for mobile */}
                  <button
                    onClick={() => {
                      signOut();
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left py-2.5 text-base font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
} 