/**
 * Blaze Card - Unstoppable Inferno
 * 
 * ============================================================================
 * LORE:
 * "Blaze is not a spell you cast. It is a force you unleash. And once 
 * unleashed, it hungers. It grows. It consumes. Like all fire, it seeks
 * only to become everything."
 * - Master Pyromancer Vaelis, On the Nature of Flame
 * 
 * Blaze is a unique fire spell that feeds on itself, growing stronger
 * with each passing moment. The spell creates a self-sustaining cycle
 * of combustion where each burst of flame ignites the next, creating
 * an exponentially growing conflagration.
 * 
 * Skilled mages use blaze as a late-game finisher, allowing the spell
 * to build momentum before releasing it upon their foe. The reckless
 * may cast it early, gambling that the growing flames won't consume
 * them first.
 * ============================================================================
 * 
 * @module cards/Blaze
 */

// Import the base Card class
import { Card } from './Card.js';

/**
 * Blaze Card Class
 * 
 * A scaling card whose damage increases based on the number of
 * fire cards played this game. The more fire magic used, the
 * more devastating Blaze becomes.
 * 
 * @extends Card
 */
export class Blaze extends Card {
    /**
     * Creates a new Blaze card instance
     * 
     * @param {string} name - Card name (default: "Blaze")
     * @param {number} cost - Mana cost (default: 5)
     * @param {number} baseDamage - Base damage (default: 6)
     */
    constructor(name = "Blaze", cost = 5, baseDamage = 6) {
        // Define the effect object for this card
        const effect = {
            type: 'scaling_damage',
            target: 'enemy',
            value: baseDamage,
            description: `Deal ${baseDamage} damage + 2 per fire card played this game`,
            damagePerStack: 2,
            scalingType: 'fire_cards_played'
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🔥'            // Emoji - intensifying fire
        );

        // Blaze-specific properties
        this.baseDamage = baseDamage;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'scaling';
        this.castTime = 'instant';
        
        // Scaling mechanics
        this.damagePerStack = 2;
        this.scalingType = 'fire_cards_played';

        console.log(`Blaze card created: ${this.name} (Base: ${this.baseDamage}, Cost: ${this.cost})`);
    }

    /**
     * Calculates current damage based on fire cards played
     * 
     * @param {Object} gameState - The current game state object
     * @returns {number} The calculated damage
     */
    calculateCurrentDamage(gameState) {
        // Count fire cards played this game
        let fireCardsPlayed = 0;
        
        // Check discard pile for fire cards
        if (gameState.discardPile) {
            fireCardsPlayed = gameState.discardPile.filter(
                card => card.element === 'fire'
            ).length;
        }
        
        // Also count the current hand for fire cards
        if (gameState.hand) {
            fireCardsPlayed += gameState.hand.filter(
                card => card.element === 'fire' && card !== this
            ).length;
        }

        // Calculate total damage
        const bonusDamage = fireCardsPlayed * this.damagePerStack;
        const totalDamage = this.baseDamage + bonusDamage;

        return {
            baseDamage: this.baseDamage,
            bonusDamage: bonusDamage,
            totalDamage: totalDamage,
            fireCardsPlayed: fireCardsPlayed
        };
    }

    /**
     * Executes the Blaze card's effect
     * 
     * Unleashes a growing inferno whose power scales with the number
     * of fire cards played during the game.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Blaze effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate current damage based on fire cards played
        const damageCalc = this.calculateCurrentDamage(gameState);
        let actualDamage = damageCalc.totalDamage;

        // Apply random variation (±10%)
        const variance = 0.9 + Math.random() * 0.2;
        actualDamage = Math.floor(actualDamage * variance);

        // Check for critical hit (15% chance)
        const isCriticalHit = Math.random() < 0.15;
        if (isCriticalHit) {
            actualDamage = Math.floor(actualDamage * 1.5);
            gameState.isCriticalHit = true;
            console.log(`BLAZE CRITICAL HIT! Damage multiplier: 1.5x`);
        } else {
            gameState.isCriticalHit = false;
        }

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        console.log(
            `Blaze executed: ${actualDamage} damage ` +
            `(Base: ${damageCalc.baseDamage} + Bonus: ${damageCalc.bonusDamage} from ${damageCalc.fireCardsPlayed} fire cards)` +
            `${isCriticalHit ? ' [CRIT!]' : ''}`
        );

        // Return result object
        return {
            success: true,
            message: `Blaze consumed the enemy for ${actualDamage} damage!`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [],
            isCriticalHit: isCriticalHit,
            baseDamage: damageCalc.baseDamage,
            bonusDamage: damageCalc.bonusDamage,
            fireCardsPlayed: damageCalc.fireCardsPlayed,
            damagePerStack: this.damagePerStack,
            scalingType: this.scalingType
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * Blaze becomes more valuable as more fire cards are played.
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

        // Valid target check
        const hasTarget = gameState.enemyHp > 0;

        return hasEnoughMana && isInHand && isNotOnCooldown && hasTarget;
    }

    /**
     * Gets the card's display name with Blaze-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🔥`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with scaling info
     */
    getStatsString() {
        return `Base: ${this.baseDamage} | +${this.damagePerStack}/fire card`;
    }
}
