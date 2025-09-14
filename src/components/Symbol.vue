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
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2% 0; /* Add vertical padding to create space between symbols */
}

.symbol img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
