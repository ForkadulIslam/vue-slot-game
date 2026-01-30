<template>
  <div class="multiplier-header">
    <div ref="pixiContainer" class="pixi-multiplier-canvas"></div>
    <div class="mul-list dom-overlay">
      <div v-for="(mul, index) in multipliers" :key="index"
           :class="['mul-item', { 'active': activeIndex === index }]">
        <span class="mul-text-hidden">x{{ mul }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, defineExpose } from 'vue';
import * as PIXI from 'pixi.js';
import { Emitter, upgradeConfig } from '@spd789562/particle-emitter';
import {
  horizontalFireConfig,
  fireSparkParticleTexturePath,
} from '../composables/particleConfigs.js';
import { gsap } from 'gsap';


import { useSlotGame } from '../composables/useSlotGame';
const { multipliers} = useSlotGame()


const totlaMultipliers = multipliers.value;
const activeIndex = ref(0);
const pixiContainer = ref(null);

let app = null;
let streams = [];
let textSprites = [];
let activeGlow = null; // Background highlight for active item
let burstSprite = null;
let streamSpeed = 1;
let fireEmitter = null; //


const setActiveMultiplier = (multiplier) => {
  const index = multipliers.value.indexOf(multiplier);
  if (index !== -1) {
    activeIndex.value = index;
    updateActiveStates(index);
    triggerCinematicBurst(index);
  }
};

const setSpinState = (isSpinning) => {
  gsap.to({ val: streamSpeed }, {
    val: isSpinning ? 20 : 2, 
    duration: 0.6,
    onUpdate: function() { streamSpeed = this.targets()[0].val; }
  });
};

const setFreeSpinsMode = (active) => {
  if (fireEmitter) {
    fireEmitter.emit = active;
  }
};

defineExpose({ setActiveMultiplier, setSpinState, setFreeSpinsMode });

const initPixi = async () => {
  if (!pixiContainer.value) return;

  app = new PIXI.Application();
  await app.init({
    width: 420, height: 75,
    backgroundAlpha: 0,
    antialias: false,
    resolution: Math.min(window.devicePixelRatio, 2),
    autoDensity: true,
  });
  
  pixiContainer.value.appendChild(app.canvas);

  // 1. Cinematic Deep Background
  const bg = new PIXI.Graphics()
    .fill({ color: 0x031016 }) // Deep obsidian teal
    .rect(0, 0, 420, 75);
  app.stage.addChild(bg);

  // 2. The Active "Podium" Glow
  activeGlow = new PIXI.Sprite(createActiveGlowTexture());
  activeGlow.anchor.set(0.5);
  activeGlow.blendMode = 'add';
  activeGlow.alpha = 0.6;
  app.stage.addChild(activeGlow);

  // 3. Volumetric Cinematic Streams
  const streamTex = createVolumetricStreamTexture();
  for (let i = 0; i < 2; i++) {
    const s = new PIXI.Sprite(streamTex);
    s.anchor.set(0.5);
    s.y = 37.5;
    s.x = i * 400;
    s.blendMode = 'add';
    s.alpha = 0.25;
    streams.push(s);
    app.stage.addChild(s);
  }

  // 4. Burst Effect
  burstSprite = new PIXI.Sprite(createBurstTexture());
  burstSprite.anchor.set(0.5);
  burstSprite.blendMode = 'screen';
  burstSprite.alpha = 0;
  app.stage.addChild(burstSprite);


  // --- Particle Emitter Setup ---
  await PIXI.Assets.load([fireSparkParticleTexturePath]);
  const pixiParticleContainer = new PIXI.ParticleContainer(1000, {
    uvs: true, position: true, rotation: true, scale: true, alpha: true, color: true,
  });
  pixiParticleContainer.blendMode = 'add';
  app.stage.addChild(pixiParticleContainer);

  const newConfig = upgradeConfig(horizontalFireConfig);
  fireEmitter = new Emitter(pixiParticleContainer, newConfig);

  fireEmitter.spawnPos.x = 0;
  fireEmitter.spawnPos.y = 37.5;
  fireEmitter.spawnRect = new PIXI.Rectangle(-5, -10, 5, 20);
  
  // Start from Left Center
  fireEmitter.updateSpawnPos(0, 37.5);
  fireEmitter.emit = false;

  // 5. Text Setup
  const spacing = 420 / 4;
  multipliers.value.forEach((val, i) => {
    const container = new PIXI.Container();
    
    // Create the main text with a robust starting style
    const txt = new PIXI.Text({
      text: `x${val}`,
      style: {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: 28, 
        fontWeight: '900',
        fill: 0x2d5d6b, // Default inactive
        stroke: { color: 0x0a2029, width: 4, join: 'round' },
        dropShadow: {
          color: 0x00ffff,
          blur: 4,
          distance: 0,
          alpha: 0.3
        }
      }
    });
    
    txt.anchor.set(0.5);
    container.addChild(txt);
    container.x = (spacing / 2) + (i * spacing);
    container.y = 37.5;
    
    // Create a subtle breathing animation for all, but we will pause it for inactive
    const pulse = gsap.to(container.scale, {
      x: 1.1, y: 1.1,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      paused: true // Only active one will play
    });
    container.pulseAnim = pulse;

    textSprites.push(container);
    app.stage.addChild(container);
  });

  


  updateActiveStates(0);
  
  app.ticker.add((ticker) => {

    const delta = ticker.deltaTime;
    const ms = ticker.elapsedMS;

    
    streams.forEach(s => {
      s.x += streamSpeed * delta;
      if (s.x > 600) s.x = -200;
    });


    // CRITICAL: Update Emitter so particles move
    if (fireEmitter) {
      fireEmitter.update(ms * 0.001);
    }


  });
};

function createActiveGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 100; canvas.height = 75;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(50, 37.5, 0, 50, 37.5, 50);
  grad.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
  grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 100, 75);
  return PIXI.Texture.from(canvas);
}

function createVolumetricStreamTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 400; canvas.height = 100;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 400, 0);
  grad.addColorStop(0, 'rgba(0, 150, 255, 0)');
  grad.addColorStop(0.4, 'rgba(0, 255, 255, 0.2)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)'); // Sharp light catch
  grad.addColorStop(0.6, 'rgba(0, 255, 255, 0.2)');
  grad.addColorStop(1, 'rgba(0, 150, 255, 0)');
  ctx.fillStyle = grad;
  ctx.setTransform(1, 0, -0.6, 1, 60, 0); // Cinematic slant
  ctx.fillRect(0, 0, 300, 100);
  return PIXI.Texture.from(canvas);
}

function createBurstTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 150; canvas.height = 150;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(75, 75, 0, 75, 75, 75);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.2, 'rgba(255, 230, 0, 0.8)');
  grad.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(75, 75, 75, 0, Math.PI*2); ctx.fill();
  return PIXI.Texture.from(canvas);
}

const triggerCinematicBurst = (index) => {
  const targetX = (420 / 4 / 2) + (index * (420 / 4));
  burstSprite.x = targetX;
  burstSprite.y = 37.5;
  burstSprite.scale.set(0.1);
  burstSprite.alpha = 1;

  // Cinematic Expansion Burst
  gsap.to(burstSprite.scale, { x: 4, y: 1.2, duration: 0.4, ease: "power4.out" });
  gsap.to(burstSprite, { alpha: 0, duration: 0.4 });

  // Move the background glow podium
  gsap.to(activeGlow, { x: targetX, duration: 0.5, ease: "power2.out" });
};

const updateActiveStates = (index) => {
  const targetX = (420 / 4 / 2) + (index * (420 / 4));
  if(activeGlow) activeGlow.x = targetX;

  textSprites.forEach((container, i) => {
    const txt = container.children[0];
    const active = i === index;
    if (active) {
      txt.style.fill = 0xf8df31; // Gold
      txt.style.dropShadow.alpha = 1;
      txt.style.dropShadow.blur = 15;
      gsap.to(container.scale, { x: 1.3, y: 1.3, duration: 0.4, ease: "back.out" });
    } else {
      txt.style.fill = 0x2d5d6b; // Muted teal
      txt.style.dropShadow.alpha = 0.2;
      gsap.to(container.scale, { x: 1, y: 1, duration: 0.3 });
    }
  });
};

onMounted(async () => {
  await nextTick();
  await initPixi();

});

onUnmounted(() => {
  if (fireEmitter) fireEmitter.destroy();
  if (app) app.destroy(true, { children: true, texture: true });
});
</script>

<style scoped>
.multiplier-header {
  width: 95%;
  max-width: 420px;
  height: 75px;
  position: relative;
  margin: 10px auto;
}

.pixi-multiplier-canvas {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #143e4d;
  box-shadow: 
    0 10px 30px rgba(0,0,0,0.5), 
    inset 0 0 20px rgba(0, 255, 255, 0.1);
}

.dom-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex; justify-content: space-around; align-items: center;
  pointer-events: none;
}

.mul-item { width: 100px; height: 60px; }
.mul-text-hidden { opacity: 0; }
</style>