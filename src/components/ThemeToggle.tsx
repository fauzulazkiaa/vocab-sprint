import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, readAppliedTheme, storeTheme, storedTheme, type ThemeChoice } from '../services/theme';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<ThemeChoice>(() => readAppliedTheme());

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const followSystem = () => {
      if (storedTheme()) return;
      const next: ThemeChoice = media.matches ? 'dark' : 'light';
      applyTheme(next);
      setTheme(next);
    };
    media.addEventListener('change', followSystem);
    return () => media.removeEventListener('change', followSystem);
  }, []);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => {
        const next: ThemeChoice = isDark ? 'light' : 'dark';
        storeTheme(next);
        setTheme(next);
      }}
      aria-pressed={isDark}
      aria-label={isDark ? 'Tema gelap, ganti ke terang' : 'Tema terang, ganti ke gelap'}
      title={isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border border-app-border bg-app-bg text-app-primary text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
    >
      {isDark ? <Moon strokeWidth={1.5} className="w-3.5 h-3.5" /> : <Sun strokeWidth={1.5} className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{isDark ? 'Gelap' : 'Terang'}</span>
    </button>
  );
};
