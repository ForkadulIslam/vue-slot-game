<template>
    <div class="multiplier-header">

        <!-- Decorative Chains -->
        <div class="chain left"></div>
        <div class="chain right"></div>

        <!-- The Wooden Board -->
        <div class="wood-board">

            <!-- Corner Rivets (Screws) for detail -->
            <div class="rivet top-left"></div>
            <div class="rivet top-right"></div>
            <div class="rivet bottom-left"></div>
            <div class="rivet bottom-right"></div>

            <!-- The Multiplier Items -->
            <div class="mul-list">
                <div
                        v-for="(mul, index) in multipliers"
                        :key="index"
                        class="mul-item"
                        :class="{ 'active': activeIndex === index }"
                >
                    <!-- Active Light Effects -->
                    <div v-if="activeIndex === index" class="light-effects">
                        <div class="sunburst"></div>
                        <div class="glow-core"></div>
                    </div>

                    <!-- The Text -->
                    <span class="mul-text">x{{ mul }}</span>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
    import { ref, onMounted, watch, nextTick } from 'vue';
    import { gsap } from 'gsap';

    // Multipliers typical for this genre
    const multipliers = [1, 2, 4, 8, 16];
    const activeIndex = ref(1);

    // --- ANIMATION LOGIC ---
    const animateActive = () => {
        // 1. Reset old states
        gsap.killTweensOf('.mul-item');
        gsap.killTweensOf('.sunburst');

        // 2. Animate Text Pop
        gsap.fromTo('.mul-item.active .mul-text',
            { scale: 1, color: '#fff' },
            {
                scale: 1.3,
                textShadow: "0 0 15px rgba(255, 255, 200, 1), 0 0 30px rgba(255, 165, 0, 0.8)",
                duration: 0.6,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut"
            }
        );

        // 3. Rotate Sunburst
        gsap.fromTo('.sunburst',
            { rotation: 0, opacity: 0.6 },
            { rotation: 360, opacity: 0.8, duration: 10, repeat: -1, ease: "none" }
        );
    };

    watch(activeIndex, () => {
        nextTick(() => animateActive());
    });

    onMounted(() => {
        animateActive();
    });
</script>

<style scoped>
    .multiplier-header {
        width: 95%;
        max-width: 420px;
        height: 85px;
        position: relative;
        display: flex;
        justify-content: center;
        margin-top: 5px;
        margin-bottom: 15px;
        z-index: 10;
    }

    /* --- THE BOARD --- */
    .wood-board {
        position: relative;
        width: 100%;
        height: 100%;
        /* Darker, richer vignette for better contrast with the light */
        background:
                radial-gradient(ellipse at center, rgba(0,0,0,0) 20%, rgba(0,0,0,0.8) 100%),
                repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(0,0,0,0.02) 2px, transparent 4px),
                linear-gradient(180deg, #5d4037 0%, #3e2723 100%);

        border-radius: 40% 40% 40% 40% / 15% 15% 15% 15%;
        border: 2px solid #8d6e63;
        border-bottom: 4px solid #281815;

        box-shadow:
                0 15px 30px rgba(0,0,0,0.8),
                inset 0 0 30px rgba(0,0,0,0.9);

        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* --- RIVETS --- */
    .rivet {
        position: absolute;
        width: 6px; height: 6px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ffd700, #b8860b);
        box-shadow: 0 1px 3px rgba(0,0,0,1);
        z-index: 5;
    }
    .rivet.top-left { top: 12px; left: 15px; }
    .rivet.top-right { top: 12px; right: 15px; }
    .rivet.bottom-left { bottom: 12px; left: 15px; }
    .rivet.bottom-right { bottom: 12px; right: 15px; }

    /* --- ITEMS LIST --- */
    .mul-list {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 82%;
        height: 100%;
    }

    .mul-item {
        position: relative;
        width: 60px;
        height: 60px;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2;
    }

    /* --- TEXT STYLES --- */
    .mul-text {
        font-family: 'Georgia', serif;
        font-weight: 900;
        font-size: 1.3rem;
        color: #3e2723;
        text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.1), -1px -1px 2px rgba(0, 0, 0, 0.8);
        opacity: 0.5; /* Dim inactive numbers */
        transition: all 0.4s ease-out;
        position: relative;
        z-index: 20;
    }

    .mul-item.active .mul-text {
        color: #fff;
        opacity: 1;
        font-size: 2rem; /* Big Pop */
        text-shadow:
                0 2px 0 #b8860b,
                0 0 10px rgba(255, 220, 100, 1);
    }

    /* --- REFINED LIGHTING CONTAINER --- */
    .light-effects {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 200px; /* Make container bigger than the effect to prevent clipping */
        height: 200px;
        pointer-events: none;
        z-index: -1;
        mix-blend-mode: screen; /* Blends nicely with dark wood */
        display: flex;
        justify-content: center;
        align-items: center;
    }

    /* 1. The Rotating Rays (Smoother Gradient) */
    .sunburst {
        position: absolute;
        width: 100%; height: 100%;
        background: repeating-conic-gradient(
                from 0deg,
                rgba(255, 200, 50, 0) 0deg,
                rgba(255, 200, 50, 0.1) 10deg,
                rgba(255, 200, 50, 0.4) 20deg, /* Peak brightness */
                rgba(255, 200, 50, 0.1) 30deg,
                rgba(255, 200, 50, 0) 40deg
        );

        /* CRITICAL FIX: Circular Mask prevents square edges */
        mask-image: radial-gradient(circle, black 0%, black 20%, transparent 60%);
        -webkit-mask-image: radial-gradient(circle, black 0%, black 20%, transparent 60%);
    }

    /* 2. The Center Glow (Warm & Soft) */
    .glow-core {
        position: absolute;
        width: 80px; height: 80px;
        background: radial-gradient(circle, rgba(255, 255, 200, 0.9) 0%, rgba(255, 140, 0, 0.6) 40%, transparent 70%);
        filter: blur(5px); /* Soften the edges */
    }

    /* 3. NEW: Horizontal Lens Flare (The Premium Polish) */
    .light-effects::after {
        content: '';
        position: absolute;
        width: 140px;
        height: 2px;
        background: linear-gradient(90deg, transparent 0%, white 50%, transparent 100%);
        filter: blur(1px);
        opacity: 0.8;
        box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
    }

    /* --- CHAINS --- */
    .chain {
        position: absolute;
        top: -20px;
        width: 4px;
        height: 25px;
        background: #111;
        background-image: repeating-linear-gradient(to bottom, #333 0px, #111 4px, #333 8px);
        z-index: -1;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
    }
    .chain.left { left: 40px; }
    .chain.right { right: 40px; }
</style>