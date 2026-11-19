export type TraditionId = 'carnatic' | 'hindustani' | 'western';

export type StudioLocale = 'en' | 'te' | 'sa';

export type InstrumentId =
  | 'veena'
  | 'sitar'
  | 'bansuri'
  | 'nadaswaram'
  | 'santoor'
  | 'violin'
  | 'harmonium'
  | 'piano'
  | 'rhodes'
  | 'celesta'
  | 'stringsEnsemble'
  | 'frenchHorn'
  | 'synthPad'
  | 'bass'
  | 'mridangam'
  | 'tabla'
  | 'drums';

export type GamakaType =
  | 'none'
  | 'kampita'
  | 'meend'
  | 'nokku'
  | 'andolan'
  | 'sphurita'
  | 'staccato';

export type NotationMode = 'swara' | 'western' | 'both';

export type StudioView = 'console' | 'stage3d' | 'architect' | 'pedagogy' | 'library';

export type QuantizeDivision = '1/2' | '1/4' | '1/8';

export interface NoteEvent {
  id: string;
  step: number;
  durationSteps: number;
  /** Semitone offset relative to Root Sa / Tonic (e.g. 0 = Sa, 12 = Tara Sa, -12 = Mandra Sa). For percussion tracks, maps to drum lane index. */
  semitoneOffset: number;
  /** Velocity 0.1 - 1.0 */
  velocity: number;
  gamaka: GamakaType;
  syllable?: string;
  /** Non-destructive original fractional step captured during live recording */
  rawStep?: number;
  /** True when captured via live/step recording */
  recorded?: boolean;
}

export interface StudioTrack {
  id: string;
  name: string;
  role: 'melody' | 'harmony' | 'bass' | 'percussion';
  instrument: InstrumentId;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  reverbSend: number; // 0 to 1
  muted: boolean;
  solo: boolean;
  notes: NoteEvent[];
}

export interface SongSection {
  id: string;
  name: string;
  roleLabel: string;
  repeats: number;
  tracks: StudioTrack[];
}

export interface TanpuraConfig {
  enabled: boolean;
  volume: number;
  brightness: number; // 0 to 1
  fifthMode: 'Pa' | 'Ma' | 'Ni';
  fineTuneCents: number; // -50 to +50
}

export interface MasterBusConfig {
  volume: number;
  lowGainDb: number;
  midGainDb: number;
  highGainDb: number;
  reverbMix: number;
  reverbRoom: 'hall' | 'sanctum' | 'chamber' | 'scoringStage';
  delayMix: number;
  delayFeedback: number;
  compressorEnabled: boolean;
  humanizeAmount: number; // 0 to 1
  swingAmount?: number; // 0 to 1
  tapeWarmth?: boolean;
}

export interface PedagogyNotes {
  arohana: string;
  avarohana: string;
  vadi: string;
  samvadi: string;
  pakad: string;
  timeOfDay: string;
  chordProgression: string;
  performanceGuidance: string;
  sahityaOrLyrics: string;
  solkattuOrBol: string;
  sourceAttributionNote: string;
}

export interface StudioSession {
  id: string;
  title: string;
  subtitle: string;
  tradition: TraditionId;
  scaleId: string;
  talaId: string;
  bpm: number;
  /** MIDI note number for Root Sa / Tonic (default 48 = C3) */
  rootMidi: number;
  /** Concert reference pitch for A4 (440 or 432 Hz) */
  a4Hz: number;
  /** Whether to apply 22-Shruti microtonal cents offsets */
  microtonal: boolean;
  totalSteps: number;
  stepsPerBeat: number;
  tracks: StudioTrack[];
  /** Optional multi-section song arrangement (Pallavi/Anupallavi/Charanam, Asthai/Antara, Verse/Chorus) */
  sections?: SongSection[];
  activeSectionId?: string;
  tanpura: TanpuraConfig;
  master: MasterBusConfig;
  pedagogy: PedagogyNotes;
  isReferenceTemplate?: boolean;
  updatedAt: number;
}

export interface ScaleDefinition {
  id: string;
  name: string;
  nameTe?: string;
  nameSa?: string;
  tradition: TraditionId;
  classification: string;
  semitones: number[];
  /** Optional descending semitones if vakra/asymmetric (Avarohana) */
  avarohanaSemitones?: number[];
  /** Microtonal cents deviations indexed by semitone (0..11) */
  shrutiCents: Record<number, number>;
  arohanaLabel: string;
  avarohanaLabel: string;
  vadi: string;
  samvadi: string;
  pakad: string;
  timeOfDay: string;
  mood: string;
  melakartaNumber?: number;
  thaat?: string;
}

export interface TalaDefinition {
  id: string;
  name: string;
  nameTe?: string;
  nameSa?: string;
  tradition: TraditionId;
  beats: number;
  stepsPerBeat: number;
  totalSteps: number;
  structureLabel: string;
  structureTe?: string;
  structureSa?: string;
  /** Subdivision groups e.g. [4, 2, 2] for Adi Tala */
  vibhags: number[];
  /** Beat indices (0-based) for Sam, Tali, Khali */
  samBeat: number;
  taliBeats: number[];
  khaliBeats: number[];
  timeSignatureNum: number;
  timeSignatureDen: number;
}

export interface AIAnalyzeResponse {
  summary: string;
  scaleAdherencePercent: number;
  outOfScaleNotes: string[];
  rhythmicAlignment: string;
  pedagogicalDrills: string[];
  directorSuggestions: string[];
}
