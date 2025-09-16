<template>
  <div class="reel">
    <Symbol v-for="(symbol, index) in symbols" 
      :key="index" 
      class=""
      :symbolName="symbol.name"
      :symbolUrl="symbol.url"
    />
  </div>
</template>

<script setup>
import Symbol from './Symbol.vue';

defineProps({
  symbols: { type: Array, required: true },
  reelIndex: { type: Number, required: true }
});
</script>

<style scoped>
.reel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
}
</style>
