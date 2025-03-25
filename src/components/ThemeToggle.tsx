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
    <div className="flex items-center gap-2">
      <button
        className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
          theme === "light" ? "bg-gray-200 dark:bg-gray-700" : ""
        }`}
        onClick={() => setTheme("light")}
        aria-label="Light mode"
      >
        <SunIcon className="h-5 w-5" />
      </button>
      <button
        className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
          theme === "dark" ? "bg-gray-200 dark:bg-gray-700" : ""
        }`}
        onClick={() => setTheme("dark")}
        aria-label="Dark mode"
      >
        <MoonIcon className="h-5 w-5" />
      </button>
      <button
        className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
          theme === "system" ? "bg-gray-200 dark:bg-gray-700" : ""
        }`}
        onClick={() => setTheme("system")}
        aria-label="System theme"
      >
        <ComputerDesktopIcon className="h-5 w-5" />
      </button>
    </div>
  );
} 