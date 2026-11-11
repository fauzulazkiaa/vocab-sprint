import React from 'react';
import { VocabSprintSettings } from '../types';
import { Volume2, Layers } from 'lucide-react';

interface TopbarProps {
  settings: VocabSprintSettings;
  remainingDays: number;
  totalKnown: number;
  totalTarget: number;
}

export const Topbar: React.FC<TopbarProps> = ({
  settings,
  remainingDays,
  totalKnown,
  totalTarget,
}) => {
  return (
    <header className="h-14 border-b border-app-border bg-app-surface/90 backdrop-blur sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between">
      {/* Left title & sprint timing */}
      <div className="flex items-center space-x-3">
        <span className="font-semibold text-sm text-app-primary">
          Oxford 3000 Sprint
        </span>
        <span className="hidden sm:inline-block text-xs px-2.5 py-0.5 rounded-md bg-app-bg border border-app-border text-app-secondary">
          {settings.start} s/d {settings.end}
        </span>
        <a
          href={`${import.meta.env.BASE_URL}landing.html`}
          className="text-xs text-app-secondary hover:text-app-primary transition-colors inline-flex items-center space-x-1 border border-app-border px-2 py-0.5 rounded-md bg-app-bg"
          title="Buka Landing Page Produk"
        >
          <span>Landing Page</span>
          <span className="text-[10px]">↗</span>
        </a>
      </div>

      {/* Right meta */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Active Levels */}
        <div className="hidden sm:flex items-center space-x-1.5 text-app-secondary bg-app-bg px-2.5 py-1 rounded-md border border-app-border">
          <Layers strokeWidth={1.5} className="w-3.5 h-3.5 text-app-accent" />
          <span className="font-medium text-app-primary">
            {settings.levels.map(l => l.toUpperCase()).join(', ')}
          </span>
        </div>

        {/* Remaining Days badge */}
        <div className="px-2.5 py-1 rounded-md bg-app-accent/10 text-app-accent border border-app-accent/20 font-medium">
          Sisa {remainingDays} Hari
        </div>

        {/* Overall progress quick stat */}
        <div className="hidden md:block text-app-secondary">
          <span className="font-semibold text-app-primary">{totalKnown.toLocaleString('id-ID')}</span>
          <span className="mx-1">/</span>
          <span>{totalTarget.toLocaleString('id-ID')} dikuasai</span>
        </div>
      </div>
    </header>
  );
};
