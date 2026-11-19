import type {StudioSession, StudioTrack} from '../types/studio';

function writeVarLen(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [];
  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

function strBytes(str: string): number[] {
  return Array.from(str).map((c) => c.charCodeAt(0) & 0x7f);
}

function u32Bytes(n: number): number[] {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

function u16Bytes(n: number): number[] {
  return [(n >>> 8) & 0xff, n & 0xff];
}

const PERCUSSION_GM_MAP: Record<number, number> = {
  0: 36, // Kick / Bass
  2: 38, // Snare / Na
  4: 42, // Closed Hat / Thom
  5: 46, // Open Hat / Tin
  7: 37, // Rim / Chapu
};

function buildFlattenedTracks(session: StudioSession): StudioTrack[] {
  const sections = session.sections;
  if (!sections || sections.length === 0) {
    return session.tracks;
  }

  const baseTracks = session.tracks.map((t) => ({...t, notes: [] as StudioTrack['notes']}));
  let stepOffset = 0;

  for (const sec of sections) {
    const reps = Math.max(1, sec.repeats || 1);
    for (let r = 0; r < reps; r++) {
      sec.tracks.forEach((secTrack, idx) => {
        const target = baseTracks[idx];
        if (!target) return;
        for (const n of secTrack.notes) {
          target.notes.push({
            ...n,
            id: `${sec.id}-${r}-${n.id}`,
            step: stepOffset + n.step,
          });
        }
      });
      stepOffset += session.totalSteps;
    }
  }
  return baseTracks;
}

function buildTrackChunk(
  track: StudioTrack | null,
  session: StudioSession,
  ppq: number,
  channel: number,
  isMetaTrack: boolean
): number[] {
  const events: Array<{tick: number; data: number[]}> = [];

  if (isMetaTrack) {
    const usPerQuarter = Math.round(60_000_000 / Math.max(30, session.bpm));
    events.push({
      tick: 0,
      data: [
        0xff,
        0x51,
        0x03,
        (usPerQuarter >>> 16) & 0xff,
        (usPerQuarter >>> 8) & 0xff,
        usPerQuarter & 0xff,
      ],
    });
    const name = strBytes(session.title.slice(0, 48));
    events.push({tick: 0, data: [0xff, 0x03, name.length, ...name]});
  } else if (track) {
    const name = strBytes(track.name.slice(0, 32));
    events.push({tick: 0, data: [0xff, 0x03, name.length, ...name]});

    const ticksPerStep = Math.round(ppq / Math.max(1, session.stepsPerBeat));
    const isPerc = track.role === 'percussion';
    const midiCh = isPerc ? 9 : channel % 16;

    for (const note of track.notes) {
      const startTick = Math.max(0, Math.round(note.step * ticksPerStep));
      const durTicks = Math.max(30, Math.round(note.durationSteps * ticksPerStep * 0.9));
      const midiPitch = isPerc
        ? PERCUSSION_GM_MAP[note.semitoneOffset] ?? 36
        : Math.max(24, Math.min(108, session.rootMidi + note.semitoneOffset));
      const vel = Math.max(16, Math.min(127, Math.round(note.velocity * track.volume * 118)));

      events.push({tick: startTick, data: [0x90 | midiCh, midiPitch, vel]});
      events.push({tick: startTick + durTicks, data: [0x80 | midiCh, midiPitch, 0]});
    }
  }

  events.sort((a, b) => a.tick - b.tick);

  const trackData: number[] = [];
  let lastTick = 0;
  for (const ev of events) {
    const delta = Math.max(0, ev.tick - lastTick);
    lastTick = ev.tick;
    trackData.push(...writeVarLen(delta), ...ev.data);
  }
  trackData.push(0x00, 0xff, 0x2f, 0x00);

  return [...strBytes('MTrk'), ...u32Bytes(trackData.length), ...trackData];
}

export function exportSessionToMidiBlob(session: StudioSession): Blob {
  const ppq = 480;
  const flattened = buildFlattenedTracks(session);
  const activeTracks = flattened.filter((t) => !t.muted);
  const trackCount = 1 + activeTracks.length;

  const header = [
    ...strBytes('MThd'),
    ...u32Bytes(6),
    ...u16Bytes(1),
    ...u16Bytes(trackCount),
    ...u16Bytes(ppq),
  ];

  const chunks: number[] = [...header];
  chunks.push(...buildTrackChunk(null, session, ppq, 0, true));

  let melodicCh = 0;
  for (const track of activeTracks) {
    const ch = track.role === 'percussion' ? 9 : melodicCh === 9 ? ++melodicCh : melodicCh;
    if (track.role !== 'percussion') melodicCh++;
    chunks.push(...buildTrackChunk(track, session, ppq, ch, false));
  }

  return new Blob([new Uint8Array(chunks)], {type: 'audio/midi'});
}
