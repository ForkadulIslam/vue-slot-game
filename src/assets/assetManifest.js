// assets/assetManifest.js
export const assetManifest = {
    bundles: [
        {
            name: 'celebration-assets',
            assets: [
                { 
                    alias: 'symbolsSprite', 
                    src: new URL('./images/symbols_sprite.png', import.meta.url).href 
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
            ],
        },
    ]
};