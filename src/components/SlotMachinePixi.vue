<template>
  <div class="slot-machine" ref="slotMachineEl">

    <div ref="reelsContainer" class="reels-container">,
      <!-- NEW: Ambient Lantern Glow (Animated via GSAP) -->
      <div class="lantern-glow" ref="lanternGlow"></div>

      <!-- NEW: Static Gloss Reflection -->
      <div class="gloss-reflection"></div>

      <!-- 3. Bottom Shadow Vignette -->
      <div class="bottom-vignette"></div>

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


  </div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUpdate, nextTick, defineProps, onMounted } from 'vue';
import { gsap } from 'gsap';
import Reel from './Reel.vue';
import WinLine from './WinLine.vue';
import { useSlotGame } from '../composables/useSlotGame';



// Define which symbols should "Pop"
const SPECIAL_SYMBOLS = ['scatter1', 'scatter2', 'wild'];


const props = defineProps({
  winParticlesRef: {
    type: Object,
    default: null
  }
});

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
  startCelebration,
  endCelebration,
} = useSlotGame();

const reelsSymbolHeight = 70;
const reelsContainerWidth = 350; // from CSS
const reelsContainerHeight = reelsSymbolHeight*4; // from CSS

const reels = computed(() => {
  return reelsForDisplay.value.map(reelSymbols => {
    return reelSymbols.map(symbolName => {
      const isSpecial = SPECIAL_SYMBOLS.includes(symbolName.toLowerCase());
      return {
        name: symbolName,
        className: symbolPaths[symbolName],
        isSpecial: isSpecial
      };
    });
  });
});

const reelElements = ref([]);
const winLineElements = ref([]);
const winAmountContainer = ref(null);
const reelsContainer = ref(null);
const turbulenceEl = ref(null);
const explosionOverlay = ref(null);
const coinContainer = ref(null);
const gifContainer = ref(null);
const slotMachineEl = ref(null);
const vignetteOverlay = ref(null);
const winMessageContainer = ref(null);
const lanternGlow = ref(null);



// Ensure refs are cleared before each update to prevent memory leaks
onBeforeUpdate(() => {
  reelElements.value = [];
  winLineElements.value = [];
});

onMounted(() => {
  //playSheenAnimation();

  // --- NEW: Lantern Flicker Effect ---
  if (lanternGlow.value) {
    gsap.to(lanternGlow.value, {
      opacity: 0.6, // Flicker between 0.3 (css) and 0.6
      duration: 0.15,
      yoyo: true,
      repeat: -1,
      ease: "rough({ template: power1.inOut, strength: 1, points: 20, taper: 'none', randomize: true, clamp: false })",
      // If "rough" ease isn't loaded, use "sine.inOut" with random duration:
      // onRepeat: () => gsap.globalTimeline.timeScale(0.8 + Math.random() * 0.5)
    });
  }
});






const createSymbolElement = (symbol) => {
  const isSpecial = SPECIAL_SYMBOLS.includes(symbol.toLowerCase());

  const imgElement = document.createElement('div');
  imgElement.classList.add('symbol-icon');
  imgElement.classList.add(symbolPaths[symbol]);
  if(isSpecial){
    imgElement.classList.add('is-special');
  }

  const symboxBoxSheenEffect = document.createElement('div');
  symboxBoxSheenEffect.classList.add('symbol-box');
  if(isSpecial){
    symboxBoxSheenEffect.classList.add('shine-effect');
  }
  symboxBoxSheenEffect.appendChild(imgElement);

  const symbolDiv = document.createElement('div');
  symbolDiv.classList.add('symbol');
  symbolDiv.appendChild(symboxBoxSheenEffect);
  return symbolDiv;
};

// --- SPIN AND WIN ORCHESTRATION ---
watch(isSpinning, (spinning) => {
  if (spinning) {
    // --- SPIN START ---
    displayedWinAmount.value = 0;

    const reelsEl = document.querySelectorAll('.reel');
    const finalOutcome = outcome.value.reelsSymbols;
    const symbolHeight = reelsSymbolHeight;
    const reelAnimationDuration = 1;
    reelsEl.forEach((reel, reelIndex) => {
      const finalSymbols = finalOutcome[reelIndex];
      const finalSymbolElements = finalSymbols.map(s => createSymbolElement(s));
      const startingSymbolElements = Array.from(reel.children);

      const randomSymbolElements = [];
      const symbolKeys = Object.keys(symbolPaths).filter(k => k !== 'gold_coin');
      for (let k = 0; k < 12; k++) {
        randomSymbolElements.push(createSymbolElement(symbolKeys[Math.floor(Math.random() * symbolKeys.length)]));
      }

      reel.innerHTML = '';
      reel.append(...finalSymbolElements, ...randomSymbolElements, ...startingSymbolElements);

      const spinContentHeight = (finalSymbolElements.length + randomSymbolElements.length) * symbolHeight;
      gsap.set(reel, { y: -spinContentHeight,force3D: true, });

      gsap.ticker.fps(60);

      const reelTimeline = gsap.timeline({
        delay: reelIndex * .3,
        onComplete: () => {
          const finalClones = finalSymbolElements.map(s => s.cloneNode(true));
          reel.innerHTML = '';
          reel.append(...finalClones);
          if (reelIndex === reelsEl.length - 1) {
            finishSpin();
          }
        }
      });

      reelTimeline.to(reel, {
          y: 0,
          duration: reelAnimationDuration,
          ease: "power2.inOut",
          force3D: true,
          onUpdate: function() {

          }
      });
    });
  } else {
    // --- SPIN END ---
    // Fade out and stop the looping spin sound

    // Use nextTick to ensure the DOM has updated with the final symbols before checking for wins.
    nextTick(() => {
      const hasLineWins = winningPaylines.value.length > 0;
      const hasScatterWins = winningScatters.value.length > 0;

      if (hasLineWins) {
        // --- NEW SEQUENTIAL LINE WIN SEQUENCE ---
        setWinAnimationPlaying(true);

        const allSymbolElements = Array.from(reelsContainer.value.querySelectorAll('.symbol'));
        let cumulativeWin = 0;
        const masterTimeline = gsap.timeline({
          onComplete: async () => {
            // Final cleanup
            gsap.set(allSymbolElements, { opacity: 1, scale: 1, filter: 'none' });
            setWinAnimationPlaying(false);
            //console.log('All Line win done');
            // If there are also scatter wins, play them after line wins

            if(props.winParticlesRef && props.winParticlesRef.coinFlooding) {
              await props.winParticlesRef.coinFlooding(100);
            }

            if (hasScatterWins) {
              //playScatterWinSequence();
            }
          }
        });
        winningPaylines.value.forEach((line, index) => {
          const lineComponent = winLineElements.value[index];
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
          }

          const lineTimeline = gsap.timeline({
            onComplete:() => {
              sounds.linewin.stop();
            }
          });



          //console.log(symbolCoordinates);
          lineTimeline.call( async () => {
            let symbolCoordinate;
            if(lineSymbolElements.length > 0){
              let lastSymbol = lineSymbolElements[lineSymbolElements.length -1];
              const rect = lastSymbol.getBoundingClientRect();
              symbolCoordinate = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              }
            }
            if(props.winParticlesRef && props.winParticlesRef.playWin) {
              await props.winParticlesRef.playWin(symbolCoordinate);
            }
            // 1. Play the sound
            sounds.linewin.play();
          })

          // 2. Draw the line
          .add(() => {
            lineComponent.playAnimation();
          })
          // Animate the win amount for this line
          .add(() => {
            console.log('Line win:'+ line.winAmount)
            cumulativeWin += line.winAmount;
            gsap.to(displayedWinAmount, {
              value: cumulativeWin,
              duration: 1,
              ease: 'power1.out'
            });
          }, 0.2);

          // Pulse the symbols on this line
          lineTimeline.to(lineSymbolElements, {
            scale: 1.3,
            duration: 0.2,
            repeat: 4,
            yoyo: true,
            ease: 'power2.inOut',
            stagger: 0.1,
          }, 0.2)

          // 4. Hide the line
          lineTimeline.add(() => {
              //console.log(lineComponent);
              if (lineComponent.pathElement) {
                  gsap.killTweensOf(lineComponent.pathElement);
                  gsap.to(lineComponent.pathElement, { opacity: 0, duration: 0.3 });
              }
          }, '-=0.4');

          // 5. Reset the symbols for this line before the next loop
          lineTimeline.set(lineSymbolElements, { opacity: 1, scale: 1, filter: 'none' });

          masterTimeline.add(lineTimeline);
        });

      } else if (hasScatterWins) {
        // --- SCATTER WIN ONLY SEQUENCE ---
        //playScatterWinSequence();
      }

      // Temporarily trigger WinParticles for every spin completion for testing
      if (props.winParticlesRef && props.winParticlesRef.play) {
        //props.winParticlesRef.play();
      }
    });
  }
});
</script>

<style scoped>
.slot-machine {
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1000px;
  /* height: 380px; */
  border-radius: 20px 20px 0 0;
  margin-bottom: 20px; /* Space between reels and stone control panel */
}

.win-lines-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 20; }
.win-amount-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 20; }


.reels-container {
    position: relative;
    width: 350px; /* same as containerWidth */
    height: 280px; /* same as containerHeight */
    overflow: hidden;
    border-radius: 15px;
    display: flex;
    justify-content: space-between;
    background: radial-gradient(circle at 50% 30%, #2a1a3a 0%, #08050c 90%);

  box-shadow:
          0 0 0 2px #000, /* Inner black stroke for contrast */
          inset 0 0 30px rgba(0,0,0,0.9), /* Inner depth shadow */
          0 0 25px rgba(255, 180, 0, 0.4); /* Outer Gold Glow */

  contain: layout paint;
}


/* --- NEW: LANTERN GLOW OVERLAY --- */
.lantern-glow {
  position: absolute; top: -50px; left: 50%; transform: translateX(-50%);
  width: 100%; height: 60%;
  /* Subtle top lighting */
  background: radial-gradient(ellipse at center, rgba(255, 200, 100, 0.2) 0%, transparent 70%);
  pointer-events: none; z-index: 1;
}

/* --- NEW: GLOSS REFLECTION (The "Wet" Look) --- */
.gloss-reflection {
  position: absolute; top: 0; left: 0; width: 100%; height: 30%;
  /* Sharp glass reflection */
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255,255,255,0.02) 40%, transparent 100%);
  border-top: 1px solid rgba(255,255,255,0.5);
  border-radius: 12px 12px 0 0;
  pointer-events: none; z-index: 5;
}

/* Improve Symbol Depth */



</style>