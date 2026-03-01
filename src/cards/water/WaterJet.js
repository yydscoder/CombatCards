/**
 * WaterJet Card - Basic Water Attack
 * 
 * ============================================================================
 * LORE:
 * "A single drop, focused to a razor point, can pierce the hardest stone.
 * Water is not gentle when it chooses to strike."
 * - Master of Tides, Teachings of the Flow
 * 
 * WaterJet is the fundamental water spell, compressing moisture into a
 * high-pressure stream that strikes with surprising force. While not as
 * flashy as fire magic, water spells are reliable and conserve the caster's
 * energy.
 * 
 * Young mages often learn WaterJet as their first offensive spell. Its
 * simple form makes it easy to master, and its low mana cost allows for
 * repeated casting during prolonged battles.
 * ============================================================================
 * 
 * @module cards/water/WaterJet
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * WaterJet Card Class
 * 
 * A basic water attack that deals moderate damage.
 * Has a small chance to apply a wet debuff that increases vulnerability.
 * 
 * @extends Card
 */
export class WaterJet extends Card {
    /**
     * Creates a new WaterJet card instance
     * 
     * @param {string} name - Card name (default: "WaterJet")
     * @param {number} cost - Mana cost (default: 2)
     * @param {number} damage - Base damage (default: 5)
     */
    constructor(name = "WaterJet", cost = 2, damage = 5) {
        // Define the effect object for this card
        const effect = {
            type: 'damage',
            target: 'enemy',
            value: damage,
            description: `Deals ${damage} damage. 15% chance to Wet (increases damage taken)`,
            wetChance: 0.15,
            wetMultiplier: 1.25,
            wetDuration: 2
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '💧'            // Emoji - water droplet
        );

        // WaterJet-specific properties
        this.damage = damage;
        this.element = 'water';
        this.isElemental = true;
        this.spellType = 'projectile';
        this.castTime = 'instant';
        
        // Wet effect properties
        this.wetChance = 0.15;
        this.wetMultiplier = 1.25;
        this.wetDuration = 2;

        console.log(`WaterJet card created: ${this.name} (Damage: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the WaterJet card's effect
     * 
     * Fires a jet of water at the enemy, dealing damage with a chance
     * to apply the Wet debuff.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for WaterJet effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate base damage
        let actualDamage = this.damage;
        
        // Check for critical hit (12% base chance)
        const isCriticalHit = Math.random() < 0.12;
        
        if (isCriticalHit) {
            actualDamage *= 1.5;
            gameState.isCriticalHit = true;
            console.log(`WaterJet Critical Hit! Damage multiplier: 1.5x`);
        } else {
            gameState.isCriticalHit = false;
        }

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        // Check for Wet effect application
        const wetApplied = Math.random() < this.wetChance;
        let wetEffect = null;
        
        if (wetApplied) {
            wetEffect = {
                name: 'wet',
                damageMultiplier: this.wetMultiplier,
                duration: this.wetDuration,
                source: this.name,
                type: 'debuff'
            };
            
            // Add wet effect to enemy
            if (gameState.enemy && typeof gameState.enemy.addEffect === 'function') {
                gameState.enemy.addEffect(wetEffect);
            }
            
            console.log(`WaterJet Wet effect applied! Enemy takes ${this.wetMultiplier * 100}% damage for ${this.wetDuration} turns`);
        }

        console.log(`WaterJet executed: ${this.name} dealt ${actualDamage} damage to enemy${wetApplied ? ' + WET!' : ''}`);

        // Return result object
        return {
            success: true,
            message: `WaterJet dealt ${actualDamage} damage${wetApplied ? ` and soaked the enemy!` : ''}`,
            damage: actualDamage,
            healing: 0,
            statusEffects: wetApplied ? [wetEffect] : [],
            isCriticalHit: isCriticalHit,
            wetApplied: wetApplied,
            wetMultiplier: this.wetMultiplier,
            wetDuration: this.wetDuration
        };
    }

    /**
     * Gets the card's display name with WaterJet-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 💧`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with wet info
     */
    getStatsString() {
        return `DMG: ${this.damage} | Wet: ${this.wetChance * 100}%`;
    }
}
