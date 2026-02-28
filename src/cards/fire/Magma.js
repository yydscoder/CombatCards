/**
 * Magma Card - Subterranean Fury
 * 
 * ============================================================================
 * LORE:
 * "The ground trembled. The air grew thick with sulfur. And from the
 * depths below, the magma rose - slow, inevitable, hungry. The earth
 * itself had become a weapon."
 * - The Deep Caller's Lament
 * 
 * Magma is a patient spell, requiring time to reach its full potential.
 * The caster opens a conduit to the molten core of the planet, allowing
 * magma to seep upward through the battlefield. The damage starts small
 * but grows exponentially as more of the superheated rock breaks through.
 * 
 * This spell rewards strategic planning and foresight. A mage who casts
 * magma early in a battle will reap devastating rewards as the fight
 * progresses. Those who wait too long may find themselves overwhelmed
 * before the eruption occurs.
 * 
 * Some say the magma spell was taught to mortals by the earth elementals
 * themselves, as a reminder that the ground beneath our feet is merely
 * a thin crust over an ocean of destruction.
 * ============================================================================
 * 
 * @module cards/Magma
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Magma Card Class
 * 
 * A delayed damage card that plants a magma pool under the enemy.
 * The pool deals increasing damage each turn, erupting for massive
 * damage after 3 turns.
 * 
 * @extends Card
 */
export class Magma extends Card {
    /**
     * Creates a new Magma card instance
     * 
     * @param {string} name - Card name (default: "Magma")
     * @param {number} cost - Mana cost (default: 4)
     * @param {number} initialDamage - Initial tick damage (default: 3)
     */
    constructor(name = "Magma", cost = 4, initialDamage = 3) {
        // Define the effect object for this card
        const effect = {
            type: 'delayed_eruption',
            target: 'enemy',
            value: initialDamage,
            description: `Create magma pool. Deals ${initialDamage} damage, doubling each turn. Erupts at turn 3.`,
            initialDamage: initialDamage,
            growthMultiplier: 2.0,
            eruptionTurn: 3,
            eruptionMultiplier: 5.0
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            'ðŸŒ‹'            // Emoji - volcano
        );

        // Magma-specific properties
        this.initialDamage = initialDamage;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'delayed_damage';
        this.castTime = 'ritual';
        
        // Delayed damage mechanics
        this.growthMultiplier = 2.0; // Damage doubles each turn
        this.eruptionTurn = 3;
        this.eruptionMultiplier = 5.0;

        console.log(`Magma card created: ${this.name} (Initial: ${this.initialDamage}, Eruption: turn ${this.eruptionTurn})`);
    }

    /**
     * Executes the Magma card's effect
     * 
     * Opens a conduit to the molten core, creating a magma pool
     * that grows more dangerous each turn until it erupts.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Magma effect');
            return { success: false, reason: 'no_target' };
        }

        // Create magma pool effect
        const magmaEffect = {
            name: 'magma_pool',
            initialDamage: this.initialDamage,
            currentDamage: this.initialDamage,
            turnsRemaining: this.eruptionTurn,
            maxTurns: this.eruptionTurn,
            growthMultiplier: this.growthMultiplier,
            eruptionMultiplier: this.eruptionMultiplier,
            source: this.name,
            type: 'delayed_eruption',
            tickDamage: this.initialDamage
        };

        // Add effect to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(magmaEffect);
        }

        // Apply initial small damage (the "first bubble" of magma)
        const initialTick = Math.floor(this.initialDamage * 0.5);
        if (initialTick > 0) {
            const newEnemyHp = gameState.enemyHp - initialTick;
            gameState.updateEnemyHp(newEnemyHp);
            gameState.lastDamageDealt = initialTick;
        }

        console.log(
            `MAGMA POOL created! Initial tick: ${initialTick} damage. ` +
            `Turn ${this.eruptionTurn}: ERUPTION for ${this.calculateEruptionDamage()} damage!`
        );

        // Return result object
        return {
            success: true,
            message: `Magma pool opened! ${initialTick} initial damage, eruption in ${this.eruptionTurn} turns!`,
            damage: initialTick,
            healing: 0,
            statusEffects: [magmaEffect],
            isCriticalHit: false,
            magmaApplied: true,
            initialDamage: initialTick,
            currentDamage: this.initialDamage,
            turnsToEruption: this.eruptionTurn,
            predictedEruptionDamage: this.calculateEruptionDamage(),
            growthMultiplier: this.growthMultiplier,
            eruptionMultiplier: this.eruptionMultiplier,
            spellType: this.spellType
        };
    }

    /**
     * Calculates the predicted eruption damage
     * 
     * @returns {number} The damage at eruption
     */
    calculateEruptionDamage() {
        // Damage doubles each turn, then multiplied by eruption multiplier
        let eruptionDamage = this.initialDamage;
        
        for (let i = 1; i < this.eruptionTurn; i++) {
            eruptionDamage *= this.growthMultiplier;
        }
        
        eruptionDamage *= this.eruptionMultiplier;
        
        return Math.floor(eruptionDamage);
    }

    /**
     * Processes the magma pool tick (called at end of turn)
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} magmaEffect - The magma effect to process
     * @returns {Object} Tick result
     */
    processTick(gameState, magmaEffect) {
        if (!magmaEffect || magmaEffect.name !== 'magma_pool') {
            return { success: false, reason: 'invalid_effect' };
        }

        // Decrease turns remaining
        magmaEffect.turnsRemaining--;
        
        // Calculate current damage (doubles each turn)
        const turnsElapsed = this.eruptionTurn - magmaEffect.turnsRemaining;
        magmaEffect.currentDamage = Math.floor(
            this.initialDamage * Math.pow(this.growthMultiplier, turnsElapsed)
        );
        magmaEffect.tickDamage = magmaEffect.currentDamage;

        // Check if eruption turn
        if (magmaEffect.turnsRemaining <= 0) {
            // ERUPTION!
            const eruptionDamage = Math.floor(
                magmaEffect.currentDamage * this.eruptionMultiplier
            );
            
            const newEnemyHp = gameState.enemyHp - eruptionDamage;
            gameState.updateEnemyHp(newEnemyHp);
            gameState.lastDamageDealt = eruptionDamage;

            console.log(`MAGMA ERUPTION! ${eruptionDamage} catastrophic damage!`);

            return {
                success: true,
                isEruption: true,
                damage: eruptionDamage,
                message: `MAGMA ERUPTION! ${eruptionDamage} damage!`
            };
        } else {
            // Regular tick damage
            const newEnemyHp = gameState.enemyHp - magmaEffect.currentDamage;
            gameState.updateEnemyHp(newEnemyHp);
            gameState.lastDamageDealt = magmaEffect.currentDamage;

            console.log(
                `Magma tick: ${magmaEffect.currentDamage} damage ` +
                `(${magmaEffect.turnsRemaining} turns until eruption)`
            );

            return {
                success: true,
                isEruption: false,
                damage: magmaEffect.currentDamage,
                turnsRemaining: magmaEffect.turnsRemaining,
                message: `Magma burns for ${magmaEffect.currentDamage} damage`
            };
        }
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * Magma is best used when the enemy will survive multiple turns.
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

        // Check if magma pool already exists (don't stack)
        const hasExistingMagma = gameState.activeEffects?.some(
            effect => effect.name === 'magma_pool'
        ) || false;

        // Valid target check
        const hasTarget = gameState.enemyHp > 0;

        // Enemy should have enough HP to survive until eruption
        const enemyHasEnoughHp = gameState.enemyHp >= this.initialDamage * 2;

        return hasEnoughMana && isInHand && isNotOnCooldown && !hasExistingMagma && hasTarget;
    }

    /**
     * Gets the card's display name with Magma-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ðŸŒ‹`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with eruption info
     */
    getStatsString() {
        return `Start: ${this.initialDamage} | Turn ${this.eruptionTurn}: ${this.calculateEruptionDamage()} erupt`;
    }
}
