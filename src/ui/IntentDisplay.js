/**
 * IntentDisplay Module for Emoji Card Battle
 *
 * This module handles the visual rendering of enemy intents.
 * Intent icons (⚔️🛡️💪 etc.) are displayed above the enemy emoji
 * to telegraph what the enemy will do this turn.
 *
 * Design Philosophy: Slay the Spire-style intent display
 * - Clear visual feedback for enemy intentions
 * - Icon appears above enemy emoji
 * - Color-coded by intent type
 * - Tooltip shows exact values
 *
 * @module ui/IntentDisplay
 */

// Import IntentType and IntentIcon from EnemyBase
import { IntentType, IntentIcon } from '../enemies/EnemyBase.js';

/**
 * IntentDisplay Class
 *
 * Manages the visual display of enemy intents:
 * - Renders intent icon above enemy emoji
 * - Updates display when intent changes
 * - Shows tooltip with intent details
 * - Animates intent reveal
 *
 * @example
 * const intentDisplay = new IntentDisplay('enemy-area');
 * intentDisplay.render(intent);
 * intentDisplay.update();
 */
export class IntentDisplay {
    /**
     * Creates a new IntentDisplay instance
     *
     * @param {string} containerId - ID of the enemy container element
     */
    constructor(containerId = 'enemy-area') {
        /**
         * @private
         * @type {string}
         * @description Container element ID
         */
        this.containerId = containerId;

        /**
         * @private
         * @type {HTMLElement}
         * @description Container element reference
         */
        this.container = document.getElementById(containerId);

        /**
         * @private
         * @type {HTMLElement}
         * @description Intent icon element
         */
        this.intentElement = null;

        /**
         * @private
         * @type {HTMLElement}
         * @description Tooltip element
         */
        this.tooltipElement = null;

        /**
         * @type {Object|null}
         * @description Current intent being displayed
         */
        this.currentIntent = null;

        /**
         * @type {boolean}
         * @description Whether display is visible
         */
        this.isVisible = false;

        // Intent type colors for visual feedback
        this.intentColors = {
            [IntentType.ATTACK]: '#ff5252',    // Red
            [IntentType.BLOCK]: '#448aff',     // Blue
            [IntentType.BUFF]: '#69f0ae',      // Green
            [IntentType.DEBUFF]: '#e040fb',    // Purple
            [IntentType.HEAL]: '#69f0ae',      // Green
            [IntentType.SPECIAL]: '#ffd740',   // Yellow
            [IntentType.PASS]: '#9e9e9e'       // Gray
        };

        console.log('[IntentDisplay] Initialized for', containerId);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Render Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Renders the intent icon above the enemy
     *
     * @param {Object} intent - Intent object to display
     * @returns {Object} Render result
     *
     * @example
     * intentDisplay.render({ type: 'attack', value: 12, icon: '⚔️' });
     */
    render(intent) {
        if (!this.container) {
            console.warn('[IntentDisplay] Container not found:', this.containerId);
            return { success: false, reason: 'no_container' };
        }

        if (!intent) {
            console.warn('[IntentDisplay] No intent provided');
            return { success: false, reason: 'no_intent' };
        }

        this.currentIntent = intent;

        // Remove existing intent element if present
        this.remove();

        // Create intent container
        const intentContainer = document.createElement('div');
        intentContainer.className = 'intent-display';
        intentContainer.id = 'intent-display';

        // Create icon element
        const iconElement = document.createElement('div');
        iconElement.className = 'intent-icon';
        iconElement.textContent = intent.icon || this.getIntentIcon(intent.type);
        iconElement.dataset.intentType = intent.type;

        // Create value text element
        const valueElement = document.createElement('span');
        valueElement.className = 'intent-value';
        valueElement.textContent = this.getIntentValue(intent);

        // Create tooltip
        const tooltipElement = document.createElement('div');
        tooltipElement.className = 'intent-tooltip';
        tooltipElement.textContent = this.getIntentDescription(intent);

        // Assemble elements
        iconElement.appendChild(valueElement);
        iconElement.appendChild(tooltipElement);
        intentContainer.appendChild(iconElement);

        // Insert at the top of enemy area (above emoji)
        const enemyGraphic = this.container.querySelector('#enemy-graphic');
        if (enemyGraphic) {
            enemyGraphic.insertBefore(intentContainer, enemyGraphic.firstChild);
        } else {
            this.container.insertBefore(intentContainer, this.container.firstChild);
        }

        // Store references
        this.intentElement = intentContainer;
        this.tooltipElement = tooltipElement;

        // Apply color based on intent type
        this._applyIntentColor(intent.type);

        // Show with animation
        this._animateReveal();

        this.isVisible = true;

        console.log('[IntentDisplay] Rendered:', intent.type, intent.icon);

        return {
            success: true,
            intent: intent.type,
            element: intentContainer
        };
    }

    /**
     * Updates the display with new intent
     *
     * @param {Object} intent - New intent to display
     * @returns {Object} Update result
     */
    update(intent) {
        if (intent) {
            return this.render(intent);
        }

        // Just refresh current display
        if (this.currentIntent && this.intentElement) {
            this._applyIntentColor(this.currentIntent.type);
        }

        return { success: true };
    }

    /**
     * Removes the intent display
     *
     * @returns {Object} Remove result
     */
    remove() {
        if (this.intentElement && this.intentElement.parentNode) {
            this.intentElement.parentNode.removeChild(this.intentElement);
            this.intentElement = null;
            this.tooltipElement = null;
            this.isVisible = false;

            console.log('[IntentDisplay] Removed');
        }

        return { success: true };
    }

    /**
     * Clears the current intent display
     */
    clear() {
        this.currentIntent = null;
        this.remove();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Helper Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Gets the icon emoji for an intent type
     *
     * @param {string} type - Intent type
     * @returns {string} Icon emoji
     */
    getIntentIcon(type) {
        return IntentIcon[type] || '❓';
    }

    /**
     * Gets the value text for an intent
     *
     * @param {Object} intent - Intent object
     * @returns {string} Value text
     */
    getIntentValue(intent) {
        // Priority order for value
        if (intent.value !== undefined) {
            return intent.value;
        }
        if (intent.damage !== undefined) {
            return intent.damage;
        }
        if (intent.block !== undefined) {
            return intent.block;
        }
        if (intent.healAmount !== undefined) {
            return intent.healAmount;
        }
        if (intent.name) {
            return '';
        }
        return '';
    }

    /**
     * Gets the description text for tooltip
     *
     * @param {Object} intent - Intent object
     * @returns {string} Description
     */
    getIntentDescription(intent) {
        const descriptions = {
            [IntentType.ATTACK]: `Deal ${intent.value ?? intent.damage ?? '?'} damage`,
            [IntentType.BLOCK]: `Gain ${intent.value ?? intent.block ?? '?'} block`,
            [IntentType.BUFF]: `Buff: ${intent.name ?? 'Self'}`,
            [IntentType.DEBUFF]: `Debuff: ${intent.name ?? 'Weak'}`,
            [IntentType.HEAL]: `Heal ${intent.value ?? intent.healAmount ?? '?'} HP`,
            [IntentType.SPECIAL]: `${intent.name ?? 'Special'}: ${intent.value ?? '?'}`,
            [IntentType.PASS]: 'Do nothing'
        };

        return descriptions[intent.type] || 'Unknown action';
    }

    /**
     * Applies color based on intent type
     *
     * @private
     * @param {string} type - Intent type
     */
    _applyIntentColor(type) {
        if (!this.intentElement) return;

        const color = this.intentColors[type] || '#ffffff';
        const iconElement = this.intentElement.querySelector('.intent-icon');

        if (iconElement) {
            iconElement.style.borderColor = color;
            iconElement.style.boxShadow = `0 0 15px ${color}80`; // 50% opacity
        }
    }

    /**
     * Animates the intent reveal
     *
     * @private
     */
    _animateReveal() {
        if (!this.intentElement) return;

        const iconElement = this.intentElement.querySelector('.intent-icon');
        if (iconElement) {
            iconElement.classList.add('intent-reveal');

            // Remove animation class after it completes
            setTimeout(() => {
                iconElement.classList.remove('intent-reveal');
            }, 600);
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Utility Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Checks if display is currently showing
     *
     * @returns {boolean} Whether display is visible
     */
    isShowing() {
        return this.isVisible && this.currentIntent !== null;
    }

    /**
     * Gets the current intent being displayed
     *
     * @returns {Object|null} Current intent
     */
    getCurrentIntent() {
        return this.currentIntent;
    }

    /**
     * Resets the display to initial state
     *
     * @returns {Object} Reset result
     */
    reset() {
        this.remove();
        this.currentIntent = null;
        this.isVisible = false;

        return { success: true };
    }

    /**
     * Destroys the display and cleans up
     */
    destroy() {
        this.remove();
        this.container = null;
        console.log('[IntentDisplay] Destroyed');
    }
}

/**
 * Creates and initializes an IntentDisplay instance
 *
 * @param {string} [containerId='enemy-area'] - Container element ID
 * @returns {IntentDisplay} The initialized IntentDisplay instance
 */
export function initializeIntentDisplay(containerId = 'enemy-area') {
    const display = new IntentDisplay(containerId);
    console.log('[IntentDisplay] Initialized successfully');
    return display;
}

export default IntentDisplay;
