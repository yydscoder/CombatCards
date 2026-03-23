// Main entry point for Emoji Card Battle - Campaign Mode (Slay the Spire style)
// This file initializes the game engine, state management, and map-based progression

// Import core modules
import { GameState } from './src/core/state.js';
import { EnergyManager, TurnManager } from './src/core/engine.js';
import { initializeSaveSystem } from './src/core/SaveSystem.js';
import { GAME_CONFIG } from './src/core/config.js';

// Import UI modules
import { HUD } from './src/ui/HUD.js';
import { Hand } from './src/ui/Hand.js';
import { MapUI } from './src/ui/MapUI.js';

// Import map system
import { MapManager } from './src/map/MapManager.js';
import { NodeType } from './src/map/MapNode.js';

// Global game references
window.gameRefs = {};

// Game states
const GameStateEnum = {
    MAP: 'map',
    COMBAT: 'combat',
    GAME_OVER: 'game_over'
};

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Emoji Card Battle - Campaign Mode Initializing...');

    // Clear any corrupted save data
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('combatCards_campaign');
    }

    // Initialize game state
    const gameState = new GameState();
    window.gameState = gameState;

    // Initialize energy manager
    const energyManager = new EnergyManager(gameState);
    gameState.energyManager = energyManager;
    window.energyManager = energyManager;

    // Initialize turn manager
    const turnManager = new TurnManager(gameState, energyManager);
    gameState.turnManager = turnManager;
    window.turnManager = turnManager;

    // Initialize save system
    const saveSystem = initializeSaveSystem();
    window.saveSystem = saveSystem;

    // Initialize map manager (campaign progression)
    const mapManager = new MapManager();
    window.mapManager = mapManager;

    // Initialize HUD
    const hud = new HUD(gameState);
    window.hud = hud;

    // Initialize hand
    const hand = new Hand(gameState, hud, saveSystem, null);
    window.hand = hand;

    // Initialize map UI
    const mapUI = new MapUI('map-canvas');
    window.mapUI = mapUI;

    // Store global references
    window.gameRefs = {
        gameState,
        energyManager,
        turnManager,
        mapManager,
        hud,
        hand,
        mapUI,
        saveSystem
    };

    // Initialize UI event handlers
    initializeUIHandlers();

    // Start new run
    startNewRun();

    console.log('✅ Campaign Mode initialized successfully!');
});

/**
 * Initializes all UI event handlers
 */
function initializeUIHandlers() {
    // New run / Restart button
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', startNewRun);
    }

    // Proceed button (map → combat)
    const proceedBtn = document.getElementById('proceed-btn');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
            const mapManager = window.mapManager;
            if (mapManager && mapManager.selectedNodeId !== null) {
                enterNode(mapManager.selectedNodeId);
            }
        });
    }

    // End turn button
    const endTurnBtn = document.getElementById('end-turn-btn');
    if (endTurnBtn) {
        endTurnBtn.addEventListener('click', endTurn);
    }
}

/**
 * Starts a new campaign run
 */
function startNewRun() {
    console.log('🆕 Starting new campaign run...');

    const mapManager = window.mapManager;
    const gameState = window.gameState;
    const hud = window.hud;
    const hand = window.hand;
    const mapUI = window.mapUI;

    // Reset game state
    gameState.reset();
    gameState.energyManager.reset();

    // Start new campaign
    mapManager.startNewRun();

    // Hide combat UI, show map
    setGameState(GameStateEnum.MAP);

    // Render the map
    renderMap();

    // Update map stats display
    updateMapStats();

    console.log('🗺️ New campaign started!');
}

/**
 * Sets the current game state and updates UI visibility
 * @param {string} state - One of 'map', 'combat', 'game_over'
 */
function setGameState(state) {
    // Use window object for reliability across deployments
    window.currentGameState = state;

    const mapView = document.getElementById('map-view');
    const battleField = document.getElementById('battle-field');
    const handEl = document.getElementById('hand');
    const turnControls = document.getElementById('turn-controls');
    const gameOverScreen = document.getElementById('game-over-screen');

    switch (state) {
        case GameStateEnum.MAP:
            mapView.style.display = 'block';
            battleField.style.display = 'none';
            handEl.style.display = 'none';
            turnControls.style.display = 'none';
            gameOverScreen.style.display = 'none';
            break;

        case GameStateEnum.COMBAT:
            mapView.style.display = 'none';
            battleField.style.display = 'block';
            handEl.style.display = 'block';
            turnControls.style.display = 'block';
            gameOverScreen.style.display = 'none';
            break;

        case GameStateEnum.GAME_OVER:
            mapView.style.display = 'none';
            battleField.style.display = 'none';
            handEl.style.display = 'none';
            turnControls.style.display = 'none';
            gameOverScreen.style.display = 'block';
            break;
    }
}

/**
 * Renders the current map with player position
 */
function renderMap() {
    const mapManager = window.mapManager;
    const mapUI = window.mapUI;

    if (!mapManager || !mapUI) return;

    const nodes = mapManager.nodes || [];
    const currentNodeId = mapManager.currentNodeId;
    const validMoves = mapManager.getValidMoves();

    mapUI.renderMap(nodes, currentNodeId, validMoves);

    // Handle node selection
    mapUI.onNodeClick = (nodeId) => selectNode(nodeId);
}

/**
 * Selects a node on the map (highlights it, enables proceed button)
 * @param {number} nodeId - Node ID to select
 */
function selectNode(nodeId) {
    const mapManager = window.mapManager;
    const mapUI = window.mapUI;
    const proceedBtn = document.getElementById('proceed-btn');

    if (!mapManager || !mapUI) return;

    // Check if move is valid
    const validMoves = mapManager.getValidMoves();
    if (!validMoves.includes(nodeId)) {
        console.warn('Invalid move!');
        return;
    }

    // Select the node
    mapManager.selectedNodeId = nodeId;
    const node = mapManager.nodes.find(n => n.id === nodeId);

    // Update proceed button
    if (proceedBtn) {
        proceedBtn.disabled = false;
        proceedBtn.textContent = `Proceed to ${getNodeName(node.type)}`;
    }

    // Re-render map to show selection
    renderMap();

    console.log(`Selected node ${nodeId} (${node.type})`);
}

/**
 * Enters a node (starts combat, event, shop, etc.)
 * @param {number} nodeId - Node ID to enter
 */
function enterNode(nodeId) {
    const mapManager = window.mapManager;
    const gameState = window.gameState;

    if (!mapManager) return;

    const node = mapManager.nodes.find(n => n.id === nodeId);
    if (!node) return;

    console.log(`Entering node ${nodeId}: ${node.type}`);

    // Move player to node
    mapManager.moveToNode(nodeId);

    // Handle node type
    switch (node.type) {
        case NodeType.COMBAT:
            startCombat(node);
            break;
        case NodeType.ELITE:
            startCombat(node, true); // Elite = true
            break;
        case NodeType.BOSS:
            startCombat(node, false, true); // Boss = true
            break;
        case NodeType.REST:
            showRestCamp(node);
            break;
        case NodeType.SHOP:
            showShop(node);
            break;
        case NodeType.EVENT:
            showEvent(node);
            break;
        default:
            console.warn('Unknown node type:', node.type);
    }

    // Update map stats
    updateMapStats();
}

/**
 * Starts a combat encounter
 * @param {MapNode} node - Combat node
 * @param {boolean} isElite - Is elite enemy
 * @param {boolean} isBoss - Is boss fight
 */
function startCombat(node, isElite = false, isBoss = false) {
    console.log('⚔️ Starting combat!', { node: node.id, elite: isElite, boss: isBoss });

    const mapManager = window.mapManager;
    const gameState = window.gameState;
    const hud = window.hud;
    const hand = window.hand;

    // Spawn enemy based on node type
    let enemy;
    if (isBoss) {
        enemy = mapManager.spawnBoss();
    } else if (isElite) {
        enemy = mapManager.spawnElite();
    } else {
        enemy = mapManager.spawnEnemy();
    }

    if (!enemy) {
        console.error('Failed to spawn enemy!');
        return;
    }

    // Set enemy in game state
    gameState.enemy = enemy;
    gameState.enemyMaxHp = enemy.hp;
    gameState.enemyHp = enemy.hp;
    gameState.enemyAttackInterval = enemy.attackInterval || 1;
    gameState.enemyAttackCooldown = gameState.enemyAttackInterval;

    // Update enemy display
    updateEnemyDisplay(enemy);

    // Update HUD
    hud.updateAll();

    // Initialize hand for combat
    hand.initHand();

    // Start first turn
    gameState.turnManager.startTurn();

    // Switch to combat state
    setGameState(GameStateEnum.COMBAT);

    console.log(`Combat started against ${enemy.name} (${enemy.hp} HP)`);
}

/**
 * Shows rest camp options (heal or upgrade)
 * @param {RestNode} node - Rest node
 */
function showRestCamp(node) {
    console.log('🔥 Rest camp options');
    // TODO: Show heal/upgrade modal
    // For now, auto-heal 30% HP
    const gameState = window.gameState;
    const healAmount = Math.floor(gameState.playerMaxHp * 0.3);
    gameState.playerHp = Math.min(gameState.playerMaxHp, gameState.playerHp + healAmount);
    console.log(`Healed ${healAmount} HP`);

    // Complete node and return to map
    completeNode();
}

/**
 * Shows shop interface
 * @param {ShopNode} node - Shop node
 */
function showShop(node) {
    console.log('🏪 Shop opened');
    // TODO: Show shop UI with cards/relics for sale
    // For now, just return to map
    completeNode();
}

/**
 * Shows random event
 * @param {EventNode} node - Event node
 */
function showEvent(node) {
    console.log('❓ Random event');
    // TODO: Show event modal with choices
    // For now, just return to map
    completeNode();
}

/**
 * Completes the current node and returns to map
 */
function completeNode() {
    const mapManager = window.mapManager;

    if (!mapManager) return;

    // Mark node as complete
    const node = mapManager.nodes.find(n => n.id === mapManager.currentNodeId);
    if (node) {
        node.completed = true;
    }

    // Check if boss was defeated (act complete)
    if (node && node.type === NodeType.BOSS) {
        mapManager.currentAct++;
        if (mapManager.currentAct > 3) {
            // Victory! Completed all acts
            showVictory();
            return;
        }
        // Generate next act
        mapManager.generateNextAct();
    }

    // Return to map view
    setGameState(GameStateEnum.MAP);
    renderMap();
    updateMapStats();
}

/**
 * Called when player wins combat
 */
function onCombatWin() {
    console.log('✅ Combat won!');

    const mapManager = window.mapManager;
    const gameState = window.gameState;

    // Add gold reward
    const goldReward = Math.floor(Math.random() * 30) + 20;
    mapManager.gold += goldReward;
    gameState.gold = mapManager.gold;

    console.log(`Earned ${goldReward} gold (total: ${mapManager.gold})`);

    // Complete node
    completeNode();
}

/**
 * Called when player loses combat
 */
function onCombatLoss() {
    console.log('❌ Combat lost!');
    showGameOver('Defeated in combat');
}

/**
 * Shows game over screen
 * @param {string} reason - Reason for game over
 */
function showGameOver(reason) {
    console.log('💀 Game Over:', reason);

    const mapManager = window.mapManager;
    const gameOverScreen = document.getElementById('game-over-screen');
    const gameOverTitle = document.getElementById('game-over-title');
    const gameOverReason = document.getElementById('game-over-reason');
    const goAct = document.getElementById('go-act');
    const goFloors = document.getElementById('go-floors');
    const goKills = document.getElementById('go-kills');
    const goGold = document.getElementById('go-gold');

    gameOverTitle.textContent = 'Defeat';
    gameOverReason.textContent = reason;
    goAct.textContent = mapManager.currentAct;
    goFloors.textContent = mapManager.currentFloor;
    goKills.textContent = mapManager.totalKills;
    goGold.textContent = mapManager.gold;

    setGameState(GameStateEnum.GAME_OVER);
}

/**
 * Shows victory screen (completed all 3 acts)
 */
function showVictory() {
    console.log('🏆 VICTORY! Completed all acts!');

    const mapManager = window.mapManager;
    const gameOverScreen = document.getElementById('game-over-screen');
    const gameOverTitle = document.getElementById('game-over-title');
    const gameOverReason = document.getElementById('game-over-reason');
    const goAct = document.getElementById('go-act');
    const goFloors = document.getElementById('go-floors');
    const goKills = document.getElementById('go-kills');
    const goGold = document.getElementById('go-gold');

    gameOverTitle.textContent = '🏆 Victory!';
    gameOverReason.textContent = 'Defeated all three act bosses!';
    goAct.textContent = '3';
    goFloors.textContent = '45';
    goKills.textContent = mapManager.totalKills;
    goGold.textContent = mapManager.gold;

    setGameState(GameStateEnum.GAME_OVER);
}

/**
 * Updates map stats display (HP, gold, floor)
 */
function updateMapStats() {
    const mapManager = window.mapManager;
    const gameState = window.gameState;

    if (!mapManager || !gameState) return;

    const mapHp = document.getElementById('map-hp');
    const mapGold = document.getElementById('map-gold');
    const mapFloor = document.getElementById('map-floor');
    const actNumber = document.getElementById('act-number');

    if (mapHp) mapHp.textContent = `${gameState.playerHp}/${gameState.playerMaxHp}`;
    if (mapGold) mapGold.textContent = mapManager.gold;
    if (mapFloor) mapFloor.textContent = `Floor ${mapManager.currentFloor}/15`;
    if (actNumber) actNumber.textContent = mapManager.currentAct;
}

/**
 * Updates enemy display (emoji, name, HP)
 * @param {Object} enemy - Enemy object
 */
function updateEnemyDisplay(enemy) {
    const enemyEmoji = document.getElementById('enemy-emoji');
    const enemyName = document.getElementById('enemy-name');

    if (enemyEmoji) enemyEmoji.textContent = enemy.emoji || '👾';
    if (enemyName) enemyName.textContent = enemy.name || 'Enemy';
}

/**
 * Gets display name for node type
 * @param {string} nodeType - Node type
 * @returns {string} Display name
 */
function getNodeName(nodeType) {
    const names = {
        [NodeType.COMBAT]: 'Combat',
        [NodeType.ELITE]: 'Elite',
        [NodeType.BOSS]: 'Boss',
        [NodeType.REST]: 'Campfire',
        [NodeType.SHOP]: 'Shop',
        [NodeType.EVENT]: 'Event'
    };
    return names[nodeType] || nodeType;
}

/**
 * Ends the current turn
 */
function endTurn() {
    const gameState = window.gameState;
    const hud = window.hud;

    if (!gameState || !gameState.turnManager) return;

    gameState.turnManager.endTurn();
    gameState.turnManager.startTurn();

    if (hud) hud.updateAll();
}
