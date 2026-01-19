<template>
  <div id="app-container" class="free-spins-active">

    <!-- Global dedicated celebration layer -->
    <WinCelebrationLayer ref="winCelebrationRef" />

    <EpicWinParticles ref="epicWinRef"/>
    <WinParticles ref="winParticles" />

    <div class="game-area">
      <MultiplierBarDeepSee ref="multiplierBarRef"/>
      <SlotMachinePixi
          :win-particles-ref="winParticles"
          :epic-win-ref="epicWinRef"
          @multiplier-triggered="handleMultiplier"
          :win-celebration-ref="winCelebrationRef"
      />
      <FreeSpinSessionControlPanel />
    </div>
  </div>
</template>

<script setup>
import WinCelebrationLayer from './components/WinCelebrationLayer.vue';
import EpicWinParticles from './components/EpicWinParticles.vue';
import WinParticles from './components/WinParticles.vue';
import SlotMachinePixi from './components/SlotMachinePixi.vue';
import FreeSpinSessionControlPanel from './components/FreeSpinSessionControlPanel.vue'; // Changed

import { onMounted, ref } from 'vue';
import gsap from 'gsap';
import MultiplierBarDeepSee from './components/MultiplierBarDeepSee.vue';


const winCelebrationRef = ref(null);
const multiplierBarRef = ref(null);
const atmosLight = ref(null);
const winParticles = ref(null);
const epicWinRef = ref(null);

const handleMultiplier = (multiplier) => {
  if (multiplierBarRef.value) {
    console.log(multiplier);
    multiplierBarRef.value.setSpinState(true)
    multiplierBarRef.value.setActiveMultiplier(multiplier);
  }
};

onMounted(() => {
  if (atmosLight.value) {
    gsap.to(atmosLight.value, {
      force3D:true,
      opacity: 0.8,
      scale: 1.1,
      duration: 3,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
  }
});
</script>

<style>
/* Styles are copied from App.vue for consistency */
/* A new class is added to the root for potential theme overrides */
.free-spins-active {
  /* Example: change background to indicate free spins mode */
  background-image: url('./assets/images/layout_background2.png');
}

:root {
  --brand-purple: #8A2BE2;
  --brand-pink: #FF1493;
  --dark-bg: #1a202c;
  --light-gray: #a0aec0;
  --mid-gray: #4a5568;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--dark-bg);
  color: white;
  overflow: hidden;
}

#app-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100vw;
  height: 100dvh;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
  overflow: hidden;
}

.game-area {
  z-index: 1;
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>