/**
 * Game State Management Module for Emoji Card Battle
 * 
 * This module implements the core game state management system.
 * It provides functions to initialize and manage the game's state,
 * including player health, enemy health, mana, turn count, and other
 * critical game variables.
 * 
 * The state object is designed to be a single source of truth for all
 * game data, ensuring consistency across the application.
 */

// Import configuration constants
import { GAME_CONFIG } from './config.js';
import { cardKeeper, buildEffectLog } from './cardKeeper.js';

/**
 * Initializes the game state object
 * 
 * This function creates and returns a new game state object with default
 * values for all game variables. The state object contains properties
 * for player stats, enemy stats, game mechanics, and UI state.
 * 
 * @returns {Object} The initialized game state object
 */
export function initializeGameState() {
    // Create the game state object with all necessary properties
    const gameState = {
        // Player-related state variables
        // These represent the player's current status in the game
        playerHp: GAME_CONFIG.PLAYER_START_HP, // Current player health points (HP)
        playerMaxHp: GAME_CONFIG.PLAYER_MAX_HP, // Maximum player health points (HP)
        playerMana: GAME_CONFIG.PLAYER_START_MANA, // Current player mana points
        playerMaxMana: GAME_CONFIG.PLAYER_MAX_MANA, // Maximum player mana points
        playerShields: {}, // Active shields: { bubble: {count, absorb}, flame: {remaining}, etc. }

        // Enemy-related state variables
        // These represent the enemy's current status in the game
        enemyHp: GAME_CONFIG.ENEMY_START_HP, // Current enemy health points (HP)
        enemyMaxHp: GAME_CONFIG.ENEMY_MAX_HP, // Maximum enemy health points (HP)
        enemy: null, // Reference to the enemy object
        enemyAttackInterval: 1, // Enemy attacks every N turns
        enemyAttackCooldown: 1, // Turns remaining until enemy attack
        
        // Game progression state variables for future use
        turnCount: 1, // Current turn number (starts at 1)
        currentPhase: 'player', // Current turn phase ('player', 'enemy', 'end')
        isGameOver: false, // Flag indicating if the game has ended
        gameOverReason: null, // Reason for game over ('player_win', 'player_loss', etc.)
        
        // Combat state variables
        // These track the current combat situation
        lastDamageDealt: 0, // Amount of damage dealt in the last action
        lastDamageTaken: 0, // Amount of damage taken in the last action
        isCriticalHit: false, // Flag indicating if the last hit was a critical hit
        
        // UI state variables
        // These control the visual state of the game interface
        selectedCard: null, // Currently selected card (null if none selected)
        hand: [], // Array of cards currently in the player's hand
        deck: [], // Array of cards in the player's deck
        discardPile: [], // Array of discarded cards
        
        // Game mechanics state variables
        // These track special game mechanics and effects
        activeEffects: [], // Array of currently active effects (poison, stun, etc.)
        cooldowns: {}, // Object tracking cooldowns for abilities
        
        // Debug state variables
        // These are used for debugging and development
        debugMode: GAME_CONFIG.ENABLE_DEBUG_LOGS, // Whether debug mode is enabled
        lastUpdateTimestamp: performance.now(), // Timestamp of last state update
        frameCount: 0, // Number of frames processed
        
        // References to game objects
        // These provide access to game components for state updates
        turnManager: null, // Reference to the turn manager instance
        engine: null, // Reference to the game engine instance
        
        // Utility methods for state manipulation
        // These methods provide safe ways to modify game state
        updatePlayerHp: function(newHp) {
            // Clamp the new HP value between 0 and max HP
            this.playerHp = Math.max(0, Math.min(this.playerMaxHp, newHp));
            
            // Log the HP change if debug mode is enabled
            if (this.debugMode && GAME_CONFIG.LOG_LEVEL === 'info') {
                console.log(`Player HP updated: ${this.playerHp}/${this.playerMaxHp}`);
            }
        },
        
        updateEnemyHp: function(newHp) {
            // Clamp the new HP value between 0 and max HP
            this.enemyHp = Math.max(0, Math.min(this.enemyMaxHp, newHp));

            // Sync with enemy object if it exists (single source of truth)
            if (this.enemy && typeof this.enemy.hp !== 'undefined') {
                this.enemy.hp = this.enemyHp;
            }

            // Log the HP change if debug mode is enabled
            if (this.debugMode && GAME_CONFIG.LOG_LEVEL === 'info') {
                console.log(`Enemy HP updated: ${this.enemyHp}/${this.enemyMaxHp}`);
            }
        },
        
        updatePlayerMana: function(newMana) {
            // Clamp the new mana value between 0 and max mana
            this.playerMana = Math.max(0, Math.min(this.playerMaxMana, newMana));

            // Log the mana change if debug mode is enabled
            if (this.debugMode && GAME_CONFIG.LOG_LEVEL === 'info') {
                console.log(`Player Mana updated: ${this.playerMana}/${this.playerMaxMana}`);
            }
        },

        /**
         * Adds a shield to the player
         * @param {string} shieldName - Name of the shield (e.g., 'bubble', 'flame')
         * @param {Object} shieldData - Shield data { count, absorbPerBubble } or { remaining }
         */
        addShield: function(shieldName, shieldData) {
            this.playerShields[shieldName] = { ...shieldData };
            console.log(`[Shield] ${shieldName} added:`, shieldData);
        },

        /**
         * Removes a shield from the player
         * @param {string} shieldName - Name of the shield to remove
         */
        removeShield: function(shieldName) {
            if (this.playerShields[shieldName]) {
                delete this.playerShields[shieldName];
                console.log(`[Shield] ${shieldName} removed`);
            }
        },

        /**
         * Absorbs damage using active shields
         * @param {number} damage - Incoming damage
         * @returns {Object} { absorbed, remainingDamage, shieldUpdates }
         */
        absorbDamage: function(damage) {
            let remainingDamage = damage;
            let totalAbsorbed = 0;
            const shieldUpdates = [];

            // Process each active shield
            for (const [name, shield] of Object.entries(this.playerShields)) {
                if (remainingDamage <= 0) break;

                if (shield.count !== undefined && shield.count > 0) {
                    // Bubble-style shield (discrete charges)
                    const absorbed = Math.min(shield.absorbPerBubble || 0, remainingDamage);
                    if (absorbed > 0) {
                        shield.count -= 1;
                        remainingDamage -= absorbed;
                        totalAbsorbed += absorbed;
                        shieldUpdates.push({ name, absorbed, remaining: shield.count });
                        console.log(`[Shield] ${name} absorbed ${absorbed} damage (${shield.count} charges left)`);
                        
                        if (shield.count <= 0) {
                            delete this.playerShields[name];
                            console.log(`[Shield] ${name} depleted`);
                        }
                    }
                } else if (shield.remaining !== undefined && shield.remaining > 0) {
                    // Pool-style shield (FlameShield, IceWall)
                    const absorbed = Math.min(shield.remaining, remainingDamage);
                    shield.remaining -= absorbed;
                    remainingDamage -= absorbed;
                    totalAbsorbed += absorbed;
                    shieldUpdates.push({ name, absorbed, remaining: shield.remaining });
                    console.log(`[Shield] ${name} absorbed ${absorbed} damage (${shield.remaining} left)`);
                    
                    if (shield.remaining <= 0) {
                        delete this.playerShields[name];
                        console.log(`[Shield] ${name} depleted`);
                    }
                }
            }

            return {
                absorbed: totalAbsorbed,
                remainingDamage: Math.max(0, remainingDamage),
                shieldUpdates
            };
        },

        addEffect: function(effect) {
            // Add a new effect to the active effects array
            this.activeEffects.push(effect);
            
            // Log the effect addition if debug mode is enabled
            if (this.debugMode && GAME_CONFIG.LOG_LEVEL === 'info') {
                console.log(`Effect added: ${effect.name}`);
            }
            cardKeeper('effect_applied_player', {
                target: 'player',
                effect: buildEffectLog(effect)
            });
        },
        
        removeEffect: function(effectName) {
            // Remove an effect by name from the active effects array
            const index = this.activeEffects.findIndex(effect => effect.name === effectName);
            if (index !== -1) {
                this.activeEffects.splice(index, 1);
                
                // Log the effect removal if debug mode is enabled
                if (this.debugMode && GAME_CONFIG.LOG_LEVEL === 'info') {
                    console.log(`Effect removed: ${effectName}`);
                }
            }
        },
        
        reset: function() {
            // Reset all state variables to their initial values
            this.playerHp = GAME_CONFIG.PLAYER_START_HP;
            this.playerMaxHp = GAME_CONFIG.PLAYER_MAX_HP;
            this.playerMana = GAME_CONFIG.PLAYER_START_MANA;
            this.playerMaxMana = GAME_CONFIG.PLAYER_MAX_MANA;
            this.playerShields = {}; // Clear all shields
            this.enemyHp = GAME_CONFIG.ENEMY_START_HP;
            this.enemyMaxHp = GAME_CONFIG.ENEMY_MAX_HP;
            this.enemyAttackInterval = 1;
            this.enemyAttackCooldown = 1;
            this.turnCount = 1;
            this.currentPhase = 'player';
            this.isGameOver = false;
            this.gameOverReason = null;
            this.lastDamageDealt = 0;
            this.lastDamageTaken = 0;
            this.isCriticalHit = false;
            this.selectedCard = null;
            this.hand = [];
            this.deck = [];
            this.discardPile = [];
            this.activeEffects = [];
            this.cooldowns = {};
            this.lastUpdateTimestamp = performance.now();
            this.frameCount = 0;
            
            // Log the state reset if debug mode is enabled
            if (this.debugMode && GAME_CONFIG.LOG_LEVEL === 'info') {
                console.log('Game state reset to initial values');
            }
        }
    };
    
    // Log the initialization of the game state
    console.log('Game state initialized with default values');
    
    // Return the initialized game state object
    return gameState;
}