<template>
  <div>
    <div ref="particleContainerEl" style="height: 600px; width: 100%;"></div>
    <button @click="triggerLineWinEffect">Trigger Line Win Effect</button>
    <button @click="triggerFireReelEffect">Trigger Fire Reel Effect</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as PIXI from 'pixi.js';
import { Emitter, upgradeConfig } from '@spd789562/particle-emitter';
import {
  lineWinEffectConfig,
  fireReelEffectConfig,
  hardRainTexturePath,
  fireSparkParticleTexturePath,
  fireSparkFireTexturePath
} from '../composables/particleConfigs.js';

const particleContainerEl = ref(null);
let app;
const emitters = {};
let handleResize;

// Load textures and create emitters
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

    // 1. Load all textures for all effects
    await PIXI.Assets.load([
      hardRainTexturePath,
      fireSparkParticleTexturePath,
      fireSparkFireTexturePath,
    ]);

    // 2. Create Line Win Emitter
    const lineWinContainer = new PIXI.ParticleContainer(1000, { uvs: true, position: true, rotation: true, scale: true, alpha: true, color: true });
    app.stage.addChild(lineWinContainer);
    const winConfig = upgradeConfig(lineWinEffectConfig);
    emitters.lineWin = new Emitter(lineWinContainer, winConfig);
    emitters.lineWin.emit = false;
    emitters.lineWin.updateSpawnPos(app.screen.width / 2, app.screen.height / 2);

    // 3. Create Fire Emitter
    const fireReelContainer = new PIXI.ParticleContainer(1000, { uvs: true, position: true, rotation: true, scale: true, alpha: true, color: true });
    app.stage.addChild(fireReelContainer);
    const fireConfig = upgradeConfig(fireReelEffectConfig);
    emitters.fireReel = new Emitter(fireReelContainer, fireConfig);
    emitters.fireReel.emit = false;
    emitters.fireReel.updateSpawnPos(app.screen.width / 2, app.screen.height / 2);

    // 4. Update all emitters in the ticker
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
            Object.values(emitters).forEach(emitter => {
                emitter.updateSpawnPos(app.screen.width / 2, app.screen.height / 2);
            });
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

const triggerLineWinEffect = () => {
  const emitter = emitters.lineWin;
  if (!emitter) return;
  emitter.emit = true;

  setTimeout(() => {
    if (emitter) emitter.emit = false;
  }, 2000); // Let it run for 2 seconds as a demo
};

const triggerFireReelEffect = () => {
  const emitter = emitters.fireReel;
  if (!emitter) return;
  emitter.emit = true;

  // emitterLifetime for fireReel is 0.1s in config
  const emitterLifetime = emitter.emitterLifetime > 0 ? emitter.emitterLifetime * 1000 : 100;

  setTimeout(() => {
    if (emitter) emitter.emit = false;
  }, emitterLifetime);
};
</script>