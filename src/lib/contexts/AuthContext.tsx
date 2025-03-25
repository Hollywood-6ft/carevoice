"use client";

import React, { createContext, useEffect, useState, useRef } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, Auth, User as FirebaseUser, updateProfile, getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  // Use a ref to track if we're currently redirecting to avoid multiple redirects
  const isRedirecting = useRef(false);

  // Check for authentication cookie for an initial quick check
  useEffect(() => {
    const authCookie = Cookies.get('auth');
    if (!authCookie) {
      // No auth cookie, we can quickly determine the user is not logged in
      setLoading(false);
    }
    // If there is a cookie, we'll still wait for Firebase auth to confirm
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    try {
      // Only set up the listener if auth is valid
      if (auth && typeof auth.onAuthStateChanged === 'function') {
        unsubscribe = auth.onAuthStateChanged(async (user: FirebaseUser | null) => {
          if (user) {
            // Set auth cookie when user is logged in
            Cookies.set('auth', 'true', { expires: 7 }); // Cookie expires in 7 days
            
            if (!user.displayName && user.email) {
              // Extract a name from the email if possible (firstname.lastname@domain.com format)
              const emailPart = user.email.split('@')[0];
              let displayName = '';
              
              if (emailPart.includes('.')) {
                // Try to format as "Firstname Lastname"
                displayName = emailPart.split('.')
                  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(' ');
              } else {
                // Just capitalize the username part
                displayName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
              }
              
              try {
                await updateProfile(user, { displayName });
              } catch (error) {
                console.error("Error updating profile:", error);
              }
            }
            
            // Redirect to dashboard if on signin page, but avoid duplicating middleware redirects
            if (pathname === '/signin' && !isRedirecting.current) {
              isRedirecting.current = true;
              // Use setTimeout to make this happen after the current execution cycle
              setTimeout(() => {
                router.push('/?dashboard=true');
                // Reset the redirecting flag after a short delay to allow the navigation to complete
                setTimeout(() => {
                  isRedirecting.current = false;
                }, 500);
              }, 0);
            }
          } else {
            // Remove auth cookie when user is logged out
            Cookies.remove('auth');
            
            // Redirect to signin if not already there and not currently redirecting
            if (pathname !== '/signin' && !isRedirecting.current) {
              isRedirecting.current = true;
              // Use setTimeout to make this happen after the current execution cycle
              setTimeout(() => {
                router.push('/signin');
                // Reset the redirecting flag after a short delay to allow the navigation to complete
                setTimeout(() => {
                  isRedirecting.current = false;
                }, 500);
              }, 0);
            }
          }
          
          setUser(user);
          setLoading(false);
        });
      } else {
        // If auth is not properly initialized, just set loading to false
        console.warn('Firebase auth not properly initialized');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      setLoading(false);
    }

    return () => {
      // Check if unsubscribe is a function before calling it
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [pathname, router]);

  const signInWithGoogle = async () => {
    // Prevent multiple sign-in attempts
    if (loading || isRedirecting.current) return;
    
    // Set loading to true when starting the sign-in process
    setLoading(true);
    
    const provider = new GoogleAuthProvider();
    // Request additional scopes
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // If we still don't have a display name, set it from email
      if (!user.displayName && user.email) {
        const emailPart = user.email.split('@')[0];
        let displayName = '';
        
        if (emailPart.includes('.')) {
          // Try to format as "Firstname Lastname"
          displayName = emailPart.split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        } else {
          // Just capitalize the username part
          displayName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
        }
        
        try {
          await updateProfile(user, { displayName });
        } catch (error) {
          console.error("Error updating profile:", error);
        }
      }
      
      // Set auth cookie on successful sign in
      Cookies.set('auth', 'true', { expires: 7 });
      
      // Mark that we're redirecting to avoid duplicate redirects
      if (!isRedirecting.current) {
        isRedirecting.current = true;
        // Redirect is handled by the auth state change listener, but we'll add a backup here
        setTimeout(() => {
          router.push('/?dashboard=true');
          // Reset the redirecting flag after a short delay
          setTimeout(() => {
            isRedirecting.current = false;
          }, 500);
        }, 100);
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
      // Make sure to set loading to false if sign-in fails
      setLoading(false);
      isRedirecting.current = false;
    }
  };

  const signOutUser = async () => {
    // Prevent multiple sign-out attempts
    if (isRedirecting.current) return;
    
    try {
      // Set loading to true during sign out to prevent UI flicker
      setLoading(true);
      isRedirecting.current = true;
      
      // Remove auth cookie on sign out before Firebase signOut to prevent flicker
      Cookies.remove('auth');
      
      // Start redirect before Firebase signOut completes
      setTimeout(() => {
        router.push('/signin');
      }, 0);
      
      // Then sign out from Firebase (this triggers the auth state change listener)
      await firebaseSignOut(auth);
      
      // Reset the redirecting flag after a short delay
      setTimeout(() => {
        isRedirecting.current = false;
      }, 500);
    } catch (error) {
      console.error("Error signing out", error);
      setLoading(false);
      isRedirecting.current = false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
