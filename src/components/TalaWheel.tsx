import React from 'react';
import {getTalaDisplayName, getTalaStructureDisplay} from '../engine/musicTheory';
import type {StudioLocale, TalaDefinition} from '../types/studio';

interface TalaWheelProps {
  tala: TalaDefinition;
  locale: StudioLocale;
  currentStep: number;
  isPlaying: boolean;
}

export const TalaWheel: React.FC<TalaWheelProps> = ({tala, locale, currentStep, isPlaying}) => {
  const activeBeat = Math.floor(currentStep / tala.stepsPerBeat) % tala.beats;
  const beatLabels: string[] = [];

  for (let b = 0; b < tala.beats; b++) {
    if (b === tala.samBeat && !tala.khaliBeats.includes(b)) beatLabels.push('X');
    else if (tala.khaliBeats.includes(b)) beatLabels.push('0');
    else if (tala.taliBeats.includes(b)) beatLabels.push('I');
    else beatLabels.push(String(b + 1));
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            {getTalaDisplayName(tala, locale)}
          </span>
          <span className="mx-2 text-slate-400" aria-hidden="true">
            ·
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {getTalaStructureDisplay(tala, locale)}
          </span>
        </div>
        <span className="font-mono-tabular text-xs text-slate-500 dark:text-slate-400">
          Beat {isPlaying ? activeBeat + 1 : 1} / {tala.beats} · Step {currentStep + 1} /{' '}
          {tala.totalSteps}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {beatLabels.map((mark, idx) => {
          const isCurrent = isPlaying && idx === activeBeat;
          const isSam = idx === tala.samBeat;
          const isKhali = tala.khaliBeats.includes(idx);
          const isTali = tala.taliBeats.includes(idx);

          return (
            <div
              key={idx}
              className={`flex flex-col items-center justify-center min-w-[34px] flex-1 h-11 rounded-lg border text-xs font-mono-tabular transition-transform ${
                isCurrent
                  ? 'border-amber-500 bg-amber-500 text-slate-950 font-bold scale-[1.03]'
                  : isSam
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold'
                    : isKhali
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-[#0B0E14] text-slate-500 dark:text-slate-400'
                      : isTali
                        ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#171E2C] text-slate-800 dark:text-slate-200'
                        : 'border-slate-200 dark:border-slate-800/80 bg-transparent text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="leading-none">{mark}</span>
              <span className="text-[10px] opacity-70 mt-0.5 leading-none">{idx + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
