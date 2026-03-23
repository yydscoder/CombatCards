/**
 * Game Engine Module for Emoji Card Battle
 *
 * This module implements the core game loop and turn management system.
 * The game loop uses requestAnimationFrame for smooth, efficient rendering.
 * The turn manager handles the progression of turns and state transitions.
 * The energy manager handles deterministic energy tracking (Slay the Spire style).
 *
 * Design Philosophy: Slay the Spire-style deterministic combat
 * - Fixed energy per turn (resets each turn)
 * - Explicit energy spend/gain tracking
 * - Clean separation of concerns
 *
 * @module core/engine
 */

// Import configuration constants
import { GAME_CONFIG } from './config.js';

// ───────────────────────────────────────────────────────────────────────────────
// GameLoop Class
// ───────────────────────────────────────────────────────────────────────────────

/**
 * GameLoop class - Manages the main game loop
 *
 * This class encapsulates the game loop functionality, providing methods to start,
 * stop, and pause the loop. It uses requestAnimationFrame for optimal performance
 * and ensures consistent frame timing regardless of browser tab focus state.
 *
 * @example
 * const gameLoop = new GameLoop(gameState);
 * gameLoop.setUpdateCallback((deltaTime) => {
 *     console.log(`Frame update: ${deltaTime}ms`);
 * });
 * gameLoop.start();
 */
export class GameLoop {
    /**
     * Creates a new GameLoop instance
     *
     * @param {Object} gameState - Reference to the game state object
     */
    constructor(gameState) {
        /**
         * @private
         * @type {Object}
         * @description Reference to the game state
         */
        this.gameState = gameState;

        /**
         * @private
         * @type {number|null}
         * @description Current animation frame request ID
         */
        this.animationFrameId = null;

        /**
         * @private
         * @type {number}
         * @description Last timestamp when the loop was executed
         */
        this.lastTimestamp = 0;

        /**
         * @type {boolean}
         * @description Whether the loop is currently running
         */
        this.isRunning = false;

        /**
         * @type {boolean}
         * @description Whether the loop is paused
         */
        this.isPaused = false;

        /**
         * @private
         * @type {Function|null}
         * @description Callback function executed each frame
         */
        this.updateCallback = null;

        console.log('[GameLoop] Initialized with gameState reference');
    }

    /**
     * Starts the game loop
     *
     * @returns {Object} Start result
     *
     * @example
     * gameLoop.start();
     */
    start() {
        if (this.isRunning) {
            console.warn('[GameLoop] Already running');
            return { success: false, reason: 'already_running' };
        }

        this.isRunning = true;
        this.lastTimestamp = performance.now();

        console.log('[GameLoop] Started at', new Date().toLocaleTimeString());

        this._loop(performance.now());

        return { success: true };
    }

    /**
     * Stops the game loop
     *
     * @returns {Object} Stop result
     *
     * @example
     * gameLoop.stop();
     */
    stop() {
        if (!this.isRunning) {
            console.warn('[GameLoop] Not running');
            return { success: false, reason: 'not_running' };
        }

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.isRunning = false;

        console.log('[GameLoop] Stopped at', new Date().toLocaleTimeString());

        return { success: true };
    }

    /**
     * Pauses the game loop
     *
     * @returns {Object} Pause result
     *
     * @example
     * gameLoop.pause();
     */
    pause() {
        if (!this.isRunning) {
            console.warn('[GameLoop] Cannot pause: not running');
            return { success: false, reason: 'not_running' };
        }

        this.isPaused = true;
        console.log('[GameLoop] Paused at', new Date().toLocaleTimeString());

        return { success: true };
    }

    /**
     * Resumes the game loop
     *
     * @returns {Object} Resume result
     *
     * @example
     * gameLoop.resume();
     */
    resume() {
        if (!this.isRunning) {
            console.warn('[GameLoop] Cannot resume: not running');
            return { success: false, reason: 'not_running' };
        }

        this.isPaused = false;
        console.log('[GameLoop] Resumed at', new Date().toLocaleTimeString());

        return { success: true };
    }

    /**
     * Sets the update callback function
     *
     * @param {Function} callback - Function to call each frame (receives deltaTime)
     * @returns {Object} Result
     *
     * @example
     * gameLoop.setUpdateCallback((deltaTime) => {
     *     console.log(`Frame update: ${deltaTime}ms`);
     * });
     */
    setUpdateCallback(callback) {
        if (typeof callback !== 'function') {
            throw new Error('[GameLoop] Update callback must be a function');
        }

        this.updateCallback = callback;
        console.log('[GameLoop] Update callback set');

        return { success: true };
    }

    /**
     * The main loop function (private)
     *
     * @private
     * @param {number} timestamp - Current timestamp from requestAnimationFrame
     */
    _loop(timestamp) {
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        if (this.isRunning && !this.isPaused && this.updateCallback) {
            try {
                this.updateCallback(deltaTime);
            } catch (error) {
                console.error('[GameLoop] Error in update callback:', error);
            }
        }

        this.animationFrameId = requestAnimationFrame((newTimestamp) => {
            this._loop(newTimestamp);
        });
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// EnergyManager Class (NEW - Slay the Spire Style)
// ───────────────────────────────────────────────────────────────────────────────

/**
 * EnergyManager class - Manages player energy (Slay the Spire style)
 *
 * This class handles all energy-related operations:
 * - Resetting energy at turn start
 * - Spending energy to play cards
 * - Gaining temporary energy (relics, buffs)
 * - Tracking energy history for debugging
 *
 * Design: Fixed 3 energy per turn that resets (no scaling)
 *
 * @example
 * const energyManager = new EnergyManager(gameState);
 * energyManager.reset(); // Start of turn: 3 energy
 * energyManager.spend(2); // Play 2-cost card: 1 energy left
 * energyManager.gain(1); // Gain 1 energy: 2 energy
 */
export class EnergyManager {
    /**
     * Creates a new EnergyManager instance
     *
     * @param {Object} gameState - Reference to the game state object
     */
    constructor(gameState) {
        /**
         * @private
         * @type {Object}
         * @description Reference to the game state
         */
        this.gameState = gameState;

        /**
         * @type {number}
         * @description Current energy value
         */
        this.energy = GAME_CONFIG.PLAYER_ENERGY;

        /**
         * @type {number}
         * @description Maximum energy cap
         */
        this.maxEnergy = GAME_CONFIG.PLAYER_MAX_ENERGY;

        /**
         * @type {number}
         * @description Temporary energy bonus (from relics, buffs)
         */
        this.temporaryEnergy = 0;

        /**
         * @private
         * @type {Array<Object>}
         * @description History of energy changes for debugging
         */
        this.energyHistory = [];

        console.log('[EnergyManager] Initialized:', this.getSummary());
    }

    /**
     * Resets energy to maximum at the start of a turn
     *
     * @returns {Object} Reset result with new energy value
     *
     * @example
     * energyManager.reset();
     * console.log(`Energy reset to ${energyManager.energy}`);
     */
    reset() {
        const oldEnergy = this.energy;

        // Reset to base maximum (temporary energy is lost)
        this.energy = this.maxEnergy;
        this.temporaryEnergy = 0;

        this._logHistory('reset', oldEnergy, this.energy);

        console.log('[EnergyManager] Reset to', this.energy, '/', this.maxEnergy);

        // Sync with gameState
        if (this.gameState) {
            this.gameState.energy = this.energy;
            this.gameState.maxEnergy = this.maxEnergy;
        }

        return {
            success: true,
            energy: this.energy,
            maxEnergy: this.maxEnergy
        };
    }

    /**
     * Spends energy to play a card or use an ability
     *
     * @param {number} amount - Amount of energy to spend
     * @returns {Object} Result with success status and remaining energy
     *
     * @example
     * const result = energyManager.spend(2);
     * if (result.success) {
     *     console.log(`Spent 2 energy, ${result.remaining} remaining`);
     * } else {
     *     console.log(`Not enough energy: need ${result.required}, have ${result.remaining}`);
     * }
     */
    spend(amount) {
        const oldEnergy = this.energy;

        if (this.energy < amount) {
            this._logHistory('spend_failed', oldEnergy, oldEnergy, amount);

            return {
                success: false,
                reason: 'insufficient_energy',
                remaining: this.energy,
                required: amount,
                canAfford: false
            };
        }

        this.energy -= amount;
        this._logHistory('spend', oldEnergy, this.energy, amount);

        console.log('[EnergyManager] Spent', amount, '→', this.energy, '/', this.maxEnergy);

        // Sync with gameState
        if (this.gameState) {
            this.gameState.energy = this.energy;
        }

        return {
            success: true,
            remaining: this.energy,
            spent: amount,
            canAfford: true
        };
    }

    /**
     * Gains energy (up to maximum)
     *
     * @param {number} amount - Amount of energy to gain
     * @param {boolean} [temporary=false] - Whether the energy is temporary (lost on turn reset)
     * @returns {Object} Result with new energy value
     *
     * @example
     * energyManager.gain(1, true); // Gain 1 temporary energy
     */
    gain(amount, temporary = false) {
        const oldEnergy = this.energy;
        const oldMaxEnergy = this.maxEnergy;

        if (temporary) {
            // Temporary energy can exceed max
            this.energy = Math.min(this.energy + amount, this.maxEnergy + this.temporaryEnergy + amount);
            this.temporaryEnergy += amount;
        } else {
            // Permanent energy gain (capped at max)
            this.energy = Math.min(this.maxEnergy, this.energy + amount);
        }

        this._logHistory('gain', oldEnergy, this.energy, amount, temporary);

        console.log('[EnergyManager] Gained', amount, temporary ? '(temp)' : '', '→', this.energy, '/', this.maxEnergy);

        // Sync with gameState
        if (this.gameState) {
            this.gameState.energy = this.energy;
        }

        return {
            success: true,
            energy: this.energy,
            maxEnergy: this.maxEnergy,
            gained: amount,
            temporary: temporary
        };
    }

    /**
     * Checks if a cost can be afforded
     *
     * @param {number} cost - The energy cost to check
     * @returns {boolean} Whether the cost can be afforded
     *
     * @example
     * if (energyManager.canAfford(3)) {
     *     console.log('Can play 3-cost card!');
     * }
     */
    canAfford(cost) {
        return this.energy >= cost;
    }

    /**
     * Gets the current energy as a summary object
     *
     * @returns {Object} Energy summary
     */
    getSummary() {
        return {
            energy: this.energy,
            maxEnergy: this.maxEnergy,
            temporaryEnergy: this.temporaryEnergy,
            canAfford1: this.canAfford(1),
            canAfford2: this.canAfford(2),
            canAfford3: this.canAfford(3)
        };
    }

    /**
     * Logs an energy change to the history
     *
     * @private
     * @param {string} type - Type of change: 'reset', 'spend', 'gain'
     * @param {number} from - Previous energy value
     * @param {number} to - New energy value
     * @param {number} [amount] - Amount changed
     * @param {boolean} [temporary] - Whether it was temporary
     */
    _logHistory(type, from, to, amount = 0, temporary = false) {
        this.energyHistory.push({
            type,
            from,
            to,
            amount,
            temporary,
            timestamp: Date.now(),
            turn: this.gameState?.turn || 1
        });

        // Keep history limited to last 100 entries
        if (this.energyHistory.length > 100) {
            this.energyHistory.shift();
        }
    }

    /**
     * Resets the energy manager to initial state
     *
     * @returns {Object} Reset result
     */
    resetManager() {
        this.energy = GAME_CONFIG.PLAYER_ENERGY;
        this.maxEnergy = GAME_CONFIG.PLAYER_MAX_ENERGY;
        this.temporaryEnergy = 0;
        this.energyHistory = [];

        console.log('[EnergyManager] Manager reset');

        return { success: true };
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// TurnManager Class (Updated for Energy System)
// ───────────────────────────────────────────────────────────────────────────────

/**
 * TurnManager class - Manages game turns and state transitions
 *
 * This class handles the progression of turns in the game, including
 * turn counting, phase management, and game state transitions.
 * Updated for Slay the Spire-style energy system.
 *
 * @example
 * const turnManager = new TurnManager(gameState, energyManager);
 * turnManager.startTurn();
 * turnManager.endTurn();
 */
export class TurnManager {
    /**
     * Creates a new TurnManager instance
     *
     * @param {Object} gameState - Reference to the game state object
     * @param {EnergyManager} [energyManager] - Reference to the energy manager
     */
    constructor(gameState, energyManager = null) {
        /**
         * @private
         * @type {Object}
         * @description Reference to the game state
         */
        this.gameState = gameState;

        /**
         * @private
         * @type {EnergyManager|null}
         * @description Reference to the energy manager
         */
        this.energyManager = energyManager;

        /**
         * @type {number}
         * @description Current turn number
         */
        this.currentTurn = 1;

        /**
         * @type {string}
         * @description Current turn phase: 'player', 'enemy', 'end'
         */
        this.currentPhase = 'player';

        /**
         * @type {boolean}
         * @description Whether the game is over
         */
        this.isGameOver = false;

        /**
         * @type {string|null}
         * @description Reason for game over
         */
        this.gameOverReason = null;

        /**
         * @private
         * @type {number|null}
         * @description Turn start timestamp
         */
        this.turnStartTime = null;

        console.log('[TurnManager] Initialized with energy system');
    }

    /**
     * Starts a new turn
     *
     * @returns {Object} Turn start result
     *
     * @example
     * const result = turnManager.startTurn();
     * console.log(`Turn ${result.turn}: ${result.energy} energy`);
     */
    startTurn() {
        if (this.isGameOver) {
            return { success: false, reason: 'game_over' };
        }

        // Increment turn
        this.currentTurn++;
        this.turnStartTime = performance.now();

        // Reset energy
        if (this.energyManager) {
            this.energyManager.reset();
        }

        // Update game state
        if (this.gameState) {
            this.gameState.turn = this.currentTurn;
            this.gameState.phase = 'player';
        }

        this.currentPhase = 'player';

        console.log('[TurnManager] Turn', this.currentTurn, 'started');

        return {
            success: true,
            turn: this.currentTurn,
            phase: this.currentPhase,
            energy: this.energyManager?.energy || 3
        };
    }

    /**
     * Ends the current turn
     *
     * @returns {Object} Turn end result
     *
     * @example
     * const result = turnManager.endTurn();
     * if (result.success) {
     *     console.log(`Turn ended, next: ${result.nextPhase}`);
     * }
     */
    endTurn() {
        if (this.isGameOver) {
            return { success: false, reason: 'game_over' };
        }

        // Transition to enemy phase
        this.currentPhase = 'enemy';

        if (this.gameState) {
            this.gameState.phase = this.currentPhase;
        }

        console.log('[TurnManager] Turn', this.currentTurn, 'ended, enemy phase');

        return {
            success: true,
            nextPhase: this.currentPhase,
            turn: this.currentTurn
        };
    }

    /**
     * Checks for game over conditions
     *
     * @private
     * @returns {Object|null} Game over result or null if game continues
     */
    _checkGameOver() {
        // Player lost
        if (this.gameState?.playerHp <= 0) {
            this.isGameOver = true;
            this.gameOverReason = 'player_loss';
            console.log('[TurnManager] Player defeated at turn', this.currentTurn);
            return {
                isGameOver: true,
                reason: 'player_loss'
            };
        }

        // Player won (enemy defeated)
        if (this.gameState?.enemyHp <= 0) {
            this.isGameOver = true;
            this.gameOverReason = 'player_win';
            console.log('[TurnManager] Enemy defeated at turn', this.currentTurn);
            return {
                isGameOver: true,
                reason: 'player_win'
            };
        }

        // Turn limit reached
        if (this.currentTurn >= GAME_CONFIG.MAX_TURN_COUNT) {
            this.isGameOver = true;
            this.gameOverReason = 'timeout';
            console.log('[TurnManager] Turn limit reached');
            return {
                isGameOver: true,
                reason: 'timeout'
            };
        }

        return null;
    }

    /**
     * Resets the turn manager to initial state
     *
     * @returns {Object} Reset result
     */
    reset() {
        this.currentTurn = 1;
        this.currentPhase = 'player';
        this.isGameOver = false;
        this.gameOverReason = null;
        this.turnStartTime = null;

        if (this.gameState) {
            this.gameState.turn = 1;
            this.gameState.phase = 'player';
        }

        console.log('[TurnManager] Reset to initial state');

        return { success: true };
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Initialization Function
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Initializes the game loop system with EnergyManager
 *
 * @param {Object} gameState - The game state object to manage
 * @returns {Object} Initialized managers object
 *
 * @example
 * const { gameLoop, energyManager, turnManager } = initializeGameLoop(gameState);
 */
export function initializeGameLoop(gameState) {
    // Create EnergyManager
    const energyManager = new EnergyManager(gameState);

    // Create GameLoop
    const gameLoop = new GameLoop(gameState);

    // Create TurnManager with EnergyManager
    const turnManager = new TurnManager(gameState, energyManager);

    // Store references in gameState
    gameState.energyManager = energyManager;
    gameState.turnManager = turnManager;
    gameState.engine = gameLoop;

    // Set up update callback
    gameLoop.setUpdateCallback((deltaTime) => {
        if (GAME_CONFIG.ENABLE_DEBUG_LOGS && GAME_CONFIG.LOG_LEVEL === 'debug') {
            console.debug(`[Engine] Frame: ${deltaTime.toFixed(2)}ms`);
        }
    });

    console.log('[Engine] Full system initialized');

    return {
        gameLoop,
        energyManager,
        turnManager
    };
}

export default {
    GameLoop,
    EnergyManager,
    TurnManager,
    initializeGameLoop
};
