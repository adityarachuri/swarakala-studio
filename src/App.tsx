import React, {lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Check,
  Download,
  Moon,
  Play,
  Save,
  Square,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {REFERENCE_SESSIONS} from './data/presets';
import {
  deleteSession,
  saveSession,
  seedReferenceSessionsIfEmpty,
} from './db/sessionStore';
import {audioEngine} from './engine/audioEngine';
import {
  getQuantizeIntervalSteps,
  getScaleById,
  getScaleDisplayName,
  getTalaById,
  getTalaDisplayName,
  ROOT_PITCH_OPTIONS,
  SCALES_AND_RAGAS,
  snapStepToQuantizeGrid,
  TALAS_AND_METERS,
} from './engine/musicTheory';
import {STUDIO_LOCALE_META, STUDIO_STRINGS} from './i18n/studioLocale';
import type {
  GamakaType,
  MasterBusConfig,
  NotationMode,
  NoteEvent,
  PedagogyNotes,
  QuantizeDivision,
  SongSection,
  StudioLocale,
  StudioSession,
  StudioTrack,
  StudioView,
  TanpuraConfig,
  TraditionId,
} from './types/studio';
import {PWAInstallButton} from './components/PWAInstallButton';
import {OfflineIndicator} from './components/OfflineIndicator';
import {OscilloscopeMeters} from './components/OscilloscopeMeters';
import {TalaWheel} from './components/TalaWheel';
import {SongArrangerBar} from './components/SongArrangerBar';
import {SequencerGrid} from './components/SequencerGrid';
import {MixerConsole} from './components/MixerConsole';
import {LiveKeyboard} from './components/LiveKeyboard';
import {BrandLogo} from './components/BrandLogo';

const AIArchitectView = lazy(() =>
  import('./components/AIArchitectView').then((m) => ({default: m.AIArchitectView}))
);
const PedagogyView = lazy(() =>
  import('./components/PedagogyView').then((m) => ({default: m.PedagogyView}))
);
const LibraryView = lazy(() =>
  import('./components/LibraryView').then((m) => ({default: m.LibraryView}))
);
const ExportModal = lazy(() =>
  import('./components/ExportModal').then((m) => ({default: m.ExportModal}))
);
const StudioStage3D = lazy(() =>
  import('./components/StudioStage3D').then((m) => ({default: m.StudioStage3D}))
);

function ViewChunkFallback({label}: {label: string}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-10 text-center">
      <div className="inline-block w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function ensureSessionSections(sess: StudioSession): {
  sections: SongSection[];
  activeSectionId: string;
} {
  if (sess.sections && sess.sections.length > 0) {
    const activeId =
      sess.activeSectionId && sess.sections.some((s) => s.id === sess.activeSectionId)
        ? sess.activeSectionId
        : sess.sections[0].id;
    return {sections: sess.sections, activeSectionId: activeId};
  }
  const defaultName =
    sess.tradition === 'carnatic'
      ? 'Pallavi'
      : sess.tradition === 'hindustani'
        ? 'Asthai'
        : 'Main Theme';
  return {
    sections: [
      {
        id: 'sec-main',
        name: defaultName,
        roleLabel: defaultName,
        repeats: 1,
        tracks: sess.tracks,
      },
    ],
    activeSectionId: 'sec-main',
  };
}

export default function App() {
  const [sessions, setSessions] = useState<StudioSession[]>(REFERENCE_SESSIONS);
  const [session, setSession] = useState<StudioSession>(REFERENCE_SESSIONS[0]);
  const [activeView, setActiveView] = useState<StudioView>('console');
  const [activeTrackId, setActiveTrackId] = useState<string>(
    REFERENCE_SESSIONS[0].tracks[0].id
  );
  const [locale, setLocale] = useState<StudioLocale>(() => {
    try {
      const saved = window.localStorage.getItem('swarakala_locale');
      if (saved === 'en' || saved === 'te' || saved === 'sa') return saved;
    } catch {
      // Ignore storage failures
    }
    return 'en';
  });
  const [playFullArrangement, setPlayFullArrangement] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [notationMode, setNotationMode] = useState<NotationMode>('both');
  const [quantizeDivision, setQuantizeDivision] = useState<QuantizeDivision>('1/4');
  const [autoQuantize, setAutoQuantize] = useState(false);
  const [recordArmed, setRecordArmed] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const tapTimesRef = useRef<number[]>([]);

  const strings = STUDIO_STRINGS[locale];

  // Persist locale choice
  useEffect(() => {
    try {
      window.localStorage.setItem('swarakala_locale', locale);
    } catch {
      // Ignore
    }
  }, [locale]);

  // Initialize IndexedDB offline vault on startup
  useEffect(() => {
    let mounted = true;
    seedReferenceSessionsIfEmpty(REFERENCE_SESSIONS)
      .then((loaded) => {
        if (mounted && loaded.length > 0) {
          setSessions(loaded);
        }
      })
      .catch(() => {
        // Fallback already in state
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Keep Web Audio engine synchronized with session state
  useEffect(() => {
    audioEngine.setSession(session);
  }, [session]);

  useEffect(() => {
    audioEngine.setMetronome(metronomeOn);
  }, [metronomeOn]);

  useEffect(() => {
    audioEngine.setOnStepChange((step) => setCurrentStep(step));
    return () => audioEngine.setOnStepChange(null);
  }, []);

  useEffect(() => {
    audioEngine.setOnSectionChange((sectionId) => {
      setSession((prev) => {
        if (!prev.sections || prev.activeSectionId === sectionId) return prev;
        const target = prev.sections.find((s) => s.id === sectionId);
        if (!target) return prev;
        return {
          ...prev,
          activeSectionId: sectionId,
          tracks: target.tracks,
        };
      });
    });
    return () => audioEngine.setOnSectionChange(null);
  }, []);

  // Sync Tanpura Drone
  useEffect(() => {
    void audioEngine.syncTanpura(session.tanpura);
  }, [session.tanpura]);

  // Toggle dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const scale = useMemo(() => getScaleById(session.scaleId), [session.scaleId]);
  const tala = useMemo(() => getTalaById(session.talaId), [session.talaId]);
  const activeTrack = useMemo(
    () => session.tracks.find((t) => t.id === activeTrackId) ?? session.tracks[0],
    [session.tracks, activeTrackId]
  );

  const {sections, activeSectionId} = useMemo(() => ensureSessionSections(session), [session]);

  const scaleDropdownOptions = useMemo(() => {
    const exists = SCALES_AND_RAGAS.some((s) => s.id === scale.id);
    return exists ? SCALES_AND_RAGAS : [scale, ...SCALES_AND_RAGAS];
  }, [scale]);

  const talaDropdownOptions = useMemo(() => {
    const exists = TALAS_AND_METERS.some((t) => t.id === tala.id);
    return exists ? TALAS_AND_METERS : [tala, ...TALAS_AND_METERS];
  }, [tala]);

  const handleTogglePlay = useCallback(async () => {
    if (isPlaying) {
      audioEngine.stopTransport();
      setIsPlaying(false);
      setCurrentStep(0);
    } else {
      await audioEngine.startTransport(playFullArrangement ? 0 : currentStep, playFullArrangement);
      setIsPlaying(true);
    }
  }, [isPlaying, currentStep, playFullArrangement]);

  // Spacebar Play/Stop shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') {
        return;
      }
      e.preventDefault();
      void handleTogglePlay();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleTogglePlay]);

  const handleTapTempo = () => {
    const now = performance.now();
    const recent = tapTimesRef.current.filter((t) => now - t < 2500);
    recent.push(now);
    tapTimesRef.current = recent;
    if (recent.length >= 2) {
      let sum = 0;
      for (let i = 1; i < recent.length; i++) sum += recent[i] - recent[i - 1];
      const avgMs = sum / (recent.length - 1);
      const bpm = Math.max(48, Math.min(180, Math.round(60000 / avgMs)));
      setSession((prev) => ({...prev, bpm}));
    }
  };

  const handleTraditionChange = (tradition: TraditionId) => {
    const matchingScale = SCALES_AND_RAGAS.find((s) => s.tradition === tradition) ?? SCALES_AND_RAGAS[0];
    const matchingTala = TALAS_AND_METERS.find((t) => t.tradition === tradition) ?? TALAS_AND_METERS[0];
    setSession((prev) => ({
      ...prev,
      tradition,
      scaleId: matchingScale.id,
      talaId: matchingTala.id,
      totalSteps: matchingTala.totalSteps,
      stepsPerBeat: matchingTala.stepsPerBeat,
      microtonal: tradition !== 'western',
      pedagogy: {
        ...prev.pedagogy,
        arohana: matchingScale.arohanaLabel,
        avarohana: matchingScale.avarohanaLabel,
        vadi: matchingScale.vadi,
        samvadi: matchingScale.samvadi,
        pakad: matchingScale.pakad,
      },
    }));
    setNotationMode(tradition === 'western' ? 'western' : 'both');
  };

  const handleScaleChange = (scaleId: string) => {
    const nextScale = getScaleById(scaleId);
    setSession((prev) => ({
      ...prev,
      scaleId,
      tradition: nextScale.tradition,
      pedagogy: {
        ...prev.pedagogy,
        arohana: nextScale.arohanaLabel,
        avarohana: nextScale.avarohanaLabel,
        vadi: nextScale.vadi,
        samvadi: nextScale.samvadi,
        pakad: nextScale.pakad,
      },
    }));
  };

  const handleTalaChange = (talaId: string) => {
    const nextTala = getTalaById(talaId);
    setSession((prev) => {
      const nextTracks = prev.tracks.map((trk) => ({
        ...trk,
        notes: trk.notes.filter((n) => n.step < nextTala.totalSteps),
      }));
      const nextSections = prev.sections?.map((sec) => ({
        ...sec,
        tracks: sec.tracks.map((trk) => ({
          ...trk,
          notes: trk.notes.filter((n) => n.step < nextTala.totalSteps),
        })),
      }));
      return {
        ...prev,
        talaId,
        totalSteps: nextTala.totalSteps,
        stepsPerBeat: nextTala.stepsPerBeat,
        tracks: nextTracks,
        ...(nextSections ? {sections: nextSections} : {}),
      };
    });
    setCurrentStep(0);
  };

  const syncTracksToActiveSection = (
    prev: StudioSession,
    nextTracks: StudioTrack[]
  ): StudioSession => {
    const {sections: secs, activeSectionId: curSecId} = ensureSessionSections(prev);
    const updatedSections = secs.map((s) =>
      s.id === curSecId ? {...s, tracks: nextTracks} : s
    );
    return {
      ...prev,
      tracks: nextTracks,
      sections: updatedSections,
      activeSectionId: curSecId,
    };
  };

  const handleUpdateTrackNotes = (trackId: string, notes: NoteEvent[]) => {
    setSession((prev) => {
      const nextTracks = prev.tracks.map((t) => (t.id === trackId ? {...t, notes} : t));
      return syncTracksToActiveSection(prev, nextTracks);
    });
  };

  const handleUpdateTrack = (id: string, patch: Partial<StudioTrack>) => {
    setSession((prev) => {
      const nextTracks = prev.tracks.map((t) => (t.id === id ? {...t, ...patch} : t));
      const {sections: secs, activeSectionId: curSecId} = ensureSessionSections(prev);
      const updatedSections = secs.map((sec) => ({
        ...sec,
        tracks: sec.tracks.map((t) =>
          t.id === id || (sec.id === curSecId && t.id === id) ? {...t, ...patch} : t
        ),
      }));
      return {
        ...prev,
        tracks: nextTracks,
        sections: updatedSections,
        activeSectionId: curSecId,
      };
    });
  };

  // Song Arranger section handlers
  const handleSelectSection = (id: string) => {
    setSession((prev) => {
      const {sections: secs, activeSectionId: oldId} = ensureSessionSections(prev);
      const savedPrev = secs.map((s) => (s.id === oldId ? {...s, tracks: prev.tracks} : s));
      const nextSec = savedPrev.find((s) => s.id === id);
      if (!nextSec) return prev;
      return {
        ...prev,
        sections: savedPrev,
        activeSectionId: id,
        tracks: nextSec.tracks,
      };
    });
    setCurrentStep(0);
  };

  const handleAddSection = () => {
    setSession((prev) => {
      const {sections: secs, activeSectionId: oldId} = ensureSessionSections(prev);
      const savedPrev = secs.map((s) => (s.id === oldId ? {...s, tracks: prev.tracks} : s));
      const names =
        prev.tradition === 'carnatic'
          ? ['Pallavi', 'Anupallavi', 'Charanam', 'Chittaswara', 'Madhyamakala']
          : prev.tradition === 'hindustani'
            ? ['Asthai', 'Antara', 'Sanchari', 'Abhog', 'Drut Taan']
            : ['Intro', 'Theme A', 'Theme B', 'Bridge', 'Finale'];
      const nextName = names[savedPrev.length] ?? `Section ${savedPrev.length + 1}`;
      const blankTracks: StudioTrack[] = prev.tracks.map((t) => ({
        ...t,
        notes: [],
      }));
      const newSec: SongSection = {
        id: `sec-${Date.now()}`,
        name: nextName,
        roleLabel: nextName,
        repeats: 1,
        tracks: blankTracks,
      };
      return {
        ...prev,
        sections: [...savedPrev, newSec],
        activeSectionId: newSec.id,
        tracks: blankTracks,
      };
    });
    setCurrentStep(0);
  };

  const handleDuplicateSection = (id: string) => {
    setSession((prev) => {
      const {sections: secs, activeSectionId: oldId} = ensureSessionSections(prev);
      const savedPrev = secs.map((s) => (s.id === oldId ? {...s, tracks: prev.tracks} : s));
      const source = savedPrev.find((s) => s.id === id);
      if (!source) return prev;
      const clonedTracks: StudioTrack[] = source.tracks.map((t) => ({
        ...t,
        notes: t.notes.map((n, idx) => ({
          ...n,
          id: `${n.id}-dup-${Date.now()}-${idx}`,
        })),
      }));
      const cloneSec: SongSection = {
        id: `sec-${Date.now()}`,
        name: `${source.name} II`,
        roleLabel: source.roleLabel || source.name,
        repeats: source.repeats,
        tracks: clonedTracks,
      };
      const idx = savedPrev.findIndex((s) => s.id === id);
      const updated = [...savedPrev];
      updated.splice(idx + 1, 0, cloneSec);
      return {
        ...prev,
        sections: updated,
        activeSectionId: cloneSec.id,
        tracks: clonedTracks,
      };
    });
  };

  const handleDeleteSection = (id: string) => {
    setSession((prev) => {
      const {sections: secs} = ensureSessionSections(prev);
      if (secs.length <= 1) return prev;
      const remaining = secs.filter((s) => s.id !== id);
      const nextActive =
        prev.activeSectionId === id ? remaining[0] : remaining.find((s) => s.id === prev.activeSectionId) ?? remaining[0];
      return {
        ...prev,
        sections: remaining,
        activeSectionId: nextActive.id,
        tracks: nextActive.tracks,
      };
    });
  };

  const handleCycleSectionRepeat = (id: string) => {
    setSession((prev) => {
      const {sections: secs} = ensureSessionSections(prev);
      const updated = secs.map((s) =>
        s.id === id ? {...s, repeats: s.repeats === 1 ? 2 : 1} : s
      );
      return {...prev, sections: updated};
    });
  };

  const handleUpdateTanpura = (patch: Partial<TanpuraConfig>) => {
    setSession((prev) => ({
      ...prev,
      tanpura: {...prev.tanpura, ...patch},
    }));
  };

  const handleUpdateMaster = (patch: Partial<MasterBusConfig>) => {
    setSession((prev) => ({
      ...prev,
      master: {...prev.master, ...patch},
    }));
  };

  const handleLiveNoteTrigger = useCallback(
    (semitoneOffset: number, velocity: number, gamaka: GamakaType) => {
      if (!recordArmed || !activeTrack || activeTrack.role === 'percussion') return;
      const total = Math.max(1, session.totalSteps);
      const preciseStep = audioEngine.getPreciseStep();
      const rawStep =
        preciseStep !== null ? preciseStep : ((currentStep % total) + total) % total;
      const quantInterval = getQuantizeIntervalSteps(quantizeDivision, tala);
      const stepToRecord = autoQuantize
        ? snapStepToQuantizeGrid(rawStep, quantInterval, total)
        : ((Math.round(rawStep) % total) + total) % total;

      const newNote: NoteEvent = {
        id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        step: stepToRecord,
        durationSteps: 1,
        semitoneOffset,
        velocity,
        gamaka,
        rawStep,
        recorded: true,
      };
      setSession((prev) => {
        const nextTracks = prev.tracks.map((t) =>
          t.id === activeTrack.id
            ? {
                ...t,
                notes: [
                  ...t.notes.filter(
                    (n) => !(n.step === stepToRecord && n.semitoneOffset === semitoneOffset)
                  ),
                  newNote,
                ],
              }
            : t
        );
        return syncTracksToActiveSection(prev, nextTracks);
      });
      if (!isPlaying) {
        const advance = autoQuantize ? quantInterval : 1;
        setCurrentStep((s) => (s + advance) % total);
      }
    },
    [
      recordArmed,
      activeTrack,
      currentStep,
      session.totalSteps,
      isPlaying,
      quantizeDivision,
      tala,
      autoQuantize,
    ]
  );

  const handleSaveCurrentSession = async () => {
    const toSave: StudioSession = {
      ...session,
      id: session.isReferenceTemplate ? `usr-${Date.now()}` : session.id,
      isReferenceTemplate: false,
      updatedAt: Date.now(),
    };
    await saveSession(toSave);
    setSession(toSave);
    setSessions((prev) => {
      const rest = prev.filter((s) => s.id !== toSave.id);
      return [toSave, ...rest];
    });
    setSaveFeedback(true);
    window.setTimeout(() => setSaveFeedback(false), 1800);
  };

  const handleLoadSession = (target: StudioSession) => {
    if (isPlaying) {
      audioEngine.stopTransport();
      setIsPlaying(false);
    }
    setCurrentStep(0);
    const {sections: secs, activeSectionId: actSecId} = ensureSessionSections(target);
    const activeSec = secs.find((s) => s.id === actSecId) ?? secs[0];
    const normalized: StudioSession = {
      ...target,
      sections: secs,
      activeSectionId: actSecId,
      tracks: activeSec.tracks,
    };
    setSession(normalized);
    if (normalized.tracks.length > 0) {
      setActiveTrackId(normalized.tracks[0].id);
    }
    setActiveView('console');
  };

  const handleDuplicateSession = async (target: StudioSession) => {
    const copy: StudioSession = {
      ...target,
      id: `dup-${Date.now()}`,
      title: `${target.title} (Copy)`,
      isReferenceTemplate: false,
      updatedAt: Date.now(),
    };
    await saveSession(copy);
    setSessions((prev) => [copy, ...prev]);
    handleLoadSession(copy);
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCreateBlankSession = async (tradition: TraditionId) => {
    const template =
      REFERENCE_SESSIONS.find((r) => r.tradition === tradition) ?? REFERENCE_SESSIONS[0];
    const blankTracks = template.tracks.map((t) => ({...t, notes: []}));
    const blank: StudioSession = {
      ...template,
      id: `new-${Date.now()}`,
      title: `Untitled ${tradition.charAt(0).toUpperCase() + tradition.slice(1)} Sketch`,
      subtitle: `${getScaleById(template.scaleId).name} · ${getTalaById(template.talaId).name}`,
      isReferenceTemplate: false,
      updatedAt: Date.now(),
      tracks: blankTracks,
      sections: [
        {
          id: 'sec-1',
          name:
            tradition === 'carnatic'
              ? 'Pallavi'
              : tradition === 'hindustani'
                ? 'Asthai'
                : 'Main Theme',
          roleLabel:
            tradition === 'carnatic'
              ? 'Pallavi'
              : tradition === 'hindustani'
                ? 'Asthai'
                : 'Main Theme',
          repeats: 1,
          tracks: blankTracks,
        },
      ],
      activeSectionId: 'sec-1',
    };
    await saveSession(blank);
    setSessions((prev) => [blank, ...prev]);
    handleLoadSession(blank);
  };

  const handleApplyAIComposition = (payload: {
    title: string;
    subtitle: string;
    bpm: number;
    tanpuraFifthMode: 'Pa' | 'Ma' | 'Ni';
    tracks: StudioTrack[];
    pedagogy: Partial<PedagogyNotes>;
    isVariation?: boolean;
  }) => {
    const nextTracks = payload.tracks.length > 0 ? payload.tracks : session.tracks;
    const {sections: currentSections, activeSectionId: curSecId} = ensureSessionSections(session);
    const nextSections = payload.isVariation
      ? currentSections.map((sec) =>
          sec.id === curSecId ? {...sec, tracks: nextTracks} : sec
        )
      : [
          {
            id: 'sec-ai-main',
            name:
              session.tradition === 'carnatic'
                ? 'Pallavi'
                : session.tradition === 'hindustani'
                  ? 'Asthai'
                  : 'Main Theme',
            roleLabel:
              session.tradition === 'carnatic'
                ? 'Pallavi'
                : session.tradition === 'hindustani'
                  ? 'Asthai'
                  : 'Main Theme',
            repeats: 1,
            tracks: nextTracks,
          },
        ];

    const updated: StudioSession = {
      ...session,
      id: session.isReferenceTemplate ? `ai-${Date.now()}` : session.id,
      isReferenceTemplate: false,
      title: payload.title || session.title,
      subtitle: payload.subtitle || session.subtitle,
      bpm: payload.bpm || session.bpm,
      tanpura: {
        ...session.tanpura,
        fifthMode: payload.tanpuraFifthMode ?? session.tanpura.fifthMode,
      },
      tracks: nextTracks,
      sections: nextSections,
      activeSectionId: payload.isVariation ? curSecId : 'sec-ai-main',
      pedagogy: {
        ...session.pedagogy,
        ...payload.pedagogy,
        arohana: scale.arohanaLabel,
        avarohana: scale.avarohanaLabel,
        vadi: scale.vadi,
        samvadi: scale.samvadi,
        pakad: scale.pakad,
      },
      updatedAt: Date.now(),
    };
    setSession(updated);
    if (updated.tracks.length > 0) setActiveTrackId(updated.tracks[0].id);
    void saveSession(updated);
    setSessions((prev) => [updated, ...prev.filter((s) => s.id !== updated.id)]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4EF] text-slate-900 dark:bg-[#0B0E14] dark:text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0E121B]/95 backdrop-blur-sm sticky top-0 z-30 print:hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand crest & wordmark lockup */}
          <button
            type="button"
            onClick={() => {
              setActiveView('console');
              window.scrollTo({top: 0, behavior: 'smooth'});
            }}
            className="inline-flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-amber-300 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md"
          >
            <BrandLogo size={28} className="shrink-0" />
            <span>{strings.brandName}</span>
          </button>

          {/* Zone 2: Concise single-line navigation links */}
          <nav aria-label="Studio Workspace Navigation" className="flex items-center gap-5 sm:gap-7 overflow-x-auto">
            {(
              [
                {id: 'console', label: strings.nav.console},
                {id: 'stage3d', label: strings.nav.stage3d},
                {id: 'architect', label: strings.nav.architect},
                {id: 'pedagogy', label: strings.nav.pedagogy},
                {id: 'library', label: strings.nav.library},
              ] as Array<{id: StudioView; label: string}>
            ).map((tab) => {
              const active = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveView(tab.id)}
                  className={`py-1.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-amber-500 text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              {strings.actions.exportMaster}
            </button>
          </div>
        </div>
      </header>

      {/* Studio Transport & Musicological Toolbar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#101520] print:hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Transport & Tempo */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isPlaying
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  {strings.actions.stop}
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  {playFullArrangement ? strings.actions.playSong : strings.actions.playLoop}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMetronomeOn((v) => !v)}
              aria-pressed={metronomeOn}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                metronomeOn
                  ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {metronomeOn ? (
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {strings.actions.talaClick}
            </button>

            <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] overflow-hidden">
              <button
                type="button"
                onClick={handleTapTempo}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap shrink-0"
              >
                {strings.actions.tap}
              </button>
              <input
                type="number"
                min={48}
                max={180}
                aria-label="Tempo in beats per minute"
                value={session.bpm}
                onChange={(e) =>
                  setSession((prev) => ({
                    ...prev,
                    bpm: Math.max(48, Math.min(180, Number(e.target.value) || 80)),
                  }))
                }
                className="w-14 px-2 py-1.5 text-center font-mono-tabular text-xs font-semibold bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <span className="pr-2.5 text-[11px] text-slate-400 font-mono-tabular">BPM</span>
            </div>
          </div>

          {/* Center: Tradition, Raga/Scale, Tala/Meter, Shruti Pitch */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Musical Tradition"
              value={session.tradition}
              onChange={(e) => handleTraditionChange(e.target.value as TraditionId)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="carnatic">{strings.traditions.carnatic}</option>
              <option value="hindustani">{strings.traditions.hindustani}</option>
              <option value="western">{strings.traditions.western}</option>
            </select>

            <select
              aria-label={strings.labels.ragaScale}
              value={session.scaleId}
              onChange={(e) => handleScaleChange(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[190px]"
            >
              {scaleDropdownOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {getScaleDisplayName(s, locale)}
                </option>
              ))}
            </select>

            <select
              aria-label={strings.labels.talaMeter}
              value={session.talaId}
              onChange={(e) => handleTalaChange(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[190px]"
            >
              {talaDropdownOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {getTalaDisplayName(t, locale)}
                </option>
              ))}
            </select>

            <select
              aria-label={strings.labels.shrutiPitch}
              value={session.rootMidi}
              onChange={(e) =>
                setSession((prev) => ({...prev, rootMidi: Number(e.target.value)}))
              }
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] px-2.5 py-1.5 text-xs font-mono-tabular text-slate-800 dark:text-slate-200"
            >
              {ROOT_PITCH_OPTIONS.map((r) => (
                <option key={r.midi} value={r.midi}>
                  {r.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() =>
                setSession((prev) => ({...prev, microtonal: !prev.microtonal}))
              }
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                session.microtonal
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {session.microtonal ? strings.labels.justShruti : strings.labels.equalTemp}
            </button>

            <button
              type="button"
              onClick={() =>
                setSession((prev) => ({...prev, a4Hz: prev.a4Hz === 440 ? 432 : 440}))
              }
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs font-mono-tabular text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              A4={session.a4Hz}Hz
            </button>
          </div>

          {/* Right: Locale Switcher (EN / తెలుగు / संस्कृतम्), Save, Install PWA, Theme */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              role="group"
              aria-label="Studio Script and Language"
              className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] p-0.5"
            >
              {(['en', 'te', 'sa'] as StudioLocale[]).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocale(loc)}
                  aria-pressed={locale === loc}
                  title={STUDIO_LOCALE_META[loc].label}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap ${
                    locale === loc
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {loc === 'en' ? 'EN' : loc === 'te' ? 'తెలుగు' : 'संस्कृत'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveCurrentSession}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              {saveFeedback ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
              ) : (
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {saveFeedback ? strings.actions.saved : strings.actions.save}
            </button>

            <PWAInstallButton />

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? 'Switch to Daylight Conservatory theme' : 'Switch to Dark Studio theme'}
              className="rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Session Title Strip */}
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <input
              type="text"
              aria-label="Session Title"
              value={session.title}
              onChange={(e) =>
                setSession((prev) => ({...prev, title: e.target.value}))
              }
              className="font-display text-2xl sm:text-3xl font-bold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-amber-500 focus:outline-none text-slate-900 dark:text-slate-100 min-w-[220px]"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {getScaleDisplayName(scale, locale)} · {getTalaDisplayName(tala, locale)} ·{' '}
              {session.microtonal ? strings.labels.justShruti : strings.labels.equalTemp}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {strings.labels.composerHint}
          </span>
        </div>

        {activeView === 'console' && (
          <div className="space-y-4">
            {/* Top Telemetry & Tala Mandala Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7">
                <TalaWheel
                  tala={tala}
                  currentStep={currentStep}
                  isPlaying={isPlaying}
                  locale={locale}
                />
              </div>
              <div className="lg:col-span-5">
                <OscilloscopeMeters
                  isPlaying={isPlaying}
                  tanpuraEnabled={session.tanpura.enabled}
                />
              </div>
            </div>

            {/* Multi-Section Composition Form Arranger */}
            <SongArrangerBar
              sections={sections}
              activeSectionId={activeSectionId}
              playFullArrangement={playFullArrangement}
              tradition={session.tradition}
              locale={locale}
              onSelectSection={handleSelectSection}
              onTogglePlayArrangement={(full) => setPlayFullArrangement(full)}
              onAddSection={handleAddSection}
              onDuplicateSection={handleDuplicateSection}
              onDeleteSection={handleDeleteSection}
              onCycleRepeat={handleCycleSectionRepeat}
            />

            {/* Sequencer Grid */}
            <SequencerGrid
              tracks={session.tracks}
              activeTrackId={activeTrack?.id ?? ''}
              onSelectTrack={setActiveTrackId}
              onUpdateTrackNotes={handleUpdateTrackNotes}
              scale={scale}
              tala={tala}
              tradition={session.tradition}
              rootMidi={session.rootMidi}
              microtonal={session.microtonal}
              currentStep={currentStep}
              isPlaying={isPlaying}
              notationMode={notationMode}
              onNotationModeChange={setNotationMode}
              quantizeDivision={quantizeDivision}
              onQuantizeDivisionChange={setQuantizeDivision}
              autoQuantize={autoQuantize}
              onAutoQuantizeChange={setAutoQuantize}
              locale={locale}
            />

            {/* Live Performance Keyboard */}
            <LiveKeyboard
              activeTrack={activeTrack}
              scale={scale}
              tradition={session.tradition}
              rootMidi={session.rootMidi}
              notationMode={notationMode}
              recordArmed={recordArmed}
              onToggleRecordArm={() => setRecordArmed((r) => !r)}
              onLiveNoteTrigger={handleLiveNoteTrigger}
              locale={locale}
            />

            {/* Mixing Console + Shruti Tanpura + Master Bus */}
            <MixerConsole
              tracks={session.tracks}
              tanpura={session.tanpura}
              master={session.master}
              locale={locale}
              onUpdateTrack={handleUpdateTrack}
              onUpdateTanpura={handleUpdateTanpura}
              onUpdateMaster={handleUpdateMaster}
            />
          </div>
        )}

        {activeView === 'stage3d' && (
          <Suspense fallback={<ViewChunkFallback label="Initializing 3D Acoustic Concert Stage..." />}>
            <StudioStage3D
              sessionTitle={session.title}
              tradition={session.tradition}
              scale={scale}
              tala={tala}
              locale={locale}
              isPlaying={isPlaying}
              currentStep={currentStep}
              onTogglePlay={() => void handleTogglePlay()}
            />
          </Suspense>
        )}

        {activeView === 'architect' && (
          <Suspense fallback={<ViewChunkFallback label="Loading AI Composition Studio..." />}>
            <AIArchitectView
              session={session}
              scale={scale}
              tala={tala}
              locale={locale}
              onApplyComposition={handleApplyAIComposition}
              onOpenConsole={() => setActiveView('console')}
              onSaveSahitya={(text) =>
                setSession((prev) => ({
                  ...prev,
                  pedagogy: {...prev.pedagogy, sahityaOrLyrics: text},
                }))
              }
            />
          </Suspense>
        )}

        {activeView === 'pedagogy' && (
          <Suspense fallback={<ViewChunkFallback label="Opening Literature Compendium & Melakarta Chakra..." />}>
            <PedagogyView
              session={session}
              scale={scale}
              tala={tala}
              locale={locale}
              onLoadScaleId={handleScaleChange}
              onLoadTalaId={handleTalaChange}
            />
          </Suspense>
        )}

        {activeView === 'library' && (
          <Suspense fallback={<ViewChunkFallback label="Loading Offline Vault & Discovery Archive..." />}>
            <LibraryView
              sessions={sessions}
              activeSessionId={session.id}
              activeScaleId={session.scaleId}
              activeTalaId={session.talaId}
              locale={locale}
              onLoadSession={handleLoadSession}
              onDuplicateSession={handleDuplicateSession}
              onDeleteSession={handleDeleteSession}
              onCreateBlankSession={handleCreateBlankSession}
              onImportSessionJson={handleLoadSession}
              onLoadScaleId={handleScaleChange}
              onLoadTalaId={handleTalaChange}
            />
          </Suspense>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0D111A] text-slate-600 dark:text-slate-400 print:hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setActiveView('console');
                  window.scrollTo({top: 0, behavior: 'smooth'});
                }}
                className="inline-flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md"
              >
                <BrandLogo size={30} className="shrink-0" />
                <span className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-amber-300 whitespace-nowrap">
                  {strings.brandName}
                </span>
              </button>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 max-w-xs">
                Offline-capable multi-tradition music workstation uniting Carnatic, Hindustani, and Western composition with microtonal synthesis, Tala geometry, and hardware MIDI mapping.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Carnatic · Hindustani · Western Conservatory
              </p>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold tracking-wide text-slate-900 dark:text-slate-200">
                Studio Workspaces
              </h2>
              <ul className="space-y-1.5 text-xs">
                {(
                  [
                    {id: 'console', label: strings.nav.console},
                    {id: 'stage3d', label: strings.nav.stage3d},
                    {id: 'architect', label: strings.nav.architect},
                    {id: 'pedagogy', label: strings.nav.pedagogy},
                    {id: 'library', label: strings.nav.library},
                  ] as Array<{id: StudioView; label: string}>
                ).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView(item.id);
                        window.scrollTo({top: 0, behavior: 'smooth'});
                      }}
                      className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold tracking-wide text-slate-900 dark:text-slate-200">
                Capabilities &amp; Archives
              </h2>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('pedagogy');
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                    className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                  >
                    72 Melakarta &amp; 22 Shruti Compendium
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('library');
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                    className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                  >
                    106-Entry Raga &amp; Tala Discovery
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('console');
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                    className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                  >
                    Web MIDI Console &amp; Quantizer
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowExportModal(true)}
                    className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                  >
                    Export 24-bit WAV &amp; SMF MIDI
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold tracking-wide text-slate-900 dark:text-slate-200">
                Codeowner, Security &amp; Runtime
              </h2>
              <div className="space-y-1.5 text-xs leading-relaxed">
                <p>MIT License</p>
                <p className="text-slate-500 dark:text-slate-500">
                  Local-first IndexedDB storage · Server-isolated API proxy · Cloudflare Workers edge delivery
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-500">
            <span>
              &copy; {new Date().getFullYear()} SwaraKala Studio. All rights reserved.
            </span>
            <span>
              SwaraKala Studio · Web Audio Synthesizer · IndexedDB Local Vault · Lossless WAV &amp; MIDI
            </span>
          </div>
        </div>
      </footer>

      <OfflineIndicator />

      {showExportModal && (
        <Suspense fallback={null}>
          <ExportModal session={session} onClose={() => setShowExportModal(false)} />
        </Suspense>
      )}
    </div>
  );
}
