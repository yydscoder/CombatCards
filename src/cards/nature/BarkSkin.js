/**
 * BarkSkin Card - Natural Armor
 * 
 * ============================================================================
 * LORE:
 * "The oak stands against the storm not because it is strong, but because
 * it bends. Its bark is not armor - it is adaptation. Learn from the tree,
 * and you too will weather any tempest."
 * - The Forest Elders, Wisdom of Wood
 * 
 * BarkSkin transforms the caster's skin into living wood. The effect is
 * both physical and magical - the bark provides genuine protection while
 * the life force within continues to heal and regenerate.
 * 
 * Druids who master this spell can stand unmoving through barrages that
 * would fell armored knights. The price is mobility - one cannot run
 * while rooted like a tree.
 * ============================================================================
 * 
 * @module cards/nature/BarkSkin
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * BarkSkin Card Class
 * 
 * A defensive card that provides damage reduction.
 * 
 * @extends Card
 */
export class BarkSkin extends Card {
    /**
     * Creates a new BarkSkin card instance
     * 
     * @param {string} name - Card name (default: "BarkSkin")
     * @param {number} cost - Mana cost (default: 4)
     * @param {number} damageReduction - Damage reduction % (default: 0.40)
     */
    constructor(name = "BarkSkin", cost = 4, damageReduction = 0.40) {
        // Define the effect object for this card
        const effect = {
            type: 'damage_reduction',
            target: 'self',
            value: damageReduction,
            description: `Reduce incoming damage by ${damageReduction * 100}% for 3 turns`,
            damageReduction: damageReduction,
            duration: 3
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🪵'            // Emoji - wood
        );

        // BarkSkin-specific properties
        this.damageReduction = damageReduction;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'defensive';
        this.castTime = 'channeled';
        
        // Reduction mechanics
        this.duration = 3;

        console.log(`BarkSkin card created: ${this.name} (${this.damageReduction * 100}% reduction, Cost: ${this.cost})`);
    }

    /**
     * Executes the BarkSkin card's effect
     * 
     * Applies damage reduction buff.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for BarkSkin effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Create bark skin effect
        const barkEffect = {
            name: 'barkskin',
            type: 'damage_reduction',
            damageReduction: this.damageReduction,
            duration: this.duration,
            turnsRemaining: this.duration,
            source: this.name,
            emoji: '🪵'
        };

        // Add effect to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(barkEffect);
        }

        console.log(
            `BarkSkin activated: ${this.damageReduction * 100}% damage reduction ` +
            `for ${this.duration} turns`
        );

        // Return result object
        return {
            success: true,
            message: `Your skin hardens to bark! ${this.damageReduction * 100}% damage reduction`,
            damage: 0,
            healing: 0,
            statusEffects: [barkEffect],
            isCriticalHit: false,
            buffApplied: true,
            damageReduction: this.damageReduction,
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

        // Check if barkskin is already active
        const hasExisting = gameState.activeEffects?.some(
            effect => effect.name === 'barkskin'
        ) || false;

        return hasEnoughMana && isInHand && isNotOnCooldown && !hasExisting;
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🪵`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `-${this.damageReduction * 100}% DMG | ${this.duration} turns`;
    }
}
