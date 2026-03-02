/**
 * Ironbark Card - Ancient Protection
 * 
 * ============================================================================
 * LORE:
 * "The ironbark tree has stood for a thousand years. It has weathered
 * storms that leveled forests. It has survived fires that consumed
 * mountains. Its secret is not strength - it is endurance."
 * - The Ancient Grove, Whispers of the Elders
 * 
 * Ironbark transforms the caster's skin into living ironwood - a magical
 * substance that combines the flexibility of wood with the durability of
 * steel. The effect creates visible bark patterns across the skin that
 * shimmer with an inner green light.
 * 
 * The spell is a last resort for druids facing overwhelming odds. While
 * active, they can withstand punishment that would kill any normal being.
 * ============================================================================
 * 
 * @module cards/nature/Ironbark
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Ironbark Card Class
 * 
 * A powerful defensive card that provides a large shield.
 * 
 * @extends Card
 */
export class Ironbark extends Card {
    /**
     * Creates a new Ironbark card instance
     * 
     * @param {string} name - Card name (default: "Ironbark")
     * @param {number} cost - Mana cost (default: 6)
     * @param {number} shieldAmount - Shield amount (default: 20)
     */
    constructor(name = "Ironbark", cost = 6, shieldAmount = 20) {
        // Define the effect object for this card
        const effect = {
            type: 'shield',
            target: 'self',
            value: shieldAmount,
            description: `Gain ${shieldAmount} shield for 4 turns`,
            shieldAmount: shieldAmount,
            duration: 4
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🛡️'            // Emoji - shield
        );

        // Ironbark-specific properties
        this.shieldAmount = shieldAmount;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'defensive';
        this.castTime = 'channeled';
        
        // Shield mechanics
        this.duration = 4;

        console.log(`Ironbark card created: ${this.name} (Shield: ${this.shieldAmount}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Ironbark card's effect
     * 
     * Creates a powerful shield around the caster.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for Ironbark effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Calculate shield amount with small variance
        const actualShield = Math.floor(this.shieldAmount * (0.9 + Math.random() * 0.2));

        // Create ironbark shield effect
        const shieldEffect = {
            name: 'ironbark',
            type: 'shield',
            shieldAmount: actualShield,
            remainingShield: actualShield,
            duration: this.duration,
            turnsRemaining: this.duration,
            source: this.name,
            emoji: '🛡️'
        };

        // Add effect to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(shieldEffect);
        }

        // Store shield in game state
        gameState.currentShield = actualShield;

        console.log(
            `Ironbark activated: ${actualShield} shield for ${this.duration} turns`
        );

        // Return result object
        return {
            success: true,
            message: `Ironbark hardens around you! ${actualShield} shield`,
            damage: 0,
            healing: 0,
            statusEffects: [shieldEffect],
            isCriticalHit: false,
            shieldApplied: true,
            shieldAmount: actualShield,
            duration: this.duration,
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

        // Check if ironbark is already active
        const hasExisting = gameState.activeEffects?.some(
            effect => effect.name === 'ironbark'
        ) || false;

        return hasEnoughMana && isInHand && isNotOnCooldown && !hasExisting;
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🛡️`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `Shield: ${this.shieldAmount} | ${this.duration} turns`;
    }
}
