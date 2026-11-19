import React, {useState} from 'react';
import {AlertCircle, ArrowRight, CheckCircle2, Compass, Loader2, Sparkles, Wand2} from 'lucide-react';
import type {
  AIAnalyzeResponse,
  PedagogyNotes,
  ScaleDefinition,
  StudioLocale,
  StudioSession,
  StudioTrack,
  TalaDefinition,
} from '../types/studio';
import {useOnlineStatus} from '../hooks/useOnlineStatus';
import {getScaleDisplayName, getTalaDisplayName} from '../engine/musicTheory';
import {STUDIO_STRINGS} from '../i18n/studioLocale';
import {MicTranscriberPanel} from './MicTranscriberPanel';

interface AIArchitectViewProps {
  session: StudioSession;
  scale: ScaleDefinition;
  tala: TalaDefinition;
  locale: StudioLocale;
  onApplyComposition: (payload: {
    title: string;
    subtitle: string;
    bpm: number;
    tanpuraFifthMode: 'Pa' | 'Ma' | 'Ni';
    tracks: StudioTrack[];
    pedagogy: Partial<PedagogyNotes>;
    isVariation?: boolean;
  }) => void;
  onSaveSahitya: (text: string) => void;
  onOpenConsole?: () => void;
}

const STARTER_BRIEFS: Array<{label: string; labelTe: string; labelSa: string; text: string}> = [
  {
    label: 'Carnatic Kriti Motif',
    labelTe: 'కర్ణాటక కృతి స్వరరచన',
    labelSa: 'कर्णाटककृति-रचना',
    text: 'Compose a luminous Carnatic motif with expressive Kampita, Sphurita, and Meend gamakas on Saraswati Veena or Nadaswaram, Violin shadow harmony, and Chatusra Mridangam.',
  },
  {
    label: 'Hindustani Mehfil Gat',
    labelTe: 'హిందుస్తానీ మెహ్‌ఫిల్ గత్',
    labelSa: 'हिन्दुस्तानी-महफिल्-गत्',
    text: 'Create an atmospheric Hindustani bandish/gat featuring Sitar and Bansuri call-and-response, Santoor shimmer counter-line, and crisp Tabla Teental theka.',
  },
  {
    label: 'Oscar Scoring Hybrid Cue',
    labelTe: 'ఆస్కార్ స్థాయి సినీ ఆర్కెస్ట్రా',
    labelSa: 'चलच्चित्र-वाद्यवृन्दरचना',
    text: 'Arrange an emotional Oscar-grade cinema scoring cue pairing Strings Ensemble, French Horn noble fifths, Celesta sparkle, solo Veena or Bansuri lead, and resonant percussive pulse.',
  },
  {
    label: 'Conservatory Swara Etude',
    labelTe: 'గురుకుల అభ్యాస పాఠం',
    labelSa: 'गुरुकुल-अभ्यासपाठः',
    text: 'Design a crystal-clear conservatory exercise emphasizing Vadi, Samvadi resting notes, and a concluding three-fold Tihai / Mukthayi cadence landing on Sam.',
  },
];

export const AIArchitectView: React.FC<AIArchitectViewProps> = ({
  session,
  scale,
  tala,
  locale,
  onApplyComposition,
  onSaveSahitya,
  onOpenConsole,
}) => {
  const isOnline = useOnlineStatus();
  const strings = STUDIO_STRINGS[locale];
  const scaleTitle = getScaleDisplayName(scale, locale);
  const talaTitle = getTalaDisplayName(tala, locale);

  const [prompt, setPrompt] = useState(
    'Compose an expressive studio arrangement balancing authentic melodic phrasing, nuanced gamakas, and tight rhythmic alignment to the Sam.'
  );
  const [targetAudience, setTargetAudience] = useState<
    'Casual Creator' | 'Music Director' | 'Professor / Teacher'
  >('Music Director');
  const [variationPrompt, setVariationPrompt] = useState(
    'Add a second-speed ornamental Sangati counter-phrase and enrich the percussion Tihai cadence leading into Sam.'
  );
  const [loadingCompose, setLoadingCompose] = useState(false);
  const [loadingVariation, setLoadingVariation] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [lastPedagogy, setLastPedagogy] = useState<Partial<PedagogyNotes> | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalyzeResponse | null>(null);

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setErrorMsg('Please enter a director brief or choose a starter prompt above.');
      return;
    }
    if (!isOnline) {
      setErrorMsg('You are currently offline. Reconnect to invoke AI Tune Architect.');
      return;
    }
    setErrorMsg(null);
    setStatusMsg(null);
    setLoadingCompose(true);
    try {
      const res = await fetch('/api/studio/compose', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          prompt: prompt.trim(),
          tradition: session.tradition,
          scaleName: scale.name,
          scaleSemitones: scale.semitones,
          talaName: tala.name,
          totalSteps: tala.totalSteps,
          targetAudience,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Composition request failed.');
      }
      if (!Array.isArray(data.tracks) || data.tracks.length === 0) {
        throw new Error('AI returned an empty track layout. Please refine your prompt and retry.');
      }
      onApplyComposition({...data, isVariation: false});
      setLastPedagogy(data.pedagogy ?? null);
      setStatusMsg(`Loaded "${data.title}" (${data.tracks.length} tracks · ${data.bpm} BPM) onto the Console Sequencer.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reach studio AI.');
    } finally {
      setLoadingCompose(false);
    }
  };

  const handleVariation = async () => {
    if (!variationPrompt.trim()) {
      setErrorMsg('Please enter an arrangement or Sangati variation instruction.');
      return;
    }
    if (!isOnline) {
      setErrorMsg('You are currently offline. Reconnect to generate AI variations.');
      return;
    }
    setErrorMsg(null);
    setStatusMsg(null);
    setLoadingVariation(true);
    try {
      const res = await fetch('/api/studio/variation', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          instruction: variationPrompt.trim(),
          tradition: session.tradition,
          scaleName: scale.name,
          scaleSemitones: scale.semitones,
          totalSteps: tala.totalSteps,
          tracks: session.tracks,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Variation request failed.');
      }
      if (!Array.isArray(data.tracks) || data.tracks.length === 0) {
        throw new Error('AI variation returned no playable tracks. Please retry.');
      }
      onApplyComposition({
        title: data.title || `${session.title} (Variation)`,
        subtitle: data.subtitle || session.subtitle,
        bpm: data.bpm || session.bpm,
        tanpuraFifthMode: session.tanpura.fifthMode,
        tracks: data.tracks,
        pedagogy: data.pedagogy ?? {},
        isVariation: true,
      });
      setLastPedagogy(data.pedagogy ?? null);
      setStatusMsg('Applied AI arrangement variation to your active song section.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Variation failed.');
    } finally {
      setLoadingVariation(false);
    }
  };

  const handleAnalyze = async () => {
    if (!isOnline) {
      setErrorMsg('You are currently offline. Reconnect to run AI musicology review.');
      return;
    }
    setErrorMsg(null);
    setLoadingAnalyze(true);
    try {
      const melodySummary = session.tracks.map((t) => ({
        name: t.name,
        role: t.role,
        notes: t.notes.map((n) => ({
          step: n.step,
          semitoneOffset: n.semitoneOffset,
          durationSteps: n.durationSteps,
          gamaka: n.gamaka,
        })),
      }));

      const res = await fetch('/api/studio/analyze', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          tradition: session.tradition,
          scaleName: scale.name,
          talaName: tala.name,
          scaleSemitones: scale.semitones,
          melodyNotes: melodySummary,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Analysis request failed.');
      }
      setAnalysis(data as AIAnalyzeResponse);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Musicology analysis failed.');
    } finally {
      setLoadingAnalyze(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Compose New Piece */}
      <div className="lg:col-span-7 space-y-6">
        <form
          onSubmit={handleCompose}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-6 space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                {strings.nav.architect}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Active Context:{' '}
                <strong className="text-slate-800 dark:text-slate-200">{scaleTitle}</strong> ·{' '}
                {talaTitle} · {strings.traditions[session.tradition]}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-[#0B0E14] p-1">
              {(['Casual Creator', 'Music Director', 'Professor / Teacher'] as const).map(
                (persona) => (
                  <button
                    key={persona}
                    type="button"
                    onClick={() => setTargetAudience(persona)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      targetAudience === persona
                        ? 'bg-white dark:bg-[#1E2534] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {persona}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Starter Prompts */}
          <div className="flex flex-wrap gap-2">
            {STARTER_BRIEFS.map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => setPrompt(b.text)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E121B] text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-amber-500/50 transition-colors"
              >
                {locale === 'te' ? b.labelTe : locale === 'sa' ? b.labelSa : b.label}
              </button>
            ))}
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Director&apos;s Brief &amp; Instrumentation Intent ({locale.toUpperCase()} response mode)
            </span>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={580}
              placeholder="Describe the mood, phrasing, gamakas, harmonic colors, or classroom exercise goal..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </label>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statusMsg && (
            <div
              role="status"
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="font-medium">{statusMsg}</span>
                </div>
                {onOpenConsole && (
                  <button
                    type="button"
                    onClick={onOpenConsole}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 whitespace-nowrap"
                  >
                    Open in Studio Console
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
              </div>
              {lastPedagogy?.performanceGuidance && (
                <p className="text-[11px] text-emerald-800/90 dark:text-emerald-200/90 border-t border-emerald-500/20 pt-2">
                  <strong>Guidance:</strong> {lastPedagogy.performanceGuidance}
                </p>
              )}
              {lastPedagogy?.sourceAttributionNote && (
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
                  {lastPedagogy.sourceAttributionNote}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ethical grounding: AI outputs are strictly marked as original studio arrangements.
            </p>
            <button
              type="submit"
              disabled={loadingCompose || !isOnline}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              {loadingCompose ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              )}
              {loadingCompose ? 'Composing Arrangement...' : 'Compose Multi-Track Tune'}
            </button>
          </div>
        </form>

        {/* Variation & Reharmonization */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Arrange Variation on Active Canvas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Transforms your current sequencer tracks while respecting {scaleTitle} and{' '}
            {tala.totalSteps}-step cycle boundaries.
          </p>
          <textarea
            rows={2}
            value={variationPrompt}
            onChange={(e) => setVariationPrompt(e.target.value)}
            maxLength={380}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0E14] px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleVariation}
              disabled={loadingVariation || !isOnline}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 disabled:opacity-50 transition-colors"
            >
              {loadingVariation ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Wand2 className="w-4 h-4" aria-hidden="true" />
              )}
              {loadingVariation ? 'Arranging...' : 'Apply Arrangement Variation'}
            </button>
          </div>
        </div>

        <MicTranscriberPanel
          scaleName={scale.name}
          tradition={session.tradition}
          locale={locale}
          onUseAsComposeBrief={(text) => setPrompt(text)}
          onSaveAsSahitya={onSaveSahitya}
        />
      </div>

      {/* Right: Musicology & Conservatory Analyzer */}
      <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-6 flex flex-col justify-between gap-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {locale === 'te'
                  ? 'సంగీత శాస్త్ర & రాగ పరిశీలన'
                  : locale === 'sa'
                    ? 'सङ्गीतशास्त्र-रागसमीक्षा'
                    : 'Conservatory Theory & Raga Audit'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inspects current sequencer notes against {scaleTitle} &amp; {talaTitle}.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loadingAnalyze || !isOnline}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3.5 py-2 text-xs font-semibold text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {loadingAnalyze ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Compass className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              Audit Canvas
            </button>
          </div>

          {!analysis && !loadingAnalyze && (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Ready for Musicological Inspection
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click &ldquo;Audit Canvas&rdquo; to evaluate scale adherence, Tala Sam cadence,
                and receive tailored student drills or film-scoring refinements.
              </p>
            </div>
          )}

          {analysis && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Scale / Raga Adherence
                </span>
                <span className="font-mono-tabular text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {Number.isFinite(Number(analysis.scaleAdherencePercent))
                    ? `${Math.round(Number(analysis.scaleAdherencePercent))}%`
                    : '—'}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {analysis.summary}
              </p>

              {Array.isArray(analysis.outOfScaleNotes) && analysis.outOfScaleNotes.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                    Chromatic / Out-of-Scale Observations
                  </h3>
                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    {analysis.outOfScaleNotes.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Rhythmic &amp; Tala Alignment
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {analysis.rhythmicAlignment}
                </p>
              </div>

              {Array.isArray(analysis.pedagogicalDrills) && analysis.pedagogicalDrills.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Pedagogical Practice Drills
                  </h3>
                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    {analysis.pedagogicalDrills.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(analysis.directorSuggestions) && analysis.directorSuggestions.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Director&apos;s Orchestration Suggestions
                  </h3>
                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    {analysis.directorSuggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
