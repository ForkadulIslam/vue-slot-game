<script setup>
import { onMounted, defineExpose } from 'vue';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

// Configuration based on your symbols_sprite.png logic
const SYMBOL_W = 153;
const SYMBOL_H = 136;
const SCALE = 0.5;

const SYMBOL_MAP = {
  'icon-A': { x: 427, y: 118 },
  'icon-K': { x: 35, y: 120 },
  'icon-Q': { x: 172, y: 118 },
  'icon-J': { x: 302, y: 120 },
  'icon-scatter': { x: 33, y: 247 },
  'icon-bonus':   { x: 163, y: 242 },
  'icon-wild':    { x: 295, y: 242 }
};

let masterTexture = null;
let ghostContainer = null;
let lineGraphics = null;

const props = defineProps({ app: Object });

onMounted(async () => {
  if (!props.app) return;
  
  ghostContainer = new PIXI.Container();
  lineGraphics = new PIXI.Graphics();
  props.app.stage.addChild(ghostContainer);
  props.app.stage.addChild(lineGraphics);

  masterTexture = await PIXI.Assets.load('@/assets/images/symbols_sprite.png');
});

const playWinLine = async (lineData, domElements) => {
  const ghosts = [];
  
  // Sequential reveal of symbols in the line
  for (const pos of lineData.symbolsPositions) {
    const symbolIndex = pos.reelIndex * 4 + pos.rowIndex; // Assuming 4 symbols per reel
    const el = domElements[symbolIndex];
    if (!el) continue;

    const rect = el.getBoundingClientRect();
    
    // Create Sub-Texture (Crop from master sprite)
    const frameData = SYMBOL_MAP[lineData.symbolName] || SYMBOL_MAP['icon-A'];
    const tex = new PIXI.Texture({
      source: masterTexture,
      frame: new PIXI.Rectangle(frameData.x, frameData.y, SYMBOL_W, SYMBOL_H)
    });

    const ghost = new PIXI.Sprite(tex);
    ghost.anchor.set(0.5);
    ghost.position.set(rect.left + rect.width/2, rect.top + rect.height/2);
    ghost.scale.set(0);

    // ⚡ ADD GLOW (Stunning additive effect)
    const glow = createGlow();
    ghost.addChildAt(glow, 0);

    ghostContainer.addChild(ghost);
    ghosts.push(ghost);

    // GSAP Pop
    gsap.to(ghost.scale, { x: SCALE, y: SCALE, duration: 0.4, ease: "back.out(2)" });
    
    // Draw connecting line incrementally
    updateEnergyLine(ghosts);

    await new Promise(r => setTimeout(r, 180));
  }
};

const createGlow = () => {
  const c = document.createElement('canvas');
  c.width = 150; c.height = 150;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(75,75,0, 75,75,75);
  g.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
  g.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,150,150);
  
  const glow = new PIXI.Sprite(PIXI.Texture.from(c));
  glow.anchor.set(0.5);
  glow.blendMode = 'add'; // ⚡ Light up effect
  glow.alpha = 0.5;
  return glow;
};

const updateEnergyLine = (ghosts) => {
  if (ghosts.length < 2) return;
  lineGraphics.clear();
  lineGraphics.setStrokeStyle({ width: 8, color: 0xFFD700, alpha: 0.7 });
  lineGraphics.blendMode = 'add';
  
  lineGraphics.moveTo(ghosts[0].x, ghosts[0].y);
  for (let i = 1; i < ghosts.length; i++) {
    lineGraphics.lineTo(ghosts[i].x, ghosts[i].y);
  }
  lineGraphics.stroke();
};

const clear = () => {
  ghostContainer.removeChildren();
  lineGraphics.clear();
};

defineExpose({ playWinLine, clear });
</script>