/**
 * Regen Card - Renewing Spring
 * 
 * ============================================================================
 * LORE:
 * "The spring never stops flowing. It may slow, it may speed, but the
 * water always comes. Like the spring, healing is not a moment but a
 * process - continuous, patient, inevitable."
 * - The Healing Circle, Meditations on Renewal
 * 
 * Regen channels the eternal flow of healing waters to create a lasting
 * restoration effect. Rather than a burst of healing, the spell creates
 * a gentle cascade that continues to mend wounds over time.
 * 
 * The spell is favored by patient mages who prefer steady recovery over
 * dramatic saves. A mage with Regen active can outlast almost any opponent.
 * ============================================================================
 * 
 * @module cards/water/Regen
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Regen Card Class
 * 
 * A healing over time card that restores HP each turn.
 * 
 * @extends Card
 */
export class Regen extends Card {
    /**
     * Creates a new Regen card instance
     * 
     * @param {string} name - Card name (default: "Regen")
     * @param {number} cost - Mana cost (default: 4)
     * @param {number} healPerTurn - Healing per turn (default: 4)
     */
    constructor(name = "Regen", cost = 4, healPerTurn = 4) {
        // Define the effect object for this card
        const effect = {
            type: 'heal_over_time',
            target: 'self',
            value: healPerTurn,
            description: `Heal ${healPerTurn} HP per turn for 4 turns`,
            healPerTurn: healPerTurn,
            duration: 4,
            totalHeal: healPerTurn * 4
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '💟'            // Emoji - heart with ribbon (healing/recovery)
        );

        // Regen-specific properties
        this.healPerTurn = healPerTurn;
        this.element = 'water';
        this.isElemental = true;
        this.spellType = 'restoration';
        this.castTime = 'channeled';
        
        // Healing over time mechanics
        this.duration = 4;
        this.totalHeal = healPerTurn * 4;

        console.log(`Regen card created: ${this.name} (${this.healPerTurn}/turn, Cost: ${this.cost})`);
    }

    /**
     * Executes the Regen card's effect
     * 
     * Applies a healing over time effect to the player.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for Regen effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Create regeneration effect
        const regenEffect = {
            name: 'regen',
            healPerTurn: this.healPerTurn,
            duration: this.duration,
            turnsRemaining: this.duration,
            source: this.name,
            type: 'heal_over_time',
            totalHeal: this.totalHeal
        };

        // Add effect to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(regenEffect);
        }

        // Apply initial small heal
        const initialHeal = Math.floor(this.healPerTurn * 0.5);
        if (initialHeal > 0 && gameState.playerHp < gameState.playerMaxHp) {
            const newPlayerHp = gameState.playerHp + initialHeal;
            gameState.updatePlayerHp(newPlayerHp);
        }

        console.log(
            `Regen applied: ${this.healPerTurn} HP/turn for ${this.duration} turns ` +
            `(Total: ${this.totalHeal} HP, Initial: ${initialHeal})`
        );

        // Return result object
        return {
            success: true,
            message: `Renewing waters flow! ${this.healPerTurn} HP/turn for ${this.duration} turns`,
            damage: 0,
            healing: initialHeal,
            statusEffects: [regenEffect],
            isCriticalHit: false,
            regenApplied: true,
            healPerTurn: this.healPerTurn,
            duration: this.duration,
            totalHeal: this.totalHeal,
            initialHeal: initialHeal,
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

        // Block if regen is already active (no stacking)
        const hasExistingRegen = gameState.activeEffects?.some(
            effect => effect.name === 'regen'
        ) || false;

        return hasEnoughMana && isInHand && isNotOnCooldown && !hasExistingRegen;
    }

    /**
     * Gets the card's display name with Regen-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 💟`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with regen info
     */
    getStatsString() {
        return `${this.healPerTurn}/turn | ${this.duration} turns | Total: ${this.totalHeal}`;
    }
}
