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
    <svg class="win-lines-overlay"
         :viewBox="`0 0 ${reelsContainerWidth} ${reelsContainerHeight}`"
         v-if="winningPaylines.length > 0 && !isSpinning">
      <WinLine
        v-for="(line, index) in winningPaylines"
        :key="line.lineId"
        :ref="el => { if (el) winLineElements[index] = el }"
        :line-definition="line.definition"
        :container-width="reelsContainerWidth"
        :container-height="reelsContainerHeight"
        :reels-number="reelsNumber"
        :reels-symbols-number="reelsSymbolsNumber"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUpdate, nextTick } from 'vue';
import Reel from './Reel.vue';
import WinLine from './WinLine.vue';
import { useSlotGame } from '../composables/useSlotGame';

const {
  reelsForDisplay,
  symbolPaths,
  isSpinning,
  outcome,
  finishSpin,
  sounds,
  winningPaylines,
  winningSymbolPositions,
  reelsNumber,
  reelsSymbolsNumber,
  displayedWinAmount,
} = useSlotGame();

const reelsContainerWidth = 325; // from CSS
const reelsContainerHeight = 260; // from CSS

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
const winLineElements = ref([]);

// Ensure refs are cleared before each update to prevent memory leaks
onBeforeUpdate(() => {
  reelElements.value = [];
  winLineElements.value = [];
});

// --- SEQUENTIAL WIN LINE ANIMATION ---
watch(winningPaylines, (newLines) => {
  if (newLines.length > 0 && !isSpinning.value) {
    nextTick(() => {
      // Reset the display amount at the beginning of the animation sequence
      displayedWinAmount.value = 0;

      const masterTimeline = gsap.timeline();
      let cumulativeWin = 0;

      newLines.forEach((line, index) => {
        const lineComponent = winLineElements.value[index];
        if (lineComponent) {
          cumulativeWin += line.winAmount;
          console.log(line.winAmount);
          masterTimeline.add(() => {
            lineComponent.playAnimation();
          })
          .to(displayedWinAmount, { 
            value: cumulativeWin, 
            duration: 0.8, 
            ease: 'power1.inOut'
          }, '+=0.1'); // Animate win amount shortly after line starts drawing
        }
      });
    });
  } else {
    // If there are no wins, ensure displayed amount is 0
    displayedWinAmount.value = 0;
  }
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
    // When a new spin starts, reset the win display
    displayedWinAmount.value = 0;

    const reelsEl = document.querySelectorAll('.reel');
    const finalOutcome = outcome.value.reelsSymbols;
    const symbolHeight = 65; // Assuming fixed symbol height, should match Reel.vue's styling
    const reelAnimationDuration = 5;

    reelsEl.forEach((reel, reelIndex) => {
      const finalSymbols = finalOutcome[reelIndex];
      const finalSymbolElements = finalSymbols.map(s => createSymbolElement(s));
      const startingSymbolElements = Array.from(reel.children);

      const randomSymbolElements = [];
      const symbolKeys = Object.keys(symbolPaths).filter(k => k !== 'gold_coin');
      for (let k = 0; k < 50; k++) { // Reduced random symbols for performance
        randomSymbolElements.push(createSymbolElement(symbolKeys[Math.floor(Math.random() * symbolKeys.length)]));
      }

      reel.innerHTML = '';
      reel.append(...finalSymbolElements, ...randomSymbolElements, ...startingSymbolElements);

      const spinContentHeight = (finalSymbolElements.length + randomSymbolElements.length) * symbolHeight;
      gsap.set(reel, { y: -spinContentHeight });

      const reelTimeline = gsap.timeline({
        delay: reelIndex * .2, // Shorter delay
        onComplete: () => {
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
                  blurIntensity = progress * 10 * 2; // quick ramp up
              }
              else if (progress > 0.5) {
                  blurIntensity = (1 - progress) * 10 * 2;
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
  position: relative; /* Needed for overlay positioning */
  display: flex;
  justify-content: center;
  align-items: center;
}

.win-lines-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Allows clicks to pass through */
}

.reels-container {
    display: flex;
    width: 325px;
    overflow: hidden;
    background-color: #111;
    justify-content: flex-start;
    height: 260px;
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
  background: radial-gradient(circle, #4a4a4a 0%, #2c2c2c 100%);
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