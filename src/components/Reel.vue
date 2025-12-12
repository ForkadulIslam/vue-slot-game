<template>
  <div class="reel">
    <div v-for="(symbol, index) in symbols" :key="index" class="symbol">
      <div :class="['symbol-icon',  symbol.className]"></div>
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
  .reel{
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    box-sizing: border-box;
    z-index: 2; /* Ensure symbols are above the glow */

    /* Vertical separation lines */
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    border-left: 1px solid rgba(0, 0, 0, 0.3);

    /* Cylinder effect on the strip */
    /* background: linear-gradient(
      to right,
      rgba(0,0,0,0.4) 0%,
      transparent 30%,
      transparent 70%,
      rgba(0,0,0,0.4) 100%
    ); */
    will-change: transform;
    transform: translate3d(0,0,0);
  }

  .reel:last-child {
    border-right: none;
  }

  .symbol {
    width: 86px;
    height: 100px;
    /* background: radial-gradient(circle, #4a4a4a 0%, #2c2c2c 100%);
    box-shadow: inset 0 0 10px rgba(0,0,0,0.7); */
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden; /* Ensure images don't overflow */
    flex-shrink: 0; /* Prevent symbols from shrinking */
    position: relative;
    will-change: transform;
    transform: translateZ(0);

  }


  .symbol-icon {

    width: 153px;
    height: 136px;

    background-image: url('@/assets/images/symbols_sprite.png');
    background-repeat: no-repeat;

    position: absolute;
    top: 50%;
    left: 50%;

    /* Zoom in slightly and center */
    transform: translate(-50%, -50%) scale(0.70);
    transform-origin: center center;

    will-change: transform;
  }


  /* SPRITE POSITIONS */
  /* Row 1 */
  .icon-diamond { background-position: -28px 1px }
  .icon-heart   { background-position: -153px 0 }
  .icon-club    { background-position: -306px 0 }
  .icon-spade   { background-position: -428px -1px }
  /* Row 2 */
  .icon-K       { background-position: -35px -120px }
  .icon-Q       { background-position: -172px -118px }
  .icon-J       { background-position: -288px -120px }
  .icon-A       { background-position: -427px -118px }
  /* Row 3 */
  .icon-scatter { background-position: -33px -247px }
  .icon-bonus   { background-position: -163px -242px }
  .icon-wild    { background-position: -295px -242px }
  .icon-777     { background-position: -459px -272px }

</style>