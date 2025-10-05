const crypto = require('crypto');

// --- CORE GAME CONFIGURATION (from rtpSimulation5x3.js) ---

const SYMBOLS = {
  WILD: 'wild', SCATTER: 'scatter', SEVEN: 'seven', BAR: 'bar', BELL: 'bell',
  MELON: 'melon', ORANGE: 'orange', PLUM: 'plum', CHERRY: 'cherry', LEMON: 'lemon',
};

// Paytable re-balanced for higher RTP and more meaningful wins.
const PAYTABLE = {
    [SYMBOLS.WILD]:   { 5: 500, 4: 150,  3: 30 },
    [SYMBOLS.SEVEN]:  { 5: 300, 4: 90,  3: 18 },
    [SYMBOLS.BAR]:    { 5: 150,  4: 60,  3: 12 },
    [SYMBOLS.BELL]:   { 5: 80,  4: 30,  3: 9 },
    [SYMBOLS.MELON]:  { 5: 60,  4: 20,   3: 7 },
    [SYMBOLS.ORANGE]: { 5: 40,  4: 15,   3: 5 },
    [SYMBOLS.PLUM]:   { 5: 30,  4: 12,   3: 4 },
    [SYMBOLS.CHERRY]: { 5: 25,  4: 10,   3: 3 },
    [SYMBOLS.LEMON]:  { 5: 25,  4: 10,   3: 3 },
};

const FREE_SPINS_CONFIG = {
  TRIGGER_COUNT: { 3: 10, 4: 15, 5: 20 },
  BASE_MULTIPLIER_INCREMENT: 2,
};

const SCATTER_PAYOUTS = { 5: 50, 4: 10, 3: 2 };

// Reel strips re-balanced for a lower hit frequency (~23-25%)
const REEL_STRIPS = [
    // Reel 1
    ['cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'bar', 'seven', 'wild', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'scatter'],
    // Reel 2
    ['cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'wild', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'scatter'],
    // Reel 3
    ['cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'wild', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'wild', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'scatter'],
    // Reel 4
    ['cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'wild', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'wild', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'scatter'],
    // Reel 5
    ['cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'wild', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'wild', 'cherry', 'lemon', 'orange', 'plum', 'bell', 'melon', 'bar', 'seven', 'scatter']
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

function formatGrid(grid) {
    if (!grid || grid.length === 0) return "Empty grid";
    const rows = [[], [], []];
    for (let reel = 0; reel < 5; reel++) {
        for (let row = 0; row < 3; row++) {
            rows[row][reel] = grid[reel] ? grid[reel][row] : 'N/A';
        }
    }
    return rows.map(row => row.map(symbol => symbol.padEnd(8)).join(' ')).join('\n');
}

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

    // Reduced logging for free spins during large simulations
    // console.log(`\n--- Starting Free Spins ---`);
    // console.log(`Total spins: ${freeSpinsCount}`);

    for (let i = 0; i < freeSpinsCount; i++) {
        let grid = generateSpinResult();
        // --- Cascading Wins Loop for a single Free Spin ---
        while (true) {
            const { totalWinnings: stepWinnings, winningPositions } = calculateWins(grid, betPerLine);

            if (stepWinnings > 0) {
                const winningsThisStep = stepWinnings * progressiveMultiplier;
                totalFreeSpinsWinnings += winningsThisStep;
                progressiveMultiplier += 2;

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
    return totalFreeSpinsWinnings;
}


/**
 * Simulates a single paid spin and returns the results.
 * @param {number} totalBet - The total bet for the spin.
 * @returns {object} An object containing totalWinnings, freeSpinsWinnings, triggeredFreeSpins, and isWinningSpin.
 */
function simulateSpin(totalBet) {
    const betPerLine = totalBet / PAYLINES.length;

    let grid = generateSpinResult();
    const initialGrid = JSON.parse(JSON.stringify(grid));
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

    const isWinningSpin = totalWinnings > 0;

    return { totalWinnings, freeSpinsWinnings, triggeredFreeSpins, isWinningSpin };
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
    let winningSpins = 0; // Counter for any winning spin

    for (let i = 0; i < numSpins; i++) {
        totalWagered += totalBet;
        const { totalWinnings, freeSpinsWinnings, triggeredFreeSpins, isWinningSpin } = simulateSpin(totalBet);
        totalWon += totalWinnings;

        if (isWinningSpin) {
            winningSpins++;
        }

        if (triggeredFreeSpins) {
            freeSpinsFeaturesTriggered++;
            totalWonFromFreeSpins += freeSpinsWinnings;
        }

        if ((i + 1) % 100000 === 0 && numSpins > 1000) {
            const progress = (((i + 1) / numSpins) * 100).toFixed(0);
            console.log(`...completed ${progress}% (${(i + 1).toLocaleString()} spins)`);
        }
    }

    const overallRTP = (totalWon / totalWagered) * 100;
    const freeSpinsRTP = (totalWonFromFreeSpins / totalWagered) * 100;
    const baseGameRTP = overallRTP - freeSpinsRTP;
    const overallHitFreq = (winningSpins / numSpins) * 100;
    const featureHitFreq = (freeSpinsFeaturesTriggered / numSpins) * 100;

    console.log("\n--- Simulation Results ---");
    console.log(`Total Spins: ${numSpins.toLocaleString()}`);
    console.log(`Total Wagered: ${totalWagered.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`Total Won: ${totalWon.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`\nOverall RTP: ${overallRTP.toFixed(4)}%`);
    console.log(`Win Hit Frequency: ${overallHitFreq.toFixed(2)}% (1 in every ${(1 / (overallHitFreq / 100)).toFixed(2)} spins)`);
    console.log("--------------------------");
    console.log(`Base Game RTP: ${baseGameRTP.toFixed(4)}%`);
    console.log(`Free Spins RTP: ${freeSpinsRTP.toFixed(4)}%`);
    console.log("\n--- Free Spins Feature ---");
    console.log(`Features Triggered: ${freeSpinsFeaturesTriggered.toLocaleString()}`);
    console.log(`Hit Frequency: 1 in every ${(1 / (featureHitFreq / 100)).toFixed(2)} spins`);
    if (freeSpinsFeaturesTriggered > 0) {
        const avgWin = totalWonFromFreeSpins / freeSpinsFeaturesTriggered;
        console.log(`Average Win: ${avgWin.toFixed(2)}x total bet`);
    }
    console.log("--------------------------\n");
}

// --- EXECUTION ---

// --- Configuration ---
// IMPORTANT: Run with at least 1,000,000 spins for statistically relevant results.
const NUM_SPINS = 1000000;
const TOTAL_BET = 2;      // The total bet amount for each spin.
// -------------------

// The bet per line will be calculated as TOTAL_BET / number of paylines.
runSimulation(NUM_SPINS, TOTAL_BET);
