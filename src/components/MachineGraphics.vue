<template>
  <div class="machine-graphics">
    <img src="../assets/images/machine-graphics.png" alt="Slot Machine Graphic" class="machine-graphic-image" />
  </div>
</template>

<script setup>
// No script logic needed for a static graphic component
</script>

<style scoped>
.machine-graphics {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: -100px; /* Adjust as needed to overlap with SlotMachine */
  z-index: 10; /* Ensure it's on top */
}

.machine-graphic-image {
  width: 80%; /* Adjust size as needed */
  max-width: 400px; /* Max width for the image */
  height: auto;
}
</style>