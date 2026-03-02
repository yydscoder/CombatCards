/**
 * WildGrowth Card - Uncontrolled Flourishing
 * 
 * ============================================================================
 * LORE:
 * "Nature does not ask permission. It grows where it can, when it can,
 * as much as it can. To call upon wild growth is to unleash that primal
 * urge without restraint."
 * - The Untamed Circle, Philosophy of Excess
 * 
 * WildGrowth causes rapid, uncontrolled plant growth that overwhelms the
 * battlefield. Vines, weeds, and flowers erupt from every surface, creating
 * a chaotic jungle that favors the caster.
 * 
 * The spell is powerful but unpredictable. Even experienced druids cannot
 * fully control what sprouts from the magical soil.
 * ============================================================================
 * 
 * @module cards/nature/WildGrowth
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * WildGrowth Card Class
 * 
 * A DoT card that deals increasing damage each turn.
 * 
 * @extends Card
 */
export class WildGrowth extends Card {
    /**
     * Creates a new WildGrowth card instance
     * 
     * @param {string} name - Card name (default: "WildGrowth")
     * @param {number} cost - Mana cost (default: 6)
     * @param {number} initialDamage - Initial tick damage (default: 3)
     */
    constructor(name = "WildGrowth", cost = 6, initialDamage = 3) {
        // Define the effect object for this card
        const effect = {
            type: 'damage_over_time',
            target: 'enemy',
            value: initialDamage,
            description: `Deal ${initialDamage} damage, doubling each turn for 3 turns`,
            initialDamage: initialDamage,
            growthMultiplier: 2.0,
            duration: 3
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🌾'            // Emoji - sheaf of rice (growth)
        );

        // WildGrowth-specific properties
        this.initialDamage = initialDamage;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'damage_over_time';
        this.castTime = 'ritual';
        
        // Growth mechanics
        this.growthMultiplier = 2.0;
        this.duration = 3;

        console.log(`WildGrowth card created: ${this.name} (${this.initialDamage} initial, Cost: ${this.cost})`);
    }

    /**
     * Executes the WildGrowth card's effect
     * 
     * Applies a growing DoT that doubles each turn.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for WildGrowth effect');
            return { success: false, reason: 'no_target' };
        }

        // Create wild growth effect
        const growthEffect = {
            name: 'wild_growth',
            type: 'nature_dot',
            initialDamage: this.initialDamage,
            currentDamage: this.initialDamage,
            growthMultiplier: this.growthMultiplier,
            duration: this.duration,
            turnsRemaining: this.duration,
            source: this.name,
            emoji: '🌾',
            totalPotentialDamage: this.calculateTotalDamage()
        };

        // Apply initial damage
        const initialTick = Math.floor(this.initialDamage * 0.5);
        if (initialTick > 0) {
            const newEnemyHp = gameState.enemyHp - initialTick;
            gameState.updateEnemyHp(newEnemyHp);
            gameState.lastDamageDealt = initialTick;
        }

        // Add effect to game state
        if (typeof gameState.enemy?.addEffect === 'function') {
            gameState.enemy.addEffect(growthEffect);
        }

        console.log(
            `WildGrowth planted: ${initialTick} initial, growing to ${this.calculateTotalDamage()} total`
        );

        // Return result object
        return {
            success: true,
            message: `Wild growth overtakes the enemy! Damage doubles each turn!`,
            damage: initialTick,
            healing: 0,
            statusEffects: [growthEffect],
            isCriticalHit: false,
            dotApplied: true,
            initialDamage: initialTick,
            growthMultiplier: this.growthMultiplier,
            duration: this.duration,
            totalPotentialDamage: this.calculateTotalDamage(),
            spellType: this.spellType
        };
    }

    /**
     * Calculates total potential damage
     * 
     * @returns {number} Total damage over all turns
     */
    calculateTotalDamage() {
        let total = 0;
        let damage = this.initialDamage;
        for (let i = 0; i < this.duration; i++) {
            total += damage;
            damage *= this.growthMultiplier;
        }
        return Math.floor(total);
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🌾`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `Start: ${this.initialDamage} | ×2/turn | Total: ${this.calculateTotalDamage()}`;
    }
}
