"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isSystemTheme: boolean;
  setTheme: (theme: Theme | "system") => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  isSystemTheme: true,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // State to track if we're using system theme preference
  const [isSystemTheme, setIsSystemTheme] = useState(true);
  
  // State to store the current theme
  const [theme, setTheme] = useState<Theme>("light");

  // Function to detect and apply system theme preference
  const applySystemTheme = () => {
    if (typeof window !== "undefined") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setTheme(systemTheme);
      updateHTMLClass(systemTheme);
    }
  };

  // Function to update the HTML class for dark mode
  const updateHTMLClass = (newTheme: Theme) => {
    if (typeof document !== "undefined") {
      const htmlElement = document.documentElement;
      if (newTheme === "dark") {
        htmlElement.classList.add("dark");
      } else {
        htmlElement.classList.remove("dark");
      }
    }
  };

  // Function to set theme (can be 'light', 'dark', or 'system')
  const handleSetTheme = (newTheme: Theme | "system") => {
    if (newTheme === "system") {
      setIsSystemTheme(true);
      applySystemTheme();
      localStorage.removeItem("theme"); // Remove stored preference
    } else {
      setIsSystemTheme(false);
      setTheme(newTheme);
      updateHTMLClass(newTheme);
      localStorage.setItem("theme", newTheme); // Store user preference
    }
  };

  // Effect to initialize theme from localStorage or system preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check for stored user preference
      const storedTheme = localStorage.getItem("theme") as Theme | null;
      
      if (storedTheme) {
        // Apply stored user preference
        setIsSystemTheme(false);
        setTheme(storedTheme);
        updateHTMLClass(storedTheme);
      } else {
        // Use system preference
        setIsSystemTheme(true);
        applySystemTheme();
      }

      // Listen for changes in system theme preference
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        if (isSystemTheme) {
          const newTheme = e.matches ? "dark" : "light";
          setTheme(newTheme);
          updateHTMLClass(newTheme);
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [isSystemTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isSystemTheme,
        setTheme: handleSetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext); 