/**
 * Thorns Card - Reflective Defense
 * 
 * ============================================================================
 * LORE:
 * "The rose does not ask to be admired. The cactus does not apologize
 * for its spines. Nature protects itself, and those who would harm it
 * learn this lesson in blood."
 * - The Garden Wardens, Principles of Defense
 * 
 * Thorns creates a living barrier of sharp spines around the caster.
 * Any attack that penetrates this barrier triggers the thorns to lash
 * out, drawing blood and planting seeds that will grow into further pain.
 * 
 * The spell is a favorite among druids who prefer to let their enemies
 * defeat themselves. A patient mage can stand unmoving while their foes
 * impale themselves on an invisible hedge.
 * ============================================================================
 * 
 * @module cards/nature/Thorns
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Thorns Card Class
 * 
 * A defensive card that reflects damage to attackers.
 * 
 * @extends Card
 */
export class Thorns extends Card {
    /**
     * Creates a new Thorns card instance
     * 
     * @param {string} name - Card name (default: "Thorns")
     * @param {number} cost - Mana cost (default: 4)
     * @param {number} reflectDamage - Damage reflected (default: 4)
     */
    constructor(name = "Thorns", cost = 4, reflectDamage = 4) {
        // Define the effect object for this card
        const effect = {
            type: 'reflection',
            target: 'self',
            value: reflectDamage,
            description: `Reflect ${reflectDamage} damage to attackers for 3 turns`,
            reflectDamage: reflectDamage,
            duration: 3
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🌵'            // Emoji - cactus
        );

        // Thorns-specific properties
        this.reflectDamage = reflectDamage;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'defensive';
        this.castTime = 'instant';
        
        // Reflection mechanics
        this.duration = 3;

        console.log(`Thorns card created: ${this.name} (Reflect: ${this.reflectDamage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Thorns card's effect
     * 
     * Creates a thorny barrier that reflects damage.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for Thorns effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Create thorns effect
        const thornsEffect = {
            name: 'thorns',
            type: 'reflection',
            reflectDamage: this.reflectDamage,
            duration: this.duration,
            turnsRemaining: this.duration,
            source: this.name,
            emoji: '🌵'
        };

        // Add effect to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(thornsEffect);
        }

        console.log(
            `Thorns activated: ${this.reflectDamage} reflect damage for ${this.duration} turns`
        );

        // Return result object
        return {
            success: true,
            message: `Thorny barrier surrounds you! ${this.reflectDamage} reflect damage`,
            damage: 0,
            healing: 0,
            statusEffects: [thornsEffect],
            isCriticalHit: false,
            thornsApplied: true,
            reflectDamage: this.reflectDamage,
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

        // Check if thorns is already active
        const hasExistingThorns = gameState.activeEffects?.some(
            effect => effect.name === 'thorns'
        ) || false;

        return hasEnoughMana && isInHand && isNotOnCooldown && !hasExistingThorns;
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🌵`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `Reflect: ${this.reflectDamage} | ${this.duration} turns`;
    }
}
