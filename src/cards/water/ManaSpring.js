/**
 * ManaSpring Card - Mystical Recovery
 * 
 * ============================================================================
 * LORE:
 * "Magic flows like water. Where the currents are strong, mana pools
 * deep. The wise mage learns to drink from these springs, to let the
 * arcane waters refresh their spirit."
 * - The Arcane Hydrologist, Treatise on Ley Lines
 * 
 * ManaSpring taps into the ambient magical energy that flows through
 * the world. The spell creates a conduit between the caster and these
 * invisible rivers, allowing mana to flow freely into their reserves.
 * 
 * The spell is invaluable for prolonged battles where mana management
 * becomes critical. A mage with access to ManaSpring can outlast almost
 * any opponent through sheer endurance.
 * ============================================================================
 * 
 * @module cards/water/ManaSpring
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * ManaSpring Card Class
 * 
 * A utility card that restores mana to the player.
 * 
 * @extends Card
 */
export class ManaSpring extends Card {
    /**
     * Creates a new ManaSpring card instance
     * 
     * @param {string} name - Card name (default: "ManaSpring")
     * @param {number} cost - Mana cost (default: 2)
     * @param {number} manaRestore - Mana to restore (default: 5)
     */
    constructor(name = "ManaSpring", cost = 2, manaRestore = 5) {
        // Define the effect object for this card
        const effect = {
            type: 'mana_restore',
            target: 'self',
            value: manaRestore,
            description: `Restore ${manaRestore} mana. Net gain: ${manaRestore - cost} mana`,
            manaRestore: manaRestore
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '💙'            // Emoji - blue heart (mana)
        );

        // ManaSpring-specific properties
        this.manaRestore = manaRestore;
        this.element = 'water';
        this.isElemental = true;
        this.spellType = 'utility';
        this.castTime = 'channeled';
        
        // Net mana gain (mana restored - cost to cast)
        this.netGain = manaRestore - cost;

        console.log(`ManaSpring card created: ${this.name} (Restore: ${this.manaRestore}, Net: +${this.netGain}, Cost: ${this.cost})`);
    }

    /**
     * Executes the ManaSpring card's effect
     * 
     * Restores mana to the player.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for ManaSpring effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Calculate mana restore amount with small variance
        const variance = 0.8 + Math.random() * 0.4;
        const actualRestore = Math.floor(this.manaRestore * variance);

        // Restore mana (capped at max)
        const newMana = Math.min(gameState.playerMaxMana, gameState.playerMana + actualRestore);
        const actualGain = newMana - gameState.playerMana;
        gameState.updatePlayerMana(newMana);

        console.log(
            `ManaSpring activated: Restored ${actualRestore} mana ` +
            `(Actual gain: ${actualGain}, Now: ${gameState.playerMana}/${gameState.playerMaxMana})`
        );

        // Return result object
        return {
            success: true,
            message: `ManaSpring restores ${actualRestore} mana!`,
            damage: 0,
            healing: 0,
            manaRestored: actualRestore,
            actualGain: actualGain,
            newMana: gameState.playerMana,
            maxMana: gameState.playerMaxMana,
            statusEffects: [],
            isCriticalHit: false,
            spellType: this.spellType
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * ManaSpring can only be played if player is not at full mana.
     * 
     * @param {Object} gameState - The current game state object
     * @returns {boolean} True if the card can be played, false otherwise
     */
    canPlay(gameState) {
        const hasEnoughMana = gameState.playerMana >= this.cost;
        const isInHand = this.isInHand;
        const isNotOnCooldown = !this.cooldown || this.cooldown <= 0;
        
        // Can only restore mana if not at full
        const needsMana = gameState.playerMana < gameState.playerMaxMana;

        return hasEnoughMana && isInHand && isNotOnCooldown && needsMana;
    }

    /**
     * Gets the card's display name with ManaSpring-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 💙`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `Restore: ${this.manaRestore} | Net: +${this.netGain}`;
    }
}
