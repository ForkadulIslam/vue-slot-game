// --- CONFIGURATION ---
const TARGET_RTP = 96.0; // The desired Return to Player (in percent)
const TOLERANCE = 0.5; // How close we need to get to the target (e.g., +/- 0.5%)
const MAX_ITERATIONS = 50; // Increased iterations
const SIMULATION_SPINS = 1000000; // Increased spins for better accuracy

// Symbols, Paytable, Paylines etc. (Copied from rtpSimulation5x3.js)
const SYMBOLS = {
    WILD: 'wild', SCATTER: 'scatter', SEVEN: 'seven', BAR: 'bar', BELL: 'bell',
    MELON: 'melon', ORANGE: 'orange', PLUM: 'plum', CHERRY: 'cherry', LEMON: 'lemon',
};
const PAYTABLE = {
    [SYMBOLS.WILD]:   { 5: 5000, 4: 1000, 3: 100 }, [SYMBOLS.SEVEN]:  { 5: 2500, 4: 500,  3: 50 },
    [SYMBOLS.BAR]:    { 5: 1000, 4: 200,  3: 40 }, [SYMBOLS.BELL]:   { 5: 500,  4: 100,  3: 20 },
    [SYMBOLS.MELON]:  { 5: 250,  4: 50,   3: 15 }, [SYMBOLS.ORANGE]: { 5: 100,  4: 20,   3: 8 },
    [SYMBOLS.PLUM]:   { 5: 80,   4: 15,   3: 6 }, [SYMBOLS.CHERRY]: { 5: 60,   4: 12,   3: 5 },
    [SYMBOLS.LEMON]:  { 5: 50,   4: 10,   3: 4 },
};
const SCATTER_PAYOUTS = { 5: 100, 4: 20, 3: 5 };
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

// --- AUTO-TUNING LOGIC ---

// Base reel strips configuration (REVISED FOR HIGHER HIT FREQUENCY)
const BASE_REEL_STRIPS = [
  // Reel 1: Heavily weighted with low-tier symbols
  [SYMBOLS.SEVEN, SYMBOLS.BAR, SYMBOLS.BELL, SYMBOLS.SCATTER, ...Array(40).fill(SYMBOLS.LEMON), ...Array(40).fill(SYMBOLS.CHERRY), ...Array(30).fill(SYMBOLS.PLUM), ...Array(20).fill(SYMBOLS.ORANGE)],
  // Reel 2: Also weighted with low-tier symbols to help form 3-of-a-kinds
  [SYMBOLS.SEVEN, SYMBOLS.BAR, SYMBOLS.BELL, SYMBOLS.MELON, ...Array(30).fill(SYMBOLS.LEMON), ...Array(30).fill(SYMBOLS.CHERRY), ...Array(30).fill(SYMBOLS.PLUM), ...Array(25).fill(SYMBOLS.ORANGE)],
  // Reel 3: Balanced, but still favoring low/mid symbols
  [SYMBOLS.SEVEN, SYMBOLS.BAR, SYMBOLS.BELL, SYMBOLS.MELON, SYMBOLS.SCATTER, ...Array(25).fill(SYMBOLS.ORANGE), ...Array(20).fill(SYMBOLS.MELON), ...Array(20).fill(SYMBOLS.BELL), ...Array(15).fill(SYMBOLS.PLUM)],
  // Reel 4: More high-tier symbols start to appear
  [SYMBOLS.SEVEN, SYMBOLS.BAR, SYMBOLS.BELL, SYMBOLS.MELON, ...Array(20).fill(SYMBOLS.SEVEN), ...Array(15).fill(SYMBOLS.BAR), ...Array(15).fill(SYMBOLS.BELL), ...Array(10).fill(SYMBOLS.MELON)],
  // Reel 5: Heavily weighted with high-tier symbols for big win potential
  [SYMBOLS.SEVEN, SYMBOLS.BAR, SYMBOLS.BELL, SYMBOLS.MELON, SYMBOLS.SCATTER, ...Array(25).fill(SYMBOLS.SEVEN), ...Array(20).fill(SYMBOLS.BAR)],
];

// Function to generate reel strips with a specific number of wilds
function generateReelStrips(wildCounts) {
    return BASE_REEL_STRIPS.map((reel, i) => {
        const newReel = [...reel];
        for (let j = 0; j < wildCounts[i]; j++) {
            newReel.push(SYMBOLS.WILD);
        }
        return newReel;
    });
}


async function autoTune() {
    console.log(`--- Starting Auto-Tuner for Target RTP: ${TARGET_RTP}% ---`);

    let wildCounts = [5, 5, 5, 5, 5]; 
    let lastError = null;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        console.log(`
Iteration ${i + 1}/${MAX_ITERATIONS}...`);
        console.log(`Testing with Wild Counts: [${wildCounts.join(', ')}]`);

        const reelStrips = generateReelStrips(wildCounts);
        const { rtp } = runSimulation(SIMULATION_SPINS, reelStrips);

        console.log(`Resulting RTP: ${rtp.toFixed(4)}%`);

        const error = rtp - TARGET_RTP;

        if (Math.abs(error) <= TOLERANCE) {
            console.log(`
--- SUCCESS ---`);
            console.log(`Target RTP achieved within tolerance.`);
            console.log(`Final Wild Counts: [${wildCounts.join(', ')}]`);
            console.log(`Final RTP: ${rtp.toFixed(4)}%`);
            console.log("\nFinal REEL_STRIPS configuration (copy this to your game files):");
            console.log(JSON.stringify(reelStrips.map(reel => JSON.stringify(reel)), null, 2));
            return;
        }

        // Improved Adjustment Logic
        let adjustment = 1; // Default adjustment of 1 wild
        if (Math.abs(error) < 10) {
            // If we are close, make smaller adjustments
            adjustment = 1;
        } else {
            // If we are far, make larger adjustments
            adjustment = Math.ceil(Math.abs(error) / 10);
        }

        // If we overshot the target, reverse direction and halve the adjustment
        if (lastError !== null && Math.sign(error) !== Math.sign(lastError)) {
            adjustment = Math.ceil(adjustment / 2);
        }
        
        const direction = error > 0 ? -1 : 1; // -1 to reduce wilds, 1 to increase

        wildCounts = wildCounts.map((count, index) => {
            // Apply adjustment mainly to the middle reels
            if (index > 0 && index < 4) {
                return Math.max(0, count + (direction * adjustment));
            }
            return count;
        });

        lastError = error;
    }

    console.log(`
--- FAILED ---`);
    console.log(`Could not reach target RTP within ${MAX_ITERATIONS} iterations.`);
}


// --- Simulation Logic (Full version from rtpSimulation5x3.js) ---

function runSimulation(numSpins, reelStrips) {
    let totalBet = 0;
    let totalWon = 0;
    const betPerLine = 1;
    const totalBetAmount = betPerLine * PAYLINES.length;

    for (let i = 0; i < numSpins; i++) {
        totalBet += totalBetAmount;
        let grid = generateSpinResult(reelStrips);
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
                        newReel.unshift(getRandomSymbol(reel, reelStrips));
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
            if (freeSpinsCount) {
                spinWinnings += runFreeSpins(freeSpinsCount, betPerLine, reelStrips);
            }
        }

        totalWon += spinWinnings;
    }
    const rtp = (totalWon / totalBet) * 100;
    return { rtp };
}

function runFreeSpins(spinCount, betPerLine, reelStrips) {
    let totalWinnings = 0;
    let multiplier = 1;

    for (let i = 0; i < spinCount; i++) {
        let grid = generateSpinResult(reelStrips);
        // Free spins cascade loop
        while (true) {
            const { totalWinnings: cascadeWinnings, winningPositions } = calculateWins(grid, betPerLine);
            if (cascadeWinnings > 0) {
                totalWinnings += cascadeWinnings * multiplier;
                multiplier += FREE_SPINS_CONFIG.BASE_MULTIPLIER_INCREMENT;

                const nextGrid = grid.map(reel => [...reel]);
                winningPositions.forEach(pos => {
                    const [reel, row] = pos.split(',').map(Number);
                    nextGrid[reel][row] = null;
                });

                for (let reel = 0; reel < 5; reel++) {
                    const newReel = nextGrid[reel].filter(s => s !== null);
                    const nullCount = 3 - newReel.length;
                    for (let k = 0; k < nullCount; k++) {
                        newReel.unshift(getRandomSymbol(reel, reelStrips));
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

function generateSpinResult(reelStrips) {
    const grid = [];
    for (let i = 0; i < 5; i++) {
        const reelSymbols = [];
        const stopPosition = Math.floor(Math.random() * reelStrips[i].length);
        for (let j = 0; j < 3; j++) {
            reelSymbols.push(reelStrips[i][(stopPosition + j) % reelStrips[i].length]);
        }
        grid.push(reelSymbols);
    }
    return grid;
}

function calculateWins(grid, betPerLine) {
    let totalWinnings = 0;
    const winningPositions = new Set();
    for (const payline of PAYLINES) {
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
                for (let i = 0; i < matchCount; i++) winningPositions.add(`${i},${payline[i]}`);
            }
        }
    }
    return { totalWinnings, winningPositions };
}

function getRandomSymbol(reelIndex, reelStrips) {
  const reel = reelStrips[reelIndex];
  return reel[Math.floor(Math.random() * reel.length)];
}

autoTune();
