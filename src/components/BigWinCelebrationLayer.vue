<template>
  <transition name="zoom-fade">
    <div v-show="visible" class="epic-overlay">
      
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
            <span v-if="formattedValue > 0" class="val">{{ formattedValue }}</span>
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
  Graphics,
  Texture,
  Text
} from 'pixi.js';
import { useSlotGame } from '../composables/useSlotGame';
const { toggleAutoplay, sounds } = useSlotGame();
import gsap from 'gsap';


// --- STATE ---
const pixiContainer = ref(null);
const visible = ref(false);
const currentWinLabel = ref('');
const currentWinType = ref('big'); // 'big', 'mega', 'epic'
const displayValue = ref(0);
const labelRef = ref(null);
const amountSectionRef = ref(null);
const isDisplayValueFreeSpinCount = ref(false);

let targetHeroScale = 1;
let heroContainer = null;

let app = null;
let glowSprite = null;
let raysSprite = null; // Cinematic God Rays
let heroSprite = null;
let bloomLayer = null;

let fighterSprite = null;


// --- Helper: Procedural God Rays ---
const createRaysTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const centerX = 256; const centerY = 256;
    
    ctx.clearRect(0, 0, 512, 512);
    const numRays = 24; // Increased rays for finer detail
    const angleStep = (Math.PI * 2) / numRays;
    
    for (let i = 0; i < numRays; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        // Make rays thinner (0.25 vs 0.4) for a more elegant look
        ctx.arc(centerX, centerY, 256, i * angleStep, i * angleStep + angleStep * 0.25);
        ctx.lineTo(centerX, centerY);
        const grad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 256);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // Hot white core
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
    }
    return Texture.from(canvas);
};

// --- PIXI SETUP ---
onMounted(async () => {
    if (!pixiContainer.value) return;

    app = new Application();
    await app.init({ 
        resizeTo: window, 
        backgroundAlpha: 0, 
        antialias: false, // ⚡ PERFORMANCE: Antialias is very heavy on mobile GPUs
        resolution: 1.2,  // ⚡ PERFORMANCE: Cap resolution at 1.2 instead of 2.0+ for mid-tier
        autoDensity: true,
        autoStart: false 
    });
    pixiContainer.value.appendChild(app.canvas);

    // 1. GOD RAYS (Cinematic background light)
    raysSprite = new Sprite(createRaysTexture());
    raysSprite.anchor.set(0.5);
    raysSprite.blendMode = 'add';
    raysSprite.alpha = 0;
    app.stage.addChild(raysSprite);

    // 2. SOFT AURA GLOW
    glowSprite = new Sprite(Assets.get('glowBurst'));
    glowSprite.anchor.set(0.5);
    glowSprite.blendMode = 'add'; 
    glowSprite.alpha = 0;
    app.stage.addChild(glowSprite);

    // 3. HERO CONTAINER
    heroContainer = new Container();
    app.stage.addChild(heroContainer);

    heroSprite = new Sprite(Assets.get('shieldHelmet'));
    heroSprite.anchor.set(0.5);
    heroContainer.addChild(heroSprite);

    // const filter = new ColorMatrixFilter();
    // heroSprite.filters = [filter];
    // filter.brightness(1.1, true);
    // filter.contrast(0.12, true);
    // filter.saturate(0.2, true);

    bloomLayer = new Sprite(Assets.get('shieldHelmet'));
    bloomLayer.anchor.set(0.5);
    bloomLayer.blendMode = 'add';
    bloomLayer.alpha = 0;
    heroContainer.addChild(bloomLayer);

    fighterSprite = new Sprite(Assets.get('fighterModelPortrait')); 
    fighterSprite.anchor.set(0.5, 1); // Anchor at bottom center for "Rise" effect
    fighterSprite.visible = false;
    app.stage.addChild(fighterSprite);

    const updateLayout = () => {
        const cx = app.screen.width / 2;
        const cy = app.screen.height / 2;
        
        raysSprite.position.set(cx, cy);
        glowSprite.position.set(cx, cy);
        heroContainer.position.set(cx, cy);

        targetHeroScale = Math.min((app.screen.width * 0.7) / heroSprite.texture.width, 1);
        heroContainer.scale.set(targetHeroScale);
        
        // Light elements should be significantly larger than the shield
        raysSprite.scale.set(targetHeroScale * 2.5);
        glowSprite.scale.set(targetHeroScale * 3.5);


        if (fighterSprite) {
          const fScale = (app.screen.height * 0.85) / fighterSprite.texture.height;
          fighterSprite.scale.set(fScale);
          fighterSprite.position.set(cx, app.screen.height);
        }
    };

    window.addEventListener('resize', updateLayout);
    updateLayout();

    let auraTime = 0; 
    app.ticker.add((ticker) => {
        if (visible.value) {
        // Accumulate delta time for smooth animation regardless of frame rate
        auraTime += ticker.deltaTime * 0.05; 
        
        let speed = 0.002;
        if (currentWinType.value === 'mega') speed = 0.01;
        if (currentWinType.value === 'epic') speed = 0.025;

        raysSprite.rotation += speed * ticker.deltaTime;

        if (bloomLayer) {
            // Use auraTime for a smooth "breathing" effect
            let breathSpeed = currentWinType.value === 'epic' ? 2 : 1;
            bloomLayer.alpha = 0.15 + Math.sin(auraTime * breathSpeed) * 0.1;
            
            // Add a slight scale pulse to the rays to make them feel "alive"
            raysSprite.scale.set(targetHeroScale * (2.5 + Math.sin(auraTime * 0.5) * 0.1));
        }
    }
    });
});

const formattedValue = computed(() => {
    // Show fractional digits during active counting for a more dynamic feel
    if (visible.value) {
        if(isDisplayValueFreeSpinCount.value){
            return displayValue.value
        }else{
            return displayValue.value.toFixed(2).toLocaleString();
        }
    }
    // Once hidden, or for initial state, show as an integer
    return displayValue.value.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
});

const playEpicWin = (totalWin) => {
    visible.value = true;
    app.start(); 
    displayValue.value = 0;
    currentWinLabel.value = 'BIG';
    currentWinType.value = 'big';

    // ⚡ PERFORMANCE: Reset local trackers
    let lastValueInt = -1;

    // Reset PIXI elements
    gsap.set(heroContainer.scale, { x: 0, y: 0 });
    gsap.set([glowSprite, raysSprite], { alpha: 0, tint: 0xFFFFFF });
    gsap.set(bloomLayer, { alpha: 0 });

    const tl = gsap.timeline({
        onComplete: () => {
            setTimeout(skip, 2000); // Auto-hide after 1 seconds
        }
    });

    // 1. Entrance
    tl.to(heroContainer.scale, { x: targetHeroScale, y: targetHeroScale, duration: 0.8, ease: "back.out(1.4)" });
    tl.add(() => triggerImpact('BIG', 'big'), 0.1);

    // 2. THE SECRET: High-Frequency "Vibration" on update
    // We only trigger a pop if the decimal digit changed to save CPU
    const updateLogic = function() {
        const currentCheck = Math.floor(displayValue.value * 10);
        if (currentCheck !== lastValueInt) {
            lastValueInt = currentCheck;
            // Quick physical 'thump'
            gsap.fromTo(amountSectionRef.value, 
                { scale: 1.1 }, 
                { scale: 1, duration: 0.05, overwrite: true,force3D: true }
            );
        }
    };

    // SEGMENT 1: 0-5s (Acceleration)
    tl.to(displayValue, { 
        value: totalWin * 0.33, 
        duration: 5, 
        ease: "power2.in", 
        onUpdate: updateLogic 
    });

    // SEGMENT 2: 5-10s (Constant Peak Speed)
    tl.to(displayValue, { 
        value: totalWin * 0.66, 
        duration: 5, 
        ease: "none", 
        onStart: () => triggerImpact('MEGA', 'mega'),
        onUpdate: updateLogic 
    });

    // SEGMENT 3: 10-15s (Deceleration & Final Slam)
    tl.to(displayValue, { 
        value: totalWin, 
        duration: 5, 
        ease: "power3.out", 
        onStart: () => triggerImpact('MEGA', 'epic'),
        onUpdate: updateLogic,
        onComplete: () => {
            // THE FINAL IMPACT: Massive bounce to settle the win
            gsap.fromTo(amountSectionRef.value, 
                { scale: 1.7 }, 
                { scale: 1, duration: 0.8, ease: "back.out(2.5)" }
            );
        }
    });
};


const announceFreeSpins = (spinCount) => {
    return new Promise((resolve) => {
        visible.value = true;
        isDisplayValueFreeSpinCount.value = true;
        displayValue.value = 0;
        app.start();

        // 1. SCENE TAKEOVER
        const blackout = new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill({ color: 0x000000, alpha: 1 });
        blackout.alpha = 0;
        app.stage.addChildAt(blackout, 0);

        const flash = new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill({ color: 0xFFFFFF });
        flash.alpha = 0;
        app.stage.addChild(flash);

        // --- 2. STUNNING VIKING BUTTON DESIGN ---
        const startBtn = new Container();
        const btnShadow = new Graphics().roundRect(-185, -60, 370, 125, 20).fill({ color: 0x000000, alpha: 0.5 });
        const btnBody = new Graphics()
            .roundRect(-180, -65, 360, 120, 20)
            .fill({ color: 0xc5a059 }) 
            .stroke({ color: 0xFFFFFF, width: 4, alpha: 0.9 }); 

        const btnShine = new Graphics()
            .roundRect(-180, -65, 360, 60, 20) 
            .fill({ color: 0xFFFFFF, alpha: 0.2 });

        const btnTxt = new Text({ 
            text: 'START', 
            style: { 
                fontFamily: 'Cinzel Decorative', 
                fontSize: 50, 
                fontWeight: '900', 
                fill: '#000000',
                letterSpacing: 6
            } 
        });
        btnTxt.anchor.set(0.5);
        
        startBtn.addChild(btnShadow, btnBody, btnShine, btnTxt);
        startBtn.position.set(app.screen.width / 2, app.screen.height / 2+200);
        startBtn.visible = false;
        startBtn.interactive = true;
        app.stage.addChild(startBtn);

        let isStarted = false;
        const triggerStart = () => {
            if (isStarted) return;
            isStarted = true;

            startBtn.off('pointerdown', triggerStart);
            gsap.killTweensOf([bloomLayer, glowSprite, raysSprite, raysSprite.scale, startBtn.scale]);
            app.stage.removeChild(flash, startBtn, blackout);
            toggleAutoplay();
            skip();
            resolve();
        };

        const tl = gsap.timeline();

        // PHASE 1: "FREE SPIN"
        tl.to(blackout, { alpha: 0.95, duration: 0.8 });
        tl.add(() => {
            currentWinLabel.value = "FREE SPIN";
            gsap.fromTo(labelRef.value, { scale: 5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "expo.out" });
        }, 0.5);

        // PHASE 2: THE NUMBER (Ex: 10)
        tl.add(() => {
            currentWinLabel.value = spinCount;
            // ⚡ FIX: Target 'labelRef.value' (the element), not 'currentWinLabel.value' (the string)
            gsap.fromTo(labelRef.value, { scale: 6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" });
            if (sounds.explosion) sounds.explosion.play();
        }, 2.5);

        // PHASE 3: "READY"
        tl.add(() => {
            displayValue.value = 0; 
            isDisplayValueFreeSpinCount.value = false;
            currentWinLabel.value = "READY";
            gsap.fromTo(labelRef.value, { scale: 0.1, alpha: 0 }, { scale: 1, alpha: 1, duration: 0.4, ease: "back.out(2)" });
        }, 4.5);

        // --- PHASE 4: START BUTTON SLAM ---
        tl.add(() => {
            currentWinLabel.value = ""; 
            displayValue.value = 0;
            
            startBtn.visible = true;
            startBtn.scale.set(12);
            startBtn.alpha = 0;
            
            gsap.to(startBtn.scale, { x: 1, y: 1, duration: 0.5, ease: "bounce.out" });
            gsap.to(startBtn, { alpha: 1, duration: 0.5 });

            gsap.fromTo(flash, { alpha: 1 }, { alpha: 0, duration: 1.0 }); 
            gsap.fromTo(".epic-overlay", { x: -20 }, { x: 20, duration: 0.05, repeat: 8, yoyo: true, onComplete: () => gsap.set(".epic-overlay", {x:0}) });
        }, 6.0);

        // --- PHASE 5: THE 3, 2, 1 COUNTDOWN ---
        const countdownTl = gsap.timeline({ onComplete: triggerStart });
        const countdown = ["5", "4", "3", "2", "1"];
        countdown.forEach((text, i) => {
            countdownTl.add(() => {
                currentWinLabel.value = text;
                gsap.fromTo(labelRef.value, 
                    { scale: 10, opacity: 0, filter: "blur(20px)" }, 
                    { scale: 2, opacity: 1, filter: "blur(0px)", duration: 0.4, ease: "expo.out" }
                );
                gsap.fromTo(raysSprite.scale, { x: 6, y: 6 }, { x: 4, y: 4, duration: 0.5 });
                gsap.fromTo(raysSprite, { alpha: 1 }, { alpha: 0.4, duration: 0.5 });
            }, i * 1.0);
        });
        
        // Add the countdown timeline to the main timeline
        tl.add(countdownTl, 7.5);

        // Loop background energy
        tl.add(() => {
            gsap.to(raysSprite.scale, { x: 6, y: 6, duration: 2 });
            gsap.to(raysSprite, { alpha: 0.8, duration: 2 });
            gsap.to([bloomLayer, glowSprite], { 
                alpha: 0.7, duration: 0.4, repeat: -1, yoyo: true, ease: "sine.inOut" 
            });
        }, 1.0);

        // INTERACTION
        startBtn.on('pointerdown', triggerStart);
    });
};

const announceFreeSpinByModel = (spinCount) => {
    return new Promise((resolve) => {
        visible.value = true;
        isDisplayValueFreeSpinCount.value = true;
        displayValue.value = spinCount;
        app.start();

        // 1. DYNAMIC TAKEOVER: Create a local dimmer to hide the reels completely
        const localDimmer = new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill({ color: 0x000000, alpha: 1 });
        localDimmer.alpha = 0;
        app.stage.addChildAt(localDimmer, 0); // Bottom layer

        // 2. SCENE RESET
        heroContainer.visible = false;
        fighterSprite.visible = true;
        fighterSprite.alpha = 0;
        
        // Local Flashbang for impact moments
        const flash = new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill({ color: 0xFFFFFF });
        flash.alpha = 0;
        app.stage.addChild(flash);

        // Local Start Button
        const startBtn = new Container();
        const btnBg = new Graphics().roundRect(-160, -50, 320, 100, 20).fill({ color: 0xFFD700 }).stroke({ color: 0xFFFFFF, width: 4 });
        const btnTxt = new Text({ text: 'START', style: { fontFamily: 'Georgia, serif', fontSize: 46, fontWeight: '900', fill: '#000' } });
        btnTxt.anchor.set(0.5);
        startBtn.addChild(btnBg, btnTxt);
        startBtn.position.set(app.screen.width / 2, app.screen.height / 2 + 50);
        startBtn.visible = false;
        startBtn.interactive = true;
        app.stage.addChild(startBtn);

        const tl = gsap.timeline();

        // PHASE 1: THE DRAMATIC RISE (0s - 1.5s)
        tl.to(localDimmer, { alpha: 0.9, duration: 1 }); // Deep background takeover
        tl.to(fighterSprite, { 
            alpha: 1, 
            y: app.screen.height, 
            duration: 1.2, 
            startAt: { y: app.screen.height + 400 },
            ease: "expo.out" 
        }, 0);

        // ⚡ IMPACT SHAKE: Snappy and short to feel heavy
        tl.add(() => {
            triggerImpact('FREE', 'epic', ' HIT');
            gsap.fromTo(".content-box", { x: -8, y: -4 }, { 
                x: 8, y: 4, duration: 0.04, repeat: 7, yoyo: true, ease: "none",
                onComplete: () => gsap.set(".content-box", { x: 0, y: 0 }) 
            });
            gsap.fromTo(flash, { alpha: 0.5 }, { alpha: 0, duration: 0.6 });
        }, 0.8);

        // PHASE 2: CONTINUOUS ENERGY SPREAD (1.5s - 6s)
        tl.add(() => {
            gsap.to(raysSprite, { alpha: 1, scale: 6, duration: 3 });
            // Pulse the body glow constantly
            gsap.to(glowSprite, { 
                alpha: 0.8, scale: targetHeroScale * 6, duration: 0.4, 
                repeat: -1, yoyo: true, ease: "sine.inOut" 
            });
        }, 1.5);

        // PHASE 3: THE CINEMATIC COUNTDOWN (6s - 8.5s)
        const sequence = ["READY", "3", "2", "1"];
        sequence.forEach((text, i) => {
            tl.add(() => {
                currentWinLabel.value = text;
                // Hammer the text onto the screen with a blur-reset
                gsap.fromTo(labelRef.value, 
                    { scale: 6, opacity: 0, filter: "blur(30px)" }, 
                    { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.4, ease: "power4.out" }
                );
                // Mini-thump shake per count
                gsap.fromTo(".content-box", { y: 10 }, { y: 0, duration: 0.1, ease: "bounce.out" });
            }, 6 + (i * 0.7));
        });

        // PHASE 4: THE START BUTTON SLAM (9s)
        tl.add(() => {
            currentWinLabel.value = ""; 
            startBtn.visible = true;
            startBtn.scale.set(10); // Slam from "camera"
            startBtn.alpha = 0;

            // ⚡ MASSIVE SLAM
            gsap.to(startBtn, { alpha: 1, scale: 1, duration: 0.5, ease: "bounce.out" });
            
            // Flashbang Effect
            gsap.fromTo(flash, { alpha: 1 }, { alpha: 0, duration: 1.2 });
            
            // Final Heavy Impact Shake
            gsap.fromTo(".epic-overlay", { x: -15, y: -10 }, { 
                x: 15, y: 10, duration: 0.04, repeat: 10, yoyo: true,
                onComplete: () => gsap.set(".epic-overlay", { x: 0, y: 0 })
            });
        }, 9.0);

        // INTERACTION
        startBtn.on('pointerdown', () => {
            gsap.killTweensOf(glowSprite);
            app.stage.removeChild(flash, startBtn, localDimmer);
            heroContainer.visible = true;
            fighterSprite.visible = false;
            toggleAutoplay();
            skip();
            resolve();
        });
    });
};

const triggerImpact = (label, type, suffix = ' WIN') => {
    currentWinLabel.value = `${label}${suffix}`;
    currentWinType.value = type;

    // Heavy text impact
    gsap.fromTo(labelRef.value, { scale: 2.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "expo.out" });
    
    // Physical Screen Shake (Optimized to 3 repeats for mobile)
    gsap.fromTo(".content-box", { x: -6 }, { x: 6, duration: 0.05, repeat: 3, yoyo: true });
    
    if (type === 'big') {
        gsap.to(glowSprite, { alpha: 0.4, tint: 0xFFF5E1, duration: 1 });
        gsap.to(raysSprite, { alpha: 0.2, duration: 1 });
    } else if (type === 'mega') {
        gsap.to(glowSprite, { alpha: 0.6, tint: 0xFFD700, scale: targetHeroScale * 3.5, duration: 1 });
        gsap.to(raysSprite, { alpha: 0.4, tint: 0xFFD700, duration: 1 });
    } else if (type === 'epic') {
        gsap.to(glowSprite, { alpha: 0.9, tint: 0xFFFFFF, scale: targetHeroScale * 3.5, duration: 0.5 }); 
        gsap.to(raysSprite, { alpha: 0.7, tint: 0xFFAA00, scale: targetHeroScale * 3.5, duration: 0.5 });
        gsap.to(bloomLayer, { alpha: 0.5, duration: 1 });
    }
};

const skip = () => {
    visible.value = false;
    isDisplayValueFreeSpinCount.value = false;
    app.stop();
};

defineExpose({ playEpicWin, announceFreeSpins, announceFreeSpinByModel });
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@900&display=swap');

.epic-overlay {
    position: fixed; 
    top: 0; left: 0; 
    width: 100vw; height: 100vh; 
    z-index: 9999;
    background: radial-gradient(circle at center, rgba(35, 25, 10, 0.45) 0%, rgba(10, 10, 20, 0.95) 75%, rgba(0, 0, 0, 1) 100%); 
    display: flex; justify-content: center; align-items: center;
    overflow: hidden;
}

.pixi-layer { 
    position: absolute; top: 0; left: 0; 
    width: 100%; height: 100%; z-index: 1; 
}

/* ⚡ FIX: Use 'relative' and 'margin' strictly for layout */
.content-box { 
    position: absolute; 
    inset: 0; /* Fill screen */
    z-index: 10; 
    display: flex; 
    flex-direction: column;
    align-items: center;
    pointer-events: none; 
}

/* ⚡ FIX: The Clip Combo must be on the same level as display: inline-block */
.win-label-top, .val {
    font-family: 'Cinzel Decorative', cursive;
    text-transform: uppercase;
    font-weight: 900;
    text-align: center;
    line-height: 1.1;
    
    /* ⚡ THE ONLY WAY TO FIX THE GRAY TEXT: */
    display: inline-block !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    color: transparent !important;

    -webkit-text-stroke: 1.5px #000000;
    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.9));
}

.win-label-top {
    font-size: clamp(3rem, 15vw, 7rem);
    letter-spacing: 4px;
    margin-top: 6vh; /* Pushes the label to top */
}

/* ⚡ FIX: THE AMOUNT POSITIONING */
.win-amount-section {
    margin-top: auto; /* Pushes number to the bottom */
    margin-bottom: 12vh; /* Space from very bottom of screen */
}

/* GRADIETNS: High Contrast for Chrome effect */
.win-label-top.big { background-image: linear-gradient(to bottom, #ffffff 0%, #777777 100%); }
.win-label-top.mega { background-image: linear-gradient(to bottom, #fff7ad, #ffa200, #6d4100); }
.win-label-top.epic { background-image: linear-gradient(to bottom, #ffff00 0%, #ffae00 48%, #221100 52%, #ffcc00 100%); }

.val {
    font-size: clamp(4rem, 18vw, 10rem);
    /* ⚡ THE CHROME GRADIENT */
    background-image: linear-gradient(
        to bottom, 
        #ffffff 0%,    /* Top shine */
        #eeeeee 45%,   /* Bright surface */
        #111111 50%,   /* SHARP HORIZON LINE */
        #999999 55%,   /* Bottom shadow */
        #ffffff 100%   /* Edge shine */
    );
}

@keyframes epic-glow-pulse {
    from { transform: scale(1); }
    to { transform: scale(1.04); }
}

@media (max-width: 600px) {
    .win-amount-section { margin-bottom: 20vh; } /* Push text lower on mobile */
}

.zoom-fade-enter-active, .zoom-fade-leave-active { transition: opacity 0.5s ease; }
.zoom-fade-enter-from, .zoom-fade-leave-to { opacity: 0; }
</style>