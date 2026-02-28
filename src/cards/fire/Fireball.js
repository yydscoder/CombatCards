/**
 * Fireball Card - Basic Fire Attack
 * 
 * ============================================================================
 * LORE:
 * "The first spell every fire mage learns, yet never the last they master."
 * - Archmage Pyros, Tome of Flames
 * 
 * A concentrated sphere of flame that rockets toward its target with 
 * devastating force. The fireball is the cornerstone of fire magic,
 * beloved by apprentices and archmages alike for its reliability and
 * raw destructive power.
 * 
 * Legend says the original fireball was stolen from the heart of a 
 * volcano by the first fire mages, who bound its essence into a 
 * reproducible spell formula.
 * ============================================================================
 * 
 * @module cards/Fireball
 */

// Import the base Card class
import { Card } from './Card.js';

/**
 * Fireball Card Class
 * 
 * A straightforward fire attack that deals moderate damage.
 * Has a small chance to leave a burning effect on the target.
 * 
 * @extends Card
 */
export class Fireball extends Card {
    /**
     * Creates a new Fireball card instance
     * 
     * @param {string} name - Card name (default: "Fireball")
     * @param {number} cost - Mana cost (default: 4)
     * @param {number} damage - Base damage (default: 8)
     */
    constructor(name = "Fireball", cost = 4, damage = 8) {
        // Define the effect object for this card
        const effect = {
            type: 'damage',
            target: 'enemy',
            value: damage,
            description: `Deals ${damage} damage to the enemy. 10% chance to burn.`,
            burnChance: 0.10,
            burnDamage: 2,
            burnDuration: 2
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🔵'            // Emoji - blue fireball core
        );

        // Fireball-specific properties
        this.damage = damage;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'projectile';
        this.castTime = 'instant';
        
        // Burn effect properties
        this.burnChance = 0.10;
        this.burnDamage = 2;
        this.burnDuration = 2;

        console.log(`Fireball card created: ${this.name} (Damage: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Fireball card's effect
     * 
     * Launches a fireball at the enemy, dealing damage with a chance
     * to apply a burning status effect.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Fireball effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate base damage
        let actualDamage = this.damage;
        
        // Check for critical hit (12% base chance for fireball)
        const isCriticalHit = Math.random() < 0.12;
        
        if (isCriticalHit) {
            actualDamage *= 1.5;
            gameState.isCriticalHit = true;
            console.log(`Fireball Critical Hit! Damage multiplier: 1.5x`);
        } else {
            gameState.isCriticalHit = false;
        }

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        // Check for burn effect application
        const burnApplied = Math.random() < this.burnChance;
        let burnEffect = null;
        
        if (burnApplied) {
            burnEffect = {
                name: 'burn',
                damagePerTurn: this.burnDamage,
                duration: this.burnDuration,
                source: this.name
            };
            
            // Add burn effect to enemy if they have effect handling
            if (gameState.enemy && typeof gameState.enemy.addEffect === 'function') {
                gameState.enemy.addEffect(burnEffect);
            }
            
            console.log(`Fireball burn effect applied! ${this.burnDamage} damage/turn for ${this.burnDuration} turns`);
        }

        console.log(`Fireball executed: ${this.name} dealt ${actualDamage} damage to enemy${burnApplied ? ' + BURN!' : ''}`);

        // Return result object
        return {
            success: true,
            message: `Fireball dealt ${actualDamage} damage${burnApplied ? ` and burned the enemy!` : ''}`,
            damage: actualDamage,
            healing: 0,
            statusEffects: burnApplied ? [burnEffect] : [],
            isCriticalHit: isCriticalHit,
            burnApplied: burnApplied
        };
    }

    /**
     * Gets the card's display name with fireball-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🔵`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with burn info
     */
    getStatsString() {
        return `DMG: ${this.damage} | Burn: ${this.burnChance * 100}%`;
    }
}
