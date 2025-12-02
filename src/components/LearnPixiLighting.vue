<template>
  <div class="pixi-lighting-v8">
    <div class="header">
      <h1>PixiJS v8 Lighting Demo</h1>
      <p>Using the new Graphics API</p>
    </div>
    
    <div class="main-content">
      <div class="controls">
        <h2>Light Controls</h2>
        
        <div class="control-group">
          <label>Light X: {{ lightPosition.x }}</label>
          <input type="range" v-model="lightPosition.x" min="0" max="800" @input="updateLight" />
        </div>
        
        <div class="control-group">
          <label>Light Y: {{ lightPosition.y }}</label>
          <input type="range" v-model="lightPosition.y" min="0" max="600" @input="updateLight" />
        </div>
        
        <div class="control-group">
          <label>Light Radius: {{ lightRadius }}</label>
          <input type="range" v-model="lightRadius" min="50" max="300" @input="updateLightRadius" />
        </div>
        
        <div class="control-group">
          <label>Light Intensity: {{ lightIntensity.toFixed(1) }}</label>
          <input type="range" v-model="lightIntensity" min="0.1" max="1" step="0.1" @input="updateLightIntensity" />
        </div>
        
        <div class="button-group">
          <button @click="addObject('circle')">Add Circle</button>
          <button @click="addObject('rectangle')">Add Rectangle</button>
          <button @click="addObject('triangle')">Add Triangle</button>
        </div>
        
        <div class="button-group">
          <button @click="clearObjects" class="clear-btn">Clear All</button>
          <button @click="animateLight = !animateLight">
            {{ animateLight ? 'Stop Animation' : 'Start Animation' }}
          </button>
        </div>
      </div>
      
      <div class="canvas-container">
        <canvas ref="pixiCanvas"></canvas>
      </div>
    </div>
    
    <div class="instructions">
      <h3>PixiJS v8 Graphics API Changes:</h3>
      <ul>
        <li><strong>Old:</strong> graphics.beginFill(0xff0000).drawCircle(0, 0, 50).endFill()</li>
        <li><strong>New:</strong> graphics.circle(0, 0, 50).fill(0xff0000)</li>
        <li>Method chaining is still supported</li>
        <li>More intuitive and consistent API</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as PIXI from 'pixi.js'

const pixiCanvas = ref(null)

// Light properties
const lightPosition = ref({ x: 400, y: 300 })
const lightRadius = ref(150)
const lightIntensity = ref(0.8)
const animateLight = ref(true)

// PixiJS variables
let app = null
let lightSprite = null
let objects = []
let animationId = null
let time = 0

// Initialize PixiJS v8
const initPixi = async () => {
  if (!pixiCanvas.value) return
  
  app = new PIXI.Application()
  
  await app.init({
    width: 800,
    height: 600,
    backgroundColor: 0x1a1a2e,
    canvas: pixiCanvas.value,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  })
  
  // Create initial scene
  createScene()
  
  // Create light
  createLight()
  
  // Start animation loop
  animate()
}

const createScene = () => {
  // Create background with stars
  createBackground()
  
  // Create some initial objects
  createInitialObjects()
}

const createBackground = () => {
  // Create gradient background using the new Graphics API
  const background = new PIXI.Graphics()
  
  // Draw dark blue background
  background.rect(0, 0, 800, 600)
  background.fill({ color: 0x0a0a1a })
  
  // Add stars using new API
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 800
    const y = Math.random() * 400
    const size = Math.random() * 2 + 0.5
    
    background.circle(x, y, size)
    background.fill({ color: 0xffffff, alpha: Math.random() * 0.5 + 0.5 })
  }
  
  app.stage.addChild(background)
}

const createInitialObjects = () => {
  // Create some sample objects
  const shapes = ['circle', 'rectangle', 'triangle', 'circle', 'rectangle', 'triangle']
  const colors = [0x4a90e2, 0xe24a4a, 0x4ae24a, 0xe2e24a, 0x9b4ae2, 0xe24a9b]
  
  shapes.forEach((shape, index) => {
    const x = 150 + (index % 3) * 250
    const y = 150 + Math.floor(index / 3) * 200
    
    createGraphicsObject(shape, x, y, colors[index])
  })
}

const createGraphicsObject = (type, x, y, color) => {
  const graphics = new PIXI.Graphics()
  
  // Using the new PixiJS v8 Graphics API
  switch (type) {
    case 'circle':
      graphics.circle(0, 0, 40)
      break
    case 'rectangle':
      graphics.rect(-40, -40, 80, 80)
      graphics.roundRect(-40, -40, 80, 80, 10)
      break
    case 'triangle':
      graphics.poly([0, -40, 40, 40, -40, 40])
      break
    case 'star':
      // Create star points
      const points = []
      const spikes = 5
      const outerRadius = 40
      const innerRadius = 20
      
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius
        const angle = (Math.PI * i) / spikes
        points.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius
        )
      }
      
      graphics.poly(points)
      break
  }
  
  // Apply fill with the new API
  graphics.fill({ color, alpha: 0.9 })
  
  // Add border/stroke
  graphics.stroke({ width: 2, color: 0xffffff, alpha: 0.5 })
  
  graphics.position.set(x, y)
  
  // Make interactive
  graphics.eventMode = 'static'
  graphics.cursor = 'pointer'
  
  graphics.on('pointerdown', () => {
    removeObject(graphics)
  })
  
  app.stage.addChild(graphics)
  
  const object = {
    graphics,
    x,
    y,
    type,
    color,
    baseAlpha: 0.9
  }
  
  objects.push(object)
  return object
}

const createLight = () => {
  // Remove existing light
  if (lightSprite && lightSprite.parent) {
    lightSprite.parent.removeChild(lightSprite)
  }
  
  // Create light texture using canvas
  const canvas = document.createElement('canvas')
  const size = lightRadius.value * 2
  canvas.width = size
  canvas.height = size
  
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(
    lightRadius.value, lightRadius.value, 0,
    lightRadius.value, lightRadius.value, lightRadius.value
  )
  
  gradient.addColorStop(0, `rgba(255, 255, 200, ${lightIntensity.value})`)
  gradient.addColorStop(0.7, `rgba(255, 240, 180, ${lightIntensity.value * 0.2})`)
  gradient.addColorStop(1, `rgba(255, 220, 150, 0)`)
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  
  lightSprite = new PIXI.Sprite(PIXI.Texture.from(canvas))
  lightSprite.anchor.set(0.5)
  lightSprite.position.set(lightPosition.value.x, lightPosition.value.y)
  lightSprite.blendMode = 'add'
  
  app.stage.addChild(lightSprite)
  
  // Update object lighting
  updateObjectLighting()
}

const updateObjectLighting = () => {
  objects.forEach(obj => {
    const dx = obj.graphics.x - lightPosition.value.x
    const dy = obj.graphics.y - lightPosition.value.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Calculate light influence
    const maxDistance = lightRadius.value
    let influence = 1 - (distance / maxDistance)
    influence = Math.max(0, Math.min(1, influence))
    
    // Apply lighting effect
    const intensity = 0.6 + influence * 0.4
    
    // Calculate tinted color
    const r = Math.floor(((obj.color >> 16) & 0xff) * intensity)
    const g = Math.floor(((obj.color >> 8) & 0xff) * intensity)
    const b = Math.floor((obj.color & 0xff) * intensity)
    
    // Update object appearance using new Graphics API
    obj.graphics.clear() // Clear previous drawing
    
    // Redraw with new lighting
    switch (obj.type) {
      case 'circle':
        obj.graphics.circle(0, 0, 40)
        break
      case 'rectangle':
        obj.graphics.roundRect(-40, -40, 80, 80, 10)
        break
      case 'triangle':
        obj.graphics.poly([0, -40, 40, 40, -40, 40])
        break
      case 'star':
        const points = []
        const spikes = 5
        const outerRadius = 40
        const innerRadius = 20
        
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          const angle = (Math.PI * i) / spikes
          points.push(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
          )
        }
        
        obj.graphics.poly(points)
        break
    }
    
    // Apply new fill color
    obj.graphics.fill({ 
      color: (r << 16) | (g << 8) | b, 
      alpha: obj.baseAlpha + influence * 0.1 
    })
    
    // Add border
    obj.graphics.stroke({ 
      width: 2, 
      color: 0xffffff, 
      alpha: 0.3 + influence * 0.2 
    })
  })
}

const addObject = (type) => {
  const x = 100 + Math.random() * 600
  const y = 100 + Math.random() * 400
  const colors = [0x4a90e2, 0xe24a4a, 0x4ae24a, 0xe2e24a, 0x9b4ae2, 0xe24a9b]
  const color = colors[Math.floor(Math.random() * colors.length)]
  
  createGraphicsObject(type, x, y, color)
  updateObjectLighting()
}

const removeObject = (graphics) => {
  const index = objects.findIndex(obj => obj.graphics === graphics)
  if (index !== -1) {
    graphics.parent.removeChild(graphics)
    objects.splice(index, 1)
  }
}

const clearObjects = () => {
  objects.forEach(obj => {
    obj.graphics.parent.removeChild(obj.graphics)
  })
  objects = []
}

const updateLight = () => {
  if (lightSprite) {
    lightSprite.position.set(lightPosition.value.x, lightPosition.value.y)
    updateObjectLighting()
  }
}

const updateLightRadius = () => {
  createLight()
}

const updateLightIntensity = () => {
  createLight()
}

const animate = () => {
  if (!animateLight.value) {
    animationId = requestAnimationFrame(animate)
    return
  }
  
  time += 0.02
  
  // Animate light in figure-8 pattern
  lightPosition.value.x = 400 + Math.sin(time) * 200
  lightPosition.value.y = 300 + Math.sin(time * 2) * 100
  
  // Update light position
  if (lightSprite) {
    lightSprite.position.set(lightPosition.value.x, lightPosition.value.y)
    lightSprite.rotation = time * 0.3
    
    // Pulse light size
    lightSprite.scale.set(1 + Math.sin(time * 3) * 0.1)
    
    updateObjectLighting()
  }
  
  // Rotate objects
  objects.forEach((obj, index) => {
    obj.graphics.rotation = time * 0.5 * (index % 2 === 0 ? 1 : -1)
  })
  
  animationId = requestAnimationFrame(animate)
}

onMounted(async () => {
  await initPixi()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (app) {
    app.destroy()
  }
})
</script>

<style scoped>
.pixi-lighting-v8 {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  text-align: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.header h1 {
  margin: 0;
  color: #4fc3f7;
  font-size: 2.5rem;
}

.header p {
  color: #aaa;
  margin: 10px 0 0 0;
}

.main-content {
  display: flex;
  padding: 20px;
  gap: 30px;
  max-width: 1400px;
  margin: 0 auto;
}

.controls {
  width: 300px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 15px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.controls h2 {
  color: #4fc3f7;
  margin-top: 0;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(79, 195, 247, 0.3);
}

.control-group {
  margin-bottom: 20px;
}

.control-group label {
  display: block;
  margin-bottom: 8px;
  color: #e0e0e0;
  font-weight: 600;
}

.control-group input[type="range"] {
  width: 100%;
  height: 8px;
  background: linear-gradient(90deg, #4fc3f7, #ff7e5f);
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
}

.control-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.button-group {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  margin: 25px 0;
}

.button-group button {
  padding: 12px;
  background: linear-gradient(45deg, #4fc3f7, #2196f3);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.button-group button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(79, 195, 247, 0.4);
}

.button-group button.clear-btn {
  background: linear-gradient(45deg, #ff7e5f, #feb47b);
}

.canvas-container {
  flex: 1;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 15px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.1);
  min-height: 600px;
}

.canvas-container canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.instructions {
  max-width: 1400px;
  margin: 20px auto;
  padding: 25px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.instructions h3 {
  color: #4fc3f7;
  margin-top: 0;
  margin-bottom: 15px;
}

.instructions ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.instructions li {
  margin: 12px 0;
  padding-left: 25px;
  position: relative;
  color: #aaa;
  line-height: 1.6;
  font-family: 'Courier New', monospace;
}

.instructions li:before {
  content: "→";
  color: #ff7e5f;
  position: absolute;
  left: 0;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }
  
  .controls {
    width: 100%;
  }
  
  .canvas-container {
    min-height: 500px;
  }
}
</style>