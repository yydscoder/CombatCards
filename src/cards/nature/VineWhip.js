/**
 * VineWhip Card - Thorny Lash
 * 
 * ============================================================================
 * LORE:
 * "The vines do not hate. They do not love. They simply grow, reaching
 * for sunlight, for water, for anything to cling to. And when they find
 * purchase, they hold on tight."
 * - The Garden Keeper's Journal
 * 
 * VineWhip conjures living vines that lash out at the caster's command.
 * The thorns dig deep into flesh, drawing blood and leaving seeds that
 * sprout into further torment. Nature's vengeance is patient but thorough.
 * 
 * The spell is favored by druids who see violence as a necessary evil.
 * The vines return to the earth after their task is done, their purpose
 * fulfilled.
 * ============================================================================
 * 
 * @module cards/nature/VineWhip
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * VineWhip Card Class
 * 
 * A basic nature attack that deals damage and applies a small DoT.
 * 
 * @extends Card
 */
export class VineWhip extends Card {
    /**
     * Creates a new VineWhip card instance
     * 
     * @param {string} name - Card name (default: "VineWhip")
     * @param {number} cost - Mana cost (default: 2)
     * @param {number} damage - Base damage (default: 5)
     */
    constructor(name = "VineWhip", cost = 2, damage = 5) {
        // Define the effect object for this card
        const effect = {
            type: 'damage',
            target: 'enemy',
            value: damage,
            description: `Deals ${damage} damage. Apply 2 Wild DoT for 2 turns`,
            dotDamage: 2,
            dotDuration: 2,
            dotType: 'wild'
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🌿'            // Emoji - herb/vine
        );

        // VineWhip-specific properties
        this.damage = damage;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'projectile';
        this.castTime = 'instant';
        
        // DoT properties
        this.dotDamage = 2;
        this.dotDuration = 2;
        this.dotType = 'wild';

        console.log(`VineWhip card created: ${this.name} (Damage: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the VineWhip card's effect
     * 
     * Lashes the enemy with thorny vines, dealing damage and applying DoT.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for VineWhip effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate base damage
        let actualDamage = this.damage;
        
        // Check for critical hit (12% base chance)
        const isCriticalHit = Math.random() < 0.12;
        
        if (isCriticalHit) {
            actualDamage *= 1.5;
            gameState.isCriticalHit = true;
            console.log(`VineWhip Critical Hit! Damage multiplier: 1.5x`);
        } else {
            gameState.isCriticalHit = false;
        }

        // Apply random variation (±20%)
        const variation = 0.8 + Math.random() * 0.4;
        actualDamage = Math.floor(actualDamage * variation);

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        // Apply Wild DoT effect
        const dotApplied = true;
        const dotEffect = {
            name: 'wild_growth',
            type: 'wild',
            damagePerTick: this.dotDamage,
            duration: this.dotDuration,
            turnsRemaining: this.dotDuration,
            source: this.name,
            stacks: 1,
            emoji: '🌿'
        };

        // Add DoT to enemy
        if (gameState.enemy && typeof gameState.enemy.addEffect === 'function') {
            gameState.enemy.addEffect(dotEffect);
        }

        console.log(
            `VineWhip executed: ${actualDamage} damage + ${this.dotDamage} Wild DoT ` +
            `for ${this.dotDuration} turns`
        );

        // Return result object
        return {
            success: true,
            message: `VineWhip lashes for ${actualDamage} damage and plants seeds of torment!`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [dotEffect],
            isCriticalHit: isCriticalHit,
            dotApplied: dotApplied,
            dotDamage: this.dotDamage,
            dotDuration: this.dotDuration,
            dotType: this.dotType
        };
    }

    /**
     * Gets the card's display name with VineWhip-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🌿`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `DMG: ${this.damage} | DoT: ${this.dotDamage}×${this.dotDuration}`;
    }
}
