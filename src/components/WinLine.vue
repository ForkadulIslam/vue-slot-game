<template>
  <path
    :d="pathData"
    fill="none"
    stroke="gold"
    stroke-width="5"
    stroke-linecap="round"
    stroke-linejoin="round"
    :style="{ filter: 'drop-shadow(0 0 5px gold)' }"
    ref="pathElement"
  />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  lineDefinition: {
    type: Array,
    required: true,
  },
  containerWidth: {
    type: Number,
    required: true,
  },
  containerHeight: {
    type: Number,
    required: true,
  },
  reelsNumber: {
    type: Number,
    required: true,
  },
  reelsSymbolsNumber: {
    type: Number,
    required: true,
  }
});

const pathElement = ref(null);

const symbolWidth = computed(() => props.containerWidth / props.reelsNumber);
const symbolHeight = computed(() => props.containerHeight / props.reelsSymbolsNumber);

const pathData = computed(() => {
  if (!props.lineDefinition) return '';

  const points = props.lineDefinition.map((row, reelIndex) => {
    const x = reelIndex * symbolWidth.value + symbolWidth.value / 2;
    const y = row * symbolHeight.value + symbolHeight.value / 2;
    return { x, y };
  });

  return points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`).join(' ');
});

const animateLine = () => {
  const el = pathElement.value;
  if (!el) return;

  // Ensure the path is visible before animating
  gsap.set(el, { opacity: 1 });

  const length = el.getTotalLength();
  gsap.set(el, { strokeDasharray: length, strokeDashoffset: length });
  gsap.to(el, {
    strokeDashoffset: 0,
    duration: 0.5,
    ease: 'power1.inOut',
    onComplete: () => {
      // Add a repeating pulse animation
      gsap.to(el, {
        opacity: 0.5,
        duration: 0.7,
        yoyo: true,
        repeat: -1,
        ease: 'power1.inOut'
      });
    }
  });
};

onMounted(() => {
  animateLine();
});

// If the line definition changes for some reason, re-animate
watch(() => props.lineDefinition, () => {
    gsap.killTweensOf(pathElement.value);
    animateLine();
}, { deep: true });

</script>
