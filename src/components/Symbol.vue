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
}

.symbol img {
  width: 90%;
  height: 90%;
  object-fit: contain;
}
</style>
