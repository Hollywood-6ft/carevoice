'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function SignIn() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to main page if already authenticated
  useEffect(() => {
    if (user) {
      console.log('User authenticated, redirecting to home page');
      router.push('/');
    }
  }, [user, router]);
  
  // Force redirect to home if we're at /signin
  useEffect(() => {
    if (pathname === '/signin' && typeof window !== 'undefined') {
      const authCookie = document.cookie.includes('auth=true');
      if (authCookie) {
        console.log('Auth cookie detected, redirecting to home page');
        router.push('/');
      }
    }
  }, [pathname, router]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Immediate redirect attempt
      router.push('/');
    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md mx-auto flex items-center justify-center p-8">
        <div className="w-full space-y-8 text-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 whitespace-nowrap">
              CareVoice
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Your intelligent companion for healthcare documentation.
            </p>
          </div>

          <div className="mt-8">
            {/* Google Sign In */}
            <button 
              onClick={handleSignIn} 
              className="w-full h-12 flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-full transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 18 18" className="mr-3">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.192 0 7.556 0 9s.348 2.808.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
              </svg>
              <span className="text-[15px] text-gray-900 dark:text-white font-medium">Sign in with Google</span>
            </button>

            {/* Terms and Privacy */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              By signing up, you agree to the{' '}
              <a href="#" className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300">Terms of Service</a> and{' '}
              <a href="#" className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300">Privacy Policy</a>, including cookie use.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 