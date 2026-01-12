<template>
  <div class="multiplier-header">
    <div class="chain left"></div>
    <div class="chain right"></div>

    <div ref="pixiContainer" class="pixi-multiplier-canvas"></div>

    <!-- Coordinate Sync Layer for App.vue -->
    <div class="mul-list dom-overlay">
      <div 
        v-for="(mul, index) in multipliers" 
        :key="index"
        :class="['mul-item', { 'active': activeIndex === index }]">
        <span class="mul-text-hidden">x{{ mul }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, defineExpose } from 'vue';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import woodBar from '@/assets/images/wood_bar.webp';

// --- CONFIG ---
const multipliers = [1, 2, 4, 8, 16];
const activeIndex = ref(0);
const pixiContainer = ref(null);

// --- PIXI SCOPE VARIABLES ---
let app = null;
let activeGroup = null; 
let sunburst = null;
let core = null;      // ⚡ Scope Fixed
let shine = null;
let textSprites = [];
let rotationSpeed = 0.005; 

// --- PUBLIC METHODS ---

const setActiveMultiplier = (multiplier) => {
  const index = multipliers.indexOf(multiplier);
  if (index !== -1) {
    activeIndex.value = index;
    triggerJump(index);
  }
};

const setSpinState = (isSpinning) => {
  gsap.to({ val: rotationSpeed }, {
    val: isSpinning ? 0.04 : 0.005, 
    duration: 0.5,
    onUpdate: function() { rotationSpeed = this.targets()[0].val; }
  });
  if (activeGroup) gsap.to(activeGroup, { alpha: isSpinning ? 1 : 0.7, duration: 0.5 });
};

defineExpose({ setActiveMultiplier, setSpinState });

// --- INITIALIZATION ---

const initPixi = async () => {
  if (!pixiContainer.value) return;

  app = new PIXI.Application();
  await app.init({
    width: 420, 
    height: 85, 
    backgroundAlpha: 0,
    antialias: false,
    resolution: Math.min(window.devicePixelRatio, 2), 
    autoDensity: true,
  });

  const canvas = app.canvas;
  pixiContainer.value.appendChild(canvas);

  const woodTex = await PIXI.Assets.load(woodBar);
  
  // 1. Wood Board
  const board = new PIXI.Sprite(woodTex);
  board.anchor.set(0.5); board.width = 420; board.height = 85;
  board.position.set(210, 42.5);
  app.stage.addChild(board);

  // 2. Gold Framing Rails
  const rails = new PIXI.Graphics()
    .rect(0, 0, 420, 3).fill({ color: 0xD4AF37, alpha: 0.5 })
    .rect(0, 82, 420, 3).fill({ color: 0xD4AF37, alpha: 0.5 });
  app.stage.addChild(rails);

  // 3. Lighting Container
  activeGroup = new PIXI.Container();
  app.stage.addChild(activeGroup);

  sunburst = new PIXI.Sprite(createSunburstTexture());
  sunburst.anchor.set(0.5); sunburst.blendMode = 'add'; sunburst.alpha = 0.3;
  activeGroup.addChild(sunburst);

  core = new PIXI.Sprite(createGlowTexture());
  core.anchor.set(0.5); core.blendMode = 'add';
  activeGroup.addChild(core);

  // 4. Multiplier Texts
  const spacing = 420 / 5;
  multipliers.forEach((val, i) => {
    const txt = new PIXI.Text({
      text: `x${val}`,
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: 32, fontWeight: '900',
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 5 },
        dropShadow: { color: 0x000000, alpha: 0.8, blur: 4, distance: 4 }
      }
    });
    txt.anchor.set(0.5);
    txt.x = (spacing / 2) + (i * spacing);
    txt.y = 42.5;
    textSprites.push(txt);
    app.stage.addChild(txt);
  });

  // 5. Gloss Sweep
  shine = new PIXI.Sprite(createShineTexture());
  shine.anchor.set(0.5); shine.rotation = 0.5; shine.blendMode = 'add';
  const mask = new PIXI.Graphics().roundRect(0, 0, 420, 85, 15).fill(0xffffff);
  shine.mask = mask;
  app.stage.addChild(mask); app.stage.addChild(shine);

  triggerJump(activeIndex.value);
  startTicker();
};

// --- ANIMATION ---

const triggerJump = (index) => {
  if (!activeGroup || !sunburst || !core) return; 
  const targetX = (420 / 5 / 2) + (index * (420 / 5));

  // Slam lighting to position
  gsap.to(activeGroup, { 
    x: targetX, y: 42.5, 
    duration: 0.6, 
    ease: "elastic.out(1, 0.75)" 
  });

  // Tiered Colors
  let tintColor = 0xFFFFFF; // White/Silver
  if (index >= 2) tintColor = 0xFFD700; // Gold
  if (index === 4) tintColor = 0xFF4500; // Red

  // ⚡ FIX: Direct property animation (Removed 'pixi:' wrapper)
  gsap.to([sunburst, core], { tint: tintColor, duration: 0.5 });

  textSprites.forEach((txt, i) => {
    const active = i === index;
    gsap.to(txt.scale, { x: active ? 1.4 : 1, y: active ? 1.4 : 1, duration: 0.4 });
    gsap.to(txt, { alpha: active ? 1 : 0.4, duration: 0.3 });
    // Stable color update
    txt.style.fill = active ? tintColor : 0xFFFFFF;
  });
};

const startTicker = () => {
  app.ticker.add((ticker) => {
    if (sunburst) sunburst.rotation += rotationSpeed * ticker.deltaTime;
  });

  const runSweep = () => {
    if (!shine || !app) return;
    gsap.fromTo(shine, { x: -200, y: 42.5 }, { 
      x: 650, duration: 1.8, ease: "power2.inOut", delay: 5, onComplete: runSweep 
    });
  };
  runSweep();
};

// --- TEXTURE GENERATORS ---
function createSunburstTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d'); ctx.translate(128, 128);
  for(let i=0; i<10; i++) {
    ctx.rotate((Math.PI * 2) / 10);
    const g = ctx.createLinearGradient(0,0,128,0);
    g.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
    g.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(128, -25); ctx.lineTo(128, 25); ctx.fill();
  }
  return PIXI.Texture.from(c);
}

function createGlowTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64,64,0, 64,64,64);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  g.addColorStop(0.3, 'rgba(255, 200, 50, 0.6)');
  g.addColorStop(1, 'rgba(255, 140, 0, 0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,128,128);
  return PIXI.Texture.from(c);
}

function createShineTexture() {
  const c = document.createElement('canvas'); 
  c.width = 200; 
  c.height = 300;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 200, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.3)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; 
  ctx.fillRect(0, 0, 200, 300);
  return PIXI.Texture.from(c);
}

onMounted(() => nextTick(() => initPixi()));
onUnmounted(() => app?.destroy(true, { children: true, texture: true }));
</script>

<style scoped>
.multiplier-header {
    width: 95%; max-width: 420px; height: 85px; position: relative;
    display: flex; justify-content: center; margin-top: 5px; margin-bottom: 15px; z-index: 10;
}
.pixi-multiplier-canvas {
    width: 100%; height: 100%; border-radius: 15px; overflow: hidden;
    box-shadow: 0 12px 30px rgba(0,0,0,0.8), inset 0 0 15px rgba(0,0,0,0.5);
}
.dom-overlay {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; justify-content: space-around; align-items: center; pointer-events: none;
}
.mul-item { width: 60px; height: 60px; display: flex; justify-content: center; align-items: center; }
.mul-text-hidden { opacity: 0; font-size: 2rem; font-weight: 900; }

.chain {
    position: absolute; top: -25px; width: 4px; height: 25px; background: #111;
    background-image: repeating-linear-gradient(to bottom, #333 0px, #111 4px); z-index: -1;
}
.chain.left { left: 40px; } .chain.right { right: 40px; }
</style>