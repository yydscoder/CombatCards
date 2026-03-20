/**
 * Skeleton Enemy Implementation for Emoji Card Battle
 *
 * This class extends the base Enemy class to implement a skeleton enemy.
 * Skeletons are balanced fighters that use the DefensiveAI behavior.
 * They can reassemble themselves when defeated and use tactical combat.
 *
 * Skeleton characteristics:
 * - Moderate HP and attack
 * - Can heal/defend using DefensiveAI
 * - Chance to reassemble when defeated
 * - Uses bones/shields for defense
 */

// Import the base Enemy class
import { Enemy } from './Enemy.js';
// Import DefensiveAI for behavior
import { DefensiveAI, createDefensiveAI } from '../ai/DefensiveAI.js';

/**
 * Creates a new Skeleton instance
 *
 * @param {string} name - The name of the skeleton (default: "Skeleton Knight")
 * @param {number} maxHp - The maximum health points (default: 70)
 * @param {number} attack - The attack power (default: 12)
 */
export class Skeleton extends Enemy {
    constructor(name = "Skeleton Knight", maxHp = 70, attack = 12) {
        // Define skeleton stats - balanced with good defense
        const stats = {
            defense: 6,       // Moderate defense (bony armor)
            speed: 1.0,       // Average speed
            aggression: 0.4,  // Low aggression - tactical
              intelligence: 0.7, // High intelligence - uses strategy
              attackInterval: 2   // Attacks every 2 turns
        };

        // Call parent constructor with skeleton properties
        super(
            name,           // Enemy name
            maxHp,          // Maximum HP
            attack,         // Attack power
            '💀',           // Emoji representation (skull)
            stats           // Additional stats
        );

        // Skeleton-specific properties
        this.type = 'skeleton';
        this.isUndead = true;
        this.hasShield = Math.random() < 0.5; // 50% chance to have a shield
        this.shieldValue = this.hasShield ? Math.floor(maxHp * 0.3) : 0;
        this.reassembleChance = 0.4; // 40% chance to reassemble
        this.hasReassembled = false;
        this.attackFrequency = 0.6; // 60% chance to attack - defensive, waits for opportunities
        
        // Initialize AI with defensive behavior
        this.ai = createDefensiveAI({
            healThreshold: 0.5,      // Heals at 50% HP
            buffChance: 0.6,         // 60% chance to buff when not healing
            retreatThreshold: 0.15   // Desperate at 15% HP
        });

        console.log(`Skeleton created: ${this.name} (HP: ${this.maxHp}, Attack: ${this.attackPower}, Shield: ${this.hasShield ? 'Yes' : 'No'})`);
    }

    /**
     * Decides and performs the skeleton's action
     *
     * @param {Object} gameState - The current game state object
     * @returns {Object} Result object containing action details
     */
    performAction(gameState) {
        const player = gameState?.player;
        
        if (!player) {
            return { success: false, reason: 'no_player_target' };
        }

        // Skeletons are defensive - may skip turn to defend (40% chance)
        if (Math.random() > this.attackFrequency) {
            // Prioritize healing/buffing when not attacking
            if (this.hp < this.maxHp * 0.5) {
                return this.executeHeal({ healAmount: Math.floor(this.maxHp * 0.25) }, player, gameState);
            } else if (!this.hasShield || this.shieldValue < 20) {
                return this.executeBuff({ 
                    buffType: 'shield', 
                    shieldAmount: Math.floor(this.maxHp * 0.2) 
                }, player, gameState);
            } else {
                console.log(`${this.name} raises its guard, waiting for an opening...`);
                return {
                    success: true,
                    action: 'defend',
                    message: `${this.name} is defending!`
                };
            }
        }

        // Use AI to decide action
        const decision = this.ai.decideAction(this, player, gameState);

        // Execute the decided action
        switch (decision.action) {
            case 'attack':
                return this.executeAttack(decision, player, gameState);
            case 'heal':
                return this.executeHeal(decision, player, gameState);
            case 'buff':
                return this.executeBuff(decision, player, gameState);
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

        // Skeletons have a bone throw attack (15% chance)
        const isBoneThrow = Math.random() < 0.15;
        if (isBoneThrow) {
            damage = Math.floor(damage * 1.2);
            console.log(`${this.name} throws a bone for ${damage} damage!`);
        } else {
            console.log(`${this.name} attacks with its weapon for ${damage} damage`);
        }

        // Apply damage to player
        const result = player.takeDamage?.(damage, { isCriticalHit: isBoneThrow }) || {
            success: true,
            damageTaken: damage
        };

        return {
            success: true,
            action: 'attack',
            damage: damage,
            isBoneThrow: isBoneThrow,
            target: 'player',
            ...result
        };
    }

    /**
     * Executes a heal action
     *
     * @param {Object} decision - The AI decision object
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Heal result
     */
    executeHeal(decision, player, gameState) {
        const healAmount = decision.healAmount || Math.floor(this.maxHp * 0.25);
        const oldHp = this.hp;
        
        this.hp = Math.min(this.maxHp, this.hp + healAmount);
        const actualHeal = this.hp - oldHp;

        console.log(`${this.name} reassembles bones and heals for ${actualHeal} HP (${oldHp} → ${this.hp})`);

        return {
            success: true,
            action: 'heal',
            healAmount: actualHeal,
            oldHp: oldHp,
            newHp: this.hp,
            target: 'self',
            message: `${this.name} reassembles itself for ${actualHeal} HP!`
        };
    }

    /**
     * Executes a buff action
     *
     * @param {Object} decision - The AI decision object
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Buff result
     */
    executeBuff(decision, player, gameState) {
        switch (decision.buffType) {
            case 'defense_up':
                this.defense = (this.defense || 0) + decision.buffAmount;
                console.log(`${this.name} raises its defense by ${decision.buffAmount}`);
                return {
                    success: true,
                    action: 'buff',
                    buffType: 'defense_up',
                    buffAmount: decision.buffAmount,
                    newDefense: this.defense,
                    target: 'self',
                    message: `${this.name} fortifies its bony armor!`
                };

            case 'regenerate':
                // Apply regeneration effect
                this.regenEffect = {
                    healPerTurn: decision.healPerTurn,
                    duration: decision.duration,
                    turnsRemaining: decision.duration
                };
                console.log(`${this.name} gains regeneration (${decision.healPerTurn} HP/turn for ${decision.duration} turns)`);
                return {
                    success: true,
                    action: 'buff',
                    buffType: 'regenerate',
                    healPerTurn: decision.healPerTurn,
                    duration: decision.duration,
                    target: 'self',
                    message: `${this.name} channels dark energy to regenerate!`
                };

            case 'shield':
                this.shieldValue = (this.shieldValue || 0) + decision.shieldAmount;
                console.log(`${this.name} raises a bone shield for ${decision.shieldAmount} protection`);
                return {
                    success: true,
                    action: 'buff',
                    buffType: 'shield',
                    shieldAmount: decision.shieldAmount,
                    totalShield: this.shieldValue,
                    target: 'self',
                    message: `${this.name} raises a bone shield!`
                };

            default:
                return {
                    success: false,
                    reason: 'unknown_buff_type',
                    buffType: decision.buffType
                };
        }
    }

    /**
     * Takes damage, considering shield and reassembly
     *
     * @param {number} damage - The raw damage amount
     * @param {Object} attackInfo - Attack information
     * @returns {Object} Result object
     */
    takeDamage(damage, attackInfo = {}) {
        // Apply shield damage first
        if (this.shieldValue > 0) {
            const shieldAbsorb = Math.min(this.shieldValue, damage);
            this.shieldValue -= shieldAbsorb;
            damage -= shieldAbsorb;
            console.log(`${this.name}'s shield absorbs ${shieldAbsorb} damage (${this.shieldValue} remaining)`);
        }

        // Call parent takeDamage
        const wasAlive = this.isAlive;
        const result = super.takeDamage(damage, attackInfo, gameState);

        // Check for reassembly when defeated
        if (wasAlive && !this.isAlive && !this.hasReassembled && Math.random() < this.reassembleChance) {
            this.hasReassembled = true;
            this.isAlive = true;
            this.hp = Math.floor(this.maxHp * 0.3);
            console.log(`${this.name} CRUMBLES but reassembles with ${this.hp} HP!`);
            
            result.isDead = false;
            result.remainingHp = this.hp;
            result.reassembled = true;
        }

        return result;
    }

    /**
     * Processes regeneration effect at turn start
     *
     * @returns {Object} Regen result
     */
    processRegeneration() {
        if (this.regenEffect && this.regenEffect.turnsRemaining > 0 && this.isAlive) {
            this.regenEffect.turnsRemaining--;
            const healAmount = this.regenEffect.healPerTurn;
            const oldHp = this.hp;
            this.hp = Math.min(this.maxHp, this.hp + healAmount);
            const actualHeal = this.hp - oldHp;

            console.log(`${this.name} regenerates ${actualHeal} HP (${this.regenEffect.turnsRemaining} turns left)`);

            if (this.regenEffect.turnsRemaining <= 0) {
                this.regenEffect = null;
            }

            return {
                success: true,
                healAmount: actualHeal,
                turnsRemaining: this.regenEffect?.turnsRemaining || 0
            };
        }
        return { success: false, reason: 'no_regeneration' };
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
     * Gets the enemy's display name with skeleton-specific information
     *
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        const shieldStatus = this.shieldValue > 0 ? ` [🛡️${this.shieldValue}]` : '';
        const regenStatus = this.regenEffect ? ` [💚]` : '';
        const reassembleStatus = this.hasReassembled ? ' [✨]' : '';
        return `${this.name} [${this.hp}/${this.maxHp} HP] 💀${shieldStatus}${regenStatus}${reassembleStatus}`;
    }

    /**
     * Gets the enemy's stats as a string for display
     *
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        const regenInfo = this.regenEffect ? ` | Regen: ${this.regenEffect.healPerTurn}/turn` : '';
        return `Attack: ${this.attackPower} | Defense: ${this.defense} | Shield: ${this.shieldValue}${regenInfo}`;
    }

    /**
     * Resets the skeleton to its initial state
     */
    reset() {
        super.reset();
        this.hasShield = Math.random() < 0.5;
        this.shieldValue = this.hasShield ? Math.floor(this.maxHp * 0.3) : 0;
        this.hasReassembled = false;
        this.regenEffect = null;
        console.log(`Skeleton reset: ${this.name}`);
    }
}

/**
 * Factory function to create a Skeleton instance
 *
 * @param {string} name - Custom name (optional)
 * @param {number} maxHp - Custom max HP (optional)
 * @param {number} attack - Custom attack (optional)
 * @returns {Skeleton} New Skeleton instance
 */
export function createSkeleton(name, maxHp, attack) {
    return new Skeleton(name, maxHp, attack);
}
