# Implementation Plan: Advanced Reel Animations

This document outlines the plan to refactor the existing 5x3 slot game to incorporate a smooth, vertical reel-spinning animation and a cascading win mechanic, inspired by the provided sample project.

## Phase 1: Refactor the Reel Component for Vertical Spinning

The current animation scales symbols in and out. To achieve a vertical spinning effect, we need to change how reels are rendered. Instead of a static 3-symbol view, each reel will be a long vertical strip of symbols that moves within a masked container.

**Step 1.1: Modify `Reel.vue` Structure**
- The root element of `Reel.vue` will become a container with a fixed height and `overflow: hidden`.
- Inside, create a `div` with a class like `symbol-strip`. This strip will hold all the symbols for the spin and will be animated vertically.
- Remove the old `v-for` that iterates over `displaySymbols`.

**Step 1.2: Create the Symbol Strips**
- In the `useSlotGame.js` composable, create a new reactive reference, `spinningReels`, which will hold the long arrays of symbols for each of the 5 reels during a spin.
- When `spin()` is called, for each reel, generate a strip:
    1. Start with the current symbols.
    2. Add a configurable number of random symbols (e.g., 20-30) to create the spinning "blur".
    3. End with the 3 symbols from the final outcome for that reel.
- Pass these generated strips as props to the `Reel.vue` components.

**Step 1.3: Implement the Vertical Animation**
- In `Reel.vue`, use a computed property to calculate the `transform: translateY()` value for the `symbol-strip`.
- The animation will be controlled by CSS transitions for smoothness. We'll use Vue's state to apply different classes for different animation phases (e.g., `is-spinning`, `is-stopping`).
- The `translateY` value will be calculated based on the symbol height and the index of the target symbol in the strip.
- We will add a `cubic-bezier` timing function to the transition to create a realistic ease-out and a subtle "bounce" or "overshoot" effect when the reel stops, mimicking the sample.

## Phase 2: Implement Cascading Wins

This phase implements the "tumble" or "cascade" feature where winning symbols disappear and are replaced by new ones from above, allowing for consecutive wins in a single spin.

**Step 2.1: Win Detection and State Management**
- Modify the `calculateWins` function in `useSlotGame.js` to return the coordinates of all winning symbols (e.g., `[{reel: 0, row: 1}, ...]`).
- Create a new state in `useSlotGame.js` to track the lifecycle of a cascade (e.g., `win-pop`, `exploding`, `refilling`).

**Step 2.2: Animate Winning Symbols**
- In `Symbol.vue`, add props to reflect the symbol's state (e.g., `isWinning`, `isExploding`).
- Add CSS keyframe animations (`win-pop`, `symbol-explode`) to the `Symbol.vue` style section. These will be triggered by classes bound to the new props.
- When a win is detected, `useSlotGame.js` will update the state for the winning symbols, triggering the "pop" animation, followed by the "explode" animation.

**Step 2.3: Create a `FlyingSymbol.vue` Component**
- To handle the "fly-in" effect of new symbols, we will create a new, absolutely positioned overlay in `SlotMachine.vue`.
- A new component, `FlyingSymbol.vue`, will be responsible for rendering a single symbol that animates from off-screen to its target position in the grid.
- When a cascade is triggered, `useSlotGame.js` will:
    1. Determine the new symbols that will replace the exploded ones.
    2. Add these new symbols to a reactive array that is rendered within the overlay using a `v-for`.
    3. Each `FlyingSymbol.vue` instance will animate itself into place using a CSS transition on its `transform` and `opacity` properties.

**Step 2.4: Update the Grid and Re-evaluate Wins**
- The original symbols in the grid that are exploding will be made invisible (`opacity: 0`).
- Once a `FlyingSymbol` completes its animation (detected via the `@transitionend` event), it will emit an event.
- When all flying symbols have "landed", `useSlotGame.js` will:
    1. Update the main `reelsForDisplay` grid with the new symbols.
    2. Clear the flying symbols from the overlay.
    3. Make the grid symbols visible again.
    4. Re-run the `calculateWins` function on the new grid. If new wins are found, the cascade process repeats from Step 2.1. If not, the spin is concluded.

This plan modularizes the implementation, starting with the core spinning mechanic and then building the more complex cascading logic on top of it. This ensures a robust and maintainable animation system.
