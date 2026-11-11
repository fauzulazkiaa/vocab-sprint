export type CefrLevel = 'a1' | 'a2' | 'b1' | 'b2';

export type CardStatus = 'new' | 'learning' | 'known';

export interface OxfordWord {
  id: string; // `${word}|${type}`
  word: string;
  type: string;
  cefr: CefrLevel;
  phon_br: string;
  phon_n_am: string;
  definition: string;
  example: string;
  uk?: string;
  us?: string;
}

export interface CardState {
  status: CardStatus;
  streak: number;
  due: string | null; // YYYY-MM-DD
  lastReviewed?: string; // YYYY-MM-DD
}

export interface DailyLog {
  new: number;
  reviewed: number;
}

export interface VocabSprintSettings {
  start: string; // "YYYY-MM-DD"
  end: string;   // "YYYY-MM-DD"
  levels: CefrLevel[];
}

export interface VocabSprintStorage {
  settings: VocabSprintSettings;
  cards: Record<string, CardState>;
  log: Record<string, DailyLog>;
}

export interface DailyStats {
  todayTarget: number;
  todayCompleted: number;
  dueReviewCount: number;
  totalKnown: number;
  totalCardsInScope: number;
  totalLearning: number;
  streakDays: number;
  remainingDays: number;
}

export type ViewTab = 'today' | 'review' | 'quiz' | 'progress' | 'settings';

export interface QuizQuestion {
  word: OxfordWord;
  prompt: string;
  options: string[];
  correctAnswer: string;
  type: 'word-to-def' | 'def-to-word' | 'cloze';
}
