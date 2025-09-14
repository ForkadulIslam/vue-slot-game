import { ref, reactive, nextTick } from 'vue';
import { Howl } from 'howler';

// --- 1. GAME CONFIGURATION (Matches rtpSimulation5x3.js) ---
const SYMBOLS = {
  WILD: 'wild',
  SCATTER: 'scatter',
  SEVEN: 'seven',
  BAR: 'bar',
  BELL: 'bell',
  MELON: 'melon',
  ORANGE: 'orange',
  PLUM: 'plum',
  CHERRY: 'cherry',
  LEMON: 'lemon',
  BANANA: 'banana',
};

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

const PAYTABLE = {
  [SYMBOLS.WILD]:   { 5: 5000, 4: 1000, 3: 100 },
  [SYMBOLS.SEVEN]:  { 5: 2500, 4: 500,  3: 50 },
  [SYMBOLS.BAR]:    { 5: 1000, 4: 200,  3: 40 },
  [SYMBOLS.BELL]:   { 5: 500,  4: 100,  3: 20 },
  [SYMBOLS.MELON]:  { 5: 250,  4: 50,   3: 15 },
  [SYMBOLS.ORANGE]: { 5: 100,  4: 20,   3: 8 },
  [SYMBOLS.PLUM]:   { 5: 80,   4: 15,   3: 6 },
  [SYMBOLS.CHERRY]: { 5: 60,   4: 12,   3: 5 },
  [SYMBOLS.LEMON]:  { 5: 50,   4: 10,   3: 4 },
};

const SCATTER_PAYOUTS = { 5: 100, 4: 20, 3: 5 };

const REEL_STRIPS = [
  ["seven","bar","bell","melon","scatter","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","wild","wild","wild","wild","wild"],
  ["seven","bar","bell","melon","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","wild","wild","wild","wild","wild"],
  ["seven","bar","bell","melon","scatter","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","wild","wild","wild","wild","wild"],
  ["seven","bar","bell","melon","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","wild","wild","wild","wild","wild"],
  ["seven","bar","bell","melon","scatter","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","wild","wild","wild","wild","wild"]
];

const PAYLINES = [
    [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
    [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [0, 1, 1, 2, 2], [2, 1, 1, 0, 0], [1, 0, 0, 0, 1],
    [1, 2, 2, 2, 1], [0, 1, 0, 1, 0], [1, 2, 1, 2, 1], [2, 1, 2, 1, 2], [0, 0, 2, 0, 0],
    [2, 2, 0, 2, 2], [1, 0, 2, 0, 1], [1, 2, 0, 2, 1], [0, 2, 2, 2, 0], [2, 0, 0, 0, 2],
    [0, 2, 0, 2, 0], [2, 0, 2, 0, 2], [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 2, 1, 0, 2]
];

const FREE_SPINS_CONFIG = {
  TRIGGER_COUNT: { 3: 10, 4: 15, 5: 20 },
  BASE_MULTIPLIER_INCREMENT: 2,
};


export function useSlotGame() {
  // --- 2. REACTIVE STATE ---
  const balance = ref(1000);
  const betAmount = ref(25); // Default bet to cover 25 lines at 1 credit per line
  const isSpinning = ref(false);
  const isAutoplaying = ref(false);
  const outcome = ref([
    ['seven', 'seven', 'seven'], ['seven', 'seven', 'seven'], ['seven', 'seven', 'seven'],
    ['seven', 'seven', 'seven'], ['seven', 'seven', 'seven'],
  ]);
  const winAmount = ref(0);
  const winningPaylines = ref(new Set());
  let autoplayInterval = null;

  // --- 3. SOUNDS ---
  const sounds = {
    spin: new Howl({ src: [new URL('../assets/sounds/spin.wav', import.meta.url).href] }),
    win: new Howl({ src: [new URL('../assets/sounds/win-alert.wav', import.meta.url).href] }),
    payout: new Howl({ src: [new URL('../assets/sounds/payout-award.wav', import.meta.url).href] }),
    explosion: new Howl({ src: [new URL('../assets/sounds/game-explosion.wav', import.meta.url).href] }),
  };

  // --- 4. CORE GAME LOGIC ---
  const getRandomSymbol = (reelIndex) => {
    const reel = REEL_STRIPS[reelIndex];
    return reel[Math.floor(Math.random() * reel.length)];
  };

  const generateSpinResult = () => {
    const grid = [];
    for (let i = 0; i < 5; i++) {
      const reelSymbols = [];
      const stopPosition = Math.floor(Math.random() * REEL_STRIPS[i].length);
      for (let j = 0; j < 3; j++) {
        reelSymbols.push(REEL_STRIPS[i][(stopPosition + j) % REEL_STRIPS[i].length]);
      }
      grid.push(reelSymbols);
    }
    return grid;
  };

  const calculateWins = (grid) => {
    const betPerLine = betAmount.value / PAYLINES.length;
    let totalWinnings = 0;
    const currentWinningPaylines = new Set();
    const winningPositions = new Set();

    for (const [index, payline] of PAYLINES.entries()) {
        const lineSymbols = payline.map((row, reel) => grid[reel][row]);
        let firstSymbol = lineSymbols.find(s => s !== SYMBOLS.WILD) || SYMBOLS.WILD;
        if (!PAYTABLE[firstSymbol]) continue;

        let matchCount = 0;
        for (const symbol of lineSymbols) {
            if (symbol === firstSymbol || symbol === SYMBOLS.WILD) matchCount++;
            else break;
        }

        if (matchCount >= 3) {
            const payout = (PAYTABLE[firstSymbol]?.[matchCount] || 0) * betPerLine;
            if (payout > 0) {
                totalWinnings += payout;
                currentWinningPaylines.add(index);
                for (let i = 0; i < matchCount; i++) winningPositions.add(`${i},${payline[i]}`);
            }
        }
    }
    return { totalWinnings, winningPositions, currentWinningPaylines };
  };


  // --- 5. MAIN SPIN FUNCTION ---
  const spin = async () => {
    if (isSpinning.value || balance.value < betAmount.value) return;

    isSpinning.value = true;
    winAmount.value = 0;
    winningPaylines.value.clear();
    balance.value -= betAmount.value;
    sounds.spin.play();

    let currentGrid = generateSpinResult();
    console.log("Predetermined Spin Result:", currentGrid.map(reel => reel.join(', ')).join(' | '));
    outcome.value = currentGrid;
    
    // We will add a short delay here to simulate reels spinning before showing the result
    await new Promise(resolve => setTimeout(resolve, 1000));


    let totalSpinWinnings = 0;
    let baseMultiplier = 1;

    // --- Cascading Wins Loop ---
    while (true) {
      const { totalWinnings, winningPositions, currentWinningPaylines } = calculateWins(currentGrid);

      if (totalWinnings > 0) {
        sounds.payout.play();
        const winningsWithMultiplier = totalWinnings * baseMultiplier;
        totalSpinWinnings += winningsWithMultiplier;
        winAmount.value = totalSpinWinnings;
        balance.value += winningsWithMultiplier;
        
        currentWinningPaylines.forEach(lineIndex => winningPaylines.value.add(lineIndex));
        
        await nextTick(); // Allow UI to update

        // Short pause to see the win before symbols disappear
        await new Promise(resolve => setTimeout(resolve, 500)); 


        // Remove winning symbols and let new ones fall
        const nextGrid = currentGrid.map(reel => [...reel]);
        winningPositions.forEach(pos => {
            const [reel, row] = pos.split(',').map(Number);
            nextGrid[reel][row] = null;
        });

        // Drop down existing symbols
        for (let reel = 0; reel < 5; reel++) {
          let nullCount = 0;
          for (let row = 2; row >= 0; row--) {
            if (nextGrid[reel][row] === null) {
              nullCount++;
            } else if (nullCount > 0) {
              nextGrid[reel][row + nullCount] = nextGrid[reel][row];
              nextGrid[reel][row] = null;
            }
          }
        }

        // Fill nulls with new symbols from top
        for (let reel = 0; reel < 5; reel++) {
          for (let row = 0; row < 3; row++) {
            if (nextGrid[reel][row] === null) {
              nextGrid[reel][row] = getRandomSymbol(reel);
            }
          }
        }
        
        currentGrid = nextGrid;
        outcome.value = currentGrid;
        baseMultiplier++;

      } else {
        break; // No more wins, exit cascade loop
      }
    }

    // --- Scatter Check (after cascades) ---
    let scatterCount = currentGrid.flat().filter(s => s === SYMBOLS.SCATTER).length;
    if (scatterCount >= 3) {
      const scatterWinnings = (SCATTER_PAYOUTS[scatterCount] || 0) * betAmount.value;
      balance.value += scatterWinnings;
      totalSpinWinnings += scatterWinnings;
      winAmount.value = totalSpinWinnings;
      // TODO: Trigger Free Spins UI/State
      console.log(`!!! FREE SPINS TRIGGERED: ${FREE_SPINS_CONFIG.TRIGGER_COUNT[scatterCount]} spins !!!`);
    }

    if (totalSpinWinnings > 0) {
      sounds.win.play();
    }

    isSpinning.value = false;
    if (isAutoplaying.value) {
      setTimeout(spin, 2000);
    }
  };

  function setBetAmount(bet) {
    betAmount.value = bet;
  }

  function toggleAutoplay() {
    isAutoplaying.value = !isAutoplaying.value;
    if (isAutoplaying.value) {
      spin();
    }
  }

  return { 
    balance, betAmount, isSpinning, isAutoplaying, outcome, winAmount, 
    spin, symbolPaths, setBetAmount, toggleAutoplay, winningPaylines, PAYLINES 
  };
}
