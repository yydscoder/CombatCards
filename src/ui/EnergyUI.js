/**
 * EnergyUI Module for Emoji Card Battle
 *
 * This module handles the visual rendering of the player's energy system.
 * Energy is displayed as orbs/bubbles that fill when energy is available
 * and empty when energy is spent.
 *
 * Design Philosophy: Slay the Spire-style energy orbs
 * - Visual feedback for available energy
 * - Animation on spend/gain events
 * - CSS ::before elements for orb graphics
 *
 * @module ui/EnergyUI
 */

// Import configuration constants
import { GAME_CONFIG } from '../core/config.js';

/**
 * EnergyUI Class
 *
 * Manages the visual representation of energy:
 * - Renders energy orbs at the top of the screen
 * - Updates orb fill state based on current energy
 * - Animates spend and gain events
 * - Syncs with EnergyManager state
 *
 * @example
 * const energyUI = new EnergyUI(gameState, energyManager, 'player-area');
 * energyUI.render();
 * energyUI.update();
 */
export class EnergyUI {
    /**
     * Creates a new EnergyUI instance
     *
     * @param {Object} gameState - Reference to the game state object
     * @param {Object} energyManager - Reference to the EnergyManager instance
     * @param {string} containerId - ID of the container element for energy display
     */
    constructor(gameState, energyManager, containerId = 'player-area') {
        /**
         * @private
         * @type {Object}
         * @description Reference to the game state
         */
        this.gameState = gameState;

        /**
         * @private
         * @type {Object}
         * @description Reference to the EnergyManager
         */
        this.energyManager = energyManager;

        /**
         * @private
         * @type {HTMLElement}
         * @description Container element for energy display
         */
        this.container = document.getElementById(containerId);

        /**
         * @private
         * @type {HTMLElement}
         * @description Energy orbs container element
         */
        this.energyContainer = null;

        /**
         * @type {number}
         * @description Number of energy orbs to display
         */
        this.maxEnergy = GAME_CONFIG.PLAYER_MAX_ENERGY;

        /**
         * @private
         * @type {number}
         * @description Last known energy value for change detection
         */
        this.lastEnergyValue = -1;

        console.log('[EnergyUI] Initialized with', this.maxEnergy, 'orbs');
    }

    /**
     * Renders the energy orbs
     *
     * Creates the DOM structure for energy orbs using CSS ::before elements
     * for the orb graphics.
     *
     * @returns {Object} Render result
     *
     * @example
     * energyUI.render();
     */
    render() {
        if (!this.container) {
            console.warn('[EnergyUI] Container not found');
            return { success: false, reason: 'no_container' };
        }

        // Create energy container
        const energyContainer = document.createElement('div');
        energyContainer.className = 'energy-container';
        energyContainer.id = 'energy-display';

        // Create energy orbs
        for (let i = 0; i < this.maxEnergy; i++) {
            const orb = document.createElement('div');
            orb.className = 'energy-orb';
            orb.dataset.orbIndex = i;
            orb.dataset.state = 'full'; // full, empty, spent

            // Create tooltip
            orb.title = `Energy ${i + 1}/${this.maxEnergy}`;

            energyContainer.appendChild(orb);
        }

        // Insert at the top of the container
        this.container.insertBefore(energyContainer, this.container.firstChild);
        this.energyContainer = energyContainer;

        // Initial update
        this.update();

        console.log('[EnergyUI] Energy orbs rendered');

        return {
            success: true,
            orbCount: this.maxEnergy
        };
    }

    /**
     * Updates the energy orb display
     *
     * Syncs the visual state with the EnergyManager's current energy.
     *
     * @returns {Object} Update result
     *
     * @example
     * energyUI.update();
     */
    update() {
        if (!this.energyContainer) {
            console.warn('[EnergyUI] Energy container not rendered');
            return { success: false, reason: 'not_rendered' };
        }

        const currentEnergy = this.energyManager?.energy ?? this.gameState?.energy ?? 3;
        const orbs = this.energyContainer.querySelectorAll('.energy-orb');

        // Update each orb's state
        orbs.forEach((orb, index) => {
            const isFilled = index < currentEnergy;
            const oldState = orb.dataset.state;
            const newState = isFilled ? 'full' : 'empty';

            // Only update if state changed
            if (oldState !== newState) {
                orb.dataset.state = newState;

                // Add animation class for state change
                if (newState === 'full') {
                    orb.classList.add('orb-fill');
                    setTimeout(() => orb.classList.remove('orb-fill'), 300);
                } else {
                    orb.classList.add('orb-empty');
                    setTimeout(() => orb.classList.remove('orb-empty'), 300);
                }
            }
        });

        this.lastEnergyValue = currentEnergy;

        return {
            success: true,
            currentEnergy,
            maxEnergy: this.maxEnergy
        };
    }

    /**
     * Animates energy spend (orb empties)
     *
     * @param {number} amount - Amount of energy spent
     * @returns {Object} Animation result
     *
     * @example
     * energyUI.animateSpend(2);
     */
    animateSpend(amount = 1) {
        if (!this.energyContainer) return { success: false };

        const orbs = this.energyContainer.querySelectorAll('.energy-orb');
        let animated = 0;

        // Animate from right to left (highest index first)
        for (let i = orbs.length - 1; i >= 0 && animated < amount; i--) {
            const orb = orbs[i];
            if (orb.dataset.state === 'full') {
                orb.classList.add('orb-spend');

                // Add flash effect
                this._createSpendFlash(orb);

                setTimeout(() => {
                    orb.classList.remove('orb-spend');
                }, 400);

                animated++;
            }
        }

        console.log(`[EnergyUI] Animated spend: ${amount} energy`);

        return {
            success: true,
            animated
        };
    }

    /**
     * Animates energy gain (orb fills)
     *
     * @param {number} amount - Amount of energy gained
     * @returns {Object} Animation result
     *
     * @example
     * energyUI.animateGain(3);
     */
    animateGain(amount = 1) {
        if (!this.energyContainer) return { success: false };

        const orbs = this.energyContainer.querySelectorAll('.energy-orb');
        let animated = 0;

        // Animate from left to right (lowest index first)
        for (let i = 0; i < orbs.length && animated < amount; i++) {
            const orb = orbs[i];
            if (orb.dataset.state === 'empty') {
                orb.classList.add('orb-gain');

                // Add pulse effect
                this._createGainPulse(orb);

                setTimeout(() => {
                    orb.classList.remove('orb-gain');
                }, 400);

                animated++;
            }
        }

        console.log(`[EnergyUI] Animated gain: ${amount} energy`);

        return {
            success: true,
            animated
        };
    }

    /**
     * Creates a spend flash effect on an orb
     *
     * @private
     * @param {HTMLElement} orb - The orb element
     */
    _createSpendFlash(orb) {
        const flash = document.createElement('div');
        flash.className = 'energy-flash spend';
        orb.appendChild(flash);

        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 400);
    }

    /**
     * Creates a gain pulse effect on an orb
     *
     * @private
     * @param {HTMLElement} orb - The orb element
     */
    _createGainPulse(orb) {
        const pulse = document.createElement('div');
        pulse.className = 'energy-pulse gain';
        orb.appendChild(pulse);

        setTimeout(() => {
            if (pulse.parentNode) {
                pulse.parentNode.removeChild(pulse);
            }
        }, 400);
    }

    /**
     * Resets the energy UI to initial state
     *
     * @returns {Object} Reset result
     */
    reset() {
        this.lastEnergyValue = -1;

        if (this.energyContainer) {
            const orbs = this.energyContainer.querySelectorAll('.energy-orb');
            orbs.forEach(orb => {
                orb.dataset.state = 'full';
                orb.classList.remove('orb-spend', 'orb-gain', 'orb-fill', 'orb-empty');
            });
        }

        console.log('[EnergyUI] Reset to initial state');

        return { success: true };
    }

    /**
     * Destroys the energy UI and cleans up
     */
    destroy() {
        if (this.energyContainer && this.energyContainer.parentNode) {
            this.energyContainer.parentNode.removeChild(this.energyContainer);
        }

        this.energyContainer = null;
        this.container = null;

        console.log('[EnergyUI] Destroyed');
    }
}

/**
 * Creates and returns a new EnergyUI instance
 *
 * @param {Object} gameState - The game state object
 * @param {Object} energyManager - The EnergyManager instance
 * @param {string} [containerId='player-area'] - Container element ID
 * @returns {EnergyUI} The initialized EnergyUI instance
 */
export function initializeEnergyUI(gameState, energyManager, containerId = 'player-area') {
    const energyUI = new EnergyUI(gameState, energyManager, containerId);
    energyUI.render();
    console.log('[EnergyUI] Initialized successfully');
    return energyUI;
}

export default EnergyUI;
