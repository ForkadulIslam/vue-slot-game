<template>
  <div class="symbol">
    <img :src="symbolUrl" :alt="symbolName" />
  </div>
</template>

<script setup>
defineProps({
  symbolUrl: {
    type: String,
    required: true,
  },
  symbolName: {
    type: String,
    required: true,
  }
});
</script>

<style scoped>
.symbol {
  width: 80%; /* Control the size of the symbol within its container */
  padding-top: 80%; /* This creates a square aspect ratio (height matches width) */
  height: 0; /* Height is determined by padding-top */
  position: relative;
  box-sizing: border-box;
}

.symbol img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%; /* Make the symbol image circular */
}
</style>