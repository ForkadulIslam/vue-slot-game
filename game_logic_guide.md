# Slot Game Engine: Developer Guide & Testing Scenarios

This document provides a comprehensive guide to the slot game's core mechanics, winning conditions, and special features. It is intended for developers to use during implementation, testing, and debugging.

---

## 1. Core Game Structure

-   **Grid:** 5 Reels, 3 Rows (5x3).
-   **Paylines:** 25 fixed paylines. Wins are evaluated from left to right.
-   **Betting:** The game uses a `totalBet` which is distributed across the 25 lines, creating a `betPerLine` value (`totalBet / 25`).

### Symbols Overview

| Symbol Name | Type          | Role                               |
| :---------- | :------------ | :--------------------------------- |
| `wild`      | Special       | Pays, and substitutes for all symbols except `scatter`. |
| `scatter`   | Special       | Triggers Free Spins and pays out independently of paylines. |
| `seven`     | High-Tier     | High-value paying symbol.          |
| `bar`       | High-Tier     | High-value paying symbol.          |
| `bell`      | Mid-Tier      | Medium-value paying symbol.        |
| `melon`     | Mid-Tier      | Medium-value paying symbol.        |
| `orange`    | Low-Tier      | Low-value paying symbol.           |
| `plum`      | Low-Tier      | Low-value paying symbol.           |
| `cherry`    | Low-Tier      | Low-value paying symbol.           |
| `lemon`     | Low-Tier      | Low-value paying symbol.           |

---

## 2. Standard Payline Wins

A standard win is achieved by landing 3 or more matching symbols on one of the 25 paylines, starting from the leftmost reel (Reel 1).

### Paytable (Payout per line bet)

| Symbol | 5 Matches | 4 Matches | 3 Matches |
| :--- | :--- | :--- | :--- |
| `wild` | 5000 | 1000 | 100 |
| `seven` | 2500 | 500 | 50 |
| `bar` | 1000 | 200 | 40 |
| `bell` | 500 | 100 | 20 |
| `melon` | 250 | 50 | 15 |
| `orange` | 100 | 20 | 8 |
| `plum` | 80 | 15 | 6 |
| `cherry` | 60 | 12 | 5 |
| `lemon` | 50 | 10 | 4 |

### 🧪 Testing & Debugging Payline Wins

To effectively test the payline win logic, you should be able to manually set the grid to a specific state.

**Test Scenarios:**

1.  **No Win:** Set up a grid with no winning combinations on any of the 25 paylines.
    -   **Expected Outcome:** The `calculateWins` function should return `totalWinnings: 0`. No win animations should play.

2.  **Single Line Win (3, 4, and 5 of a kind):**
    -   Manually place 3 `lemon` symbols on the first 3 reels of a single payline.
    -   **Expected Outcome:** The win should be correctly identified. For a `betPerLine` of 1, the payout should be `4`.
    -   Repeat this test for 4 and 5 matches for various symbols to verify all paytable values.

3.  **Multi-Line Win:** Set up a grid where wins occur on multiple paylines simultaneously.
    -   *Example:* Place `cherry` symbols across the top row (Payline 1) and `plum` symbols across the bottom row (Payline 3).
    -   **Expected Outcome:** The total winnings should be the sum of the payouts for both lines. The UI should highlight both winning lines.

4.  **Wild Substitution:** Test the `wild` symbol's substitution functionality.
    -   Place `seven` -> `wild` -> `seven` on a payline.
    -   **Expected Outcome:** This should be registered as a 3-of-a-kind `seven` win.
    -   Test a 5-of-a-kind `wild` win to ensure it pays out the highest value.

5.  **Edge Case (No Win Beyond Reel 3):** Place a winning line of 2 matching symbols on reels 1 and 2.
    -   **Expected Outcome:** This is not a win, as a minimum of 3 matches is required.

---

## 3. Cascading Wins Feature

This feature is active in both the base game and free spins, but the multiplier logic differs.

1.  **Initial Win:** All winning combinations are paid out.
2.  **Symbols Removed:** Winning symbols disappear.
3.  **Symbols Drop:** New symbols fall from above to fill the gaps.
4.  **Multiplier Increase (Base Game):** The win multiplier starts at x1 and increases by +1 for each subsequent cascade (`x1`, `x2`, `x3`...). It resets for the next paid spin.
5.  **Re-evaluation:** The new grid is checked for wins. The process repeats until no new wins are formed.

### 🧪 Testing & Debugging Cascading Wins

1.  **Single Cascade:** Set up a grid with one clear winning line.
    -   **Expected Outcome:** The line pays out at a x1 multiplier. The winning symbols are removed, new ones drop in. If the new grid has no wins, the spin ends.

2.  **Multi-Cascade Sequence:** Engineer a grid that guarantees at least 2-3 consecutive cascades.
    -   **Expected Outcome:**
        -   First win pays at **x1**.
        -   Symbols are removed and replaced.
        -   Second win pays at **x2**.
        -   Symbols are removed and replaced.
        -   Third win pays at **x3**.
    -   **Verification:** Log the multiplier value at each step of the cascade to ensure it increments correctly. Check that the total spin winnings are the sum of all cascade payouts.

3.  **Full Grid Clear:** Create a scenario where all 15 symbols are part of winning lines.
    -   **Expected Outcome:** The entire grid should clear and be replaced by 15 new symbols. The win multiplier should be applied correctly.

---

## 4. Scatter Payouts & Free Spins Trigger

The `scatter` symbol pays out and triggers free spins independently of paylines.

### Scatter Payouts (Multiplier of Total Bet)

| Scatters | Payout | Free Spins Awarded |
| :--- | :--- | :--- |
| 5 | 100x `totalBet` | 20 |
| 4 | 20x `totalBet` | 15 |
| 3 | 5x `totalBet` | 10 |

### 🧪 Testing & Debugging Scatters

1.  **Scatter Count:** Place 3, 4, and 5 `scatter` symbols randomly on the grid.
    -   **Expected Outcome (3 Scatters):**
        -   A payout of `5 * totalBet` is awarded.
        -   The Free Spins feature is triggered, and the game state changes to "freeSpins".
        -   The player is awarded 10 free spins.
    -   Verify the correct payout and free spin count for 4 and 5 scatters as well.

2.  **No Trigger:** Place 2 `scatter` symbols on the grid.
    -   **Expected Outcome:** No scatter payout is awarded, and free spins are not triggered.

---

## 5. Free Spins Feature

The Free Spins round features a progressive win multiplier that makes it highly volatile.

-   **Progressive Multiplier:**
    -   The multiplier starts at **x1**.
    -   It **increases by +2** after *every single winning cascade*.
    -   Crucially, the multiplier **does not reset** between free spins. It only grows.

### 🧪 Testing & Debugging Free Spins

1.  **Feature Entry:** Trigger the Free Spins round.
    -   **Expected Outcome:** The game UI should change to indicate it's in the Free Spins mode. The initial multiplier should be displayed as x1.

2.  **Multiplier Progression:**
    -   Force a win on the first free spin.
    -   **Expected Outcome:** The win is paid at the current multiplier (x1). After the payout, the multiplier for the *next* win should become x3.
    -   Force another win (either in the same spin via cascade, or in the next spin).
    -   **Expected Outcome:** This second win should be paid at the x3 multiplier. The multiplier for the *next* win should become x5.
    -   **Verification:** Log the multiplier value before and after each win to ensure it is being applied correctly and is incrementing by 2.

3.  **Multiplier Persistence:**
    -   Achieve a multiplier of, for example, x7.
    -   Have a few "dead spins" (no wins).
    -   Then, force another win.
    -   **Expected Outcome:** The multiplier should still be x7 and apply to the new win. It should not have reset.

4.  **End of Feature:** Let the free spins counter run down to 0.
    -   **Expected Outcome:** A summary screen should show the total winnings from the feature. The game should return to the base game state, and the base game multiplier should be reset to x1.
