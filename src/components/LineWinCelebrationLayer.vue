<template>
  <!-- Set to position:fixed 0,0 to match the browser viewport exactly -->
  <div ref="canvasContainer" class="celebration-layer"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, defineExpose } from 'vue';
import { 
  Application, 
  Container, 
  Sprite, 
  Graphics, 
  Assets, 
  Texture, 
  Rectangle, 
  BlurFilter,
  TextStyle,
  Text
} from 'pixi.js';
import { gsap } from 'gsap';


// ⚡ CORE DIMENSIONS (Source Texture)
const SYMBOL_W = 153;
const SYMBOL_H = 136;

const SYMBOL_MAP = {
  'icon-diamond': { x: 28,  y: 0 },
  'icon-heart':   { x: 153, y: 0 },
  'icon-club':    { x: 306, y: 0 },
  'icon-spade':   { x: 428, y: 0 },
  'icon-K':       { x: 35,  y: 120 },
  'icon-Q':       { x: 172, y: 118 },
  'icon-J':       { x: 302, y: 120 },
  'icon-A':       { x: 427, y: 118 },
  'icon-scatter': { x: 33,  y: 247 },
  'icon-bonus':   { x: 163, y: 242 },
  'icon-wild':    { x: 295, y: 242 },
  'icon-777':     { x: 459, y: 272 }
};

const canvasContainer = ref(null);
let app = null;
let textures = {}; 
let dimmer = null;
let winGroup = null; // Layer for pooled symbols
let uiGroup = null;  // Layer for free spin text
let lineGraphics = null; 
const emitters = {};

// --- ⚡ OBJECT POOLING ---
let ghostPool = [];
const MAX_POOL_SIZE = 15; 
const PRE_WARM_COUNT = 5; 

const createGhostObject = () => {
    const ghostContainer = new Container();
    ghostContainer.visible = false; 

    const glow = new Sprite(Assets.get('glowBurst'));
    glow.anchor.set(0.5);
    glow.blendMode = 'add';
    glow.label = 'glow'; 

    const mask = new Graphics();
    mask.label = 'mask';
    glow.mask = mask;
    
    const ghost = new Sprite(); 
    ghost.anchor.set(0.5);
    ghost.label = 'ghost';

    ghostContainer.addChild(mask, glow, ghost);
    return ghostContainer;
};

const getGhostFromPool = () => {
    if (ghostPool.length > 0) {
        const ghostObj = ghostPool.pop();
        ghostObj.visible = true;
        return ghostObj;
    }
    return createGhostObject();
};

const returnGhostToPool = (ghostObj) => {
    ghostObj.visible = false;
    ghostObj.position.set(0, 0);
    ghostObj.scale.set(1);
    ghostObj.alpha = 1;
    
    const ghost = ghostObj.getChildByName('ghost');
    if (ghost) {
        ghost.width = 0;
        ghost.height = 0;
    }
    
    const glow = ghostObj.getChildByName('glow');
    if (glow) glow.alpha = 0.7; 

    if (ghostPool.length < MAX_POOL_SIZE) {
        ghostPool.push(ghostObj);
    } else {
        ghostObj.destroy({ children: true });
    }
};

onMounted(async () => {
    app = new Application();
    await app.init({
        resizeTo: window,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio, 2),
        autoDensity: true,
    });
    canvasContainer.value.appendChild(app.canvas);

    dimmer = new Graphics()
        .rect(0, 0, window.innerWidth, window.innerHeight)
        .fill({ color: 0x0a0a1a, alpha: 0.6 });
    dimmer.visible = false;
    
    winGroup = new Container();
    uiGroup = new Container();
    lineGraphics = new Graphics();
    
    app.stage.addChild(dimmer, lineGraphics, winGroup, uiGroup);

    const masterTexture = Assets.get('symbolsSprite');

    

    Object.keys(SYMBOL_MAP).forEach(key => {
        const frame = SYMBOL_MAP[key];
        textures[key] = new Texture({
            source: masterTexture.source,
            frame: new Rectangle(frame.x, frame.y, SYMBOL_W, SYMBOL_H)
        });
    });

    for (let i = 0; i < PRE_WARM_COUNT; i++) {
        ghostPool.push(createGhostObject());
    }
});

const getSymbolKey = (id) => {
    const map = { 'Ace': 'icon-A', 'King': 'icon-K', 'Queen': 'icon-Q', 'Jack': 'icon-J', 'Ten': 'icon-diamond' };
    return map[id] || `icon-${id.toLowerCase()}`;
};

const celebrateLine = async (lineData, allSymbolElements) => {
    clear(); 
    dimmer.visible = true; 
    const activeGhosts = [];

    const symbolKey = getSymbolKey(lineData.symbolId);
    const texture = textures[symbolKey] || textures['icon-A'];

    for (const reelIdx of lineData.symbolsPositions) {
        const rowIdx = lineData.definition[reelIdx];
        const symbolIndex = reelIdx * 4 + rowIdx; 
        const domEl = allSymbolElements[symbolIndex];
        if (!domEl) continue;

        const rect = domEl.getBoundingClientRect();
        
        const ghostContainer = getGhostFromPool();
        ghostContainer.position.set(rect.left + rect.width / 2, rect.top + rect.height / 2);

        const glow = ghostContainer.getChildByName('glow');
        const mask = ghostContainer.getChildByName('mask');
        const ghost = ghostContainer.getChildByName('ghost');
        
        ghost.texture = texture;
        glow.width = rect.width;
        glow.height = rect.height;
        mask.clear().circle(0, 0, rect.width / 2).fill(0xffffff);

        winGroup.addChild(ghostContainer);
        activeGhosts.push(ghostContainer); 

        gsap.to(ghost, { width: rect.width * 0.7, height: rect.height * 0.7, duration: 0.4, ease: "back.out(2)" });
        gsap.to(glow, { alpha: 0.2, duration: 0.5, ease: "sine.inOut" });

        updateEnergyLine(activeGhosts);
        await new Promise(r => setTimeout(r, 160));
    }
};

function updateEnergyLine(ghosts) {
    if (ghosts.length < 2 || !lineGraphics) return;
    
    lineGraphics.clear();
    lineGraphics.blendMode = 'add';
    
    if (!lineGraphics.filters || lineGraphics.filters.length === 0) {
        lineGraphics.filters = [new BlurFilter({ strength: 4 })];
    }
    
    lineGraphics.moveTo(ghosts[0].x, ghosts[0].y);
    lineGraphics.setStrokeStyle({ width: 16, color: 0xFFD700, alpha: 0.2 });
    for (let i = 1; i < ghosts.length; i++) { lineGraphics.lineTo(ghosts[i].x, ghosts[i].y); }
    lineGraphics.stroke();

    lineGraphics.moveTo(ghosts[0].x, ghosts[0].y);
    lineGraphics.setStrokeStyle({ width: 4, color: 0xFFFFFF, alpha: 0.8 });
    for (let i = 1; i < ghosts.length; i++) { lineGraphics.lineTo(ghosts[i].x, ghosts[i].y); }
    lineGraphics.stroke();
}


const clear = () => {
    // Use while loop with removeChildAt(0) to avoid RangeError in v8
    if (winGroup) {
        while (winGroup.children.length > 0) {
            const child = winGroup.removeChildAt(0);
            // Stop any active infinite pulses
            gsap.killTweensOf(child);
            gsap.killTweensOf(child.getChildByName('glow'));
            returnGhostToPool(child);
        }
    }

    if (uiGroup) {
        while (uiGroup.children.length > 0) {
            const child = uiGroup.removeChildAt(0);
            child.destroy({ children: true });
        }
        uiGroup.alpha = 1;
    }
    
    if (lineGraphics) lineGraphics.clear();
    if (dimmer) dimmer.visible = false;
};

onUnmounted(() => {
    ghostPool.forEach(ghost => ghost.destroy({ children: true }));
    ghostPool = [];
    app?.destroy(true);
});


// Helper to create the cinematic background texture
function createRadialGradientTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Gradient from Deep Sea Teal to Dark Navy
    const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0, 'rgba(12, 45, 56, 0.9)'); // Center color
    grad.addColorStop(1, 'rgba(2, 8, 12, 1)');      // Edge color
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    return PIXI.Texture.from(canvas);
}

const announceFreeSpins = (spinCount) => {
    return new Promise(async (resolve) => {
        if (!app) { resolve(); return; }

        clear();
        
        // 1. IMPROVED DIMMER: Use Radial Texture instead of solid color
        const bgTexture = createRadialGradientTexture();
        const cinematicBg = new Sprite(bgTexture);
        cinematicBg.width = app.screen.width;
        cinematicBg.height = app.screen.height;
        cinematicBg.alpha = 0;
        uiGroup.addChild(cinematicBg);
        
        gsap.to(cinematicBg, { alpha: 0.9, duration: 0.4 });

        // 2. TEXT STYLES (Brightened to pop against the teal)
        const commonStyle = {
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontWeight: '900',
            fill: '#ffffff', // Pure white face for maximum "glow"
            lineJoin: 'round',
            dropShadow: { alpha: 0.9, blur: 20, distance: 0 }
        };

        const titleText = new Text({ 
            text: 'SPINS', 
            style: { ...commonStyle, fontSize: 75, stroke: '#003344', strokeThickness: 10, dropShadow: { ...commonStyle.dropShadow, color: '#00ffff' } } 
        });

        const countText = new Text({ 
            text: spinCount, 
            style: { ...commonStyle, fontSize: 180, stroke: '#4d3300', strokeThickness: 15, dropShadow: { ...commonStyle.dropShadow, color: '#f1c40f' } } 
        });

        const startText = new Text({ 
            text: 'START!', 
            style: { ...commonStyle, fontSize: 100, stroke: '#003300', strokeThickness: 12, dropShadow: { ...commonStyle.dropShadow, color: '#55ff55' } } 
        });

        [titleText, countText, startText].forEach(t => {
            t.anchor.set(0.5);
            t.position.set(app.screen.width / 2, app.screen.height / 2);
            t.alpha = 0;
            t.scale.set(0);
            uiGroup.addChild(t);
        });

        const tl = gsap.timeline({
            onComplete: () => {
                gsap.to(cinematicBg, { alpha: 0, duration: 0.5, onComplete: () => { clear(); resolve(); } });
            }
        });

        // SEQUENCE: Zoom In -> Hold -> Zoom Out
        // STEP 1: FREE SPINS
        tl.to(titleText, { alpha: 1, duration: 0.2 })
          .to(titleText.scale, { x: 1, y: 1, duration: 0.5, ease: "back.out(1.7)" }, "<")
          .to(titleText, { alpha: 0, scale: 1.4, duration: 0.4, ease: "power2.in" }, "+=0.8");

        // STEP 2: NUMBER
        tl.to(countText, { alpha: 1, duration: 0.2 })
          .to(countText.scale, { x: 1, y: 1, duration: 0.6, ease: "back.out(2)" }, "<")
          .to(countText, { alpha: 0, scale: 1.4, duration: 0.4, ease: "power2.in" }, "+=1.0");

        // STEP 3: START
        tl.to(startText, { alpha: 1, duration: 0.2 })
          .to(startText.scale, { x: 1, y: 1, duration: 0.5, ease: "back.out(1.7)" }, "<")
          .to(uiGroup, { alpha: 0, duration: 0.6, delay: 1.2 });
    });
};

defineExpose({ celebrateLine, clear, announceFreeSpins });
</script>

<style scoped>
.celebration-layer {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh; 
    z-index: 1000; pointer-events: none; overflow: hidden;
}
</style>