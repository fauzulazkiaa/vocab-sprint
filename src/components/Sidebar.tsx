import React from 'react';
import { ViewTab } from '../types';
import { 
  CalendarDays, 
  RotateCcw, 
  CheckCircle2, 
  BarChart3, 
  Settings,
  HardDrive,
  Globe,
  ArrowUpRight
} from 'lucide-react';

interface SidebarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  dueCount: number;
  totalWords: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  dueCount,
  totalWords,
}) => {
  const navItems: { id: ViewTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'today', label: 'Hari Ini', icon: CalendarDays },
    { id: 'review', label: 'Ulangan', icon: RotateCcw, badge: dueCount },
    { id: 'quiz', label: 'Kuis', icon: CheckCircle2 },
    { id: 'progress', label: 'Progres', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[232px] h-screen border-r border-app-border bg-app-surface fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-app-border">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-app-accent flex items-center justify-center text-white font-semibold text-base shadow-sm">
            VS
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-app-primary">Vocab Sprint</h1>
            <p className="text-xs text-app-secondary">Oxford 3000 Mastery</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-colors duration-150 ${
                isActive
                  ? 'bg-app-accent text-white'
                  : 'text-app-primary hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon strokeWidth={1.5} className="w-[18px] h-[18px]" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded font-semibold ${
                    isActive
                      ? 'bg-white text-app-accent'
                      : 'bg-orange-500 text-white dark:bg-orange-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-app-border">
        <div className="rounded-xl p-3 bg-app-bg border border-app-border">
          <div className="flex items-center space-x-2 text-xs text-app-secondary mb-1">
            <HardDrive strokeWidth={1.5} className="w-3.5 h-3.5 text-app-accent" />
            <span className="font-medium text-app-primary">Offline & Lokal</span>
          </div>
          <p className="text-[11px] leading-relaxed text-app-secondary">
            {totalWords > 0 ? `${totalWords.toLocaleString('id-ID')} kata terpasang` : 'Memuat data...'}
          </p>
        </div>

        <a
          href={`${import.meta.env.BASE_URL}landing.html`}
          className="mt-2.5 flex items-center justify-between px-3 py-2 text-xs font-medium text-app-secondary hover:text-app-primary hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-xl transition-colors border border-transparent hover:border-app-border"
        >
          <div className="flex items-center space-x-2">
            <Globe strokeWidth={1.5} className="w-3.5 h-3.5 text-app-accent" />
            <span>Halaman Produk</span>
          </div>
          <ArrowUpRight strokeWidth={1.5} className="w-3.5 h-3.5 opacity-70" />
        </a>
      </div>
    </aside>
  );
};
