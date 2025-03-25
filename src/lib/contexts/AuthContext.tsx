"use client";

import React, { createContext, useEffect, useState } from "react";
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
            
            // Redirect to dashboard if on signin page
            if (pathname === '/signin') {
              router.push('/?dashboard=true');
            }
          } else {
            // Remove auth cookie when user is logged out
            Cookies.remove('auth');
            
            // Redirect to signin if not already there
            if (pathname !== '/signin') {
              router.push('/signin');
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
      
      // Force redirect to dashboard
      router.push('/?dashboard=true');
    } catch (error) {
      console.error("Error signing in with Google", error);
      // Make sure to set loading to false if sign-in fails
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      // Set loading to true during sign out to prevent UI flicker
      setLoading(true);
      
      await firebaseSignOut(auth);
      // Remove auth cookie on sign out
      Cookies.remove('auth');
      // Redirect to sign-in page after successful sign out
      router.push('/signin');
    } catch (error) {
      console.error("Error signing out", error);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
