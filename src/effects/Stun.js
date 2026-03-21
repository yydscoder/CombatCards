/**
 * Stun Effect Module
 * 
 * Stuns the target, preventing them from acting for a duration.
 * Can also increase cooldown by X turns.
 * 
 * @module effects/Stun
 */

export class StunEffect {
    constructor(duration = 1, cooldownIncrease = 0, source = 'Unknown') {
        this.name = 'stun';
        this.type = 'crowd_control';
        this.emoji = '💫';
        this.duration = duration;
        this.turnsRemaining = duration;
        this.cooldownIncrease = cooldownIncrease;
        this.source = source;
        this.description = `Stunned for ${duration} turn(s)${cooldownIncrease > 0 ? `, +${cooldownIncrease} CD` : ''}`;
    }

    /**
     * Applies the stun effect to target
     * @param {Object} target - The target (enemy or player)
     * @param {Object} gameState - Game state reference
     * @returns {Object} Effect application result
     */
    apply(target, gameState) {
        const result = {
            success: true,
            effect: this,
            target: target.name || target.type || 'target',
            message: `${target.name || 'Target'} is stunned for ${this.duration} turn(s)!`
        };

        // Apply to enemy
        if (target === gameState.enemy) {
            // Check for existing stun (don't stack, refresh duration)
            const existingStun = target.activeEffects?.find(e => e.name === 'stun');
            
            if (existingStun) {
                // Refresh duration and add cooldown increase
                existingStun.turnsRemaining = Math.max(existingStun.turnsRemaining, this.duration);
                existingStun.cooldownIncrease += this.cooldownIncrease;
                result.message = `${target.name} stun refreshed! ${existingStun.turnsRemaining} turns remaining.`;
            } else {
                // Add new stun effect
                if (typeof target.addEffect === 'function') {
                    target.addEffect(this);
                }
            }

            // Apply cooldown increase immediately
            if (this.cooldownIncrease > 0 && gameState.enemyAttackCooldown !== undefined) {
                gameState.enemyAttackCooldown += this.cooldownIncrease;
                result.message += ` Enemy CD increased by ${this.cooldownIncrease}!`;
            }

            // Set stunned flag for legacy support
            target.isStunned = true;
        }

        console.log(`[Effect:Stun] ${result.message}`);
        return result;
    }

    /**
     * Called at end of turn to process stun
     * @param {Object} target - The stunned target
     * @returns {Object} Processing result
     */
    onTurnEnd(target) {
        this.turnsRemaining--;
        
        if (this.turnsRemaining <= 0) {
            target.isStunned = false;
            return { expired: true, message: `${target.name} is no longer stunned!` };
        }
        
        return { expired: false, turnsRemaining: this.turnsRemaining };
    }

    /**
     * Gets debug info for this effect
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            name: this.name,
            type: this.type,
            turnsRemaining: this.turnsRemaining,
            cooldownIncrease: this.cooldownIncrease,
            source: this.source,
            description: this.description
        };
    }

    /**
     * Creates effect from serialized data
     * @param {Object} data - Serialized effect data
     * @returns {StunEffect} New stun effect
     */
    static fromData(data) {
        return new StunEffect(
            data.duration || 1,
            data.cooldownIncrease || 0,
            data.source || 'Unknown'
        );
    }
}

export function createStun(duration = 1, cooldownIncrease = 0, source = 'Unknown') {
    return new StunEffect(duration, cooldownIncrease, source);
}
