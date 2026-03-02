/**
 * SeedBomb Card - Explosive Growth
 * 
 * ============================================================================
 * LORE:
 * "The seed contains the tree. But what if the tree exploded outward
 * the moment it was planted? What if growth itself became a weapon?
 * This is the paradox of the seed bomb."
 * - The Explosive Botanist, Dangerous Horticulture
 * 
 * SeedBomb hurls acorns imbued with accelerated growth magic. Upon impact,
 * the seeds instantly sprout and explode outward in a burst of wood and
 * leaves. The effect is more shrapnel than spell, but the magic is what
 * drives the violent germination.
 * 
 * The spell is messy and somewhat unpredictable, but the sheer volume
 * of plant matter it creates can overwhelm even well-armored foes.
 * ============================================================================
 * 
 * @module cards/nature/SeedBomb
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * SeedBomb Card Class
 * 
 * A multi-hit nature attack card.
 * 
 * @extends Card
 */
export class SeedBomb extends Card {
    /**
     * Creates a new SeedBomb card instance
     * 
     * @param {string} name - Card name (default: "SeedBomb")
     * @param {number} cost - Mana cost (default: 5)
     * @param {number} damagePerHit - Damage per hit (default: 4)
     */
    constructor(name = "SeedBomb", cost = 5, damagePerHit = 4) {
        // Define the effect object for this card
        const effect = {
            type: 'multi_hit',
            target: 'enemy',
            value: damagePerHit,
            description: `Strike 3 times for ${damagePerHit}-${damagePerHit * 2} damage each`,
            hitCount: 3,
            minDamage: damagePerHit,
            maxDamage: damagePerHit * 2
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🌰'            // Emoji - chestnut/seed
        );

        // SeedBomb-specific properties
        this.damagePerHit = damagePerHit;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'area_barrage';
        this.castTime = 'instant';
        
        // Multi-hit mechanics
        this.hitCount = 3;
        this.minDamage = damagePerHit;
        this.maxDamage = damagePerHit * 2;

        console.log(`SeedBomb card created: ${this.name} (${this.hitCount} hits, Cost: ${this.cost})`);
    }

    /**
     * Executes the SeedBomb card's effect
     * 
     * Hurls explosive seeds that hit multiple times.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for SeedBomb effect');
            return { success: false, reason: 'no_target' };
        }

        let totalDamage = 0;
        const hitDamages = [];

        console.log(`SeedBomb launched! ${this.hitCount} explosive seeds incoming...`);

        // Apply each hit
        for (let i = 0; i < this.hitCount; i++) {
            // Calculate damage for this hit
            const damageRange = this.maxDamage - this.minDamage;
            let hitDamage = this.minDamage + Math.floor(Math.random() * (damageRange + 1));
            
            // Apply damage
            const newEnemyHp = gameState.enemyHp - hitDamage;
            gameState.updateEnemyHp(newEnemyHp);
            totalDamage += hitDamage;
            hitDamages.push(hitDamage);

            console.log(`Seed ${i + 1}/${this.hitCount}: ${hitDamage} damage`);

            // Stop if enemy is defeated
            if (gameState.enemyHp <= 0) {
                console.log(`Enemy defeated on seed ${i + 1}!`);
                break;
            }
        }

        gameState.lastDamageDealt = totalDamage;

        console.log(`SeedBomb complete: ${totalDamage} total damage over ${hitDamages.length} hits`);

        // Return result object
        return {
            success: true,
            message: `SeedBomb explodes for ${totalDamage} damage!`,
            damage: totalDamage,
            healing: 0,
            statusEffects: [],
            isCriticalHit: false,
            hitCount: hitDamages.length,
            hitDamages: hitDamages,
            totalDamage: totalDamage,
            spellType: this.spellType
        };
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🌰`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `${this.hitCount}× ${this.minDamage}-${this.maxDamage} | Max: ${this.minDamage * this.hitCount}`;
    }
}
