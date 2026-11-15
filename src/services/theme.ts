/** Separate from progress (`vocabSprint.v1`). Do not write sprint data here. */
export const THEME_KEY = 'vocabSprint.theme';

export type ThemeChoice = 'light' | 'dark';

export function readAppliedTheme(): ThemeChoice {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: ThemeChoice): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
  root.style.backgroundColor = theme === 'dark' ? '#000000' : '#f5f5f7';
}

export function storeTheme(theme: ThemeChoice): void {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function storedTheme(): ThemeChoice | null {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}
