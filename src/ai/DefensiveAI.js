/**
 * Defensive AI Module for Enemy Combat Behavior
 *
 * This module implements defensive AI behavior for enemies.
 * Enemies using this AI prioritize healing, buffing, and defending
 * over direct attacking. They will wait for opportunities to strike.
 *
 * Behavior characteristics:
 * - Moderate attack frequency (40-60% chance to attack)
 * - High heal/buff frequency (40-60% chance)
 * - Prefers survival over damage
 * - Retreats when critically low on HP
 */

/**
 * DefensiveAI class - Implements heal/buff-focused enemy behavior
 *
 * This class provides AI decision-making for enemies that prioritize
 * survival and sustained combat over burst damage. Suitable for
 * skeletons, mages, and other tactical enemy types. Mostly used to waste players time to slow their progreess. 
 */
export class DefensiveAI {
    /**
     * Creates a new DefensiveAI instance
     *
     * @param {Object} options - AI configuration options
     * @param {number} options.healThreshold - HP threshold below which healing is prioritized (default: 0.5)
     * @param {number} options.buffChance - Base chance to buff when not healing (default: 0.5)
     * @param {number} options.retreatThreshold - HP threshold below which enemy tries to retreat (default: 0.15)
     */
    constructor(options = {}) {
        this.healThreshold = options.healThreshold ?? 0.5;
        this.buffChance = options.buffChance ?? 0.5;
        this.retreatThreshold = options.retreatThreshold ?? 0.15;
        
        // Track active buffs on the enemy
        this.buffs = {
            defense: 0,
            regeneration: 0,
            shield: 0
        };
        
        console.log('DefensiveAI initialized'); //Again for debugging purposes 
    }

    /**
     * Decides the next action for the enemy
     *
     * @param {Object} enemy - The enemy object making the decision
     * @param {Object} player - The player object (target)
     * @param {Object} gameState - Current game state
     * @returns {Object} Action decision object
     */
    decideAction(enemy, player, gameState) {
        // Check if enemy is alive
        if (!enemy.isAlive) {
            return { action: 'none', reason: 'enemy_dead' };
        }

        // Check if stunned
        if (enemy.isStunned) {
            return { action: 'stunned', reason: 'stunned' };
        }

        // Calculate current HP percentage
        const hpPercent = enemy.hp / enemy.maxHp;

        // Critical HP: try to retreat or heal desperately
        if (hpPercent <= this.retreatThreshold) {
            console.log(`${enemy.name} is desperate and trying to survive!`);
            return this.decideDesperateAction(enemy, player, gameState);
        }

        // Low HP: prioritize healing
        if (hpPercent <= this.healThreshold) {
            console.log(`${enemy.name} decides to heal or defend`);
            return this.decideHealOrBuff(enemy, player, gameState);
        }

        // Healthy: decide between attacking and buffing
        const roll = Math.random();

        if (roll < 0.5) {
            // Attack decision
            return {
                action: 'attack',
                target: 'player',
                reason: 'healthy_attack'
            };
        } else {
            // Buff decision
            return this.decideHealOrBuff(enemy, player, gameState);
        }
    }

    /**
     * Decides a desperate action when critically low on HP
     *
     * @param {Object} enemy - The enemy object
     * @param {Object} player - The player object
     * @param {Object} gameState - Current game state
     * @returns {Object} Desperate action decision
     */
    decideDesperateAction(enemy, player, gameState) {
        // 70% chance to heal, 30% chance for desperate attack
        const roll = Math.random();

        if (roll < 0.7) {
            return {
                action: 'heal',
                healAmount: Math.floor(enemy.maxHp * 0.3),
                isDesperate: true,
                target: 'self',
                reason: 'desperate_heal'
            };
        } else {
            return {
                action: 'special_attack',
                specialType: 'desperate_strike',
                damageMultiplier: 1.5,
                target: 'player',
                reason: 'desperate_attack'
            };
        }
    }

    /**
     * Decides between healing and buffing
     *
     * @param {Object} enemy - The enemy object
     * @param {Object} player - The player object
     * @param {Object} gameState - Current game state
     * @returns {Object} Heal or buff decision
     */
    decideHealOrBuff(enemy, player, gameState) {
        const roll = Math.random();

        if (roll < this.buffChance) {
            return this.decideBuff(enemy, player, gameState);
        } else {
            return this.decideHeal(enemy, player, gameState);
        }
    }

    /**
     * Decides which buff to apply
     *
     * @param {Object} enemy - The enemy object
     * @param {Object} player - The player object
     * @param {Object} gameState - Current game state
     * @returns {Object} Buff decision
     */
    decideBuff(enemy, player, gameState) {
        const availableBuffs = ['defense_up', 'regenerate', 'shield'];
        const chosenBuff = availableBuffs[Math.floor(Math.random() * availableBuffs.length)];

        console.log(`${enemy.name} prepares to use: ${chosenBuff}`);

        switch (chosenBuff) {
            case 'defense_up':
                return {
                    action: 'buff',
                    buffType: 'defense_up',
                    buffAmount: Math.floor(enemy.defense * 0.5) + 5,
                    duration: 3,
                    target: 'self',
                    reason: 'buff_defense'
                };
            case 'regenerate':
                return {
                    action: 'buff',
                    buffType: 'regenerate',
                    healPerTurn: Math.floor(enemy.maxHp * 0.1),
                    duration: 4,
                    target: 'self',
                    reason: 'buff_regeneration'
                };
            case 'shield':
                return {
                    action: 'buff',
                    buffType: 'shield',
                    shieldAmount: Math.floor(enemy.maxHp * 0.2),
                    duration: 2,
                    target: 'self',
                    reason: 'buff_shield'
                };
            default:
                return {
                    action: 'attack',
                    target: 'player',
                    reason: 'fallback_attack'
                };
        }
    }

    /**
     * Decides healing action
     *
     * @param {Object} enemy - The enemy object
     * @param {Object} player - The player object
     * @param {Object} gameState - Current game state
     * @returns {Object} Heal decision
     */
    decideHeal(enemy, player, gameState) {
        const hpMissing = enemy.maxHp - enemy.hp;
        const healAmount = Math.min(hpMissing, Math.floor(enemy.maxHp * 0.35));

        return {
            action: 'heal',
            healAmount: Math.max(10, healAmount),
            target: 'self',
            reason: 'standard_heal'
        };
    }

    /**
     * Calculates damage for an attack based on AI state
     *
     * @param {Object} enemy - The attacking enemy
     * @param {Object} decision - The action decision object
     * @returns {number} Calculated damage
     */
    calculateDamage(enemy, decision) {
        let damage = enemy.attackPower;

        // Apply damage multiplier from decision
        if (decision.damageMultiplier) {
            damage *= decision.damageMultiplier;
        }

        // Add random variation (±25% for defensive AI - less consistent)
        const variation = damage * (0.75 + Math.random() * 0.5);
        damage = Math.floor(variation);

        return Math.max(1, damage);
    }

    /**
     * Applies a buff to the enemy
     *
     * @param {Object} enemy - The enemy to buff
     * @param {Object} decision - The buff decision object
     * @returns {Object} Buff application result
     */
    applyBuff(enemy, decision) {
        switch (decision.buffType) {
            case 'defense_up':
                enemy.defense = (enemy.defense || 0) + decision.buffAmount;
                console.log(`${enemy.name} defense increased by ${decision.buffAmount}`);
                break;
            case 'regenerate':
                // Regeneration is handled over time
                console.log(`${enemy.name} gains regeneration (${decision.healPerTurn} HP/turn)`);
                break;
            case 'shield':
                // Shield would be handled by game state
                console.log(`${enemy.name} gains ${decision.shieldAmount} shield`);
                break;
        }

        return {
            success: true,
            buffType: decision.buffType,
            target: enemy.name
        };
    }

    /**
     * Gets a description of the AI's current strategy
     *
     * @param {Object} enemy - The enemy object
     * @returns {string} Strategy description
     */
    getStrategyDescription(enemy) {
        const hpPercent = enemy.hp / enemy.maxHp;

        if (hpPercent <= this.retreatThreshold) {
            return `${enemy.name} is desperately trying to survive!`;
        } else if (hpPercent <= this.healThreshold) {
            return `${enemy.name} is focusing on defense and healing...`;
        }
        return `${enemy.name} is cautiously assessing the situation...`;
    }
}

/**
 * Factory function to create a DefensiveAI instance
 *
 * @param {Object} options - AI configuration options
 * @returns {DefensiveAI} New DefensiveAI instance
 */
export function createDefensiveAI(options = {}) {
    return new DefensiveAI(options);
}
