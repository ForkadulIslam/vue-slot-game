<template>
  <div v-show="visible" ref="particleContainerEl" class="particle-overlay">
    
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineExpose, nextTick } from 'vue';
import * as PIXI from 'pixi.js';
import { Emitter, upgradeConfig } from '@spd789562/particle-emitter';
import { gsap } from 'gsap';

import hardRain from '../assets/images/hard_rain.png'

const particleContainerEl = ref(null);
const storageNumberEl = ref(null); // New ref for the number counter
const visible = ref(false);
let app = null;
let emitter = null;
let enableSheen = ref(false);

// Emitter configuration from PixiParticleV8.vue

const emitterConfig = {
  "lifetime": {
    "min": 0.1,
    "max": 0.75
  },
  "frequency": 0.001,
  "pos": {
    "x": 0,
    "y": 0
  },
  "spawnChance": 1,
  "emitterLifetime": 0,
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
      "type": "textureRandom",
      "config": {
        "textures": [
          "fireSpark_particle.png",
          "fireSpark_Fire.png"
        ]
      }
    },
    {
      "type": "spawnShape",
      "config": {
        "type": "polygonalChain",
        "data": [
          [
            {
              "x": -300,
              "y": 100
            },
            {
              "x": -300,
              "y": -100
            }
          ],
          [
            {
              "x": -300,
              "y": -100
            },
            {
              "x": -250,
              "y": -100
            }
          ],
          [
            {
              "x": -300,
              "y": 0
            },
            {
              "x": -250,
              "y": 0
            }
          ],
          [
            {
              "x": -200,
              "y": 100
            },
            {
              "x": -200,
              "y": -100
            }
          ],
          [
            {
              "x": -100,
              "y": 100
            },
            {
              "x": -100,
              "y": -100
            },
            {
              "x": -50,
              "y": -50
            },
            {
              "x": -100,
              "y": 0
            },
            {
              "x": -50,
              "y": 100
            }
          ],
          [
            {
              "x": 0,
              "y": 100
            },
            {
              "x": 0,
              "y": -100
            }
          ],
          [
            {
              "x": 0,
              "y": -100
            },
            {
              "x": 50,
              "y": -100
            }
          ],
          [
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 50,
              "y": 0
            }
          ],
          [
            {
              "x": 0,
              "y": 100
            },
            {
              "x": 50,
              "y": 100
            }
          ]
        ]
      }
    },
    {
      "type": "moveSpeedStatic",
      "config": {
        "min": 50,
        "max": 50
      }
    },
    {
      "type": "scale",
      "config": {
        "scale": {
          "list": [
            {
              "time": 0,
              "value": 0.05
            },
            {
              "time": 1,
              "value": 0.15
            }
          ],
          "isStepped": false
        },
        "minMult": 1
      }
    },
    {
      "type": "alpha",
      "config": {
        "alpha": {
          "list": [
            {
              "time": 0,
              "value": 0.62
            },
            {
              "time": 1,
              "value": 0
            }
          ],
          "isStepped": false
        }
      }
    },
    {
      "type": "color",
      "config": {
        "color": {
          "list": [
            {
              "value": "#fff191",
              "time": 0
            },
            {
              "value": "#ff622c",
              "time": 1
            }
          ]
        }
      }
    },
    {
      "type": "rotationStatic",
      "config": {
        "min": 265,
        "max": 275
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
    await PIXI.Assets.load(hardRain);

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
              emitter.updateSpawnPos(0, 0);
            }
        }
    };
    window.addEventListener('resize', handleResize);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  enableSheen.value = true;
  if (emitter) {
    emitter.destroy();
    emitter = null;
  }
  if (app) {
    app.destroy(true, true);
    app = null;
  }
});

const play = async (lineWinAmount=null) => {
  if (!emitter || !app) return;

  enableSheen.value = true;
  visible.value = true;
  // Wait for the DOM to update after `v-show` makes the container visible
  await nextTick();

  // Now that the container has its dimensions, explicitly tell the renderer to resize
  app.renderer.resize(particleContainerEl.value.clientWidth, particleContainerEl.value.clientHeight);
  emitter.updateSpawnPos(particleContainerEl.value.clientWidth/2, particleContainerEl.value.clientHeight/2);
  emitter.emit = true;

  if(lineWinAmount){
    // Animate the number counter

    storageNumberEl.value.innerText = Math.round(lineWinAmount).toLocaleString()
    gsap.from(storageNumberEl.value, { // Use ref instead of ID string
      innerText: 0,
      duration: 3,
      snap : {
        innerText: 0.01
      },
      onComplete: () => { // NEW onComplete for the number animation
        if (storageNumberEl.value) {
          visible.value = false;
          enableSheen.value = false; 
        }
      }
    });
  }
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


</style>
