/**
 * IntentManager Module for Emoji Card Battle
 *
 * This module manages enemy intent selection and execution.
 * It provides verbose logging for debugging and understanding
 * enemy AI decision-making.
 *
 * Design Philosophy: Transparent randomization
 * - Log every step of intent selection
 * - Show pool contents, roll values, and selected intent
 * - Separate intent selection from execution
 *
 * @module combat/IntentManager
 */

// Import IntentType from EnemyBase
import { IntentType, IntentIcon } from '../enemies/EnemyBase.js';

/**
 * IntentManager Class
 *
 * Centralized management for enemy intents:
 * - Generate intent pool for enemy
 * - Select intent with verbose randomization logging
 * - Telegraph intent to player
 * - Execute intent when enemy turn arrives
 *
 * @example
 * const intentManager = new IntentManager(enemy);
 * const intent = intentManager.selectIntent(turn);
 * intentManager.executeIntent(gameState);
 */
export class IntentManager {
    /**
     * Creates a new IntentManager instance
     *
     * @param {Object} enemy - Enemy object to manage intents for
     */
    constructor(enemy) {
        /**
         * @private
         * @type {Object}
         * @description Enemy this manager controls
         */
        this.enemy = enemy;

        /**
         * @type {Array<Object>}
         * @description Current intent pool
         */
        this.intentPool = [];

        /**
         * @type {Object|null}
         * @description Currently selected intent
         */
        this.currentIntent = null;

        /**
         * @type {Object|null}
         * @description Previously selected intent (for history)
         */
        this.previousIntent = null;

        /**
         * @type {number}
         * @description Current turn number
         */
        this.currentTurn = 1;

        /**
         * @type {Array<Object>}
         * @description Intent history for this combat
         */
        this.intentHistory = [];

        /**
         * @type {boolean}
         * @description Whether verbose logging is enabled
         */
        this.verboseLogging = true;

        console.log('[IntentManager] Initialized for', enemy.name);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Intent Selection Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Selects a random intent for the enemy
     *
     * This method uses PURE RANDOM selection with verbose logging
     * to show exactly how the decision was made.
     *
     * @param {number} turn - Current turn number
     * @returns {Object|null} Selected intent or null if selection failed
     *
     * @example
     * const intent = intentManager.selectIntent(5);
     * console.log(`Enemy will: ${intent.type}`);
     */
    selectIntent(turn = 1) {
        this.currentTurn = turn;

        // Log start of selection
        this._log('='.repeat(50));
        this._log(`[SelectIntent] Turn ${turn} - ${this.enemy.name}`);
        this._log('='.repeat(50));

        // Guard: enemy must be alive
        if (!this.enemy.isAlive) {
            this._log('[SelectIntent] Enemy is DEAD - no intent selected');
            return null;
        }

        // Guard: enemy must not be stunned
        if (this.enemy.isStunned) {
            this._log('[SelectIntent] Enemy is STUNNED - no intent selected');
            return { type: 'stunned', icon: '💫' };
        }

        // Get or generate intent pool
        this.intentPool = this.enemy.intentPool || [];

        if (this.intentPool.length === 0) {
            this._log('[SelectIntent] Intent pool is EMPTY - generating default');
            this.intentPool = this._generateDefaultPool();
        }

        // Log intent pool contents
        this._log(`[SelectIntent] Intent pool contains ${this.intentPool.length} options:`);
        this.intentPool.forEach((intent, index) => {
            const icon = IntentIcon[intent.type] || '❓';
            const value = intent.value ?? intent.damage ?? intent.block ?? 'N/A';
            this._log(`  [${index}] ${icon} ${intent.type.toUpperCase()}: ${value}`);
        });

        // Pure random selection
        const roll = Math.random();
        const randomIndex = Math.floor(roll * this.intentPool.length);
        const selectedIntent = this.intentPool[randomIndex];

        // Verbose logging of selection process
        this._log(`[SelectIntent] Random roll: ${roll.toFixed(6)}`);
        this._log(`[SelectIntent] Pool size: ${this.intentPool.length}`);
        this._log(`[SelectIntent] Calculation: floor(${roll.toFixed(6)} × ${this.intentPool.length}) = ${randomIndex}`);
        this._log(`[SelectIntent] Selected index: ${randomIndex}`);

        // Store previous intent
        this.previousIntent = this.currentIntent;

        // Store current intent (deep copy)
        this.currentIntent = JSON.parse(JSON.stringify(selectedIntent));
        this.currentIntent.icon = IntentIcon[selectedIntent.type] || '❓';
        this.currentIntent.selectedTurn = turn;
        this.currentIntent.selectedAt = Date.now();

        // Log selection result
        this._log('-'.repeat(50));
        this._log(`[SelectIntent] RESULT: ${this.currentIntent.icon} ${this.currentIntent.type.toUpperCase()}`);
        this._log(`[SelectIntent] Details:`, this.currentIntent);
        this._log('='.repeat(50));

        // Add to history
        this.intentHistory.push({
            turn,
            intent: { ...this.currentIntent },
            roll,
            index: randomIndex,
            poolSize: this.intentPool.length,
            timestamp: Date.now()
        });

        // Update enemy's current intent
        this.enemy.currentIntent = this.currentIntent;
        this.enemy.intentSetTurn = turn;

        return this.currentIntent;
    }

    /**
     * Gets the currently selected intent
     *
     * @returns {Object|null} Current intent or null
     */
    getCurrentIntent() {
        return this.currentIntent;
    }

    /**
     * Gets the intent icon for display
     *
     * @returns {string} Intent icon emoji
     */
    getIntentIcon() {
        if (!this.currentIntent) {
            return '❓';
        }
        return this.currentIntent.icon || IntentIcon[this.currentIntent.type] || '❓';
    }

    /**
     * Gets the intent display text
     *
     * @returns {string} Human-readable intent description
     */
    getIntentText() {
        if (!this.currentIntent) {
            return '???';
        }

        const intent = this.currentIntent;
        const value = intent.value ?? intent.damage ?? intent.block ?? intent.healAmount;

        if (value !== undefined) {
            return `${value}`;
        }

        if (intent.name) {
            return intent.name;
        }

        return intent.type;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Intent Execution Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Executes the current intent
     *
     * @param {Object} gameState - The game state object
     * @returns {Object} Execution result
     *
     * @example
     * const result = intentManager.executeIntent(gameState);
     * if (result.success) {
     *     console.log(`Enemy ${result.action} succeeded`);
     * }
     */
    executeIntent(gameState) {
        this._log('[ExecuteIntent] Starting intent execution');

        if (!this.currentIntent) {
            this._log('[ExecuteIntent] FAIL - No current intent');
            return { success: false, reason: 'no_intent' };
        }

        if (!this.enemy.isAlive) {
            this._log('[ExecuteIntent] FAIL - Enemy is dead');
            return { success: false, reason: 'dead' };
        }

        if (this.enemy.isStunned) {
            this._log('[ExecuteIntent] FAIL - Enemy is stunned');
            return { success: false, reason: 'stunned' };
        }

        this._log(`[ExecuteIntent] Executing: ${this.currentIntent.icon} ${this.currentIntent.type}`);

        // Delegate to enemy's executeIntent method
        const result = this.enemy.executeIntent(gameState);

        this._log('[ExecuteIntent] Result:', result);

        // Clear current intent after execution
        this.currentIntent = null;

        return result;
    }

    /**
     * Checks if intent is ready to execute
     *
     * @returns {boolean} Whether intent is ready
     */
    isIntentReady() {
        return this.currentIntent !== null && this.enemy.isAlive && !this.enemy.isStunned;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Pool Generation Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Generates a default intent pool
     *
     * @private
     * @returns {Array<Object>} Default intent pool
     */
    _generateDefaultPool() {
        const pool = [
            { type: IntentType.ATTACK, value: this.enemy.attackPower }
        ];

        // Add block if enemy has defense
        if (this.enemy.defense > 0) {
            pool.push({ type: IntentType.BLOCK, value: this.enemy.defense * 2 });
        }

        return pool;
    }

    /**
     * Creates a weighted intent pool
     *
     * @param {Object} weights - Weight configuration
     * @returns {Array<Object>} Weighted intent pool
     *
     * @example
     * const pool = intentManager.createWeightedPool({
     *     attack: 60,
     *     block: 30,
     *     special: 10
     * });
     */
    createWeightedPool(weights = {}) {
        const pool = [];
        const defaultWeights = {
            attack: 50,
            block: 25,
            buff: 10,
            debuff: 10,
            heal: 5
        };

        const finalWeights = { ...defaultWeights, ...weights };

        // Add intents based on weights
        for (let i = 0; i < finalWeights.attack; i++) {
            pool.push({ type: IntentType.ATTACK, value: this.enemy.attackPower });
        }

        for (let i = 0; i < finalWeights.block; i++) {
            pool.push({ type: IntentType.BLOCK, value: this.enemy.defense * 2 });
        }

        if (finalWeights.buff > 0) {
            for (let i = 0; i < finalWeights.buff; i++) {
                pool.push({ type: IntentType.BUFF, name: 'strength' });
            }
        }

        if (finalWeights.debuff > 0) {
            for (let i = 0; i < finalWeights.debuff; i++) {
                pool.push({ type: IntentType.DEBUFF, name: 'weak' });
            }
        }

        if (finalWeights.heal > 0) {
            for (let i = 0; i < finalWeights.heal; i++) {
                pool.push({ type: IntentType.HEAL, value: Math.floor(this.enemy.maxHp * 0.1) });
            }
        }

        this._log(`[CreateWeightedPool] Generated pool with ${pool.length} intents`);

        return pool;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Logging Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Logs a message if verbose logging is enabled
     *
     * @private
     * @param {string} message - Message to log
     * @param {Object} [data] - Optional data to log
     */
    _log(message, data = null) {
        if (!this.verboseLogging) {
            return;
        }

        if (data !== null) {
            console.log(message, data);
        } else {
            console.log(message);
        }
    }

    /**
     * Enables verbose logging
     */
    enableVerboseLogging() {
        this.verboseLogging = true;
        console.log('[IntentManager] Verbose logging enabled');
    }

    /**
     * Disables verbose logging
     */
    disableVerboseLogging() {
        this.verboseLogging = false;
        console.log('[IntentManager] Verbose logging disabled');
    }

    // ───────────────────────────────────────────────────────────────────────────
    // History & Statistics Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Gets the intent history
     *
     * @returns {Array<Object>} Intent history
     */
    getIntentHistory() {
        return [...this.intentHistory];
    }

    /**
     * Gets statistics about intent selection
     *
     * @returns {Object} Intent statistics
     */
    getIntentStats() {
        const stats = {
            totalIntents: this.intentHistory.length,
            byType: {},
            averageRoll: 0
        };

        let rollSum = 0;

        this.intentHistory.forEach(entry => {
            // Count by type
            const type = entry.intent?.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;

            // Sum rolls
            rollSum += entry.roll || 0;
        });

        // Calculate average roll
        if (this.intentHistory.length > 0) {
            stats.averageRoll = rollSum / this.intentHistory.length;
        }

        return stats;
    }

    /**
     * Resets the intent manager
     *
     * @returns {Object} Reset result
     */
    reset() {
        this.intentPool = [];
        this.currentIntent = null;
        this.previousIntent = null;
        this.currentTurn = 1;
        this.intentHistory = [];

        console.log('[IntentManager] Reset complete');

        return { success: true };
    }
}

export default IntentManager;
