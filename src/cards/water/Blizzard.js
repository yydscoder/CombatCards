/**
 * Blizzard Card - Frozen Storm
 * 
 * ============================================================================
 * LORE:
 * "The blizzard does not rage. It does not fury. It simply covers,
 * and covers, and covers. Until nothing remains but white silence."
 * - The Northern Watch, Last Entry
 * 
 * Blizzard summons a localized snowstorm that batters the enemy with
 * ice and wind. The spell creates swirling flakes that cut like glass
 * and accumulate into drifts that impede movement.
 * 
 * Unlike single-target ice spells, Blizzard affects everything in its
 * area. The storm continues to rage for several moments after casting,
 * dealing damage over time while reducing visibility and mobility.
 * ============================================================================
 * 
 * @module cards/water/Blizzard
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Blizzard Card Class
 * 
 * An area damage over time card that hits multiple times.
 * 
 * @extends Card
 */
export class Blizzard extends Card {
    /**
     * Creates a new Blizzard card instance
     * 
     * @param {string} name - Card name (default: "Blizzard")
     * @param {number} cost - Mana cost (default: 6)
     * @param {number} damagePerTick - Damage per tick (default: 4)
     */
    constructor(name = "Blizzard", cost = 6, damagePerTick = 4) {
        // Define the effect object for this card
        const effect = {
            type: 'damage_over_time',
            target: 'enemy',
            value: damagePerTick,
            description: `Deal ${damagePerTick} damage × 3 ticks. 20% slow per tick.`,
            damagePerTick: damagePerTick,
            tickCount: 3,
            slowChance: 0.20,
            slowDuration: 1
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '❄️'            // Emoji - snowflake
        );

        // Blizzard-specific properties
        this.damagePerTick = damagePerTick;
        this.element = 'ice';
        this.isElemental = true;
        this.spellType = 'area_barrage';
        this.castTime = 'channeled';
        
        // Blizzard mechanics
        this.tickCount = 3;
        this.slowChance = 0.20;
        this.slowDuration = 1;
        this.totalDamage = damagePerTick * tickCount;

        console.log(`Blizzard card created: ${this.name} (${this.damagePerTick} × ${this.tickCount}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Blizzard card's effect
     * 
     * Unleashes a frozen storm that damages the enemy over multiple ticks.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Blizzard effect');
            return { success: false, reason: 'no_target' };
        }

        let totalDamage = 0;
        let slowApplied = false;

        console.log(`Blizzard summoned! ${this.tickCount} ticks incoming...`);

        // Apply each tick of damage
        for (let i = 0; i < this.tickCount; i++) {
            // Calculate damage for this tick with variance
            const variance = 0.8 + Math.random() * 0.4;
            let tickDamage = Math.floor(this.damagePerTick * variance);
            
            // Apply damage
            const newEnemyHp = gameState.enemyHp - tickDamage;
            gameState.updateEnemyHp(newEnemyHp);
            totalDamage += tickDamage;

            // Check for slow application (20% per tick)
            if (!slowApplied && Math.random() < this.slowChance) {
                slowApplied = true;
                console.log(`Blizzard tick ${i + 1}: ${tickDamage} damage - SLOW applied!`);
            } else {
                console.log(`Blizzard tick ${i + 1}: ${tickDamage} damage`);
            }

            // Stop if enemy is defeated
            if (gameState.enemyHp <= 0) {
                console.log(`Enemy defeated on tick ${i + 1}!`);
                break;
            }
        }

        gameState.lastDamageDealt = totalDamage;

        console.log(`Blizzard complete: ${totalDamage} total damage over ${this.tickCount} ticks${slowApplied ? ' + SLOW!' : ''}`);

        // Return result object
        return {
            success: true,
            message: `Blizzard rages for ${totalDamage} damage over ${this.tickCount} ticks${slowApplied ? ' and slows!' : ''}`,
            damage: totalDamage,
            healing: 0,
            statusEffects: slowApplied ? [{
                name: 'slow',
                duration: this.slowDuration,
                source: this.name
            }] : [],
            isCriticalHit: false,
            totalDamage: totalDamage,
            tickCount: this.tickCount,
            damagePerTick: this.damagePerTick,
            slowApplied: slowApplied,
            spellType: this.spellType
        };
    }

    /**
     * Gets the card's display name with Blizzard-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ❄️`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `${this.damagePerTick} × ${this.tickCount} | Total: ${this.totalDamage} | 20% Slow`;
    }
}
