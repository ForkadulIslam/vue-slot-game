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
  </div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUpdate, nextTick, defineProps, onMounted, onUnmounted } from 'vue';
import { gsap } from 'gsap';
import Reel from './Reel.vue';
import { useSlotGame } from '../composables/useSlotGame';



// Define which symbols should "Pop"

const SPECIAL_SYMBOLS = ['s', 'w'];


const emit = defineEmits(['multiplier-triggered']);


const props = defineProps({
  winParticlesRef: {
    type: Object,
    default: null
  },
  epicWinRef: {
    type: Object,
    default: null
  },
  lineWinCelebrationRef: {
    type: Object,
    default: null
  },
  multiplierBarRef: {
    type: Object,
    default: null
  }
});

const {
  reelsForDisplay,
  symbolPaths,
  isSpinning,
  outcome,
  isAutoplaying,
  finishSpin,
  spin,
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
  updateBalanceFromOutcome,
  hasTriggeredFreeSpins,
  freeSpinsAvailable,
  freeSpinsTotal,
  isInFreeSpinSession,
  freeSpinTotalWin,
  multipliers
} = useSlotGame();


const currentMultiplierIndex = ref(0);


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
    
    gsap.to(lanternGlow.value, {
      opacity: 0.6,
      duration: 0.2,
      yoyo: true,
      repeat: -1,
      ease: "rough({ strength: 1, points: 20, taper: 'none', randomize: true })"
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

// ---FREE SPIN SESSION LOGIC ---
watch(isInFreeSpinSession, (isFreeSpinning, wasFreeSpinning) => {
  if (props.multiplierBarRef && props.multiplierBarRef.setFreeSpinsMode) {
    if (isAutoplaying.value) {
      isAutoplaying.value = false;
    }
    props.multiplierBarRef.setFreeSpinsMode(isFreeSpinning);
  }

  // When session ends
  if (wasFreeSpinning && !isFreeSpinning) {
    // Can do necessary clean up free spin states
  }
});

// --- SPIN LOGIC ---
watch(isSpinning, (spinning) => {

  if (spinning) {
    
    // --- SPIN START ---
    displayedWinAmount.value = 0;
    
    // For every spin (normal or free), reset the multiplier index to the start.
    currentMultiplierIndex.value = 0;
    emit('multiplier-triggered', multipliers.value[0]);


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
      
      const allSymbolElements = Array.from(reelsContainer.value.querySelectorAll('.symbol'));
      const hasLineWins = winningPaylines.value.length > 0;

      const scatterElements = [];
      outcome.value.reelsSymbols.forEach((reel, reelIndex) => {
        reel.forEach((symbolName, rowIndex) => {
          if (symbolName.toLowerCase() === 's') {
            // Calculate index (assuming 4 symbols per reel based on your Height*4 logic)
            const symbolIndex = reelIndex * 4 + rowIndex;
            if (allSymbolElements[symbolIndex]) {
              scatterElements.push(allSymbolElements[symbolIndex]);
            }
          }
        });
      });

      const masterTimeline = gsap.timeline({
          onComplete: () => {
              if (props.lineWinCelebrationRef){
                props.lineWinCelebrationRef.clearLineWinCelebration();
              }
              if(reelsContainer.value){
                reelsContainer.value.classList.remove('reels-dimmed');
              }
              setWinAnimationPlaying(false);
              gsap.set(allSymbolElements, { opacity: 1, scale: 1, filter: 'none' });
              if (!isInFreeSpinSession.value) {
                  updateBalanceFromOutcome();
              }
              displayedWinAmount.value



              if(outcome.value.shouldTriggerBigWinCelebration){
                console.log('Total win from free spins to be celebrated: ', freeSpinTotalWin.value);
                isAutoplaying.value = false;
                if (props.epicWinRef && props.epicWinRef.playEpicWin && freeSpinTotalWin.value > 0) {
                  gsap.delayedCall(0.5, () => {
                      props.epicWinRef.playEpicWin(freeSpinTotalWin.value);
                  });
                }
              }

              
              //REGULAR paid autoplay is active.
              if (isAutoplaying.value) {
                gsap.delayedCall(0.7, spin);
              }
          }
      });


      if (hasTriggeredFreeSpins.value) {
        //console.log(`%c FREE SPINS TRIGGERED! ${freeSpinsTotal.value} spins awarded!`, 'font-size: 20px; color: yellow; background: red; padding: 10px;');
        
        if (props.epicWinRef && props.epicWinRef.announceFreeSpinByModel) {
          await props.epicWinRef.announceFreeSpins(freeSpinsTotal.value);
        }

        if(hasLineWins){
          console.log(winningPaylines.value)
        }

        updateBalanceFromOutcome();
      }
      else if (hasLineWins) {
        setWinAnimationPlaying(true);
        let cumulativeWin = 0;

        // Dim the background reels once
        reelsContainer.value.classList.add('reels-dimmed');
        
        winningPaylines.value.forEach((line, index) => {
          const lineTimeline = gsap.timeline({
            onStart: async () => {
              sounds.winAlert.play();
              if (isInFreeSpinSession.value) {
                // Increment multiplier index if not at the end
                if (currentMultiplierIndex.value < multipliers.value.length - 1) {
                    currentMultiplierIndex.value++;
                }
                // Emit the corresponding multiplier VALUE
                emit('multiplier-triggered', multipliers.value[currentMultiplierIndex.value]);
              }

              if (props.lineWinCelebrationRef) {
                await props.lineWinCelebrationRef.celebrateLine(line, allSymbolElements);
              }
            },
            onComplete: () => {
              sounds.winAlert.stop();
            }
          });

          // Payoff counter
          lineTimeline.to(displayedWinAmount, {
              value: (cumulativeWin += line.winAmount),
              duration: 0.8,
              ease: 'power1.out'
          }, "+=0.3");

          // Hold the line on screen for the player
          

          masterTimeline.add(lineTimeline);
        });
      }
      else {
        // For non-line-win spins (including scatter-only and losing spins),
        // update the balance immediately. The multiplier was already reset at spin start.
        if(!isInFreeSpinSession.value) {
          updateBalanceFromOutcome();
        }


        if (scatterElements.length > 0) {
          gsap.to(scatterElements, {
            scale: 1.15,
            filter: 'brightness(2.5) drop-shadow(0 0 15px gold)',
            duration: 0.6,
            repeat: 2,
            yoyo: true,
            ease: "sine.inOut"
          });
          gsap.fromTo(scatterElements, 
            { rotation: -2 }, 
            { rotation: 2, duration: 0.05, repeat: -1, yoyo: true, ease: "none" }
          );
          await new Promise(r => setTimeout(r, 600));
        }

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
  border: 3px solid #8d6e63;
  border-bottom: 5px solid #3e2723;
  box-shadow:
          0 0 0 2px #1a0b00, 
          0 30px 60px rgba(0,0,0,0.9), 
          inset 0 0 40px rgba(0,0,0,0.8);

  contain: layout paint;
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

.reels-container::before {
  box-shadow:
          inset 1px 1px 0 rgba(255, 215, 0, 0.4),
          inset -1px -1px 0 rgba(255, 215, 0, 0.2);
}

/* --- OVERLAYS --- */
.lantern-glow {
  position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
  width: 100%; height: 70%;
  background: radial-gradient(ellipse at center, rgba(255, 160, 50, 0.2) 0%, transparent 70%);
  pointer-events: none; z-index: 20;
  mix-blend-mode: screen;
}

.gloss-reflection {
  position: absolute; top: 0; left: 0; width: 100%; height: 40%;
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

    background-image: url('@/assets/images/symbols_sprite.webp');
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


  .reels-container {
      transition: filter 0.5s ease;
  }

  /* This darkens the reels to make the Pixi Ghosts shine */
  .reels-dimmed {
      filter: brightness(0.4) saturate(0.9) contrast(1.2);
  }


</style>