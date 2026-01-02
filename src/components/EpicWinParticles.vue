<template>
  <transition name="zoom-fade">
    <div v-show="visible" class="epic-overlay" @click="skip">
      
      <!-- 1. PIXI LAYER -->
      <div ref="pixiContainer" class="pixi-layer"></div>

      <div class="content-box">
        <!-- Top Section: BIG/MEGA/EPIC text at the top -->
        <div class="win-label-top" :class="currentWinType" ref="labelRef">
          {{ currentWinLabel }}
        </div>

        <!-- Bottom Section: Amount below the shield -->
        <div class="win-amount-section" ref="amountSectionRef">
          <div class="win-amount">
            <span class="val">{{ formattedValue }}</span>
          </div>
        </div>

      </div>

    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, computed, defineExpose } from 'vue';
import { 
  Application, 
  Sprite, Assets, 
  ColorMatrixFilter,
  Container,
} from 'pixi.js';
import {
  shieldHelmet, 
  backgroundGlow
} from '../composables/particleConfigs';
import gsap from 'gsap';


// --- STATE ---
const pixiContainer = ref(null);
const visible = ref(false);
const currentWinLabel = ref('');
const currentWinType = ref('big'); // 'big', 'mega', 'epic'
const displayValue = ref(0);
const labelRef = ref(null);
const amountSectionRef = ref(null);

let targetHeroScale = 1;
let heroContainer = null;

let app = null;
let glowSprite = null;
let heroSprite = null;
let bloomLayer = null;

// --- PIXI SETUP ---
onMounted(async () => {
    if (!pixiContainer.value) return;

    app = new Application();
    // Use a high resolution for crisp assets on mobile
    await app.init({ 
        resizeTo: window, 
        backgroundAlpha: 0, 
        antialias: false, 
        resolution: Math.min(window.devicePixelRatio, 2), 
        autoDensity: true,
        autoStart: false 
    });
    pixiContainer.value.appendChild(app.canvas);

    // Load Assets
    const allTextures = [
      shieldHelmet,
      backgroundGlow
    ];
    const textures = await Assets.load(allTextures);

    // Glow background
    glowSprite = new Sprite(textures[backgroundGlow]);
    glowSprite.anchor.set(0.5);
    glowSprite.blendMode = 'add'; 
    glowSprite.alpha = 0;
    app.stage.addChild(glowSprite);

    // Setup Hero Container
    heroContainer = new Container();
    app.stage.addChild(heroContainer);

    // Load and create Hero Sprite
    heroSprite = new Sprite(textures[shieldHelmet]);
    heroSprite.anchor.set(0.5);
    heroContainer.addChild(heroSprite);

    // ⚡ ADD GLOSS: Contrast and Saturation boost
    const filter = new ColorMatrixFilter();
    heroSprite.filters = [filter];
    filter.brightness(1.1, true);
    filter.contrast(0.10, true);
    filter.saturate(0.2, true);

    // The Gloss Shimmer Layer
    bloomLayer = new Sprite(textures[shieldHelmet]);
    bloomLayer.anchor.set(0.5);
    bloomLayer.blendMode = 'add';
    bloomLayer.alpha = 0;
    heroContainer.addChild(bloomLayer);

    // Positioning Logic (Mobile Responsive)
    const updateLayout = () => {
        const cx = app.screen.width / 2;
        const cy = app.screen.height / 2;
        
        glowSprite.position.set(cx, cy);
        heroContainer.position.set(cx, cy);

        targetHeroScale = Math.min((app.screen.width * 0.7) / heroSprite.texture.width, 1);
        heroContainer.scale.set(targetHeroScale);
        glowSprite.scale.set(targetHeroScale * 1.5);
    };

    window.addEventListener('resize', updateLayout);
    updateLayout();

    app.ticker.add((ticker) => {
        if (visible.value && bloomLayer) {
            // Base rotation
            let speed = 0.005;
            
            // Increase rotation speed based on win type
            if (currentWinType.value === 'mega') speed = 0.015;
            if (currentWinType.value === 'epic') speed = 0.03;

            glowSprite.rotation += speed * ticker.deltaTime;

            // Make the shimmer "breath" faster as intensity grows
            let breathSpeed = currentWinType.value === 'epic' ? 0.008 : 0.003;
            bloomLayer.alpha = 0.2 + Math.sin(Date.now() * breathSpeed) * 0.15;
        }
    });
});

// Helper to format numbers with commas
const formattedValue = computed(() => {
    return Math.floor(displayValue.value).toLocaleString();
});

const playEpicWin = (totalWin) => {
    visible.value = true;
    app.start(); 

    // Reset State
    displayValue.value = 0;
    currentWinLabel.value = 'BIG';
    currentWinType.value = 'big';

    gsap.set(heroContainer.scale, { x: 0, y: 0 });
    gsap.set(glowSprite, { alpha: 0, scale: targetHeroScale, tint: 0xFFFFFF });
    gsap.set(bloomLayer, { alpha: 0 });

    const tl = gsap.timeline();

    // 1. INTRO (Shield Pop)
    tl.to(heroContainer.scale, { x: targetHeroScale, y: targetHeroScale, duration: 0.8, ease: "back.out(1.4)" });
    tl.add(() => triggerImpact('BIG', 'big'), 0.1);

    // 2. SEGMENT 1: BIG WIN (10s)
    tl.to(displayValue, {
        value: totalWin * 0.33,
        duration: 5,
        ease: "none"
    });

    // 3. SEGMENT 2: MEGA WIN (10s)
    tl.to(displayValue, {
        value: totalWin * 0.66,
        duration: 5,
        ease: "none",
        onStart: () => triggerImpact('MEGA', 'mega')
    });

    // 4. SEGMENT 3: EPIC WIN (10s)
    tl.to(displayValue, {
        value: totalWin,
        duration: 5,
        ease: "power2.out",
        onStart: () => triggerImpact('EPIC', 'epic')
    });
};

const triggerImpact = (label, type) => {
    currentWinLabel.value = `${label} WIN`;
    currentWinType.value = type;

    // 1. Text Impact
    gsap.fromTo(labelRef.value, 
        { scale: 3, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.5, ease: "power4.out" }
    );

    // Animate amount section (bottom of screen)
    gsap.fromTo(amountSectionRef.value,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
    );

    // Subtle screen shake
    gsap.fromTo(".content-box", { x: -8 }, { x: 8, duration: 0.05, repeat: 5, yoyo: true });
    
    // Pixi Environment scaling with intensity
    if (type === 'big') {
        gsap.to(glowSprite, { 
            alpha: 0.4, 
            tint: 0xFFF5E1, // Clean warm white
            scale: targetHeroScale * 1.3, 
            duration: 1 
        });
    } else if (type === 'mega') {
        gsap.to(glowSprite, { 
            alpha: 0.6, 
            tint: 0xFFD700, // Elegant gold
            scale: targetHeroScale * 1.6, 
            duration: 1.5 
        });
    } else if (type === 'epic') {
        gsap.to(glowSprite, { 
            alpha: 0.75, 
            tint: 0xFFE4B5, // Soft Moccasin (Light Gold)
            scale: targetHeroScale * 1.9, 
            duration: 1.5 
        });
        // Very subtle shimmer pulse
        gsap.to(bloomLayer, { alpha: 0.3, duration: 1 });
    }
};

const skip = () => {
    visible.value = false;
    app.stop();
};

defineExpose({ playEpicWin });
</script>

<style scoped>
/* 1. Import the Theme Font */
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@900&display=swap');

/* 2. Main Overlay Container */
.epic-overlay {
    position: fixed; 
    top: 0; 
    left: 0; 
    width: 100vw; 
    height: 100vh; 
    z-index: 9999;
    /* Dark radial gradient focuses the eye on the center shield */
    background: radial-gradient(circle at center, rgba(20, 20, 40, 0.85) 0%, rgba(0, 0, 0, 0.95) 100%); 
    display: flex; 
    justify-content: center; 
    align-items: center;
    overflow: hidden;
    will-change: opacity;
}

/* 3. Layout Structure */
.pixi-layer { 
    position: absolute; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%; 
    z-index: 1; 
}

.content-box { 
    position: relative; 
    z-index: 10; 
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between; /* Pushes Label to top, Amount to bottom */
    align-items: center;
    padding: 40px 20px;
    pointer-events: none; /* Allows clicks to pass through to the 'skip' function */
}

/* 4. UNIVERSAL TEXT VISIBILITY FIX 
   This ensures the thin Viking font is solid and readable on mobile.
*/
.win-label-top, .win-amount {
    font-family: 'Cinzel Decorative', cursive;
    text-transform: uppercase;
    font-weight: 900;
    text-align: center;
    line-height: 1;
    
    /* FIX: Provide a solid white base so transparency never looks 'hollow' */
    color: #ffffff; 

    /* FIX: Thick black outline to define the letters against the glow */
    -webkit-text-stroke: 2px #000000;
    paint-order: stroke fill;

    /* FIX: Bevel Effect - Layered shadows create a chiseled 3D look */
    text-shadow: 
        0 2px 0 #000, 
        0 4px 0 rgba(0,0,0,0.6),
        0 8px 20px rgba(0,0,0,0.9);
}

/* 5. TOP LABEL (BIG / MEGA / EPIC) */
.win-label-top {
    font-size: clamp(3.5rem, 15vw, 7.5rem);
    letter-spacing: 6px;
    margin-top: 5vh;
    will-change: transform, filter, opacity;
}

/* 6. BOTTOM AMOUNT SECTION */
.win-amount-section {
    margin-bottom: 8vh;
    will-change: transform, opacity;
}

.win-amount {
    font-family: 'Cinzel Decorative', cursive;
    font-size: clamp(4rem, 15vw, 8rem);
    color: #ffffff; /* Solid white fallback */
    /* Strong stroke is vital for readability */
    -webkit-text-stroke: 1.5px #000;
    paint-order: stroke fill;
    text-shadow: 0 5px 15px rgba(0,0,0,0.9);
}

.val {
    /* ⚡ BRIGHT SILVER: No dark grays. High-contrast white to silver */
    background: linear-gradient(to bottom, #ffffff 0%, #f0f0f0 45%, #aaaaaa 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

/* --- 7. THEME PROGRESSION CLASSES --- */

/* BIG WIN: Weathered Silver/Steel */
.win-label-top.big {
    background: linear-gradient(to bottom, #ffffff 0%, #dcdcdc 50%, #777777 100%);
    -webkit-background-clip: text;
    background-clip: text;
}

/* MEGA WIN: Hammered Royal Gold */
.win-label-top.mega {
    background: linear-gradient(to bottom, #fff7ad 0%, #ffcc00 50%, #9e6b00 100%);
    -webkit-background-clip: text;
    background-clip: text;
    /* Extra glow for Mega tier */
    filter: drop-shadow(0 0 15px rgba(255, 204, 0, 0.6));
}

/* EPIC WIN: Molten/Fiery Chiseled Gold */
.win-label-top.epic {
    background: linear-gradient(to bottom, #ffff00 0%, #ffae00 50%, #b32d00 100%);
    -webkit-background-clip: text;
    background-clip: text;
    /* Intense pulse for Epic tier */
    filter: drop-shadow(0 0 25px rgba(255, 69, 0, 0.8));
    animation: epic-glow-pulse 2s infinite alternate;
}

/* 8. ANIMATIONS */
@keyframes epic-glow-pulse {
    from { transform: scale(1); filter: drop-shadow(0 0 20px rgba(255, 69, 0, 0.6)); }
    to { transform: scale(1.05); filter: drop-shadow(0 0 45px rgba(255, 69, 0, 1)); }
}

/* 9. MOBILE RESPONSIVENESS */
@media (max-width: 600px) {
    .win-label-top {
        letter-spacing: 3px;
        margin-top: 3vh;
    }
    .win-amount-section {
        margin-bottom: 20vh;
    }
    .win-label-top, .win-amount {
        -webkit-text-stroke: 1.5px #000; /* Slightly thinner stroke for small screens */
    }
}
</style>