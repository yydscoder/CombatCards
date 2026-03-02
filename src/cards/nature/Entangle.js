/**
 * Entangle Card - Grasping Vines
 * 
 * ============================================================================
 * LORE:
 * "The vine does not hate the tree it strangles. It simply seeks the light,
 * and the tree is in the way. Such is the way of nature - not cruel, but
 * indifferent to those who stand in the path of growth."
 * - The Vine Speakers, Lessons from the Canopy
 * 
 * Entangle summons thick, muscular vines that wrap around the target's
 * limbs and torso. The vines tighten with each movement, restricting
 * breathing and blood flow. Breaking free requires immense strength or
 * outside help.
 * 
 * The spell is favored by druids who prefer non-lethal takedowns. A
 * properly entangled foe is harmless, even if they survive.
 * ============================================================================
 * 
 * @module cards/nature/Entangle
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Entangle Card Class
 * 
 * A CC card that stuns the enemy.
 * 
 * @extends Card
 */
export class Entangle extends Card {
    /**
     * Creates a new Entangle card instance
     * 
     * @param {string} name - Card name (default: "Entangle")
     * @param {number} cost - Mana cost (default: 5)
     * @param {number} damage - Initial damage (default: 4)
     */
    constructor(name = "Entangle", cost = 5, damage = 4) {
        // Define the effect object for this card
        const effect = {
            type: 'crowd_control',
            target: 'enemy',
            value: damage,
            description: `Deal ${damage} damage. Stun enemy for 1 turn.`,
            stunDuration: 1,
            dotDamage: 2,
            dotDuration: 2
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🕸️'            // Emoji - spider web (entangling)
        );

        // Entangle-specific properties
        this.damage = damage;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'crowd_control';
        this.castTime = 'instant';
        
        // CC mechanics
        this.stunDuration = 1;
        this.dotDamage = 2;
        this.dotDuration = 2;

        console.log(`Entangle card created: ${this.name} (Stun: ${this.stunDuration}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Entangle card's effect
     * 
     * Wraps the enemy in vines, stunning them.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Entangle effect');
            return { success: false, reason: 'no_target' };
        }

        // Apply initial damage
        let actualDamage = this.damage;
        const variance = 0.8 + Math.random() * 0.4;
        actualDamage = Math.floor(actualDamage * variance);

        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        // Create stun effect
        const stunEffect = {
            name: 'entangled',
            type: 'crowd_control',
            duration: this.stunDuration,
            turnsRemaining: this.stunDuration,
            source: this.name,
            emoji: '🕸️',
            description: 'Cannot act while entangled'
        };

        // Create DoT from constriction
        const dotEffect = {
            name: 'constriction',
            type: 'nature_dot',
            damagePerTick: this.dotDamage,
            duration: this.dotDuration,
            turnsRemaining: this.dotDuration,
            source: this.name,
            emoji: '🌿'
        };

        // Apply effects
        if (typeof gameState.enemy?.addEffect === 'function') {
            gameState.enemy.addEffect(stunEffect);
            gameState.enemy.addEffect(dotEffect);
        }

        console.log(
            `Entangle executed: ${actualDamage} damage, Stunned for ${this.stunDuration} turn(s)`
        );

        // Return result object
        return {
            success: true,
            message: `Vines entangle the enemy! Stunned for ${this.stunDuration} turn!`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [stunEffect, dotEffect],
            isCriticalHit: false,
            stunApplied: true,
            stunDuration: this.stunDuration,
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

        // Check if enemy is already stunned/entangled
        const isStunned = gameState.enemy?.activeEffects?.some(
            effect => ['entangled', 'stun', 'freeze'].includes(effect.name)
        ) || false;

        return hasEnoughMana && isInHand && isNotOnCooldown && hasTarget && !isStunned;
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🕸️`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `DMG: ${this.damage} | Stun: ${this.stunDuration} | DoT: ${this.dotDamage}×${this.dotDuration}`;
    }
}
