<template>
  <!-- Set to position:fixed 0,0 to match the browser viewport exactly -->
  <div ref="canvasContainer" class="celebration-layer"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, defineExpose } from 'vue';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';



import symbolsSprite from '@/assets/images/symbols_sprite.png';
import glowBurst from '@/assets/images/transparent_glow_squire.png';

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
let textures = {}; // Cache for preloaded textures
let dimmer = null;
let winGroup = null;
let lineGraphics = null; //

onMounted(async () => {
    app = new PIXI.Application();
    await app.init({
        resizeTo: window, // Automatically resizes canvas to match browser window
        backgroundAlpha: 0,
        antialias: true,
        // High resolution for crisp text on mobile Retina/OLED screens
        resolution: Math.min(window.devicePixelRatio, 2),
        autoDensity: true,
    });
    canvasContainer.value.appendChild(app.canvas);

    // 1. Setup Layering
    dimmer = new PIXI.Graphics()
        .rect(0, 0, window.innerWidth, window.innerHeight)
        .fill({ color: 0x0a0a1a, alpha: 0.6 }); // Semi-transparent dark overlay
    dimmer.visible = false;
    
    winGroup = new PIXI.Container();

    lineGraphics = new PIXI.Graphics(); // ⚡ FIX: Actually create the object
    
    app.stage.addChild(dimmer);
    app.stage.addChild(lineGraphics);
    app.stage.addChild(winGroup);

    // 2. Preload and Prepare Textures All At Once
    const [masterTexture, glowTex] = await Promise.all([
        PIXI.Assets.load(symbolsSprite),
        PIXI.Assets.load(glowBurst)
    ]);

    
    Object.keys(SYMBOL_MAP).forEach(key => {
        const frame = SYMBOL_MAP[key];
        textures[key] = new PIXI.Texture({
            source: masterTexture,
            frame: new PIXI.Rectangle(frame.x, frame.y, SYMBOL_W, SYMBOL_H)
        });
    });
});

const getSymbolKey = (id) => {
    const map = { 'Ace': 'icon-A', 'King': 'icon-K', 'Queen': 'icon-Q', 'Jack': 'icon-J', 'Ten': 'icon-diamond' };
    return map[id] || `icon-${id.toLowerCase()}`;
};

const celebrateLine = async (lineData, allSymbolElements) => {
    clear(); 
    dimmer.visible = true; 
    const ghosts = [];

    const symbolKey = getSymbolKey(lineData.symbolId);
    const texture = textures[symbolKey] || textures['icon-A'];

    for (const reelIdx of lineData.symbolsPositions) {
        const rowIdx = lineData.definition[reelIdx];
        const symbolIndex = reelIdx * 4 + rowIdx; 
        const domEl = allSymbolElements[symbolIndex];
        if (!domEl) continue;

        const rect = domEl.getBoundingClientRect();
        const ghostContainer = new PIXI.Container();
        ghostContainer.position.set(rect.left + rect.width/2, rect.top + rect.height/2);

        // 1. THE GLOW (With a Mask to remove boxes)
        const glow = new PIXI.Sprite(PIXI.Assets.get(glowBurst));
        glow.anchor.set(0.5);
        glow.blendMode = 'add';
        glow.width = rect.width; 
        glow.height = rect.height;
        glow.alpha = 0.7;

        const m = new PIXI.Graphics().circle(0, 0, rect.width / 2).fill(0xffffff);
        glow.mask = m;
        ghostContainer.addChild(m);
        
        // 3. THE SYMBOL GHOST
        const ghost = new PIXI.Sprite(texture);
        ghost.anchor.set(0.5);
        ghost.width = 0; 
        ghost.height = 0;

        ghostContainer.addChild(glow);
        ghostContainer.addChild(ghost); // Symbol is on top
        winGroup.addChild(ghostContainer);
        ghosts.push(ghostContainer); 

        // 4. ANIMATION SEQUENCE
        // Pop the symbol
        gsap.to(ghost, { 
            width: rect.width*0.7, 
            height: rect.height*0.7, 
            duration: 0.4, 
            ease: "back.out(2)" 
        });
        
        // Glow arrives with a pulse
        //gsap.to(glow, { alpha: 0.5, duration: 0.3 });
        gsap.to(glow, { 
            alpha: 0.2, 
            duration: 0.5, 
            ease: "sine.inOut" 
        });


        updateEnergyLine(ghosts);

        await new Promise(r => setTimeout(r, 160));
    }
};

function updateEnergyLine(ghosts) {
    if (ghosts.length < 2 || !lineGraphics) return;
    
    lineGraphics.clear();
    lineGraphics.blendMode = 'add';
    
    // ⚡ FIX: Safer check for Pixi v8 filters
    if (!lineGraphics.filters || lineGraphics.filters.length === 0) {
        lineGraphics.filters = [new PIXI.BlurFilter({ strength: 4 })];
    }
    
    // LAYER 1: Thick Outer Glow
    lineGraphics.moveTo(ghosts[0].x, ghosts[0].y);
    lineGraphics.setStrokeStyle({ width: 16, color: 0xFFD700, alpha: 0.2 });
    for (let i = 1; i < ghosts.length; i++) { lineGraphics.lineTo(ghosts[i].x, ghosts[i].y); }
    lineGraphics.stroke();

    // LAYER 2: Sharp Inner Beam
    lineGraphics.moveTo(ghosts[0].x, ghosts[0].y);
    lineGraphics.setStrokeStyle({ width: 4, color: 0xFFFFFF, alpha: 0.8 });
    for (let i = 1; i < ghosts.length; i++) { lineGraphics.lineTo(ghosts[i].x, ghosts[i].y); }
    lineGraphics.stroke();
}

const clear = () => {
    if (winGroup) winGroup.removeChildren();
    if (lineGraphics) lineGraphics.clear();
    if (dimmer) dimmer.visible = false;
};

onUnmounted(() => app?.destroy(true));
defineExpose({ celebrateLine, clear });
</script>

<style scoped>
.celebration-layer {
    position: fixed; /* Lock to window viewport */
    top: 0; left: 0;
    width: 100vw; 
    /* Use dynamic viewport height to match App.vue and handle browser bars */
    height: 100dvh; 
    z-index: 1000;
    pointer-events: none;
    overflow: hidden;
}
</style>