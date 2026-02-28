/**
 * Ignite Card - Spark of Destruction
 * 
 * ============================================================================
 * LORE:
 * "Every great fire begins with a single spark. The wise fear not the
 * flame, but the hand that lights it."
 * - Proverb of the Torch Bearers
 * 
 * Ignite is a deceptively simple spell that plants a small flame on the
 * target. While the initial damage is minimal, the true power of ignite
 * lies in its ability to stack - each application feeds the previous
 * flames, creating an exponentially growing inferno.
 * 
 * Master pyromancers can maintain multiple ignite stacks on a single
 * target, watching with satisfaction as the harmless-looking spark
 * transforms into a crematorium. The spell is particularly effective
 * when combined with other fire magic that can trigger the stacked
 * damage prematurely.
 * 
 * Apprentices often underestimate ignite, preferring flashier spells.
 * They learn better when their training dummy bursts into spontaneous
 * combustion from a dozen tiny flames.
 * ============================================================================
 * 
 * @module cards/Ignite
 */

// Import the base Card class
import { Card } from './Card.js';

/**
 * Ignite Card Class
 * 
 * A low-cost card that applies a stacking burn effect. Each stack
 * deals increasing damage per turn, and stacks can trigger each
 * other for bonus damage.
 * 
 * @extends Card
 */
export class Ignite extends Card {
    /**
     * Creates a new Ignite card instance
     * 
     * @param {string} name - Card name (default: "Ignite")
     * @param {number} cost - Mana cost (default: 1)
     * @param {number} burnDamage - Base burn damage per stack (default: 2)
     */
    constructor(name = "Ignite", cost = 1, burnDamage = 2) {
        // Define the effect object for this card
        const effect = {
            type: 'stacking_burn',
            target: 'enemy',
            value: burnDamage,
            description: `Apply ${burnDamage} burn/turn. Stacks up to 6 times. Stacks explode at 6.`,
            burnDamage: burnDamage,
            burnDuration: 4,
            maxStacks: 6,
            explosionMultiplier: 3.0
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '✨'            // Emoji - spark/ignition
        );

        // Ignite-specific properties
        this.burnDamage = burnDamage;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'damage_over_time';
        this.castTime = 'instant';
        
        // Stacking mechanics
        this.burnDuration = 4; // Turns
        this.maxStacks = 6;
        this.explosionMultiplier = 3.0;

        console.log(`Ignite card created: ${this.name} (Burn: ${this.burnDamage}/stack, Cost: ${this.cost})`);
    }

    /**
     * Executes the Ignite card's effect
     * 
     * Plants a spark on the enemy that grows with each stack.
     * At maximum stacks, the ignite explodes for massive damage.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Ignite effect');
            return { success: false, reason: 'no_target' };
        }

        // Find or create ignite effect on enemy
        let igniteEffect = null;
        let existingStacks = 0;
        
        if (gameState.enemy && gameState.enemy.activeEffects) {
            const existingIndex = gameState.enemy.activeEffects.findIndex(
                effect => effect.name === 'ignite_burn'
            );
            
            if (existingIndex !== -1) {
                igniteEffect = gameState.enemy.activeEffects[existingIndex];
                existingStacks = igniteEffect.stacks || 0;
            }
        }

        // Calculate new stack count
        let newStacks = Math.min(existingStacks + 1, this.maxStacks);
        let explosionOccurred = false;
        let explosionDamage = 0;

        // Check if we reached max stacks - trigger explosion
        if (newStacks >= this.maxStacks) {
            // Calculate explosion damage
            explosionDamage = Math.floor(
                this.burnDamage * newStacks * this.explosionMultiplier
            );
            
            // Apply explosion damage
            const newEnemyHp = gameState.enemyHp - explosionDamage;
            gameState.updateEnemyHp(newEnemyHp);
            
            // Reset stacks after explosion
            newStacks = 0;
            igniteEffect = null;
            explosionOccurred = true;
            
            console.log(
                `IGNITE EXPLOSION! ${this.maxStacks} stacks detonated for ${explosionDamage} damage!`
            );
        } else {
            // Apply or update ignite effect
            if (!igniteEffect) {
                igniteEffect = {
                    name: 'ignite_burn',
                    burnDamage: this.burnDamage,
                    stacks: newStacks,
                    duration: this.burnDuration,
                    source: this.name,
                    type: 'stacking_burn',
                    maxStacks: this.maxStacks
                };
                
                if (typeof gameState.enemy?.addEffect === 'function') {
                    gameState.enemy.addEffect(igniteEffect);
                }
            } else {
                igniteEffect.stacks = newStacks;
                igniteEffect.duration = this.burnDuration; // Refresh duration
            }
        }

        // Calculate total burn damage per turn
        const totalBurnPerTurn = this.burnDamage * newStacks;

        console.log(
            `Ignite ${explosionOccurred ? 'EXPLODED' : 'applied'}: ` +
            `${newStacks}/${this.maxStacks} stacks` +
            `${!explosionOccurred ? ` (${totalBurnPerTurn} burn/turn)` : ''}`
        );

        // Return result object
        return {
            success: true,
            message: explosionOccurred
                ? `IGNITE EXPLOSION! ${explosionDamage} damage!`
                : `Ignite: ${newStacks}/${this.maxStacks} stacks (${totalBurnPerTurn}/turn)`,
            damage: explosionDamage,
            healing: 0,
            statusEffects: igniteEffect ? [igniteEffect] : [],
            isCriticalHit: false,
            burnApplied: !explosionOccurred,
            currentStacks: newStacks,
            maxStacks: this.maxStacks,
            burnDamagePerStack: this.burnDamage,
            totalBurnPerTurn: totalBurnPerTurn,
            explosionOccurred: explosionOccurred,
            explosionDamage: explosionDamage,
            explosionMultiplier: this.explosionMultiplier
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * Ignite is spammable due to its low cost, making it excellent
     * for building up to the explosion.
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
     * Gets the card's display name with Ignite-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ✨`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with stacking info
     */
    getStatsString() {
        return `${this.burnDamage}/stack | Max: ${this.maxStacks} | Expl: ${this.explosionMultiplier}x`;
    }
}
