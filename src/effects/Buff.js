/**
 * Buff Effect Module
 * 
 * Applies a positive buff to the player.
 * Types: damage_bonus, defense_bonus, mana_bonus, crit_bonus
 * 
 * @module effects/Buff
 */

export class BuffEffect {
    constructor(buffType, value, duration = 1, source = 'Unknown') {
        this.name = 'buff';
        this.type = 'buff';
        this.emoji = '✨';
        this.buffType = buffType;
        this.value = value;
        this.duration = duration;
        this.turnsRemaining = duration;
        this.source = source;
        this.consumed = false;
        
        // Set emoji based on buff type
        this._setEmoji();
        this.description = this._getDescription();
    }

    _setEmoji() {
        const emojis = {
            damage_bonus: '⚔️',
            defense_bonus: '🛡️',
            mana_bonus: '💎',
            crit_bonus: '🎯',
            speed_bonus: '⚡',
            heal_bonus: '💚'
        };
        this.emoji = emojis[this.buffType] || '✨';
    }

    _getDescription() {
        const descriptions = {
            damage_bonus: `+${Math.round(this.value * 100)}% damage for ${this.duration} turn(s)`,
            defense_bonus: `+${Math.round(this.value * 100)}% defense for ${this.duration} turn(s)`,
            mana_bonus: `+${this.value} mana for ${this.duration} turn(s)`,
            crit_bonus: `+${Math.round(this.value * 100)}% crit chance for ${this.duration} turn(s)`,
            speed_bonus: `+${Math.round(this.value * 100)}% speed for ${this.duration} turn(s)`,
            heal_bonus: `+${Math.round(this.value * 100)}% healing for ${this.duration} turn(s)`
        };
        return descriptions[this.buffType] || `Buff: ${this.value} for ${this.duration} turns`;
    }

    /**
     * Applies the buff to the player
     * @param {Object} gameState - Game state reference
     * @returns {Object} Effect application result
     */
    apply(gameState) {
        const result = {
            success: true,
            effect: this,
            message: ''
        };

        // Check for existing buff of same type
        const existingBuff = gameState.activeEffects?.find(
            e => e.name === 'buff' && e.buffType === this.buffType && !e.consumed
        );

        if (existingBuff) {
            // Stack or refresh (depending on buff type)
            if (this.buffType === 'damage_bonus' || this.buffType === 'crit_bonus') {
                // Stack these buffs
                existingBuff.value += this.value;
                existingBuff.turnsRemaining = Math.max(existingBuff.turnsRemaining, this.duration);
                existingBuff.description = existingBuff._getDescription();
                result.message = `Buff stacked! ${existingBuff.buffType}: ${existingBuff.value}`;
            } else {
                // Refresh other buffs
                existingBuff.value = Math.max(existingBuff.value, this.value);
                existingBuff.turnsRemaining = Math.max(existingBuff.turnsRemaining, this.duration);
                result.message = `Buff refreshed! ${this.buffType}`;
            }
        } else {
            // Add new buff
            if (typeof gameState.addEffect === 'function') {
                gameState.addEffect(this);
            } else {
                gameState.activeEffects = gameState.activeEffects || [];
                gameState.activeEffects.push(this);
            }
            result.message = `Buff applied: ${this.description}`;
        }

        // Apply immediate effects for some buff types
        if (this.buffType === 'mana_bonus' && this.value > 0) {
            gameState.updatePlayerMana(gameState.playerMana + this.value);
            result.message += ` (+${this.value} mana now)`;
        }

        console.log(`[Effect:Buff] ${result.message}`);
        return result;
    }

    /**
     * Called at end of turn to process buff expiration
     * @returns {Object} Processing result
     */
    onTurnEnd() {
        this.turnsRemaining--;
        
        if (this.turnsRemaining <= 0) {
            this.consumed = true;
            return { expired: true, message: `Buff ${this.buffType} expired!` };
        }
        
        return { expired: false, turnsRemaining: this.turnsRemaining };
    }

    /**
     * Gets the buff value for calculations
     * @returns {number} Buff value
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
            buffType: this.buffType,
            value: this.value,
            turnsRemaining: this.turnsRemaining,
            source: this.source,
            description: this.description,
            consumed: this.consumed
        };
    }

    /**
     * Creates effect from serialized data
     * @param {Object} data - Serialized effect data
     * @returns {BuffEffect} New buff effect
     */
    static fromData(data) {
        return new BuffEffect(
            data.buffType || 'damage_bonus',
            data.value || 0,
            data.duration || 1,
            data.source || 'Unknown'
        );
    }
}

// Convenience factory functions
export function createDamageBuff(percent, duration = 1, source = 'Unknown') {
    return new BuffEffect('damage_bonus', percent, duration, source);
}

export function createDefenseBuff(percent, duration = 1, source = 'Unknown') {
    return new BuffEffect('defense_bonus', percent, duration, source);
}

export function createCritBuff(percent, duration = 1, source = 'Unknown') {
    return new BuffEffect('crit_bonus', percent, duration, source);
}

export function createManaBuff(amount, duration = 1, source = 'Unknown') {
    return new BuffEffect('mana_bonus', amount, duration, source);
}
