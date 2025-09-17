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
