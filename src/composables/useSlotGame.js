import { ref, computed } from 'vue';
import { Howl } from 'howler';

// 1. GAME CONFIGURATION (This is your "backend" data)
const symbolPaths = {
  wild: new URL('../assets/images/symblos/celebration/wild.png', import.meta.url).href,
  scatter: new URL('../assets/images/symblos/celebration/scatter.png', import.meta.url).href,
  seven: new URL('../assets/images/symblos/seven.svg', import.meta.url).href,
  bar: new URL('../assets/images/symblos/bar.svg', import.meta.url).href,
  melon: new URL('../assets/images/symblos/melon.svg', import.meta.url).href,
  bell: new URL('../assets/images/symblos/bell.svg', import.meta.url).href,
  plum: new URL('../assets/images/symblos/plum.svg', import.meta.url).href,
  orange: new URL('../assets/images/symblos/orange.svg', import.meta.url).href,
  lemon: new URL('../assets/images/symblos/lemon.svg', import.meta.url).href,
  cherry: new URL('../assets/images/symblos/cherry.svg', import.meta.url).href,
  banana: new URL('../assets/images/symblos/banana.svg', import.meta.url).href,
  gold_coin: new URL('../assets/images/symblos/celebration/gold_coin.png', import.meta.url).href,
};

const REEL_STRIPS = [ /* Your weighted strips for Reels 1-5 here */ ];
const PAYTABLE = { /* Your paytable here */ };

export function useSlotGame() {
  // 2. REACTIVE STATE
  const balance = ref(1000);
  const betAmount = ref(10);
  const isSpinning = ref(false);
  const isAutoplaying = ref(false);
  const outcome = ref([
    ['seven', 'seven', 'seven'],
    ['seven', 'seven', 'seven'],
    ['seven', 'seven', 'seven'],
    ['seven', 'seven', 'seven'],
    ['seven', 'seven', 'seven'],
  ]); // This will hold the final 5x3 grid of symbols
  const winAmount = ref(0);
  let autoplayInterval = null;


  // 3. SOUNDS
  const sounds = {
    spin: new Howl({ src: [new URL('../assets/sounds/spin.wav', import.meta.url).href] }),
    win: new Howl({ src: [new URL('../assets/sounds/win-alert.wav', import.meta.url).href] }),
    payout: new Howl({ src: [new URL('../assets/sounds/payout-award.wav', import.meta.url).href] }),
    explosion: new Howl({ src: [new URL('../assets/sounds/game-explosion.wav', import.meta.url).href] }),
  };

  // 4. CORE RNG FUNCTION (To be replaced with API call later)
  const generateOutcome = () => {
    const finalOutcome = [];
    for (let i = 0; i < 5; i++) {
      const randomBytes = new Uint32Array(1);
      window.crypto.getRandomValues(randomBytes);
      const randomIndex = randomBytes[0] % REEL_STRIPS[i].length;
      // Get the 3 symbols that will be visible in the reel's window
      // This requires logic to get the symbol at randomIndex and its neighbors
      const visibleSymbols = getVisibleSymbols(i, randomIndex);
      finalOutcome.push(visibleSymbols);
    }
    return finalOutcome;
  };

  // 5. MAIN SPIN FUNCTION
  const spin = async () => {
    if (isSpinning.value || balance.value < betAmount.value) return;

    isSpinning.value = true;
    balance.value -= betAmount.value;
    sounds.spin.play();

    // THIS IS THE LINE WE WILL LATER REPLACE:
    // const spinResult = await fetchSpinFromServer(); // Future API call
    const spinResult = generateOutcome(); // Current Client-Side RNG

    outcome.value = spinResult;
    winAmount.value = calculateWin(spinResult);

    // ANIMATION LOGIC WILL GO HERE (Phase 2)
    await animateReels();

    if (winAmount.value > 0) {
      balance.value += winAmount.value;
      await animateWin();
    }
    isSpinning.value = false;
  };

  function setBetAmount(bet) {
    betAmount.value = bet;
  }

  function toggleAutoplay() {
    isAutoplaying.value = !isAutoplaying.value;
    if (isAutoplaying.value) {
      spin(); // Start spinning immediately
      autoplayInterval = setInterval(spin, 2000); // Spin every 2 seconds
    } else {
      clearInterval(autoplayInterval);
    }
  }

  return { balance, betAmount, isSpinning, isAutoplaying, outcome, winAmount, spin, symbolPaths, setBetAmount, toggleAutoplay };
}
