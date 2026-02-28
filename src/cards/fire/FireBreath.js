/**
 * FireBreath Card - Draconic Fury
 * 
 * ============================================================================
 * LORE:
 * "The dragon opened its maw, and the world ended in fire. Not the fire
 * of torches or hearths, but the primordial flame that birthed the stars.
 * In that moment, we understood - we were never the hunters. We were prey."
 * - Last Entry, Scout's Journal
 * 
 * FireBreath channels the ancient power of dragons, allowing the caster
 * to exhale a cone of devastating flame. The spell temporarily transforms
 * the mage's respiratory system into a living inferno, drawing heat from
 * the elemental plane with each inhalation.
 * 
 * Unlike targeted fire spells, breath attacks cover a wide area, hitting
 * everything in front of the caster. This makes the spell both powerful
 * and dangerous - allies caught in the cone suffer the same fate as
 * enemies.
 * 
 * The dragonborn mages of the Crimson Scale order perfected this technique
 * over centuries. They say the first dragon breath spell was learned not
 * through study, but by being swallowed alive and surviving.
 * ============================================================================
 * 
 * @module cards/FireBreath
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * FireBreath Card Class
 * 
 * A cone attack that deals damage in a wide arc. Has a chance to
 * hit multiple times or apply a burning effect. Simulates a dragon's
 * breath weapon.
 * 
 * @extends Card
 */
export class FireBreath extends Card {
    /**
     * Creates a new FireBreath card instance
     * 
     * @param {string} name - Card name (default: "FireBreath")
     * @param {number} cost - Mana cost (default: 6)
     * @param {number} damage - Base damage (default: 10)
     */
    constructor(name = "FireBreath", cost = 6, damage = 10) {
        // Define the effect object for this card
        const effect = {
            type: 'cone_attack',
            target: 'enemy',
            value: damage,
            description: `Deal ${damage}-${damage * 2} damage. 40% chance to burn. Wide cone.`,
            minDamage: damage,
            maxDamage: damage * 2,
            burnChance: 0.40,
            burnDamage: 4,
            burnDuration: 2,
            coneWidth: 'wide'
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            'ðŸ‰'            // Emoji - dragon face
        );

        // FireBreath-specific properties
        this.damage = damage;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'cone_attack';
        this.castTime = 'instant';
        
        // Cone attack mechanics
        this.minDamage = damage;
        this.maxDamage = damage * 2;
        this.burnChance = 0.40;
        this.burnDamage = 4;
        this.burnDuration = 2;
        this.coneWidth = 'wide';

        console.log(`FireBreath card created: ${this.name} (DMG: ${this.minDamage}-${this.maxDamage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the FireBreath card's effect
     * 
     * Unleashes a cone of draconic fire that deals variable damage
     * and has a high chance to burn the target.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for FireBreath effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate damage within the cone range
        const damageRange = this.maxDamage - this.minDamage;
        let actualDamage = this.minDamage + Math.floor(Math.random() * (damageRange + 1));

        // Check for critical hit (dragon breath is volatile - 20% crit)
        const isCriticalHit = Math.random() < 0.20;
        if (isCriticalHit) {
            actualDamage = Math.floor(actualDamage * 1.5);
            gameState.isCriticalHit = true;
            console.log(`FIRE BREATH CRITICAL! Draconic fury intensifies!`);
        } else {
            gameState.isCriticalHit = false;
        }

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        // Check for burn effect application (40% chance)
        const burnApplied = Math.random() < this.burnChance;
        let burnEffect = null;
        
        if (burnApplied) {
            burnEffect = {
                name: 'dragon_burn',
                damagePerTurn: this.burnDamage,
                duration: this.burnDuration,
                source: this.name,
                type: 'burn',
                isDragonFire: true // Dragon fire burns hotter
            };
            
            // Add burn effect to enemy
            if (gameState.enemy && typeof gameState.enemy.addEffect === 'function') {
                gameState.enemy.addEffect(burnEffect);
            }
            
            console.log(`Dragon fire burn applied! ${this.burnDamage} damage/turn for ${this.burnDuration} turns`);
        }

        // Visual description based on damage dealt
        let breathDescription = this.getBreathDescription(actualDamage);
        console.log(`FireBreath unleashed: ${breathDescription}`);

        console.log(
            `FireBreath executed: ${actualDamage} damage${isCriticalHit ? ' (CRIT!)' : ''}` +
            `${burnApplied ? ' + DRAGON BURN!' : ''}`
        );

        // Return result object
        return {
            success: true,
            message: `Dragon's breath engulfs the enemy for ${actualDamage} damage${burnApplied ? ' and burns!' : ''}`,
            damage: actualDamage,
            healing: 0,
            statusEffects: burnApplied ? [burnEffect] : [],
            isCriticalHit: isCriticalHit,
            burnApplied: burnApplied,
            burnDamage: burnApplied ? this.burnDamage : 0,
            burnDuration: this.burnDuration,
            coneWidth: this.coneWidth,
            damageRange: { min: this.minDamage, max: this.maxDamage },
            spellType: this.spellType,
            breathDescription: breathDescription
        };
    }

    /**
     * Gets a flavor description based on damage dealt
     * 
     * @param {number} damage - The damage dealt
     * @returns {string} Flavor text description
     */
    getBreathDescription(damage) {
        const avgDamage = (this.minDamage + this.maxDamage) / 2;
        
        if (damage >= this.maxDamage * 0.9) {
            return "A torrent of white-hot dragon fire incinerates everything!";
        } else if (damage >= avgDamage) {
            return "Scorching flames erupt from draconic maw!";
        } else if (damage >= this.minDamage) {
            return "A cone of fire blasts forth, searing the target!";
        } else {
            return "A burst of flame shoots from your lips!";
        }
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * FireBreath is a solid mid-game card with reliable damage.
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
     * Gets the card's display name with FireBreath-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ðŸ‰`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with cone attack info
     */
    getStatsString() {
        return `DMG: ${this.minDamage}-${this.maxDamage} | Burn: ${this.burnChance * 100}% | Cone`;
    }
}
