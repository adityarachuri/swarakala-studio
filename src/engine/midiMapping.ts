export type MidiTargetId =
  | `track.${number}.volume`
  | `track.${number}.pan`
  | `track.${number}.reverbSend`
  | `track.${number}.muted`
  | `track.${number}.solo`
  | 'tanpura.enabled'
  | 'tanpura.volume'
  | 'tanpura.brightness'
  | 'tanpura.fineTuneCents'
  | 'master.volume'
  | 'master.reverbMix'
  | 'master.delayMix'
  | 'master.lowGainDb'
  | 'master.midGainDb'
  | 'master.highGainDb'
  | 'master.humanizeAmount'
  | 'master.swingAmount'
  | 'master.tapeWarmth'
  | 'master.compressorEnabled';

export type MidiMessageKind = 'cc' | 'note';

export interface MidiMappingEntry {
  id: string;
  targetId: MidiTargetId;
  targetLabel: string;
  channel: number; // 1..16
  kind: MidiMessageKind;
  number: number; // CC# 0..127 or Note 0..127
  inverted?: boolean;
  isToggle?: boolean;
}

export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

export interface MidiIncomingEvent {
  channel: number;
  kind: MidiMessageKind;
  number: number;
  rawValue: number; // 0..127
  deviceName: string;
  timestamp: number;
}

const STORAGE_KEY = 'swarakala_midi_mappings_v1';

const VALID_STATIC_TARGETS = new Set<string>([
  'tanpura.enabled',
  'tanpura.volume',
  'tanpura.brightness',
  'tanpura.fineTuneCents',
  'master.volume',
  'master.reverbMix',
  'master.delayMix',
  'master.lowGainDb',
  'master.midGainDb',
  'master.highGainDb',
  'master.humanizeAmount',
  'master.swingAmount',
  'master.tapeWarmth',
  'master.compressorEnabled',
]);

function isValidMidiTargetId(id: string): id is MidiTargetId {
  if (VALID_STATIC_TARGETS.has(id)) return true;
  return /^track\.[0-5]\.(volume|pan|reverbSend|muted|solo)$/.test(id);
}

export function loadSavedMidiMappings(): MidiMappingEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw || raw.length > 32_768) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(0, 64)
      .filter(
        (item): item is MidiMappingEntry =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          item.id.length <= 64 &&
          typeof item.targetId === 'string' &&
          isValidMidiTargetId(item.targetId) &&
          typeof item.targetLabel === 'string' &&
          (item.kind === 'cc' || item.kind === 'note') &&
          Number.isInteger(item.channel) &&
          item.channel >= 1 &&
          item.channel <= 16 &&
          Number.isInteger(item.number) &&
          item.number >= 0 &&
          item.number <= 127
      )
      .map((item) => ({
        id: item.id,
        targetId: item.targetId,
        targetLabel: item.targetLabel.slice(0, 64),
        channel: item.channel,
        kind: item.kind,
        number: item.number,
        inverted: Boolean(item.inverted),
        isToggle: Boolean(item.isToggle),
      }));
  } catch {
    return [];
  }
}

export function saveMidiMappings(mappings: MidiMappingEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  } catch {
    // Ignore storage quota / privacy errors
  }
}

export function getDefaultConsoleMidiPreset(): MidiMappingEntry[] {
  return [
    {id: 'm-trk0-vol', targetId: 'track.0.volume', targetLabel: 'Track 1 · Level', channel: 1, kind: 'cc', number: 1},
    {id: 'm-trk1-vol', targetId: 'track.1.volume', targetLabel: 'Track 2 · Level', channel: 1, kind: 'cc', number: 2},
    {id: 'm-trk2-vol', targetId: 'track.2.volume', targetLabel: 'Track 3 · Level', channel: 1, kind: 'cc', number: 3},
    {id: 'm-trk3-vol', targetId: 'track.3.volume', targetLabel: 'Track 4 · Level', channel: 1, kind: 'cc', number: 4},
    {id: 'm-trk0-pan', targetId: 'track.0.pan', targetLabel: 'Track 1 · Pan', channel: 1, kind: 'cc', number: 10},
    {id: 'm-trk0-rev', targetId: 'track.0.reverbSend', targetLabel: 'Track 1 · Reverb Send', channel: 1, kind: 'cc', number: 14},
    {id: 'm-tanp-vol', targetId: 'tanpura.volume', targetLabel: 'Tanpura · Drone Level', channel: 1, kind: 'cc', number: 15},
    {id: 'm-mst-vol', targetId: 'master.volume', targetLabel: 'Master · Gain', channel: 1, kind: 'cc', number: 7},
    {id: 'm-mst-rev', targetId: 'master.reverbMix', targetLabel: 'Master · Reverb Mix', channel: 1, kind: 'cc', number: 91},
    {id: 'm-mst-del', targetId: 'master.delayMix', targetLabel: 'Master · Delay Mix', channel: 1, kind: 'cc', number: 94},
  ];
}

export function scaleMidiValue(
  rawValue: number, // 0..127
  min: number,
  max: number,
  step: number,
  inverted = false,
  centerDetentZero = false
): number {
  const normRaw = Math.max(0, Math.min(127, rawValue)) / 127;
  const norm = inverted ? 1 - normRaw : normRaw;

  // Snap hardware center detent (CC 64) precisely to midpoint when symmetric
  if (centerDetentZero && Math.abs(rawValue - 64) <= 1 && min < 0 && max > 0) {
    return 0;
  }

  const raw = min + norm * (max - min);
  const snapped = Math.round(raw / step) * step;
  return Math.max(min, Math.min(max, Number(snapped.toFixed(4))));
}

export function parseMidiMessage(data: Uint8Array, deviceName: string): MidiIncomingEvent | null {
  if (!data || data.length < 2) return null;
  const status = data[0];
  const msgType = status & 0xf0;
  const channel = (status & 0x0f) + 1;
  const data1 = data[1];
  const data2 = data.length > 2 ? data[2] : 0;

  if (msgType === 0xb0) {
    return {
      channel,
      kind: 'cc',
      number: data1,
      rawValue: data2,
      deviceName,
      timestamp: Date.now(),
    };
  }
  if (msgType === 0x90 && data2 > 0) {
    return {
      channel,
      kind: 'note',
      number: data1,
      rawValue: data2,
      deviceName,
      timestamp: Date.now(),
    };
  }
  return null;
}

export function isWebMidiSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';
}
