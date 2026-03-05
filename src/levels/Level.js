/**
 * Base Level Class for Emoji Card Battle
 *
 * This class represents a single level instance during gameplay.
 * It handles level initialization, enemy spawning, and win/loss conditions.
 */

import { createGoblin } from '../enemies/Goblin.js';
import { createOrc } from '../enemies/Orc.js';
import { createSkeleton } from '../enemies/Skeleton.js';
import { createGhost } from '../enemies/Ghost.js';
import { createDragon } from '../enemies/Dragon.js';

/**
 * Enemy factory - creates enemy instances by type
 */
const ENEMY_FACTORIES = {
    goblin: createGoblin,
    orc: createOrc,
    skeleton: createSkeleton,
    ghost: createGhost,
    dragon: createDragon
};

/**
 * Level class - Represents an active level instance
 */
export class Level {
    /**
     * Creates a new Level instance
     *
     * @param {Object} levelConfig - Level configuration from levels.js
     */
    constructor(levelConfig) {
        // Level configuration
        this.config = levelConfig;
        this.id = levelConfig.id;
        this.number = levelConfig.number;
        this.name = levelConfig.name;
        this.description = levelConfig.description;
        this.difficulty = levelConfig.difficulty;
        
        // Level state
        this.isActive = false;
        this.isComplete = false;
        this.isFailed = false;
        this.turnCount = 0;
        
        // Enemy instance (created on start)
        this.enemy = null;
        
        // Environment
        this.environment = levelConfig.environment;
        
        // Conditions
        this.conditions = levelConfig.conditions;
        this.maxTurns = levelConfig.conditions?.maxTurns || 50;
        
        console.log(`Level created: ${this.name} (${this.difficulty})`);
    }

    /**
     * Starts the level - spawns the enemy and initializes state
     *
     * @returns {Object} Level start result
     */
    start() {
        if (this.isActive) {
            return { success: false, reason: 'already_active' };
        }

        // Spawn the enemy
        this.enemy = this.spawnEnemy();
        
        if (!this.enemy) {
            return { success: false, reason: 'unknown_enemy_type' };
        }

        // Initialize level state
        this.isActive = true;
        this.isComplete = false;
        this.isFailed = false;
        this.turnCount = 0;

        console.log(`Level started: ${this.name}`);
        console.log(`Enemy: ${this.enemy.getDisplayName()}`);

        return {
            success: true,
            level: this,
            enemy: this.enemy,
            introText: this.config.introText
        };
    }

    /**
     * Spawns the enemy based on level configuration
     *
     * @returns {Object} Enemy instance
     */
    spawnEnemy() {
        const enemyConfig = this.config.enemy;
        const factory = ENEMY_FACTORIES[enemyConfig.type];

        if (!factory) {
            console.error(`Unknown enemy type: ${enemyConfig.type}`);
            return null;
        }

        // Create enemy with configured stats
        const enemy = factory(
            enemyConfig.name,
            enemyConfig.baseHp,
            enemyConfig.baseAttack
        );

        return enemy;
    }

    /**
     * Processes the end of a turn
     *
     * @returns {Object} Turn end result
     */
    endTurn() {
        if (!this.isActive) {
            return { success: false, reason: 'level_not_active' };
        }

        this.turnCount++;

        // Check for turn limit failure
        if (this.turnCount >= this.maxTurns) {
            this.fail('turn_limit');
            return {
                success: true,
                turnCount: this.turnCount,
                isFailed: true,
                reason: 'turn_limit'
            };
        }

        return {
            success: true,
            turnCount: this.turnCount,
            maxTurns: this.maxTurns,
            turnsRemaining: this.maxTurns - this.turnCount
        };
    }

    /**
     * Checks if the level is complete (enemy defeated)
     *
     * @returns {boolean} True if level is complete
     */
    checkCompletion() {
        if (!this.isActive || this.isComplete || this.isFailed) {
            return false;
        }

        if (!this.enemy || !this.enemy.isAlive) {
            this.complete();
            return true;
        }

        return false;
    }

    /**
     * Marks the level as complete
     */
    complete() {
        this.isActive = false;
        this.isComplete = true;
        this.isFailed = false;

        console.log(`Level complete: ${this.name}`);
        console.log(`Rewards: ${this.config.rewards.gold} gold`);
    }

    /**
     * Marks the level as failed
     *
     * @param {string} reason - Failure reason
     */
    fail(reason = 'unknown') {
        this.isActive = false;
        this.isComplete = false;
        this.isFailed = true;
        this.failureReason = reason;

        console.log(`Level failed: ${this.name} (${reason})`);
    }

    /**
     * Gets the current level state for UI
     *
     * @returns {Object} Level state object
     */
    getState() {
        return {
            id: this.id,
            name: this.name,
            number: this.number,
            difficulty: this.difficulty,
            isActive: this.isActive,
            isComplete: this.isComplete,
            isFailed: this.isFailed,
            turnCount: this.turnCount,
            maxTurns: this.maxTurns,
            turnsRemaining: this.maxTurns - this.turnCount,
            enemy: this.enemy ? {
                name: this.enemy.name,
                hp: this.enemy.hp,
                maxHp: this.enemy.maxHp,
                isAlive: this.enemy.isAlive,
                displayName: this.enemy.getDisplayName(),
                statsString: this.enemy.getStatsString(),
                strategyText: this.enemy.getStrategyText?.() || 'No strategy info'
            } : null,
            environment: this.environment,
            introText: this.config.introText,
            victoryText: this.config.victoryText,
            defeatText: this.config.defeatText
        };
    }

    /**
     * Gets a difficulty color for UI
     *
     * @returns {string} CSS color class or hex
     */
    getDifficultyColor() {
        const colors = {
            tutorial: '#4CAF50', // Green
            easy: '#8BC34A',     // Light Green
            medium: '#FFC107',   // Amber
            hard: '#FF9800',     // Orange
            boss: '#F44336'      // Red
        };
        return colors[this.difficulty] || '#9E9E9E';
    }

    /**
     * Gets a difficulty icon for UI
     *
     * @returns {string} Icon emoji
     */
    getDifficultyIcon() {
        const icons = {
            tutorial: '📚',
            easy: '⭐',
            medium: '⭐⭐',
            hard: '⭐⭐⭐',
            boss: '👑'
        };
        return icons[this.difficulty] || '❓';
    }

    /**
     * Resets the level for replay
     */
    reset() {
        this.isActive = false;
        this.isComplete = false;
        this.isFailed = false;
        this.turnCount = 0;
        this.failureReason = null;
        
        if (this.enemy && typeof this.enemy.reset === 'function') {
            this.enemy.reset();
        }
        
        console.log(`Level reset: ${this.name}`);
    }
}

/**
 * Factory function to create a Level instance
 *
 * @param {Object} levelConfig - Level configuration
 * @returns {Level} New Level instance
 */
export function createLevel(levelConfig) {
    return new Level(levelConfig);
}
