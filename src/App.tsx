import React, { useState, useEffect, useMemo } from 'react';
import { ViewTab, OxfordWord, VocabSprintStorage } from './types';
import { loadOxfordDataset } from './services/csvParser';
import { loadStorage, getTodayString } from './services/storage';
import { calculateDailyStats } from './services/srs';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { BottomNav } from './components/BottomNav';
import { TodayView } from './views/TodayView';
import { ReviewView } from './views/ReviewView';
import { QuizView } from './views/QuizView';
import { ProgressView } from './views/ProgressView';
import { SettingsView } from './views/SettingsView';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('today');
  const [words, setWords] = useState<OxfordWord[]>([]);
  const [storage, setStorage] = useState<VocabSprintStorage>(() => loadStorage());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize dataset
  const fetchDataset = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await loadOxfordDataset();
      if (data.length === 0) {
        setLoadError('Dataset Oxford 3000 tidak ditemukan atau kosong.');
      } else {
        setWords(data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat dataset.';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, []);

  const todayStr = useMemo(() => getTodayString(), []);
  const stats = useMemo(() => {
    return calculateDailyStats(words, storage, todayStr);
  }, [words, storage, todayStr]);

  const handleStorageChange = (updated: VocabSprintStorage) => {
    setStorage({ ...updated });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-bg text-app-primary flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-app-accent flex items-center justify-center text-white font-bold text-lg mb-4 shadow-sm animate-pulse">
          VS
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Memuat Vocab Sprint</h2>
        <p className="text-xs text-app-secondary mt-1 max-w-xs">
          Menyiapkan 3.000+ kosa kata Oxford dan data penyimpanan lokal...
        </p>
        <div className="mt-6 flex items-center space-x-2 text-xs text-app-accent">
          <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" />
          <span>Memuat dataset offline...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-app-bg text-app-primary flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center mb-4">
          <AlertCircle strokeWidth={1.5} className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-red-500">Gagal Memuat Dataset</h2>
        <p className="text-xs text-app-secondary mt-1 max-w-sm">
          {loadError}
        </p>
        <button
          onClick={fetchDataset}
          className="mt-6 px-5 py-2.5 rounded-full bg-app-accent text-white text-xs font-semibold flex items-center space-x-2 shadow-sm"
        >
          <RefreshCw strokeWidth={1.5} className="w-3.5 h-3.5" />
          <span>Coba Lagi</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg text-app-primary flex flex-col md:flex-row antialiased">
      {/* Desktop Sidebar (232px) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        dueCount={stats.dueReviewCount}
        totalWords={words.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-[232px] flex flex-col min-h-screen">
        {/* Topbar (56px) */}
        <Topbar
          settings={storage.settings}
          remainingDays={stats.remainingDays}
          totalKnown={stats.totalKnown}
          totalTarget={stats.totalCardsInScope}
        />

        {/* View Routing */}
        <main className="flex-1 pb-20 md:pb-12">
          {currentTab === 'today' && (
            <TodayView
              allWords={words}
              storage={storage}
              stats={stats}
              onStorageChange={handleStorageChange}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'review' && (
            <ReviewView
              allWords={words}
              storage={storage}
              onStorageChange={handleStorageChange}
            />
          )}

          {currentTab === 'quiz' && (
            <QuizView
              allWords={words}
              storage={storage}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressView
              allWords={words}
              storage={storage}
              stats={stats}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              storage={storage}
              onStorageChange={handleStorageChange}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation (56px) */}
        <BottomNav
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          dueCount={stats.dueReviewCount}
        />
      </div>
    </div>
  );
}
