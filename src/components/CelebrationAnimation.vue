<template>
  <div v-if="isActive" class="celebration-overlay" ref="overlayEl"></div>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue';
import { gsap } from 'gsap';
import magicGirlGif from '../assets/images/magic_girl.gif';


</script>

<style scoped>

</style>