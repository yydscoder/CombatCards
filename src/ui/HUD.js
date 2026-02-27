/**
 * HUD (Heads-Up Display) Module for Emoji Card Battle
 * 
 * This module manages the game's heads-up display, including:
 * - Health bars for player and enemy
 * - Mana display
 * - Turn counter
 * - Status messages
 * 
 * The HUD provides visual feedback for game state changes.
 */

// Import configuration constants
import { GAME_CONFIG } from '../core/config.js';

/**
 * HUD class - Manages the game's heads-up display
 * 
 * This class handles all HUD-related functionality, including
 * health bar updates, mana display, turn counter, and status messages.
 */
export class HUD {
    /**
     * Creates a new HUD instance
     * @param {Object} gameState - Reference to the game state object
     */
    constructor(gameState) {
        // Store reference to game state
        this.gameState = gameState;
        
        // Cache DOM elements
        this.elements = {
            playerHp: document.getElementById('player-hp'),
            playerMana: document.getElementById('player-mana'),
            enemyHp: document.getElementById('enemy-hp'),
            turnCount: document.getElementById('turn-count'),
            playerStats: document.getElementById('player-stats'),
            enemyStats: document.getElementById('enemy-stats'),
            hud: document.getElementById('hud')
        };
        
        // Initialize health bars
        this.initHealthBars();
        
        // Log initialization
        console.log('HUD initialized with gameState reference');
    }
    
    /**
     * Initializes health bars with CSS transitions
     */
    initHealthBars() {
        if (this.elements.playerStats) {
            this.elements.playerStats.innerHTML = `
                <div class="hud-block">
                    <div class="hud-block-title">⚔️ You</div>
                    <div class="bar-row">
                        <span class="bar-icon">❤️</span>
                        <div class="bar-track">
                            <div class="bar-fill" id="player-health-fill" style="width:100%"></div>
                        </div>
                        <span class="bar-value"><span id="player-hp">${this.gameState.playerHp}</span>/<span>${this.gameState.playerMaxHp}</span></span>
                    </div>
                    <div class="bar-row">
                        <span class="bar-icon">💧</span>
                        <div class="bar-track mana-track">
                            <div class="bar-fill mana-fill" id="player-mana-fill" style="width:100%"></div>
                        </div>
                        <span class="bar-value"><span id="player-mana">${this.gameState.playerMana}</span>/<span>${this.gameState.playerMaxMana}</span></span>
                    </div>
                </div>`;
        }

        if (this.elements.enemyStats) {
            this.elements.enemyStats.innerHTML = `
                <div class="hud-block">
                    <div class="hud-block-title">🟢 Slime</div>
                    <div class="bar-row">
                        <span class="bar-icon">❤️</span>
                        <div class="bar-track">
                            <div class="bar-fill" id="enemy-health-fill" style="width:100%"></div>
                        </div>
                        <span class="bar-value"><span id="enemy-hp">${this.gameState.enemyHp}</span>/<span>${this.gameState.enemyMaxHp}</span></span>
                    </div>
                </div>`;
        }

        this.updatePlayerHealthBar();
        this.updateEnemyHealthBar();

        console.log('Health bars initialized');
    }
    
    /**
     * Updates the player health bar visually
     */
    updatePlayerHealthBar() {
        const healthFill = document.getElementById('player-health-fill');
        if (!healthFill) {
            console.error('[HUD] player-health-fill element NOT FOUND in DOM');
            return;
        }

        const hpPct = (this.gameState.playerHp / this.gameState.playerMaxHp) * 100;
        healthFill.style.width = `${hpPct}%`;
        healthFill.style.setProperty('--health-percentage', `${hpPct}%`);
        healthFill.className = 'bar-fill ' + this._hpColorClass(hpPct);

        const manaFill = document.getElementById('player-mana-fill');
        if (manaFill) {
            const manaPct = (this.gameState.playerMana / this.gameState.playerMaxMana) * 100;
            manaFill.style.width = `${manaPct}%`;
        }

        const hpSpan = document.getElementById('player-hp');
        if (hpSpan) hpSpan.textContent = this.gameState.playerHp;
        else console.warn('[HUD] player-hp span NOT FOUND');
        const manaSpan = document.getElementById('player-mana');
        if (manaSpan) manaSpan.textContent = this.gameState.playerMana;
        else console.warn('[HUD] player-mana span NOT FOUND');

        console.log(
            `[HUD] Player bar — HP: ${this.gameState.playerHp}/${this.gameState.playerMaxHp}`,
            `| Mana: ${this.gameState.playerMana}/${this.gameState.playerMaxMana}`,
            `| Width set: ${hpPct.toFixed(1)}%`,
            `| Computed width: ${healthFill.style.width}`,
            `| Element:`, healthFill
        );
    }
    
    /**
     * Updates the enemy health bar visually
     */
    updateEnemyHealthBar() {
        const healthFill = document.getElementById('enemy-health-fill');
        if (!healthFill) {
            console.error('[HUD] enemy-health-fill element NOT FOUND in DOM');
            return;
        }

        const pct = (this.gameState.enemyHp / this.gameState.enemyMaxHp) * 100;
        healthFill.style.width = `${pct}%`;
        healthFill.style.setProperty('--health-percentage', `${pct}%`);
        healthFill.className = 'bar-fill ' + this._hpColorClass(pct);

        const hpSpan = document.getElementById('enemy-hp');
        if (hpSpan) hpSpan.textContent = this.gameState.enemyHp;
        else console.warn('[HUD] enemy-hp span NOT FOUND');

        console.log(
            `[HUD] Enemy bar — HP: ${this.gameState.enemyHp}/${this.gameState.enemyMaxHp}`,
            `| Width set: ${pct.toFixed(1)}%`,
            `| Computed width: ${healthFill.style.width}`,
            `| enemyMaxHp in state: ${this.gameState.enemyMaxHp}`,
            `| Element:`, healthFill
        );
    }

    /**
     * Returns a CSS class based on HP percentage
     * @param {number} pct - HP percentage 0-100
     * @returns {string} CSS class name
     */
    _hpColorClass(pct) {
        if (pct > 60) return 'hp-green';
        if (pct > 30) return 'hp-orange';
        return 'hp-red';
    }
    
    /**
     * Updates the mana display
     */
    updateManaDisplay() {
        const manaFill = document.getElementById('player-mana-fill');
        if (manaFill) {
            const manaPct = (this.gameState.playerMana / this.gameState.playerMaxMana) * 100;
            manaFill.style.width = `${manaPct}%`;
        }
        const manaSpan = document.getElementById('player-mana');
        if (manaSpan) manaSpan.textContent = this.gameState.playerMana;

        console.log(`Mana updated: ${this.gameState.playerMana}/${this.gameState.playerMaxMana}`);
    }
    
    /**
     * Updates the turn counter
     */
    updateTurnCounter() {
        if (this.elements.turnCount) {
            this.elements.turnCount.textContent = this.gameState.turnCount;
        }
        
        console.log(`Turn counter updated: ${this.gameState.turnCount}`);
    }
    
    /**
     * Shows damage feedback animation
     * 
     * @param {number} damage - The amount of damage dealt
     * @param {string} target - 'player' or 'enemy'
     * @param {boolean} isCriticalHit - Whether it was a critical hit
     */
    showDamageFeedback(damage, target, isCriticalHit = false) {
        // Get the appropriate element
        let element;
        if (target === 'player') {
            element = this.elements.hud;
        } else if (target === 'enemy') {
            element = document.getElementById('enemy-area') || this.elements.hud;
        }
        
        if (!element) return;
        
        // Add flash red animation
        element.classList.add('flash-red');
        setTimeout(() => {
            element.classList.remove('flash-red');
        }, 500);
        
        // Add screen shake for significant damage
        if (damage > 5) {
            element.classList.add('screen-shake');
            setTimeout(() => {
                element.classList.remove('screen-shake');
            }, 300);
        }
        
        // Show floating damage number
        this.showFloatingDamageNumber(damage, target, isCriticalHit);
        
        console.log(`Damage feedback shown: ${damage} to ${target}${isCriticalHit ? ' (critical)' : ''}`);
    }
    
    /**
     * Shows floating damage number
     * 
     * @param {number} damage - The damage amount
     * @param {string} target - 'player' or 'enemy'
     * @param {boolean} isCriticalHit - Whether it was a critical hit
     */
    showFloatingDamageNumber(damage, target, isCriticalHit) {
        // Create floating damage number element
        const damageNumber = document.createElement('div');
        damageNumber.className = 'floating-damage-number';
        damageNumber.textContent = `${isCriticalHit ? '🔥' : ''}${damage}`;
        
        // Position based on target
        let container;
        if (target === 'player') {
            container = document.getElementById('player-area') || document.body;
        } else {
            container = document.getElementById('enemy-area') || document.body;
        }
        
        if (!container) return;

        // Use viewport-relative (fixed) positioning so coordinates from
        // getBoundingClientRect() are applied correctly regardless of which
        // container the element is appended to.
        const rect = container.getBoundingClientRect();
        damageNumber.style.position = 'fixed';
        damageNumber.style.left = `${rect.left + rect.width / 2 - 20}px`;
        damageNumber.style.top = `${rect.top + rect.height / 2}px`;
        damageNumber.style.fontSize = isCriticalHit ? '32px' : '24px';
        damageNumber.style.fontWeight = 'bold';
        damageNumber.style.color = isCriticalHit ? '#ffcc00' : '#ff6666';
        damageNumber.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.8)';
        damageNumber.style.zIndex = '1000';
        damageNumber.style.pointerEvents = 'none';

        // Add animation — class matches @keyframes floatUp in animations.css
        damageNumber.classList.add('float-up');

        // Append to body so fixed positioning works correctly
        document.body.appendChild(damageNumber);
        
        // Remove after animation completes
        setTimeout(() => {
            if (damageNumber.parentNode) {
                damageNumber.parentNode.removeChild(damageNumber);
            }
        }, 1000);
        
        console.log(`Floating damage number shown: ${damage} to ${target}`);
    }
    
    /**
     * Shows victory animation
     */
    showVictory() {
        if (this.elements.hud) {
            this.elements.hud.classList.add('victory-pulse');
            setTimeout(() => {
                this.elements.hud.classList.remove('victory-pulse');
            }, 2000);
        }
        
        console.log('Victory animation triggered');
    }
    
    /**
     * Shows defeat animation
     */
    showDefeat() {
        if (this.elements.hud) {
            this.elements.hud.classList.add('defeat-pulse');
            setTimeout(() => {
                this.elements.hud.classList.remove('defeat-pulse');
            }, 2000);
        }
        
        console.log('Defeat animation triggered');
    }
    
    /**
     * Updates all HUD elements based on game state
     */
    updateAll() {
        this.updatePlayerHealthBar();
        this.updateEnemyHealthBar();
        this.updateManaDisplay();
        this.updateTurnCounter();
        
        console.log('All HUD elements updated');
    }
}

/**
 * Initializes the HUD and returns the instance
 * 
 * @param {Object} gameState - The game state object
 * @returns {HUD} The initialized HUD instance
 */
export function initializeHUD(gameState) {
    const hud = new HUD(gameState);
    console.log('HUD initialized successfully');
    return hud;
}