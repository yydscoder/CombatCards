/**
 * FrostBite Card - Freezing Touch
 * 
 * ============================================================================
 * LORE:
 * "The cold does not kill quickly. It creeps. It waits. It settles into
 * your bones and whispers sweet sleep. By the time you feel the frost,
 * it is already too late."
 * - Warning of the Frost Wastes
 * 
 * FrostBite channels the numbing cold of the void into a touch that freezes
 * flesh and slows movement. The spell creates intricate patterns of frost
 * that spread across the target's skin, crystallizing moisture and stiffening
 * joints.
 * 
 * Unlike direct damage spells, FrostBite is patient. Its true power emerges
 * over time as the accumulated cold saps strength and slows reaction. A
 * target afflicted by FrostBite finds each movement more difficult than
 * the last.
 * ============================================================================
 * 
 * @module cards/water/FrostBite
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * FrostBite Card Class
 * 
 * A debuff card that applies a stacking slow effect.
 * Each stack reduces enemy attack speed and damage.
 * 
 * @extends Card
 */
export class FrostBite extends Card {
    /**
     * Creates a new FrostBite card instance
     * 
     * @param {string} name - Card name (default: "FrostBite")
     * @param {number} cost - Mana cost (default: 3)
     * @param {number} damage - Initial damage (default: 4)
     */
    constructor(name = "FrostBite", cost = 3, damage = 4) {
        // Define the effect object for this card
        const effect = {
            type: 'debuff',
            target: 'enemy',
            value: damage,
            description: `Deal ${damage} damage. Apply Frost (reduces enemy DMG by 10%, stacks 5x)`,
            damageReductionPerStack: 0.10,
            maxStacks: 5,
            duration: 4
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '❄️'            // Emoji - snowflake
        );

        // FrostBite-specific properties
        this.damage = damage;
        this.element = 'ice';
        this.isElemental = true;
        this.spellType = 'debuff';
        this.castTime = 'instant';
        
        // Debuff mechanics
        this.damageReductionPerStack = 0.10;
        this.maxStacks = 5;
        this.duration = 4;

        console.log(`FrostBite card created: ${this.name} (DMG: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the FrostBite card's effect
     * 
     * Applies freezing cold to the enemy, dealing damage and
     * reducing their attack power with each stack.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for FrostBite effect');
            return { success: false, reason: 'no_target' };
        }

        // Apply initial damage
        let actualDamage = this.damage;
        
        // Small variance on damage (±15%)
        const variance = 0.85 + Math.random() * 0.30;
        actualDamage = Math.floor(actualDamage * variance);

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        // Apply or update Frost effect
        let frostEffect = null;
        let existingStacks = 0;
        
        if (gameState.enemy && gameState.enemy.activeEffects) {
            const existingIndex = gameState.enemy.activeEffects.findIndex(
                effect => effect.name === 'frost'
            );
            
            if (existingIndex !== -1) {
                frostEffect = gameState.enemy.activeEffects[existingIndex];
                existingStacks = frostEffect.stacks || 0;
            }
        }

        // Calculate new stack count
        let newStacks = Math.min(existingStacks + 1, this.maxStacks);
        const totalDamageReduction = newStacks * this.damageReductionPerStack;

        // Create or update frost effect
        if (!frostEffect) {
            frostEffect = {
                name: 'frost',
                damageReductionPerStack: this.damageReductionPerStack,
                stacks: newStacks,
                duration: this.duration,
                source: this.name,
                type: 'debuff',
                maxStacks: this.maxStacks,
                totalDamageReduction: totalDamageReduction
            };
            
            if (typeof gameState.enemy?.addEffect === 'function') {
                gameState.enemy.addEffect(frostEffect);
            }
        } else {
            frostEffect.stacks = newStacks;
            frostEffect.duration = this.duration;
            frostEffect.totalDamageReduction = totalDamageReduction;
        }

        console.log(
            `FrostBite executed: ${actualDamage} damage | ` +
            `Frost: ${newStacks}/${this.maxStacks} stacks (${totalDamageReduction * 100}% DMG reduction)`
        );

        // Return result object
        return {
            success: true,
            message: `FrostBite chills for ${actualDamage} damage! Frost: ${newStacks}/${this.maxStacks} stacks`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [frostEffect],
            isCriticalHit: false,
            frostApplied: true,
            currentStacks: newStacks,
            maxStacks: this.maxStacks,
            damageReductionPerStack: this.damageReductionPerStack,
            totalDamageReduction: totalDamageReduction,
            duration: this.duration,
            spellType: this.spellType
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * FrostBite is most effective early in combat to maximize stacks.
     * 
     * @param {Object} gameState - The current game state object
     * @returns {boolean} True if the card can be played, false otherwise
     */
    canPlay(gameState) {
        // Check if the player has enough mana
        const hasEnoughMana = gameState.playerMana >= this.cost;

        // Check if the card is in hand
        const isInHand = this.isInHand;

        // Check if the card is not on cooldown
        const isNotOnCooldown = !this.cooldown || this.cooldown <= 0;

        // Valid target check
        const hasTarget = gameState.enemyHp > 0;

        return hasEnoughMana && isInHand && isNotOnCooldown && hasTarget;
    }

    /**
     * Gets the card's display name with FrostBite-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ❄️`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with debuff info
     */
    getStatsString() {
        return `DMG: ${this.damage} | -${this.damageReductionPerStack * 100}% DMG/stack | Max: ${this.maxStacks}x`;
    }
}
