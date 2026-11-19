import React from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';

// index.html applies the saved theme before first paint; this keeps React in sync with it
const currentTheme = (): Theme =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light';

export function useTheme() {
  const [theme, setTheme] = React.useState<Theme>(currentTheme);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable; the toggle still works for this session
    }
    setTheme(next);
  };

  return { theme, toggleTheme };
}
