import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Cable, Check, Radio, RefreshCw, Sliders, Trash2, X} from 'lucide-react';
import {
  getDefaultConsoleMidiPreset,
  isWebMidiSupported,
  loadSavedMidiMappings,
  parseMidiMessage,
  saveMidiMappings,
  scaleMidiValue,
  type MidiDeviceInfo,
  type MidiIncomingEvent,
  type MidiMappingEntry,
  type MidiTargetId,
} from '../engine/midiMapping';
import {STUDIO_STRINGS} from '../i18n/studioLocale';
import type {
  InstrumentId,
  MasterBusConfig,
  StudioLocale,
  StudioTrack,
  TanpuraConfig,
} from '../types/studio';

interface MixerConsoleProps {
  tracks: StudioTrack[];
  tanpura: TanpuraConfig;
  master: MasterBusConfig;
  locale: StudioLocale;
  onUpdateTrack: (id: string, patch: Partial<StudioTrack>) => void;
  onUpdateTanpura: (patch: Partial<TanpuraConfig>) => void;
  onUpdateMaster: (patch: Partial<MasterBusConfig>) => void;
}

const INSTRUMENTS: Array<{id: InstrumentId; label: string; category: string}> = [
  {id: 'veena', label: 'Saraswati Veena', category: 'Indian'},
  {id: 'sitar', label: 'Hindustani Sitar', category: 'Indian'},
  {id: 'bansuri', label: 'Bansuri Bamboo Flute', category: 'Indian'},
  {id: 'nadaswaram', label: 'Nadaswaram Double-Reed', category: 'Indian'},
  {id: 'santoor', label: 'Kashmiri Santoor', category: 'Indian'},
  {id: 'harmonium', label: 'Scale-Changer Harmonium', category: 'Indian'},
  {id: 'violin', label: 'Carnatic / Solo Violin', category: 'Strings'},
  {id: 'stringsEnsemble', label: 'Philharmonic Strings Divisi', category: 'Orchestral'},
  {id: 'frenchHorn', label: 'Symphonic French Horn', category: 'Orchestral'},
  {id: 'piano', label: 'Concert Grand Piano', category: 'Western'},
  {id: 'rhodes', label: 'Electric Rhodes', category: 'Western'},
  {id: 'celesta', label: 'Orchestral Celesta', category: 'Orchestral'},
  {id: 'synthPad', label: 'Analog Poly Pad', category: 'Synth'},
  {id: 'bass', label: 'Studio Acoustic/Sub Bass', category: 'Low End'},
  {id: 'mridangam', label: 'Carnatic Mridangam', category: 'Percussion'},
  {id: 'tabla', label: 'Hindustani Tabla', category: 'Percussion'},
  {id: 'drums', label: 'Western Studio Kit', category: 'Percussion'},
];

interface ArmedTarget {
  targetId: MidiTargetId;
  targetLabel: string;
  isToggle?: boolean;
}

export const MixerConsole: React.FC<MixerConsoleProps> = ({
  tracks,
  tanpura,
  master,
  locale,
  onUpdateTrack,
  onUpdateTanpura,
  onUpdateMaster,
}) => {
  const strings = STUDIO_STRINGS[locale];
  const swingPct = Math.round((master.swingAmount ?? 0) * 100);

  // Web MIDI Mapping State
  const [midiMapMode, setMidiMapMode] = useState(false);
  const [midiPanelOpen, setMidiPanelOpen] = useState(false);
  const [armedTarget, setArmedTarget] = useState<ArmedTarget | null>(null);
  const [mappings, setMappings] = useState<MidiMappingEntry[]>(() => loadSavedMidiMappings());
  const [midiDevices, setMidiDevices] = useState<MidiDeviceInfo[]>([]);
  const [midiSupported] = useState<boolean>(() => isWebMidiSupported());
  const [midiAccessState, setMidiAccessState] = useState<'idle' | 'connected' | 'error'>('idle');
  const [midiErrorMsg, setMidiErrorMsg] = useState<string | null>(null);
  const [lastMidiEvent, setLastMidiEvent] = useState<MidiIncomingEvent | null>(null);
  const [midiStatusNote, setMidiStatusNote] = useState<string | null>(null);
  const [virtualCcTestValue, setVirtualCcTestValue] = useState<number>(64);

  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const latestStateRef = useRef({
    tracks,
    tanpura,
    master,
    onUpdateTrack,
    onUpdateTanpura,
    onUpdateMaster,
  });
  latestStateRef.current = {
    tracks,
    tanpura,
    master,
    onUpdateTrack,
    onUpdateTanpura,
    onUpdateMaster,
  };

  const armedRef = useRef<ArmedTarget | null>(null);
  armedRef.current = armedTarget;

  const mappingsRef = useRef<MidiMappingEntry[]>([]);
  mappingsRef.current = mappings;

  // Persist mappings whenever updated
  useEffect(() => {
    saveMidiMappings(mappings);
  }, [mappings]);

  const applyTargetMidiValue = useCallback(
    (entry: MidiMappingEntry, rawValue: number) => {
      const {
        tracks: curTracks,
        tanpura: curTanpura,
        master: curMaster,
        onUpdateTrack: updTrack,
        onUpdateTanpura: updTanpura,
        onUpdateMaster: updMaster,
      } = latestStateRef.current;

      const id = entry.targetId;
      const inv = Boolean(entry.inverted);

      if (id.startsWith('track.')) {
        const parts = id.split('.');
        const idx = Number(parts[1]);
        const prop = parts[2];
        const targetTrack = curTracks[idx];
        if (!targetTrack) return;

        if (prop === 'volume') {
          updTrack(targetTrack.id, {volume: scaleMidiValue(rawValue, 0, 1, 0.01, inv)});
        } else if (prop === 'pan') {
          updTrack(targetTrack.id, {pan: scaleMidiValue(rawValue, -1, 1, 0.05, inv, true)});
        } else if (prop === 'reverbSend') {
          updTrack(targetTrack.id, {reverbSend: scaleMidiValue(rawValue, 0, 1, 0.02, inv)});
        } else if (prop === 'muted') {
          const next = entry.kind === 'note' ? !targetTrack.muted : inv ? rawValue < 64 : rawValue >= 64;
          updTrack(targetTrack.id, {muted: next});
        } else if (prop === 'solo') {
          const next = entry.kind === 'note' ? !targetTrack.solo : inv ? rawValue < 64 : rawValue >= 64;
          updTrack(targetTrack.id, {solo: next});
        }
        return;
      }

      if (id === 'tanpura.volume') {
        updTanpura({volume: scaleMidiValue(rawValue, 0.1, 1, 0.02, inv)});
      } else if (id === 'tanpura.brightness') {
        updTanpura({brightness: scaleMidiValue(rawValue, 0, 1, 0.02, inv)});
      } else if (id === 'tanpura.fineTuneCents') {
        updTanpura({fineTuneCents: scaleMidiValue(rawValue, -50, 50, 1, inv, true)});
      } else if (id === 'tanpura.enabled') {
        const next = entry.kind === 'note' ? !curTanpura.enabled : inv ? rawValue < 64 : rawValue >= 64;
        updTanpura({enabled: next});
      } else if (id === 'master.volume') {
        updMaster({volume: scaleMidiValue(rawValue, 0.1, 1, 0.02, inv)});
      } else if (id === 'master.reverbMix') {
        updMaster({reverbMix: scaleMidiValue(rawValue, 0, 0.85, 0.02, inv)});
      } else if (id === 'master.delayMix') {
        updMaster({delayMix: scaleMidiValue(rawValue, 0, 0.6, 0.02, inv)});
      } else if (id === 'master.lowGainDb') {
        updMaster({lowGainDb: scaleMidiValue(rawValue, -6, 6, 0.5, inv, true)});
      } else if (id === 'master.midGainDb') {
        updMaster({midGainDb: scaleMidiValue(rawValue, -6, 6, 0.5, inv, true)});
      } else if (id === 'master.highGainDb') {
        updMaster({highGainDb: scaleMidiValue(rawValue, -6, 6, 0.5, inv, true)});
      } else if (id === 'master.humanizeAmount') {
        updMaster({humanizeAmount: scaleMidiValue(rawValue, 0, 1, 0.05, inv)});
      } else if (id === 'master.swingAmount') {
        updMaster({swingAmount: scaleMidiValue(rawValue, 0, 1, 0.05, inv)});
      } else if (id === 'master.tapeWarmth') {
        const next = entry.kind === 'note' ? !curMaster.tapeWarmth : inv ? rawValue < 64 : rawValue >= 64;
        updMaster({tapeWarmth: next});
      } else if (id === 'master.compressorEnabled') {
        const next =
          entry.kind === 'note'
            ? !curMaster.compressorEnabled
            : inv
              ? rawValue < 64
              : rawValue >= 64;
        updMaster({compressorEnabled: next});
      }
    },
    []
  );

  const handleIncomingMidiEvent = useCallback(
    (evt: MidiIncomingEvent) => {
      setLastMidiEvent(evt);

      const pendingArm = armedRef.current;
      if (pendingArm) {
        const newEntry: MidiMappingEntry = {
          id: `map-${pendingArm.targetId}-${Date.now()}`,
          targetId: pendingArm.targetId,
          targetLabel: pendingArm.targetLabel,
          channel: evt.channel,
          kind: evt.kind,
          number: evt.number,
          inverted: false,
          isToggle: pendingArm.isToggle,
        };
        setMappings((prev) => [
          ...prev.filter((m) => m.targetId !== pendingArm.targetId),
          newEntry,
        ]);
        setArmedTarget(null);
        setMidiStatusNote(
          `Bound Ch ${evt.channel} ${evt.kind === 'cc' ? `CC #${evt.number}` : `Note #${evt.number}`} → ${pendingArm.targetLabel}`
        );
        applyTargetMidiValue(newEntry, evt.rawValue);
        return;
      }

      // Apply to all matching bindings
      const matched = mappingsRef.current.filter(
        (m) => m.channel === evt.channel && m.kind === evt.kind && m.number === evt.number
      );
      for (const m of matched) {
        applyTargetMidiValue(m, evt.rawValue);
      }
    },
    [applyTargetMidiValue]
  );

  const attachMidiInputs = useCallback(
    (access: MIDIAccess) => {
      const devices: MidiDeviceInfo[] = [];
      access.inputs.forEach((input) => {
        devices.push({
          id: input.id,
          name: input.name || 'MIDI Input',
          manufacturer: input.manufacturer || 'Generic',
          state: input.state,
        });
        input.onmidimessage = (msgEvent: MIDIMessageEvent) => {
          if (!msgEvent.data) return;
          const parsed = parseMidiMessage(msgEvent.data, input.name || 'MIDI Controller');
          if (parsed) {
            handleIncomingMidiEvent(parsed);
          }
        };
      });
      setMidiDevices(devices);
    },
    [handleIncomingMidiEvent]
  );

  const connectMidiHardware = useCallback(async () => {
    if (!isWebMidiSupported()) {
      setMidiAccessState('error');
      setMidiErrorMsg(
        'Web MIDI API is not supported in this browser. Use Chromium-based desktop browsers (Chrome, Edge, Brave, Opera).'
      );
      return;
    }
    setMidiErrorMsg(null);
    try {
      const access = await navigator.requestMIDIAccess({sysex: false});
      midiAccessRef.current = access;
      setMidiAccessState('connected');
      attachMidiInputs(access);
      access.onstatechange = () => {
        attachMidiInputs(access);
      };
    } catch (err) {
      setMidiAccessState('error');
      setMidiErrorMsg(
        err instanceof Error ? err.message : 'MIDI permission was denied or unavailable.'
      );
    }
  }, [attachMidiInputs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (midiAccessRef.current) {
        midiAccessRef.current.inputs.forEach((input) => {
          input.onmidimessage = null;
        });
      }
    };
  }, []);

  const getBindingForTarget = (targetId: MidiTargetId) =>
    mappings.find((m) => m.targetId === targetId);

  const renderLearnPill = (
    targetId: MidiTargetId,
    targetLabel: string,
    isToggle = false
  ) => {
    if (!midiMapMode) return null;
    const binding = getBindingForTarget(targetId);
    const isArmed = armedTarget?.targetId === targetId;

    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setArmedTarget(isArmed ? null : {targetId, targetLabel, isToggle});
          if (midiAccessState === 'idle') {
            void connectMidiHardware();
          }
        }}
        className={`ml-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono-tabular font-semibold transition-colors whitespace-nowrap ${
          isArmed
            ? 'bg-red-600 text-white'
            : binding
              ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
        }`}
      >
        {isArmed
          ? 'Turn Knob...'
          : binding
            ? `${binding.kind === 'cc' ? 'CC' : 'N'}${binding.number}`
            : 'Bind'}
      </button>
    );
  };

  const handleToggleMidiMapMode = () => {
    const next = !midiMapMode;
    setMidiMapMode(next);
    if (next) {
      setMidiPanelOpen(true);
      if (midiAccessState === 'idle' && midiSupported) {
        void connectMidiHardware();
      }
    } else {
      setArmedTarget(null);
    }
  };

  return (
    <section
      aria-label="Studio Mixing Console, Tanpura Drone, Master Bus, and MIDI Controller Mapping"
      className="space-y-4"
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Channel Strips */}
        <div className="xl:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Channel Strips &amp; Instrument Rack
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                17 Acoustic &amp; Orchestral Voices
                {mappings.length > 0 ? ` · ${mappings.length} MIDI bindings active` : ''}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleMidiMapMode}
                aria-pressed={midiMapMode}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  midiMapMode
                    ? 'border-amber-500 bg-amber-500 text-slate-950'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-500'
                }`}
              >
                <Cable className="w-3.5 h-3.5" aria-hidden="true" />
                {midiMapMode ? 'Exit MIDI Learn' : 'MIDI Map'}
              </button>

              <button
                type="button"
                onClick={() => setMidiPanelOpen((v) => !v)}
                aria-expanded={midiPanelOpen}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
                Controllers ({midiDevices.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tracks.map((trk, trackIdx) => {
              const availableInstruments =
                trk.role === 'percussion'
                  ? INSTRUMENTS.filter((i) => i.category === 'Percussion')
                  : INSTRUMENTS.filter((i) => i.category !== 'Percussion');

              const volTarget: MidiTargetId = `track.${trackIdx}.volume`;
              const panTarget: MidiTargetId = `track.${trackIdx}.pan`;
              const revTarget: MidiTargetId = `track.${trackIdx}.reverbSend`;
              const muteTarget: MidiTargetId = `track.${trackIdx}.muted`;
              const soloTarget: MidiTargetId = `track.${trackIdx}.solo`;

              return (
                <div
                  key={trk.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E121B] p-3 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {trk.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (midiMapMode) {
                            setArmedTarget({
                              targetId: muteTarget,
                              targetLabel: `${trk.name} · Mute`,
                              isToggle: true,
                            });
                          } else {
                            onUpdateTrack(trk.id, {muted: !trk.muted});
                          }
                        }}
                        aria-pressed={trk.muted}
                        title={
                          midiMapMode
                            ? 'Click to learn MIDI trigger for Mute'
                            : 'Toggle Mute'
                        }
                        className={`w-6 h-6 rounded text-[11px] font-bold transition-colors ${
                          armedTarget?.targetId === muteTarget
                            ? 'ring-2 ring-red-500 bg-red-600 text-white'
                            : trk.muted
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        M
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (midiMapMode) {
                            setArmedTarget({
                              targetId: soloTarget,
                              targetLabel: `${trk.name} · Solo`,
                              isToggle: true,
                            });
                          } else {
                            onUpdateTrack(trk.id, {solo: !trk.solo});
                          }
                        }}
                        aria-pressed={trk.solo}
                        title={
                          midiMapMode
                            ? 'Click to learn MIDI trigger for Solo'
                            : 'Toggle Solo'
                        }
                        className={`w-6 h-6 rounded text-[11px] font-bold transition-colors ${
                          armedTarget?.targetId === soloTarget
                            ? 'ring-2 ring-red-500 bg-amber-500 text-slate-950'
                            : trk.solo
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        S
                      </button>
                    </div>
                  </div>

                  <label className="block">
                    <span className="sr-only">Instrument for {trk.name}</span>
                    <select
                      value={trk.instrument}
                      onChange={(e) =>
                        onUpdateTrack(trk.id, {instrument: e.target.value as InstrumentId})
                      }
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121721] px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                    >
                      {availableInstruments.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center">
                        Level
                        {renderLearnPill(volTarget, `${trk.name} · Level`)}
                      </span>
                      <span className="font-mono-tabular">{Math.round(trk.volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={trk.volume}
                      onChange={(e) => onUpdateTrack(trk.id, {volume: Number(e.target.value)})}
                      className="w-full accent-amber-500"
                    />
                  </label>

                  <label className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center">
                        Pan
                        {renderLearnPill(panTarget, `${trk.name} · Pan`)}
                      </span>
                      <span className="font-mono-tabular">
                        {trk.pan === 0
                          ? 'C'
                          : trk.pan < 0
                            ? `L${Math.round(Math.abs(trk.pan) * 100)}`
                            : `R${Math.round(trk.pan * 100)}`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.05}
                      value={trk.pan}
                      onChange={(e) => onUpdateTrack(trk.id, {pan: Number(e.target.value)})}
                      className="w-full accent-amber-500"
                    />
                  </label>

                  <label className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center">
                        Reverb Send
                        {renderLearnPill(revTarget, `${trk.name} · Reverb Send`)}
                      </span>
                      <span className="font-mono-tabular">{Math.round(trk.reverbSend * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.02}
                      value={trk.reverbSend}
                      onChange={(e) => onUpdateTrack(trk.id, {reverbSend: Number(e.target.value)})}
                      className="w-full accent-amber-500"
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tanpura / Shruti Drone + Master Mastering Rack */}
        <div className="xl:col-span-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {strings.labels.tanpura}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  4-String Jivari Harmonic Drone
                </p>
              </div>
              <div className="flex items-center">
                {renderLearnPill('tanpura.enabled', 'Tanpura · On/Off', true)}
                <button
                  type="button"
                  onClick={() => onUpdateTanpura({enabled: !tanpura.enabled})}
                  aria-pressed={tanpura.enabled}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ml-1 ${
                    tanpura.enabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tanpura.enabled ? strings.labels.droneOn : strings.labels.droneOff}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {(['Pa', 'Ma', 'Ni'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onUpdateTanpura({fifthMode: m})}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    tanpura.fifthMode === m
                      ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m}-S-S-S
                </button>
              ))}
            </div>

            <label className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center">
                  Drone Level
                  {renderLearnPill('tanpura.volume', 'Tanpura · Drone Level')}
                </span>
                <span className="font-mono-tabular">{Math.round(tanpura.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.02}
                value={tanpura.volume}
                onChange={(e) => onUpdateTanpura({volume: Number(e.target.value)})}
                className="w-full accent-amber-500"
              />
            </label>

            <label className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center">
                  Jivari Brightness
                  {renderLearnPill('tanpura.brightness', 'Tanpura · Jivari Brightness')}
                </span>
                <span className="font-mono-tabular">{Math.round(tanpura.brightness * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={tanpura.brightness}
                onChange={(e) => onUpdateTanpura({brightness: Number(e.target.value)})}
                className="w-full accent-amber-500"
              />
            </label>

            <label className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center">
                  Fine Pitch Trim
                  {renderLearnPill('tanpura.fineTuneCents', 'Tanpura · Fine Pitch Trim')}
                </span>
                <span className="font-mono-tabular">
                  {tanpura.fineTuneCents > 0 ? `+${tanpura.fineTuneCents}` : tanpura.fineTuneCents}¢
                </span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                step={1}
                value={tanpura.fineTuneCents}
                onChange={(e) => onUpdateTanpura({fineTuneCents: Number(e.target.value)})}
                className="w-full accent-amber-500"
              />
            </label>
          </div>

          {/* Master Console EQ, Analog Tape & Scoring Stage Reverb */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-4 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between gap-1.5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Master Rack
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Space, Tape &amp; Human Feel
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    midiMapMode
                      ? setArmedTarget({
                          targetId: 'master.tapeWarmth',
                          targetLabel: 'Master · Tape Warmth',
                          isToggle: true,
                        })
                      : onUpdateMaster({tapeWarmth: !master.tapeWarmth})
                  }
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap ${
                    armedTarget?.targetId === 'master.tapeWarmth'
                      ? 'ring-2 ring-red-500 bg-amber-500/30 text-amber-300'
                      : master.tapeWarmth
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  Tape
                </button>
                <button
                  type="button"
                  onClick={() =>
                    midiMapMode
                      ? setArmedTarget({
                          targetId: 'master.compressorEnabled',
                          targetLabel: 'Master · Compressor',
                          isToggle: true,
                        })
                      : onUpdateMaster({compressorEnabled: !master.compressorEnabled})
                  }
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap ${
                    armedTarget?.targetId === 'master.compressorEnabled'
                      ? 'ring-2 ring-red-500 bg-amber-500/30 text-amber-300'
                      : master.compressorEnabled
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  Comp
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {(
                [
                  {id: 'chamber', label: 'Room'},
                  {id: 'hall', label: 'Hall'},
                  {id: 'sanctum', label: 'Sabha'},
                  {id: 'scoringStage', label: 'Film'},
                ] as const
              ).map((rm) => (
                <button
                  key={rm.id}
                  type="button"
                  onClick={() => onUpdateMaster({reverbRoom: rm.id})}
                  className={`py-1 rounded-md text-[10px] font-medium border ${
                    master.reverbRoom === rm.id
                      ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  {rm.label}
                </button>
              ))}
            </div>

            <label className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center">
                  Master Gain
                  {renderLearnPill('master.volume', 'Master · Gain')}
                </span>
                <span className="font-mono-tabular">{Math.round(master.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.02}
                value={master.volume}
                onChange={(e) => onUpdateMaster({volume: Number(e.target.value)})}
                className="w-full accent-amber-500"
              />
            </label>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center">
                  Reverb{renderLearnPill('master.reverbMix', 'Master · Reverb Mix')} / Delay
                  {renderLearnPill('master.delayMix', 'Master · Delay Mix')}
                </span>
                <span className="font-mono-tabular">
                  {Math.round(master.reverbMix * 100)}% / {Math.round(master.delayMix * 100)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="range"
                  min={0}
                  max={0.85}
                  step={0.02}
                  value={master.reverbMix}
                  onChange={(e) => onUpdateMaster({reverbMix: Number(e.target.value)})}
                  aria-label="Master reverb mix"
                  className="w-full accent-amber-500"
                />
                <input
                  type="range"
                  min={0}
                  max={0.6}
                  step={0.02}
                  value={master.delayMix}
                  onChange={(e) => onUpdateMaster({delayMix: Number(e.target.value)})}
                  aria-label="Master delay mix"
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label className="text-[10px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center flex-wrap">
                  Low {master.lowGainDb > 0 ? `+${master.lowGainDb}` : master.lowGainDb}dB
                  {renderLearnPill('master.lowGainDb', 'Master EQ · Low')}
                </span>
                <input
                  type="range"
                  min={-6}
                  max={6}
                  step={0.5}
                  value={master.lowGainDb}
                  onChange={(e) => onUpdateMaster({lowGainDb: Number(e.target.value)})}
                  className="w-full accent-amber-500"
                />
              </label>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center flex-wrap">
                  Mid {master.midGainDb > 0 ? `+${master.midGainDb}` : master.midGainDb}dB
                  {renderLearnPill('master.midGainDb', 'Master EQ · Mid')}
                </span>
                <input
                  type="range"
                  min={-6}
                  max={6}
                  step={0.5}
                  value={master.midGainDb}
                  onChange={(e) => onUpdateMaster({midGainDb: Number(e.target.value)})}
                  className="w-full accent-amber-500"
                />
              </label>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center flex-wrap">
                  High {master.highGainDb > 0 ? `+${master.highGainDb}` : master.highGainDb}dB
                  {renderLearnPill('master.highGainDb', 'Master EQ · High')}
                </span>
                <input
                  type="range"
                  min={-6}
                  max={6}
                  step={0.5}
                  value={master.highGainDb}
                  onChange={(e) => onUpdateMaster({highGainDb: Number(e.target.value)})}
                  className="w-full accent-amber-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center">
                    Humanize
                    {renderLearnPill('master.humanizeAmount', 'Master · Humanize')}
                  </span>
                  <span className="font-mono-tabular">{Math.round(master.humanizeAmount * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={master.humanizeAmount}
                  onChange={(e) => onUpdateMaster({humanizeAmount: Number(e.target.value)})}
                  className="w-full accent-amber-500"
                />
              </label>

              <label className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center">
                    Swing
                    {renderLearnPill('master.swingAmount', 'Master · Swing')}
                  </span>
                  <span className="font-mono-tabular">{swingPct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={master.swingAmount ?? 0}
                  onChange={(e) => onUpdateMaster({swingAmount: Number(e.target.value)})}
                  className="w-full accent-amber-500"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Hardware MIDI Controller & Binding Matrix Rack */}
      {midiPanelOpen && (
        <div className="rounded-xl border border-amber-500/40 bg-white dark:bg-[#121721] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-start gap-2.5">
              <Radio className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  External MIDI Controller Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {midiMapMode
                    ? armedTarget
                      ? `MIDI LEARN ARMED: Move a fader, knob, or pad on your controller to bind "${armedTarget.targetLabel}".`
                      : 'MIDI Learn active — click any "Bind" badge on the Mixer strips or Master rack, then turn a hardware control.'
                    : 'Bind external USB/Bluetooth MIDI controller knobs and faders directly to track gain, panning, sends, Tanpura, and Master FX.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void connectMidiHardware()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-slate-900 hover:opacity-90 whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                {midiAccessState === 'connected' ? 'Rescan MIDI Devices' : 'Connect MIDI Hardware'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const preset = getDefaultConsoleMidiPreset();
                  setMappings(preset);
                  setMidiStatusNote('Loaded standard GM/Console CC 1–4, 7, 10, 14–15, 91, 94 bindings.');
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-amber-500 whitespace-nowrap"
              >
                Load Console CC Preset
              </button>

              {mappings.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMappings([]);
                    setArmedTarget(null);
                    setMidiStatusNote('Cleared all MIDI bindings.');
                  }}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:border-red-500/40 whitespace-nowrap"
                >
                  Clear All
                </button>
              )}

              <button
                type="button"
                onClick={() => setMidiPanelOpen(false)}
                aria-label="Close MIDI controller panel"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {midiErrorMsg && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {midiErrorMsg}
            </p>
          )}

          {midiStatusNote && (
            <p role="status" className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{midiStatusNote}</span>
            </p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
            {/* Connected Hardware + Live Stream Monitor */}
            <div className="lg:col-span-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E121B] p-3 space-y-2.5">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Detected MIDI Inputs ({midiDevices.length})
              </div>
              {midiDevices.length === 0 ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {midiSupported
                    ? midiAccessState === 'connected'
                      ? 'Web MIDI active. Plug in any USB/Bluetooth MIDI controller to auto-detect.'
                      : 'Click "Connect MIDI Hardware" to authorize browser Web MIDI access.'
                    : 'Web MIDI API unavailable in this browser engine.'}
                </p>
              ) : (
                <ul className="space-y-1">
                  {midiDevices.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded bg-white dark:bg-[#121721] px-2.5 py-1.5 border border-slate-200 dark:border-slate-800"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {d.name}
                      </span>
                      <span className="font-mono-tabular text-[10px] text-emerald-600 dark:text-emerald-400">
                        {d.state}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Last Received MIDI Message
                </div>
                <div className="font-mono-tabular text-[11px] text-amber-700 dark:text-amber-300">
                  {lastMidiEvent
                    ? `Ch ${lastMidiEvent.channel} · ${lastMidiEvent.kind.toUpperCase()} #${lastMidiEvent.number} · Val ${lastMidiEvent.rawValue} (${lastMidiEvent.deviceName})`
                    : 'Waiting for incoming CC / Note messages...'}
                </div>
              </div>
            </div>

            {/* Active Bindings Table + Direct Verification Tester */}
            <div className="lg:col-span-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E121B] p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Active Parameter Mappings ({mappings.length})
                </span>
                {mappings.length > 0 && (
                  <label className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Virtual CC Test ({virtualCcTestValue}):</span>
                    <input
                      type="range"
                      min={0}
                      max={127}
                      value={virtualCcTestValue}
                      onChange={(e) => setVirtualCcTestValue(Number(e.target.value))}
                      className="w-24 accent-amber-500"
                    />
                  </label>
                )}
              </div>

              {mappings.length === 0 ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 py-4 text-center">
                  No MIDI bindings yet. Enable &ldquo;MIDI Map&rdquo; or click &ldquo;Load Console CC Preset&rdquo; to start controlling faders &amp; FX from hardware.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-800/70">
                  {mappings.map((m) => (
                    <div
                      key={m.id}
                      className="py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {m.targetLabel}
                        </span>
                        <span className="ml-2 font-mono-tabular text-amber-600 dark:text-amber-400">
                          Ch {m.channel} · {m.kind === 'cc' ? `CC #${m.number}` : `Note #${m.number}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleIncomingMidiEvent({
                              channel: m.channel,
                              kind: m.kind,
                              number: m.number,
                              rawValue: virtualCcTestValue,
                              deviceName: 'Virtual MIDI Fader',
                              timestamp: Date.now(),
                            })
                          }
                          className="rounded border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-200 hover:border-amber-500"
                        >
                          Send Val {virtualCcTestValue}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setMappings((prev) =>
                              prev.map((item) =>
                                item.id === m.id ? {...item, inverted: !item.inverted} : item
                              )
                            )
                          }
                          className={`rounded border px-2 py-0.5 text-[10px] font-medium ${
                            m.inverted
                              ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              : 'border-slate-300 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          Invert
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setMappings((prev) => prev.filter((item) => item.id !== m.id))
                          }
                          aria-label={`Remove MIDI mapping for ${m.targetLabel}`}
                          className="rounded p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
