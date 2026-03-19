/**
 * Orc Enemy Implementation for Emoji Card Battle
 *
 * This class extends the base Enemy class to implement an orc enemy.
 * Orcs are heavy hitters that can buff themselves before attacking.
 * They are strong, durable, and tactical fighters.
 *
 * Orc characteristics:
 * - High HP and attack power
 * - Can buff attack power before striking
 * - Uses mixed AI (AggressiveAI with buff capability)
 * - Slower but more powerful than goblins
 */

// Import the base Enemy class
import { Enemy } from './Enemy.js';
// Import AggressiveAI for behavior
import { AggressiveAI, createAggressiveAI } from '../ai/AggressiveAI.js';

/**
 * Creates a new Orc instance
 *
 * @param {string} name - The name of the orc (default: "Orc Warrior")
 * @param {number} maxHp - The maximum health points (default: 100)
 * @param {number} attack - The attack power (default: 18)
 */
export class Orc extends Enemy {
    constructor(name = "Orc Warrior", maxHp = 100, attack = 18) {
        // Define orc stats - strong and tough
        const stats = {
            defense: 8,       // Good defense
            speed: 0.7,       // Slow but powerful
            aggression: 0.7,  // Moderately aggressive
            intelligence: 0.6 // Tactical fighter
        };

        // Call parent constructor with orc properties
        super(
            name,           // Enemy name
            maxHp,          // Maximum HP
            attack,         // Attack power
            '👹',           // Emoji representation (ogre/orc face)
            stats           // Additional stats
        );

        // Orc-specific properties
        this.type = 'orc';
        this.isBrutal = true;
        this.buffStacks = 0;
        this.maxBuffStacks = 3;
        this.attackFrequency = 0.7; // 70% chance to attack - slower, telegraphs attacks
        this.isCharging = false;
        this.chargeTurns = 0;
        
        // Initialize AI with moderate aggression (allows buffing)
        this.ai = createAggressiveAI({
            attackChance: 0.75,      // 75% chance to attack (25% for buffs)
            rageThreshold: 0.25,     // Enters rage at 25% HP
            rageMultiplier: 1.6      // 1.6x damage when enraged
        });

        console.log(`Orc created: ${this.name} (HP: ${this.maxHp}, Attack: ${this.attackPower})`);
    }

    /**
     * Decides and performs the orc's action
     *
     * @param {Object} gameState - The current game state object
     * @returns {Object} Result object containing action details
     */
    performAction(gameState) {
        const player = gameState?.player;
        
        if (!player) {
            return { success: false, reason: 'no_player_target' };
        }

        // Handle charging state
        if (this.isCharging) {
            this.chargeTurns--;
            if (this.chargeTurns <= 0) {
                this.isCharging = false;
                console.log(`${this.name} finishes charging!`);
            } else {
                console.log(`${this.name} is charging... (${this.chargeTurns} turns left)`);
                return {
                    success: true,
                    action: 'charging',
                    chargeTurns: this.chargeTurns,
                    message: `${this.name} is gathering strength!`
                };
            }
        }

        // Orcs are slower - may skip turn to prepare (30% chance)
        if (Math.random() > this.attackFrequency) {
            // 50% chance to charge, 50% to buff
            if (Math.random() < 0.5 && this.buffStacks < this.maxBuffStacks) {
                return this.executeBuff(player, gameState);
            } else {
                // Telegraph a big attack
                this.isCharging = true;
                this.chargeTurns = 2;
                console.log(`${this.name} is preparing a powerful strike!`);
                return {
                    success: true,
                    action: 'telegraph',
                    chargeTurns: this.chargeTurns,
                    message: `${this.name} readies a devastating attack!`
                };
            }
        }

        // Use AI to decide action
        const decision = this.ai.decideAction(this, player, gameState);

        // Orcs can choose to buff if not at max stacks and AI suggests special action
        if (decision.action === 'special_attack' && this.buffStacks < this.maxBuffStacks && Math.random() < 0.5) {
            return this.executeBuff(player, gameState);
        }

        // Execute the decided action
        switch (decision.action) {
            case 'attack':
                return this.executeAttack(decision, player, gameState);
            case 'special_attack':
                return this.executeSpecialAttack(decision, player, gameState);
            case 'stunned':
                return { success: false, reason: 'stunned', action: 'stunned' };
            default:
                return { success: false, reason: 'no_action', action: 'none' };
        }
    }

    /**
     * Executes a buff action
     *
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Buff result
     */
    executeBuff(player, gameState) {
        this.buffStacks++;
        const attackBonus = 5 * this.buffStacks;
        
        // Temporarily boost attack power
        this.currentAttackPower = (this.currentAttackPower || this.attackPower) + 5;
        
        console.log(`${this.name} roars and buffs attack! Stack: ${this.buffStacks}/${this.maxBuffStacks}, Attack: ${this.currentAttackPower}`);

        return {
            success: true,
            action: 'buff',
            buffType: 'attack_up',
            buffStacks: this.buffStacks,
            attackBonus: attackBonus,
            target: 'self',
            message: `${this.name} powers up for battle!`
        };
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
        // Calculate damage using AI with buff consideration
        let damage = this.ai.calculateDamage(this, decision);
        
        // Apply buff stacks bonus
        if (this.currentAttackPower) {
            damage = Math.floor(damage * (this.currentAttackPower / this.attackPower));
        }

        // Orcs have a chance for a crushing blow (20% chance)
        const isCrushingBlow = Math.random() < 0.2;
        if (isCrushingBlow) {
            damage = Math.floor(damage * 1.5);
            console.log(`${this.name} lands a CRUSHING BLOW for ${damage} damage!`);
        } else {
            console.log(`${this.name} attacks for ${damage} damage`);
        }

        // Reset buff stacks after attacking (orc expends energy)
        if (this.buffStacks > 0 && Math.random() < 0.5) {
            this.buffStacks = 0;
            this.currentAttackPower = this.attackPower;
            console.log(`${this.name}'s buffs fade`);
        }

        // Apply damage to player
        const result = player.takeDamage?.(damage, { isCriticalHit: isCrushingBlow }) || {
            success: true,
            damageTaken: damage
        };

        return {
            success: true,
            action: 'attack',
            damage: damage,
            isCrushingBlow: isCrushingBlow,
            target: 'player',
            ...result
        };
    }

    /**
     * Executes a special attack based on AI decision
     *
     * @param {Object} decision - The AI decision object
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Special attack result
     */
    executeSpecialAttack(decision, player, gameState) {
        let damage = this.ai.calculateDamage(this, decision);
        let specialName = decision.specialType || 'special';

        // Apply buff multiplier if active
        if (this.currentAttackPower) {
            damage = Math.floor(damage * (this.currentAttackPower / this.attackPower));
        }

        console.log(`${this.name} uses ${specialName} for ${damage} damage!`);

        // Apply damage to player
        const result = player.takeDamage?.(damage, { isCriticalHit: true }) || {
            success: true,
            damageTaken: damage
        };

        // Reset buffs after special attack
        this.buffStacks = 0;
        this.currentAttackPower = this.attackPower;

        // Handle self-damage for reckless charge
        if (decision.selfDamage) {
            const selfDmg = Math.floor(decision.selfDamage);
            this.hp = Math.max(1, this.hp - selfDmg);
            console.log(`${this.name} takes ${selfDmg} recoil damage`);
        }

        return {
            success: true,
            action: 'special_attack',
            specialType: decision.specialType,
            damage: damage,
            selfDamage: decision.selfDamage || 0,
            target: 'player',
            ...result
        };
    }

    /**
     * Gets the AI strategy description
     *
     * @returns {string} Strategy description
     */
    getStrategyText() {
        const buffStatus = this.buffStacks > 0 ? ` [Buff: ${this.buffStacks}/${this.maxBuffStacks}]` : '';
        return this.ai.getStrategyDescription(this) + buffStatus;
    }

    /**
     * Gets the enemy's display name with orc-specific information
     *
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        const rageStatus = (this.hp / this.maxHp) <= 0.25 ? ' [ENRAGED]' : '';
        const buffStatus = this.buffStacks > 0 ? ` [⚔️+${this.buffStacks}]` : '';
        return `${this.name} [${this.hp}/${this.maxHp} HP] 👹${rageStatus}${buffStatus}`;
    }

    /**
     * Gets the enemy's stats as a string for display
     *
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        const currentAtk = this.currentAttackPower || this.attackPower;
        const buffInfo = currentAtk !== this.attackPower ? ` (Buffed: ${currentAtk})` : '';
        return `Attack: ${this.attackPower}${buffInfo} | Defense: ${this.defense} | Speed: ${this.speed}`;
    }

    /**
     * Resets the orc to its initial state
     */
    reset() {
        super.reset();
        this.buffStacks = 0;
        this.currentAttackPower = this.attackPower;
        console.log(`Orc reset: ${this.name}, buffs cleared`);
    }
}

/**
 * Factory function to create an Orc instance
 *
 * @param {string} name - Custom name (optional)
 * @param {number} maxHp - Custom max HP (optional)
 * @param {number} attack - Custom attack (optional)
 * @returns {Orc} New Orc instance
 */
export function createOrc(name, maxHp, attack) {
    return new Orc(name, maxHp, attack);
}
