<template>
  <div class="slot-machine" ref="slotMachineEl">
    
    <div ref="reelsContainer" class="reels-container">,
      <!-- NEW: Ambient Lantern Glow (Animated via GSAP) -->
      <div class="lantern-glow" ref="lanternGlow"></div>
      
      <!-- NEW: Static Gloss Reflection -->
      <div class="gloss-reflection"></div>
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
  margin-bottom: 20px; /* Space between reels and stone control panel */
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
    height: 260px;
    justify-content: flex-start;
    overflow: hidden;
    position: relative; /* Needed for overlays */
    border-radius: 12px;
    
    /* 1. Dark Glass Background */
    background: linear-gradient(
      to bottom, 
      rgba(20, 10, 10, 0.7) 0%, 
      rgba(10, 5, 5, 0.85) 100%
    );
    
    /* 2. Gold/Bronze Border with glow */
    border: 2px solid rgba(255, 180, 50, 0.3);
    box-shadow: 
      0 0 15px rgba(0, 0, 0, 0.9),  /* Deep shadow behind */
      inset 0 0 20px rgba(0, 0, 0, 0.8), /* Inner shadow for depth */
      0 0 5px rgba(255, 160, 0, 0.2); /* Subtle outer glow */
      
    /* 3. Blur the forest behind the reels */
    backdrop-filter: blur(4px); 
}

.reel{
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
  z-index: 2; /* Ensure symbols are above the glow */
  
  /* Vertical separation lines */
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 1px solid rgba(0, 0, 0, 0.3);
  
  /* Cylinder effect on the strip */
  background: linear-gradient(
    to right, 
    rgba(0,0,0,0.4) 0%, 
    transparent 30%, 
    transparent 70%, 
    rgba(0,0,0,0.4) 100%
  );
}

.reel:last-child {
  border-right: none;
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

/* --- NEW: LANTERN GLOW OVERLAY --- */
.lantern-glow {
  position: absolute;
  top: -50px; /* Position near the top center */
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 80%;
  background: radial-gradient(
    circle at 50% 0%, 
    rgba(255, 140, 0, 0.4) 0%, /* Warm Orange center */
    rgba(255, 100, 0, 0.1) 40%, 
    transparent 70%
  );
  pointer-events: none;
  z-index: 1; /* Behind symbols */
  opacity: 0.3; /* Base opacity */
  mix-blend-mode: screen; /* Blends nicely with dark bg */
}

/* --- NEW: GLOSS REFLECTION (The "Wet" Look) --- */
.gloss-reflection {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 35%; /* Top third only */
  
  /* Stronger white gradient at the top center to match the lantern */
  background: linear-gradient(
    180deg, 
    rgba(255, 255, 255, 0.4) 0%, /* Bright highlight edge */
    rgba(255, 215, 0, 0.1) 20%,   /* Hint of gold reflection */
    transparent 100%
  );
  
  /* Creates the "curved glass" shape */
  border-radius: 10px 10px 100% 100% / 10px 10px 20px 20px; 
  
  /* Add a "hotspot" reflection in the center */
  box-shadow: inset 0 10px 20px -5px rgba(255, 255, 255, 0.3);
  
  pointer-events: none;
  z-index: 5;
}

/* Improve Symbol Depth */
.symbol img {
  width: 70%;
  /* Make symbols pop off the screen */
  filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.6));
  transition: transform 0.1s;
}


</style>