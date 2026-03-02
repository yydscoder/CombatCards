/**
 * NatureWrath Card - Primordial Fury
 * 
 * ============================================================================
 * LORE:
 * "Nature is not kind. Nature is not gentle. Nature is the storm that
 * drowns, the fire that consumes, the predator that hunts. To call upon
 * nature's wrath is to remember this truth."
 * - The Storm Druids, Teachings of Balance
 * 
 * NatureWrath channels the full fury of the natural world into a single
 * devastating attack. Vines lash out like whips, rocks fly like cannonballs,
 * and lightning arcs from the caster's fingertips. The spell is nature's
 * answer to those who would despoil the wild places.
 * 
 * The spell leaves the battlefield transformed - scorched earth, shattered
 * stone, and the lingering scent of ozone and crushed leaves.
 * ============================================================================
 * 
 * @module cards/nature/NatureWrath
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * NatureWrath Card Class
 * 
 * The ultimate nature card - massive multi-type damage.
 * 
 * @extends Card
 */
export class NatureWrath extends Card {
    /**
     * Creates a new NatureWrath card instance
     * 
     * @param {string} name - Card name (default: "NatureWrath")
     * @param {number} cost - Mana cost (default: 10)
     * @param {number} damage - Base damage (default: 22)
     */
    constructor(name = "NatureWrath", cost = 10, damage = 22) {
        // Define the effect object for this card
        const effect = {
            type: 'damage',
            target: 'enemy',
            value: damage,
            description: `Deals ${damage} damage. Applies 5 Poison DoT. Guaranteed crit.`,
            guaranteedCrit: true,
            dotDamage: 5,
            dotDuration: 2
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '⛈️'            // Emoji - cloud with lightning
        );

        // NatureWrath-specific properties
        this.damage = damage;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'ultimate';
        this.castTime = 'ritual';
        
        // Ultimate mechanics
        this.guaranteedCrit = true;
        this.dotDamage = 5;
        this.dotDuration = 2;

        console.log(`NatureWrath card created: ${this.name} (Damage: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the NatureWrath card's effect
     * 
     * Unleashes the full fury of nature on the enemy.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for NatureWrath effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate damage with guaranteed crit
        let actualDamage = this.damage;
        actualDamage *= 1.5; // Guaranteed crit
        gameState.isCriticalHit = true;
        console.log(`NATURE'S WRATH! Guaranteed critical hit!`);

        // Apply random variation (±10% for consistency)
        const variation = 0.9 + Math.random() * 0.2;
        actualDamage = Math.floor(actualDamage * variation);

        // Apply damage
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        // Apply poison DoT
        const poisonEffect = {
            name: 'nature_wrath_poison',
            type: 'poison',
            damagePerTick: this.dotDamage,
            duration: this.dotDuration,
            turnsRemaining: this.dotDuration,
            source: this.name,
            emoji: '☠️'
        };

        if (typeof gameState.enemy?.addEffect === 'function') {
            gameState.enemy.addEffect(poisonEffect);
        }

        console.log(
            `NATURE'S WRATH unleashed: ${actualDamage} damage + ${this.dotDamage} poison ` +
            `for ${this.dotDuration} turns!`
        );

        // Return result object
        return {
            success: true,
            message: `Nature's wrath devastates for ${actualDamage} damage!`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [poisonEffect],
            isCriticalHit: true,
            guaranteedCrit: this.guaranteedCrit,
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

        return hasEnoughMana && isInHand && isNotOnCooldown && hasTarget;
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ⛈️`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `DMG: ${this.damage} | Guaranteed Crit | +${this.dotDamage} Poison`;
    }
}
