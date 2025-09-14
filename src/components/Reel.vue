<template>
  <div class="reel-container">
    <div class="reel-strip">
      <div 
        v-for="(symbol, index) in displaySymbols" 
        :key="index" 
        class="symbol-container"
        :class="animationClass"
        :style="{ animationDelay: `${index * 100 + delay}ms` }"
        @animationend="onAnimationEnd(index)"
      >
        <Symbol
          :symbolName="symbol.name"
          :symbolUrl="symbol.url"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import Symbol from './Symbol.vue';

const props = defineProps({
  symbols: { type: Array, required: true },
  isSpinning: { type: Boolean, default: false },
  delay: { type: Number, default: 0 }
});

const displaySymbols = ref(props.symbols);
const phase = ref('resting'); // 'resting', 'out', 'in'

// The animation class is computed based on the phase
const animationClass = computed(() => {
  if (phase.value === 'out') return 'is-sliding-out';
  if (phase.value === 'in') return 'is-sliding-in';
  return '';
});

// When isSpinning starts, begin the 'out' phase
watch(() => props.isSpinning, (spinning) => {
  if (spinning) {
    phase.value = 'out';
  }
});

// This handler is called when any symbol finishes its animation
function onAnimationEnd(index) {
  // We only care about the last symbol in the column finishing its animation
  if (index !== props.symbols.length - 1) {
    return;
  }

  if (phase.value === 'out') {
    // The 'out' animation is done, so swap the symbols and start the 'in' phase
    displaySymbols.value = props.symbols;
    phase.value = 'in';
  } else if (phase.value === 'in') {
    // The 'in' animation is done, so we are back to resting
    phase.value = 'resting';
  }
}

// If the symbols prop changes while we are resting (e.g., initial load), update immediately
watch(() => props.symbols, (newSymbols) => {
    if (phase.value === 'resting') {
        displaySymbols.value = newSymbols;
    }
});

</script>

<style scoped>
.reel-container {
  flex: 1;
  overflow: hidden; /* This is important to hide the sliding symbols */
  background: rgba(22, 22, 22, 0.5);
  border-radius: 10px;
  height: 100%;
  border: 2px solid #444;
  --symbol-height: calc(100% / 3);
}

.reel-strip {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.symbol-container {
  height: var(--symbol-height);
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.is-sliding-out {
  animation: slide-out 0.4s forwards cubic-bezier(0.55, 0.085, 0.68, 0.53); /* EaseInBack */
}

.is-sliding-in {
  animation: slide-in 0.6s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); /* EaseOutBack */
}

@keyframes slide-out {
  0% {
    transform: scale(1) translateX(0);
    opacity: 1;
  }
  30% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(0.8) translateX(-150%);
    opacity: 0;
  }
}

@keyframes slide-in {
  0% {
    transform: scale(0.8) translateX(150%);
    opacity: 0;
  }
  70% {
    transform: scale(1.05) translateX(-5%);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateX(0);
    opacity: 1;
  }
}
</style>