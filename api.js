const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- CORE GAME CONFIGURATION (from rtpSimulation5x3.js) ---

const SYMBOLS = {
  WILD: 'wild', SCATTER: 'scatter', SEVEN: 'seven', BAR: 'bar', BELL: 'bell',
  MELON: 'melon', ORANGE: 'orange', PLUM: 'plum', CHERRY: 'cherry', LEMON: 'lemon',
};

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

        // Debugging log
        // console.log(`--- Payline ${index} ---`);
        // console.log(`Grid for payline ${index}:`, lineSymbols);

        // If first symbol is WILD, find the first non-WILD to determine the pay symbol
        if (firstSymbol === SYMBOLS.WILD) {
            firstSymbol = lineSymbols.find(s => s !== SYMBOLS.WILD) || SYMBOLS.WILD;
            // console.log(`First symbol was WILD, adjusted to: ${firstSymbol}`);
        }

        if (!PAYTABLE[firstSymbol]) {
            // console.log(`No paytable entry for ${firstSymbol}. Skipping.`);
            continue;
        }

        let matchCount = 0;
        for (const symbol of lineSymbols) {
            if (symbol === firstSymbol || symbol === SYMBOLS.WILD) {
                matchCount++;
            } else {
                break;
            }
        }

        // console.log(`Determined firstSymbol: ${firstSymbol}, matchCount: ${matchCount}`);

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
                // console.log(`Win found! Payout: ${payout}, Winning Paylines:`, winningPaylines[winningPaylines.length - 1]);
            }
        }
    }
    return { totalWinnings, winningPaylines, winningPositions };
}



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
                progressiveMultiplier += FREE_SPINS_CONFIG.BASE_MULTIPLIER_INCREMENT;

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
    const cascadeSteps = [];

    // --- Base Game Cascading Wins Loop ---
    while (true) {
        const currentGridForCalculation = JSON.parse(JSON.stringify(grid));
        const { totalWinnings: stepWinnings, winningPositions, winningPaylines } = calculateWins(currentGridForCalculation, betPerLine);

        if (stepWinnings > 0) {
            const winningsThisStep = stepWinnings * baseGameMultiplier;
            totalWinnings += winningsThisStep;

            cascadeSteps.push({
                step: baseGameMultiplier - 1,
                grid: currentGridForCalculation,
                wins: winningPaylines,
                winningsThisStep,
                multiplier: baseGameMultiplier
            });

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
    let freeSpinsCount = 0;
    let scatterWin = 0;

    if (scatterCount >= 3) {
        scatterWin = (SCATTER_PAYOUTS[scatterCount] || 0) * totalBet;
        totalWinnings += scatterWin;

        freeSpinsCount = FREE_SPINS_CONFIG.TRIGGER_COUNT[scatterCount] || 0;
        if (freeSpinsCount > 0) {
            triggeredFreeSpins = true;
            freeSpinsWinnings = simulateFreeSpins(freeSpinsCount, totalBet);
            totalWinnings += freeSpinsWinnings;
        }
    }

    const isWinningSpin = totalWinnings > 0;

    return {
        initialGrid,
        totalWinnings,
        freeSpinsWinnings,
        triggeredFreeSpins,
        isWinningSpin,
        scatterWin,
        freeSpinsCount,
        cascadeSteps
    };
}




// --- API ENDPOINT ---

// Mock user balance - in a real app, this would come from a database.
let userBalance = 1000;

app.post('/api/spin', (req, res) => {
    const { totalBet } = req.body;

    // --- Input Validation ---
    if (!totalBet || typeof totalBet !== 'number' || totalBet <= 0) {
        return res.status(400).json({ error: "Invalid totalBet provided. It must be a positive number." });
    }
    if (totalBet > userBalance) {
        return res.status(400).json({ error: "Insufficient balance." });
    }
     if (totalBet % PAYLINES.length !== 0) {
        return res.status(400).json({ error: `totalBet must be divisible by the number of paylines (${PAYLINES.length}).` });
    }


    userBalance -= totalBet;

    const spinResult = simulateSpin(totalBet);

    userBalance += spinResult.totalWinnings;

    res.json({
        initialGrid: spinResult.initialGrid,
        totalWinnings: spinResult.totalWinnings,
        finalBalance: userBalance,
        cascadeSteps: spinResult.cascadeSteps,
        scatterWin: spinResult.scatterWin,
        freeSpins: {
            triggered: spinResult.triggeredFreeSpins,
            spinCount: spinResult.freeSpinsCount
        }
    });
});


app.listen(PORT, () => {
    console.log(`Slot game server running on http://localhost:${PORT}`);
});
