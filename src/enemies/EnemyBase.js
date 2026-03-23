/**
 * EnemyBase Class for Emoji Card Battle
 *
 * This is the foundational class for all enemies in the game.
 * It defines the common properties and methods that all enemies will inherit,
 * including the intent system for telegraphing enemy actions.
 *
 * Design Philosophy: Slay the Spire-style enemy intents
 * - Each enemy has an intent pool defining possible actions
 * - Intent is selected randomly each turn
 * - Intent is displayed to player before enemy acts
 *
 * The base class provides:
 * - Core enemy properties (name, hp, attack, emoji)
 * - Intent system (currentIntent, intentPool)
 * - Standard methods for enemy behavior and state management
 * - Utility functions for enemy AI and combat interactions
 *
 * @module enemies/EnemyBase
 */

/**
 * IntentType Enum - Valid intent types for enemies
 * @readonly
 * @enum {string}
 */
export const IntentType = {
    /** Attack the player (⚔️) */
    ATTACK: 'attack',
    /** Gain block/shield (🛡️) */
    BLOCK: 'block',
    /** Self-buff (💪) */
    BUFF: 'buff',
    /** Apply debuff to player (😫) */
    DEBUFF: 'debuff',
    /** Heal self (💚) */
    HEAL: 'heal',
    /** Special unique ability (⭐) */
    SPECIAL: 'special',
    /** Do nothing/pass (💤) */
    PASS: 'pass'
};

/**
 * IntentIcon Map - Emoji icons for each intent type
 * @readonly
 */
export const IntentIcon = {
    [IntentType.ATTACK]: '⚔️',
    [IntentType.BLOCK]: '🛡️',
    [IntentType.BUFF]: '💪',
    [IntentType.DEBUFF]: '😫',
    [IntentType.HEAL]: '💚',
    [IntentType.SPECIAL]: '⭐',
    [IntentType.PASS]: '💤'
};

/**
 * EnemyBase Class
 *
 * Base class for all enemies with intent system.
 * Subclasses should override defineIntentPool() to specify
 * their available actions.
 *
 * @example
 * class SlimeEnemy extends EnemyBase {
 *     defineIntentPool() {
 *         return [
 *             { type: IntentType.ATTACK, value: 12 },
 *             { type: IntentType.BLOCK, value: 10 }
 *         ];
 *     }
 * }
 */
export class EnemyBase {
    /**
     * Creates a new EnemyBase instance
     *
     * @param {string} name - The name of the enemy
     * @param {number} maxHp - Maximum health points
     * @param {number} attack - Base attack power
     * @param {string} emoji - Emoji representation
     * @param {Object} [stats={}] - Additional stats (defense, speed, etc.)
     */
    constructor(name, maxHp, attack, emoji, stats = {}) {
        // ───────────────────────────────────────────────────────────────────────
        // Enemy Identification
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {string}
         * @description Unique ID for tracking
         */
        this.id = Math.random().toString(36).substring(2, 9);

        /**
         * @type {string}
         * @description Human-readable name
         */
        this.name = name;

        /**
         * @type {string}
         * @description Visual emoji representation
         */
        this.emoji = emoji;

        // ───────────────────────────────────────────────────────────────────────
        // Combat Stats
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {number}
         * @description Maximum health points
         */
        this.maxHp = maxHp;

        /**
         * @type {number}
         * @description Current health points
         */
        this.hp = maxHp;

        /**
         * @type {number}
         * @description Base attack power
         */
        this.attackPower = attack;

        /**
         * @type {number}
         * @description Defense value (reduces incoming damage)
         */
        this.defense = stats.defense ?? 0;

        /**
         * @type {number}
         * @description Speed value (affects turn order)
         */
        this.speed = stats.speed ?? 1;

        /**
         * @type {number}
         * @description Turns between attacks
         */
        this.attackInterval = stats.attackInterval ?? 1;

        // ───────────────────────────────────────────────────────────────────────
        // Intent System
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {Object|null}
         * @description Current turn's intent (what enemy will do)
         */
        this.currentIntent = null;

        /**
         * @type {Array<Object>}
         * @description Pool of available intents for this enemy
         */
        this.intentPool = [];

        /**
         * @type {Array<Object>}
         * @description History of intents used
         */
        this.intentHistory = [];

        /**
         * @type {number}
         * @description Turn number when intent was set
         */
        this.intentSetTurn = 0;

        // ───────────────────────────────────────────────────────────────────────
        // Enemy State
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {boolean}
         * @description Whether enemy is alive
         */
        this.isAlive = true;

        /**
         * @type {boolean}
         * @description Whether enemy is stunned (cannot act)
         */
        this.isStunned = false;

        /**
         * @type {boolean}
         * @description Whether enemy is poisoned
         */
        this.isPoisoned = false;

        /**
         * @type {number}
         * @description Poison damage per turn
         */
        this.poisonDamage = 0;

        /**
         * @type {Array<Object>}
         * @description Active status effects
         */
        this.activeEffects = [];

        // ───────────────────────────────────────────────────────────────────────
        // AI Properties
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {number}
         * @description Aggression level (0-1)
         */
        this.aggression = stats.aggression ?? 0.5;

        /**
         * @type {number}
         * @description Intelligence level (0-1)
         */
        this.intelligence = stats.intelligence ?? 0.3;

        // ───────────────────────────────────────────────────────────────────────
        // Metadata
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {number}
         * @description Creation timestamp
         */
        this.createdTimestamp = Date.now();

        /**
         * @type {number|null}
         * @description Last action timestamp
         */
        this.lastActionTimestamp = null;

        // Initialize intent pool
        this.defineIntentPool();

        console.log(`[EnemyBase] Created: ${this.name} (HP: ${this.maxHp}, Attack: ${this.attackPower})`);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Intent System Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Defines the intent pool for this enemy
     *
     * Subclasses MUST override this method to specify their available actions.
     *
     * @returns {Array<Object>} Array of intent objects
     *
     * @example
     * defineIntentPool() {
     *     return [
     *         { type: IntentType.ATTACK, value: 12, min: 10, max: 14 },
     *         { type: IntentType.BLOCK, value: 10 },
     *         { type: IntentType.SPECIAL, name: 'fire_breath', value: 20 }
     *     ];
     * }
     */
    defineIntentPool() {
        // Default intent pool - subclasses should override
        this.intentPool = [
            { type: IntentType.ATTACK, value: this.attackPower }
        ];

        console.log(`[EnemyBase] ${this.name} using default intent pool`);
        return this.intentPool;
    }

    /**
     * Chooses a random intent from the intent pool
     *
     * Uses pure random selection with verbose logging.
     *
     * @param {number} turn - Current turn number
     * @returns {Object} Selected intent object
     *
     * @example
     * const intent = enemy.chooseIntent(5);
     * console.log(`${enemy.name} will ${intent.type}!`);
     */
    chooseIntent(turn = 1) {
        // Guard: must be alive
        if (!this.isAlive) {
            console.log(`[Intent] ${this.name} is dead, no intent selected`);
            return null;
        }

        // Guard: must have intent pool
        if (!this.intentPool || this.intentPool.length === 0) {
            console.warn(`[Intent] ${this.name} has no intent pool!`);
            this.defineIntentPool();
        }

        // Verbose logging for randomization
        console.log(`[Intent] ${this.name} choosing intent for turn ${turn}`);
        console.log(`[Intent] Pool size: ${this.intentPool.length} options`);

        // Log each intent option
        this.intentPool.forEach((intent, index) => {
            console.log(`[Intent]   [${index}] ${intent.type}: ${intent.value ?? 'N/A'}`);
        });

        // Pure random selection
        const roll = Math.random();
        const randomIndex = Math.floor(roll * this.intentPool.length);
        const selectedIntent = this.intentPool[randomIndex];

        // Verbose logging
        console.log(`[Intent] Roll: ${roll.toFixed(4)}`);
        console.log(`[Intent] Selected index: ${randomIndex}`);
        console.log(`[Intent] Selected: ${selectedIntent.type}`, selectedIntent);

        // Store current intent
        this.currentIntent = { ...selectedIntent };
        this.intentSetTurn = turn;

        // Add to history
        this.intentHistory.push({
            turn,
            intent: { ...this.currentIntent },
            timestamp: Date.now()
        });

        console.log(`[Intent] ${this.name} will ${this.currentIntent.type}!`);

        return this.currentIntent;
    }

    /**
     * Gets the current intent
     *
     * @returns {Object|null} Current intent or null
     */
    getCurrentIntent() {
        return this.currentIntent;
    }

    /**
     * Gets the intent icon emoji
     *
     * @returns {string} Intent icon emoji
     */
    getIntentIcon() {
        if (!this.currentIntent) {
            return '❓';
        }
        return IntentIcon[this.currentIntent.type] || '❓';
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

        switch (intent.type) {
            case IntentType.ATTACK:
                return `Attack ${intent.value}`;
            case IntentType.BLOCK:
                return `Block ${intent.value}`;
            case IntentType.BUFF:
                return `Buff: ${intent.name || 'Self'}`;
            case IntentType.DEBUFF:
                return `Debuff: ${intent.name || 'Weak'}`;
            case IntentType.HEAL:
                return `Heal ${intent.value}`;
            case IntentType.SPECIAL:
                return `${intent.name || 'Special'}`;
            case IntentType.PASS:
                return 'Pass';
            default:
                return 'Unknown';
        }
    }

    /**
     * Executes the current intent
     *
     * @param {Object} gameState - The game state object
     * @returns {Object} Execution result
     */
    executeIntent(gameState) {
        if (!this.currentIntent) {
            console.warn(`[EnemyBase] ${this.name} has no intent to execute`);
            return { success: false, reason: 'no_intent' };
        }

        if (!this.isAlive) {
            return { success: false, reason: 'dead' };
        }

        if (this.isStunned) {
            console.log(`[EnemyBase] ${this.name} is stunned, cannot act`);
            return { success: false, reason: 'stunned' };
        }

        console.log(`[EnemyBase] ${this.name} executing: ${this.currentIntent.type}`);

        // Update last action timestamp
        this.lastActionTimestamp = Date.now();

        // Execute based on intent type
        switch (this.currentIntent.type) {
            case IntentType.ATTACK:
                return this._executeAttack(gameState);

            case IntentType.BLOCK:
                return this._executeBlock(gameState);

            case IntentType.HEAL:
                return this._executeHeal(gameState);

            case IntentType.BUFF:
                return this._executeBuff(gameState);

            case IntentType.DEBUFF:
                return this._executeDebuff(gameState);

            case IntentType.SPECIAL:
                return this._executeSpecial(gameState);

            case IntentType.PASS:
                return this._executePass(gameState);

            default:
                console.warn(`[EnemyBase] Unknown intent type: ${this.currentIntent.type}`);
                return { success: false, reason: 'unknown_intent' };
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Intent Execution Methods (Internal)
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Executes an attack intent
     * @private
     */
    _executeAttack(gameState) {
        const damage = this.currentIntent.value ?? this.attackPower;

        // Add random variation (±20%)
        const variation = damage * (0.8 + Math.random() * 0.2);
        const actualDamage = Math.floor(variation);

        console.log(`[EnemyBase] ${this.name} attacks for ${actualDamage} damage`);

        return {
            success: true,
            action: 'attack',
            damage: actualDamage,
            baseDamage: damage,
            target: 'player'
        };
    }

    /**
     * Executes a block intent
     * @private
     */
    _executeBlock(gameState) {
        const blockAmount = this.currentIntent.value ?? 10;

        console.log(`[EnemyBase] ${this.name} gains ${blockAmount} block`);

        return {
            success: true,
            action: 'block',
            blockAmount,
            target: 'self'
        };
    }

    /**
     * Executes a heal intent
     * @private
     */
    _executeHeal(gameState) {
        const healAmount = this.currentIntent.value ?? 10;

        console.log(`[EnemyBase] ${this.name} heals for ${healAmount} HP`);

        return {
            success: true,
            action: 'heal',
            healAmount,
            target: 'self'
        };
    }

    /**
     * Executes a buff intent
     * @private
     */
    _executeBuff(gameState) {
        const buffName = this.currentIntent.name || 'unknown_buff';

        console.log(`[EnemyBase] ${this.name} uses buff: ${buffName}`);

        return {
            success: true,
            action: 'buff',
            buffName,
            buffValue: this.currentIntent.value,
            target: 'self'
        };
    }

    /**
     * Executes a debuff intent
     * @private
     */
    _executeDebuff(gameState) {
        const debuffName = this.currentIntent.name || 'unknown_debuff';

        console.log(`[EnemyBase] ${this.name} applies debuff: ${debuffName}`);

        return {
            success: true,
            action: 'debuff',
            debuffName,
            debuffValue: this.currentIntent.value,
            target: 'player'
        };
    }

    /**
     * Executes a special intent
     * @private
     */
    _executeSpecial(gameState) {
        const specialName = this.currentIntent.name || 'special';

        console.log(`[EnemyBase] ${this.name} uses special: ${specialName}`);

        return {
            success: true,
            action: 'special',
            specialName,
            specialValue: this.currentIntent.value,
            target: this.currentIntent.target || 'player'
        };
    }

    /**
     * Executes a pass intent
     * @private
     */
    _executePass(gameState) {
        console.log(`[EnemyBase] ${this.name} passes`);

        return {
            success: true,
            action: 'pass',
            target: 'none'
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Combat Methods (from original Enemy.js)
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Takes damage from an attack
     *
     * @param {number} damage - Raw damage amount
     * @param {Object} [attackInfo={}] - Attack information
     * @param {Object} [gameState=null] - Game state reference
     * @returns {Object} Damage result
     */
    takeDamage(damage, attackInfo = {}, gameState = null) {
        if (!this.isAlive) {
            return { success: true, damageTaken: 0, remainingHp: 0, isDead: true };
        }

        if (damage < 0) {
            damage = 0;
        }

        // Apply defense reduction (max 50%)
        let finalDamage = damage;
        if (this.defense > 0) {
            const defenseReduction = Math.min(this.defense / 100, 0.5);
            finalDamage = Math.max(1, damage * (1 - defenseReduction));
        }

        // Apply critical hit
        if (attackInfo.isCriticalHit) {
            finalDamage *= attackInfo.criticalMultiplier ?? 1.5;
        }

        finalDamage = Math.floor(finalDamage);

        // Update HP
        const newHp = this.hp - finalDamage;
        this.hp = Math.max(0, newHp);

        // Sync with gameState
        if (gameState && typeof gameState.enemyHp !== 'undefined') {
            gameState.enemyHp = this.hp;
        }

        this.isAlive = this.hp > 0;

        console.log(`[EnemyBase] ${this.name} took ${finalDamage} damage (${this.hp}/${this.maxHp} HP)`);

        return {
            success: true,
            damageTaken: finalDamage,
            remainingHp: this.hp,
            isDead: !this.isAlive,
            wasCriticalHit: attackInfo.isCriticalHit ?? false
        };
    }

    /**
     * Adds an effect to the enemy
     *
     * @param {Object} effect - Effect object
     */
    addEffect(effect) {
        if (!effect || !effect.name) {
            console.warn(`[EnemyBase] Invalid effect for ${this.name}`);
            return;
        }

        this.activeEffects.push(effect);
        console.log(`[Effect] ${effect.name} applied to ${this.name}`);
    }

    /**
     * Removes an effect from the enemy
     *
     * @param {string} effectName - Effect name to remove
     */
    removeEffect(effectName) {
        const before = this.activeEffects.length;
        this.activeEffects = this.activeEffects.filter(e => e.name !== effectName);

        if (this.activeEffects.length < before) {
            console.log(`[Effect] ${effectName} removed from ${this.name}`);
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Utility Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Gets display name with HP
     *
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.hp}/${this.maxHp} HP]`;
    }

    /**
     * Gets stats string
     *
     * @returns {string} Formatted stats
     */
    getStatsString() {
        return `ATK: ${this.attackPower} | DEF: ${this.defense}`;
    }

    /**
     * Resets enemy to initial state
     */
    reset() {
        this.hp = this.maxHp;
        this.isAlive = true;
        this.isStunned = false;
        this.isPoisoned = false;
        this.poisonDamage = 0;
        this.activeEffects = [];
        this.currentIntent = null;
        this.intentHistory = [];
        this.lastActionTimestamp = null;

        console.log(`[EnemyBase] ${this.name} reset`);
    }
}

export default EnemyBase;
