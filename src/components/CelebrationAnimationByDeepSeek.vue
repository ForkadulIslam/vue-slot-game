<template>
  <div v-if="isActive" class="celebration-overlay" ref="overlayEl">
    <!-- Magic Girl GIF -->
    <div class="magician-container" ref="magicianContainerEl">
      <img :src="magicGirlGif" alt="Magic Girl" class="magician-gif" ref="magicianGifEl" />
    </div>
    
    <!-- Symbols Container -->
    <div class="symbols-container" ref="symbolsContainerEl"></div>
    
    <!-- Counter Display -->
    <div class="counter-display" ref="counterDisplayEl">
      <span class="counter-number" ref="counterNumberEl">0</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue';
import { gsap } from 'gsap';
import magicGirlGif from '../assets/images/magic_girl.gif';

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  winAmount: {
    type: Number,
    default: 100
  }
});

const emit = defineEmits(['animationComplete']);

// Refs
const overlayEl = ref(null);
const magicianContainerEl = ref(null);
const magicianGifEl = ref(null);
const symbolsContainerEl = ref(null);
const counterDisplayEl = ref(null);
const counterNumberEl = ref(null);

// Animation timeline
const masterTimeline = ref(null);

// Clean up function
const cleanupAnimation = () => {
  if (symbolsContainerEl.value) {
    symbolsContainerEl.value.innerHTML = '';
  }
  if (counterDisplayEl.value) {
    counterDisplayEl.value.innerHTML = '<span class="counter-number" ref="counterNumberEl">0</span>';
  }
  // Reset GSAP animations
  gsap.set([magicianContainerEl.value, symbolsContainerEl.value, counterDisplayEl.value], {
    clearProps: 'all'
  });
};

// Step 1: Magician Introduction (0-1s)
const animateMagicianIntro = () => {
  const tl = gsap.timeline();
  
  // Background ambiance
  tl.fromTo(overlayEl.value, 
    { backgroundColor: 'rgba(0, 0, 0, 0)' },
    { backgroundColor: 'rgba(0, 0, 0, 0.9)', duration: 0.8, ease: 'power2.inOut' }
  );
  
  // Magic girl entrance with magical effects
  tl.fromTo(magicianContainerEl.value, 
    { 
      scale: 0.5, 
      rotation: -10, 
      opacity: 0,
      filter: 'blur(20px) brightness(2)'
    },
    { 
      scale: 1, 
      rotation: 0, 
      opacity: 1,
      filter: 'blur(0px) brightness(1)',
      duration: 1,
      ease: 'back.out(1.7)'
    }
  );
  
  // Add magical sparkles around the magician
  for (let i = 0; i < 25; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'magic-sparkle';
    overlayEl.value.appendChild(sparkle);
    
    const angle = (i / 25) * Math.PI * 2;
    const distance = 150 + Math.random() * 50;
    
    tl.fromTo(sparkle, 
      {
        x: `calc(50% + ${Math.cos(angle) * 50}px)`,
        y: `calc(50% + ${Math.sin(angle) * 50}px)`,
        scale: 0,
        opacity: 0,
        rotation: Math.random() * 360
      },
      {
        x: `calc(50% + ${Math.cos(angle) * distance}px)`,
        y: `calc(50% + ${Math.sin(angle) * distance}px)`,
        scale: 1,
        opacity: 0.8,
        duration: 1.2,
        ease: 'power2.out'
      },
      '-=0.8'
    ).to(sparkle, {
      opacity: 0,
      scale: 0,
      duration: 0.5,
      onComplete: () => sparkle.remove()
    }, '+=0.3');
  }
  
  return tl;
};

// Step 2: Symbol Explosion (1-2s)
const animateSymbolExplosion = () => {
  const tl = gsap.timeline();
  const symbols = [];
  const symbolCount = 500;
  
  for (let i = 0; i < symbolCount; i++) {
    const symbol = document.createElement('div');
    symbol.className = 'currency-symbol';
    symbol.textContent = '৳';
    symbolsContainerEl.value.appendChild(symbol);
    symbols.push(symbol);
    
    // Random properties for variety
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * Math.min(window.innerWidth, window.innerHeight) * 0.8;
    const delay = Math.random() * 0.5;
    const finalSize = 20 + Math.random() * 40;
    const rotation = Math.random() * 360;
    
    // Initial state
    gsap.set(symbol, {
      x: '50%',
      y: '50%',
      scale: 0,
      opacity: 0,
      rotation: 0,
      fontSize: '0px',
      color: '#FFD700'
    });
    
    // Animation
    tl.to(symbol, {
      x: `calc(50% + ${Math.cos(angle) * distance}px)`,
      y: `calc(50% + ${Math.sin(angle) * distance}px)`,
      scale: 1,
      opacity: 0.8,
      rotation: rotation,
      fontSize: `${finalSize}px`,
      duration: 0.8,
      ease: 'power3.out',
      delay: delay
    }, 0);
  }
  
  return tl;
};

// Step 3: Number Counter Reveal (2-3.5s)
const animateCounterReveal = () => {
  const tl = gsap.timeline();
  
  // Counter display entrance
  tl.fromTo(counterDisplayEl.value, 
    {
      scale: 0,
      opacity: 0,
      y: 100
    },
    {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'back.out(1.7)'
    }
  );
  
  // Number counting animation
  const counter = { value: 0 };
  tl.to(counter, {
    value: props.winAmount,
    duration: 1.5,
    ease: 'power2.out',
    onUpdate: () => {
      const currentValue = Math.floor(counter.value);
      if (counterNumberEl.value) {
        counterNumberEl.value.textContent = currentValue.toLocaleString();
        
        // Add pulse effect on number changes
        gsap.to(counterNumberEl.value, {
          scale: 1.1,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut'
        });
      }
    }
  });
  
  return tl;
};

// Step 4: Transition & Cleanup (3.5-5s)
const animateTransitionCleanup = () => {
  const tl = gsap.timeline();
  
  // Slow down and fade out symbols
  tl.to('.currency-symbol', {
    opacity: 0,
    scale: 0,
    duration: 1,
    stagger: 0.002,
    ease: 'power2.in'
  });
  
  // Magic girl particle explosion
  tl.call(() => {
    if (!magicianGifEl.value) return;
    
    const rect = magicianGifEl.value.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Create particle explosion
    for (let i = 0; i < 1000; i++) {
      const particle = document.createElement('div');
      particle.className = 'explosion-particle';
      overlayEl.value.appendChild(particle);
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 300;
      const size = 2 + Math.random() * 6;
      const hue = Math.random() * 60 + 20; // Golden to orange colors
      
      gsap.fromTo(particle, 
        {
          x: centerX,
          y: centerY,
          scale: 1,
          opacity: 1,
          backgroundColor: `hsl(${hue}, 100%, 50%)`,
          width: `${size}px`,
          height: `${size}px`,
          rotation: Math.random() * 360
        },
        {
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          scale: 0,
          opacity: 0,
          rotation: Math.random() * 720,
          duration: 1.5,
          ease: 'power3.out',
          onComplete: () => particle.remove()
        }
      );
    }
    
    // Hide magic girl
    gsap.to(magicianContainerEl.value, {
      opacity: 0,
      scale: 0,
      duration: 0.5,
      ease: 'power2.in'
    });
  });
  
  return tl;
};

// Step 5: Final Number Resolution (5-6.5s)
const animateNumberResolution = () => {
  const tl = gsap.timeline();
  
  tl.call(() => {
    if (!counterNumberEl.value) return;
    
    const rect = counterNumberEl.value.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Convert number to particles
    for (let i = 0; i < 800; i++) {
      const numberParticle = document.createElement('div');
      numberParticle.className = 'number-particle';
      numberParticle.textContent = Math.random() > 0.5 ? '৳' : Math.floor(Math.random() * 10);
      overlayEl.value.appendChild(numberParticle);
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 200;
      const fontSize = 10 + Math.random() * 30;
      
      gsap.fromTo(numberParticle, 
        {
          x: centerX,
          y: centerY,
          scale: 1,
          opacity: 1,
          fontSize: `${fontSize}px`,
          color: '#FFD700',
          rotation: 0
        },
        {
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          scale: 0,
          opacity: 0,
          rotation: Math.random() * 360,
          duration: 1.5,
          ease: 'power2.in',
          onComplete: () => numberParticle.remove()
        }
      );
    }
    
    // Hide counter
    gsap.to(counterDisplayEl.value, {
      opacity: 0,
      scale: 0,
      duration: 0.5,
      ease: 'power2.in'
    });
  });
  
  return tl;
};

// Main animation controller
const playCelebrationAnimation = () => {
  cleanupAnimation();
  
  masterTimeline.value = gsap.timeline({
    onComplete: () => {
      setTimeout(() => {
        cleanupAnimation();
        emit('animationComplete');
      }, 500);
    }
  });
  
  // Sequence the animations
  masterTimeline.value
    .add(animateMagicianIntro())                    // 0-1s
    .add(animateSymbolExplosion(), '+=0.2')        // 1-2s
    .add(animateCounterReveal(), '+=0.2')          // 2-3.5s
    .add(animateTransitionCleanup(), '+=0.2')      // 3.5-5s
    .add(animateNumberResolution(), '+=0.2');      // 5-6.5s
};

// Watch for activation
watch(() => props.isActive, (newVal) => {
  if (newVal) {
    nextTick(() => {
      playCelebrationAnimation();
    });
  } else {
    if (masterTimeline.value) {
      masterTimeline.value.kill();
    }
    cleanupAnimation();
  }
});

// Cleanup on component unmount
onUnmounted(() => {
  if (masterTimeline.value) {
    masterTimeline.value.kill();
  }
  cleanupAnimation();
});
</script>

<style scoped>
.celebration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  overflow: hidden;
  pointer-events: none;
}

.magician-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.magician-gif {
  width: 400px;
  height: 400px;
  object-fit: contain;
  filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.5));
}

.symbols-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 20;
  pointer-events: none;
}

.counter-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 30;
  pointer-events: none;
}

.counter-number {
  font-family: 'Arial Black', 'Impact', sans-serif;
  font-size: 8rem;
  font-weight: 900;
  color: #FFD700;
  text-shadow: 
    0 0 20px #FFD700,
    0 0 40px #FF6B00,
    0 0 60px #FF0000,
    0 0 80px #FF0000;
  background: linear-gradient(45deg, #FFD700, #FFA500, #FF6B00);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

/* Sparkle effects */
.magic-sparkle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, #FFD700 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  filter: blur(1px);
}

/* Currency symbols */
.currency-symbol {
  position: absolute;
  font-family: 'Arial', sans-serif;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 
    0 0 10px rgba(255, 215, 0, 0.8),
    0 0 20px rgba(255, 165, 0, 0.6);
  pointer-events: none;
  transform-origin: center;
}

/* Particle effects */
.explosion-particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(0.5px);
}

.number-particle {
  position: absolute;
  font-family: 'Arial', sans-serif;
  font-weight: bold;
  color: #FFD700;
  pointer-events: none;
  transform-origin: center;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.7);
}

/* Responsive design */
@media (max-width: 768px) {
  .magician-gif {
    width: 300px;
    height: 300px;
  }
  
  .counter-number {
    font-size: 5rem;
  }
}

@media (max-width: 480px) {
  .magician-gif {
    width: 250px;
    height: 250px;
  }
  
  .counter-number {
    font-size: 4rem;
  }
}

/* Animation performance optimizations */
.celebration-overlay * {
  will-change: transform, opacity, filter;
  backface-visibility: hidden;
  perspective: 1000px;
}
</style>