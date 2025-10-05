// =================================================================================================
// JILI-STYLE SLOT SIMULATOR - REFACTORED FOR ACCURACY AND TESTING
// =================================================================================================
// This simulator is designed for precise testing of game logic based on 'game_logic_guide.md'.
// It includes a feature simulator for verifying complex, stateful sessions like Free Spins.
// =================================================================================================

const crypto = require('crypto');

// =======================================
// 1. CORE GAME CONFIGURATION
// =======================================

const SYMBOLS = {
    WILD: 'W', SCATTER: 'S', SEVEN: '7', BAR: 'B', BELL: 'E',
    MELON: 'M', ORANGE: 'O', PLUM: 'P', CHERRY: 'C', LEMON: 'L'
};

const PAYTABLE = {
    [SYMBOLS.WILD]:   { 5: 5000, 4: 1000, 3: 100 },
    [SYMBOLS.SEVEN]:  { 5: 2500, 4: 500,  3: 50  },
    [SYMBOLS.BAR]:    { 5: 1000, 4: 200,  3: 40  },
    [SYMBOLS.BELL]:   { 5: 500,  4: 100,  3: 20  },
    [SYMBOLS.MELON]:  { 5: 250,  4: 50,   3: 15  },
    [SYMBOLS.ORANGE]: { 5: 100,  4: 20,   3: 8   },
    [SYMBOLS.PLUM]:   { 5: 80,   4: 15,   3: 6   },
    [SYMBOLS.CHERRY]: { 5: 60,   4: 12,   3: 5   },
    [SYMBOLS.LEMON]:  { 5: 50,   4: 10,   3: 4   }
};

const SCATTER_PAYOUTS = { 5: 100, 4: 20, 3: 5 };
const FREE_SPINS_AWARDS = { 5: 20, 4: 15, 3: 10 };

const PAYLINES = [
    [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
    [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 0, 1, 0],
    [2, 1, 2, 1, 2], [1, 0, 1, 2, 1], [1, 2, 1, 0, 1], [0, 2, 0, 2, 0], [2, 0, 2, 0, 2],
    [0, 2, 2, 2, 0], [2, 0, 0, 0, 2], [0, 0, 1, 0, 0], [2, 2, 1, 2, 2], [1, 0, 2, 0, 1],
    [1, 2, 0, 2, 1], [0, 1, 1, 1, 2], [2, 1, 1, 1, 0], [0, 2, 1, 0, 2], [2, 0, 1, 2, 0]
];

// =======================================
// 2. CORE GAME LOGIC (UPDATED)
// =======================================

function calculateWin(grid, totalBet) {
    const betPerLine = totalBet / PAYLINES.length;
    const lineWins = [];
    let totalLineWin = 0;
    const winningPositionsSet = new Set(); // Use a Set to store unique positions as strings

    for (let i = 0; i < PAYLINES.length; i++) {
        const line = PAYLINES[i];
        const lineSymbols = line.map((row, reel) => grid[reel][row]);
        const firstSymbol = lineSymbols[0];
        let bestWin = { payout: 0, count: 0, symbol: null };

        // Logic for non-wild starting symbols
        if (firstSymbol !== SYMBOLS.WILD) {
            let count = lineSymbols.findIndex(symbol => symbol !== firstSymbol && symbol !== SYMBOLS.WILD);
            if (count === -1) count = 5;
            if (count >= 3) {
                bestWin = { payout: PAYTABLE[firstSymbol]?.[count] || 0, count, symbol: firstSymbol };
            }
        } 
        // Logic for wild starting symbols
        else {
            let wildCount = lineSymbols.findIndex(symbol => symbol !== SYMBOLS.WILD);
            if (wildCount === -1) wildCount = 5;
            if (wildCount >= 3) {
                bestWin = { payout: PAYTABLE[SYMBOLS.WILD]?.[wildCount] || 0, count: wildCount, symbol: SYMBOLS.WILD };
            }
            if (wildCount < 5) {
                const subSymbol = lineSymbols[wildCount];
                if (PAYTABLE[subSymbol] && subSymbol !== SYMBOLS.SCATTER) {
                    let consecutiveSymbols = 0;
                    for (let j = wildCount; j < lineSymbols.length; j++) {
                        if (lineSymbols[j] === subSymbol || lineSymbols[j] === SYMBOLS.WILD) {
                            consecutiveSymbols++;
                        } else {
                            break;
                        }
                    }
                    const subCount = wildCount + consecutiveSymbols;
                    if (subCount >= 3) {
                        const subPayout = PAYTABLE[subSymbol]?.[subCount] || 0;
                        if (subPayout > bestWin.payout) {
                            bestWin = { payout: subPayout, count: subCount, symbol: subSymbol };
                        }
                    }
                }
            }
        }

        if (bestWin.payout > 0) {
            const winAmount = bestWin.payout * betPerLine;
            totalLineWin += winAmount;
            lineWins.push({ lineIndex: i, symbol: bestWin.symbol, count: bestWin.count, winAmount });
            // Add winning positions to the set
            for (let reel = 0; reel < bestWin.count; reel++) {
                const row = line[reel];
                winningPositionsSet.add(JSON.stringify([reel, row]));
            }
        }
    }

    const scatterPositions = [];
    grid.forEach((reel, reelIndex) => {
        reel.forEach((symbol, rowIndex) => {
            if (symbol === SYMBOLS.SCATTER) {
                scatterPositions.push([reelIndex, rowIndex]);
            }
        });
    });

    const scatterCount = scatterPositions.length;
    const scatterWin = (SCATTER_PAYOUTS[scatterCount] || 0) * totalBet;
    const freeSpinsAwarded = FREE_SPINS_AWARDS[scatterCount] || 0;

    if (scatterWin > 0) {
        scatterPositions.forEach(pos => winningPositionsSet.add(JSON.stringify(pos)));
    }

    return {
        totalWin: totalLineWin + scatterWin,
        lineWins,
        scatterWin,
        scatterCount,
        freeSpinsAwarded,
        winningPositions: Array.from(winningPositionsSet).map(s => JSON.parse(s)),
    };
}

function cascadeGrid(grid, winningPositions) {
    const newGrid = grid.map(reel => [...reel]); // Deep copy
    const rows = newGrid[0].length;
    const reels = newGrid.length;

    // Mark winning positions as null
    for (const pos of winningPositions) {
        const [reel, row] = pos;
        if (newGrid[reel] && newGrid[reel][row] !== undefined) {
            newGrid[reel][row] = null;
        }
    }

    // Drop symbols down and fill with new ones
    for (let reel = 0; reel < reels; reel++) {
        // Get surviving symbols in the column
        const survivors = newGrid[reel].filter(symbol => symbol !== null);
        
        // Calculate how many new symbols are needed
        const newSymbolCount = rows - survivors.length;
        
        // Generate new symbols
        const newSymbols = [];
        const symbolKeys = Object.values(SYMBOLS);
        for (let i = 0; i < newSymbolCount; i++) {
            const randomIndex = crypto.randomInt(0, symbolKeys.length);
            newSymbols.push(symbolKeys[randomIndex]);
        }
        
        // Reconstruct the reel with new symbols at the top and survivors at the bottom
        newGrid[reel] = [...newSymbols, ...survivors];
    }

    return newGrid;
}

// =======================================
// 3. RANDOM GRID GENERATION
// =======================================

function generateRandomGrid(reels, rows) {
    const grid = [];
    const symbolKeys = Object.values(SYMBOLS);
    for (let i = 0; i < reels; i++) {
        const reel = [];
        for (let j = 0; j < rows; j++) {
            const randomIndex = crypto.randomInt(0, symbolKeys.length);
            reel.push(symbolKeys[randomIndex]);
        }
        grid.push(reel);
    }
    return grid;
}

// =======================================
// 4. NEW: REALISTIC SIMULATION ENGINE
// =======================================

function runRealisticCascadeSimulation(testName, { totalBet }) {
    console.log(`\n--- Running Realistic Cascade Test: "${testName}" ---`);
    console.log(`Total Bet: $${totalBet.toFixed(2)}`);

    // 1. Trigger Spin
    let triggerGrid;
    let initialResult;
    let attempts = 0;
    // Keep trying until we trigger a free spins feature
    do {
        triggerGrid = generateRandomGrid(5, 3);
        initialResult = calculateWin(triggerGrid, totalBet);
        attempts++;
    } while (initialResult.freeSpinsAwarded === 0 && attempts < 1000); // Safety break after 1000 tries

    console.log(`(Feature triggered after ${attempts} attempt(s))`);
    console.log('\n--- Trigger Spin ---');
    console.log('Grid:');
    triggerGrid[0].forEach((_, rowIndex) => console.log(`  ${triggerGrid.map(col => col[rowIndex]).join('\t')}`));
    console.log(`Win: $${initialResult.totalWin.toFixed(2)}`);
    console.log(`Free Spins Awarded: ${initialResult.freeSpinsAwarded}`);

    if (initialResult.freeSpinsAwarded === 0) {
        console.log('\nFeature did not trigger after '+attempts+' attempts. Test cannot proceed.');
        console.log(`--- Test Complete: "${testName}" ---`);
        return;
    }

    // 2. Free Spins Session
    let freeSpinsRemaining = initialResult.freeSpinsAwarded;
    let totalFeatureWin = initialResult.totalWin;
    let progressiveMultiplier = 1;

    console.log('\n--- Free Spins Session ---');

    for (let spin = 1; spin <= freeSpinsRemaining; spin++) {
        console.log(`\nSpin ${spin} (Spins Remaining: ${freeSpinsRemaining - spin + 1})`);
        
        let currentGridForSpin = generateRandomGrid(5, 3); // Generate one grid for the start of the spin
        let cascadeCount = 0;

        while (true) {
            const gridResult = calculateWin(currentGridForSpin, totalBet);

            console.log(`  Cascade ${cascadeCount} (Multiplier: x${progressiveMultiplier})`);
            console.log('  Grid:');
            currentGridForSpin[0].forEach((_, rowIndex) => console.log(`    ${currentGridForSpin.map(col => col[rowIndex]).join('\t')}`));

            if (gridResult.totalWin > 0) {
                const winWithMultiplier = gridResult.totalWin * progressiveMultiplier;
                totalFeatureWin += winWithMultiplier;

                console.log(`  Win: $${gridResult.totalWin.toFixed(2)} * ${progressiveMultiplier} = $${winWithMultiplier.toFixed(2)}`);
                
                progressiveMultiplier += 2; // Increment multiplier AFTER a win
                cascadeCount++;

                // Generate the NEXT grid state by cascading
                currentGridForSpin = cascadeGrid(currentGridForSpin, gridResult.winningPositions);
                console.log('  (Cascading...)');

            } else {
                console.log('  No new win. Ending spin.');
                break; // Exit cascade loop for this spin
            }
        }
    }

    // 3. Summary
    console.log('\n--- Feature Summary ---');
    console.log(`Initial Trigger Win: $${initialResult.totalWin.toFixed(2)}`);
    console.log(`Total Win from Free Spins: $${(totalFeatureWin - initialResult.totalWin).toFixed(2)}`);
    console.log(`GRAND TOTAL WIN: $${totalFeatureWin.toFixed(2)}`);
    console.log(`--- Test Complete: "${testName}" ---
`);
}


// =======================================
// 5. OLD SIMULATION ENGINES (FOR REFERENCE)
// =======================================

function simulateFeature(testName, { totalBet }) {
    console.log(`\n--- Running Feature Test: "${testName}" ---`);
    console.log(`Total Bet: $${totalBet.toFixed(2)}`);
    const grid = generateRandomGrid(5, 3);
    console.log('Real grid', grid);

    const initialResult = calculateWin(grid, totalBet);
    let totalFeatureWin = initialResult.totalWin;
    let freeSpinsRemaining = initialResult.freeSpinsAwarded;

    console.log('\n--- Trigger Spin ---');
    console.log('Grid:');
    grid[0].forEach((_, rowIndex) => console.log(`  ${grid.map(col => col[rowIndex]).join('\t')}`));
    console.log(`Win: $${initialResult.totalWin.toFixed(2)}`);
    console.log(`Free Spins Awarded: ${freeSpinsRemaining}`);
    if (freeSpinsRemaining === 0) {
        console.log('\nFeature did not trigger. Test cannot proceed.');
        console.log(`--- Test Complete: "${testName}" ---`);
        return;
    }
    const featureGrids = [];
    for(freeSpinCount=0; freeSpinCount < freeSpinsRemaining; freeSpinCount++){
        featureGrids[freeSpinCount] = generateRandomGrid(5, 3);
    }
    console.log('Generated free spins', featureGrids);
    let progressiveMultiplier = 1;
    let featureGridIndex = 0;

    console.log('\n--- Free Spins Session ---');

    for (let spin = 1; spin <= freeSpinsRemaining; spin++) {
        console.log(`\nSpin ${spin} (Spins Remaining: ${freeSpinsRemaining - spin + 1})`);
        let cascadeCount = 0;

        while (true) { 
            if (featureGridIndex >= featureGrids.length) {
                console.log('  (Out of feature grids, ending spin)');
                break;
            }
            const currentGrid = featureGrids[featureGridIndex];
            const gridResult = calculateWin(currentGrid, totalBet);
            featureGridIndex++;

            console.log(`  Cascade ${cascadeCount} (Multiplier: x${progressiveMultiplier})`);
            console.log('  Grid:');
            currentGrid[0].forEach((_, rowIndex) => console.log(`    ${currentGrid.map(col => col[rowIndex]).join('\t')}`));

            if (gridResult.totalWin > 0) {
                const winWithMultiplier = gridResult.totalWin * progressiveMultiplier;
                totalFeatureWin += winWithMultiplier;

                console.log(`  Win: $${gridResult.totalWin.toFixed(2)} * ${progressiveMultiplier} = $${winWithMultiplier.toFixed(2)}`);
                
                progressiveMultiplier += 2;
                cascadeCount++;
            } else {
                console.log('  No win on this grid. Ending spin.');
                break;
            }
        }
         if (featureGridIndex >= featureGrids.length && spin < freeSpinsRemaining) {
            console.log('\n(Out of feature grids, ending session early)');
            freeSpinsRemaining = spin;
        }
    }

    console.log('\n--- Feature Summary ---');
    console.log(`Initial Trigger Win: $${initialResult.totalWin.toFixed(2)}`);
    console.log(`Total Win from Free Spins: $${(totalFeatureWin - initialResult.totalWin).toFixed(2)}`);
    console.log(`GRAND TOTAL WIN: $${totalFeatureWin.toFixed(2)}`);
    console.log(`--- Test Complete: "${testName}" ---`);
}

function testRandomSpin() {
    console.log('\n--- Running Real Spin Test ---');
    const totalBet = 25;
    const grid = generateRandomGrid(5, 3);
    const initialResult = calculateWin(grid, totalBet);
    let totalSessionWin = initialResult.totalWin;

    console.log('--- Initial Spin ---');
    console.log('Generated Grid:');
    grid[0].forEach((_, rowIndex) => console.log(`  ${grid.map(col => col[rowIndex]).join('\t')}`));
    
    console.log(`\nInitial Win: $${initialResult.totalWin.toFixed(2)}`);
    if (initialResult.lineWins.length > 0) {
        console.log('Line Wins:');
        initialResult.lineWins.forEach(win => {
            console.log(`  - Line ${win.lineIndex + 1}: ${win.count}x '${win.symbol}' -> $${win.winAmount.toFixed(2)}`);
        });
    }
    if (initialResult.scatterWin > 0) {
        console.log(`Scatter Win: ${initialResult.scatterCount}x 'S' -> $${initialResult.scatterWin.toFixed(2)}`);
    }
    if (initialResult.freeSpinsAwarded > 0) {
        console.log(`Free Spins Awarded: ${initialResult.freeSpinsAwarded}`);
        
        let freeSpinsRemaining = initialResult.freeSpinsAwarded;
        let totalFreeSpinsWin = 0;
        let spinCount = 0;

        console.log('\n--- Free Spins Session ---');
        while (freeSpinsRemaining > 0) {
            spinCount++;
            freeSpinsRemaining--;

            const fsGrid = generateRandomGrid(5, 3);
            const fsResult = calculateWin(fsGrid, totalBet);
            totalFreeSpinsWin += fsResult.totalWin;
            
            console.log(`\nFree Spin ${spinCount} (Remaining: ${freeSpinsRemaining + fsResult.freeSpinsAwarded})`);
            console.log('Grid:');
            fsGrid[0].forEach((_, rowIndex) => console.log(`  ${fsGrid.map(col => col[rowIndex]).join('\t')}`));
            console.log(`Win for this spin: $${fsResult.totalWin.toFixed(2)}`);
        }
        
        totalSessionWin += totalFreeSpinsWin;
        console.log('\n--- Free Spins Summary ---');
        console.log(`Total Win from Free Spins: $${totalFreeSpinsWin.toFixed(2)}`);
    }

    console.log('\n--- Session Summary ---');
    console.log(`GRAND TOTAL WIN: $${totalSessionWin.toFixed(2)}`);
    console.log('--- Test Complete: "Real Spin Test" ---');
}

// =======================================
// 6. TEST EXECUTION
// =======================================

// --- NEW: REALISTIC CASCADE SIMULATION ---
runRealisticCascadeSimulation("Realistic Free Spins with Cascades", {
    totalBet: 25
});


// --- OLD FEATURE TESTING (COMMENTED OUT) ---
// simulateFeature("Complex Free Spins with Cascades and Persistent Multiplier (Corrected)", {
//     totalBet: 25
// });

// --- REAL SPIN TESTING (COMMENTED OUT) ---
//testRandomSpin();
