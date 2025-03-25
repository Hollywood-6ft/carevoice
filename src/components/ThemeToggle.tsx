"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        className={`p-1.5 rounded-md transition-colors ${
          theme === "light"
            ? "bg-white text-yellow-500 shadow-sm dark:bg-gray-700 dark:text-yellow-400"
            : "text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-gray-700/50"
        }`}
        onClick={() => setTheme("light")}
        aria-label="Light mode"
      >
        <SunIcon className="h-4 w-4" />
      </button>
      <button
        className={`p-1.5 rounded-md transition-colors ${
          theme === "dark"
            ? "bg-white text-blue-500 shadow-sm dark:bg-gray-700 dark:text-blue-400"
            : "text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-gray-700/50"
        }`}
        onClick={() => setTheme("dark")}
        aria-label="Dark mode"
      >
        <MoonIcon className="h-4 w-4" />
      </button>
      <button
        className={`p-1.5 rounded-md transition-colors ${
          theme === "system"
            ? "bg-white text-purple-500 shadow-sm dark:bg-gray-700 dark:text-purple-400"
            : "text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-gray-700/50"
        }`}
        onClick={() => setTheme("system")}
        aria-label="System theme"
      >
        <ComputerDesktopIcon className="h-4 w-4" />
      </button>
    </div>
  );
} 