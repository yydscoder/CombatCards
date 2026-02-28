/**
 * Scorch Card - Eternal Burning
 * 
 * ============================================================================
 * LORE:
 * "The land bore the scars of scorch for a thousand years. No crop 
 * would grow, no water would stay clean. Such is the wrath of fire unbound."
 * - The Scorched Earth Chronicles
 * 
 * Scorch is a malicious spell designed to permanently weaken the target
 * by searing away their natural defenses. The intense heat causes armor
 * to warp, scales to crack, and magical barriers to destabilize.
 * 
 * Unlike other fire spells that deal immediate damage, scorch focuses on
 * long-term degradation. Each cast leaves an indelible mark that cannot
 * be healed or restored through normal means.
 * 
 * Warriors who have survived scorch often bear twisted, burn-scarred
 * armor for the rest of their days - a testament to the spell's
 * enduring malice.
 * ============================================================================
 * 
 * @module cards/Scorch
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Scorch Card Class
 * 
 * A debuff card that permanently reduces the enemy's defense stat,
 * making them vulnerable to all subsequent attacks. Also deals
 * minor initial damage.
 * 
 * @extends Card
 */
export class Scorch extends Card {
    /**
     * Creates a new Scorch card instance
     * 
     * @param {string} name - Card name (default: "Scorch")
     * @param {number} cost - Mana cost (default: 4)
     * @param {number} damage - Base damage (default: 5)
     */
    constructor(name = "Scorch", cost = 4, damage = 5) {
        // Define the effect object for this card
        const effect = {
            type: 'debuff',
            target: 'enemy',
            value: damage,
            description: `Deal ${damage} damage. Permanently reduce enemy DEF by 5.`,
            defenseReduction: 5,
            isPermanent: true,
            maxStacks: 10
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🔥'            // Emoji - fire (scorching flame)
        );

        // Scorch-specific properties
        this.damage = damage;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'debuff';
        this.castTime = 'instant';
        
        // Debuff mechanics
        this.defenseReduction = 5;
        this.isPermanent = true;
        this.maxStacks = 10; // Can stack up to 10 times

        console.log(`Scorch card created: ${this.name} (DEF Reduction: ${this.defenseReduction}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Scorch card's effect
     * 
     * Searing flames damage the enemy and permanently reduce their
     * defense stat, making them more vulnerable to future attacks.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for Scorch effect');
            return { success: false, reason: 'no_target' };
        }

        // Apply initial damage
        let actualDamage = this.damage;
        
        // Small variance on damage (Â±15%)
        const variance = 0.85 + Math.random() * 0.30;
        actualDamage = Math.floor(actualDamage * variance);

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        // Apply permanent defense reduction
        let defenseReduced = this.defenseReduction;
        
        if (gameState.enemy && typeof gameState.enemy.updateState === 'function') {
            // Get current defense
            const currentDefense = gameState.enemy.defense || 0;
            
            // Calculate new defense (minimum 0)
            const newDefense = Math.max(0, currentDefense - this.defenseReduction);
            
            // Track how much was actually reduced
            defenseReduced = currentDefense - newDefense;
            
            // Update enemy defense permanently
            gameState.enemy.updateState({ defense: newDefense });
            
            // Track scorch stacks on the enemy
            if (!gameState.enemy.scorchStacks) {
                gameState.enemy.scorchStacks = 0;
            }
            gameState.enemy.scorchStacks++;
            
            console.log(
                `SCORCH applied! Defense reduced by ${defenseReduced} ` +
                `(now ${newDefense}). Total scorch stacks: ${gameState.enemy.scorchStacks}/${this.maxStacks}`
            );
        }

        console.log(
            `Scorch executed: ${actualDamage} damage + ${defenseReduced} permanent DEF reduction`
        );

        // Return result object
        return {
            success: true,
            message: `Scorch seared the enemy! ${actualDamage} damage, -${defenseReduced} DEF permanently`,
            damage: actualDamage,
            healing: 0,
            statusEffects: [{
                name: 'scorch_debuff',
                defenseReduction: defenseReduced,
                isPermanent: true,
                stacks: gameState.enemy?.scorchStacks || 1
            }],
            isCriticalHit: false,
            defenseReduced: defenseReduced,
            isPermanent: this.isPermanent,
            remainingDefense: gameState.enemy?.defense || 0,
            scorchStacks: gameState.enemy?.scorchStacks || 1,
            maxStacks: this.maxStacks
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * Scorch is most valuable early in combat to maximize the benefit
     * of reduced defense.
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

        // Check if enemy still has defense to reduce
        const enemyHasDefense = (gameState.enemy?.defense || 0) > 0;
        
        // Or if enemy hasn't reached max scorch stacks
        const canStackMore = (gameState.enemy?.scorchStacks || 0) < this.maxStacks;

        // Can still play even if defense is 0 (for the damage)
        const hasValidTarget = gameState.enemyHp > 0;

        return hasEnoughMana && isInHand && isNotOnCooldown && hasValidTarget;
    }

    /**
     * Gets the card's display name with Scorch-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ðŸ”¥`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with debuff info
     */
    getStatsString() {
        return `DMG: ${this.damage} | -${this.defenseReduction} DEF | Max: ${this.maxStacks}x`;
    }
}
