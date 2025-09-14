<template>
  <div class="slot-machine">
    <div class="reels-container">
      <Reel v-for="(reel, index) in reels" :key="index" :symbols="reel" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Reel from './Reel.vue';
import { useSlotGame } from '../composables/useSlotGame';

// The single source of truth for our game state
const { outcome, symbolPaths } = useSlotGame();

// Create a computed property to format the data for the Reel components
const reels = computed(() => {
  // The 'outcome' is a 2D array of symbol names, e.g., [['seven', 'bar'], ['melon', 'plum']]
  // We need to map this to a structure that includes the full URL for each symbol
  return outcome.value.map(reelSymbols => {
    return reelSymbols.map(symbolName => {
      return {
        name: symbolName,
        url: symbolPaths[symbolName],
      };
    });
  });
});
</script>

<style scoped>
.slot-machine {
  display: flex;
  justify-content: center;
  align-items: center;
}

.reels-container {
  display: flex;
  gap: 1.5vw; /* Responsive gap */
  
  border-radius: 10px;
  width: 85vw;
  max-width: 900px;
  height: auto;
  /* A taller aspect ratio to better fit 3 symbols vertically */
  aspect-ratio: 5 / 4; 
  align-items: stretch; /* Make reels fill the height */
}
</style>
