<template>
  <div id="app-container">
    <div class="game-area">
      <!-- <SlotMachine /> -->
      <SlotMachinePixi :win-particles-ref="winParticles" />
      <ControlPanel />
      <WinParticles ref="winParticles" />
      <!-- <LearnPixiLighting/> -->

      <!-- <CartoonSmoke/> -->

      <!-- <PixiParticleV8/> -->
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
import { ref } from 'vue';

const winParticles = ref(null);

//import CartoonSmoke from './components/CartoonSmoke.vue'

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
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  /* background: radial-gradient(circle, #4A00B0 0%, #8B008B 100%); */
  padding: 0.5rem 0;
  box-sizing: border-box;
  background-image: url('./assets/images/game_banner.png');
  background-size: cover;
  background-position: left;
  background-repeat: no-repeat;
}

.game-area {
  width: 100%;
  max-width: 900px; /* Max width for larger screens */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

</style>