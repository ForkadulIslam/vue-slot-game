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
  /* Apply equal padding on all sides to create space from the reel borders */
  padding: 8%; 
  box-sizing: border-box; /* Ensure padding is included in the element's total width and height */
}

.symbol img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%; /* Make the symbol image circular */
}
</style>
