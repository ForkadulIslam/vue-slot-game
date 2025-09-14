<template>
  <div class="reel-container">
    <div 
      class="reel-strip" 
      :class="{ 
        'is-spinning': isSpinning,
        'is-stopping': isStopping
      }"
      :style="stripStyle"
      @animationend="onAnimationEnd"
    >
      <Symbol
        v-for="(symbol, index) in symbols"
        :key="index"
        :symbolName="symbol.name"
        :symbolUrl="symbol.url"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
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

const isStopping = ref(false);

const stripStyle = computed(() => {
  const travelDistance = props.symbols.length > 3 ? props.symbols.length - 3 : 0;
  const duration = 1500 + props.delay * 2;
  
  return {
    '--travel-distance': `-${travelDistance * (100 / 3)}%`,
    '--duration': `${duration}ms`,
    '--delay': `${props.delay}ms`
  };
});

watch(() => props.isSpinning, (spinning) => {
  if (spinning) {
    isStopping.value = false;
  } else {
    isStopping.value = true;
  }
});

function onAnimationEnd() {
  if (isStopping.value) {
    isStopping.value = false;
  }
}
</script>

<style scoped>
.reel-container {
  flex: 1;
  overflow: hidden;
  background: rgba(22, 22, 22, 0.5);
  border-radius: 10px;
  height: 100%;
  border: 2px solid #444;
  --symbol-height: calc(100% / 3);
  display: flex;
  align-items: center;
}

.reel-strip {
  display: flex;
  flex-direction: column;
  width: 100%;
  transform: translateY(0);
}

.reel-strip.is-spinning {
  animation: spin var(--duration) linear infinite;
}

.reel-strip.is-stopping {
  animation: stop var(--duration) cubic-bezier(0.6, 0, 0.2, 1) 1;
  animation-fill-mode: forwards;
}

@keyframes spin {
  0% {
    transform: translateY(0);
    filter: blur(0px);
  }
  5% {
    transform: translateY(5%);
    filter: blur(1px);
  }
  10% {
    transform: translateY(-10%);
    filter: blur(2px);
  }
  20% {
    transform: translateY(var(--travel-distance));
    filter: blur(5px);
  }
  80% {
    transform: translateY(var(--travel-distance));
    filter: blur(5px);
  }
  90% {
    transform: translateY(-10%);
    filter: blur(2px);
  }
  95% {
    transform: translateY(5%);
    filter: blur(1px);
  }
  100% {
    transform: translateY(0);
    filter: blur(0px);
  }
}

@keyframes stop {
  0% {
    transform: translateY(var(--travel-distance));
    filter: blur(5px);
  }
  100% {
    transform: translateY(0);
    filter: blur(0px);
  }
}

.reel-strip > * {
  height: var(--symbol-height);
  flex-shrink: 0;
}
</style>