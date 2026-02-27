/**
 * Slime Enemy Implementation for Emoji Card Battle
 * 
 * This class extends the base Enemy class to implement a slime enemy.
 * It represents a basic enemy that deals damage and has simple AI behavior.
 * 
 * The SlimeEnemy demonstrates how to extend the base enemy functionality
 * with specific stats and behavior implementation.
 */

// Import the base Enemy class
import { Enemy } from './Enemy.js';

/**
 * Creates a new SlimeEnemy instance
 * 
 * @param {string} name - The name of the slime enemy (default: "Slime")
 * @param {number} maxHp - The maximum health points of the slime (default: 80)
 * @param {number} attack - The attack power of the slime (default: 12)
 */
export class SlimeEnemy extends Enemy {
    constructor(name = "Slime", maxHp = 80, attack = 12) {
        // Define enemy stats
        const stats = {
            defense: 5,      // Slime has some natural defense
            speed: 0.8,      // Slime is relatively slow
            aggression: 0.6, // Slime is moderately aggressive
            intelligence: 0.2 // Slime is not very intelligent
        };
        
        // Call parent constructor with enemy properties
        super(
            name,           // Enemy name
            maxHp,          // Maximum HP
            attack,         // Attack power
            '🟢',           // Emoji representation (green circle for slime)
            stats           // Additional stats
        );
        
        // Slime-specific properties
        this.type = 'slime'; // Enemy type for identification
        this.isGelatinous = true; // Flag indicating gelatinous nature
        
        // Log slime enemy creation for debugging and tracking
        console.log(`SlimeEnemy created: ${this.name} (HP: ${this.maxHp}, Attack: ${this.attackPower})`);
    }
    
    /**
     * Overrides the takeDamage method to add slime-specific behavior
     * 
     * Slimes have a chance to split when damaged, creating a smaller version of themselves.
     * 
     * @param {number} damage - The raw damage amount before calculations
     * @param {Object} attackInfo - Information about the attack
     * @returns {Object} Result object containing damage taken and status
     */
    takeDamage(damage, attackInfo = {}) {
        // Call parent takeDamage method first
        const result = super.takeDamage(damage, attackInfo);
        
        // Slime-specific behavior: chance to split when damaged
        if (result.success && this.isAlive && Math.random() < 0.2) { // 20% chance to split
            console.log(`${this.name} splits into two smaller slimes!`);
            
            // Create a smaller slime (half HP, reduced attack)
            const smallerSlime = new SlimeEnemy(
                `${this.name} (Small)`,
                Math.max(1, Math.floor(this.maxHp / 2)),
                Math.max(1, Math.floor(this.attackPower / 2))
            );
            
            // Add the smaller slime to the game state (would be handled by game manager in real implementation)
            console.log(`Created smaller slime: ${smallerSlime.name} (HP: ${smallerSlime.maxHp}, Attack: ${smallerSlime.attackPower})`);
        }
        
        return result;
    }
    
    /**
     * Overrides the attack method to add slime-specific behavior
     * 
     * Slimes have a chance to poison the player when they attack.
     * 
     * @param {Object} gameState - The current game state object
     * @returns {Object} Result object containing attack details
     */
    attack(gameState) {
        // Call parent attack method first
        const result = super.attack(gameState);
        
        // Slime-specific behavior: chance to poison player
        if (result.success && Math.random() < 0.3) { // 30% chance to poison
            console.log(`${this.name} poisons the player!`);
            
            // Add poison effect to player (would be handled by game state in real implementation)
            result.poisonEffect = {
                duration: 3, // 3 turns of poison
                damagePerTurn: 2
            };
            
            console.log(`Player poisoned for ${result.poisonEffect.duration} turns, ${result.poisonEffect.damagePerTurn} damage per turn`);
        }
        
        return result;
    }
    
    /**
     * Gets the enemy's display name with slime-specific information
     * 
     * @returns {string} Formatted display name with slime info
     */
    getDisplayName() {
        return `${this.name} [${this.hp}/${this.maxHp} HP] 🟢`;
    }
    
    /**
     * Gets the enemy's stats as a string for display
     * 
     * @returns {string} Formatted stats string with slime info
     */
    getStatsString() {
        return `Attack: ${this.attackPower} | Defense: ${this.defense} | Type: ${this.type}`;
    }
}