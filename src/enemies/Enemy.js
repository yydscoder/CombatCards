/**
 * Base Enemy Class for Emoji Card Battle
 * 
 * This is the foundational class for all enemies in the game.
 * It defines the common properties and methods that all enemies will inherit.
 * Each enemy type will extend this class to implement specific behaviors.
 * 
 * The base class provides:
 * - Core enemy properties (name, hp, attack, emoji)
 * - Standard methods for enemy behavior and state management
 * - Utility functions for enemy AI and combat interactions
 */

/**
 * Creates a new Enemy instance
 * 
 * @param {string} name - The name of the enemy (e.g., "Slime")
 * @param {number} maxHp - The maximum health points of the enemy
 * @param {number} attack - The base attack power of the enemy
 * @param {string} emoji - The emoji representation of the enemy
 * @param {Object} stats - Additional enemy statistics (defense, speed, etc.)
 */
export class Enemy {
    constructor(name, maxHp, attack, emoji, stats = {}) {
        // Enemy identification properties
        this.id = Math.random().toString(36).substring(2, 9); // Unique ID for tracking
        this.name = name; // Human-readable name of the enemy
        this.emoji = emoji; // Visual representation using emoji
        
        // Combat properties
        this.maxHp = maxHp; // Maximum health points
        this.hp = maxHp; // Current health points (starts at max)
        this.attackPower = attack; // Base attack power
        this.defense = stats.defense || 0; // Defense value (reduces incoming damage)
        this.speed = stats.speed || 1; // Speed value (affects turn order)
        
        // Enemy state properties
        this.isAlive = true; // Whether the enemy is currently alive
        this.isStunned = false; // Whether the enemy is stunned (cannot act)
        this.isPoisoned = false; // Whether the enemy is poisoned (takes damage over time)
        this.poisonDamage = 0; // Damage per turn from poison
        
        // Active status effects (DoT, debuffs, stuns, etc.)
        this.activeEffects = [];

        // AI behavior properties
        this.aggression = stats.aggression || 0.5; // How aggressive the enemy is (0-1)
        this.intelligence = stats.intelligence || 0.3; // How intelligent the enemy is (0-1)
        
        // Metadata properties
        this.createdTimestamp = Date.now(); // When the enemy was created
        this.lastActionTimestamp = null; // When the enemy last took action
        
        // Log enemy creation for debugging and tracking
        console.log(`Enemy created: ${this.name} (ID: ${this.id}, HP: ${this.maxHp}, Attack: ${this.attackPower})`);
    }
    
    /**
     * Takes damage from an attack
     * 
     * This method calculates and applies damage to the enemy based on
     * the attacker's damage, the enemy's defense, and other factors.
     * 
     * @param {number} damage - The raw damage amount before calculations
     * @param {Object} attackInfo - Information about the attack (type, critical hit, etc.)
     * @returns {Object} Result object containing damage taken and status
     */
    takeDamage(damage, attackInfo = {}) {
        // Guard: already dead
        if (!this.isAlive) {
            return { success: true, damageTaken: 0, remainingHp: 0, isDead: true, wasCriticalHit: false };
        }

        // Validate input
        if (damage < 0) {
            console.warn(`Invalid damage value: ${damage}. Setting to 0.`);
            damage = 0;
        }
        
        // Calculate final damage after defense reduction
        let finalDamage = damage;
        
        // Apply defense reduction (defense reduces damage by up to 50%)
        if (this.defense > 0) {
            const defenseReduction = Math.min(this.defense / 100, 0.5); // Max 50% reduction
            finalDamage = Math.max(1, finalDamage * (1 - defenseReduction));
        }
        
        // Apply critical hit multiplier if present
        if (attackInfo.isCriticalHit) {
            finalDamage *= attackInfo.criticalMultiplier || 1.5;
        }
        
        // Apply any additional modifiers
        if (attackInfo.elementalBonus) {
            finalDamage *= attackInfo.elementalBonus;
        }
        
        // Round down to nearest integer
        finalDamage = Math.floor(finalDamage);
        
        // Update enemy HP
        const newHp = this.hp - finalDamage;
        this.hp = Math.max(0, newHp);
        
        // Update alive status
        this.isAlive = this.hp > 0;
        
        // Update last action timestamp
        this.lastActionTimestamp = Date.now();
        
        // Log the damage taken for debugging
        console.log(`${this.name} took ${finalDamage} damage. HP: ${this.hp}/${this.maxHp}`);
        
        // Return result object
        return {
            success: true,
            damageTaken: finalDamage,
            remainingHp: this.hp,
            isDead: !this.isAlive,
            wasCriticalHit: attackInfo.isCriticalHit || false
        };
    }
    
    /**
     * Performs an attack action
     * 
     * This method simulates the enemy attacking the player.
     * Subclasses can override this method to implement specific AI behaviors.
     * 
     * @param {Object} gameState - The current game state object
     * @returns {Object} Result object containing attack details
     */
    attack(gameState) {
        // Validate that the enemy is alive and not stunned
        if (!this.isAlive || this.isStunned) {
            console.warn(`${this.name} cannot attack: ${this.isStunned ? 'stunned' : 'dead'}`);
            return { success: false, reason: this.isStunned ? 'stunned' : 'dead' };
        }
        
        // Calculate base damage
        let damage = this.attackPower;
        
        // Add random variation (±20%)
        const variation = damage * (0.8 + Math.random() * 0.4);
        damage = Math.floor(variation);
        
        // Check for critical hit (15% chance)
        const isCriticalHit = Math.random() < 0.15;
        if (isCriticalHit) {
            damage *= 1.5;
        }
        
        // Log the attack for debugging
        console.log(`${this.name} attacks for ${damage} damage${isCriticalHit ? ' (CRITICAL!)' : ''}`);
        
        // Apply damage to player
        const result = {
            success: true,
            damage: damage,
            isCriticalHit: isCriticalHit,
            target: 'player',
            message: `${this.name} attacks the player for ${damage} damage`
        };
        
        // Return the attack result
        return result;
    }
    
    /**
     * Gets the enemy's display name with HP information
     * 
     * @returns {string} Formatted display name with HP
     */
    getDisplayName() {
        return `${this.name} [${this.hp}/${this.maxHp} HP]`;
    }
    
    /**
     * Gets the enemy's stats as a string for display
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `Attack: ${this.attackPower} | Defense: ${this.defense}`;
    }
    
    /**
     * Updates the enemy's state
     * 
     * @param {Object} newState - Object containing properties to update
     */
    updateState(newState) {
        Object.assign(this, newState);
        
        // Log the state update for debugging
        console.log(`Enemy state updated: ${this.name}`, newState);
    }
    
    /**
     * Adds an active effect (DoT, debuff, stun, etc.) to this enemy.
     *
     * @param {Object} effect - The effect object to add
     */
    addEffect(effect) {
        if (!effect || !effect.name) {
            console.warn(`${this.name}.addEffect: invalid effect`, effect);
            return;
        }
        this.activeEffects.push(effect);
        console.log(`[Effect] ${effect.name} applied to ${this.name} (${effect.turnsRemaining ?? effect.duration} turns)`);
    }

    /**
     * Removes an active effect by name.
     *
     * @param {string} effectName - The name of the effect to remove
     */
    removeEffect(effectName) {
        const before = this.activeEffects.length;
        this.activeEffects = this.activeEffects.filter(e => e.name !== effectName);
        if (this.activeEffects.length < before) {
            console.log(`[Effect] ${effectName} removed from ${this.name}`);
        }
    }

    /**
     * Resets the enemy to its initial state
     */
    reset() {
        this.hp = this.maxHp;
        this.isAlive = true;
        this.isStunned = false;
        this.isPoisoned = false;
        this.poisonDamage = 0;
        this.activeEffects = [];
        this.lastActionTimestamp = null;
        
        console.log(`Enemy reset: ${this.name}`);
    }
}