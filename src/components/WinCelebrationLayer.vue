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
let lineGraphics = null; 

// --- ⚡ OBJECT POOLING ---
let ghostPool = [];
const MAX_POOL_SIZE = 15; // Max potential ghosts (e.g., 3 lines of 5)
const PRE_WARM_COUNT = 5; // Create 5 ghosts on startup

/**
 * Factory function to create a single, compound "ghost" object.
 * This includes the container, sprites, and mask.
 */
const createGhostObject = () => {
    const ghostContainer = new PIXI.Container();
    ghostContainer.visible = false; // Start invisible

    // 1. THE GLOW
    const glow = new PIXI.Sprite(PIXI.Assets.get(glowBurst));
    glow.anchor.set(0.5);
    glow.blendMode = 'add';
    glow.name = 'glow'; // Name for easy retrieval

    // 2. THE MASK (to make the glow circular)
    const mask = new PIXI.Graphics();
    mask.name = 'mask';
    glow.mask = mask;
    
    // 3. THE SYMBOL GHOST
    const ghost = new PIXI.Sprite(); // Texture set on retrieval
    ghost.anchor.set(0.5);
    ghost.name = 'ghost';

    ghostContainer.addChild(mask, glow, ghost);
    return ghostContainer;
};

const getGhostFromPool = () => {
    if (ghostPool.length > 0) {
        const ghostObj = ghostPool.pop();
        ghostObj.visible = true;
        return ghostObj;
    }
    // Pool is empty, create a new object on-the-fly
    return createGhostObject();
};

const returnGhostToPool = (ghostObj) => {
    // Reset properties for reuse
    ghostObj.visible = false;
    ghostObj.position.set(0, 0);
    ghostObj.scale.set(1);
    ghostObj.alpha = 1;
    
    // Specifically reset animated properties on children
    const ghost = ghostObj.getChildByName('ghost');
    ghost.width = 0;
    ghost.height = 0;
    
    const glow = ghostObj.getChildByName('glow');
    glow.alpha = 0.7; // Default alpha

    if (ghostPool.length < MAX_POOL_SIZE) {
        ghostPool.push(ghostObj);
    } else {
        // If pool is full, destroy the object to prevent memory leaks
        ghostObj.destroy({ children: true });
    }
};
// --- END OBJECT POOLING ---

onMounted(async () => {
    app = new PIXI.Application();
    await app.init({
        resizeTo: window,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio, 2),
        autoDensity: true,
    });
    canvasContainer.value.appendChild(app.canvas);

    dimmer = new PIXI.Graphics()
        .rect(0, 0, window.innerWidth, window.innerHeight)
        .fill({ color: 0x0a0a1a, alpha: 0.6 });
    dimmer.visible = false;
    
    winGroup = new PIXI.Container();
    lineGraphics = new PIXI.Graphics();
    
    app.stage.addChild(dimmer, lineGraphics, winGroup);

    // Preload assets
    const [masterTexture] = await Promise.all([
        PIXI.Assets.load(symbolsSprite),
        PIXI.Assets.load(glowBurst) // Ensure glow texture is loaded
    ]);

    // Create symbol textures from spritesheet
    Object.keys(SYMBOL_MAP).forEach(key => {
        const frame = SYMBOL_MAP[key];
        textures[key] = new PIXI.Texture({
            source: masterTexture,
            frame: new PIXI.Rectangle(frame.x, frame.y, SYMBOL_W, SYMBOL_H)
        });
    });

    // Pre-warm the object pool
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
        
        // --- ⚡ POOL USAGE ---
        const ghostContainer = getGhostFromPool();
        ghostContainer.position.set(rect.left + rect.width / 2, rect.top + rect.height / 2);

        const glow = ghostContainer.getChildByName('glow');
        const mask = ghostContainer.getChildByName('mask');
        const ghost = ghostContainer.getChildByName('ghost');
        
        // Update properties of the recycled object
        ghost.texture = texture;
        glow.width = rect.width;
        glow.height = rect.height;
        
        // Redraw mask for the specific symbol size
        mask.clear().circle(0, 0, rect.width / 2).fill(0xffffff);

        winGroup.addChild(ghostContainer);
        activeGhosts.push(ghostContainer); 

        // ANIMATION SEQUENCE (no changes needed here)
        gsap.to(ghost, { 
            width: rect.width * 0.7, 
            height: rect.height * 0.7, 
            duration: 0.4, 
            ease: "back.out(2)" 
        });
        
        gsap.to(glow, { 
            alpha: 0.2, 
            duration: 0.5, 
            ease: "sine.inOut" 
        });

        updateEnergyLine(activeGhosts);
        await new Promise(r => setTimeout(r, 160));
    }
};

function updateEnergyLine(ghosts) {
    if (ghosts.length < 2 || !lineGraphics) return;
    
    lineGraphics.clear();
    lineGraphics.blendMode = 'add';
    
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
    // --- ⚡ POOL USAGE ---
    // Return all active ghosts to the pool instead of destroying them
    for (let i = winGroup.children.length - 1; i >= 0; i--) {
        returnGhostToPool(winGroup.children[i]);
    }
    winGroup.removeChildren(); // Efficiently detaches them all
    
    if (lineGraphics) lineGraphics.clear();
    if (dimmer) dimmer.visible = false;
};

onUnmounted(() => {
    // Destroy the app and any remaining objects in the pool
    ghostPool.forEach(ghost => ghost.destroy({ children: true }));
    ghostPool = [];
    app?.destroy(true);
});

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