/**
 * Lifebloom Card - Flowering Renewal
 * 
 * ============================================================================
 * LORE:
 * "The flower blooms, releases its seeds, and dies. But from those seeds
 * rise a hundred new flowers. Such is the cycle - death feeding life,
 * life feeding death."
 * - The Bloom Circle, Hymns of the Cycle
 * 
 * Lifebloom plants a magical flower on the target's skin that slowly opens
 * over time. With each petal that unfurls, healing energy is released into
 * the target's body. When the flower fully blooms, it releases a final
 * burst of restorative magic before withering away.
 * 
 * The spell is considered beautiful even by those who do not understand
 * magic. Witnesses report seeing ghostly petals floating around the target,
 * smelling faintly of spring flowers.
 * ============================================================================
 * 
 * @module cards/nature/Lifebloom
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Lifebloom Card Class
 * 
 * A healing over time card with a large final heal.
 * 
 * @extends Card
 */
export class Lifebloom extends Card {
    /**
     * Creates a new Lifebloom card instance
     * 
     * @param {string} name - Card name (default: "Lifebloom")
     * @param {number} cost - Mana cost (default: 5)
     * @param {number} healPerTick - Healing per tick (default: 4)
     */
    constructor(name = "Lifebloom", cost = 5, healPerTick = 4) {
        // Define the effect object for this card
        const effect = {
            type: 'heal_over_time',
            target: 'self',
            value: healPerTick,
            description: `Heal ${healPerTick} HP/turn for 3 turns, then ${healPerTick * 3} HP when it blooms`,
            healPerTick: healPerTick,
            duration: 3,
            bloomHeal: healPerTick * 3
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🌺'            // Emoji - hibiscus flower
        );

        // Lifebloom-specific properties
        this.healPerTick = healPerTick;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'restoration';
        this.castTime = 'channeled';
        
        // Healing mechanics
        this.duration = 3;
        this.bloomHeal = healPerTick * 3;
        this.totalHeal = (healPerTick * duration) + this.bloomHeal;

        console.log(`Lifebloom card created: ${this.name} (${this.healPerTick}/tick + ${this.bloomHeal} bloom)`);
    }

    /**
     * Executes the Lifebloom card's effect
     * 
     * Applies a healing over time effect with final bloom heal.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for Lifebloom effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Check if at full health
        if (gameState.playerHp >= gameState.playerMaxHp) {
            console.warn('Cannot heal: Player already at full health');
            return { 
                success: false, 
                reason: 'full_health',
                message: 'Already at full health!'
            };
        }

        // Create lifebloom effect
        const bloomEffect = {
            name: 'lifebloom',
            type: 'heal_over_time',
            healPerTick: this.healPerTick,
            duration: this.duration,
            turnsRemaining: this.duration,
            source: this.name,
            bloomHeal: this.bloomHeal,
            emoji: '🌺',
            totalHeal: this.totalHeal
        };

        // Add effect to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(bloomEffect);
        }

        // Apply initial small heal
        const initialHeal = Math.floor(this.healPerTick * 0.5);
        if (initialHeal > 0) {
            const newPlayerHp = gameState.playerHp + initialHeal;
            gameState.updatePlayerHp(newPlayerHp);
        }

        console.log(
            `Lifebloom planted: ${this.healPerTick} HP/turn for ${this.duration} turns, ` +
            `then ${this.bloomHeal} HP bloom (Total: ${this.totalHeal})`
        );

        // Return result object
        return {
            success: true,
            message: `Lifebloom flowers bloom on you! ${this.healPerTick} HP/turn + ${this.bloomHeal} final`,
            damage: 0,
            healing: initialHeal,
            statusEffects: [bloomEffect],
            isCriticalHit: false,
            healApplied: true,
            healPerTick: this.healPerTick,
            duration: this.duration,
            bloomHeal: this.bloomHeal,
            totalHeal: this.totalHeal,
            initialHeal: initialHeal,
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
        const needsHealing = gameState.playerHp < gameState.playerMaxHp;

        // Check if lifebloom is already active
        const hasExisting = gameState.activeEffects?.some(
            effect => effect.name === 'lifebloom'
        ) || false;

        return hasEnoughMana && isInHand && isNotOnCooldown && needsHealing && !hasExisting;
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🌺`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `${this.healPerTick}/turn × ${this.duration} | Bloom: ${this.bloomHeal}`;
    }
}
