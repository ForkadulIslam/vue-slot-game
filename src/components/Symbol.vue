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
  width: 65px;
  height: 65px;
  background: radial-gradient(circle, #4a4a4a 0%, #2c2c2c 100%);
  box-shadow: inset 0 0 10px rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
}

.symbol img {
  width: 70%;
  border-radius: 50%;
  object-fit: contain;
}
</style>