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
                    <div class="hud-block-title">You</div>
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
                    <div class="bar-row shield-row" id="player-shield-row" style="display:none;">
                        <span class="bar-icon">🛡️</span>
                        <div class="bar-track shield-track">
                            <div class="bar-fill shield-fill" id="player-shield-fill" style="width:100%"></div>
                        </div>
                        <span class="bar-value"><span id="player-shield">0</span></span>
                    </div>
                </div>`;
        }

        if (this.elements.enemyStats) {
            const enemyName = this.gameState.enemy?.name || 'Enemy';
            this.elements.enemyStats.innerHTML = `
                <div class="hud-block">
                    <div class="hud-block-title" id="enemy-name-title">${enemyName}</div>
                    <div class="bar-row">
                        <span class="bar-icon">❤️</span>
                        <div class="bar-track">
                            <div class="bar-fill" id="enemy-health-fill" style="width:100%"></div>
                        </div>
                        <span class="bar-value"><span id="enemy-hp">${this.gameState.enemyHp}</span>/<span>${this.gameState.enemyMaxHp}</span></span>
                    </div>
                    <div class="bar-row shield-row" id="enemy-shield-row" style="display:none;">
                        <span class="bar-icon">🛡️</span>
                        <div class="bar-track shield-track">
                            <div class="bar-fill shield-fill" id="enemy-shield-fill" style="width:100%"></div>
                        </div>
                        <span class="bar-value"><span id="enemy-shield">0</span></span>
                    </div>
                    <div class="bar-row hud-cd-row">
                        <span class="bar-icon">CD</span>
                        <span class="bar-value"><span id="enemy-attack-cd">${this.gameState.enemyAttackCooldown ?? 0}</span></span>
                    </div>
                </div>`;
        }

        this.updatePlayerHealthBar();
        this.updateEnemyHealthBar();
        this.updateShieldBars();

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
        
        // Force update with setProperty for reliability (avoids CSS specificity issues)
        healthFill.style.setProperty('width', `${hpPct}%`, 'important');
        healthFill.style.setProperty('--health-percentage', `${hpPct}%`);
        healthFill.className = 'bar-fill ' + this._hpColorClass(hpPct);

        const manaFill = document.getElementById('player-mana-fill');
        if (manaFill) {
            const manaPct = (this.gameState.playerMana / this.gameState.playerMaxMana) * 100;
            manaFill.style.setProperty('width', `${manaPct}%`, 'important');
        }

        const hpSpan = document.getElementById('player-hp');
        if (hpSpan) hpSpan.textContent = this.gameState.playerHp;
        else console.warn('[HUD] player-hp span NOT FOUND');
        const manaSpan = document.getElementById('player-mana');
        if (manaSpan) manaSpan.textContent = this.gameState.playerMana;
        else console.warn('[HUD] player-mana span NOT FOUND');

        // Verify DOM update
        const computedWidth = window.getComputedStyle(healthFill).width;
        console.log(
            `[HUD] Player bar — HP: ${this.gameState.playerHp}/${this.gameState.playerMaxHp}`,
            `| Mana: ${this.gameState.playerMana}/${this.gameState.playerMaxMana}`,
            `| Width set: ${hpPct.toFixed(1)}%`,
            `| Computed width: ${computedWidth}`,
            `| Element:`, healthFill
        );
        
        // Detect desync
        const expectedWidth = (hpPct / 100) * healthFill.parentNode.offsetWidth;
        const actualWidth = parseFloat(computedWidth);
        if (Math.abs(expectedWidth - actualWidth) > 2) {
            console.warn(`[HUD] ⚠️ Player HP bar DESYNC: expected ${expectedWidth.toFixed(1)}px, got ${actualWidth.toFixed(1)}px`);
        }
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

        const enemyTitle = document.getElementById('enemy-name-title');
        if (enemyTitle) {
            enemyTitle.textContent = this.gameState.enemy?.name || 'Enemy';
        }

        const pct = (this.gameState.enemyHp / this.gameState.enemyMaxHp) * 100;
        healthFill.style.width = `${pct}%`;
        healthFill.style.setProperty('--health-percentage', `${pct}%`);
        healthFill.className = 'bar-fill ' + this._hpColorClass(pct);

        const hpSpan = document.getElementById('enemy-hp');
        if (hpSpan) hpSpan.textContent = this.gameState.enemyHp;
        else console.warn('[HUD] enemy-hp span NOT FOUND');

        const cdSpan = document.getElementById('enemy-attack-cd');
        if (cdSpan) {
            cdSpan.textContent = this.gameState.enemyAttackCooldown ?? 0;
        }

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
     * Updates shield bars for player and enemy
     */
    updateShieldBars() {
        // Player shields
        const playerShieldRow = document.getElementById('player-shield-row');
        const playerShieldFill = document.getElementById('player-shield-fill');
        const playerShieldSpan = document.getElementById('player-shield');
        
        if (playerShieldRow && playerShieldFill && playerShieldSpan) {
            const shields = this.gameState.playerShields || {};
            const totalShield = Object.values(shields).reduce((sum, s) => {
                if (s.count !== undefined) {
                    return sum + (s.count * (s.absorbPerBubble || 0));
                }
                return sum + (s.remaining || 0);
            }, 0);
            
            const maxShield = 50; // Reference max for bar width
            const shieldPct = Math.min(100, (totalShield / maxShield) * 100);
            
            if (totalShield > 0) {
                playerShieldRow.style.display = 'flex';
                playerShieldFill.style.setProperty('width', `${shieldPct}%`, 'important');
                playerShieldSpan.textContent = totalShield;
            } else {
                playerShieldRow.style.display = 'none';
            }
        }

        // Enemy shields (if enemy has shield property)
        const enemyShieldRow = document.getElementById('enemy-shield-row');
        const enemyShieldFill = document.getElementById('enemy-shield-fill');
        const enemyShieldSpan = document.getElementById('enemy-shield');
        
        if (enemyShieldRow && enemyShieldFill && enemyShieldSpan && this.gameState.enemy) {
            const enemyShields = this.gameState.enemy.activeEffects?.filter(e => e.type === 'shield' || e.remainingShield) || [];
            const totalEnemyShield = enemyShields.reduce((sum, s) => sum + (s.remainingShield || s.shieldAmount || 0), 0);
            
            if (totalEnemyShield > 0) {
                const maxShield = 50;
                const shieldPct = Math.min(100, (totalEnemyShield / maxShield) * 100);
                enemyShieldRow.style.display = 'flex';
                enemyShieldFill.style.setProperty('width', `${shieldPct}%`, 'important');
                enemyShieldSpan.textContent = totalEnemyShield;
            } else {
                enemyShieldRow.style.display = 'none';
            }
        }
    }

    /**
     * Updates DOT indicator emojis on player and enemy areas
     */
    updateDotIndicators() {
        // Player buffs (shields, HoTs, etc.)
        const playerDotsEl = document.getElementById('player-dots');
        const playerTooltip = document.getElementById('player-tooltip');
        
        if (playerDotsEl) {
            const dotEmojis = [];
            let index = 0;
            
            // Check active effects for HoTs
            if (this.gameState.activeEffects?.length) {
                for (const effect of this.gameState.activeEffects) {
                    if (effect.healPerTurn) {
                        const turns = effect.turnsRemaining ?? effect.duration ?? '?';
                        const tooltipData = {
                            name: effect.name,
                            source: effect.source || 'Unknown',
                            healing: effect.healPerTurn,
                            turns: turns,
                            type: 'hot'
                        };
                        
                        dotEmojis.push({ 
                            emoji: effect.emoji || '💚', 
                            index: index++,
                            tooltipData: tooltipData
                        });
                    }
                }
            }
            
            // Check shields from shield system
            if (this.gameState.playerShields) {
                for (const [name, shield] of Object.entries(this.gameState.playerShields)) {
                    const turns = shield.turnsRemaining ?? shield.duration ?? '?';
                    const tooltipData = {
                        name: name.replace(/_/g, ' ').toUpperCase(),
                        source: 'Shield',
                        shield: shield.remaining || (shield.count * (shield.absorbPerBubble || 0)),
                        turns: turns,
                        type: 'shield'
                    };
                    
                    if (shield.reflectPercent) {
                        tooltipData.reflect = `${Math.round(shield.reflectPercent * 100)}%`;
                    }
                    
                    dotEmojis.push({ 
                        emoji: '🛡️', 
                        index: index++,
                        tooltipData: tooltipData
                    });
                }
            }
            
            playerDotsEl.innerHTML = dotEmojis.map(d => 
                `<span class="dot-emoji" data-index="${d.index}" data-type="player">${d.emoji}</span>`
            ).join('');
            
            // Store tooltip data
            this._playerTooltips = dotEmojis.reduce((acc, d) => {
                acc[d.index] = d.tooltipData;
                return acc;
            }, {});
            
            // Add hover listeners
            this._addTooltipListeners(playerDotsEl, playerTooltip, 'player');
        }

        // Enemy DOTs
        const enemyDotsEl = document.getElementById('enemy-dots');
        const enemyTooltip = document.getElementById('enemy-tooltip');
        
        if (enemyDotsEl && this.gameState.enemy?.activeEffects?.length) {
            const dotEmojis = [];
            let index = 0;
            
            for (const effect of this.gameState.enemy.activeEffects) {
                const isDoT = effect.damagePerTurn || effect.damagePerTick || effect.currentDamage;
                const isStacking = effect.stacks !== undefined;
                const isDelayedEruption = effect.type === 'delayed_eruption';
                
                if (isDoT || isStacking || isDelayedEruption) {
                    const turns = effect.turnsRemaining ?? effect.duration ?? '?';
                    const tooltipData = {
                        name: effect.name,
                        source: effect.source || 'Unknown',
                        turns: turns
                    };
                    
                    if (effect.damagePerTurn) {
                        tooltipData.damagePerTurn = effect.damagePerTurn;
                        if (effect.stacks > 1) tooltipData.stacks = effect.stacks;
                    }
                    if (effect.damagePerTick) {
                        tooltipData.damagePerTick = effect.damagePerTick;
                    }
                    if (effect.currentDamage) {
                        tooltipData.currentDamage = effect.currentDamage;
                        tooltipData.nextDamage = Math.floor(effect.currentDamage * (effect.growthMultiplier || 1));
                    }
                    if (isDelayedEruption) {
                        tooltipData.eruption = true;
                        tooltipData.eruptionDamage = Math.floor(effect.currentDamage * (effect.eruptionMultiplier || 3));
                    }
                    if (effect.stacks !== undefined && !effect.damagePerTurn && !effect.currentDamage) {
                        tooltipData.stacks = effect.stacks;
                    }
                    
                    dotEmojis.push({ 
                        emoji: effect.emoji || '💀', 
                        index: index++,
                        tooltipData: tooltipData
                    });
                }
            }
            
            enemyDotsEl.innerHTML = dotEmojis.map(d => 
                `<span class="dot-emoji" data-index="${d.index}" data-type="enemy">${d.emoji}</span>`
            ).join('');
            
            // Store tooltip data
            this._enemyTooltips = dotEmojis.reduce((acc, d) => {
                acc[d.index] = d.tooltipData;
                return acc;
            }, {});
            
            // Add hover listeners
            this._addTooltipListeners(enemyDotsEl, enemyTooltip, 'enemy');
        } else if (enemyDotsEl) {
            enemyDotsEl.innerHTML = '';
            if (enemyTooltip) enemyTooltip.classList.remove('visible');
        }
    }

    /**
     * Adds hover listeners to DOT emojis for tooltip display
     */
    _addTooltipListeners(container, tooltipElement, type) {
        if (!container) return;
        
        const emojis = container.querySelectorAll('.dot-emoji');
        emojis.forEach(emoji => {
            emoji.addEventListener('mouseenter', (e) => {
                const index = parseInt(e.target.dataset.index);
                const tooltips = type === 'player' ? this._playerTooltips : this._enemyTooltips;
                const data = tooltips[index];
                
                if (data && tooltipElement) {
                    // Build tooltip HTML
                    let html = `<div class="tooltip-title">${data.name}</div>`;
                    html += `<div class="tooltip-source">Source: ${data.source}</div>`;
                    
                    // Player shield tooltips
                    if (data.type === 'shield') {
                        html += `<div class="tooltip-stat">Shield: <span class="tooltip-stat-value">${data.shield}</span></div>`;
                        if (data.reflect) {
                            html += `<div class="tooltip-stat">Reflect: <span class="tooltip-stat-value">${data.reflect}</span></div>`;
                        }
                        html += `<div class="tooltip-stat">Turns: <span class="tooltip-stat-value">${data.turns}</span></div>`;
                    }
                    // Player HoT tooltips
                    else if (data.healing) {
                        html += `<div class="tooltip-stat">Healing: <span class="tooltip-stat-value">${data.healing} HP/turn</span></div>`;
                        html += `<div class="tooltip-stat">Turns: <span class="tooltip-stat-value">${data.turns}</span></div>`;
                    }
                    // Enemy DoT tooltips
                    else {
                        if (data.eruption) {
                            html += `<div class="tooltip-stat">Current: <span class="tooltip-stat-value">${data.currentDamage}</span></div>`;
                            html += `<div class="tooltip-stat">Eruption: <span class="tooltip-stat-value">${data.eruptionDamage}</span></div>`;
                        } else if (data.damagePerTurn) {
                            let dmgText = `${data.damagePerTurn} DMG/turn`;
                            if (data.stacks) dmgText += ` (${data.stacks} stacks = ${data.damagePerTurn * data.stacks}/turn)`;
                            html += `<div class="tooltip-stat">Damage: <span class="tooltip-stat-value">${dmgText}</span></div>`;
                        } else if (data.damagePerTick) {
                            html += `<div class="tooltip-stat">Damage: <span class="tooltip-stat-value">${data.damagePerTick}/tick</span></div>`;
                        } else if (data.currentDamage) {
                            html += `<div class="tooltip-stat">Current: <span class="tooltip-stat-value">${data.currentDamage}</span> (next: ${data.nextDamage})</div>`;
                        } else if (data.stacks) {
                            html += `<div class="tooltip-stat">Stacks: <span class="tooltip-stat-value">${data.stacks}</span></div>`;
                        }
                        
                        html += `<div class="tooltip-stat">Turns: <span class="tooltip-stat-value">${data.turns}</span></div>`;
                    }
                    
                    tooltipElement.innerHTML = html;
                    tooltipElement.className = `dot-tooltip visible ${type === 'enemy' ? 'enemy-tooltip' : ''}`;
                    
                    // Position tooltip
                    tooltipElement.style.left = '50%';
                    tooltipElement.style.top = '-10px';
                    tooltipElement.style.transform = 'translateX(-50%)';
                }
            });
            
            emoji.addEventListener('mouseleave', () => {
                if (tooltipElement) {
                    tooltipElement.classList.remove('visible');
                }
            });
        });
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
        }, 800);
        
        // Add screen shake for significant damage
        if (damage > 5) {
            element.classList.add('screen-shake');
            setTimeout(() => {
                element.classList.remove('screen-shake');
            }, 600);
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
        }, 1600);
        
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
            }, 3000);
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
            }, 3000);
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
        this.updateShieldBars();
        this.updateDotIndicators();
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