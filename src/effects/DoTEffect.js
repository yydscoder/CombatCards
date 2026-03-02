/**
 * DoT Effect Module for Emoji Card Battle
 * 
 * This module implements Damage-over-Time (DoT) effect management.
 * DoT effects deal damage at the start of each turn for a specified duration.
 * 
 * Supported DoT types:
 * - Poison: Nature-based damage over time
 * - Burn: Fire-based damage over time
 * - Bleed: Physical damage over time
 * - Frost: Ice-based damage over time
 * - Decay: Dark magic damage over time
 * 
 * @module effects/DoTEffect
 */

/**
 * DoT Effect Types
 * @enum {string}
 */
export const DoTType = {
    POISON: 'poison',
    BURN: 'burn',
    BLEED: 'bleed',
    FROST: 'frost',
    DECAY: 'decay',
    WILD: 'wild' // Nature-specific DoT
};

/**
 * DoT Effect Configuration
 * Each type has default properties
 */
export const DoTConfig = {
    [DoTType.POISON]: {
        name: 'Poison',
        emoji: '☠️',
        color: '#4a7a4a',
        description: 'Toxic damage over time',
        stacks: true,
        maxStacks: 5
    },
    [DoTType.BURN]: {
        name: 'Burn',
        emoji: '🔥',
        color: '#e74c3c',
        description: 'Fire damage over time',
        stacks: true,
        maxStacks: 5
    },
    [DoTType.BLEED]: {
        name: 'Bleed',
        emoji: '🩸',
        color: '#c0392b',
        description: 'Physical damage over time',
        stacks: true,
        maxStacks: 3
    },
    [DoTType.FROST]: {
        name: 'Frost',
        emoji: '❄️',
        color: '#3498db',
        description: 'Ice damage over time',
        stacks: false,
        maxStacks: 1
    },
    [DoTType.DECAY]: {
        name: 'Decay',
        emoji: '💀',
        color: '#8e44ad',
        description: 'Dark magic damage over time',
        stacks: true,
        maxStacks: 3
    },
    [DoTType.WILD]: {
        name: 'Wild Growth',
        emoji: '🌿',
        color: '#27ae60',
        description: 'Nature damage over time',
        stacks: true,
        maxStacks: 5
    }
};

/**
 * DoTEffect Class
 * 
 * Represents a single damage-over-time effect instance.
 */
export class DoTEffect {
    /**
     * Creates a new DoT effect instance
     * 
     * @param {Object} config - Configuration object
     * @param {DoTType} config.type - The type of DoT
     * @param {number} config.damagePerTick - Damage dealt each tick
     * @param {number} config.duration - Number of turns the DoT lasts
     * @param {string} config.source - The source of the DoT (card name, ability, etc.)
     * @param {number} config.stacks - Number of stacks (default: 1)
     */
    constructor(config) {
        this.type = config.type || DoTType.POISON;
        this.name = config.name || DoTConfig[this.type].name;
        this.emoji = config.emoji || DoTConfig[this.type].emoji;
        this.damagePerTick = config.damagePerTick || 2;
        this.duration = config.duration || 3;
        this.turnsRemaining = this.duration;
        this.source = config.source || 'unknown';
        this.stacks = config.stacks || 1;
        this.maxStacks = DoTConfig[this.type]?.maxStacks || 5;
        this.canStack = DoTConfig[this.type]?.stacks || false;
        this.isActive = true;
        this.lastTickDamage = 0;
        
        console.log(`DoTEffect created: ${this.name} (${this.damagePerTick} DMG/tick, ${this.duration} turns)`);
    }

    /**
     * Processes a single tick of the DoT effect
     * 
     * @param {Object} target - The target taking DoT damage
     * @param {Object} gameState - The current game state
     * @returns {Object} Tick result containing damage and status
     */
    tick(target, gameState) {
        if (!this.isActive || this.turnsRemaining <= 0) {
            return { success: false, reason: 'effect_expired' };
        }

        // Calculate total damage for this tick (including stacks)
        const totalDamage = Math.floor(this.damagePerTick * this.stacks);
        
        // Apply damage to target
        if (target.hp !== undefined) {
            target.hp = Math.max(0, target.hp - totalDamage);
            this.lastTickDamage = totalDamage;
            
            // Check if target died
            if (target.hp <= 0 && target.isAlive !== undefined) {
                target.isAlive = false;
            }
        }

        // Decrease duration
        this.turnsRemaining--;

        // Check if effect should expire
        if (this.turnsRemaining <= 0) {
            this.isActive = false;
        }

        console.log(`${this.name} DoT tick: ${totalDamage} damage (${this.turnsRemaining} turns remaining)`);

        return {
            success: true,
            damage: totalDamage,
            turnsRemaining: this.turnsRemaining,
            isExpired: !this.isActive,
            effectType: this.type
        };
    }

    /**
     * Adds stacks to this DoT effect
     * 
     * @param {number} amount - Number of stacks to add
     * @returns {boolean} True if stacks were added, false if at max
     */
    addStacks(amount = 1) {
        if (!this.canStack) {
            return false;
        }

        const newStackCount = Math.min(this.stacks + amount, this.maxStacks);
        const stacksAdded = newStackCount - this.stacks;
        this.stacks = newStackCount;

        // Refresh duration when stacking
        if (stacksAdded > 0) {
            this.turnsRemaining = this.duration;
        }

        console.log(`${this.name} stacked: ${this.stacks}/${this.maxStacks} stacks`);
        return stacksAdded > 0;
    }

    /**
     * Removes stacks from this DoT effect
     * 
     * @param {number} amount - Number of stacks to remove
     */
    removeStacks(amount = 1) {
        this.stacks = Math.max(0, this.stacks - amount);
        if (this.stacks <= 0) {
            this.isActive = false;
        }
        console.log(`${this.name} stacks reduced: ${this.stacks} remaining`);
    }

    /**
     * Gets the total remaining damage this DoT will deal
     * 
     * @returns {number} Total remaining damage
     */
    getTotalRemainingDamage() {
        return this.damagePerTick * this.stacks * this.turnsRemaining;
    }

    /**
     * Creates a serializable representation of this effect
     * 
     * @returns {Object} Serializable object
     */
    toJSON() {
        return {
            type: this.type,
            name: this.name,
            emoji: this.emoji,
            damagePerTick: this.damagePerTick,
            duration: this.duration,
            turnsRemaining: this.turnsRemaining,
            source: this.source,
            stacks: this.stacks,
            maxStacks: this.maxStacks,
            canStack: this.canStack,
            isActive: this.isActive,
            totalRemainingDamage: this.getTotalRemainingDamage()
        };
    }
}

/**
 * DoTManager Class
 * 
 * Manages multiple DoT effects on a single target.
 */
export class DoTManager {
    /**
     * Creates a new DoT manager
     * 
     * @param {Object} target - The target that DoTs are applied to
     */
    constructor(target) {
        this.target = target;
        this.effects = new Map();
        console.log(`DoTManager created for target: ${target?.name || 'unknown'}`);
    }

    /**
     * Applies a new DoT effect or stacks an existing one
     * 
     * @param {DoTEffect} newEffect - The DoT effect to apply
     * @returns {Object} Application result
     */
    apply(newEffect) {
        const existingEffect = this.effects.get(newEffect.type);

        if (existingEffect && existingEffect.canStack) {
            // Stack the existing effect
            const stacksAdded = existingEffect.addStacks(newEffect.stacks);
            return {
                success: true,
                action: stacksAdded ? 'stacked' : 'max_stacks',
                effect: existingEffect,
                stacks: existingEffect.stacks
            };
        } else if (existingEffect && !existingEffect.canStack) {
            // Refresh duration if can't stack
            existingEffect.turnsRemaining = newEffect.duration;
            return {
                success: true,
                action: 'refreshed',
                effect: existingEffect,
                turnsRemaining: existingEffect.turnsRemaining
            };
        } else {
            // Add new effect
            this.effects.set(newEffect.type, newEffect);
            return {
                success: true,
                action: 'applied',
                effect: newEffect
            };
        }
    }

    /**
     * Processes all active DoT effects (called at turn start)
     * 
     * @param {Object} gameState - The current game state
     * @returns {Object[]} Array of tick results
     */
    processAll(gameState) {
        const results = [];
        const expiredEffects = [];

        for (const [type, effect] of this.effects.entries()) {
            if (effect.isActive && effect.turnsRemaining > 0) {
                const tickResult = effect.tick(this.target, gameState);
                results.push({
                    type: type,
                    name: effect.name,
                    emoji: effect.emoji,
                    ...tickResult
                });

                if (!effect.isActive) {
                    expiredEffects.push(type);
                }
            } else {
                expiredEffects.push(type);
            }
        }

        // Remove expired effects
        expiredEffects.forEach(type => this.effects.delete(type));

        return results;
    }

    /**
     * Gets all active DoT effects
     * 
     * @returns {DoTEffect[]} Array of active effects
     */
    getAllActive() {
        return Array.from(this.effects.values()).filter(e => e.isActive);
    }

    /**
     * Gets the total damage per turn from all DoTs
     * 
     * @returns {number} Total damage per turn
     */
    getTotalDamagePerTurn() {
        let total = 0;
        for (const effect of this.effects.values()) {
            if (effect.isActive) {
                total += effect.damagePerTick * effect.stacks;
            }
        }
        return total;
    }

    /**
     * Removes a specific DoT type
     * 
     * @param {DoTType} type - The type to remove
     * @returns {boolean} True if effect was removed
     */
    remove(type) {
        return this.effects.delete(type);
    }

    /**
     * Removes all DoT effects (cleanse)
     * 
     * @returns {number} Number of effects removed
     */
    removeAll() {
        const count = this.effects.size;
        this.effects.clear();
        console.log(`All DoT effects removed: ${count} effects cleansed`);
        return count;
    }

    /**
     * Gets a summary of all active DoTs
     * 
     * @returns {Object} Summary object
     */
    getSummary() {
        const summary = {
            activeCount: 0,
            totalDamagePerTurn: 0,
            totalRemainingDamage: 0,
            effects: []
        };

        for (const effect of this.getAllActive()) {
            summary.activeCount++;
            summary.totalDamagePerTurn += effect.damagePerTick * effect.stacks;
            summary.totalRemainingDamage += effect.getTotalRemainingDamage();
            summary.effects.push(effect.toJSON());
        }

        return summary;
    }
}

/**
 * Creates a DoT effect with the specified parameters
 * 
 * @param {DoTType} type - The type of DoT
 * @param {number} damagePerTick - Damage per tick
 * @param {number} duration - Duration in turns
 * @param {string} source - Source of the DoT
 * @param {number} stacks - Initial stacks
 * @returns {DoTEffect} The created DoT effect
 */
export function createDoT(type, damagePerTick, duration, source, stacks = 1) {
    return new DoTEffect({
        type,
        damagePerTick,
        duration,
        source,
        stacks
    });
}

/**
 * Creates a DoTManager for a target
 * 
 * @param {Object} target - The target to manage DoTs for
 * @returns {DoTManager} The created DoT manager
 */
export function createDoTManager(target) {
    return new DoTManager(target);
}
