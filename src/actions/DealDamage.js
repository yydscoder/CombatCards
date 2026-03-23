/**
 * DealDamage Action for Emoji Card Battle
 *
 * This action class handles dealing damage to a target.
 * It uses the DamageCalculator for damage computation.
 *
 * Design Philosophy: Hybrid approach
 * - DamageCalculator handles math (modifiers, crits, variance)
 * - Action class handles execution and game state updates
 *
 * @module actions/DealDamage
 */

// Import DamageCalculator for damage computation
import { DamageCalculator } from '../combat/DamageCalculator.js';

/**
 * DealDamage Class
 *
 * Represents a damage-dealing action.
 *
 * @example
 * const action = new DealDamage(card, 10, 'normal');
 * const result = action.execute(gameState, enemy);
 */
export class DealDamage {
    /**
     * Creates a new DealDamage action
     *
     * @param {Object} source - Source of the damage (card, enemy, effect)
     * @param {number} amount - Base damage amount
     * @param {string} [type='normal'] - Damage type: 'normal', 'critical', 'true', 'percent'
     */
    constructor(source, amount, type = 'normal') {
        /**
         * @type {Object}
         * @description Source of the damage
         */
        this.source = source;

        /**
         * @type {number}
         * @description Base damage amount
         */
        this.amount = amount;

        /**
         * @type {string}
         * @description Damage type
         */
        this.type = type;

        /**
         * @type {DamageCalculator}
         * @description Damage calculator instance
         */
        this.calculator = new DamageCalculator();

        console.log(`[DealDamage] Created: ${amount} damage from ${source?.name || 'unknown'}`);
    }

    /**
     * Executes the damage action
     *
     * @param {Object} gameState - The game state object
     * @param {Object} target - The target to damage
     * @returns {Object} Action result with damage details
     *
     * @example
     * const result = action.execute(gameState, enemy);
     * if (result.success) {
     *     console.log(`Dealt ${result.finalDamage} damage`);
     * }
     */
    execute(gameState, target) {
        // Validate target
        const validation = this.validateTarget(target);
        if (!validation.valid) {
            return {
                success: false,
                reason: validation.reason,
                message: validation.message
            };
        }

        // Get attack info based on damage type
        const attackInfo = this._getAttackInfo();

        // Calculate damage using DamageCalculator
        const damageResult = this.calculator.calculateDamage(this.source, target, attackInfo);

        if (!damageResult.success) {
            return {
                success: false,
                reason: 'calculation_failed',
                message: 'Damage calculation failed'
            };
        }

        // Apply damage to target
        const actualDamage = damageResult.finalDamage;
        let newHp;

        if (target.type === 'enemy' || target === gameState.enemy) {
            // Damage enemy
            newHp = gameState.enemyHp - actualDamage;
            gameState.updateEnemyHp(newHp);

            // Sync with enemy object if it exists
            if (gameState.enemy && typeof gameState.enemy.takeDamage === 'function') {
                gameState.enemy.takeDamage(actualDamage, attackInfo, gameState);
            }

            console.log(`[DealDamage] Enemy takes ${actualDamage} damage (${gameState.enemyHp}/${gameState.enemyMaxHp} HP)`);
        } else {
            // Damage player (should be rare)
            newHp = gameState.playerHp - actualDamage;
            gameState.updatePlayerHp(newHp);

            console.log(`[DealDamage] Player takes ${actualDamage} damage (${gameState.playerHp}/${gameState.playerMaxHp} HP)`);
        }

        // Check for target defeat
        const isDead = newHp <= 0;

        // Create result object
        const result = {
            success: true,
            actionType: 'DealDamage',
            damageType: this.type,
            finalDamage: actualDamage,
            isCriticalHit: damageResult.details?.isCriticalHit || false,
            targetWasDead: isDead,
            source: this.source?.name || 'unknown',
            target: target?.name || target?.type || 'unknown',
            ...damageResult
        };

        console.log(`[DealDamage] Action complete: ${actualDamage} damage to ${result.target}`);

        return result;
    }

    /**
     * Validates the target
     *
     * @param {Object} target - Target to validate
     * @returns {Object} Validation result
     */
    validateTarget(target) {
        if (!target) {
            return {
                valid: false,
                reason: 'no_target',
                message: 'No target provided'
            };
        }

        // Target must have HP or be damageable
        if (!target.hp && !target.maxHp && target.type !== 'enemy') {
            return {
                valid: false,
                reason: 'not_damageable',
                message: 'Target cannot take damage'
            };
        }

        return {
            valid: true,
            message: 'Target is valid'
        };
    }

    /**
     * Gets attack info for damage calculation
     *
     * @private
     * @returns {Object} Attack info object
     */
    _getAttackInfo() {
        const attackInfo = {
            damageType: this.type,
            isCriticalHit: false
        };

        // Critical hit for normal damage
        if (this.type === 'normal') {
            attackInfo.isCriticalHit = Math.random() < 0.15; // 15% crit chance
        }

        // True damage ignores defense
        if (this.type === 'true') {
            attackInfo.ignoreDefense = true;
        }

        // Percent damage
        if (this.type === 'percent' && this.source?.maxHp) {
            attackInfo.percentOfMaxHp = this.amount / 100;
        }

        return attackInfo;
    }
}

export default DealDamage;
