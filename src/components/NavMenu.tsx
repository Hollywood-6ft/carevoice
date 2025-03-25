'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useInvitations } from '@/lib/contexts/InvitationContext';
import { useTheme } from '@/lib/contexts/ThemeContext';

export default function NavMenu() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, signOut } = useAuth();
  const { pendingInvitations } = useInvitations();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  
  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [router]);
  
  // Close mobile menu when escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMobileMenu(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);
  
  // Prevent scrolling when mobile menu is open
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
  
  const getFirstName = () => {
    if (!user || !user.displayName) return 'User';
    return user.displayName.split(' ')[0];
  };
  
  const handleNotificationClick = () => {
    if (pendingInvitations.length > 0) {
      router.push('/?tab=manageInvitations');
    }
  };
  
  return (
    <>
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed w-full top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo and site name */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">CareVoice</span>
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* User Profile / Login Section */}
              {user && (
                <div className="flex items-center space-x-3">
                  {/* Theme Toggle Button */}
                  <button
                    onClick={toggleTheme}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  >
                    {theme === 'light' ? (
                      <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    ) : (
                      <Sun className="h-5 w-5 text-gray-300" />
                    )}
                  </button>
                  
                  {/* Notification Bell */}
                  <button
                    onClick={handleNotificationClick}
                    className="relative p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                      onClick={signOut}
                      className="text-base text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Sign Out
                    </button>
                  </div>
                  
                  {/* Mobile menu button */}
                  <button
                    onClick={toggleMobileMenu}
                    className="md:hidden ml-2 inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label="Toggle mobile menu"
                  >
                    {showMobileMenu ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu with overlay */}
      {showMobileMenu && (
        <>
          {/* Dark overlay behind the menu */}
          <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30"
            onClick={() => setShowMobileMenu(false)}
            aria-hidden="true"
          />
          
          {/* Mobile menu content */}
          <div className="md:hidden fixed top-16 left-0 right-0 z-30 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 max-h-[calc(100vh-4rem)] overflow-y-auto">
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
                className="block py-2.5 text-base font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Dashboard
              </Link>
              
              {/* Theme toggle for mobile */}
              <button
                onClick={toggleTheme}
                className="flex items-center w-full py-2.5 text-base font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-300" />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-5 w-5 mr-2 text-gray-300" />
                    <span>Light Mode</span>
                  </>
                )}
              </button>
              
              {/* Notifications for mobile */}
              {user && (
                <>
                  <button
                    onClick={handleNotificationClick}
                    className="flex items-center w-full py-2.5 text-base font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    <Bell className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-300" />
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