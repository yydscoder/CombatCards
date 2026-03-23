/**
 * CardBase Abstract Class for Emoji Card Battle
 *
 * This is the foundational abstract class for all cards in the game.
 * It defines the common properties and methods that all cards will inherit.
 * Each card type should extend this class to implement specific behaviors.
 *
 * Design Philosophy: Slay the Spire-style card system
 * - Abstract base class (not instantiated directly)
 * - Upgrade system for card enhancement
 * - Clear separation of cost, effect, and execution
 * - Target type specification for targeting system
 *
 * @module cards/CardBase
 */

/**
 * TargetType Enum - Valid target types for cards
 * @readonly
 * @enum {string}
 */
export const TargetType = {
    /** Single enemy target */
    ENEMY: 'enemy',
    /** Player (self) target */
    SELF: 'self',
    /** All enemies (AOE) */
    ALL_ENEMIES: 'all_enemies',
    /** All allies */
    ALL_ALLIES: 'all_allies',
    /** Any valid target (player chooses) */
    ANY: 'any'
};

/**
 * CardRarity Enum - Card rarity levels
 * @readonly
 * @enum {string}
 */
export const CardRarity = {
    /** Basic starter cards */
    BASIC: 'basic',
    /** Common cards */
    COMMON: 'common',
    /** Uncommon cards */
    UNCOMMON: 'uncommon',
    /** Rare cards */
    RARE: 'rare',
    /** Legendary/special cards */
    LEGENDARY: 'legendary'
};

/**
 * CardType Enum - Card type classification
 * @readonly
 * @enum {string}
 */
export const CardType = {
    /** Attack cards (deal damage) */
    ATTACK: 'attack',
    /** Skill cards (utility, block, etc.) */
    SKILL: 'skill',
    /** Power cards (persistent effects) */
    POWER: 'power',
    /** Status cards (temporary, usually negative) */
    STATUS: 'status',
    /** Curse cards (negative effects) */
    CURSE: 'curse'
};

/**
 * CardBase Abstract Class
 *
 * Abstract parent class for all cards. Provides:
 * - Core card properties (name, cost, type, rarity)
 * - Upgrade system (isUpgraded, upgrade())
 * - Target type specification
 * - Play validation (canPlay())
 * - Effect execution interface (executeEffect())
 *
 * @abstract
 *
 * @example
 * class Fireball extends CardBase {
 *     constructor() {
 *         super("Fireball", 3, { type: 'damage', value: 10 }, '🔥');
 *         this.cardType = CardType.ATTACK;
 *         this.targetType = TargetType.ENEMY;
 *     }
 *
 *     executeEffect(gameState, target) {
 *         // Implement fireball effect
 *     }
 *
 *     upgrade() {
 *         if (this.isUpgraded) return;
 *         this.isUpgraded = true;
 *         this.damage += 4;
 *         this.name = "Fireball+";
 *     }
 * }
 */
export class CardBase {
    /**
     * Creates a new CardBase instance
     *
     * @param {string} name - The name of the card
     * @param {number} cost - The energy cost to play this card
     * @param {Object} effect - The effect object describing what the card does
     * @param {string} emoji - The emoji representation of the card
     *
     * @throws {Error} If attempting to instantiate CardBase directly
     */
    constructor(name, cost, effect, emoji) {
        // Prevent direct instantiation
        if (this.constructor === CardBase) {
            throw new Error('CardBase is an abstract class and cannot be instantiated directly');
        }

        // ───────────────────────────────────────────────────────────────────────
        // Card Identification Properties
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {string}
         * @description Unique ID for tracking this card instance
         */
        this.id = Math.random().toString(36).substring(2, 9);

        /**
         * @type {string}
         * @description Human-readable name of the card
         */
        this.name = name;

        /**
         * @type {string}
         * @description Base name (before upgrades)
         */
        this.baseName = name;

        /**
         * @type {string}
         * @description Visual emoji representation
         */
        this.emoji = emoji;

        // ───────────────────────────────────────────────────────────────────────
        // Resource Cost Properties
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {number}
         * @description Energy cost to play this card
         */
        this.cost = cost;

        /**
         * @type {number}
         * @description Base cost (before cost reductions)
         */
        this.baseCost = cost;

        // ───────────────────────────────────────────────────────────────────────
        // Effect Properties
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {Object}
         * @description Effect object containing effect details
         */
        this.effect = effect;

        /**
         * @type {CardType}
         * @description Card type classification (ATTACK, SKILL, POWER, etc.)
         * @default CardType.ATTACK
         */
        this.cardType = CardType.ATTACK;

        /**
         * @type {CardRarity}
         * @description Card rarity level
         * @default CardRarity.COMMON
         */
        this.rarity = CardRarity.COMMON;

        /**
         * @type {TargetType}
         * @description Target type specification for targeting system
         * @default TargetType.ENEMY
         */
        this.targetType = TargetType.ENEMY;

        // ───────────────────────────────────────────────────────────────────────
        // Upgrade Properties
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {boolean}
         * @description Whether this card has been upgraded
         */
        this.isUpgraded = false;

        /**
         * @type {number}
         * @description Number of times this card has been upgraded
         */
        this.upgradeLevel = 0;

        /**
         * @type {string|null}
         * @description Description of what the upgrade does
         */
        this.upgradeDescription = null;

        // ───────────────────────────────────────────────────────────────────────
        // Card State Properties
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {boolean}
         * @description Whether the card can currently be played
         */
        this.isPlayable = true;

        /**
         * @type {boolean}
         * @description Whether the card is currently in hand
         */
        this.isInHand = false;

        /**
         * @type {boolean}
         * @description Whether the card is currently in draw pile
         */
        this.isInDrawPile = false;

        /**
         * @type {boolean}
         * @description Whether the card is currently in discard pile
         */
        this.isInDiscard = false;

        /**
         * @type {boolean}
         * @description Whether the card has been exhausted (removed from combat)
         */
        this.isExhausted = false;

        /**
         * @type {boolean}
         * @description Whether this card exhausts when played
         */
        this.exhaust = false;

        // ───────────────────────────────────────────────────────────────────────
        // Metadata Properties
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {number}
         * @description Timestamp when the card was created
         */
        this.createdTimestamp = Date.now();

        /**
         * @type {number|null}
         * @description Timestamp when the card was last played
         */
        this.lastPlayedTimestamp = null;

        // Log card creation
        console.log(`[CardBase] ${this.cardType} created: ${this.name} (ID: ${this.id})`);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Play Validation Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Checks if the card can be played given the current game state
     *
     * This method checks:
     * 1. Player has enough energy
     * 2. Card is in hand
     * 3. Card is not on cooldown (if applicable)
     * 4. Valid target exists (if applicable)
     *
     * @param {Object} gameState - The current game state object
     * @returns {Object} Result with success status and reason if failed
     *
     * @example
     * const result = card.canPlay(gameState);
     * if (result.canPlay) {
     *     console.log('Card is playable!');
     * } else {
     *     console.log(`Cannot play: ${result.reason}`);
     * }
     */
    canPlay(gameState) {
        // Check if player has enough energy
        const currentEnergy = gameState.energy ?? gameState.playerMana ?? 0;
        const hasEnoughEnergy = currentEnergy >= this.cost;

        if (!hasEnoughEnergy) {
            return {
                canPlay: false,
                reason: 'insufficient_energy',
                required: this.cost,
                available: currentEnergy
            };
        }

        // Check if card is in hand
        const isInHand = this.isInHand === true;

        if (!isInHand) {
            return {
                canPlay: false,
                reason: 'not_in_hand'
            };
        }

        // Check if card is not exhausted
        if (this.isExhausted) {
            return {
                canPlay: false,
                reason: 'exhausted'
            };
        }

        // Check if card is not on cooldown (if applicable)
        if (this.cooldown && this.cooldown > 0) {
            return {
                canPlay: false,
                reason: 'on_cooldown',
                cooldown: this.cooldown
            };
        }

        // All checks passed
        return {
            canPlay: true,
            reason: null
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Card Execution Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Plays the card in the game
     *
     * This method:
     * 1. Validates the card can be played
     * 2. Spends energy cost
     * 3. Executes the card's effect
     * 4. Handles exhaust/discard
     *
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     *
     * @example
     * const result = card.play(gameState, enemy);
     * if (result.success) {
     *     console.log(`Card played: ${result.message}`);
     * }
     */
    play(gameState, target) {
        // Validate that the card can be played
        const playCheck = this.canPlay(gameState);
        if (!playCheck.canPlay) {
            console.warn(`[CardBase] Cannot play ${this.name}: ${playCheck.reason}`);
            return {
                success: false,
                reason: playCheck.reason,
                message: `Cannot play: ${playCheck.reason}`
            };
        }

        // Spend energy cost
        const energyResult = this._spendEnergy(gameState, this.cost);
        if (!energyResult.success) {
            return energyResult;
        }

        // Mark card as played
        this.lastPlayedTimestamp = Date.now();

        // Log the card play
        console.log(`[CardBase] Playing: ${this.name} (Cost: ${this.cost} energy)`);

        // Execute the card's effect
        const effectResult = this.executeEffect(gameState, target);

        // Handle exhaust or discard
        if (this.exhaust || effectResult.exhaust) {
            this.isExhausted = true;
            console.log(`[CardBase] ${this.name} exhausted`);
        }

        // Return the result
        return {
            success: true,
            message: `Card ${this.name} played successfully`,
            energySpent: this.cost,
            ...effectResult
        };
    }

    /**
     * Executes the card's effect
     *
     * This method MUST be overridden by subclasses to implement
     * specific card effects. The base implementation returns a
     * generic result.
     *
     * @abstract
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing effect details
     *
     * @example
     * executeEffect(gameState, target) {
     *     // Deal damage
     *     const damage = this.damage;
     *     target.takeDamage(damage);
     *
     *     return {
     *         success: true,
     *         damage: damage,
     *         message: `Dealt ${damage} damage`
     *     };
     * }
     */
    executeEffect(gameState, target) {
        // Default implementation - should be overridden by subclasses
        console.warn(`[CardBase] executeEffect() not implemented for ${this.name}`);

        return {
            success: true,
            message: `Card ${this.name} executed (no effect defined)`,
            damage: 0,
            healing: 0,
            block: 0,
            statusEffects: []
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Upgrade Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Upgrades the card
     *
     * This method should be overridden by subclasses to implement
     * specific upgrade effects. The base implementation sets the
     * isUpgraded flag and increments upgradeLevel.
     *
     * @returns {Object} Upgrade result
     *
     * @example
     * // In subclass:
     * upgrade() {
     *     if (this.isUpgraded) return { success: false, reason: 'already_upgraded' };
     *
     *     this.isUpgraded = true;
     *     this.upgradeLevel++;
     *     this.damage += 4;
     *     this.name = `${this.baseName}+`;
     *     this.upgradeDescription = "+4 Damage";
     *
     *     return { success: true, description: this.upgradeDescription };
     * }
     */
    upgrade() {
        if (this.isUpgraded) {
            return {
                success: false,
                reason: 'already_upgraded',
                message: `${this.name} is already upgraded`
            };
        }

        this.isUpgraded = true;
        this.upgradeLevel++;
        this.name = `${this.baseName}+`;

        console.log(`[CardBase] ${this.baseName} upgraded to ${this.name}`);

        return {
            success: true,
            upgradeLevel: this.upgradeLevel,
            message: `${this.baseName} upgraded!`
        };
    }

    /**
     * Gets the upgrade description
     *
     * @returns {string|null} Description of what the upgrade does
     */
    getUpgradeDescription() {
        return this.upgradeDescription;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Display Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Gets the card's display name
     *
     * Includes "+" suffix if upgraded.
     *
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        const upgradeSuffix = this.isUpgraded ? '+' : '';
        return `${this.baseName}${upgradeSuffix} [${this.cost} energy]`;
    }

    /**
     * Gets the card's stats as a string for display
     *
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        const parts = [`Cost: ${this.cost}`];

        // Add type
        if (this.cardType) {
            parts.push(this.cardType.toUpperCase());
        }

        // Add upgrade indicator
        if (this.isUpgraded) {
            parts.push(`+${this.upgradeLevel}`);
        }

        return parts.join(' | ');
    }

    /**
     * Gets the card's description
     *
     * @returns {string} Card description from effect
     */
    getDescription() {
        return this.effect?.description || 'No description available';
    }

    // ───────────────────────────────────────────────────────────────────────────
    // State Management Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Updates the card's state
     *
     * @param {Object} newState - Object containing properties to update
     * @returns {Object} Update result
     */
    updateState(newState) {
        Object.assign(this, newState);
        console.log(`[CardBase] State updated: ${this.name}`, newState);
        return { success: true };
    }

    /**
     * Resets the card to its initial state
     *
     * Does NOT reset upgrade status.
     */
    reset() {
        this.isPlayable = true;
        this.isInHand = false;
        this.isInDrawPile = false;
        this.isInDiscard = false;
        this.isExhausted = false;
        this.lastPlayedTimestamp = null;

        console.log(`[CardBase] Reset: ${this.name}`);
    }

    /**
     * Resets the card completely (including upgrades)
     *
     * Used when leaving combat or starting a new run.
     */
    resetAll() {
        this.reset();
        this.isUpgraded = false;
        this.upgradeLevel = 0;
        this.name = this.baseName;
        this.upgradeDescription = null;

        console.log(`[CardBase] Full reset: ${this.name}`);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Utility Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Spends energy from the game state
     *
     * @private
     * @param {Object} gameState - The game state object
     * @param {number} cost - Energy cost to spend
     * @returns {Object} Spend result
     */
    _spendEnergy(gameState) {
        // Try EnergyManager first
        if (gameState.energyManager && typeof gameState.energyManager.spend === 'function') {
            return gameState.energyManager.spend(this.cost);
        }

        // Fallback to direct energy manipulation
        if (gameState.energy !== undefined) {
            if (gameState.energy >= this.cost) {
                gameState.energy -= this.cost;
                return { success: true, spent: this.cost, remaining: gameState.energy };
            }
            return { success: false, reason: 'insufficient_energy' };
        }

        // Fallback to playerMana (legacy)
        if (gameState.playerMana !== undefined) {
            if (gameState.playerMana >= this.cost) {
                gameState.playerMana -= this.cost;
                return { success: true, spent: this.cost, remaining: gameState.playerMana };
            }
            return { success: false, reason: 'insufficient_mana' };
        }

        return { success: false, reason: 'no_energy_system' };
    }

    /**
     * Creates a copy of this card
     *
     * @returns {CardBase} A new card instance with same properties
     */
    copy() {
        const copy = Object.create(Object.getPrototypeOf(this));
        Object.assign(copy, this);
        copy.id = Math.random().toString(36).substring(2, 9); // New ID
        copy.createdTimestamp = Date.now();
        return copy;
    }
}

export default CardBase;
