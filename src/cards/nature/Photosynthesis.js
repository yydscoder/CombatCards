/**
 * Photosynthesis Card - Solar Conversion
 * 
 * ============================================================================
 * LORE:
 * "The leaf drinks sunlight. The root drinks water. Both become life.
 * This is the oldest magic, older than words, older than fire. It is
 * the magic that feeds the world."
 * - The Green Scholars, Fundamentals of Growth
 * 
 * Photosynthesis accelerates the natural process by which plants convert
 * light into energy. The spell creates a symbiotic link between the caster
 * and nearby plant life, allowing them to share in the energy produced.
 * 
 * The effect is subtle but powerful. Over time, the steady influx of
 * life energy can sustain a mage through the longest battles.
 * ============================================================================
 * 
 * @module cards/nature/Photosynthesis
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Photosynthesis Card Class
 * 
 * A card that provides mana regeneration over time.
 * 
 * @extends Card
 */
export class Photosynthesis extends Card {
    /**
     * Creates a new Photosynthesis card instance
     * 
     * @param {string} name - Card name (default: "Photosynthesis")
     * @param {number} cost - Mana cost (default: 2)
     * @param {number} manaPerTurn - Mana per turn (default: 2)
     */
    constructor(name = "Photosynthesis", cost = 2, manaPerTurn = 2) {
        // Define the effect object for this card
        const effect = {
            type: 'mana_regen',
            target: 'self',
            value: manaPerTurn,
            description: `Gain ${manaPerTurn} mana per turn for 3 turns`,
            manaPerTurn: manaPerTurn,
            duration: 3,
            totalMana: manaPerTurn * 3
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '☀️'            // Emoji - sun
        );

        // Photosynthesis-specific properties
        this.manaPerTurn = manaPerTurn;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'utility';
        this.castTime = 'channeled';
        
        // Mana regen mechanics
        this.duration = 3;
        this.totalMana = manaPerTurn * duration;

        console.log(`Photosynthesis card created: ${this.name} (${this.manaPerTurn} mana/turn, Cost: ${this.cost})`);
    }

    /**
     * Executes the Photosynthesis card's effect
     * 
     * Applies mana regeneration over time.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for Photosynthesis effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Create photosynthesis effect
        const photoEffect = {
            name: 'photosynthesis',
            type: 'mana_regen',
            manaPerTurn: this.manaPerTurn,
            duration: this.duration,
            turnsRemaining: this.duration,
            source: this.name,
            emoji: '☀️',
            totalMana: this.totalMana
        };

        // Add effect to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(photoEffect);
        }

        console.log(
            `Photosynthesis activated: ${this.manaPerTurn} mana/turn for ${this.duration} turns ` +
            `(Total: ${this.totalMana} mana)`
        );

        // Return result object
        return {
            success: true,
            message: `Sunlight fuels your magic! ${this.manaPerTurn} mana/turn for ${this.duration} turns`,
            damage: 0,
            healing: 0,
            manaRegenApplied: true,
            manaPerTurn: this.manaPerTurn,
            duration: this.duration,
            totalMana: this.totalMana,
            statusEffects: [photoEffect],
            isCriticalHit: false,
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

        // Check if photosynthesis is already active
        const hasExisting = gameState.activeEffects?.some(
            effect => effect.name === 'photosynthesis'
        ) || false;

        return hasEnoughMana && isInHand && isNotOnCooldown && !hasExisting;
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ☀️`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `${this.manaPerTurn} mana/turn | ${this.duration} turns | Total: ${this.totalMana}`;
    }
}
