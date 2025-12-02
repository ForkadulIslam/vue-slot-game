<!DOCTYPE html>
<html class="no-js">
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
		<title>Cartoon Smoke</title>
		<meta name="description" content="smoke explosion">
		<link rel="stylesheet" href="css/main.css">

		<!-- Required dependencies -->
		<script src="libs/pixi.js/dist/browser/pixi.js"></script>
		<script src="../dist/particle-emitter.js"></script>

		<!-- Example scaffolding -->
		<script src="js/ParticleExample.js"></script>

	</head>
	<body>
		<div id="framerate"></div>
		<div id="instructions">Click Anywhere</div>
		<canvas id="stage" width="400" height="400"></canvas>
		<script>

			// See js/ParticleExample.js for actual setup
			new ParticleExample(
				// The image to use
				["images/CartoonSmoke.png"],

				// Emitter configuration, edit this to change the look
				// of the emitter
				{
					"lifetime": {
						"min": 0.4,
						"max": 0.7
					},
					"frequency": 0.001,
					"emitterLifetime": 0.2,
					"maxParticles": 100,
					"addAtBack": true,
					"pos": {
						"x": 0,
						"y": 0
					},
					"behaviors": [
						{
							"type": "alpha",
							"config": {
								"alpha": {
									"list": [
										{
											"time": 0,
											"value": 0.74
										},
										{
											"time": 1,
											"value": 0
										}
									]
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
											"value": 700
										},
										{
											"time": 1,
											"value": 50
										}
									]
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
											"value": 0.1
										},
										{
											"time": 1,
											"value": 1.2
										}
									]
								},
								"minMult": 1
							}
						},
						{
							"type": "color",
							"config": {
								"color": {
									"list": [
										{
											"time": 0,
											"value": "eb8b58"
										},
										{
											"time": 1,
											"value": "575757"
										}
									]
								}
							}
						},
						{
							"type": "rotation",
							"config": {
								"accel": 0,
								"minSpeed": 0,
								"maxSpeed": 200,
								"minStart": 0,
								"maxStart": 360
							}
						},
						{
							"type": "textureRandom",
							"config": {
								"textures": [
									"images/CartoonSmoke.png"
								]
							}
						},
						{
							"type": "spawnPoint",
							"config": {}
						}
					]
				});
		</script>
	</body>
</html>


//js/ParticleExample.js
(function (window)
{
    /* global PIXI */
    /* eslint-disable newline-after-var,prefer-template */
    /**
    *  Basic example setup
    *  @class ParticleExample
    *  @constructor
    *  @param {String[]} imagePaths The local path to the image source
    *  @param {Object} config The emitter configuration
    *  @param {boolean} [testContainers=false] If changing containers should be enabled.
    *  @param {boolean} [stepColors=false] If the color settings should be manually stepped.
    */
    class ParticleExample
    {
        constructor(imagePaths, config, testContainers, stepColors)
        {
            const canvas = document.getElementById('stage');
            // Basic PIXI Setup
            const rendererOptions = {
                width: canvas.width,
                height: canvas.height,
                view: canvas,
            };
            /* var preMultAlpha = !!options.preMultAlpha;
            if(rendererOptions.transparent && !preMultAlpha)
                rendererOptions.transparent = 'notMultiplied';*/
            this.stage = new PIXI.Container();
            this.emitter = null;
            this.renderer = new PIXI.Renderer(rendererOptions);
            this.bg = null;
            this.updateHook = null;
            this.containerHook = null;

            const framerate = document.getElementById('framerate');
            const particleCount = document.getElementById('particleCount');
            const containerType = document.getElementById('containerType');

            // Calculate the current time
            let elapsed = Date.now();
            let updateId;

            // Update function every frame
            const update = () =>
            {
                // Update the next frame
                updateId = requestAnimationFrame(update);

                const now = Date.now();
                if (this.emitter)
                {
                    // update emitter (convert to seconds)
                    this.emitter.update((now - elapsed) * 0.001);
                }

                // call update hook for specialist examples
                if (this.updateHook)
                {
                    this.updateHook(now - elapsed);
                }

                framerate.innerHTML = `${(1000 / (now - elapsed)).toFixed(2)} fps`;

                elapsed = now;

                if (this.emitter && particleCount)
                {
                    particleCount.innerHTML = `${this.emitter.particleCount} particles`;
                }

                // render the stage
                this.renderer.render(this.stage);
            };

            // Resize the canvas to the size of the window
            window.onresize = () =>
            {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                this.renderer.resize(canvas.width, canvas.height);
                if (this.bg)
                {
                    // bg is a 1px by 1px image
                    this.bg.scale.x = canvas.width;
                    this.bg.scale.y = canvas.height;
                }
            };
            window.onresize();

            // Preload the particle images and create PIXI textures from it
            let urls;
            if (imagePaths.spritesheet)
            {
                urls = [imagePaths.spritesheet];
            }
            else if (imagePaths.textures)
            {
                urls = imagePaths.textures.slice();
            }
            else
            {
                urls = imagePaths.slice();
            }
            const loader = PIXI.Loader.shared;
            for (let i = 0; i < urls.length; ++i)
            {
                loader.add('img' + i, urls[i]);
            }
            loader.load(() =>
            {
                this.bg = new PIXI.Sprite(PIXI.Texture.WHITE);
                // bg is a 1px by 1px image
                this.bg.scale.x = canvas.width;
                this.bg.scale.y = canvas.height;
                this.bg.tint = 0x000000;
                this.stage.addChild(this.bg);
                // Create the new emitter and attach it to the stage
                let parentType = 0;
                function getContainer()
                {
                    switch (parentType)
                    {
                        case 1:
                            const pc = new PIXI.ParticleContainer();
                            pc.setProperties({
                                scale: true,
                                position: true,
                                rotation: true,
                                uvs: true,
                                alpha: true,
                            });

                            return [pc, 'PIXI.ParticleContainer'];
                        case 2:
                            return [new PIXI.particles.LinkedListContainer(), 'PIXI.particles.LinkedListContainer'];
                        default:
                            return [new PIXI.Container(), 'PIXI.Container'];
                    }
                }
                let [emitterContainer, containerName] = getContainer();
                this.stage.addChild(emitterContainer);
                if (containerType) containerType.innerHTML = containerName;

                window.emitter = this.emitter = new PIXI.particles.Emitter(
                    emitterContainer,
                    config,
                );
                if (stepColors)
                {
                    // override the initialized list with our auto-stepped one
                    this.emitter.getBehavior('color').list.reset(
                        PIXI.particles.ParticleUtils.createSteppedGradient(
                            config.behaviors.find((b) => b.type === 'color').config.color.list,
                            stepColors,
                        ),
                    );
                }

                // Center on the stage
                this.emitter.updateOwnerPos(window.innerWidth / 2, window.innerHeight / 2);

                // Click on the canvas to trigger
                canvas.addEventListener('mouseup', (e) =>
                {
                    if (!this.emitter) return;

                    // right click (or anything but left click)
                    if (e.button)
                    {
                        if (testContainers)
                        {
                            if (++parentType >= 3) parentType = 0;
                            const oldParent = emitterContainer;
                            [emitterContainer, containerName] = getContainer();
                            if (containerType) containerType.innerHTML = containerName;
                            this.stage.addChild(emitterContainer);
                            this.emitter.parent = emitterContainer;
                            this.stage.removeChild(oldParent);
                            oldParent.destroy();

                            if (this.containerHook)
                            {
                                this.containerHook();
                            }
                        }
                    }
                    else
                    {
                        this.emitter.emit = true;
                        this.emitter.resetPositionTracking();
                        this.emitter.updateOwnerPos(e.offsetX || e.layerX, e.offsetY || e.layerY);
                    }
                });

                document.body.addEventListener('contextmenu', (e) =>
                {
                    e.preventDefault();

                    return false;
                });

                // Start the update
                update();

                // for testing and debugging
                window.destroyEmitter = () =>
                {
                    this.emitter.destroy();
                    this.emitter = null;
                    window.destroyEmitter = null;
                    // cancelAnimationFrame(updateId);

                    // reset SpriteRenderer's batching to fully release particles for GC
                    // if (this.renderer.plugins && this.renderer.plugins.sprite && this.renderer.plugins.sprite.sprites)
                    // {
                    //     this.renderer.plugins.sprite.sprites.length = 0;
                    // }

                    this.renderer.render(this.stage);
                };
            });
        }
    }

    // Assign to global space
    window.ParticleExample = ParticleExample;
})(window);