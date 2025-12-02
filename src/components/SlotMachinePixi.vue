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
import { computed, ref, watch, onBeforeUpdate, nextTick, defineProps } from 'vue';
import { gsap } from 'gsap';
import Reel from './Reel.vue';
import WinLine from './WinLine.vue';
import { useSlotGame } from '../composables/useSlotGame';
import celebrationGif from '../assets/images/celebration_mystrybox.gif';

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

function playScatterWinSequence() {
    const allSymbolElements = Array.from(reelsContainer.value.querySelectorAll('.symbol'));
    const scatterSymbolElements = [];
    const scatterIndices = winningScatters.value.map(pos => pos.reel * reelsSymbolsNumber.value + pos.row);
    
    const otherSymbolElements = allSymbolElements.filter((el, index) => {
        if (scatterIndices.includes(index)) {
            scatterSymbolElements.push(el);
            return false;
        }
        return true;
    });

    if (scatterSymbolElements.length === 0) return;

    setWinAnimationPlaying(true);
    
    // --- Reset states before animation ---
    gsap.set(gifContainer.value, { display: 'none', scale: 1, opacity: 1 });
    gsap.set(vignetteOverlay.value, { opacity: 0 });
    gsap.set(slotMachineEl.value, { scale: 1, rotation: 0, z: 0 });
    gsap.set(reelsContainer.value, { filter: 'none' });
    winMessageContainer.value.innerHTML = '';
    
    // Clear any existing coins
    if (coinContainer.value) coinContainer.value.innerHTML = '';

    const masterTimeline = gsap.timeline({
      onComplete: () => {
        gsap.to(slotMachineEl.value, { scale: 1, duration: 0.5, ease: 'power2.inOut' });
        gsap.set(otherSymbolElements, { opacity: 1, filter: 'none' });
        gsap.set(reelsContainer.value, { filter: 'none' });
        gsap.set(gifContainer.value, { display: 'none' });
        if (coinContainer.value) coinContainer.value.innerHTML = '';
        if (winMessageContainer.value) winMessageContainer.value.innerHTML = '';
        setWinAnimationPlaying(false);
      }
    });

    // --- PHASE 1: ANTICIPATION & BUILD-UP (0-1.5s) ---
    masterTimeline
      .to(vignetteOverlay.value, { 
        opacity: 0.8, 
        duration: 0.6, 
        ease: 'power2.in' 
      }, 0)
      .to(slotMachineEl.value, { 
        scale: 1.1, 
        rotation: -0.5, 
        z: 30, 
        duration: 1.2, 
        ease: 'power2.inOut' 
      }, 0)
      .to(otherSymbolElements, { 
        opacity: 0.05, 
        filter: 'blur(8px) grayscale(0.8)', 
        duration: 0.6 
      }, 0)
      .to(reelsContainer.value, { 
        filter: 'brightness(2) contrast(1.5)', 
        duration: 0.08, 
        repeat: 8, 
        yoyo: true 
      }, 0)
      .call(() => {
        // Low frequency rumble sound
        sounds.explosion.play();
      }, null, 0.2);

    // --- Scatter Symbol Pulse Effect ---
    scatterSymbolElements.forEach((symbol, index) => {
      masterTimeline.to(symbol, {
        scale: 1.5,
        duration: 0.3,
        ease: 'power2.out',
        repeat: 2,
        yoyo: true
      }, 0.3 + (index * 0.1));
    });

    // --- PHASE 2: EXPLOSIVE RELEASE (1.5-3s) ---
    masterTimeline
      .call(() => {
        // Big explosion sound
        sounds.explosion.play();
        
        // Screen flash
        gsap.to(reelsContainer.value, {
          filter: 'brightness(5)',
          duration: 0.1,
          yoyo: true,
          repeat: 1
        });
      }, null, 1.5);

    // Scatter symbols explode outwards with staggered timing
    scatterSymbolElements.forEach((symbol, index) => {
      const angle = (index / scatterSymbolElements.length) * Math.PI * 2;
      const distance = 100 + Math.random() * 50;
      
      masterTimeline.to(symbol, {
        x: `+=${Math.cos(angle) * distance}`,
        y: `+=${Math.sin(angle) * distance}`,
        scale: 3,
        rotation: 'random(-360, 360)',
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, 1.5 + (index * 0.05));
    });

    // --- PHASE 3: CELEBRATION REVEAL (3-4s) ---
    masterTimeline
      .set(gifContainer.value, { display: 'flex', scale: 0.3, rotation: -180 }, 2.8)
      .to(gifContainer.value, { 
        scale: 1.3, 
        rotation: 0,
        duration: 1.2, 
        ease: 'elastic.out(1.2, 0.6)' 
      }, 3.0)
      .call(() => {
        // Massive particle explosion from center
        const center = { 
          x: reelsContainer.value.offsetWidth / 2, 
          y: reelsContainer.value.offsetHeight / 2 
        };
        createJiliStyleExplosion(center);
      }, null, 3.2);

    // --- PHASE 4: AWARD REVEAL (4-6s) ---
    masterTimeline
      .call(() => {
        createExcitingCounterAnimation();
      }, null, 4.0)
      .to(gifContainer.value, { 
        opacity: 0, 
        scale: 1.8, 
        rotation: 15,
        duration: 1.2, 
        ease: 'power2.in' 
      }, 5.0);

    // --- PHASE 5: GRAND FINALE & CLEANUP (6-7s) ---
    masterTimeline
      .to(vignetteOverlay.value, { 
        opacity: 0, 
        duration: 1.0 
      }, 6.0)
      .to(slotMachineEl.value, { 
        scale: 1, 
        rotation: 0, 
        z: 0, 
        duration: 1.0, 
        ease: 'expo.out' 
      }, 6.0);
}

function createJiliStyleExplosion(origin) {
    const colors = ['#FFD700', '#FFA500', '#FF6B00', '#FF0000', '#FFFFFF'];
    
    // Wave 1: Golden Coins with realistic physics
    for (let i = 0; i < 80; i++) {
        const coin = document.createElement('div');
        coin.classList.add('coin');
        coinContainer.value.appendChild(coin);
        
        const size = 12 + Math.random() * 18;
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 120;
        const duration = 1.2 + Math.random() * 1.0;
        
        gsap.set(coin, {
            x: origin.x,
            y: origin.y,
            width: `${size}px`,
            height: `${size}px`,
            rotation: Math.random() * 360
        });
        
        gsap.to(coin, {
            x: origin.x + Math.cos(angle) * distance,
            y: origin.y + Math.sin(angle) * distance,
            rotation: '+=random(-720, 720)',
            scale: 0,
            opacity: 0,
            duration: duration,
            ease: 'power3.out',
            delay: Math.random() * 0.3,
            onComplete: () => coin.remove()
        });
    }
    
    // Wave 2: Sparkling Glitter
    for (let i = 0; i < 60; i++) {
        const glint = document.createElement('div');
        glint.classList.add('glint');
        coinContainer.value.appendChild(glint);
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 3 + Math.random() * 8;
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        
        gsap.set(glint, {
            x: origin.x,
            y: origin.y,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            boxShadow: `0 0 ${size}px ${size}px ${color}`
        });
        
        gsap.to(glint, {
            x: origin.x + Math.cos(angle) * distance,
            y: origin.y + Math.sin(angle) * distance,
            scale: 0,
            opacity: 0,
            duration: 0.8 + Math.random() * 0.5,
            ease: 'power2.out',
            delay: 0.2 + Math.random() * 0.2,
            onComplete: () => glint.remove()
        });
    }
    
    // Wave 3: Light Beams - CORRECTED VERSION
    for (let i = 0; i < 12; i++) {
        const beam = document.createElement('div');
        beam.classList.add('light-beam');
        coinContainer.value.appendChild(beam);
        
        const angle = (i / 12) * Math.PI * 2;
        const length = 150 + Math.random() * 100;
        
        gsap.set(beam, {
            x: origin.x,
            y: origin.y,
            width: '4px',
            height: '0px',
            background: `linear-gradient(to top, transparent, gold, transparent)`,
            rotation: (angle * 180) / Math.PI,
            transformOrigin: 'center bottom'
        });
        
        // Create a timeline for the beam animation
        const beamTimeline = gsap.timeline({
            onComplete: () => beam.remove()
        });
        
        beamTimeline
            .to(beam, {
                height: `${length}px`,
                duration: 0.6,
                ease: 'power2.out'
            })
            .to(beam, {
                opacity: 0,
                duration: 0.4,
                ease: 'power2.in'
            }, '-=0.2'); // Start opacity fade 0.2 seconds before height animation completes
    }
}

function createExcitingCounterAnimation() {
    const counter = { value: 0 };
    const finalValue = scatterWinAmount.value || 20;
    const countEl = document.createElement('div');
    countEl.classList.add('win-counter');
    winMessageContainer.value.appendChild(countEl);

    // Background glow effect
    const glowEl = document.createElement('div');
    glowEl.classList.add('win-glow');
    winMessageContainer.value.appendChild(glowEl);

    const counterTL = gsap.timeline();
    
    // Number roll with exciting effects
    counterTL.to(counter, {
        value: finalValue,
        duration: 2.0,
        ease: 'power2.out',
        onUpdate: () => {
            const currentValue = Math.floor(counter.value);
            countEl.innerHTML = `<span class="win-number">${currentValue.toLocaleString()}</span>`;
            
            // Pulse effect on number change
            if (Math.floor(counter.value) !== Math.floor(counter.value - 1)) {
                gsap.to(countEl.querySelector('.win-number'), {
                    scale: 1.3,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1
                });
            }
        },
        onComplete: () => {
            // Final celebration when counter completes
            gsap.to(countEl.querySelector('.win-number'), {
                scale: 1.5,
                duration: 0.3,
                yoyo: true,
                repeat: 2,
                ease: 'power2.inOut'
            });
            
            // Confetti burst
            createConfettiBurst();
        }
    });

    // Background glow animation
    counterTL.to(glowEl, {
        scale: 1.5,
        opacity: 0.8,
        duration: 1.0,
        ease: 'power2.inOut'
    }, 0).to(glowEl, {
        scale: 1.2,
        opacity: 0.4,
        duration: 1.0,
        ease: 'power2.inOut'
    }, 1.0);
}

function createConfettiBurst() {
    const confettiCount = 50;
    const colors = ['#FFD700', '#FF6B00', '#FF0000', '#00FF00', '#0099FF', '#FF00FF'];
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        coinContainer.value.appendChild(confetti);
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 6 + Math.random() * 8;
        const angle = Math.random() * Math.PI * 2;
        const distance = 60 + Math.random() * 90;
        
        gsap.set(confetti, {
            x: reelsContainer.value.offsetWidth / 2,
            y: reelsContainer.value.offsetHeight / 2,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            rotation: Math.random() * 360
        });
        
        gsap.to(confetti, {
            x: `+=${Math.cos(angle) * distance}`,
            y: `+=${Math.sin(angle) * distance + 50}`, // Slight downward bias
            rotation: '+=random(-360, 360)',
            opacity: 0,
            duration: 1.5 + Math.random() * 0.5,
            ease: 'power2.out',
            delay: Math.random() * 0.3,
            onComplete: () => confetti.remove()
        });
    }
}




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
        setWinAnimationPlaying(true);

        const allSymbolElements = Array.from(reelsContainer.value.querySelectorAll('.symbol'));

        const masterTimeline = gsap.timeline({
          onComplete: () => {
            // Final cleanup
            gsap.set(allSymbolElements, { opacity: 1, scale: 1, filter: 'none' });
            setWinAnimationPlaying(false);
            
            // If there are also scatter wins, play them after line wins
            if (hasScatterWins) {
              playScatterWinSequence();
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
        playScatterWinSequence();
      }

      // Temporarily trigger WinParticles for every spin completion for testing
      if (props.winParticlesRef && props.winParticlesRef.play) {
        props.winParticlesRef.play();
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