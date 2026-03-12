<template>
    <div class="control-panel-container">

        <!-- 1. Slim Info Bar -->
        <div class="info-bar">
            <!-- Normal Mode: Show Balance -->
            <div class="info-strip" v-if="!isInFreeSpinSession">
                <span class="label">BAL</span>
                <span class="value">{{ balance }}</span>
            </div>
            <!-- Free Spin Mode: Show Autoplay button here -->
            <div class="action-group" v-else>
                <button @click="toggleAutoplay" class="glass-btn" :class="{ 'active': isAutoplaying }">
                    <svg v-if="!isAutoplaying" viewBox="0 0 24 24" fill="currentColor" class="icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                    <svg v-else viewBox="0 0 24 24" fill="currentColor" class="icon"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
            </div>

            <!-- Win -->
            <div class="info-strip win-strip">
                <span class="label">WIN</span>
                <span class="value win-text" :class="{'pop': displayedWinAmount > 0}">
          {{ displayedWinAmount.toFixed(2) }}
        </span>
            </div>
        </div>

        <!-- 2. Compact Dock -->
        <div class="controls-dock">

            <!-- Left: Bet (Normal Mode Only) -->
            <div class="action-group" v-if="!isInFreeSpinSession">
                <button @click="toggleBetTable" class="glass-btn">
                    <!-- Stack of Coins Icon -->
                    <svg viewBox="0 0 24 24" fill="currentColor" class="icon">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.86 0 .92-.81 1.5-2.19 1.5-1.65 0-2.35-.9-2.39-2.06H7.9c.06 1.92 1.41 3.05 2.97 3.42V20h2.12v-1.68c1.63-.25 2.92-1.32 2.92-2.92 0-2.01-1.66-3.04-3.6-3.54z"/>
                    </svg>
                    <!-- Small badge for current bet amount -->
                    <div class="bet-badge">{{ betAmount }}</div>
                </button>

                <div v-if="showBetTable" class="glass-popup">
                    <button v-for="bet in availableBets" :key="bet" @click="selectBet(bet)" class="popup-item">
                        {{ bet }}
                    </button>
                </div>
            </div>
            <!-- Free Spin Mode: Placeholder to keep spin button centered -->
            <div v-else style="width: 45px;"></div>


            <!-- Center: Spin Orb -->
            <div class="spin-container">
                <button @click="handleSpinClick" class="spin-orb" :disabled="isSpinning" :class="{ 'spinning': isSpinning }">
                    <div class="orb-inner">
                        <span v-if="!isSpinning" class="spin-label" v-text="freeSpinsAvailable > 0 ? freeSpinsAvailable: 'SPIN'"></span>
                        <svg v-else class="spin-icon-anim" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46c.9-.99 1.44-2.3 1.44-4.26 0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 9.74c-.9.99-1.44 2.3-1.44 4.26 0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                        </svg>
                    </div>
                </button>
            </div>

            <!-- Right: Auto (Normal Mode Only) -->
            <div class="action-group" v-if="!isInFreeSpinSession">
                <button @click="handleAutoPlay" class="glass-btn" :class="{ 'active': isAutoplaying }">
                    <svg v-if="!isAutoplaying" viewBox="0 0 24 24" fill="currentColor" class="icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                    <svg v-else viewBox="0 0 24 24" fill="currentColor" class="icon"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
            </div>
            <!-- Free Spin Mode: Placeholder to keep spin button centered -->
            <div v-else style="width: 45px;"></div>

        </div>
    </div>
</template>

<script setup>
    import { ref } from 'vue';
    import { useSlotGame } from '../composables/useSlotGame';
    import { useScreenWakeLock } from '../composables/useScreenWakeLock';

    const { balance, betAmount, availableBets, isSpinning, isAutoplaying, spin, setBetAmount, toggleAutoplay, displayedWinAmount, freeSpinsAvailable, isInFreeSpinSession } = useSlotGame();
    const { isLocked, requestLock } = useScreenWakeLock();

    const showBetTable = ref(false);

    const toggleBetTable = () => {
        showBetTable.value = !showBetTable.value;
    };

    const selectBet = (bet) => {
        setBetAmount(bet);
        showBetTable.value = false;
    };

    const handleSpinClick = () => {
      // On the first spin, if the lock isn't active, request it.
      if (!isLocked.value) {
        requestLock();
      }
      // Proceed with the actual spin
      spin();
    }

    const handleAutoPlay = ()=>{
        if (!isLocked.value) {
            requestLock();
        }

        toggleAutoplay()
    }
</script>

<style scoped>
    .control-panel-container {
        width: 100%;
        /* FIX 1: Align width with the reels (Reels are 350px, this gives 5px breathing room) */
        max-width: 360px;
        padding: 0 5px 5px 5px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        position: relative;
        z-index: 50;
        /* Ensure it doesn't force scrolling */
        flex-shrink: 0;
    }

    /* --- 1. SLIM INFO BAR --- */
    .info-bar {
        display: flex;
        justify-content: space-between;
        width: 100%;
        padding: 0 5px;
    }

    .info-strip {
        background: linear-gradient(90deg, rgba(20, 10, 20, 0.9) 0%, rgba(40, 20, 40, 0.7) 100%);
        border-bottom: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 8px;
        padding: 4px 10px; /* Tighter padding */
        min-width: 90px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    }

    .label {
        font-size: 0.6rem;
        color: #888;
        font-weight: 700;
        letter-spacing: 1px;
    }

    .value {
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        font-weight: bold;
        color: #fff;
    }

    .win-strip { border-bottom-color: rgba(50, 205, 50, 0.5); }
    .win-text { color: #4ade80; }

    /* --- 2. COMPACT DOCK --- */
    .controls-dock {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 100%);
        border-radius: 50px;
        padding: 5px 20px;
        border-top: 1px solid rgba(255,255,255,0.1);
        height: 60px; /* Fixed minimal height */
    }

    /* --- BUTTONS --- */
    .action-group {
        position: relative;
        display: flex;
        align-items: center;
    }

    .glass-btn {
        width: 45px; /* Smaller */
        height: 45px;
        border-radius: 50%;
        border: none;
        background: radial-gradient(circle at 30% 30%, #444, #111);
        box-shadow: 0 4px 10px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2);
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #d4af37;
        position: relative;
    }

    .glass-btn:active { transform: scale(0.95); }
    .glass-btn.active { background: radial-gradient(circle at 30% 30%, #a00, #300); color: white; }

    .icon { width: 24px; height: 24px; }

    .bet-badge {
        position: absolute;
        bottom: -5px; right: -5px;
        background: #d4af37; color: black;
        font-size: 0.65rem; font-weight: bold;
        padding: 1px 4px; border-radius: 8px;
    }

    /* --- SPIN ORB --- */
    .spin-container { margin-top: -30px; }

    .spin-orb {
        width: 75px;
        height: 75px;
        border-radius: 50%; border: none; cursor: pointer;
        background: linear-gradient(135deg, #ffd700, #b8860b);
        padding: 3px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.6);
        transition: transform 0.1s;
    }
    .spin-orb:active { transform: scale(0.95); }

    .orb-inner {
        width: 100%; height: 100%;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #00c853, #004d40);
        display: flex; justify-content: center; align-items: center;
        box-shadow: inset 0 3px 10px rgba(0,0,0,0.5);
        border: 1px solid rgba(255,255,255,0.1);
    }

    .spin-label { font-size: 1rem; font-weight: 900; color: white; text-shadow: 0 2px 2px rgba(0,0,0,0.5); letter-spacing: 1px; }
    .spin-icon-anim { width: 32px; height: 32px; color: white; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* --- POPUP MENU --- */
    .glass-popup {
        position: absolute; bottom: 55px; left: 50%; transform: translateX(-50%);
        background: rgba(20, 20, 30, 0.95); border: 1px solid #555;
        border-radius: 10px; padding: 5px;
        display: flex; flex-direction: column; gap: 5px;
        box-shadow: 0 10px 20px rgba(0,0,0,0.8); z-index: 100;
    }
    .popup-item {
        background: transparent; color: #d4af37; border: none;
        padding: 6px 10px; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 0.85rem;
    }
    .popup-item:hover { background: rgba(255, 255, 255, 0.1); }
</style>