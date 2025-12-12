<template>
  <div class="control-panel-container">
    
    <!-- Top Information Bar (Recessed into the stone) -->
    <div class="info-slab">
      <div class="info-group">
        <span class="label">Balance</span>
        <span class="value">{{ balance }}</span>
      </div>
      <div class="info-group win-group">
        <span class="label">Win</span>
        <span class="value win-text">{{ displayedWinAmount.toFixed(2) }}</span>
      </div>
    </div>

    <!-- Main Control Row -->
    <div class="controls-row">
      
      <!-- Left: Bet Button (Circular) -->
      <div class="side-control">
        <div class="bet-container">
          <button @click="toggleBetTable" class="stone-circle-btn small-btn">
             <!-- Stack of coins icon -->
            <svg viewBox="0 0 24 24" fill="currentColor" class="icon">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.86 0 .92-.81 1.5-2.19 1.5-1.65 0-2.35-.9-2.39-2.06H7.9c.06 1.92 1.41 3.05 2.97 3.42V20h2.12v-1.68c1.63-.25 2.92-1.32 2.92-2.92 0-2.01-1.66-3.04-3.6-3.54z"/>
            </svg>
            <span class="btn-label-floating">BET: {{ betAmount }}</span>
          </button>

          <!-- Popup Bet Table -->
          <div v-if="showBetTable" class="stone-popup">
            <button v-for="bet in availableBets" :key="bet" @click="selectBet(bet)" class="popup-item">
              {{ bet }}
            </button>
          </div>
        </div>
      </div>

      <!-- Center: Spin Button (Big Stone/Gem) -->
      <div class="center-control">
        <button @click="spin" class="spin-stone-btn" :disabled="isSpinning" :class="{ 'spinning': isSpinning }">
          <div class="inner-ring">
             <span v-if="!isSpinning" class="spin-text">SPIN</span>
             <!-- Simple Refresh Icon for spinning state -->
             <svg v-else class="spin-icon-anim" viewBox="0 0 24 24" fill="currentColor">
               <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46c.9-.99 1.44-2.3 1.44-4.26 0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 9.74c-.9.99-1.44 2.3-1.44 4.26 0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
             </svg>
          </div>
        </button>
      </div>

      <!-- Right: Auto Button (Circular) -->
      <div class="side-control">
         <button @click="toggleAutoplay" class="stone-circle-btn small-btn" :class="{ 'active': isAutoplaying }">
            <svg viewBox="0 0 24 24" fill="currentColor" class="icon">
               <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            <span class="btn-label-floating">{{ isAutoplaying ? 'STOP' : 'AUTO' }}</span>
         </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
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
/* 1. The Stone Altar Container */
.control-panel-container {
  width: 300px; /* Constrain on desktop */
  padding: 10px 20px 20px 20px;
  
  /* Creates a dark stone texture using gradients */
  background: 
    linear-gradient(to bottom, #2b2b2b, #1a1a1a);
  
  border-top: 3px solid #555; /* Highlight edge */
  border-radius: 30px 30px 0 0; /* Rounded top like a tombstone */
  
  /* 3D Depth Shadow */
  box-shadow: 
    0 -5px 15px rgba(0,0,0,0.5), 
    inset 0 1px 0 rgba(255,255,255,0.1);
  
  display: flex;
  flex-direction: column;
  gap: 15px;
  position: relative;
  z-index: 10;
}

/* 2. Top Info Slab (Recessed Screen) */
.info-slab {
  display: flex;
  justify-content: space-between;
  background: #111;
  border-radius: 12px;
  padding: 8px 20px;
  /* Inner shadow makes it look carved IN */
  box-shadow: inset 0 3px 8px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.1);
  border-bottom: 1px solid #333;
}

.info-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.label {
  font-size: 0.7rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.value {
  font-family: 'Courier New', monospace; /* Digital look */
  font-size: 1.1rem;
  color: #ddd;
  font-weight: bold;
}

.win-text {
  color: #4ade80; /* Bright Green */
  text-shadow: 0 0 10px rgba(74, 222, 128, 0.4);
}

/* 3. Controls Layout */
.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.center-control {
  transform: translateY(-10px); /* Push the spin button UP slightly */
}

/* 4. Side Buttons (Bet & Auto) - Stone Circles */
.stone-circle-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  
  /* Metallic/Stone Gradient */
  background: radial-gradient(circle at 30% 30%, #4a4a4a, #222);
  
  /* 3D Button Bevel */
  box-shadow: 
    0 5px 10px rgba(0,0,0,0.5), 
    inset 0 2px 3px rgba(255,255,255,0.2),
    0 0 0 2px #333; /* Dark rim */
    
  color: #fbbf24; /* Gold Icon */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  transition: transform 0.1s;
}

.stone-circle-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.5);
}

.stone-circle-btn.active {
  background: radial-gradient(circle at 30% 30%, #7f1d1d, #450a0a); /* Red for Stop */
  color: white;
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.4);
}

.icon {
  width: 28px;
  height: 28px;
  margin-bottom: 2px;
}

.btn-label-floating {
  position: absolute;
  bottom: -20px;
  font-size: 0.7rem;
  color: #aaa;
  font-weight: bold;
  white-space: nowrap;
}

/* 5. Main Spin Button (The Artifact) */
.spin-stone-btn {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  padding: 5px;
  
  /* Outer Gold/Bronze Rim */
  background: linear-gradient(145deg, #d4af37, #8a6e05);
  box-shadow: 0 10px 20px rgba(0,0,0,0.6);
  transition: transform 0.2s;
}

.spin-stone-btn:active {
  transform: scale(0.95);
}

.inner-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  /* Inner Green Gem/Stone */
  background: radial-gradient(circle at 30% 30%, #10b981, #064e3b);
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid rgba(0,0,0,0.3);
  box-shadow: inset 0 5px 10px rgba(0,0,0,0.4);
}

.spin-text {
  font-weight: 900;
  color: white;
  font-size: 1.2rem;
  text-shadow: 0 2px 2px rgba(0,0,0,0.5);
  letter-spacing: 1px;
}

.spin-icon-anim {
  width: 40px;
  height: 40px;
  color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 6. Bet Popup Table */
.stone-popup {
  position: absolute;
  bottom: 80px;
  left: 0;
  background: #222;
  border: 2px solid #555;
  border-radius: 10px;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 5px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.8);
  z-index: 100;
}

.popup-item {
  background: #333;
  color: gold;
  border: 1px solid #444;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.popup-item:hover {
  background: #444;
}
</style>

