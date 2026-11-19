import * as THREE from 'three';

export function createWoodGrainTexture(
  baseColor: string,
  grainColor: string,
  maxAnisotropy: number,
  repeatX = 2,
  repeatY = 2
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 2) {
    const wave = Math.sin(y * 0.04) * 6 + Math.cos(y * 0.015) * 10;
    ctx.strokeStyle = grainColor;
    ctx.globalAlpha = 0.08 + ((y * 17) % 10) * 0.014;
    ctx.lineWidth = 1 + ((y * 7) % 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) {
      ctx.lineTo(x, y + Math.sin((x + wave) * 0.025) * 4);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createLinearBumpTexture(
  maxAnisotropy: number,
  hammered = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  if (hammered) {
    for (let i = 0; i < 320; i++) {
      const x = (i * 73) % 256;
      const y = (i * 137) % 256;
      const r = 6 + (i % 7);
      const grad = ctx.createRadialGradient(x, y, 1, x, y, r);
      grad.addColorStop(0, '#585858');
      grad.addColorStop(1, '#9a9a9a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    for (let y = 0; y < 256; y += 3) {
      ctx.fillStyle = y % 6 === 0 ? '#727272' : '#8d8d8d';
      ctx.fillRect(0, y, 256, 1.5);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createStageFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1d1612';
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.strokeStyle = 'rgba(217, 155, 38, 0.16)';
  ctx.lineWidth = 2;
  for (let r = 80; r <= 490; r += 68) {
    ctx.beginPath();
    ctx.arc(512, 512, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(245, 185, 66, 0.22)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(512 + Math.cos(a) * 420, 512 + Math.sin(a) * 420);
    ctx.lineTo(512 + Math.cos(a) * 476, 512 + Math.sin(a) * 476);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createCarpetTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4e121b';
  ctx.fillRect(0, 0, 512, 512);

  // Ornamental gold & sapphire geometric border
  ctx.strokeStyle = '#c88c32';
  ctx.lineWidth = 14;
  ctx.strokeRect(22, 22, 468, 468);

  ctx.strokeStyle = '#20314b';
  ctx.lineWidth = 8;
  ctx.strokeRect(42, 42, 428, 428);

  // Subtle woven diamond motifs
  ctx.strokeStyle = 'rgba(229, 175, 76, 0.28)';
  ctx.lineWidth = 1.5;
  for (let y = 76; y < 440; y += 44) {
    for (let x = 76; x < 440; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x + 14, y);
      ctx.lineTo(x, y + 14);
      ctx.lineTo(x - 14, y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Center lotus medallion
  ctx.fillStyle = 'rgba(217, 155, 38, 0.22)';
  ctx.beginPath();
  ctx.arc(256, 256, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d99b26';
  ctx.lineWidth = 3;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createMeterPanelTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#12151c';
  ctx.fillRect(0, 0, 512, 128);

  // Classic warm amber VU meter windows
  for (let i = 0; i < 6; i++) {
    const x = 18 + i * 82;
    ctx.fillStyle = '#f5c469';
    ctx.fillRect(x, 22, 66, 52);
    ctx.strokeStyle = '#3c3020';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 22, 66, 52);

    ctx.strokeStyle = '#8b2416';
    ctx.beginPath();
    ctx.arc(x + 33, 66, 26, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    ctx.strokeStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(x + 33, 66);
    ctx.lineTo(x + 44, 34);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}
