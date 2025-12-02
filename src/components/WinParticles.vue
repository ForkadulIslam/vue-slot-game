<template>
  <div v-show="visible" ref="particleContainerEl" class="particle-overlay"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineExpose, nextTick } from 'vue';
import * as PIXI from 'pixi.js';
import { Emitter, upgradeConfig } from '@spd789562/particle-emitter';
import coin1 from '../assets/images/coinParticle1.png';
import coin2 from '../assets/images/coinParticle1.png';

const particleContainerEl = ref(null);
const visible = ref(false);
let app = null;
let emitter = null;

// Emitter configuration from PixiParticleV8.vue
const emitterConfig = {
  "lifetime": {
    "min": 4,
    "max": 4
  },
  "frequency": 0.004,
  "pos": {
    "x": 0,
    "y": 0
  },
  "spawnChance": 1,
  "emitterLifetime": 2,
  "maxParticles": 1000,
  "particlesPerWave": 1,
  "addAtBack": false,
  "ease": [
    {
      "s": 0,
      "cp": 0.379,
      "e": 0.548
    },
    {
      "s": 0.548,
      "cp": 0.717,
      "e": 0.676
    },
    {
      "s": 0.676,
      "cp": 0.635,
      "e": 1
    }
  ],
  "behaviors": [
    {
      "type": "textureSingle",
      "config": {
        "texture": coin2
      }
    },
    {
      "type": "spawnShape",
      "config": {
        "type": "torus",
        "data": {
          "x": 0,
          "y": 0,
          "radius": 90,
          "innerRadius": 39,
          "affectRotation": true
        }
      }
    },
    {
      "type": "moveSpeedStatic",
      "config": {
        "min": 20,
        "max": 100
      }
    },
    {
      "type": "scale",
      "config": {
        "scale": {
          "list": [
            {
              "time": 0,
              "value": 0.15
            },
            {
              "time": 1,
              "value": 0.5
            }
          ],
          "isStepped": false
        },
        "minMult": 0.5
      }
    },
    {
      "type": "alpha",
      "config": {
        "alpha": {
          "list": [
            {
              "time": 0,
              "value": 0.73
            },
            {
              "time": 1,
              "value": 0.46
            }
          ],
          "isStepped": false
        }
      }
    },
    {
      "type": "rotation",
      "config": {
        "minStart": 50,
        "maxStart": 70,
        "minSpeed": 0,
        "maxSpeed": 200,
        "accel": 0
      }
    }
  ]
};
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

    const pixiParticleContainer = new PIXI.ParticleContainer(1000, { // Adjusted for new maxParticles
      uvs: true,
      position: true,
      rotation: true,
      scale: true,
      alpha: true,
      color: true,
    });
    app.stage.addChild(pixiParticleContainer);

    // Pre-load the texture into the asset cache. This is the crucial step.
    await PIXI.Assets.load(coin1);

    const newConfig = upgradeConfig(emitterConfig);

    emitter = new Emitter(pixiParticleContainer, newConfig);
    emitter.emit = false; // Do not start emitting immediately

    let elapsed = Date.now();
    app.ticker.add(() => {
        const now = Date.now();
        emitter.update((now - elapsed) * 0.001);
        elapsed = now;
    });

    handleResize = () => {
        if (app && particleContainerEl.value) {
            app.renderer.resize(particleContainerEl.value.clientWidth, particleContainerEl.value.clientHeight);
            if (emitter) {
              emitter.updateSpawnPos(app.screen.width / 2, app.screen.height / 2);
            }
        }
    };
    window.addEventListener('resize', handleResize);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (emitter) {
    emitter.destroy();
    emitter = null;
  }
  if (app) {
    app.destroy(true, true);
    app = null;
  }
});

const play = async () => {
  if (!emitter || !app) return;

  visible.value = true;
  // Wait for the DOM to update after `v-show` makes the container visible
  await nextTick();

  // Now that the container has its dimensions, explicitly tell the renderer to resize
  app.renderer.resize(particleContainerEl.value.clientWidth, particleContainerEl.value.clientHeight);
  emitter.updateSpawnPos(app.screen.width / 2, app.screen.height / 2);

  emitter.emit = true;

  setTimeout(() => {
    emitter.emit = false;
    visible.value = false;
    // Clean up finished particles to prevent them from accumulating
    emitter.cleanup();
  }, 5000); // 4 seconds is enough time for particles with 3s lifetime to fade out
};

defineExpose({ play });


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
  background: radial-gradient(circle at center, rgba(255,215,0,0.5) 0%, rgba(255,20,147,0.5) 70%, transparent 100%);
}
</style>
