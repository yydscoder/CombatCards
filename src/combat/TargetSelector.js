/**
 * TargetSelector Module for Emoji Card Battle
 *
 * This module handles target selection for cards and actions.
 * It provides both UI highlighting and validation logic for targeting.
 *
 * Design Philosophy: Slay the Spire-style targeting
 * - Clear visual feedback for valid targets
 * - Click to select target
 * - Automatic target validation
 *
 * @module combat/TargetSelector
 */

// Import CardBase for TargetType
import { TargetType } from '../cards/CardBase.js';

/**
 * TargetSelector Class
 *
 * Manages target selection:
 * - UI highlighting of valid targets
 * - Click handling for target selection
 * - Target validation logic
 * - Target type specification
 *
 * @example
 * const targetSelector = new TargetSelector(gameState);
 * targetSelector.selectTarget(card);
 * targetSelector.handleClick(clickedElement);
 */
export class TargetSelector {
    /**
     * Creates a new TargetSelector instance
     *
     * @param {Object} gameState - Reference to the game state object
     */
    constructor(gameState) {
        /**
         * @private
         * @type {Object}
         * @description Reference to the game state
         */
        this.gameState = gameState;

        /**
         * @type {Object|null}
         * @description Currently selected card awaiting target
         */
        this.pendingCard = null;

        /**
         * @type {Array<HTMLElement>}
         * @description Array of currently highlighted target elements
         */
        this.highlightedElements = [];

        /**
         * @type {Function|null}
         * @description Callback when target is selected
         */
        this.onTargetSelected = null;

        /**
         * @type {boolean}
         * @description Whether target selection is active
         */
        this.isSelecting = false;

        console.log('[TargetSelector] Initialized');
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Target Selection Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Starts target selection for a card
     *
     * @param {Object} card - Card that needs a target
     * @param {Function} callback - Callback when target is selected
     * @returns {Object} Selection start result
     *
     * @example
     * targetSelector.selectTarget(fireballCard, (target) => {
     *     console.log(`Target selected: ${target.name}`);
     * });
     */
    selectTarget(card, callback) {
        if (!card) {
            console.warn('[TargetSelector] No card provided');
            return { success: false, reason: 'no_card' };
        }

        this.pendingCard = card;
        this.isSelecting = true;
        this.onTargetSelected = callback;

        // Get valid targets
        const validTargets = this.getValidTargets(card);

        if (validTargets.length === 0) {
            console.warn('[TargetSelector] No valid targets for card');
            this.cancelSelection();
            return {
                success: false,
                reason: 'no_valid_targets',
                targetType: card.targetType
            };
        }

        // Highlight valid targets
        this.highlightTargets(validTargets);

        console.log(`[TargetSelector] Selecting target for ${card.name}: ${validTargets.length} valid targets`);

        return {
            success: true,
            targetType: card.targetType,
            validTargetCount: validTargets.length
        };
    }

    /**
     * Cancels target selection
     *
     * @returns {Object} Cancel result
     */
    cancelSelection() {
        this.pendingCard = null;
        this.isSelecting = false;
        this.onTargetSelected = null;
        this.clearHighlights();

        console.log('[TargetSelector] Selection cancelled');

        return { success: true };
    }

    /**
     * Handles click on a potential target
     *
     * @param {HTMLElement|Object} clickedElement - Clicked DOM element or target object
     * @returns {Object} Click handling result
     *
     * @example
     * targetSelector.handleClick(enemyElement);
     */
    handleClick(clickedElement) {
        if (!this.isSelecting || !this.pendingCard) {
            return { success: false, reason: 'not_selecting' };
        }

        // Find the target object from the clicked element
        const target = this.findTargetFromElement(clickedElement);

        if (!target) {
            console.warn('[TargetSelector] No target found from click');
            return { success: false, reason: 'no_target' };
        }

        // Validate the target
        const isValid = this.isValidTarget(target, this.pendingCard);

        if (!isValid) {
            console.warn('[TargetSelector] Invalid target selected');
            return {
                success: false,
                reason: 'invalid_target',
                target
            };
        }

        // Target is valid - execute callback
        if (this.onTargetSelected) {
            this.onTargetSelected(target);
        }

        // Clean up selection state
        this.clearHighlights();
        this.pendingCard = null;
        this.isSelecting = false;
        this.onTargetSelected = null;

        console.log(`[TargetSelector] Target selected: ${target.name || target.type}`);

        return {
            success: true,
            target,
            message: 'Target selected'
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Target Validation Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Gets valid targets for a card
     *
     * @param {Object} card - Card to get targets for
     * @returns {Array<Object>} Array of valid target objects
     */
    getValidTargets(card) {
        const targetType = card.targetType || TargetType.ENEMY;
        const validTargets = [];

        switch (targetType) {
            case TargetType.ENEMY:
                // Single enemy target
                if (this.gameState?.enemy) {
                    validTargets.push({
                        type: 'enemy',
                        object: this.gameState.enemy,
                        element: document.getElementById('enemy-area'),
                        name: this.gameState.enemy.name || 'Enemy'
                    });
                }
                break;

            case TargetType.SELF:
                // Player (self) target
                validTargets.push({
                    type: 'player',
                    object: this.gameState,
                    element: document.getElementById('player-area'),
                    name: 'Player'
                });
                break;

            case TargetType.ALL_ENEMIES:
                // All enemies (AOE) - for future multi-enemy support
                if (this.gameState?.enemy) {
                    validTargets.push({
                        type: 'enemy',
                        object: this.gameState.enemy,
                        element: document.getElementById('enemy-area'),
                        name: this.gameState.enemy.name || 'Enemy'
                    });
                }
                break;

            case TargetType.ANY:
                // Player chooses - both enemy and self are valid
                if (this.gameState?.enemy) {
                    validTargets.push({
                        type: 'enemy',
                        object: this.gameState.enemy,
                        element: document.getElementById('enemy-area'),
                        name: this.gameState.enemy.name || 'Enemy'
                    });
                }
                validTargets.push({
                    type: 'player',
                    object: this.gameState,
                    element: document.getElementById('player-area'),
                    name: 'Player'
                });
                break;

            default:
                console.warn(`[TargetSelector] Unknown target type: ${targetType}`);
        }

        return validTargets;
    }

    /**
     * Checks if a target is valid for a card
     *
     * @param {Object} target - Target to validate
     * @param {Object} card - Card to validate against
     * @returns {boolean} Whether the target is valid
     */
    isValidTarget(target, card) {
        if (!target || !card) {
            return false;
        }

        const targetType = card.targetType || TargetType.ENEMY;

        switch (targetType) {
            case TargetType.ENEMY:
                return target.type === 'enemy';

            case TargetType.SELF:
                return target.type === 'player';

            case TargetType.ALL_ENEMIES:
                return target.type === 'enemy';

            case TargetType.ANY:
                return target.type === 'enemy' || target.type === 'player';

            default:
                return false;
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // UI Highlighting Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Highlights valid target elements
     *
     * @param {Array<Object>} targets - Array of target objects to highlight
     */
    highlightTargets(targets) {
        this.clearHighlights();

        targets.forEach(target => {
            if (target.element) {
                target.element.classList.add('target-valid');
                target.element.dataset.targetType = target.type;
                this.highlightedElements.push(target.element);
            }
        });

        console.log(`[TargetSelector] Highlighted ${targets.length} targets`);
    }

    /**
     * Clears all target highlights
     */
    clearHighlights() {
        this.highlightedElements.forEach(element => {
            element.classList.remove('target-valid', 'target-hover');
            delete element.dataset.targetType;
        });
        this.highlightedElements = [];

        console.log('[TargetSelector] Highlights cleared');
    }

    /**
     * Finds the target object from a clicked DOM element
     *
     * @param {HTMLElement} element - Clicked element
     * @returns {Object|null} Target object or null
     */
    findTargetFromElement(element) {
        // Check if element has target data
        if (element.dataset.targetType) {
            const type = element.dataset.targetType;

            if (type === 'enemy' && this.gameState?.enemy) {
                return {
                    type: 'enemy',
                    object: this.gameState.enemy,
                    element,
                    name: this.gameState.enemy.name || 'Enemy'
                };
            }

            if (type === 'player') {
                return {
                    type: 'player',
                    object: this.gameState,
                    element,
                    name: 'Player'
                };
            }
        }

        // Check parent elements (for nested clicks)
        const parent = element.closest('[data-target-type]');
        if (parent) {
            return this.findTargetFromElement(parent);
        }

        // Check by ID
        if (element.id === 'enemy-area' && this.gameState?.enemy) {
            return {
                type: 'enemy',
                object: this.gameState.enemy,
                element,
                name: this.gameState.enemy.name || 'Enemy'
            };
        }

        if (element.id === 'player-area') {
            return {
                type: 'player',
                object: this.gameState,
                element,
                name: 'Player'
            };
        }

        return null;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Utility Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Gets the currently pending card
     *
     * @returns {Object|null} Pending card or null
     */
    getPendingCard() {
        return this.pendingCard;
    }

    /**
     * Checks if currently selecting a target
     *
     * @returns {boolean} Whether target selection is active
     */
    isSelectingTarget() {
        return this.isSelecting;
    }

    /**
     * Resets the target selector
     *
     * @returns {Object} Reset result
     */
    reset() {
        this.pendingCard = null;
        this.isSelecting = false;
        this.onTargetSelected = null;
        this.clearHighlights();

        return { success: true };
    }
}

export default TargetSelector;
