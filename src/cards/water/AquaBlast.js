/**
 * AquaBlast Card - Concentrated Water Strike
 * 
 * ============================================================================
 * LORE:
 * "Water is soft, they say. Water yields. But ask the canyon walls
 * about the river's patience. Ask the stone about the drop that never
 * stops falling."
 * - The Water Sages, Parables of Flow
 * 
 * AquaBlast focuses water into a dense sphere that strikes with tremendous
 * force. The spell demonstrates water's hidden power - not the rage of
 * fire or the permanence of ice, but the relentless pressure that shapes
 * mountains over eons.
 * 
 * The blast is pure kinetic energy, a hammer blow of liquid that can
 * shatter armor and break bones through sheer impact force.
 * ============================================================================
 * 
 * @module cards/water/AquaBlast
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * AquaBlast Card Class
 * 
 * A mid-cost water attack that deals solid damage.
 * Has armor penetration (ignores some defense).
 * 
 * @extends Card
 */
export class AquaBlast extends Card {
    /**
     * Creates a new AquaBlast card instance
     * 
     * @param {string} name - Card name (default: "AquaBlast")
     * @param {number} cost - Mana cost (default: 5)
     * @param {number} damage - Base damage (default: 11)
     */
    constructor(name = "AquaBlast", cost = 5, damage = 11) {
        // Define the effect object for this card
        const effect = {
            type: 'damage',
            target: 'enemy',
            value: damage,
            description: `Deals ${damage} damage. Ignores 30% enemy defense`,
            defensePenetration: 0.30
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '💦'            // Emoji - splash
        );

        // AquaBlast-specific properties
        this.damage = damage;
        this.element = 'water';
        this.isElemental = true;
        this.spellType = 'projectile';
        this.castTime = 'instant';
        
        // Defense penetration
        this.defensePenetration = 0.30;

        console.log(`AquaBlast card created: ${this.name} (Damage: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the AquaBlast card's effect
     * 
     * Fires a concentrated blast of water that penetrates enemy defense.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for AquaBlast effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate base damage
        let actualDamage = this.damage;
        
        // Check for critical hit (15% base chance)
        const isCriticalHit = Math.random() < 0.15;
        
        if (isCriticalHit) {
            actualDamage *= 1.5;
            gameState.isCriticalHit = true;
            console.log(`AquaBlast Critical Hit! Damage multiplier: 1.5x`);
        } else {
            gameState.isCriticalHit = false;
        }

        // Apply defense penetration
        let defenseValue = gameState.enemy?.defense || 0;
        let effectiveDefense = defenseValue * (1 - this.defensePenetration);
        let defenseReduction = Math.min(effectiveDefense / 100, 0.5);
        actualDamage = actualDamage * (1 - defenseReduction);

        // Apply random variation (±20%)
        const variation = 0.8 + Math.random() * 0.4;
        actualDamage = Math.floor(actualDamage * variation);

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        console.log(
            `AquaBlast executed: ${this.name} dealt ${actualDamage} damage ` +
            `(ignored ${this.defensePenetration * 100}% defense)`
        );

        // Return result object
        return {
            success: true,
            message: `AquaBlast struck for ${actualDamage} damage!`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [],
            isCriticalHit: isCriticalHit,
            defensePenetrated: defenseValue * this.defensePenetration,
            defensePenetration: this.defensePenetration,
            spellType: this.spellType
        };
    }

    /**
     * Gets the card's display name with AquaBlast-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 💦`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with penetration info
     */
    getStatsString() {
        return `DMG: ${this.damage} | Pen: ${this.defensePenetration * 100}%`;
    }
}
