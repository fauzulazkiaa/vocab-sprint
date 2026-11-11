import React, { useState, useMemo } from 'react';
import { OxfordWord, VocabSprintStorage, DailyStats, CefrLevel, CardStatus } from '../types';
import { addDays } from '../services/srs';
import { speakWord } from '../services/speech';
import { 
  BarChart3, 
  Calendar, 
  Search, 
  Volume2, 
  CheckCircle2, 
  Bookmark, 
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';

interface ProgressViewProps {
  allWords: OxfordWord[];
  storage: VocabSprintStorage;
  stats: DailyStats;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  allWords,
  storage,
  stats,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // CEFR Levels Breakdown
  const levelBreakdown = useMemo(() => {
    const levels: CefrLevel[] = ['a1', 'a2', 'b1', 'b2'];
    return levels.map((lvl) => {
      const wordsInLevel = allWords.filter(w => w.cefr === lvl);
      const total = wordsInLevel.length;
      let known = 0;
      let learning = 0;

      for (const w of wordsInLevel) {
        const card = storage.cards[w.id];
        if (card?.status === 'known') known++;
        else if (card?.status === 'learning') learning++;
      }

      const knownPercent = total > 0 ? Math.round((known / total) * 100) : 0;
      const learningPercent = total > 0 ? Math.round((learning / total) * 100) : 0;

      return {
        level: lvl.toUpperCase(),
        total,
        known,
        learning,
        unseen: Math.max(0, total - known - learning),
        knownPercent,
        learningPercent,
      };
    });
  }, [allWords, storage.cards]);

  // 42-day activity heat grid calculation (from sprint start or last 42 days)
  const heatGridDays = useMemo(() => {
    const days: { date: string; displayDate: string; countNew: number; countRev: number; intensity: number }[] = [];
    const startDate = storage.settings.start; // "2026-11-21"

    for (let i = 0; i < 42; i++) {
      const dateStr = addDays(startDate, i);
      const entry = storage.log[dateStr] || { new: 0, reviewed: 0 };
      const totalAct = entry.new + entry.reviewed;

      // Intensity level 0..4
      let intensity = 0;
      if (totalAct > 0 && totalAct < 15) intensity = 1;
      else if (totalAct >= 15 && totalAct < 40) intensity = 2;
      else if (totalAct >= 40 && totalAct < 70) intensity = 3;
      else if (totalAct >= 70) intensity = 4;

      const [y, m, d] = dateStr.split('-');
      const displayDate = `${d}/${m}`;

      days.push({
        date: dateStr,
        displayDate,
        countNew: entry.new,
        countRev: entry.reviewed,
        intensity,
      });
    }

    return days;
  }, [storage.settings.start, storage.log]);

  // Filtered words for word browser
  const filteredWords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allWords.filter(w => {
      // CEFR level filter
      if (filterLevel !== 'all' && w.cefr !== filterLevel) return false;

      // Card status filter
      const card = storage.cards[w.id];
      const status: CardStatus = card ? card.status : 'new';
      if (filterStatus !== 'all' && status !== filterStatus) return false;

      // Search query
      if (query) {
        return (
          w.word.toLowerCase().includes(query) ||
          w.definition.toLowerCase().includes(query) ||
          w.type.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allWords, storage.cards, filterLevel, filterStatus, searchQuery]);

  return (
    <div className="max-w-[960px] mx-auto py-6 px-4 md:px-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-app-primary">
          Progres & Analitik Belajar
        </h1>
        <p className="text-xs text-app-secondary mt-1">
          Pantau laju sprint, pemetaan level CEFR, konsistensi aktivitas harian, dan bank kosakata Oxford 3000.
        </p>
      </div>

      {/* High-level Progress Summary Card */}
      <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-app-primary">Total Penguasaan Oxford 3000</h2>
            <p className="text-xs text-app-secondary">
              {stats.totalKnown.toLocaleString('id-ID')} kata dikuasai ({Math.round((stats.totalKnown / Math.max(1, stats.totalCardsInScope)) * 100)}%) dari {stats.totalCardsInScope.toLocaleString('id-ID')} kata dalam target aktif.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-app-success" />
              <span className="text-app-primary font-medium">Dikuasai</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-app-accent" />
              <span className="text-app-primary font-medium">Sedang Dihafal</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-neutral-300 dark:bg-neutral-700" />
              <span className="text-app-secondary">Belum Dimulai</span>
            </div>
          </div>
        </div>

        {/* Multi-segment stacked progress bar */}
        <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-app-success transition-all duration-300"
            style={{ width: `${(stats.totalKnown / Math.max(1, stats.totalCardsInScope)) * 100}%` }}
            title={`Dikuasai: ${stats.totalKnown.toLocaleString('id-ID')} kata`}
          />
          <div
            className="h-full bg-app-accent transition-all duration-300"
            style={{ width: `${(stats.totalLearning / Math.max(1, stats.totalCardsInScope)) * 100}%` }}
            title={`Sedang Dihafal: ${stats.totalLearning.toLocaleString('id-ID')} kata`}
          />
        </div>
      </div>

      {/* CEFR Level Breakdown */}
      <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-app-primary flex items-center space-x-2">
          <Layers strokeWidth={1.5} className="w-4 h-4 text-app-accent" />
          <span>Penguasaan per Tingkat CEFR</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {levelBreakdown.map((item) => (
            <div key={item.level} className="p-4 rounded-xl bg-app-bg border border-app-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-app-accent/10 text-app-accent">
                  Level {item.level}
                </span>
                <span className="text-xs font-semibold text-app-primary">
                  {item.known.toLocaleString('id-ID')} / {item.total.toLocaleString('id-ID')} kata ({item.knownPercent}%)
                </span>
              </div>

              <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-app-success"
                  style={{ width: `${item.knownPercent}%` }}
                />
                <div
                  className="h-full bg-app-accent"
                  style={{ width: `${item.learningPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-app-secondary pt-0.5">
                <span>Dikuasai: {item.known}</span>
                <span>Dihafal: {item.learning}</span>
                <span>Belum: {item.unseen}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 42-Day Activity Heat Grid (Monochrome Apple Blue) */}
      <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-app-primary flex items-center space-x-2">
              <Calendar strokeWidth={1.5} className="w-4 h-4 text-app-accent" />
              <span>Kalender Sprint 42 Hari ({storage.settings.start} - {storage.settings.end})</span>
            </h2>
            <p className="text-xs text-app-secondary mt-0.5">
              Intensitas belajar harian (kata baru & ulangan selesai).
            </p>
          </div>

          {/* Legend */}
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-app-secondary">
            <span>Rendah</span>
            <span className="w-3 h-3 rounded-xs bg-neutral-200 dark:bg-neutral-800" />
            <span className="w-3 h-3 rounded-xs bg-blue-200 dark:bg-blue-950" />
            <span className="w-3 h-3 rounded-xs bg-blue-400 dark:bg-blue-800" />
            <span className="w-3 h-3 rounded-xs bg-blue-600 dark:bg-blue-600" />
            <span className="w-3 h-3 rounded-xs bg-[#0071e3]" />
            <span>Tinggi</span>
          </div>
        </div>

        {/* Grid display */}
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-2">
          {heatGridDays.map((day, idx) => {
            let bgClass = 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
            if (day.intensity === 1) bgClass = 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-300';
            else if (day.intensity === 2) bgClass = 'bg-blue-300 text-blue-950 dark:bg-blue-800 dark:text-white border-blue-400';
            else if (day.intensity === 3) bgClass = 'bg-blue-500 text-white dark:bg-blue-600 border-blue-600';
            else if (day.intensity === 4) bgClass = 'bg-[#0071e3] text-white border-blue-700 font-bold';

            return (
              <div
                key={day.date}
                className={`p-2 rounded-lg border text-center transition-transform hover:scale-105 cursor-default ${bgClass}`}
                title={`${day.date}: ${day.countNew} kata baru, ${day.countRev} ulangan`}
              >
                <div className="text-[10px] font-mono opacity-80">{day.displayDate}</div>
                <div className="text-xs font-semibold mt-0.5">
                  {day.countNew + day.countRev > 0 ? (day.countNew + day.countRev) : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vocabulary Search & Browser */}
      <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-app-primary">
              Eksplorasi Kosakata Oxford 3000 ({filteredWords.length.toLocaleString('id-ID')} kata)
            </h2>
            <p className="text-xs text-app-secondary mt-0.5">
              Cari dan filter status kata untuk tinjauan mandiri.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search strokeWidth={1.5} className="w-4 h-4 text-app-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata atau arti..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-app-border bg-app-bg text-app-primary text-xs focus:outline-none focus:border-app-accent"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-app-border text-xs">
          <span className="text-app-secondary font-medium mr-1">Tingkat:</span>
          {['all', 'a1', 'a2', 'b1', 'b2'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded-md border font-medium transition-colors ${
                filterLevel === lvl
                  ? 'bg-app-accent text-white border-app-accent'
                  : 'bg-app-bg text-app-secondary border-app-border hover:text-app-primary'
              }`}
            >
              {lvl.toUpperCase()}
            </button>
          ))}

          <span className="text-app-secondary font-medium ml-3 mr-1">Status:</span>
          {[
            { id: 'all', label: 'Semua' },
            { id: 'known', label: 'Dikuasai' },
            { id: 'learning', label: 'Sedang Dihafal' },
            { id: 'new', label: 'Belum Dimulai' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-2.5 py-1 rounded-md border font-medium transition-colors ${
                filterStatus === st.id
                  ? 'bg-app-accent text-white border-app-accent'
                  : 'bg-app-bg text-app-secondary border-app-border hover:text-app-primary'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Words Table */}
        <div className="border border-app-border rounded-xl overflow-hidden max-h-[460px] overflow-y-auto divide-y divide-app-border">
          {filteredWords.length === 0 ? (
            <div className="p-8 text-center text-xs text-app-secondary">
              Tidak ada kata yang sesuai dengan pencarian atau filter.
            </div>
          ) : (
            filteredWords.slice(0, 100).map((word) => {
              const card = storage.cards[word.id];
              const status: CardStatus = card ? card.status : 'new';

              return (
                <div key={word.id} className="p-3 px-4 flex items-center justify-between hover:bg-app-bg transition-colors">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => speakWord(word.word)}
                      className="p-1.5 rounded-lg text-app-accent hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      title="Dengarkan suara"
                    >
                      <Volume2 strokeWidth={1.5} className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-app-primary">{word.word}</span>
                        <span className="text-[10px] font-mono text-app-secondary">
                          {word.phon_n_am ? `/${word.phon_n_am}/` : ''}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-app-bg border border-app-border text-app-secondary">
                          {word.cefr}
                        </span>
                        <span className="text-xs text-app-secondary">({word.type})</span>
                      </div>
                      <p className="text-xs text-app-secondary line-clamp-1 mt-0.5 max-w-lg">
                        {word.definition}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    {status === 'known' && (
                      <span className="px-2 py-0.5 rounded font-medium bg-app-success/15 text-app-success border border-app-success/30">
                        Dikuasai
                      </span>
                    )}
                    {status === 'learning' && (
                      <span className="px-2 py-0.5 rounded font-medium bg-app-accent/15 text-app-accent border border-app-accent/30">
                        Streak {card?.streak || 1}/3
                      </span>
                    )}
                    {status === 'new' && (
                      <span className="px-2 py-0.5 rounded font-medium bg-neutral-100 dark:bg-neutral-800 text-app-secondary border border-app-border">
                        Belum
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {filteredWords.length > 100 && (
          <p className="text-[11px] text-app-secondary text-center">
            Menampilkan 100 dari {filteredWords.length.toLocaleString('id-ID')} kata. Gunakan pencarian untuk mempersempit hasil.
          </p>
        )}
      </div>
    </div>
  );
};
