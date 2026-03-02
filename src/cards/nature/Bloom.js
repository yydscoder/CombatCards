/**
 * Bloom Card - Flourishing Power
 * 
 * ============================================================================
 * LORE:
 * "From the smallest seed grows the mightiest oak. From the tiniest bud
 * bursts the most vibrant flower. Nature's power is not in the ending, but
 * in the becoming."
 * - The Seed Sages, Parables of Growth
 * 
 * Bloom causes magical flowers to sprout from the caster's skin, releasing
 * pollen that enhances their connection to nature. The effect is temporary
 * but potent, amplifying all nature-based magic for a brief window.
 * 
 * The spell takes its name from the visible effect - petals of pure green
 * energy that seem to bloom from the caster's fingertips and fade as the
 * magic dissipates.
 * ============================================================================
 * 
 * @module cards/nature/Bloom
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Bloom Card Class
 * 
 * A buff card that empowers the next nature spell.
 * 
 * @extends Card
 */
export class Bloom extends Card {
    /**
     * Creates a new Bloom card instance
     * 
     * @param {string} name - Card name (default: "Bloom")
     * @param {number} cost - Mana cost (default: 3)
     * @param {number} damageBonus - Damage bonus (default: 0.60)
     */
    constructor(name = "Bloom", cost = 3, damageBonus = 0.60) {
        // Define the effect object for this card
        const effect = {
            type: 'damage_buff',
            target: 'self',
            value: damageBonus,
            description: `Next nature spell deals +${damageBonus * 100}% damage`,
            damageBonus: damageBonus,
            duration: 1,
            appliesTo: 'nature'
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🌸'            // Emoji - cherry blossom
        );

        // Bloom-specific properties
        this.damageBonus = damageBonus;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'buff';
        this.castTime = 'instant';
        
        // Buff mechanics
        this.duration = 1;
        this.appliesTo = 'nature';

        console.log(`Bloom card created: ${this.name} (Bonus: ${this.damageBonus * 100}%, Cost: ${this.cost})`);
    }

    /**
     * Executes the Bloom card's effect
     * 
     * Empowers the caster's next nature spell.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for Bloom effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Create the Bloom buff effect
        const bloomEffect = {
            name: 'bloom',
            damageBonus: this.damageBonus,
            duration: this.duration,
            turnsRemaining: this.duration,
            source: this.name,
            type: 'damage_buff',
            appliesTo: this.appliesTo,
            consumed: false,
            emoji: '🌸'
        };

        // Add effect to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(bloomEffect);
        }

        // Store in gameState for card play checking
        gameState.activeBloom = bloomEffect;

        console.log(`Bloom activated! Next nature spell: +${this.damageBonus * 100}% damage!`);

        // Return result object
        return {
            success: true,
            message: `Nature's flowers bloom! Next nature spell +${this.damageBonus * 100}% damage!`,
            damage: 0,
            healing: 0,
            statusEffects: [bloomEffect],
            isCriticalHit: false,
            buffApplied: true,
            damageBonus: this.damageBonus,
            duration: this.duration,
            appliesTo: this.appliesTo,
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

        // Check if Bloom is already active
        const hasExistingBuff = gameState.activeBloom !== null;

        // Check if player has nature cards to buff
        const hasNatureCards = gameState.hand?.some(
            card => card.element === 'nature' && card !== this
        );

        return hasEnoughMana && isInHand && isNotOnCooldown && !hasExistingBuff && hasNatureCards;
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🌸`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `+${this.damageBonus * 100}% Nature DMG | Next Spell`;
    }
}
