import React from 'react';
import { ViewTab } from '../types';
import { 
  CalendarDays, 
  RotateCcw, 
  CheckCircle2, 
  BarChart3, 
  Settings 
} from 'lucide-react';

interface BottomNavProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  dueCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  dueCount,
}) => {
  const tabs: { id: ViewTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'today', label: 'Hari Ini', icon: CalendarDays },
    { id: 'review', label: 'Ulangan', icon: RotateCcw, badge: dueCount },
    { id: 'quiz', label: 'Kuis', icon: CheckCircle2 },
    { id: 'progress', label: 'Progres', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-app-surface border-t border-app-border z-30 flex items-center justify-around px-1 select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center h-full relative transition-colors ${
              isActive ? 'text-app-accent font-semibold' : 'text-app-secondary'
            }`}
          >
            <div className="relative">
              <Icon strokeWidth={1.5} className="w-5 h-5 mb-0.5" />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 text-[10px] bg-orange-500 text-white font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
