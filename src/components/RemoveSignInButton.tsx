'use client';

import { useEffect } from 'react';

export default function RemoveSignInButton() {
  useEffect(() => {
    // Function to remove Google Sign In buttons from the navbar
    const removeGoogleSignInButtons = () => {
      const navbar = document.querySelector('nav');
      if (!navbar) return;

      // Find all buttons in the navbar
      const buttons = navbar.querySelectorAll('button');
      
      buttons.forEach(button => {
        // Check if the button contains the Google Sign In text
        if (button.textContent?.includes('Sign in with Google')) {
          button.style.display = 'none';
        }
        
        // Also check for buttons with SVGs that might be the Google Sign In button
        if (button.querySelector('svg') && 
            button.classList.contains('flex') && 
            button.classList.contains('items-center') && 
            button.classList.contains('justify-center') && 
            button.classList.contains('bg-white')) {
          button.style.display = 'none';
        }
      });
    };

    // Run once on mount
    removeGoogleSignInButtons();
    
    // Also set up to run after any potential re-renders
    const observer = new MutationObserver(removeGoogleSignInButtons);
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  // This component doesn't render anything
  return null;
} 