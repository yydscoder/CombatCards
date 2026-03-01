/**
 * DeepFreeze Card - Absolute Zero
 * 
 * ============================================================================
 * LORE:
 * "There is a cold beyond cold. A place where even time hesitates to tread.
 * The deep freeze is not merely the absence of heat - it is the presence
 * of something far older, far darker."
 * - The Frozen Tome, Chapter of endings
 * 
 * DeepFreeze reaches into the spaces between atoms and steals their motion.
 * The spell doesn't create cold - it removes energy itself, leaving behind
 * a perfect stillness that no living thing can endure.
 * 
 * Mages who cast DeepFreeze report hearing whispers from the void. Some
 * never stop hearing them.
 * ============================================================================
 * 
 * @module cards/water/DeepFreeze
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * DeepFreeze Card Class
 * 
 * A high-cost ice attack that can freeze the enemy
 * (skip multiple turns).
 * 
 * @extends Card
 */
export class DeepFreeze extends Card {
    /**
     * Creates a new DeepFreeze card instance
     * 
     * @param {string} name - Card name (default: "DeepFreeze")
     * @param {number} cost - Mana cost (default: 7)
     * @param {number} damage - Base damage (default: 12)
     */
    constructor(name = "DeepFreeze", cost = 7, damage = 12) {
        // Define the effect object for this card
        const effect = {
            type: 'damage',
            target: 'enemy',
            value: damage,
            description: `Deals ${damage} damage. 40% chance to Freeze (skip 2 turns)`,
            freezeChance: 0.40,
            freezeDuration: 2
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🥶'            // Emoji - cold face
        );

        // DeepFreeze-specific properties
        this.damage = damage;
        this.element = 'ice';
        this.isElemental = true;
        this.spellType = 'crowd_control';
        this.castTime = 'channeled';
        
        // Freeze mechanics
        this.freezeChance = 0.40;
        this.freezeDuration = 2;

        console.log(`DeepFreeze card created: ${this.name} (Damage: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the DeepFreeze card's effect
     * 
     * Unleashes absolute zero on the enemy, dealing damage
     * with a chance to freeze.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for DeepFreeze effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate base damage
        let actualDamage = this.damage;
        
        // Check for critical hit (15% base chance)
        const isCriticalHit = Math.random() < 0.15;
        
        if (isCriticalHit) {
            actualDamage *= 1.5;
            gameState.isCriticalHit = true;
            console.log(`DeepFreeze Critical Hit! Damage multiplier: 1.5x`);
        } else {
            gameState.isCriticalHit = false;
        }

        // Apply random variation (±15%)
        const variation = 0.85 + Math.random() * 0.30;
        actualDamage = Math.floor(actualDamage * variation);

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        // Check for Freeze effect application
        const freezeApplied = Math.random() < this.freezeChance;
        let freezeEffect = null;
        
        if (freezeApplied) {
            freezeEffect = {
                name: 'freeze',
                duration: this.freezeDuration,
                turnsRemaining: this.freezeDuration,
                source: this.name,
                type: 'crowd_control',
                skipsTurn: true
            };
            
            // Add freeze effect to enemy
            if (gameState.enemy && typeof gameState.enemy.addEffect === 'function') {
                gameState.enemy.addEffect(freezeEffect);
            }
            
            console.log(`DeepFreeze FREEZE applied! Enemy skips ${this.freezeDuration} turns!`);
        }

        console.log(`DeepFreeze executed: ${actualDamage} damage${freezeApplied ? ' + FROZEN!' : ''}`);

        // Return result object
        return {
            success: true,
            message: `DeepFreeze chills for ${actualDamage} damage${freezeApplied ? ` and FREEZES the enemy!` : ''}`,
            damage: actualDamage,
            healing: 0,
            statusEffects: freezeApplied ? [freezeEffect] : [],
            isCriticalHit: isCriticalHit,
            freezeApplied: freezeApplied,
            freezeDuration: this.freezeDuration,
            freezeChance: this.freezeChance,
            spellType: this.spellType
        };
    }

    /**
     * Gets the card's display name with DeepFreeze-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🥶`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with freeze info
     */
    getStatsString() {
        return `DMG: ${this.damage} | Freeze: ${this.freezeChance * 100}% (${this.freezeDuration} turns)`;
    }
}
