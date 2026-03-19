/**
 * Aggressive AI Module for Enemy Combat Behavior
 *
 * This module implements aggressive AI behavior for enemies.
 * Enemies using this AI prioritize attacking over defending or healing.
 * They will always choose the most damaging option available regardless of their situation.
 *
 * Behavior characteristics:
 * - High attack frequency (80-100% chance to attack)
 * - Low defense/heal frequency (0-20% chance)
 * - Prefers high-damage moves
 * - Ignores low HP warnings
 */

/**
 * AggressiveAI class - Implements attack-focused enemy behavior
 *
 * This class provides AI decision-making for enemies that prioritize
 * dealing damage over survival. Suitable for berserkers, goblins, and
 * other aggressive enemy types (For future reference)
 */
export class AggressiveAI {
    /**
     * Creates a new AggressiveAI instance
     *
     * @param {Object} options - AI configuration options
     * @param {number} options.attackChance - Base chance to attack (0-1, default: 0.9)
     * @param {number} options.rageThreshold - HP threshold below which rage mode activates (default: 0.3)
     * @param {number} options.rageMultiplier - Damage multiplier when enraged (default: 1.5)
     */
    constructor(options = {}) {
        this.attackChance = options.attackChance ?? 0.9;
        this.rageThreshold = options.rageThreshold ?? 0.3;
        this.rageMultiplier = options.rageMultiplier ?? 1.5;
        
        console.log('AggressiveAI initialized'); // For debugging purposes
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

        // Rage mode: when low HP, always attack with increased damage
        const isEnraged = hpPercent <= this.rageThreshold;
        
        if (isEnraged) {
            console.log(`${enemy.name} enters RAGE mode!`);
            return {
                action: 'attack',
                isEnraged: true,
                damageMultiplier: this.rageMultiplier,
                target: 'player',
                reason: 'enraged_low_hp'
            };
        }

        // Decide between attack and special actions
        const roll = Math.random();

        if (roll < this.attackChance) {
            // Standard attack decision
            return {
                action: 'attack',
                isEnraged: false,
                damageMultiplier: 1,
                target: 'player',
                reason: 'aggressive_choice'
            };
        } else {
            // Special aggressive move (heavy attack, double strike, etc.)
            return this.decideSpecialAttack(enemy, player, gameState);
        }
    }

    /**
     * Decides a special attack action
     *
     * @param {Object} enemy - The enemy object
     * @param {Object} player - The player object
     * @param {Object} gameState - Current game state
     * @returns {Object} Special attack decision
     */
    decideSpecialAttack(enemy, player, gameState) {
        const specialMoves = ['heavy_strike', 'double_hit', 'reckless_charge'];
        const chosenMove = specialMoves[Math.floor(Math.random() * specialMoves.length)];

        console.log(`${enemy.name} prepares special move: ${chosenMove}`);

        switch (chosenMove) {
            case 'heavy_strike':
                return {
                    action: 'special_attack',
                    specialType: 'heavy_strike',
                    damageMultiplier: 1.8,
                    accuracyPenalty: 0.2,
                    target: 'player',
                    reason: 'special_heavy_strike'
                };
            case 'double_hit':
                return {
                    action: 'special_attack',
                    specialType: 'double_hit',
                    hits: 2,
                    damageMultiplier: 0.7,
                    target: 'player',
                    reason: 'special_double_hit'
                };
            case 'reckless_charge':
                return {
                    action: 'special_attack',
                    specialType: 'reckless_charge',
                    damageMultiplier: 2.0,
                    selfDamage: enemy.maxHp * 0.1,
                    target: 'player',
                    reason: 'special_reckless_charge'
                };
            default:
                return {
                    action: 'attack',
                    isEnraged: false,
                    damageMultiplier: 1,
                    target: 'player',
                    reason: 'fallback_attack'
                };
        }
    }

    /**
     * Calculates damage for an attack based on AI state
     *
     * @param {Object} enemy - The attacking enemy
     * @param {Object} decision - The action decision object
     * @returns {number} Calculated damage
     */
    calculateDamage(enemy, decision) {
        let damage = enemy.attackCard?.baseDamage ?? enemy.attackPower;

        // Apply damage multiplier from decision
        if (decision.damageMultiplier) {
            damage *= decision.damageMultiplier;
        }

        // Add random variation based on enemy attack card spread
        const minMultiplier = enemy.attackCard?.minMultiplier ?? 0.85;
        const maxMultiplier = enemy.attackCard?.maxMultiplier ?? 1.15;
        const variation = damage * (minMultiplier + Math.random() * (maxMultiplier - minMultiplier));
        damage = Math.floor(variation);

        return Math.max(1, damage);
    }

    /**
     * Gets a description of the AI's current strategy
     *
     * @param {Object} enemy - The enemy object
     * @returns {string} Strategy description
     */
    getStrategyDescription(enemy) {
        const hpPercent = enemy.hp / enemy.maxHp;
        const isEnraged = hpPercent <= this.rageThreshold;

        if (isEnraged) {
            return `${enemy.name} is ENRAGED and attacking wildly!`;
        }
        return `${enemy.name} is looking for an opening to attack...`;
    }
}

/**
 * Factory function to create an AggressiveAI instance
 *
 * @param {Object} options - AI configuration options
 * @returns {AggressiveAI} New AggressiveAI instance
 */
export function createAggressiveAI(options = {}) {
    return new AggressiveAI(options);
}
