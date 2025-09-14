<template>
  <div class="slot-machine">
    <div class="reels-container">
      <Reel 
        v-for="(reel, index) in reels" 
        :key="index" 
        :symbols="reel"
        :isSpinning="isSpinning"
        :delay="index * 200" 
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Reel from './Reel.vue';
import { useSlotGame } from '../composables/useSlotGame';

const { outcome, symbolPaths, isSpinning, reelsForDisplay } = useSlotGame();
console.log('SlotMachine - isSpinning: ', isSpinning.value);

const reels = computed(() => {
  return reelsForDisplay.value.map(reelSymbols => {
    return reelSymbols.map(symbolName => {
      return {
        name: symbolName,
        url: symbolPaths[symbolName],
      };
    });
  });
});
//console.log(reels);
</script>

<style scoped>
.slot-machine {
  display: flex;
  justify-content: center;
  align-items: center;
}

.reels-container {
  display: flex;
  gap: 1.5vw;
  border-radius: 10px;
  width: 85vw;
  max-width: 900px;
  height: auto;
  aspect-ratio: 5 / 3; 
  align-items: stretch;
  padding: 1vw;
  background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
  box-shadow: inset 0 0 15px rgba(0,0,0,0.5);
}
</style>
