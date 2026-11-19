/**
 * Minimal structural mock of the Web Audio API, sufficient to exercise
 * audioEngine.ts's graph-construction and voice-synthesis code paths
 * without a real audio backend (jsdom provides none). It intentionally
 * does not simulate real DSP/audio output - it verifies the engine wires
 * nodes together and runs to completion without throwing, not that the
 * resulting sound is correct. Deep scheduling/rendering behavior is
 * better verified by manual/browser audio QA than by mocks like this.
 */

const PARAM_NAMES = new Set([
  'gain',
  'frequency',
  'Q',
  'detune',
  'pan',
  'delayTime',
  'threshold',
  'knee',
  'ratio',
  'attack',
  'release',
  'playbackRate',
]);

function makeParam(defaultValue = 1) {
  const param: Record<string, unknown> = {value: defaultValue};
  for (const method of [
    'setValueAtTime',
    'linearRampToValueAtTime',
    'exponentialRampToValueAtTime',
    'setTargetAtTime',
    'cancelScheduledValues',
    'setValueCurveAtTime',
  ]) {
    param[method] = () => param;
  }
  return param;
}

function makeNode(extra: Record<string, unknown> = {}) {
  const store: Record<string, unknown> = {...extra};
  return new Proxy(store, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      if (['connect', 'disconnect', 'start', 'stop', 'close'].includes(prop)) {
        return () => undefined;
      }
      if (PARAM_NAMES.has(prop)) {
        const param = makeParam(prop === 'playbackRate' ? 1 : 0);
        target[prop] = param;
        return param;
      }
      return undefined;
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
  });
}

function makeAudioBuffer(numberOfChannels: number, length: number, sampleRate: number) {
  const channels = Array.from({length: numberOfChannels}, () => new Float32Array(length));
  return {
    numberOfChannels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: (ch: number) => channels[ch],
  };
}

class MockAudioContextBase {
  sampleRate = 44100;
  currentTime = 0;
  destination = makeNode();
  state: 'running' | 'suspended' | 'closed' = 'running';

  createGain() {
    return makeNode({gain: makeParam(1)});
  }
  createBiquadFilter() {
    return makeNode({type: 'lowpass', frequency: makeParam(350), Q: makeParam(1), gain: makeParam(0)});
  }
  createStereoPanner() {
    return makeNode({pan: makeParam(0)});
  }
  createWaveShaper() {
    return makeNode({curve: null, oversample: 'none'});
  }
  createConvolver() {
    return makeNode({buffer: null, normalize: true});
  }
  createDelay(_maxDelayTime?: number) {
    return makeNode({delayTime: makeParam(0)});
  }
  createDynamicsCompressor() {
    return makeNode({
      threshold: makeParam(-24),
      knee: makeParam(30),
      ratio: makeParam(12),
      attack: makeParam(0.003),
      release: makeParam(0.25),
      reduction: 0,
    });
  }
  createAnalyser() {
    return makeNode({
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      frequencyBinCount: 1024,
      getByteFrequencyData: () => undefined,
      getByteTimeDomainData: () => undefined,
      getFloatFrequencyData: () => undefined,
      getFloatTimeDomainData: () => undefined,
    });
  }
  createOscillator() {
    return makeNode({type: 'sine', frequency: makeParam(440), detune: makeParam(0)});
  }
  createBufferSource() {
    return makeNode({buffer: null, loop: false, playbackRate: makeParam(1)});
  }
  createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
    return makeAudioBuffer(numberOfChannels, length, sampleRate);
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

export class MockAudioContext extends MockAudioContextBase {}

export class MockOfflineAudioContext extends MockAudioContextBase {
  length: number;
  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    super();
    this.length = length;
    this.sampleRate = sampleRate;
  }
  startRendering() {
    return Promise.resolve(makeAudioBuffer(2, this.length, this.sampleRate));
  }
}

export function installWebAudioMock(): void {
  // @ts-expect-error - test-only global shim for an environment with no real Web Audio API
  globalThis.AudioContext = MockAudioContext;
  // @ts-expect-error - test-only global shim
  globalThis.OfflineAudioContext = MockOfflineAudioContext;
  // @ts-expect-error - test-only global shim (jsdom's window needs it too)
  window.AudioContext = MockAudioContext;
  // @ts-expect-error - test-only global shim
  window.OfflineAudioContext = MockOfflineAudioContext;
}
