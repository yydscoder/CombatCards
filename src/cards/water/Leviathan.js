/**
 * Leviathan Card - Summon Sea Beast
 * 
 * ============================================================================
 * LORE:
 * "In the deepest trenches, where light has never touched, something stirs.
 * Ancient. Hungry. Vast beyond comprehension. The leviathan does not serve.
 * It tolerates. And when it rises, the world holds its breath."
 * - The Abyssal Codex, Forbidden Chapter
 * 
 * Leviathan is the ultimate water spell, calling forth a manifestation
 * of the deep ocean itself. The creature is not truly summoned - it
 * merely extends a fraction of its infinite form through the veil between
 * worlds.
 * 
 * The spell is so costly that only the most powerful mages can cast it.
 * Those who do report hearing distant songs from the depths for weeks
 * afterward. Some say the leviathan remembers those who call it.
 * ============================================================================
 * 
 * @module cards/water/Leviathan
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Leviathan Card Class
 * 
 * The ultimate water card - massive damage with guaranteed effects.
 * 
 * @extends Card
 */
export class Leviathan extends Card {
    /**
     * Creates a new Leviathan card instance
     * 
     * @param {string} name - Card name (default: "Leviathan")
     * @param {number} cost - Mana cost (default: 10)
     * @param {number} damage - Base damage (default: 25)
     */
    constructor(name = "Leviathan", cost = 10, damage = 25) {
        // Define the effect object for this card
        const effect = {
            type: 'damage',
            target: 'enemy',
            value: damage,
            description: `Deals ${damage} damage. Guaranteed crit. Ignores 50% defense.`,
            guaranteedCrit: true,
            defensePenetration: 0.50
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🐋'            // Emoji - whale (leviathan)
        );

        // Leviathan-specific properties
        this.damage = damage;
        this.element = 'water';
        this.isElemental = true;
        this.spellType = 'ultimate';
        this.castTime = 'ritual';
        
        // Ultimate mechanics
        this.guaranteedCrit = true;
        this.defensePenetration = 0.50;

        console.log(`Leviathan card created: ${this.name} (Damage: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Leviathan card's effect
     * 
     * Summons the sea beast to devastate the enemy.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Leviathan effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate base damage
        let actualDamage = this.damage;
        
        // Guaranteed critical hit
        actualDamage *= 1.5;
        gameState.isCriticalHit = true;
        console.log(`LEVIATHAN! Guaranteed critical hit! 1.5x damage!`);

        // Apply defense penetration (50%)
        let defenseValue = gameState.enemy?.defense || 0;
        let effectiveDefense = defenseValue * (1 - this.defensePenetration);
        let defenseReduction = Math.min(effectiveDefense / 100, 0.5);
        actualDamage = actualDamage * (1 - defenseReduction);

        // Apply small random variation (±10% for consistency)
        const variation = 0.9 + Math.random() * 0.2;
        actualDamage = Math.floor(actualDamage * variation);

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        console.log(`LEVIATHAN emerges from the depths! ${actualDamage} catastrophic damage!`);

        // Return result object
        return {
            success: true,
            message: `LEVIATHAN! ${actualDamage} devastating damage from the deep!`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [],
            isCriticalHit: true,
            guaranteedCrit: this.guaranteedCrit,
            defensePenetrated: defenseValue * this.defensePenetration,
            defensePenetration: this.defensePenetration,
            spellType: this.spellType
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * @param {Object} gameState - The current game state object
     * @returns {boolean} True if the card can be played, false otherwise
     */
    canPlay(gameState) {
        const hasEnoughMana = gameState.playerMana >= this.cost;
        const isInHand = this.isInHand;
        const isNotOnCooldown = !this.cooldown || this.cooldown <= 0;
        const hasTarget = gameState.enemyHp > 0;

        return hasEnoughMana && isInHand && isNotOnCooldown && hasTarget;
    }

    /**
     * Gets the card's display name with Leviathan-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🐋`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `DMG: ${this.damage} | Guaranteed Crit | 50% Pen`;
    }
}
