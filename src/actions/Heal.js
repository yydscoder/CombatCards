/**
 * Heal Action for Emoji Card Battle
 *
 * This action class handles healing targets.
 * It uses the DamageCalculator for healing computation.
 *
 * Design Philosophy: Hybrid approach
 * - DamageCalculator handles math (crits, bonuses, variance)
 * - Action class handles execution and game state updates
 *
 * @module actions/Heal
 */

// Import DamageCalculator for healing computation
import { DamageCalculator } from '../combat/DamageCalculator.js';

/**
 * Heal Class
 *
 * Represents a healing action.
 *
 * @example
 * const action = new Heal(card, 10);
 * const result = action.execute(gameState, player);
 */
export class Heal {
    /**
     * Creates a new Heal action
     *
     * @param {Object} source - Source of the healing (card, effect)
     * @param {number} amount - Base healing amount
     * @param {Object} [options] - Additional options
     * @param {boolean} [options.canCrit=true] - Whether healing can critical
     * @param {number} [options.critChance=0.1] - Critical chance (10%)
     * @param {number} [options.critMultiplier=1.5] - Critical multiplier (1.5x)
     */
    constructor(source, amount, options = {}) {
        /**
         * @type {Object}
         * @description Source of the healing
         */
        this.source = source;

        /**
         * @type {number}
         * @description Base healing amount
         */
        this.amount = amount;

        /**
         * @type {boolean}
         * @description Whether healing can crit
         */
        this.canCrit = options.canCrit ?? true;

        /**
         * @type {number}
         * @description Critical hit chance
         */
        this.critChance = options.critChance ?? 0.10;

        /**
         * @type {number}
         * @description Critical hit multiplier
         */
        this.critMultiplier = options.critMultiplier ?? 1.5;

        /**
         * @type {DamageCalculator}
         * @description Damage calculator instance (used for healing calc)
         */
        this.calculator = new DamageCalculator();

        console.log(`[Heal] Created: ${amount} healing from ${source?.name || 'unknown'}`);
    }

    /**
     * Executes the healing action
     *
     * @param {Object} gameState - The game state object
     * @param {Object} target - The target to heal
     * @returns {Object} Action result with healing details
     *
     * @example
     * const result = action.execute(gameState, gameState);
     * if (result.success) {
     *     console.log(`Healed for ${result.finalHeal} HP`);
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

        // Get heal info
        const healInfo = this._getHealInfo();

        // Calculate healing using DamageCalculator
        const healResult = this.calculator.calculateHealing(this.source, target, healInfo);

        if (!healResult.success) {
            return {
                success: false,
                reason: 'calculation_failed',
                message: 'Healing calculation failed'
            };
        }

        // Apply healing to target
        const actualHeal = healResult.finalHeal;
        let newHp;

        if (target === gameState || target.type === 'player') {
            // Heal player
            newHp = gameState.playerHp + actualHeal;
            gameState.updatePlayerHp(newHp);

            console.log(`[Heal] Player healed for ${actualHeal} (${gameState.playerHp}/${gameState.playerMaxHp} HP)`);
        } else if (target.type === 'enemy') {
            // Heal enemy (rare, but some cards might do this)
            newHp = gameState.enemyHp + actualHeal;
            gameState.updateEnemyHp(newHp);

            console.log(`[Heal] Enemy healed for ${actualHeal} (${gameState.enemyHp}/${gameState.enemyMaxHp} HP)`);
        }

        // Check for overheal
        const maxHp = target === gameState ? gameState.playerMaxHp : gameState.enemyMaxHp;
        const isOverheal = newHp >= maxHp;

        // Create result object
        const result = {
            success: true,
            actionType: 'Heal',
            finalHeal: actualHeal,
            baseHeal: healResult.baseHeal,
            isCriticalHeal: healResult.details?.isCriticalHeal || false,
            isOverheal,
            newHp,
            maxHp,
            source: this.source?.name || 'unknown',
            target: target === gameState ? 'player' : (target?.name || target?.type || 'unknown'),
            ...healResult
        };

        console.log(`[Heal] Action complete: ${actualHeal} healing to ${result.target}`);

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

        // Target must have HP
        if (!target.hp && !target.maxHp && target !== Object(target)) {
            return {
                valid: false,
                reason: 'not_healable',
                message: 'Target cannot be healed'
            };
        }

        return {
            valid: true,
            message: 'Target is valid'
        };
    }

    /**
     * Gets heal info for calculation
     *
     * @private
     * @returns {Object} Heal info object
     */
    _getHealInfo() {
        return {
            baseHeal: this.amount,
            isCriticalHeal: this.canCrit ? (Math.random() < this.critChance) : false,
            critChance: this.critChance,
            critMultiplier: this.critMultiplier,
            healingBonus: this.source?.healingBonus || 1.0
        };
    }
}

export default Heal;
