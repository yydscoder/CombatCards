/**
 * SolarBeam Card - Focused Sunlight
 * 
 * ============================================================================
 * LORE:
 * "The sun gives life. The sun takes it away. It is the great giver and
 * the great taker. To channel the solar beam is to ask the sun to look
 * upon your enemy with its full, unforgiving gaze."
 * - The Sun Callers, Prayers of the Solstice
 * 
 * SolarBeam focuses sunlight into a searing beam of pure radiant energy.
 * The spell requires clear skies or strong artificial light to reach its
 * full potential, but even in dim conditions the concentrated light can
 * burn through flesh and bone.
 * 
 * Paladins and nature priests favor this spell for its purity - it is
 * literally the light of heaven weaponized against the forces of darkness.
 * ============================================================================
 * 
 * @module cards/nature/SolarBeam
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * SolarBeam Card Class
 * 
 * A high-damage nature attack that's stronger against certain enemies.
 * 
 * @extends Card
 */
export class SolarBeam extends Card {
    /**
     * Creates a new SolarBeam card instance
     * 
     * @param {string} name - Card name (default: "SolarBeam")
     * @param {number} cost - Mana cost (default: 7)
     * @param {number} damage - Base damage (default: 14)
     */
    constructor(name = "SolarBeam", cost = 7, damage = 14) {
        // Define the effect object for this card
        const effect = {
            type: 'damage',
            target: 'enemy',
            value: damage,
            description: `Deals ${damage} damage. 2× damage vs undead/dark enemies.`,
            undeadMultiplier: 2.0,
            critChance: 0.20
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '☀️'            // Emoji - sun with face
        );

        // SolarBeam-specific properties
        this.damage = damage;
        this.element = 'nature';
        this.isElemental = true;
        this.spellType = 'projectile';
        this.castTime = 'channeled';
        
        // Damage mechanics
        this.undeadMultiplier = 2.0;
        this.critChance = 0.20;

        console.log(`SolarBeam card created: ${this.name} (Damage: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the SolarBeam card's effect
     * 
     * Fires a beam of concentrated sunlight at the enemy.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for SolarBeam effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate base damage
        let actualDamage = this.damage;
        
        // Check for undead/dark enemy (double damage)
        const enemyName = gameState.enemy?.name?.toLowerCase() || '';
        const isUndead = ['undead', 'skeleton', 'zombie', 'ghost', 'wraith', 'dark'].some(
            word => enemyName.includes(word)
        );
        
        if (isUndead) {
            actualDamage *= this.undeadMultiplier;
            console.log(`SolarBeam vs undead! 2× damage multiplier!`);
        }

        // Check for critical hit
        const isCriticalHit = Math.random() < this.critChance;
        if (isCriticalHit) {
            actualDamage *= 1.5;
            gameState.isCriticalHit = true;
            console.log(`SolarBeam Critical Hit! 1.5x damage!`);
        } else {
            gameState.isCriticalHit = false;
        }

        // Apply random variation (±15%)
        const variation = 0.85 + Math.random() * 0.30;
        actualDamage = Math.floor(actualDamage * variation);

        // Apply damage
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        console.log(
            `SolarBeam fired: ${actualDamage} damage${isUndead ? ' (vs undead!)' : ''}` +
            `${isCriticalHit ? ' (CRIT!)' : ''}`
        );

        // Return result object
        return {
            success: true,
            message: `SolarBeam scorches the enemy for ${actualDamage} damage!`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [],
            isCriticalHit: isCriticalHit,
            vsUndead: isUndead,
            undeadMultiplier: this.undeadMultiplier,
            critChance: this.critChance,
            spellType: this.spellType
        };
    }

    /**
     * Gets the card's display name
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ☀️`;
    }

    /**
     * Gets the card's stats as a string
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `DMG: ${this.damage} | 2× vs Undead | ${this.critChance * 100}% Crit`;
    }
}
