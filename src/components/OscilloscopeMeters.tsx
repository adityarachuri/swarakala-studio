import React, {useEffect, useRef, useState} from 'react';
import {audioEngine} from '../engine/audioEngine';

interface OscilloscopeMetersProps {
  isPlaying: boolean;
  tanpuraEnabled: boolean;
}

export const OscilloscopeMeters: React.FC<OscilloscopeMetersProps> = ({
  isPlaying,
  tanpuraEnabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'scope' | 'spectrum'>('scope');
  const [peakDb, setPeakDb] = useState<string>('-∞ dB');

  const lastPeakUiUpdateRef = useRef<number>(0);
  const lastPeakLabelRef = useRef<string>('-∞ dB');

  useEffect(() => {
    let rafId = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timeData = new Uint8Array(512);
    const freqData = new Uint8Array(256);

    const updatePeakLabel = (next: string, now: number, force = false) => {
      if (next === lastPeakLabelRef.current) return;
      if (!force && now - lastPeakUiUpdateRef.current < 85) return;
      lastPeakLabelRef.current = next;
      lastPeakUiUpdateRef.current = now;
      setPeakDb(next);
    };

    const draw = () => {
      if (document.hidden) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Subtle hardware graticule
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const y = (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let i = 1; i < 8; i++) {
        const x = (w / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      const analyser = audioEngine.getAnalyser();
      const now = performance.now();
      if (analyser && (isPlaying || tanpuraEnabled) && !reducedMotion) {
        analyser.getByteTimeDomainData(timeData);
        analyser.getByteFrequencyData(freqData);

        // Compute Peak dB
        let maxAbs = 0;
        for (let i = 0; i < timeData.length; i++) {
          const v = Math.abs((timeData[i] - 128) / 128);
          if (v > maxAbs) maxAbs = v;
        }
        if (maxAbs > 0.001) {
          const db = Math.max(-60, Math.round(20 * Math.log10(maxAbs) * 10) / 10);
          updatePeakLabel(`${db > 0 ? '+' : ''}${db.toFixed(1)} dB`, now);
        } else {
          updatePeakLabel('-60.0 dB', now);
        }

        if (mode === 'scope') {
          ctx.beginPath();
          ctx.strokeStyle = '#F5B942';
          ctx.lineWidth = 2;
          const slice = w / timeData.length;
          for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i] / 128.0;
            const y = (v * h) / 2;
            if (i === 0) ctx.moveTo(0, y);
            else ctx.lineTo(i * slice, y);
          }
          ctx.stroke();
        } else {
          const barCount = 40;
          const barW = w / barCount;
          for (let i = 0; i < barCount; i++) {
            const val = freqData[i * 2] / 255;
            const barH = Math.max(2, val * (h - 6));
            ctx.fillStyle = val > 0.82 ? '#DC2626' : val > 0.58 ? '#F5B942' : '#D99B26';
            ctx.fillRect(i * barW + 1, h - barH, Math.max(2, barW - 2), barH);
          }
        }
      } else {
        // Flat baseline
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(217, 155, 38, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        updatePeakLabel('-∞ dB', now, true);
      }

      if (!reducedMotion && (isPlaying || tanpuraEnabled) && !document.hidden) {
        rafId = requestAnimationFrame(draw);
      }
    };

    const onVisibilityChange = () => {
      if (!document.hidden && !reducedMotion && (isPlaying || tanpuraEnabled)) {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    draw();
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isPlaying, tanpuraEnabled, mode]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Master Signal Monitor
          </span>
          <span className="font-mono-tabular text-xs text-amber-600 dark:text-amber-400">
            {peakDb}
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-[#0B0E14] p-0.5">
          <button
            type="button"
            onClick={() => setMode('scope')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              mode === 'scope'
                ? 'bg-white dark:bg-[#1E2534] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Waveform
          </button>
          <button
            type="button"
            onClick={() => setMode('spectrum')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              mode === 'spectrum'
                ? 'bg-white dark:bg-[#1E2534] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Spectrum
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={480}
        height={84}
        aria-label="Master audio waveform and spectrum analyzer"
        className="w-full h-[84px] rounded-lg bg-slate-950/95 dark:bg-[#090C11] border border-slate-800/80"
      />
    </div>
  );
};
