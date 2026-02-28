/**
 * Ember Card - Lingering Flame
 * 
 * ============================================================================
 * LORE:
 * "A single ember can ignite a forest. Never underestimate the small flame."
 * - Proverb of the Fire Walkers
 * 
 * Ember is the subtle art of fire magic - while it lacks the explosive
 * power of a fireball or inferno, its true strength lies in persistence.
 * The ember spell plants a seed of flame that continues to burn long after
 * the initial cast, slowly consuming the target from within.
 * 
 * Fire mages use embers to finish off wounded foes or to maintain constant
 * pressure during prolonged battles. The burning sensation is said to be
 * far worse than any instant damage spell.
 * ============================================================================
 * 
 * @module cards/Ember
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Ember Card Class
 * 
 * A low-cost spell that deals modest initial damage but applies
 * a strong damage-over-time effect that stacks with multiple casts.
 * 
 * @extends Card
 */
export class Ember extends Card {
    /**
     * Creates a new Ember card instance
     * 
     * @param {string} name - Card name (default: "Ember")
     * @param {number} cost - Mana cost (default: 2)
     * @param {number} damage - Base initial damage (default: 3)
     */
    constructor(name = "Ember", cost = 2, damage = 3) {
        // Define the effect object for this card
        const effect = {
            type: 'damage_over_time',
            target: 'enemy',
            value: damage,
            description: `Deals ${damage} damage + ${damage} damage/turn for 3 turns. Stacks.`,
            dotDamage: damage,
            dotDuration: 3,
            dotTickRate: 1,
            canStack: true,
            maxStacks: 5
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            'ðŸ”¶'            // Emoji - orange ember glow
        );

        // Ember-specific properties
        this.damage = damage;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'damage_over_time';
        this.castTime = 'instant';
        
        // Damage over time properties
        this.dotDamage = damage;
        this.dotDuration = 3;
        this.dotTickRate = 1; // Ticks every turn
        this.canStack = true;
        this.maxStacks = 5;

        console.log(`Ember card created: ${this.name} (DoT: ${this.dotDamage}/turn, Cost: ${this.cost})`);
    }

    /**
     * Executes the Ember card's effect
     * 
     * Plants an ember on the enemy that deals initial damage and
     * continues to burn over multiple turns.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Ember effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate initial damage with small variance
        let initialDamage = Math.floor(this.damage * (0.9 + Math.random() * 0.2));
        
        // Apply initial damage to the target
        const newEnemyHp = gameState.enemyHp - initialDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = initialDamage;

        // Create the burning ember effect
        const emberEffect = {
            name: 'ember_burn',
            damagePerTurn: this.dotDamage,
            duration: this.dotDuration,
            source: this.name,
            stacks: 1,
            maxStacks: this.maxStacks,
            tickRate: this.dotTickRate
        };

        // Check for existing ember effects and stack
        let existingEmberIndex = -1;
        if (gameState.activeEffects) {
            existingEmberIndex = gameState.activeEffects.findIndex(
                effect => effect.name === 'ember_burn'
            );
        }

        if (existingEmberIndex !== -1 && this.canStack) {
            // Stack the effect
            const existingEmber = gameState.activeEffects[existingEmberIndex];
            if (existingEmber.stacks < this.maxStacks) {
                existingEmber.stacks++;
                existingEmber.duration = Math.max(existingEmber.duration, this.dotDuration);
                emberEffect.stacks = existingEmber.stacks;
                console.log(`Ember stacked! Current stacks: ${emberEffect.stacks}/${this.maxStacks}`);
            }
        } else if (gameState.enemy && typeof gameState.enemy.addEffect === 'function') {
            // Add new effect
            gameState.enemy.addEffect(emberEffect);
        }

        // Calculate total expected damage
        const totalExpectedDamage = initialDamage + (this.dotDamage * this.dotDuration);

        console.log(`Ember executed: ${initialDamage} initial + ${this.dotDamage}/turn for ${this.dotDuration} turns (${emberEffect.stacks} stacks)`);

        // Return result object
        return {
            success: true,
            message: `Ember planted! ${initialDamage} damage + ${this.dotDamage * emberEffect.stacks}/turn DoT`,
            damage: initialDamage,
            healing: 0,
            statusEffects: [emberEffect],
            isCriticalHit: false,
            dotApplied: true,
            dotDamage: this.dotDamage * emberEffect.stacks,
            dotDuration: this.dotDuration,
            totalExpectedDamage: totalExpectedDamage,
            stacks: emberEffect.stacks
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * Ember is most effective when the enemy will survive multiple turns.
     * 
     * @param {Object} gameState - The current game state object
     * @returns {boolean} True if the card can be played, false otherwise
     */
    canPlay(gameState) {
        // Check if the player has enough mana
        const hasEnoughMana = gameState.playerMana >= this.cost;

        // Check if the card is in hand
        const isInHand = this.isInHand;

        // Check if the card is not on cooldown
        const isNotOnCooldown = !this.cooldown || this.cooldown <= 0;

        // Ember is less effective if enemy is about to die
        // But still playable for the initial damage
        return hasEnoughMana && isInHand && isNotOnCooldown;
    }

    /**
     * Gets the card's display name with ember-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ðŸ”¶`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with DoT info
     */
    getStatsString() {
        return `DMG: ${this.damage} | DoT: ${this.dotDamage}x${this.dotDuration} | Stacks: ${this.maxStacks}`;
    }
}
