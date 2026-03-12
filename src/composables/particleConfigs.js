

// Configuration for the win particles
export const lineWinEffectConfig = {
  "lifetime": {
    "min": 0.5,
    "max": 0.5
  },
  "frequency": 0.008,
  "pos": {
    "x": 0,
    "y": 0
  },
  "spawnChance": 1,
  "emitterLifetime": 0.31,
  "maxParticles": 1000,
  "particlesPerWave": 1,
  "addAtBack": false,
  "ease": [
    {
      "s": 0,
      "cp": 0.379,
      "e": 0.548
    },
    {
      "s": 0.548,
      "cp": 0.717,
      "e": 0.676
    },
    {
      "s": 0.676,
      "cp": 0.635,
      "e": 1
    }
  ],
  "behaviors": [
    {
      "type": "textureSingle",
      "config": {
        "texture": null
      }
    },
    {
      "type": "spawnShape",
      "config": {
        "type": "torus",
        "data": {
          "x": 0,
          "y": 0,
          "radius": 40,
          "innerRadius": 39,
          "affectRotation": true
        }
      }
    },
    {
      "type": "moveSpeed",
      "config": {
        "speed": {
          "list": [
            {
              "time": 0,
              "value": 200
            },
            {
              "time": 1,
              "value": 100
            }
          ],
          "isStepped": true
        }
      }
    },
    {
      "type": "scale",
      "config": {
        "scale": {
          "list": [
            {
              "time": 0,
              "value": 1
            },
            {
              "time": 1,
              "value": 0.3
            }
          ],
          "isStepped": false
        },
        "minMult": 1
      }
    },
    {
      "type": "alpha",
      "config": {
        "alpha": {
          "list": [
            {
              "time": 0,
              "value": 0.8
            },
            {
              "time": 1,
              "value": 0.1
            }
          ],
          "isStepped": false
        }
      }
    },
    {
      "type": "color",
      "config": {
        "color": {
          "list": [
            {
              "value": "#fb1010",
              "time": 0
            },
            {
              "value": "#f5b830",
              "time": 1
            }
          ]
        }
      }
    }
  ]
};


export const horizontalFireConfig = {
  "lifetime": {
   "min": 0.3, "max": 0.6
  },
  "frequency": 0.008,
  "pos": {
    "x": 0,
    "y": 0
  },
  "spawnChance": 1,
  "emitterLifetime": 0,
  "maxParticles": 1000,
  "particlesPerWave": 1,
  "addAtBack": false,
  "ease": [
    {
      "s": 0,
      "cp": 0.379,
      "e": 0.548
    },
    {
      "s": 0.548,
      "cp": 0.717,
      "e": 0.676
    },
    {
      "s": 0.676,
      "cp": 0.635,
      "e": 1
    }
  ],
  "behaviors": [
    {
      "type": "textureSingle",
      "config": {
        "texture": null
      }
    },
    {
      "type": "spawnBurst",
      "config": {
        "spacing": 1,
        "start": 0,
        "distance": 0
      }
    },
    {
      "type": "moveSpeedStatic",
      "config": {
        "min": 400,
        "max": 800
      }
    },
    {
      "type": "scale",
      "config": {
        "scale": {
          "list": [
            {
              "time": 0,
              "value": 0.25
            },
            {
              "time": 1,
              "value": 0.75
            }
          ],
          "isStepped": false
        },
        "minMult": 1
      }
    },
    {
      "type": "alpha",
      "config": {
        "alpha": {
          "list": [
            { "time": 0, "value": 0.4 }, 
            { "time": 1, "value": 0 } 
          ],
          "isStepped": false
        }
      }
    },
    {
      "type": "color",
      "config": {
        "color": {
          "list": [
            { "value": "#ffffff", "time": 0 },
            { "value": "#00ffff", "time": 0.4 },
            { "value": "#0044ff", "time": 1 }
          ],
          "isStepped": false
        }
      }
    },
    {
      "type": "rotationStatic",
      "config": {
        "min": -12,
        "max": 12
      }
    }
  ]
}



