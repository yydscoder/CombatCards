/**
 * Pyroclasm Card - Cataclysmic Eruption
 * 
 * ============================================================================
 * LORE:
 * "The mage stood at the crater's edge and spoke the forbidden words.
 * The mountain answered. What emerged was not fire, but vengeance made
 * manifest - the wrath of the earth itself, burning with hatred."
 * - The Last Witness, Account of Mount Pyros Destruction
 * 
 * Pyroclasm is the ultimate sacrifice spell, channeling the caster's
 * own life force into a devastating eruption of volcanic energy. The
 * spell tears open the boundary between the material plane and the
 * primordial fires at the world's core.
 * 
 * Historically, pyroclasm has been used as a weapon of last resort.
 * Entire armies have been vaporized in its green-tinged flames. The
 * survivors speak of the sound - a deafening roar that drowns out
 * all other noise, followed by an eerie silence.
 * 
 * The spell is named for the pyroclastic flows that follow volcanic
 * eruptions, though true pyroclasm far exceeds any natural phenomenon.
 * ============================================================================
 * 
 * @module cards/Pyroclasm
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Pyroclasm Card Class
 * 
 * A high-risk card that sacrifices player HP to deal massive damage.
 * The lower the player's HP, the higher the damage multiplier.
 * 
 * @extends Card
 */
export class Pyroclasm extends Card {
    /**
     * Creates a new Pyroclasm card instance
     * 
     * @param {string} name - Card name (default: "Pyroclasm")
     * @param {number} cost - Mana cost (default: 6)
     * @param {number} baseDamage - Base damage (default: 15)
     */
    constructor(name = "Pyroclasm", cost = 6, baseDamage = 15) {
        // Define the effect object for this card
        const effect = {
            type: 'sacrifice_damage',
            target: 'enemy',
            value: baseDamage,
            description: `Sacrifice 10 HP. Deal ${baseDamage} damage, doubled for each 50% HP missing`,
            hpSacrifice: 10,
            lowHealthMultiplier: 2.0,
            healthThreshold: 0.50
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '☄️'            // Emoji - comet/volcanic eruption
        );

        // Pyroclasm-specific properties
        this.baseDamage = baseDamage;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'sacrifice';
        this.castTime = 'channeled';
        
        // Sacrifice mechanics
        this.hpSacrifice = 10;
        this.lowHealthMultiplier = 2.0;
        this.healthThreshold = 0.50;

        console.log(`Pyroclasm card created: ${this.name} (Base: ${this.baseDamage}, Sacrifice: ${this.hpSacrifice} HP)`);
    }

    /**
     * Calculates damage multiplier based on missing HP
     * 
     * @param {Object} gameState - The current game state object
     * @returns {Object} Multiplier calculation result
     */
    calculateMultiplier(gameState) {
        const hpPercent = gameState.playerHp / gameState.playerMaxHp;
        const missingPercent = 1 - hpPercent;
        
        // Calculate multiplier: 1x at full health, 2x at 50%, 3x at 25%, etc.
        let multiplier = 1 + Math.floor(missingPercent / this.healthThreshold);
        
        return {
            hpPercent: hpPercent,
            missingPercent: missingPercent,
            multiplier: multiplier,
            thresholds: Math.floor(missingPercent / this.healthThreshold)
        };
    }

    /**
     * Executes the Pyroclasm card's effect
     * 
     * Sacrifices player HP to unleash a cataclysmic eruption.
     * Damage scales based on how much HP the player is missing.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Pyroclasm effect');
            return { success: false, reason: 'no_target' };
        }

        // Check if player has enough HP to sacrifice
        if (gameState.playerHp <= this.hpSacrifice) {
            console.warn('Player does not have enough HP to cast Pyroclasm');
            return { 
                success: false, 
                reason: 'insufficient_hp',
                message: `Need more than ${this.hpSacrifice} HP to cast Pyroclasm`
            };
        }

        // Sacrifice HP
        const newPlayerHp = gameState.playerHp - this.hpSacrifice;
        gameState.updatePlayerHp(newPlayerHp);
        console.log(`Pyroclasm sacrifice: ${this.hpSacrifice} HP sacrificed`);

        // Calculate damage multiplier based on missing HP
        const multCalc = this.calculateMultiplier(gameState);
        let actualDamage = this.baseDamage * multCalc.multiplier;

        console.log(
            `Pyroclasm multiplier: ${multCalc.multiplier}x ` +
            `(HP: ${Math.round(multCalc.hpPercent * 100)}%, Missing: ${Math.round(multCalc.missingPercent * 100)}%)`
        );

        // Apply random variation (Â±15%)
        const variance = 0.85 + Math.random() * 0.30;
        actualDamage = Math.floor(actualDamage * variance);

        // Check for critical hit (20% chance - pyroclasm is volatile)
        const isCriticalHit = Math.random() < 0.20;
        if (isCriticalHit) {
            actualDamage = Math.floor(actualDamage * 1.5);
            gameState.isCriticalHit = true;
            console.log(`PYROCLASM CRITICAL! Volatile eruption - 1.5x multiplier!`);
        } else {
            gameState.isCriticalHit = false;
        }

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        console.log(
            `PYROCLASM ERUPTION: ${actualDamage} damage ` +
            `(Base: ${this.baseDamage} Ã— ${multCalc.multiplier} multiplier)` +
            `${isCriticalHit ? ' [CRIT!]' : ''}`
        );

        // Return result object
        return {
            success: true,
            message: `PYROCLASM! ${actualDamage} damage at the cost of ${this.hpSacrifice} HP!`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [],
            isCriticalHit: isCriticalHit,
            hpSacrificed: this.hpSacrifice,
            baseDamage: this.baseDamage,
            damageMultiplier: multCalc.multiplier,
            playerHpPercent: multCalc.hpPercent,
            playerHpMissing: multCalc.missingPercent,
            spellType: this.spellType
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * Pyroclasm requires the player to have enough HP to survive
     * the sacrifice.
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

        // Player must have more HP than the sacrifice amount
        const hasEnoughHp = gameState.playerHp > this.hpSacrifice;

        // Valid target check
        const hasTarget = gameState.enemyHp > 0;

        return hasEnoughMana && isInHand && isNotOnCooldown && hasEnoughHp && hasTarget;
    }

    /**
     * Gets the card's display name with Pyroclasm-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] â˜„ï¸`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with sacrifice info
     */
    getStatsString() {
        return `DMG: ${this.baseDamage} | Sacrifice: ${this.hpSacrifice} HP | 2x at <50%`;
    }
}
