/**
 * GainBlock Action for Emoji Card Battle
 *
 * This action class handles gaining block/shield.
 * Block absorbs incoming damage and expires at end of turn.
 *
 * @module actions/GainBlock
 */

/**
 * GainBlock Class
 *
 * Represents a block/shield gaining action.
 *
 * @example
 * const action = new GainBlock(card, 10);
 * const result = action.execute(gameState, player);
 */
export class GainBlock {
    /**
     * Creates a new GainBlock action
     *
     * @param {Object} source - Source of the block (card, effect)
     * @param {number} amount - Base block amount
     * @param {number} [duration=1] - Duration in turns (default: 1, expires end of current turn)
     */
    constructor(source, amount, duration = 1) {
        /**
         * @type {Object}
         * @description Source of the block
         */
        this.source = source;

        /**
         * @type {number}
         * @description Base block amount
         */
        this.amount = amount;

        /**
         * @type {number}
         * @description Duration in turns
         */
        this.duration = duration;

        console.log(`[GainBlock] Created: ${amount} block from ${source?.name || 'unknown'}`);
    }

    /**
     * Executes the block action
     *
     * @param {Object} gameState - The game state object
     * @param {Object} target - The target to gain block (usually player)
     * @returns {Object} Action result with block details
     *
     * @example
     * const result = action.execute(gameState, gameState);
     * if (result.success) {
     *     console.log(`Gained ${result.blockGained} block`);
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

        // Calculate final block amount (with any modifiers)
        const blockAmount = this._calculateBlock(gameState, target);

        // Add block to target
        const shieldName = this.source?.name?.toLowerCase().replace(/\s+/g, '_') || 'block';

        if (target === gameState || target.type === 'player') {
            // Add block to player
            gameState.addShield(shieldName, {
                remaining: blockAmount,
                duration: this.duration,
                turnsRemaining: this.duration,
                source: this.source?.name || 'block'
            });

            console.log(`[GainBlock] Player gains ${blockAmount} block (${gameState.playerShields[shieldName]?.remaining} total)`);
        } else if (target.type === 'enemy') {
            // Add block to enemy (rare, but some cards might do this)
            if (!gameState.enemyShields) {
                gameState.enemyShields = {};
            }

            gameState.enemyShields[shieldName] = {
                remaining: blockAmount,
                duration: this.duration,
                turnsRemaining: this.duration,
                source: this.source?.name || 'block'
            };

            console.log(`[GainBlock] Enemy gains ${blockAmount} block`);
        }

        // Create result object
        const result = {
            success: true,
            actionType: 'GainBlock',
            blockGained: blockAmount,
            baseBlock: this.amount,
            duration: this.duration,
            target: target === gameState ? 'player' : (target?.name || target?.type || 'unknown'),
            shieldName
        };

        console.log(`[GainBlock] Action complete: ${blockAmount} block to ${result.target}`);

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
        if (target !== Object(target) && target.type !== 'player' && target.type !== 'enemy') {
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
     * Calculates final block amount with modifiers
     *
     * @private
     * @param {Object} gameState - Game state
     * @param {Object} target - Target
     * @returns {number} Final block amount
     */
    _calculateBlock(gameState, target) {
        let blockAmount = this.amount;

        // Apply source bonuses (from card upgrades, etc.)
        if (this.source?.isUpgraded) {
            blockAmount = Math.floor(blockAmount * 1.5);
        }

        // Apply target bonuses (relics, effects)
        if (target === gameState && gameState.playerShields) {
            // Check for block bonus effects
            const blockBonus = gameState.activeEffects
                ?.filter(e => e.type === 'block_bonus')
                ?.reduce((sum, e) => sum + (e.value || 0), 0) || 0;

            blockAmount += blockBonus;
        }

        // Ensure minimum block of 0
        return Math.max(0, blockAmount);
    }
}

export default GainBlock;
