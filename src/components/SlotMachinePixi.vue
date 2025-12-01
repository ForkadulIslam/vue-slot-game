<template>
  <div class="slot-machine" ref="slotMachineEl">
    <!-- SVG Filter for Electric/Thunder Effect -->
    <svg style="position: absolute; width: 0; height: 0;">
      <defs>
        <filter id="thunder-filter">
          <feTurbulence ref="turbulenceEl" baseFrequency="0.02 0.8" numOctaves="1" seed="2" stitchTiles="stitch"/>
          <feDisplacementMap in="SourceGraphic" scale="30"></feDisplacementMap>
          <feGaussianBlur stdDeviation="2" />
          <feComposite operator="in" in2="SourceGraphic" />
          <feComposite operator="arithmetic" k1="0" k2="1" k3="4" k4="0" />
        </filter>
      </defs>
    </svg>

    <div ref="reelsContainer" class="reels-container">
      <Reel
        v-for="(reel, index) in reels"
        :key="index"
        :symbols="reel"
        :reelIndex="index"
        :ref="el => reelElements[index] = el"
      />
    </div>
    <div ref="winAmountContainer" class="win-amount-container"></div>
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
    <div ref="explosionOverlay" class="explosion-overlay"></div>
    <div ref="coinContainer" class="coin-container"></div>
    
    <!-- New GIF Container -->
    <div ref="gifContainer" class="gif-container">
      <img :src="celebrationGif" alt="Celebration" />
    </div>
    <div ref="vignetteOverlay" class="vignette-overlay"></div>
    <div ref="winMessageContainer" class="win-message-container"></div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUpdate, nextTick } from 'vue';
import { gsap } from 'gsap';
import Reel from './Reel.vue';
import WinLine from './WinLine.vue';
import { useSlotGame } from '../composables/useSlotGame';
import celebrationGif from '../assets/images/celebration_mystrybox.gif';

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
  setWinAnimationPlaying,
  winningScatters,
  scatterWinAmount,
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
const winAmountContainer = ref(null);
const reelsContainer = ref(null);
const turbulenceEl = ref(null);
const shockwaveAnim = ref(null);
const explosionOverlay = ref(null);
const coinContainer = ref(null);
const gifContainer = ref(null);
const slotMachineEl = ref(null);
const vignetteOverlay = ref(null);
const winMessageContainer = ref(null);


// Ensure refs are cleared before each update to prevent memory leaks
onBeforeUpdate(() => {
  reelElements.value = [];
  winLineElements.value = [];
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

// --- SPIN AND WIN ORCHESTRATION ---
watch(isSpinning, (spinning) => {
  if (spinning) {
    // --- SPIN START ---
    displayedWinAmount.value = 0;

    const reelsEl = document.querySelectorAll('.reel');
    const finalOutcome = outcome.value.reelsSymbols;
    const symbolHeight = 65;
    const reelAnimationDuration = 5;

    reelsEl.forEach((reel, reelIndex) => {
      const finalSymbols = finalOutcome[reelIndex];
      const finalSymbolElements = finalSymbols.map(s => createSymbolElement(s));
      const startingSymbolElements = Array.from(reel.children);

      const randomSymbolElements = [];
      const symbolKeys = Object.keys(symbolPaths).filter(k => k !== 'gold_coin');
      for (let k = 0; k < 50; k++) {
        randomSymbolElements.push(createSymbolElement(symbolKeys[Math.floor(Math.random() * symbolKeys.length)]));
      }

      reel.innerHTML = '';
      reel.append(...finalSymbolElements, ...randomSymbolElements, ...startingSymbolElements);

      const spinContentHeight = (finalSymbolElements.length + randomSymbolElements.length) * symbolHeight;
      gsap.set(reel, { y: -spinContentHeight });

      const reelTimeline = gsap.timeline({
        delay: reelIndex * .2,
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
                  blurIntensity = progress * 10 * 2;
              }
              else if (progress > 0.5) {
                  blurIntensity = (1 - progress) * 10 * 2;
              }
              gsap.set(reel, { filter: `blur(${blurIntensity}px)` });
          }
      });
    });
  } else {
    // --- SPIN END ---
    // Use nextTick to ensure the DOM has updated with the final symbols before checking for wins.
    nextTick(() => {
      const hasLineWins = winningPaylines.value.length > 0;
      const hasScatterWins = winningScatters.value.length > 0;

      if (hasLineWins) {
        // --- NEW SEQUENTIAL LINE WIN SEQUENCE ---
        console.log('Line wins:'+ winningPaylines.value.length);
        const allSymbolElements = Array.from(reelsContainer.value.querySelectorAll('.symbol'));

        const masterTimeline = gsap.timeline({
          onComplete: () => {
            // Final cleanup
            gsap.set(allSymbolElements, { opacity: 1, scale: 1, filter: 'none' });
            
            
            // If there are also scatter wins, play them after line wins
            if (hasScatterWins) {
              console.log('Scatter win, Sequence start...')
            }
          }
        });

        let cumulativeWin = 0;

        winningPaylines.value.forEach((line, index) => {
          const lineComponent = winLineElements.value[index];
          //console.log(lineComponent);
          if (!lineComponent) return;

          // Get the specific symbols for this line
          const lineSymbolElements = [];
          const lineDefinition = line.definition;
          // Use line.symbolsPositions which contains the actual reel indices of the win
          if (line.symbolsPositions) {
            line.symbolsPositions.forEach(reelIndex => {
              const rowIndex = lineDefinition[reelIndex];
              const symbolIndex = reelIndex * reelsSymbolsNumber.value + rowIndex;
              const symbol = allSymbolElements[symbolIndex];
              if (symbol) {
                  lineSymbolElements.push(symbol);
              }
            });
          } else {
            // Fallback for older data structure if needed
            for (let i = 0; i < line.symbolsCount; i++) {
              const reelIndex = i;
              const rowIndex = lineDefinition[reelIndex];
              const symbolIndex = reelIndex * reelsSymbolsNumber.value + rowIndex;
              lineSymbolElements.push(allSymbolElements[symbolIndex]);
            }
          }
          
          const lineTimeline = gsap.timeline();

          // 1. Draw the line
          lineTimeline.add(() => {
            lineComponent.playAnimation();
          })
          // Animate the win amount for this line
          .add(() => {
            cumulativeWin += line.winAmount;
            gsap.to(displayedWinAmount, { 
              value: cumulativeWin, 
              duration: 0.5, 
              ease: 'power1.out'
            });
          }, 0.2);

          // 2. Explode the symbols on this line
          lineTimeline.to(lineSymbolElements, {
              scale: 3,
              opacity: 0,
              filter: 'blur(5px)',
              duration: 0.4,
              ease: 'power1.out',
              stagger: 0.1,
          }, '+=0.6'); // Wait for line to draw

          // 3. Hide the line
          lineTimeline.add(() => {
              if (lineComponent.pathElement) {
                  gsap.killTweensOf(lineComponent.pathElement);
                  gsap.to(lineComponent.pathElement, { opacity: 0, duration: 0.3 });
              }
          }, '-=0.4');

          // 4. Reset the symbols for this line before the next loop
          lineTimeline.set(lineSymbolElements, { opacity: 1, scale: 1, filter: 'none' });

          masterTimeline.add(lineTimeline);
        });

      } else if (hasScatterWins) {
        // --- SCATTER WIN ONLY SEQUENCE ---
        console.log('Scatter win, Sequence start...')
        
      }
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
  perspective: 1000px;
}

.win-lines-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Allows clicks to pass through */
}

.win-amount-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.win-amount-flyoff {
  position: absolute;
  transform: translate(-50%, -50%); /* Center on the calculated x,y */
  color: gold;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 0 5px black, 0 0 10px black;
}

.reels-container {
    display: flex;
    width: 325px;
    overflow: hidden;
    background-color: #111;
    justify-content: flex-start;
    height: 260px;
    transition: filter 0.3s ease-in-out;
    border-radius: 10px;
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
  position: relative;
}

.symbol img {
  width: 70%;
  border-radius: 50%;
}

.explosion-overlay {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,220,1) 0%, rgba(255,200,0,0.8) 40%, rgba(255,165,0,0) 70%);
  transform: scale(0) translate(-50%, -50%);
  transform-origin: center;
  opacity: 0;
  pointer-events: none;
  z-index: 110; /* Above coins */
}

.coin-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 100;
}

.coin {
  position: absolute;
  background-image: url('../assets/images/symblos/celebration/gold_coin.png');
  background-size: contain;
  background-repeat: no-repeat;
}

.glint {
  position: absolute;
  background-color: #fff;
  box-shadow: 0 0 10px 5px #fff, 0 0 20px 10px gold;
  border-radius: 50%;
}

.streak {
  position: absolute;
  background: linear-gradient(to right, transparent, #fff, transparent);
  height: 2px;
}

.gif-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 50;
}

.gif-container img {
  width: 250px;
  height: auto;
  filter: drop-shadow(0 0 20px gold);
}

.vignette-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, transparent 40%, black 110%);
  opacity: 0;
  pointer-events: none;
  z-index: 40;
}

.win-message-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  z-index: 120;
}

.win-message-container span {
  display: inline-block;
  font-family: 'Arial Black', 'Gadget', sans-serif;
  font-size: 2.2em;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 8px gold, 0 0 15px gold, 0 0 25px #ff8c00;
}

.big-win-text {
    position: absolute;
    display: grid;
    place-items: center;
    font-family: 'Arial Black', Gadget, sans-serif;
    font-size: 3.5em;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.big-win-text span {
    grid-area: 1 / 1;
}

.text-bg {
    color: #8B4513; /* SaddleBrown */
    -webkit-text-stroke: 8px #A0522D; /* Sienna */
    z-index: 1;
}

.text-fg {
    background: linear-gradient(to bottom, #FFD700, #FFA500);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-stroke: 2px #DAA520; /* GoldenRod */
    z-index: 2;
    transform: translateY(-4px);
}

.free-spins-counter {
    position: absolute;
    top: 65%;
    font-family: 'Arial Black', Gadget, sans-serif;
    font-size: 3em;
    color: white;
    text-shadow: 0 0 10px black, 0 0 20px black;
}

.light-beam {
    position: absolute;
    border-radius: 2px;
    pointer-events: none;
    z-index: 105;
}

.win-counter {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 121;
}

.win-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, gold 0%, transparent 70%);
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
    border-radius: 50%;
    z-index: 120;
}

.win-number {
    font-family: 'Arial Black', 'Gadget', sans-serif;
    font-size: 3.5em;
    font-weight: bold;
    color: #FFD700;
    text-shadow: 
        0 0 10px #FF6B00,
        0 0 20px #FF6B00,
        0 0 30px #FF6B00,
        0 0 40px #FF0000,
        0 0 70px #FF0000;
    display: inline-block;
}

.confetti {
    position: absolute;
    border-radius: 2px;
    pointer-events: none;
    z-index: 110;
}

/* Enhanced existing styles */
.vignette-overlay {
    background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 100%);
}

.gif-container img {
    width: 280px;
    filter: 
        drop-shadow(0 0 15px gold)
        drop-shadow(0 0 30px #FF6B00)
        brightness(1.2);
}

.coin {
    background-image: url('../assets/images/symblos/celebration/gold_coin.png');
    background-size: contain;
    background-repeat: no-repeat;
    filter: drop-shadow(0 0 3px gold) brightness(1.1);
}

.glint {
    filter: blur(1px);
}
</style>