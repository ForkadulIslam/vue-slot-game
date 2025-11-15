### Plan for Win Animations

Hello! I've reviewed the codebase and your request. Using GSAP for the win animations is an excellent idea, as it's already integrated for the reel spinning and is highly capable for the effects you've described.

Here is a proposed plan for how we can implement these stunning animations.

#### Current State Analysis

*   **Components:** `SlotMachine.vue` handles the visual reels, `ControlPanel.vue` displays the win amount, and `useSlotGame.js` manages the game's state and logic.
*   **Animation:** GSAP is used effectively in `SlotMachine.vue` for the reel spinning effect, which gives us a great foundation.
*   **Game Flow:** The `spin` action calls an API, which returns the outcome, including the final reel symbols and the total win amount. The `finishSpin` function is called when the reel animation completes.

#### Proposed Animation Implementation Plan

To create a rich user experience, we can break down the win animations into several distinct, layered effects that trigger after a winning spin.

**1. Data Foundation (The "Brain")**

*   **Task:** Before we can animate a win, we need to know *what* to animate. The API response from the `/spin` call is key. We'll need to ensure it provides not just the `totalWin`, but also which paylines have won and which symbols on those lines are part of the win.
*   **Implementation:** We will update the `processOutcome` function in `useSlotGame.js`. It will parse the API response and populate the `winningPaylines` ref, and potentially a new ref to hold the coordinates of the winning symbols (e.g., `winningSymbolPositions`).

**2. Winning Line Highlighting (The "Path")**

*   **Task:** Visually indicate the payline(s) that resulted in a win.
*   **Implementation:**
    1.  We'll add an SVG overlay layer within the `SlotMachine.vue` component, positioned directly on top of the reels.
    2.  After a spin, if there are winning lines, we will dynamically generate SVG `<path>` elements for each one. The path coordinates will be calculated based on the symbol positions defined in our `PAYLINES` constant.
    3.  We'll use GSAP to animate these paths. A common effect is to make them "draw" themselves across the screen and then pulse with a glow effect to keep them visible.

**3. Symbol Animation (The "Action")**

*   **Task:** Make the winning symbols themselves come alive.
*   **Implementation:**
    1.  Once the winning lines are drawn, we'll target the specific symbol `<img>` elements that form the win.
    2.  Using GSAP, we can create a timeline for these symbols:
        *   **Simple Win:** A subtle pulse (scale up and down) and a bright `drop-shadow` glow.
        *   **Bigger Win / Feature Symbol:** A more elaborate "explosion" or "burst" animation. This could involve the symbol quickly scaling up, fading out, and being replaced by a small particle burst effect (which we can create with a few small, animated divs or images).

**4. Big Win Celebration (The "Spectacle")**

*   **Task:** Create a high-impact, full-screen event for significant wins (e.g., winning more than 10x the bet).
*   **Implementation:**
    1.  We'll create a new component, perhaps `<BigWinOverlay/>`, that is conditionally rendered from `App.vue`.
    2.  This overlay will contain:
        *   Animated text like "BIG WIN" or "MEGA WIN" using GSAP for effects like scaling, rotating, and color changes.
        *   A "coin shower" effect: We'll dynamically create dozens of coin images and use GSAP's `stagger` feature to animate them falling down the screen with random trajectories and rotations.
    3.  Simultaneously, in `ControlPanel.vue`, we can animate the `win-amount` display, making it rapidly count up from 0 to the final win amount, adding to the excitement.

---

This layered approach will create a visually rich and engaging experience for the player. We can start with the foundational data step and then build up each animation layer by layer.

What do you think of this plan? We can adjust it based on your vision for the final product. To begin, could you confirm the structure of the JSON response from your `/spin` API endpoint, specifically how it communicates which paylines have won?