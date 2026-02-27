/**
 * Configuration constants for the Emoji Card Battle game
 * 
 * This file contains all the global configuration values that control game behavior.
 * Keeping these in a separate file allows for easy tuning of game balance and mechanics.
 */

// Game constants
export const GAME_CONFIG = {
    // Core game settings
    FRAME_RATE: 60, // Target frames per second
    FRAME_DURATION_MS: 1000 / 60, // Duration of each frame in milliseconds
    
    // Player settings
    PLAYER_MAX_HP: 100,
    PLAYER_START_HP: 100,
    PLAYER_MAX_MANA: 50,
    PLAYER_START_MANA: 50,
    
    // Enemy settings
    ENEMY_MAX_HP: 80,
    ENEMY_START_HP: 80,
    
    // Turn management
    MAX_TURN_COUNT: 50, // Maximum number of turns before auto-loss
    TURN_TIME_LIMIT_MS: 30000, // 30 seconds per turn
    
    // Combat mechanics
    DAMAGE_MULTIPLIER: 1.0, // Base damage multiplier
    CRITICAL_HIT_CHANCE: 0.15, // 15% chance for critical hits
    CRITICAL_HIT_MULTIPLIER: 1.5, // Critical hits deal 1.5x damage
    
    // UI settings
    ANIMATION_DURATION_MS: 300, // Default animation duration
    FLOATING_TEXT_DURATION_MS: 2000, // How long floating text stays visible
    
    // Debug settings
    ENABLE_DEBUG_LOGS: true,
    LOG_LEVEL: 'info' // 'debug', 'info', 'warn', 'error'
};