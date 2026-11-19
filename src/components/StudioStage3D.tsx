import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {ChevronDown, ChevronUp, Layers, Maximize2, Minimize2, Play, Square, Volume2, X} from 'lucide-react';
import {audioEngine} from '../engine/audioEngine';
import {getScaleDisplayName, getTalaDisplayName} from '../engine/musicTheory';
import {STUDIO_STRINGS} from '../i18n/studioLocale';
import {
  buildStudioStage,
  STAGE_INSTRUMENT_METADATA,
  type FinishPaletteId,
  type SelectableInstrumentInfo,
  type StageThemeId,
  type StudioStageHandles,
} from '../three/studioModels';
import type {ScaleDefinition, StudioLocale, TalaDefinition, TraditionId} from '../types/studio';

type CameraPresetId =
  | 'stage'
  | 'veena'
  | 'mridangam'
  | 'sitar'
  | 'tabla'
  | 'piano'
  | 'drums'
  | 'console'
  | 'halo';

type LightingMoodId = 'concert' | 'sabha' | 'scoring';

interface StudioStage3DProps {
  sessionTitle: string;
  tradition: TraditionId;
  scale: ScaleDefinition;
  tala: TalaDefinition;
  locale: StudioLocale;
  isPlaying: boolean;
  currentStep: number;
  onTogglePlay: () => void;
}

const CAMERA_PRESETS: Record<
  CameraPresetId,
  {label: string; pos: [number, number, number]; target: [number, number, number]}
> = {
  stage: {label: 'Stage', pos: [0, 3.6, 7.2], target: [0, 0.55, 0.1]},
  veena: {label: 'Veena', pos: [-2.55, 1.5, 2.85], target: [-1.4, 0.55, 1.15]},
  mridangam: {label: 'Mridangam', pos: [-0.95, 1.15, 3.3], target: [-0.45, 0.35, 1.78]},
  sitar: {label: 'Sitar', pos: [2.25, 1.75, 2.05], target: [1.25, 0.72, 0.45]},
  tabla: {label: 'Tabla', pos: [2.55, 1.35, 2.95], target: [1.65, 0.45, 1.45]},
  piano: {label: 'Grand Piano', pos: [1.9, 2.25, 1.3], target: [0, 0.85, -1.0]},
  drums: {label: 'Drum Kit', pos: [3.45, 1.85, 1.15], target: [2.25, 0.68, -0.95]},
  console: {label: 'Analog Desk', pos: [-1.1, 1.85, 2.15], target: [-2.55, 0.8, 0.35]},
  halo: {label: '22-Shruti', pos: [0, 6.8, 5.1], target: [0, 0.25, 0]},
};

const LIGHTING_RIGS: Record<
  LightingMoodId,
  {label: string; bgHex: number; keyColor: number; keyIntensity: number; rimColor: number; hemiSky: number}
> = {
  concert: {
    label: 'Concert',
    bgHex: 0x0b0e14,
    keyColor: 0xffe6c2,
    keyIntensity: 2.35,
    rimColor: 0xffb85c,
    hemiSky: 0x8fa9d6,
  },
  sabha: {
    label: 'Sabha Lamp',
    bgHex: 0x120b09,
    keyColor: 0xffc478,
    keyIntensity: 2.15,
    rimColor: 0xf5842a,
    hemiSky: 0xd99b66,
  },
  scoring: {
    label: 'Scoring',
    bgHex: 0x080c16,
    keyColor: 0xe6efff,
    keyIntensity: 2.2,
    rimColor: 0x5aa4ff,
    hemiSky: 0x6f97db,
  },
};

const _dummy = new THREE.Object3D();
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _freqBins = new Uint8Array(256);

export const StudioStage3D: React.FC<StudioStage3DProps> = ({
  sessionTitle,
  tradition,
  scale,
  tala,
  locale,
  isPlaying,
  currentStep,
  onTogglePlay,
}) => {
  const strings = STUDIO_STRINGS[locale];
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handlesRef = useRef<StudioStageHandles | null>(null);
  const lightsRef = useRef<{
    scene: THREE.Scene;
    hemi: THREE.HemisphereLight;
    key: THREE.DirectionalLight;
    rim: THREE.DirectionalLight;
  } | null>(null);

  const [theme, setTheme] = useState<StageThemeId>('universal');
  const [preset, setPreset] = useState<CameraPresetId>('stage');
  const [finish, setFinish] = useState<FinishPaletteId>('rosewood');
  const [lightingMood, setLightingMood] = useState<LightingMoodId>('concert');
  const [lidOpen, setLidOpen] = useState<number>(0.72);
  const [explodeAmt, setExplodeAmt] = useState<number>(0);
  const [reactive, setReactive] = useState<boolean>(true);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [inspected, setInspected] = useState<SelectableInstrumentInfo | null>(null);

  const stateRef = useRef({
    preset: 'stage' as CameraPresetId,
    transitionActive: false,
    lidOpen: 0.72,
    reactive: true,
    isPlaying: false,
    currentStep: 0,
    totalSteps: 16,
  });

  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.currentStep = currentStep;
    stateRef.current.totalSteps = tala.totalSteps;
  }, [isPlaying, currentStep, tala.totalSteps]);

  useEffect(() => {
    stateRef.current.lidOpen = lidOpen;
  }, [lidOpen]);

  useEffect(() => {
    stateRef.current.reactive = reactive;
  }, [reactive]);

  useEffect(() => {
    handlesRef.current?.applyFinish(finish);
  }, [finish]);

  useEffect(() => {
    handlesRef.current?.applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    handlesRef.current?.applyExplode(explodeAmt);
  }, [explodeAmt]);

  useEffect(() => {
    const rig = LIGHTING_RIGS[lightingMood];
    const refs = lightsRef.current;
    if (!refs) return;
    refs.scene.background = new THREE.Color(rig.bgHex);
    refs.scene.fog = new THREE.FogExp2(rig.bgHex, 0.044);
    refs.key.color.setHex(rig.keyColor);
    refs.key.intensity = rig.keyIntensity;
    refs.rim.color.setHex(rig.rimColor);
    refs.hemi.color.setHex(rig.hemiSky);
  }, [lightingMood]);

  // Suggest matching 3D hall when tradition switches unless user pinned Philharmonic
  useEffect(() => {
    if (tradition === 'carnatic') setTheme('carnatic');
    else if (tradition === 'hindustani') setTheme('hindustani');
    else setTheme('western');
  }, [tradition]);

  const selectPreset = (next: CameraPresetId) => {
    setPreset(next);
    stateRef.current.preset = next;
    stateRef.current.transitionActive = true;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key.toLowerCase() === 'h') {
        setDockCollapsed((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth || 1280, container.clientHeight || 720);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onRestored = () => setContextLost(false);
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    renderer.domElement.addEventListener('webglcontextrestored', onRestored);

    const scene = new THREE.Scene();
    const bgHex = 0x0b0e14;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.044);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(
      44,
      (container.clientWidth || 1280) / (container.clientHeight || 720),
      0.1,
      80
    );
    camera.position.set(...CAMERA_PRESETS.stage.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.stage.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.065;
    controls.minDistance = 1.5;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.update();

    const cancelAutoCam = () => {
      stateRef.current.transitionActive = false;
    };
    controls.addEventListener('start', cancelAutoCam);

    const hemi = new THREE.HemisphereLight(0x8fa9d6, 0x261d14, 0.72);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffe6c2, 2.35);
    keyLight.position.set(4.5, 6.8, 4.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 22;
    keyLight.shadow.camera.left = -5.8;
    keyLight.shadow.camera.right = 5.8;
    keyLight.shadow.camera.top = 5.8;
    keyLight.shadow.camera.bottom = -5.8;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffb85c, 1.15);
    rimLight.position.set(-4.5, 3.8, -5.0);
    scene.add(rimLight);

    lightsRef.current = {scene, hemi, key: keyLight, rim: rimLight};

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight(0xfff0d6, 3.0, 4.6, 1.8);
      softbox.position.set(0, 4.6, 2.8);
      softbox.lookAt(0, 0.6, 0);
      scene.add(softbox);
    }

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const stageHandles = buildStudioStage(maxAniso, isSoftwareGl);
    handlesRef.current = stageHandles;
    scene.add(stageHandles.root);

    // Click-to-audition & focus raycasting (ignores drag-orbits)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist > 6) return; // drag orbit
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(
        stageHandles.clickableRoots.filter((g) => g.visible),
        true
      );
      if (hits.length > 0) {
        const hitObj = hits[0].object;
        const key = hitObj.userData.stageInstrumentKey as string | undefined;
        if (key && STAGE_INSTRUMENT_METADATA[key]) {
          const info = STAGE_INSTRUMENT_METADATA[key];
          setInspected(info);
          void audioEngine.previewNote(info.id, info.previewSemitone, 'kampita', 0.6, 0.9);
          if (key in CAMERA_PRESETS) {
            selectPreset(key as CameraPresetId);
          }
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    };
    const resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(container);

    let disposed = false;
    let frameId = 0;
    let lastTime = performance.now();
    let currentLidAngle = 0.42;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const st = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const scheduleNext = () => {
      if (disposed || document.hidden) return;
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    const tick = () => {
      if (disposed || document.hidden) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const elapsed = now * 0.001;

      const s = stateRef.current;

      if (s.transitionActive) {
        const cfg = CAMERA_PRESETS[s.preset];
        _targetPos.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        _targetLook.set(cfg.target[0], cfg.target[1], cfg.target[2]);
        const alpha = 1 - Math.exp(-5.5 * dt);
        camera.position.lerp(_targetPos, alpha);
        controls.target.lerp(_targetLook, alpha);
        if (
          camera.position.distanceTo(_targetPos) < 0.02 &&
          controls.target.distanceTo(_targetLook) < 0.02
        ) {
          s.transitionActive = false;
        }
      }
      controls.update();

      const targetLid = 0.04 + s.lidOpen * 0.56;
      currentLidAngle = THREE.MathUtils.damp(currentLidAngle, targetLid, 7, dt);
      stageHandles.pianoLidPivot.rotation.z = currentLidAngle;
      stageHandles.pianoPropStick.visible = s.lidOpen > 0.15;
      stageHandles.pianoPropStick.scale.y = Math.max(0.25, s.lidOpen * 1.05);

      let energy = 0;
      const analyser = audioEngine.getAnalyser();
      if (s.reactive && analyser && s.isPlaying) {
        analyser.getByteFrequencyData(_freqBins);
        let sum = 0;
        for (let i = 0; i < 32; i++) sum += _freqBins[i];
        energy = sum / (32 * 255);
      } else if (s.reactive) {
        energy = 0.08 + Math.sin(elapsed * 1.4) * 0.03;
      }

      // Vibrate strings (Veena, Sitar, Tanpura)
      for (let i = 0; i < stageHandles.veenaStrings.length; i++) {
        const str = stageHandles.veenaStrings[i];
        const amp = s.isPlaying && s.reactive ? 0.004 * (0.4 + energy * 1.6) : 0;
        str.position.y = 0.592 + Math.sin(elapsed * (32 + i * 7)) * amp;
      }
      for (let i = 0; i < stageHandles.tanpuraStrings.length; i++) {
        const str = stageHandles.tanpuraStrings[i];
        const amp = s.isPlaying && s.reactive ? 0.0028 * (0.4 + energy * 1.4) : 0;
        str.position.z = 0.068 + Math.sin(elapsed * (24 + i * 5)) * amp;
      }

      // Subtle drumhead motion (Tabla, Mridangam, Kit)
      for (let i = 0; i < stageHandles.tablaHeads.length; i++) {
        const head = stageHandles.tablaHeads[i];
        const beatPulse = s.isPlaying && s.reactive ? Math.sin(elapsed * 14 + i) * 0.018 * energy : 0;
        head.scale.set(1 + beatPulse, 1, 1 + beatPulse);
      }
      for (let i = 0; i < stageHandles.mridangamHeads.length; i++) {
        const head = stageHandles.mridangamHeads[i];
        const beatPulse = s.isPlaying && s.reactive ? Math.sin(elapsed * 16 + i) * 0.015 * energy : 0;
        head.scale.set(1, 1 + beatPulse, 1 + beatPulse);
      }

      // Lamp flame gentle flicker
      for (let i = 0; i < stageHandles.lampFlames.length; i++) {
        const fl = stageHandles.lampFlames[i];
        fl.scale.y = 0.92 + Math.sin(elapsed * 8 + i * 2.1) * 0.12;
      }

      // Console motorized faders wave gently when playing
      if (s.isPlaying && s.reactive) {
        for (let i = 0; i < 24; i++) {
          const bin = _freqBins[(i * 4) % 128] / 255;
          _dummy.position.set(-0.62 + i * 0.054, 0.84, 0.14 - bin * 0.28);
          _dummy.rotation.set(0, 0, 0);
          _dummy.scale.set(1, 1, 1);
          _dummy.updateMatrix();
          stageHandles.consoleFaders.setMatrixAt(i, _dummy.matrix);
        }
        stageHandles.consoleFaders.instanceMatrix.needsUpdate = true;
      }

      // 22-Shruti Halo
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2;
        const binVal = s.reactive && s.isPlaying ? _freqBins[(i * 3) % 128] / 255 : 0.12;
        const bob = Math.sin(elapsed * 2.1 + i * 0.45) * 0.05;
        const stepHighlight =
          s.isPlaying && i === Math.floor((s.currentStep / Math.max(1, s.totalSteps)) * 22)
            ? 0.45
            : 0;
        const hScale = 1.2 + binVal * 2.2 + stepHighlight;
        _dummy.position.set(
          Math.cos(a) * 4.52,
          0.4 + bob + binVal * 0.25,
          Math.sin(a) * 4.52
        );
        _dummy.rotation.set(0, a + elapsed * 0.35, 0);
        _dummy.scale.set(1 + stepHighlight * 0.5, hScale, 1 + stepHighlight * 0.5);
        _dummy.updateMatrix();
        stageHandles.shrutiPillars.setMatrixAt(i, _dummy.matrix);
      }
      stageHandles.shrutiPillars.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
      scheduleNext();
    };

    const onVisibilityChange = () => {
      if (!document.hidden && !disposed) {
        lastTime = performance.now();
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    tick();

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObs.disconnect();
      controls.removeEventListener('start', cancelAutoCam);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
      stageHandles.dispose();
      envRT.dispose();
      renderer.dispose();
      handlesRef.current = null;
      lightsRef.current = null;
    };
  }, []);

  const themeButtons: Array<{id: StageThemeId; label: string}> = [
    {id: 'universal', label: strings.stage3d.universalStage},
    {id: 'carnatic', label: strings.stage3d.carnaticHall},
    {id: 'hindustani', label: strings.stage3d.hindustaniMehfil},
    {id: 'western', label: strings.stage3d.westernScoring},
  ];

  const getInspectedTitle = (info: SelectableInstrumentInfo) => {
    if (locale === 'te') return info.labelTe;
    if (locale === 'sa') return info.labelSa;
    return info.labelEn;
  };

  return (
    <div
      className={`${
        fullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen'
          : 'relative w-full h-[calc(100vh-148px)] min-h-[560px] rounded-xl border border-slate-800 overflow-hidden'
      } bg-[#0B0E14] select-none`}
    >
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {contextLost && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0B0E14] text-slate-200 p-6 text-center">
          <div>
            <p className="font-display text-2xl font-bold text-amber-300">
              3D Studio Context Interrupted
            </p>
            <p className="text-xs text-slate-400 mt-1">
              WebGL context is recovering. Your audio session remains active.
            </p>
          </div>
        </div>
      )}

      {/* Top-Left Spec & Hall Theme Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-[calc(100%-170px)]">
        <div
          className="rounded-lg border border-slate-700/70 px-3.5 py-2"
          style={{backgroundColor: 'rgba(11, 14, 20, 0.9)'}}
        >
          <p className="font-display text-lg font-bold text-amber-300 leading-tight">
            {sessionTitle}
          </p>
          <p className="text-[11px] text-slate-300 font-mono-tabular mt-0.5">
            {getScaleDisplayName(scale, locale)} · {getTalaDisplayName(tala, locale)} ·{' '}
            {strings.stage3d.clickInstrumentHint}
          </p>
        </div>

        <div
          className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-slate-700/70 p-1 self-start"
          style={{backgroundColor: 'rgba(11, 14, 20, 0.9)'}}
        >
          {themeButtons.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => {
                setTheme(tb.id);
                selectPreset('stage');
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
                theme === tb.id
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inspected Instrument Card when clicked */}
      {inspected && (
        <div
          style={{backgroundColor: 'rgba(14, 18, 27, 0.94)'}}
          className="absolute top-4 right-40 z-10 max-w-xs rounded-xl border border-amber-500/40 px-3.5 py-2.5 text-slate-200 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
              <Volume2 className="w-3.5 h-3.5 shrink-0" />
              <span>{getInspectedTitle(inspected)}</span>
            </div>
            <button
              type="button"
              onClick={() => setInspected(null)}
              className="text-slate-400 hover:text-white"
              aria-label="Close instrument card"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{inspected.anatomyNotes}</p>
          <button
            type="button"
            onClick={() =>
              void audioEngine.previewNote(inspected.id, inspected.previewSemitone, 'kampita', 0.65, 0.9)
            }
            className="mt-2 px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-medium hover:bg-amber-500/30"
          >
            Audition Voice
          </button>
        </div>
      )}

      {/* Top-Right Fullscreen Toggle */}
      <button
        type="button"
        onClick={() => setFullscreen((f) => !f)}
        aria-label={fullscreen ? 'Exit full viewport 3D stage' : 'Expand 3D stage to full viewport'}
        style={{backgroundColor: 'rgba(11, 14, 20, 0.9)'}}
        className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-700/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-amber-500/60"
      >
        {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        {fullscreen ? 'Exit Fullscreen' : 'Cinema Stage'}
      </button>

      {/* Collapsible Bottom Control Dock */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 z-10 transition-transform duration-200 ${
          dockCollapsed ? 'bottom-0 translate-y-[calc(100%-34px)]' : 'bottom-4 translate-y-0'
        }`}
        style={{width: 'min(1040px, 95vw)'}}
      >
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            style={{backgroundColor: 'rgba(14, 18, 27, 0.94)'}}
            className="inline-flex items-center gap-1.5 rounded-t-lg border border-b-0 border-slate-700/80 px-3.5 py-1 text-[11px] font-medium text-slate-300 hover:text-amber-300"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                Show Controls (H)
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                Hide Controls (H)
              </>
            )}
          </button>
        </div>

        <div
          style={{backgroundColor: 'rgba(14, 18, 27, 0.94)'}}
          className="rounded-xl border border-slate-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-200 shadow-2xl"
        >
          {/* Camera Focus Presets */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full">
            {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => selectPreset(id)}
                className={`px-2 py-1 rounded-md font-medium whitespace-nowrap shrink-0 transition-colors ${
                  preset === id
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                {CAMERA_PRESETS[id].label}
              </button>
            ))}
          </div>

          {/* Luthiery Explode, Lid, Mood & Finish */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5" title={strings.stage3d.acousticAnatomy}>
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                {strings.stage3d.acousticAnatomy}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={explodeAmt}
                onChange={(e) => setExplodeAmt(Number(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>

            <label className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 whitespace-nowrap">Lid</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={lidOpen}
                onChange={(e) => setLidOpen(Number(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>

            {/* Lighting Moods */}
            <div className="inline-flex rounded border border-slate-700 overflow-hidden">
              {(Object.keys(LIGHTING_RIGS) as LightingMoodId[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setLightingMood(m)}
                  className={`px-2 py-1 text-[10px] font-medium whitespace-nowrap ${
                    lightingMood === m
                      ? 'bg-amber-500/25 text-amber-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {LIGHTING_RIGS[m].label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5" role="group" aria-label="Wood and Brass Finish">
              {(
                [
                  {id: 'rosewood', label: 'Rosewood', swatch: '#73321b'},
                  {id: 'ebony', label: 'Ebony', swatch: '#1f1e24'},
                  {id: 'walnut', label: 'Walnut', swatch: '#805232'},
                ] as Array<{id: FinishPaletteId; label: string; swatch: string}>
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  title={f.label}
                  aria-label={`${f.label} finish`}
                  onClick={() => setFinish(f.id)}
                  className={`w-4 h-4 rounded-full border-2 transition-transform ${
                    finish === f.id ? 'border-amber-400 scale-110' : 'border-slate-600'
                  }`}
                  style={{backgroundColor: f.swatch}}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setReactive((r) => !r)}
              className={`px-2 py-1 rounded-md border text-[11px] font-medium whitespace-nowrap shrink-0 ${
                reactive
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                  : 'border-slate-700 text-slate-400'
              }`}
            >
              Sync {reactive ? 'On' : 'Off'}
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold whitespace-nowrap shrink-0 ${
                isPlaying ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  {strings.actions.stop}
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  {strings.actions.playLoop}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
