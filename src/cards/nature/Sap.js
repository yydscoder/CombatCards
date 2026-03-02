/**
 * Sap Card - Life Drain
 * 
 * ============================================================================
 * LORE:
 * "The parasite does not hate its host. It simply takes what it needs
 * to survive. The tree does not hate the vine that climbs it. It simply
 * endures. Such is the way of life - always taking, always giving."
 * - The Circle of Balance, Meditations on Exchange
 * 
 * Sap creates a mystical connection between the caster and target,
 * draining life force from one and transferring it to the other. The
 * effect is immediate and visceral - visible tendrils of green energy
 * flow from victim to caster.
 * 
 * The spell is controversial among druids. Some see it as a natural
 * expression of the food chain. Others view it as a perversion of
 * nature's balance.
 * ============================================================================
 * 
 * @module cards/nature/Sap
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Sap Card Class
 * 
 * A card that damages enemy and heals the caster.
 * 
 * @extends Card
 */
export class Sap extends Card {
    /**
     * Creates a new Sap card instance
     * 
     * @param {string} name - Card name (default: "Sap")
     * @param {number} cost - Mana cost (default: 4)
     * @param {number} damage - Damage/heal amount (default: 8)
     */
    constructor(name = "Sap", cost = 4, damage = 8) {
        // Define the effect object for this card
        const effect = {
            type: 'drain',
            target: 'enemy',
            value: damage,
            description: `Deal ${damage} damage and heal yourself for the same amount`,
            drainAmount: damage,
            drainType: 'life'
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🩸'            // Emoji - drop of blood
        );

        // Sap-specific properties
        this.damage = damage;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'drain';
        this.castTime = 'channeled';
        
        // Drain mechanics
        this.drainAmount = damage;
        this.drainType = 'life';

        console.log(`Sap card created: ${this.name} (Drain: ${this.drainAmount}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Sap card's effect
     * 
     * Drains life from the enemy and heals the caster.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Sap effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate damage with variance
        let actualDamage = this.drainAmount;
        const variance = 0.85 + Math.random() * 0.30;
        actualDamage = Math.floor(actualDamage * variance);

        // Apply damage to enemy
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);

        // Heal the player for the same amount (capped at max HP)
        let actualHeal = actualDamage;
        const maxHeal = gameState.playerMaxHp - gameState.playerHp;
        if (actualHeal > maxHeal) {
            actualHeal = maxHeal;
        }
        
        if (actualHeal > 0) {
            const newPlayerHp = gameState.playerHp + actualHeal;
            gameState.updatePlayerHp(newPlayerHp);
        }

        gameState.lastDamageDealt = actualDamage;

        console.log(
            `Sap executed: ${actualDamage} damage to enemy, ${actualHeal} HP healed to player`
        );

        // Return result object
        return {
            success: true,
            message: `Life force drained! ${actualDamage} damage, ${actualHeal} HP healed`,
            damage: actualDamage,
            healing: actualHeal,
            statusEffects: [],
            isCriticalHit: false,
            drainAmount: actualDamage,
            healAmount: actualHeal,
            drainType: this.drainType,
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
        return `${this.name} [${this.cost} mana] 🩸`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `Drain: ${this.drainAmount} | Heal: Same`;
    }
}
