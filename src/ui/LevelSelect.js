/**
 * Level Select Screen UI Module
 *
 * This module creates and manages the level selection screen,
 * allowing players to view their progress and select levels.
 */

import { LEVELS } from '../levels/levels.js';

/**
 * Level Select Screen state
 */
let levelSelectElement = null;
let isVisible = false;

/**
 * Initializes the level select screen
 *
 * @param {Object} levelManager - Level manager instance
 * @returns {Object} Level select API
 */
export function initializeLevelSelect(levelManager) {
    // Create level select container
    levelSelectElement = document.createElement('div');
    levelSelectElement.id = 'level-select-screen';
    levelSelectElement.className = 'modal-overlay';
    levelSelectElement.style.display = 'none';

    // Build level select HTML
    levelSelectElement.innerHTML = buildLevelSelectHTML(levelManager);
    document.body.appendChild(levelSelectElement);

    // Add event listeners
    setupEventListeners(levelManager);

    console.log('Level Select Screen initialized');

    return {
        show: () => showLevelSelect(levelManager),
        hide: hideLevelSelect,
        refresh: () => refreshLevelSelect(levelManager)
    };
}

/**
 * Builds the HTML for the level select screen
 *
 * @param {Object} levelManager - Level manager instance
 * @returns {string} HTML string
 */
function buildLevelSelectHTML(levelManager) {
    const progressStats = levelManager.getProgressStats();
    
    return `
        <div class="modal-content level-select-modal">
            <div class="modal-header">
                <h2>🗺️ Campaign Levels</h2>
                <button class="modal-close" id="level-select-close">&times;</button>
            </div>
            
            <div class="level-select-content">
                <div class="progress-summary">
                    <p>Progress: ${progressStats.completedLevels}/${LEVELS.length} levels completed</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressStats.percentComplete}%"></div>
                    </div>
                </div>
                
                <div class="levels-grid">
                    ${LEVELS.map((level, index) => {
                        const status = levelManager.getLevelStatus(index);
                        return buildLevelCard(level, status, index);
                    }).join('')}
                </div>
                
                ${levelManager.isCampaignComplete ? `
                    <div class="campaign-complete">
                        <h3>🏆 Campaign Complete!</h3>
                        <button id="reset-campaign" class="btn-secondary">Reset Progress</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Builds a single level card HTML
 *
 * @param {Object} level - Level configuration
 * @param {string} status - Level status ('completed', 'current', 'locked')
 * @param {number} index - Level index
 * @returns {string} HTML string
 */
function buildLevelCard(level, status, index) {
    const statusIcons = {
        completed: '✅',
        current: '▶️',
        locked: '🔒'
    };
    
    const statusClasses = {
        completed: 'level-card-completed',
        current: 'level-card-current',
        locked: 'level-card-locked'
    };
    
    const difficultyColors = {
        tutorial: '#4CAF50',
        easy: '#8BC34A',
        medium: '#FFC107',
        hard: '#FF9800',
        boss: '#F44336'
    };
    
    return `
        <div class="level-card ${statusClasses[status] || ''}" 
             data-level-index="${index}"
             ${status === 'locked' ? 'data-locked="true"' : ''}>
            <div class="level-card-header">
                <span class="level-number">Level ${level.number}</span>
                <span class="level-status-icon">${statusIcons[status]}</span>
            </div>
            <div class="level-card-body">
                <h3 class="level-name">${level.name}</h3>
                <p class="level-description">${level.description}</p>
                <div class="level-meta">
                    <span class="level-difficulty" style="color: ${difficultyColors[level.difficulty]}">
                        ${level.difficulty.toUpperCase()}
                    </span>
                    <span class="level-enemy">${level.enemy.emoji} ${level.enemy.name}</span>
                </div>
            </div>
            ${status !== 'locked' ? `
                <button class="btn-start-level" data-level-index="${index}">
                    ${status === 'completed' ? 'Replay' : 'Start'}
                </button>
            ` : ''}
        </div>
    `;
}

/**
 * Sets up event listeners for the level select screen
 *
 * @param {Object} levelManager - Level manager instance
 */
function setupEventListeners(levelManager) {
    // Close button
    const closeBtn = levelSelectElement.querySelector('#level-select-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideLevelSelect);
    }

    // Start level buttons
    const startButtons = levelSelectElement.querySelectorAll('.btn-start-level');
    startButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const levelIndex = parseInt(e.target.dataset.levelIndex);
            startLevel(levelIndex, levelManager);
        });
    });

    // Reset campaign button
    const resetBtn = levelSelectElement.querySelector('#reset-campaign');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all progress?')) {
                levelManager.resetProgress();
                refreshLevelSelect(levelManager);
            }
        });
    }

    // Close on overlay click
    levelSelectElement.addEventListener('click', (e) => {
        if (e.target === levelSelectElement) {
            hideLevelSelect();
        }
    });
}

/**
 * Shows the level select screen
 *
 * @param {Object} levelManager - Level manager instance
 */
function showLevelSelect(levelManager) {
    if (levelSelectElement) {
        levelSelectElement.style.display = 'flex';
        isVisible = true;
        refreshLevelSelect(levelManager);
    }
}

/**
 * Hides the level select screen
 */
function hideLevelSelect() {
    if (levelSelectElement) {
        levelSelectElement.style.display = 'none';
        isVisible = false;
    }
}

/**
 * Refreshes the level select screen content
 *
 * @param {Object} levelManager - Level manager instance
 */
function refreshLevelSelect(levelManager) {
    if (levelSelectElement) {
        levelSelectElement.innerHTML = buildLevelSelectHTML(levelManager);
        setupEventListeners(levelManager);
    }
}

/**
 * Starts a specific level
 *
 * @param {number} levelIndex - Level index to start
 * @param {Object} levelManager - Level manager instance
 */
function startLevel(levelIndex, levelManager) {
    // Check if level is unlocked
    if (!levelManager.isLevelUnlocked(levelIndex)) {
        alert('This level is locked! Complete the previous level first.');
        return;
    }

    // Set current level
    levelManager.currentLevelIndex = levelIndex;
    levelManager.saveProgress();

    // Hide level select
    hideLevelSelect();

    // Reload the game with the new level
    const levelConfig = levelManager.getCurrentLevel();
    console.log(`Starting Level ${levelConfig.number}: ${levelConfig.name}`);
    
    // Dispatch custom event for game to load the level
    window.dispatchEvent(new CustomEvent('levelStart', { 
        detail: { level: levelConfig, levelIndex } 
    }));

    // For now, reload the page to start fresh with the new level
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

/**
 * Checks if the level select screen is visible
 *
 * @returns {boolean} True if visible
 */
export function isLevelSelectVisible() {
    return isVisible;
}
