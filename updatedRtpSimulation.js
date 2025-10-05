// ==================== MONTE CARLO SLOT SIMULATION ====================
// Symbol Definitions
const SYMBOLS = {
    WILD: 'W',     // Wild - substitutes for all except scatter
    SCATTER: 'S',  // Scatter - pays anywhere, triggers free spins
    SEVEN: '7',    // Highest paying standard symbol
    DIAMOND: 'D',  // High paying
    RUBY: 'R',     // Medium-High paying
    GOLD: 'G',     // Medium paying  
    SILVER: 'V',   // Medium-Low paying
    BRONZE: 'B',   // Low paying
    HEART: 'H',    // Low paying
    CLUB: 'C'      // Lowest paying
};

// Paytable (payouts for 3, 4, 5 of a kind) - Adjusted for ~95% RTP
const PAYTABLE = {
    [SYMBOLS.WILD]:    {3: 2.0, 4: 5.0, 5: 10.0},
    [SYMBOLS.SEVEN]:   {3: 1.5, 4: 4.0, 5: 8.0},
    [SYMBOLS.DIAMOND]: {3: 1.0, 4: 3.0, 5: 6.0},
    [SYMBOLS.RUBY]:    {3: 0.8, 4: 2.0, 5: 4.0},
    [SYMBOLS.GOLD]:    {3: 0.6, 4: 1.5, 5: 3.0},
    [SYMBOLS.SILVER]:  {3: 0.4, 4: 1.0, 5: 2.0},
    [SYMBOLS.BRONZE]:  {3: 0.3, 4: 0.8, 5: 1.5},
    [SYMBOLS.HEART]:   {3: 0.2, 4: 0.5, 5: 1.0},
    [SYMBOLS.CLUB]:    {3: 0.1, 4: 0.3, 5: 0.5}
};

// Scatter Payouts (pays based on count anywhere on screen)
const SCATTER_PAYOUTS = {
    2: 0,   // No payout for 2 scatters
    3: 2,   // 2 × bet = credits  
    4: 5,   // 5 × bet = credits
    5: 10   // 10 × bet = credits
};

// Free Spins Configuration
const FREE_SPINS_CONFIG = {
    TRIGGER_COUNT: {
        2: 0,   // No free spins for 2 scatters
        3: 8,   // 3 scatters = 8 free spins
        4: 15,  // 4 scatters = 15 free spins
        5: 20   // 5 scatters = 20 free spins
    },
    MULTIPLIER: 2,        // Win multiplier during free spins
    RETRIGGER: true,      // Can trigger more free spins
    MAX_RETRIGGERS: 2     // Maximum retriggers allowed
};

// Cascade Configuration - ENABLED
const CASCADE_CONFIG = {
    ENABLED: true,        // Enable cascading feature
    MAX_CASCADES: 5,      // Maximum cascades per spin
    SYMBOL_REMOVAL: 'winning', // Remove only winning symbols
    DIRECTION: 'top'      // New symbols fall from the top
};

// Reel Strips (Weighted for ~95% RTP and ~23% hit frequency)
const REEL_STRIPS = [
    // Reel 1: High frequency of low-value symbols
    [
        SYMBOLS.CLUB, SYMBOLS.CLUB, SYMBOLS.CLUB, SYMBOLS.CLUB, SYMBOLS.CLUB,
        SYMBOLS.CLUB, SYMBOLS.CLUB, SYMBOLS.CLUB, SYMBOLS.CLUB, SYMBOLS.CLUB,
        SYMBOLS.HEART, SYMBOLS.HEART, SYMBOLS.HEART, SYMBOLS.HEART, SYMBOLS.HEART,
        SYMBOLS.HEART, SYMBOLS.HEART, SYMBOLS.HEART, SYMBOLS.HEART,
        SYMBOLS.BRONZE, SYMBOLS.BRONZE, SYMBOLS.BRONZE, SYMBOLS.BRONZE,
        SYMBOLS.SILVER, SYMBOLS.SILVER, SYMBOLS.SILVER,
        SYMBOLS.GOLD, SYMBOLS.GOLD,
        SYMBOLS.RUBY,
        SYMBOLS.DIAMOND,
        SYMBOLS.SEVEN,
        SYMBOLS.SCATTER,
        SYMBOLS.WILD
    ],
    // Reel 2: Balanced distribution
    [
        SYMBOLS.CLUB, SYMBOLS.CLUB, SYMBOLS.CLUB, SYMBOLS.CLUB,
        SYMBOLS.CLUB, SYMBOLS.CLUB, SYMBOLS.CLUB, SYMBOLS.CLUB,
        SYMBOLS.HEART, SYMBOLS.HEART, SYMBOLS.HEART, SYMBOLS.HEART,
        SYMBOLS.HEART, SYMBOLS.HEART, SYMBOLS.HEART, SYMBOLS.HEART,
        SYMBOLS.BRONZE, SYMBOLS.BRONZE, SYMBOLS.BRONZE,
        SYMBOLS.SILVER, SYMBOLS.SILVER, SYMBOLS.SILVER,
        SYMBOLS.GOLD, SYMBOLS.GOLD, SYMBOLS.GOLD,
        SYMBOLS.RUBY, SYMBOLS.RUBY,
        SYMBOLS.DIAMOND, SYMBOLS.DIAMOND,
        SYMBOLS.SEVEN,
        SYMBOLS.SCATTER,
        SYMBOLS.WILD, SYMBOLS.WILD
    ],
    // Reel 3: Center reel - good mix
    [
        SYMBOLS.CLUB, SYMBOLS.CLUB, SYMBOLS.CLUB,
        SYMBOLS.HEART, SYMBOLS.HEART, SYMBOLS.HEART,
        SYMBOLS.HEART,
        SYMBOLS.BRONZE, SYMBOLS.BRONZE, SYMBOLS.BRONZE,
        SYMBOLS.SILVER, SYMBOLS.SILVER, SYMBOLS.SILVER,
        SYMBOLS.GOLD, SYMBOLS.GOLD, SYMBOLS.GOLD,
        SYMBOLS.RUBY, SYMBOLS.RUBY, SYMBOLS.RUBY,
        SYMBOLS.DIAMOND, SYMBOLS.DIAMOND, SYMBOLS.DIAMOND,
        SYMBOLS.SEVEN, SYMBOLS.SEVEN,
        SYMBOLS.SCATTER, SYMBOLS.SCATTER,
        SYMBOLS.WILD, SYMBOLS.WILD, SYMBOLS.WILD
    ],
    // Reel 4: More high-value symbols
    [
        SYMBOLS.CLUB, SYMBOLS.CLUB,
        SYMBOLS.HEART, SYMBOLS.HEART,
        SYMBOLS.BRONZE, SYMBOLS.BRONZE,
        SYMBOLS.SILVER, SYMBOLS.SILVER,
        SYMBOLS.GOLD, SYMBOLS.GOLD, SYMBOLS.GOLD,
        SYMBOLS.RUBY, SYMBOLS.RUBY, SYMBOLS.RUBY,
        SYMBOLS.DIAMOND, SYMBOLS.DIAMOND, SYMBOLS.DIAMOND,
        SYMBOLS.SEVEN, SYMBOLS.SEVEN, SYMBOLS.SEVEN,
        SYMBOLS.SCATTER, SYMBOLS.SCATTER, SYMBOLS.SCATTER,
        SYMBOLS.WILD, SYMBOLS.WILD, SYMBOLS.WILD, SYMBOLS.WILD
    ],
    // Reel 5: Highest value symbols concentration
    [
        SYMBOLS.CLUB,
        SYMBOLS.HEART,
        SYMBOLS.BRONZE,
        SYMBOLS.SILVER,
        SYMBOLS.GOLD, SYMBOLS.GOLD,
        SYMBOLS.RUBY, SYMBOLS.RUBY, SYMBOLS.RUBY,
        SYMBOLS.DIAMOND, SYMBOLS.DIAMOND, SYMBOLS.DIAMOND, SYMBOLS.DIAMOND,
        SYMBOLS.SEVEN, SYMBOLS.SEVEN, SYMBOLS.SEVEN, SYMBOLS.SEVEN,
        SYMBOLS.SCATTER, SYMBOLS.SCATTER, SYMBOLS.SCATTER, SYMBOLS.SCATTER,
        SYMBOLS.WILD, SYMBOLS.WILD, SYMBOLS.WILD, SYMBOLS.WILD, SYMBOLS.WILD
    ]
];

// Paylines (20 lines for 5x3 grid)
const PAYLINES = [
    [1, 1, 1, 1, 1], // Middle line
    [0, 0, 0, 0, 0], // Top line
    [2, 2, 2, 2, 2], // Bottom line
    [0, 1, 2, 1, 0], // V shape
    [2, 1, 0, 1, 2], // Inverted V
    [1, 0, 0, 0, 1], // Top tent
    [1, 2, 2, 2, 1], // Bottom tent
    [0, 0, 1, 2, 2], // High left to low right
    [2, 2, 1, 0, 0], // Low left to high right
    [1, 0, 1, 2, 1], // Zigzag
    [1, 2, 1, 0, 1], // Inverted zigzag
    [0, 1, 1, 1, 0], // Top bowl
    [2, 1, 1, 1, 2], // Bottom bowl
    [0, 1, 0, 1, 0], // Checker top
    [2, 1, 2, 1, 2], // Checker bottom
    [1, 1, 0, 1, 1], // Top dip
    [1, 1, 2, 1, 1], // Bottom dip
    [0, 0, 2, 0, 0], // High edges
    [2, 2, 0, 2, 2], // Low edges
    [1, 0, 2, 0, 1]  // X shape
];

// ==================== SIMULATION FUNCTIONS ====================
class SlotSimulation {
    constructor(totalBetAmount = 1, debug=false) {
        this.totalBet = 0;
        this.totalWon = 0;
        this.totalSpins = 0;
        this.hitCount = 0;
        this.freeSpinsTriggered = 0;
        this.maxWin = 0;
        this.totalBetAmount = totalBetAmount;
        this.retriggerCount = 0;
        this.debug = debug;
        this.cascadeCount = 0;
        this.cascadeWins = 0;
        this.freeSpinsPlayed = 0;
        this.baseSpins = 0;
    }

    // Generate a random spin result
    generateSpinResult() {
        const grid = [];
        for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
            const reel = REEL_STRIPS[reelIndex];
            const stopPos = Math.floor(Math.random() * reel.length);
            const visibleSymbols = [
                reel[stopPos],
                reel[(stopPos + 1) % reel.length],
                reel[(stopPos + 2) % reel.length]
            ];
            grid.push(visibleSymbols);
        }
        return grid;
    }

    // Calculate wins for a given grid
    calculateWins(grid) {
        let totalWin = 0;
        const winningLines = [];
        const winningPositions = new Set();

        // Check each payline
        for (let lineIndex = 0; lineIndex < PAYLINES.length; lineIndex++) {
            const line = PAYLINES[lineIndex];
            const lineSymbols = line.map((row, reel) => grid[reel][row]);
            
            // Find the first non-wild symbol to determine the line type
            let lineType = null;
            for (const symbol of lineSymbols) {
                if (symbol !== SYMBOLS.WILD) {
                    lineType = symbol;
                    break;
                }
            }
            
            // If all symbols are wilds, use wild as line type
            if (lineType === null) {
                lineType = SYMBOLS.WILD;
            }
            
            // Count consecutive matching symbols (wilds substitute)
            let count = 0;
            for (const symbol of lineSymbols) {
                if (symbol === lineType || symbol === SYMBOLS.WILD) {
                    count++;
                } else {
                    break;
                }
            }

            // Award payout for 3+ matching symbols
            if (count >= 3 && PAYTABLE[lineType] && PAYTABLE[lineType][count]) {
                const payout = PAYTABLE[lineType][count] * this.totalBetAmount;
                if (payout > 0) {
                    totalWin += payout;
                    winningLines.push({ line: lineIndex, symbols: lineSymbols.slice(0, count), payout });

                    // Record winning symbol positions for cascading
                    for (let i = 0; i < count; i++) {
                        winningPositions.add(`${i},${line[i]}`);
                    }
                    
                    if (this.debug && payout > this.totalBetAmount * 5) {
                        console.log(`Line ${lineIndex}: ${count}x ${lineType}, payout: ${payout}`);
                    }
                }
            }
        }

        return { totalWin, winningLines, winningPositions };
    }

    // Check for scatter wins
    checkScatters(grid) {
        const allSymbols = grid.flat();
        const scatterCount = allSymbols.filter(sym => sym === SYMBOLS.SCATTER).length;
        
        let scatterWin = 0;
        if (scatterCount >= 3) {
            scatterWin = (SCATTER_PAYOUTS[scatterCount] || 0) * this.totalBetAmount;
            if (this.debug && scatterWin > 0) {
                console.log(`Scatter win: ${scatterCount} scatters = ${scatterWin}`);
            }
        }
        return { scatterCount, scatterWin };
    }

    // Process a single spin (base game or free spin)
    processSingleSpin(isFreeSpin = false) {
        const grid = this.generateSpinResult();
        let totalSpinWin = 0;
        
        console.log(grid);
        // Calculate base wins
        const { totalWin: baseWin, winningPositions } = this.calculateWins(grid);
        const { scatterCount, scatterWin } = this.checkScatters(grid);
        
        totalSpinWin += baseWin + scatterWin;
        
        // Process cascades if there are winning positions
        let cascadeWin = 0;
        let cascadeRounds = 0;
        
        if (CASCADE_CONFIG.ENABLED && winningPositions.size > 0) {
            const cascadeResult = this.processCascade(grid, winningPositions);
            cascadeWin = cascadeResult.totalWin;
            cascadeRounds = cascadeResult.cascadeCount;
            totalSpinWin += cascadeWin;
        }
        
        // Apply free spins multiplier if applicable
        if (isFreeSpin) {
            totalSpinWin *= FREE_SPINS_CONFIG.MULTIPLIER;
        }
        
        // Update statistics
        if (totalSpinWin > 0) {
            this.hitCount++;
            this.totalWon += totalSpinWin;
            this.maxWin = Math.max(this.maxWin, totalSpinWin);
        }
        
        // Update cascade statistics
        if (cascadeRounds > 0) {
            this.cascadeCount += cascadeRounds;
            this.cascadeWins += cascadeWin;
        }
        
        return { 
            totalSpinWin, 
            scatterCount, 
            baseWin, 
            scatterWin, 
            cascadeWin, 
            cascadeRounds 
        };
    }

    // Process cascade wins
    processCascade(initialGrid, initialWinningPositions) {
        let totalCascadeWin = 0;
        let cascadeCount = 0;
        let currentGrid = JSON.parse(JSON.stringify(initialGrid));
        let currentWinningPositions = new Set(initialWinningPositions);

        while (cascadeCount < CASCADE_CONFIG.MAX_CASCADES && currentWinningPositions.size > 0) {
            // Remove winning symbols
            currentWinningPositions.forEach(pos => {
                const [reel, row] = pos.split(',').map(Number);
                currentGrid[reel][row] = null;
            });

            // Let symbols fall down
            for (let reel = 0; reel < 5; reel++) {
                const remainingSymbols = currentGrid[reel].filter(s => s !== null);
                const newSymbolsNeeded = 3 - remainingSymbols.length;
                
                for (let i = 0; i < newSymbolsNeeded; i++) {
                    remainingSymbols.unshift(this.getRandomSymbolForReel(reel));
                }
                
                currentGrid[reel] = remainingSymbols;
            }

            // Calculate wins for the new grid
            const { totalWin, winningPositions } = this.calculateWins(currentGrid);
            
            if (totalWin === 0 || winningPositions.size === 0) {
                break;
            }

            totalCascadeWin += totalWin;
            cascadeCount++;
            currentWinningPositions = winningPositions;

            if (this.debug && totalWin > 0) {
                console.log(`Cascade ${cascadeCount}: win = ${totalWin}`);
            }
        }

        return { totalWin: totalCascadeWin, cascadeCount };
    }

    // Run free spins
    runFreeSpins(numSpins) {
        let spinsRemaining = numSpins;
        let currentRetriggers = 0;

        while (spinsRemaining > 0 && currentRetriggers < FREE_SPINS_CONFIG.MAX_RETRIGGERS) {
            spinsRemaining--;
            this.totalSpins++;
            this.freeSpinsPlayed++;

            const result = this.processSingleSpin(true);

            if (this.debug && result.totalSpinWin > 0) {
                console.log(`Free spin win: ${result.totalSpinWin}`);
            }

            // Check for retrigger
            if (FREE_SPINS_CONFIG.RETRIGGER && result.scatterCount >= 3) {
                const additionalSpins = FREE_SPINS_CONFIG.TRIGGER_COUNT[result.scatterCount] || 0;
                if (currentRetriggers < FREE_SPINS_CONFIG.MAX_RETRIGGERS) {
                    spinsRemaining += additionalSpins;
                    currentRetriggers++;
                    this.retriggerCount++;
                    if (this.debug) {
                        console.log(`Retriggered ${additionalSpins} free spins with ${result.scatterCount} scatters`);
                    }
                }
            }
        }
    }

    // Helper method to get random symbol for a specific reel
    getRandomSymbolForReel(reelIndex) {
        const reel = REEL_STRIPS[reelIndex];
        return reel[Math.floor(Math.random() * reel.length)];
    }

    // Run single simulation
    runSimulation(numSpins = 1000000) {
        console.log(`Starting Monte Carlo simulation for ${numSpins.toLocaleString()} spins...`);
        console.log(`Bet per spin: ${this.totalBetAmount}`);
        console.log('=' .repeat(50));

        const startTime = Date.now();
        
        // Reset all counters
        this.totalBet = 0;
        this.totalWon = 0;
        this.totalSpins = 0;
        this.hitCount = 0;
        this.freeSpinsTriggered = 0;
        this.maxWin = 0;
        this.retriggerCount = 0;
        this.cascadeCount = 0;
        this.cascadeWins = 0;
        this.freeSpinsPlayed = 0;
        this.baseSpins = 0;

        for (let i = 0; i < numSpins; i++) {
            this.totalSpins++;
            this.baseSpins++;
            this.totalBet += this.totalBetAmount;

            // Process base game spin
            const result = this.processSingleSpin(false);
            console.log(result);
            // // Handle free spins trigger
            // if (result.scatterCount >= 3) {
            //     this.freeSpinsTriggered++;
            //     const numFreeSpins = FREE_SPINS_CONFIG.TRIGGER_COUNT[result.scatterCount] || 0;
            //     this.runFreeSpins(numFreeSpins);
            // }

            // // Progress reporting
            // if (this.debug && i > 0 && i % 1000 === 0) {
            //     const currentRTP = (this.totalWon / this.totalBet) * 100;
            //     const currentHitFreq = (this.hitCount / this.totalSpins) * 100;
            //     console.log(`Progress: ${i}/${numSpins} spins, RTP: ${currentRTP.toFixed(2)}%, Hit Freq: ${currentHitFreq.toFixed(2)}%`);
            // }
        }

        // const endTime = Date.now();
        // this.displayResults(endTime - startTime, numSpins);
    }

    // Display simulation results
    displayResults(durationMs, numSpins) {
        const rtp = (this.totalWon / this.totalBet) * 100;
        const hitFrequency = (this.hitCount / this.totalSpins) * 100;
        const expectedValue = this.totalWon / this.totalSpins;

        console.log('\n' + '=' .repeat(50));
        console.log('MONTE CARLO SIMULATION RESULTS');
        console.log('=' .repeat(50));
        console.log(`Base Spins: ${this.baseSpins.toLocaleString()}`);
        console.log(`Free Spins Played: ${this.freeSpinsPlayed.toLocaleString()}`);
        console.log(`Total Spins: ${this.totalSpins.toLocaleString()}`);
        console.log(`Total Bet: ${this.totalBet.toLocaleString()}`);
        console.log(`Total Won: ${this.totalWon.toLocaleString()}`);
        console.log(`Return to Player (RTP): ${rtp.toFixed(4)}%`);
        console.log(`Hit Frequency: ${hitFrequency.toFixed(2)}%`);
        console.log(`Free Spins Triggered: ${this.freeSpinsTriggered.toLocaleString()}`);
        console.log(`Retriggers: ${this.retriggerCount.toLocaleString()}`);
        console.log(`Max Win: ${this.maxWin.toLocaleString()}x`);
        console.log(`Expected Value per spin: ${expectedValue.toFixed(2)}`);
        console.log(`Simulation Time: ${(durationMs / 1000).toFixed(2)} seconds`);
        console.log('=' .repeat(50));

        // Volatility assessment
        let volatility = 'Low';
        if (hitFrequency < 15) volatility = 'High';
        else if (hitFrequency < 25) volatility = 'Medium';

        console.log(`Game Volatility: ${volatility}`);
        console.log('=' .repeat(50));

        // Validation checks
        console.log('\nVALIDATION CHECKS:');
        console.log(`Requested base spins: ${numSpins.toLocaleString()}`);
        console.log(`Actual base spins: ${this.baseSpins.toLocaleString()}`);
        console.log(`Total spins: ${this.totalSpins.toLocaleString()}`);
        console.log(`Expected total bet: ${(numSpins * this.totalBetAmount).toLocaleString()}`);
        console.log(`Actual total bet: ${this.totalBet.toLocaleString()}`);
        
        console.log(`Cascade Events: ${this.cascadeCount.toLocaleString()}`);
        console.log(`Cascade Wins: ${this.cascadeWins.toLocaleString()}`);
        if (this.cascadeCount > 0) {
            console.log(`Avg. Win per Cascade: ${(this.cascadeWins / this.cascadeCount).toFixed(2)}x`);
        }
    }
}

// ==================== RUN SIMULATION ====================
const _betAmount = 2;
const simulation = new SlotSimulation(_betAmount, true);
simulation.runSimulation(1); // Run 10,000 spins for better accuracy