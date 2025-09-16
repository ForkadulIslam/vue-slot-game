<template>
  <div id="app-container">
    <div class="game-area">
      <SlotMachine />
      <ControlPanel />
    </div>
  </div>
</template>

<script setup>
import SlotMachine from './components/SlotMachine.vue';
import ControlPanel from './components/ControlPanel.vue';
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
  background: radial-gradient(circle, #4A00B0 0%, #8B008B 100%); /* Vibrant gradient - Jili inspired */
  padding: 0.5rem 0;
  box-sizing: border-box;
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