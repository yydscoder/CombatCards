/**
 * Inferno Card - Ultimate Fire Destruction
 * 
 * ============================================================================
 * LORE:
 * "When the world burns, only ashes remain. Such is the price of inferno."
 * - The Last Words of Magus Ignis
 * 
 * Inferno represents the pinnacle of fire magic - a cataclysmic spell that
 * calls down the fury of the elemental plane of fire itself. Ancient texts
 * describe it as the weapon that ended the War of Mages, reducing entire
 * armies to cinder and bone.
 * 
 * The spell requires immense mana and precise channeling. Those who cast
 * it recklessly risk being consumed by the very flames they summon.
 * Only the most powerful fire mages dare wield this devastating magic.
 * ============================================================================
 * 
 * @module cards/Inferno
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Inferno Card Class
 * 
 * A high-cost, high-damage spell that unleashes devastating fire damage.
 * Has increased critical hit chance and ignores a portion of enemy defense.
 * 
 * @extends Card
 */
export class Inferno extends Card {
    /**
     * Creates a new Inferno card instance
     * 
     * @param {string} name - Card name (default: "Inferno")
     * @param {number} cost - Mana cost (default: 9)
     * @param {number} damage - Base damage (default: 18)
     */
    constructor(name = "Inferno", cost = 9, damage = 18) {
        // Define the effect object for this card
        const effect = {
            type: 'damage',
            target: 'enemy',
            value: damage,
            description: `Deals ${damage} damage. 25% crit chance. Ignores 50% defense.`,
            criticalChance: 0.25,
            criticalMultiplier: 2.0,
            defensePenetration: 0.50
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            'ðŸŒ‹'            // Emoji - volcano/eruption
        );

        // Inferno-specific properties
        this.damage = damage;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'cataclysm';
        this.castTime = 'channeled';
        
        // Enhanced critical strike properties
        this.criticalChance = 0.25;
        this.criticalMultiplier = 2.0;
        
        // Defense penetration
        this.defensePenetration = 0.50;

        console.log(`Inferno card created: ${this.name} (Damage: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Inferno card's effect
     * 
     * Unleashes a devastating inferno that engulfs the enemy in 
     * unstoppable flames, ignoring half their defense.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Inferno effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate base damage
        let actualDamage = this.damage;
        
        // Check for critical hit (25% base chance for inferno)
        const isCriticalHit = Math.random() < this.criticalChance;
        
        if (isCriticalHit) {
            actualDamage *= this.criticalMultiplier;
            gameState.isCriticalHit = true;
            console.log(`INFERNO CRITICAL HIT! Damage multiplier: ${this.criticalMultiplier}x`);
        } else {
            gameState.isCriticalHit = false;
        }

        // Apply defense penetration - inferno ignores 50% of enemy defense
        let defenseValue = gameState.enemy?.defense || 0;
        let effectiveDefense = defenseValue * (1 - this.defensePenetration);
        
        // Calculate damage reduction from remaining defense (max 50% reduction)
        let defenseReduction = Math.min(effectiveDefense / 100, 0.5);
        actualDamage = actualDamage * (1 - defenseReduction);
        
        // Apply random variation (Â±15% for more consistent ultimate)
        const variation = 0.85 + Math.random() * 0.30;
        actualDamage = Math.floor(actualDamage * variation);

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        console.log(`INFERNO executed: ${this.name} dealt ${actualDamage} damage (ignored ${this.defensePenetration * 100}% defense)`);

        // Return result object
        return {
            success: true,
            message: `INFERNO consumed the enemy for ${actualDamage} damage!`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [],
            isCriticalHit: isCriticalHit,
            defensePenetrated: defenseValue * this.defensePenetration,
            spellType: this.spellType
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * Inferno requires more consideration due to its high cost.
     * 
     * @param {Object} gameState - The current game state object
     * @returns {boolean} True if the card can be played, false otherwise
     */
    canPlay(gameState) {
        // Check if the player has enough mana
        const hasEnoughMana = gameState.playerMana >= this.cost;

        // Check if the card is in hand
        const isInHand = this.isInHand;

        // Check if the card is not on cooldown (if applicable)
        const isNotOnCooldown = !this.cooldown || this.cooldown <= 0;

        // Inferno can only be played if enemy HP is above a threshold
        // (can't waste ultimate on already dying enemy)
        const enemyHasSignificantHp = gameState.enemyHp > 5;

        return hasEnoughMana && isInHand && isNotOnCooldown && enemyHasSignificantHp;
    }

    /**
     * Gets the card's display name with inferno-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ðŸŒ‹`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with crit/penetration info
     */
    getStatsString() {
        return `DMG: ${this.damage} | Crit: ${this.criticalChance * 100}% | Pen: ${this.defensePenetration * 100}%`;
    }
}
