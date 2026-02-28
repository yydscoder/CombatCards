/**
 * FireWall Card - Barrier of Flames
 * 
 * ============================================================================
 * LORE:
 * "The wall of fire rose between the armies, a curtain of orange and red.
 * Those who tried to pass through learned that fire does not discriminate -
 * it burns friend and foe alike."
 * - Battle of the Burning Bridge, Survivor Testimony
 * 
 * FireWall is a tactical spell that creates a vertical plane of intense
 * flame. The barrier serves dual purposes: it protects the caster from
 * incoming attacks while simultaneously damaging any enemy foolish
 * enough to approach.
 * 
 * The spell was perfected by defensive battlemages who needed to control
 * the flow of combat. A well-placed firewall can split enemy forces,
 * protect vulnerable allies, or create a safe zone for healing.
 * 
 * The wall's intensity can be modulated - from a gentle heat haze that
 * discourages approach to a white-hot inferno that vaporizes anything
 * crossing it.
 * ============================================================================
 * 
 * @module cards/FireWall
 */

// Import the base Card class
import { Card } from './Card.js';

/**
 * FireWall Card Class
 * 
 * A defensive card that creates a damage-absorbing barrier while
 * also dealing damage to enemies who attack while the wall is active.
 * Provides both protection and retaliation.
 * 
 * @extends Card
 */
export class FireWall extends Card {
    /**
     * Creates a new FireWall card instance
     * 
     * @param {string} name - Card name (default: "FireWall")
     * @param {number} cost - Mana cost (default: 5)
     * @param {number} barrierAmount - Damage absorption (default: 10)
     */
    constructor(name = "FireWall", cost = 5, barrierAmount = 10) {
        // Define the effect object for this card
        const effect = {
            type: 'barrier_and_retaliation',
            target: 'self',
            value: barrierAmount,
            description: `Gain ${barrierAmount} barrier. Enemies take 3 damage when you're hit.`,
            barrierAmount: barrierAmount,
            barrierDuration: 3,
            retaliationDamage: 3,
            retaliationType: 'fire'
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🧱'            // Emoji - wall/barrier
        );

        // FireWall-specific properties
        this.barrierAmount = barrierAmount;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'defensive';
        this.castTime = 'instant';
        
        // Barrier mechanics
        this.barrierDuration = 3; // Turns
        this.retaliationDamage = 3;
        this.retaliationType = 'fire';

        console.log(`FireWall card created: ${this.name} (Barrier: ${this.barrierAmount}, Cost: ${this.cost})`);
    }

    /**
     * Executes the FireWall card's effect
     * 
     * Creates a wall of fire that absorbs incoming damage and
     * burns enemies who attack through it.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for FireWall effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Calculate actual barrier amount with small variance
        const actualBarrier = Math.floor(this.barrierAmount * (0.9 + Math.random() * 0.2));

        // Create barrier effect
        const barrierEffect = {
            name: 'fire_wall_barrier',
            barrierAmount: actualBarrier,
            remainingBarrier: actualBarrier,
            duration: this.barrierDuration,
            source: this.name,
            type: 'absorption',
            retaliationDamage: this.retaliationDamage,
            retaliationType: this.retaliationType
        };

        // Create retaliation effect (damages attackers)
        const retaliationEffect = {
            name: 'fire_wall_retaliation',
            damage: this.retaliationDamage,
            duration: this.barrierDuration,
            source: this.name,
            type: 'retaliation',
            triggerOn: 'damage_taken'
        };

        // Add effects to game state
        if (typeof gameState.addEffect === 'function') {
            gameState.addEffect(barrierEffect);
            gameState.addEffect(retaliationEffect);
        }

        // Store barrier in game state for damage calculation
        gameState.currentBarrier = actualBarrier;
        gameState.activeRetaliation = this.retaliationDamage;

        console.log(
            `FireWall erected: ${actualBarrier} barrier (${this.barrierDuration} turns) | ` +
            `Retaliation: ${this.retaliationDamage} fire damage to attackers`
        );

        // Update game state
        gameState.lastDamageDealt = 0;
        gameState.isCriticalHit = false;

        // Return result object
        return {
            success: true,
            message: `FireWall rises! ${actualBarrier} barrier + ${this.retaliationDamage} retaliation damage`,
            damage: 0,
            healing: 0,
            statusEffects: [barrierEffect, retaliationEffect],
            isCriticalHit: false,
            barrierApplied: true,
            barrierAmount: actualBarrier,
            barrierDuration: this.barrierDuration,
            retaliationDamage: this.retaliationDamage,
            retaliationDuration: this.barrierDuration,
            spellType: this.spellType
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * FireWall is most valuable when expecting incoming damage.
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

        // Check if player already has a firewall (don't stack)
        const hasExistingBarrier = gameState.activeEffects?.some(
            effect => effect.name === 'fire_wall_barrier'
        ) || false;

        // Can play if no existing barrier
        const canPlaceNewWall = !hasExistingBarrier;

        // Valid to cast if player needs protection
        const needsProtection = gameState.playerHp < gameState.playerMaxHp * 0.7;

        return hasEnoughMana && isInHand && isNotOnCooldown && canPlaceNewWall;
    }

    /**
     * Gets the card's display name with FireWall-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🧱`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with barrier/retaliation info
     */
    getStatsString() {
        return `Barrier: ${this.barrierAmount} | Retal: ${this.retaliationDamage} | ${this.barrierDuration} turns`;
    }
}
