import React from 'react';
import { OxfordWord } from '../types';

interface CardBackContentProps {
  word: OxfordWord;
}

export const CardBackContent: React.FC<CardBackContentProps> = ({ word }) => {
  return (
    <div className="mt-6 w-full max-w-xl mx-auto space-y-3 text-left">
      {word.arti ? (
        <div className="meaning-callout p-4 rounded-xl">
          <p className="text-xs uppercase font-semibold tracking-wider text-app-accent mb-1">
            Arti
          </p>
          <p className="text-lg font-semibold text-app-primary leading-snug">
            {word.arti}
          </p>
        </div>
      ) : null}

      <div className="p-4 rounded-xl bg-app-bg border border-app-border">
        <p className="text-xs uppercase font-semibold tracking-wider text-app-secondary mb-1">
          Definisi
        </p>
        <p className="text-base text-app-primary leading-relaxed">
          {word.definition}
        </p>
      </div>

      {word.example ? (
        <div className="p-4 rounded-xl bg-app-bg border border-app-border">
          <p className="text-xs uppercase font-semibold tracking-wider text-app-secondary mb-1">
            Contoh Kalimat
          </p>
          <p className="text-sm italic text-app-primary leading-relaxed">
            &ldquo;{word.example}&rdquo;
          </p>
          {word.contoh_arti ? (
            <p className="text-sm font-medium text-app-primary leading-relaxed mt-2">
              {word.contoh_arti}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
