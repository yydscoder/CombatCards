/**
 * Game Engine Module for Emoji Card Battle
 * 
 * This module implements the core game loop and turn management system.
 * The game loop uses requestAnimationFrame for smooth, efficient rendering.
 * The turn manager handles the progression of turns and game state transitions.
 * 
 * Key responsibilities:
 * 1. Managing the main game loop using requestAnimationFrame
 * 2. Handling timing and frame rate consistency
 * 3. Managing turn progression and state transitions
 * 4. Providing hooks for game events (start, end, turn change)
 * 5. Coordinating between game state and UI updates
 */

// Import configuration constants
import { GAME_CONFIG } from './config.js';

/**
 * GameLoop class - Manages the main game loop
 * 
 * This class encapsulates the game loop functionality, providing methods to start,
 * stop, and pause the loop. It uses requestAnimationFrame for optimal performance
 * and ensures consistent frame timing regardless of browser tab focus state.
 */
export class GameLoop {
    /**
     * Creates a new GameLoop instance
     * @param {Object} gameState 
     */
    constructor(gameState) {
        // Store reference to game state for access during loop execution
        this.gameState = gameState;
        
        // Track the current animation frame request ID for cancellation
        this.animationFrameId = null;
        
        // Track the last timestamp when the loop was executed
        this.lastTimestamp = 0;
        
        // Track whether the loop is currently running
        this.isRunning = false;
        
        // Track whether the loop is paused
        this.isPaused = false;
        
        // Store the callback function that will be executed each frame
        this.updateCallback = null;
        
        // Initialize the game loop with default settings
        console.log('GameLoop initialized with gameState reference');
    }
    
    /**
     * Starts the game loop
     * 
     * This method initiates the main game loop by calling requestAnimationFrame
     * and setting the isRunning flag to true. It also initializes the lastTimestamp
     * to the current time to ensure proper frame timing calculation.
     */
    start() {
        if (this.isRunning) {
            console.warn('Game loop is already running');
            return;
        }
        
        // Set the running flag to true
        this.isRunning = true;
        
        // Initialize the last timestamp to the current time
        this.lastTimestamp = performance.now();
        
        // Log the start of the game loop
        console.log('Game loop started at', new Date().toLocaleTimeString());
        
        // Begin the animation frame cycle
        this._loop(performance.now());
    }
    
    /**
     * Stops the game loop
     * 
     * This method cancels the current animation frame request and sets the
     * isRunning flag to false, effectively stopping the game loop.
     */
    stop() {
        if (!this.isRunning) {
            console.warn('Game loop is not running');
            return;
        }
        
        // Cancel the current animation frame request
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Set the running flag to false
        this.isRunning = false;
        
        // Log the stop of the game loop
        console.log('Game loop stopped at', new Date().toLocaleTimeString());
    }
    
    /**
     * Pauses the game loop
     * 
     * This method sets the isPaused flag to true, which will cause the loop
     * to skip execution of the update callback until resumed.
     */
    pause() {
        if (!this.isRunning) {
            console.warn('Cannot pause a non-running game loop');
            return;
        }
        
        this.isPaused = true;
        console.log('Game loop paused at', new Date().toLocaleTimeString());
    }
    
    /**
     * Resumes the game loop
     * 
     * This method sets the isPaused flag to false, allowing the loop to
     * resume execution of the update callback.
     */
    resume() {
        if (!this.isRunning) {
            console.warn('Cannot resume a non-running game loop');
            return;
        }
        
        this.isPaused = false;
        console.log('Game loop resumed at', new Date().toLocaleTimeString());
    }
    
    /**
     * Sets the update callback function
     * 
     * This method allows external code to provide a function that will be
     * called during each frame of the game loop. The callback receives
     * the delta time since the last frame as a parameter.
     * 
     * @param {Function} callback - The function to call each frame
     */
    setUpdateCallback(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Update callback must be a function');
        }
        
        this.updateCallback = callback;
        console.log('Update callback set for game loop');
    }
    
    /**
     * The main loop function
     * 
     * This private method is called recursively via requestAnimationFrame
     * and handles the core game loop logic. It calculates the delta time
     * between frames and calls the update callback if it exists.
     * 
     * @param {number} timestamp - The current timestamp from requestAnimationFrame
     */
    _loop(timestamp) {
        // Calculate the time difference since the last frame
        const deltaTime = timestamp - this.lastTimestamp;
        
        // Update the last timestamp for the next iteration
        this.lastTimestamp = timestamp;
        
        // If the loop is running and not paused, execute the update callback
        if (this.isRunning && !this.isPaused && this.updateCallback) {
            // Call the update callback with the delta time
            try {
                this.updateCallback(deltaTime);
            } catch (error) {
                console.error('Error in game loop update callback:', error);
            }
        }
        
        // Schedule the next frame
        this.animationFrameId = requestAnimationFrame((newTimestamp) => {
            this._loop(newTimestamp);
        });
    }
}

/**
 * TurnManager class - Manages game turns and state transitions
 * 
 * This class handles the progression of turns in the game, including
 * turn counting, phase management, and game state transitions.
 * It provides methods to advance turns, check win/loss conditions,
 * and manage turn-specific game logic.
 */
export class TurnManager {
    /**
     * Creates a new TurnManager instance
     * @param {Object} gameState - Reference to the game state object
     */
    constructor(gameState) {
        // Store reference to game state for access during turn management
        this.gameState = gameState;
        
        // Track the current turn number
        this.currentTurn = 1;
        
        // Track the current turn phase (e.g., 'player', 'enemy', 'end')
        this.currentPhase = 'player';
        
        // Track whether the game is over
        this.isGameOver = false;
        
        // Track the reason for game over (win/loss)
        this.gameOverReason = null;
        
        // Store the turn start time for timing calculations
        this.turnStartTime = null;
        
        // Log the initialization of the turn manager
        console.log('TurnManager initialized with gameState reference');
    }
    
    /**
     * Advances to the next turn
     *
     * This method increments the turn counter and transitions to the next
     * phase of the game. It also checks for win/loss conditions and
     * updates the game state accordingly. Mana is regenerated at the start of each turn.
     */
    advanceTurn() {
        // Check if the game is already over
        if (this.isGameOver) {
            console.warn('Cannot advance turn: game is already over');
            return;
        }

        // Increment the turn counter
        this.currentTurn++;

        // Regenerate mana at the start of each turn (3 mana per turn, max 10)
        const manaRegen = GAME_CONFIG.MANA_PER_TURN;
        const newMana = Math.min(
            GAME_CONFIG.PLAYER_MAX_MANA,
            this.gameState.playerMana + manaRegen
        );
        this.gameState.updatePlayerMana(newMana);
        console.log(`Turn ${this.currentTurn}: Regenerated ${manaRegen} mana (now ${this.gameState.playerMana}/${GAME_CONFIG.PLAYER_MAX_MANA})`);

        // Reset the turn start time
        this.turnStartTime = performance.now();

        // Log the turn advancement
        console.log(`Advancing to turn ${this.currentTurn} at`, new Date().toLocaleTimeString());

        // Update the game state with the new turn number
        this.gameState.turnCount = this.currentTurn;

        // Check for game over conditions
        this._checkGameOverConditions();

        // If the game is not over, transition to the player phase
        if (!this.isGameOver) {
            this.currentPhase = 'player';
            console.log('Turn phase set to: player');
        }
    }
    
    /**
     * Ends the current turn phase
     * 
     * This method transitions to the next phase within the current turn.
     * For example, from 'player' to 'enemy' or from 'enemy' to 'end'.
     */
    endCurrentPhase() {
        // Check if the game is already over
        if (this.isGameOver) {
            console.warn('Cannot end phase: game is already over');
            return;
        }
        
        // Transition to the next phase based on the current phase
        switch (this.currentPhase) {
            case 'player':
                this.currentPhase = 'enemy';
                console.log('Turn phase set to: enemy');
                break;
            case 'enemy':
                this.currentPhase = 'end';
                console.log('Turn phase set to: end');
                break;
            case 'end':
                // At the end of turn, advance to the next turn
                this.advanceTurn();
                break;
            default:
                console.warn(`Unknown turn phase: ${this.currentPhase}`);
                break;
        }
        
        // Update the game state with the new phase
        this.gameState.currentPhase = this.currentPhase;
    }
    
    /**
     * Checks for game over conditions
     * 
     * This private method evaluates the current game state to determine
     * if the game should end due to win or loss conditions.
     */
    _checkGameOverConditions() {
        // Check if player has won (enemy HP <= 0)
        if (this.gameState.enemyHp <= 0) {
            this.isGameOver = true;
            this.gameOverReason = 'player_win';
            console.log('Player victory detected at turn', this.currentTurn);
            return;
        }
        
        // Check if player has lost (player HP <= 0)
        if (this.gameState.playerHp <= 0) {
            this.isGameOver = true;
            this.gameOverReason = 'player_loss';
            console.log('Player defeat detected at turn', this.currentTurn);
            return;
        }
        
        // Check if turn limit has been reached
        if (this.currentTurn > GAME_CONFIG.MAX_TURN_COUNT) {
            this.isGameOver = true;
            this.gameOverReason = 'turn_limit';
            console.log('Turn limit reached at turn', this.currentTurn);
            return;
        }
        
        // Check if turn time limit has been exceeded
        if (this.turnStartTime && 
            (performance.now() - this.turnStartTime) > GAME_CONFIG.TURN_TIME_LIMIT_MS) {
            this.isGameOver = true;
            this.gameOverReason = 'time_limit';
            console.log('Turn time limit exceeded at turn', this.currentTurn);
            return;
        }
    }
    
    /**
     * Resets the turn manager to initial state
     * 
     * This method resets all turn-related state variables to their initial values.
     */
    reset() {
        this.currentTurn = 1;
        this.currentPhase = 'player';
        this.isGameOver = false;
        this.gameOverReason = null;
        this.turnStartTime = null;
        
        // Update the game state with reset values
        this.gameState.turnCount = 1;
        this.gameState.currentPhase = 'player';
        
        console.log('TurnManager reset to initial state');
    }
}

/**
 * Initializes the game loop system
 * 
 * This function creates and returns a configured GameLoop instance
 * with appropriate callbacks for game state updates and rendering.
 * 
 * @param {Object} gameState - The game state object to manage
 * @returns {GameLoop} A configured GameLoop instance
 */
export function initializeGameLoop(gameState) {
    // Create a new GameLoop instance
    const gameLoop = new GameLoop(gameState);
    
    // Create a new TurnManager instance
    const turnManager = new TurnManager(gameState);
    
    // Store the turn manager in the game state for access
    gameState.turnManager = turnManager;
    
    // Set up the update callback for the game loop
    gameLoop.setUpdateCallback((deltaTime) => {
        // Update game state based on delta time
        // In a real implementation, this would handle physics, animations, etc.
        
        // Log the frame update with delta time
        if (GAME_CONFIG.ENABLE_DEBUG_LOGS && 
            GAME_CONFIG.LOG_LEVEL === 'debug') {
            console.debug(`Frame update: deltaTime=${deltaTime.toFixed(2)}ms`);
        }
        
        // Update the turn manager (in a real game, this would be more sophisticated)
        // For now, we'll just log the current turn and phase
        if (gameState.turnManager) {
            console.log(`Current turn: ${gameState.turnManager.currentTurn}, Phase: ${gameState.turnManager.currentPhase}`);
        }
    });
    
    // Return the configured game loop
    return gameLoop;
}