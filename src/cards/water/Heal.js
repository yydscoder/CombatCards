/**
 * Heal Card - Restorative Waters
 * 
 * ============================================================================
 * LORE:
 * "Water gives life. It quenches thirst, nourishes crops, and washes away
 * pain. In the hands of a skilled healer, water becomes a conduit for
 * restoration itself."
 * - The Healing Arts, Chapter of Tides
 * 
 * Heal is the quintessential restoration spell, drawing upon water's
 * life-giving properties to mend wounds and restore vitality. The spell
 * creates a gentle cascade of shimmering water that flows over the target,
 * knitting flesh and bone with each touch.
 * 
 * While not as dramatic as offensive magic, healing is often the difference
 * between victory and defeat. A mage who knows when to heal rather than
 * attack demonstrates true wisdom in the art of combat.
 * ============================================================================
 * 
 * @module cards/water/Heal
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Heal Card Class
 * 
 * A basic healing card that restores HP to the player.
 * Has a small chance for a critical heal.
 * 
 * @extends Card
 */
export class Heal extends Card {
    /**
     * Creates a new Heal card instance
     * 
     * @param {string} name - Card name (default: "Heal")
     * @param {number} cost - Mana cost (default: 3)
     * @param {number} healAmount - Base healing amount (default: 10)
     */
    constructor(name = "Heal", cost = 3, healAmount = 10) {
        // Define the effect object for this card
        const effect = {
            type: 'heal',
            target: 'self',
            value: healAmount,
            description: `Restores ${healAmount} HP. 10% chance for critical heal (1.5x)`,
            healAmount: healAmount,
            critChance: 0.10,
            critMultiplier: 1.5
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '💚'            // Emoji - green heart (healing)
        );

        // Heal-specific properties
        this.healAmount = healAmount;
        this.element = 'water';
        this.isElemental = true;
        this.spellType = 'restoration';
        this.castTime = 'channeled';
        
        // Critical heal properties
        this.critChance = 0.10;
        this.critMultiplier = 1.5;

        console.log(`Heal card created: ${this.name} (Heal: ${this.healAmount}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Heal card's effect
     * 
     * Channels restorative water magic to heal the player's wounds.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for Heal effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Check if player is already at full health
        if (gameState.playerHp >= gameState.playerMaxHp) {
            console.warn('Cannot heal: Player already at full health');
            return { 
                success: false, 
                reason: 'full_health',
                message: 'Already at full health!'
            };
        }

        // Calculate healing amount
        let actualHeal = this.healAmount;
        
        // Check for critical heal
        const isCriticalHeal = Math.random() < this.critChance;
        
        if (isCriticalHeal) {
            actualHeal = Math.floor(actualHeal * this.critMultiplier);
            console.log(`Critical Heal! Multiplier: ${this.critMultiplier}x`);
        }

        // Apply random variation (±10% for healing)
        const variation = 0.9 + Math.random() * 0.2;
        actualHeal = Math.floor(actualHeal * variation);

        // Apply healing to the player
        const newPlayerHp = gameState.playerHp + actualHeal;
        gameState.updatePlayerHp(newPlayerHp);

        console.log(`Heal executed: ${this.name} restored ${actualHeal} HP${isCriticalHeal ? ' (CRIT!)' : ''}`);

        // Return result object
        return {
            success: true,
            message: `Healing waters restored ${actualHeal} HP${isCriticalHeal ? ' (Critical!)' : ''}`,
            damage: 0,
            healing: actualHeal,
            statusEffects: [],
            isCriticalHeal: isCriticalHeal,
            healAmount: actualHeal,
            baseHeal: this.healAmount,
            spellType: this.spellType
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * Heal can only be played if the player is not at full health.
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

        // Can only heal if not at full health
        const needsHealing = gameState.playerHp < gameState.playerMaxHp;

        return hasEnoughMana && isInHand && isNotOnCooldown && needsHealing;
    }

    /**
     * Gets the card's display name with Heal-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 💚`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with healing info
     */
    getStatsString() {
        return `Heal: ${this.healAmount} | Crit: ${this.critChance * 100}%`;
    }
}
