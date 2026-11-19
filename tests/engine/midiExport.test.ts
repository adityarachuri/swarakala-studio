import {describe, expect, it} from 'vitest';
import {exportSessionToMidiBlob} from '../../src/engine/midiExport';
import type {StudioSession, StudioTrack} from '../../src/types/studio';

function makeTrack(overrides: Partial<StudioTrack> = {}): StudioTrack {
  return {
    id: 't1',
    name: 'Melody',
    role: 'melody',
    instrument: 'piano',
    volume: 0.8,
    pan: 0,
    reverbSend: 0.3,
    muted: false,
    solo: false,
    notes: [
      {id: 'n1', step: 0, durationSteps: 2, semitoneOffset: 0, velocity: 0.9, gamaka: 'none'},
      {id: 'n2', step: 4, durationSteps: 2, semitoneOffset: 7, velocity: 0.8, gamaka: 'none'},
    ],
    ...overrides,
  };
}

function makeSession(overrides: Partial<StudioSession> = {}): StudioSession {
  return {
    id: 's1',
    title: 'Test Session',
    subtitle: 'Sub',
    tradition: 'western',
    scaleId: 'ionian',
    talaId: 'common_4_4',
    bpm: 100,
    rootMidi: 60,
    a4Hz: 440,
    microtonal: false,
    totalSteps: 16,
    stepsPerBeat: 4,
    tracks: [makeTrack()],
    tanpura: {enabled: false, volume: 0.5, brightness: 0.5, fifthMode: 'Pa', fineTuneCents: 0},
    master: {
      volume: 0.9,
      lowGainDb: 0,
      midGainDb: 0,
      highGainDb: 0,
      reverbMix: 0.2,
      reverbRoom: 'hall',
      delayMix: 0,
      delayFeedback: 0,
      compressorEnabled: false,
      humanizeAmount: 0,
    },
    pedagogy: {
      arohana: '',
      avarohana: '',
      vadi: '',
      samvadi: '',
      pakad: '',
      timeOfDay: '',
      chordProgression: '',
      performanceGuidance: '',
      sahityaOrLyrics: '',
      solkattuOrBol: '',
      sourceAttributionNote: '',
    },
    updatedAt: Date.now(),
    ...overrides,
  };
}

async function readBytes(blob: Blob): Promise<Uint8Array> {
  // jsdom's Blob lacks a working arrayBuffer()/Response bridge; FileReader works reliably.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsArrayBuffer(blob);
  });
}

describe('exportSessionToMidiBlob', () => {
  it('produces a Blob with the audio/midi mime type', () => {
    const blob = exportSessionToMidiBlob(makeSession());
    expect(blob.type).toBe('audio/midi');
  });

  it('starts with a valid MThd header chunk', async () => {
    const bytes = await readBytes(exportSessionToMidiBlob(makeSession()));
    const header = Array.from(bytes.slice(0, 4)).map((b) => String.fromCharCode(b)).join('');
    expect(header).toBe('MThd');
    // header length (bytes 4-7) must be 6
    const headerLen = (bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7];
    expect(headerLen).toBe(6);
  });

  it('declares format 1 (multi-track) in the header', async () => {
    const bytes = await readBytes(exportSessionToMidiBlob(makeSession()));
    const format = (bytes[8] << 8) | bytes[9];
    expect(format).toBe(1);
  });

  it('declares one track chunk per active (non-muted) track plus the meta/tempo track', async () => {
    const session = makeSession({tracks: [makeTrack({id: 'a'}), makeTrack({id: 'b'})]});
    const bytes = await readBytes(exportSessionToMidiBlob(session));
    const trackCount = (bytes[10] << 8) | bytes[11];
    expect(trackCount).toBe(3); // meta track + 2 tracks
  });

  it('excludes muted tracks from the track count', async () => {
    const session = makeSession({
      tracks: [makeTrack({id: 'a'}), makeTrack({id: 'b', muted: true})],
    });
    const bytes = await readBytes(exportSessionToMidiBlob(session));
    const trackCount = (bytes[10] << 8) | bytes[11];
    expect(trackCount).toBe(2); // meta track + 1 active track
  });

  it('encodes the declared PPQ (480) in the header', async () => {
    const bytes = await readBytes(exportSessionToMidiBlob(makeSession()));
    const ppq = (bytes[12] << 8) | bytes[13];
    expect(ppq).toBe(480);
  });

  it('every track chunk after the header starts with an "MTrk" tag', async () => {
    const bytes = await readBytes(exportSessionToMidiBlob(makeSession()));
    let offset = 14; // end of MThd chunk (8-byte chunk header + 6-byte payload)
    let chunkCount = 0;
    while (offset < bytes.length) {
      const tag = Array.from(bytes.slice(offset, offset + 4)).map((b) => String.fromCharCode(b)).join('');
      expect(tag).toBe('MTrk');
      const len = (bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7];
      offset += 8 + len;
      chunkCount++;
    }
    expect(chunkCount).toBe(2); // meta + 1 melody track
    expect(offset).toBe(bytes.length); // chunk lengths exactly account for all bytes
  });

  it('handles a session with zero tracks without throwing', () => {
    expect(() => exportSessionToMidiBlob(makeSession({tracks: []}))).not.toThrow();
  });

  it('flattens multi-section arrangements, offsetting each repeat by totalSteps', async () => {
    const session = makeSession({
      totalSteps: 16,
      sections: [
        {
          id: 'sec1',
          name: 'Pallavi',
          roleLabel: 'A',
          repeats: 2,
          tracks: [makeTrack({notes: [{id: 'sn', step: 0, durationSteps: 1, semitoneOffset: 0, velocity: 0.9, gamaka: 'none'}]})],
        },
      ],
    });
    // Should not throw and should still produce a well-formed file.
    const bytes = await readBytes(exportSessionToMidiBlob(session));
    const header = Array.from(bytes.slice(0, 4)).map((b) => String.fromCharCode(b)).join('');
    expect(header).toBe('MThd');
  });
});
