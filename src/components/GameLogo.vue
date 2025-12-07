<!-- GameLogo.vue -->
<template>
  <div class="logo-container" ref="logoRef">
    <h1 class="game-title">MYSTIC <span class="highlight">SPIN</span></h1>
    <div class="subtitle">MEGAWAYS</div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import gsap from 'gsap';

const logoRef = ref(null);

onMounted(() => {
  // Idle Animation: Floating up and down
  gsap.to(logoRef.value, {
    y: 10,
    duration: 2.5,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut"
  });
  
  // Glow Pulse
  gsap.to(logoRef.value, {
    textShadow: "0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 100, 0, 0.5)",
    duration: 1.5,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut"
  });
});
</script>

<style scoped>
.logo-container {
  text-align: center;
  margin-bottom: 20px;
  position: relative;
  z-index: 5;
}

.game-title {
  font-family: 'Arial Black', sans-serif; /* Replace with your custom font */
  font-size: 3rem;
  color: white;
  margin: 0;
  letter-spacing: 2px;
  /* Gold/Metal Gradient Text */
  background: linear-gradient(to bottom, #fff 0%, #ffd700 50%, #b8860b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.8));
}

.highlight {
  font-style: italic;
}

.subtitle {
  color: #fbbf24;
  letter-spacing: 5px;
  font-size: 0.8rem;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0,0,0,1);
}
</style>