/**
 * Whirlpool Card - Vortex Trap
 * 
 * ============================================================================
 * LORE:
 * "The water spins. Faster, faster. And as it spins, it pulls. Down,
 * down, down into the depths where light cannot follow. The whirlpool
 * does not hate. It simply hungers."
 * - Sailor's Warning, Tales of the Lost Ships
 * 
 * Whirlpool creates a swirling vortex that traps the enemy, dealing
 * damage each turn while they struggle to escape. The spell is both
 * offensive and controlling - the enemy takes damage while being
 * unable to act effectively.
 * 
 * The vortex is difficult to dispel once created. Smart mages use it
 * to control the battlefield while setting up their finishing moves.
 * ============================================================================
 * 
 * @module cards/water/Whirlpool
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Whirlpool Card Class
 * 
 * A damage over time card that traps the enemy
 * and deals damage each turn.
 * 
 * @extends Card
 */
export class Whirlpool extends Card {
    /**
     * Creates a new Whirlpool card instance
     * 
     * @param {string} name - Card name (default: "Whirlpool")
     * @param {number} cost - Mana cost (default: 5)
     * @param {number} damagePerTurn - Damage per turn (default: 5)
     */
    constructor(name = "Whirlpool", cost = 5, damagePerTurn = 5) {
        // Define the effect object for this card
        const effect = {
            type: 'damage_over_time',
            target: 'enemy',
            value: damagePerTurn,
            description: `Deal ${damagePerTurn} damage/turn for 3 turns. Enemy has 30% chance to miss attacks.`,
            damagePerTurn: damagePerTurn,
            duration: 3,
            missChance: 0.30
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🌀'            // Emoji - cyclone/vortex
        );

        // Whirlpool-specific properties
        this.damagePerTurn = damagePerTurn;
        this.element = 'water';
        this.isElemental = true;
        this.spellType = 'damage_over_time';
        this.castTime = 'ritual';
        
        // DoT mechanics
        this.duration = 3;
        this.missChance = 0.30;
        this.totalDamage = damagePerTurn * duration;

        console.log(`Whirlpool card created: ${this.name} (${this.damagePerTurn}/turn, Cost: ${this.cost})`);
    }

    /**
     * Executes the Whirlpool card's effect
     * 
     * Creates a vortex that damages the enemy each turn.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Whirlpool effect');
            return { success: false, reason: 'no_target' };
        }

        // Check for existing whirlpool
        let existingWhirlpool = null;
        if (gameState.enemy && gameState.enemy.activeEffects) {
            existingWhirlpool = gameState.enemy.activeEffects.find(
                effect => effect.name === 'whirlpool'
            );
        }

        // Don't stack whirlpools
        if (existingWhirlpool) {
            console.warn('Whirlpool already active on target');
            return { 
                success: false, 
                reason: 'already_active',
                message: 'Target already trapped in whirlpool!'
            };
        }

        // Create whirlpool effect
        const whirlpoolEffect = {
            name: 'whirlpool',
            damagePerTurn: this.damagePerTurn,
            duration: this.duration,
            turnsRemaining: this.duration,
            source: this.name,
            type: 'damage_over_time',
            missChance: this.missChance,
            totalDamage: this.totalDamage
        };

        // Add effect to enemy
        if (typeof gameState.enemy?.addEffect === 'function') {
            gameState.enemy.addEffect(whirlpoolEffect);
        }

        // Apply initial damage
        const initialDamage = Math.floor(this.damagePerTurn * 0.5);
        const newEnemyHp = gameState.enemyHp - initialDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = initialDamage;

        console.log(
            `Whirlpool created: ${this.damagePerTurn} damage/turn for ${this.duration} turns ` +
            `(Total: ${this.totalDamage}, Initial: ${initialDamage})`
        );

        // Return result object
        return {
            success: true,
            message: `Whirlpool traps the enemy! ${this.damagePerTurn} DMG/turn for ${this.duration} turns`,
            damage: initialDamage,
            healing: 0,
            statusEffects: [whirlpoolEffect],
            isCriticalHit: false,
            whirlpoolApplied: true,
            damagePerTurn: this.damagePerTurn,
            duration: this.duration,
            totalDamage: this.totalDamage,
            missChance: this.missChance,
            initialDamage: initialDamage,
            spellType: this.spellType
        };
    }

    /**
     * Gets the card's display name with Whirlpool-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🌀`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `${this.damagePerTurn}/turn | ${this.duration} turns | Total: ${this.totalDamage}`;
    }
}
