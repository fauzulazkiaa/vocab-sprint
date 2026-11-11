import { OxfordWord, VocabSprintStorage, CardState, DailyStats } from '../types';
import { getTodayString } from './storage';

/**
 * Adds N days to a YYYY-MM-DD date string.
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates days remaining between reference date and sprint end date.
 */
export function getRemainingDays(startDateStr: string, endDateStr: string, todayStr: string = getTodayString()): number {
  const [ey, em, ed] = endDateStr.split('-').map(Number);
  const endDate = new Date(ey, em - 1, ed);

  // If today is before start date, count from start date
  const refDateStr = todayStr < startDateStr ? startDateStr : todayStr;
  const [ry, rm, rd] = refDateStr.split('-').map(Number);
  const refDate = new Date(ry, rm - 1, rd);

  const diffTime = endDate.getTime() - refDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1); // include the end day
}

/**
 * Computes daily target and high-level stats according to spec.
 */
export function calculateDailyStats(
  allWords: OxfordWord[],
  storage: VocabSprintStorage,
  todayStr: string = getTodayString()
): DailyStats {
  const activeLevels = new Set(storage.settings.levels);
  const scopedWords = allWords.filter(w => activeLevels.has(w.cefr));
  const totalCardsInScope = scopedWords.length;

  let totalKnown = 0;
  let totalLearning = 0;
  let dueReviewCount = 0;

  for (const word of scopedWords) {
    const card = storage.cards[word.id];
    if (card) {
      if (card.status === 'known') {
        totalKnown++;
      } else if (card.status === 'learning') {
        totalLearning++;
        if (card.due && card.due <= todayStr) {
          dueReviewCount++;
        }
      }
    }
  }

  const remainingDays = getRemainingDays(storage.settings.start, storage.settings.end, todayStr);
  const remainingCards = Math.max(0, totalCardsInScope - totalKnown);
  const todayTarget = Math.max(1, Math.ceil(remainingCards / remainingDays));

  // Today completed cards
  const todayLog = storage.log[todayStr];
  const todayCompleted = (todayLog?.new || 0);

  // Calculate learning streak days
  const streakDays = calculateStreakDays(storage.log, todayStr);

  return {
    todayTarget,
    todayCompleted,
    dueReviewCount,
    totalKnown,
    totalCardsInScope,
    totalLearning,
    streakDays,
    remainingDays,
  };
}

/**
 * Count consecutive days with activity ending today or yesterday.
 */
export function calculateStreakDays(log: Record<string, { new: number; reviewed: number }>, todayStr: string): number {
  let streak = 0;
  let checkDate = todayStr;

  // Check if today has activity; if not, check from yesterday
  const todayAct = log[todayStr] && (log[todayStr].new > 0 || log[todayStr].reviewed > 0);
  if (!todayAct) {
    checkDate = addDays(todayStr, -1);
  }

  while (true) {
    const entry = log[checkDate];
    if (entry && (entry.new > 0 || entry.reviewed > 0)) {
      streak++;
      checkDate = addDays(checkDate, -1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Handle SRS answer: "Hafalin"
 * Schedule: +1 day (streak 1), +3 days (streak 2), +7 days (streak 3), then promote to known if streak >= 3.
 */
export function processHafalin(currentCard: CardState | undefined, todayStr: string = getTodayString()): CardState {
  const currentStreak = currentCard?.streak || 0;
  const nextStreak = currentStreak + 1;

  if (nextStreak >= 3) {
    // Promoted to known after 3 successful review streaks
    return {
      status: 'known',
      streak: nextStreak,
      due: null,
      lastReviewed: todayStr,
    };
  }

  let nextDueDays = 1;
  if (nextStreak === 2) {
    nextDueDays = 3;
  } else if (nextStreak === 3) {
    nextDueDays = 7;
  }

  return {
    status: 'learning',
    streak: nextStreak,
    due: addDays(todayStr, nextDueDays),
    lastReviewed: todayStr,
  };
}

/**
 * Handle SRS answer: "Lupa / Ulangi" (Review failure)
 * Resets streak back to 1 and schedules for tomorrow.
 */
export function processLupa(todayStr: string = getTodayString()): CardState {
  return {
    status: 'learning',
    streak: 1,
    due: addDays(todayStr, 1),
    lastReviewed: todayStr,
  };
}

/**
 * Handle SRS answer: "Udah Tahu"
 * Immediately mark as known.
 */
export function processUdahTahu(todayStr: string = getTodayString()): CardState {
  return {
    status: 'known',
    streak: 0,
    due: null,
    lastReviewed: todayStr,
  };
}
