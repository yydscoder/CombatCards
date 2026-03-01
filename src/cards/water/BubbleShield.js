/**
 * BubbleShield Card - Protective Bubbles
 * 
 * ============================================================================
 * LORE:
 * "Each bubble holds a world within. Fragile, beautiful, temporary.
 * But together, they form a barrier that even fate struggles to pop."
 * - The Bubble Witch's Grimoire
 * 
 * BubbleShield conjures dozens of shimmering, magical bubbles that float
 * around the caster. Each bubble can absorb a single attack before popping,
 * and the collective barrier provides surprising protection.
 * 
 * The spell is deceptively cheerful in appearance but deadly serious in
 * application. A mage surrounded by bubbles is surprisingly difficult to
 * harm.
 * ============================================================================
 * 
 * @module cards/water/BubbleShield
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * BubbleShield Card Class
 * 
 * A defensive card that provides multiple small shields
 * that pop individually when hit.
 * 
 * @extends Card
 */
export class BubbleShield extends Card {
    /**
     * Creates a new BubbleShield card instance
     * 
     * @param {string} name - Card name (default: "BubbleShield")
     * @param {number} cost - Mana cost (default: 4)
     * @param {number} bubbleCount - Number of bubbles (default: 3)
     */
    constructor(name = "BubbleShield", cost = 4, bubbleCount = 3) {
        // Define the effect object for this card
        const effect = {
            type: 'shield',
            target: 'self',
            value: bubbleCount,
            description: `Gain ${bubbleCount} bubbles. Each absorbs one hit.`,
            bubbleCount: bubbleCount,
            bubbleDuration: 3,
            absorbPerBubble: 5
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🫧'            // Emoji - bubbles
        );

        // BubbleShield-specific properties
        this.bubbleCount = bubbleCount;
        this.element = 'water';
        this.isElemental = true;
        this.spellType = 'abjuration';
        this.castTime = 'instant';
        
        // Bubble mechanics
        this.bubbleDuration = 3;
        this.absorbPerBubble = 5;

        console.log(`BubbleShield card created: ${this.name} (Bubbles: ${this.bubbleCount}, Cost: ${this.cost})`);
    }

    /**
     * Executes the BubbleShield card's effect
     * 
     * Creates protective bubbles that absorb individual attacks.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for BubbleShield effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Create bubble shield effect
        const bubbleEffect = {
            name: 'bubble_shield',
            bubbleCount: this.bubbleCount,
            remainingBubbles: this.bubbleCount,
            duration: this.bubbleDuration,
            source: this.name,
            type: 'absorption',
            absorbPerBubble: this.absorbPerBubble,
            totalAbsorb: this.bubbleCount * this.absorbPerBubble
        };

        // Add effect to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(bubbleEffect);
        }

        console.log(
            `BubbleShield created: ${this.bubbleCount} bubbles ` +
            `(${this.bubbleDuration} turns, ${this.absorbPerBubble} absorb each)`
        );

        // Update game state
        gameState.lastDamageDealt = 0;
        gameState.isCriticalHit = false;

        // Return result object
        return {
            success: true,
            message: `BubbleShield: ${this.bubbleCount} protective bubbles!`,
            damage: 0,
            healing: 0,
            statusEffects: [bubbleEffect],
            isCriticalHit: false,
            shieldApplied: true,
            bubbleCount: this.bubbleCount,
            bubbleDuration: this.bubbleDuration,
            absorbPerBubble: this.absorbPerBubble,
            totalAbsorb: this.bubbleCount * this.absorbPerBubble,
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
        
        // Check if player already has bubble shield
        const hasExistingBubbles = gameState.activeEffects?.some(
            effect => effect.name === 'bubble_shield'
        ) || false;

        return hasEnoughMana && isInHand && isNotOnCooldown && !hasExistingBubbles;
    }

    /**
     * Gets the card's display name with BubbleShield-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🫧`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with bubble info
     */
    getStatsString() {
        return `${this.bubbleCount} Bubbles | ${this.absorbPerBubble} each | ${this.bubbleDuration} turns`;
    }
}
