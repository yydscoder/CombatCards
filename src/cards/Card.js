/**
 * Base Card Class for Emoji Card Battle
 *
 * This class extends CardBase to provide concrete implementations
 * for common card behaviors. It serves as the parent class for all
 * specific card types (FireCard, WaterCard, etc.).
 *
 * The base class provides:
 * - Core card properties (name, cost, effect)
 * - Standard methods for card usage and validation
 * - Utility functions for card state management
 * - Inheritance from CardBase with upgrade support
 */

// Import the CardBase abstract class and re-export CardTag
import { CardBase, CardType, TargetType, CardRarity, CardTag } from './CardBase.js';

// Re-export CardTag for convenience
export { CardTag };

/**
 * Card Class - Concrete implementation extending CardBase
 *
 * Creates a new Card instance with concrete implementations
 * of abstract methods from CardBase.
 *
 * @extends CardBase
 *
 * @param {string} name - The name of the card (e.g., "Fire Blast")
 * @param {number} cost - The energy cost to play this card
 * @param {Object} effect - The effect object describing what the card does
 * @param {string} emoji - The emoji representation of the card
 */
export class Card extends CardBase {
    constructor(name, cost, effect, emoji) {
        // Call parent constructor
        super(name, cost, effect, emoji);

        // Default card type
        this.cardType = CardType.ATTACK;
        this.rarity = CardRarity.COMMON;
        this.targetType = TargetType.ENEMY;

        // Log card creation
        console.log(`Card created: ${this.name} (ID: ${this.id})`);
    }

    /**
     * Overrides CardBase.canPlay() to support legacy mana system and dynamic costs
     * @param {Object} gameState - The current game state object
     * @returns {boolean} True if the card can be played, false otherwise
     */
    canPlay(gameState) {
        // Get dynamic cost (can be modified by buffs, relics, etc.)
        const currentCost = this.getCost ? this.getCost(gameState) : this.cost;
        
        // Support both energy (new) and mana (legacy) systems
        const currentEnergy = gameState.energy ?? gameState.playerMana ?? 0;
        const hasEnoughEnergy = currentEnergy >= currentCost;
        const isInHand = this.isInHand === true;
        const isNotOnCooldown = !this.cooldown || this.cooldown <= 0;

        return hasEnoughEnergy && isInHand && isNotOnCooldown;
    }

    /**
     * Overrides CardBase.play() for legacy mana compatibility
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    play(gameState, target) {
        // Use parent play() method which handles energy spending
        const result = super.play(gameState, target);

        // Fallback: if energy system didn't work, try legacy mana
        if (!result.success && result.reason === 'no_energy_system') {
            if (gameState.playerMana !== undefined && gameState.playerMana >= this.cost) {
                gameState.playerMana -= this.cost;
                this.lastPlayedTimestamp = Date.now();
                const effectResult = this.executeEffect(gameState, target);
                return {
                    success: true,
                    message: `Card ${this.name} played (legacy mana)`,
                    manaSpent: this.cost,
                    ...effectResult
                };
            }
        }

        return result;
    }

    /**
     * Gets the card's display name with cost information
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        const upgradeSuffix = this.isUpgraded ? '+' : '';
        return `${this.baseName}${upgradeSuffix} [${this.cost} energy]`;
    }

    /**
     * Gets the card's stats as a string for display
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        const parts = [`Cost: ${this.cost}`];
        if (this.cardType) {
            parts.push(this.cardType.toUpperCase());
        }
        if (this.isUpgraded) {
            parts.push(`+${this.upgradeLevel}`);
        }
        return parts.join(' | ');
    }
}