/**
 * Level Manager Module for Emoji Card Battle
 *
 * This module manages level progression, tracking player progress
 * through the game's levels and handling level transitions.
 *
 * Features:
 * - Track current level and progress
 * - Load level configurations
 * - Handle level completion/failure
 * - Persist progress (localStorage)
 */

import { LEVELS } from './levels.js';

/**
 * LevelManager class - Manages game progression
 */
export class LevelManager {
    /**
     * Creates a new LevelManager instance
     */
    constructor() {
        this.currentLevelIndex = 0;
        this.completedLevels = [];
        this.isCampaignComplete = false;
        this.storageKey = 'combatCards_progress';
        
        // Load saved progress
        this.loadProgress();
        
        console.log(`LevelManager initialized. Current level: ${this.getCurrentLevel().name}`);
    }

    /**
     * Gets the current level configuration
     *
     * @returns {Object} Current level data
     */
    getCurrentLevel() {
        if (this.currentLevelIndex >= LEVELS.length) {
            return null; // Campaign complete
        }
        return LEVELS[this.currentLevelIndex];
    }

    /**
     * Gets all levels
     *
     * @returns {Array} All level configurations
     */
    getAllLevels() {
        return LEVELS;
    }

    /**
     * Gets the next level
     *
     * @returns {Object|null} Next level data or null if campaign complete
     */
    getNextLevel() {
        if (this.currentLevelIndex + 1 >= LEVELS.length) {
            return null;
        }
        return LEVELS[this.currentLevelIndex + 1];
    }

    /**
     * Checks if there are more levels to play
     *
     * @returns {boolean} True if more levels available
     */
    hasMoreLevels() {
        return this.currentLevelIndex < LEVELS.length - 1;
    }

    /**
     * Advances to the next level
     *
     * @returns {Object|null} The next level data or null if complete
     */
    advanceLevel() {
        // Mark current level as completed
        const currentLevel = this.getCurrentLevel();
        if (currentLevel && !this.completedLevels.includes(currentLevel.id)) {
            this.completedLevels.push(currentLevel.id);
        }

        // Move to next level
        this.currentLevelIndex++;

        // Check if campaign is complete
        if (this.currentLevelIndex >= LEVELS.length) {
            this.isCampaignComplete = true;
            console.log('🎉 Campaign Complete! All levels defeated!');
            this.saveProgress();
            return null;
        }

        console.log(`Advancing to Level ${this.currentLevelIndex + 1}: ${this.getCurrentLevel().name}`);
        this.saveProgress();
        return this.getCurrentLevel();
    }

    /**
     * Resets progress to the beginning
     */
    resetProgress() {
        this.currentLevelIndex = 0;
        this.completedLevels = [];
        this.isCampaignComplete = false;
        localStorage.removeItem(this.storageKey);
        console.log('Progress reset. Starting from Level 1.');
    }

    /**
     * Saves progress to localStorage
     */
    saveProgress() {
        const progress = {
            currentLevelIndex: this.currentLevelIndex,
            completedLevels: this.completedLevels,
            isCampaignComplete: this.isCampaignComplete,
            savedAt: Date.now()
        };
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(progress));
            console.log('Progress saved');
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
                this.currentLevelIndex = progress.currentLevelIndex ?? 0;
                this.completedLevels = progress.completedLevels ?? [];
                this.isCampaignComplete = progress.isCampaignComplete ?? false;
                console.log('Progress loaded from save');
            }
        } catch (e) {
            console.warn('Failed to load progress:', e);
        }
    }

    /**
     * Gets progress statistics
     *
     * @returns {Object} Progress stats
     */
    getProgressStats() {
        return {
            currentLevel: this.currentLevelIndex + 1,
            totalLevels: LEVELS.length,
            completedLevels: this.completedLevels.length,
            isCampaignComplete: this.isCampaignComplete,
            percentComplete: Math.round((this.completedLevels.length / LEVELS.length) * 100)
        };
    }

    /**
     * Checks if a specific level is unlocked
     *
     * @param {number} levelIndex - The level index to check
     * @returns {boolean} True if level is unlocked
     */
    isLevelUnlocked(levelIndex) {
        return levelIndex <= this.currentLevelIndex;
    }

    /**
     * Gets level status for UI display
     *
     * @param {number} levelIndex - The level index
     * @returns {string} Status: 'completed', 'current', 'locked'
     */
    getLevelStatus(levelIndex) {
        if (this.completedLevels.includes(LEVELS[levelIndex].id)) {
            return 'completed';
        }
        if (levelIndex === this.currentLevelIndex) {
            return 'current';
        }
        if (levelIndex > this.currentLevelIndex) {
            return 'locked';
        }
        return 'available';
    }
}

/**
 * Factory function to create a LevelManager instance
 *
 * @returns {LevelManager} New LevelManager instance
 */
export function createLevelManager() {
    return new LevelManager();
}
