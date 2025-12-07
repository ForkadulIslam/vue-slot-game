<template>
  <div class="slot-machine" ref="slotMachineEl">
    
    <div ref="reelsContainer" class="reels-container">,
      
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

onMounted(() => {
  //playSheenAnimation();
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
            console.log('All Line win done');
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
          // lineTimeline.add(() => {
          //     console.log(lineComponent);
          //     if (lineComponent.pathElement) {
          //         gsap.killTweensOf(lineComponent.pathElement);
          //         gsap.to(lineComponent.pathElement, { opacity: 0, duration: 0.3 });
          //     }
          // }, '-=0.4');

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

<style>
.slot-machine {
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1000px;
  /* height: 380px; */
  border-radius: 20px 20px 0 0;
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


.reels-container {
    display: flex;
    width: 325px;
    overflow: hidden;
    background: radial-gradient(ellipse at 50% 30%, rgba(255,215,0,0.25) 0%, rgba(255,165,0,0.05) 100%);
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
  /* background: radial-gradient(circle, #4a4a4a 0%, #2c2c2c 100%);
  box-shadow: inset 0 0 10px rgba(0,0,0,0.7); */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden; /* Ensure images don't overflow */
  flex-shrink: 0; /* Prevent symbols from shrinking */
  position: relative;
}

.symbol img {
  width: 70%;
}



</style>