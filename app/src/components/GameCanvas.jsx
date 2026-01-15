import React, { useRef, useEffect, useState } from 'react'
import './GameCanvas.css'

const GameCanvas = ({ algorithm, gameRunning, onGameEnd, onScoreChange }) => {
  const canvasRef = useRef(null)
  const [gameSpeed, setGameSpeed] = useState(1)
  const gameSpeedRef = useRef(1) // Ref to track current game speed
  const TICKS_PER_SECOND = 180 // Fixed tick rate
  const spritesRef = useRef({}) // Loaded image sprites (e.g., ocean background)
  const gameStateRef = useRef({
    running: false,
    score: 0,
    player: { x: 100, y: 300, width: 60, height: 60, state: 'sailing', jumpVelocity: 0, bobVelocity: 0, bobbing: false, sailLevel: 1, cannonCooldown: 0, projectiles: [] },
    obstacles: [],
    waterY: 300,
    algorithmIndex: 0,
    lastObstacleTime: 0,
    gameSpeed: 1,
    frameCount: 0,
    // Game state variables for blocks
    gameState: {
      distanceToObstacle: Infinity,
      obstacleType: null,
      obstacleHeight: 0
    }
  })

  // Update gameSpeed ref whenever it changes
  useEffect(() => {
    gameSpeedRef.current = gameSpeed
  }, [gameSpeed])

  useEffect(() => {
    if (!gameRunning || !algorithm || algorithm.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width
        canvas.height = rect.height
      } else {
        // Fallback dimensions if canvas isn't sized yet
        canvas.width = 800
        canvas.height = 600
      }
    }

    updateCanvasSize()
    
    // Handle window resize
    const handleResize = () => {
      updateCanvasSize()
    }
    window.addEventListener('resize', handleResize)

    const ctx = canvas.getContext('2d')

    // Lazy-load sprites (only once)
    const loadSprites = () => {
      // If already loaded, skip
      if (spritesRef.current && spritesRef.current.ocean) {
        return Promise.resolve()
      }

      // Use BASE_URL to ensure paths work in both dev and production Electron builds
      const baseUrl = import.meta.env.BASE_URL || './'
      const sources = {
        background: `${baseUrl}sprites/background.png`,
        ocean: `${baseUrl}sprites/ocean.png`,
        ship: `${baseUrl}sprites/ship.png`,
        wave: `${baseUrl}sprites/wave.png`,
        shark: `${baseUrl}sprites/shark.png`,
        mine: `${baseUrl}sprites/mine.png`,
        bird: `${baseUrl}sprites/bird.png`,
        bird1: `${baseUrl}sprites/bird1.png`,
        bird2: `${baseUrl}sprites/bird2.png`,
        enemyBoat: `${baseUrl}sprites/enemy-boat.png`,
      };

      const images = {}
      let loaded = 0
      const total = Object.keys(sources).length

      return new Promise((resolve) => {
        Object.entries(sources).forEach(([key, src]) => {
          const img = new Image()
          img.src = src
          img.onload = () => {
            images[key] = img
            loaded++
            if (loaded === total) {
              spritesRef.current = { ...spritesRef.current, ...images }
              resolve()
            }
          }
          img.onerror = () => {
            console.warn('Failed to load sprite', src)
            loaded++
            if (loaded === total) {
              spritesRef.current = { ...spritesRef.current, ...images }
              resolve()
            }
          }
        })
      })
    }

    // Reset game state
    gameStateRef.current = {
      running: true,
      score: 0,
      scoreAccumulator: 0, // Track fractional score for incremental updates
      scoreMultiplier: 1,
      player: { x: 100, y: canvas.height - 150, width: 60, height: 60, state: 'sailing', jumpVelocity: 0, bobVelocity: 0, bobbing: false, sailLevel: 1, cannonCooldown: 0, projectiles: [] },
      obstacles: [],
      waterY: canvas.height - 130,
      lastObstacleTime: 0,
      lastObstacleFrame: 0,
      gameSpeed: gameSpeedRef.current,
      frameCount: 0,
      tickCount: 0, // Tick counter for fixed-rate game logic
      lastTickTime: performance.now(),
      waiting: false,
      waitTicks: 0, // Wait duration in ticks
      waitStartTick: 0,
      stormActive: false,
      stormStartTick: 0,
      stormEndTick: 0,
      stormDuration: 1200, // Storm lasts for 1200 ticks (~5 seconds at 60 ticks/sec)
      stormGracePeriod: 240, // Grace period of 60 ticks (~1 second) before storm can cause damage
      stormFadeOutDuration: 240, // Fade-out duration after storm ends (same as grace period for symmetry)
      lastStormEndTick: 0, // Track when last storm ended to enforce grace period before new storms
      stormCooldownPeriod: 600, // Cooldown period after storm ends before new storm can start
      // Game state variables for blocks
      gameState: {
        distanceToObstacle: Infinity,
        obstacleType: null,
        obstacleHeight: 0
      }
    }

    // Update player water position
    gameStateRef.current.player.y = gameStateRef.current.waterY - gameStateRef.current.player.height
    gameStateRef.current.player.baseY = gameStateRef.current.player.y

    let animationFrameId
    let cancelled = false
    const MS_PER_TICK = 1000 / TICKS_PER_SECOND

    const gameLoop = (currentTime = performance.now()) => {
      const state = gameStateRef.current
      
      // Stop loop if game is not running and not in initial state
      if (!gameRunning && !state.running) {
        // Clear canvas when game ends (same as before first run)
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        return
      }

      // Read current game speed from ref (updated by separate useEffect)
      state.frameCount++
      state.gameSpeed = gameSpeedRef.current
      
      // Tick system: Run game logic at fixed rate, scaled by game speed
      const elapsed = currentTime - state.lastTickTime
      const ticksToProcess = Math.floor((elapsed / MS_PER_TICK) * gameSpeedRef.current)
      
      if (ticksToProcess > 0 && state.running) {
        state.lastTickTime = currentTime
        
        // Process multiple ticks if needed (catch up)
        // Cap increases with game speed to allow faster gameplay
        const maxTicksPerFrame = Math.max(5, Math.ceil(gameSpeedRef.current * 5))
        for (let i = 0; i < Math.min(ticksToProcess, maxTicksPerFrame); i++) {
          state.tickCount++
          
          // Execute algorithm with support for forever loops and if/else
          if (!state.waiting) {
            executeAlgorithm(algorithm, state)
          } else {
            // Handle wait timing (in ticks)
            if (state.tickCount - state.waitStartTick >= state.waitTicks) {
              state.waiting = false
            }
          }

          // Update player physics (scaled by game speed is handled by tick rate)
          updatePlayer(state, canvas.height)

          // Spawn obstacles
          spawnObstacles(state, canvas.width, canvas.height)

          // Update obstacles
          updateObstacles(state, canvas.width)
          
          // Update sharks: match player Y if jumping within 150 distance
          state.obstacles.forEach(obstacle => {
            if (obstacle.type === 'shark') {
              const distanceToShark = obstacle.x - (state.player.x + state.player.width)
              const isClose = distanceToShark < 150 && distanceToShark > -100
              
              if (state.player.state === 'jumping' && isClose) {
                // Shark jumps out of water to match player's Y level
                obstacle.y = state.player.y
                obstacle.baseY = state.player.y
              } else {
                // Reset shark Y to normal position when not attacking
                const normalY = state.waterY + 10
                if (obstacle.baseY !== normalY) {
                  obstacle.y = normalY
                  obstacle.baseY = normalY
                }
              }
            }
          })

          // Update storm duration event
          updateStorm(state)

          // Update game state variables for blocks
          updateGameStateVariables(state, canvas.width)

          // Update score incrementally based on multiplier (1 point per 6 ticks base rate)
          // With multiplier 1.5: 1.5 points per 6 ticks, with 0.5: 0.5 points per 6 ticks
          const scorePerTick = (1 / 6) * state.scoreMultiplier
          state.scoreAccumulator += scorePerTick
          if (state.scoreAccumulator >= 1) {
            const pointsToAdd = Math.floor(state.scoreAccumulator)
            state.score += pointsToAdd
            state.scoreAccumulator -= pointsToAdd
            // Only call onScoreChange when score actually changes
            if (pointsToAdd > 0) {
              onScoreChange(state.score)
            }
          }

          // Check collisions
          const collisionResult = checkCollisions(state)
          if (collisionResult.collided) {
            const obstacleName = collisionResult.obstacleType || 'unknown'
            const deathMessage = collisionResult.deathMessage || `Collision detected! Player collided with: ${obstacleName}`
            console.log(`${deathMessage}. Game ending. Score:`, state.score)
            state.running = false
            // Final score is already calculated incrementally above
            // Only call onGameEnd - it will set the score via handleGameEnd
            onGameEnd(state.score, deathMessage)
            // Continue to render one more frame to clear canvas
          }
        }
      }
      
      // Debug logging every 60 frames
      if (state.frameCount % 60 === 0 && state.running) {
        console.log(`Frame ${state.frameCount}, Tick ${state.tickCount}: Score=${state.score}, Obstacles=${state.obstacles.length}, Distance=${state.gameState?.distanceToObstacle?.toFixed(0) || 'Inf'}`)
      }

      // Clear canvas
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Only draw game elements if game is running
      if (state.running) {
        // Calculate grayscale progress during storm grace period and fade-out
        let grayscaleProgress = 0
        if (state.stormActive) {
          // Storm is active - fade in during grace period, then stay at 1
          const ticksSinceStormStart = state.tickCount - state.stormStartTick
          const gracePeriod = state.stormGracePeriod || 240
          grayscaleProgress = Math.min(1, ticksSinceStormStart / gracePeriod)
        } else if (state.stormEndTick > 0) {
          // Storm just ended - fade out gradually
          const ticksSinceStormEnd = state.tickCount - state.stormEndTick
          const fadeOutDuration = state.stormFadeOutDuration || 240
          if (ticksSinceStormEnd < fadeOutDuration) {
            // Fade out from 1 to 0
            grayscaleProgress = 1 - (ticksSinceStormEnd / fadeOutDuration)
          } else {
            // Fade-out complete, reset end tick
            state.stormEndTick = 0
            grayscaleProgress = 0
          }
        }
        
        // Draw background first
        drawBackground(ctx, canvas.width, canvas.height, state.waterY, state.stormActive, grayscaleProgress)
        
        // Draw obstacles behind the ocean (excluding sharks and boats)
        drawObstacles(ctx, state.obstacles.filter(o => o.type !== 'shark' && o.type !== 'boat'), state.waterY, state.tickCount, grayscaleProgress)
        
        // Draw water/ocean on top
        drawWater(ctx, canvas.width, canvas.height, state.waterY, state.stormActive, grayscaleProgress)
        
        // Draw boats and sharks over the ocean
        drawBoats(ctx, state.obstacles.filter(o => o.type === 'boat'), state.waterY, state.tickCount)
        drawSharks(ctx, state.obstacles.filter(o => o.type === 'shark'), state.waterY, state.tickCount)

        // Draw everything
        drawPlayer(ctx, state.player, state.waterY, state.tickCount)
        drawProjectiles(ctx, state.player.projectiles)

        // Draw score
        drawScore(ctx, state.score, canvas.width)
      }
      // If game ended, canvas is already cleared (same as before first run)

      animationFrameId = requestAnimationFrame((time) => gameLoop(time))
    }

    // Load sprites first (ocean background), then start game loop
    loadSprites().then(() => {
      if (!cancelled) {
        gameLoop()
      }
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(animationFrameId)
      gameStateRef.current.running = false
      window.removeEventListener('resize', handleResize)
    }
  }, [gameRunning, algorithm])

  // Calculate bobbing offset for water motion (sine wave)
  const getBobbingOffset = (tickCount, amplitude = 3, frequency = 0.05) => {
    return Math.sin(tickCount * frequency) * amplitude
  }

  const checkCondition = (condition, state) => {
    if (!condition || !condition.type) return false

    // Ensure gameState object always exists
    if (!state.gameState) {
      state.gameState = {
        distanceToObstacle: Infinity,
        obstacleType: null,
        obstacleHeight: 0,
      }
    }

    const gameState = state.gameState

    switch (condition.conditionType) {
      case 'distance_lt':
        return gameState.distanceToObstacle < (condition.value || 100)
      case 'distance_gt':
        return gameState.distanceToObstacle > (condition.value || 100)
      case 'obstacle_type':
        return gameState.obstacleType === condition.value
      case 'storm_active':
        return state.stormActive === true
      default:
        return false
    }
  }

  const executeAlgorithm = (algo, state) => {
    if (!algo || algo.length === 0) return

    // Track current execution index for this algorithm level
    if (!state.executionStack) {
      state.executionStack = []
    }

    for (const block of algo) {
      if (block.type === 'forever') {
        // Forever loop - execute children repeatedly every frame
        if (block.children && block.children.length > 0) {
          // Execute forever children - they will loop naturally since this is called every frame
          executeAlgorithm(block.children, state)
          // Note: Since executeAlgorithm is called every frame, forever loops naturally repeat
        }
      } else if (block.type === 'if' || block.type === 'ifelse') {
        // If/else blocks
        const conditionMet = checkCondition(block.condition, state)
        
        if (conditionMet && block.ifChildren) {
          executeAlgorithm(block.ifChildren, state)
        } else if (!conditionMet && block.hasElse && block.elseChildren) {
          executeAlgorithm(block.elseChildren, state)
        }
      } else if (block.type === 'wait') {
        // Wait block - set waiting state (in ticks, scales with game speed)
        if (!state.waiting) {
          state.waiting = true
          // Convert milliseconds to ticks (60 ticks per second)
          // At 1x speed: 100ms = 6 ticks, at 2x speed: 100ms = 12 ticks (wait happens faster)
          state.waitTicks = Math.max(1, Math.floor(((block.value || 100) / 1000) * TICKS_PER_SECOND))
          state.waitStartTick = state.tickCount
          return // Stop execution until wait completes
        }
      } else {
        // Regular action block - only execute if it's a valid action
        if (block.type === 'jump' || block.type === 'cannon' || block.type === 'bob' || block.type === 'sailUp' || block.type === 'sailDown' || block.type === 'wait') {
          executeAction(block.type, state)
        }
      }
    }
  }

  const executeAction = (actionType, state) => {
    const player = state.player

    switch (actionType) {
      case 'jump':
        // Jump over wave - only if on water and not already jumping or bobbing
        if (player.state === 'sailing' && !player.bobbing && player.jumpVelocity === 0 && player.bobVelocity === 0) {
          player.jumpVelocity = -10
          player.state = 'jumping'
        }
        break
      case 'cannon':
        // Shoot cannon at boat - only if cooldown is ready
        if (player.cannonCooldown <= 0) {
          player.projectiles.push({
            x: player.x + player.width,
            y: player.y + player.height / 2,
            width: 10,
            height: 10,
            speed: 8
          })
          player.cannonCooldown = 30 // Cooldown in ticks
        }
        break
      case 'bob':
        // Bob underwater - use negative gravity system (reverse jump)
        if (player.state === 'sailing' && !player.jumpVelocity && !player.bobbing) {
          player.bobbing = true
          player.bobVelocity = 3 // Start moving down (positive velocity = down)
          console.log('Bobbing started')
          player.state = 'bobbing'
        }
        break
      case 'sailUp':
        // Raise sails - faster score gain
        if (player.sailLevel < 2) {
          player.sailLevel = 2
          state.scoreMultiplier = 1.5
        }
        break
      case 'sailDown':
        // Lower sails - slower score gain
        if (player.sailLevel > 0) {
          player.sailLevel = 0
          state.scoreMultiplier = 0.5
        }
        break
    }
  }

  const updatePlayer = (state, canvasHeight) => {
    const player = state.player

    // Update cannon cooldown
    if (player.cannonCooldown > 0) {
      player.cannonCooldown--
    }

    // Update projectiles
    player.projectiles = player.projectiles.filter(proj => {
      proj.x += proj.speed
      // Remove if off screen
      return proj.x < canvasHeight * 2
    })

    // Gravity and jumping - now scales with tick rate (which scales with game speed)
    if (player.state === 'jumping') {
      player.jumpVelocity += 0.25 // Gravity per tick
      player.y += player.jumpVelocity

      if (player.y >= state.waterY - player.height) {
        player.y = state.waterY - player.height
        player.baseY = player.y // Update baseY when landing
        player.jumpVelocity = 0
        player.state = 'sailing'
      }
    }

    // Bobbing - negative gravity system (reverse jump animation)
    if (player.state === 'bobbing' || player.bobbing) {
      player.bobVelocity -= 0.07 // Negative gravity per tick (brings player back up)
      player.y += player.bobVelocity

      // Check if player has surfaced (reached water level)
      if (player.y <= state.waterY - player.height) {
        player.y = state.waterY - player.height
        player.baseY = player.y // Update baseY when surfacing
        console.log('Bobbing stopped')
        player.bobVelocity = 0
        player.bobbing = false
        player.state = 'sailing'
      }
    }

    // Reset sail level to normal if not explicitly set
    if (player.sailLevel === 2 && state.scoreMultiplier === 1.5) {
      // Sail up is active
    } else if (player.sailLevel === 0 && state.scoreMultiplier === 0.5) {
      // Sail down is active
    } else {
      // Default to normal
      player.sailLevel = 1
      state.scoreMultiplier = 1
    }
  }

  const spawnObstacles = (state, canvasWidth, canvasHeight) => {
    // Use tick-based spawning - spawn first obstacle after 30 ticks (0.5 seconds), then every 120 ticks (2 seconds)
    const minSpawnInterval = 120 // Ticks (scales automatically with game speed via tick rate)
    
    // Allow first obstacle to spawn after 30 ticks if none exist
    if (state.obstacles.length === 0) {
      if (state.tickCount < 30) return
    } else {
      if (state.tickCount - state.lastObstacleFrame < minSpawnInterval) return
    }
    
    if (state.obstacles.length >= 3) return

    const score = state.score
    const obstacleTypes = []

    // Determine available obstacles based on score
    if (score >= 0) obstacleTypes.push('wave', 'birdFlock', 'mines')
    if (score >= 500) obstacleTypes.push('boat', 'shark') // Lowered threshold for boats
    // Storms are handled separately as duration events, not regular obstacles

    // Ensure we don't spawn incompatible obstacles
    const hasBoat = state.obstacles.some(o => o.type === 'boat')
    const hasStormActive = state.stormActive

    const availableTypes = obstacleTypes

    if (availableTypes.length === 0) return

    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)]
    const obstacle = createObstacle(randomType, canvasWidth, canvasHeight, state.waterY)

    // Ensure obstacle is avoidable
    if (isObstacleAvoidable(obstacle, state.obstacles, state.player)) {
      state.obstacles.push(obstacle)
      state.lastObstacleTime = Date.now()
      state.lastObstacleFrame = state.tickCount
      console.log(`Spawned ${randomType} obstacle at tick ${state.tickCount}, x=${obstacle.x}, canvasWidth=${canvasWidth}`)
    }
  }

  const createObstacle = (type, canvasWidth, canvasHeight, waterY) => {
    const base = {
      x: canvasWidth + 50, // Spawn slightly off-screen to the right
      speed: 3, // Base speed
      id: Date.now() + Math.random()
    }

    // NOTE: When resizing obstacle visuals (width/height), keep hitboxes the same size
    // to maintain consistent collision detection. Visual size can differ from hitbox size.
    switch (type) {
      case 'wave':
        const waveY = waterY - 75
        return { ...base, type: 'wave', y: waveY, baseY: waveY, width: 120, height: 120, hitbox: { x: 0, y: 0, width: 60, height: 40 }, requiresJump: true }
      case 'boat':
        // Boat hitbox dimensions (base size, like player's 60x60)
        const boatHitboxWidth = 70
        const boatHitboxHeight = 50
        const boatY = waterY - boatHitboxHeight // Match player positioning: waterY - height (player is at waterY - player.height)
        return { ...base, type: 'boat', y: boatY, baseY: boatY, width: boatHitboxWidth, height: boatHitboxHeight, hitbox: { x: 0, y: 0, width: boatHitboxWidth, height: boatHitboxHeight }, health: 1, requiresCannon: true }
      case 'storm':
        const stormY = waterY - 150
        return { ...base, type: 'storm', y: stormY, baseY: stormY, width: 100, height: 150, hitbox: { x: 0, y: 0, width: 100, height: 150 }, requiresSailDown: true }
      case 'birdFlock':
        const birdY = waterY - 120
        return { ...base, type: 'birdFlock', y: birdY, baseY: birdY, width: 100, height: 100, hitbox: { x: 0, y: 0, width: 60, height: 30 }, requiresJumpOrBob: true }
      case 'mines':
        const mineY = waterY - 20
        return { ...base, type: 'mines', y: mineY, baseY: mineY, width: 40, height: 40, hitbox: { x: 0, y: 0, width: 20, height: 20 }, requiresJump: true, underwater: true }
      case 'shark':
        const sharkY = waterY + 10
        return { ...base, type: 'shark', y: sharkY, baseY: sharkY, width: 120, height: 120, hitbox: { x: 0, y: 0, width: 60, height: 30 }, requiresNoBob: true, underwater: true }
      default:
        const defaultY = waterY - 40
        return { ...base, type: 'wave', y: defaultY, baseY: defaultY, width: 60, height: 40, hitbox: { x: 0, y: 0, width: 60, height: 40 }, requiresJump: true }
    }
  }

  const isObstacleAvoidable = (newObstacle, existingObstacles, player) => {
    // Simple check: ensure at least one action can avoid the obstacle
    // This is a simplified version - in a full implementation, you'd check all combinations
    return true
  }

  const updateObstacles = (state, canvasWidth) => {
    state.obstacles = state.obstacles.filter(obstacle => {
      // Move obstacle left (toward player) - speed scales with tick rate (which scales with game speed)
      obstacle.x -= obstacle.speed // Speed per tick (scales automatically)
      // Only remove obstacle when it's completely off the left side of the screen
      return obstacle.x + obstacle.width > -50 // Give a bit of buffer
    })
  }

  const updateStorm = (state) => {
    // Check if storm should end
    if (state.stormActive && state.tickCount - state.stormStartTick >= state.stormDuration) {
      state.stormActive = false
      state.stormEndTick = state.tickCount
      state.lastStormEndTick = state.tickCount
      console.log('Storm ended at tick', state.tickCount, '- Fade-out period active')
    }

    // Check if we should start a storm (random chance, but not too frequent)
    // Only start if no storm is active and cooldown period has passed
    const cooldownPeriod = state.stormCooldownPeriod || 600
    const canStartNewStorm = !state.stormActive && 
                             state.tickCount > 200 && 
                             (state.tickCount - state.lastStormEndTick >= cooldownPeriod)
    
    if (canStartNewStorm && Math.random() < 0.001) {
      // 0.1% chance per tick after 200 ticks and cooldown period
      state.stormActive = true
      state.stormStartTick = state.tickCount
      state.stormEndTick = 0 // Reset end tick
      state.stormGracePeriod = 240 // Grace period of 240 ticks before storm can cause damage
      console.log('Storm started at tick', state.tickCount, '- Grace period active')
    }
  }

  const checkCollisions = (state) => {
    const player = state.player

    // Check storm collision - if storm is active and sails are not down, player sinks
    // But only after grace period has elapsed
    if (state.stormActive && player.sailLevel !== 0) {
      const ticksSinceStormStart = state.tickCount - state.stormStartTick
      const gracePeriod = state.stormGracePeriod || 60
      
      // Only cause damage after grace period
      if (ticksSinceStormStart > gracePeriod) {
        // Player must have lowered sails during storm
        return { 
          collided: true, 
          obstacleType: 'storm',
          deathMessage: 'Your ship was destroyed by the storm! Lower your sails next time!'
        }
      }
    }

    // Check projectile collisions with boats
    player.projectiles.forEach((proj, projIdx) => {
      state.obstacles.forEach((obstacle, obsIdx) => {
        if (obstacle.type === 'boat' && obstacle.health > 0) {
          // Use baseY for collision detection (not visual Y with bobbing)
          const obstacleY = obstacle.baseY !== undefined ? obstacle.baseY : obstacle.y
          if (proj.x < obstacle.x + obstacle.width &&
              proj.x + proj.width > obstacle.x &&
              proj.y < obstacleY + obstacle.height &&
              proj.y + proj.height > obstacleY) {
            obstacle.health--
            player.projectiles.splice(projIdx, 1)
            if (obstacle.health <= 0) {
              state.obstacles.splice(obsIdx, 1)
            }
          }
        }
      })
    })

    // Only check collisions if there are obstacles
    if (state.obstacles.length === 0) return { collided: false }

    for (const obstacle of state.obstacles) {
      // Skip boats that have been destroyed
      if (obstacle.type === 'boat' && obstacle.health <= 0) continue
      
      // Skip storm obstacles - storms are duration events, not positional collisions
      if (obstacle.type === 'storm') continue
      
      // Only check obstacles that are on screen and approaching
      if (obstacle.x + obstacle.width < player.x - 50) continue // Already passed
      if (obstacle.x > player.x + player.width + 50) continue // Too far ahead

      // Special check for sharks: if player is jumping within 150 distance, always kill
      // (Shark Y matching is handled in the update loop)
      if (obstacle.type === 'shark') {
        const distanceToShark = obstacle.x - (player.x + player.width)
        const isClose = distanceToShark < 150 && distanceToShark > -100
        
        if (player.state === 'jumping' && isClose) {
          // Always kill when player jumps near shark
          return { 
            collided: true, 
            obstacleType: 'shark',
            deathMessage: 'A shark jumped out of the water and ate you!'
          }
        }
      }

      const playerLeft = player.x
      const playerRight = player.x + player.width
      const playerTop = player.y
      const playerBottom = player.y + player.height

      // Use baseY for collision detection (not visual Y with bobbing)
      const obstacleY = obstacle.baseY !== undefined ? obstacle.baseY : obstacle.y
      
      const obstacleLeft = obstacle.x + obstacle.hitbox.x
      const obstacleRight = obstacle.x + obstacle.hitbox.x + obstacle.hitbox.width
      const obstacleTop = obstacleY + obstacle.hitbox.y
      const obstacleBottom = obstacleY + obstacle.hitbox.y + obstacle.hitbox.height

      // Check if player can avoid this obstacle
      let canAvoid = false

      if (obstacle.requiresJump) {
        // Wave, Mines - need to jump over
        canAvoid = player.state === 'jumping' && player.y < obstacleTop - 10
      } else if (obstacle.requiresCannon) {
        // Boat - need to shoot with cannon (handled above, or get hit)
        canAvoid = false // If boat reaches player without being shot, collision
      } else if (obstacle.requiresJumpOrBob) {
        // Bird flock - can jump or bob
        canAvoid = (player.state === 'jumping' && player.y < obstacleTop - 5) || player.bobbing
      } else if (obstacle.requiresNoBob) {
        // Shark - must NOT bob (stay on surface)
        canAvoid = !player.bobbing && player.y >= state.waterY - player.height
        
        // If collision with shark, provide specific death message
        if (!canAvoid && playerRight > obstacleLeft && 
            playerLeft < obstacleRight && 
            playerBottom > obstacleTop && 
            playerTop < obstacleBottom) {
          // Determine death message based on player state
          let deathMessage = 'A shark got you!'
          if (player.bobbing) {
            deathMessage = 'A shark got you underwater!'
          } else if (player.state === 'jumping') {
            deathMessage = 'A shark jumped out of the water and ate you!'
          }
          return { collided: true, obstacleType: obstacle.type, deathMessage: deathMessage }
        }
      }

      // Check collision - only if actually overlapping
      if (playerRight > obstacleLeft && 
          playerLeft < obstacleRight && 
          playerBottom > obstacleTop && 
          playerTop < obstacleBottom && 
          !canAvoid) {
        // Provide death message based on obstacle type
        let deathMessage = ''
        switch (obstacle.type) {
          case 'wave':
            deathMessage = 'You crashed into a wave!'
            break
          case 'boat':
            deathMessage = 'An enemy boat rammed into you!'
            break
          case 'birdFlock':
            deathMessage = 'You were hit by a flock of birds!'
            break
          case 'mines':
            deathMessage = 'You hit a mine!'
            break
          case 'shark':
            // Shark messages are handled above
            deathMessage = 'A shark got you!'
            break
          default:
            deathMessage = `You collided with a ${obstacle.type}!`
        }
        return { collided: true, obstacleType: obstacle.type, deathMessage: deathMessage }
      }
    }

    return { collided: false }
  }

  const drawBackground = (ctx, width, height, waterY, stormActive = false, grayscaleProgress = 0) => {
    const sprites = spritesRef.current || {}
    
    // Apply grayscale filter based on storm progress
    if (grayscaleProgress > 0) {
      ctx.filter = `grayscale(${grayscaleProgress * 100}%)`
    } else {
      ctx.filter = 'none'
    }
    
    // Draw background sprite (full canvas)
    const backgroundSprite = sprites.background
    if (backgroundSprite) {
      const bgAspectRatio =  backgroundSprite.width /backgroundSprite.height
      const bgWidth = width  * bgAspectRatio
      const bgHeight = height 
      const bgY = height - (bgHeight * 1) // Anchor to bottom
      
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(backgroundSprite, 0, bgY, bgWidth, bgHeight)
      ctx.imageSmoothingEnabled = true
    } else {
      // Fallback: draw sky (gray if storm is active)
      if (stormActive) {
        ctx.fillStyle = '#708090' // Gray sky during storm
      } else {
        ctx.fillStyle = '#87CEEB' // Normal blue sky
      }
      ctx.fillRect(0, 0, width, waterY)
      
      // Draw storm clouds if storm is active
      if (stormActive) {
        ctx.fillStyle = '#2F2F2F'
        for (let i = 0; i < width; i += 150) {
          const cloudX = (i + (Date.now() / 10) % 150) % width
          const cloudY = 50 + Math.sin(i / 100) * 20
          ctx.beginPath()
          ctx.arc(cloudX, cloudY, 30, 0, Math.PI * 2)
          ctx.arc(cloudX + 40, cloudY, 35, 0, Math.PI * 2)
          ctx.arc(cloudX + 80, cloudY, 30, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
    
    // Reset filter after drawing background
    ctx.filter = 'none'
  }

  const drawWater = (ctx, width, height, waterY, stormActive = false, grayscaleProgress = 0) => {
    const sprites = spritesRef.current || {}
    
    // Apply grayscale filter based on storm progress
    if (grayscaleProgress > 0) {
      ctx.filter = `grayscale(${grayscaleProgress * 100}%)`
    } else {
      ctx.filter = 'none'
    }
    
    // Draw ocean sprite
    const oceanSprite = sprites.ocean
    if (oceanSprite) {
      // Draw ocean sprite at the bottom of the canvas
      // Width equals canvas width, height scales proportionally
      const spriteAspectRatio = oceanSprite.height / oceanSprite.width
      const spriteWidth = width // Width equals canvas width
      const spriteHeight = spriteWidth * spriteAspectRatio // Height scales proportionally with width
      
      // Position sprite at the bottom of the canvas
      const spriteY = height - spriteHeight
      
      // Disable image smoothing for crisp pixel art
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(oceanSprite, 0, spriteY, spriteWidth, spriteHeight)
      // Re-enable smoothing for other graphics (optional, but good practice)
      ctx.imageSmoothingEnabled = true
    } else {
      console.log('No ocean sprite found')
      // Fallback: draw solid water color (darker if storm is active)
      if (stormActive) {
        ctx.fillStyle = '#1C3A5E' // Darker water during storm
      } else {
        ctx.fillStyle = '#1E90FF' // Normal blue water
      }
      ctx.fillRect(0, waterY, width, height - waterY)
    }
    
    // Reset filter after drawing water
    ctx.filter = 'none'
  }

  const drawPlayer = (ctx, player, waterY, tickCount) => {
    ctx.save()

    const sprites = spritesRef.current || {}
    const shipSprite = sprites.ship

    // Calculate bobbing offset for water motion (only when sailing, not jumping or bobbing)
    let visualY = player.y
    if (player.state === 'sailing' && player.jumpVelocity === 0 && !player.bobbing && player.baseY !== undefined) {
      const bobbingOffset = getBobbingOffset(tickCount, 3, 0.05)
      visualY = player.baseY + bobbingOffset
    }

    // Draw ship (Roscoe Raider) - use visual Y position with bobbing
    // Ship hull - either sprite or fallback rectangle
    // Draw sprite at 3x size (180x180) but keep hitbox at 60x60 (50% bigger than 2x)
    const spriteScale = 3
    const spriteWidth = player.width * spriteScale
    const spriteHeight = player.height * spriteScale
    const spriteX = player.x - (spriteWidth - player.width) / 2 // Center sprite on hitbox
    const spriteY = visualY - (spriteHeight - player.height) / 2 // Center sprite on hitbox
    
    if (shipSprite) {
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(shipSprite, spriteX, spriteY, spriteWidth, spriteHeight)
      ctx.imageSmoothingEnabled = true
    } else {
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(player.x, player.y, player.width, player.height)
    }
    
    // Only draw mast and sails if ship top is at or above water level
    const shipTop = player.y
    const waterLevel = waterY - player.height
    
    if (shipTop <= waterLevel) {

      /*
      // Ship mast
      ctx.fillStyle = '#654321'
      const mastHeight = player.sailLevel === 2 ? 40 : player.sailLevel === 0 ? 20 : 30
      const mastY = shipTop - mastHeight
      ctx.fillRect(player.x + player.width / 2 - 2, mastY, 4, mastHeight)
      
      // Sails based on sail level
      if (player.sailLevel === 2) {
        // Sails up - full sails
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(player.x + player.width / 2, shipTop - 35, 25, 30)
      } else if (player.sailLevel === 0) {
        // Sails down - lowered
        ctx.fillStyle = '#CCCCCC'
        ctx.fillRect(player.x + player.width / 2, shipTop - 15, 20, 10)
      } else {
        // Normal sails
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(player.x + player.width / 2, shipTop - 25, 22, 20)
      }
      
      // Ship flag (MSOE colors)
      ctx.fillStyle = '#98191C'
      ctx.fillRect(player.x + player.width / 2, mastY - 5, 8, 12)
      */
    }
      
    ctx.restore()
  }

  const drawProjectiles = (ctx, projectiles) => {
    projectiles.forEach(proj => {
      ctx.save()
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(proj.x + proj.width/2, proj.y + proj.height/2, proj.width/2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  const drawSharks = (ctx, sharks, waterY, tickCount) => {
    const sprites = spritesRef.current || {}
    const sharkSprite = sprites.shark

    sharks.forEach(obstacle => {
      ctx.save()

      // Calculate visual Y with bobbing offset for sharks
      let visualY = obstacle.y
      if (obstacle.baseY !== undefined) {
        const bobbingOffset = getBobbingOffset(tickCount + obstacle.id % 100, 3, 0.05)
        visualY = obstacle.baseY + bobbingOffset
      }

      if (sharkSprite) {
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(sharkSprite, obstacle.x, visualY, obstacle.width, obstacle.height)
        ctx.imageSmoothingEnabled = true
      } else {
        // Fallback: draw vector shark
        ctx.fillStyle = '#708090'
        ctx.beginPath()
        ctx.ellipse(obstacle.x + obstacle.width/2, visualY + obstacle.height/2, obstacle.width/2, obstacle.height/2, 0, 0, Math.PI * 2)
        ctx.fill()
        // Shark fin
        ctx.fillStyle = '#556B2F'
        ctx.beginPath()
        ctx.moveTo(obstacle.x + obstacle.width/2, visualY)
        ctx.lineTo(obstacle.x + obstacle.width/2 - 10, visualY - 10)
        ctx.lineTo(obstacle.x + obstacle.width/2 + 10, visualY - 10)
        ctx.closePath()
        ctx.fill()
        // Eye
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(obstacle.x + obstacle.width/2 + 10, visualY + obstacle.height/2 - 5, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    })
  }

  const drawBoats = (ctx, boats, waterY, tickCount) => {
    const sprites = spritesRef.current || {}
    const enemyBoatSprite = sprites.enemyBoat

    boats.forEach(obstacle => {
      ctx.save()

      // Calculate visual Y with bobbing offset for boats
      let visualY = obstacle.y
      if (obstacle.baseY !== undefined) {
        const bobbingOffset = getBobbingOffset(tickCount + obstacle.id % 100, 3, 0.05)
        visualY = obstacle.baseY + bobbingOffset
      }

      // Draw enemy boat using sprite at 3x size (like player)
      if (enemyBoatSprite) {
        const spriteScale = 3
        const spriteWidth = obstacle.width * spriteScale
        const spriteHeight = obstacle.height * spriteScale
        const spriteX = obstacle.x - (spriteWidth - obstacle.width) / 2 // Center sprite on hitbox
        const spriteY = visualY - (spriteHeight - obstacle.height) / 2 // Center sprite on hitbox
        
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(enemyBoatSprite, spriteX, spriteY, spriteWidth, spriteHeight)
        ctx.imageSmoothingEnabled = true
      } else {
        // Fallback: draw enemy boat at 3x size (like player)
        const spriteScale = 3
        const spriteWidth = obstacle.width * spriteScale
        const spriteHeight = obstacle.height * spriteScale
        const spriteX = obstacle.x - (spriteWidth - obstacle.width) / 2 // Center sprite on hitbox
        const spriteY = visualY - (spriteHeight - obstacle.height) / 2 // Center sprite on hitbox
        
        // Draw boat hull at 3x size
        ctx.fillStyle = '#654321'
        ctx.fillRect(spriteX, spriteY, spriteWidth, spriteHeight)
        // Boat mast (scaled 3x)
        ctx.fillStyle = '#8B4513'
        const mastWidth = 4 * spriteScale
        const mastHeight = 20 * spriteScale
        ctx.fillRect(spriteX + spriteWidth/2 - mastWidth/2, spriteY - mastHeight, mastWidth, mastHeight)
        // Boat flag (scaled 3x)
        ctx.fillStyle = '#000000'
        const flagWidth = 6 * spriteScale
        const flagHeight = 10 * spriteScale
        ctx.fillRect(spriteX + spriteWidth/2, spriteY - mastHeight - flagHeight, flagWidth, flagHeight)
        // Cannon on boat (scaled 3x)
        ctx.fillStyle = '#333'
        const cannonWidth = 15 * spriteScale
        const cannonHeight = 8 * spriteScale
        ctx.fillRect(spriteX + 10 * spriteScale, spriteY + 10 * spriteScale, cannonWidth, cannonHeight)
      }

      ctx.restore()
    })
  }

  const drawObstacles = (ctx, obstacles, waterY, tickCount, grayscaleProgress = 0) => {
    const sprites = spritesRef.current || {}
    const waveSprite = sprites.wave
    const mineSprite = sprites.mine
    const birdSprite = sprites.bird
    const bird1Sprite = sprites.bird1
    const bird2Sprite = sprites.bird2

    obstacles.forEach(obstacle => {
      ctx.save()

      // Calculate visual Y with bobbing offset (except for birds)
      let visualY = obstacle.y
      if (obstacle.type !== 'birdFlock' && obstacle.baseY !== undefined) {
        const bobbingOffset = getBobbingOffset(tickCount + obstacle.id % 100, 3, 0.05)
        visualY = obstacle.baseY + bobbingOffset
      }

      switch (obstacle.type) {
        case 'wave':
          // Apply grayscale filter for waves during storms
          if (grayscaleProgress > 0) {
            ctx.filter = `grayscale(${grayscaleProgress * 100}%)`
          } else {
            ctx.filter = 'none'
          }
          
          if (waveSprite) {
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(waveSprite, obstacle.x, visualY, obstacle.width, obstacle.height)
            ctx.imageSmoothingEnabled = true
          }
          
          // Reset filter after drawing wave
          ctx.filter = 'none'
          break
        case 'storm':
          // Draw storm cloud
          ctx.fillStyle = '#2F2F2F'
          ctx.beginPath()
          ctx.arc(obstacle.x + 30, visualY + 30, 25, 0, Math.PI * 2)
          ctx.arc(obstacle.x + 60, visualY + 30, 30, 0, Math.PI * 2)
          ctx.arc(obstacle.x + 90, visualY + 30, 25, 0, Math.PI * 2)
          ctx.fill()
          // Lightning
          ctx.strokeStyle = '#FFD700'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(obstacle.x + 50, visualY + 20)
          ctx.lineTo(obstacle.x + 60, visualY + 60)
          ctx.lineTo(obstacle.x + 70, visualY + 40)
          ctx.stroke()
          break
        case 'birdFlock':
          // Draw bird flock using animated bird sprites (no bobbing for birds)
          // Cycle between bird1 and bird2 every 10 ticks for animation
          const birdAnimationFrame = Math.floor((tickCount + obstacle.id % 20) / 60) % 2
          const currentBirdSprite = birdAnimationFrame === 0 ? bird1Sprite : bird2Sprite
          
          if (currentBirdSprite) {
            ctx.imageSmoothingEnabled = false
            // Draw bird sprite using obstacle's width and height from JSON/creation
            ctx.drawImage(currentBirdSprite, obstacle.x, obstacle.y, obstacle.width, obstacle.height)
            ctx.imageSmoothingEnabled = true
          } else if (birdSprite) {
            // Fallback to single bird sprite if bird1/bird2 not available
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(birdSprite, obstacle.x, obstacle.y, obstacle.width, obstacle.height)
            ctx.imageSmoothingEnabled = true
          } else {
            // Fallback: draw vector bird flock
            ctx.fillStyle = '#000000'
            for (let i = 0; i < 5; i++) {
              const birdX = obstacle.x + (i * 15)
              const birdY = obstacle.y + 10 + Math.sin(i) * 5
              ctx.beginPath()
              ctx.arc(birdX, birdY, 5, 0, Math.PI * 2)
              ctx.fill()
            }
          }
          break
        case 'mines':
          if (mineSprite) {
            // Center the mine sprite around the obstacle position
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(
              mineSprite,
              obstacle.x,
              visualY,
              obstacle.width,
              obstacle.height
            )
            ctx.imageSmoothingEnabled = true
          } else {
            // Fallback: draw vector mine
            ctx.fillStyle = '#FFD700'
            ctx.beginPath()
            ctx.arc(obstacle.x + obstacle.width/2, waterY + obstacle.height/2, obstacle.width/2, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = '#FFA500'
            ctx.lineWidth = 2
            ctx.stroke()
            // Spikes
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2
              const spikeX = obstacle.x + obstacle.width/2 + Math.cos(angle) * (obstacle.width/2 + 3)
              const spikeY = waterY + obstacle.height/2 + Math.sin(angle) * (obstacle.width/2 + 3)
              ctx.beginPath()
              ctx.moveTo(obstacle.x + obstacle.width/2, waterY + obstacle.height/2)
              ctx.lineTo(spikeX, spikeY)
              ctx.stroke()
            }
          }
          break
        default:
          break
      }

      ctx.restore()
    })
  }

  const updateGameStateVariables = (state, canvasWidth) => {
    // Ensure gameState object always exists (defensive against hot-reload / stale state)
    if (!state.gameState) {
      state.gameState = {
        distanceToObstacle: Infinity,
        obstacleType: null,
        obstacleHeight: 0,
      }
    }

    const player = state.player
    const obstacles = state.obstacles
    
    // Find the closest obstacle ahead of the player
    let closestObstacle = null
    let minDistance = Infinity
    
    for (const obstacle of obstacles) {
      if (obstacle.x > player.x) {
        const distance = obstacle.x - (player.x + player.width)
        if (distance < minDistance) {
          minDistance = distance
          closestObstacle = obstacle
        }
      }
    }
    
    // Update game state variables
    state.gameState.distanceToObstacle = closestObstacle ? minDistance : Infinity
    state.gameState.obstacleType = closestObstacle ? closestObstacle.type : null
    state.gameState.obstacleHeight = closestObstacle ? closestObstacle.height : 0
  }

  const drawScore = (ctx, score, width) => {
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`Score: ${score}`, 20, 40)
  }


  const handleForceEnd = () => {
    if (gameStateRef.current.running) {
      gameStateRef.current.running = false
      onGameEnd(gameStateRef.current.score, 'Game ended manually')
    }
  }

  return (
    <div className="game-canvas-container">
      <canvas ref={canvasRef} className="game-canvas" />
      {gameRunning && (
        <div className="game-controls">
          <div className="speed-controls">
            <button 
              onClick={() => setGameSpeed(prev => Math.max(prev - 0.5, 0.5))}
              className="speed-button speed-down"
              disabled={gameSpeed <= 0.5}
            >
              Slow
            </button>
            <span className="speed-display">Speed: {gameSpeed}x</span>
            <button 
              onClick={() => setGameSpeed(prev => Math.min(prev + 0.5, 5))}
              className="speed-button speed-up"
              disabled={gameSpeed >= 5}
            >
              Fast
            </button>
          </div>
          <button 
            onClick={handleForceEnd}
            className="end-button"
          >
            End Game
          </button>
        </div>
      )}
      {!gameRunning && (
        <div className="game-start-message">
          <h2>Roscoe Raider on the High Seas</h2>
          <p>Build your algorithm using blocks, then click "Run Algorithm" to start!</p>
        </div>
      )}
    </div>
  )
}

export default GameCanvas

