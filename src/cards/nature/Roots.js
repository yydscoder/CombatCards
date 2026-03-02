/**
 * Roots Card - Entangling Grasp
 * 
 * ============================================================================
 * LORE:
 * "The earth remembers every footstep. Every root, every seed, every drop
 * of blood. And when called upon, the earth reaches up with grasping fingers
 * to hold you down."
 * - The Earthbinders, Songs of the Deep
 * 
 * Roots summons thick, gnarled tendrils that burst from the ground to trap
 * the target. The roots tighten with each struggle, restricting movement
 * and sapping strength. Victims report feeling the roots drink from them,
 * as if the earth itself was consuming their life force.
 * 
 * The spell is particularly effective against fleeing enemies or those who
 * rely on mobility. Once the roots take hold, escape is nearly impossible.
 * ============================================================================
 * 
 * @module cards/nature/Roots
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Roots Card Class
 * 
 * A crowd control card that roots the enemy and deals small DoT.
 * 
 * @extends Card
 */
export class Roots extends Card {
    /**
     * Creates a new Roots card instance
     * 
     * @param {string} name - Card name (default: "Roots")
     * @param {number} cost - Mana cost (default: 4)
     * @param {number} damage - Initial damage (default: 3)
     */
    constructor(name = "Roots", cost = 4, damage = 3) {
        // Define the effect object for this card
        const effect = {
            type: 'crowd_control',
            target: 'enemy',
            value: damage,
            description: `Deal ${damage} damage. Root enemy (50% miss chance) for 2 turns.`,
            rootDuration: 2,
            missChance: 0.50,
            dotDamage: 2,
            dotDuration: 2
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🌳'            // Emoji - tree (roots)
        );

        // Roots-specific properties
        this.damage = damage;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'crowd_control';
        this.castTime = 'ritual';
        
        // CC and DoT properties
        this.rootDuration = 2;
        this.missChance = 0.50;
        this.dotDamage = 2;
        this.dotDuration = 2;

        console.log(`Roots card created: ${this.name} (DMG: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Roots card's effect
     * 
     * Entangles the enemy, dealing damage and applying root CC.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Roots effect');
            return { success: false, reason: 'no_target' };
        }

        // Apply initial damage
        let actualDamage = this.damage;
        const variance = 0.8 + Math.random() * 0.4;
        actualDamage = Math.floor(actualDamage * variance);

        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        // Create root effect
        const rootEffect = {
            name: 'rooted',
            type: 'crowd_control',
            duration: this.rootDuration,
            turnsRemaining: this.rootDuration,
            source: this.name,
            missChance: this.missChance,
            emoji: '🌳',
            description: 'Cannot move, 50% miss chance'
        };

        // Create DoT effect from roots draining life
        const dotEffect = {
            name: 'root_drain',
            type: 'nature_dot',
            damagePerTick: this.dotDamage,
            duration: this.dotDuration,
            turnsRemaining: this.dotDuration,
            source: this.name,
            emoji: '🌿'
        };

        // Apply effects
        if (typeof gameState.enemy?.addEffect === 'function') {
            gameState.enemy.addEffect(rootEffect);
            gameState.enemy.addEffect(dotEffect);
        }

        console.log(
            `Roots executed: ${actualDamage} damage, Rooted for ${this.rootDuration} turns, ` +
            `${this.dotDamage} drain/tick`
        );

        // Return result object
        return {
            success: true,
            message: `Entangling roots trap the enemy! ${this.rootDuration} turns rooted`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [rootEffect, dotEffect],
            isCriticalHit: false,
            rootApplied: true,
            rootDuration: this.rootDuration,
            missChance: this.missChance,
            dotApplied: true,
            dotDamage: this.dotDamage,
            dotDuration: this.dotDuration,
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

        // Check if enemy is already rooted
        const isRooted = gameState.enemy?.activeEffects?.some(
            effect => effect.name === 'rooted'
        ) || false;

        return hasEnoughMana && isInHand && isNotOnCooldown && hasTarget && !isRooted;
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🌳`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `DMG: ${this.damage} | Root: ${this.rootDuration} turns | 50% Miss`;
    }
}
