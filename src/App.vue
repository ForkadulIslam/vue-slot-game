<template>
  <div id="app-container">
    <!-- NEW: The Light Source Overlay -->
    <div class="atmospheric-light" ref="atmosLight"></div>

    <div class="game-area">
      <MultiplierBar/>
      <!-- <SlotMachine /> -->
      <SlotMachinePixi :win-particles-ref="winParticles" />
      <ControlPanel />
      <WinParticles ref="winParticles" />
      <!-- <LearnPixiLighting/> -->
      <!-- <CartoonSmoke/> -->
      <!-- <PixiParticleV8/> -->
      <!-- <ManualParticleEmitter/> -->

      <!-- <SlotMachinePixiReels/> -->
    </div>
  </div>
</template>

<script setup>
//import PixiParticleV8 from './components/PixiParticleV8.vue';

//import SlotMachine from './components/SlotMachine.vue';
import ControlPanel from './components/ControlPanel.vue';
//import LearnPixiLighting from './components/LearnPixiLighting.vue';
//import MachineGraphics from './components/MachineGraphics.vue';
import SlotMachinePixi from './components/SlotMachinePixi.vue';
import WinParticles from './components/WinParticles.vue';
import MultiplierBar from './components/MultiplierBar.vue';
//import ManualParticleEmitter from './components/ManualParticleEmitter.vue';
//import SlotMachinePixiReels from './components/SlotMachinePixiReels.vue';

import { onMounted, ref } from 'vue';
import gsap from 'gsap';

const atmosLight = ref(null);

const winParticles = ref(null);

//import CartoonSmoke from './components/CartoonSmoke.vue'

onMounted(() => {
  if (atmosLight.value) {
    // Make the light pulse slowly like a fire/lantern
    gsap.to(atmosLight.value, {
      force3D:true,
      opacity: 0.8, // Pulse between 0.4 (css) and 0.8
      scale: 1.1,   // Slight expansion
      duration: 3,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
  }
});

</script>

<style>
:root {
  --brand-purple: #8A2BE2; /* Vibrant Purple - Jili inspired */
  --brand-pink: #FF1493; /* Deep Pink - Jili inspired */
  --dark-bg: #1a202c;
  --light-gray: #a0aec0;
  --mid-gray: #4a5568;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--dark-bg);
  color: white;
  overflow: hidden; /* Prevents scrollbars on mobile */
}

#app-container {
  display: flex;
  flex-direction: column;
  /* CHANGE THIS: Push content to the bottom instead of center */
  justify-content: flex-start;
  align-items: center;
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  background-image: url('./assets/images/game_banner.png');
  background-size: cover;
  background-position: center top; /* Ensure the top (lantern) is visible */
  background-repeat: no-repeat;
}

.atmospheric-light {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60%; /* Cover top 60% of screen */
  pointer-events: none;
  z-index: 0; /* Behind game area */
  
  /* Create a cone of light coming from top center */
  background: radial-gradient(
    ellipse at 50% 10%, 
    rgba(255, 160, 50, 0.5) 0%, /* Bright Core (Lantern color) */
    rgba(255, 100, 0, 0.2) 30%, /* Glow */
    transparent 70%
  );
  mix-blend-mode: screen; /* This blends it beautifully with the dark forest */
  opacity: 0.4;
  transform-origin: top center;
}

.game-area {
  z-index: 1; 
  width: 100%;
  max-width: 900px; /* Max width for larger screens */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

</style>