/**
 * Dragon Enemy Implementation for Emoji Card Battle
 *
 * This class extends the base Enemy class implementing a dragon boss enemy.
 * Dragons are powerful bosses with mixed AI behaviors that adapt during combat.
 * They can attack, heal, buff, and unleash devastating special abilities. Maybe I can also add elemental dragons? 
 *
 * Dragon characteristics:
 * - Very high HP and attack power
 * - Adaptive AI that changes phases based on HP
 * - Multiple special attacks (fire breath, tail swipe, etc.)
 * - Can heal and buff itself
 * - Becomes more dangerous as HP decreases
 */

// Import the base Enemy class
import { Enemy } from './Enemy.js';

/**
 * Creates a new Dragon instance
 *
 * @param {string} name - The name of the dragon (default: "Dragon")
 * @param {number} maxHp - The maximum health points (default: 200)
 * @param {number} attack - The attack power (default: 25)
 */
export class Dragon extends Enemy {
    constructor(name = "Dragon", maxHp = 200, attack = 25) {
        // Define dragon stats - powerful boss
        const stats = {
            defense: 12,      // High defense (scales)
            speed: 1.1,       // Good speed for its size
            aggression: 0.8,  // High aggression
            intelligence: 0.9 // Very intelligent - adapts tactics
        };

        // Call parent constructor with dragon properties
        super(
            name,           // Enemy name
            maxHp,          // Maximum HP
            attack,         // Attack power
            '🐉',           // Emoji representation (dragon)
            stats           // Additional stats
        );

        // Dragon-specific properties
        this.type = 'dragon';
        this.isBoss = true;
        this.attackFrequency = 0.85; // 85% chance to attack - boss but gives some breathing room
        
        // Combat phase tracking
        this.combatPhase = 'initial'; // 'initial', 'enraged', 'desperate'
        this.phaseThreshold1 = 0.7;   // 70% HP - enters enraged phase
        this.phaseThreshold2 = 0.35;  // 35% HP - enters desperate phase
        
        // Ability tracking
        this.fireBreathCooldown = 0;
        this.tailSwipeCooldown = 0;
        this.healCooldown = 0;
        this.buffCooldown = 0;
        this.buffStacks = 0;
        this.maxBuffStacks = 4;
        
        // Special states
        this.isCharging = false;
        this.chargeTarget = null;
        this.wingsClipped = false; // Can be disabled by player

        console.log(`Dragon created: ${this.name} (HP: ${this.maxHp}, Attack: ${this.attackPower}) - BOSS ENEMY`);
    }

    /**
     * Decides and performs the dragon's action
     *
     * @param {Object} gameState - The current game state object
     * @returns {Object} Result object containing action details
     */
    performAction(gameState) {
        const player = gameState?.player;
        
        if (!player) {
            return { success: false, reason: 'no_player_target' };
        }

        // Update combat phase based on HP
        this.updateCombatPhase();

        // Dragons are powerful but may roar/position (15% chance)
        if (Math.random() > this.attackFrequency) {
            console.log(`${this.name} roars menacingly!`);
            return {
                success: true,
                action: 'roar',
                message: `${this.name} lets out a terrifying roar!`
            };
        }

        // Decide action based on phase and cooldowns
        const decision = this.decideAction(player, gameState);

        // Handle charging state for Devastate
        if (this.isCharging) {
            this.chargeTurns--;
            if (this.chargeTurns <= 0) {
                this.isCharging = false;
                // Unleash devastate
                return this.executeDevastate({ action: 'devastate' }, player, gameState);
            } else {
                console.log(`${this.name} continues charging DEVASTATE... (${this.chargeTurns} turns left)`);
                return {
                    success: true,
                    action: 'charging_devastate',
                    chargeTurns: this.chargeTurns,
                    message: `${this.name} is gathering destructive energy!`
                };
            }
        }

        // Execute the decided action
        switch (decision.action) {
            case 'attack':
                return this.executeAttack(decision, player, gameState);
            case 'fire_breath':
                return this.executeFireBreath(decision, player, gameState);
            case 'tail_swipe':
                return this.executeTailSwipe(decision, player, gameState);
            case 'heal':
                return this.executeHeal(decision, player, gameState);
            case 'buff':
                return this.executeBuff(decision, player, gameState);
            case 'devastate':
                // Start charging devastate
                this.isCharging = true;
                this.chargeTurns = 2;
                console.log(`${this.name} begins charging DEVASTATE!`);
                return {
                    success: true,
                    action: 'charging_devastate',
                    chargeTurns: this.chargeTurns,
                    message: `${this.name} is charging a devastating attack!`
                };
            case 'stunned':
                return { success: false, reason: 'stunned', action: 'stunned' };
            default:
                return { success: false, reason: 'no_action', action: 'none' };
        }
    }

    /**
     * Updates the combat phase based on HP
     */
    updateCombatPhase() {
        const hpPercent = this.hp / this.maxHp;

        if (hpPercent <= this.phaseThreshold2) {
            if (this.combatPhase !== 'desperate') {
                this.combatPhase = 'desperate';
                console.log(`${this.name} enters DESPERATE phase! All abilities empowered!`);
            }
        } else if (hpPercent <= this.phaseThreshold1) {
            if (this.combatPhase !== 'enraged') {
                this.combatPhase = 'enraged';
                console.log(`${this.name} enters ENRAGED phase! Attack frequency increased!`);
            }
        } else {
            this.combatPhase = 'initial';
        }
    }

    /**
     * Decides action based on combat phase
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
        const hpPercent = this.hp / this.maxHp;

        switch (this.combatPhase) {
            case 'initial':
                // 40% attack, 25% fire breath, 15% tail swipe, 10% heal, 10% buff
                if (roll < 0.4) {
                    return { action: 'attack', target: 'player' };
                } else if (roll < 0.65 && this.fireBreathCooldown <= 0) {
                    return { action: 'fire_breath', target: 'player' };
                } else if (roll < 0.8 && this.tailSwipeCooldown <= 0) {
                    return { action: 'tail_swipe', target: 'player' };
                } else if (roll < 0.9 && this.healCooldown <= 0 && hpPercent < 0.6) {
                    return { action: 'heal', target: 'self' };
                } else if (this.buffCooldown <= 0 && this.buffStacks < this.maxBuffStacks) {
                    return { action: 'buff', target: 'self' };
                } else {
                    return { action: 'attack', target: 'player' };
                }

            case 'enraged':
                // 50% attack, 30% fire breath, 20% tail swipe (more aggressive)
                if (roll < 0.5) {
                    return { action: 'attack', isEnraged: true, target: 'player' };
                } else if (roll < 0.8 && this.fireBreathCooldown <= 0) {
                    return { action: 'fire_breath', isEnraged: true, target: 'player' };
                } else if (this.tailSwipeCooldown <= 0) {
                    return { action: 'tail_swipe', isEnraged: true, target: 'player' };
                } else {
                    return { action: 'attack', isEnraged: true, target: 'player' };
                }

            case 'desperate':
                // 30% attack, 25% fire breath, 20% tail swipe, 15% heal, 10% devastate
                if (roll < 0.3) {
                    return { action: 'attack', isDesperate: true, target: 'player' };
                } else if (roll < 0.55 && this.fireBreathCooldown <= 0) {
                    return { action: 'fire_breath', isDesperate: true, target: 'player' };
                } else if (roll < 0.75 && this.tailSwipeCooldown <= 0) {
                    return { action: 'tail_swipe', isDesperate: true, target: 'player' };
                } else if (roll < 0.9 && this.healCooldown <= 0) {
                    return { action: 'heal', isDesperate: true, target: 'self' };
                } else if (!this.isCharging) {
                    return { action: 'devastate', target: 'player' };
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
        
        // Apply buff stacks
        if (this.buffStacks > 0) {
            damage += this.buffStacks * 3;
        }

        // Phase modifiers
        if (decision.isEnraged) {
            damage = Math.floor(damage * 1.3);
            console.log(`${this.name} attacks in ENRAGED state for ${damage} damage!`);
        } else if (decision.isDesperate) {
            damage = Math.floor(damage * 1.5);
            console.log(`${this.name} makes a DESPERATE attack for ${damage} damage!`);
        } else {
            // Add variation
            const variation = damage * (0.85 + Math.random() * 0.3);
            damage = Math.floor(variation);
            console.log(`${this.name} attacks for ${damage} damage`);
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
            isEnraged: decision.isEnraged || false,
            isDesperate: decision.isDesperate || false,
            target: 'player',
            ...result
        };
    }

    /**
     * Executes fire breath special attack
     *
     * @param {Object} decision - The AI decision object
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Fire breath result
     */
    executeFireBreath(decision, player, gameState) {
        this.fireBreathCooldown = this.combatPhase === 'desperate' ? 3 : 5;
        
        let damage = Math.floor(this.attackPower * 1.8);
        
        // Apply buff stacks
        if (this.buffStacks > 0) {
            damage += this.buffStacks * 4;
        }

        // Phase modifiers
        if (decision.isEnraged || decision.isDesperate) {
            damage = Math.floor(damage * 1.4);
            console.log(`${this.name} unleashes DEVASTATING FIRE BREATH for ${damage} damage!`);
        } else {
            console.log(`${this.name} breathes fire for ${damage} damage!`);
        }

        // Apply burn effect
        const burnEffect = {
            type: 'burn',
            damagePerTurn: Math.floor(this.attackPower * 0.3),
            duration: 3,
            turnsRemaining: 3
        };

        // Apply damage to player
        const result = player.takeDamage?.(damage, { isCriticalHit: true, burnEffect }) || {
            success: true,
            damageTaken: damage
        };

        return {
            success: true,
            action: 'fire_breath',
            damage: damage,
            burnEffect: burnEffect,
            cooldown: this.fireBreathCooldown,
            target: 'player',
            ...result
        };
    }

    /**
     * Executes tail swipe special attack (hits multiple times)
     *
     * @param {Object} decision - The AI decision object
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Tail swipe result
     */
    executeTailSwipe(decision, player, gameState) {
        this.tailSwipeCooldown = this.combatPhase === 'desperate' ? 2 : 4;
        
        const hits = 3;
        let totalDamage = 0;

        for (let i = 0; i < hits; i++) {
            let hitDamage = Math.floor(this.attackPower * 0.5);
            
            // Apply buff stacks
            if (this.buffStacks > 0) {
                hitDamage += this.buffStacks;
            }

            // Phase modifiers
            if (decision.isEnraged || decision.isDesperate) {
                hitDamage = Math.floor(hitDamage * 1.3);
            }

            totalDamage += hitDamage;
        }

        console.log(`${this.name} swipes its tail ${hits} times for ${totalDamage} total damage!`);

        // Apply damage to player
        const result = player.takeDamage?.(totalDamage, { isCriticalHit: false }) || {
            success: true,
            damageTaken: totalDamage
        };

        return {
            success: true,
            action: 'tail_swipe',
            damage: totalDamage,
            hits: hits,
            cooldown: this.tailSwipeCooldown,
            target: 'player',
            ...result
        };
    }

    /**
     * Executes a heal action
     *
     * @param {Object} decision - The AI decision object
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Heal result
     */
    executeHeal(decision, player, gameState) {
        this.healCooldown = this.combatPhase === 'desperate' ? 3 : 5;
        
        let healPercent = decision.isDesperate ? 0.35 : 0.25;
        const healAmount = Math.floor(this.maxHp * healPercent);
        
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + healAmount);
        const actualHeal = this.hp - oldHp;

        console.log(`${this.name} regenerates ${actualHeal} HP (${oldHp} → ${this.hp})`);

        return {
            success: true,
            action: 'heal',
            healAmount: actualHeal,
            oldHp: oldHp,
            newHp: this.hp,
            cooldown: this.healCooldown,
            target: 'self',
            message: `${this.name} regenerates health!`
        };
    }

    /**
     * Executes a buff action
     *
     * @param {Object} decision - The AI decision object
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Buff result
     */
    executeBuff(decision, player, gameState) {
        this.buffCooldown = 4;
        this.buffStacks = Math.min(this.maxBuffStacks, this.buffStacks + 1);
        
        const defenseBonus = 3;
        this.defense = (this.defense || 0) + defenseBonus;

        console.log(`${this.name} roars and buffs! Stacks: ${this.buffStacks}/${this.maxBuffStacks}, Defense: ${this.defense}`);

        return {
            success: true,
            action: 'buff',
            buffType: 'attack_defense_up',
            buffStacks: this.buffStacks,
            defenseBonus: defenseBonus,
            cooldown: this.buffCooldown,
            target: 'self',
            message: `${this.name} powers up its scales!`
        };
    }

    /**
     * Executes the devastating ultimate attack (charge up then release)
     *
     * @param {Object} decision - The AI decision object
     * @param {Object} player - The player target
     * @param {Object} gameState - Current game state
     * @returns {Object} Devastate result
     */
    executeDevastate(decision, player, gameState) {
        if (!this.isCharging) {
            // Start charging
            this.isCharging = true;
            this.chargeTarget = player;
            this.chargeTurns = 2;
            console.log(`${this.name} is charging DEVASTATE! Take it down quickly!`);
            
            return {
                success: true,
                action: 'charging_devastate',
                isCharging: true,
                chargeTurns: this.chargeTurns,
                target: 'player',
                message: `${this.name} gathers energy for a devastating attack!`
            };
        }

        // Complete the charge and unleash
        this.isCharging = false;
        this.chargeTarget = null;
        
        const damage = Math.floor(this.attackPower * 3.5);
        console.log(`${this.name} unleashes DEVASTATE for ${damage} MASSIVE damage!`);

        // Apply damage to player
        const result = player.takeDamage?.(damage, { isCriticalHit: true }) || {
            success: true,
            damageTaken: damage
        };

        return {
            success: true,
            action: 'devastate',
            damage: damage,
            wasCharged: true,
            target: 'player',
            ...result
        };
    }

    /**
     * Processes charging state (called at turn start)
     *
     * @returns {Object} Charge progress result
     */
    processCharging() {
        if (this.isCharging && this.chargeTurns > 0) {
            this.chargeTurns--;
            console.log(`${this.name} continues charging... (${this.chargeTurns} turns left)`);
            
            if (this.chargeTurns <= 0) {
                this.isCharging = false;
                return {
                    success: true,
                    chargeComplete: true,
                    message: `${this.name} is ready to unleash DEVASTATE!`
                };
            }
        }
        return { success: false, reason: 'not_charging' };
    }

    /**
     * Gets the enemy's display name with dragon-specific information
     *
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        const phaseStatus = this.combatPhase !== 'initial' ? ` [${this.combatPhase.toUpperCase()}]` : '';
        const buffStatus = this.buffStacks > 0 ? ` [⚔️+${this.buffStacks}]` : '';
        const chargeStatus = this.isCharging ? ` [⚡CHARGING]` : '';
        const cdInfo = [];
        if (this.fireBreathCooldown > 0) cdInfo.push(`🔥${this.fireBreathCooldown}`);
        if (this.tailSwipeCooldown > 0) cdInfo.push(`🦎${this.tailSwipeCooldown}`);
        const cooldownStatus = cdInfo.length > 0 ? ` [${cdInfo.join(' ')}]` : '';
        
        return `${this.name} [${this.hp}/${this.maxHp} HP] 🐉${phaseStatus}${buffStatus}${chargeStatus}${cooldownStatus}`;
    }

    /**
     * Gets the enemy's stats as a string for display
     *
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `Attack: ${this.attackPower} | Defense: ${this.defense} | Phase: ${this.combatPhase} | Buffs: ${this.buffStacks}/${this.maxBuffStacks}`;
    }

    /**
     * Resets the dragon to its initial state
     */
    reset() {
        super.reset();
        this.combatPhase = 'initial';
        this.fireBreathCooldown = 0;
        this.tailSwipeCooldown = 0;
        this.healCooldown = 0;
        this.buffCooldown = 0;
        this.buffStacks = 0;
        this.isCharging = false;
        this.chargeTarget = null;
        this.wingsClipped = false;
        console.log(`Dragon reset: ${this.name}`);
    }
}

/**
 * Factory function to create a Dragon instance
 *
 * @param {string} name - Custom name (optional)
 * @param {number} maxHp - Custom max HP (optional)
 * @param {number} attack - Custom attack (optional)
 * @returns {Dragon} New Dragon instance
 */
export function createDragon(name, maxHp, attack) {
    return new Dragon(name, maxHp, attack);
}
