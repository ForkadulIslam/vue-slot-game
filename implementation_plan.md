# Refactor for Performance: Symbol Element Object Pooling

## 1. Executive Summary

This document outlines the plan to refactor `SlotMachinePixi.vue` to implement an object pooling strategy for its symbol elements. The current implementation creates and destroys over 90 DOM elements on every spin, causing significant memory churn and garbage collector pressure. This leads to animation stutter ("jank") and poor performance, especially on mobile devices.

By creating a pre-allocated pool of symbol elements and reusing them for animations, we can virtually eliminate memory management during the critical spin sequence, leading to a dramatically smoother and more performant user experience.

---

## 2. File to be Modified

*   **`src/components/SlotMachinePixi.vue`**

---

## 3. Detailed Implementation Plan

The entire change will be contained within the `<script setup>` section of `SlotMachinePixi.vue`.

### Step 3.1: Pool State and Initialization

We will introduce new script-level variables to manage the pool.

```javascript
// To hold all pooled symbol elements, out of the DOM
let symbolPool = []; 
// To cache all possible icon classes for quick cleanup
let allSymbolSpriteClasses = []; 
```

The pool will be created once when the component is mounted.

```javascript
onMounted(() => {
  // ... existing code ...

  // --- NEW: Initialize Symbol Pool ---
  
  // 1. Cache all possible sprite classes from the symbolPaths map.
  allSymbolSpriteClasses = Object.values(symbolPaths);

  // 2. Define the size of the pool. (5 reels * ~18 symbols per reel) + buffer.
  const poolSize = 120; 

  // 3. Create raw symbol elements and add them to the pool.
  for (let i = 0; i < poolSize; i++) {
    symbolPool.push(createSymbolForPool());
  }
});
```

### Step 3.2: New Pool Management Functions

We will replace the existing `createSymbolElement` function with a suite of new functions to manage borrowing and returning pool objects.

**A. `createSymbolForPool()`**
This function will create the raw DOM structure for a symbol. It's used *only* to populate the pool on startup.

```javascript
const createSymbolForPool = () => {
  const imgElement = document.createElement('div');
  imgElement.classList.add('symbol-icon');

  const symboxBoxSheenEffect = document.createElement('div');
  symboxBoxSheenEffect.classList.add('symbol-box');
  symboxBoxSheenEffect.appendChild(imgElement);

  const symbolDiv = document.createElement('div');
  symbolDiv.classList.add('symbol');
  symbolDiv.appendChild(symboxBoxSheenEffect);
  return symbolDiv;
};
```

**B. `borrowSymbol(symbolName)`**
This will be the new function for getting a ready-to-use symbol element.

```javascript
const borrowSymbol = (symbolName) => {
  // Fallback: create a new element if pool is unexpectedly empty
  const symbolEl = symbolPool.pop() || createSymbolForPool(); 
  
  const isSpecial = SPECIAL_SYMBOLS.includes(symbolName.toLowerCase());
  const symbolIcon = symbolEl.querySelector('.symbol-icon');
  const symbolBox = symbolEl.querySelector('.symbol-box');

  // Efficiently reset state by removing all possible sprite classes
  symbolIcon.classList.remove(...allSymbolSpriteClasses, 'is-special');
  symbolBox.classList.remove('shine-effect');

  // Apply new classes
  symbolIcon.classList.add(symbolPaths[symbolName]);
  if (isSpecial) {
    symbolIcon.classList.add('is-special');
    symbolBox.classList.add('shine-effect');
  }

  return symbolEl;
};
```

**C. `returnSymbols(elements)`**
This function will return an array of used elements back to the pool.

```javascript
const returnSymbols = (elements) => {
  if (!Array.isArray(elements)) return;
  symbolPool.push(...elements);
};
```

### Step 3.3: Refactor Core Spin Logic

The primary changes will occur within the `watch(isSpinning, ...)` handler.

**A. Logic for Spin Start (`if (spinning)`)**
The `reelsEl.forEach` loop will be heavily modified to use the pool instead of creating elements on the fly.

```javascript
// --- OLD CODE ---
// const finalSymbolElements = finalSymbols.map(s => createSymbolElement(s));
// const startingSymbolElements = Array.from(reel.children);
// const randomSymbolElements = []; /* ...populated by createSymbolElement... */
// reel.innerHTML = '';
// reel.append(...finalSymbolElements, ...randomSymbolElements, ...startingSymbolElements);

// --- NEW LOGIC ---
reelsEl.forEach((reel, reelIndex) => {
  const finalSymbols = finalOutcome[reelIndex];
  
  // 1. Get elements from the pool instead of creating them.
  const finalSymbolElements = finalSymbols.map(s => borrowSymbol(s));
  const randomSymbolElements = [];
  const symbolKeys = Object.keys(symbolPaths).filter(k => k !== 'gold_coin');
  for (let k = 0; k < 10; k++) {
    randomSymbolElements.push(borrowSymbol(symbolKeys[Math.floor(Math.random() * symbolKeys.length)]));
  }

  // 2. Keep track of the old symbols that are currently in the DOM.
  const startingSymbolElements = Array.from(reel.children);

  // 3. Append the new symbols for the animation strip. DO NOT clear innerHTML.
  reel.append(...finalSymbolElements, ...randomSymbolElements);

  // 4. Animate the reel container as before.
  const spinContentHeight = (finalSymbolElements.length + randomSymbolElements.length) * symbolHeight;
  gsap.set(reel, { y: -spinContentHeight, force3D: true });

  gsap.to(reel, {
    // ... animation properties ...
    onComplete: () => {
      // (See new onComplete logic below)
    }
  });
});
```

**B. Logic for Spin End (`onComplete` callback)**
The `onComplete` logic will be updated to surgically remove old nodes and return them to the pool, avoiding `innerHTML` and `cloneNode`.

```javascript
// --- OLD onComplete ---
// const finalClones = finalSymbolElements.map(s => s.cloneNode(true));
// reel.innerHTML = '';
// reel.append(...finalClones);

// --- NEW onComplete LOGIC ---
onComplete: () => {
  // 1. Remove the temporary blur and old symbols from the DOM.
  randomSymbolElements.forEach(el => el.remove());
  startingSymbolElements.forEach(el => el.remove());
  
  // 2. Return those removed elements to the pool for reuse.
  returnSymbols(randomSymbolElements);
  returnSymbols(startingSymbolElements);

  // 3. The `finalSymbolElements` are now the only ones left. Reset the reel's position.
  gsap.set(reel, { y: 0 });

  if (reelIndex === reelsEl.length - 1) {
    finishSpin();
  }
}
```

This plan replaces the inefficient create-and-destroy pattern with a highly performant reuse-and-recycle (pooling) pattern, directly targeting the most significant performance bottleneck in the component.