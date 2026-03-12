<template>
  <div class="reel">
    <div v-for="(symbol, index) in symbols" :key="index" class="symbol">
        <div class="symbol-box"
             :class="{ 'shine-effect': symbol.isSpecial }"
        >
            <div :class="['symbol-icon',  symbol.className, { 'is-special': symbol.isSpecial }]"></div>
        </div>
    </div>
  </div>
</template>

<script setup>
import Symbol from './Symbol.vue';
import { ref } from 'vue';

defineProps({
  symbols: { type: Array, required: true },
  reelIndex: { type: Number, required: true }
});
</script>

<style>


</style>