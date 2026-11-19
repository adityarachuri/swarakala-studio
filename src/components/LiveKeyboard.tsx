import React, {useCallback, useEffect, useState} from 'react';
import {Keyboard, Radio} from 'lucide-react';
import {audioEngine} from '../engine/audioEngine';
import {formatPitchLabel, isSemitoneInScale} from '../engine/musicTheory';
import {getLocalizedGamakaName} from '../i18n/studioLocale';
import type {
  GamakaType,
  NotationMode,
  ScaleDefinition,
  StudioLocale,
  StudioTrack,
  TraditionId,
} from '../types/studio';

interface LiveKeyboardProps {
  activeTrack: StudioTrack | undefined;
  scale: ScaleDefinition;
  tradition: TraditionId;
  locale: StudioLocale;
  rootMidi: number;
  notationMode: NotationMode;
  recordArmed: boolean;
  onToggleRecordArm: () => void;
  onLiveNoteTrigger: (semitoneOffset: number, velocity: number, gamaka: GamakaType) => void;
}

const KEY_BINDINGS: Array<{key: string; semitone: number; label: string}> = [
  {key: 'a', semitone: 0, label: 'A'},
  {key: 'w', semitone: 1, label: 'W'},
  {key: 's', semitone: 2, label: 'S'},
  {key: 'e', semitone: 3, label: 'E'},
  {key: 'd', semitone: 4, label: 'D'},
  {key: 'f', semitone: 5, label: 'F'},
  {key: 't', semitone: 6, label: 'T'},
  {key: 'g', semitone: 7, label: 'G'},
  {key: 'y', semitone: 8, label: 'Y'},
  {key: 'h', semitone: 9, label: 'H'},
  {key: 'u', semitone: 10, label: 'U'},
  {key: 'j', semitone: 11, label: 'J'},
  {key: 'k', semitone: 12, label: 'K'},
  {key: 'o', semitone: 13, label: 'O'},
  {key: 'l', semitone: 14, label: 'L'},
  {key: 'p', semitone: 15, label: 'P'},
  {key: ';', semitone: 16, label: ';'},
];

export const LiveKeyboard: React.FC<LiveKeyboardProps> = ({
  activeTrack,
  scale,
  tradition,
  locale,
  rootMidi,
  notationMode,
  recordArmed,
  onToggleRecordArm,
  onLiveNoteTrigger,
}) => {
  const [pressed, setPressed] = useState<Set<number>>(new Set());
  const [liveGamaka, setLiveGamaka] = useState<GamakaType>('none');
  const [midiDeviceName, setMidiDeviceName] = useState<string | null>(null);

  const playSemitone = useCallback(
    (semitone: number, velocity = 0.88) => {
      if (!activeTrack) return;
      const inst = activeTrack.role === 'percussion' ? 'piano' : activeTrack.instrument;
      void audioEngine.previewNote(inst, semitone, liveGamaka, 0.55, velocity);
      onLiveNoteTrigger(semitone, velocity, liveGamaka);
      setPressed((prev) => new Set(prev).add(semitone));
      window.setTimeout(() => {
        setPressed((prev) => {
          const next = new Set(prev);
          next.delete(semitone);
          return next;
        });
      }, 220);
    },
    [activeTrack, liveGamaka, onLiveNoteTrigger]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const match = KEY_BINDINGS.find((b) => b.key === e.key.toLowerCase());
      if (match) {
        e.preventDefault();
        playSemitone(match.semitone, 0.9);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [playSemitone]);

  useEffect(() => {
    const nav = navigator as unknown as {
      requestMIDIAccess?: () => Promise<{
        inputs: Map<
          string,
          {name?: string; onmidimessage: ((ev: {data: Uint8Array}) => void) | null}
        >;
      }>;
    };
    if (!nav.requestMIDIAccess) return;
    let active = true;

    nav
      .requestMIDIAccess()
      .then((access) => {
        if (!active) return;
        const inputs = Array.from(access.inputs.values());
        if (inputs.length > 0) {
          setMidiDeviceName(inputs[0].name || 'USB MIDI Controller');
          for (const input of inputs) {
            input.onmidimessage = (msg) => {
              const [status, note, vel] = msg.data;
              const cmd = status & 0xf0;
              if (cmd === 0x90 && vel > 0) {
                playSemitone(note - rootMidi, Math.max(0.25, vel / 127));
              }
            };
          }
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [playSemitone, rootMidi]);

  return (
    <section
      aria-label="Live Performance Keyboard and MIDI Controller"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <Keyboard className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Live Jam &amp; Step-Record Keyboard
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            QWERTY keys A–; · {midiDeviceName ? `MIDI: ${midiDeviceName}` : 'Touch & Click Ready'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span>Live Gamaka:</span>
            <select
              value={liveGamaka}
              onChange={(e) => setLiveGamaka(e.target.value as GamakaType)}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] px-2 py-1 text-xs"
            >
              {(['none', 'kampita', 'meend', 'nokku', 'andolan', 'sphurita'] as GamakaType[]).map(
                (g) => (
                  <option key={g} value={g}>
                    {getLocalizedGamakaName(g, locale)}
                  </option>
                )
              )}
            </select>
          </label>

          <button
            type="button"
            onClick={onToggleRecordArm}
            aria-pressed={recordArmed}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              recordArmed
                ? 'bg-red-600 text-white'
                : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" aria-hidden="true" />
            {recordArmed ? 'Recording Armed' : 'Arm Step Record'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-9 sm:grid-cols-17 gap-1.5">
        {KEY_BINDINGS.map((k) => {
          const inScale = isSemitoneInScale(k.semitone, scale);
          const isBlack = [1, 3, 6, 8, 10, 13, 15].includes(k.semitone);
          const isDown = pressed.has(k.semitone);
          const pitchText = formatPitchLabel(
            k.semitone,
            rootMidi,
            tradition,
            notationMode === 'both' ? 'swara' : notationMode,
            locale
          );

          return (
            <button
              key={k.semitone}
              type="button"
              onMouseDown={() => playSemitone(k.semitone, 0.9)}
              className={`h-16 rounded-lg border flex flex-col items-center justify-between py-1.5 px-1 transition-transform ${
                isDown
                  ? 'bg-amber-500 border-amber-400 text-slate-950 scale-[0.97]'
                  : isBlack
                    ? inScale
                      ? 'bg-slate-900 border-amber-500/40 text-slate-100 hover:bg-slate-800'
                      : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
                    : inScale
                      ? 'bg-slate-50 dark:bg-[#19202E] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-amber-500/60'
                      : 'bg-slate-100 dark:bg-[#0D1119] border-slate-200 dark:border-slate-800/60 text-slate-400 opacity-60'
              }`}
            >
              <span className="text-[11px] font-semibold leading-tight">{pitchText}</span>
              <span className="font-mono-tabular text-[10px] opacity-65">{k.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
