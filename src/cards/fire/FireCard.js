/**
 * Fire Card Implementation for Emoji Card Battle
 * 
 * This class extends the base Card class to implement a fire-themed card.
 * It represents a basic fire attack that deals damage to the enemy.
 * 
 * The FireCard demonstrates how to extend the base card functionality
 * with specific effect implementation and visual representation.
 */

// Import the base Card class
import { Card } from './Card.js';

/**
 * Creates a new FireCard instance
 * 
 * @param {string} name - The name of the fire card (default: "Fire Blast")
 * @param {number} cost - The mana cost to play this card (default: 5)
 * @param {number} damage - The damage amount this card deals (default: 10)
 */
export class FireCard extends Card {
    constructor(name = "Fire Blast", cost = 5, damage = 10) {
        // Define the effect object for this card
        const effect = {
            type: 'damage',
            target: 'enemy',
            value: damage,
            description: `Deals ${damage} damage to the enemy`
        };
        
        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🔥'            // Emoji representation
        );
        
        // Fire-specific properties
        this.damage = damage; // Damage value for this fire card
        this.element = 'fire'; // Element type for this card
        this.isElemental = true; // Flag indicating elemental card
        
        // Log fire card creation for debugging and tracking
        console.log(`FireCard created: ${this.name} (Damage: ${this.damage}, Cost: ${this.cost})`);
    }
    
    /**
     * Executes the fire card's effect
     * 
     * This method overrides the base executeEffect method to implement
     * the specific fire damage effect.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (e.g., enemy)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for FireCard effect');
            return { success: false, reason: 'no_target' };
        }
        
        // Calculate damage with potential critical hit
        let actualDamage = this.damage;
        const isCriticalHit = Math.random() < 0.15; // 15% chance for critical hit
        
        if (isCriticalHit) {
            actualDamage *= 1.5; // Critical hits deal 1.5x damage
            gameState.isCriticalHit = true;
            console.log(`Critical hit! Damage multiplier: 1.5x`);
        } else {
            gameState.isCriticalHit = false;
        }
        
        // Apply damage to the target (enemy)
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        
        // Update game state with damage information
        gameState.lastDamageDealt = actualDamage;
        
        // Log the effect execution for debugging
        console.log(`FireCard effect executed: ${this.name} dealt ${actualDamage} damage to enemy`);
        
        // Return result object
        return {
            success: true,
            message: `${this.name} dealt ${actualDamage} damage to the enemy`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [],
            isCriticalHit: isCriticalHit
        };
    }
    
    /**
     * Gets the card's display name with elemental information
     * 
     * @returns {string} Formatted display name with elemental info
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🔥`;
    }
    
    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with damage info
     */
    getStatsString() {
        return `Cost: ${this.cost} | Damage: ${this.damage}`;
    }
}