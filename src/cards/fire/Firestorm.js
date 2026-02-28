/**
 * Firestorm Card - Tempest of Flames
 * 
 * ============================================================================
 * LORE:
 * "The sky rained fire for seven days and seven nights. Those who 
 * survived called it the Firestorm. Those who didn't... called it nothing."
 * - Chronicle of the Burning Age, Line 1
 * 
 * Firestorm is a catastrophic spell that tears open rifts to the 
 * elemental plane of fire, causing meteors and flames to rain down
 * upon the battlefield. Each impact is unpredictable, striking with
 * varying intensity across multiple moments.
 * 
 * Ancient battlemages developed this spell to break siege lines and
 * devastate fortified positions. The psychological impact of watching
 * fire rain from above is said to be as devastating as the physical damage.
 * ============================================================================
 * 
 * @module cards/Firestorm
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Firestorm Card Class
 * 
 * A multi-hit card that strikes the enemy 3-5 times with random
 * damage on each hit. Total damage potential is high but inconsistent.
 * 
 * @extends Card
 */
export class Firestorm extends Card {
    /**
     * Creates a new Firestorm card instance
     * 
     * @param {string} name - Card name (default: "Firestorm")
     * @param {number} cost - Mana cost (default: 7)
     * @param {number} damagePerHit - Base damage per hit (default: 4)
     */
    constructor(name = "Firestorm", cost = 7, damagePerHit = 4) {
        // Define the effect object for this card
        const effect = {
            type: 'multi_hit',
            target: 'enemy',
            value: damagePerHit,
            description: `Strike 3-5 times for ${damagePerHit}-${damagePerHit * 2} damage each`,
            minHits: 3,
            maxHits: 5,
            damageVariance: 1.0
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            'ðŸŒªï¸'            // Emoji - fire tornado/storm
        );

        // Firestorm-specific properties
        this.damagePerHit = damagePerHit;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'area_barrage';
        this.castTime = 'channeled';
        
        // Multi-hit mechanics
        this.minHits = 3;
        this.maxHits = 5;
        this.damageVariance = 1.0; // Can vary from 1x to 2x per hit

        console.log(`Firestorm card created: ${this.name} (Hits: ${this.minHits}-${this.maxHits}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Firestorm card's effect
     * 
     * Calls down a storm of fire that strikes the enemy multiple times
     * with varying damage on each impact.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Firestorm effect');
            return { success: false, reason: 'no_target' };
        }

        // Determine number of hits (random between min and max)
        const numberOfHits = Math.floor(
            Math.random() * (this.maxHits - this.minHits + 1)
        ) + this.minHits;

        let totalDamage = 0;
        const hitDamages = [];
        let criticalHits = 0;

        console.log(`Firestorm summoned! ${numberOfHits} impacts incoming...`);

        // Apply each hit
        for (let i = 0; i < numberOfHits; i++) {
            // Calculate damage for this hit (base to double)
            const hitMultiplier = 1 + Math.random() * this.damageVariance;
            let hitDamage = Math.floor(this.damagePerHit * hitMultiplier);
            
            // Check for critical hit on this strike (10% per hit)
            const isCrit = Math.random() < 0.10;
            if (isCrit) {
                hitDamage = Math.floor(hitDamage * 1.5);
                criticalHits++;
            }

            hitDamages.push(hitDamage);
            totalDamage += hitDamage;

            // Apply damage incrementally (for visual feedback in real game)
            const newEnemyHp = gameState.enemyHp - hitDamage;
            gameState.updateEnemyHp(newEnemyHp);

            // Stop if enemy is defeated
            if (gameState.enemyHp <= 0) {
                console.log(`Firestorm hit ${i + 1}/${numberOfHits}: ${hitDamage} damage - ENEMY DEFEATED!`);
                break;
            }

            console.log(`Firestorm hit ${i + 1}/${numberOfHits}: ${hitDamage} damage${isCrit ? ' (CRIT!)' : ''}`);
        }

        gameState.lastDamageDealt = totalDamage;

        console.log(
            `Firestorm complete: ${totalDamage} total damage over ${hitDamages.length} hits` +
            `${criticalHits > 0 ? ` (${criticalHits} crits)` : ''}`
        );

        // Return result object
        return {
            success: true,
            message: `Firestorm rained ${hitDamages.length} hits for ${totalDamage} total damage!`,
            damage: totalDamage,
            healing: 0,
            statusEffects: [],
            isCriticalHit: criticalHits > 0,
            numberOfHits: hitDamages.length,
            hitDamages: hitDamages,
            criticalHits: criticalHits,
            averageHitDamage: totalDamage / hitDamages.length,
            spellType: this.spellType
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * Firestorm is best used against high-HP enemies to maximize hits.
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

        // Firestorm needs a valid target
        const hasTarget = gameState.enemyHp > 0;

        // Optimal usage: enemy has enough HP to absorb multiple hits
        const enemyHasEnoughHp = gameState.enemyHp >= this.damagePerHit * this.minHits;

        return hasEnoughMana && isInHand && isNotOnCooldown && hasTarget;
    }

    /**
     * Gets the card's display name with Firestorm-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ðŸŒªï¸`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with multi-hit info
     */
    getStatsString() {
        const minTotal = this.damagePerHit * this.minHits;
        const maxTotal = this.damagePerHit * 2 * this.maxHits;
        return `Hits: ${this.minHits}-${this.maxHits} | DMG: ${minTotal}-${maxTotal}`;
    }
}
