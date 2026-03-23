/**
 * Configuration constants for the Emoji Card Battle game
 *
 * This file contains all the global configuration values that control game behavior.
 * Keeping these in a separate file allows for easy tuning of game balance and mechanics.
 *
 * Design Philosophy: Slay the Spire-style deterministic combat
 * - Fixed energy per turn (resets each turn)
 * - Fixed hand size limit
 * - Deterministic draw pile behavior
 */

// Game constants
export const GAME_CONFIG = {
    // ───────────────────────────────────────────────────────────────────────────
    // Core Game Settings
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * @type {number}
     * @description Target frames per second for the game loop
     */
    FRAME_RATE: 60,

    /**
     * @type {number}
     * @description Duration of each frame in milliseconds (1000 / FRAME_RATE)
     */
    FRAME_DURATION_MS: 1000 / 60,

    // ───────────────────────────────────────────────────────────────────────────
    // Player Settings (Slay the Spire Style)
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * @type {number}
     * @description Maximum player health points
     */
    PLAYER_MAX_HP: 100,

    /**
     * @type {number}
     * @description Starting player health points (same as max for simplicity)
     */
    PLAYER_START_HP: 100,

    /**
     * @type {number}
     * @description Energy gained at the start of each turn (Slay the Spire style)
     * @see https://slay-the-spire.fandom.com/wiki/Energy
     */
    PLAYER_ENERGY: 3,

    /**
     * @type {number}
     * @description Maximum energy cap (usually same as PLAYER_ENERGY)
     */
    PLAYER_MAX_ENERGY: 3,

    // ───────────────────────────────────────────────────────────────────────────
    // Card Pile Settings (Slay the Spire Style)
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * @type {number}
     * @description Maximum number of cards a player can hold in hand
     * @note Exceeding this limit prevents drawing additional cards
     */
    HAND_SIZE: 10,

    /**
     * @type {number}
     * @description Initial draw pile size (starter deck size)
     * @note Starter deck: 5 Attack + 5 Defend = 10 cards
     */
    DRAW_PILE_SIZE: 10,

    /**
     * @type {number|null}
     * @description Maximum discard pile size (null = unlimited)
     */
    DISCARD_PILE_SIZE: null,

    /**
     * @type {number}
     * @description Initial hand size at start of combat
     */
    STARTING_HAND_SIZE: 5,

    // ───────────────────────────────────────────────────────────────────────────
    // Enemy Settings
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * @type {number}
     * @description Default enemy maximum health points
     */
    ENEMY_MAX_HP: 80,

    /**
     * @type {number}
     * @description Default enemy starting health points
     */
    ENEMY_START_HP: 80,

    // ───────────────────────────────────────────────────────────────────────────
    // Turn Management
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * @type {number}
     * @description Maximum number of turns before auto-loss (prevents infinite games)
     */
    MAX_TURN_COUNT: 50,

    /**
     * @type {number}
     * @description Time limit per turn in milliseconds (optional, for timed modes)
     */
    TURN_TIME_LIMIT_MS: 30000,

    // ───────────────────────────────────────────────────────────────────────────
    // Combat Mechanics
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * @type {number}
     * @description Base damage multiplier for all attacks
     */
    DAMAGE_MULTIPLIER: 1.0,

    /**
     * @type {number}
     * @description Base critical hit chance (15%)
     */
    CRITICAL_HIT_CHANCE: 0.15,

    /**
     * @type {number}
     * @description Critical hits deal this multiplier of normal damage
     */
    CRITICAL_HIT_MULTIPLIER: 1.5,

    // ───────────────────────────────────────────────────────────────────────────
    // UI Settings
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * @type {number}
     * @description Default animation duration in milliseconds
     */
    ANIMATION_DURATION_MS: 300,

    /**
     * @type {number}
     * @description Duration floating text stays visible in milliseconds
     */
    FLOATING_TEXT_DURATION_MS: 2000,

    // ───────────────────────────────────────────────────────────────────────────
    // Debug Settings
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * @type {boolean}
     * @description Whether debug mode is enabled
     */
    ENABLE_DEBUG_LOGS: true,

    /**
     * @type {string}
     * @description Log level: 'debug', 'info', 'warn', 'error'
     */
    LOG_LEVEL: 'info'
};

/**
 * Freeze the config object to prevent accidental modifications
 * @type {Readonly<typeof GAME_CONFIG>}
 */
export default Object.freeze(GAME_CONFIG);
