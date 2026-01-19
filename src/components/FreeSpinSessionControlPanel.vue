<template>
  <div class="free-spin-control-panel">
    <div class="win-display">
      <span>WIN:</span>
      <span class="amount">{{ displayedWinAmount.toFixed(2) }}</span>
    </div>

    <button
      @click="handleSpin"
      :disabled="isSpinning"
      class="spin-button"
    >
      <span class="button-text">FREE SPIN</span>
      <span class="spins-left">{{ freeSpinsAvailable }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSlotGame } from '../composables/useSlotGame';

const {
  isSpinning,
  displayedWinAmount,
  freeSpinsAvailable,
  spin,
} = useSlotGame();

const handleSpin = () => {
  if (!isSpinning.value) {
    spin();
  }
};
</script>

<style scoped>
.free-spin-control-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 15px 0;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 10px;
  margin-top: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 500px;
}

.win-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #FFD700; /* Gold color for wins */
  font-size: 1.1em;
  font-weight: bold;
}

.win-display .amount {
  font-size: 1.8em;
  color: #FFFFFF;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.7);
  min-width: 80px; /* Ensure space for amount */
  text-align: center;
}

.spin-button {
  background: linear-gradient(180deg, #ff6b6b 0%, #ee0e0e 100%); /* Red gradient */
  border: 3px solid #ffdd57; /* Gold border */
  border-radius: 50%;
  width: 100px;
  height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  font-size: 1.2em;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(255, 0, 0, 0.6), inset 0 0 8px rgba(255, 255, 255, 0.5);
  transition: transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out;
  position: relative;
  overflow: hidden; /* For inner glow/animation */
}

.spin-button:disabled {
  background: linear-gradient(180deg, #9e9e9e 0%, #616161 100%);
  border-color: #757575;
  cursor: not-allowed;
  box-shadow: none;
}

.spin-button:active:not(:disabled) {
  transform: scale(0.95);
  box-shadow: 0 0 8px rgba(255, 0, 0, 0.4), inset 0 0 4px rgba(255, 255, 255, 0.3);
}

.spin-button .button-text {
  font-size: 0.9em;
  line-height: 1;
  margin-bottom: 5px;
}

.spin-button .spins-left {
  font-size: 2em;
  line-height: 1;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
}
</style>