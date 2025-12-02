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
import { computed, ref, watch, onBeforeUpdate, nextTick, onMounted, onUnmounted } from 'vue';
import { gsap } from 'gsap';
import * as PIXI from 'pixi.js';
import Reel from './Reel.vue';
import WinLine from './WinLine.vue';
import { useSlotGame } from '../composables/useSlotGame';
import celebrationGif from '../assets/images/celebration_mystrybox.gif';
import particleTextureUrl from '../assets/images/symblos/celebration/coin_particlejpg.jpg';

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

let app = null;
let particles = [];
let particleTexture = null;


// Ensure refs are cleared before each update to prevent memory leaks
onBeforeUpdate(() => {
  reelElements.value = [];
  winLineElements.value = [];
});

// --- PARTICLE SYSTEM ---
class Particle {
  constructor(x, y, texture, config) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.position.set(x, y);
    
    const startScale = config.size / 100;
    this.sprite.scale.set(startScale);
    this.sprite.alpha = 1;
    
    this.startColor = hexToNumber(config.startColor);
    this.endColor = hexToNumber(config.endColor);
    this.sprite.tint = this.startColor;
    
    const speed = 6 + Math.random() * 4;
    const angle = Math.random() * Math.PI * 2;
    
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed - 2
    };
    
    this.gravity = config.gravity;
    this.friction = 0.95 + Math.random() * 0.04;
    this.rotationSpeed = (Math.random() - 0.5) * 0.15;
    this.scaleSpeed = 0.005 + Math.random() * 0.005;
    this.targetScale = startScale * (1.5 + Math.random() * 0.5);
    this.life = 1.0;
    this.alphaSpeed = 0.005 + Math.random() * 0.005; // Slower fade for longer life
    this.config = config;
  }
  
  update() {
    this.velocity.y += this.gravity;
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    
    this.sprite.x += this.velocity.x;
    this.sprite.y += this.velocity.y;
    this.sprite.rotation += this.rotationSpeed;
    
    if (this.sprite.scale.x < this.targetScale) {
      this.sprite.scale.x += this.scaleSpeed;
      this.sprite.scale.y += this.scaleSpeed;
    }
    
    this.life -= this.alphaSpeed;
    this.sprite.alpha = Math.max(0, this.life);
    
    const t = 1 - this.life;
    const color = interpolateColor(this.startColor, this.endColor, t);
    this.sprite.tint = color;
    
    return this.life > 0;
  }
}

const hexToNumber = (hex) => {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (r << 16) | (g << 8) | b;
};

const interpolateColor = (color1, color2, factor) => {
  const r1 = (color1 >> 16) & 0xff;
  const g1 = (color1 >> 8) & 0xff;
  const b1 = color1 & 0xff;
  const r2 = (color2 >> 16) & 0xff;
  const g2 = (color2 >> 8) & 0xff;
  const b2 = color2 & 0xff;
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  return (r << 16) | (g << 8) | b;
};

const createParticleBurst = (x, y, count) => {
    if (!particleTexture) return;
    const config = {
        size: 5,
        startColor: '#ffcc00',
        endColor: '#ff6600',
        gravity: 0.2
    };
    for (let i = 0; i < count; i++) {
        const particle = new Particle(x, y, particleTexture, config);
        particles.push(particle);
        app.stage.addChild(particle.sprite);
    }
};

// --- END PARTICLE SYSTEM ---

// --- PARTICLE SYSTEM ---
class Particle {
  constructor(x, y, texture, config) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.position.set(x, y);
    
    const startScale = config.size / 100;
    this.sprite.scale.set(startScale);
    this.sprite.alpha = 1;
    
    this.startColor = hexToNumber(config.startColor);
    this.endColor = hexToNumber(config.endColor);
    this.sprite.tint = this.startColor;
    
    const speed = 6 + Math.random() * 4;
    const angle = Math.random() * Math.PI * 2;
    
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };
    
    this.gravity = config.gravity;
    this.friction = 0.97 + Math.random() * 0.02;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.life = 1.0;
    this.alphaSpeed = 0.005 + Math.random() * 0.005; // Slower fade for longer life
  }
  
  update() {
    this.velocity.y += this.gravity;
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    
    this.sprite.x += this.velocity.x;
    this.sprite.y += this.velocity.y;
    this.sprite.rotation += this.rotationSpeed;
    
    this.life -= this.alphaSpeed;
    this.sprite.alpha = Math.max(0, this.life);
    
    const t = 1 - this.life;
    const color = interpolateColor(this.startColor, this.endColor, t);
    this.sprite.tint = color;
    
    return this.life > 0;
  }
}

const hexToNumber = (hex) => {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (r << 16) | (g << 8) | b;
};

const interpolateColor = (color1, color2, factor) => {
  const r1 = (color1 >> 16) & 0xff;
  const g1 = (color1 >> 8) & 0xff;
  const b1 = color1 & 0xff;
  const r2 = (color2 >> 16) & 0xff;
  const g2 = (color2 >> 8) & 0xff;
  const b2 = color2 & 0xff;
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  return (r << 16) | (g << 8) | b;
};

const createParticleBurst = (x, y, count) => {
    if (!particleTexture) return;
    const config = {
        size: 10,
        startColor: '#ffdd77',
        endColor: '#ff8800',
        gravity: 0.1
    };
    for (let i = 0; i < count; i++) {
        const particle = new Particle(x, y, particleTexture, config);
        particles.push(particle);
        app.stage.addChild(particle.sprite);
    }
};
// --- END PARTICLE SYSTEM ---

onMounted(async () => {
  if (slotMachineEl.value) {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '10';

    slotMachineEl.value.appendChild(canvas);

    app = new PIXI.Application();
    await app.init({
      canvas: canvas,
      width: slotMachineEl.value.clientWidth,
      height: slotMachineEl.value.clientHeight,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });

    particleTexture = await PIXI.Assets.load(particleTextureUrl);
    
    // Adjust lighting position to be relative to the new canvas size
    const reelsContainerRect = reelsContainer.value.getBoundingClientRect();
    const slotMachineRect = slotMachineEl.value.getBoundingClientRect();
    const offsetX = reelsContainerRect.x - slotMachineRect.x;
    
    const adjustedLightX = offsetX + reelsContainerWidth / 2;

    createReelsLighting(app, adjustedLightX);

    // Main particle update loop
    app.ticker.add(() => {
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        if (!particle.update()) {
          app.stage.removeChild(particle.sprite);
          particles.splice(i, 1);
        }
      }
    });
  }
});

onUnmounted(() => {
    if (app) {
        app.destroy(true, true);
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
    gsap.to(vignetteOverlay.value, { opacity: 0, duration: 0.5 });
    gsap.to(reelsContainer.value, { filter: 'blur(0px)', duration: 0.5 });
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
    nextTick(() => {
      const hasLineWins = winningPaylines.value.length > 0;
      const hasScatterWins = winningScatters.value.length > 0;

      if (hasLineWins) {
        const masterTimeline = gsap.timeline({
          onComplete: () => {
            if (hasScatterWins) {
              console.log('Scatter win, Sequence start...')
            }
          }
        });

        let cumulativeWin = 0;

        winningPaylines.value.forEach((line) => {
          const lineComponent = winLineElements.value.find(c => c && c.lineId === line.lineId);
          if (!lineComponent) return;
          
          const lineTimeline = gsap.timeline();

          // 1. Draw the line
          lineTimeline.add(() => {
            lineComponent.playAnimation();
          }, 0)

          // Animate win amount
          .add(() => {
            cumulativeWin += line.winAmount;
            gsap.to(displayedWinAmount, { 
              value: cumulativeWin, 
              duration: 0.5, 
              ease: 'power1.out'
            });
          }, 0.2)
          
          // 2. Darken screen
          .to(vignetteOverlay.value, { opacity: 0.8, duration: 0.5 }, 0.5)
          .to(reelsContainer.value, { filter: 'blur(3px)', duration: 0.5 }, 0.5)

          // 3. Particle Burst from center
          .add(() => {
            if (app) {
              createParticleBurst(app.screen.width / 2, app.screen.height / 2, 200);
            }
          }, 0.7)

          // 4. Wait for particles and restore screen
          .to(vignetteOverlay.value, { opacity: 0, duration: 0.7 }, "+=2.5") // Wait 2.5s for particles to fade
          .to(reelsContainer.value, { filter: 'blur(0px)', duration: 0.7 }, "-=0.7")

          // 5. Hide the line
          .add(() => {
              if (lineComponent.pathElement) {
                  gsap.to(lineComponent.pathElement, { opacity: 0, duration: 0.3 });
              }
          });

          masterTimeline.add(lineTimeline);
        });

      } else if (hasScatterWins) {
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