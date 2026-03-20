/**
 * Ghost Enemy Implementation for Emoji Card Battle
 *
 * This class extends the base Enemy class to implement a ghost enemy.
 * Ghosts are evasive enemies with special abilities like phasing and fear which skips your turn. 
 * They use a hybrid AI that balances between aggression and evasion. These guys are meant to be very annoying. 
 *
 * Ghost characteristics:
 * - Low HP but high evasion
 * - Can phase (avoid attacks) temporarily
 * - Inflicts fear debuff on players
 * - Uses hybrid AI behavior
 */

// Import the base Enemy class
import { Enemy } from './Enemy.js';

/**
 * Creates a new Ghost instance
 *
 * @param {string} name - The name of the ghost (default: "Ghost Wraith")
 * @param {number} maxHp - The maximum health points (default: 55)
 * @param {number} attack - The attack power (default: 15)
 */
export class Ghost extends Enemy {
    constructor(name = "Ghost Wraith", maxHp = 55, attack = 15) {
        // Define ghost stats - evasive but fragile
        const stats = {
            defense: 3,       // Low defense (relies on evasion)
            speed: 1.3,       // High speed - floats quickly
            aggression: 0.6,  // Moderate aggression
              intelligence: 0.9, // High intelligence - uses tricks
              attackInterval: 3  // Attacks every 3 turns
        };

        // Call parent constructor with ghost properties
        super(
            name,           // Enemy name
            maxHp,          // Maximum HP
            attack,         // Attack power
            '👻',           // Emoji representation (ghost)
            stats           // Additional stats
        );

        // Ghost-specific properties
        this.type = 'ghost';
        this.isEthereal = true;
        this.isPhasing = false;
        this.phaseChance = 0.35; // 35% base phase chance
        this.phaseCooldown = 0;
        this.fearApplied = false;
        this.attackFrequency = 0.65; // 65% chance to attack - unpredictable
        
        // Ghost AI state
        this.aiState = 'normal'; // 'normal', 'evasive', 'haunting'
        this.turnCount = 0;

        console.log(`Ghost created: ${this.name} (HP: ${this.maxHp}, Attack: ${this.attackPower})`);
    }

    /**
     * Decides and performs the ghost's action
     *
     * @param {Object} gameState - The current game state object
     * @returns {Object} Result object containing action details
     */
    performAction(gameState) {
        const player = gameState?.player;
        
        if (!player) {
            return { success: false, reason: 'no_player_target' };
        }

        this.turnCount++;

        // Update AI state based on HP and turn
        this.updateAIState();

        // Ghosts are ethereal - may phase instead of attacking (35% chance)
        if (Math.random() > this.attackFrequency) {
            if (this.phaseCooldown <= 0 && Math.random() < 0.5) {
                return this.executePhase({ target: 'self' }, player, gameState);
            } else if (!this.fearApplied) {
                return this.executeFear({ target: 'player' }, player, gameState);
            } else {
                console.log(`${this.name} drifts ominously...`);
                return {
                    success: true,
                    action: 'skip',
                    message: `${this.name} is gathering ectoplasmic energy!`
                };
            }
        }

        // Decide action based on AI state
        const decision = this.decideAction(player, gameState);

        // Execute the decided action
        switch (decision.action) {
            case 'attack':
                return this.executeAttack(decision, player, gameState);
            case 'phase':
                return this.executePhase(decision, player, gameState);
            case 'fear':
                return this.executeFear(decision, player, gameState);
            case 'drain':
                return this.executeDrain(decision, player, gameState);
            case 'stunned':
                return { success: false, reason: 'stunned', action: 'stunned' };
            default:
                return { success: false, reason: 'no_action', action: 'none' };
        }
    }

    /**
     * Updates the AI state based on conditions
     */
    updateAIState() {
        const hpPercent = this.hp / this.maxHp;

        if (hpPercent <= 0.3) {
            this.aiState = 'haunting'; // Desperate mode
        } else if (hpPercent <= 0.6) {
            this.aiState = 'evasive'; // Defensive mode
        } else {
            this.aiState = 'normal'; // Standard mode
        }
    }

    /**
     * Decides action based on AI state
     *
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Action decision
     */
    decideAction(player, gameState) {
        if (!this.isAlive || this.isStunned) {
            return { action: 'stunned', reason: this.isStunned ? 'stunned' : 'dead' };
        }

        const roll = Math.random();

        switch (this.aiState) {
            case 'normal':
                // 50% attack, 25% phase, 25% fear
                if (roll < 0.5) {
                    return { action: 'attack', target: 'player' };
                } else if (roll < 0.75 && this.phaseCooldown <= 0) {
                    return { action: 'phase', target: 'self' };
                } else if (!this.fearApplied) {
                    return { action: 'fear', target: 'player' };
                } else {
                    return { action: 'attack', target: 'player' };
                }

            case 'evasive':
                // 30% attack, 50% phase, 20% drain
                if (roll < 0.3) {
                    return { action: 'attack', target: 'player' };
                } else if (roll < 0.8 && this.phaseCooldown <= 0) {
                    return { action: 'phase', target: 'self' };
                } else {
                    return { action: 'drain', target: 'player' };
                }

            case 'haunting':
                // 60% drain, 40% desperate attack
                if (roll < 0.6) {
                    return { action: 'drain', target: 'player' };
                } else {
                    return { action: 'attack', isDesperate: true, target: 'player' };
                }

            default:
                return { action: 'attack', target: 'player' };
        }
    }

    /**
     * Executes a standard attack
     *
     * @param {Object} decision - The AI decision object
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Attack result
     */
    executeAttack(decision, player, gameState) {
        let damage = this.attackPower;

        // Desperate attacks do more damage
        if (decision.isDesperate) {
            damage = Math.floor(damage * 1.4);
            console.log(`${this.name} launches a DESPERATE haunt for ${damage} damage!`);
        } else {
            // Add variation
            const variation = damage * (0.8 + Math.random() * 0.4);
            damage = Math.floor(variation);
            console.log(`${this.name} haunts for ${damage} damage`);
        }

        // Apply damage to player
        const result = player.takeDamage?.(damage, { isCriticalHit: decision.isDesperate }) || {
            success: true,
            damageTaken: damage
        };

        return {
            success: true,
            action: 'attack',
            damage: damage,
            isDesperate: decision.isDesperate || false,
            target: 'player',
            ...result
        };
    }

    /**
     * Executes a phase action (becomes ethereal)
     *
     * @param {Object} decision - The AI decision object
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Phase result
     */
    executePhase(decision, player, gameState) {
        this.isPhasing = true;
        this.phaseCooldown = 4; // 4 turn cooldown
        this.phaseDuration = 2; // Lasts 2 turns

        console.log(`${this.name} phases out of reality, becoming ethereal!`);

        return {
            success: true,
            action: 'phase',
            isPhasing: true,
            duration: this.phaseDuration,
            cooldown: this.phaseCooldown,
            target: 'self',
            message: `${this.name} becomes ethereal and harder to hit!`
        };
    }

    /**
     * Executes a fear action (debilitates player)
     *
     * @param {Object} decision - The AI decision object
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Fear result
     */
    executeFear(decision, player, gameState) {
        this.fearApplied = true;
        const fearDuration = 3;
        const attackDebuff = 0.7; // 30% reduced attack

        console.log(`${this.name} unleashes a terrifying wail! Player fears it for ${fearDuration} turns`);

        // Apply fear to player (would be handled by game state)
        const fearEffect = {
            type: 'fear',
            duration: fearDuration,
            attackMultiplier: attackDebuff,
            turnsRemaining: fearDuration
        };

        return {
            success: true,
            action: 'fear',
            fearEffect: fearEffect,
            duration: fearDuration,
            target: 'player',
            message: `${this.name} terrifies the player!`
        };
    }

    /**
     * Executes a life drain action (heals ghost, damages player)
     *
     * @param {Object} decision - The AI decision object
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Drain result
     */
    executeDrain(decision, player, gameState) {
        const drainAmount = Math.floor(this.attackPower * 0.8);
        
        console.log(`${this.name} drains ${drainAmount} life from the player!`);

        // Damage player
        const damageResult = player.takeDamage?.(drainAmount, { isCriticalHit: false }) || {
            success: true,
            damageTaken: drainAmount
        };

        // Heal ghost
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + Math.floor(drainAmount * 0.5));
        const actualHeal = this.hp - oldHp;

        console.log(`${this.name} heals for ${actualHeal} HP (${oldHp} → ${this.hp})`);

        return {
            success: true,
            action: 'drain',
            damage: drainAmount,
            healAmount: actualHeal,
            target: 'player',
            ...damageResult
        };
    }

    /**
     * Takes damage, considering phase state
     *
     * @param {number} damage - The raw damage amount
     * @param {Object} attackInfo - Attack information
     * @returns {Object} Result object
     */
    takeDamage(damage, attackInfo = {}) {
        // Check for phase evasion
        if (this.isPhasing && Math.random() < this.phaseChance) {
            console.log(`${this.name} phases through the attack, taking no damage!`);
            return {
                success: true,
                damageTaken: 0,
                remainingHp: this.hp,
                isDead: false,
                wasPhased: true,
                message: 'Attack phased through!'
            };
        }

        // Call parent takeDamage
        const result = super.takeDamage(damage, attackInfo, gameState);

        // Reduce phase duration
        if (this.isPhasing) {
            this.phaseDuration--;
            if (this.phaseDuration <= 0) {
                this.isPhasing = false;
                console.log(`${this.name} returns to physical form`);
            }
        }

        // Reduce cooldown
        if (this.phaseCooldown > 0) {
            this.phaseCooldown--;
        }

        return result;
    }

    /**
     * Gets the enemy's display name with ghost-specific information
     *
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        const phaseStatus = this.isPhasing ? ' [ETHEREAL]' : '';
        const fearStatus = this.fearApplied ? ' [😨]' : '';
        const aiStatus = this.aiState !== 'normal' ? ` [${this.aiState.toUpperCase()}]` : '';
        return `${this.name} [${this.hp}/${this.maxHp} HP] 👻${phaseStatus}${fearStatus}${aiStatus}`;
    }

    /**
     * Gets the enemy's stats as a string for display
     *
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        const phaseInfo = this.isPhasing ? ` | Phase: ${this.phaseDuration} turns` : '';
        const cooldownInfo = this.phaseCooldown > 0 ? ` (CD: ${this.phaseCooldown})` : '';
        return `Attack: ${this.attackPower} | Defense: ${this.defense} | Phase: ${Math.floor(this.phaseChance * 100)}%${phaseInfo}${cooldownInfo}`;
    }

    /**
     * Resets the ghost to its initial state
     */
    reset() {
        super.reset();
        this.isPhasing = false;
        this.phaseCooldown = 0;
        this.phaseDuration = 0;
        this.fearApplied = false;
        this.aiState = 'normal';
        this.turnCount = 0;
        console.log(`Ghost reset: ${this.name}`);
    }
}

/**
 * Factory function to create a Ghost instance
 *
 * @param {string} name - Custom name (optional)
 * @param {number} maxHp - Custom max HP (optional)
 * @param {number} attack - Custom attack (optional)
 * @returns {Ghost} New Ghost instance
 */
export function createGhost(name, maxHp, attack) {
    return new Ghost(name, maxHp, attack);
}
