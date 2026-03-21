/**
 * Debuff Effect Module
 * 
 * Applies a negative debuff to the enemy.
 * Types: damage_reduction, defense_reduction, slow, vulnerable
 * 
 * @module effects/Debuff
 */

export class DebuffEffect {
    constructor(debuffType, value, duration = 1, source = 'Unknown') {
        this.name = 'debuff';
        this.type = 'debuff';
        this.emoji = '💀';
        this.debuffType = debuffType;
        this.value = value;
        this.duration = duration;
        this.turnsRemaining = duration;
        this.source = source;
        
        // Set emoji based on debuff type
        this._setEmoji();
        this.description = this._getDescription();
    }

    _setEmoji() {
        const emojis = {
            damage_reduction: '📉',
            defense_reduction: '💔',
            slow: '🐌',
            vulnerable: '🎯',
            weakened: '😫',
            cursed: '👁️'
        };
        this.emoji = emojis[this.debuffType] || '💀';
    }

    _getDescription() {
        const descriptions = {
            damage_reduction: `-${Math.round(this.value * 100)}% damage for ${this.turnsRemaining} turn(s)`,
            defense_reduction: `-${Math.round(this.value * 100)}% defense for ${this.turnsRemaining} turn(s)`,
            slow: `+${this.value} CD for ${this.turnsRemaining} turn(s)`,
            vulnerable: `+${Math.round(this.value * 100)}% damage taken for ${this.turnsRemaining} turn(s)`,
            weakened: `-${Math.round(this.value * 100)}% all stats for ${this.turnsRemaining} turn(s)`,
            cursed: `Take ${this.value} damage each turn for ${this.turnsRemaining} turn(s)`
        };
        return descriptions[this.debuffType] || `Debuff: ${this.value} for ${this.turnsRemaining} turns`;
    }

    /**
     * Applies the debuff to the enemy
     * @param {Object} gameState - Game state reference
     * @returns {Object} Effect application result
     */
    apply(gameState) {
        const result = {
            success: true,
            effect: this,
            target: gameState.enemy?.name || 'enemy',
            message: ''
        };

        if (!gameState.enemy) {
            result.success = false;
            result.message = 'No enemy to debuff!';
            console.log(`[Effect:Debuff] ${result.message}`);
            return result;
        }

        // Check for existing debuff of same type
        const existingDebuff = gameState.enemy.activeEffects?.find(
            e => e.name === 'debuff' && e.debuffType === this.debuffType
        );

        if (existingDebuff) {
            // Stack or refresh
            if (this.debuffType === 'damage_reduction' || this.debuffType === 'defense_reduction') {
                // Take the stronger value
                existingDebuff.value = Math.max(existingDebuff.value, this.value);
                existingDebuff.turnsRemaining = Math.max(existingDebuff.turnsRemaining, this.duration);
            } else if (this.debuffType === 'slow') {
                // Stack cooldown increases
                existingDebuff.value += this.value;
                existingDebuff.turnsRemaining = Math.max(existingDebuff.turnsRemaining, this.duration);
                
                // Apply immediately to enemy attack cooldown
                if (gameState.enemyAttackCooldown !== undefined) {
                    gameState.enemyAttackCooldown += this.value;
                }
            } else {
                // Refresh other debuffs
                existingDebuff.value = Math.max(existingDebuff.value, this.value);
                existingDebuff.turnsRemaining = Math.max(existingDebuff.turnsRemaining, this.duration);
            }
            existingDebuff.description = existingDebuff._getDescription();
            result.message = `Debuff ${existingDebuff.debuffType} refreshed/stacked!`;
        } else {
            // Add new debuff
            if (typeof gameState.enemy.addEffect === 'function') {
                gameState.enemy.addEffect(this);
            }
            result.message = `Debuff applied: ${this.description}`;
            
            // Apply immediate effects for some debuff types
            if (this.debuffType === 'slow' && this.value > 0) {
                gameState.enemyAttackCooldown += this.value;
                result.message += ` (+${this.value} CD now)`;
            }
        }

        console.log(`[Effect:Debuff] ${result.message}`);
        return result;
    }

    /**
     * Called at end of turn to process debuff expiration
     * @returns {Object} Processing result
     */
    onTurnEnd() {
        this.turnsRemaining--;
        
        if (this.turnsRemaining <= 0) {
            return { expired: true, message: `Debuff ${this.debuffType} expired!` };
        }
        
        return { expired: false, turnsRemaining: this.turnsRemaining };
    }

    /**
     * Gets the debuff value for calculations
     * @returns {number} Debuff value
     */
    getValue() {
        return this.value;
    }

    /**
     * Gets debug info for this effect
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            name: this.name,
            type: this.type,
            debuffType: this.debuffType,
            value: this.value,
            turnsRemaining: this.turnsRemaining,
            source: this.source,
            description: this.description
        };
    }

    /**
     * Creates effect from serialized data
     * @param {Object} data - Serialized effect data
     * @returns {DebuffEffect} New debuff effect
     */
    static fromData(data) {
        return new DebuffEffect(
            data.debuffType || 'damage_reduction',
            data.value || 0,
            data.duration || 1,
            data.source || 'Unknown'
        );
    }
}

// Convenience factory functions
export function createDamageReduction(percent, duration = 1, source = 'Unknown') {
    return new DebuffEffect('damage_reduction', percent, duration, source);
}

export function createDefenseReduction(percent, duration = 1, source = 'Unknown') {
    return new DebuffEffect('defense_reduction', percent, duration, source);
}

export function createSlow(turns, duration = 1, source = 'Unknown') {
    return new DebuffEffect('slow', turns, duration, source);
}

export function createVulnerable(percent, duration = 1, source = 'Unknown') {
    return new DebuffEffect('vulnerable', percent, duration, source);
}
