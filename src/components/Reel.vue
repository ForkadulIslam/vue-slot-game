<template>
  <div class="reel">
    <div ref="sheenOverlay" class="sheen-overlay" :style="{'--reel-index': reelIndex}"></div>
    <Symbol v-for="(symbol, index) in symbols" 
      :key="index"
      :symbolName="symbol.name"
      :symbolUrl="symbol.url"
    />
  </div>
</template>

<script setup>
import Symbol from './Symbol.vue';
import { ref } from 'vue';

const sheenOverlay = ref(null);

defineProps({
  symbols: { type: Array, required: true },
  reelIndex: { type: Number, required: true }
});
</script>

<style>
.reel{
  position: relative;
  
}
@keyframes sheen-sweep {
  0% {
    transform: translateX(-150%) skewX(-30deg);
  }
  100% {
    transform: translateX(150%) skewX(-30deg);
  }
}
.sheen-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
  pointer-events: none;
  z-index: 2; /* Position it above the background but below other elements */
  animation: sheen-sweep 5s infinite;
  animation-delay: calc(var(--reel-index) * 0.7s);
}
</style>