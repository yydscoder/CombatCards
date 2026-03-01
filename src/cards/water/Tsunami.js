/**
 * Tsunami Card - Cataclysmic Wave
 * 
 * ============================================================================
 * LORE:
 * "When the ocean rises, kingdoms fall. The tsunami does not hate.
 * It does not love. It simply is - the weight of the sea made manifest,
 * the deep's answer to those who would conquer the shore."
 * - The Drowned Cities, Epitaph
 * 
 * Tsunami is the ultimate water spell, summoning a wave of impossible
 * proportions. The spell doesn't create water - it calls upon the ocean
 * itself, tearing open a gateway that allows the sea to pour through.
 * 
 * The spell is so devastating that most mages refuse to learn it. Those
 * who do are forever changed, hearing the ocean's call in their dreams.
 * ============================================================================
 * 
 * @module cards/water/Tsunami
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Tsunami Card Class
 * 
 * An ultimate water attack that deals massive damage.
 * High cost but devastating effect.
 * 
 * @extends Card
 */
export class Tsunami extends Card {
    /**
     * Creates a new Tsunami card instance
     * 
     * @param {string} name - Card name (default: "Tsunami")
     * @param {number} cost - Mana cost (default: 10)
     * @param {number} damage - Base damage (default: 20)
     */
    constructor(name = "Tsunami", cost = 10, damage = 20) {
        // Define the effect object for this card
        const effect = {
            type: 'damage',
            target: 'enemy',
            value: damage,
            description: `Deals ${damage} damage. Guaranteed crit vs Wet targets.`,
            guaranteedCritOnWet: true
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🌊'            // Emoji - wave (same as TidalWave but bigger impact)
        );

        // Tsunami-specific properties
        this.damage = damage;
        this.element = 'water';
        this.isElemental = true;
        this.spellType = 'cataclysm';
        this.castTime = 'ritual';
        
        // Guaranteed crit on wet targets
        this.guaranteedCritOnWet = true;

        console.log(`Tsunami card created: ${this.name} (Damage: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Tsunami card's effect
     * 
     * Unleashes a cataclysmic wave that devastates the enemy.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Tsunami effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate base damage
        let actualDamage = this.damage;
        
        // Check if target is Wet (for guaranteed crit)
        const isWet = gameState.enemy?.activeEffects?.some(e => e.name === 'wet') || false;
        const isCriticalHit = this.guaranteedCritOnWet && isWet;
        
        if (isCriticalHit) {
            actualDamage *= 1.5;
            gameState.isCriticalHit = true;
            console.log(`TSUNAMI! Guaranteed crit on Wet target! 1.5x damage!`);
        } else {
            // Still have 20% base crit chance
            const baseCrit = Math.random() < 0.20;
            if (baseCrit) {
                actualDamage *= 1.5;
                gameState.isCriticalHit = true;
                console.log(`Tsunami Critical Hit! 1.5x damage!`);
            } else {
                gameState.isCriticalHit = false;
            }
        }

        // Apply random variation (±10% for consistency on ultimate)
        const variation = 0.9 + Math.random() * 0.2;
        actualDamage = Math.floor(actualDamage * variation);

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        console.log(`TSUNAMI executed: ${actualDamage} catastrophic damage!`);

        // Return result object
        return {
            success: true,
            message: `TSUNAMI! ${actualDamage} devastating damage!`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [],
            isCriticalHit: isCriticalHit,
            guaranteedCritOnWet: this.guaranteedCritOnWet,
            targetWasWet: isWet,
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
     * Gets the card's display name with Tsunami-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🌊`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `DMG: ${this.damage} | Guaranteed Crit vs Wet`;
    }
}
