/**
 * Dragon Enemy Implementation for Emoji Card Battle
 *
 * This class extends EnemyBase to implement a dragon boss enemy with
 * phase-based intent system. Dragons adapt their behavior based on HP.
 *
 * Design: Slay the Spire-style boss intents
 * - Multiple combat phases (Initial, Enraged, Desperate)
 * - Phase-specific intent pools
 * - Special abilities with cooldowns
 * - Telegraphed intents for player counterplay
 *
 * @module enemies/Dragon
 */

// Import EnemyBase and IntentType
import { EnemyBase, IntentType } from './EnemyBase.js';

/**
 * Dragon Combat Phases
 * @readonly
 * @enum {string}
 */
export const DragonPhase = {
    /** 100-70% HP - Standard attacks */
    INITIAL: 'initial',
    /** 70-35% HP - More aggressive */
    ENRAGED: 'enraged',
    /** Below 35% HP - Desperate, powerful attacks */
    DESPERATE: 'desperate'
};

/**
 * Dragon Class
 *
 * Boss enemy with complex intent system:
 * - Phase 1 (100-70%): Attack, Block, Fire Breath (cooldown)
 * - Phase 2 (70-35%): Attack, Buff, Fire Breath, Tail Swipe
 * - Phase 3 (<35%): Desperate attacks, increased damage
 *
 * @extends EnemyBase
 *
 * @example
 * const dragon = new Dragon("Ancient Dragon", 200, 25);
 * const intent = dragon.chooseIntent(1);
 * console.log(`Dragon will: ${dragon.getIntentIcon()} ${dragon.getIntentText()}`);
 */
export class Dragon extends EnemyBase {
    /**
     * Creates a new Dragon instance
     *
     * @param {string} name - Dragon name (default: "Dragon")
     * @param {number} maxHp - Maximum HP (default: 200)
     * @param {number} attack - Attack power (default: 25)
     */
    constructor(name = "Dragon", maxHp = 200, attack = 25) {
        // Define dragon stats
        const stats = {
            defense: 12,       // High defense
            speed: 1.1,        // Good speed
            aggression: 0.8,   // High aggression
            intelligence: 0.9, // Very intelligent
            attackInterval: 2  // Attacks every 2 turns
        };

        // Call parent constructor
        super(
            name,           // Enemy name
            maxHp,          // Maximum HP
            attack,         // Attack power
            '🐉',           // Emoji (dragon)
            stats           // Additional stats
        );

        // Dragon-specific properties
        this.type = 'dragon';
        this.isBoss = true;

        // Combat phase tracking
        this.combatPhase = DragonPhase.INITIAL;
        this.phaseThreshold1 = 0.7;   // 70% HP
        this.phaseThreshold2 = 0.35;  // 35% HP

        // Ability cooldowns
        this.fireBreathCooldown = 0;
        this.fireBreathMaxCooldown = 4;
        this.tailSwipeCooldown = 0;
        this.tailSwipeMaxCooldown = 3;
        this.buffCooldown = 0;
        this.buffMaxCooldown = 5;

        // Buff tracking
        this.buffStacks = 0;
        this.maxBuffStacks = 4;
        this.damageMultiplier = 1;

        console.log(`[Dragon] Created: ${this.name} (HP: ${this.maxHp}, Attack: ${this.attackPower}) - BOSS`);
    }

    /**
     * Defines the intent pool based on current combat phase
     *
     * Dragon has different intent pools for each phase:
     * - Initial: Standard attacks, occasional Fire Breath
     * - Enraged: More attacks, adds Tail Swipe and buffs
     * - Desperate: All-out offense, powerful special attacks
     *
     * @override
     * @returns {Array<Object>} Array of intent objects
     */
    defineIntentPool() {
        // Update phase based on current HP
        this.updateCombatPhase();

        console.log(`[Dragon] ${this.name} defining intent pool for phase: ${this.combatPhase}`);

        switch (this.combatPhase) {
            case DragonPhase.INITIAL:
                this.intentPool = this._getInitialPhasePool();
                break;

            case DragonPhase.ENRAGED:
                this.intentPool = this._getEnragedPhasePool();
                break;

            case DragonPhase.DESPERATE:
                this.intentPool = this._getDesperatePhasePool();
                break;

            default:
                this.intentPool = this._getInitialPhasePool();
        }

        // Update cooldowns
        this._updateCooldowns();

        console.log(`[Dragon] Intent pool: ${this.intentPool.length} options`);
        return this.intentPool;
    }

    /**
     * Gets the intent pool for Initial phase (100-70% HP)
     *
     * @private
     * @returns {Array<Object>} Initial phase intent pool
     */
    _getInitialPhasePool() {
        const pool = [];

        // Standard attacks (50% of pool)
        pool.push({ type: IntentType.ATTACK, value: 18, min: 15, max: 21 });
        pool.push({ type: IntentType.ATTACK, value: 22, min: 18, max: 26 });
        pool.push({ type: IntentType.ATTACK, value: 20, min: 16, max: 24 });
        pool.push({ type: IntentType.ATTACK, value: 25, min: 20, max: 30 });
        pool.push({ type: IntentType.ATTACK, value: 18, min: 15, max: 21 });

        // Block (20% of pool)
        pool.push({ type: IntentType.BLOCK, value: 25 });
        pool.push({ type: IntentType.BLOCK, value: 30 });

        // Fire Breath if off cooldown (20% of pool)
        if (this.fireBreathCooldown <= 0) {
            pool.push({ type: IntentType.SPECIAL, name: 'Fire Breath', value: 35, min: 30, max: 40 });
            pool.push({ type: IntentType.SPECIAL, name: 'Fire Breath', value: 35, min: 30, max: 40 });
        }

        // Buff (10% of pool)
        if (this.buffCooldown <= 0 && this.buffStacks < this.maxBuffStacks) {
            pool.push({ type: IntentType.BUFF, name: 'Dragon Fury', value: 3 });
        }

        return pool;
    }

    /**
     * Gets the intent pool for Enraged phase (70-35% HP)
     *
     * @private
     * @returns {Array<Object>} Enraged phase intent pool
     */
    _getEnragedPhasePool() {
        const pool = [];

        // Stronger attacks (40% of pool)
        pool.push({ type: IntentType.ATTACK, value: 25, min: 20, max: 30 });
        pool.push({ type: IntentType.ATTACK, value: 28, min: 24, max: 32 });
        pool.push({ type: IntentType.ATTACK, value: 30, min: 25, max: 35 });
        pool.push({ type: IntentType.ATTACK, value: 25, min: 20, max: 30 });

        // Tail Swipe (20% of pool)
        if (this.tailSwipeCooldown <= 0) {
            pool.push({ type: IntentType.SPECIAL, name: 'Tail Swipe', value: 20, hitCount: 2 });
            pool.push({ type: IntentType.SPECIAL, name: 'Tail Swipe', value: 20, hitCount: 2 });
        }

        // Fire Breath (20% of pool)
        if (this.fireBreathCooldown <= 0) {
            pool.push({ type: IntentType.SPECIAL, name: 'Fire Breath', value: 40, min: 35, max: 45 });
            pool.push({ type: IntentType.SPECIAL, name: 'Fire Breath', value: 40, min: 35, max: 45 });
        }

        // Block (10% of pool)
        pool.push({ type: IntentType.BLOCK, value: 30 });

        // Buff (10% of pool)
        if (this.buffCooldown <= 0 && this.buffStacks < this.maxBuffStacks) {
            pool.push({ type: IntentType.BUFF, name: 'Dragon Fury', value: 4 });
        }

        return pool;
    }

    /**
     * Gets the intent pool for Desperate phase (<35% HP)
     *
     * @private
     * @returns {Array<Object>} Desperate phase intent pool
     */
    _getDesperatePhasePool() {
        const pool = [];

        // Devastating attacks (50% of pool)
        pool.push({ type: IntentType.ATTACK, value: 35, min: 30, max: 40 });
        pool.push({ type: IntentType.ATTACK, value: 40, min: 35, max: 45 });
        pool.push({ type: IntentType.ATTACK, value: 30, min: 25, max: 35 });

        // Devastating Fire Breath (30% of pool)
        pool.push({ type: IntentType.SPECIAL, name: 'Devastating Fire Breath', value: 50, min: 45, max: 55 });
        pool.push({ type: IntentType.SPECIAL, name: 'Devastating Fire Breath', value: 50, min: 45, max: 55 });
        pool.push({ type: IntentType.SPECIAL, name: 'Devastating Fire Breath', value: 50, min: 45, max: 55 });

        // Tail Swipe (10% of pool)
        pool.push({ type: IntentType.SPECIAL, name: 'Tail Swipe', value: 25, hitCount: 2 });

        // Last stand buff (10% of pool)
        if (this.buffCooldown <= 0) {
            pool.push({ type: IntentType.BUFF, name: 'Last Stand', value: 5 });
        }

        return pool;
    }

    /**
     * Updates the combat phase based on current HP percentage
     */
    updateCombatPhase() {
        const hpPercent = this.hp / this.maxHp;
        const oldPhase = this.combatPhase;

        if (hpPercent <= this.phaseThreshold2) {
            this.combatPhase = DragonPhase.DESPERATE;
        } else if (hpPercent <= this.phaseThreshold1) {
            this.combatPhase = DragonPhase.ENRAGED;
        } else {
            this.combatPhase = DragonPhase.INITIAL;
        }

        if (oldPhase !== this.combatPhase) {
            console.log(`[Dragon] ${this.name} enters ${this.combatPhase} phase! (${Math.floor(hpPercent * 100)}% HP)`);
        }
    }

    /**
     * Updates ability cooldowns
     *
     * @private
     */
    _updateCooldowns() {
        if (this.fireBreathCooldown > 0) this.fireBreathCooldown--;
        if (this.tailSwipeCooldown > 0) this.tailSwipeCooldown--;
        if (this.buffCooldown > 0) this.buffCooldown--;

        console.log(`[Dragon] Cooldowns - Fire Breath: ${this.fireBreathCooldown}, Tail Swipe: ${this.tailSwipeCooldown}, Buff: ${this.buffCooldown}`);
    }

    /**
     * Overrides executeIntent for dragon-specific abilities
     *
     * @override
     * @param {Object} gameState - Game state
     * @returns {Object} Execution result
     */
    executeIntent(gameState) {
        if (!this.currentIntent) {
            return { success: false, reason: 'no_intent' };
        }

        console.log(`[Dragon] ${this.name} executing: ${this.currentIntent.type} - ${this.currentIntent.name || this.currentIntent.type}`);

        // Handle special abilities
        if (this.currentIntent.type === IntentType.SPECIAL) {
            return this._executeSpecialAbility(gameState);
        }

        // Handle buff
        if (this.currentIntent.type === IntentType.BUFF) {
            return this._executeBuff(gameState);
        }

        // Handle standard attack
        if (this.currentIntent.type === IntentType.ATTACK) {
            return this._executeAttack(gameState);
        }

        // Handle block
        if (this.currentIntent.type === IntentType.BLOCK) {
            return this._executeBlock(gameState);
        }

        return super.executeIntent(gameState);
    }

    /**
     * Executes dragon special abilities
     *
     * @private
     * @param {Object} gameState - Game state
     * @returns {Object} Ability result
     */
    _executeSpecialAbility(gameState) {
        const abilityName = this.currentIntent.name;
        const baseValue = this.currentIntent.value ?? 0;

        // Apply damage variation
        const min = this.currentIntent.min ?? Math.floor(baseValue * 0.85);
        const max = this.currentIntent.max ?? Math.floor(baseValue * 1.15);
        const actualDamage = Math.floor(min + Math.random() * (max - min));

        // Apply damage multiplier from buffs
        const finalDamage = Math.floor(actualDamage * this.damageMultiplier);

        // Set cooldowns based on ability
        if (abilityName === 'Fire Breath' || abilityName === 'Devastating Fire Breath') {
            this.fireBreathCooldown = this.fireBreathMaxCooldown;
            console.log(`[Dragon] ${this.name} uses ${abilityName} for ${finalDamage} damage!`);
        } else if (abilityName === 'Tail Swipe') {
            this.tailSwipeCooldown = this.tailSwipeMaxCooldown;
            const hitCount = this.currentIntent.hitCount ?? 1;
            console.log(`[Dragon] ${this.name} uses Tail Swipe for ${finalDamage} damage × ${hitCount} hits!`);
            return {
                success: true,
                action: 'special',
                specialName: abilityName,
                damage: finalDamage,
                hitCount,
                target: 'player'
            };
        }

        return {
            success: true,
            action: 'special',
            specialName: abilityName,
            damage: finalDamage,
            baseDamage: baseValue,
            target: 'player'
        };
    }

    /**
     * Executes dragon buff ability
     *
     * @private
     * @param {Object} gameState - Game state
     * @returns {Object} Buff result
     */
    _executeBuff(gameState) {
        const buffName = this.currentIntent.name || 'Dragon Fury';
        const buffValue = this.currentIntent.value ?? 2;

        this.buffStacks = Math.min(this.buffStacks + 1, this.maxBuffStacks);
        this.damageMultiplier = 1 + (this.buffStacks * 0.1); // +10% per stack
        this.buffCooldown = this.buffMaxCooldown;

        console.log(`[Dragon] ${this.name} uses ${buffName}! Stacks: ${this.buffStacks}, DMG Multiplier: ${this.damageMultiplier.toFixed(1)}x`);

        return {
            success: true,
            action: 'buff',
            buffName,
            buffValue,
            buffStacks: this.buffStacks,
            damageMultiplier: this.damageMultiplier,
            target: 'self'
        };
    }

    /**
     * Executes standard attack with damage multiplier
     *
     * @private
     * @param {Object} gameState - Game state
     * @returns {Object} Attack result
     */
    _executeAttack(gameState) {
        const damage = this.currentIntent.value ?? this.attackPower;

        // Add variation
        const min = this.currentIntent.min ?? Math.floor(damage * 0.8);
        const max = this.currentIntent.max ?? Math.floor(damage * 1.2);
        const baseDamage = Math.floor(min + Math.random() * (max - min));

        // Apply damage multiplier from buffs
        const finalDamage = Math.floor(baseDamage * this.damageMultiplier);

        console.log(`[Dragon] ${this.name} attacks for ${finalDamage} damage (base: ${baseDamage}, multiplier: ${this.damageMultiplier.toFixed(1)}x)`);

        return {
            success: true,
            action: 'attack',
            damage: finalDamage,
            baseDamage: baseDamage,
            damageMultiplier: this.damageMultiplier,
            target: 'player'
        };
    }

    /**
     * Gets display name with dragon emoji and phase
     *
     * @override
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        const phaseIcon = this.combatPhase === DragonPhase.DESPERATE ? '💀' :
                         this.combatPhase === DragonPhase.ENRAGED ? '😡' : '';
        return `${this.name} [${this.hp}/${this.maxHp} HP] 🐉 ${phaseIcon}`;
    }

    /**
     * Resets dragon to initial state
     *
     * @override
     */
    reset() {
        super.reset();

        this.combatPhase = DragonPhase.INITIAL;
        this.fireBreathCooldown = 0;
        this.tailSwipeCooldown = 0;
        this.buffCooldown = 0;
        this.buffStacks = 0;
        this.damageMultiplier = 1;

        console.log('[Dragon] Reset to initial state');
    }
}

/**
 * Factory function to create a Dragon instance
 *
 * @param {string} [name="Dragon"] - Dragon name
 * @param {number} [maxHp=200] - Maximum HP
 * @param {number} [attack=25] - Attack power
 * @returns {Dragon} New Dragon instance
 */
export function createDragon(name, maxHp, attack) {
    return new Dragon(name, maxHp, attack);
}

export default Dragon;
