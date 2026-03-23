/**
 * CombatManager Module for Emoji Card Battle
 *
 * This module manages combat state and turn resolution.
 * It coordinates between the player, enemies, and action execution.
 *
 * Design Philosophy: Slay the Spire-style deterministic combat
 * - Clear turn phases (Player → Enemy → End)
 * - Action queue for resolving played cards
 * - Win/loss condition checking
 *
 * @module combat/CombatManager
 */

// Import configuration constants
import { GAME_CONFIG } from '../core/config.js';

/**
 * CombatPhase Enum - Combat phase states
 * @readonly
 * @enum {string}
 */
export const CombatPhase = {
    /** Player's turn - can play cards */
    PLAYER: 'player',
    /** Enemy's turn - enemy acts */
    ENEMY: 'enemy',
    /** Turn end - cleanup and transition */
    END: 'end',
    /** Combat starting */
    START: 'start',
    /** Combat ended */
    COMBAT_END: 'combat_end'
};

/**
 * CombatManager Class
 *
 * Manages all combat-related functionality:
 * - Turn phase management
 * - Action queue processing
 * - Win/loss condition checking
 * - Combat start/end events
 *
 * @example
 * const combatManager = new CombatManager(gameState);
 * combatManager.startCombat();
 * combatManager.playCard(card, target);
 * combatManager.endTurn();
 */
export class CombatManager {
    /**
     * Creates a new CombatManager instance
     *
     * @param {Object} gameState - Reference to the game state object
     * @param {Array} [combatActions=[]] - Array of action classes for combat
     */
    constructor(gameState, combatActions = []) {
        /**
         * @private
         * @type {Object}
         * @description Reference to the game state
         */
        this.gameState = gameState;

        /**
         * @type {CombatPhase}
         * @description Current combat phase
         */
        this.currentPhase = CombatPhase.START;

        /**
         * @type {boolean}
         * @description Whether combat is active
         */
        this.isCombatActive = false;

        /**
         * @type {Array}
         * @description Queue of actions to resolve
         */
        this.actionQueue = [];

        /**
         * @type {Array}
         * @description Combat action classes
         */
        this.combatActions = combatActions;

        /**
         * @type {Object|null}
         * @description Combat result when combat ends
         */
        this.combatResult = null;

        console.log('[CombatManager] Initialized');
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Combat Lifecycle Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Starts a new combat
     *
     * @returns {Object} Combat start result
     *
     * @example
     * const result = combatManager.startCombat();
     * if (result.success) {
     *     console.log('Combat started!');
     * }
     */
    startCombat() {
        if (this.isCombatActive) {
            console.warn('[CombatManager] Combat already active');
            return { success: false, reason: 'combat_already_active' };
        }

        this.isCombatActive = true;
        this.currentPhase = CombatPhase.PLAYER;
        this.actionQueue = [];
        this.combatResult = null;

        // Update game state
        if (this.gameState) {
            this.gameState.isGameOver = false;
            this.gameState.gameOverReason = null;
            this.gameState.phase = CombatPhase.PLAYER;
        }

        console.log('[CombatManager] Combat started');

        return {
            success: true,
            phase: this.currentPhase,
            message: 'Combat started!'
        };
    }

    /**
     * Ends the current combat
     *
     * @param {string} reason - Reason for combat end: 'win', 'loss', 'flee'
     * @returns {Object} Combat end result
     */
    endCombat(reason = 'win') {
        if (!this.isCombatActive) {
            console.warn('[CombatManager] No active combat to end');
            return { success: false, reason: 'no_active_combat' };
        }

        this.isCombatActive = false;
        this.currentPhase = CombatPhase.COMBAT_END;
        this.combatResult = {
            outcome: reason,
            turn: this.gameState?.turn || 1
        };

        // Update game state
        if (this.gameState) {
            this.gameState.isGameOver = (reason === 'loss');
            this.gameState.gameOverReason = (reason === 'win') ? 'player_win' : 'player_loss';
        }

        console.log(`[CombatManager] Combat ended: ${reason}`);

        return {
            success: true,
            outcome: reason,
            result: this.combatResult
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Turn Management Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Ends the current turn and advances to the next phase
     *
     * @returns {Object} Turn end result
     *
     * @example
     * const result = combatManager.endTurn();
     * if (result.success) {
     *     console.log(`Next phase: ${result.nextPhase}`);
     * }
     */
    endTurn() {
        if (!this.isCombatActive) {
            return { success: false, reason: 'combat_not_active' };
        }

        // Process any remaining actions in queue
        this.processActionQueue();

        // Discard hand at end of turn (StS rule)
        if (this.gameState?.cardPileManager) {
            this.gameState.cardPileManager.discardHand();
        }

        // Advance to enemy phase
        this.currentPhase = CombatPhase.ENEMY;

        if (this.gameState) {
            this.gameState.phase = CombatPhase.ENEMY;
        }

        console.log('[CombatManager] Turn ended, enemy phase');

        return {
            success: true,
            nextPhase: CombatPhase.ENEMY,
            message: 'Turn ended'
        };
    }

    /**
     * Starts the next turn
     *
     * @returns {Object} Turn start result
     */
    startNextTurn() {
        if (!this.isCombatActive) {
            return { success: false, reason: 'combat_not_active' };
        }

        // Increment turn counter
        if (this.gameState) {
            this.gameState.turn = (this.gameState.turn || 1) + 1;
        }

        // Reset energy
        if (this.gameState?.energyManager) {
            this.gameState.energyManager.reset();
        }

        // Set phase to player
        this.currentPhase = CombatPhase.PLAYER;

        if (this.gameState) {
            this.gameState.phase = CombatPhase.PLAYER;
        }

        // Draw cards for new turn
        if (this.gameState?.cardPileManager) {
            this.gameState.cardPileManager.drawCard(5); // Draw 5 cards per turn (StS rule)
        }

        console.log(`[CombatManager] Turn ${this.gameState?.turn || 1} started`);

        return {
            success: true,
            turn: this.gameState?.turn || 1,
            phase: CombatPhase.PLAYER
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Action Queue Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Adds an action to the queue
     *
     * @param {Object} action - Action instance to add
     * @returns {Object} Queue result
     */
    queueAction(action) {
        this.actionQueue.push(action);

        console.log(`[CombatManager] Action queued: ${action.constructor.name}`);

        return {
            success: true,
            queueLength: this.actionQueue.length
        };
    }

    /**
     * Processes all actions in the queue
     *
     * @returns {Object} Processing result with action results
     */
    processActionQueue() {
        const results = [];

        while (this.actionQueue.length > 0) {
            const action = this.actionQueue.shift();
            const result = action.execute(this.gameState);
            results.push(result);
        }

        console.log(`[CombatManager] Processed ${results.length} actions`);

        return {
            success: true,
            actionCount: results.length,
            results
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Card Play Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Plays a card (creates action and queues it)
     *
     * @param {Object} card - Card to play
     * @param {Object} target - Target for the card
     * @returns {Object} Play result
     *
     * @example
     * const result = combatManager.playCard(fireballCard, enemy);
     */
    playCard(card, target) {
        if (!this.isCombatActive) {
            return { success: false, reason: 'combat_not_active' };
        }

        if (this.currentPhase !== CombatPhase.PLAYER) {
            return { success: false, reason: 'not_player_phase' };
        }

        // Check if card can be played
        const canPlayResult = card.canPlay(this.gameState);
        if (!canPlayResult.canPlay) {
            return {
                success: false,
                reason: canPlayResult.reason,
                message: `Cannot play: ${canPlayResult.reason}`
            };
        }

        // Play the card (this handles energy spending and effect execution)
        const playResult = card.play(this.gameState, target);

        if (!playResult.success) {
            return playResult;
        }

        console.log(`[CombatManager] Card played: ${card.name}`);

        return playResult;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Win/Loss Checking
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Checks win/loss conditions
     *
     * @returns {Object|null} Result if combat ended, null if ongoing
     *
     * @example
     * const result = combatManager.checkWinLoss();
     * if (result) {
     *     console.log(`Combat ended: ${result.outcome}`);
     * }
     */
    checkWinLoss() {
        // Check player defeat
        if (this.gameState?.playerHp <= 0) {
            this.endCombat('loss');
            return {
                isCombatEnd: true,
                outcome: 'loss',
                reason: 'player_hp_zero'
            };
        }

        // Check enemy defeat
        if (this.gameState?.enemyHp <= 0) {
            this.endCombat('win');
            return {
                isCombatEnd: true,
                outcome: 'win',
                reason: 'enemy_hp_zero'
            };
        }

        // Check turn limit
        const maxTurns = GAME_CONFIG.MAX_TURN_COUNT;
        if ((this.gameState?.turn || 1) >= maxTurns) {
            this.endCombat('timeout');
            return {
                isCombatEnd: true,
                outcome: 'loss',
                reason: 'turn_limit'
            };
        }

        // Combat continues
        return null;
    }

    /**
     * Resolves the current turn (processes all actions and checks win/loss)
     *
     * @returns {Object} Turn resolution result
     */
    resolveTurn() {
        // Process action queue
        const queueResult = this.processActionQueue();

        // Check win/loss
        const winLossResult = this.checkWinLoss();

        if (winLossResult) {
            return {
                success: true,
                turnResolved: true,
                combatEnded: true,
                ...winLossResult
            };
        }

        return {
            success: true,
            turnResolved: true,
            combatEnded: false,
            actionsProcessed: queueResult.actionCount
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Utility Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Gets the current combat state summary
     *
     * @returns {Object} Combat state summary
     */
    getCombatSummary() {
        return {
            isCombatActive: this.isCombatActive,
            phase: this.currentPhase,
            turn: this.gameState?.turn || 1,
            playerHp: this.gameState?.playerHp || 0,
            enemyHp: this.gameState?.enemyHp || 0,
            actionQueueLength: this.actionQueue.length
        };
    }

    /**
     * Resets the combat manager to initial state
     *
     * @returns {Object} Reset result
     */
    reset() {
        this.currentPhase = CombatPhase.START;
        this.isCombatActive = false;
        this.actionQueue = [];
        this.combatResult = null;

        console.log('[CombatManager] Reset');

        return { success: true };
    }
}

export default CombatManager;
