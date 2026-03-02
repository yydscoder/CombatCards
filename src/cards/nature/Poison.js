/**
 * Poison Card - Toxic Spores
 * 
 * ============================================================================
 * LORE:
 * "The mushroom does not hunt. It does not chase. It simply waits, releasing
 * its spores into the wind. Those who breathe them carry death within them,
 * unaware until the first cough."
 * - The Fungal Circle, Whispers from Below
 * 
 * Poison releases a cloud of toxic spores that settle deep in the target's
 * lungs. The toxins spread through the bloodstream, attacking organs and
 * weakening the body with each passing moment.
 * 
 * Unlike direct damage spells, poison is patient. It allows the caster to
 * strike from afar and let time do the work. By the time the victim realizes
 * their mistake, it is often too late.
 * ============================================================================
 * 
 * @module cards/nature/Poison
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Poison Card Class
 * 
 * A DoT card that applies stacking poison damage.
 * 
 * @extends Card
 */
export class Poison extends Card {
    /**
     * Creates a new Poison card instance
     * 
     * @param {string} name - Card name (default: "Poison")
     * @param {number} cost - Mana cost (default: 3)
     * @param {number} dotDamage - Damage per tick (default: 4)
     */
    constructor(name = "Poison", cost = 3, dotDamage = 4) {
        // Define the effect object for this card
        const effect = {
            type: 'damage_over_time',
            target: 'enemy',
            value: dotDamage,
            description: `Apply ${dotDamage} Poison DoT for 3 turns. Stacks up to 5 times.`,
            dotDamage: dotDamage,
            dotDuration: 3,
            dotType: 'poison',
            maxStacks: 5
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '☠️'            // Emoji - skull and crossbones
        );

        // Poison-specific properties
        this.dotDamage = dotDamage;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'damage_over_time';
        this.castTime = 'instant';
        
        // DoT mechanics
        this.dotDuration = 3;
        this.dotType = 'poison';
        this.maxStacks = 5;

        console.log(`Poison card created: ${this.name} (${this.dotDamage} DMG/tick, Cost: ${this.cost})`);
    }

    /**
     * Executes the Poison card's effect
     * 
     * Applies a stacking poison DoT to the enemy.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Poison effect');
            return { success: false, reason: 'no_target' };
        }

        // Find existing poison effect
        let existingPoison = null;
        let currentStacks = 0;
        
        if (gameState.enemy && gameState.enemy.activeEffects) {
            existingPoison = gameState.enemy.activeEffects.find(
                effect => effect.name === 'poison' || effect.type === 'poison'
            );
            if (existingPoison) {
                currentStacks = existingPoison.stacks || 0;
            }
        }

        // Calculate new stacks
        let newStacks = Math.min(currentStacks + 1, this.maxStacks);
        const totalDotDamage = this.dotDamage * newStacks;

        // Create or update poison effect
        const poisonEffect = {
            name: 'poison',
            type: 'poison',
            damagePerTick: this.dotDamage,
            duration: this.dotDuration,
            turnsRemaining: this.dotDuration,
            source: this.name,
            stacks: newStacks,
            maxStacks: this.maxStacks,
            emoji: '☠️',
            totalDamagePerTurn: totalDotDamage
        };

        // Apply effect
        if (existingPoison && typeof gameState.enemy?.updateEffect === 'function') {
            gameState.enemy.updateEffect(poisonEffect);
        } else if (typeof gameState.enemy?.addEffect === 'function') {
            gameState.enemy.addEffect(poisonEffect);
        }

        // Apply small initial damage
        const initialDamage = Math.floor(this.dotDamage * 0.5);
        if (initialDamage > 0) {
            const newEnemyHp = gameState.enemyHp - initialDamage;
            gameState.updateEnemyHp(newEnemyHp);
            gameState.lastDamageDealt = initialDamage;
        }

        console.log(
            `Poison applied: ${newStacks}/${this.maxStacks} stacks ` +
            `(${totalDotDamage} damage/turn for ${this.dotDuration} turns)`
        );

        // Return result object
        return {
            success: true,
            message: `Toxic spores infect the enemy! ${newStacks}/${this.maxStacks} poison stacks`,
            damage: initialDamage,
            healing: 0,
            statusEffects: [poisonEffect],
            isCriticalHit: false,
            dotApplied: true,
            dotDamage: this.dotDamage,
            dotDuration: this.dotDuration,
            dotType: this.dotType,
            currentStacks: newStacks,
            maxStacks: this.maxStacks,
            totalDamagePerTurn: totalDotDamage,
            initialDamage: initialDamage,
            spellType: this.spellType
        };
    }

    /**
     * Checks if the card can be played
     * 
     * @param {Object} gameState - The current game state object
     * @returns {boolean} True if the card can be played
     */
    canPlay(gameState) {
        const hasEnoughMana = gameState.playerMana >= this.cost;
        const isInHand = this.isInHand;
        const isNotOnCooldown = !this.cooldown || this.cooldown <= 0;
        const hasTarget = gameState.enemyHp > 0;

        return hasEnoughMana && isInHand && isNotOnCooldown && hasTarget;
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ☠️`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `${this.dotDamage}/tick | ${this.dotDuration} turns | Max: ${this.maxStacks}x`;
    }
}
