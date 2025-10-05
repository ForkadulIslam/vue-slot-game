const crypto = require('crypto');

// --- CORE GAME CONFIGURATION (from rtpSimulation5x3.js) ---

const SYMBOLS = {
  WILD: 'wild', SCATTER: 'scatter', SEVEN: 'seven', BAR: 'bar', BELL: 'bell',
  MELON: 'melon', ORANGE: 'orange', PLUM: 'plum', CHERRY: 'cherry', LEMON: 'lemon',
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

const FREE_SPINS_CONFIG = {
  TRIGGER_COUNT: { 3: 10, 4: 15, 5: 20 },
  BASE_MULTIPLIER_INCREMENT: 2,
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

// --- GAME LOGIC ---

/**
 * Generates a cryptographically secure random number.
 * @param {number} max - The exclusive maximum value.
 * @returns {number} A random integer between 0 and max - 1.
 */
function secureRandom(max) {
  return crypto.randomInt(0, max);
}

/**
 * Gets a random symbol from a specific reel strip.
 * @param {number} reelIndex - The index of the reel (0-4).
 * @returns {string} The symbol name.
 */
function getRandomSymbol(reelIndex) {
  const reel = REEL_STRIPS[reelIndex];
  return reel[secureRandom(reel.length)];
}

/**
 * Generates the initial 5x3 grid for a spin.
 * @returns {Array<Array<string>>} The 5x3 grid.
 */
function generateSpinResult() {
  const grid = [];
  for (let i = 0; i < 5; i++) {
    const reelSymbols = [];
    const stopPosition = secureRandom(REEL_STRIPS[i].length);
    for (let j = 0; j < 3; j++) {
      reelSymbols.push(REEL_STRIPS[i][(stopPosition + j) % REEL_STRIPS[i].length]);
    }
    grid.push(reelSymbols);
  }
  return grid;
}

/**
 * Calculates all winning combinations on the grid.
 * @param {Array<Array<string>>} grid - The current 5x3 grid.
 * @param {number} betPerLine - The bet amount per payline.
 * @returns {object} An object containing totalWinnings, winningPaylines, and winningPositions.
 */
function calculateWins(grid, betPerLine) {
    let totalWinnings = 0;
    const winningPaylines = []; // Changed to an array for the response
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
                winningPaylines.push({
                    paylineIndex: index,
                    symbol: firstSymbol,
                    matchCount,
                    payout
                });
                for (let i = 0; i < matchCount; i++) {
                    winningPositions.add(`${i},${payline[i]}`);
                }
            }
        }
    }
    return { totalWinnings, winningPaylines, winningPositions };
}


// --- SIMULATION LOGIC ---

/**
 * Simulates a full free spins session.
 * @param {number} freeSpinsCount - The number of free spins to play.
 * @param {number} totalBet - The total bet that triggered the session.
 * @returns {number} The total winnings from the entire free spins session.
 */
function simulateFreeSpins(freeSpinsCount, totalBet) {
    let totalFreeSpinsWinnings = 0;
    let progressiveMultiplier = 1;
    const betPerLine = totalBet / PAYLINES.length;

    for (let i = 0; i < freeSpinsCount; i++) {
        let grid = generateSpinResult();

        // --- Cascading Wins Loop for a single Free Spin ---
        while (true) {
            // No re-triggers during free spins, so we don't check for scatters here.
            const { totalWinnings: stepWinnings, winningPositions } = calculateWins(grid, betPerLine);

            if (stepWinnings > 0) {
                const winningsThisStep = stepWinnings * progressiveMultiplier;
                totalFreeSpinsWinnings += winningsThisStep;

                // The multiplier increases by +2 after every single winning cascade.
                progressiveMultiplier += 2;

                // Remove winning symbols and fill with new ones
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
                break; // No more wins in this free spin, move to the next.
            }
        }
    }
    return totalFreeSpinsWinnings;
}


/**
 * Simulates a single paid spin and returns the results.
 * @param {number} totalBet - The total bet for the spin.
 * @returns {object} An object containing totalWinnings, freeSpinsWinnings, and triggeredFreeSpins.
 */
function simulateSpin(totalBet) {
    const betPerLine = totalBet / PAYLINES.length;

    let grid = generateSpinResult();
    const initialGrid = JSON.parse(JSON.stringify(grid)); // Deep copy for scatter check
    let totalWinnings = 0;
    let baseGameMultiplier = 1;

    // --- Base Game Cascading Wins Loop ---
    while (true) {
        const { totalWinnings: stepWinnings, winningPositions } = calculateWins(grid, betPerLine);

        if (stepWinnings > 0) {
            const winningsThisStep = stepWinnings * baseGameMultiplier;
            totalWinnings += winningsThisStep;
            baseGameMultiplier++;

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

    // --- Scatter Check & Free Spins Trigger ---
    const scatterCount = initialGrid.flat().filter(s => s === SYMBOLS.SCATTER).length;
    let freeSpinsWinnings = 0;
    let triggeredFreeSpins = false;

    if (scatterCount >= 3) {
        const scatterWin = (SCATTER_PAYOUTS[scatterCount] || 0) * totalBet;
        totalWinnings += scatterWin;

        const freeSpinsCount = FREE_SPINS_CONFIG.TRIGGER_COUNT[scatterCount] || 0;
        if (freeSpinsCount > 0) {
            triggeredFreeSpins = true;
            freeSpinsWinnings = simulateFreeSpins(freeSpinsCount, totalBet);
            totalWinnings += freeSpinsWinnings;
        }
    }

    return { totalWinnings, freeSpinsWinnings, triggeredFreeSpins };
}

/**
 * Runs the main simulation loop.
 * @param {number} numSpins - The total number of spins to simulate.
 * @param {number} totalBet - The bet amount for each spin.
 */
function runSimulation(numSpins, totalBet) {
    console.log(`Starting simulation for ${numSpins.toLocaleString()} spins with a total bet of ${totalBet}...`);

    let totalWagered = 0;
    let totalWon = 0;
    let totalWonFromFreeSpins = 0;
    let freeSpinsFeaturesTriggered = 0;

    for (let i = 0; i < numSpins; i++) {
        totalWagered += totalBet;
        const { totalWinnings, freeSpinsWinnings, triggeredFreeSpins } = simulateSpin(totalBet);
        totalWon += totalWinnings;

        if (triggeredFreeSpins) {
            freeSpinsFeaturesTriggered++;
            totalWonFromFreeSpins += freeSpinsWinnings;
        }

        if ((i + 1) % 100000 === 0) {
            const progress = (((i + 1) / numSpins) * 100).toFixed(0);
            console.log(`...completed ${progress}% (${(i + 1).toLocaleString()} spins)`);
        }
    }

    const overallRTP = (totalWon / totalWagered) * 100;
    const freeSpinsRTP = (totalWonFromFreeSpins / totalWagered) * 100;
    const baseGameRTP = overallRTP - freeSpinsRTP;
    const hitFrequency = (freeSpinsFeaturesTriggered / numSpins) * 100;

    console.log("\n--- Simulation Results ---");
    console.log(`Total Spins: ${numSpins.toLocaleString()}`);
    console.log(`Total Wagered: ${totalWagered.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`Total Won: ${totalWon.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`\nOverall RTP: ${overallRTP.toFixed(4)}%`);
    console.log("--------------------------");
    console.log(`Base Game RTP: ${baseGameRTP.toFixed(4)}%`);
    console.log(`Free Spins RTP: ${freeSpinsRTP.toFixed(4)}%`);
    console.log("\n--- Free Spins Feature ---");
    console.log(`Features Triggered: ${freeSpinsFeaturesTriggered.toLocaleString()}`);
    console.log(`Hit Frequency: 1 in every ${(1 / (hitFrequency / 100)).toFixed(2)} spins`);
    if (freeSpinsFeaturesTriggered > 0) {
        const avgWin = totalWonFromFreeSpins / freeSpinsFeaturesTriggered;
        console.log(`Average Win: ${avgWin.toFixed(2)}x total bet`);
    }
    console.log("--------------------------\n");
}

// --- EXECUTION ---

// --- Configuration ---
const NUM_SPINS = 10; // 1 million spins for a decent sample size
const TOTAL_BET = 2;      // The total bet amount for each spin.
// -------------------

// The bet per line will be calculated as TOTAL_BET / number of paylines.
runSimulation(NUM_SPINS, TOTAL_BET);
