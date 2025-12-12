<template>
  <div class="slot-machine">
    
    <!-- The Pixi Canvas Container -->
    <div ref="reelsContainerEL" class="reels-container"></div>
  </div>
</template>

<script setup>
import {
  Application,
  Assets,
  BlurFilter,
  Color,
  Container,
  FillGradient,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  Texture,
} from 'pixi.js';
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';



// --- 1. YOUR LOCAL IMAGES ---
const symbolPaths = {
  Wild: new URL('@/assets/images/symblos/celebration/wild.png', import.meta.url).href,
  Scatter1: new URL('@/assets/images/symblos/celebration/scatter.png', import.meta.url).href,
  seven: new URL('@/assets/images/symblos/seven.png', import.meta.url).href,
  Nine: new URL('@/assets/images/symblos/bar.png', import.meta.url).href,
  Jack: new URL('@/assets/images/symblos/melon.png', import.meta.url).href,
  Ten: new URL('@/assets/images/symblos/bell.png', import.meta.url).href,
  King: new URL('@/assets/images/symblos/plum.png', import.meta.url).href,
  Queen: new URL('@/assets/images/symblos/orange.png', import.meta.url).href,
  lemon: new URL('@/assets/images/symblos/lemon.png', import.meta.url).href,
  Ace: new URL('@/assets/images/symblos/cherry.png', import.meta.url).href,
  banana: new URL('@/assets/images/symblos/banana.png', import.meta.url).href,
  Scatter2: new URL('@/assets/images/symblos/celebration/gold_coin.png', import.meta.url).href,
};
// Convert object values to an array of URL strings
const urlsToLoad = Object.values(symbolPaths);
console.log(urlsToLoad);
// 2. Load assets




// --- STATE ---
const reelsContainerEL = ref(null);
const app = shallowRef(null);
const running = ref(false);
const reels = [];
const tweening = [];

// --- TWEENING & ANIMATION HELPERS ---
function tweenTo(object, property, target, time, easing, onchange, oncomplete) {
    const tween = {
        object,
        property,
        propertyBeginValue: object[property],
        target,
        easing,
        time,
        change: onchange,
        complete: oncomplete,
        start: Date.now(),
    };
    tweening.push(tween);
    return tween;
}

function lerp(a1, a2, t) {
    return a1 * (1 - t) + a2 * t;
}

function backout(amount) {
    return (t) => --t * t * ((amount + 1) * t + amount) + 1;
}

// --- CORE SLOT MACHINE LOGIC ---
function startPlay() {
    if (running.value) return;
    running.value = true;

    for (let i = 0; i < reels.length; i++) {
        const r = reels[i];
        const extra = Math.floor(Math.random() * 3);
        const target = r.position + 10 + i * 5 + extra;
        const time = 2500 + i * 600 + extra * 600;

        tweenTo(
            r,
            'position',
            target,
            time,
            backout(0.5),
            null,
            i === reels.length - 1 ? reelsComplete : null,
        );
    }
}

function reelsComplete() {
    running.value = false;
}

// --- PIXI INITIALIZATION AND SETUP ---
async function initializePixiApp() {
    if (!reelsContainerEL.value) return;

    // 1. Create and configure the Pixi Application
    const pixiApp = new Application();
    await pixiApp.init({
        width: reelsContainerEL.value.clientWidth,
        height: reelsContainerEL.value.clientHeight,
        background: '#1099bb',
        resizeTo: reelsContainerEL.value,
        antialias: true,
    });
    reelsContainerEL.value.appendChild(pixiApp.canvas);
    app.value = pixiApp;
    
    await Assets.load(urlsToLoad);
    
    const slotTextures = urlsToLoad.map(t => Texture.from(t));

    // 3. Build the reels
    const REEL_WIDTH = 70;
    const SYMBOL_SIZE = 70;
    const reelContainer = new Container();

    for (let i = 0; i < 5; i++) {
        const rc = new Container();
        rc.x = i * REEL_WIDTH;
        reelContainer.addChild(rc);

        const reel = {
            container: rc,
            symbols: [],
            position: 0,
            previousPosition: 0,
            blur: new BlurFilter(),
        };
        reel.blur.strengthX = 0;
        reel.blur.strengthY  = 0;
        rc.filters = [reel.blur];

        for (let j = 0; j < 4; j++) {
            const symbol = new Sprite(slotTextures[Math.floor(Math.random() * slotTextures.length)]);
            symbol.y = j * SYMBOL_SIZE;
            symbol.scale.x = symbol.scale.y = Math.min(SYMBOL_SIZE / symbol.width, SYMBOL_SIZE / symbol.height);
            symbol.x = Math.round((SYMBOL_SIZE - symbol.width) / 2);
            reel.symbols.push(symbol);
            rc.addChild(symbol);
        }
        reels.push(reel);
    }
    pixiApp.stage.addChild(reelContainer);

    // 4. Build UI elements (top/bottom overlays and text)
    const margin = (pixiApp.screen.height - SYMBOL_SIZE * 3) / 2;
    reelContainer.y = margin;
    reelContainer.x = Math.round(pixiApp.screen.width - REEL_WIDTH * 5);

    const top = new Graphics().rect(0, 0, pixiApp.screen.width, margin).fill({ color: 0x0 });
    const bottom = new Graphics().rect(0, SYMBOL_SIZE * 3 + margin, pixiApp.screen.width, margin).fill({ color: 0x0 });
    const style = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 36,
        fontStyle: 'italic',
        fontWeight: 'bold',
        stroke: { color: 0x4a1850, width: 5 },
        dropShadow: {
        color: 0x000000,
        angle: Math.PI / 6,
        blur: 4,
        distance: 6,
        },
        wordWrap: true,
        wordWrapWidth: 440,
    });

    const playText = new Text({text:'Spin the wheels!', style});
    playText.x = Math.round((bottom.width - playText.width) / 2);
    playText.y = pixiApp.screen.height - margin + Math.round((margin - playText.height) / 2);
    bottom.addChild(playText);
    pixiApp.stage.addChild(bottom);

    bottom.eventMode = 'static';
    bottom.cursor = 'pointer';
    bottom.on('pointerdown', startPlay);

    // 5. Start the animation ticker
    pixiApp.ticker.add(gameLoop);
}

function gameLoop() {
    // Animate tweens
    const now = Date.now();
    const remove = [];
    for (let i = 0; i < tweening.length; i++) {
        const t = tweening[i];
        const phase = Math.min(1, (now - t.start) / t.time);
        t.object[t.property] = lerp(t.propertyBeginValue, t.target, t.easing(phase));
        if (t.change) t.change(t);
        if (phase === 1) {
            t.object[t.property] = t.target;
            if (t.complete) t.complete(t);
            remove.push(t);
        }
    }
    for (let i = 0; i < remove.length; i++) {
        tweening.splice(tweening.indexOf(remove[i]), 1);
    }

    // Animate reels
    const SYMBOL_SIZE = 70;
    const slotTextures = urlsToLoad.map(t => Texture.from(t));
    for (let i = 0; i < reels.length; i++) {
        const r = reels[i];
        r.blur.strengthY = (r.position - r.previousPosition) * 8;
        r.previousPosition = r.position;

        for (let j = 0; j < r.symbols.length; j++) {
            const s = r.symbols[j];
            const prevy = s.y;
            s.y = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
            if (s.y < 0 && prevy > SYMBOL_SIZE) {
                s.texture = slotTextures[Math.floor(Math.random() * slotTextures.length)];
                s.scale.x = s.scale.y = Math.min(SYMBOL_SIZE / s.texture.width, SYMBOL_SIZE / s.texture.height);
                s.x = Math.round((SYMBOL_SIZE - s.width) / 2);
            }
        }
    }
}


// --- VUE LIFECYCLE HOOKS ---
onMounted(() => {
    initializePixiApp();
});

onUnmounted(() => {
    if (app.value) {
        app.value.destroy(true, true);
    }
});
</script>


<style scoped>
/* --- CONTAINER --- */
.slot-machine {
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1000px;
  border-radius: 20px 20px 0 0;
  margin-bottom: 20px;
}

.reels-container {
    display: flex;
    width: 500px;
    height: 500px;
    justify-content: flex-start;
    overflow: hidden;
    position: relative;
    border-radius: 12px;
    /* Optimized: No Blur filter */
    background: linear-gradient(to bottom, rgba(30, 20, 20, 0.85) 0%, rgba(10, 5, 5, 0.95) 100%);
    border: 2px solid rgba(255, 180, 50, 0.3);
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(0, 0, 0, 0.8);
}

.reel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
  z-index: 2;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 1px solid rgba(0, 0, 0, 0.3);
  background: linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%);
  
  /* CRITICAL: Hardware Acceleration */
  will-change: transform;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
}
.reel:last-child { border-right: none; }

.symbol {
  width: 65px;
  height: 65px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* --- OPTIMIZED SPRITE SHEET --- */
.symbol-icon {
  width: 153px; 
  height: 136px;
  
  background-image: url('@/assets/images/symbols_sprite.png');
  background-repeat: no-repeat;
  
  position: absolute;
  top: 50%;
  left: 50%;
  
  /* Zoom in slightly and center */
  transform: translate(-50%, -50%) scale(0.55);
  transform-origin: center center;
  
  will-change: transform;
  /* Removed drop-shadow filter for performance */
}

/* SPRITE POSITIONS */
/* Row 1 */
.icon-diamond { background-position: 0px 0px; }
.icon-heart   { background-position: -153px 0px; }
.icon-club    { background-position: -306px 0px; }
.icon-spade   { background-position: -459px 0px; }
/* Row 2 */
.icon-K       { background-position: 0px -136px; }
.icon-Q       { background-position: -153px -136px; }
.icon-J       { background-position: -306px -136px; }
.icon-A       { background-position: -459px -136px; }
/* Row 3 */
.icon-scatter { background-position: 0px -272px; }
.icon-bonus   { background-position: -153px -272px; }
.icon-wild    { background-position: -306px -272px; }
.icon-777     { background-position: -459px -272px; }

/* --- OVERLAYS --- */
.lantern-glow {
  position: absolute;
  top: -50px; left: 50%; transform: translateX(-50%);
  width: 100%; height: 80%;
  /* Removed mix-blend-mode */
  background: radial-gradient(circle at 50% 0%, rgba(255, 140, 0, 0.4) 0%, rgba(255, 100, 0, 0.05) 40%, transparent 70%);
  pointer-events: none; z-index: 1; opacity: 0.3;
}

.gloss-reflection {
  position: absolute; top: 0; left: 0; width: 100%; height: 35%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 215, 0, 0.1) 20%, transparent 100%);
  border-radius: 10px 10px 100% 100% / 10px 10px 20px 20px; 
  box-shadow: inset 0 10px 20px -5px rgba(255, 255, 255, 0.3);
  pointer-events: none; z-index: 5;
}

.win-lines-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
.win-amount-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; }
</style>