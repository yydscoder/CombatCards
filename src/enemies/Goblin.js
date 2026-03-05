/**
 * Goblin Enemy Implementation for Emoji Card Battle
 *
 * This class extends the base Enemy class to implement a goblin enemy.
 * Goblins are aggressive attackers that use the AggressiveAI behavior.
 * They are fast, numerous, and attack relentlessly.
 *
 * Goblin characteristics:
 * - Low HP but high speed
 * - Aggressive attack patterns
 * - Chance for sneak attacks
 * - Uses AggressiveAI for decision making
 */

// Import the base Enemy class
import { Enemy } from './Enemy.js';
// Import AggressiveAI for behavior
import { AggressiveAI, createAggressiveAI } from '../ai/AggressiveAI.js';

/**
 * Creates a new Goblin instance
 *
 * @param {string} name - The name of the goblin (default: "Goblin")
 * @param {number} maxHp - The maximum health points (default: 60)
 * @param {number} attack - The attack power (default: 14)
 */
export class Goblin extends Enemy {
    constructor(name = "Goblin", maxHp = 60, attack = 14) {
        // Define goblin stats - fast but fragile
        const stats = {
            defense: 2,       // Low defense
            speed: 1.5,       // High speed - attacks first
            aggression: 0.95, // Very aggressive
            intelligence: 0.4 // Moderate cunning
        };

        // Call parent constructor with goblin properties
        super(
            name,           // Enemy name
            maxHp,          // Maximum HP
            attack,         // Attack power
            '👺',           // Emoji representation (goblin/ogre face)
            stats           // Additional stats
        );

        // Goblin-specific properties
        this.type = 'goblin';
        this.isAggressive = true;
        
        // Initialize AI
        this.ai = createAggressiveAI({
            attackChance: 0.95,      // 95% chance to attack
            rageThreshold: 0.35,     // Enters rage at 35% HP
            rageMultiplier: 1.4      // 1.4x damage when enraged
        });

        // Sneak attack cooldown
        this.sneakAttackCooldown = 0;

        console.log(`Goblin created: ${this.name} (HP: ${this.maxHp}, Attack: ${this.attackPower})`);
    }

    /**
     * Decides and performs the goblin's action
     *
     * @param {Object} gameState - The current game state object
     * @returns {Object} Result object containing action details
     */
    performAction(gameState) {
        const player = gameState?.player;
        
        if (!player) {
            return { success: false, reason: 'no_player_target' };
        }

        // Use AI to decide action
        const decision = this.ai.decideAction(this, player, gameState);

        // Execute the decided action
        switch (decision.action) {
            case 'attack':
                return this.executeAttack(decision, player, gameState);
            case 'special_attack':
                return this.executeSpecialAttack(decision, player, gameState);
            case 'stunned':
                return { success: false, reason: 'stunned', action: 'stunned' };
            default:
                return { success: false, reason: 'no_action', action: 'none' };
        }
    }

    /**
     * Executes a standard attack
     *
     * @param {Object} decision - The AI decision object
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Attack result
     */
    executeAttack(decision, player, gameState) {
        // Calculate damage using AI
        let damage = this.ai.calculateDamage(this, decision);

        // Check for sneak attack (25% chance when cooldown is ready)
        const isSneakAttack = this.sneakAttackCooldown <= 0 && Math.random() < 0.25;
        
        if (isSneakAttack) {
            damage = Math.floor(damage * 1.3); // 30% bonus damage
            this.sneakAttackCooldown = 3; // 3 turn cooldown
            console.log(`${this.name} performs a SNEAK ATTACK for ${damage} damage!`);
        } else {
            console.log(`${this.name} attacks for ${damage} damage`);
        }

        // Reduce cooldown
        if (this.sneakAttackCooldown > 0) {
            this.sneakAttackCooldown--;
        }

        // Apply damage to player
        const result = player.takeDamage?.(damage, { isCriticalHit: false }) || {
            success: true,
            damageTaken: damage
        };

        return {
            success: true,
            action: 'attack',
            damage: damage,
            isSneakAttack: isSneakAttack,
            target: 'player',
            ...result
        };
    }

    /**
     * Executes a special attack based on AI decision
     *
     * @param {Object} decision - The AI decision object
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Special attack result
     */
    executeSpecialAttack(decision, player, gameState) {
        let damage = this.ai.calculateDamage(this, decision);
        let specialName = decision.specialType || 'special';

        console.log(`${this.name} uses ${specialName} for ${damage} damage!`);

        // Apply damage to player
        const result = player.takeDamage?.(damage, { isCriticalHit: true }) || {
            success: true,
            damageTaken: damage
        };

        // Handle self-damage for reckless charge
        if (decision.selfDamage) {
            const selfDmg = Math.floor(decision.selfDamage);
            this.hp = Math.max(1, this.hp - selfDmg);
            console.log(`${this.name} takes ${selfDmg} recoil damage`);
        }

        return {
            success: true,
            action: 'special_attack',
            specialType: decision.specialType,
            damage: damage,
            selfDamage: decision.selfDamage || 0,
            target: 'player',
            ...result
        };
    }

    /**
     * Gets the AI strategy description
     *
     * @returns {string} Strategy description
     */
    getStrategyText() {
        return this.ai.getStrategyDescription(this);
    }

    /**
     * Gets the enemy's display name with goblin-specific information
     *
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        const rageStatus = (this.hp / this.maxHp) <= 0.35 ? ' [ENRAGED]' : '';
        return `${this.name} [${this.hp}/${this.maxHp} HP] 👺${rageStatus}`;
    }

    /**
     * Gets the enemy's stats as a string for display
     *
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        const sneakStatus = this.sneakAttackCooldown <= 0 ? ' [Sneak Ready]' : '';
        return `Attack: ${this.attackPower} | Defense: ${this.defense} | Speed: ${this.speed}${sneakStatus}`;
    }
}

/**
 * Factory function to create a Goblin instance
 *
 * @param {string} name - Custom name (optional)
 * @param {number} maxHp - Custom max HP (optional)
 * @param {number} attack - Custom attack (optional)
 * @returns {Goblin} New Goblin instance
 */
export function createGoblin(name, maxHp, attack) {
    return new Goblin(name, maxHp, attack);
}
