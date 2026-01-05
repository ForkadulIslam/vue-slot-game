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
const SPECIAL_SYMBOLS = ['scatter1', 'scatter2'];


const emit = defineEmits(['multiplier-triggered']);


const props = defineProps({
  winParticlesRef: {
    type: Object,
    default: null
  },
  epicWinRef: {
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

const reelsSymbolHeight = 90;
const reelsContainerWidth = 390; // from CSS
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
const lanternGlow = ref(null);



// Ensure refs are cleared before each update to prevent memory leaks
onBeforeUpdate(() => {
  reelElements.value = [];
  winLineElements.value = [];
});

onMounted(() => {

  // --- NEW: Lantern Flicker Effect ---
  if (lanternGlow.value) {
    // Warm, fire-like pulse
    gsap.to(lanternGlow.value, {
      opacity: 0.6,
      duration: 0.2,
      yoyo: true,
      repeat: -1,
      ease: "rough({ strength: 1, points: 20, taper: 'none', randomize: true })"
    });
  }


});




// --- FIX 1: TEST ANIMATION SAFELY ---
// Watch for the prop to become available, THEN play the test
// watch(() => props.epicWinRef, (newVal) => {
//   if (newVal) {
//     console.log("Epic Win Ref connected. Playing Test...");
//     newVal.playEpicWin(1200); // Uncomment this line to test on load
//
//   }
// });


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

// --- SPIN LOGIC ---
watch(isSpinning, (spinning) => {

  if (spinning) {



    // --- SPIN START ---
    displayedWinAmount.value = 0;

    const reelsEl = document.querySelectorAll('.reel');
    const finalOutcome = outcome.value.reelsSymbols;
    const symbolHeight = reelsSymbolHeight;
    const reelAnimationDuration = 1.2;
    reelsEl.forEach((reel, reelIndex) => {
      const finalSymbols = finalOutcome[reelIndex];
      const finalSymbolElements = finalSymbols.map(s => createSymbolElement(s));
      const startingSymbolElements = Array.from(reel.children);

      const randomSymbolElements = [];
      const symbolKeys = Object.keys(symbolPaths).filter(k => k !== 'gold_coin');
      for (let k = 0; k < 10; k++) {
        randomSymbolElements.push(createSymbolElement(symbolKeys[Math.floor(Math.random() * symbolKeys.length)]));
      }

      reel.innerHTML = '';
      reel.append(...finalSymbolElements, ...randomSymbolElements, ...startingSymbolElements);

      const spinContentHeight = (finalSymbolElements.length + randomSymbolElements.length) * symbolHeight;
      gsap.set(reel, { y: -spinContentHeight,force3D: true, });

      //gsap.ticker.fps(60);

      gsap.to(reel, {
        y: 0,
        duration: reelAnimationDuration,
        delay: reelIndex * 0.15, // Stagger
        ease: "back.out(0.4)",   // Bouncy stop
        force3D: true,
        onComplete: () => {
          const finalClones = finalSymbolElements.map(s => s.cloneNode(true));
          reel.innerHTML = '';
          reel.append(...finalClones);
          if (reelIndex === reelsEl.length - 1) {
            finishSpin();
          }
        }
      });
    });
  } else {
    // --- SPIN END ---

    // Use nextTick to ensure the DOM has updated with the final symbols before checking for wins.
    nextTick(async () => {
      // if (props.epicWinRef) {
      //   props.epicWinRef.playEpicWin(1500); // Trigger manually here based on logic
      //   return;
      // }


      // if(props.winParticlesRef && props.winParticlesRef.playEpicWin) {
      //   await props.winParticlesRef.playEpicWin();
      // }
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

            // if(props.winParticlesRef && props.winParticlesRef.coinFlooding) {
            //   await props.winParticlesRef.coinFlooding(100);
            // }

            if (hasScatterWins) {
              //playScatterWinSequence();
            }
          }
        });
        winningPaylines.value.forEach((line, index) => {
          const lineComponent = winLineElements.value[index];
          if (!lineComponent) return;

          let multiplier = 1+index;

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
              //Test trigger multiplier fly animation
              emit('multiplier-triggered', multiplier);
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
  margin: 20px 0 30px 0
}




.reels-container {
  position: relative;
  width: 390px;
  height: 360px;
  overflow: hidden;

  border-radius: 14px;
  display: flex;
  justify-content: space-between;

  /* BACKGROUND CHANGE:
     Make it nearly opaque (95%) and darker at edges.
     This blocks the background image from distracting the eye.
  */

  /* FRAME: Thicker, more physical look */
  border: 3px solid #8d6e63; /* Bronze */
  border-bottom: 5px solid #3e2723; /* Heavy bottom lip */

  /* SEPARATION: Massive shadow to lift it off the forest floor */
  box-shadow:
          0 0 0 2px #1a0b00, /* Outer dark rim */
          0 30px 60px rgba(0,0,0,0.9), /* Heavy Drop Shadow */
          inset 0 0 40px rgba(0,0,0,0.8); /* Inner depth */

  contain: layout paint;
  z-index: 2;
}

.reels-container::before,
.reels-container::after {
  content: "";
  position: absolute;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 10;
  border-radius: 16px;
}


/* Gold Corner Accents */
.reels-container::before {
  box-shadow:
          inset 1px 1px 0 rgba(255, 215, 0, 0.4),  /* Top Left Gold glint */
          inset -1px -1px 0 rgba(255, 215, 0, 0.2); /* Bottom Right faint glint */
}

/* --- OVERLAYS --- */
.lantern-glow {
  position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
  width: 100%; height: 70%;
  /* Warm "God Ray" casting down */
  background: radial-gradient(ellipse at center, rgba(255, 160, 50, 0.2) 0%, transparent 70%);
  pointer-events: none; z-index: 20;
  mix-blend-mode: screen;
}

.gloss-reflection {
  position: absolute; top: 0; left: 0; width: 100%; height: 40%;
  /* Sharp glass reflection */
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 30%, transparent 100%);
  border-radius: 12px 12px 0 0;
  pointer-events: none; z-index: 20;
}



/* --- WIN OVERLAYS --- */
.win-lines-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 20;
}
.win-amount-container {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 20;
}

</style>

<style>
  .reel {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    box-sizing: border-box;
    z-index: 2;

    /* GAP: Dark gaps between reels instead of lines */
    border-right: 1px solid rgba(0, 0, 0, 0.8);
    border-left: 1px solid rgba(255, 255, 255, 0.05); /* Highlight on left edge */

    /* CYLINDER SHADING: Dark sides, lighter center */
    background: linear-gradient(
            to right,
            rgba(0,0,0,0.8) 0%,
            rgba(40, 30, 40, 0.4) 20%, /* Slight color tint */
            transparent 50%,
            rgba(40, 30, 40, 0.4) 80%,
            rgba(0,0,0,0.8) 100%
    );

    will-change: transform;
    transform: translate3d(0,0,0);
  }

  .reel:last-child {
    border-right: none;
  }

  .symbol {
    width: 70px;
    height: 90px;
    /* background: radial-gradient(circle, #4a4a4a 0%, #2c2c2c 100%);
    box-shadow: inset 0 0 10px rgba(0,0,0,0.7); */
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0; /* Prevent symbols from shrinking */
    position: relative;
    will-change: transform;
    transform: translateZ(0);
    overflow: visible; /* Allow special symbols to glow outside */
  }

  .symbol-icon {

    width: 153px;
    height: 136px;

    background-image: url('@/assets/images/symbols_sprite.png');
    background-repeat: no-repeat;

    position: absolute;
    top: 50%;
    left: 50%;

    /* Zoom in slightly and center */
    transform: translate(-50%, -50%) scale(0.50);
    transform-origin: center center;

    will-change: transform;

    transition: filter 0.3s;
  }

  /* Special Symbol Highlight */
  .symbol-icon.is-special {
    /* Slightly larger */
    transform: translate(-50%, -50%) scale(0.50);
    z-index: 10;
    /* Gold Glow */
    /* filter: brightness(1.2) drop-shadow(0 0 8px rgba(255, 180, 0, 0.6)); */
  }

  /* SPRITE POSITIONS */
  /* Low Value */
  .icon-diamond { background-position: -28px 1px }
  .icon-heart   { background-position: -153px 0 }
  .icon-club    { background-position: -306px 0 }
  .icon-spade   { background-position: -428px -1px }
  .icon-K       { background-position: -35px -120px }
  .icon-Q       { background-position: -172px -118px }
  .icon-J       { background-position: -302px -120px }
  .icon-A       { background-position: -427px -118px }

  /* High Value (These will get the is-special class) */
  .icon-scatter { background-position: -33px -247px }
  .icon-bonus   { background-position: -163px -242px }
  .icon-wild    { background-position: -295px -242px }
  .icon-777     { background-position: -459px -272px }

  /* --- ANIMATIONS --- */
  @keyframes sheen-sweep {
    0% { transform: translateX(-150%) skewX(-25deg); }
    100% { transform: translateX(150%) skewX(-25deg); }
  }

  @keyframes pulse-pop {
    0% { transform: translate(-50%, -50%) scale(0.75); }
    50% { transform: translate(-50%, -50%) scale(0.82); } /* Pop bigger */
    100% { transform: translate(-50%, -50%) scale(0.75); }
  }


  /* The Box holds the icon and the sheen */
  .symbol-box {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden; /* Contains the sheen sweep */
    border-radius: 8px; /* Slight rounding */
  }

  /* --- THE SHEEN EFFECT (Light Sweep) --- */
  /*.symbol-box.shine-effect::after {*/
  /*  content: "";*/
  /*  position: absolute;*/
  /*  top: 0;*/
  /*  left: 0;*/
  /*  width: 100%;*/
  /*  height: 100%;*/
  /*  !* The white bar of light *!*/
  /*  background: linear-gradient(*/
  /*          90deg,*/
  /*          rgba(255,255,255,0) 0%,*/
  /*          rgba(255, 255, 255, 0.4) 50%,*/
  /*          rgba(255,255,255,0) 100%*/
  /*  );*/
  /*  !* Start hidden to the left *!*/
  /*  transform: translateX(-150%) skewX(-25deg);*/
  /*  !* Sweep across every 3 seconds *!*/
  /*  animation: sheen-sweep 3s ease-in-out;*/
  /*  pointer-events: none;*/
  /*  z-index: 10;*/
  /*}*/


</style>