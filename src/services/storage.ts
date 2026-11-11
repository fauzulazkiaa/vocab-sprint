import { VocabSprintStorage, VocabSprintSettings, CardState } from '../types';

export const STORAGE_KEY = 'vocabSprint.v1';

export const DEFAULT_SETTINGS: VocabSprintSettings = {
  start: '2026-11-21',
  end: '2026-12-31',
  levels: ['a1', 'a2', 'b1', 'b2'],
};

export const INITIAL_STORAGE: VocabSprintStorage = {
  settings: DEFAULT_SETTINGS,
  cards: {},
  log: {},
};

export function getTodayString(): string {
  // Return YYYY-MM-DD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadStorage(): VocabSprintStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveStorage(INITIAL_STORAGE);
      return INITIAL_STORAGE;
    }
    const parsed = JSON.parse(raw);
    return {
      settings: {
        start: parsed.settings?.start || DEFAULT_SETTINGS.start,
        end: parsed.settings?.end || DEFAULT_SETTINGS.end,
        levels: Array.isArray(parsed.settings?.levels) && parsed.settings.levels.length > 0
          ? parsed.settings.levels
          : DEFAULT_SETTINGS.levels,
      },
      cards: parsed.cards && typeof parsed.cards === 'object' ? parsed.cards : {},
      log: parsed.log && typeof parsed.log === 'object' ? parsed.log : {},
    };
  } catch (err) {
    console.error('Failed to load storage, using initial state:', err);
    return INITIAL_STORAGE;
  }
}

export function saveStorage(data: VocabSprintStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function updateCardInStorage(cardId: string, cardState: CardState): VocabSprintStorage {
  const current = loadStorage();
  current.cards[cardId] = cardState;
  saveStorage(current);
  return current;
}

export function logDailyProgress(type: 'new' | 'reviewed', dateStr: string = getTodayString()): VocabSprintStorage {
  const current = loadStorage();
  if (!current.log[dateStr]) {
    current.log[dateStr] = { new: 0, reviewed: 0 };
  }
  if (type === 'new') {
    current.log[dateStr].new = (current.log[dateStr].new || 0) + 1;
  } else {
    current.log[dateStr].reviewed = (current.log[dateStr].reviewed || 0) + 1;
  }
  saveStorage(current);
  return current;
}

export function updateSettingsInStorage(partial: Partial<VocabSprintSettings>): VocabSprintStorage {
  const current = loadStorage();
  current.settings = {
    ...current.settings,
    ...partial,
  };
  saveStorage(current);
  return current;
}

export function exportBackupJson(): void {
  const data = loadStorage();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vocab-sprint-backup-${getTodayString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackupJson(jsonString: string): { success: boolean; error?: string; storage?: VocabSprintStorage } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Format JSON tidak valid.' };
    }
    if (!parsed.settings || !parsed.cards) {
      return { success: false, error: 'Struktur data tidak sesuai dengan format vocabSprint.v1.' };
    }
    const cleanStorage: VocabSprintStorage = {
      settings: {
        start: parsed.settings.start || DEFAULT_SETTINGS.start,
        end: parsed.settings.end || DEFAULT_SETTINGS.end,
        levels: Array.isArray(parsed.settings.levels) ? parsed.settings.levels : DEFAULT_SETTINGS.levels,
      },
      cards: parsed.cards || {},
      log: parsed.log || {},
    };
    saveStorage(cleanStorage);
    return { success: true, storage: cleanStorage };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membaca berkas JSON.';
    return { success: false, error: message };
  }
}

export function resetAllStorage(): VocabSprintStorage {
  const resetData: VocabSprintStorage = {
    settings: DEFAULT_SETTINGS,
    cards: {},
    log: {},
  };
  saveStorage(resetData);
  return resetData;
}
