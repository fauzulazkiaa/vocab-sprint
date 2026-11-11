import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { OxfordWord, VocabSprintStorage, DailyStats, ViewTab } from '../types';
import { processHafalin, processUdahTahu } from '../services/srs';
import { updateCardInStorage, logDailyProgress, getTodayString } from '../services/storage';
import { speakWord } from '../services/speech';
import { 
  Volume2, 
  RotateCw, 
  Check, 
  Bookmark, 
  ArrowRight, 
  Sparkles,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface TodayViewProps {
  allWords: OxfordWord[];
  storage: VocabSprintStorage;
  stats: DailyStats;
  onStorageChange: (updated: VocabSprintStorage) => void;
  onNavigate: (tab: ViewTab) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  allWords,
  storage,
  stats,
  onStorageChange,
  onNavigate,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [accent, setAccent] = useState<'us' | 'uk'>('us');
  const [allowExtraSprint, setAllowExtraSprint] = useState(false);

  const todayStr = useMemo(() => getTodayString(), []);
  const activeLevels = useMemo(() => new Set(storage.settings.levels), [storage.settings.levels]);

  // Filter words that belong to active CEFR levels
  const scopedWords = useMemo(() => {
    return allWords.filter(w => activeLevels.has(w.cefr));
  }, [allWords, activeLevels]);

  // Get available new words for today (words that have never been marked or status is 'new')
  const newWordsQueue = useMemo(() => {
    return scopedWords.filter(w => {
      const card = storage.cards[w.id];
      return !card || card.status === 'new';
    });
  }, [scopedWords, storage.cards]);

  const currentWord = newWordsQueue[0] || null;

  const isTargetAchieved = stats.todayCompleted >= stats.todayTarget && !allowExtraSprint;
  const progressPercent = Math.min(100, Math.round((stats.todayCompleted / Math.max(1, stats.todayTarget)) * 100));

  // Audio helper
  const handlePlayAudio = useCallback((accentChoice?: 'us' | 'uk') => {
    if (!currentWord) return;
    const chosenAccent = accentChoice || accent;
    speakWord(currentWord.word, chosenAccent);
  }, [currentWord, accent]);

  // Handle Mark "Udah Tahu"
  const handleMarkKnown = useCallback(() => {
    if (!currentWord) return;
    const updatedCard = processUdahTahu(todayStr);
    const updatedStorage = updateCardInStorage(currentWord.id, updatedCard);
    const withLog = logDailyProgress('new', todayStr);
    onStorageChange(withLog);
    setIsFlipped(false);
  }, [currentWord, todayStr, onStorageChange]);

  // Handle Mark "Hafalin"
  const handleMarkHafalin = useCallback(() => {
    if (!currentWord) return;
    const currentCard = storage.cards[currentWord.id];
    const updatedCard = processHafalin(currentCard, todayStr);
    const updatedStorage = updateCardInStorage(currentWord.id, updatedCard);
    const withLog = logDailyProgress('new', todayStr);
    onStorageChange(withLog);
    setIsFlipped(false);
  }, [currentWord, storage.cards, todayStr, onStorageChange]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => {
          const next = !prev;
          if (next) {
            handlePlayAudio();
          }
          return next;
        });
      } else if (e.key === '1') {
        e.preventDefault();
        handleMarkKnown();
      } else if (e.key === '2') {
        e.preventDefault();
        handleMarkHafalin();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handlePlayAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayAudio, handleMarkKnown, handleMarkHafalin]);

  return (
    <div className="max-w-[960px] mx-auto py-6 px-4 md:px-8 space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Target Hari Ini */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-app-secondary">Target Hari Ini</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-app-primary">
              {stats.todayTarget.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-app-secondary">kata/hari</span>
          </div>
        </div>

        {/* Selesai Hari Ini */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-app-secondary">Selesai Hari Ini</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-app-accent">
              {stats.todayCompleted.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-app-secondary">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Perlu Ulangan */}
        <div 
          onClick={() => stats.dueReviewCount > 0 && onNavigate('review')}
          className={`bg-app-surface border border-app-border rounded-2xl p-4 shadow-sm transition-all ${
            stats.dueReviewCount > 0 ? 'cursor-pointer hover:border-orange-400' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-app-secondary">Perlu Ulangan</p>
            {stats.dueReviewCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold tracking-tight ${
              stats.dueReviewCount > 0 ? 'text-orange-500' : 'text-app-primary'
            }`}>
              {stats.dueReviewCount.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-app-secondary">jatuh tempo</span>
          </div>
        </div>

        {/* Total Dikuasai */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-app-secondary">Total Dikuasai</p>
            {stats.streakDays > 0 && (
              <div className="flex items-center space-x-1 text-xs text-orange-500 font-semibold">
                <Flame strokeWidth={1.5} className="w-3.5 h-3.5" />
                <span>{stats.streakDays}h</span>
              </div>
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-app-success">
              {stats.totalKnown.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-app-secondary">
              / {stats.totalCardsInScope.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Progress Bar */}
      <div className="bg-app-surface border border-app-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium text-app-primary">
            Sprint Hari Ini: {stats.todayCompleted.toLocaleString('id-ID')} dari {stats.todayTarget.toLocaleString('id-ID')} kata
          </span>
          <span className="text-app-secondary font-mono">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-app-bg rounded-full overflow-hidden border border-app-border">
          <div 
            className="h-full bg-app-accent transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Flashcard Arena */}
      {isTargetAchieved ? (
        /* Target Achieved State */
        <div className="bg-app-surface border border-app-border rounded-2xl p-8 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-app-success/15 text-app-success mx-auto flex items-center justify-center">
            <CheckCircle2 strokeWidth={1.5} className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-semibold text-app-primary">
            Target Hari Ini Tercapai!
          </h2>
          <p className="text-sm text-app-secondary max-w-md mx-auto">
            Hebat! Anda telah menuntaskan target {stats.todayCompleted.toLocaleString('id-ID')} kata untuk sprint hari ini. Anda bisa melanjutkan ulangan kata terjadwal atau menambah hafalan kata baru ekstra.
          </p>
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            {stats.dueReviewCount > 0 && (
              <button
                onClick={() => onNavigate('review')}
                className="px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-colors shadow-sm flex items-center space-x-2"
              >
                <span>Mulai Ulangan ({stats.dueReviewCount})</span>
                <ArrowRight strokeWidth={1.5} className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setAllowExtraSprint(true)}
              className="px-6 py-2.5 rounded-full bg-app-accent hover:bg-app-accent-hover text-white font-medium text-sm transition-colors shadow-sm"
            >
              Lanjutkan Hafal Kata Ekstra
            </button>
          </div>
        </div>
      ) : !currentWord ? (
        /* No More Words in Selected Scope */
        <div className="bg-app-surface border border-app-border rounded-2xl p-8 text-center shadow-sm space-y-4">
          <Sparkles strokeWidth={1.5} className="w-12 h-12 text-app-accent mx-auto" />
          <h2 className="text-xl font-semibold text-app-primary">
            Semua Kata Telah Dipelajari
          </h2>
          <p className="text-sm text-app-secondary max-w-md mx-auto">
            Tidak ada kata baru tersisa di level CEFR yang dipilih ({storage.settings.levels.map(l => l.toUpperCase()).join(', ')}). Buka Pengaturan untuk menambahkan level lain atau ulangi kosa kata yang ada.
          </p>
          <button
            onClick={() => onNavigate('review')}
            className="px-6 py-2.5 rounded-full bg-app-accent text-white font-medium text-sm transition-colors shadow-sm"
          >
            Buka Layar Ulangan
          </button>
        </div>
      ) : (
        /* Active Flashcard */
        <div className="space-y-4">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-200 min-h-[340px] flex flex-col justify-between">
            {/* Top row: Badges and Audio accent switch */}
            <div className="flex items-center justify-between pb-4 border-b border-app-border">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-app-accent/10 text-app-accent border border-app-accent/20">
                  {currentWord.cefr.toUpperCase()}
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-app-bg text-app-secondary border border-app-border">
                  {currentWord.type}
                </span>
              </div>

              {/* Accent selection & speaker */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setAccent('us');
                    handlePlayAudio('us');
                  }}
                  className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                    accent === 'us'
                      ? 'bg-app-primary text-app-surface border-app-primary font-semibold'
                      : 'bg-app-bg text-app-secondary border-app-border hover:text-app-primary'
                  }`}
                  title="Dengarkan pelafalan US"
                >
                  US
                </button>
                <button
                  onClick={() => {
                    setAccent('uk');
                    handlePlayAudio('uk');
                  }}
                  className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                    accent === 'uk'
                      ? 'bg-app-primary text-app-surface border-app-primary font-semibold'
                      : 'bg-app-bg text-app-secondary border-app-border hover:text-app-primary'
                  }`}
                  title="Dengarkan pelafalan UK"
                >
                  UK
                </button>
                <button
                  onClick={() => handlePlayAudio()}
                  className="p-2 rounded-lg bg-app-bg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-app-primary transition-colors border border-app-border"
                  title="Putar Audio (Shortcut: A)"
                >
                  <Volume2 strokeWidth={1.5} className="w-4 h-4 text-app-accent" />
                </button>
              </div>
            </div>

            {/* Front & Back Content */}
            <div className="py-6 flex-1 flex flex-col justify-center items-center text-center">
              {/* Word Title */}
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-app-primary">
                {currentWord.word}
              </h1>

              {/* Phonetic transcription */}
              <div className="mt-2 text-sm text-app-secondary font-mono flex items-center space-x-3">
                {currentWord.phon_n_am && (
                  <span>US: /{currentWord.phon_n_am}/</span>
                )}
                {currentWord.phon_br && (
                  <span>UK: /{currentWord.phon_br}/</span>
                )}
              </div>

              {/* Back content after flip */}
              {isFlipped ? (
                <div className="mt-6 w-full max-w-xl mx-auto space-y-4 text-left animate-fadeIn">
                  <div className="p-4 rounded-xl bg-app-bg border border-app-border">
                    <p className="text-xs uppercase font-semibold tracking-wider text-app-secondary mb-1">
                      Definisi
                    </p>
                    <p className="text-base text-app-primary leading-relaxed">
                      {currentWord.definition}
                    </p>
                  </div>

                  {currentWord.example && (
                    <div className="p-4 rounded-xl bg-app-bg border border-app-border">
                      <p className="text-xs uppercase font-semibold tracking-wider text-app-secondary mb-1">
                        Contoh Kalimat
                      </p>
                      <p className="text-sm italic text-app-primary leading-relaxed">
                        &ldquo;{currentWord.example}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsFlipped(true);
                    handlePlayAudio();
                  }}
                  className="mt-6 inline-flex items-center space-x-2 text-xs font-medium text-app-secondary hover:text-app-primary transition-colors bg-app-bg px-3.5 py-2 rounded-lg border border-app-border"
                >
                  <RotateCw strokeWidth={1.5} className="w-3.5 h-3.5" />
                  <span>Klik untuk lihat arti (Spasi)</span>
                </button>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-app-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-app-secondary flex items-center space-x-2">
                <span>Shortcut:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-app-bg border border-app-border font-mono text-[11px]">Spasi</kbd>
                <span>arti</span>
                <kbd className="px-1.5 py-0.5 rounded bg-app-bg border border-app-border font-mono text-[11px]">1</kbd>
                <span>udah tahu</span>
                <kbd className="px-1.5 py-0.5 rounded bg-app-bg border border-app-border font-mono text-[11px]">2</kbd>
                <span>hafalin</span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={handleMarkKnown}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-app-accent hover:bg-app-accent-hover text-white text-sm font-semibold transition-colors shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <Check strokeWidth={1.5} className="w-4 h-4" />
                  <span>Udah tahu (1)</span>
                </button>

                <button
                  onClick={handleMarkHafalin}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-app-border bg-app-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-app-primary text-sm font-medium transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Bookmark strokeWidth={1.5} className="w-4 h-4 text-app-secondary" />
                  <span>Hafalin (2)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
