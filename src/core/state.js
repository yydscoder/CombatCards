/**
 * Game State Management Module for Emoji Card Battle
 *
 * This module implements the core game state management system.
 * It provides a class-based structure for managing all game variables,
 * including player health, enemy health, energy, turn count, and card piles.
 *
 * Design Philosophy: Slay the Spire-style deterministic state management
 * - Single source of truth for all game data
 * - Class-based structure with explicit methods
 * - Deterministic turn progression
 *
 * @module core/GameState
 */

// Import configuration constants
import { GAME_CONFIG } from './config.js';
import { cardKeeper, buildEffectLog } from './cardKeeper.js';

/**
 * GameState Class
 *
 * Manages all game state variables and provides methods for safe state manipulation.
 * This class serves as the single source of truth for all game data.
 *
 * @example
 * const gameState = new GameState();
 * gameState.startTurn();
 * gameState.drawCard();
 * gameState.endTurn();
 */
export class GameState {
    /**
     * Creates a new GameState instance
     *
     * @param {Object} [options] - Optional configuration overrides
     * @param {number} [options.playerMaxHp] - Override player max HP
     * @param {number} [options.enemyMaxHp] - Override enemy max HP
     */
    constructor(options = {}) {
        // ───────────────────────────────────────────────────────────────────────
        // Player State
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {number}
         * @description Current player health points
         */
        this.playerHp = options.playerMaxHp ?? GAME_CONFIG.PLAYER_START_HP;

        /**
         * @type {number}
         * @description Maximum player health points
         */
        this.playerMaxHp = options.playerMaxHp ?? GAME_CONFIG.PLAYER_MAX_HP;

        /**
         * @type {number}
         * @description Current energy points (resets each turn)
         */
        this.energy = GAME_CONFIG.PLAYER_ENERGY;

        /**
         * @type {number}
         * @description Maximum energy points
         */
        this.maxEnergy = GAME_CONFIG.PLAYER_MAX_ENERGY;

        /**
         * @type {Object<string, Object>}
         * @description Active shields: { bubble: {count, absorb}, flame: {remaining} }
         */
        this.playerShields = {};

        // ───────────────────────────────────────────────────────────────────────
        // Enemy State
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {number}
         * @description Current enemy health points
         */
        this.enemyHp = GAME_CONFIG.ENEMY_START_HP;

        /**
         * @type {number}
         * @description Maximum enemy health points
         */
        this.enemyMaxHp = GAME_CONFIG.ENEMY_MAX_HP;

        /**
         * @type {Object|null}
         * @description Reference to the enemy instance
         */
        this.enemy = null;

        /**
         * @type {number}
         * @description Enemy attacks every N turns
         */
        this.enemyAttackInterval = 1;

        /**
         * @type {number}
         * @description Turns remaining until enemy attack
         */
        this.enemyAttackCooldown = 1;

        // ───────────────────────────────────────────────────────────────────────
        // Turn & Phase State
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {number}
         * @description Current turn number (starts at 1)
         */
        this.turn = 1;

        /**
         * @type {string}
         * @description Current turn phase: 'player', 'enemy', 'end'
         */
        this.phase = 'player';

        /**
         * @type {boolean}
         * @description Whether the game has ended
         */
        this.isGameOver = false;

        /**
         * @type {string|null}
         * @description Reason for game over: 'player_win', 'player_loss', 'timeout'
         */
        this.gameOverReason = null;

        // ───────────────────────────────────────────────────────────────────────
        // Combat State
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {number}
         * @description Damage dealt in the last action
         */
        this.lastDamageDealt = 0;

        /**
         * @type {number}
         * @description Damage taken in the last action
         */
        this.lastDamageTaken = 0;

        /**
         * @type {boolean}
         * @description Whether the last hit was a critical hit
         */
        this.isCriticalHit = false;

        // ───────────────────────────────────────────────────────────────────────
        // Card Pile State (managed by CardPileManager)
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {Object|null}
         * @description Reference to the CardPileManager instance
         */
        this.cardPileManager = null;

        // ───────────────────────────────────────────────────────────────────────
        // Effects & Cooldowns
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {Array<Object>}
         * @description Array of currently active effects (poison, stun, etc.)
         */
        this.activeEffects = [];

        /**
         * @type {Object<string, number>}
         * @description Object tracking cooldowns for abilities
         */
        this.cooldowns = {};

        // ───────────────────────────────────────────────────────────────────────
        // Debug State
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {boolean}
         * @description Whether debug mode is enabled
         */
        this.debugMode = GAME_CONFIG.ENABLE_DEBUG_LOGS;

        /**
         * @type {number}
         * @description Timestamp of last state update
         */
        this.lastUpdateTimestamp = performance.now();

        /**
         * @type {number}
         * @description Number of frames processed
         */
        this.frameCount = 0;

        // ───────────────────────────────────────────────────────────────────────
        // References
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {Object|null}
         * @description Reference to the turn manager instance
         */
        this.turnManager = null;

        /**
         * @type {Object|null}
         * @description Reference to the game engine instance
         */
        this.engine = null;

        // Log initialization
        console.log('[GameState] Initialized with Slay the Spire-style mechanics');
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Turn Management Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Starts a new turn
     *
     * This method:
     * 1. Increments the turn counter
     * 2. Resets energy to maximum
     * 3. Sets phase to 'player'
     * 4. Draws cards up to starting hand size
     *
     * @returns {Object} Turn start result with turn number and energy
     *
     * @example
     * const result = gameState.startTurn();
     * console.log(`Turn ${result.turn}: ${result.energy} energy`);
     */
    startTurn() {
        if (this.isGameOver) {
            console.warn('[GameState] Cannot start turn: game is over');
            return { success: false, reason: 'game_over' };
        }

        // Increment turn counter
        this.turn++;

        // Reset energy to maximum
        this.energy = this.maxEnergy;

        // Set phase to player
        this.phase = 'player';

        // Log turn start
        console.log(`[GameState] Turn ${this.turn} started: ${this.energy}/${this.maxEnergy} energy`);

        return {
            success: true,
            turn: this.turn,
            energy: this.energy,
            maxEnergy: this.maxEnergy
        };
    }

    /**
     * Ends the current turn
     *
     * This method:
     * 1. Discards all cards in hand
     * 2. Advances to enemy phase
     * 3. Triggers enemy actions
     *
     * @returns {Object} Turn end result with next phase
     *
     * @example
     * const result = gameState.endTurn();
     * if (result.success) {
     *     console.log(`Turn ended, next phase: ${result.nextPhase}`);
     * }
     */
    endTurn() {
        if (this.isGameOver) {
            console.warn('[GameState] Cannot end turn: game is over');
            return { success: false, reason: 'game_over' };
        }

        // Discard all cards in hand (StS rule: hand discards at end of turn)
        if (this.cardPileManager) {
            this.cardPileManager.discardHand();
        }

        // Advance to enemy phase
        this.phase = 'enemy';

        console.log(`[GameState] Turn ${this.turn} ended, entering enemy phase`);

        return {
            success: true,
            nextPhase: this.phase,
            turn: this.turn
        };
    }

    /**
     * Draws a card from the draw pile to hand
     *
     * This method:
     * 1. Checks if hand is at max size
     * 2. Checks if draw pile is empty (reshuffle if needed)
     * 3. Draws one card from draw pile to hand
     *
     * @param {number} [count=1] - Number of cards to draw
     * @returns {Object} Draw result with drawn cards or reason for failure
     *
     * @example
     * const result = gameState.drawCard(2);
     * if (result.success) {
     *     console.log(`Drew ${result.cards.length} cards`);
     * }
     */
    drawCard(count = 1) {
        if (!this.cardPileManager) {
            console.warn('[GameState] Cannot draw: no CardPileManager');
            return { success: false, reason: 'no_pile_manager' };
        }

        const drawResult = this.cardPileManager.drawCard(count);

        if (drawResult.success) {
            console.log(`[GameState] Drew ${drawResult.cards.length} card(s)`);
        } else {
            console.warn(`[GameState] Could not draw: ${drawResult.reason}`);
        }

        return drawResult;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Player State Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Updates player health points
     *
     * @param {number} newHp - The new health value
     * @returns {number} The clamped health value
     *
     * @example
     * gameState.updatePlayerHp(75);
     * console.log(`Player HP: ${gameState.playerHp}/${gameState.playerMaxHp}`);
     */
    updatePlayerHp(newHp) {
        this.playerHp = Math.max(0, Math.min(this.playerMaxHp, newHp));

        if (this.debugMode && GAME_CONFIG.LOG_LEVEL === 'info') {
            console.log(`[GameState] Player HP: ${this.playerHp}/${this.playerMaxHp}`);
        }

        return this.playerHp;
    }

    /**
     * Updates enemy health points
     *
     * @param {number} newHp - The new health value
     * @returns {number} The clamped health value
     *
     * @example
     * gameState.updateEnemyHp(50);
     * console.log(`Enemy HP: ${gameState.enemyHp}/${gameState.enemyMaxHp}`);
     */
    updateEnemyHp(newHp) {
        this.enemyHp = Math.max(0, Math.min(this.enemyMaxHp, newHp));

        // Sync with enemy object if it exists
        if (this.enemy && typeof this.enemy.hp !== 'undefined') {
            this.enemy.hp = this.enemyHp;
        }

        if (this.debugMode && GAME_CONFIG.LOG_LEVEL === 'info') {
            console.log(`[GameState] Enemy HP: ${this.enemyHp}/${this.enemyMaxHp}`);
        }

        return this.enemyHp;
    }

    /**
     * Gains energy (up to maximum)
     *
     * @param {number} amount - Amount of energy to gain
     * @returns {number} The new energy value
     *
     * @example
     * gameState.gainEnergy(1);
     * console.log(`Energy: ${gameState.energy}/${gameState.maxEnergy}`);
     */
    gainEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);

        if (this.debugMode) {
            console.log(`[GameState] Gained ${amount} energy: ${this.energy}/${this.maxEnergy}`);
        }

        return this.energy;
    }

    /**
     * Spends energy
     *
     * @param {number} amount - Amount of energy to spend
     * @returns {Object} Result with success status and remaining energy
     *
     * @example
     * const result = gameState.spendEnergy(2);
     * if (result.success) {
     *     console.log(`Spent 2 energy, ${result.remaining} remaining`);
     * }
     */
    spendEnergy(amount) {
        if (this.energy < amount) {
            return {
                success: false,
                reason: 'insufficient_energy',
                remaining: this.energy,
                required: amount
            };
        }

        this.energy -= amount;

        if (this.debugMode) {
            console.log(`[GameState] Spent ${amount} energy: ${this.energy}/${this.maxEnergy} remaining`);
        }

        return {
            success: true,
            remaining: this.energy,
            spent: amount
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Shield Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Adds a shield to the player
     *
     * @param {string} shieldName - Name of the shield (e.g., 'bubble', 'flame')
     * @param {Object} shieldData - Shield data { count, absorbPerBubble } or { remaining }
     * @returns {Object} The added shield data
     *
     * @example
     * gameState.addShield('bubble', { count: 3, absorbPerBubble: 5 });
     */
    addShield(shieldName, shieldData) {
        this.playerShields[shieldName] = { ...shieldData };
        console.log(`[GameState] Shield added: ${shieldName}`, shieldData);
        return this.playerShields[shieldName];
    }

    /**
     * Removes a shield from the player
     *
     * @param {string} shieldName - Name of the shield to remove
     * @returns {boolean} Whether the shield was removed
     *
     * @example
     * gameState.removeShield('bubble');
     */
    removeShield(shieldName) {
        if (this.playerShields[shieldName]) {
            delete this.playerShields[shieldName];
            console.log(`[GameState] Shield removed: ${shieldName}`);
            return true;
        }
        return false;
    }

    /**
     * Absorbs damage using active shields
     *
     * @param {number} damage - Incoming damage
     * @returns {Object} Result with absorbed amount and remaining damage
     *
     * @example
     * const result = gameState.absorbDamage(15);
     * console.log(`Absorbed: ${result.absorbed}, Remaining: ${result.remainingDamage}`);
     */
    absorbDamage(damage) {
        let remainingDamage = damage;
        let totalAbsorbed = 0;
        let totalRetaliation = 0;
        const shieldUpdates = [];

        // Process each active shield
        for (const [name, shield] of Object.entries(this.playerShields)) {
            if (remainingDamage <= 0) break;

            if (shield.count !== undefined && shield.count > 0) {
                // Bubble-style shield (discrete charges)
                const absorbed = Math.min(shield.absorbPerBubble || 0, remainingDamage);
                if (absorbed > 0) {
                    shield.count -= 1;
                    remainingDamage -= absorbed;
                    totalAbsorbed += absorbed;
                    shieldUpdates.push({ name, absorbed, remaining: shield.count });
                    console.log(`[GameState] Shield ${name} absorbed ${absorbed} (${shield.count} left)`);

                    if (shield.count <= 0) {
                        delete this.playerShields[name];
                        console.log(`[GameState] Shield ${name} depleted`);
                    }
                }
            } else if (shield.remaining !== undefined && shield.remaining > 0) {
                // Pool-style shield (FlameShield, IceWall, FireWall)
                const absorbed = Math.min(shield.remaining, remainingDamage);
                shield.remaining -= absorbed;
                remainingDamage -= absorbed;
                totalAbsorbed += absorbed;
                shieldUpdates.push({ name, absorbed, remaining: shield.remaining });
                console.log(`[GameState] Shield ${name} absorbed ${absorbed} (${shield.remaining} left)`);

                // Check for retaliation (FireWall)
                if (shield.retaliationDamage && absorbed > 0) {
                    totalRetaliation += shield.retaliationDamage;
                    console.log(`[GameState] Shield ${name} retaliates ${shield.retaliationDamage}`);
                }

                if (shield.remaining <= 0) {
                    delete this.playerShields[name];
                    console.log(`[GameState] Shield ${name} depleted`);
                }
            }
        }

        return {
            absorbed: totalAbsorbed,
            remainingDamage: Math.max(0, remainingDamage),
            shieldUpdates,
            retaliationDamage: totalRetaliation
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Effect Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Adds an effect to the active effects array
     *
     * @param {Object} effect - The effect to add
     * @returns {Object} The added effect
     *
     * @example
     * gameState.addEffect({ name: 'poison', damagePerTick: 4, turnsRemaining: 3 });
     */
    addEffect(effect) {
        this.activeEffects.push(effect);

        if (this.debugMode && GAME_CONFIG.LOG_LEVEL === 'info') {
            console.log(`[GameState] Effect added: ${effect.name}`);
        }

        cardKeeper('effect_applied_player', {
            target: 'player',
            effect: buildEffectLog(effect)
        });

        return effect;
    }

    /**
     * Removes an effect by name
     *
     * @param {string} effectName - Name of the effect to remove
     * @returns {boolean} Whether the effect was removed
     *
     * @example
     * gameState.removeEffect('poison');
     */
    removeEffect(effectName) {
        const index = this.activeEffects.findIndex(effect => effect.name === effectName);
        if (index !== -1) {
            this.activeEffects.splice(index, 1);

            if (this.debugMode && GAME_CONFIG.LOG_LEVEL === 'info') {
                console.log(`[GameState] Effect removed: ${effectName}`);
            }

            return true;
        }
        return false;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Utility Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Resets all state variables to initial values
     *
     * @returns {Object} Reset result
     *
     * @example
     * gameState.reset();
     */
    reset() {
        // Player state
        this.playerHp = GAME_CONFIG.PLAYER_START_HP;
        this.playerMaxHp = GAME_CONFIG.PLAYER_MAX_HP;
        this.energy = GAME_CONFIG.PLAYER_ENERGY;
        this.maxEnergy = GAME_CONFIG.PLAYER_MAX_ENERGY;
        this.playerShields = {};

        // Enemy state
        this.enemyHp = GAME_CONFIG.ENEMY_START_HP;
        this.enemyMaxHp = GAME_CONFIG.ENEMY_MAX_HP;
        this.enemy = null;
        this.enemyAttackInterval = 1;
        this.enemyAttackCooldown = 1;

        // Turn state
        this.turn = 1;
        this.phase = 'player';
        this.isGameOver = false;
        this.gameOverReason = null;

        // Combat state
        this.lastDamageDealt = 0;
        this.lastDamageTaken = 0;
        this.isCriticalHit = false;

        // Effects
        this.activeEffects = [];
        this.cooldowns = {};

        // Debug state
        this.lastUpdateTimestamp = performance.now();
        this.frameCount = 0;

        // Reset card pile manager if it exists
        if (this.cardPileManager && typeof this.cardPileManager.reset === 'function') {
            this.cardPileManager.reset();
        }

        console.log('[GameState] Reset to initial values');

        return { success: true };
    }

    /**
     * Gets a summary of the current game state
     *
     * @returns {Object} State summary for debugging
     */
    getSummary() {
        return {
            turn: this.turn,
            phase: this.phase,
            playerHp: `${this.playerHp}/${this.playerMaxHp}`,
            energy: `${this.energy}/${this.maxEnergy}`,
            enemyHp: `${this.enemyHp}/${this.enemyMaxHp}`,
            activeEffects: this.activeEffects.length,
            isGameOver: this.isGameOver
        };
    }
}

/**
 * Creates and returns a new GameState instance
 *
 * @param {Object} [options] - Optional configuration overrides
 * @returns {GameState} The initialized GameState instance
 *
 * @deprecated Use `new GameState()` directly instead
 */
export function initializeGameState(options = {}) {
    return new GameState(options);
}

export default GameState;
