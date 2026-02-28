/**
 * FlameShield Card - Barrier of Fire
 * 
 * ============================================================================
 * LORE:
 * "The best defense is a wall of fire that melts your enemy's weapons
 * before they can strike you."
 * - General Ignis, Treatise on Combat Magic
 * 
 * FlameShield is a defensive technique that surrounds the caster with
 * a rotating barrier of flames. This shield not only absorbs incoming
 * damage but also burns attackers who dare strike through it.
 * 
 * The spell was originally developed by fire mages serving in royal
 * guard units, who needed protection against assassins while maintaining
 * their offensive capabilities. The shield's intensity can be adjusted
 * based on the mana invested in its creation.
 * ============================================================================
 * 
 * @module cards/FlameShield
 */

// Import the base Card class
import { Card } from './Card.js';

/**
 * FlameShield Card Class
 * 
 * A defensive card that provides damage absorption and reflects
 * a portion of damage back to attackers. Also provides fire damage
 * buff to the player's next attack.
 * 
 * @extends Card
 */
export class FlameShield extends Card {
    /**
     * Creates a new FlameShield card instance
     * 
     * @param {string} name - Card name (default: "FlameShield")
     * @param {number} cost - Mana cost (default: 5)
     * @param {number} shieldAmount - Damage absorption amount (default: 12)
     */
    constructor(name = "FlameShield", cost = 5, shieldAmount = 12) {
        // Define the effect object for this card
        const effect = {
            type: 'shield_and_buff',
            target: 'self',
            value: shieldAmount,
            description: `Gain ${shieldAmount} shield. Reflect 20% damage. +30% next fire damage.`,
            shieldAmount: shieldAmount,
            shieldDuration: 3,
            reflectPercent: 0.20,
            damageBuffPercent: 0.30,
            damageBuffDuration: 2
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🛡️'            // Emoji - shield with fire
        );

        // FlameShield-specific properties
        this.shieldAmount = shieldAmount;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'abjuration';
        this.castTime = 'instant';
        
        // Shield properties
        this.shieldDuration = 3; // Turns
        this.reflectPercent = 0.20; // 20% damage reflection
        
        // Damage buff properties
        this.damageBuffPercent = 0.30; // 30% increased fire damage
        this.damageBuffDuration = 2; // Turns

        console.log(`FlameShield card created: ${this.name} (Shield: ${this.shieldAmount}, Cost: ${this.cost})`);
    }

    /**
     * Executes the FlameShield card's effect
     * 
     * Creates a protective barrier of flames around the player that
     * absorbs damage and burns attackers. Also empowers the player's
     * next fire-based attacks.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for FlameShield effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Calculate actual shield amount with small variance
        const actualShield = Math.floor(this.shieldAmount * (0.9 + Math.random() * 0.2));
        
        // Create shield effect
        const shieldEffect = {
            name: 'flame_shield',
            shieldAmount: actualShield,
            remainingShield: actualShield,
            duration: this.shieldDuration,
            source: this.name,
            type: 'absorption',
            reflectPercent: this.reflectPercent
        };

        // Create damage buff effect
        const damageBuffEffect = {
            name: 'flame_empowerment',
            damageBonusPercent: this.damageBuffPercent,
            duration: this.damageBuffDuration,
            source: this.name,
            type: 'damage_buff',
            appliesTo: 'fire'
        };

        // Add effects to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(shieldEffect);
            gameState.addEffect(damageBuffEffect);
        }

        // Store shield in game state for damage calculation
        gameState.currentShield = actualShield;
        gameState.activeFireBuff = this.damageBuffPercent;

        console.log(
            `FlameShield executed: ${actualShield} shield (${this.shieldDuration} turns) | ` +
            `Reflect: ${this.reflectPercent * 100}% | Fire DMG: +${this.damageBuffPercent * 100}%`
        );

        // Update game state
        gameState.lastDamageDealt = 0;
        gameState.isCriticalHit = false;

        // Return result object
        return {
            success: true,
            message: `FlameShield activated! ${actualShield} shield + ${this.damageBuffPercent * 100}% fire damage buff`,
            damage: 0,
            healing: 0,
            statusEffects: [shieldEffect, damageBuffEffect],
            isCriticalHit: false,
            shieldApplied: true,
            shieldAmount: actualShield,
            shieldDuration: this.shieldDuration,
            reflectPercent: this.reflectPercent,
            damageBuffApplied: true,
            damageBuffPercent: this.damageBuffPercent,
            damageBuffDuration: this.damageBuffDuration
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * FlameShield is most valuable when the player needs protection
     * or wants to amplify their fire damage.
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

        // Check if player already has a flame shield (don't stack)
        const hasExistingShield = gameState.activeEffects?.some(
            effect => effect.name === 'flame_shield'
        ) || false;

        // Can play if no existing shield, or if existing shield is about to expire
        const canRefreshShield = !hasExistingShield || 
            (gameState.activeEffects?.find(e => e.name === 'flame_shield')?.duration <= 1);

        return hasEnoughMana && isInHand && isNotOnCooldown && canRefreshShield;
    }

    /**
     * Gets the card's display name with FlameShield-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🛡️`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with shield/buff info
     */
    getStatsString() {
        return `Shield: ${this.shieldAmount} | Reflect: ${this.reflectPercent * 100}% | Buff: +${this.damageBuffPercent * 100}%`;
    }
}
