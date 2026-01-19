import { ref, readonly } from 'vue';

const isActive = ref(false);
const spinsAvailable = ref(0);
const spinsTotal = ref(0);
const outcomes = ref([]);
const totalWin = ref(0);
const hasBeenTriggered = ref(false); // To signal that a free spin session has just been initiated

export function useFreeSpins() {

  const startSession = (freeGamesResult) => {
    isActive.value = true;
    spinsAvailable.value = freeGamesResult.numberOfFreeSpins;
    spinsTotal.value = freeGamesResult.numberOfFreeSpins;
    outcomes.value = [...freeGamesResult.freeGamesSpins];
    totalWin.value = 0; // Accumulated win for the current free spin session
    hasBeenTriggered.value = true; // Set to true to trigger UI announcement
    console.log("Free Spins Started:", freeGamesResult);
  };

  const getNextOutcome = () => {
    if (spinsAvailable.value > 0 && outcomes.value.length > 0) {
      const nextOutcome = outcomes.value.shift();
      spinsAvailable.value--;
      return nextOutcome;
    }
    return null;
  };

  const endSession = () => {
    const finalWin = totalWin.value;
    // Reset all state for the next session
    isActive.value = false;
    spinsAvailable.value = 0;
    spinsTotal.value = 0;
    outcomes.value = [];
    totalWin.value = 0;
    hasBeenTriggered.value = false;
    // console.log("Free Spins Ended. Total Win:", finalWin);
    return finalWin; // Return the accumulated win for adding to player balance
  };

  const accumulateWin = (amount) => {
    totalWin.value += parseFloat(amount);
  };

  const resetTrigger = () => {
    hasBeenTriggered.value = false;
  };

  return {
    isActive: readonly(isActive),
    spinsAvailable: readonly(spinsAvailable),
    spinsTotal: readonly(spinsTotal),
    totalWin: readonly(totalWin),
    hasBeenTriggered: readonly(hasBeenTriggered),
    startSession,
    getNextOutcome,
    endSession,
    accumulateWin,
    resetTrigger,
  };
}