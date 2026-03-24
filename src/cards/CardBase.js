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
 * Card Tags - Tags for synergy and interaction detection
 * @readonly
 * @enum {string}
 */
export const CardTag = {
    /** Attack cards that deal damage */
    ATTACK: 'attack',
    /** Skill cards (block, utility) */
    SKILL: 'skill',
    /** Power cards (persistent effects) */
    POWER: 'power',
    /** Fire element cards */
    FIRE: 'fire',
    /** Water element cards */
    WATER: 'water',
    /** Nature element cards */
    NATURE: 'nature',
    /** Cards that deal damage over time */
    DOT: 'dot',
    /** Cards that provide block */
    BLOCK: 'block',
    /** Cards that heal */
    HEAL: 'heal',
    /** Cards that draw */
    DRAW: 'draw',
    /** Cards that exhaust */
    EXHAUST: 'exhaust',
    /** Cards with Sly effect (benefit from discard) */
    SLY: 'sly',
    /** Cards that apply status effects */
    STATUS: 'status'
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
        // Card Tags (for synergy detection)
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {Array<CardTag>}
         * @description Tags for synergy and interaction detection
         * @default []
         */
        this.tags = [];

        // ───────────────────────────────────────────────────────────────────────
        // Scaling Modifiers (Strength, buffs, etc.)
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {number}
         * @description Damage multiplier from buffs/strength (default 1.0 = 100%)
         */
        this.damageMultiplier = 1.0;

        /**
         * @type {number}
         * @description Block multiplier from buffs (default 1.0 = 100%)
         */
        this.blockMultiplier = 1.0;

        /**
         * @type {number}
         * @description Flat damage bonus (e.g., from Strength)
         */
        this.flatDamageBonus = 0;

        /**
         * @type {number}
         * @description Flat block bonus
         */
        this.flatBlockBonus = 0;

        // ───────────────────────────────────────────────────────────────────────
        // Trigger Hooks (for zone interactions)
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {boolean}
         * @description Whether this card has Sly effect (triggers when discarded)
         */
        this.hasSlyEffect = false;

        // ───────────────────────────────────────────────────────────────────────
        // In-Hand Event Listening (Reactive System)
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {Object}
         * @description Event listeners for in-hand reactions
         * @example
         * this.eventListeners = {
         *     'cardPlayed': [(data) => { ... }],
         *     'cardDiscarded': [(data) => { ... }]
         * }
         */
        this.eventListeners = {};

        /**
         * @type {Object}
         * @description Counters for tracking state
         * @example
         * this.counters = {
         *     fireCardsPlayedThisTurn: 0,
         *     cardsDiscardedThisTurn: 0
         * }
         */
        this.counters = {};

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
        console.log(`[CardBase.play] Starting play for ${this.name}`);
        console.log(`[CardBase.play] Target:`, target);
        console.log(`[CardBase.play] GameState enemyHp: ${gameState.enemyHp}`);

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
            console.warn(`[CardBase] Energy spend failed: ${energyResult.reason}`);
            return energyResult;
        }

        console.log(`[CardBase] Energy spent: ${energyResult.spent}, remaining: ${energyResult.remaining}`);

        // Mark card as played
        this.lastPlayedTimestamp = Date.now();

        // Log the card play
        console.log(`[CardBase] Playing: ${this.name} (Cost: ${this.cost} energy)`);

        // Execute the card's effect
        const effectResult = this.executeEffect(gameState, target);
        console.log(`[CardBase] Effect result:`, effectResult);

        // Handle exhaust or discard
        if (this.exhaust || effectResult.exhaust) {
            this.isExhausted = true;
            console.log(`[CardBase] ${this.name} exhausted`);
        }

        // Return the result
        const result = {
            success: true,
            message: `Card ${this.name} played successfully`,
            energySpent: this.cost,
            ...effectResult
        };
        console.log(`[CardBase] Play complete:`, result);
        return result;
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
    // Trigger Hook Methods (for zone interactions)
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Called when card is drawn from draw pile to hand
     * Override this method to add on-draw triggers
     * 
     * @param {Object} gameState - Current game state
     * @returns {Object} Trigger result
     * 
     * @example
     * onDraw(gameState) {
     *     // Gain 1 energy when drawn
     *     gameState.energy++;
     *     return { success: true, triggered: true, energy: 1 };
     * }
     */
    onDraw(gameState) {
        // Override in subclasses for on-draw effects
        return { success: true, triggered: false };
    }

    /**
     * Called when card enters hand from any source (draw, generate, etc.)
     * Override this method to add on-enter-hand triggers
     * 
     * @param {Object} gameState - Current game state
     * @param {string} source - Where card came from ('draw', 'generate', 'return')
     * @returns {Object} Trigger result
     * 
     * @example
     * onEnterHand(gameState, source) {
     *     // Reduce cost if drawn from exhaust
     *     if (source === 'exhaust') {
     *         this.baseCost = Math.max(0, this.baseCost - 1);
     *     }
     *     return { success: true, triggered: true };
     * }
     */
    onEnterHand(gameState, source = 'unknown') {
        // Override in subclasses for on-enter-hand effects
        return { success: true, triggered: false };
    }

    /**
     * Called when card is played
     * Override this method to add on-play triggers
     * 
     * @param {Object} gameState - Current game state
     * @param {Object} target - Card target
     * @returns {Object} Trigger result
     */
    onPlay(gameState, target) {
        // Override in subclasses for on-play effects
        return { success: true, triggered: false };
    }

    /**
     * Called when card is discarded
     * Override this method to add Sly effects (benefit from discard)
     * 
     * @param {Object} gameState - Current game state
     * @returns {Object} Trigger result
     * 
     * @example
     * onDiscard(gameState) {
     *     // Deal 3 damage to all enemies when discarded
     *     gameState.allEnemies.forEach(enemy => {
     *         enemy.hp -= 3;
     *     });
     *     return { success: true, triggered: true, damage: 3 };
     * }
     */
    onDiscard(gameState) {
        // Override in subclasses for Sly effects
        return { success: true, triggered: false };
    }

    /**
     * Called when card is exhausted
     * Override this method to add exhaust triggers
     * 
     * @param {Object} gameState - Current game state
     * @returns {Object} Trigger result
     */
    onExhaust(gameState) {
        // Override in subclasses for exhaust effects
        return { success: true, triggered: false };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Scaling Modifier Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Applies scaling modifiers (Strength, buffs, etc.)
     * Called before card effect executes
     * 
     * @param {Object} modifiers - Modifier object
     * @param {number} [modifiers.strength=0] - Flat damage bonus
     * @param {number} [modifiers.damageMultiplier=1] - Damage multiplier
     * @param {number} [modifiers.blockMultiplier=1] - Block multiplier
     */
    applyModifiers(modifiers = {}) {
        this.flatDamageBonus = modifiers.strength || 0;
        this.damageMultiplier = modifiers.damageMultiplier || 1.0;
        this.blockMultiplier = modifiers.blockMultiplier || 1.0;
    }

    /**
     * Resets scaling modifiers to default
     */
    resetModifiers() {
        this.damageMultiplier = 1.0;
        this.blockMultiplier = 1.0;
        this.flatDamageBonus = 0;
        this.flatBlockBonus = 0;
    }

    /**
     * Gets the current cost of this card (can be modified dynamically)
     * Override this method for dynamic cost cards
     * 
     * @param {Object} gameState - Current game state
     * @returns {number} Current cost
     * 
     * @example
     * getCost(gameState) {
     *     // Cost reduced by 1 for each fire card played this turn
     *     return Math.max(0, this.baseCost - gameState.fireCardsPlayedThisTurn);
     * }
     */
    getCost(gameState) {
        // Apply cost modifiers
        let cost = this.baseCost;
        
        // Apply flat reductions
        cost -= this.flatCostReduction || 0;
        
        // Apply percentage modifiers
        if (this.costMultiplier) {
            cost = Math.ceil(cost * this.costMultiplier);
        }
        
        return Math.max(0, cost);
    }

    /**
     * Adds a cost modifier
     * 
     * @param {Object} modifier - Cost modifier object
     * @param {string} [modifier.type] - 'flat' or 'percent'
     * @param {number} [modifier.value] - Amount to modify by
     * @param {Function} [modifier.condition] - Optional condition function
     */
    addCostModifier(modifier) {
        if (!this.costModifiers) this.costModifiers = [];
        this.costModifiers.push(modifier);
    }

    /**
     * Removes a cost modifier
     * 
     * @param {Object} modifier - Modifier to remove
     */
    removeCostModifier(modifier) {
        if (!this.costModifiers) return;
        const index = this.costModifiers.indexOf(modifier);
        if (index !== -1) {
            this.costModifiers.splice(index, 1);
        }
    }

    /**
     * Gets the current damage value (can be modified dynamically)
     * Override this method for dynamic damage cards
     * 
     * @param {Object} gameState - Current game state
     * @returns {number} Current damage
     */
    getDamage(gameState) {
        let damage = this.damage || 0;
        
        // Apply flat bonus
        damage += this.flatDamageBonus || 0;
        
        // Apply multiplier
        damage = Math.ceil(damage * this.damageMultiplier);
        
        return Math.max(0, damage);
    }

    /**
     * Gets the current block value (can be modified dynamically)
     * 
     * @param {Object} gameState - Current game state
     * @returns {number} Current block
     */
    getBlock(gameState) {
        let block = this.block || 0;
        
        // Apply flat bonus
        block += this.flatBlockBonus || 0;
        
        // Apply multiplier
        block = Math.ceil(block * this.blockMultiplier);
        
        return Math.max(0, block);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // In-Hand Event Listening Methods (Reactive System)
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Registers this card to listen for an event
     * 
     * @param {string} eventType - Event to listen for
     * @param {Function} callback - Function to call when event occurs
     * @returns {Object} This card for chaining
     * 
     * @example
     * card.listenFor('cardPlayed', (data) => {
     *     if (data.card.tags.includes(CardTag.FIRE)) {
     *         this.damage++;
     *     }
     * });
     */
    listenFor(eventType, callback) {
        if (!this.eventListeners[eventType]) {
            this.eventListeners[eventType] = [];
        }
        this.eventListeners[eventType].push(callback);
        return this;
    }

    /**
     * Removes a listener for an event
     * 
     * @param {string} eventType - Event type
     * @param {Function} callback - Callback to remove
     * @returns {boolean} True if listener was removed
     */
    unlisten(eventType, callback) {
        if (!this.eventListeners[eventType]) return false;
        
        const index = this.eventListeners[eventType].indexOf(callback);
        if (index === -1) return false;
        
        this.eventListeners[eventType].splice(index, 1);
        return true;
    }

    /**
     * Triggers an event on this card (called by CardPileManager)
     * 
     * @param {string} eventType - Event type
     * @param {Object} data - Event data
     * @returns {Array} Results from all callbacks
     */
    triggerEvent(eventType, data) {
        if (!this.eventListeners[eventType]) return [];
        
        const results = [];
        for (const callback of this.eventListeners[eventType]) {
            try {
                results.push(callback(data));
            } catch (e) {
                console.error(`[CardBase] Event callback error for ${eventType}:`, e);
            }
        }
        return results;
    }

    /**
     * Removes all event listeners (called when card leaves hand)
     */
    removeAllListeners() {
        this.eventListeners = {};
    }

    /**
     * Increments a counter on this card
     * 
     * @param {string} counterName - Counter name
     * @param {number} amount - Amount to increment by
     */
    incrementCounter(counterName, amount = 1) {
        if (!this.counters[counterName]) {
            this.counters[counterName] = 0;
        }
        this.counters[counterName] += amount;
    }

    /**
     * Gets a counter value
     * 
     * @param {string} counterName - Counter name
     * @returns {number} Counter value
     */
    getCounter(counterName) {
        return this.counters[counterName] || 0;
    }

    /**
     * Resets all counters
     */
    resetCounters() {
        this.counters = {};
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
