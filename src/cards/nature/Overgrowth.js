/**
 * Overgrowth Card - Suffocating Nature
 * 
 * ============================================================================
 * LORE:
 * "The jungle does not forgive. It waits. It watches. It grows. And when
 * you stumble, when you falter, it pulls you down into the green dark
 * where you become part of the cycle."
 * - The Jungle Kings, Laws of the Wild
 * 
 * Overgrowth causes rapid, aggressive plant growth that completely
 * envelops the target. Vines, moss, and flowers cover every inch of
 * exposed skin, while roots dig deep seeking nutrients. The effect is
 * both beautiful and terrifying - a living tomb of green.
 * 
 * The spell is considered one of the most powerful nature magic can
 * offer. It combines damage, crowd control, and持续的消耗 into a
 * single devastating effect.
 * ============================================================================
 * 
 * @module cards/nature/Overgrowth
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Overgrowth Card Class
 * 
 * A powerful DoT card that also reduces enemy capabilities.
 * 
 * @extends Card
 */
export class Overgrowth extends Card {
    /**
     * Creates a new Overgrowth card instance
     * 
     * @param {string} name - Card name (default: "Overgrowth")
     * @param {number} cost - Mana cost (default: 8)
     * @param {number} dotDamage - Damage per tick (default: 6)
     */
    constructor(name = "Overgrowth", cost = 8, dotDamage = 6) {
        // Define the effect object for this card
        const effect = {
            type: 'damage_over_time',
            target: 'enemy',
            value: dotDamage,
            description: `Deal ${dotDamage} damage/turn for 4 turns. -30% enemy damage.`,
            dotDamage: dotDamage,
            dotDuration: 4,
            damageReduction: 0.30
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🌿'            // Emoji - herb
        );

        // Overgrowth-specific properties
        this.dotDamage = dotDamage;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'damage_over_time';
        this.castTime = 'ritual';
        
        // DoT and debuff mechanics
        this.dotDuration = 4;
        this.damageReduction = 0.30;
        this.totalDamage = dotDamage * this.dotDuration;

        console.log(`Overgrowth card created: ${this.name} (${this.dotDamage}/tick, Cost: ${this.cost})`);
    }

    /**
     * Executes the Overgrowth card's effect
     * 
     * Covers the enemy in suffocating plant growth.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Overgrowth effect');
            return { success: false, reason: 'no_target' };
        }

        // Apply initial damage
        const initialDamage = Math.floor(this.dotDamage * 0.5);
        if (initialDamage > 0) {
            const newEnemyHp = gameState.enemyHp - initialDamage;
            gameState.updateEnemyHp(newEnemyHp);
            gameState.lastDamageDealt = initialDamage;
        }

        // Create overgrowth DoT effect
        const overgrowthEffect = {
            name: 'overgrowth',
            type: 'nature_dot',
            damagePerTick: this.dotDamage,
            duration: this.dotDuration,
            turnsRemaining: this.dotDuration,
            source: this.name,
            emoji: '🌿',
            damageReduction: this.damageReduction,
            totalDamage: this.totalDamage
        };

        // Create damage reduction debuff
        const weakenDebuff = {
            name: 'overgrowth_weaken',
            type: 'debuff',
            damageReduction: this.damageReduction,
            duration: this.dotDuration,
            turnsRemaining: this.dotDuration,
            source: this.name,
            emoji: '💚'
        };

        // Apply effects
        if (typeof gameState.enemy?.addEffect === 'function') {
            gameState.enemy.addEffect(overgrowthEffect);
            gameState.enemy.addEffect(weakenDebuff);
        }

        console.log(
            `Overgrowth consumed the enemy: ${this.dotDamage} damage/turn for ${this.dotDuration} turns, ` +
            `-${this.damageReduction * 100}% damage (Total: ${this.totalDamage})`
        );

        // Return result object
        return {
            success: true,
            message: `Nature consumes the enemy! ${this.dotDamage} DoT for ${this.dotDuration} turns`,
            damage: initialDamage,
            healing: 0,
            statusEffects: [overgrowthEffect, weakenDebuff],
            isCriticalHit: false,
            dotApplied: true,
            dotDamage: this.dotDamage,
            dotDuration: this.dotDuration,
            damageReduction: this.damageReduction,
            totalDamage: this.totalDamage,
            initialDamage: initialDamage,
            spellType: this.spellType
        };
    }

    /**
     * Checks if the card can be played
     * 
     * @param {Object} gameState - The current game state object
     * @returns {boolean} True if the card can be played
     */
    canPlay(gameState) {
        const hasEnoughMana = gameState.playerMana >= this.cost;
        const isInHand = this.isInHand;
        const isNotOnCooldown = !this.cooldown || this.cooldown <= 0;
        const hasTarget = gameState.enemyHp > 0;

        // Check if overgrowth is already active
        const hasExisting = gameState.enemy?.activeEffects?.some(
            effect => effect.name === 'overgrowth'
        ) || false;

        return hasEnoughMana && isInHand && isNotOnCooldown && hasTarget && !hasExisting;
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🌿`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `${this.dotDamage}/turn × ${this.dotDuration} | Total: ${this.totalDamage} | -30% DMG`;
    }
}
