/**
 * HydroBoost Card - Surging Power
 * 
 * ============================================================================
 * LORE:
 * "The tide does not ask permission to rise. The wave does not apologize
 * for its strength. Water simply flows, and where it flows, power follows."
 * - The Tide Callers, Chants of the Surge
 * 
 * HydroBoost channels the relentless force of flowing water to empower
 * the caster's next water spell. The spell creates a swirling aura of
 * droplets that orbit the caster, waiting to be unleashed.
 * 
 * The boost is temporary but significant. Smart mages time their HydroBoost
 * to coincide with their most powerful water spells for maximum effect.
 * ============================================================================
 * 
 * @module cards/water/HydroBoost
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * HydroBoost Card Class
 * 
 * A buff card that empowers the next water spell.
 * 
 * @extends Card
 */
export class HydroBoost extends Card {
    /**
     * Creates a new HydroBoost card instance
     * 
     * @param {string} name - Card name (default: "HydroBoost")
     * @param {number} cost - Mana cost (default: 3)
     * @param {number} damageBonus - Damage bonus percentage (default: 0.50)
     */
    constructor(name = "HydroBoost", cost = 3, damageBonus = 0.50) {
        // Define the effect object for this card
        const effect = {
            type: 'damage_buff',
            target: 'self',
            value: damageBonus,
            description: `Next water spell deals +${damageBonus * 100}% damage`,
            damageBonus: damageBonus,
            duration: 1,
            appliesTo: 'water'
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🔵'            // Emoji - blue circle (water boost)
        );

        // HydroBoost-specific properties
        this.damageBonus = damageBonus;
        this.element = 'water';
        this.isElemental = true;
        this.spellType = 'buff';
        this.castTime = 'instant';
        
        // Buff mechanics
        this.duration = 1; // One turn
        this.appliesTo = 'water';

        console.log(`HydroBoost card created: ${this.name} (Bonus: ${this.damageBonus * 100}%, Cost: ${this.cost})`);
    }

    /**
     * Executes the HydroBoost card's effect
     * 
     * Empowers the caster's next water spell with increased damage.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for HydroBoost effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Create the HydroBoost buff effect
        const hydroBoostEffect = {
            name: 'hydro_boost',
            damageBonus: this.damageBonus,
            duration: this.duration,
            turnsRemaining: this.duration,
            source: this.name,
            type: 'damage_buff',
            appliesTo: this.appliesTo,
            consumed: false
        };

        // Add effect to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(hydroBoostEffect);
        }

        // Store in gameState for card play checking
        gameState.activeHydroBoost = hydroBoostEffect;

        console.log(
            `HydroBoost activated! Next water spell: +${this.damageBonus * 100}% damage!`
        );

        // Update game state
        gameState.lastDamageDealt = 0;
        gameState.isCriticalHit = false;

        // Return result object
        return {
            success: true,
            message: `HydroBoost! Next water spell +${this.damageBonus * 100}% damage!`,
            damage: 0,
            healing: 0,
            statusEffects: [hydroBoostEffect],
            isCriticalHit: false,
            buffApplied: true,
            damageBonus: this.damageBonus,
            duration: this.duration,
            appliesTo: this.appliesTo,
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

        // Check if HydroBoost is already active
        const hasExistingBuff = gameState.activeHydroBoost !== null;

        // Check if player has water cards to buff
        const hasWaterCards = gameState.hand?.some(
            card => card.element === 'water' && card !== this
        );

        return hasEnoughMana && isInHand && isNotOnCooldown && !hasExistingBuff && hasWaterCards;
    }

    /**
     * Gets the card's display name with HydroBoost-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🔵`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `+${this.damageBonus * 100}% Water DMG | Next Spell`;
    }
}
