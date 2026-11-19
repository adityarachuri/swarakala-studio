import React, {useState} from 'react';
import {Download, FileAudio, FileCode2, FileMusic, Loader2, X} from 'lucide-react';
import type {StudioSession} from '../types/studio';
import {audioEngine} from '../engine/audioEngine';
import {exportSessionToMidiBlob} from '../engine/midiExport';

interface ExportModalProps {
  session: StudioSession;
  onClose: () => void;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const ExportModal: React.FC<ExportModalProps> = ({session, onClose}) => {
  const hasMultiSections = (session.sections?.length ?? 0) > 1;
  const [renderingWav, setRenderingWav] = useState(false);
  const [wavLoops, setWavLoops] = useState<number>(2);
  const [renderFullArrangement, setRenderFullArrangement] = useState<boolean>(hasMultiSections);
  const [exportNote, setExportNote] = useState<string | null>(null);

  const slug =
    session.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'swarakala-session';

  const handleWavExport = async () => {
    setRenderingWav(true);
    setExportNote(null);
    try {
      const blob = await audioEngine.renderSessionToWavBlob(
        session,
        wavLoops,
        renderFullArrangement && hasMultiSections
      );
      const suffix =
        renderFullArrangement && hasMultiSections ? 'full-arrangement' : `${wavLoops}x`;
      triggerDownload(blob, `${slug}-${suffix}.wav`);
      setExportNote(
        `Stereo 16-bit 44.1kHz WAV master (${
          renderFullArrangement && hasMultiSections ? 'Full Arrangement' : `${wavLoops}x Loop`
        }) rendered offline and downloaded.`
      );
    } catch (err) {
      setExportNote(err instanceof Error ? err.message : 'WAV export failed.');
    } finally {
      setRenderingWav(false);
    }
  };

  const handleMidiExport = () => {
    const blob = exportSessionToMidiBlob(session);
    triggerDownload(blob, `${slug}.mid`);
    setExportNote('Type-1 Multi-Track Standard MIDI (.mid) exported for DAW import.');
  };

  const handleJsonExport = () => {
    const blob = new Blob([JSON.stringify(session, null, 2)], {type: 'application/json'});
    triggerDownload(blob, `${slug}.swarakala.json`);
    setExportNote('Portable SwaraKala studio session (.json) exported.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="export-modal-title"
              className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100"
            >
              Master Bounce &amp; Export
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Offline studio rendering for &ldquo;{session.title}&rdquo;
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* WAV Export */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E121B] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <FileAudio className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Stereo WAV Audio Master
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Includes Tanpura drone, Gamakas, Analog Tape Warmth, Convolution Stage Reverb, and Master EQ.
                  </p>
                </div>

                {hasMultiSections && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setRenderFullArrangement(true)}
                      className={`px-2 py-0.5 rounded font-medium ${
                        renderFullArrangement
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Full Song ({session.sections?.length} sections)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenderFullArrangement(false)}
                      className={`px-2 py-0.5 rounded font-medium ${
                        !renderFullArrangement
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Active Section Loop
                    </button>
                  </div>
                )}

                {(!hasMultiSections || !renderFullArrangement) && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Cycles:</span>
                    {[1, 2, 4].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setWavLoops(c)}
                        className={`px-2 py-0.5 rounded font-mono-tabular ${
                          wavLoops === c
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {c}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleWavExport}
              disabled={renderingWav}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {renderingWav ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {renderingWav ? 'Bouncing...' : 'Bounce WAV'}
            </button>
          </div>

          {/* MIDI Export */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E121B] p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <FileMusic className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Standard Multi-Track MIDI (.mid)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Drop full arrangement directly into Logic Pro, Ableton Live, Cubase, or Sibelius.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleMidiExport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Export .MID
            </button>
          </div>

          {/* JSON Export */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E121B] p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <FileCode2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Portable Studio Project (.json)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Share full microtonal, multi-section, mixer, and pedagogy state with colleagues or students.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleJsonExport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Export JSON
            </button>
          </div>
        </div>

        {exportNote && (
          <p role="status" className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {exportNote}
          </p>
        )}
      </div>
    </div>
  );
};
