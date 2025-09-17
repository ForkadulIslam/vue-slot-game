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

const { reelsForDisplay, symbolPaths, isSpinning, outcome, finishSpin, sounds } = useSlotGame();

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
    const reelsEl = document.querySelectorAll('.reel');
    const finalOutcome = outcome.value;
    const symbolHeight = 65; // Assuming fixed symbol height, should match Reel.vue's styling
    
    const soundVolume = { value: 0 };
    //sounds.spin.volume(soundVolume.value);
    //sounds.spin.loop(true);
    //sounds.spin.play();

    const volumeTimeline = gsap.timeline({
        onUpdate: () => sounds.spin.volume(soundVolume.value)
    });

    // Phase 1: Accelerate to 50% volume over 3.5 seconds
    volumeTimeline.to(soundVolume, {
        value: 0.5,
        duration: 3.5,
        ease: "power1.in"
    });

    // Phase 2: Decelerate to 100% volume over the next 3.5 seconds
    volumeTimeline.to(soundVolume, {
        value: 1.0,
        duration: 3.5,
        ease: "power1.out"
    });

    const reelAnimationDuration = 7;
    const lastReelDelay = (reelsEl.length - 1) * 0.4;
    const totalDuration = lastReelDelay + reelAnimationDuration;
    const fadeOutDuration = 2;

    // Start the fade-out before the animation ends
    gsap.delayedCall(totalDuration - fadeOutDuration, () => {
        volumeTimeline.kill();
        gsap.to(soundVolume, {
            value: 50,
            duration: fadeOutDuration,
            ease: "linear",
            onUpdate: () => sounds.spin.volume(soundVolume.value),
            onComplete: () => {
                sounds.spin.stop();
                sounds.spin.loop(false);
            }
        });
    });

    reelsEl.forEach((reel, reelIndex) => {
      const finalSymbols = finalOutcome[reelIndex];
      const finalSymbolElements = finalSymbols.map(s => createSymbolElement(s));
      const startingSymbolElements = Array.from(reel.children);
      
      const randomSymbolElements = [];
      const symbolKeys = Object.keys(symbolPaths).filter(k => k !== 'gold_coin');
      for (let k = 0; k < 100; k++) { // Reduced random symbols for performance
        randomSymbolElements.push(createSymbolElement(symbolKeys[Math.floor(Math.random() * symbolKeys.length)]));
      }

      reel.innerHTML = '';
      reel.append(...finalSymbolElements, ...randomSymbolElements, ...startingSymbolElements);
      
      const spinContentHeight = (finalSymbolElements.length + randomSymbolElements.length) * symbolHeight;
      gsap.set(reel, { y: -spinContentHeight });

      const reelTimeline = gsap.timeline({
        delay: reelIndex * .4, // Shorter delay
        onComplete: () => {
          // Clean up - keep only final symbols
          const finalClones = finalSymbolElements.map(s => s.cloneNode(true));
          reel.innerHTML = '';
          reel.append(...finalClones);
          gsap.set(reel, { y: 0, filter: 'blur(0px)' });
          
          if (reelIndex === reelsEl.length - 1) {
            finishSpin();
          }
        }
      });

       reelTimeline.to(reel, {
            y: 0,
            duration: reelAnimationDuration,
            ease: "power2.inOut",
            onUpdate: function() {
                const progress = this.progress();
                let blurIntensity;
                if ( progress < 0.5) {
                    blurIntensity = progress * 10 * 4; // quick ramp up
                } 
                else if (progress > 0.9) {
                    blurIntensity = (1 - progress) * 10 * 4; // quick ramp down
                } 
                else {
                    blurIntensity = 4;
                }
                gsap.set(reel, { filter: `blur(${blurIntensity}px)` });
            }
        });
    });
  }
});
</script>

<style>
.slot-machine {
  display: flex;
  justify-content: center;
  align-items: center;
}

.reels-container {
    display: flex;
    width: 325px;
    overflow: hidden;
    background-color: #111;
    justify-content: flex-start;
    height: 195px;
}

.reel{
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
}

.symbol {
  width: 65px;
  height: 65px;
  /* background: radial-gradient(circle, #4a4a4a 0%, #2c2c2c 100%); */
  box-shadow: inset 0 0 10px rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden; /* Ensure images don't overflow */
  flex-shrink: 0; /* Prevent symbols from shrinking */
}

.symbol img {
  width: 70%;
  border-radius: 50%;
}

</style>