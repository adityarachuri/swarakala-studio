import React, {useEffect, useRef, useState} from 'react';
import {AlertCircle, Check, Loader2, Mic, Square, Upload} from 'lucide-react';
import {useOnlineStatus} from '../hooks/useOnlineStatus';

import type {StudioLocale} from '../types/studio';

interface MicTranscriberPanelProps {
  scaleName: string;
  tradition: string;
  locale?: StudioLocale;
  onUseAsComposeBrief: (transcript: string) => void;
  onSaveAsSahitya: (transcript: string) => void;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function inferAudioMime(file: File): string {
  if (file.type && file.type.startsWith('audio/')) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'wav') return 'audio/wav';
  if (ext === 'm4a' || ext === 'mp4') return 'audio/mp4';
  if (ext === 'ogg') return 'audio/ogg';
  if (ext === 'webm') return 'audio/webm';
  if (ext === 'flac') return 'audio/flac';
  if (ext === 'aac') return 'audio/aac';
  return 'audio/mp3';
}

export const MicTranscriberPanel: React.FC<MicTranscriberPanelProps> = ({
  scaleName,
  tradition,
  locale = 'en',
  onUseAsComposeBrief,
  onSaveAsSahitya,
}) => {
  const isOnline = useOnlineStatus();
  const [recording, setRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const levelRafRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const savedToastTimerRef = useRef<number | null>(null);

  const cleanupRecordingResources = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (levelRafRef.current) {
      cancelAnimationFrame(levelRafRef.current);
      levelRafRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setMicLevel(0);
  };

  useEffect(() => {
    return () => {
      cleanupRecordingResources();
      if (savedToastTimerRef.current !== null) {
        window.clearTimeout(savedToastTimerRef.current);
        savedToastTimerRef.current = null;
      }
    };
  }, []);

  const submitAudioForTranscription = async (blob: Blob, mimeType: string) => {
    if (!isOnline) {
      setErrorMsg('You are offline. Reconnect to transcribe audio with gemini-3.5-transcribe.');
      return;
    }
    setTranscribing(true);
    setErrorMsg(null);
    try {
      const buf = await blob.arrayBuffer();
      const base64 = arrayBufferToBase64(buf);
      const res = await fetch('/api/studio/transcribe', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          audioBase64: base64,
          mimeType,
          contextHint: `${tradition} music studio session in ${scaleName}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transcription failed.');
      }
      setTranscript(data.transcript || '(No speech or lyrics detected in clip.)');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to transcribe audio.');
    } finally {
      setTranscribing(false);
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Microphone recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      streamRef.current = stream;
      chunksRef.current = [];

      // Level meter
      const AudioCtx = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteTimeDomainData(data);
        let max = 0;
        for (let i = 0; i < data.length; i++) {
          const v = Math.abs((data[i] - 128) / 128);
          if (v > max) max = v;
        }
        setMicLevel(Math.min(1, max * 2.5));
        levelRafRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      const candidateMimes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      const supportedMime =
        typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
          ? candidateMimes.find((m) => MediaRecorder.isTypeSupported(m))
          : undefined;

      const recorder = supportedMime
        ? new MediaRecorder(stream, {mimeType: supportedMime})
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        const recordedMime = recorder.mimeType || supportedMime || 'audio/webm';
        const blob = new Blob(chunksRef.current, {type: recordedMime});
        cleanupRecordingResources();
        if (blob.size >= 100) {
          void submitAudioForTranscription(blob, recordedMime);
        } else {
          setErrorMsg('Captured audio clip was too short. Hold Record for at least 1 second.');
        }
      };

      recorder.start(250);
      setRecording(true);
      setElapsedSec(0);
      timerRef.current = window.setInterval(() => {
        setElapsedSec((s) => s + 1);
      }, 1000);
    } catch (err) {
      cleanupRecordingResources();
      setErrorMsg(
        err instanceof Error
          ? `Microphone access denied or unavailable: ${err.message}`
          : 'Unable to access microphone.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    if (file.size > 7 * 1024 * 1024) {
      setErrorMsg('Audio file must be under 7 MB.');
      e.target.value = '';
      return;
    }
    await submitAudioForTranscription(file, inferAudioMime(file));
    e.target.value = '';
  };

  const titleText =
    locale === 'te'
      ? 'స్వర, శొల్కట్టు & సాహిత్య మైక్రోఫోన్ ట్రాన్స్‌క్రైబర్'
      : locale === 'sa'
        ? 'स्वर-सोलकट्टु-साहित्य ध्वन्यङ्कनम्'
        : 'Vocal, Solkattu & Lyric Microphone Transcriber';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {titleText}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dictate director briefs, sing swaras, or recite lyrics via microphone (powered by{' '}
            <code className="font-mono-tabular">gemini-3.5-transcribe</code>).
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={transcribing || !isOnline}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Mic className="w-3.5 h-3.5" aria-hidden="true" />
              Record Mic
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3.5 py-2 text-xs font-semibold text-white dark:text-slate-900 whitespace-nowrap shrink-0"
            >
              <Square className="w-3 h-3 fill-current" aria-hidden="true" />
              Stop ({elapsedSec}s)
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={recording || transcribing || !isOnline}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            Upload Audio
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Live Mic Input Level Bar */}
      {recording && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono-tabular text-red-600 dark:text-red-400">
            <span>Listening on Microphone...</span>
            <span>{elapsedSec}s</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-[#0B0E14] overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-[width] duration-75"
              style={{width: `${Math.round(micLevel * 100)}%`}}
            />
          </div>
        </div>
      )}

      {transcribing && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Transcribing studio audio...</span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      <textarea
        rows={3}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Transcribed lyrics, spoken musical directions, or solkattu syllables will appear here..."
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0E14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
      />

      {transcript.trim().length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              onSaveAsSahitya(transcript.trim());
              setSavedToast(true);
              if (savedToastTimerRef.current !== null) {
                window.clearTimeout(savedToastTimerRef.current);
              }
              savedToastTimerRef.current = window.setTimeout(() => setSavedToast(false), 1800);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {savedToast && <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />}
            {savedToast ? 'Saved to Sahitya' : 'Save to Session Sahitya'}
          </button>
          <button
            type="button"
            onClick={() => onUseAsComposeBrief(transcript.trim())}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400"
          >
            Use as AI Compose Brief
          </button>
        </div>
      )}
    </div>
  );
};
