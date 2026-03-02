/**
 * MushroomCloud Card - Spore Burst
 * 
 * ============================================================================
 * LORE:
 * "The mushroom fruits in silence. It releases its spores without sound.
 * And those who breathe them... they dream. They cough. They fall. And
 * from their bodies, new mushrooms grow."
 * - The Fungal Prophets, Visions of the Mycelium
 * 
 * MushroomCloud creates a dense cloud of toxic spores that envelops the
 * enemy. The spores attack the respiratory system, dealing damage over
 * time while reducing the target's ability to fight effectively.
 * 
 * The spell has a secondary effect - the spores continue to linger in
 * the area, potentially affecting anyone who enters the cloud.
 * ============================================================================
 * 
 * @module cards/nature/MushroomCloud
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * MushroomCloud Card Class
 * 
 * A DoT card that applies poison and reduces enemy accuracy.
 * 
 * @extends Card
 */
export class MushroomCloud extends Card {
    /**
     * Creates a new MushroomCloud card instance
     * 
     * @param {string} name - Card name (default: "MushroomCloud")
     * @param {number} cost - Mana cost (default: 5)
     * @param {number} dotDamage - Damage per tick (default: 4)
     */
    constructor(name = "MushroomCloud", cost = 5, dotDamage = 4) {
        // Define the effect object for this card
        const effect = {
            type: 'damage_over_time',
            target: 'enemy',
            value: dotDamage,
            description: `Apply ${dotDamage} Poison DoT for 3 turns. -25% enemy accuracy.`,
            dotDamage: dotDamage,
            dotDuration: 3,
            accuracyReduction: 0.25
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🍄'            // Emoji - mushroom
        );

        // MushroomCloud-specific properties
        this.dotDamage = dotDamage;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'damage_over_time';
        this.castTime = 'instant';
        
        // DoT and debuff mechanics
        this.dotDuration = 3;
        this.accuracyReduction = 0.25;

        console.log(`MushroomCloud card created: ${this.name} (${this.dotDamage} DoT, Cost: ${this.cost})`);
    }

    /**
     * Executes the MushroomCloud card's effect
     * 
     * Creates a toxic spore cloud that poisons the enemy.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for MushroomCloud effect');
            return { success: false, reason: 'no_target' };
        }

        // Apply initial small damage
        const initialDamage = Math.floor(this.dotDamage * 0.5);
        if (initialDamage > 0) {
            const newEnemyHp = gameState.enemyHp - initialDamage;
            gameState.updateEnemyHp(newEnemyHp);
            gameState.lastDamageDealt = initialDamage;
        }

        // Create poison DoT effect
        const poisonEffect = {
            name: 'spore_poison',
            type: 'poison',
            damagePerTick: this.dotDamage,
            duration: this.dotDuration,
            turnsRemaining: this.dotDuration,
            source: this.name,
            emoji: '🍄',
            accuracyReduction: this.accuracyReduction
        };

        // Create accuracy debuff
        const accuracyDebuff = {
            name: 'spore_cloud',
            type: 'debuff',
            accuracyReduction: this.accuracyReduction,
            duration: this.dotDuration,
            turnsRemaining: this.dotDuration,
            source: this.name,
            emoji: '☁️'
        };

        // Apply effects
        if (typeof gameState.enemy?.addEffect === 'function') {
            gameState.enemy.addEffect(poisonEffect);
            gameState.enemy.addEffect(accuracyDebuff);
        }

        console.log(
            `MushroomCloud released: ${this.dotDamage} poison DoT for ${this.dotDuration} turns, ` +
            `- ${this.accuracyReduction * 100}% accuracy`
        );

        // Return result object
        return {
            success: true,
            message: `Toxic spores engulf the enemy! ${this.dotDamage} DoT + reduced accuracy`,
            damage: initialDamage,
            healing: 0,
            statusEffects: [poisonEffect, accuracyDebuff],
            isCriticalHit: false,
            dotApplied: true,
            dotDamage: this.dotDamage,
            dotDuration: this.dotDuration,
            accuracyReduction: this.accuracyReduction,
            initialDamage: initialDamage,
            spellType: this.spellType
        };
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🍄`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `${this.dotDamage}/tick | ${this.dotDuration} turns | -${this.accuracyReduction * 100}% Acc`;
    }
}
