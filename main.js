// Main entry point for Emoji Card Battle
// This file initializes the game engine, state management, and card system

// Import core modules
import { initializeGameLoop } from './src/core/engine.js';
import { initializeGameState } from './src/core/state.js';
import { initializeSaveSystem } from './src/core/SaveSystem.js';

// Import UI modules
import { initializeHUD } from './src/ui/HUD.js';
import { initializeHand } from './src/ui/Hand.js';
import { initializeGameOverScreen } from './src/ui/GameOverScreen.js';

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    console.log('Emoji Card Battle - Game Initializing...');

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

    // Start the game loop
    gameLoop.start();

    console.log('Game initialized successfully!');
});