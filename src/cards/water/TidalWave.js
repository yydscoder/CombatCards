/**
 * TidalWave Card - Devastating Water Assault
 * 
 * ============================================================================
 * LORE:
 * "The sea does not rage with anger. It simply is. And when it rises,
 * nothing stands before it. The wave cares not for your courage, your
 * prayers, or your steel. It simply takes."
 * - Survivor's Tale, The Great Deluge
 * 
 * TidalWave channels the unstoppable force of the ocean itself. The spell
 * conjures a massive wall of water that crashes down upon the battlefield
 * with the weight of an entire sea. Unlike focused water spells, TidalWave
 * relies on pure mass and momentum to overwhelm its target.
 * 
 * The spell requires significant mana and precise control. An improperly
 * cast TidalWave can flood the battlefield, hindering allies as much as
 * enemies. Master casters learn to shape the wave's crest, directing its
 * fury with surgical precision.
 * ============================================================================
 * 
 * @module cards/water/TidalWave
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * TidalWave Card Class
 * 
 * A high-cost water attack that deals massive damage.
 * Has a chance to knock back the enemy (skip their next attack).
 * 
 * @extends Card
 */
export class TidalWave extends Card {
    /**
     * Creates a new TidalWave card instance
     * 
     * @param {string} name - Card name (default: "TidalWave")
     * @param {number} cost - Mana cost (default: 8)
     * @param {number} damage - Base damage (default: 16)
     */
    constructor(name = "TidalWave", cost = 8, damage = 16) {
        // Define the effect object for this card
        const effect = {
            type: 'damage',
            target: 'enemy',
            value: damage,
            description: `Deals ${damage} damage. 30% chance to Stun (skip next turn)`,
            stunChance: 0.30,
            stunDuration: 1
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            '🌊'            // Emoji - wave
        );

        // TidalWave-specific properties
        this.damage = damage;
        this.element = 'water';
        this.isElemental = true;
        this.spellType = 'cataclysm';
        this.castTime = 'channeled';
        
        // Stun effect properties
        this.stunChance = 0.30;
        this.stunDuration = 1;

        console.log(`TidalWave card created: ${this.name} (Damage: ${this.damage}, Cost: ${this.cost})`);
    }

    /**
     * Executes the TidalWave card's effect
     * 
     * Unleashes a massive tidal wave that crashes into the enemy,
     * dealing heavy damage with a chance to stun.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate that a target is provided
        if (!target) {
            console.warn('No target provided for TidalWave effect');
            return { success: false, reason: 'no_target' };
        }

        // Calculate base damage
        let actualDamage = this.damage;
        
        // Check for critical hit (18% base chance for tidal wave)
        const isCriticalHit = Math.random() < 0.18;
        
        if (isCriticalHit) {
            actualDamage *= 1.5;
            gameState.isCriticalHit = true;
            console.log(`TidalWave Critical Hit! Damage multiplier: 1.5x`);
        } else {
            gameState.isCriticalHit = false;
        }

        // Apply random variation (±15% for more consistency on high-cost spell)
        const variation = 0.85 + Math.random() * 0.30;
        actualDamage = Math.floor(actualDamage * variation);

        // Apply damage to the target
        const newEnemyHp = gameState.enemyHp - actualDamage;
        gameState.updateEnemyHp(newEnemyHp);
        gameState.lastDamageDealt = actualDamage;

        // Check for Stun effect application
        const stunApplied = Math.random() < this.stunChance;
        let stunEffect = null;
        
        if (stunApplied) {
            stunEffect = {
                name: 'stun',
                duration: this.stunDuration,
                source: this.name,
                type: 'crowd_control',
                skipsTurn: true
            };
            
            // Add stun effect to enemy
            if (gameState.enemy && typeof gameState.enemy.addEffect === 'function') {
                gameState.enemy.addEffect(stunEffect);
            }
            
            console.log(`TidalWave Stun applied! Enemy skips next turn!`);
        }

        console.log(`TidalWave executed: ${this.name} dealt ${actualDamage} damage${stunApplied ? ' + STUN!' : ''}`);

        // Return result object
        return {
            success: true,
            message: `TidalWave crashed for ${actualDamage} damage${stunApplied ? ` and stunned the enemy!` : ''}`,
            damage: actualDamage,
            healing: 0,
            statusEffects: stunApplied ? [stunEffect] : [],
            isCriticalHit: isCriticalHit,
            stunApplied: stunApplied,
            stunDuration: this.stunDuration,
            spellType: this.spellType
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * TidalWave is most effective when the enemy has significant HP.
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
     * Gets the card's display name with TidalWave-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] 🌊`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with stun info
     */
    getStatsString() {
        return `DMG: ${this.damage} | Stun: ${this.stunChance * 100}%`;
    }
}
