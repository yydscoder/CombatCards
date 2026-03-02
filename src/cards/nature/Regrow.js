/**
 * Regrow Card - Nature's Renewal
 * 
 * ============================================================================
 * LORE:
 * "Cut the branch and two grow in its place. Wound the earth and it heals
 * stronger. Such is the way of nature - not to endure, but to overcome."
 * - The Druid's Circle, Teachings of Renewal
 * 
 * Regrow channels the relentless life force of nature to mend wounds and
 * restore vitality. The spell causes rapid cell regeneration, knitting flesh
 * and bone with visible green tendrils of life energy.
 * 
 * Unlike pure healing magic, Regrow leaves the target fundamentally changed.
 * Their skin takes on a healthy glow, their eyes brighten, and for a brief
 * moment, they understand what it means to be truly alive.
 * ============================================================================
 * 
 * @module cards/nature/Regrow
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Regrow Card Class
 * 
 * A healing card that restores HP and applies a small regen.
 * 
 * @extends Card
 */
export class Regrow extends Card {
    /**
     * Creates a new Regrow card instance
     * 
     * @param {string} name - Card name (default: "Regrow")
     * @param {number} cost - Mana cost (default: 4)
     * @param {number} healAmount - Base healing (default: 12)
     */
    constructor(name = "Regrow", cost = 4, healAmount = 12) {
        // Define the effect object for this card
        const effect = {
            type: 'heal',
            target: 'self',
            value: healAmount,
            description: `Restore ${healAmount} HP + 3 HP/turn for 2 turns`,
            healAmount: healAmount,
            regenAmount: 3,
            regenDuration: 2
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🌱'            // Emoji - seedling
        );

        // Regrow-specific properties
        this.healAmount = healAmount;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'restoration';
        this.castTime = 'channeled';
        
        // Regen properties
        this.regenAmount = 3;
        this.regenDuration = 2;

        console.log(`Regrow card created: ${this.name} (Heal: ${this.healAmount}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Regrow card's effect
     * 
     * Heals the player and applies a regeneration effect.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for Regrow effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Check if player is at full health
        if (gameState.playerHp >= gameState.playerMaxHp) {
            console.warn('Cannot heal: Player already at full health');
            return { 
                success: false, 
                reason: 'full_health',
                message: 'Already at full health!'
            };
        }

        // Calculate healing with variance
        let actualHeal = this.healAmount;
        const variance = 0.85 + Math.random() * 0.30;
        actualHeal = Math.floor(actualHeal * variance);

        // Apply healing
        const newPlayerHp = gameState.playerHp + actualHeal;
        gameState.updatePlayerHp(newPlayerHp);

        // Create regen effect
        const regenEffect = {
            name: 'nature_regen',
            type: 'regen',
            healPerTurn: this.regenAmount,
            duration: this.regenDuration,
            turnsRemaining: this.regenDuration,
            source: this.name,
            emoji: '🌱'
        };

        // Add regen to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(regenEffect);
        }

        console.log(
            `Regrow executed: ${actualHeal} HP restored + ${this.regenAmount} HP/turn ` +
            `for ${this.regenDuration} turns`
        );

        // Return result object
        return {
            success: true,
            message: `Nature's embrace restores ${actualHeal} HP!`,
            damage: 0,
            healing: actualHeal,
            statusEffects: [regenEffect],
            isCriticalHit: false,
            healAmount: actualHeal,
            baseHeal: this.healAmount,
            regenApplied: true,
            regenAmount: this.regenAmount,
            regenDuration: this.regenDuration,
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

        return hasEnoughMana && isInHand && isNotOnCooldown;
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🌱`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `Heal: ${this.healAmount} | Regen: ${this.regenAmount}×${this.regenDuration}`;
    }
}
