/**
 * Combust Card - Volatile Detonation
 * 
 * ============================================================================
 * LORE:
 * "When the flame finds its fuel, nothing remains but ash and memory."
 * - Final stanza of the Combustion Chant
 * 
 * Combust is a ruthless spell that seeks out instability in the target's
 * very essence. When an enemy is weakened, their molecular structure
 * becomes vulnerable to resonant fire frequencies. A skilled mage can
 * trigger a chain reaction that tears the target apart from within.
 * 
 * This spell is considered cruel by some, as it offers no chance of
 * survival once the combustion sequence begins. The target literally
 * explodes in a burst of flame and shrapnel.
 * ============================================================================
 * 
 * @module cards/Combust
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Combust Card Class
 * 
 * An execution-style card that deals massive damage to low-HP enemies.
 * If it kills the target, refunds mana and draws a card.
 * 
 * @extends Card
 */
export class Combust extends Card {
    /**
     * Creates a new Combust card instance
     * 
     * @param {string} name - Card name (default: "Combust")
     * @param {number} cost - Mana cost (default: 3)
     * @param {number} damage - Base damage (default: 12)
     */
    constructor(name = "Combust", cost = 3, damage = 12) {
        // Define the effect object for this card
        const effect = {
            type: 'execute',
            target: 'enemy',
            value: damage,
            description: `Deal ${damage} damage. If enemy < 30% HP, deal 2x. Refund mana on kill.`,
            executeThreshold: 0.30,
            executeMultiplier: 2.0,
            refundOnKill: true
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '💥'            // Emoji - collision/explosion
        );

        // Combust-specific properties
        this.damage = damage;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'execution';
        this.castTime = 'instant';
        
        // Execute mechanics
        this.executeThreshold = 0.30; // Below 30% HP
        this.executeMultiplier = 2.0;
        this.refundOnKill = true;

        console.log(`Combust card created: ${this.name} (Damage: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Combust card's effect
     * 
     * Triggers a volatile reaction in the target. If the target is
     * below the execution threshold, deals double damage.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Combust effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate current enemy HP percentage
        const enemyHpPercent = gameState.enemyHp / gameState.enemyMaxHp;
        
        // Determine if execute condition is met
        const isExecute = enemyHpPercent <= this.executeThreshold;
        
        // Calculate damage with execute multiplier if applicable
        let actualDamage = this.damage;
        
        if (isExecute) {
            actualDamage *= this.executeMultiplier;
            console.log(`COMBUST EXECUTE! Enemy at ${enemyHpPercent * 100}% HP - Damage doubled!`);
        }

        // Apply random variation (Â±10% for more consistency on execute)
        const variation = 0.9 + Math.random() * 0.2;
        actualDamage = Math.floor(actualDamage * variation);

        // Record HP before damage for kill check
        const enemyHpBefore = gameState.enemyHp;

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        // Check if target was killed
        const isKill = enemyHpBefore > 0 && gameState.enemyHp <= 0;
        let manaRefunded = false;

        // Refund mana if target was killed
        if (isKill && this.refundOnKill) {
            const manaRefund = Math.floor(this.cost * 0.8); // Refund 80% of mana
            gameState.updatePlayerMana(gameState.playerMana + manaRefund);
            manaRefunded = true;
            console.log(`Combust kill! Refunded ${manaRefund} mana (80% of ${this.cost})`);
        }

        console.log(
            `Combust executed: ${actualDamage} damage${isExecute ? ' (EXECUTE!)' : ''}` +
            `${isKill ? ' - TARGET ELIMINATED' : ''}${manaRefunded ? ' - Mana refunded!' : ''}`
        );

        // Return result object
        return {
            success: true,
            message: isExecute
                ? `COMBUST! Enemy detonated for ${actualDamage} damage!`
                : `Combust dealt ${actualDamage} damage`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [],
            isCriticalHit: false,
            isExecute: isExecute,
            executeThreshold: this.executeThreshold,
            isKill: isKill,
            manaRefunded: manaRefunded,
            manaRefundAmount: manaRefunded ? Math.floor(this.cost * 0.8) : 0
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * Combust is most effective against wounded enemies.
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

        // Combust is only playable if there's a valid enemy target
        const hasTarget = gameState.enemyHp > 0;

        return hasEnoughMana && isInHand && isNotOnCooldown && hasTarget;
    }

    /**
     * Gets the card's display name with Combust-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ðŸ’¥`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with execute info
     */
    getStatsString() {
        return `DMG: ${this.damage} | Exec: <${this.executeThreshold * 100}% | 2x DMG`;
    }
}
