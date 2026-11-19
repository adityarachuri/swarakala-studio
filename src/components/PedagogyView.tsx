import React, {useRef, useState} from 'react';
import {
  BookOpen,
  Calculator,
  Check,
  Compass,
  Play,
  Printer,
  Search,
  Square,
  Volume2,
} from 'lucide-react';
import type {
  ScaleDefinition,
  StudioLocale,
  StudioSession,
  TalaDefinition,
  TraditionId,
} from '../types/studio';
import {
  CANONICAL_LITERATURE,
  getLocalizedChakraName,
  getLocalizedMelakartaName,
  MELAKARTA_72,
  SHRUTI_22_COMPENDIUM,
  SULADI_JATIS,
  SULADI_TALAS,
  type LiteratureWork,
  type MelakartaEntry,
  type SuladiJatiType,
} from '../data/musicLiterature';
import {
  createTalaFromSuladi,
  getFrequencyHz,
  getMidiNoteName,
  getScaleDisplayName,
  getShrutiCentsOffset,
  getSwaraName,
  getTalaDisplayName,
  getTalaStructureDisplay,
} from '../engine/musicTheory';
import {STUDIO_STRINGS} from '../i18n/studioLocale';
import {audioEngine} from '../engine/audioEngine';

interface PedagogyViewProps {
  session: StudioSession;
  scale: ScaleDefinition;
  tala: TalaDefinition;
  locale: StudioLocale;
  onLoadScaleId: (scaleId: string) => void;
  onLoadTalaId: (talaId: string) => void;
}

type PedagogyTab = 'ledger' | 'treatises' | 'melakarta72' | 'talaCalculator';

export const PedagogyView: React.FC<PedagogyViewProps> = ({
  session,
  scale,
  tala,
  locale,
  onLoadScaleId,
  onLoadTalaId,
}) => {
  const strings = STUDIO_STRINGS[locale];
  const [activeTab, setActiveTab] = useState<PedagogyTab>('ledger');
  const [imgError, setImgError] = useState(false);

  // Literature & Treatise reader state
  const [litFilter, setLitFilter] = useState<'all' | TraditionId | 'archive'>('all');
  const [litSearch, setLitSearch] = useState('');
  const [playingDemoKey, setPlayingDemoKey] = useState<string | null>(null);
  const demoTimersRef = useRef<number[]>([]);

  // 72 Melakarta Explorer state
  const [melaSearch, setMelaSearch] = useState('');
  const [melaMadhyama, setMelaMadhyama] = useState<'all' | 'shuddha' | 'prati'>('all');
  const [melaChakra, setMelaChakra] = useState<number>(0);

  // 35 Suladi Tala Calculator state
  const [selectedTalaId, setSelectedTalaId] = useState<string>('triputa');
  const [selectedJatiId, setSelectedJatiId] = useState<SuladiJatiType['id']>('chatusra');
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);

  const melodyTrack = session.tracks.find((t) => t.role === 'melody') ?? session.tracks[0];
  const sortedMelody = [...(melodyTrack?.notes ?? [])].sort((a, b) => a.step - b.step);

  const stopDemoSequence = () => {
    demoTimersRef.current.forEach((id) => window.clearTimeout(id));
    demoTimersRef.current = [];
    setPlayingDemoKey(null);
  };

  const playSemitoneSequence = (
    key: string,
    instrument: StudioSession['tracks'][number]['instrument'],
    semitones: number[],
    gamaka: StudioSession['tracks'][number]['notes'][number]['gamaka'] = 'none',
    stepMs = 310
  ) => {
    stopDemoSequence();
    setPlayingDemoKey(key);
    semitones.forEach((semi, idx) => {
      const tid = window.setTimeout(() => {
        void audioEngine.previewNote(instrument, semi, gamaka, stepMs / 1000, 0.86);
        if (idx === semitones.length - 1) {
          const endId = window.setTimeout(() => setPlayingDemoKey(null), stepMs + 80);
          demoTimersRef.current.push(endId);
        }
      }, idx * stepMs);
      demoTimersRef.current.push(tid);
    });
  };

  const auditionDegree = (semitone: number) => {
    const inst =
      melodyTrack?.role === 'percussion' ? 'veena' : melodyTrack?.instrument ?? 'veena';
    void audioEngine.previewNote(inst, semitone, 'none', 0.65, 0.88);
  };

  const auditionShrutiEntry = (centsFromSa: number) => {
    // Convert exact 22-shruti cents back into fractional semitone offset for pure pitch audition
    const fracSemitone = centsFromSa / 100;
    const inst =
      melodyTrack?.role === 'percussion' ? 'veena' : melodyTrack?.instrument ?? 'veena';
    void audioEngine.previewNote(inst, fracSemitone, 'none', 0.8, 0.85);
  };

  const getLocalizedWorkTitle = (work: LiteratureWork): string => {
    if (locale === 'te') return work.titleTe;
    if (locale === 'sa') return work.titleSa;
    return work.title;
  };

  const filteredLiterature = CANONICAL_LITERATURE.filter((work) => {
    if (litFilter !== 'all' && work.tradition !== litFilter) return false;
    const q = litSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      work.title.toLowerCase().includes(q) ||
      work.titleTe.toLowerCase().includes(q) ||
      work.titleSa.toLowerCase().includes(q) ||
      work.author.toLowerCase().includes(q) ||
      work.abstract.toLowerCase().includes(q)
    );
  });

  const filteredMelakartas = MELAKARTA_72.filter((m) => {
    if (melaMadhyama === 'shuddha' && m.number > 36) return false;
    if (melaMadhyama === 'prati' && m.number <= 36) return false;
    if (melaChakra !== 0 && m.chakraNum !== melaChakra) return false;
    const q = melaSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.nameTe.toLowerCase().includes(q) ||
      m.nameSa.toLowerCase().includes(q) ||
      String(m.number) === q ||
      (m.hindustaniThaatEquivalent?.toLowerCase().includes(q) ?? false)
    );
  });

  const calculatedTala = createTalaFromSuladi(selectedTalaId, selectedJatiId);
  const selectedTalaMeta = SULADI_TALAS.find((t) => t.id === selectedTalaId) ?? SULADI_TALAS[4];

  const handleAuditionTala = () => {
    stopDemoSequence();
    const key = `tala-${calculatedTala.id}`;
    setPlayingDemoKey(key);
    let beatIdx = 0;
    for (let b = 0; b < calculatedTala.beats; b++) {
      const isSam = b === 0;
      const isTali = calculatedTala.taliBeats.includes(b);
      const percPitch = isSam ? 0 : isTali ? 5 : 4;
      const vel = isSam ? 0.96 : isTali ? 0.78 : 0.48;
      const tid = window.setTimeout(() => {
        void audioEngine.previewNote('mridangam', percPitch, 'none', 0.25, vel);
        if (b === calculatedTala.beats - 1) {
          const endTid = window.setTimeout(() => setPlayingDemoKey(null), 320);
          demoTimersRef.current.push(endTid);
        }
      }, beatIdx * 320);
      demoTimersRef.current.push(tid);
      beatIdx++;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation for the 4 Musicology & Literature Modules */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] px-4 py-3 print:hidden">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Musicology Modules">
          {(
            [
              {id: 'ledger', label: strings.pedagogyTabs.ledger, icon: Volume2},
              {id: 'treatises', label: strings.pedagogyTabs.treatises, icon: BookOpen},
              {id: 'melakarta72', label: strings.pedagogyTabs.melakarta72, icon: Compass},
              {id: 'talaCalculator', label: strings.pedagogyTabs.talaCalculator, icon: Calculator},
            ] as Array<{id: PedagogyTab; label: string; icon: React.ComponentType<{className?: string}>}>
          ).map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </div>

        {appliedBanner && (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{appliedBanner}</span>
          </div>
        )}
      </div>

      {/* TAB 1: Raga Study Sheet & Full 22-Shruti Compendium */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-6 flex flex-col justify-between gap-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {scale.classification} · {getTalaDisplayName(tala, locale)}
                  </p>
                  <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {session.title}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {getScaleDisplayName(scale, locale)} · {session.subtitle} ·{' '}
                    {getMidiNoteName(session.rootMidi)} (A4 = {session.a4Hz} Hz)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 print:hidden"
                >
                  <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                  {strings.actions.printSheet}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">
                    {strings.labels.arohana}
                  </span>
                  <span className="font-mono-tabular text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {session.pedagogy.arohana || scale.arohanaLabel}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">
                    {strings.labels.avarohana}
                  </span>
                  <span className="font-mono-tabular text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {session.pedagogy.avarohana || scale.avarohanaLabel}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">
                    {strings.labels.vadi}
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {session.pedagogy.vadi || scale.vadi}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">
                    {strings.labels.samvadi}
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {session.pedagogy.samvadi || scale.samvadi}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 dark:text-slate-400 block">
                    {strings.labels.pakad}
                  </span>
                  <span className="font-mono-tabular text-xs text-amber-700 dark:text-amber-300">
                    {session.pedagogy.pakad || scale.pakad}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900 relative min-h-[220px]">
              {!imgError ? (
                <img
                  src="/src/assets/images/acoustic_instruments_still_1795064055364.jpg"
                  alt="Handcrafted Saraswati Veena, brass Tabla pair, and grand piano inside a music conservatory"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/50 p-6 text-center">
                  <p className="font-display text-xl text-amber-200">
                    Conservatory Acoustics &amp; Shruti Reference
                  </p>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4">
                <p className="text-xs font-medium text-amber-200">
                  {scale.timeOfDay} · {scale.mood}
                </p>
                <p className="text-[11px] text-slate-200 mt-0.5">
                  {session.pedagogy.sourceAttributionNote}
                </p>
              </div>
            </div>
          </div>

          {/* Active Raga Swara Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Active Scale Swara &amp; Intonation Ledger
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {session.microtonal ? strings.labels.justShruti : strings.labels.equalTemp} (A4 ={' '}
                  {session.a4Hz} Hz)
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  playSemitoneSequence(
                    'arohana-preview',
                    melodyTrack?.role === 'percussion' ? 'veena' : melodyTrack?.instrument ?? 'veena',
                    [...scale.semitones, 12],
                    'none',
                    260
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/25"
              >
                <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                Audition Full Scale
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 pr-4 font-medium">Swara ({locale.toUpperCase()})</th>
                    <th className="py-2.5 pr-4 font-medium">Western Note</th>
                    <th className="py-2.5 pr-4 font-medium text-right">Shruti Offset</th>
                    <th className="py-2.5 pr-4 font-medium text-right">12-TET Freq</th>
                    <th className="py-2.5 pr-4 font-medium text-right">Active Freq</th>
                    <th className="py-2.5 font-medium text-right">Audition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                  {[...scale.semitones, 12].map((semi) => {
                    const sw = getSwaraName(semi, session.tradition, locale);
                    const cents = getShrutiCentsOffset(semi, scale, session.microtonal);
                    const eqHz = getFrequencyHz(semi, session.rootMidi, session.a4Hz, false, scale);
                    const activeHz = getFrequencyHz(
                      semi,
                      session.rootMidi,
                      session.a4Hz,
                      session.microtonal,
                      scale
                    );
                    return (
                      <tr
                        key={semi}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 pr-4 font-semibold text-amber-600 dark:text-amber-400 text-sm">
                          {sw.base}
                          {sw.octaveMark}
                        </td>
                        <td className="py-2.5 pr-4 font-mono-tabular text-slate-800 dark:text-slate-200">
                          {getMidiNoteName(session.rootMidi + semi)}
                        </td>
                        <td className="py-2.5 pr-4 font-mono-tabular text-right text-slate-600 dark:text-slate-300">
                          {cents > 0 ? `+${cents}¢` : `${cents}¢`}
                        </td>
                        <td className="py-2.5 pr-4 font-mono-tabular text-right text-slate-500">
                          {eqHz.toFixed(2)} Hz
                        </td>
                        <td className="py-2.5 pr-4 font-mono-tabular text-right font-semibold text-slate-900 dark:text-slate-100">
                          {activeHz.toFixed(2)} Hz
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => auditionDegree(semi)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-amber-500"
                          >
                            <Volume2 className="w-3 h-3" aria-hidden="true" />
                            Play
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance & Sahitya Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-6 space-y-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Performance &amp; Harmonic Guidance
              </h2>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {session.pedagogy.performanceGuidance}
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">
                  Harmonic / Drone Architecture
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {session.pedagogy.chordProgression}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-6 space-y-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {strings.labels.sahitya} &amp; {strings.labels.solkattu}
              </h2>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">
                    {strings.labels.sahitya}
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {session.pedagogy.sahityaOrLyrics}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">
                    {strings.labels.solkattu}
                  </span>
                  <p className="font-mono-tabular text-amber-700 dark:text-amber-300">
                    {session.pedagogy.solkattuOrBol}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1.5">
                    Active Lead Swara Sequence
                  </span>
                  <div className="flex flex-wrap gap-2 font-mono-tabular text-xs">
                    {sortedMelody.length === 0 ? (
                      <span className="text-slate-400">No melody notes placed yet.</span>
                    ) : (
                      sortedMelody.map((n) => {
                        const sw = getSwaraName(n.semitoneOffset, session.tradition, locale);
                        return (
                          <span
                            key={n.id}
                            className="px-2 py-1 rounded bg-slate-100 dark:bg-[#0B0E14] text-slate-800 dark:text-slate-200"
                          >
                            {sw.base}
                            {sw.octaveMark}
                            {n.gamaka !== 'none' ? `(${n.gamaka[0]})` : ''}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Complete Dwavimsati (22) Shruti Acoustic Compendium */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Complete Dwavimsati (22) Shruti Compendium — Bharata–Sarngadeva Acoustic Ratios
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All 22 microtonal intervals within the octave (Sarana Chatushtayi &amp; Sangita Ratnakara). Click any row to audition its pure ratio relative to your active tonic Sa.
              </p>
            </div>
            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-white dark:bg-[#121721] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2 pr-3 font-medium">#</th>
                    <th className="py-2 pr-3 font-medium">Sanskrit / Classical Name</th>
                    <th className="py-2 pr-3 font-medium">తెలుగు (Telugu)</th>
                    <th className="py-2 pr-3 font-medium">Swara Family</th>
                    <th className="py-2 pr-3 font-medium text-right">Pythagorean / Just Ratio</th>
                    <th className="py-2 pr-3 font-medium text-right">Cents</th>
                    <th className="py-2 pr-3 font-medium text-right">12-TET Δ</th>
                    <th className="py-2 font-medium text-right">Audition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                  {SHRUTI_22_COMPENDIUM.map((sh) => (
                    <tr
                      key={sh.index}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 pr-3 font-mono-tabular text-slate-400">{sh.index}</td>
                      <td className="py-2 pr-3 font-semibold text-slate-900 dark:text-slate-100">
                        {sh.sanskritName}
                      </td>
                      <td className="py-2 pr-3 text-amber-700 dark:text-amber-300 font-medium">
                        {sh.teluguName}
                      </td>
                      <td className="py-2 pr-3 font-mono-tabular text-slate-700 dark:text-slate-300">
                        {sh.swaraFamily}
                      </td>
                      <td className="py-2 pr-3 font-mono-tabular text-right text-slate-600 dark:text-slate-300">
                        {sh.ratioLabel}
                      </td>
                      <td className="py-2 pr-3 font-mono-tabular text-right text-slate-800 dark:text-slate-200">
                        {sh.centsFromSa.toFixed(1)}¢
                      </td>
                      <td className="py-2 pr-3 font-mono-tabular text-right text-slate-500">
                        {sh.deltaFrom12TetCents >= 0
                          ? `+${sh.deltaFrom12TetCents.toFixed(1)}¢`
                          : `${sh.deltaFrom12TetCents.toFixed(1)}¢`}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => auditionShrutiEntry(sh.centsFromSa)}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-[11px] hover:border-amber-500"
                        >
                          <Volume2 className="w-3 h-3" aria-hidden="true" />
                          Play
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Full Classical & Rare Historical Treatises Reader */}
      {activeTab === 'treatises' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                {strings.pedagogyTabs.treatises}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Historically verified manuscripts spanning Bharata&apos;s Natya Shastra, 1904 Telugu Sangita Sampradaya Pradarsini, Bhatkhande Kramik Pustak Malika, Rare Medieval Chronicles, and Western Counterpoint &amp; Orchestration.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={litSearch}
                  onChange={(e) => setLitSearch(e.target.value)}
                  placeholder="Search treatise, author, concept..."
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 w-56"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 dark:bg-[#0B0E14] p-1">
                {(
                  [
                    {id: 'all', label: 'All'},
                    {id: 'carnatic', label: 'Carnatic'},
                    {id: 'hindustani', label: 'Hindustani'},
                    {id: 'archive', label: 'Rare Archives'},
                    {id: 'western', label: 'Western & Film'},
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setLitFilter(f.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                      litFilter === f.id
                        ? 'bg-white dark:bg-[#1E2534] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {filteredLiterature.map((work) => (
              <article
                key={work.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-6 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      <span className="uppercase">{work.tradition}</span>
                      <span aria-hidden="true">·</span>
                      <span>{work.era}</span>
                      <span aria-hidden="true">·</span>
                      <span>{work.language}</span>
                      <span aria-hidden="true">·</span>
                      <span>{work.classification}</span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {getLocalizedWorkTitle(work)}
                    </h2>
                    {locale !== 'en' && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{work.title}</p>
                    )}
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Author / Attribution: {work.author} · {work.provenance}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs leading-relaxed">
                  <div className="rounded-lg bg-slate-50 dark:bg-[#0E121B] border border-slate-200/80 dark:border-slate-800 p-4">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-1">
                      Historical Abstract
                    </span>
                    <p className="text-slate-600 dark:text-slate-300">{work.abstract}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-[#0E121B] border border-slate-200/80 dark:border-slate-800 p-4">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-1">
                      Musicological &amp; Conservatory Significance
                    </span>
                    <p className="text-slate-600 dark:text-slate-300">{work.archivalSignificance}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {work.chapters.map((ch, cIdx) => {
                    const chTitle =
                      locale === 'te' && ch.chapterTitleTe
                        ? ch.chapterTitleTe
                        : locale === 'sa' && ch.chapterTitleSa
                          ? ch.chapterTitleSa
                          : ch.chapterTitle;
                    const demoKey = `${work.id}-ch-${cIdx}`;
                    const isPlayingThisDemo = playingDemoKey === demoKey;

                    return (
                      <div
                        key={cIdx}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {chTitle}
                          </h3>
                          {ch.playableDemo && (
                            <button
                              type="button"
                              onClick={() =>
                                isPlayingThisDemo
                                  ? stopDemoSequence()
                                  : playSemitoneSequence(
                                      demoKey,
                                      ch.playableDemo!.instrument,
                                      ch.playableDemo!.semitones,
                                      ch.playableDemo!.gamaka ?? 'none',
                                      330
                                    )
                              }
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                                isPlayingThisDemo
                                  ? 'bg-red-600 text-white'
                                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                              }`}
                            >
                              {isPlayingThisDemo ? (
                                <>
                                  <Square className="w-3 h-3 fill-current" aria-hidden="true" />
                                  Stop Example
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                                  {ch.playableDemo.label}
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                          {ch.summary}
                        </p>

                        <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          {ch.keyDoctrines.map((doc, dIdx) => (
                            <li key={dIdx}>{doc}</li>
                          ))}
                        </ul>

                        {ch.originalTextOrMaxim && (
                          <div className="rounded-lg bg-amber-500/[0.06] border border-amber-500/30 p-3 space-y-1 text-xs">
                            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                              {ch.originalTextOrMaxim.scriptText}
                            </p>
                            <p className="italic text-slate-600 dark:text-slate-400">
                              {ch.originalTextOrMaxim.transliteration}
                            </p>
                            <p className="text-slate-800 dark:text-slate-200">
                              &ldquo;{ch.originalTextOrMaxim.translation}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Complete 72-Melakarta Katapayadi Chakra Explorer */}
      {activeTab === 'melakarta72' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                {strings.pedagogyTabs.melakarta72}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Venkatamakhin &amp; Govindacharya&apos;s complete 72 Janaka Raganga scales across 12 Chakras. Audition any scale or load it directly into the Sequencer &amp; Live Keyboard.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={melaSearch}
                  onChange={(e) => setMelaSearch(e.target.value)}
                  placeholder="Raga, Thaat, or #1-72..."
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 w-48"
                />
              </div>

              <select
                aria-label="Filter by Chakra"
                value={melaChakra}
                onChange={(e) => setMelaChakra(Number(e.target.value))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value={0}>All 12 Chakras (72)</option>
                {Array.from({length: 12}, (_, i) => {
                  const first = MELAKARTA_72[i * 6];
                  return (
                    <option key={i + 1} value={i + 1}>
                      {getLocalizedChakraName(first, locale)}
                    </option>
                  );
                })}
              </select>

              <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-[#0B0E14] p-1">
                {(
                  [
                    {id: 'all', label: 'All 72'},
                    {id: 'shuddha', label: 'M₁ (1–36)'},
                    {id: 'prati', label: 'M₂ (37–72)'},
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setMelaMadhyama(f.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                      melaMadhyama === f.id
                        ? 'bg-white dark:bg-[#1E2534] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredMelakartas.map((m: MelakartaEntry) => {
              const targetScaleId = `melakarta_${m.number}`;
              const isLoaded = session.scaleId === targetScaleId;
              const demoKey = `mela-${m.number}`;
              const isAuditioning = playingDemoKey === demoKey;

              return (
                <div
                  key={m.number}
                  className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                    isLoaded
                      ? 'border-amber-500 bg-amber-500/[0.06]'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono-tabular font-semibold text-amber-600 dark:text-amber-400">
                        #{m.number} · {getLocalizedChakraName(m, locale)}
                      </span>
                      <span>{m.madhyama}</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {getLocalizedMelakartaName(m, locale)}
                    </h3>
                    {locale !== 'en' && (
                      <p className="text-[11px] text-slate-500">{m.name}</p>
                    )}
                    <p className="font-mono-tabular text-xs text-slate-700 dark:text-slate-300 mt-1.5">
                      {m.swaraCode} Ṡ
                    </p>
                    {m.hindustaniThaatEquivalent && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                        Hindustani Parallel: {m.hindustaniThaatEquivalent}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
                    <button
                      type="button"
                      onClick={() =>
                        isAuditioning
                          ? stopDemoSequence()
                          : playSemitoneSequence(demoKey, 'veena', [...m.semitones, 12], 'none', 230)
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-amber-500"
                    >
                      <Volume2 className="w-3 h-3" aria-hidden="true" />
                      {isAuditioning ? 'Stop' : 'Audition'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onLoadScaleId(targetScaleId);
                        setAppliedBanner(`Loaded Melakarta #${m.number} (${m.name})`);
                      }}
                      className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                        isLoaded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      }`}
                    >
                      {isLoaded ? 'Active in Studio' : 'Load into Studio'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: 35 Suladi Sapta Tala & Layakari Calculator */}
      {activeTab === 'talaCalculator' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-6 space-y-5">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                {strings.pedagogyTabs.talaCalculator}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Purandara Dasa&apos;s Sapta Tala Combinatorial System: select any of the 7 Suladi Talas and 5 Laghu Jatis to derive Anga notation, Akshara count, and load it live onto your Sequencer &amp; Tala Mandala.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left selectors */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-2">
                    1. Select Suladi Tala Family (7 Families)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SULADI_TALAS.map((st) => {
                      const active = selectedTalaId === st.id;
                      const label =
                        locale === 'te' ? st.nameTe : locale === 'sa' ? st.nameSa : st.name;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setSelectedTalaId(st.id)}
                          className={`rounded-lg border p-2.5 text-left transition-colors ${
                            active
                              ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E121B] text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="text-xs font-semibold">{label}</div>
                          <div className="font-mono-tabular text-[11px] text-slate-500 mt-0.5">
                            {st.symbolPattern.map((s) => (s === 'L' ? '|n' : s === 'D' ? 'O' : 'U')).join(' ')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-2">
                    2. Select Laghu Jati (5 Nadai/Gati Divisions)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {SULADI_JATIS.map((sj) => {
                      const active = selectedJatiId === sj.id;
                      const label =
                        locale === 'te' ? sj.nameTe : locale === 'sa' ? sj.nameSa : sj.name;
                      return (
                        <button
                          key={sj.id}
                          type="button"
                          onClick={() => setSelectedJatiId(sj.id)}
                          className={`rounded-lg border p-2.5 text-center transition-colors ${
                            active
                              ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E121B] text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="text-xs font-semibold">{label}</div>
                          <div className="font-mono-tabular text-[11px] text-slate-500 mt-0.5">
                            Laghu = {sj.laghuBeats}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right computed preview card */}
              <div className="lg:col-span-5 rounded-xl border border-amber-500/40 bg-amber-500/[0.06] p-5 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    Computed 35-Tala Blueprint
                  </div>
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {getTalaDisplayName(calculatedTala, locale)}
                  </h2>
                  <p className="font-mono-tabular text-xs text-slate-700 dark:text-slate-300">
                    {getTalaStructureDisplay(calculatedTala, locale)}
                  </p>

                  {/* Symbolic Anga Sequence */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {selectedTalaMeta.symbolPattern.map((sym, idx) => {
                      const count = calculatedTala.vibhags[idx];
                      return (
                        <div
                          key={idx}
                          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121721] px-3 py-2 text-center"
                        >
                          <div className="font-mono-tabular text-sm font-bold text-amber-600 dark:text-amber-400">
                            {sym === 'L' ? `|${count}` : sym === 'D' ? 'O' : 'U'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {sym === 'L' ? 'Laghu' : sym === 'D' ? 'Drutam' : 'Anudrutam'} ({count})
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                    Sequencer Grid Resolution: <strong>{calculatedTala.totalSteps} steps</strong> (
                    {calculatedTala.stepsPerBeat} steps per Akshara).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-amber-500/20">
                  <button
                    type="button"
                    onClick={handleAuditionTala}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121721] px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-amber-500"
                  >
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    Audition Aksharas
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onLoadTalaId(calculatedTala.id);
                      setAppliedBanner(`Applied ${calculatedTala.name} to Console`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    Apply Tala to Studio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
