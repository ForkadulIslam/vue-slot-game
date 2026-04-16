// assets/assetManifest.js
export const assetManifest = {
    bundles: [
        {
            name: 'celebration-assets',
            assets: [
                { 
                    alias: 'symbolsSprite', 
                    src: new URL('./images/symbols_sprite.webp', import.meta.url).href 
                },
                { 
                    alias: 'explosionVFXSheet', 
                    src: new URL('./images/vfx/symbol_explosion/symbol_explosion.json', import.meta.url).href 
                },
                { 
                    alias: 'swordEmberVFXSheet', 
                    src: new URL('./images/vfx/sword_ember/sword_ember.json', import.meta.url).href 
                },
                { 
                    alias: 'glowBurst', 
                    src: new URL('./images/transparent_glow_squire.png', import.meta.url).href 
                },
                { 
                    alias: 'shieldHelmet', 
                    src: new URL('./images/transparent_shield_helmet.png', import.meta.url).href 
                },
                { 
                    alias: 'backgroundGlow', 
                    src: new URL('./images/transparent_glow.png', import.meta.url).href 
                },
                {
                    alias:'fireSparkParticleTexture',
                    src: new URL('./images/fireSpark_particle.png', import.meta.url).href
                },
                { 
                    alias: 'fighterModelPortrait', 
                    src: new URL('./images/boxing_king_portrait.webp', import.meta.url).href 
                },
                { 
                    alias: 'fighterModelLandscape', 
                    src: new URL('./images/boxing_king_landscape.webp', import.meta.url).href 
                },
            ],
        },
        {
            name: 'audio-assets',
            assets: [
                { alias: 'winAlert', src: new URL('./sounds/winAlert.mp3', import.meta.url).href },
                { alias: 'explosion', src: new URL('./sounds/game-explosion.wav', import.meta.url).href },
                { alias: 'jackpotCoinLoop', src: new URL('./sounds/jackpot-coin-loop.mp3', import.meta.url).href },
                { alias: 'backgroundMusic', src: new URL('./sounds/background_music.mp3', import.meta.url).href },
                { alias: 'celebrationMusic', src: new URL('./sounds/celebration_music.mp3', import.meta.url).href },
                { alias: 'reelsSound', src: new URL('./sounds/reels-sound.mp3', import.meta.url).href },
                { alias: 'youWinVoice', src: new URL('./sounds/you-win-voice.mp3', import.meta.url).href },
                { alias: 'congratulationsVoice', src: new URL('./sounds/congratulations-voice.mp3', import.meta.url).href },
            ]
        }
    ]
};