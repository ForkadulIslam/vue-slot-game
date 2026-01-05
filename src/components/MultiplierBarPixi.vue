<template>
    <div class="multiplier-header">
        <div class="chain left"></div>
        <div class="chain right"></div>

        <div ref="pixiContainer" class="pixi-multiplier-canvas"></div>

        <!-- DOM Overlay for coordinates -->
        <div class="mul-list dom-overlay">
            <div v-for="(mul, index) in multipliers" :key="index"
                class="mul-item" :class="{ 'active': activeIndex === index }">
                <span class="mul-text-hidden">x{{ mul }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, defineExpose } from 'vue';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import woodBar from '@/assets/images/wood_bar.webp';

const multipliers = [1, 2, 4, 8, 16];
const activeIndex = ref(0); 
const pixiContainer = ref(null);

let app = null;
let activeGroup = null; 
let sunburst = null;
let shine = null;
let textSprites = [];

const setActiveMultiplier = (multiplier) => {
    const index = multipliers.indexOf(multiplier);
    if (index !== -1) {
        activeIndex.value = index;
        animateTo(index);
    }
};

defineExpose({ setActiveMultiplier });

const initPixi = async () => {
    app = new PIXI.Application();
    await app.init({
        width: 420, height: 85, backgroundAlpha: 0,
        antialias: false, resolution: Math.min(window.devicePixelRatio, 2), autoDensity: true,
    });
    
    const canvas = app.canvas || app.view;
    if (pixiContainer.value) pixiContainer.value.appendChild(canvas);

    const woodTex = await PIXI.Assets.load(woodBar);
    
    const board = new PIXI.Sprite(woodTex);
    board.anchor.set(0.5);
    board.width = 420; board.height = 85;
    board.position.set(210, 42.5);
    app.stage.addChild(board);

    // Vignette
    const vignette = new PIXI.Graphics().rect(0, 0, 420, 85).fill({ color: 0x000000, alpha: 0.3 });
    vignette.mask = new PIXI.Graphics().roundRect(0,0,420,85,15).fill(0xffffff);
    app.stage.addChild(vignette);

    // Gold Rails
    const rails = new PIXI.Graphics()
        .rect(0, 0, 420, 3).fill({ color: 0xD4AF37, alpha: 0.6 })
        .rect(0, 82, 420, 3).fill({ color: 0xD4AF37, alpha: 0.6 });
    app.stage.addChild(rails);

    activeGroup = new PIXI.Container();
    app.stage.addChild(activeGroup);

    sunburst = new PIXI.Sprite(createSunburstTexture());
    sunburst.anchor.set(0.5); sunburst.blendMode = 'add'; sunburst.alpha = 0.35;
    activeGroup.addChild(sunburst);

    const glow = new PIXI.Sprite(createGlowTexture());
    glow.anchor.set(0.5); glow.blendMode = 'add';
    activeGroup.addChild(glow);

    // ⚡ FIXED TYPOGRAPHY: Using Hex Numbers and v8 Shadow syntax
    const spacing = 420 / 5;
    multipliers.forEach((val, i) => {
        const txt = new PIXI.Text({
            text: `x${val}`,
            style: {
                fontFamily: 'Georgia, serif',
                fontSize: 30,
                fontWeight: '900',
                fill: 0xffffff, // Standard white
                stroke: { color: 0x000000, width: 4 },
                // v8 DropShadow structure
                dropShadow: {
                    color: 0x000000,
                    alpha: 0.8,
                    blur: 4,
                    distance: 4
                }
            }
        });
        txt.anchor.set(0.5);
        txt.x = (spacing / 2) + (i * spacing);
        txt.y = 42.5;
        txt.alpha = 0.4;
        textSprites.push(txt);
        app.stage.addChild(txt);
    });

    // Gloss Shine
    shine = new PIXI.Sprite(createShineTexture());
    shine.anchor.set(0.5); shine.rotation = 0.5; shine.blendMode = 'add';
    const shineMask = new PIXI.Graphics().roundRect(0, 0, 420, 85, 15).fill(0xffffff);
    shine.mask = shineMask;
    app.stage.addChild(shineMask);
    app.stage.addChild(shine);

    animateTo(activeIndex.value);
    startLoops();
};

const animateTo = (index) => {
    if (!activeGroup) return;
    const spacing = 420 / 5;
    const targetX = (spacing / 2) + (index * spacing);

    // Move Lighting
    gsap.to(activeGroup, { x: targetX, y: 42.5, duration: 0.6, ease: "elastic.out(1, 0.75)" });

    textSprites.forEach((txt, i) => {
        const active = i === index;
        
        gsap.to(txt.scale, { x: active ? 1.3 : 1, y: active ? 1.3 : 1, duration: 0.4 });
        
        // ⚡ STABLE COLOR SWAP: Using simple Hex Numbers
        gsap.to(txt, { 
            alpha: active ? 1 : 0.4, 
            duration: 0.4 
        });

        // Toggle color directly to avoid array/string conversion bugs
        txt.style.fill = active ? 0xFFD700 : 0xFFFFFF; // Gold vs White
    });
};

const startLoops = () => {
    app.ticker.add((ticker) => {
        if (sunburst) sunburst.rotation += 0.008 * ticker.deltaTime;
    });
    const runSweep = () => {
        if (!shine || !app) return;
        gsap.fromTo(shine, { x: -200, y: 42.5 }, { x: 650, duration: 1.8, ease: "power2.inOut", delay: 5, onComplete: runSweep });
    };
    runSweep();
};

// Procedural Generators (Numbers are faster than strings)
function createSunburstTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    const rays = 10; ctx.translate(128, 128);
    for(let i=0; i<rays; i++) {
        ctx.rotate((Math.PI * 2) / rays);
        const g = ctx.createLinearGradient(0,0,128,0);
        g.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        g.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(128, -20); ctx.lineTo(128, 20); ctx.fill();
    }
    return PIXI.Texture.from(c);
}

function createGlowTexture() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64,64,0, 64,64,64);
    g.addColorStop(0, 'rgba(255, 255, 230, 1)');
    g.addColorStop(0.3, 'rgba(255, 200, 50, 0.6)');
    g.addColorStop(1, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,128,128);
    return PIXI.Texture.from(c);
}

function createShineTexture() {
    const c = document.createElement('canvas'); c.width = 200; c.height = 300;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0,0,200,0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.3)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,200,300);
    return PIXI.Texture.from(c);
}

onMounted(() => nextTick(() => initPixi()));
onUnmounted(() => app?.destroy(true));
</script>

<style scoped>
.multiplier-header {
    width: 95%; max-width: 420px; height: 85px; position: relative;
    display: flex; justify-content: center; margin-top: 5px; margin-bottom: 15px; z-index: 10;
}
.pixi-multiplier-canvas {
    width: 100%; height: 100%; border-radius: 15px; overflow: hidden;
    box-shadow: 0 12px 25px rgba(0,0,0,0.8);
}
.dom-overlay {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; justify-content: center; align-items: center; pointer-events: none;
}
.mul-list { width: 100%; display: flex; justify-content: space-around; align-items: center; }
.mul-item { width: 60px; height: 60px; display: flex; justify-content: center; align-items: center; }
.mul-text-hidden { opacity: 0; font-size: 2rem; font-weight: 900; }
.chain {
    position: absolute; top: -20px; width: 4px; height: 25px;
    background: #111; background-image: repeating-linear-gradient(to bottom, #333 0px, #111 4px);
    z-index: -1;
}
.chain.left { left: 40px; } .chain.right { right: 40px; }
</style>