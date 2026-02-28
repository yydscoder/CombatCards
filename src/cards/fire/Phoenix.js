/**
 * Phoenix Card - Rebirth of Flames
 * 
 * ============================================================================
 * LORE:
 * "From the ashes I rise, more brilliant than before. Such is the 
 * promise of the eternal flame."
 * - The Phoenix Oath, recited by fire mages at their ascension
 * 
 * The Phoenix is the most sacred creature of fire - an immortal bird
 * that cyclically regenerates by burning itself to ash and being reborn
 * from its own remains. Fire mages who master phoenix magic gain access
 * to powerful restoration and resurrection abilities.
 * 
 * Legends tell of the First Phoenix, born from the primordial fire that
 * ignited the world. Its tears are said to cure any ailment, and its
 * feathers grant protection against all manner of harm.
 * ============================================================================
 * 
 * @module cards/Phoenix
 */

// Import the base Card class
import { Card } from '../Card.js';

/**
 * Phoenix Card Class
 * 
 * A unique support card that provides healing to the player and
 * applies a powerful regeneration buff. At low health, can provide
 * a shield instead.
 * 
 * @extends Card
 */
export class Phoenix extends Card {
    /**
     * Creates a new Phoenix card instance
     * 
     * @param {string} name - Card name (default: "Phoenix")
     * @param {number} cost - Mana cost (default: 6)
     * @param {number} healAmount - Base healing amount (default: 15)
     */
    constructor(name = "Phoenix", cost = 6, healAmount = 15) {
        // Define the effect object for this card
        const effect = {
            type: 'heal_and_buff',
            target: 'self',
            value: healAmount,
            description: `Heal ${healAmount} HP. Gain regen 2 HP/turn for 3 turns.`,
            healAmount: healAmount,
            regenAmount: 2,
            regenDuration: 3,
            shieldAmount: 10,
            shieldThreshold: 0.30
        };

        // Call parent constructor with card properties
        super(
            name,           // Card name
            cost,           // Mana cost
            effect,         // Effect object
            'ðŸ¦…'            // Emoji - phoenix bird
        );

        // Phoenix-specific properties
        this.healAmount = healAmount;
        this.element = 'fire';
        this.isElemental = true;
        this.spellType = 'restoration';
        this.castTime = 'channeled';
        
        // Healing properties
        this.regenAmount = 2;
        this.regenDuration = 3;
        
        // Shield properties (alternative effect at low HP)
        this.shieldAmount = 10;
        this.shieldThreshold = 0.30; // Below 30% HP, get shield instead

        console.log(`Phoenix card created: ${this.name} (Heal: ${this.healAmount}, Cost: ${this.cost})`);
    }

    /**
     * Executes the Phoenix card's effect
     * 
     * Calls upon the spirit of the phoenix to heal wounds and
     * grant regeneration. If health is critically low, provides
     * a protective shield instead.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (self)
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Validate game state
        if (!gameState) {
            console.warn('No game state provided for Phoenix effect');
            return { success: false, reason: 'no_game_state' };
        }

        // Calculate health percentage
        const healthPercentage = gameState.playerHp / gameState.playerMaxHp;
        
        // Determine effect type based on current health
        const isLowHealth = healthPercentage <= this.shieldThreshold;
        
        let actualHeal = this.healAmount;
        let shieldApplied = false;
        let regenApplied = false;
        let shieldAmount = 0;

        if (isLowHealth) {
            // Emergency mode: provide shield instead of heal
            shieldAmount = this.shieldAmount;
            
            // Apply shield by increasing effective max HP temporarily
            // (simplified implementation - would need proper shield system)
            gameState.playerHp = Math.min(
                gameState.playerMaxHp, 
                gameState.playerHp + shieldAmount
            );
            
            shieldApplied = true;
            console.log(`Phoenix EMERGENCY: Shield of ${shieldAmount} HP applied!`);
        } else {
            // Normal mode: heal and apply regeneration
            actualHeal = Math.floor(this.healAmount * (0.9 + Math.random() * 0.2));
            
            // Apply healing to the player
            const newPlayerHp = gameState.playerHp + actualHeal;
            gameState.updatePlayerHp(newPlayerHp);
            
            // Create regeneration effect
            const regenEffect = {
                name: 'phoenix_regen',
                healingPerTurn: this.regenAmount,
                duration: this.regenDuration,
                source: this.name,
                type: 'regeneration'
            };
            
            // Add regen effect to player
            if (typeof gameState.addEffect === 'function') {
                gameState.addEffect(regenEffect);
            }
            
            regenApplied = true;
            console.log(`Phoenix healing: ${actualHeal} HP restored + ${this.regenAmount} HP/turn regen`);
        }

        // Update game state
        gameState.lastDamageDealt = 0;
        gameState.isCriticalHit = false;

        console.log(`Phoenix executed: ${isLowHealth ? 'Emergency Shield' : 'Healing'} effect applied`);

        // Return result object
        return {
            success: true,
            message: isLowHealth 
                ? `Phoenix grants emergency shield: ${shieldAmount} HP!`
                : `Phoenix heals for ${actualHeal} HP + ${this.regenAmount}/turn regen!`,
            damage: 0,
            healing: isLowHealth ? shieldAmount : actualHeal,
            statusEffects: regenApplied ? [{
                name: 'phoenix_regen',
                healingPerTurn: this.regenAmount,
                duration: this.regenDuration
            }] : [],
            isCriticalHit: false,
            healApplied: !isLowHealth,
            shieldApplied: isLowHealth,
            regenApplied: regenApplied,
            regenAmount: this.regenAmount,
            regenDuration: this.regenDuration,
            wasLowHealth: isLowHealth
        };
    }

    /**
     * Checks if the card can be played given the current game state
     * 
     * Phoenix is most valuable when the player needs healing.
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

        // Phoenix can only be played if player is not at full health
        // (no point healing when already full)
        const needsHealing = gameState.playerHp < gameState.playerMaxHp;

        return hasEnoughMana && isInHand && isNotOnCooldown && needsHealing;
    }

    /**
     * Gets the card's display name with phoenix-specific information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana] ðŸ¦…`;
    }

    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string with heal/regen info
     */
    getStatsString() {
        return `Heal: ${this.healAmount} | Regen: ${this.regenAmount}x${this.regenDuration}`;
    }
}
