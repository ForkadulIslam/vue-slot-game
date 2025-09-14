<template>
  <div class="reel-container">
    <div class="reel">
      <div 
        class="reel-strip" 
        :class="{ 'spinning': isSpinning }"
        :style="stripStyle"
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
import { computed } from 'vue';
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

const stripStyle = computed(() => {
  const style = {
    transitionDelay: `${props.delay}ms`,
  };

  if (props.isSpinning) {
    // When spinning, the strip is long. We translate it upwards.
    const travelDistance = props.symbols.length - 3;
    style.transform = `translateY(-${travelDistance * (100 / 3)}%)`;
    style.transitionDuration = '1.5s'; // Ensure duration is set for the spin
  } else {
    // When not spinning, we are at the final state (or initial state).
    // The strip has only 3 symbols. We want it at the top.
    style.transform = 'translateY(0)';
    // Set duration to 0 to prevent the reverse animation. It will snap instantly.
    style.transitionDuration = '0s'; 
  }
  
  return style;
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
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Ease with bounce */
}

.reel-strip.spinning {
  transition-timing-function: ease-in; /* Accelerate at the start */
}

.reel-strip > * {
  height: var(--symbol-height);
  flex-shrink: 0;
}
</style>