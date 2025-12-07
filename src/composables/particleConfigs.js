// src/composables/particleConfigs.js

// Define texture paths. These paths are relative to the component that will load them,
// but since we're using PIXI.Assets.load, it's better to provide paths relative
// to the public directory or use direct imports if the bundler handles it.
// Given the setup, direct import paths are more reliable.
import hardRainTexturePath from '../assets/images/hard_rain.png';
import fireSparkParticleTexturePath from '../assets/images/fireSpark_particle.png';
import fireSparkFireTexturePath from '../assets/images/fireSpark_Fire.png';
import coinParticle2 from '../assets/images/coinParticle2.png'

export 
{ hardRainTexturePath, 
  fireSparkFireTexturePath, 
  fireSparkParticleTexturePath,
  coinParticle2
}

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
        "texture": coinParticle2
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



// Configuration for the fire on reels effect
export const fireReelEffectConfig = {
  "lifetime": {
    "min": 0.1,
    "max": 0.75
  },
  "frequency": 0.001,
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
        "texture": fireSparkParticleTexturePath
      }
    },
    {
      "type": "spawnShape",
      "config": {
        "type": "polygonalChain",
        "data": [
          [
            {
              "x": -300,
              "y": 100
            },
            {
              "x": -300,
              "y": -100
            }
          ],
          [
            {
              "x": -300,
              "y": -100
            },
            {
              "x": -250,
              "y": -100
            }
          ],
          [
            {
              "x": -300,
              "y": 0
            },
            {
              "x": -250,
              "y": 0
            }
          ],
          [
            {
              "x": -200,
              "y": 100
            },
            {
              "x": -200,
              "y": -100
            }
          ],
          [
            {
              "x": -100,
              "y": 100
            },
            {
              "x": -100,
              "y": -100
            },
            {
              "x": -50,
              "y": -50
            },
            {
              "x": -100,
              "y": 0
            },
            {
              "x": -50,
              "y": 100
            }
          ],
          [
            {
              "x": 0,
              "y": 100
            },
            {
              "x": 0,
              "y": -100
            }
          ],
          [
            {
              "x": 0,
              "y": -100
            },
            {
              "x": 50,
              "y": -100
            }
          ],
          [
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 50,
              "y": 0
            }
          ],
          [
            {
              "x": 0,
              "y": 100
            },
            {
              "x": 50,
              "y": 100
            }
          ]
        ]
      }
    },
    {
      "type": "moveSpeedStatic",
      "config": {
        "min": 50,
        "max": 50
      }
    },
    {
      "type": "scale",
      "config": {
        "scale": {
          "list": [
            {
              "time": 0,
              "value": 0.05
            },
            {
              "time": 1,
              "value": 0.15
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
              "value": 0.62
            },
            {
              "time": 1,
              "value": 0
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
              "value": "#fff191",
              "time": 0
            },
            {
              "value": "#ff622c",
              "time": 1
            }
          ]
        }
      }
    },
    {
      "type": "rotationStatic",
      "config": {
        "min": 265,
        "max": 275
      }
    }
  ]
};


// Configuration for the coin spreading to screen
export const coinFloodinEffectConfig = {
  "lifetime": {
    "min": 4,
    "max": 4
  },
  "frequency": 0.004,
  "pos": {
    "x": 0,
    "y": 0
  },
  "spawnChance": 1,
  "emitterLifetime": 3,
  "maxParticles": 1000,
  "particlesPerWave": 1,
  "addAtBack": true,
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
        "texture": coinParticle2
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
          "innerRadius": 50,
          "affectRotation": true
        }
      }
    },
    {
      "type": "moveSpeedStatic",
      "config": {
        "min": 200,
        "max": 200
      }
    },
    {
      "type": "scale",
      "config": {
        "scale": {
          "list": [
            {
              "time": 0,
              "value": 0.15
            },
            {
              "time": 1,
              "value": 0.8
            }
          ],
          "isStepped": false
        },
        "minMult": 0.5
      }
    },
    {
      "type": "alpha",
      "config": {
        "alpha": {
          "list": [
            {
              "time": 0,
              "value": 0.73
            },
            {
              "time": 1,
              "value": 0.46
            }
          ],
          "isStepped": false
        }
      }
    },
    {
      "type": "rotation",
      "config": {
        "minStart": 50,
        "maxStart": 70,
        "minSpeed": 0,
        "maxSpeed": 200,
        "accel": 0
      }
    }
  ]
}