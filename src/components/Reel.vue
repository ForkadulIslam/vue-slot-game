<template>
  <div class="reel">
    <Symbol
      v-for="(symbol, index) in symbols"
      :key="index"
      :symbolName="symbol.name"
      :symbolUrl="symbol.url"
    />
  </div>
</template>

<script setup>
import Symbol from './Symbol.vue';

defineProps({
  symbols: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped>
.reel {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 1vw;
}
</style>
