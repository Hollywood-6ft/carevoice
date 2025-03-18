"use client";

import { useTheme } from "@/lib/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const { theme, isSystemTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely show the UI without hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Return null on server-side to avoid hydration issues
  }

  return (
    <div className="flex items-center gap-2">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex">
        <button
          onClick={() => setTheme("light")}
          className={`p-1.5 rounded-md ${
            theme === "light" && !isSystemTheme 
              ? "bg-white dark:bg-gray-700 shadow-sm" 
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          aria-label="Light mode"
        >
          <SunIcon className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => setTheme("dark")}
          className={`p-1.5 rounded-md ${
            theme === "dark" && !isSystemTheme 
              ? "bg-white dark:bg-gray-700 shadow-sm" 
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          aria-label="Dark mode"
        >
          <MoonIcon className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => setTheme("system")}
          className={`p-1.5 rounded-md ${
            isSystemTheme 
              ? "bg-white dark:bg-gray-700 shadow-sm" 
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          aria-label="System theme"
        >
          <ComputerDesktopIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
} 