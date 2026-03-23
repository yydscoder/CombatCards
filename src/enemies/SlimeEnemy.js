/**
 * Slime Enemy Implementation for Emoji Card Battle
 *
 * This class extends EnemyBase to implement a slime enemy with intent system.
 * It represents a basic enemy with simple AI behavior and telegraphed intents.
 *
 * Design: Slay the Spire-style intent system
 * - Slime has a pool of possible actions (attack, block)
 * - Each turn, an intent is randomly selected
 * - Intent is displayed to player before enemy acts
 *
 * @module enemies/SlimeEnemy
 */

// Import EnemyBase and IntentType
import { EnemyBase, IntentType } from './EnemyBase.js';

/**
 * SlimeEnemy Class
 *
 * Basic enemy with simple intent pool:
 * - Attack (60% chance) - Deal 8-14 damage
 * - Block (30% chance) - Gain 8-12 block
 * - Poison Attack (10% chance) - Deal 6 damage + apply poison
 *
 * @extends EnemyBase
 *
 * @example
 * const slime = new SlimeEnemy("Green Slime", 80, 12);
 * const intent = slime.chooseIntent(1);
 * console.log(`Slime will: ${slime.getIntentIcon()}`);
 */
export class SlimeEnemy extends EnemyBase {
    /**
     * Creates a new SlimeEnemy instance
     *
     * @param {string} name - Name of the slime (default: "Slime")
     * @param {number} maxHp - Maximum HP (default: 80)
     * @param {number} attack - Attack power (default: 12)
     */
    constructor(name = "Slime", maxHp = 80, attack = 12) {
        // Define slime stats
        const stats = {
            defense: 5,        // Some natural defense
            speed: 0.8,        // Relatively slow
            aggression: 0.6,   // Moderately aggressive
            intelligence: 0.2, // Not very intelligent
            attackInterval: 2  // Attacks every 2 turns
        };

        // Call parent constructor
        super(
            name,           // Enemy name
            maxHp,          // Maximum HP
            attack,         // Attack power
            '🟢',           // Emoji (green circle)
            stats           // Additional stats
        );

        // Slime-specific properties
        this.type = 'slime';
        this.isGelatinous = true;
        this.poisonChance = 0.3; // 30% chance to poison on attack
        this.splitChance = 0.2;  // 20% chance to split when damaged

        console.log(`[SlimeEnemy] Created: ${this.name} (HP: ${this.maxHp}, Attack: ${this.attackPower})`);
    }

    /**
     * Defines the intent pool for this slime
     *
     * Slimes have simple behavior: mostly attack, sometimes block,
     * rarely use poison attack.
     *
     * @override
     * @returns {Array<Object>} Array of intent objects
     */
    defineIntentPool() {
        this.intentPool = [
            // Attack intents (60% of pool - 6 entries)
            { type: IntentType.ATTACK, value: 10, min: 8, max: 12 },
            { type: IntentType.ATTACK, value: 12, min: 10, max: 14 },
            { type: IntentType.ATTACK, value: 8, min: 6, max: 10 },
            { type: IntentType.ATTACK, value: 14, min: 12, max: 16 },
            { type: IntentType.ATTACK, value: 10, min: 8, max: 12 },
            { type: IntentType.ATTACK, value: 12, min: 10, max: 14 },

            // Block intents (30% of pool - 3 entries)
            { type: IntentType.BLOCK, value: 8 },
            { type: IntentType.BLOCK, value: 10 },
            { type: IntentType.BLOCK, value: 12 },

            // Poison attack (10% of pool - 1 entry)
            { type: IntentType.SPECIAL, name: 'Poison Strike', value: 6, applyPoison: true }
        ];

        console.log(`[SlimeEnemy] ${this.name} intent pool defined: ${this.intentPool.length} options`);
        return this.intentPool;
    }

    /**
     * Overrides executeIntent to add slime-specific behavior
     *
     * @override
     * @param {Object} gameState - Game state object
     * @returns {Object} Execution result
     */
    executeIntent(gameState) {
        if (!this.currentIntent) {
            return { success: false, reason: 'no_intent' };
        }

        console.log(`[SlimeEnemy] ${this.name} executing: ${this.currentIntent.type}`);

        // Handle special poison attack
        if (this.currentIntent.type === IntentType.SPECIAL && this.currentIntent.applyPoison) {
            return this._executePoisonStrike(gameState);
        }

        // Handle standard attack with poison chance
        if (this.currentIntent.type === IntentType.ATTACK) {
            const result = this._executeAttack(gameState);

            // 30% chance to poison
            if (Math.random() < this.poisonChance) {
                result.poisonApplied = true;
                result.poisonDuration = 3;
                result.poisonDamage = 2;
                console.log(`[SlimeEnemy] ${this.name} poisoned the player!`);
            }

            return result;
        }

        // Handle other intents via parent
        return super.executeIntent(gameState);
    }

    /**
     * Executes poison strike special attack
     *
     * @private
     * @param {Object} gameState - Game state
     * @returns {Object} Attack result with poison
     */
    _executePoisonStrike(gameState) {
        const damage = this.currentIntent.value ?? 6;

        // Add variation
        const min = this.currentIntent.min ?? (damage - 2);
        const max = this.currentIntent.max ?? (damage + 2);
        const actualDamage = Math.floor(min + Math.random() * (max - min));

        console.log(`[SlimeEnemy] ${this.name} uses Poison Strike for ${actualDamage} damage!`);

        return {
            success: true,
            action: 'special',
            specialName: 'Poison Strike',
            damage: actualDamage,
            poisonApplied: true,
            poisonDuration: 3,
            poisonDamage: 3,
            target: 'player'
        };
    }

    /**
     * Executes standard attack
     *
     * @private
     * @param {Object} gameState - Game state
     * @returns {Object} Attack result
     */
    _executeAttack(gameState) {
        const damage = this.currentIntent.value ?? this.attackPower;

        // Add variation (±20%)
        const min = this.currentIntent.min ?? Math.floor(damage * 0.8);
        const max = this.currentIntent.max ?? Math.floor(damage * 1.2);
        const actualDamage = Math.floor(min + Math.random() * (max - min));

        console.log(`[SlimeEnemy] ${this.name} attacks for ${actualDamage} damage`);

        return {
            success: true,
            action: 'attack',
            damage: actualDamage,
            baseDamage: damage,
            target: 'player'
        };
    }

    /**
     * Overrides takeDamage to add slime split behavior
     *
     * @override
     * @param {number} damage - Raw damage amount
     * @param {Object} [attackInfo={}] - Attack info
     * @param {Object} [gameState=null] - Game state
     * @returns {Object} Damage result
     */
    takeDamage(damage, attackInfo = {}, gameState = null) {
        // Call parent method
        const result = super.takeDamage(damage, attackInfo, gameState);

        // Slime split chance (20% when damaged)
        if (result.success && this.isAlive && Math.random() < this.splitChance) {
            console.log(`[SlimeEnemy] ${this.name} splits into a smaller slime!`);

            // Create smaller slime stats
            const splitHp = Math.max(1, Math.floor(this.maxHp * 0.3));
            const splitAttack = Math.max(1, Math.floor(this.attackPower * 0.5));

            result.splitOccurred = true;
            result.splitStats = {
                name: `${this.name} (Split)`,
                hp: splitHp,
                attack: splitAttack
            };

            console.log(`[SlimeEnemy] Split stats: ${splitHp} HP, ${splitAttack} ATK`);
        }

        return result;
    }

    /**
     * Gets display name with slime emoji
     *
     * @override
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.hp}/${this.maxHp} HP] 🟢`;
    }

    /**
     * Gets intent icon for current intent
     *
     * @override
     * @returns {string} Intent icon emoji
     */
    getIntentIcon() {
        if (!this.currentIntent) {
            return '❓';
        }

        // Special icon for poison attack
        if (this.currentIntent.type === IntentType.SPECIAL && this.currentIntent.applyPoison) {
            return '☠️';
        }

        return super.getIntentIcon();
    }
}

/**
 * Factory function to create a SlimeEnemy instance
 *
 * @param {string} [name="Slime"] - Enemy name
 * @param {number} [maxHp=80] - Maximum HP
 * @param {number} [attack=12] - Attack power
 * @returns {SlimeEnemy} New SlimeEnemy instance
 */
export function createSlime(name, maxHp, attack) {
    return new SlimeEnemy(name, maxHp, attack);
}

export default SlimeEnemy;
