// Main entry point for Emoji Card Battle - Survivor Mode
// This file initializes the game engine, state management, and round-based progression

// Import core modules
import { initializeGameLoop } from './src/core/engine.js';
import { initializeGameState } from './src/core/state.js';
import { initializeSaveSystem } from './src/core/SaveSystem.js';

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

    // Initialize game state
    const gameState = initializeGameState();

    // Initialize save system
    const saveSystem = initializeSaveSystem();

    // Initialize game loop
    const gameLoop = initializeGameLoop(gameState);

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

    console.log('✅ Survivor Mode initialized successfully!');
});

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

    // Update enemy display
    updateEnemyDisplay(roundInfo.enemy, roundInfo.enemyStats);

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
    
    // Reset run progress
    roundManager.resetRun();
    
    // Reset game state
    gameState.reset();
    
    // Update display
    updateRoundDisplay(roundManager.getStats());
    
    // Start first round
    startRound();
    
    console.log('🆕 New run started! Good luck!');
}

/**
 * Completes the current round and starts the next
 *
 * @returns {Object} Completion result
 */
function completeRound() {
    const roundManager = window.roundManager;
    
    // Complete current round
    const completeResult = roundManager.completeRound();
    
    if (!completeResult.success) {
        return completeResult;
    }

    console.log(`💰 Round complete! +${completeResult.goldReward} gold (Total: ${completeResult.totalGold})`);

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