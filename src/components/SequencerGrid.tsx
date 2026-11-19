import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ArrowUpDown,
  Eraser,
  Magnet,
  Music,
  Repeat,
  Sparkles,
  Volume2,
  Wand2,
} from 'lucide-react';
import {audioEngine} from '../engine/audioEngine';
import {
  applySangatiVariation,
  formatPitchLabel,
  generateChordStampNotes,
  generateTihaiCadence,
  getQuantizeIntervalSteps,
  getShrutiCentsOffset,
  getTalaDisplayName,
  isSemitoneInScale,
  parseSwaraPhraseToNotes,
  PERCUSSION_LANES,
  quantizeTrackNotes,
} from '../engine/musicTheory';
import {getLocalizedGamakaName, STUDIO_STRINGS} from '../i18n/studioLocale';
import type {
  GamakaType,
  NotationMode,
  NoteEvent,
  QuantizeDivision,
  ScaleDefinition,
  StudioLocale,
  StudioTrack,
  TalaDefinition,
  TraditionId,
} from '../types/studio';

interface SequencerGridProps {
  tracks: StudioTrack[];
  activeTrackId: string;
  onSelectTrack: (id: string) => void;
  onUpdateTrackNotes: (trackId: string, notes: NoteEvent[]) => void;
  scale: ScaleDefinition;
  tala: TalaDefinition;
  tradition: TraditionId;
  locale: StudioLocale;
  rootMidi: number;
  microtonal: boolean;
  currentStep: number;
  isPlaying: boolean;
  notationMode: NotationMode;
  onNotationModeChange: (m: NotationMode) => void;
  quantizeDivision: QuantizeDivision;
  onQuantizeDivisionChange: (q: QuantizeDivision) => void;
  autoQuantize: boolean;
  onAutoQuantizeChange: (enabled: boolean) => void;
}

const GAMAKA_OPTIONS: Array<{id: GamakaType; symbol: string}> = [
  {id: 'none', symbol: '—'},
  {id: 'kampita', symbol: '~'},
  {id: 'meend', symbol: '/'},
  {id: 'nokku', symbol: '^'},
  {id: 'andolan', symbol: '≈'},
  {id: 'sphurita', symbol: '✦'},
  {id: 'staccato', symbol: '·'},
];

const QUANTIZE_DIVISIONS: QuantizeDivision[] = ['1/2', '1/4', '1/8'];

export const SequencerGrid: React.FC<SequencerGridProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  onUpdateTrackNotes,
  scale,
  tala,
  tradition,
  locale,
  rootMidi,
  microtonal,
  currentStep,
  isPlaying,
  notationMode,
  onNotationModeChange,
  quantizeDivision,
  onQuantizeDivisionChange,
  autoQuantize,
  onAutoQuantizeChange,
}) => {
  const strings = STUDIO_STRINGS[locale];
  const [brushDuration, setBrushDuration] = useState<number>(1);
  const [brushGamaka, setBrushGamaka] = useState<GamakaType>('none');
  const [scaleFilterOnly, setScaleFilterOnly] = useState<boolean>(true);
  const [toolMode, setToolMode] = useState<'draw' | 'ornament'>('draw');
  const [swaraPhrase, setSwaraPhrase] = useState<string>('S R2 G3 M1 P D2 N3 S.');
  const [quantizeFeedback, setQuantizeFeedback] = useState<string | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const activeTrack = tracks.find((t) => t.id === activeTrackId) ?? tracks[0];
  const isPerc = activeTrack?.role === 'percussion';
  const quantInterval = useMemo(
    () => getQuantizeIntervalSteps(quantizeDivision, tala),
    [quantizeDivision, tala]
  );
  const recordedNoteCount = useMemo(
    () => (activeTrack ? activeTrack.notes.filter((n) => n.recorded).length : 0),
    [activeTrack]
  );

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const showFeedback = (message: string) => {
    setQuantizeFeedback(message);
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setQuantizeFeedback(null);
    }, 2600);
  };

  const pitchRows = useMemo(() => {
    if (isPerc) {
      return PERCUSSION_LANES.map((p) => ({
        semitone: p.semitoneOffset,
        label: p.label,
        short: p.short,
        inScale: true,
        cents: 0,
      }));
    }

    const minSemi = activeTrack?.role === 'bass' ? -12 : -5;
    const maxSemi = activeTrack?.role === 'bass' ? 7 : 19;
    const rows: Array<{
      semitone: number;
      label: string;
      short: string;
      inScale: boolean;
      cents: number;
    }> = [];

    for (let s = maxSemi; s >= minSemi; s--) {
      const inScale = isSemitoneInScale(s, scale);
      if (scaleFilterOnly && !inScale) continue;
      const label = formatPitchLabel(s, rootMidi, tradition, notationMode, locale);
      const cents = getShrutiCentsOffset(s, scale, microtonal);
      rows.push({
        semitone: s,
        label,
        short: label,
        inScale,
        cents,
      });
    }
    return rows;
  }, [
    isPerc,
    activeTrack?.role,
    scale,
    scaleFilterOnly,
    rootMidi,
    tradition,
    notationMode,
    locale,
    microtonal,
  ]);

  const handleCellClick = (semitone: number, step: number) => {
    if (!activeTrack) return;
    const existing = activeTrack.notes.find(
      (n) => n.semitoneOffset === semitone && n.step === step
    );

    if (toolMode === 'ornament' && existing && !isPerc) {
      const idx = GAMAKA_OPTIONS.findIndex((g) => g.id === existing.gamaka);
      const nextGamaka = GAMAKA_OPTIONS[(idx + 1) % GAMAKA_OPTIONS.length].id;
      const updated = activeTrack.notes.map((n) =>
        n.id === existing.id ? {...n, gamaka: nextGamaka} : n
      );
      onUpdateTrackNotes(activeTrack.id, updated);
      void audioEngine.previewNote(activeTrack.instrument, semitone, nextGamaka, 0.4, 0.85);
      return;
    }

    if (existing) {
      onUpdateTrackNotes(
        activeTrack.id,
        activeTrack.notes.filter((n) => n.id !== existing.id)
      );
      return;
    }

    const maxDur = Math.max(1, Math.min(brushDuration, tala.totalSteps - step));
    const newNote: NoteEvent = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      step,
      durationSteps: isPerc ? 1 : maxDur,
      semitoneOffset: semitone,
      velocity: step % tala.stepsPerBeat === 0 ? 0.92 : 0.8,
      gamaka: isPerc ? 'none' : brushGamaka,
    };

    onUpdateTrackNotes(activeTrack.id, [...activeTrack.notes, newNote]);
    void audioEngine.previewNote(
      activeTrack.instrument,
      semitone,
      newNote.gamaka,
      0.38,
      newNote.velocity
    );
  };

  const handleAutoFillTrack = () => {
    if (!activeTrack) return;
    const generated: NoteEvent[] = [];

    if (isPerc) {
      for (let s = 0; s < tala.totalSteps; s++) {
        const isBeat = s % tala.stepsPerBeat === 0;
        const beatIdx = Math.floor(s / tala.stepsPerBeat);
        if (beatIdx === tala.samBeat && isBeat) {
          generated.push(
            {id: `af-${s}-0`, step: s, durationSteps: 1, semitoneOffset: 0, velocity: 0.96, gamaka: 'none'},
            {id: `af-${s}-2`, step: s, durationSteps: 1, semitoneOffset: 2, velocity: 0.88, gamaka: 'none'}
          );
        } else if (isBeat && tala.taliBeats.includes(beatIdx)) {
          generated.push({id: `af-${s}-0`, step: s, durationSteps: 1, semitoneOffset: 0, velocity: 0.86, gamaka: 'none'});
        } else if (isBeat && tala.khaliBeats.includes(beatIdx)) {
          generated.push({id: `af-${s}-5`, step: s, durationSteps: 1, semitoneOffset: 5, velocity: 0.82, gamaka: 'none'});
        } else if (s % 2 === 0) {
          generated.push({id: `af-${s}-4`, step: s, durationSteps: 1, semitoneOffset: 4, velocity: 0.68, gamaka: 'none'});
        } else if (s === tala.totalSteps - 1) {
          generated.push({id: `af-${s}-7`, step: s, durationSteps: 1, semitoneOffset: 7, velocity: 0.78, gamaka: 'none'});
        }
      }
    } else if (activeTrack.role === 'bass') {
      const rootOffset = -12;
      const fifthOffset = scale.semitones.includes(7) ? -5 : -7;
      for (let s = 0; s < tala.totalSteps; s += Math.max(2, tala.stepsPerBeat * 2)) {
        const useRoot = s === 0 || s >= tala.totalSteps - 4;
        generated.push({
          id: `af-b-${s}`,
          step: s,
          durationSteps: Math.min(4, tala.totalSteps - s),
          semitoneOffset: useRoot ? rootOffset : fifthOffset,
          velocity: 0.86,
          gamaka: 'none',
        });
      }
    } else {
      const allowed = scale.semitones;
      let cursor = 0;
      while (cursor < tala.totalSteps) {
        const dur = cursor % 4 === 0 ? 2 : 1;
        const idx =
          cursor === 0
            ? 0
            : Math.floor((Math.sin(cursor * 1.3 + allowed.length) * 0.5 + 0.5) * allowed.length);
        const deg = allowed[idx % allowed.length];
        const oct = cursor >= tala.totalSteps / 2 && deg < 5 ? 12 : 0;
        generated.push({
          id: `af-m-${cursor}`,
          step: cursor,
          durationSteps: Math.min(dur, tala.totalSteps - cursor),
          semitoneOffset: deg + oct,
          velocity: cursor % tala.stepsPerBeat === 0 ? 0.9 : 0.78,
          gamaka:
            tradition !== 'western' && cursor % 3 === 1
              ? 'kampita'
              : tradition !== 'western' && cursor % 5 === 2
                ? 'meend'
                : 'none',
        });
        cursor += dur;
      }
    }

    onUpdateTrackNotes(activeTrack.id, generated);
  };

  const handleInsertSwaraPhrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrack || isPerc) return;
    const parsed = parseSwaraPhraseToNotes(swaraPhrase, scale, tala.totalSteps, 1);
    if (parsed.length === 0) {
      showFeedback('No valid swaras recognized (use S R1 R2 G2 G3 M1 M2 P D1 D2 N2 N3)');
      return;
    }
    onUpdateTrackNotes(activeTrack.id, parsed);
    showFeedback(`Inserted ${parsed.length} Swara notes`);
  };

  const handleGenerateTihai = () => {
    if (!activeTrack) return;
    const notes = generateTihaiCadence(scale, tala, isPerc);
    onUpdateTrackNotes(activeTrack.id, notes);
    showFeedback('Generated 3-fold Tihai cadence landing on Sam');
  };

  const handleSangatiVariation = () => {
    if (!activeTrack || isPerc) return;
    if (activeTrack.notes.length === 0) {
      showFeedback('Add notes first before creating a Sangati variation');
      return;
    }
    const varied = applySangatiVariation(activeTrack.notes, scale, tala);
    onUpdateTrackNotes(activeTrack.id, varied);
    showFeedback('Applied Sangati ornamental variation');
  };

  const handleStampHarmonyChord = () => {
    if (!activeTrack || isPerc) return;
    const half = Math.max(4, Math.floor(tala.totalSteps / 2));
    const firstChord = generateChordStampNotes('maj7_lydian', scale, 0, half);
    const secondChord = generateChordStampNotes(
      'sus2_modal',
      scale,
      half,
      Math.max(2, tala.totalSteps - half)
    );
    onUpdateTrackNotes(activeTrack.id, [...firstChord, ...secondChord]);
    showFeedback('Stamped modal harmony voicings across bar');
  };

  const handleShiftOctave = (delta: number) => {
    if (!activeTrack || isPerc) return;
    const shifted = activeTrack.notes.map((n) => ({
      ...n,
      semitoneOffset: Math.max(-12, Math.min(24, n.semitoneOffset + delta * 12)),
    }));
    onUpdateTrackNotes(activeTrack.id, shifted);
  };

  const handleQuantizeTrack = () => {
    if (!activeTrack) return;
    if (activeTrack.notes.length === 0) {
      showFeedback('No notes on track');
      return;
    }
    const result = quantizeTrackNotes(activeTrack.notes, quantizeDivision, tala, true);
    onUpdateTrackNotes(activeTrack.id, result.notes);
    const scopeLabel = result.scope === 'recorded' ? 'recorded' : 'track';
    if (result.quantizedCount > 0) {
      showFeedback(`Snapped ${result.quantizedCount} ${scopeLabel} to ${quantizeDivision}`);
    } else {
      showFeedback(`Aligned to ${quantizeDivision} grid`);
    }
  };

  return (
    <section
      aria-label="Multi-Track Step Sequencer and Swara Roll"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] overflow-hidden"
    >
      {/* Track Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 bg-slate-50/70 dark:bg-[#0E121B]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {tracks.map((trk) => {
            const active = trk.id === activeTrack?.id;
            return (
              <button
                key={trk.id}
                type="button"
                onClick={() => onSelectTrack(trk.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                    : 'bg-white dark:bg-[#161C28] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
                }`}
              >
                <span className="truncate max-w-[140px]">{trk.name}</span>
                {trk.muted && <span className="opacity-65 text-[10px]">(M)</span>}
              </button>
            );
          })}
        </div>

        {/* Notation toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 dark:bg-[#0B0E14] p-0.5 shrink-0">
          {(['swara', 'western', 'both'] as NotationMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onNotationModeChange(m)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 ${
                notationMode === m
                  ? 'bg-white dark:bg-[#1E2534] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Sequencer Brush & Composing Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {!isPerc && (
            <>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setToolMode('draw')}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap shrink-0 ${
                    toolMode === 'draw'
                      ? 'bg-slate-900 text-white dark:bg-amber-500/20 dark:text-amber-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {strings.sequencer.drawNote}
                </button>
                <button
                  type="button"
                  onClick={() => setToolMode('ornament')}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap shrink-0 ${
                    toolMode === 'ornament'
                      ? 'bg-slate-900 text-white dark:bg-amber-500/20 dark:text-amber-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {strings.sequencer.cycleGamaka}
                </button>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500 dark:text-slate-400 mr-0.5">Len:</span>
                {[1, 2, 4].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setBrushDuration(d)}
                    className={`w-7 h-7 rounded-md font-mono-tabular font-medium ${
                      brushDuration === d
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'bg-slate-100 dark:bg-[#0B0E14] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span>Gamaka:</span>
                <select
                  value={brushGamaka}
                  onChange={(e) => setBrushGamaka(e.target.value as GamakaType)}
                  className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                >
                  {GAMAKA_OPTIONS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {getLocalizedGamakaName(g.id, locale)} ({g.symbol})
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => setScaleFilterOnly((v) => !v)}
                className={`px-2.5 py-1 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 ${
                  scaleFilterOnly
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {scaleFilterOnly ? strings.sequencer.inRagaLock : strings.sequencer.chromaticAll}
              </button>
            </>
          )}
          {isPerc && (
            <span className="text-slate-500 dark:text-slate-400">
              {getTalaDisplayName(tala, locale)} · Click lanes to place percussion bols / accents.
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {!isPerc && (
            <>
              <button
                type="button"
                onClick={() => handleShiftOctave(1)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleShiftOctave(-1);
                }}
                title="Click +1 octave, right-click -1 octave"
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
                Oct
              </button>
              <button
                type="button"
                onClick={handleSangatiVariation}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-amber-500/50 whitespace-nowrap"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                {strings.sequencer.sangati}
              </button>
              <button
                type="button"
                onClick={handleStampHarmonyChord}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-amber-500/50 whitespace-nowrap"
              >
                <Music className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                {strings.sequencer.chordStamp}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleGenerateTihai}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-amber-500/50 whitespace-nowrap"
          >
            <Repeat className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            {strings.sequencer.tihai}
          </button>
          <button
            type="button"
            onClick={handleAutoFillTrack}
            className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            {strings.sequencer.autoPhrase}
          </button>
          <button
            type="button"
            onClick={() => activeTrack && onUpdateTrackNotes(activeTrack.id, [])}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap"
          >
            <Eraser className="w-3.5 h-3.5" aria-hidden="true" />
            {strings.sequencer.clear}
          </button>
        </div>
      </div>

      {/* Quantization, Live Snap & SwaraScript Quick Phrase Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-2 text-xs bg-slate-50/40 dark:bg-[#0F141E]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <Magnet className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span>{strings.sequencer.quantizeGrid}</span>
          </div>

          <div
            role="group"
            aria-label="Quantization note duration"
            className="flex items-center gap-0.5 rounded-lg bg-slate-200/70 dark:bg-[#0B0E14] p-0.5"
          >
            {QUANTIZE_DIVISIONS.map((div) => {
              const active = quantizeDivision === div;
              return (
                <button
                  key={div}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onQuantizeDivisionChange(div)}
                  className={`px-2.5 py-1 rounded-md font-mono-tabular text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {div}
                </button>
              );
            })}
          </div>

          <span className="font-mono-tabular text-[11px] text-slate-500 dark:text-slate-400">
            {quantInterval} {quantInterval === 1 ? 'step' : 'steps'}
          </span>

          <button
            type="button"
            aria-pressed={autoQuantize}
            onClick={() => onAutoQuantizeChange(!autoQuantize)}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              autoQuantize
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {autoQuantize ? strings.sequencer.liveSnapOn : strings.sequencer.liveSnapOff}
          </button>

          <button
            type="button"
            onClick={handleQuantizeTrack}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 transition-colors whitespace-nowrap shrink-0"
          >
            <Magnet className="w-3.5 h-3.5" aria-hidden="true" />
            {recordedNoteCount > 0
              ? `${strings.sequencer.quantizeRecorded} (${recordedNoteCount})`
              : strings.sequencer.quantizeTrack}
          </button>
        </div>

        {/* SwaraScript Direct Phrase Entry */}
        {!isPerc && (
          <form onSubmit={handleInsertSwaraPhrase} className="flex items-center gap-1.5">
            <input
              type="text"
              value={swaraPhrase}
              onChange={(e) => setSwaraPhrase(e.target.value)}
              placeholder={strings.sequencer.swaraInputPlaceholder}
              aria-label="Enter Swara phrase notation"
              className="w-56 sm:w-64 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] px-2.5 py-1 font-mono-tabular text-xs text-slate-800 dark:text-slate-200 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-2.5 py-1 text-xs font-medium whitespace-nowrap"
            >
              {strings.sequencer.applyPhrase}
            </button>
          </form>
        )}

        {quantizeFeedback && (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {quantizeFeedback}
          </span>
        )}
      </div>

      {/* Step Ruler + Matrix */}
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div
            className="grid border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E121B]"
            style={{
              gridTemplateColumns: `164px repeat(${tala.totalSteps}, minmax(34px, 1fr))`,
            }}
          >
            <div className="px-3 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span>{isPerc ? 'Stroke Voice' : 'Swara · Pitch'}</span>
            </div>
            {Array.from({length: tala.totalSteps}).map((_, step) => {
              const isBeat = step % tala.stepsPerBeat === 0;
              const isQuantAnchor = step % quantInterval === 0;
              const beatNum = Math.floor(step / tala.stepsPerBeat) + 1;
              const isActive = isPlaying && currentStep === step;
              return (
                <div
                  key={step}
                  className={`py-1.5 text-center font-mono-tabular text-[11px] border-r relative ${
                    isQuantAnchor
                      ? 'border-amber-500/35 dark:border-amber-500/25'
                      : 'border-slate-200/70 dark:border-slate-800/70'
                  } ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : isBeat
                        ? 'text-slate-800 dark:text-slate-200 font-semibold'
                        : isQuantAnchor
                          ? 'text-amber-600 dark:text-amber-400 font-medium'
                          : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {isQuantAnchor && !isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-amber-500/80"
                    />
                  )}
                  {isBeat ? beatNum : '·'}
                </div>
              );
            })}
          </div>

          <div className="max-h-[370px] overflow-y-auto divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {pitchRows.map((row) => {
              const isRoot = !isPerc && ((row.semitone % 12) + 12) % 12 === 0;
              return (
                <div
                  key={row.semitone}
                  className={`grid items-stretch ${isRoot ? 'bg-amber-500/[0.04]' : ''}`}
                  style={{
                    gridTemplateColumns: `164px repeat(${tala.totalSteps}, minmax(34px, 1fr))`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      activeTrack &&
                      audioEngine.previewNote(activeTrack.instrument, row.semitone, 'none', 0.35, 0.85)
                    }
                    className="px-3 py-1.5 text-left border-r border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span
                      className={`text-xs truncate ${
                        isRoot
                          ? 'font-bold text-amber-600 dark:text-amber-400'
                          : row.inScale
                            ? 'font-medium text-slate-800 dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {row.label}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      {!isPerc && microtonal && row.cents !== 0 && (
                        <span className="font-mono-tabular text-[10px] text-slate-400">
                          {row.cents > 0 ? `+${row.cents}` : row.cents}¢
                        </span>
                      )}
                      <Volume2 className="w-3 h-3 text-slate-400 opacity-60" aria-hidden="true" />
                    </span>
                  </button>

                  {Array.from({length: tala.totalSteps}).map((_, step) => {
                    const note = activeTrack?.notes.find(
                      (n) => n.semitoneOffset === row.semitone && n.step === step
                    );
                    const coveredByPrev = activeTrack?.notes.find(
                      (n) =>
                        n.semitoneOffset === row.semitone &&
                        step > n.step &&
                        step < n.step + n.durationSteps
                    );
                    const isBeatStart = step % tala.stepsPerBeat === 0;
                    const isQuantAnchor = step % quantInterval === 0;
                    const isPlayhead = isPlaying && currentStep === step;
                    const gamakaMeta = GAMAKA_OPTIONS.find((g) => g.id === note?.gamaka);

                    return (
                      <button
                        key={step}
                        type="button"
                        aria-label={`${row.label} step ${step + 1}${note?.recorded ? ' (recorded)' : ''}`}
                        title={
                          note?.recorded && typeof note.rawStep === 'number'
                            ? `Recorded (raw step ${(note.rawStep + 1).toFixed(2)} → step ${note.step + 1})`
                            : undefined
                        }
                        onClick={() => handleCellClick(row.semitone, step)}
                        className={`h-8 border-r relative flex items-center justify-center transition-colors ${
                          isQuantAnchor
                            ? 'border-amber-500/30 dark:border-amber-500/20'
                            : isBeatStart
                              ? 'border-slate-300 dark:border-slate-700'
                              : 'border-slate-200/50 dark:border-slate-800/50'
                        } ${
                          isPlayhead
                            ? 'bg-amber-500/15'
                            : isQuantAnchor
                              ? 'bg-amber-500/[0.03] hover:bg-slate-100 dark:hover:bg-slate-800/40'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {note && (
                          <span
                            className={`inset-0.5 absolute rounded-md flex items-center justify-center text-[11px] font-mono-tabular font-semibold shadow-xs ${
                              isPlayhead
                                ? 'bg-amber-400 text-slate-950'
                                : note.recorded
                                  ? 'bg-emerald-400 text-slate-950'
                                  : 'bg-amber-500/90 text-slate-950'
                            }`}
                          >
                            {!isPerc && note.gamaka !== 'none'
                              ? gamakaMeta?.symbol
                              : note.durationSteps > 1
                                ? `${note.durationSteps}`
                                : '●'}
                          </span>
                        )}
                        {!note && coveredByPrev && (
                          <span
                            className={`inset-y-1.5 inset-x-0.5 absolute rounded-xs ${
                              coveredByPrev.recorded
                                ? 'bg-emerald-400/35 border border-emerald-400/45'
                                : 'bg-amber-500/35 border border-amber-500/40'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
