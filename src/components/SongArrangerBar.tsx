import React from 'react';
import {Copy, Layers, Play, Plus, Repeat, Trash2} from 'lucide-react';
import {STUDIO_STRINGS} from '../i18n/studioLocale';
import type {SongSection, StudioLocale, TraditionId} from '../types/studio';

interface SongArrangerBarProps {
  sections: SongSection[];
  activeSectionId: string;
  playFullArrangement: boolean;
  tradition: TraditionId;
  locale: StudioLocale;
  onSelectSection: (id: string) => void;
  onTogglePlayArrangement: (full: boolean) => void;
  onAddSection: () => void;
  onDuplicateSection: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onCycleRepeat: (id: string) => void;
}

export const SongArrangerBar: React.FC<SongArrangerBarProps> = ({
  sections,
  activeSectionId,
  playFullArrangement,
  tradition,
  locale,
  onSelectSection,
  onTogglePlayArrangement,
  onAddSection,
  onDuplicateSection,
  onDeleteSection,
  onCycleRepeat,
}) => {
  const strings = STUDIO_STRINGS[locale];
  const defaultHint =
    tradition === 'carnatic'
      ? 'Pallavi · Anupallavi · Charanam'
      : tradition === 'hindustani'
        ? 'Asthai · Antara · Taan'
        : 'Intro · Theme · Bridge';

  return (
    <section
      aria-label="Multi-Section Song Form Arranger"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 shrink-0 mr-1">
          <Layers className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
          <span>{strings.arranger.title}</span>
          <span className="hidden lg:inline text-[11px] font-normal text-slate-400">
            ({defaultHint})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {sections.map((sec, idx) => {
            const active = sec.id === activeSectionId;
            return (
              <div
                key={sec.id}
                className={`inline-flex items-center rounded-lg border transition-colors ${
                  active
                    ? 'border-amber-500 bg-amber-500/15'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E121B]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectSection(sec.id)}
                  className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                    active
                      ? 'text-amber-800 dark:text-amber-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {idx + 1}. {sec.name}
                </button>
                <button
                  type="button"
                  onClick={() => onCycleRepeat(sec.id)}
                  title="Cycle section repeat count (1x / 2x)"
                  className="px-1.5 py-1 text-[10px] font-mono-tabular text-slate-500 dark:text-slate-400 hover:text-amber-500 border-l border-slate-200 dark:border-slate-800"
                >
                  {sec.repeats}x
                </button>
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteSection(sec.id)}
                    aria-label={`Remove ${sec.name}`}
                    className="px-1.5 py-1 text-slate-400 hover:text-red-500 border-l border-slate-200 dark:border-slate-800"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onAddSection}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          {strings.arranger.addSection}
        </button>

        <button
          type="button"
          onClick={() => onDuplicateSection(activeSectionId)}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
        >
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          {strings.arranger.duplicateSection}
        </button>

        <div className="flex items-center rounded-lg bg-slate-200/70 dark:bg-[#0B0E14] p-0.5">
          <button
            type="button"
            onClick={() => onTogglePlayArrangement(false)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap ${
              !playFullArrangement
                ? 'bg-white dark:bg-[#1E2534] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Repeat className="w-3 h-3" aria-hidden="true" />
            {strings.arranger.loopSection}
          </button>
          <button
            type="button"
            onClick={() => onTogglePlayArrangement(true)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap ${
              playFullArrangement
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Play className="w-3 h-3 fill-current" aria-hidden="true" />
            {strings.arranger.playArrangement}
          </button>
        </div>
      </div>
    </section>
  );
};
