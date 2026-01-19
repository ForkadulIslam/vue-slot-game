<template>
  <div id="app-container">

    <!-- Global dedicated celebration layer -->
    <LineWinCelebrationLayer ref="LineWinCelebrationRef" /> 
    <BigWinCelebrationLayer ref="epicWinRef"/>

    <div class="game-area">
      <MultiplierBarDeepSee ref="multiplierBarRef"/>
      <SlotMachinePixi
        :win-particles-ref="winParticles"
        :epic-win-ref="epicWinRef"
        @multiplier-triggered="handleMultiplier"
        :line-win-celebration-ref="winCelebrationRef"
      />
      <ControlPanel />
    </div>
  </div>
</template>

<script setup>

import LineWinCelebrationLayer from './components/LineWinCelebrationLayer.vue';
import BigWinCelebrationLayer from './components/BigWinCelebrationLayer.vue';
import SlotMachinePixi from './components/SlotMachinePixi.vue';
import ControlPanel from './components/ControlPanel.vue';

import { onMounted, ref } from 'vue';
import { Assets } from 'pixi.js';
import gsap from 'gsap';
import MultiplierBarDeepSee from './components/MultiplierBarDeepSee.vue';

// --- Pre-load all celebration assets ---
import symbolsSprite from './assets/images/symbols_sprite.png';
import glowBurst from './assets/images/transparent_glow_squire.png';
import shieldHelmet from './assets/images/shield_helmet.png';
import backgroundGlow from './assets/images/transparent_glow.png';


const winCelebrationRef = ref(null);
const multiplierBarRef = ref(null); // NEW: Ref for MultiplierBar

const atmosLight = ref(null);

const winParticles = ref(null);

const epicWinRef = ref(null); // Reference for epic win


const handleMultiplier = (multiplier) => {
  if (multiplierBarRef.value) {
    console.log(multiplier);
    multiplierBarRef.value.setSpinState(true)
    multiplierBarRef.value.setActiveMultiplier(multiplier);
  }

  
};


onMounted(async () => {
  // Pre-load assets to prevent delay on first celebration
  const allCelebrationAssets = [
    symbolsSprite, 
    glowBurst, 
    shieldHelmet, 
    backgroundGlow
  ];
  await Assets.load(allCelebrationAssets);

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
  justify-content: flex-start;
  align-items: center;
  width: 100vw;
  /* Use dynamic viewport height to handle mobile browser bars */
  height: 100dvh;

  /* FIX 2: Reduce padding to just encompass the safe area */
  /* Was 80px, changed to 10px + safe-area */
  padding-bottom: calc(10px + env(safe-area-inset-bottom));

  box-sizing: border-box;
  background-image: url('./assets/images/game_banner.jpg');
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;

  /* FIX 3: Prevent any scrolling */
  overflow: hidden;
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


/* Optional: Add this media query to ensure elements scale down on very short screens */
@media (max-height: 700px) {
  /*.game-area {*/
  /*  transform: scale(0.9);*/
  /*  transform-origin: bottom center;*/
  /*}*/
}

</style>