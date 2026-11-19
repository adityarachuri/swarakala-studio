import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {installWebAudioMock} from '../mocks/webAudioMock';
import type {InstrumentId, StudioSession} from '../../src/types/studio';

installWebAudioMock();
// audioEngine must be imported after the Web Audio mock is installed, and
// fresh per test file since it is a module-level singleton.
const {audioEngine} = await import('../../src/engine/audioEngine');

function makeSession(overrides: Partial<StudioSession> = {}): StudioSession {
  return {
    id: 's1',
    title: 'Test',
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
    tracks: [
      {
        id: 't1',
        name: 'Melody',
        role: 'melody',
        instrument: 'piano',
        volume: 0.8,
        pan: 0,
        reverbSend: 0.3,
        muted: false,
        solo: false,
        notes: [{id: 'n1', step: 0, durationSteps: 2, semitoneOffset: 0, velocity: 0.9, gamaka: 'none'}],
      },
      {
        id: 't2',
        name: 'Beat',
        role: 'percussion',
        instrument: 'drums',
        volume: 0.8,
        pan: 0,
        reverbSend: 0.2,
        muted: false,
        solo: false,
        notes: [{id: 'n2', step: 0, durationSteps: 1, semitoneOffset: 0, velocity: 0.9, gamaka: 'none'}],
      },
    ],
    tanpura: {enabled: true, volume: 0.5, brightness: 0.5, fifthMode: 'Pa', fineTuneCents: 0},
    master: {
      volume: 0.9,
      lowGainDb: 0,
      midGainDb: 0,
      highGainDb: 0,
      reverbMix: 0.2,
      reverbRoom: 'hall',
      delayMix: 0.1,
      delayFeedback: 0.2,
      compressorEnabled: true,
      humanizeAmount: 0.1,
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

const ALL_INSTRUMENTS: InstrumentId[] = [
  'veena',
  'sitar',
  'bansuri',
  'nadaswaram',
  'santoor',
  'violin',
  'harmonium',
  'piano',
  'rhodes',
  'celesta',
  'stringsEnsemble',
  'frenchHorn',
  'synthPad',
  'bass',
  'mridangam',
  'tabla',
  'drums',
];

afterEach(() => {
  audioEngine.stopTransport();
});

describe('audioEngine (structural smoke test against a mocked Web Audio API)', () => {
  it('ensureContext builds the master bus graph without throwing', async () => {
    audioEngine.setSession(makeSession());
    await expect(audioEngine.ensureContext()).resolves.toBeDefined();
  });

  it('getAnalyser returns a node once the context has been created', async () => {
    audioEngine.setSession(makeSession());
    await audioEngine.ensureContext();
    expect(audioEngine.getAnalyser()).toBeTruthy();
  });

  it('getPreciseStep returns null before playback starts', () => {
    audioEngine.setSession(makeSession());
    audioEngine.stopTransport();
    expect(audioEngine.getPreciseStep()).toBeNull();
  });

  it('applyMasterConfig does not throw once a context exists', async () => {
    const session = makeSession();
    audioEngine.setSession(session);
    await audioEngine.ensureContext();
    expect(() =>
      audioEngine.applyMasterConfig({...session.master, reverbRoom: 'sanctum', tapeWarmth: true})
    ).not.toThrow();
  });

  it('previewNote renders every melodic instrument without throwing', async () => {
    audioEngine.setSession(makeSession());
    for (const instrument of ALL_INSTRUMENTS) {
      if (instrument === 'mridangam' || instrument === 'tabla' || instrument === 'drums') continue;
      await expect(audioEngine.previewNote(instrument, 0, 'none')).resolves.not.toThrow();
    }
  });

  it('previewNote renders every percussion instrument without throwing', async () => {
    audioEngine.setSession(makeSession());
    for (const instrument of ['mridangam', 'tabla', 'drums'] as const) {
      await expect(audioEngine.previewNote(instrument, 0)).resolves.not.toThrow();
    }
  });

  it('previewNote renders every gamaka ornament without throwing', async () => {
    audioEngine.setSession(makeSession());
    for (const gamaka of ['none', 'kampita', 'meend', 'nokku', 'andolan', 'sphurita', 'staccato'] as const) {
      await expect(audioEngine.previewNote('veena', 2, gamaka)).resolves.not.toThrow();
    }
  });

  it('previewNote is a no-op when no session has been set', async () => {
    // A freshly-imported engine without setSession() should not throw.
    await expect(audioEngine.previewNote('piano', 0)).resolves.toBeUndefined();
  });

  describe('transport scheduling (fake timers)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      audioEngine.stopTransport();
      vi.useRealTimers();
    });

    it('starts playback, reports a numeric precise step, and stops cleanly', async () => {
      audioEngine.setSession(makeSession());
      await audioEngine.startTransport(0, false);
      expect(audioEngine.getPreciseStep()).not.toBeNull();
      vi.advanceTimersByTime(48); // two scheduler ticks
      audioEngine.stopTransport();
      expect(audioEngine.getPreciseStep()).toBeNull();
    });

    it('supports full-arrangement playback across song sections', async () => {
      const session = makeSession({
        sections: [
          {id: 'sec1', name: 'Pallavi', roleLabel: 'A', repeats: 1, tracks: makeSession().tracks},
        ],
        activeSectionId: 'sec1',
      });
      audioEngine.setSession(session);
      await expect(audioEngine.startTransport(0, true)).resolves.not.toThrow();
      vi.advanceTimersByTime(48);
    });

    it('syncTanpura schedules and can be disabled again without throwing', async () => {
      const session = makeSession();
      audioEngine.setSession(session);
      await audioEngine.syncTanpura(session.tanpura);
      vi.advanceTimersByTime(160); // a couple of tanpura scheduler ticks
      await expect(audioEngine.syncTanpura({...session.tanpura, enabled: false})).resolves.not.toThrow();
    });
  });

  describe('renderSessionToWavBlob (offline rendering)', () => {
    it('renders a simple session to a WAV blob with a valid RIFF/WAVE header', async () => {
      const blob = await audioEngine.renderSessionToWavBlob(makeSession(), 1, false);
      expect(blob.type).toBe('audio/wav');
      const bytes: Uint8Array = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
        reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
        reader.readAsArrayBuffer(blob);
      });
      const tag = (off: number, len: number) =>
        Array.from(bytes.slice(off, off + len)).map((b) => String.fromCharCode(b)).join('');
      expect(tag(0, 4)).toBe('RIFF');
      expect(tag(8, 4)).toBe('WAVE');
    });

    it('renders a multi-section arrangement (with tanpura enabled) without throwing', async () => {
      const base = makeSession();
      const session = makeSession({
        sections: [{id: 'sec1', name: 'Pallavi', roleLabel: 'A', repeats: 2, tracks: base.tracks}],
      });
      await expect(audioEngine.renderSessionToWavBlob(session, 1, true)).resolves.toBeInstanceOf(Blob);
    });

    it('renders a muted/solo mix of tracks without throwing', async () => {
      const base = makeSession();
      const session = makeSession({
        tracks: [
          {...base.tracks[0], solo: true},
          {...base.tracks[1], muted: true},
        ],
      });
      await expect(audioEngine.renderSessionToWavBlob(session, 1, false)).resolves.toBeInstanceOf(Blob);
    });
  });
});
