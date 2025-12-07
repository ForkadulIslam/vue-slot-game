<template>
  <div v-show="visible" ref="particleContainerEl" class="particle-overlay" :class="{ 'dimmed': isDimmed }">
    <div :class="enableSheen? 'sheen-overlay' : ''"></div>
    <div ref="storageNumberEl" id="storage_number">0</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineExpose, nextTick } from 'vue';
import * as PIXI from 'pixi.js';
import { Emitter, upgradeConfig } from '@spd789562/particle-emitter';
import { gsap } from 'gsap';
import { lineWinEffectConfig, fireReelEffectConfig, coinFloodinEffectConfig } from '../composables/particleConfigs';
import { hardRainTexturePath, fireSparkParticleTexturePath, fireSparkFireTexturePath, coinParticle2 } from '../composables/particleConfigs';

const particleContainerEl = ref(null);
const storageNumberEl = ref(null);
const visible = ref(false);
const showWinAmount = ref(false);
const isDimmed = ref(false);

let app = null;
const emitters = {};
let enableSheen = ref(false);
let handleResize;

onMounted(async () => {
  if (particleContainerEl.value) {
    app = new PIXI.Application();
    await app.init({
        width: particleContainerEl.value.clientWidth,
        height: particleContainerEl.value.clientHeight,
        backgroundAlpha: 0,
        resizeTo: particleContainerEl.value,
        antialias: true,
    });
    particleContainerEl.value.appendChild(app.canvas);

    // Load all textures for all effects
    const allTextures = [
      hardRainTexturePath, 
      fireSparkParticleTexturePath, 
      fireSparkFireTexturePath,
      coinParticle2
    ];
    await PIXI.Assets.load(allTextures);

    // Create Win Emitter
    const winContainer = new PIXI.ParticleContainer(1000, { uvs: true, position: true, rotation: true, scale: true, alpha: true, color: true });
    app.stage.addChild(winContainer);
    const winConfig = upgradeConfig(lineWinEffectConfig);
    emitters.win = new Emitter(winContainer, winConfig);
    emitters.win.emit = false;

    // Create FireOnReels Emitter
    const fireContainer = new PIXI.ParticleContainer(1000, { uvs: true, position: true, rotation: true, scale: true, alpha: true, color: true });
    app.stage.addChild(fireContainer);
    const fireConfig = upgradeConfig(fireReelEffectConfig);
    emitters.fire = new Emitter(fireContainer, fireConfig);
    emitters.fire.emit = false;

    // Create CoinFlooding Emitter
    const coinFloodingContainer = new PIXI.ParticleContainer(4000, { uvs: true, position: true, rotation: true, scale: true, alpha: true, color: true });
    app.stage.addChild(coinFloodingContainer);
    const coinFloodingConfig = upgradeConfig(coinFloodinEffectConfig);
    emitters.coinFlooding = new Emitter(coinFloodingContainer, coinFloodingConfig);
    emitters.coinFlooding.emit = false;

    // Update all emitters in the ticker
    let elapsed = Date.now();
    app.ticker.add(() => {
        const now = Date.now();
        const delta = (now - elapsed) * 0.001;
        Object.values(emitters).forEach(emitter => {
            if (emitter) emitter.update(delta);
        });
        elapsed = now;
    });

    handleResize = () => {
        if (app && particleContainerEl.value) {
            app.renderer.resize(particleContainerEl.value.clientWidth, particleContainerEl.value.clientHeight);
        }
    };
    window.addEventListener('resize', handleResize);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  Object.values(emitters).forEach(emitter => emitter.destroy());
  if (app) {
    app.destroy(true, true);
    app = null;
  }
});

const playWin = async (symbolCoordinate) => {
  const emitter = emitters['win'];
  if (!emitter || !app) return;

  visible.value = true;
  await nextTick();
  
  app.renderer.resize(particleContainerEl.value.clientWidth, particleContainerEl.value.clientHeight);
  let spawnX = symbolCoordinate.x;
  let spawnY = symbolCoordinate.y;
  //console.log(`Position: x:${spawnX}, y:${spawnY}`);
  emitter.updateSpawnPos(spawnX, spawnY);
  emitter.emit = true;

};

const playFireOnReels = async () => {
  const emitter = emitters['fire'];
  if (!emitter || !app) return;

  visible.value = true;
  await nextTick();
  
  app.renderer.resize(particleContainerEl.value.clientWidth, particleContainerEl.value.clientHeight);
  
  const spawnPos = {
    x: particleContainerEl.value.clientWidth / 2,
    y: particleContainerEl.value.clientHeight / 2,
  };
  emitter.updateSpawnPos(spawnPos.x, spawnPos.y);
  emitter.emit = true;
}


const coinFlooding = async (winAmount)=>{
  const emitter = emitters['coinFlooding'];
  if (!emitter || !app) return;

  visible.value = true;
  await nextTick();
  
  app.renderer.resize(particleContainerEl.value.clientWidth, particleContainerEl.value.clientHeight);
  emitter.updateSpawnPos(particleContainerEl.value.clientWidth/2, particleContainerEl.value.clientHeight/2);

  const effectDuration = coinFloodinEffectConfig.emitterLifetime + coinFloodinEffectConfig.lifetime.max;

  // Use gsap to control the start and end of the effect
  gsap.to({}, { // Dummy object for tweening
    duration: 2, // emitter lifetime + particle lifetime
    onStart: () => {
      isDimmed.value = true;
      emitter.emit = true;
    },
    onComplete: () => {
      emitter.emit = false;
      isDimmed.value = false;
      visible.value = false; // Hide after effect is complete
    }
  });
}


defineExpose({ playWin, playFireOnReels, coinFlooding });


</script>

<style scoped>
.particle-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  pointer-events: none;
}

.particle-overlay.dimmed{
  background-color: rgba(0, 0, 0, 0.7); /* A semi-transparent black overlay */
  transition: background-color 0.5s ease;
}

@keyframes sheen-sweep {
  0% {
    background: radial-gradient(circle at center, rgb(34 197 49 / 19%) 0%, rgb(95 58 125 / 0%) 70%, transparent 100%);
    transform: translateX(-150%) skewX(-30deg);
  }
  100% {
    transform: translateX(150%) skewX(-30deg);
  }
}
.sheen-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
  pointer-events: none;
  z-index: 2; /* Position it above the background but below other elements */
  animation: sheen-sweep 5s infinite;
  animation-delay: calc(var(--reel-index) * 0.7s);
}

#storage_number {
  position: absolute;
  top: 6%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 40px;
  color: gold;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.5);
  z-index: 1001; /* Ensure it's above the particles */
  pointer-events: none; /* Allow interaction with elements behind */
}
</style>
