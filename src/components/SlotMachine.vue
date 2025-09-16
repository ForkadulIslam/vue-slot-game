<template>
  <div class="slot-machine">
    <div class="reels-container">
      <Reel 
        v-for="(reel, index) in reels" 
        :key="index" 
        :symbols="reel"
        :reelIndex="index"
        :ref="el => reelElements[index] = el"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUpdate } from 'vue';
import Reel from './Reel.vue';
import { useSlotGame } from '../composables/useSlotGame';

const { reelsForDisplay, symbolPaths, isSpinning, outcome, finishSpin } = useSlotGame();

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

const reelElements = ref([]);

// Ensure refs are cleared before each update to prevent memory leaks
onBeforeUpdate(() => {
  reelElements.value = [];
});

const createSymbolElement = (symbol) => {
  const imgElement = document.createElement('img');
  imgElement.src = symbolPaths[symbol];
  const symbolDiv = document.createElement('div');
  symbolDiv.classList.add('symbol');
  symbolDiv.style.width = '65px';
  symbolDiv.style.height = '65px';
  symbolDiv.appendChild(imgElement);
  return symbolDiv;
};

watch(isSpinning, (newValue) => {
  if (newValue) {
    const finalOutcome = outcome.value;
    const symbolHeight = 65; // Assuming fixed symbol height, should match Reel.vue's styling

    reelElements.value.forEach((reelComponent, reelIndex) => {
      const reel = reelComponent.$el;
      if (!reel) return;

      const startingSymbols = reelsForDisplay.value[reelIndex];
      const finalSymbols = finalOutcome[reelIndex];

      const startingSymbolElements = startingSymbols.map(s => createSymbolElement(s));
      const finalSymbolElements = finalSymbols.map(s => createSymbolElement(s));
      
      const randomSymbolElements = [];
      const symbolKeys = Object.keys(symbolPaths).filter(k => k !== 'gold_coin');
      for (let k = 0; k < 30; k++) { // Reduced random symbols for performance
        randomSymbolElements.push(createSymbolElement(symbolKeys[Math.floor(Math.random() * symbolKeys.length)]));
      }

      reel.innerHTML = '';
      reel.append(...finalSymbolElements, ...randomSymbolElements, ...startingSymbolElements);
      
      const spinContentHeight = (finalSymbolElements.length + randomSymbolElements.length) * symbolHeight;

      gsap.set(reel, { y: -spinContentHeight });

      const reelTimeline = gsap.timeline({
        delay: reelIndex * 0.2, // Shorter delay
        onComplete: () => {
          // Clean up - keep only final symbols
          const finalClones = finalSymbolElements.map(s => s.cloneNode(true));
          reel.innerHTML = '';
          reel.append(...finalClones);
          gsap.set(reel, { y: 0, filter: 'blur(0px)' });
          
          if (reelIndex === reelElements.value.length - 1) {
            finishSpin();
          }
        }
      });

      reelTimeline.to(reel, {
        y: 0,
        duration: 3 + reelIndex * 0.5, // Staggered duration
        ease: "power2.inOut",
        onUpdate: function() {
          const progress = this.progress();
          let blurIntensity;
          if (progress < 0.1) {
            blurIntensity = progress * 10 * 4; // quick ramp up
          } else if (progress > 0.9) {
            blurIntensity = (1 - progress) * 10 * 4; // quick ramp down
          } else {
            blurIntensity = 4;
          }
          gsap.set(reel, { filter: `blur(${blurIntensity}px)` });
        }
      });
    });
  }
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
  gap: 0;
  width:325px;
  height: 195px; 
  align-items: center;
  background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
  box-shadow: inset 0 0 15px rgba(0,0,0,0.5);
  overflow: hidden;
}
</style>
