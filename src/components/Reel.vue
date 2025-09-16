<template>
  <div class="reel">
    <Symbol v-for="(symbol, index) in symbols" 
      :key="index"
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

<style>

</style>