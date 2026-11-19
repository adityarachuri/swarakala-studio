import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Check,
  Compass,
  Copy,
  FolderOpen,
  Play,
  Plus,
  RotateCcw,
  Search,
  Square,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  buildDiscoveryArchive,
  DIFFICULTY_META,
  HISTORICAL_ERA_META,
  RASA_META,
  type DifficultyLevel,
  type DiscoveryEntry,
  type DiscoveryKind,
  type HistoricalEraId,
  type RasaId,
} from '../data/discoveryArchive';
import {audioEngine} from '../engine/audioEngine';
import {STUDIO_STRINGS} from '../i18n/studioLocale';
import type {StudioLocale, StudioSession, TraditionId} from '../types/studio';

interface LibraryViewProps {
  sessions: StudioSession[];
  activeSessionId: string;
  activeScaleId: string;
  activeTalaId: string;
  locale: StudioLocale;
  onLoadSession: (s: StudioSession) => void;
  onDuplicateSession: (s: StudioSession) => void;
  onDeleteSession: (id: string) => void;
  onCreateBlankSession: (tradition: TraditionId) => void;
  onImportSessionJson: (s: StudioSession) => void;
  onLoadScaleId: (scaleId: string) => void;
  onLoadTalaId: (talaId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  sessions,
  activeSessionId,
  activeScaleId,
  activeTalaId,
  locale,
  onLoadSession,
  onDuplicateSession,
  onDeleteSession,
  onCreateBlankSession,
  onImportSessionJson,
  onLoadScaleId,
  onLoadTalaId,
}) => {
  const strings = STUDIO_STRINGS[locale];
  const [librarySectionView, setLibrarySectionView] = useState<'all' | 'discovery' | 'sessions'>('all');

  // Saved Sessions state
  const [query, setQuery] = useState('');
  const [filterTradition, setFilterTradition] = useState<'all' | TraditionId>('all');
  const [importError, setImportError] = useState<string | null>(null);
  const [heroImgError, setHeroImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Raga & Tala Discovery Engine state
  const [discSearch, setDiscSearch] = useState('');
  const [discKind, setDiscKind] = useState<'all' | DiscoveryKind>('all');
  const [discTradition, setDiscTradition] = useState<'all' | TraditionId>('all');
  const [discRasa, setDiscRasa] = useState<'all' | RasaId>('all');
  const [discDifficulty, setDiscDifficulty] = useState<'all' | DifficultyLevel>('all');
  const [discEra, setDiscEra] = useState<'all' | HistoricalEraId>('all');
  const [playingUid, setPlayingUid] = useState<string | null>(null);
  const [loadedBanner, setLoadedBanner] = useState<string | null>(null);
  const previewTimersRef = useRef<number[]>([]);

  const allArchiveEntries = useMemo(() => buildDiscoveryArchive(locale), [locale]);

  const filteredDiscovery = useMemo(() => {
    const q = discSearch.trim().toLowerCase();
    return allArchiveEntries.filter((entry) => {
      if (discKind !== 'all' && entry.kind !== discKind) return false;
      if (discTradition !== 'all' && entry.tradition !== discTradition) return false;
      if (discRasa !== 'all' && !entry.rasas.includes(discRasa)) return false;
      if (discDifficulty !== 'all' && entry.difficulty !== discDifficulty) return false;
      if (discEra !== 'all' && entry.historicalEra !== discEra) return false;
      if (!q) return true;
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.nameTe.toLowerCase().includes(q) ||
        entry.nameSa.toLowerCase().includes(q) ||
        entry.subtitle.toLowerCase().includes(q) ||
        entry.signatureLabel.toLowerCase().includes(q) ||
        entry.timeOrMetricLabel.toLowerCase().includes(q) ||
        entry.treatiseCitation.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q)
      );
    });
  }, [
    allArchiveEntries,
    discSearch,
    discKind,
    discTradition,
    discRasa,
    discDifficulty,
    discEra,
  ]);

  const stopPreview = () => {
    previewTimersRef.current.forEach((id) => window.clearTimeout(id));
    previewTimersRef.current = [];
    setPlayingUid(null);
  };

  useEffect(() => {
    return () => {
      previewTimersRef.current.forEach((id) => window.clearTimeout(id));
      previewTimersRef.current = [];
    };
  }, []);

  const auditionEntry = (entry: DiscoveryEntry) => {
    if (playingUid === entry.uid) {
      stopPreview();
      return;
    }
    stopPreview();
    setPlayingUid(entry.uid);

    if (entry.kind === 'raga') {
      const notes = entry.previewSemitones;
      notes.forEach((semi, idx) => {
        const tid = window.setTimeout(() => {
          void audioEngine.previewNote(entry.previewInstrument, semi, 'none', 0.28, 0.86);
          if (idx === notes.length - 1) {
            const endId = window.setTimeout(() => setPlayingUid(null), 320);
            previewTimersRef.current.push(endId);
          }
        }, idx * 240);
        previewTimersRef.current.push(tid);
      });
    } else {
      const totalBeats = Math.min(16, Math.max(3, entry.previewBeats ?? 8));
      const taliSet = new Set(entry.previewTaliBeats ?? [0]);
      for (let b = 0; b < totalBeats; b++) {
        const isSam = b === 0;
        const isTali = taliSet.has(b);
        const pitch = isSam ? 0 : isTali ? 5 : 4;
        const vel = isSam ? 0.96 : isTali ? 0.78 : 0.48;
        const tid = window.setTimeout(() => {
          void audioEngine.previewNote(entry.previewInstrument, pitch, 'none', 0.24, vel);
          if (b === totalBeats - 1) {
            const endId = window.setTimeout(() => setPlayingUid(null), 320);
            previewTimersRef.current.push(endId);
          }
        }, b * 300);
        previewTimersRef.current.push(tid);
      }
    }
  };

  const handleLoadIntoStudio = (entry: DiscoveryEntry) => {
    if (entry.kind === 'raga') {
      onLoadScaleId(entry.targetId);
      setLoadedBanner(`Loaded Raga/Scale "${entry.name}" into active studio session.`);
    } else {
      onLoadTalaId(entry.targetId);
      setLoadedBanner(`Applied Tala/Meter "${entry.name}" to active studio session.`);
    }
  };

  const resetDiscoveryFilters = () => {
    setDiscSearch('');
    setDiscKind('all');
    setDiscTradition('all');
    setDiscRasa('all');
    setDiscDifficulty('all');
    setDiscEra('all');
  };

  const hasActiveDiscoveryFilters =
    discSearch.trim() !== '' ||
    discKind !== 'all' ||
    discTradition !== 'all' ||
    discRasa !== 'all' ||
    discDifficulty !== 'all' ||
    discEra !== 'all';

  const getLocalizedRasaName = (id: RasaId): string => {
    const item = RASA_META.find((r) => r.id === id);
    if (!item) return id;
    if (locale === 'te') return item.te;
    if (locale === 'sa') return item.sa;
    return item.en.split(' ')[0];
  };

  const getLocalizedDifficultyName = (id: DifficultyLevel): string => {
    const item = DIFFICULTY_META.find((d) => d.id === id);
    if (!item) return id;
    if (locale === 'te') return item.te;
    if (locale === 'sa') return item.sa;
    return item.en.split(' ')[0];
  };

  const getLocalizedEraName = (id: HistoricalEraId): string => {
    const item = HISTORICAL_ERA_META.find((e) => e.id === id);
    if (!item) return id;
    if (locale === 'te') return item.te;
    if (locale === 'sa') return item.sa;
    return item.en;
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesTradition = filterTradition === 'all' || s.tradition === filterTradition;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q) ||
      s.scaleId.toLowerCase().includes(q);
    return matchesTradition && matchesQuery;
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Session file exceeds the 2 MB security size limit.');
      }
      const text = await file.text();
      const raw = JSON.parse(text) as Record<string, unknown>;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new Error('Invalid SwaraKala session JSON root.');
      }
      if (typeof raw.title !== 'string' || !raw.title.trim() || !Array.isArray(raw.tracks)) {
        throw new Error('Invalid SwaraKala session JSON structure.');
      }
      const tradition =
        raw.tradition === 'carnatic' || raw.tradition === 'hindustani' || raw.tradition === 'western'
          ? raw.tradition
          : 'carnatic';
      const bpmNum = Number(raw.bpm);
      const bpm = Number.isFinite(bpmNum) ? Math.max(40, Math.min(200, Math.round(bpmNum))) : 96;
      const rootNum = Number(raw.rootMidi);
      const rootMidi = Number.isFinite(rootNum) ? Math.max(36, Math.min(84, Math.round(rootNum))) : 60;
      const a4Num = Number(raw.a4Hz);
      const a4Hz = Number.isFinite(a4Num) ? Math.max(415, Math.min(466, Math.round(a4Num))) : 440;

      const sanitizedTracks = raw.tracks.slice(0, 8).map((tr, tIdx) => {
        const trObj = (tr && typeof tr === 'object' ? tr : {}) as Record<string, unknown>;
        const notesRaw = Array.isArray(trObj.notes) ? trObj.notes : [];
        return {
          id: typeof trObj.id === 'string' ? trObj.id.slice(0, 48) : `imp-trk-${tIdx}`,
          name: typeof trObj.name === 'string' ? trObj.name.slice(0, 64) : `Track ${tIdx + 1}`,
          role:
            trObj.role === 'melody' || trObj.role === 'harmony' || trObj.role === 'bass' || trObj.role === 'percussion'
              ? trObj.role
              : 'melody',
          instrument: typeof trObj.instrument === 'string' ? trObj.instrument.slice(0, 32) : 'piano',
          volume: Math.max(0, Math.min(1, Number(trObj.volume ?? 0.85) || 0.85)),
          pan: Math.max(-1, Math.min(1, Number(trObj.pan ?? 0) || 0)),
          reverbSend: Math.max(0, Math.min(1, Number(trObj.reverbSend ?? 0.35) || 0.35)),
          muted: Boolean(trObj.muted),
          solo: Boolean(trObj.solo),
          notes: notesRaw.slice(0, 256).map((n, nIdx) => {
            const no = (n && typeof n === 'object' ? n : {}) as Record<string, unknown>;
            return {
              id: typeof no.id === 'string' ? no.id.slice(0, 48) : `imp-n-${tIdx}-${nIdx}`,
              step: Math.max(0, Math.min(63, Math.round(Number(no.step ?? 0) || 0))),
              durationSteps: Math.max(1, Math.min(32, Math.round(Number(no.durationSteps ?? 1) || 1))),
              semitoneOffset: Math.max(-24, Math.min(36, Math.round(Number(no.semitoneOffset ?? 0) || 0))),
              velocity: Math.max(0.1, Math.min(1, Number(no.velocity ?? 0.85) || 0.85)),
              gamaka: typeof no.gamaka === 'string' ? no.gamaka.slice(0, 16) : 'none',
            };
          }),
        };
      });

      const parsed = raw as unknown as StudioSession;
      onImportSessionJson({
        ...parsed,
        id: `imp-${Date.now()}`,
        title: String(raw.title).trim().slice(0, 96),
        subtitle: typeof raw.subtitle === 'string' ? raw.subtitle.slice(0, 140) : 'Imported Studio Session',
        tradition,
        bpm,
        rootMidi,
        a4Hz,
        tracks: sanitizedTracks as StudioSession['tracks'],
        isReferenceTemplate: false,
        updatedAt: Date.now(),
      });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Unable to parse session file.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Room Banner */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#121721] grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-5 relative min-h-[200px] bg-slate-900">
          {!heroImgError ? (
            <img
              src="/src/assets/images/studio_master_console_1795064054743.jpg"
              alt="SwaraKala Studio analog mixing console and live room with grand piano and Saraswati veena"
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              onError={() => setHeroImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/60" />
          )}
        </div>
        <div className="lg:col-span-7 p-6 flex flex-col justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              {strings.nav.library} · Offline Studio Vault &amp; Archive Discovery
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
              Search offline Raga, Melakarta, Mode, and Tala archives by Rasa, difficulty, and era, or manage your IndexedDB multi-section compositions and WAV/MIDI exports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onCreateBlankSession('carnatic')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              New Carnatic
            </button>
            <button
              type="button"
              onClick={() => onCreateBlankSession('hindustani')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              New Hindustani
            </button>
            <button
              type="button"
              onClick={() => onCreateBlankSession('western')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              New Western / Score
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {importError && <p className="text-xs text-red-500">{importError}</p>}
        </div>
      </div>

      {/* Sub-view switcher for fast focus */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Library sections"
          className="flex items-center gap-1 rounded-lg bg-slate-200/70 dark:bg-[#121721] p-1 border border-slate-200 dark:border-slate-800"
        >
          {(
            [
              {id: 'all', label: 'All Library'},
              {id: 'discovery', label: `Raga & Tala Discovery (${allArchiveEntries.length})`},
              {id: 'sessions', label: `Saved Sessions (${sessions.length})`},
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={librarySectionView === tab.id}
              onClick={() => setLibrarySectionView(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                librarySectionView === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loadedBanner && (
          <div role="status" className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{loadedBanner}</span>
          </div>
        )}
      </div>

      {/* RAGA & TALA DISCOVERY ENGINE */}
      {(librarySectionView === 'all' || librarySectionView === 'discovery') && (
        <section
          aria-label="Raga and Tala Discovery Engine"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-6 space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-start gap-2.5">
              <Compass className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  {strings.discovery.heading}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {strings.discovery.subheading}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
              <span>
                {filteredDiscovery.length} / {allArchiveEntries.length} matching
              </span>
              {hasActiveDiscoveryFilters && (
                <button
                  type="button"
                  onClick={resetDiscoveryFilters}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs font-sans font-medium text-slate-700 dark:text-slate-200 hover:border-amber-500"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  {strings.discovery.clearFilters}
                </button>
              )}
            </div>
          </div>

          {/* Search & Multi-Facet Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Full-Text Archive Search */}
            <div className="relative lg:col-span-4">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search Raga and Tala local archive"
                value={discSearch}
                onChange={(e) => setDiscSearch(e.target.value)}
                placeholder={strings.discovery.searchPlaceholder}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Type Toggle */}
            <div className="lg:col-span-2">
              <select
                aria-label="Archive Entry Type"
                value={discKind}
                onChange={(e) => setDiscKind(e.target.value as 'all' | DiscoveryKind)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] px-2.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="all">{strings.discovery.allTypes}</option>
                <option value="raga">{strings.discovery.ragasOnly}</option>
                <option value="tala">{strings.discovery.talasOnly}</option>
              </select>
            </div>

            {/* Mood (Rasa) Filter */}
            <div className="lg:col-span-2">
              <select
                aria-label="Filter by Mood or Rasa"
                value={discRasa}
                onChange={(e) => setDiscRasa(e.target.value as 'all' | RasaId)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] px-2.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="all">{strings.discovery.allRasas}</option>
                {RASA_META.map((r) => (
                  <option key={r.id} value={r.id}>
                    {locale === 'te' ? r.te : locale === 'sa' ? r.sa : r.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="lg:col-span-2">
              <select
                aria-label="Filter by Difficulty"
                value={discDifficulty}
                onChange={(e) => setDiscDifficulty(e.target.value as 'all' | DifficultyLevel)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] px-2.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="all">{strings.discovery.allDifficulties}</option>
                {DIFFICULTY_META.map((d) => (
                  <option key={d.id} value={d.id}>
                    {locale === 'te' ? d.te : locale === 'sa' ? d.sa : d.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Historical Era Filter */}
            <div className="lg:col-span-2">
              <select
                aria-label="Filter by Historical Era"
                value={discEra}
                onChange={(e) => setDiscEra(e.target.value as 'all' | HistoricalEraId)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] px-2.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="all">{strings.discovery.allEras}</option>
                {HISTORICAL_ERA_META.map((era) => (
                  <option key={era.id} value={era.id}>
                    {locale === 'te' ? era.te : locale === 'sa' ? era.sa : `${era.en} (${era.span})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Tradition Sub-Row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'carnatic', 'hindustani', 'western'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDiscTradition(t)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  discTradition === t
                    ? 'bg-slate-900 text-white dark:bg-amber-500/20 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-[#0E121B] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t === 'all' ? 'All Traditions' : strings.traditions[t]}
              </button>
            ))}
          </div>

          {/* Discovery Results Grid */}
          {filteredDiscovery.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No Ragas or Talas match the current Rasa, Difficulty, and Historical Era filters.
              </p>
              <button
                type="button"
                onClick={resetDiscoveryFilters}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                {strings.discovery.clearFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[640px] overflow-y-auto pr-1">
              {filteredDiscovery.map((entry) => {
                const isActive =
                  (entry.kind === 'raga' && entry.targetId === activeScaleId) ||
                  (entry.kind === 'tala' && entry.targetId === activeTalaId);
                const isAuditioning = playingUid === entry.uid;

                return (
                  <article
                    key={entry.uid}
                    className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/[0.06]'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0E121B]'
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Header Metadata Line (Zero static pills) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold uppercase text-amber-600 dark:text-amber-400">
                          {entry.kind === 'raga' ? 'Raga / Mode' : 'Tala / Meter'} ·{' '}
                          {entry.tradition}
                        </span>
                        <span className="font-mono-tabular">
                          {getLocalizedDifficultyName(entry.difficulty)}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {entry.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {entry.subtitle}
                        </p>
                      </div>

                      <p className="font-mono-tabular text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-[#121721] rounded-md px-2.5 py-1.5 border border-slate-200/80 dark:border-slate-800">
                        {entry.signatureLabel}
                      </p>

                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {entry.description}
                      </p>

                      <div className="text-[11px] space-y-1 pt-1 text-slate-500 dark:text-slate-400">
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Rasa:
                          </span>{' '}
                          {entry.rasas.map(getLocalizedRasaName).join(' · ')}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Era:
                          </span>{' '}
                          {getLocalizedEraName(entry.historicalEra)} ({entry.eraDetail})
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Source:
                          </span>{' '}
                          {entry.treatiseCitation}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => auditionEntry(entry)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          isAuditioning
                            ? 'border-red-500 bg-red-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121721] text-slate-700 dark:text-slate-200 hover:border-amber-500'
                        }`}
                      >
                        {isAuditioning ? (
                          <Square className="w-3 h-3 fill-current" aria-hidden="true" />
                        ) : (
                          <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                        )}
                        {isAuditioning ? strings.discovery.stopPreview : strings.discovery.audition}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoadIntoStudio(entry)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                        }`}
                      >
                        {isActive && <Check className="w-3 h-3" aria-hidden="true" />}
                        {isActive ? strings.discovery.activeInConsole : strings.discovery.loadIntoConsole}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SAVED STUDIO SESSIONS & REFERENCE TEMPLATES */}
      {(librarySectionView === 'all' || librarySectionView === 'sessions') && (
        <section aria-label="Saved Studio Sessions" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Saved Sessions &amp; Reference Compositions
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search saved sessions..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121721] pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 dark:bg-[#121721] p-1 border border-slate-200 dark:border-slate-800">
                {(['all', 'carnatic', 'hindustani', 'western'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterTradition(t)}
                    className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                      filterTradition === t
                        ? 'bg-white dark:bg-[#1E2534] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t === 'all' ? 'All' : strings.traditions[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No matching studio sessions found.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSessions.map((s) => {
                const isActive = s.id === activeSessionId;
                const sectionCount = s.sections?.length ?? 1;
                return (
                  <div
                    key={s.id}
                    className={`rounded-xl border p-5 flex flex-col justify-between gap-4 transition-colors ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/[0.06] dark:bg-amber-500/[0.06]'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721]'
                    }`}
                  >
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                        <span className="capitalize font-medium text-amber-600 dark:text-amber-400">
                          {strings.traditions[s.tradition]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{s.bpm} BPM</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {sectionCount} {sectionCount === 1 ? 'Section' : 'Sections'}
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {s.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{s.subtitle}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200/70 dark:border-slate-800/70">
                      <button
                        type="button"
                        onClick={() => onLoadSession(s)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-slate-900 hover:opacity-90 whitespace-nowrap shrink-0"
                      >
                        <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                        {isActive ? 'Loaded' : 'Open in Console'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onDuplicateSession(s)}
                          title="Duplicate Session"
                          aria-label={`Duplicate ${s.title}`}
                          className="rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {!s.isReferenceTemplate && (
                          <button
                            type="button"
                            onClick={() => onDeleteSession(s.id)}
                            title="Delete Session"
                            aria-label={`Delete ${s.title}`}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-slate-500 hover:text-red-500 hover:border-red-500/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
