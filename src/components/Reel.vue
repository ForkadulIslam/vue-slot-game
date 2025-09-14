<template>
  <div class="reel-container">
    <div class="reel">
      <div 
        class="reel-strip" 
        :class="{ 'spinning': isSpinning }"
        :style="{ 
          transitionDelay: `${delay}ms`
        }"
      >
        <Symbol
          v-for="(symbol, index) in symbols"
          :key="index"
          :symbolName="symbol.name"
          :symbolUrl="symbol.url"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { watchEffect } from 'vue';
import Symbol from './Symbol.vue';

const props = defineProps({
  symbols: {
    type: Array,
    required: true,
  },
  isSpinning: {
    type: Boolean,
    default: false,
  },
  delay: {
    type: Number,
    default: 0,
  }
});

watchEffect(() => {
  console.log(`Reel - isSpinning prop changed to: ${props.isSpinning}`);
});
</script>

<style scoped>
.reel-container {
  flex: 1;
  overflow: hidden;
  background: rgba(22, 22, 22, 0.5);
  border-radius: 10px;
  height: 100%;
  border: 2px solid #444;
  /* Define symbol height based on container height */
  --symbol-height: calc(100% / 3);
}

.reel {
  height: 100%; /* The visible area for 3 symbols */
  position: relative;
}

.reel-strip {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  transition: transform 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Ease with bounce */
}

.reel-strip.spinning {
  transition-timing-function: ease-in; /* Accelerate at the start */
}

.reel-strip > * {
  height: var(--symbol-height);
  flex-shrink: 0;
}
</style>