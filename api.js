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
    const betPerLine = totalBet / PAYLINES.length;

    let grid = generateSpinResult();
    const initialGrid = JSON.parse(JSON.stringify(grid)); // Deep copy for the response
    let totalWinnings = 0;
    let baseMultiplier = 1;
    const cascadeSteps = [];

    // --- Cascading Wins Loop ---
    while (true) {
        const { totalWinnings: stepWinnings, winningPaylines, winningPositions } = calculateWins(grid, betPerLine);

        if (stepWinnings > 0) {
            const winningsThisStep = stepWinnings * baseMultiplier;
            totalWinnings += winningsThisStep;

            cascadeSteps.push({
                step: baseMultiplier - 1,
                grid: JSON.parse(JSON.stringify(grid)),
                wins: winningPaylines,
                winningsThisStep,
                multiplier: baseMultiplier
            });

            baseMultiplier++;

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
    const scatterCount = initialGrid.flat().filter(s => s === SYMBOLS.SCATTER).length;
    let scatterWin = 0;
    let freeSpinsTriggered = false;
    let freeSpinsCount = 0;

    if (scatterCount >= 3) {
        scatterWin = (SCATTER_PAYOUTS[scatterCount] || 0) * totalBet;
        totalWinnings += scatterWin;
        freeSpinsTriggered = true;
        freeSpinsCount = FREE_SPINS_CONFIG.TRIGGER_COUNT[scatterCount] || 0;
        // Note: The actual free spins are not simulated here, only the trigger is reported.
    }

    userBalance += totalWinnings;

    res.json({
        initialGrid,
        totalWinnings,
        finalBalance: userBalance,
        cascadeSteps,
        scatterWin,
        freeSpins: {
            triggered: freeSpinsTriggered,
            spinCount: freeSpinsCount
        }
    });
});


app.listen(PORT, () => {
    console.log(`Slot game server running on http://localhost:${PORT}`);
});
