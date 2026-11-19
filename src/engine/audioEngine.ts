import type {
  GamakaType,
  InstrumentId,
  MasterBusConfig,
  ScaleDefinition,
  SongSection,
  StudioSession,
  StudioTrack,
  TalaDefinition,
  TanpuraConfig,
} from '../types/studio';
import {getFrequencyHz, getScaleById, getTalaById} from './musicTheory';

interface MasterNodes {
  dryBus: GainNode;
  reverbSendBus: GainNode;
  convolver: ConvolverNode;
  reverbReturn: GainNode;
  delayNode: DelayNode;
  delayFeedback: GainNode;
  delayReturn: GainNode;
  eqLow: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHigh: BiquadFilterNode;
  tapeShaper: WaveShaperNode;
  compressor: DynamicsCompressorNode;
  masterGain: GainNode;
  analyser: AnalyserNode;
  noiseBuffer: AudioBuffer;
}

function createNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createTapeCurve(warm: boolean): Float32Array<ArrayBuffer> {
  const samples = 256;
  const buf = new ArrayBuffer(samples * 4);
  const curve = new Float32Array(buf);
  const drive = warm ? 1.55 : 0.0;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = warm ? Math.tanh(x * drive) / Math.tanh(drive) : x;
  }
  return curve;
}

function createImpulseResponse(
  ctx: BaseAudioContext,
  room: MasterBusConfig['reverbRoom']
): AudioBuffer {
  const duration =
    room === 'sanctum' ? 2.6 : room === 'scoringStage' ? 2.25 : room === 'hall' ? 1.9 : 0.85;
  const decay =
    room === 'sanctum' ? 2.4 : room === 'scoringStage' ? 2.6 : room === 'hall' ? 2.9 : 3.8;
  const length = Math.floor(ctx.sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const channelData = impulse.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const white = Math.random() * 2 - 1;
      const damp = room === 'chamber' ? 0.35 : room === 'scoringStage' ? 0.24 : 0.18;
      lp = lp + damp * (white - lp);
      channelData[i] = lp * Math.pow(1 - t, decay) * 0.65;
    }
  }
  return impulse;
}

function buildMasterGraph(ctx: BaseAudioContext, master: MasterBusConfig): MasterNodes {
  const dryBus = ctx.createGain();
  const reverbSendBus = ctx.createGain();
  const convolver = ctx.createConvolver();
  convolver.buffer = createImpulseResponse(ctx, master.reverbRoom);

  const reverbReturn = ctx.createGain();
  reverbReturn.gain.value = master.reverbMix;

  const delayNode = ctx.createDelay(1.5);
  delayNode.delayTime.value = 0.36;
  const delayFeedback = ctx.createGain();
  delayFeedback.gain.value = Math.min(0.7, master.delayFeedback);
  const delayFilter = ctx.createBiquadFilter();
  delayFilter.type = 'lowpass';
  delayFilter.frequency.value = 2800;
  const delayReturn = ctx.createGain();
  delayReturn.gain.value = master.delayMix;

  const eqLow = ctx.createBiquadFilter();
  eqLow.type = 'lowshelf';
  eqLow.frequency.value = 120;
  eqLow.gain.value = master.lowGainDb;

  const eqMid = ctx.createBiquadFilter();
  eqMid.type = 'peaking';
  eqMid.frequency.value = 1200;
  eqMid.Q.value = 0.9;
  eqMid.gain.value = master.midGainDb;

  const eqHigh = ctx.createBiquadFilter();
  eqHigh.type = 'highshelf';
  eqHigh.frequency.value = 5800;
  eqHigh.gain.value = master.highGainDb;

  const tapeShaper = ctx.createWaveShaper();
  tapeShaper.curve = createTapeCurve(Boolean(master.tapeWarmth));
  tapeShaper.oversample = '2x';

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = master.compressorEnabled ? -14 : 0;
  compressor.knee.value = 12;
  compressor.ratio.value = master.compressorEnabled ? 3.5 : 1;
  compressor.attack.value = 0.008;
  compressor.release.value = 0.18;

  const masterGain = ctx.createGain();
  masterGain.gain.value = master.volume;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.82;

  dryBus.connect(eqLow);

  reverbSendBus.connect(convolver);
  convolver.connect(reverbReturn);
  reverbReturn.connect(eqLow);

  reverbSendBus.connect(delayNode);
  delayNode.connect(delayFilter);
  delayFilter.connect(delayFeedback);
  delayFeedback.connect(delayNode);
  delayFilter.connect(delayReturn);
  delayReturn.connect(eqLow);

  eqLow.connect(eqMid);
  eqMid.connect(eqHigh);
  eqHigh.connect(tapeShaper);
  tapeShaper.connect(compressor);
  compressor.connect(masterGain);
  masterGain.connect(analyser);
  analyser.connect(ctx.destination);

  return {
    dryBus,
    reverbSendBus,
    convolver,
    reverbReturn,
    delayNode,
    delayFeedback,
    delayReturn,
    eqLow,
    eqMid,
    eqHigh,
    tapeShaper,
    compressor,
    masterGain,
    analyser,
    noiseBuffer: createNoiseBuffer(ctx),
  };
}

function applyGamakaModulation(
  ctx: BaseAudioContext,
  oscList: OscillatorNode[],
  gamaka: GamakaType,
  startTime: number,
  duration: number
) {
  if (gamaka === 'none' || gamaka === 'staccato') return;

  if (gamaka === 'meend') {
    for (const osc of oscList) {
      osc.detune.setValueAtTime(-200, startTime);
      osc.detune.exponentialRampToValueAtTime(
        0.5,
        startTime + Math.min(0.28, duration * 0.45)
      );
      osc.detune.setValueAtTime(0, startTime + Math.min(0.3, duration * 0.48));
    }
    return;
  }

  if (gamaka === 'nokku') {
    for (const osc of oscList) {
      osc.detune.setValueAtTime(160, startTime);
      osc.detune.linearRampToValueAtTime(0, startTime + Math.min(0.09, duration * 0.3));
    }
    return;
  }

  if (gamaka === 'sphurita') {
    // Classic Carnatic Sphurita: crisp lower/upper neighbor accentuate on repeat
    for (const osc of oscList) {
      osc.detune.setValueAtTime(-110, startTime);
      osc.detune.linearRampToValueAtTime(0, startTime + 0.045);
      if (duration > 0.14) {
        osc.detune.setValueAtTime(85, startTime + duration * 0.48);
        osc.detune.linearRampToValueAtTime(0, startTime + duration * 0.48 + 0.04);
      }
    }
    return;
  }

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = gamaka === 'andolan' ? 2.6 : 5.4;
  lfoGain.gain.value = gamaka === 'andolan' ? 26 : 38;
  lfo.connect(lfoGain);
  for (const osc of oscList) {
    lfoGain.connect(osc.detune);
  }
  lfo.start(startTime + 0.03);
  lfo.stop(startTime + duration + 0.15);
}

function triggerMelodicInstrument(
  ctx: BaseAudioContext,
  nodes: MasterNodes,
  instrument: InstrumentId,
  freq: number,
  startTime: number,
  duration: number,
  velocity: number,
  gamaka: GamakaType,
  trackGain: number,
  trackPan: number,
  reverbSend: number
) {
  const actualDuration = gamaka === 'staccato' ? Math.min(0.14, duration * 0.45) : duration;
  const gainNode = ctx.createGain();
  const panner = ctx.createStereoPanner();
  panner.pan.value = Math.max(-1, Math.min(1, trackPan));

  const dryOut = ctx.createGain();
  dryOut.gain.value = 1;
  const wetOut = ctx.createGain();
  wetOut.gain.value = reverbSend;

  gainNode.connect(panner);
  panner.connect(dryOut);
  panner.connect(wetOut);
  dryOut.connect(nodes.dryBus);
  wetOut.connect(nodes.reverbSendBus);

  const peak = Math.max(0.02, Math.min(0.85, velocity * trackGain * 0.38));

  if (instrument === 'veena' || instrument === 'sitar') {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = instrument === 'sitar' ? 'sawtooth' : 'triangle';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.frequency.setValueAtTime(freq * 2, startTime);
    osc2.detune.setValueAtTime(instrument === 'sitar' ? 5 : 2, startTime);

    const osc2Mix = ctx.createGain();
    osc2Mix.gain.value = instrument === 'sitar' ? 0.35 : 0.22;

    const filter = ctx.createBiquadFilter();
    filter.type = instrument === 'sitar' ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(
      instrument === 'sitar' ? Math.min(4800, freq * 5.2) : Math.min(4200, freq * 6),
      startTime
    );
    filter.Q.value = instrument === 'sitar' ? 2.2 : 1.4;
    if (instrument === 'veena') {
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(380, freq * 1.8),
        startTime + actualDuration + 0.35
      );
    }

    osc1.connect(filter);
    osc2.connect(osc2Mix);
    osc2Mix.connect(filter);
    filter.connect(gainNode);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peak, startTime + 0.008);
    gainNode.gain.exponentialRampToValueAtTime(peak * 0.32, startTime + actualDuration * 0.55);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + actualDuration + 0.38);

    applyGamakaModulation(ctx, [osc1, osc2], gamaka, startTime, actualDuration);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + actualDuration + 0.42);
    osc2.stop(startTime + actualDuration + 0.42);
    return;
  }

  if (instrument === 'nadaswaram') {
    // Rich carnatic double-reed shawm formant synthesis
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.frequency.setValueAtTime(freq, startTime);
    osc2.detune.setValueAtTime(4, startTime);

    const osc2Mix = ctx.createGain();
    osc2Mix.gain.value = 0.18;

    const formant = ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(Math.min(3600, Math.max(950, freq * 2.4)), startTime);
    formant.Q.value = 1.9;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(4400, startTime);

    osc1.connect(formant);
    osc2.connect(osc2Mix);
    osc2Mix.connect(formant);
    formant.connect(lp);
    lp.connect(gainNode);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peak * 0.92, startTime + 0.025);
    gainNode.gain.setValueAtTime(peak * 0.86, startTime + Math.max(0.03, actualDuration - 0.03));
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + actualDuration + 0.16);

    const effective = gamaka === 'none' ? 'kampita' : gamaka;
    applyGamakaModulation(ctx, [osc1, osc2], effective, startTime, actualDuration);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + actualDuration + 0.2);
    osc2.stop(startTime + actualDuration + 0.2);
    return;
  }

  if (instrument === 'santoor') {
    // Kashmir 100-string hammered trapezoid zither: paired chorused metallic shimmer
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'triangle';
    osc3.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.frequency.setValueAtTime(freq, startTime);
    osc2.detune.setValueAtTime(6.5, startTime);
    osc3.frequency.setValueAtTime(freq * 3, startTime);

    const g3 = ctx.createGain();
    g3.gain.value = 0.18;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(8200, freq * 8), startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(520, freq * 2.1), startTime + actualDuration + 0.5);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(g3);
    g3.connect(filter);
    filter.connect(gainNode);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peak * 0.85, startTime + 0.004);
    gainNode.gain.exponentialRampToValueAtTime(peak * 0.28, startTime + actualDuration * 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + actualDuration + 0.55);

    osc1.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);
    osc1.stop(startTime + actualDuration + 0.6);
    osc2.stop(startTime + actualDuration + 0.6);
    osc3.stop(startTime + actualDuration + 0.6);
    return;
  }

  if (instrument === 'celesta') {
    const carrier = ctx.createOscillator();
    const harmonic = ctx.createOscillator();
    carrier.type = 'sine';
    harmonic.type = 'sine';
    carrier.frequency.setValueAtTime(freq, startTime);
    harmonic.frequency.setValueAtTime(freq * 4, startTime);
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(0.24, startTime);
    hg.gain.exponentialRampToValueAtTime(0.01, startTime + 0.18);

    carrier.connect(gainNode);
    harmonic.connect(hg);
    hg.connect(gainNode);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peak * 0.88, startTime + 0.004);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + actualDuration + 0.65);

    carrier.start(startTime);
    harmonic.start(startTime);
    carrier.stop(startTime + actualDuration + 0.7);
    harmonic.stop(startTime + actualDuration + 0.7);
    return;
  }

  if (instrument === 'stringsEnsemble' || instrument === 'frenchHorn') {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc3.type = instrument === 'frenchHorn' ? 'triangle' : 'sawtooth';

    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.frequency.setValueAtTime(freq, startTime);
    osc3.frequency.setValueAtTime(freq * (instrument === 'frenchHorn' ? 0.5 : 1), startTime);

    osc1.detune.setValueAtTime(instrument === 'frenchHorn' ? -4 : -11, startTime);
    osc2.detune.setValueAtTime(instrument === 'frenchHorn' ? 4 : 11, startTime);

    const subGain = ctx.createGain();
    subGain.gain.value = instrument === 'frenchHorn' ? 0.35 : 0.4;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    if (instrument === 'frenchHorn') {
      filter.frequency.setValueAtTime(Math.max(400, freq * 1.6), startTime);
      filter.frequency.linearRampToValueAtTime(Math.min(2800, freq * 4.4), startTime + Math.min(0.18, actualDuration * 0.5));
      filter.Q.value = 1.6;
    } else {
      filter.frequency.setValueAtTime(3400, startTime);
      filter.Q.value = 0.75;
    }

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(subGain);
    subGain.connect(filter);
    filter.connect(gainNode);

    const attack = instrument === 'frenchHorn' ? 0.095 : 0.14;
    const release = instrument === 'frenchHorn' ? 0.25 : 0.42;

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peak * 0.76, startTime + attack);
    gainNode.gain.setValueAtTime(peak * 0.7, startTime + Math.max(attack + 0.02, actualDuration - 0.03));
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + actualDuration + release);

    applyGamakaModulation(ctx, [osc1, osc2, osc3], gamaka, startTime, actualDuration);

    osc1.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);
    osc1.stop(startTime + actualDuration + release + 0.05);
    osc2.stop(startTime + actualDuration + release + 0.05);
    osc3.stop(startTime + actualDuration + release + 0.05);
    return;
  }

  if (instrument === 'bansuri') {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.frequency.setValueAtTime(freq, startTime);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.22;

    const noise = ctx.createBufferSource();
    noise.buffer = nodes.noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = Math.min(4500, freq * 2.5);
    noiseFilter.Q.value = 3.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, startTime);
    noiseGain.gain.linearRampToValueAtTime(peak * 0.16, startTime + 0.03);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);

    osc1.connect(gainNode);
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peak * 0.9, startTime + 0.055);
    gainNode.gain.setValueAtTime(peak * 0.85, startTime + Math.max(0.06, actualDuration - 0.04));
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + actualDuration + 0.14);

    const effectiveGamaka = gamaka === 'none' ? 'kampita' : gamaka;
    applyGamakaModulation(ctx, [osc1, osc2], effectiveGamaka, startTime, actualDuration);

    noise.start(startTime);
    noise.stop(startTime + 0.18);
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + actualDuration + 0.18);
    osc2.stop(startTime + actualDuration + 0.18);
    return;
  }

  if (instrument === 'violin' || instrument === 'harmonium' || instrument === 'synthPad') {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = instrument === 'synthPad' ? 'triangle' : 'sawtooth';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.frequency.setValueAtTime(freq, startTime);
    osc1.detune.setValueAtTime(-6, startTime);
    osc2.detune.setValueAtTime(6, startTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(
      instrument === 'synthPad' ? 1900 : instrument === 'harmonium' ? 2400 : 3200,
      startTime
    );
    filter.Q.value = 1.0;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);

    const attack = instrument === 'synthPad' ? 0.16 : instrument === 'violin' ? 0.07 : 0.025;
    const release = instrument === 'synthPad' ? 0.45 : 0.16;

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peak * 0.72, startTime + attack);
    gainNode.gain.setValueAtTime(
      peak * 0.65,
      startTime + Math.max(attack + 0.02, actualDuration - 0.03)
    );
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + actualDuration + release);

    applyGamakaModulation(ctx, [osc1, osc2], gamaka, startTime, actualDuration);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + actualDuration + release + 0.05);
    osc2.stop(startTime + actualDuration + release + 0.05);
    return;
  }

  if (instrument === 'rhodes') {
    const carrier = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    carrier.type = 'sine';
    mod.type = 'sine';
    carrier.frequency.setValueAtTime(freq, startTime);
    mod.frequency.setValueAtTime(freq * 7, startTime);

    modGain.gain.setValueAtTime(freq * 1.4, startTime);
    modGain.gain.exponentialRampToValueAtTime(1, startTime + 0.14);

    mod.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(gainNode);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peak * 0.95, startTime + 0.006);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + actualDuration + 0.55);

    carrier.start(startTime);
    mod.start(startTime);
    carrier.stop(startTime + actualDuration + 0.6);
    mod.stop(startTime + actualDuration + 0.6);
    return;
  }

  if (instrument === 'bass') {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.frequency.setValueAtTime(freq * 0.5, startTime);

    const subGain = ctx.createGain();
    subGain.gain.value = 0.5;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.max(320, freq * 4), startTime);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(180, freq * 1.6),
      startTime + actualDuration
    );

    osc1.connect(filter);
    osc2.connect(subGain);
    subGain.connect(filter);
    filter.connect(gainNode);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peak * 1.05, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + actualDuration + 0.18);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + actualDuration + 0.22);
    osc2.stop(startTime + actualDuration + 0.22);
    return;
  }

  // Default: Concert Grand Piano
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc2.type = 'sine';
  osc3.type = 'sawtooth';
  osc1.frequency.setValueAtTime(freq, startTime);
  osc2.frequency.setValueAtTime(freq * 2, startTime);
  osc3.frequency.setValueAtTime(freq * 3, startTime);

  const g2 = ctx.createGain();
  g2.gain.value = 0.28;
  const g3 = ctx.createGain();
  g3.gain.value = 0.08;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(7500, freq * (4 + velocity * 5)), startTime);
  filter.frequency.exponentialRampToValueAtTime(
    Math.max(420, freq * 1.5),
    startTime + actualDuration + 0.5
  );

  osc1.connect(filter);
  osc2.connect(g2);
  g2.connect(filter);
  osc3.connect(g3);
  g3.connect(filter);
  filter.connect(gainNode);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(peak * 1.0, startTime + 0.006);
  gainNode.gain.exponentialRampToValueAtTime(peak * 0.42, startTime + actualDuration * 0.4);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + actualDuration + 0.5);

  osc1.start(startTime);
  osc2.start(startTime);
  osc3.start(startTime);
  osc1.stop(startTime + actualDuration + 0.55);
  osc2.stop(startTime + actualDuration + 0.55);
  osc3.stop(startTime + actualDuration + 0.55);
}

function triggerPercussionVoice(
  ctx: BaseAudioContext,
  nodes: MasterNodes,
  instrument: InstrumentId,
  laneSemitone: number,
  rootHz: number,
  startTime: number,
  velocity: number,
  trackGain: number,
  trackPan: number,
  reverbSend: number
) {
  const gainNode = ctx.createGain();
  const panner = ctx.createStereoPanner();
  panner.pan.value = Math.max(-1, Math.min(1, trackPan));

  const dryOut = ctx.createGain();
  dryOut.gain.value = 1;
  const wetOut = ctx.createGain();
  wetOut.gain.value = reverbSend * 0.65;

  gainNode.connect(panner);
  panner.connect(dryOut);
  panner.connect(wetOut);
  dryOut.connect(nodes.dryBus);
  wetOut.connect(nodes.reverbSendBus);

  const peak = Math.max(0.05, Math.min(0.95, velocity * trackGain * 0.55));
  const tunedSa = Math.max(110, Math.min(260, rootHz));

  if (laneSemitone === 0) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const startF = instrument === 'drums' ? 145 : instrument === 'tabla' ? 175 : 155;
    const endF = instrument === 'drums' ? 48 : instrument === 'tabla' ? 74 : 66;
    osc.frequency.setValueAtTime(startF, startTime);
    osc.frequency.exponentialRampToValueAtTime(endF, startTime + 0.09);

    osc.connect(gainNode);
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peak * 1.1, startTime + 0.004);
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + (instrument === 'tabla' ? 0.34 : 0.26)
    );

    osc.start(startTime);
    osc.stop(startTime + 0.38);
    return;
  }

  if (laneSemitone === 2) {
    if (instrument === 'drums') {
      const noise = ctx.createBufferSource();
      noise.buffer = nodes.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1100;
      const body = ctx.createOscillator();
      body.type = 'triangle';
      body.frequency.setValueAtTime(195, startTime);
      body.frequency.exponentialRampToValueAtTime(110, startTime + 0.08);
      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(peak * 0.7, startTime);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);

      noise.connect(filter);
      filter.connect(gainNode);
      body.connect(bodyGain);
      bodyGain.connect(panner);

      gainNode.gain.setValueAtTime(peak * 0.75, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

      noise.start(startTime);
      noise.stop(startTime + 0.2);
      body.start(startTime);
      body.stop(startTime + 0.16);
      return;
    }
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(tunedSa * 2, startTime);
    osc2.frequency.setValueAtTime(tunedSa * 3.16, startTime);
    const o2g = ctx.createGain();
    o2g.gain.value = 0.28;
    osc1.connect(gainNode);
    osc2.connect(o2g);
    o2g.connect(gainNode);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peak * 0.85, startTime + 0.003);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.24);
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + 0.28);
    osc2.stop(startTime + 0.28);
    return;
  }

  if (laneSemitone === 4) {
    const noise = ctx.createBufferSource();
    noise.buffer = nodes.noiseBuffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = instrument === 'drums' ? 6800 : 2800;
    noise.connect(hp);
    hp.connect(gainNode);
    gainNode.gain.setValueAtTime(peak * 0.45, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.065);
    noise.start(startTime);
    noise.stop(startTime + 0.08);
    return;
  }

  if (laneSemitone === 5) {
    if (instrument === 'drums') {
      const noise = ctx.createBufferSource();
      noise.buffer = nodes.noiseBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 5400;
      noise.connect(hp);
      hp.connect(gainNode);
      gainNode.gain.setValueAtTime(peak * 0.5, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);
      noise.start(startTime);
      noise.stop(startTime + 0.3);
    } else {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(tunedSa * 2.5, startTime);
      osc.connect(gainNode);
      gainNode.gain.setValueAtTime(peak * 0.72, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);
      osc.start(startTime);
      osc.stop(startTime + 0.32);
    }
    return;
  }

  const rim = ctx.createOscillator();
  rim.type = 'triangle';
  rim.frequency.setValueAtTime(instrument === 'drums' ? 860 : tunedSa * 4.2, startTime);
  rim.frequency.exponentialRampToValueAtTime(320, startTime + 0.04);
  rim.connect(gainNode);
  gainNode.gain.setValueAtTime(peak * 0.65, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.07);
  rim.start(startTime);
  rim.stop(startTime + 0.09);
}

function triggerTanpuraString(
  ctx: BaseAudioContext,
  nodes: MasterNodes,
  freq: number,
  startTime: number,
  volume: number,
  brightness: number
) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc2.type = 'sawtooth';
  osc3.type = 'sawtooth';
  osc1.frequency.setValueAtTime(freq, startTime);
  osc2.frequency.setValueAtTime(freq * 2, startTime);
  osc3.frequency.setValueAtTime(freq * 3, startTime);
  osc2.detune.setValueAtTime(1.8, startTime);
  osc3.detune.setValueAtTime(-1.5, startTime);

  const g2 = ctx.createGain();
  g2.gain.value = 0.25 + brightness * 0.25;
  const g3 = ctx.createGain();
  g3.gain.value = 0.1 + brightness * 0.22;

  const jivari = ctx.createBiquadFilter();
  jivari.type = 'bandpass';
  jivari.Q.value = 1.6;
  jivari.frequency.setValueAtTime(freq * 2.2, startTime);
  jivari.frequency.exponentialRampToValueAtTime(
    Math.min(4800, freq * (5.5 + brightness * 4)),
    startTime + 1.15
  );
  jivari.frequency.exponentialRampToValueAtTime(freq * 1.8, startTime + 2.7);

  const directLp = ctx.createBiquadFilter();
  directLp.type = 'lowpass';
  directLp.frequency.value = 1100 + brightness * 2400;

  const env = ctx.createGain();
  const amp = Math.max(0.01, volume * 0.16);
  env.gain.setValueAtTime(0.0001, startTime);
  env.gain.linearRampToValueAtTime(amp, startTime + 0.14);
  env.gain.exponentialRampToValueAtTime(amp * 0.45, startTime + 1.4);
  env.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.85);

  osc1.connect(directLp);
  osc2.connect(g2);
  g2.connect(jivari);
  osc3.connect(g3);
  g3.connect(jivari);

  directLp.connect(env);
  jivari.connect(env);

  const wet = ctx.createGain();
  wet.gain.value = 0.42;
  env.connect(nodes.dryBus);
  env.connect(wet);
  wet.connect(nodes.reverbSendBus);

  osc1.start(startTime);
  osc2.start(startTime);
  osc3.start(startTime);
  osc1.stop(startTime + 2.9);
  osc2.stop(startTime + 2.9);
  osc3.stop(startTime + 2.9);
}

class SwaraKalaAudioEngine {
  private ctx: AudioContext | null = null;
  private nodes: MasterNodes | null = null;
  private isPlaying = false;
  private arrangementMode = false;
  private activeArrangementSectionIdx = 0;
  private currentSectionRepeat = 0;
  private currentStep = 0;
  private nextStepTime = 0;
  private schedulerTimer: number | null = null;
  private tanpuraTimer: number | null = null;
  private tanpuraStringIdx = 0;
  private nextTanpuraTime = 0;
  private session: StudioSession | null = null;
  private metronomeEnabled = false;
  private onStepChange: ((step: number) => void) | null = null;
  private onSectionChange: ((sectionId: string) => void) | null = null;
  private currentReverbRoom: MasterBusConfig['reverbRoom'] = 'hall';
  private currentTapeWarmth = false;

  public async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      this.ctx = new AudioCtx({latencyHint: 'interactive'});
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    if (!this.nodes && this.session) {
      this.nodes = buildMasterGraph(this.ctx, this.session.master);
      this.currentReverbRoom = this.session.master.reverbRoom;
      this.currentTapeWarmth = Boolean(this.session.master.tapeWarmth);
    }
    return this.ctx;
  }

  public setSession(session: StudioSession) {
    this.session = session;
    if (this.ctx && this.nodes) {
      this.applyMasterConfig(session.master);
    }
  }

  public setMetronome(enabled: boolean) {
    this.metronomeEnabled = enabled;
  }

  public setOnStepChange(cb: ((step: number) => void) | null) {
    this.onStepChange = cb;
  }

  public setOnSectionChange(cb: ((sectionId: string) => void) | null) {
    this.onSectionChange = cb;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.nodes?.analyser ?? null;
  }

  public getPreciseStep(): number | null {
    if (!this.isPlaying || !this.ctx || !this.session) return null;
    const secPerBeat = 60 / Math.max(30, this.session.bpm);
    const stepDuration = secPerBeat / Math.max(1, this.session.stepsPerBeat);
    if (stepDuration <= 0) return this.currentStep;
    const audibleStep =
      this.currentStep - (this.nextStepTime - this.ctx.currentTime) / stepDuration;
    const total = Math.max(1, this.session.totalSteps);
    return ((audibleStep % total) + total) % total;
  }

  public applyMasterConfig(master: MasterBusConfig) {
    if (!this.ctx || !this.nodes) return;
    const now = this.ctx.currentTime;
    this.nodes.masterGain.gain.setTargetAtTime(master.volume, now, 0.02);
    this.nodes.eqLow.gain.setTargetAtTime(master.lowGainDb, now, 0.03);
    this.nodes.eqMid.gain.setTargetAtTime(master.midGainDb, now, 0.03);
    this.nodes.eqHigh.gain.setTargetAtTime(master.highGainDb, now, 0.03);
    this.nodes.reverbReturn.gain.setTargetAtTime(master.reverbMix, now, 0.03);
    this.nodes.delayReturn.gain.setTargetAtTime(master.delayMix, now, 0.03);
    this.nodes.delayFeedback.gain.setTargetAtTime(
      Math.min(0.7, master.delayFeedback),
      now,
      0.03
    );
    this.nodes.compressor.threshold.setTargetAtTime(
      master.compressorEnabled ? -14 : 0,
      now,
      0.03
    );
    this.nodes.compressor.ratio.setTargetAtTime(
      master.compressorEnabled ? 3.5 : 1,
      now,
      0.03
    );
    if (master.reverbRoom !== this.currentReverbRoom) {
      this.currentReverbRoom = master.reverbRoom;
      this.nodes.convolver.buffer = createImpulseResponse(this.ctx, master.reverbRoom);
    }
    const nextTape = Boolean(master.tapeWarmth);
    if (nextTape !== this.currentTapeWarmth) {
      this.currentTapeWarmth = nextTape;
      this.nodes.tapeShaper.curve = createTapeCurve(nextTape);
    }
  }

  public async previewNote(
    instrument: InstrumentId,
    semitoneOffset: number,
    gamaka: GamakaType = 'none',
    durationSec = 0.45,
    velocity = 0.85
  ) {
    if (!this.session) return;
    const ctx = await this.ensureContext();
    if (!this.nodes) {
      this.nodes = buildMasterGraph(ctx, this.session.master);
    }
    const scale = getScaleById(this.session.scaleId);
    const rootHz = getFrequencyHz(
      0,
      this.session.rootMidi,
      this.session.a4Hz,
      this.session.microtonal,
      scale
    );

    if (instrument === 'mridangam' || instrument === 'tabla' || instrument === 'drums') {
      triggerPercussionVoice(
        ctx,
        this.nodes,
        instrument,
        semitoneOffset,
        rootHz,
        ctx.currentTime + 0.01,
        velocity,
        0.9,
        0,
        0.25
      );
      return;
    }

    const freq = getFrequencyHz(
      semitoneOffset,
      this.session.rootMidi,
      this.session.a4Hz,
      this.session.microtonal,
      scale
    );
    triggerMelodicInstrument(
      ctx,
      this.nodes,
      instrument,
      freq,
      ctx.currentTime + 0.01,
      durationSec,
      velocity,
      gamaka,
      0.85,
      0,
      0.3
    );
  }

  public async startTransport(fromStep = 0, playFullArrangement = false) {
    if (!this.session) return;
    const ctx = await this.ensureContext();
    if (!this.nodes) {
      this.nodes = buildMasterGraph(ctx, this.session.master);
    }
    this.stopTransport();
    this.isPlaying = true;
    this.arrangementMode =
      playFullArrangement && Boolean(this.session.sections && this.session.sections.length > 0);
    if (this.arrangementMode && this.session.sections) {
      const activeIdx = this.session.sections.findIndex(
        (s) => s.id === this.session?.activeSectionId
      );
      this.activeArrangementSectionIdx = activeIdx >= 0 ? activeIdx : 0;
      this.currentSectionRepeat = 0;
      this.onSectionChange?.(this.session.sections[this.activeArrangementSectionIdx].id);
    }
    this.currentStep = fromStep % this.session.totalSteps;
    this.nextStepTime = ctx.currentTime + 0.04;

    this.schedulerTimer = window.setInterval(() => this.scheduleLoop(), 24);
  }

  public stopTransport() {
    this.isPlaying = false;
    this.arrangementMode = false;
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.currentStep = 0;
    this.onStepChange?.(0);
  }

  public async syncTanpura(config: TanpuraConfig) {
    if (!config.enabled) {
      if (this.tanpuraTimer !== null) {
        window.clearInterval(this.tanpuraTimer);
        this.tanpuraTimer = null;
      }
      return;
    }
    const ctx = await this.ensureContext();
    if (!this.nodes && this.session) {
      this.nodes = buildMasterGraph(ctx, this.session.master);
    }
    if (this.tanpuraTimer === null) {
      this.nextTanpuraTime = ctx.currentTime + 0.05;
      this.tanpuraStringIdx = 0;
      this.tanpuraTimer = window.setInterval(() => this.scheduleTanpura(), 80);
    }
  }

  private scheduleTanpura() {
    if (!this.ctx || !this.nodes || !this.session || !this.session.tanpura.enabled) return;
    const lookahead = 0.25;
    const cfg = this.session.tanpura;
    const scale = getScaleById(this.session.scaleId);

    while (this.nextTanpuraTime < this.ctx.currentTime + lookahead) {
      const firstOffset = cfg.fifthMode === 'Pa' ? 7 : cfg.fifthMode === 'Ma' ? 5 : 11;
      const offsets = [firstOffset, 12, 12, 0];
      const offset = offsets[this.tanpuraStringIdx % 4];
      const freq = getFrequencyHz(
        offset,
        this.session.rootMidi,
        this.session.a4Hz,
        this.session.microtonal,
        scale,
        cfg.fineTuneCents
      );
      triggerTanpuraString(
        this.ctx,
        this.nodes,
        freq,
        this.nextTanpuraTime,
        cfg.volume,
        cfg.brightness
      );
      this.tanpuraStringIdx = (this.tanpuraStringIdx + 1) % 4;
      this.nextTanpuraTime += 0.82;
    }
  }

  private scheduleLoop() {
    if (!this.isPlaying || !this.ctx || !this.nodes || !this.session) return;
    const lookahead = 0.11;
    const secPerBeat = 60 / Math.max(30, this.session.bpm);
    const stepDuration = secPerBeat / Math.max(1, this.session.stepsPerBeat);
    const scale = getScaleById(this.session.scaleId);
    const tala = getTalaById(this.session.talaId);
    const rootHz = getFrequencyHz(
      0,
      this.session.rootMidi,
      this.session.a4Hz,
      this.session.microtonal,
      scale
    );

    const sections: SongSection[] | undefined = this.session.sections;
    const swingAmount = this.session.master.swingAmount ?? 0;

    while (this.nextStepTime < this.ctx.currentTime + lookahead) {
      const step = this.currentStep;
      const swingOffset =
        step % 2 === 1 && swingAmount > 0 ? stepDuration * 0.28 * swingAmount : 0;
      const time = this.nextStepTime + swingOffset;

      const activeTracks: StudioTrack[] =
        this.arrangementMode && sections && sections[this.activeArrangementSectionIdx]
          ? sections[this.activeArrangementSectionIdx].tracks
          : this.session.tracks;
      const hasSolo = activeTracks.some((t) => t.solo);

      if (this.metronomeEnabled && step % this.session.stepsPerBeat === 0) {
        const beatIdx = Math.floor(step / this.session.stepsPerBeat);
        this.triggerMetronomeClick(this.ctx, this.nodes, beatIdx, tala, time);
      }

      for (const track of activeTracks) {
        if (track.muted || (hasSolo && !track.solo)) continue;
        for (const note of track.notes) {
          if (note.step === step) {
            const humanJitter =
              this.session.master.humanizeAmount > 0
                ? (Math.random() - 0.5) * 0.016 * this.session.master.humanizeAmount
                : 0;
            const humanVel =
              this.session.master.humanizeAmount > 0
                ? Math.max(
                    0.15,
                    Math.min(
                      1,
                      note.velocity *
                        (1 + (Math.random() - 0.5) * 0.14 * this.session.master.humanizeAmount)
                    )
                  )
                : note.velocity;
            const schedTime = Math.max(this.ctx.currentTime + 0.002, time + humanJitter);
            const durSec = Math.max(0.06, note.durationSteps * stepDuration * 0.94);

            if (track.role === 'percussion') {
              triggerPercussionVoice(
                this.ctx,
                this.nodes,
                track.instrument,
                note.semitoneOffset,
                rootHz,
                schedTime,
                humanVel,
                track.volume,
                track.pan,
                track.reverbSend
              );
            } else {
              const freq = getFrequencyHz(
                note.semitoneOffset,
                this.session.rootMidi,
                this.session.a4Hz,
                this.session.microtonal,
                scale
              );
              triggerMelodicInstrument(
                this.ctx,
                this.nodes,
                track.instrument,
                freq,
                schedTime,
                durSec,
                humanVel,
                note.gamaka,
                track.volume,
                track.pan,
                track.reverbSend
              );
            }
          }
        }
      }

      const uiDelayMs = Math.max(0, (time - this.ctx.currentTime) * 1000);
      const capturedStep = step;
      window.setTimeout(() => {
        if (this.isPlaying) {
          this.onStepChange?.(capturedStep);
        }
      }, uiDelayMs);

      const nextStep = (this.currentStep + 1) % this.session.totalSteps;
      if (nextStep === 0 && this.arrangementMode && sections && sections.length > 0) {
        const curSec = sections[this.activeArrangementSectionIdx];
        this.currentSectionRepeat++;
        if (this.currentSectionRepeat >= Math.max(1, curSec.repeats || 1)) {
          this.currentSectionRepeat = 0;
          this.activeArrangementSectionIdx =
            (this.activeArrangementSectionIdx + 1) % sections.length;
          const nextSecId = sections[this.activeArrangementSectionIdx].id;
          window.setTimeout(() => {
            if (this.isPlaying) {
              this.onSectionChange?.(nextSecId);
            }
          }, uiDelayMs);
        }
      }

      this.currentStep = nextStep;
      this.nextStepTime += stepDuration;
    }
  }

  private triggerMetronomeClick(
    ctx: BaseAudioContext,
    nodes: MasterNodes,
    beatIdx: number,
    tala: TalaDefinition,
    time: number
  ) {
    const isSam = beatIdx === tala.samBeat;
    const isTali = tala.taliBeats.includes(beatIdx);
    const isKhali = tala.khaliBeats.includes(beatIdx);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(
      isSam ? 1320 : isTali ? 980 : isKhali ? 540 : 720,
      time
    );
    gain.gain.setValueAtTime(isSam ? 0.16 : isTali ? 0.1 : 0.06, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
    osc.connect(gain);
    gain.connect(nodes.dryBus);
    osc.start(time);
    osc.stop(time + 0.055);
  }

  public async renderSessionToWavBlob(
    session: StudioSession,
    loops = 2,
    useArrangementSections = true
  ): Promise<Blob> {
    const sampleRate = 44100;
    const secPerBeat = 60 / Math.max(30, session.bpm);
    const stepDuration = secPerBeat / Math.max(1, session.stepsPerBeat);
    const loopDuration = session.totalSteps * stepDuration;
    const swingAmount = session.master.swingAmount ?? 0;

    // Build cycle sequence from sections or single track list
    const cycleTrackLists: StudioTrack[][] = [];
    if (useArrangementSections && session.sections && session.sections.length > 0) {
      for (const sec of session.sections) {
        const reps = Math.max(1, sec.repeats || 1);
        for (let r = 0; r < reps; r++) {
          cycleTrackLists.push(sec.tracks);
        }
      }
    } else {
      for (let i = 0; i < loops; i++) {
        cycleTrackLists.push(session.tracks);
      }
    }

    const totalCycles = cycleTrackLists.length;
    const totalDuration = loopDuration * totalCycles + 1.8;

    const offline = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDuration), sampleRate);
    const nodes = buildMasterGraph(offline, session.master);
    const scale: ScaleDefinition = getScaleById(session.scaleId);
    const rootHz = getFrequencyHz(0, session.rootMidi, session.a4Hz, session.microtonal, scale);

    if (session.tanpura.enabled) {
      const firstOffset =
        session.tanpura.fifthMode === 'Pa' ? 7 : session.tanpura.fifthMode === 'Ma' ? 5 : 11;
      const offsets = [firstOffset, 12, 12, 0];
      let t = 0.02;
      let idx = 0;
      while (t < loopDuration * totalCycles) {
        const freq = getFrequencyHz(
          offsets[idx % 4],
          session.rootMidi,
          session.a4Hz,
          session.microtonal,
          scale,
          session.tanpura.fineTuneCents
        );
        triggerTanpuraString(
          offline,
          nodes,
          freq,
          t,
          session.tanpura.volume,
          session.tanpura.brightness
        );
        t += 0.82;
        idx++;
      }
    }

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      const loopOffset = 0.04 + cycle * loopDuration;
      const tracks = cycleTrackLists[cycle];
      const hasSolo = tracks.some((t) => t.solo);

      for (const track of tracks) {
        if (track.muted || (hasSolo && !track.solo)) continue;
        for (const note of track.notes) {
          const swingOffset =
            note.step % 2 === 1 && swingAmount > 0 ? stepDuration * 0.28 * swingAmount : 0;
          const schedTime = loopOffset + note.step * stepDuration + swingOffset;
          const durSec = Math.max(0.06, note.durationSteps * stepDuration * 0.94);
          if (track.role === 'percussion') {
            triggerPercussionVoice(
              offline,
              nodes,
              track.instrument,
              note.semitoneOffset,
              rootHz,
              schedTime,
              note.velocity,
              track.volume,
              track.pan,
              track.reverbSend
            );
          } else {
            const freq = getFrequencyHz(
              note.semitoneOffset,
              session.rootMidi,
              session.a4Hz,
              session.microtonal,
              scale
            );
            triggerMelodicInstrument(
              offline,
              nodes,
              track.instrument,
              freq,
              schedTime,
              durSec,
              note.velocity,
              note.gamaka,
              track.volume,
              track.pan,
              track.reverbSend
            );
          }
        }
      }
    }

    const rendered = await offline.startRendering();
    return audioBufferToWavBlob(rendered);
  }
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], {type: 'audio/wav'});
}

export const audioEngine = new SwaraKalaAudioEngine();
