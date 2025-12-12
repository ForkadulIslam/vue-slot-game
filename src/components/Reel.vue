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

  /* --- ANIMATIONS --- */
  @keyframes sheen-sweep {
      0% { transform: translateX(-150%) skewX(-25deg); }
      100% { transform: translateX(150%) skewX(-25deg); }
  }

  @keyframes pulse-pop {
      0% { transform: translate(-50%, -50%) scale(0.75); }
      50% { transform: translate(-50%, -50%) scale(0.82); } /* Pop bigger */
      100% { transform: translate(-50%, -50%) scale(0.75); }
  }




  .reel{
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    box-sizing: border-box;
    z-index: 2; /* Ensure symbols are above the glow */

      /* Gold vertical dividers */
      border-right: 1px solid rgba(255, 215, 0, 0.15);
      border-left: 1px solid rgba(0, 0, 0, 0.4);

    /* Cylinder effect on the strip */
    background: linear-gradient(
      to right,
      rgba(0,0,0,0.4) 0%,
      transparent 30%,
      transparent 70%,
      rgba(0,0,0,0.4) 100%
    );
    will-change: transform;
    transform: translate3d(0,0,0);
  }

  .reel:last-child {
    border-right: none;
  }

  .symbol {
      width: 55px;
    height: 70px;
    /* background: radial-gradient(circle, #4a4a4a 0%, #2c2c2c 100%);
    box-shadow: inset 0 0 10px rgba(0,0,0,0.7); */
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0; /* Prevent symbols from shrinking */
    position: relative;
    will-change: transform;
    transform: translateZ(0);
    overflow: hidden; /* Allow special symbols to glow outside */

  }

  /* The Box holds the icon and the sheen */
  .symbol-box {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden; /* Contains the sheen sweep */
      border-radius: 8px; /* Slight rounding */
  }

  /* --- THE SHEEN EFFECT (Light Sweep) --- */
  .symbol-box.shine-effect::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      /* The white bar of light */
      background: linear-gradient(
              90deg,
              rgba(255,255,255,0) 0%,
              rgba(255, 255, 255, 0.4) 50%,
              rgba(255,255,255,0) 100%
      );
      /* Start hidden to the left */
      transform: translateX(-150%) skewX(-25deg);
      /* Sweep across every 3 seconds */
      animation: sheen-sweep 3s ease-in-out;
      pointer-events: none;
      z-index: 10;
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
    transform: translate(-50%, -50%) scale(0.40);
    transform-origin: center center;

    will-change: transform;
      filter: brightness(0.9); /* Slight dim for normal items to make special ones pop */
      transition: filter 0.3s;
  }


  /* --- SPECIAL SYMBOLS (Wild, Scatter, Bonus, 7) --- */
  .symbol-icon.is-special {

  }

  /* SPRITE POSITIONS */
  /* Low Value */
  .icon-diamond { background-position: -28px 1px }
  .icon-heart   { background-position: -153px 0 }
  .icon-club    { background-position: -306px 0 }
  .icon-spade   { background-position: -428px -1px }
  .icon-K       { background-position: -35px -120px }
  .icon-Q       { background-position: -172px -118px }
  .icon-J       { background-position: -302px -120px }
  .icon-A       { background-position: -427px -118px }

  /* High Value (These will get the is-special class) */
  .icon-scatter { background-position: -33px -247px }
  .icon-bonus   { background-position: -163px -242px }
  .icon-wild    { background-position: -295px -242px }
  .icon-777     { background-position: -459px -272px }

</style>