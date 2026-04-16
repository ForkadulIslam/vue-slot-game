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
  AnimatedSprite // Add this
} from 'pixi.js';
import { gsap } from 'gsap';


let vfxGroup = null;
// ⚡ CORE DIMENSIONS (Source Texture)
const SYMBOL_W = 153;
const SYMBOL_H = 136;

const SYMBOL_MAP = {

    /* Filler symbol - Non payable */
    'icon-777':     { x: 432, y: 235 },

    /* High value symbols */
    'icon-A':       { x: 427, y: 118 },
    'icon-K':       { x: 35,  y: 118 },
    'icon-Q':       { x: 172, y: 118 },
    'icon-J':       { x: 302, y: 118 },

    
    /* Low value symbols */
    'icon-spade':   { x: 428, y: 0 },
    'icon-diamond': { x: 31,  y: 0 },


    /* High Value (These will get the is-special class) */
    'icon-scatter': { x: 33,  y: 247 },
    'icon-wild':    { x: 295, y: 242 },

    /* Optional symbol - Non use */
    // 'icon-heart':   { x: 153, y: 0 },
    // 'icon-club':    { x: 306, y: 0 },
    // 'icon-bonus':   { x: 163, y: 242 },
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

// --- VFX SYMBOL EXPLOSION TRIGGER ---
const clearPlayExplosion = () => {
    if(vfxGroup){
        while (vfxGroup.children.length > 0) {
            const child = vfxGroup.removeChildAt(0);
            child.destroy({ children: true });
        }
    }
}
const playExplosion = (specialSymbols) => {

    const elements = specialSymbols[0];
    let rect = elements.getBoundingClientRect();
    let x = rect.x;
    let y = rect.y;


    // 1. Retrieve the spritesheet from the Assets cache
    const sheet = Assets.get('explosionVFXSheet');
    if (!sheet) return console.error("VFX Error: 'explosionSheet' not found in cache.");

    // 2. Collect Animation Frames
    // Because you used leading zeros (.00, .01), a simple sort() now works perfectly.
    let animationFrames = [];
    animationFrames = Object.keys(sheet.textures)
        .sort() // Correctly sorts 00, 01, 02... 35
        .map(key => sheet.textures[key]);

    if (animationFrames.length === 0) return;

    // 3. Create the AnimatedSprite
    //console.log(animationFrames)
    const anim = new AnimatedSprite(animationFrames);

    // 4. Visual Configuration (Cinematic Style)
    console.log(elements, rect);
    anim.anchor.set(0);
    anim.position.set(rect.left, rect.top);
    
    // Set scale to 1.5 to 2.0 to cover the symbol area (based on 256px frame)
    anim.scale.set(.4); 
    
    // speed 0.5 to 0.7 matches the energetic PG Soft feel
    anim.animationSpeed = .6; 
    anim.loop = true;
    
    // Use ADDITIVE blending so the orange sparks glow against the reels
    anim.blendMode = 'add'; 

    // 5. Memory Management (Critical for Mobile)
    anim.onComplete = () => {
        // Explicitly remove and destroy to prevent GPU memory leaks
        if (anim.parent) anim.parent.removeChild(anim);
        anim.destroy();
    };

    // 6. Add to your existing winGroup and play
    vfxGroup.addChild(anim);
    anim.play();

};

// -- VSF SWARD EMBER TRIGGER
const playSwordEmber = (x, y) => {

    const sheet = Assets.get('swordEmberVFXSheet');
    if (!sheet) return;

    // 1. Collect frames
    const animationFrames = Object.keys(sheet.textures)
        .sort()
        .map(key => sheet.textures[key]);

    console.log(animationFrames);
    const anim = new AnimatedSprite(animationFrames);

    // 2. Setup
    anim.anchor.set(0.5);
    anim.position.set(x, y);
    anim.blendMode = 'add';
    anim.animationSpeed = 0.25; 
    anim.loop = true;
    
    // 3. ⚡ THE "3D" TRICK
    // We start small and scale up rapidly to make it look like 
    // the sword is slashing toward the camera.
    anim.scale.set(0.8);
    gsap.to(anim.scale, {
        x: 2.2,
        y: 2.2,
        duration: 0.4,
        ease: "power2.out"
    });

    // 4. Memory Management
    anim.onComplete = () => {
        if (anim.parent) anim.parent.removeChild(anim);
        anim.destroy();
    };

    vfxGroup.addChild(anim);
    anim.play();

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

    vfxGroup = new Container(); // ⚡ NEW: Dedicated VFX layer
    
    app.stage.addChild(dimmer, lineGraphics, winGroup, uiGroup, vfxGroup);

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
    const map = { 
        'Ace': 'icon-A', 
        'King': 'icon-K', 
        'Queen': 'icon-Q', 
        'Jack': 'icon-J', 
        'Diamond': 'icon-diamond', 
        'Spade': 'icon-spade',
    };
    return map[id] || `icon-${id.toLowerCase()}`;
};

const celebrateLine = async (lineData, allSymbolElements) => {
    //console.log(lineData, allSymbolElements);
    clearLineWinCelebration(); 
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

        gsap.to(ghost, { width: rect.width, height: rect.height * 0.7, duration: 0.4, ease: "back.out(2)" });
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


const clearLineWinCelebration = () => {
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





defineExpose({ celebrateLine, clearLineWinCelebration, playExplosion, clearPlayExplosion, playSwordEmber });
</script>

<style scoped>
.celebration-layer {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh; 
    z-index: 1000; pointer-events: none; overflow: hidden;
}
</style>