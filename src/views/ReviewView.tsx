import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { OxfordWord, VocabSprintStorage } from '../types';
import { processHafalin, processLupa } from '../services/srs';
import { updateCardInStorage, logDailyProgress, getTodayString } from '../services/storage';
import { speakWord } from '../services/speech';
import { 
  RotateCcw, 
  Volume2, 
  CheckCircle2, 
  RotateCw, 
  X, 
  Check, 
  Layers,
  Calendar,
  Clock
} from 'lucide-react';

interface ReviewViewProps {
  allWords: OxfordWord[];
  storage: VocabSprintStorage;
  onStorageChange: (updated: VocabSprintStorage) => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  allWords,
  storage,
  onStorageChange,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [accent, setAccent] = useState<'us' | 'uk'>('us');
  const [tabMode, setTabMode] = useState<'flashcard' | 'list'>('flashcard');

  const todayStr = useMemo(() => getTodayString(), []);
  const wordsMap = useMemo(() => {
    const map = new Map<string, OxfordWord>();
    for (const w of allWords) {
      map.set(w.id, w);
    }
    return map;
  }, [allWords]);

  // Words that are due today
  const dueCards = useMemo(() => {
    const list: { id: string; card: typeof storage.cards[string]; word: OxfordWord }[] = [];
    for (const [id, card] of Object.entries(storage.cards)) {
      if (card.status === 'learning' && card.due && card.due <= todayStr) {
        const word = wordsMap.get(id);
        if (word) {
          list.push({ id, card, word });
        }
      }
    }
    return list;
  }, [storage.cards, todayStr, wordsMap]);

  // All learning cards for overview
  const allLearningCards = useMemo(() => {
    const list: { id: string; card: typeof storage.cards[string]; word: OxfordWord }[] = [];
    for (const [id, card] of Object.entries(storage.cards)) {
      if (card.status === 'learning') {
        const word = wordsMap.get(id);
        if (word) {
          list.push({ id, card, word });
        }
      }
    }
    return list.sort((a, b) => (a.card.due || '').localeCompare(b.card.due || ''));
  }, [storage.cards, wordsMap]);

  const currentItem = dueCards[0] || null;

  const handlePlayAudio = useCallback((accentChoice?: 'us' | 'uk') => {
    if (!currentItem) return;
    speakWord(currentItem.word.word, accentChoice || accent);
  }, [currentItem, accent]);

  // Answered "Lupa" (Failed review)
  const handleAnswerLupa = useCallback(() => {
    if (!currentItem) return;
    const updatedCard = processLupa(todayStr);
    const updatedStorage = updateCardInStorage(currentItem.id, updatedCard);
    const withLog = logDailyProgress('reviewed', todayStr);
    onStorageChange(withLog);
    setIsFlipped(false);
  }, [currentItem, todayStr, onStorageChange]);

  // Answered "Ingat" (Successful review)
  const handleAnswerIngat = useCallback(() => {
    if (!currentItem) return;
    const updatedCard = processHafalin(currentItem.card, todayStr);
    const updatedStorage = updateCardInStorage(currentItem.id, updatedCard);
    const withLog = logDailyProgress('reviewed', todayStr);
    onStorageChange(withLog);
    setIsFlipped(false);
  }, [currentItem, todayStr, onStorageChange]);

  // Keyboard shortcuts
  useEffect(() => {
    if (tabMode !== 'flashcard' || !currentItem) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => {
          const next = !prev;
          if (next) handlePlayAudio();
          return next;
        });
      } else if (e.key === '1') {
        e.preventDefault();
        handleAnswerLupa();
      } else if (e.key === '2') {
        e.preventDefault();
        handleAnswerIngat();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handlePlayAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabMode, currentItem, handlePlayAudio, handleAnswerLupa, handleAnswerIngat]);

  return (
    <div className="max-w-[960px] mx-auto py-6 px-4 md:px-8 space-y-6">
      {/* Header & Sub-tab selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-app-primary">
            Ulangan Terjadwal (SRS)
          </h1>
          <p className="text-xs text-app-secondary mt-1">
            Algoritma interval +1, +3, +7 hari. Tiga kali benar berturut-turut akan memindahkan kata ke status dikuasai.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-app-bg p-1 rounded-xl border border-app-border self-start">
          <button
            onClick={() => setTabMode('flashcard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tabMode === 'flashcard'
                ? 'bg-app-surface text-app-primary shadow-xs font-semibold'
                : 'text-app-secondary hover:text-app-primary'
            }`}
          >
            Flashcard ({dueCards.length})
          </button>
          <button
            onClick={() => setTabMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tabMode === 'list'
                ? 'bg-app-surface text-app-primary shadow-xs font-semibold'
                : 'text-app-secondary hover:text-app-primary'
            }`}
          >
            Semua Antrian ({allLearningCards.length})
          </button>
        </div>
      </div>

      {tabMode === 'flashcard' ? (
        dueCards.length === 0 ? (
          /* Empty Due State */
          <div className="bg-app-surface border border-app-border rounded-2xl p-10 text-center shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-full bg-app-success/15 text-app-success mx-auto flex items-center justify-center">
              <CheckCircle2 strokeWidth={1.5} className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-semibold text-app-primary">
              Semua Ulangan Hari Ini Selesai
            </h2>
            <p className="text-sm text-app-secondary max-w-md mx-auto">
              Tidak ada kata yang jatuh tempo untuk diulang sekarang. Kosa kata baru yang Anda hafal hari ini akan dijadwalkan ulang besok secara otomatis.
            </p>
            <div className="pt-2 text-xs text-app-secondary">
              Total kata dalam antrian belajar: <span className="font-semibold text-app-primary">{allLearningCards.length} kata</span>
            </div>
          </div>
        ) : (
          /* Active Review Flashcard */
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 md:p-8 shadow-sm min-h-[360px] flex flex-col justify-between">
            {/* Header row */}
            <div className="flex items-center justify-between pb-4 border-b border-app-border">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-600 border border-orange-500/20">
                  {currentItem.word.cefr.toUpperCase()}
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-app-bg text-app-secondary border border-app-border">
                  {currentItem.word.type}
                </span>

                {/* Streak Badge */}
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-app-accent border border-blue-500/20">
                  Streak: {currentItem.card.streak}/3
                </span>
              </div>

              {/* Counter & Voice */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-app-secondary font-mono mr-2">
                  Sisa {dueCards.length} kata
                </span>
                <button
                  onClick={() => handlePlayAudio()}
                  className="p-2 rounded-lg bg-app-bg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-app-primary transition-colors border border-app-border"
                  title="Putar Audio (A)"
                >
                  <Volume2 strokeWidth={1.5} className="w-4 h-4 text-app-accent" />
                </button>
              </div>
            </div>

            {/* Word Center */}
            <div className="py-6 flex-1 flex flex-col justify-center items-center text-center">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-app-primary">
                {currentItem.word.word}
              </h1>

              <div className="mt-2 text-sm text-app-secondary font-mono flex items-center space-x-3">
                {currentItem.word.phon_n_am && <span>US: /{currentItem.word.phon_n_am}/</span>}
                {currentItem.word.phon_br && <span>UK: /{currentItem.word.phon_br}/</span>}
              </div>

              {/* Answer Revealed */}
              {isFlipped ? (
                <div className="mt-6 w-full max-w-xl mx-auto space-y-4 text-left animate-fadeIn">
                  <div className="p-4 rounded-xl bg-app-bg border border-app-border">
                    <p className="text-xs uppercase font-semibold tracking-wider text-app-secondary mb-1">
                      Definisi
                    </p>
                    <p className="text-base text-app-primary leading-relaxed">
                      {currentItem.word.definition}
                    </p>
                  </div>

                  {currentItem.word.example && (
                    <div className="p-4 rounded-xl bg-app-bg border border-app-border">
                      <p className="text-xs uppercase font-semibold tracking-wider text-app-secondary mb-1">
                        Contoh Kalimat
                      </p>
                      <p className="text-sm italic text-app-primary leading-relaxed">
                        &ldquo;{currentItem.word.example}&rdquo;
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
                  <span>Klik untuk lihat jawaban (Spasi)</span>
                </button>
              )}
            </div>

            {/* Review Actions */}
            <div className="pt-4 border-t border-app-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-app-secondary flex items-center space-x-2">
                <span>Shortcut:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-app-bg border border-app-border font-mono text-[11px]">Spasi</kbd>
                <span>arti</span>
                <kbd className="px-1.5 py-0.5 rounded bg-app-bg border border-app-border font-mono text-[11px]">1</kbd>
                <span>lupa</span>
                <kbd className="px-1.5 py-0.5 rounded bg-app-bg border border-app-border font-mono text-[11px]">2</kbd>
                <span>ingat</span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={handleAnswerLupa}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-app-border bg-app-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-app-primary text-sm font-medium transition-colors flex items-center justify-center space-x-1.5"
                >
                  <X strokeWidth={1.5} className="w-4 h-4 text-orange-500" />
                  <span>Lupa (1)</span>
                </button>

                <button
                  onClick={handleAnswerIngat}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-app-accent hover:bg-app-accent-hover text-white text-sm font-semibold transition-colors shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <Check strokeWidth={1.5} className="w-4 h-4" />
                  <span>Ingat (2)</span>
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Queue Table List View */
        <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-app-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-app-primary">
              Semua Kata dalam Antrian Belajar ({allLearningCards.length})
            </h2>
            <span className="text-xs text-app-secondary">
              Urut berdasarkan tanggal jatuh tempo
            </span>
          </div>

          {allLearningCards.length === 0 ? (
            <div className="p-8 text-center text-sm text-app-secondary">
              Belum ada kata yang sedang dipelajari. Mulai hafalkan kata di tab Hari Ini!
            </div>
          ) : (
            <div className="divide-y divide-app-border max-h-[500px] overflow-y-auto">
              {allLearningCards.map(({ id, card, word }) => {
                const isDue = card.due && card.due <= todayStr;
                return (
                  <div key={id} className="p-3.5 px-4 flex items-center justify-between hover:bg-app-bg transition-colors">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => speakWord(word.word)}
                        className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-app-secondary hover:text-app-primary transition-colors"
                        title="Dengarkan pelafalan"
                      >
                        <Volume2 strokeWidth={1.5} className="w-4 h-4 text-app-accent" />
                      </button>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm text-app-primary">{word.word}</span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-app-bg border border-app-border text-app-secondary">
                            {word.cefr}
                          </span>
                          <span className="text-xs text-app-secondary">({word.type})</span>
                        </div>
                        <p className="text-xs text-app-secondary line-clamp-1 mt-0.5 max-w-md">
                          {word.definition}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <span className="px-2 py-0.5 rounded font-mono bg-app-bg border border-app-border text-app-primary">
                        Streak {card.streak}/3
                      </span>
                      <span className={`px-2 py-0.5 rounded font-mono font-medium ${
                        isDue 
                          ? 'bg-orange-500/15 text-orange-600 border border-orange-500/30'
                          : 'bg-app-bg text-app-secondary border border-app-border'
                      }`}>
                        {isDue ? 'Jatuh Tempo Hari Ini' : `Due: ${card.due}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
