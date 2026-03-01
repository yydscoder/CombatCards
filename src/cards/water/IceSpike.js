/**
 * IceSpike Card - Piercing Ice
 * 
 * ============================================================================
 * LORE:
 * "Ice remembers. Every drop of water that froze, every chill wind that
 * bit - it all becomes part of the ice. And when the spike forms, that
 * memory becomes a weapon."
 * - The Ice Shapers, Songs of the Frozen
 * 
 * IceSpike conjures a razor-sharp spear of ice that flies unerringly toward
 * its target. The spike is unnaturally cold, drawing heat from everything
 * it touches. Even a glancing blow leaves frostbite in its wake.
 * 
 * The spell is precise and efficient, favored by mages who value accuracy
 * over raw power. A well-placed IceSpike can pierce armor and chill bone
 * with minimal mana expenditure.
 * ============================================================================
 * 
 * @module cards/water/IceSpike
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * IceSpike Card Class
 * 
 * A low-cost ice attack with high crit chance.
 * 
 * @extends Card
 */
export class IceSpike extends Card {
    /**
     * Creates a new IceSpike card instance
     * 
     * @param {string} name - Card name (default: "IceSpike")
     * @param {number} cost - Mana cost (default: 2)
     * @param {number} damage - Base damage (default: 6)
     */
    constructor(name = "IceSpike", cost = 2, damage = 6) {
        // Define the effect object for this card
        const effect = {
            type: 'damage',
            target: 'enemy',
            value: damage,
            description: `Deals ${damage} damage. 25% crit chance`,
            critChance: 0.25,
            critMultiplier: 1.5
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🗡️'            // Emoji - dagger (ice spike)
        );

        // IceSpike-specific properties
        this.damage = damage;
        this.element = 'ice';
        this.isElemental = true;
        this.spellType = 'projectile';
        this.castTime = 'instant';
        
        // Critical hit mechanics
        this.critChance = 0.25;
        this.critMultiplier = 1.5;

        console.log(`IceSpike card created: ${this.name} (Damage: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the IceSpike card's effect
     * 
     * Fires a sharp ice spike at the enemy.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for IceSpike effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate base damage
        let actualDamage = this.damage;
        
        // Check for critical hit (25% base chance)
        const isCriticalHit = Math.random() < this.critChance;
        
        if (isCriticalHit) {
            actualDamage *= this.critMultiplier;
            gameState.isCriticalHit = true;
            console.log(`IceSpike Critical Hit! Damage multiplier: ${this.critMultiplier}x`);
        } else {
            gameState.isCriticalHit = false;
        }

        // Apply random variation (±20%)
        const variation = 0.8 + Math.random() * 0.4;
        actualDamage = Math.floor(actualDamage * variation);

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        console.log(`IceSpike executed: ${this.name} dealt ${actualDamage} damage${isCriticalHit ? ' (CRIT!)' : ''}`);

        // Return result object
        return {
            success: true,
            message: `IceSpike pierced for ${actualDamage} damage${isCriticalHit ? ' (Critical!)' : ''}`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [],
            isCriticalHit: isCriticalHit,
            critChance: this.critChance,
            critMultiplier: this.critMultiplier,
            spellType: this.spellType
        };
    }

    /**
     * Gets the card's display name with IceSpike-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🗡️`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with crit info
     */
    getStatsString() {
        return `DMG: ${this.damage} | Crit: ${this.critChance * 100}%`;
    }
}
