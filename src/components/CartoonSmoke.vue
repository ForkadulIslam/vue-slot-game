<template>
  <div class="particle-container" ref="particleContainer">
    <div class="controls">
      <div class="control-group">
        <label>Particle Size: {{ particleSize }}</label>
        <input type="range" v-model="particleSize" min="1" max="50" @input="updateParticleConfig" />
      </div>
      
      <div class="control-group">
        <label>Particle Count: {{ particleCount }}</label>
        <input type="range" v-model="particleCount" min="10" max="200" @input="updateParticleConfig" />
      </div>
      
      <div class="control-group">
        <label>Gravity: {{ gravity }}</label>
        <input type="range" v-model="gravity" min="0" max="1" step="0.05" @input="updateParticleConfig" />
      </div>
      
      <div class="color-controls">
        <label>Start Color:</label>
        <input type="color" v-model="startColor" @input="updateColors" />
        
        <label>End Color:</label>
        <input type="color" v-model="endColor" @input="updateColors" />
      </div>
      
      <button @click="createTestBurst" class="test-btn">Test Burst</button>
      <button @click="clearParticles" class="clear-btn">Clear All</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as PIXI from 'pixi.js';
import goldCoinImage from '../assets/images/symblos/celebration/coin_particlejpg.jpg';

const particleContainer = ref(null);

// Configuration
const particleSize = ref(15); // Smaller default size
const particleCount = ref(80);
const gravity = ref(0.2);
const startColor = ref('#ffcc00');
const endColor = ref('#ff6600');

let app = null;
let particles = [];
let texture = null;

// Particle class
class Particle {
  constructor(x, y, texture, config) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.position.set(x, y);
    
    // Start with smaller size
    const startScale = config.size / 100; // Convert size (1-50) to scale (0.01-0.5)
    this.sprite.scale.set(startScale);
    
    this.sprite.alpha = 1;
    
    // Store color values
    this.startColor = hexToNumber(config.startColor);
    this.endColor = hexToNumber(config.endColor);
    this.sprite.tint = this.startColor;
    
    // Random properties with more variation
    const speed = 6 + Math.random() * 4;
    const angle = Math.random() * Math.PI * 2;
    
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed - 2 // Slight upward bias
    };
    
    this.gravity = config.gravity;
    this.friction = 0.95 + Math.random() * 0.04; // 0.95-0.99
    
    // Rotation
    this.rotationSpeed = (Math.random() - 0.5) * 0.15; // Slower rotation
    
    // Scale animation
    this.scaleSpeed = 0.005 + Math.random() * 0.005; // Slower growth
    this.targetScale = startScale * (1.5 + Math.random() * 0.5); // Grow to 150-200% of start size
    
    // Life and fade
    this.life = 1.0;
    this.alphaSpeed = 0.01 + Math.random() * 0.01; // 1-2 seconds lifespan
    
    // Store config
    this.config = config;
  }
  
  update() {
    // Apply physics
    this.velocity.y += this.gravity;
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    
    // Update position
    this.sprite.x += this.velocity.x;
    this.sprite.y += this.velocity.y;
    
    // Update rotation
    this.sprite.rotation += this.rotationSpeed;
    
    // Update scale (grow then maybe shrink)
    if (this.sprite.scale.x < this.targetScale) {
      this.sprite.scale.x += this.scaleSpeed;
      this.sprite.scale.y += this.scaleSpeed;
    }
    
    // Update life and alpha
    this.life -= this.alphaSpeed;
    this.sprite.alpha = Math.max(0, this.life);
    
    // Interpolate color based on life
    const t = 1 - this.life; // 0 to 1 as particle fades
    const color = interpolateColor(this.startColor, this.endColor, t);
    this.sprite.tint = color;
    
    // Return false if particle should be removed
    return this.life > 0;
  }
}

// Helper functions
const hexToNumber = (hex) => {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return (r << 16) | (g << 8) | b;
};

const interpolateColor = (color1, color2, factor) => {
  const r1 = (color1 >> 16) & 0xff;
  const g1 = (color1 >> 8) & 0xff;
  const b1 = color1 & 0xff;
  
  const r2 = (color2 >> 16) & 0xff;
  const g2 = (color2 >> 8) & 0xff;
  const b2 = color2 & 0xff;
  
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  
  return (r << 16) | (g << 8) | b;
};

const createParticleBurst = (x, y, count, config) => {
  for (let i = 0; i < count; i++) {
    const particle = new Particle(x, y, texture, config);
    particles.push(particle);
    app.stage.addChild(particle.sprite);
  }
};

const clearParticles = () => {
  particles.forEach(particle => {
    app.stage.removeChild(particle.sprite);
  });
  particles = [];
};

const createTestBurst = () => {
  const config = {
    size: particleSize.value,
    startColor: startColor.value,
    endColor: endColor.value,
    gravity: gravity.value
  };
  
  createParticleBurst(
    app.screen.width / 2,
    app.screen.height / 2,
    particleCount.value,
    config
  );
};

const updateParticleConfig = () => {
  // Configuration updates are applied to new particles only
  console.log('Config updated:', {
    size: particleSize.value,
    count: particleCount.value,
    gravity: gravity.value
  });
};

const updateColors = () => {
  console.log('Colors updated:', {
    start: startColor.value,
    end: endColor.value
  });
};

onMounted(async () => {
  if (!particleContainer.value) return;
  
  try {
    app = new PIXI.Application();
    await app.init({
      width: particleContainer.value.clientWidth,
      height: particleContainer.value.clientHeight,
      backgroundColor: 0x0a0a1a,
      resizeTo: particleContainer.value,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    
    particleContainer.value.appendChild(app.canvas);
    
    // Load texture
    texture = await PIXI.Assets.load(goldCoinImage);
    
    // Make stage interactive
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.cursor = 'pointer';
    
    // Handle mouse clicks
    app.stage.on('pointerdown', (event) => {
      const config = {
        size: particleSize.value,
        startColor: startColor.value,
        endColor: endColor.value,
        gravity: gravity.value
      };
      
      createParticleBurst(
        event.global.x,
        event.global.y,
        particleCount.value,
        config
      );
    });
    
    // Handle mouse move for trail effect
    let lastEmitTime = 0;
    app.stage.on('pointermove', (event) => {
      const now = Date.now();
      if (now - lastEmitTime > 50) { // Emit every 50ms
        const config = {
          size: particleSize.value / 2, // Smaller particles for trail
          startColor: startColor.value,
          endColor: endColor.value,
          gravity: gravity.value * 0.5 // Less gravity for trail
        };
        
        createParticleBurst(
          event.global.x,
          event.global.y,
          3, // Fewer particles for trail
          config
        );
        
        lastEmitTime = now;
      }
    });
    
    // Animation loop
    app.ticker.add(() => {
      // Update all particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        const isAlive = particle.update();
        
        if (!isAlive) {
          // Remove dead particle
          app.stage.removeChild(particle.sprite);
          particles.splice(i, 1);
        }
      }
      
      // Limit total particles to prevent performance issues
      if (particles.length > 500) {
        const toRemove = particles.length - 500;
        for (let i = 0; i < toRemove; i++) {
          app.stage.removeChild(particles[i].sprite);
        }
        particles.splice(0, toRemove);
      }
    });
    
    // Handle window resize
    const handleResize = () => {
      if (app && particleContainer.value) {
        app.renderer.resize(particleContainer.value.clientWidth, particleContainer.value.clientHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Create initial burst
    setTimeout(() => {
      createTestBurst();
    }, 500);
    
  } catch (error) {
    console.error('Error initializing particle system:', error);
  }
});

onUnmounted(() => {
  if (app) {
    app.destroy(true, true);
    app = null;
  }
  particles = [];
});
</script>

<style scoped>
.particle-container {
  width: 100%;
  height: 600px;
  background: linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.controls {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  color: #e2e8f0;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
}

.control-group input[type="range"] {
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #4fc3f7, #ff7e5f);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

.control-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.color-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.color-controls label {
  color: #e2e8f0;
  font-size: 0.9rem;
  font-weight: 500;
}

.color-controls input[type="color"] {
  width: 100%;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

button {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  margin-top: 10px;
}

button.test-btn {
  background: linear-gradient(45deg, #4fc3f7, #2196f3);
  color: white;
}

button.clear-btn {
  background: linear-gradient(45deg, #ff7e5f, #feb47b);
  color: white;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

/* Instructions overlay */
.particle-container::before {
  content: 'Click anywhere to create particle bursts • Move mouse for particle trail';
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  z-index: 10;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
}

@media (max-width: 768px) {
  .particle-container {
    height: 500px;
  }
  
  .controls {
    grid-template-columns: 1fr;
    top: 10px;
    left: 10px;
    right: 10px;
    padding: 15px;
  }
}
</style>