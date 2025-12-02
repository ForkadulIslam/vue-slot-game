<template>

<div class="slot-machine" ref="slotMachineEl">
    <div id="storage_number">100</div>
    <div ref="particleContainerEl" class="particle-container"></div>
</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as PIXI from 'pixi.js'; // Explicitly import PIXI
import { Emitter, upgradeConfig } from '@spd789562/particle-emitter'; // Assume upgradeConfig exists for this package
import goldCoinImage from '../assets/images/coinSprite.png';
import { gsap } from 'gsap';




const particleContainerEl = ref(null); // Ref for the DOM element
let app = null;
let emitter = null;

// Emitter configuration (from the provided snippet)
const emitterConfig ={
  "lifetime": {
    "min": 0.5,
    "max": 2
  },
  "frequency": 0.05,
  "pos": {
    "x": 0,
    "y": 0
  },
  "spawnChance": 1,
  "emitterLifetime": 3,
  "maxParticles": 300,
  "particlesPerWave": 10,
  "addAtBack": true,
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
      "type": "animatedSingle",
      "config": {
        "anim": {
          "framerate": 20,
          "loop": true,
          "textures": [
            goldCoinImage
          ]
        }
      }
    },
    {
      "type": "spawnShape",
      "config": {
        "type": "torus",
        "data": {
          "x": 0,
          "y": 0,
          "radius": 40,
          "innerRadius": 39,
          "affectRotation": true
        }
      }
    },
    {
      "type": "moveSpeed",
      "config": {
        "speed": {
          "list": [
            {
              "time": 0,
              "value": 100
            },
            {
              "time": 1,
              "value": 500
            }
          ],
          "isStepped": true
        }
      }
    },
    {
      "type": "scaleStatic",
      "config": {
        "min": 0.5,
        "max": 0.5
      }
    },
    {
      "type": "alpha",
      "config": {
        "alpha": {
          "list": [
            {
              "time": 0,
              "value": 1
            },
            {
              "time": 1,
              "value": 0.8
            }
          ],
          "isStepped": false
        }
      }
    }
  ]
}


onMounted(async () => {
    gsap.from("#storage_number", {
  innerText: 0,
  duration: 5,
  snap : {
     innerText: 0.01
  }
});


  if (particleContainerEl.value) {
    app = new PIXI.Application();
    await app.init({
        width: particleContainerEl.value.clientWidth,
        height: particleContainerEl.value.clientHeight,
        backgroundColor: 0x000000, // Black background for contrast
        resizeTo: particleContainerEl.value, // Resize app to fit its container
        antialias: true,
    });
    particleContainerEl.value.appendChild(app.canvas);

    // Create a ParticleContainer with appropriate dynamic properties
    // This needs to be done AFTER app initialization and appended to app.stage
    const pixiParticleContainer = new PIXI.ParticleContainer(10000, { // Increased maxParticles
      uvs: true,      // Enable if using multiple textures from same source
      // vertex: true,   // Not needed if particles are simple sprites
      position: true,
      rotation: true,
      scale: true,
      alpha: true,    // Emitter config has alpha behavior
      color: true,    // Emitter config has color behavior
    });
    app.stage.addChild(pixiParticleContainer);

    // Load the texture for the emitter
    const loadedTexture = await PIXI.Assets.load(goldCoinImage);

    // Upgrade config for the emitter (assuming upgradeConfig exists for this package)
    const newConfig = upgradeConfig(emitterConfig, [loadedTexture]);

    emitter = new Emitter(
        pixiParticleContainer, // The PIXI.ParticleContainer to put the emitter in
        newConfig
    );
    
    // Position the emitter in the center of the app screen
    emitter.updateSpawnPos(app.screen.width / 2, app.screen.height / 2);

    // Start emitting
    emitter.emit = true;

    let elapsed = Date.now();

    // Update function every frame
    app.ticker.add(() => {
        const now = Date.now();
        // The emitter requires the elapsed number of seconds since the last update
        emitter.update((now - elapsed) * 0.001);
        elapsed = now;
    });

    // Handle window resize
    const handleResize = () => {
        if (app && particleContainerEl.value) {
            app.resize();
            // Re-center emitter on resize
            emitter.updateSpawnPos(app.screen.width / 2, app.screen.height / 2);
        }
    };
    window.addEventListener('resize', handleResize);
  }
});

onUnmounted(() => {
  if (app) {
    app.destroy(true, true); // Destroy app, remove view, and clean up textures
    app = null;
  }
  if (emitter) {
    emitter.destroy();
    emitter = null;
  }
  window.removeEventListener('resize', handleResize); // Clean up resize listener
});

// Helper for cleaning up resize listener
let handleResize;
</script>

<style scoped>
.particle-container {
  width: 300px;
  height: 400px;
 
}
</style>