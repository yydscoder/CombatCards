// Main entry point for Emoji Card Battle - Survivor Mode
// This file initializes the game engine, state management, and round-based progression

// Import core modules
import { initializeGameLoop, GameLoop, TurnManager, EnergyManager } from './src/core/engine.js';
import { GameState, initializeGameState } from './src/core/state.js';
import { initializeSaveSystem } from './src/core/SaveSystem.js';
import { GAME_CONFIG } from './src/core/config.js';

// Import UI modules
import { initializeHUD } from './src/ui/HUD.js';
import { initializeHand } from './src/ui/Hand.js';
import { initializeGameOverScreen } from './src/ui/GameOverScreen.js';

// Import survivor mode - round manager
import { createRoundManager } from './src/levels/index.js';

// Global game references
window.gameRefs = {};

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Emoji Card Battle - Survivor Mode Initializing...');

    // Initialize round manager (survivor progression)
    const roundManager = createRoundManager();
    window.roundManager = roundManager;

    // Get current stats
    const stats = roundManager.getStats();
    console.log(`📊 Best Round: ${stats.bestRound} | Total Kills: ${stats.totalKills} | Total Gold: ${stats.totalGold}`);

    // Initialize game state (using class)
    const gameState = new GameState();

    // Initialize energy manager
    const energyManager = new EnergyManager(gameState);
    gameState.energyManager = energyManager;

    // Initialize turn manager
    const turnManager = new TurnManager(gameState, energyManager);
    gameState.turnManager = turnManager;

    // Initialize save system
    const saveSystem = initializeSaveSystem();

    // Initialize game loop
    const gameLoop = new GameLoop(gameState);
    gameLoop.setUpdateCallback((deltaTime) => {
        // Frame update logic
    });

    // Initialize HUD
    const hud = initializeHUD(gameState);

    // Initialize game-over screen
    const gameOverScreen = initializeGameOverScreen(saveSystem);

    // Initialize hand
    const hand = initializeHand(gameState, hud, saveSystem, gameOverScreen);

    // Store global references
    window.gameRefs = {
        gameState,
        gameLoop,
        energyManager,
        turnManager,
        hud,
        hand,
        saveSystem,
        gameOverScreen,
        roundManager
    };

    // Update round display in HUD
    updateRoundDisplay(stats);

    // Add new run button listener
    const newRunBtn = document.getElementById('new-run-btn');
    if (newRunBtn) {
        newRunBtn.addEventListener('click', () => {
            if (confirm('Start a new run? Your current progress will be lost (best round and gold are saved).')) {
                startNewRun();
            }
        });
    }

    // Start the first round
    startRound();

    // Start the game loop
    gameLoop.start();

    // Initialize drop zones for drag-to-target
    initializeDropZones(hand);

    console.log('✅ Survivor Mode initialized successfully!');
});

/**
 * Initializes drop zones for drag-to-target functionality
 * @param {Object} hand - Hand instance
 */
function initializeDropZones(hand) {
    const playerArea = document.getElementById('player-area');
    const enemyArea = document.getElementById('enemy-area');

    if (!playerArea || !enemyArea) {
        console.warn('[DropZones] Drop zone elements not found');
        return;
    }

    // Make areas accept drops
    playerArea.setAttribute('data-drop-target', 'player');
    enemyArea.setAttribute('data-drop-target', 'enemy');

    // Player drop zone
    playerArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        playerArea.classList.add('drop-target');
        console.log('[DropZones] Dragging over PLAYER');
    });

    playerArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        playerArea.classList.remove('drop-target');
    });

    playerArea.addEventListener('drop', (e) => {
        e.preventDefault();
        playerArea.classList.remove('drop-target');
        console.log('[DropZones] Dropped on PLAYER');
        
        const data = e.dataTransfer.getData('text/plain');
        console.log('[DropZones] Raw data:', data);
        
        let cardId;
        try {
            const parsed = JSON.parse(data);
            cardId = parsed.cardId;
            console.log('[DropZones] Parsed JSON cardId:', cardId);
        } catch (err) {
            cardId = data;
            console.log('[DropZones] Plain cardId:', cardId);
        }
        
        const card = hand.cards.find(c => c.id === cardId);
        console.log('[DropZones] Card found:', card ? card.name : 'NOT FOUND');
        
        if (card) {
            console.log('[DropZones] Casting', card.name, 'on PLAYER');
            castCardOnTarget(card, 'player', hand);
        }
    });

    // Enemy drop zone
    enemyArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        enemyArea.classList.add('drop-target');
        console.log('[DropZones] Dragging over ENEMY');
    });

    enemyArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        enemyArea.classList.remove('drop-target');
    });

    enemyArea.addEventListener('drop', (e) => {
        e.preventDefault();
        enemyArea.classList.remove('drop-target');
        console.log('[DropZones] Dropped on ENEMY');
        
        const data = e.dataTransfer.getData('text/plain');
        console.log('[DropZones] Raw data:', data);
        
        let cardId;
        try {
            const parsed = JSON.parse(data);
            cardId = parsed.cardId;
            console.log('[DropZones] Parsed JSON cardId:', cardId);
        } catch (err) {
            cardId = data;
            console.log('[DropZones] Plain cardId:', cardId);
        }
        
        const card = hand.cards.find(c => c.id === cardId);
        console.log('[DropZones] Card found:', card ? card.name : 'NOT FOUND');
        
        if (card) {
            console.log('[DropZones] Casting', card.name, 'on ENEMY');
            castCardOnTarget(card, 'enemy', hand);
        }
    });

    console.log('[DropZones] Drop zones initialized');
}

/**
 * Casts a card on a target (enemy or player)
 * @param {Object} card - Card to cast
 * @param {string} targetType - 'enemy' or 'player'
 * @param {Object} hand - Hand instance
 */
function castCardOnTarget(card, targetType, hand) {
    console.log(`[DropZones] Casting ${card.name} on ${targetType}`);
    
    // Create a fake event object
    const fakeEvent = {
        preventDefault: () => {},
        stopPropagation: () => {}
    };
    
    // Call hand's handleCardClick which handles the actual casting
    if (hand && hand.handleCardClick) {
        hand.handleCardClick(card, fakeEvent);
    } else {
        console.warn('[DropZones] No hand handler!');
    }
}

/**
 * Updates the round display in the HUD
 *
 * @param {Object} stats - Round manager stats
 */
function updateRoundDisplay(stats) {
    const currentRoundEl = document.getElementById('current-round');
    const bestRoundEl = document.getElementById('best-round');
    
    if (currentRoundEl) currentRoundEl.textContent = stats.currentRound;
    if (bestRoundEl) bestRoundEl.textContent = stats.bestRound;
}

/**
 * Starts a new round
 *
 * @returns {Object} Round start result
 */
function startRound() {
    const roundManager = window.roundManager;
    const gameState = window.gameRefs.gameState;
    
    // Start the round
    const roundInfo = roundManager.startRound();
    
    if (!roundInfo.success) {
        console.error('Failed to start round:', roundInfo.reason);
        return roundInfo;
    }

    // Update HUD
    updateRoundDisplay(roundManager.getStats());

    // Set enemy in game state
    gameState.enemy = roundInfo.enemy;
    gameState.enemyMaxHp = roundInfo.enemyStats.hp;
    gameState.enemyHp = roundInfo.enemyStats.hp;
    gameState.enemyAttackInterval = roundInfo.enemy.attackInterval || 1;
    gameState.enemyAttackCooldown = gameState.enemyAttackInterval;

    // Update enemy display
    updateEnemyDisplay(roundInfo.enemy, roundInfo.enemyStats);
    if (window.gameRefs?.hud) {
        window.gameRefs.hud.reinitEnemyHealthBar(); // Re-init with new enemy max HP
        window.gameRefs.hud.updateAll();
    }

    // Show milestone if applicable
    if (roundInfo.milestone) {
        console.log(`🏆 MILESTONE: ${roundInfo.milestone.name} - ${roundInfo.milestone.description}`);
    }

    console.log(`⚔️ Round ${roundInfo.round}: ${roundInfo.enemyStats.name} appears!`);

    return roundInfo;
}

/**
 * Updates the enemy display in the battle field
 *
 * @param {Object} enemy - Enemy instance
 * @param {Object} stats - Enemy stats
 */
function updateEnemyDisplay(enemy, stats) {
    const enemyEmojiEl = document.getElementById('enemy-emoji');
    const enemyNameEl = document.getElementById('enemy-name');
    
    if (enemyEmojiEl) enemyEmojiEl.textContent = stats.emoji;
    if (enemyNameEl) {
        const bossTag = stats.isBoss ? ' 👑 BOSS' : '';
        enemyNameEl.textContent = `${stats.name}${bossTag}`;
    }
}

/**
 * Starts a new run (resets round counter)
 */
function startNewRun() {
    const roundManager = window.roundManager;
    const gameState = window.gameRefs.gameState;
    const hand = window.gameRefs.hand;
    const hud = window.gameRefs.hud;
    const turnManager = gameState.turnManager;

    console.log('[startNewRun] Starting new run...');

    // Reset run progress
    roundManager.resetRun();

    // Reset game state (this resets HP, energy, effects, etc.)
    gameState.reset();

    // Reset energy manager
    if (energyManager) {
        energyManager.reset();
    }

    // Reset turn manager
    if (turnManager) {
        turnManager.reset();
    }

    // Clear the hand UI
    if (hand) {
        hand.cards = [];
        if (hand.handContainer) {
            hand.handContainer.innerHTML = '';
        }
    }

    // Update display
    updateRoundDisplay(roundManager.getStats());

    // Start first round (this will set up the enemy)
    const roundResult = startRound();

    // Set starting energy explicitly for turn 1
    if (energyManager) {
        energyManager.reset();
        console.log(`[startNewRun] Energy set to ${gameState.energy}/${gameState.maxEnergy}`);
    }

    // Re-initialize hand with new cards (after round starts so enemy exists)
    if (hand) {
        hand.gameState = gameState;
        hand.initHand();
        console.log('[startNewRun] Hand re-initialized with', hand.cards.length, 'cards');
    }

    // Force update HUD
    if (hud) {
        hud.updateAll();
    }

    console.log('🆕 New run started! Good luck!');
}

/**
 * Completes the current round and starts the next
 *
 * @returns {Object} Completion result
 */
function completeRound() {
    const roundManager = window.roundManager;
    const gameState = window.gameRefs.gameState;
    const turnManager = gameState.turnManager;

    // Complete current round
    const completeResult = roundManager.completeRound();

    if (!completeResult.success) {
        return completeResult;
    }

    console.log(`💰 Round complete! +${completeResult.goldReward} gold (Total: ${completeResult.totalGold})`);

    // Player progression: small boosts per round
    const hpGain = 5;
    const manaGain = (completeResult.round % 2 === 0) ? 1 : 0;
    gameState.playerMaxHp += hpGain;
    gameState.playerMaxMana = Math.min(20, gameState.playerMaxMana + manaGain);
    gameState.updatePlayerHp(gameState.playerMaxHp);
    gameState.updatePlayerMana(gameState.playerMaxMana);

    // Reset turn counter for new round
    if (turnManager) {
        turnManager.reset();
        console.log('[completeRound] Turn counter reset for new round');
    }

    // Advance to next round
    const nextResult = roundManager.nextRound();

    // Update display
    updateRoundDisplay(roundManager.getStats());

    // Start next round after a brief delay
    setTimeout(() => {
        startRound();
    }, 1000);

    return { success: true, completeResult, nextResult };
}

/**
 * Handles player defeat
 *
 * @returns {Object} Game over result
 */
function onPlayerDefeat() {
    const roundManager = window.roundManager;
    const result = roundManager.playerDefeated();
    
    console.log(`💀 Game Over! ${result.message}`);
    
    return result;
}

// Expose functions globally for other modules to use
window.survivorMode = {
    startRound,
    completeRound,
    onPlayerDefeat,
    startNewRun
};