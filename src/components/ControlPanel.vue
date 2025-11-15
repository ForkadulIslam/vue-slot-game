<template>
  <div class="control-panel-container">
    <div class="top-controls">
      <BalanceDisplay :balance="balance" />
      <div class="win-display">
        <span class="win-label">Win</span>
        <span class="win-amount">{{ displayedWinAmount.toFixed(2) }}</span>
      </div>
    </div>
    <div class="control-panel">
      <div class="bet-selection-container">
        <button @click="toggleBetTable" class="control-button bet-toggle-button">
          <svg class="bet-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
          <span class="bet-amount-display">{{ betAmount }}</span>
        </button>
        <div v-if="showBetTable" class="bet-table">
          <button v-for="bet in availableBets" :key="bet" @click="selectBet(bet)" class="bet-table-item">
            {{ bet }}
          </button>
        </div>
      </div>
      <button @click="spin" class="control-button spin-button" :disabled="isSpinning" :class="{ 'spinning': isSpinning }">
        <svg class="spin-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46c.9-.99 1.44-2.3 1.44-4.26 0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 9.74c-.9.99-1.44 2.3-1.44 4.26 0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
        </svg>
      </button>
      <button @click="toggleAutoplay" class="control-button autoplay-button" :class="{ 'active': isAutoplaying }">
        <img src="../assets/images/autoplay-icon.svg" alt="Autoplay" class="autoplay-icon" />
        <span>{{ isAutoplaying ? 'Stop' : 'Auto' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import BalanceDisplay from './BalanceDisplay.vue';
import { useSlotGame } from '../composables/useSlotGame';



const { balance, betAmount, availableBets, isSpinning, isAutoplaying, spin, setBetAmount, toggleAutoplay, displayedWinAmount } = useSlotGame();

const showBetTable = ref(false);

const toggleBetTable = () => {
  showBetTable.value = !showBetTable.value;
};

const selectBet = (bet) => {
  setBetAmount(bet);
  showBetTable.value = false;
};
</script>

<style scoped>
.control-panel-container {
  width: 325px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0rem;
  background-color: rgba(0, 0, 0, 0.2);
  margin-top: 10px;
}

.top-controls {
  display: flex;
  justify-content: space-around;
  width: 100%;
  gap: 1rem; /* Added gap for spacing between balance and win displays */
  margin-bottom: 1rem; /* Added space between top-controls and control-panel */
}

.win-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 0.5rem 1.5rem;
  border-radius: 10px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
}

.win-label {
  font-size: 1rem;
  color: var(--light-gray);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.win-amount {
  font-size: 1.2rem;
  font-weight: bold;
  color: #32CD32;
  text-shadow: 0 0 20px rgba(50, 205, 50, 1), 0 0 30px rgba(50, 205, 50, 0.8);
  display: inline-block;
  width: 60px;
  text-align: center;
}

.control-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 0 0.5rem;
  gap: 2rem; /* Add some gap between buttons */
}

.autoplay-button {
  background-color: #9370DB; /* Medium Purple - Jili inspired */
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  
}

.control-button:hover {
  background-color: var(--brand-pink);
  transform: translateY(-2px);
}

.control-button:disabled {
  background-color: var(--mid-gray);
  cursor: not-allowed;
}

.spin-button {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.spin-button.spinning {
  animation: spin-button-pulse 1s infinite alternate;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.9), 0 0 30px rgba(255, 223, 0, 0.7);
}

@keyframes spin-button-pulse {
  from {
    transform: scale(1);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.7), 0 0 25px rgba(255, 223, 0, 0.5);
  }
  to {
    transform: scale(1.05);
    box-shadow: 0 0 25px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 223, 0, 0.8);
  }
}

.spin-button::before {
  content: '';
  position: absolute;
  border-radius: 50%;
  z-index: -1;
}

/* Normal state: small golden line along border */
.spin-button:not(.spinning)::before {
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: conic-gradient(transparent 0%, transparent 90%, gold 95%, transparent 100%);
  animation: rotate-slow 8s linear infinite;
  mask: radial-gradient(circle at center, transparent 65%, black 70%);
  -webkit-mask: radial-gradient(circle at center, transparent 65%, black 70%);
}

/* Spinning state: broad golden glow */
.spin-button.spinning::before {
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(transparent, rgba(255, 215, 0, 0.8), transparent 50%, rgba(255, 215, 0, 0.8), transparent);
  animation: rotate 4s linear infinite;
  mask: none;
  -webkit-mask: none;
}

.spin-button::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  background: linear-gradient(45deg, var(--brand-pink), var(--brand-purple));
  border-radius: 50%;
  z-index: 0;
}

.spin-button .spin-icon {
  position: relative;
  z-index: 1;
  width: 60%; /* Adjust size to fit */
  height: 60%; /* Adjust size to fit */
  color: gold; /* Make the icon golden */
}

@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.bet-selection-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bet-toggle-button {
  background: linear-gradient(45deg, #FFD700, #FFA500); /* Golden gradient */
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.7), 0 0 25px rgba(255, 223, 0, 0.5); /* Added golden glow */
  width: 70px; /* Small width */
  height: 40px; /* Small height */
  display: flex;
  justify-content: center;
  align-items: center;
}

.bet-toggle-button .bet-icon {
  width: 30px;
  height: 30px;
  color: #fff; /* White color for the icon */
  margin-right: 5px; /* Add some space between icon and text */
}

.bet-toggle-button .bet-amount-display {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
}



.bet-table {
  position: absolute;
  top: -10px; /* Adjust as needed to position above the button */
  left: 50%;
  transform: translateX(-50%) translateY(-100%); /* Position above and center */
  background-color: rgba(0, 0, 0, 0.9);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5), 0 0 25px rgba(255, 223, 0, 0.3);
  border-radius: 10px;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.bet-table-item {
  background-color: #9370DB; /* Medium Purple - Jili inspired */
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
}

.bet-table-item:hover {
  background-color: var(--brand-pink);
}

.autoplay-button.active {
  background-color: #e74c3c;
}



.autoplay-icon {
  width: 25px; /* Make icon smaller */
  height: 25px; /* Make icon smaller */
}

.control-button span {
  font-size: 0.9rem;
}
</style>