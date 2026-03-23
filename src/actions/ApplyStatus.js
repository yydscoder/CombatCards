/**
 * ApplyStatus Action for Emoji Card Battle
 *
 * This action class handles applying status effects to targets.
 * Status effects include DoT, debuffs, buffs, and crowd control.
 *
 * @module actions/ApplyStatus
 */

/**
 * ApplyStatus Class
 *
 * Represents a status effect application action.
 *
 * @example
 * const action = new ApplyStatus(card, 'poison', 4, 3);
 * const result = action.execute(gameState, enemy);
 */
export class ApplyStatus {
    /**
     * Creates a new ApplyStatus action
     *
     * @param {Object} source - Source of the status (card, effect)
     * @param {string} statusType - Type of status: 'poison', 'weak', 'vulnerable', 'stun', etc.
     * @param {number} [value=0] - Effect value (damage per tick, reduction %, etc.)
     * @param {number} [duration=3] - Duration in turns
     */
    constructor(source, statusType, value = 0, duration = 3) {
        /**
         * @type {Object}
         * @description Source of the status
         */
        this.source = source;

        /**
         * @type {string}
         * @description Type of status effect
         */
        this.statusType = statusType;

        /**
         * @type {number}
         * @description Effect value
         */
        this.value = value;

        /**
         * @type {number}
         * @description Duration in turns
         */
        this.duration = duration;

        console.log(`[ApplyStatus] Created: ${statusType} (${value}, ${duration} turns) from ${source?.name || 'unknown'}`);
    }

    /**
     * Executes the status application action
     *
     * @param {Object} gameState - The game state object
     * @param {Object} target - The target to apply status to
     * @returns {Object} Action result with status details
     *
     * @example
     * const result = action.execute(gameState, enemy);
     * if (result.success) {
     *     console.log(`Applied ${result.statusType} for ${result.duration} turns`);
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

        // Create status effect object
        const statusEffect = this._createStatusEffect(gameState, target);

        // Apply status to target
        let applyResult;

        if (target.type === 'enemy' || target === gameState.enemy) {
            // Apply to enemy
            if (typeof gameState.enemy?.addEffect === 'function') {
                applyResult = gameState.enemy.addEffect(statusEffect);
            } else if (typeof gameState.addEffect === 'function') {
                // Fallback: add to global effects with enemy target
                statusEffect.target = 'enemy';
                applyResult = gameState.addEffect(statusEffect);
            } else {
                // Fallback: manual effect array
                if (!gameState.enemyEffects) {
                    gameState.enemyEffects = [];
                }
                gameState.enemyEffects.push(statusEffect);
                applyResult = { success: true };
            }

            console.log(`[ApplyStatus] Applied ${this.statusType} to enemy`);
        } else if (target.type === 'player' || target === gameState) {
            // Apply to player
            statusEffect.target = 'player';

            if (typeof gameState.addEffect === 'function') {
                applyResult = gameState.addEffect(statusEffect);
            } else {
                // Fallback: manual effect array
                if (!gameState.playerEffects) {
                    gameState.playerEffects = [];
                }
                gameState.playerEffects.push(statusEffect);
                applyResult = { success: true };
            }

            console.log(`[ApplyStatus] Applied ${this.statusType} to player`);
        } else {
            return {
                success: false,
                reason: 'invalid_target_type',
                message: 'Cannot apply status to this target type'
            };
        }

        if (!applyResult?.success) {
            return {
                success: false,
                reason: 'apply_failed',
                message: 'Failed to apply status effect'
            };
        }

        // Create result object
        const result = {
            success: true,
            actionType: 'ApplyStatus',
            statusType: this.statusType,
            value: this.value,
            duration: this.duration,
            target: target.type || 'unknown',
            effect: statusEffect
        };

        console.log(`[ApplyStatus] Action complete: ${this.statusType} applied to ${result.target}`);

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

        // Target must be player or enemy
        if (target.type !== 'player' && target.type !== 'enemy' && target !== Object(target)) {
            return {
                valid: false,
                reason: 'invalid_target',
                message: 'Target must be player or enemy'
            };
        }

        return {
            valid: true,
            message: 'Target is valid'
        };
    }

    /**
     * Creates the status effect object
     *
     * @private
     * @param {Object} gameState - Game state
     * @param {Object} target - Target
     * @returns {Object} Status effect object
     */
    _createStatusEffect(gameState, target) {
        const effect = {
            name: `${this.statusType}_${Date.now()}`,
            type: this.statusType,
            value: this.value,
            duration: this.duration,
            turnsRemaining: this.duration,
            source: this.source?.name || 'unknown',
            target: target.type || 'unknown'
        };

        // Add status-specific properties
        switch (this.statusType) {
            case 'poison':
                effect.emoji = '☠️';
                effect.description = `Take ${this.value} damage at end of turn`;
                effect.damagePerTick = this.value;
                break;

            case 'weak':
                effect.emoji = '😫';
                effect.description = `Deal ${this.value}% less damage`;
                effect.damageReduction = this.value / 100;
                break;

            case 'vulnerable':
                effect.emoji = '🎯';
                effect.description = `Take ${this.value}% more damage`;
                effect.damageTakenMultiplier = 1 + (this.value / 100);
                break;

            case 'stun':
                effect.emoji = '💫';
                effect.description = `Skip next ${this.duration} turn(s)`;
                effect.skipTurn = true;
                break;

            case 'freeze':
                effect.emoji = '🥶';
                effect.description = `Cannot act for ${this.duration} turn(s)`;
                effect.cannotAct = true;
                break;

            case 'burn':
                effect.emoji = '🔥';
                effect.description = `Take ${this.value} damage at end of turn`;
                effect.damagePerTick = this.value;
                break;

            case 'bleed':
                effect.emoji = '🩸';
                effect.description = `Take ${this.value} damage when playing attacks`;
                effect.damageOnAttack = this.value;
                break;

            case 'strength':
                effect.emoji = '💪';
                effect.description = `Deal ${this.value} additional damage`;
                effect.damageBonus = this.value;
                break;

            case 'dexterity':
                effect.emoji = '🤸';
                effect.description = `Gain ${this.value} additional block`;
                effect.blockBonus = this.value;
                break;

            default:
                effect.emoji = '✨';
                effect.description = `${this.statusType} effect`;
        }

        return effect;
    }
}

export default ApplyStatus;
