/**
 * Purify Card - Cleansing Waters
 * 
 * ============================================================================
 * LORE:
 * "Water washes away more than dirt. It cleanses the spirit, purifies
 * the soul, and breaks the chains of corruption. In flowing water, find
 * freedom from all that binds you."
 * - The Cleansing Rites, Liturgy of the Pure
 * 
 * Purify channels the cleansing properties of sacred water to remove
 * harmful effects from the caster. The spell creates a shimmering aura
 * that dissolves poisons, curses, and debuffs on contact.
 * 
 * The spell is essential for prolonged battles where enemies rely on
 * attrition through status effects. A purified mage can fight without
 * fear of lingering enchantments.
 * ============================================================================
 * 
 * @module cards/water/Purify
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Purify Card Class
 * 
 * A utility card that removes debuffs from the player
 * and provides minor healing.
 * 
 * @extends Card
 */
export class Purify extends Card {
    /**
     * Creates a new Purify card instance
     * 
     * @param {string} name - Card name (default: "Purify")
     * @param {number} cost - Mana cost (default: 3)
     * @param {number} healAmount - Minor healing (default: 5)
     */
    constructor(name = "Purify", cost = 3, healAmount = 5) {
        // Define the effect object for this card
        const effect = {
            type: 'cleanse',
            target: 'self',
            value: healAmount,
            description: `Remove all debuffs and heal ${healAmount} HP`,
            healAmount: healAmount,
            cleansesAll: true
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '✨'            // Emoji - sparkles (cleansing)
        );

        // Purify-specific properties
        this.healAmount = healAmount;
        this.element = 'water';
        this.isElemental = true;
        this.spellType = 'restoration';
        this.castTime = 'channeled';
        
        // Cleanse mechanics
        this.cleansesAll = true;

        console.log(`Purify card created: ${this.name} (Heal: ${this.healAmount}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Purify card's effect
     * 
     * Cleanses all debuffs from the player and provides minor healing.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for Purify effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Remove debuffs from player
        let debuffsRemoved = 0;
        const debuffNames = ['poison', 'burn', 'frost', 'curse', 'weakness', 'slow'];
        
        if (gameState.activeEffects && Array.isArray(gameState.activeEffects)) {
            const initialLength = gameState.activeEffects.length;
            gameState.activeEffects = gameState.activeEffects.filter(effect => {
                const isDebuff = debuffNames.includes(effect.name?.toLowerCase());
                if (isDebuff) debuffsRemoved++;
                return !isDebuff;
            });
            debuffsRemoved = initialLength - gameState.activeEffects.length;
        }

        // Apply healing
        let actualHeal = 0;
        if (gameState.playerHp < gameState.playerMaxHp) {
            actualHeal = this.healAmount;
            const variation = 0.8 + Math.random() * 0.4;
            actualHeal = Math.floor(actualHeal * variation);
            
            const newPlayerHp = gameState.playerHp + actualHeal;
            gameState.updatePlayerHp(newPlayerHp);
        }

        console.log(
            `Purify executed: Removed ${debuffsRemoved} debuffs` +
            `${actualHeal > 0 ? `, Healed ${actualHeal} HP` : ''}`
        );

        // Return result object
        return {
            success: true,
            message: `Purifying waters cleanse ${debuffsRemoved} debuffs${actualHeal > 0 ? ` and heal ${actualHeal} HP` : ''}`,
            damage: 0,
            healing: actualHeal,
            statusEffects: [],
            isCriticalHit: false,
            debuffsRemoved: debuffsRemoved,
            healAmount: actualHeal,
            cleansesAll: this.cleansesAll,
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

        // Can play if there are debuffs to remove or player needs healing
        const hasDebuffs = gameState.activeEffects?.some(e => 
            ['poison', 'burn', 'frost', 'curse', 'weakness', 'slow'].includes(e.name?.toLowerCase())
        ) || false;
        const needsHealing = gameState.playerHp < gameState.playerMaxHp;

        return hasEnoughMana && isInHand && isNotOnCooldown && (hasDebuffs || needsHealing);
    }

    /**
     * Gets the card's display name with Purify-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ✨`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `Cleanse All | Heal: ${this.healAmount}`;
    }
}
