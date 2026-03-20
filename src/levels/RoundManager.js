/**
 * Round Manager Module for Survivor Mode
 *
 * This module manages the survivor-style round progression system.
 * Players fight through consecutive rounds with increasing difficulty.
 *
 * Features:
 * - Track current round and best round
 * - Spawn enemies with scaled stats
 * - Handle round transitions
 * - Persist high scores (localStorage)
 */

import { 
    selectEnemyForRound, 
    scaleEnemyStats, 
    getMilestoneForRound,
    getRoundDifficulty,
    calculateRoundReward,
    ENEMY_POOL 
} from './levels.js';
import { createGoblin } from '../enemies/Goblin.js';
import { createOrc } from '../enemies/Orc.js';
import { createSkeleton } from '../enemies/Skeleton.js';
import { createGhost } from '../enemies/Ghost.js';
import { createDragon } from '../enemies/Dragon.js';

/**
 * Enemy factory map
 */
const ENEMY_FACTORIES = {
    goblin: createGoblin,
    orc: createOrc,
    skeleton: createSkeleton,
    ghost: createGhost,
    dragon: createDragon
};

/**
 * RoundManager class - Manages survivor round progression
 */
export class RoundManager {
    /**
     * Creates a new RoundManager instance
     */
    constructor() {
        this.currentRound = 1;
        this.bestRound = 1;
        this.totalKills = 0;
        this.totalGold = 0;
        this.currentEnemy = null;
        this.isRoundActive = false;
        this.storageKey = 'combatCards_survivor';
        
        // Load saved progress
        this.loadProgress();
        
        console.log(`RoundManager initialized. Starting Round ${this.currentRound}`);
    }

    /**
     * Starts a new round
     *
     * @returns {Object} Round start result with enemy info
     */
    startRound() {
        if (this.isRoundActive) {
            return { success: false, reason: 'round_already_active' };
        }

        // Check if this is a boss round (every 5 rounds starting at round 10)
        const isBossRound = this.currentRound >= 10 && this.currentRound % 5 === 0;

        // Select enemy for this round
        const enemyConfig = selectEnemyForRound(this.currentRound, isBossRound);
        
        // Scale enemy stats based on round
        const scaledStats = scaleEnemyStats(enemyConfig, this.currentRound);
        
        // Get milestone info if applicable
        const milestone = getMilestoneForRound(this.currentRound);
        
        // Create the enemy instance
        const factory = ENEMY_FACTORIES[enemyConfig.id];
        if (!factory) {
            console.error(`Unknown enemy type: ${enemyConfig.id}`);
            return { success: false, reason: 'unknown_enemy' };
        }
        
        this.currentEnemy = factory(
            scaledStats.name,
            scaledStats.hp,
            scaledStats.attack
        );

        if (scaledStats.attackCard) {
            this.currentEnemy.attackCard = scaledStats.attackCard;
        }

        this.isRoundActive = true;

        const roundInfo = {
            success: true,
            round: this.currentRound,
            enemy: this.currentEnemy,
            enemyStats: scaledStats,
            difficulty: getRoundDifficulty(this.currentRound),
            milestone: milestone,
            isBossRound: isBossRound,
            message: milestone ? `🏆 ${milestone.name}: ${milestone.description}` : `Round ${this.currentRound} begins!`
        };

        console.log(`Round ${this.currentRound} started: ${scaledStats.name} (HP: ${scaledStats.hp}, Attack: ${scaledStats.attack})`);
        
        return roundInfo;
    }

    /**
     * Completes the current round
     *
     * @returns {Object} Round completion result with rewards
     */
    completeRound() {
        if (!this.isRoundActive) {
            return { success: false, reason: 'no_active_round' };
        }

        this.isRoundActive = false;
        this.totalKills++;

        // Calculate rewards
        const goldReward = calculateRoundReward(this.currentRound, {
            isBoss: this.currentEnemy.type === 'dragon'
        });
        this.totalGold += goldReward;

        // Update best round if applicable
        if (this.currentRound > this.bestRound) {
            this.bestRound = this.currentRound;
        }

        // Save progress
        this.saveProgress();

        const result = {
            success: true,
            round: this.currentRound,
            goldReward: goldReward,
            totalGold: this.totalGold,
            totalKills: this.totalKills,
            bestRound: this.bestRound,
            isBestRound: this.currentRound >= this.bestRound,
            message: `Round ${this.currentRound} complete! +${goldReward} gold`
        };

        console.log(`Round ${this.currentRound} completed! Reward: ${goldReward} gold`);

        return result;
    }

    /**
     * Advances to the next round
     *
     * @returns {Object} Next round info
     */
    nextRound() {
        this.currentRound++;
        this.isRoundActive = false;
        this.currentEnemy = null;
        
        this.saveProgress();
        
        const milestone = getMilestoneForRound(this.currentRound);
        
        return {
            success: true,
            round: this.currentRound,
            milestone: milestone,
            message: milestone ? `🏆 ${milestone.name}!` : `Round ${this.currentRound}`
        };
    }

    /**
     * Handles player defeat - game over in survivor mode
     *
     * @returns {Object} Game over result
     */
    playerDefeated() {
        this.isRoundActive = false;
        this.saveProgress();

        return {
            success: true,
            finalRound: this.currentRound,
            bestRound: this.bestRound,
            totalKills: this.totalKills,
            totalGold: this.totalGold,
            isNewRecord: this.currentRound >= this.bestRound,
            message: `Survived ${this.currentRound - 1} rounds. Best: ${this.bestRound - 1}`
        };
    }

    /**
     * Resets progress for a new run
     */
    resetRun() {
        this.currentRound = 1;
        this.isRoundActive = false;
        this.currentEnemy = null;
        // Don't reset bestRound or totalGold - those are persistent
        this.saveProgress();
        
        console.log('New run started. Good luck!');
    }

    /**
     * Full reset - clears all progress
     */
    resetAll() {
        this.currentRound = 1;
        this.bestRound = 1;
        this.totalKills = 0;
        this.totalGold = 0;
        this.isRoundActive = false;
        this.currentEnemy = null;
        localStorage.removeItem(this.storageKey);
        
        console.log('All progress reset.');
    }

    /**
     * Saves progress to localStorage
     */
    saveProgress() {
        const progress = {
            currentRound: this.currentRound,
            bestRound: this.bestRound,
            totalKills: this.totalKills,
            totalGold: this.totalGold,
            savedAt: Date.now()
        };
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(progress));
        } catch (e) {
            console.warn('Failed to save progress:', e);
        }
    }

    /**
     * Loads progress from localStorage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const progress = JSON.parse(saved);
                this.currentRound = progress.currentRound ?? 1;
                this.bestRound = progress.bestRound ?? 1;
                this.totalKills = progress.totalKills ?? 0;
                this.totalGold = progress.totalGold ?? 0;
            }
        } catch (e) {
            console.warn('Failed to load progress:', e);
        }
    }

    /**
     * Gets current stats for UI display
     *
     * @returns {Object} Stats object
     */
    getStats() {
        return {
            currentRound: this.currentRound,
            bestRound: this.bestRound,
            totalKills: this.totalKills,
            totalGold: this.totalGold,
            isRoundActive: this.isRoundActive,
            difficulty: getRoundDifficulty(this.currentRound)
        };
    }

    /**
     * Gets the current active enemy
     *
     * @returns {Object|null} Current enemy instance
     */
    getCurrentEnemy() {
        return this.currentEnemy;
    }

    /**
     * Checks if a round is currently active
     *
     * @returns {boolean} True if round is active
     */
    isRoundInProgress() {
        return this.isRoundActive;
    }
}

/**
 * Factory function to create a RoundManager instance
 *
 * @returns {RoundManager} New RoundManager instance
 */
export function createRoundManager() {
    return new RoundManager();
}
