<template>
  <div ref="pixiContainer" class="background-ambience"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { Application, Graphics, BlurFilter } from 'pixi.js';
import gsap from 'gsap';

const pixiContainer = ref(null);
let app = null;

onMounted(async () => {
  app = new Application();
  await app.init({
    resizeTo: window,
    backgroundAlpha: 0, // Transparent!
  });
  pixiContainer.value.appendChild(app.canvas);

  // --- 1. FIREFLIES EFFECT ---
  const fireflies = [];
  const totalFireflies = 30;

  for (let i = 0; i < totalFireflies; i++) {
    // Draw a simple glowing circle
    const fly = new Graphics();
    fly.circle(0, 0, 2 + Math.random() * 3);
    fly.fill({ color: 0xffd700, alpha: 0.6 }); 
    
    // Initial random position
    fly.x = Math.random() * app.screen.width;
    fly.y = Math.random() * app.screen.height;
    
    // Add a blur filter for "glow"
    fly.filters = [new BlurFilter(2)];
    
    app.stage.addChild(fly);
    fireflies.push(fly);

    // Animate each firefly independently using GSAP
    moveFirefly(fly);
  }
});

function moveFirefly(fly) {
  // Random movement logic
  const duration = 2 + Math.random() * 4;
  
  gsap.to(fly, {
    x: fly.x + (Math.random() - 0.5) * 200, // Move randomly X
    y: fly.y + (Math.random() - 0.5) * 200, // Move randomly Y
    alpha: Math.random(), // Flicker opacity
    duration: duration,
    ease: "sine.inOut",
    onComplete: () => {
      // Wrap around screen
      if(fly.x > app.screen.width) fly.x = 0;
      if(fly.x < 0) fly.x = app.screen.width;
      if(fly.y > app.screen.height) fly.y = 0;
      if(fly.y < 0) fly.y = app.screen.height;
      
      moveFirefly(fly); // Recursion
    }
  });
}

onBeforeUnmount(() => {
  if (app) app.destroy(true);
});
</script>

<style scoped>
.background-ambience {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Let clicks pass through */
  z-index: 0; /* Behind the slot machine */
}
</style>