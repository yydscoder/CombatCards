/**
 * SaveSystem.js - Persists game stats to localStorage
 *
 * Tracks: wins, losses, total games, current win streak, best win streak.
 * All data lives under the key "combatCards_stats" in localStorage.
 */

const STORAGE_KEY = 'combatCards_stats';

const DEFAULT_STATS = {
    wins: 0,
    losses: 0,
    totalGames: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayed: null
};

export class SaveSystem {
    constructor() {
        this.stats = this._load();
        console.log('[SaveSystem] Loaded stats:', this.stats);
    }

    /** Record a player win */
    saveWin() {
        this.stats.wins++;
        this.stats.totalGames++;
        this.stats.currentStreak++;
        if (this.stats.currentStreak > this.stats.bestStreak) {
            this.stats.bestStreak = this.stats.currentStreak;
        }
        this.stats.lastPlayed = new Date().toISOString();
        this._persist();
        console.log(`[SaveSystem] Win saved. Wins: ${this.stats.wins}, Streak: ${this.stats.currentStreak}`);
        return this.stats;
    }

    /** Record a player loss */
    saveLoss() {
        this.stats.losses++;
        this.stats.totalGames++;
        this.stats.currentStreak = 0;
        this.stats.lastPlayed = new Date().toISOString();
        this._persist();
        console.log(`[SaveSystem] Loss saved. Losses: ${this.stats.losses}`);
        return this.stats;
    }

    /** Return a copy of the current stats */
    getStats() {
        return { ...this.stats };
    }

    /** Clear all saved data */
    reset() {
        this.stats = { ...DEFAULT_STATS };
        localStorage.removeItem(STORAGE_KEY);
        console.log('[SaveSystem] Stats reset.');
    }

    _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : { ...DEFAULT_STATS };
        } catch (e) {
            console.warn('[SaveSystem] Failed to load stats, using defaults.', e);
            return { ...DEFAULT_STATS };
        }
    }

    _persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
        } catch (e) {
            console.warn('[SaveSystem] Failed to persist stats.', e);
        }
    }
}

export function initializeSaveSystem() {
    return new SaveSystem();
}
