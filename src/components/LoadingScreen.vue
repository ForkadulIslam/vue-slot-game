<template>
  <div class="loading-overlay">
    <div v-if="!error" class="loading-container">
      <div class="spinner"></div>
      <p>Loading Assets...</p>
    </div>
    <div v-if="error" class="error-container">
      <p class="error-title">Loading Error</p>
      <p class="error-message">{{ error }}</p>
      <button @click="refreshPage" class="refresh-button">Refresh</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  error: {
    type: String,
    default: null
  }
});

function refreshPage() {
  window.location.reload();
}
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  color: white;
  text-align: center;
  padding: 20px;
  box-sizing: border-box;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid white;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

p {
  font-size: 1.2rem;
  letter-spacing: 1px;
}

.error-container {
  max-width: 400px;
}

.error-title {
  font-size: 1.8rem;
  color: #ff4d4d;
  margin-bottom: 15px;
  font-weight: bold;
}

.error-message {
  color: #ffcccc;
  margin-bottom: 25px;
  font-size: 1rem;
  line-height: 1.5;
  white-space: pre-wrap; /* Ensures error message formatting is kept */
}

.refresh-button {
  background: linear-gradient(145deg, #FF1493, #8A2BE2);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  letter-spacing: 0.5px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.refresh-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}
</style>