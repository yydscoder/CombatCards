/**
 * FlameStrike Card - Empowered Assault
 * 
 * ============================================================================
 * LORE:
 * "The blade caught the light - no, not light. Fire. Pure, liquid fire
 * that flowed like water and burned like the sun. The strike that followed
 * was not a strike at all. It was judgment."
 * - The Flame Knight's Oath
 * 
 * FlameStrike is a buff spell that infuses the caster's next attack with
 * concentrated fire essence. The spell was developed by the Flame Knights
 * of the Solar Order, warrior-mages who blended swordplay with pyromancy.
 * 
 * The enchantment can be applied to any weapon - steel, stone, or even
 * bare fists. The fire does not consume the weapon; instead, it exists
 * in a state of magical suspension, releasing all its energy on impact.
 * 
 * Advanced practitioners can maintain the flame strike enchantment for
 * extended periods, their weapons perpetually wreathed in harmless-looking
 * flames that become deadly only when they touch flesh.
 * ============================================================================
 * 
 * @module cards/FlameStrike
 */

// Import the base Card class
import { Card } from './Card.js';

/**
 * FlameStrike Card Class
 * 
 * A buff card that empowers the next fire card played this turn.
 * The next fire spell deals increased damage and has guaranteed
 * critical hit chance.
 * 
 * @extends Card
 */
export class FlameStrike extends Card {
    /**
     * Creates a new FlameStrike card instance
     * 
     * @param {string} name - Card name (default: "FlameStrike")
     * @param {number} cost - Mana cost (default: 3)
     * @param {number} damageBonus - Flat damage bonus (default: 5)
     */
    constructor(name = "FlameStrike", cost = 3, damageBonus = 5) {
        // Define the effect object for this card
        const effect = {
            type: 'next_card_buff',
            target: 'self',
            value: damageBonus,
            description: `Next fire card deals +${damageBonus} damage and has guaranteed crit`,
            damageBonus: damageBonus,
            guaranteedCrit: true,
            duration: 1, // One turn
            appliesTo: 'fire'
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '⚔️'            // Emoji - crossed swords (weapon buff)
        );

        // FlameStrike-specific properties
        this.damageBonus = damageBonus;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'buff';
        this.castTime = 'instant';
        
        // Buff mechanics
        this.guaranteedCrit = true;
        this.duration = 1; // Expires after one turn
        this.appliesTo = 'fire';

        console.log(`FlameStrike card created: ${this.name} (Bonus: ${this.damageBonus}, Cost: ${this.cost})`);
    }

    /**
     * Executes the FlameStrike card's effect
     * 
     * Empowers the caster's next fire spell with enhanced damage
     * and guaranteed critical strike.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for FlameStrike effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Create the FlameStrike buff effect
        const flameStrikeEffect = {
            name: 'flame_strike_buff',
            damageBonus: this.damageBonus,
            guaranteedCrit: this.guaranteedCrit,
            duration: this.duration,
            turnsRemaining: this.duration,
            source: this.name,
            type: 'next_card_buff',
            appliesTo: this.appliesTo,
            consumed: false
        };

        // Add effect to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(flameStrikeEffect);
        }

        // Store in gameState for card play checking
        gameState.activeFlameStrike = flameStrikeEffect;

        console.log(
            `FlameStrike activated! Next fire card: +${this.damageBonus} damage, ` +
            `guaranteed critical hit!`
        );

        // Update game state
        gameState.lastDamageDealt = 0;
        gameState.isCriticalHit = false;

        // Return result object
        return {
            success: true,
            message: `FlameStrike! Next fire card empowered: +${this.damageBonus} DMG, guaranteed crit!`,
            damage: 0,
            healing: 0,
            statusEffects: [flameStrikeEffect],
            isCriticalHit: false,
            buffApplied: true,
            damageBonus: this.damageBonus,
            guaranteedCrit: this.guaranteedCrit,
            duration: this.duration,
            appliesTo: this.appliesTo,
            spellType: this.spellType
        };
    }

    /**
     * Consumes the FlameStrike buff when a fire card is played
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} card - The fire card being played
     * @returns {Object} The consumed buff effect or null
     */
    consumeBuff(gameState, card) {
        // Check if FlameStrike is active
        if (!gameState.activeFlameStrike) {
            return null;
        }

        // Check if the card is a fire card
        if (card.element !== 'fire') {
            return null;
        }

        // Consume the buff
        const buff = gameState.activeFlameStrike;
        buff.consumed = true;
        gameState.activeFlameStrike = null;

        // Remove from active effects
        if (gameState.activeEffects) {
            const index = gameState.activeEffects.findIndex(
                effect => effect.name === 'flame_strike_buff'
            );
            if (index !== -1) {
                gameState.activeEffects.splice(index, 1);
            }
        }

        console.log(`FlameStrike consumed! +${buff.damageBonus} damage applied.`);

        return buff;
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * FlameStrike is only useful if the player has fire cards to buff.
     * 
     * @param {Object} gameState - The current game state object
     * @returns {boolean} True if the card can be played, false otherwise
     */
    canPlay(gameState) {
        // Check if the player has enough mana
        const hasEnoughMana = gameState.playerMana >= this.cost;

        // Check if the card is in hand
        const isInHand = this.isInHand;

        // Check if the card is not on cooldown
        const isNotOnCooldown = !this.cooldown || this.cooldown <= 0;

        // Check if FlameStrike buff is already active (don't stack)
        const hasExistingBuff = gameState.activeFlameStrike !== null;

        // Check if player has fire cards in hand to buff
        const hasFireCards = gameState.hand?.some(
            card => card.element === 'fire' && card !== this
        );

        // Can play if no existing buff and has fire cards
        const canBuff = !hasExistingBuff && hasFireCards;

        return hasEnoughMana && isInHand && isNotOnCooldown && canBuff;
    }

    /**
     * Gets the card's display name with FlameStrike-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ⚔️`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with buff info
     */
    getStatsString() {
        return `+${this.damageBonus} DMG | Guaranteed Crit | Next Fire`;
    }
}
