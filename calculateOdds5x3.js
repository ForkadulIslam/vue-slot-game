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

// Scatter Payouts (triggers in addition to free spins)
const SCATTER_PAYOUTS = { 5: 100, 4: 20, 3: 5 };

// Strategically Weighted Reel Strips for High Excitement
const REEL_STRIPS = [
  // Reel 1: Fewer high-tier symbols
  [SYMBOLS.SEVEN, SYMBOLS.BAR, SYMBOLS.BELL, SYMBOLS.MELON, SYMBOLS.ORANGE, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.LEMON, SYMBOLS.WILD, SYMBOLS.SCATTER, ...Array(10).fill(SYMBOLS.ORANGE), ...Array(10).fill(SYMBOLS.PLUM), ...Array(10).fill(SYMBOLS.CHERRY), ...Array(10).fill(SYMBOLS.LEMON)],
  // Reel 2: Slightly more mid-tier symbols
  [SYMBOLS.SEVEN, SYMBOLS.BAR, SYMBOLS.BELL, SYMBOLS.MELON, SYMBOLS.ORANGE, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.LEMON, SYMBOLS.WILD, ...Array(5).fill(SYMBOLS.BELL), ...Array(5).fill(SYMBOLS.MELON), ...Array(10).fill(SYMBOLS.ORANGE), ...Array(10).fill(SYMBOLS.PLUM), ...Array(10).fill(SYMBOLS.CHERRY), ...Array(10).fill(SYMBOLS.LEMON)],
  // Reel 3: Balanced distribution, more wilds
  [SYMBOLS.SEVEN, SYMBOLS.BAR, SYMBOLS.BELL, SYMBOLS.MELON, SYMBOLS.ORANGE, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.LEMON, SYMBOLS.WILD, SYMBOLS.WILD, SYMBOLS.SCATTER, ...Array(5).fill(SYMBOLS.SEVEN), ...Array(5).fill(SYMBOLS.BAR), ...Array(10).fill(SYMBOLS.BELL), ...Array(10).fill(SYMBOLS.MELON)],
  // Reel 4: More high-tier symbols to create "near misses"
  [SYMBOLS.SEVEN, SYMBOLS.BAR, SYMBOLS.BELL, SYMBOLS.MELON, SYMBOLS.ORANGE, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.LEMON, SYMBOLS.WILD, SYMBOLS.WILD, ...Array(10).fill(SYMBOLS.SEVEN), ...Array(10).fill(SYMBOLS.BAR), ...Array(5).fill(SYMBOLS.BELL), ...Array(5).fill(SYMBOLS.MELON)],
  // Reel 5: Heavily weighted with high-tier symbols and wilds
  [SYMBOLS.SEVEN, SYMBOLS.BAR, SYMBOLS.BELL, SYMBOLS.MELON, SYMBOLS.ORANGE, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.LEMON, SYMBOLS.WILD, SYMBOLS.WILD, SYMBOLS.WILD, SYMBOLS.SCATTER, ...Array(15).fill(SYMBOLS.SEVEN), ...Array(10).fill(SYMBOLS.BAR)],
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

// --- CALCULATION LOGIC ---

function getSymbolCountOnReel(reelIndex, symbol) {
  return REEL_STRIPS[reelIndex].filter(s => s === symbol).length;
}

function calculateTotalCombinations() {
  return REEL_STRIPS.reduce((acc, reel) => acc * reel.length, 1);
}

function calculateOdds() {
  const totalCombinations = calculateTotalCombinations();
  let totalRTP = 0;

  console.log(`Total Combinations: ${totalCombinations.toLocaleString()}`);
  console.log('--- Payline Win Analysis (Theoretical) ---');
  console.log('NOTE: This calculation is a simplified approximation and does not account for cascading wins, multipliers, or free spins. The RTP simulation is the accurate measure.');


  for (const symbol of Object.keys(PAYTABLE)) {
    if (symbol === SYMBOLS.WILD) continue;

    for (const payline of PAYLINES) {
      for (let matchCount = 5; matchCount >= 3; matchCount--) {
        let combinationsForWin = 1;
        // Simplified calculation for winning combinations
        for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
          if (reelIndex < matchCount) {
            const symbolCount = getSymbolCountOnReel(reelIndex, symbol);
            const wildCount = getSymbolCountOnReel(reelIndex, SYMBOLS.WILD);
            combinationsForWin *= (symbolCount + wildCount);
          } else {
            combinationsForWin *= REEL_STRIPS[reelIndex].length;
          }
        }

        const payout = PAYTABLE[symbol][matchCount] || 0;
        if (payout > 0) {
          const probability = combinationsForWin / totalCombinations;
          const rtpContribution = probability * payout;
          totalRTP += rtpContribution;
        }
      }
    }
  }

  console.log(`
Theoretical Base Game RTP from Paylines (Highly Simplified): ${(totalRTP * 100).toFixed(2)}%`);
  console.log('This figure is NOT the true RTP. Run the simulation for an accurate result.');
}

calculateOdds();