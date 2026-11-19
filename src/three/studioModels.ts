import * as THREE from 'three';
import {
  createCarpetTexture,
  createContactShadowTexture,
  createLinearBumpTexture,
  createMeterPanelTexture,
  createStageFloorTexture,
  createWoodGrainTexture,
} from './proceduralTextures';
import type {InstrumentId} from '../types/studio';

export type FinishPaletteId = 'rosewood' | 'ebony' | 'walnut';
export type StageThemeId = 'universal' | 'carnatic' | 'hindustani' | 'western';

export interface SelectableInstrumentInfo {
  id: InstrumentId;
  groupName: string;
  previewSemitone: number;
  labelEn: string;
  labelTe: string;
  labelSa: string;
  anatomyNotes: string;
}

export const STAGE_INSTRUMENT_METADATA: Record<string, SelectableInstrumentInfo> = {
  veena: {
    id: 'veena',
    groupName: 'veena',
    previewSemitone: 4,
    labelEn: 'Saraswati Veena (Thanjavur Composite)',
    labelTe: 'సరస్వతీ వీణ (తంజావూరు నిర్మాణం)',
    labelSa: 'सरस्वती-वीणा (तञ्जावूरु-शिल्पम्)',
    anatomyNotes: 'Jackfruit Kudam resonator · 24 wax-set brass frets · Carved Yali finial · 4+3 bronze strings.',
  },
  mridangam: {
    id: 'mridangam',
    groupName: 'mridangam',
    previewSemitone: 0,
    labelEn: 'Carnatic Mridangam',
    labelTe: 'కర్ణాటక మృదంగం',
    labelSa: 'मृदङ्गः (मर्दलः)',
    anatomyNotes: 'Hollowed jackfruit-wood double-barrel · 24 leather Varu braces · Valanthalai & Thoppi heads.',
  },
  tanpura: {
    id: 'veena',
    groupName: 'tanpura',
    previewSemitone: 0,
    labelEn: 'Miraj Standing Concert Tanpura',
    labelTe: 'శ్రుతి తంబురా (మీరజ్)',
    labelSa: 'तम्बूरा (श्रुतिनादः)',
    anatomyNotes: 'Seasoned pumpkin Tumba · Bone Jivari curved bridge producing overtone-rich Pa–Sȧ–Sȧ–Sa drone.',
  },
  sitar: {
    id: 'sitar',
    groupName: 'sitar',
    previewSemitone: 7,
    labelEn: 'Hindustani Concert Sitar (Kharaj-Pancham)',
    labelTe: 'హిందుస్తానీ సితార్',
    labelSa: 'सितारः (सप्ततन्त्री)',
    anatomyNotes: 'Tumba resonator · Toon-wood hollow Dand · 20 arched brass Pardas · Sympathetic Tarab pegs.',
  },
  tabla: {
    id: 'tabla',
    groupName: 'tabla',
    previewSemitone: 2,
    labelEn: 'Tabla & Hammered Brass Bayan',
    labelTe: 'తబలా & బయాన్ జంట',
    labelSa: 'तबला-युगलम्',
    anatomyNotes: 'Sheesham Dayan pitched to Tonic Sa · Hand-hammered brass Bayan · Black iron-paste Syahi harmonic load.',
  },
  harmonium: {
    id: 'harmonium',
    groupName: 'harmonium',
    previewSemitone: 5,
    labelEn: 'Scale-Changer Harmonium & Bamboo Bansuri',
    labelTe: 'హార్మోనియం & వేణువు (బాంసురి)',
    labelSa: 'हार्मोनियम् वेणुश्च',
    anatomyNotes: 'Teak multi-fold bellows with free-brass reeds alongside a 7-hole Assam bamboo Bansuri.',
  },
  piano: {
    id: 'piano',
    groupName: 'piano',
    previewSemitone: 12,
    labelEn: 'Concert Grand Piano (9-Foot Scoring Model)',
    labelTe: 'కాన్సర్ట్ గ్రాండ్ పియానో',
    labelSa: 'बृहत्स्वरमण्डल-पियानो',
    anatomyNotes: 'S-curve high-gloss cabinet · Cast-iron gilt harp plate · 52 ivory & 36 ebony keys · Brass pedal lyre.',
  },
  drums: {
    id: 'drums',
    groupName: 'drums',
    previewSemitone: 0,
    labelEn: 'Western Studio Acoustic Drum Kit',
    labelTe: 'పాశ్చాత్య అకౌస్టిక్ డ్రమ్ కిట్',
    labelSa: 'पाश्चात्य-आनद्धवाद्यसमूहः',
    anatomyNotes: '22" maple kick drum · Brass studio snare · Rack & floor toms · Cast B20 bronze cymbals.',
  },
  console: {
    id: 'frenchHorn',
    groupName: 'console',
    previewSemitone: 0,
    labelEn: 'Analog Scoring Desk & Condenser Mic Rig',
    labelTe: 'అనలాగ్ మిక్సింగ్ కన్సోల్ & మైక్',
    labelSa: 'ध्वनिसंयोजनपीठम्',
    anatomyNotes: '32-channel motorized console with amber VU meter bridge + large-diaphragm vintage condenser.',
  },
};

export interface StudioStageHandles {
  root: THREE.Group;
  veenaGroup: THREE.Group;
  veenaStrings: THREE.Mesh[];
  veenaPalagai: THREE.Mesh;
  veenaBridge: THREE.Mesh;
  sitarGroup: THREE.Group;
  sitarStrings: THREE.Mesh[];
  tanpuraGroup: THREE.Group;
  tanpuraStrings: THREE.Mesh[];
  mridangamGroup: THREE.Group;
  mridangamHeads: THREE.Mesh[];
  tablaGroup: THREE.Group;
  tablaHeads: THREE.Mesh[];
  harmoniumGroup: THREE.Group;
  pianoGroup: THREE.Group;
  pianoLidPivot: THREE.Group;
  pianoPropStick: THREE.Mesh;
  pianoHarp: THREE.Mesh;
  pianoWhiteKeys: THREE.InstancedMesh;
  pianoBlackKeys: THREE.InstancedMesh;
  drumKitGroup: THREE.Group;
  drumHeads: THREE.Mesh[];
  cymbals: THREE.Mesh[];
  consoleGroup: THREE.Group;
  consoleFaders: THREE.InstancedMesh;
  sabhaArchitectureGroup: THREE.Group;
  scoringDiffuserGroup: THREE.Group;
  lampFlames: THREE.Mesh[];
  shrutiPillars: THREE.InstancedMesh;
  clickableRoots: THREE.Object3D[];
  applyFinish: (finish: FinishPaletteId) => void;
  applyTheme: (theme: StageThemeId) => void;
  applyExplode: (amount: number) => void;
  dispose: () => void;
}

const FINISH_CONFIGS: Record<
  FinishPaletteId,
  {woodHex: number; accentHex: number; metalHex: number; pianoHex: number}
> = {
  rosewood: {
    woodHex: 0x692917,
    accentHex: 0xd99b26,
    metalHex: 0xe3b14b,
    pianoHex: 0x12141a,
  },
  ebony: {
    woodHex: 0x1f1e24,
    accentHex: 0xf5c85c,
    metalHex: 0xf0ca6d,
    pianoHex: 0x0b0d12,
  },
  walnut: {
    woodHex: 0x70472b,
    accentHex: 0xc97b42,
    metalHex: 0xd48b54,
    pianoHex: 0x261a14,
  },
};

function makeContactShadow(
  shadowTex: THREE.CanvasTexture,
  width: number,
  depth: number,
  yOffset = 0.004
): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(width, depth);
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = yOffset;
  mesh.renderOrder = 1;
  return mesh;
}

function tagInteractiveGroup(group: THREE.Object3D, key: string) {
  group.userData.stageInstrumentKey = key;
  group.traverse((child) => {
    child.userData.stageInstrumentKey = key;
  });
}

export function buildStudioStage(
  maxAnisotropy: number,
  isSoftwareGl: boolean
): StudioStageHandles {
  const root = new THREE.Group();
  const disposables: Array<{dispose: () => void}> = [];
  const track = <T extends {dispose: () => void}>(item: T): T => {
    disposables.push(item);
    return item;
  };
  const dummy = new THREE.Object3D();

  // Shared Procedural Textures
  const woodColorTex = track(createWoodGrainTexture('#68301c', '#361308', maxAnisotropy, 2, 2));
  const spruceTex = track(createWoodGrainTexture('#c48f5a', '#966437', maxAnisotropy, 1, 2));
  const bambooTex = track(createWoodGrainTexture('#d6b46b', '#a8833c', maxAnisotropy, 1, 1));
  const woodBumpTex = track(createLinearBumpTexture(maxAnisotropy, false));
  const hammeredBumpTex = track(createLinearBumpTexture(maxAnisotropy, true));
  const shadowTex = track(createContactShadowTexture());
  const stageFloorTex = track(createStageFloorTexture(maxAnisotropy));
  const carpetTex = track(createCarpetTexture(maxAnisotropy));
  const meterPanelTex = track(createMeterPanelTexture(maxAnisotropy));

  // Shared PBR Materials
  const rosewoodMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x73321b,
      map: woodColorTex,
      bumpMap: woodBumpTex,
      bumpScale: 0.008,
      roughness: 0.34,
      metalness: 0.06,
    })
  );

  const spruceMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xd9a673,
      map: spruceTex,
      roughness: 0.56,
      metalness: 0.02,
    })
  );

  const bambooMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xe2be74,
      map: bambooTex,
      roughness: 0.42,
      metalness: 0.04,
    })
  );

  const gourdMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x8f4e22,
      roughness: 0.72,
      metalness: 0.02,
    })
  );

  const brassMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xe3b14b,
      metalness: 0.92,
      roughness: 0.2,
      anisotropy: isSoftwareGl ? 0 : 0.75,
      clearcoat: 0.25,
    })
  );

  const chromeMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xd6dbe4,
      metalness: 0.94,
      roughness: 0.16,
      clearcoat: 0.2,
    })
  );

  const hammeredBrassMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xd9a23b,
      metalness: 0.9,
      roughness: 0.26,
      bumpMap: hammeredBumpTex,
      bumpScale: 0.018,
    })
  );

  const pianoLacquerMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x12141a,
      roughness: 0.14,
      metalness: 0.08,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
    })
  );

  const parchmentMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xefe3cb,
      roughness: 0.82,
      metalness: 0.0,
    })
  );

  const syahiMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x17181c,
      roughness: 0.48,
      metalness: 0.05,
    })
  );

  const velvetMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x5c1824,
      roughness: 0.94,
      metalness: 0.0,
    })
  );

  const ivoryMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf4f0e6,
      roughness: 0.28,
      metalness: 0.02,
    })
  );

  const ebonyKeyMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x16181f,
      roughness: 0.52,
      metalness: 0.05,
    })
  );

  const darkSlateMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x1b202b,
      roughness: 0.62,
      metalness: 0.25,
    })
  );

  const meterBridgeMat = track(
    new THREE.MeshStandardMaterial({
      map: meterPanelTex,
      emissive: 0x3b270b,
      emissiveMap: meterPanelTex,
      emissiveIntensity: 0.85,
      roughness: 0.35,
      metalness: 0.1,
    })
  );

  // =========================================================================
  // 1. STUDIO DAIS & GROUND FLOOR
  // =========================================================================
  const groundMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x0e121a,
      roughness: 0.88,
      metalness: 0.05,
    })
  );
  const groundGeo = track(new THREE.CircleGeometry(36, 64));
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  const daisHeight = 0.16;
  const daisGeo = track(new THREE.CylinderGeometry(4.85, 5.1, daisHeight, 72));
  const daisMat = track(
    new THREE.MeshStandardMaterial({
      map: stageFloorTex,
      roughness: 0.44,
      metalness: 0.08,
    })
  );
  const dais = new THREE.Mesh(daisGeo, daisMat);
  dais.position.y = daisHeight / 2;
  dais.receiveShadow = true;
  dais.castShadow = true;
  root.add(dais);

  const daisRimMat = track(brassMat.clone());
  daisRimMat.polygonOffset = true;
  daisRimMat.polygonOffsetFactor = -1;
  daisRimMat.polygonOffsetUnits = -1;
  const daisRimGeo = track(new THREE.TorusGeometry(4.86, 0.036, 16, 96));
  const daisRim = new THREE.Mesh(daisRimGeo, daisRimMat);
  daisRim.rotation.x = Math.PI / 2;
  daisRim.position.y = daisHeight + 0.002;
  root.add(daisRim);

  // =========================================================================
  // 2. ARCHITECTURAL ROOM GROUPS (Sabha Mandapam / Mehfil & Scoring Stage)
  // =========================================================================
  const sabhaArchitectureGroup = new THREE.Group();
  const lampFlames: THREE.Mesh[] = [];

  // Woven Persian / Baithak Stage Carpet
  const carpetMat = track(
    new THREE.MeshStandardMaterial({
      map: carpetTex,
      roughness: 0.92,
      metalness: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  const carpetGeo = track(new THREE.BoxGeometry(3.8, 0.012, 2.75));
  const carpet = new THREE.Mesh(carpetGeo, carpetMat);
  carpet.position.set(0, daisHeight + 0.007, 1.05);
  carpet.receiveShadow = true;
  sabhaArchitectureGroup.add(carpet);

  // Carved Rosewood Sabha Mandapam Pillars along rear semi-circle
  const sabhaPillarGeo = track(new THREE.CylinderGeometry(0.11, 0.14, 3.2, 20));
  const sabhaCapGeo = track(new THREE.BoxGeometry(0.36, 0.14, 0.36));
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    const angle = i * 0.42;
    const px = Math.sin(angle) * 4.4;
    const pz = -Math.cos(angle) * 4.15;
    const pillar = new THREE.Mesh(sabhaPillarGeo, rosewoodMat);
    pillar.position.set(px, daisHeight + 1.6, pz);
    pillar.castShadow = true;
    sabhaArchitectureGroup.add(pillar);

    const cap = new THREE.Mesh(sabhaCapGeo, brassMat);
    cap.position.set(px, daisHeight + 3.2, pz);
    sabhaArchitectureGroup.add(cap);
  }

  // Two Traditional Brass Kuthuvilakku Ceremonial Oil Lamps
  const lampProfile = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.18, 0.02),
    new THREE.Vector2(0.14, 0.07),
    new THREE.Vector2(0.04, 0.14),
    new THREE.Vector2(0.032, 0.62),
    new THREE.Vector2(0.15, 0.72),
    new THREE.Vector2(0.16, 0.78),
    new THREE.Vector2(0.04, 0.8),
    new THREE.Vector2(0.02, 0.96),
  ];
  const lampGeo = track(new THREE.LatheGeometry(lampProfile, 24));
  const flameGeo = track(new THREE.ConeGeometry(0.028, 0.085, 10));
  const flameMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xffc857,
    })
  );

  for (const lx of [-2.45, 2.45]) {
    const lamp = new THREE.Mesh(lampGeo, brassMat);
    lamp.position.set(lx, daisHeight, -0.35);
    lamp.castShadow = true;
    sabhaArchitectureGroup.add(lamp);

    for (let w = 0; w < 3; w++) {
      const a = (w / 3) * Math.PI * 2;
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(lx + Math.cos(a) * 0.12, daisHeight + 0.83, -0.35 + Math.sin(a) * 0.12);
      sabhaArchitectureGroup.add(flame);
      lampFlames.push(flame);
    }
  }
  root.add(sabhaArchitectureGroup);

  // Scoring Stage Walnut Quadratic Acoustic Diffuser Wall (InstancedMesh > 20 items)
  const scoringDiffuserGroup = new THREE.Group();
  const diffuserCount = 48;
  const slatGeo = track(new THREE.BoxGeometry(0.16, 2.2, 0.18));
  const diffuserWall = new THREE.InstancedMesh(slatGeo, spruceMat, diffuserCount);
  for (let i = 0; i < diffuserCount; i++) {
    const t = i / (diffuserCount - 1) - 0.5;
    const angle = t * Math.PI * 0.85;
    const rad = 4.45 + ((i * 7) % 5) * 0.03;
    dummy.position.set(Math.sin(angle) * rad, daisHeight + 1.15, -Math.cos(angle) * rad);
    dummy.rotation.set(0, -angle, 0);
    dummy.scale.set(1, 0.75 + ((i * 3) % 5) * 0.08, 1);
    dummy.updateMatrix();
    diffuserWall.setMatrixAt(i, dummy.matrix);
  }
  diffuserWall.instanceMatrix.needsUpdate = true;
  diffuserWall.computeBoundingSphere();
  scoringDiffuserGroup.add(diffuserWall);
  root.add(scoringDiffuserGroup);

  // =========================================================================
  // 3. SARASWATI VEENA (Left Foreground)
  // =========================================================================
  const veenaGroup = new THREE.Group();
  veenaGroup.position.set(-1.55, daisHeight, 1.15);
  veenaGroup.rotation.y = 0.48;

  const veenaStandGeo = track(new THREE.TorusGeometry(0.24, 0.065, 16, 36));
  const veenaStand = new THREE.Mesh(veenaStandGeo, velvetMat);
  veenaStand.rotation.x = Math.PI / 2;
  veenaStand.position.set(-0.55, 0.065, 0);
  veenaStand.castShadow = true;
  veenaGroup.add(veenaStand);

  const veenaShadow1 = makeContactShadow(shadowTex, 1.05, 1.05);
  veenaShadow1.position.set(-0.55, 0.015, 0);
  veenaGroup.add(veenaShadow1);

  const kudamProfile = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.18, 0.03),
    new THREE.Vector2(0.34, 0.14),
    new THREE.Vector2(0.39, 0.28),
    new THREE.Vector2(0.35, 0.41),
    new THREE.Vector2(0.26, 0.48),
    new THREE.Vector2(0.001, 0.49),
  ];
  const kudamGeo = track(new THREE.LatheGeometry(kudamProfile, 40));
  const kudam = new THREE.Mesh(kudamGeo, rosewoodMat);
  kudam.position.set(-0.55, 0.06, 0);
  kudam.castShadow = true;
  veenaGroup.add(kudam);

  const palagaiGeo = track(new THREE.CylinderGeometry(0.27, 0.28, 0.024, 36));
  const veenaPalagai = new THREE.Mesh(palagaiGeo, spruceMat);
  veenaPalagai.position.set(-0.55, 0.548, 0);
  veenaPalagai.castShadow = true;
  veenaGroup.add(veenaPalagai);

  const dandiShape = new THREE.Shape();
  dandiShape.moveTo(-0.075, -0.045);
  dandiShape.lineTo(0.075, -0.045);
  dandiShape.lineTo(0.062, 0.045);
  dandiShape.lineTo(-0.062, 0.045);
  dandiShape.closePath();
  const dandiGeo = track(
    new THREE.ExtrudeGeometry(dandiShape, {
      depth: 1.55,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 3,
    })
  );
  dandiGeo.rotateY(Math.PI / 2);
  const dandi = new THREE.Mesh(dandiGeo, rosewoodMat);
  dandi.position.set(-0.32, 0.49, 0);
  dandi.castShadow = true;
  veenaGroup.add(dandi);

  const gourdProfile = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.14, 0.04),
    new THREE.Vector2(0.23, 0.16),
    new THREE.Vector2(0.22, 0.29),
    new THREE.Vector2(0.11, 0.4),
    new THREE.Vector2(0.04, 0.45),
  ];
  const gourdGeo = track(new THREE.LatheGeometry(gourdProfile, 32));
  const gourd = new THREE.Mesh(gourdGeo, gourdMat);
  gourd.position.set(0.68, 0.0, 0);
  gourd.castShadow = true;
  veenaGroup.add(gourd);

  const yaliCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.22, 0.49, 0),
    new THREE.Vector3(1.38, 0.45, 0),
    new THREE.Vector3(1.46, 0.34, 0),
    new THREE.Vector3(1.41, 0.22, 0),
    new THREE.Vector3(1.3, 0.24, 0),
    new THREE.Vector3(1.34, 0.31, 0),
  ]);
  const yaliGeo = track(new THREE.TubeGeometry(yaliCurve, 32, 0.036, 12, false));
  const yali = new THREE.Mesh(yaliGeo, brassMat);
  yali.castShadow = true;
  veenaGroup.add(yali);

  const bridgeGeo = track(new THREE.BoxGeometry(0.045, 0.042, 0.14));
  const veenaBridge = new THREE.Mesh(bridgeGeo, brassMat);
  veenaBridge.position.set(-0.56, 0.58, 0);
  veenaGroup.add(veenaBridge);

  const fretGeo = track(new THREE.CylinderGeometry(0.0055, 0.0055, 0.125, 8));
  fretGeo.rotateX(Math.PI / 2);
  const fretMesh = new THREE.InstancedMesh(fretGeo, brassMat, 24);
  for (let i = 0; i < 24; i++) {
    dummy.position.set(-0.18 + (i / 23) * 1.24, 0.542, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    fretMesh.setMatrixAt(i, dummy.matrix);
  }
  fretMesh.instanceMatrix.needsUpdate = true;
  fretMesh.computeBoundingSphere();
  veenaGroup.add(fretMesh);

  const veenaStrings: THREE.Mesh[] = [];
  const strGeo = track(new THREE.CylinderGeometry(0.0022, 0.0022, 1.72, 6));
  strGeo.rotateZ(Math.PI / 2);
  for (let i = 0; i < 4; i++) {
    const sMesh = new THREE.Mesh(strGeo, brassMat);
    sMesh.position.set(0.28, 0.592, -0.042 + i * 0.028);
    veenaGroup.add(sMesh);
    veenaStrings.push(sMesh);
  }
  tagInteractiveGroup(veenaGroup, 'veena');
  root.add(veenaGroup);

  // =========================================================================
  // 4. CARNATIC MRIDANGAM (Left-Center Foreground)
  // =========================================================================
  const mridangamGroup = new THREE.Group();
  mridangamGroup.position.set(-0.45, daisHeight, 1.78);
  mridangamGroup.rotation.y = -0.22;
  const mridangamHeads: THREE.Mesh[] = [];

  const mridShadow = makeContactShadow(shadowTex, 0.9, 0.55);
  mridangamGroup.add(mridShadow);

  const mridCradleGeo = track(new THREE.BoxGeometry(0.42, 0.06, 0.24));
  const mridCradle = new THREE.Mesh(mridCradleGeo, spruceMat);
  mridCradle.position.y = 0.03;
  mridCradle.castShadow = true;
  mridangamGroup.add(mridCradle);

  const mridProfile = [
    new THREE.Vector2(0.001, -0.34),
    new THREE.Vector2(0.125, -0.34),
    new THREE.Vector2(0.185, -0.05),
    new THREE.Vector2(0.165, 0.14),
    new THREE.Vector2(0.115, 0.34),
    new THREE.Vector2(0.001, 0.34),
  ];
  const mridShellGeo = track(new THREE.LatheGeometry(mridProfile, 32));
  mridShellGeo.rotateZ(Math.PI / 2);
  const mridShell = new THREE.Mesh(mridShellGeo, rosewoodMat);
  mridShell.position.y = 0.21;
  mridShell.castShadow = true;
  mridangamGroup.add(mridShell);

  // Valanthalai (right head) & Thoppi (left head)
  const mRightHeadGeo = track(new THREE.CylinderGeometry(0.116, 0.116, 0.015, 28));
  mRightHeadGeo.rotateZ(Math.PI / 2);
  const mRightHead = new THREE.Mesh(mRightHeadGeo, parchmentMat);
  mRightHead.position.set(-0.345, 0.21, 0);
  mridangamGroup.add(mRightHead);
  mridangamHeads.push(mRightHead);

  const mLeftHeadGeo = track(new THREE.CylinderGeometry(0.126, 0.126, 0.015, 28));
  mLeftHeadGeo.rotateZ(Math.PI / 2);
  const mLeftHead = new THREE.Mesh(mLeftHeadGeo, parchmentMat);
  mLeftHead.position.set(0.345, 0.21, 0);
  mridangamGroup.add(mLeftHead);
  mridangamHeads.push(mLeftHead);

  const mSyahiGeo = track(new THREE.CylinderGeometry(0.048, 0.048, 0.005, 20));
  mSyahiGeo.rotateZ(Math.PI / 2);
  const mSyahi = new THREE.Mesh(mSyahiGeo, syahiMat);
  mSyahi.position.set(-0.354, 0.21, 0);
  mridangamGroup.add(mSyahi);

  // 24 Leather Varu Straps (InstancedMesh > 20 items)
  const varuGeo = track(new THREE.CylinderGeometry(0.0045, 0.0045, 0.68, 6));
  varuGeo.rotateZ(Math.PI / 2);
  const varuStraps = new THREE.InstancedMesh(varuGeo, parchmentMat, 24);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    dummy.position.set(0, 0.21 + Math.sin(a) * 0.165, Math.cos(a) * 0.165);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    varuStraps.setMatrixAt(i, dummy.matrix);
  }
  varuStraps.instanceMatrix.needsUpdate = true;
  varuStraps.computeBoundingSphere();
  mridangamGroup.add(varuStraps);
  tagInteractiveGroup(mridangamGroup, 'mridangam');
  root.add(mridangamGroup);

  // =========================================================================
  // 5. HINDUSTANI STANDING CONCERT TANPURA (Rear-Left)
  // =========================================================================
  const tanpuraGroup = new THREE.Group();
  tanpuraGroup.position.set(-2.35, daisHeight, -0.85);
  tanpuraGroup.rotation.y = 0.52;

  const tanpuraShadow = makeContactShadow(shadowTex, 0.72, 0.72);
  tanpuraGroup.add(tanpuraShadow);

  const tanpBaseProfile = [
    new THREE.Vector2(0.001, 0.02),
    new THREE.Vector2(0.22, 0.08),
    new THREE.Vector2(0.28, 0.24),
    new THREE.Vector2(0.24, 0.42),
    new THREE.Vector2(0.08, 0.56),
    new THREE.Vector2(0.055, 1.48),
    new THREE.Vector2(0.075, 1.54),
    new THREE.Vector2(0.001, 1.56),
  ];
  const tanpGeo = track(new THREE.LatheGeometry(tanpBaseProfile, 28));
  const tanpBody = new THREE.Mesh(tanpGeo, gourdMat);
  tanpBody.castShadow = true;
  tanpuraGroup.add(tanpBody);

  const tanpuraStrings: THREE.Mesh[] = [];
  const tStrGeo = track(new THREE.CylinderGeometry(0.002, 0.002, 1.24, 6));
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(tStrGeo, brassMat);
    s.position.set(-0.024 + i * 0.016, 0.92, 0.068);
    tanpuraGroup.add(s);
    tanpuraStrings.push(s);
  }
  tagInteractiveGroup(tanpuraGroup, 'tanpura');
  root.add(tanpuraGroup);

  // =========================================================================
  // 6. HINDUSTANI CONCERT SITAR (Center-Right Midground)
  // =========================================================================
  const sitarGroup = new THREE.Group();
  sitarGroup.position.set(1.25, daisHeight, 0.45);
  sitarGroup.rotation.y = -0.58;

  const sitarShadow = makeContactShadow(shadowTex, 0.95, 0.72);
  sitarGroup.add(sitarShadow);

  const sitarStand = new THREE.Mesh(track(new THREE.TorusGeometry(0.18, 0.045, 12, 28)), velvetMat);
  sitarStand.rotation.x = Math.PI / 2;
  sitarStand.position.y = 0.045;
  sitarGroup.add(sitarStand);

  const sitarTumba = new THREE.Mesh(track(new THREE.SphereGeometry(0.24, 24, 18)), gourdMat);
  sitarTumba.scale.set(1, 0.86, 1.05);
  sitarTumba.position.y = 0.24;
  sitarTumba.castShadow = true;
  sitarGroup.add(sitarTumba);

  const sitarDand = new THREE.Mesh(track(new THREE.BoxGeometry(0.085, 1.18, 0.045)), rosewoodMat);
  sitarDand.position.set(0, 0.88, 0);
  sitarDand.rotation.x = -0.22;
  sitarDand.castShadow = true;
  sitarGroup.add(sitarDand);

  const upperTumba = new THREE.Mesh(track(new THREE.SphereGeometry(0.13, 18, 14)), gourdMat);
  upperTumba.position.set(0, 1.22, 0.14);
  sitarGroup.add(upperTumba);

  // 20 Arched Parda Frets on Sitar Neck (InstancedMesh)
  const pardaGeo = track(new THREE.TorusGeometry(0.048, 0.004, 6, 14, Math.PI));
  const sitarPardas = new THREE.InstancedMesh(pardaGeo, brassMat, 20);
  for (let i = 0; i < 20; i++) {
    const t = i / 19;
    dummy.position.set(0, 0.48 + t * 0.84, -0.02 + t * -0.185);
    dummy.rotation.set(0, Math.PI / 2, 0.22);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    sitarPardas.setMatrixAt(i, dummy.matrix);
  }
  sitarPardas.instanceMatrix.needsUpdate = true;
  sitarPardas.computeBoundingSphere();
  sitarGroup.add(sitarPardas);

  const sitarStrings: THREE.Mesh[] = [];
  const sStrGeo = track(new THREE.CylinderGeometry(0.0018, 0.0018, 1.18, 6));
  for (let i = 0; i < 4; i++) {
    const st = new THREE.Mesh(sStrGeo, chromeMat);
    st.position.set(-0.02 + i * 0.013, 0.88, 0.032);
    st.rotation.x = -0.22;
    sitarGroup.add(st);
    sitarStrings.push(st);
  }
  tagInteractiveGroup(sitarGroup, 'sitar');
  root.add(sitarGroup);

  // =========================================================================
  // 7. HINDUSTANI TABLA PAIR (Right Foreground)
  // =========================================================================
  const tablaGroup = new THREE.Group();
  tablaGroup.position.set(1.65, daisHeight, 1.45);
  tablaGroup.rotation.y = -0.35;
  const tablaHeads: THREE.Mesh[] = [];

  const createTablaDrum = (isBayan: boolean, x: number, z: number, tiltX: number, tiltZ: number) => {
    const drumPivot = new THREE.Group();
    drumPivot.position.set(x, 0, z);
    drumPivot.add(makeContactShadow(shadowTex, isBayan ? 0.85 : 0.65, isBayan ? 0.85 : 0.65));

    const chuttaGeo = track(
      new THREE.TorusGeometry(isBayan ? 0.2 : 0.145, isBayan ? 0.045 : 0.036, 16, 36)
    );
    const chutta = new THREE.Mesh(chuttaGeo, velvetMat);
    chutta.rotation.x = Math.PI / 2;
    chutta.position.y = isBayan ? 0.045 : 0.036;
    chutta.castShadow = true;
    drumPivot.add(chutta);

    const bodyTiltGroup = new THREE.Group();
    bodyTiltGroup.position.y = isBayan ? 0.04 : 0.032;
    bodyTiltGroup.rotation.set(tiltX, 0, tiltZ);

    const profile = isBayan
      ? [
          new THREE.Vector2(0.001, 0),
          new THREE.Vector2(0.14, 0.02),
          new THREE.Vector2(0.27, 0.14),
          new THREE.Vector2(0.285, 0.26),
          new THREE.Vector2(0.23, 0.38),
          new THREE.Vector2(0.24, 0.4),
        ]
      : [
          new THREE.Vector2(0.001, 0),
          new THREE.Vector2(0.14, 0.02),
          new THREE.Vector2(0.185, 0.12),
          new THREE.Vector2(0.175, 0.28),
          new THREE.Vector2(0.14, 0.42),
          new THREE.Vector2(0.148, 0.44),
        ];

    const shell = new THREE.Mesh(
      track(new THREE.LatheGeometry(profile, 32)),
      isBayan ? hammeredBrassMat : rosewoodMat
    );
    shell.castShadow = true;
    bodyTiltGroup.add(shell);

    const headY = isBayan ? 0.4 : 0.44;
    const headR = isBayan ? 0.232 : 0.142;

    const head = new THREE.Mesh(
      track(new THREE.CylinderGeometry(headR, headR, 0.012, 32)),
      parchmentMat
    );
    head.position.y = headY;
    bodyTiltGroup.add(head);
    tablaHeads.push(head);

    const syahi = new THREE.Mesh(
      track(new THREE.CylinderGeometry(headR * 0.42, headR * 0.44, 0.005, 24)),
      syahiMat
    );
    syahi.position.set(isBayan ? -headR * 0.18 : 0, headY + 0.008, 0);
    bodyTiltGroup.add(syahi);

    const gajra = new THREE.Mesh(
      track(new THREE.TorusGeometry(headR + 0.006, 0.016, 12, 32)),
      parchmentMat
    );
    gajra.rotation.x = Math.PI / 2;
    gajra.position.y = headY;
    bodyTiltGroup.add(gajra);

    drumPivot.add(bodyTiltGroup);
    tablaGroup.add(drumPivot);
  };

  createTablaDrum(true, -0.34, 0, 0.12, 0.05);
  createTablaDrum(false, 0.28, 0.06, 0.14, -0.08);
  tagInteractiveGroup(tablaGroup, 'tabla');
  root.add(tablaGroup);

  // =========================================================================
  // 8. HARMONIUM & BAMBOO BANSURI (Center Foreground)
  // =========================================================================
  const harmoniumGroup = new THREE.Group();
  harmoniumGroup.position.set(0.45, daisHeight, 1.85);
  harmoniumGroup.rotation.y = -0.1;

  harmoniumGroup.add(makeContactShadow(shadowTex, 0.85, 0.55));
  const harmBox = new THREE.Mesh(track(new THREE.BoxGeometry(0.68, 0.26, 0.4)), rosewoodMat);
  harmBox.position.y = 0.14;
  harmBox.castShadow = true;
  harmoniumGroup.add(harmBox);

  const harmKeys = new THREE.Mesh(track(new THREE.BoxGeometry(0.56, 0.03, 0.16)), ivoryMat);
  harmKeys.position.set(0, 0.285, 0.09);
  harmoniumGroup.add(harmKeys);

  // Brass drone stops
  for (let i = 0; i < 5; i++) {
    const knob = new THREE.Mesh(track(new THREE.SphereGeometry(0.016, 10, 10)), brassMat);
    knob.position.set(-0.2 + i * 0.1, 0.19, 0.215);
    harmoniumGroup.add(knob);
  }

  // Carved Assam Bamboo Bansuri resting on the harmonium top
  const bansuriTube = new THREE.Mesh(track(new THREE.CylinderGeometry(0.018, 0.017, 0.64, 14)), bambooMat);
  bansuriTube.rotation.z = Math.PI / 2;
  bansuriTube.rotation.y = 0.16;
  bansuriTube.position.set(0.04, 0.315, -0.08);
  bansuriTube.castShadow = true;
  harmoniumGroup.add(bansuriTube);

  tagInteractiveGroup(harmoniumGroup, 'harmonium');
  root.add(harmoniumGroup);

  // =========================================================================
  // 9. CONCERT GRAND PIANO (Center Stage Focal)
  // =========================================================================
  const pianoGroup = new THREE.Group();
  pianoGroup.position.set(0.0, daisHeight, -1.15);
  pianoGroup.rotation.y = 0.12;

  const pianoShadow = makeContactShadow(shadowTex, 2.7, 2.9);
  pianoShadow.position.set(0, 0.004, -0.15);
  pianoGroup.add(pianoShadow);

  const caseShape = new THREE.Shape();
  caseShape.moveTo(-0.82, 0.72);
  caseShape.lineTo(0.82, 0.72);
  caseShape.lineTo(0.82, 0.12);
  caseShape.bezierCurveTo(0.82, -0.32, 0.42, -0.52, 0.32, -0.96);
  caseShape.bezierCurveTo(0.24, -1.36, -0.2, -1.48, -0.52, -1.36);
  caseShape.bezierCurveTo(-0.78, -1.26, -0.82, -0.88, -0.82, -0.4);
  caseShape.closePath();

  const bodyGeo = track(
    new THREE.ExtrudeGeometry(caseShape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.015,
      bevelSegments: 3,
    })
  );
  bodyGeo.rotateX(Math.PI / 2);
  const pianoBody = new THREE.Mesh(bodyGeo, pianoLacquerMat);
  pianoBody.position.y = 0.96;
  pianoBody.castShadow = true;
  pianoBody.receiveShadow = true;
  pianoGroup.add(pianoBody);

  const harpGeo = track(new THREE.ExtrudeGeometry(caseShape, {depth: 0.02, bevelEnabled: false}));
  harpGeo.rotateX(Math.PI / 2);
  const pianoHarp = new THREE.Mesh(harpGeo, brassMat);
  pianoHarp.scale.set(0.92, 1, 0.92);
  pianoHarp.position.set(0, 0.965, -0.02);
  pianoGroup.add(pianoHarp);

  const pianoLidPivot = new THREE.Group();
  pianoLidPivot.position.set(-0.82, 0.985, 0);
  const lidGeo = track(
    new THREE.ExtrudeGeometry(caseShape, {
      depth: 0.028,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
    })
  );
  lidGeo.rotateX(Math.PI / 2);
  const lidMesh = new THREE.Mesh(lidGeo, pianoLacquerMat);
  lidMesh.position.set(0.82, 0, 0);
  lidMesh.castShadow = true;
  pianoLidPivot.add(lidMesh);
  pianoLidPivot.rotation.z = 0.42;
  pianoGroup.add(pianoLidPivot);

  const pianoPropStick = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.012, 0.012, 0.72, 10)),
    brassMat
  );
  pianoPropStick.position.set(0.62, 1.24, -0.15);
  pianoPropStick.rotation.z = -0.35;
  pianoGroup.add(pianoPropStick);

  const legProfile = [
    new THREE.Vector2(0.028, 0),
    new THREE.Vector2(0.042, 0.14),
    new THREE.Vector2(0.056, 0.54),
    new THREE.Vector2(0.068, 0.68),
  ];
  const legGeo = track(new THREE.LatheGeometry(legProfile, 16));
  const casterGeo = track(new THREE.CylinderGeometry(0.032, 0.036, 0.045, 14));
  const legCoords: Array<[number, number]> = [
    [-0.68, 0.56],
    [0.68, 0.56],
    [-0.18, -1.16],
  ];
  for (const [lx, lz] of legCoords) {
    const caster = new THREE.Mesh(casterGeo, brassMat);
    caster.position.set(lx, 0.0225, lz);
    pianoGroup.add(caster);

    const leg = new THREE.Mesh(legGeo, pianoLacquerMat);
    leg.position.set(lx, 0.045, lz);
    leg.castShadow = true;
    pianoGroup.add(leg);
  }

  const lyre = new THREE.Mesh(track(new THREE.BoxGeometry(0.24, 0.68, 0.05)), pianoLacquerMat);
  lyre.position.set(0, 0.36, 0.32);
  pianoGroup.add(lyre);

  for (let p = -1; p <= 1; p++) {
    const pedal = new THREE.Mesh(track(new THREE.BoxGeometry(0.032, 0.018, 0.1)), brassMat);
    pedal.position.set(p * 0.065, 0.045, 0.37);
    pianoGroup.add(pedal);
  }

  const keyBed = new THREE.Mesh(track(new THREE.BoxGeometry(1.66, 0.08, 0.32)), pianoLacquerMat);
  keyBed.position.set(0, 0.72, 0.8);
  pianoGroup.add(keyBed);

  const pianoWhiteKeys = new THREE.InstancedMesh(
    track(new THREE.BoxGeometry(0.026, 0.022, 0.19)),
    ivoryMat,
    52
  );
  for (let i = 0; i < 52; i++) {
    dummy.position.set(-0.74 + i * 0.029, 0.77, 0.84);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    pianoWhiteKeys.setMatrixAt(i, dummy.matrix);
  }
  pianoWhiteKeys.instanceMatrix.needsUpdate = true;
  pianoWhiteKeys.computeBoundingSphere();
  pianoGroup.add(pianoWhiteKeys);

  const pianoBlackKeys = new THREE.InstancedMesh(
    track(new THREE.BoxGeometry(0.017, 0.024, 0.12)),
    ebonyKeyMat,
    36
  );
  const blackPattern = [true, true, false, true, true, true, false];
  let bkIdx = 0;
  for (let i = 0; i < 51 && bkIdx < 36; i++) {
    if (blackPattern[i % 7]) {
      dummy.position.set(-0.74 + i * 0.029 + 0.0145, 0.786, 0.805);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      pianoBlackKeys.setMatrixAt(bkIdx, dummy.matrix);
      bkIdx++;
    }
  }
  pianoBlackKeys.instanceMatrix.needsUpdate = true;
  pianoBlackKeys.computeBoundingSphere();
  pianoGroup.add(pianoBlackKeys);
  tagInteractiveGroup(pianoGroup, 'piano');
  root.add(pianoGroup);

  // =========================================================================
  // 10. WESTERN ACOUSTIC DRUM KIT (Right-Rear Stage)
  // =========================================================================
  const drumKitGroup = new THREE.Group();
  drumKitGroup.position.set(2.25, daisHeight, -0.95);
  drumKitGroup.rotation.y = -0.52;
  const drumHeads: THREE.Mesh[] = [];
  const cymbals: THREE.Mesh[] = [];

  drumKitGroup.add(makeContactShadow(shadowTex, 1.4, 1.2));

  // Kick Drum
  const kickGeo = track(new THREE.CylinderGeometry(0.36, 0.36, 0.48, 28));
  kickGeo.rotateX(Math.PI / 2);
  const kickShell = new THREE.Mesh(kickGeo, rosewoodMat);
  kickShell.position.set(0, 0.38, 0);
  kickShell.castShadow = true;
  drumKitGroup.add(kickShell);

  const kickHeadGeo = track(new THREE.CylinderGeometry(0.35, 0.35, 0.02, 28));
  kickHeadGeo.rotateX(Math.PI / 2);
  const kickHead = new THREE.Mesh(kickHeadGeo, parchmentMat);
  kickHead.position.set(0, 0.38, 0.245);
  drumKitGroup.add(kickHead);
  drumHeads.push(kickHead);

  // Snare & Floor Tom
  const snare = new THREE.Mesh(track(new THREE.CylinderGeometry(0.18, 0.18, 0.14, 24)), chromeMat);
  snare.position.set(-0.42, 0.68, 0.25);
  drumKitGroup.add(snare);
  drumHeads.push(snare);

  const floorTom = new THREE.Mesh(track(new THREE.CylinderGeometry(0.24, 0.24, 0.38, 24)), rosewoodMat);
  floorTom.position.set(0.45, 0.5, 0.18);
  drumKitGroup.add(floorTom);
  drumHeads.push(floorTom);

  // Chrome Stand Poles + B20 Bronze Cymbals
  for (const [cx, cy, cz, r] of [
    [-0.58, 1.15, -0.05, 0.24],
    [0.58, 1.05, -0.05, 0.28],
  ] as Array<[number, number, number, number]>) {
    const stand = new THREE.Mesh(track(new THREE.CylinderGeometry(0.012, 0.016, cy, 10)), chromeMat);
    stand.position.set(cx, cy / 2, cz);
    drumKitGroup.add(stand);

    const cym = new THREE.Mesh(track(new THREE.CylinderGeometry(r * 0.2, r, 0.015, 28)), brassMat);
    cym.position.set(cx, cy, cz);
    cym.rotation.x = 0.12;
    drumKitGroup.add(cym);
    cymbals.push(cym);
  }
  tagInteractiveGroup(drumKitGroup, 'drums');
  root.add(drumKitGroup);

  // =========================================================================
  // 11. PRO ANALOG MIXING CONSOLE DESK & VINTAGE CONDENSER MIC RIG
  // =========================================================================
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(-2.55, daisHeight, 0.35);
  consoleGroup.rotation.y = 0.78;

  consoleGroup.add(makeContactShadow(shadowTex, 1.65, 0.95));
  const deskFrame = new THREE.Mesh(track(new THREE.BoxGeometry(1.52, 0.74, 0.72)), darkSlateMat);
  deskFrame.position.y = 0.37;
  deskFrame.castShadow = true;
  consoleGroup.add(deskFrame);

  const deskCheeks = new THREE.Mesh(track(new THREE.BoxGeometry(1.58, 0.14, 0.78)), rosewoodMat);
  deskCheeks.position.y = 0.76;
  consoleGroup.add(deskCheeks);

  const meterBridge = new THREE.Mesh(track(new THREE.BoxGeometry(1.48, 0.16, 0.12)), meterBridgeMat);
  meterBridge.position.set(0, 0.89, -0.25);
  meterBridge.rotation.x = 0.2;
  consoleGroup.add(meterBridge);

  // 24 Motorized Faders (InstancedMesh > 20 items)
  const faderGeo = track(new THREE.BoxGeometry(0.018, 0.024, 0.045));
  const consoleFaders = new THREE.InstancedMesh(faderGeo, chromeMat, 24);
  for (let i = 0; i < 24; i++) {
    dummy.position.set(-0.62 + i * 0.054, 0.84, 0.04 + Math.sin(i * 0.6) * 0.12);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    consoleFaders.setMatrixAt(i, dummy.matrix);
  }
  consoleFaders.instanceMatrix.needsUpdate = true;
  consoleFaders.computeBoundingSphere();
  consoleGroup.add(consoleFaders);

  // Vintage Brass Condenser Mic on Boom Stand beside Console
  const micStand = new THREE.Mesh(track(new THREE.CylinderGeometry(0.012, 0.016, 1.35, 10)), chromeMat);
  micStand.position.set(0.95, 0.675, 0.1);
  consoleGroup.add(micStand);
  const micCapsule = new THREE.Mesh(track(new THREE.CylinderGeometry(0.036, 0.036, 0.14, 16)), brassMat);
  micCapsule.position.set(0.95, 1.36, 0.1);
  consoleGroup.add(micCapsule);

  tagInteractiveGroup(consoleGroup, 'console');
  root.add(consoleGroup);

  // =========================================================================
  // 12. 22-SHRUTI RESONANCE HALO (InstancedMesh > 20 items)
  // =========================================================================
  const pillarGeo = track(new THREE.OctahedronGeometry(0.075, 0));
  const pillarMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xd99b26,
      emissive: 0x5c3608,
      emissiveIntensity: 0.65,
      metalness: 0.85,
      roughness: 0.22,
    })
  );
  const shrutiPillars = new THREE.InstancedMesh(pillarGeo, pillarMat, 22);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 4.52, daisHeight + 0.24, Math.sin(a) * 4.52);
    dummy.rotation.set(0, a, 0);
    dummy.scale.set(1, 1.5, 1);
    dummy.updateMatrix();
    shrutiPillars.setMatrixAt(i, dummy.matrix);
  }
  shrutiPillars.instanceMatrix.needsUpdate = true;
  shrutiPillars.computeBoundingSphere();
  shrutiPillars.frustumCulled = false;
  root.add(shrutiPillars);

  const clickableRoots: THREE.Object3D[] = [
    veenaGroup,
    mridangamGroup,
    tanpuraGroup,
    sitarGroup,
    tablaGroup,
    harmoniumGroup,
    pianoGroup,
    drumKitGroup,
    consoleGroup,
  ];

  const applyFinish = (finish: FinishPaletteId) => {
    const cfg = FINISH_CONFIGS[finish];
    rosewoodMat.color.setHex(cfg.woodHex);
    brassMat.color.setHex(cfg.metalHex);
    hammeredBrassMat.color.setHex(cfg.accentHex);
    daisRimMat.color.setHex(cfg.metalHex);
    pianoLacquerMat.color.setHex(cfg.pianoHex);
    pillarMat.color.setHex(cfg.accentHex);
  };

  const applyTheme = (theme: StageThemeId) => {
    if (theme === 'universal') {
      sabhaArchitectureGroup.visible = true;
      scoringDiffuserGroup.visible = true;
      veenaGroup.visible = true;
      mridangamGroup.visible = true;
      tanpuraGroup.visible = true;
      sitarGroup.visible = true;
      tablaGroup.visible = true;
      harmoniumGroup.visible = true;
      pianoGroup.visible = true;
      drumKitGroup.visible = true;
      consoleGroup.visible = true;
    } else if (theme === 'carnatic') {
      sabhaArchitectureGroup.visible = true;
      scoringDiffuserGroup.visible = false;
      veenaGroup.visible = true;
      mridangamGroup.visible = true;
      tanpuraGroup.visible = true;
      harmoniumGroup.visible = true;
      sitarGroup.visible = false;
      tablaGroup.visible = false;
      pianoGroup.visible = false;
      drumKitGroup.visible = false;
      consoleGroup.visible = true;
    } else if (theme === 'hindustani') {
      sabhaArchitectureGroup.visible = true;
      scoringDiffuserGroup.visible = false;
      sitarGroup.visible = true;
      tablaGroup.visible = true;
      tanpuraGroup.visible = true;
      harmoniumGroup.visible = true;
      veenaGroup.visible = false;
      mridangamGroup.visible = false;
      pianoGroup.visible = false;
      drumKitGroup.visible = false;
      consoleGroup.visible = true;
    } else {
      // Western Scoring Stage
      sabhaArchitectureGroup.visible = false;
      scoringDiffuserGroup.visible = true;
      pianoGroup.visible = true;
      drumKitGroup.visible = true;
      consoleGroup.visible = true;
      veenaGroup.visible = false;
      mridangamGroup.visible = false;
      tanpuraGroup.visible = false;
      sitarGroup.visible = false;
      tablaGroup.visible = false;
      harmoniumGroup.visible = false;
    }
  };

  const applyExplode = (amount: number) => {
    const lift = Math.max(0, Math.min(1, amount));
    pianoHarp.position.y = 0.965 + lift * 0.42;
    veenaPalagai.position.y = 0.548 + lift * 0.28;
    veenaBridge.position.y = 0.58 + lift * 0.42;
    tablaHeads.forEach((h, idx) => {
      const base = idx === 0 ? 0.4 : 0.44;
      h.position.y = base + lift * 0.34;
    });
    mridangamHeads[0].position.x = -0.345 - lift * 0.25;
    mridangamHeads[1].position.x = 0.345 + lift * 0.25;
  };

  const dispose = () => {
    for (const item of disposables) {
      item.dispose();
    }
  };

  return {
    root,
    veenaGroup,
    veenaStrings,
    veenaPalagai,
    veenaBridge,
    sitarGroup,
    sitarStrings,
    tanpuraGroup,
    tanpuraStrings,
    mridangamGroup,
    mridangamHeads,
    tablaGroup,
    tablaHeads,
    harmoniumGroup,
    pianoGroup,
    pianoLidPivot,
    pianoPropStick,
    pianoHarp,
    pianoWhiteKeys,
    pianoBlackKeys,
    drumKitGroup,
    drumHeads,
    cymbals,
    consoleGroup,
    consoleFaders,
    sabhaArchitectureGroup,
    scoringDiffuserGroup,
    lampFlames,
    shrutiPillars,
    clickableRoots,
    applyFinish,
    applyTheme,
    applyExplode,
    dispose,
  };
}
