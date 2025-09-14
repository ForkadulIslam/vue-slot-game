// --- CONFIGURATION ---

// Symbols for the game - Adding a few more for variety
const SYMBOLS = {
  WILD: 'wild',
  SCATTER: 'scatter',
  SEVEN: 'seven', // High-tier
  BAR: 'bar',     // High-tier
  BELL: 'bell',   // Mid-tier
  MELON: 'melon', // Mid-tier
  ORANGE: 'orange', // Low-tier
  PLUM: 'plum',     // Low-tier
  CHERRY: 'cherry', // Low-tier
  LEMON: 'lemon',   // Low-tier
};

// Jili-style High Volatility Paytable
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

// Free Spins Configuration
const FREE_SPINS_CONFIG = {
  TRIGGER_COUNT: { 3: 10, 4: 15, 5: 20 }, // Scatters -> Free Spins
  BASE_MULTIPLIER_INCREMENT: 2, // Multiplier increases by 2 for each win in free spins
};

// Scatter Payouts (triggers in addition to free spins)
const SCATTER_PAYOUTS = { 5: 100, 4: 20, 3: 5 };

// Strategically Weighted Reel Strips for High Excitement (vFinal - Tuned by autoTuneRTP.js)
const REEL_STRIPS = [
  ["seven","bar","bell","melon","scatter","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","wild","wild","wild","wild","wild"],
  ["seven","bar","bell","melon","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","orange","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","plum","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","cherry","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","lemon","wild","wild","wild","wild","wild"],
  ["seven","bar","bell","melon","scatter","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","wild","wild","wild","wild","wild"],
  ["seven","bar","bell","melon","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","bell","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","melon","wild","wild","wild","wild","wild"],
  ["seven","bar","bell","melon","scatter","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","seven","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","bar","wild","wild","wild","wild","wild"]
];

// Expanded to 25 Paylines
const PAYLINES = [
    // Rows
    [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2],
    // Diagonals
    [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
    // V-Shapes
    [0, 0, 1, 2, 2], [2, 2, 1, 0, 0],
    // Steps
    [0, 1, 1, 2, 2], [2, 1, 1, 0, 0],
    // Mountains
    [1, 0, 0, 0, 1], [1, 2, 2, 2, 1],
    // Bridges
    [0, 1, 0, 1, 0], [1, 2, 1, 2, 1], [2, 1, 2, 1, 2],
    // Mixed
    [0, 0, 2, 0, 0], [2, 2, 0, 2, 2],
    [1, 0, 2, 0, 1], [1, 2, 0, 2, 1],
    [0, 2, 2, 2, 0], [2, 0, 0, 0, 2],
    [0, 2, 0, 2, 0], [2, 0, 2, 0, 2],
    [1, 1, 0, 1, 1], [1, 1, 2, 1, 1],
    [0, 2, 1, 0, 2]
];


// --- SIMULATION LOGIC ---

function getRandomSymbol(reelIndex) {
  const reel = REEL_STRIPS[reelIndex];
  return reel[Math.floor(Math.random() * reel.length)];
}

function generateSpinResult() {
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
}

function calculateWins(grid, betPerLine) {
    let totalWinnings = 0;
    const winningPaylines = new Map();
    const winningPositions = new Set();

    for (const [index, payline] of PAYLINES.entries()) {
        const lineSymbols = payline.map((row, reel) => grid[reel][row]);

        let firstSymbol = lineSymbols[0];
        // If first symbol is WILD, find the first non-WILD to determine the pay symbol
        if (firstSymbol === SYMBOLS.WILD) {
            firstSymbol = lineSymbols.find(s => s !== SYMBOLS.WILD) || SYMBOLS.WILD;
        }

        if (!PAYTABLE[firstSymbol]) continue;

        let matchCount = 0;
        for (const symbol of lineSymbols) {
            if (symbol === firstSymbol || symbol === SYMBOLS.WILD) {
                matchCount++;
            } else {
                break;
            }
        }

        if (matchCount >= 3) {
            const payout = (PAYTABLE[firstSymbol]?.[matchCount] || 0) * betPerLine;
            if (payout > 0) {
                totalWinnings += payout;
                winningPaylines.set(index, { symbol: firstSymbol, matchCount, payout });
                for (let i = 0; i < matchCount; i++) {
                    winningPositions.add(`${i},${payline[i]}`);
                }
            }
        }
    }
    return { totalWinnings, winningPositions };
}


function runSimulation(numSpins) {
  let totalBet = 0;
  let totalWon = 0;
  let freeSpinsTotalWon = 0;
  let baseGameTotalWon = 0;
  let hitCount = 0;

  const betPerLine = 1;
  const totalBetAmount = betPerLine * PAYLINES.length;

  console.log(`Starting simulation for ${numSpins.toLocaleString()} spins...`);
  console.log(`Total Bet per spin: ${totalBetAmount}`);

  for (let i = 0; i < numSpins; i++) {
    totalBet += totalBetAmount;
    let grid = generateSpinResult();
    let spinWinnings = 0;
    let baseMultiplier = 1;

    // --- Cascading Wins Loop ---
    while (true) {
        const { totalWinnings, winningPositions } = calculateWins(grid, betPerLine);

        if (totalWinnings > 0) {
            spinWinnings += totalWinnings * baseMultiplier;
            baseMultiplier++; // Increase multiplier for next cascade

            // Remove winning symbols (replace with null)
            const nextGrid = grid.map(reel => [...reel]);
            winningPositions.forEach(pos => {
                const [reel, row] = pos.split(',').map(Number);
                nextGrid[reel][row] = null;
            });

            // Fill nulls with new symbols from top
            for (let reel = 0; reel < 5; reel++) {
                const newReel = nextGrid[reel].filter(s => s !== null);
                const nullCount = 3 - newReel.length;
                for (let k = 0; k < nullCount; k++) {
                    newReel.unshift(getRandomSymbol(reel));
                }
                grid[reel] = newReel;
            }
        } else {
            break; // No more wins, exit cascade loop
        }
    }

    // --- Scatter Check & Free Spins Trigger ---
    let scatterCount = grid.flat().filter(s => s === SYMBOLS.SCATTER).length;
    if (scatterCount >= 3) {
        spinWinnings += (SCATTER_PAYOUTS[scatterCount] || 0) * totalBetAmount;
        const freeSpinsCount = FREE_SPINS_CONFIG.TRIGGER_COUNT[scatterCount];
        const fsWinnings = runFreeSpins(freeSpinsCount, betPerLine);
        spinWinnings += fsWinnings;
        freeSpinsTotalWon += fsWinnings;
    }


    if (spinWinnings > 0) {
        totalWon += spinWinnings;
        baseGameTotalWon += spinWinnings;
        hitCount++;
    }
  }

  const rtp = (totalWon / totalBet) * 100;
  const hitFrequency = (hitCount / numSpins) * 100;

  console.log('--- Simulation Results ---');
  console.log(`Total Bet: ${totalBet.toLocaleString()}`);
  console.log(`Total Won: ${totalWon.toLocaleString()}`);
  console.log(`  - Base Game Won: ${baseGameTotalWon.toLocaleString()}`);
  console.log(`  - Free Spins Won: ${freeSpinsTotalWon.toLocaleString()}`);
  console.log(`Return to Player (RTP): ${rtp.toFixed(4)}%`);
  console.log(`Hit Frequency: ${hitFrequency.toFixed(2)}%`);
}

function runFreeSpins(spinCount, betPerLine) {
    let totalWinnings = 0;
    let multiplier = 1;

    for (let i = 0; i < spinCount; i++) {
        let grid = generateSpinResult();
        // Free spins cascade loop
        while (true) {
            const { totalWinnings: cascadeWinnings, winningPositions } = calculateWins(grid, betPerLine);
            if (cascadeWinnings > 0) {
                totalWinnings += cascadeWinnings * multiplier;
                multiplier += FREE_SPINS_CONFIG.BASE_MULTIPLIER_INCREMENT; // Multiplier grows with each win

                const nextGrid = grid.map(reel => [...reel]);
                winningPositions.forEach(pos => {
                    const [reel, row] = pos.split(',').map(Number);
                    nextGrid[reel][row] = null;
                });

                for (let reel = 0; reel < 5; reel++) {
                    const newReel = nextGrid[reel].filter(s => s !== null);
                    const nullCount = 3 - newReel.length;
                    for (let k = 0; k < nullCount; k++) {
                        newReel.unshift(getRandomSymbol(reel));
                    }
                    grid[reel] = newReel;
                }
            } else {
                break;
            }
        }
    }
    return totalWinnings;
}


// Run the simulation with a large number of spins for accuracy
runSimulation(1000000); // 1 Million spins is a good start for testing