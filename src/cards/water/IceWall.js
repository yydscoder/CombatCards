/**
 * IceWall Card - Frozen Barrier
 * 
 * ============================================================================
 * LORE:
 * "Ice does not bend. Ice does not yield. Ice simply is - cold, unyielding,
 * eternal. When the wall rises, the storm itself stands guard."
 * - The Frost Wardens, Oath of the Frozen Shield
 * 
 * IceWall conjures a shimmering barrier of solid ice between the caster
 * and their foes. The wall absorbs incoming damage while its frigid surface
 * chills any who dare strike through it. Unlike magical shields, the IceWall
 * is physical - it can be seen, touched, and shattered.
 * 
 * The spell was perfected by northern mages who learned to survive in
 * lands where warmth was a luxury. They discovered that ice, properly
 * shaped and enchanted, could stop steel as effectively as any armor.
 * ============================================================================
 * 
 * @module cards/water/IceWall
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * IceWall Card Class
 * 
 * A defensive card that creates a shield/barrier that absorbs damage.
 * Also chills attackers who strike through the ice.
 * 
 * @extends Card
 */
export class IceWall extends Card {
    /**
     * Creates a new IceWall card instance
     * 
     * @param {string} name - Card name (default: "IceWall")
     * @param {number} cost - Mana cost (default: 4)
     * @param {number} shieldAmount - Damage absorption (default: 12)
     */
    constructor(name = "IceWall", cost = 4, shieldAmount = 12) {
        // Define the effect object for this card
        const effect = {
            type: 'shield',
            target: 'self',
            value: shieldAmount,
            description: `Gain ${shieldAmount} shield for 3 turns. Attackers take 2 chill damage.`,
            shieldAmount: shieldAmount,
            shieldDuration: 3,
            chillDamage: 2,
            chillChance: 0.50
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🧊'            // Emoji - ice cube
        );

        // IceWall-specific properties
        this.shieldAmount = shieldAmount;
        this.element = 'ice';
        this.isElemental = true;
        this.spellType = 'abjuration';
        this.castTime = 'instant';
        
        // Shield mechanics
        this.shieldDuration = 3;
        this.chillDamage = 2;
        this.chillChance = 0.50;

        console.log(`IceWall card created: ${this.name} (Shield: ${this.shieldAmount}, Cost: ${this.cost})`);
    }

    /**
     * Executes the IceWall card's effect
     * 
     * Creates a wall of ice that absorbs incoming damage and
     * chills enemies who attack through it.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for IceWall effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Calculate actual shield amount with small variance
        const actualShield = Math.floor(this.shieldAmount * (0.9 + Math.random() * 0.2));

        // Create shield effect
        const shieldEffect = {
            name: 'ice_wall_shield',
            shieldAmount: actualShield,
            remainingShield: actualShield,
            duration: this.shieldDuration,
            source: this.name,
            type: 'absorption',
            chillDamage: this.chillDamage,
            chillChance: this.chillChance
        };

        // Create chill retaliation effect
        const chillEffect = {
            name: 'ice_wall_chill',
            damage: this.chillDamage,
            duration: this.shieldDuration,
            source: this.name,
            type: 'retaliation',
            triggerOn: 'damage_taken',
            chance: this.chillChance
        };

        // Add effects to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(shieldEffect);
            gameState.addEffect(chillEffect);
        }

        // Store shield in game state for damage calculation
        gameState.currentShield = actualShield;
        gameState.activeChillRetaliation = this.chillDamage;

        console.log(
            `IceWall erected: ${actualShield} shield (${this.shieldDuration} turns) | ` +
            `Chill retaliation: ${this.chillDamage} damage (${this.chillChance * 100}% chance)`
        );

        // Update game state
        gameState.lastDamageDealt = 0;
        gameState.isCriticalHit = false;

        // Return result object
        return {
            success: true,
            message: `IceWall rises! ${actualShield} shield + chill retaliation`,
            damage: 0,
            healing: 0,
            statusEffects: [shieldEffect, chillEffect],
            isCriticalHit: false,
            shieldApplied: true,
            shieldAmount: actualShield,
            shieldDuration: this.shieldDuration,
            chillDamage: this.chillDamage,
            chillChance: this.chillChance,
            spellType: this.spellType
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * IceWall is most valuable when expecting incoming damage.
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

        // Check if player already has an ice wall (don't stack)
        const hasExistingShield = gameState.activeEffects?.some(
            effect => effect.name === 'ice_wall_shield'
        ) || false;

        // Can play if no existing shield
        const canPlaceNewWall = !hasExistingShield;

        return hasEnoughMana && isInHand && isNotOnCooldown && canPlaceNewWall;
    }

    /**
     * Gets the card's display name with IceWall-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🧊`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with shield/chill info
     */
    getStatsString() {
        return `Shield: ${this.shieldAmount} | Chill: ${this.chillDamage} | ${this.shieldDuration} turns`;
    }
}
