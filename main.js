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
import { NodeListView } from './src/ui/NodeListView.js';

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

    // Initialize node list view (vertical floor list) - lazy init in openModal
    window.nodeListView = null;

    // Store global references
    window.gameRefs = {
        gameState,
        energyManager,
        turnManager,
        mapManager,
        hud,
        hand,
        nodeListView,
        saveSystem
    };

    // Initialize UI event handlers
    initializeUIHandlers();

    // Start new run (auto-opens map modal)
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
                closeModal();
            }
        });
    }

    // End turn button
    const endTurnBtn = document.getElementById('end-turn-btn');
    if (endTurnBtn) {
        endTurnBtn.addEventListener('click', endTurn);
    }

    // View Map button
    const viewMapBtn = document.getElementById('view-map-btn');
    if (viewMapBtn) {
        viewMapBtn.addEventListener('click', openModal);
    }

    // Open Map button (on start screen)
    const openMapStartBtn = document.getElementById('open-map-start-btn');
    if (openMapStartBtn) {
        openMapStartBtn.addEventListener('click', openModal);
    }

    // Close map modal button
    const closeMapBtn = document.getElementById('close-map-btn');
    if (closeMapBtn) {
        closeMapBtn.addEventListener('click', closeModal);
    }

    // Close modal on backdrop click
    const mapModal = document.getElementById('map-modal');
    if (mapModal) {
        mapModal.addEventListener('click', (e) => {
            if (e.target === mapModal) {
                closeModal();
            }
        });
    }

    // Deck viewer - click on draw pile
    const drawPile = document.getElementById('draw-pile');
    if (drawPile) {
        drawPile.addEventListener('click', () => openDeckViewer('deck'));
    }

    // Deck viewer - click on discard pile
    const discardPile = document.getElementById('discard-pile');
    if (discardPile) {
        discardPile.addEventListener('click', () => openDeckViewer('discard'));
    }

    // Close deck viewer
    const closeDeckViewer = document.getElementById('close-deck-viewer');
    const deckViewerModal = document.getElementById('deck-viewer-modal');
    if (closeDeckViewer && deckViewerModal) {
        closeDeckViewer.addEventListener('click', () => {
            deckViewerModal.style.display = 'none';
            deckViewerModal.classList.remove('active');
        });
        
        deckViewerModal.addEventListener('click', (e) => {
            if (e.target === deckViewerModal) {
                deckViewerModal.style.display = 'none';
                deckViewerModal.classList.remove('active');
            }
        });
    }

    // Initialize drag-and-drop for card targeting
    initializeDropZones();
}

/**
 * Initializes drop zones for drag-to-target on enemy and player
 */
function initializeDropZones() {
    const enemyDisplay = document.getElementById('enemy-display');
    const playerDisplay = document.getElementById('player-display');

    if (!enemyDisplay || !playerDisplay) {
        console.warn('[DropZones] Target areas not found');
        return;
    }

    // Enemy drop zone
    enemyDisplay.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        enemyDisplay.classList.add('drop-target');
    });

    enemyDisplay.addEventListener('dragleave', () => {
        enemyDisplay.classList.remove('drop-target');
    });

    enemyDisplay.addEventListener('drop', (e) => {
        e.preventDefault();
        enemyDisplay.classList.remove('drop-target');
        handleCardDrop(e, 'enemy');
    });

    // Player drop zone
    playerDisplay.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        playerDisplay.classList.add('drop-target');
    });

    playerDisplay.addEventListener('dragleave', () => {
        playerDisplay.classList.remove('drop-target');
    });

    playerDisplay.addEventListener('drop', (e) => {
        e.preventDefault();
        playerDisplay.classList.remove('drop-target');
        handleCardDrop(e, 'player');
    });

    // Global dragend handler - ensures drop targets are cleared even if drag ends outside zones
    document.addEventListener('dragend', () => {
        enemyDisplay.classList.remove('drop-target');
        playerDisplay.classList.remove('drop-target');
    });

    console.log('[DropZones] Initialized on enemy and player areas');
}

/**
 * Handles card drop on target
 * @param {DragEvent} e - Drop event
 * @param {string} targetType - 'enemy' or 'player'
 */
function handleCardDrop(e, targetType) {
    const data = e.dataTransfer.getData('text/plain');
    let cardId;
    
    try {
        const parsed = JSON.parse(data);
        cardId = parsed.cardId;
    } catch {
        cardId = data;
    }

    const hand = window.hand;
    const card = hand?.cards?.find(c => c.id === cardId);

    if (card && hand && hand.handleCardClick) {
        console.log('[DropZones] Casting', card.name, 'on', targetType);
        const fakeEvent = { preventDefault: () => {}, stopPropagation: () => {} };
        hand.handleCardClick(card, fakeEvent);
    }
}

/**
 * Opens the map modal
 */
function openModal() {
    const mapModal = document.getElementById('map-modal');
    const viewMapBtn = document.getElementById('view-map-btn');
    const gameState = window.gameState;
    
    // Prevent opening map during combat (exploit prevention)
    if (gameState && gameState.enemy) {
        console.warn('[openModal] Cannot open map during combat!');
        return;
    }
    
    // Lazy init NodeListView when modal is first opened
    if (!window.nodeListView) {
        window.nodeListView = new NodeListView('modal-node-list');
        console.log('[openModal] NodeListView initialized');
    }
    
    if (mapModal) {
        mapModal.style.display = 'flex';
        renderMap();
    }
    if (viewMapBtn) {
        viewMapBtn.style.display = 'none';
    }
}

/**
 * Closes the map modal
 */
function closeModal() {
    const mapModal = document.getElementById('map-modal');
    const viewMapBtn = document.getElementById('view-map-btn');
    
    if (mapModal) {
        mapModal.style.display = 'none';
    }
    if (viewMapBtn) {
        viewMapBtn.style.display = 'block';
    }
}

/**
 * Starts a new campaign run
 */
function startNewRun() {
    console.log('🆕 Starting new campaign run...');

    const mapManager = window.mapManager;
    const gameState = window.gameState;

    // Reset game state
    if (gameState) {
        gameState.reset();
        if (gameState.energyManager) gameState.energyManager.reset();
    }

    // Start new campaign
    if (mapManager) {
        mapManager.startNewRun();
    }

    // Show placeholder screen with "Open Map" button
    setGameState(GameStateEnum.MAP);
    console.log('🗺️ Click "Open Map" to select your first destination!');
}

/**
 * Sets the current game state and updates UI visibility
 * @param {string} state - One of 'map', 'combat', 'game_over'
 */
function setGameState(state) {
    window.currentGameState = state;

    const combatPlaceholder = document.getElementById('combat-placeholder');
    const battleArea = document.getElementById('battle-area');
    const enemyIntent = document.getElementById('enemy-intent');
    const handEl = document.getElementById('hand');
    const handContainer = document.getElementById('hand-container');
    const turnControls = document.getElementById('turn-controls');
    const gameOverScreen = document.getElementById('game-over-screen');
    const viewMapBtn = document.getElementById('view-map-btn');

    switch (state) {
        case GameStateEnum.MAP:
            // Show placeholder, hide combat elements
            if (combatPlaceholder) combatPlaceholder.style.display = 'flex';
            if (battleArea) {
                battleArea.style.display = 'none';
                battleArea.classList.remove('visible');
            }
            if (enemyIntent) {
                enemyIntent.style.display = 'none';
                enemyIntent.classList.remove('visible');
            }
            if (handEl) handEl.style.display = 'none';
            if (handContainer) handContainer.style.display = 'none';
            if (turnControls) turnControls.style.display = 'none';
            if (gameOverScreen) gameOverScreen.style.display = 'none';
            if (viewMapBtn) viewMapBtn.style.display = 'none';
            break;

        case GameStateEnum.COMBAT:
            // Show combat elements, hide placeholder
            if (combatPlaceholder) combatPlaceholder.style.display = 'none';
            if (battleArea) {
                battleArea.classList.add('visible');
                battleArea.style.display = 'flex';
            }
            if (enemyIntent) {
                enemyIntent.classList.add('visible');
                enemyIntent.style.display = 'flex';
            }
            if (handEl) handEl.style.display = 'flex';
            if (handContainer) handContainer.style.display = 'block';
            if (turnControls) turnControls.style.display = 'flex';
            if (gameOverScreen) gameOverScreen.style.display = 'none';
            if (viewMapBtn) viewMapBtn.style.display = 'none'; // Hide map button during combat
            break;

        case GameStateEnum.GAME_OVER:
            if (combatPlaceholder) combatPlaceholder.style.display = 'none';
            if (battleArea) battleArea.style.display = 'none';
            if (enemyIntent) enemyIntent.style.display = 'none';
            if (handEl) handEl.style.display = 'none';
            if (handContainer) handContainer.style.display = 'none';
            if (turnControls) turnControls.style.display = 'none';
            if (gameOverScreen) gameOverScreen.style.display = 'flex';
            if (viewMapBtn) viewMapBtn.style.display = 'none';
            break;
    }
}

/**
 * Renders the current map with player position
 */
function renderMap() {
    const mapManager = window.mapManager;
    let nodeListView = window.nodeListView;
    
    if (!mapManager) {
        console.error('[renderMap] MapManager not ready');
        return;
    }
    
    // Lazy init NodeListView if not ready
    if (!nodeListView) {
        nodeListView = new NodeListView('modal-node-list');
        window.nodeListView = nodeListView;
        console.log('[renderMap] NodeListView lazy initialized');
    }

    const nodes = mapManager.nodes || [];
    const currentNodeId = mapManager.currentNodeId;
    const validMoves = mapManager.getValidMoves();
    
    console.log('[renderMap] Nodes:', nodes.length, 'Current:', currentNodeId, 'Valid:', validMoves);

    if (nodes.length === 0) {
        console.error('[renderMap] No nodes to render!');
        return;
    }

    // Render node list in modal
    nodeListView.render(nodes, currentNodeId, validMoves);

    // Handle node selection
    nodeListView.onNodeClick = (nodeId, node) => selectNode(nodeId, node);
    
    // Update modal stats
    updateModalStats();
    
    // Scroll to current node (with error handling)
    try {
        setTimeout(() => nodeListView.scrollToCurrent(), 100);
    } catch (e) {
        console.warn('[renderMap] scrollToCurrent failed:', e.message);
    }
}

/**
 * Updates stats in map modal
 */
function updateModalStats() {
    const mapManager = window.mapManager;
    const actNumberEl = document.getElementById('modal-act-number');
    
    if (mapManager && actNumberEl) {
        actNumberEl.textContent = mapManager.currentAct;
    }
}

/**
 * Shows tooltip for hovered node
 * @param {MapNode} node - Hovered node
 */
function showNodeTooltip(node) {
    // Tooltips shown via button titles in NodeListView
}

/**
 * Selects a node on the map (highlights it, enables proceed button)
 * @param {number} nodeId - Node ID to select
 * @param {MapNode} node - Node object
 */
function selectNode(nodeId, node) {
    const mapManager = window.mapManager;
    const nodeListView = window.nodeListView;
    const proceedBtn = document.getElementById('proceed-btn');

    if (!mapManager || !nodeListView) return;

    // Check if move is valid
    const validMoves = mapManager.getValidMoves();
    if (!validMoves.includes(nodeId)) {
        console.warn('Invalid move!');
        return;
    }

    // Select the node
    mapManager.selectedNodeId = nodeId;
    nodeListView.updateSelection(nodeId);

    // Update proceed button
    if (proceedBtn) {
        proceedBtn.disabled = false;
        proceedBtn.textContent = `Proceed to ${getNodeName(node.type)}`;
    }

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

    // Initialize hand for combat
    hand.initHand();

    // Start first turn (STS2-style: Start → Player → End)
    gameState.turnManager.startOfTurn();
    
    // Draw starting hand (5 cards)
    if (gameState.cardPileManager) {
        gameState.cardPileManager.drawCard(5);
        hand.cards = gameState.cardPileManager.getHand();
        if (hand.handUI) hand.handUI.renderHand(hand.cards);
    }

    // Update HUD and health bars AFTER turn starts
    if (hud) hud.updateAll();
    updateHealthBars();
    
    // Show enemy intent (what they'll do when turn ends)
    updateEnemyIntent();

    // Switch to combat state (shows battle area, hides placeholder)
    setGameState(GameStateEnum.COMBAT);

    console.log(`Combat started against ${enemy.name} (${enemy.hp} HP) | Energy: ${gameState.energy}/${gameState.maxEnergy} | Turn: ${gameState.turn}`);
}

/**
 * Updates enemy intent display
 */
function updateEnemyIntent() {
    const gameState = window.gameState;
    const intentEl = document.getElementById('enemy-intent');
    const intentIcon = document.getElementById('intent-icon');
    const intentText = document.getElementById('intent-text');
    
    if (!gameState || !gameState.enemy || !intentEl) return;
    
    // Show intent (attack damage or other action)
    const damage = gameState.enemy.damage || 8;
    intentIcon.textContent = '⚔️';
    intentText.textContent = `${damage}`;
    intentEl.style.display = 'flex';
    intentEl.title = `Enemy will attack for ${damage} damage`;
    
    console.log('[updateEnemyIntent] Intent displayed:', damage);
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
    const nodeListView = window.nodeListView;

    // Add gold reward
    const goldReward = Math.floor(Math.random() * 30) + 20;
    mapManager.gold += goldReward;
    gameState.gold = mapManager.gold;

    console.log(`Earned ${goldReward} gold (total: ${mapManager.gold})`);

    // Mark current node as complete
    const currentNode = mapManager.nodes.find(n => n.id === mapManager.currentNodeId);
    if (currentNode) {
        currentNode.completed = true;
        currentNode.visited = true;
    }

    // Complete node and return to map
    completeNode();
    
    // Auto-open map modal after combat win
    setTimeout(() => {
        const validMoves = mapManager.getValidMoves();
        if (validMoves.length > 0) {
            console.log('[Map] Valid moves highlighted:', validMoves);
            if (nodeListView) {
                nodeListView.render(mapManager.nodes, mapManager.currentNodeId, validMoves);
            }
            openModal();
            console.log('🗺️ Select your next destination!');
        }
    }, 500);
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

    // Update top HUD
    const hudHp = document.getElementById('hud-hp');
    const hudEnergy = document.getElementById('hud-energy');
    const hudGold = document.getElementById('hud-gold');
    const hudFloor = document.getElementById('hud-floor');
    const actNumber = document.getElementById('act-number');

    if (hudHp) hudHp.textContent = `${gameState.playerHp}/${gameState.playerMaxHp}`;
    if (hudEnergy) hudEnergy.textContent = `${gameState.energy || 3}/${gameState.maxEnergy || 3}`;
    if (hudGold) hudGold.textContent = mapManager.gold;
    if (hudFloor) hudFloor.textContent = `${mapManager.currentFloor}/15`;
    if (actNumber) actNumber.textContent = mapManager.currentAct;
    
    // Also update combat panel bars
    updateHealthBars();
}

/**
 * Updates health and energy bars in combat
 */
function updateHealthBars() {
    const gameState = window.gameState;
    if (!gameState) return;
    
    // Player HP bar
    const playerHpBar = document.getElementById('player-hp-bar');
    const playerHpText = document.getElementById('player-hp');
    const playerMaxHpText = document.getElementById('player-max-hp');
    
    if (playerHpBar) {
        const hpPercent = (gameState.playerHp / gameState.playerMaxHp) * 100;
        playerHpBar.style.width = `${Math.max(0, hpPercent)}%`;
    }
    if (playerHpText) playerHpText.textContent = gameState.playerHp;
    if (playerMaxHpText) playerMaxHpText.textContent = gameState.playerMaxHp;
    
    // Player Energy (update orb)
    const energyCount = document.getElementById('energy-count');
    const energyMax = document.getElementById('energy-max');
    const energy = gameState.energy ?? 3;
    const maxEnergy = gameState.maxEnergy ?? 3;
    
    if (energyCount) energyCount.textContent = energy;
    if (energyMax) energyMax.textContent = maxEnergy;
    
    // Player Block display
    const playerBlockText = document.getElementById('player-block');
    if (playerBlockText) {
        playerBlockText.textContent = gameState.playerBlock || 0;
    }
    
    // Enemy HP bar
    const enemyHpBar = document.getElementById('enemy-hp-bar');
    const enemyHpText = document.getElementById('enemy-hp');
    const enemyMaxHpText = document.getElementById('enemy-max-hp');
    
    if (gameState.enemy) {
        if (enemyHpBar) {
            const enemyHpPercent = (gameState.enemyHp / gameState.enemyMaxHp) * 100;
            enemyHpBar.style.width = `${Math.max(0, enemyHpPercent)}%`;
        }
        if (enemyHpText) enemyHpText.textContent = gameState.enemyHp;
        if (enemyMaxHpText) enemyMaxHpText.textContent = gameState.enemyMaxHp;
    }
    
    // Update draw pile counter
    const drawCount = document.getElementById('draw-count');
    if (gameState.cardPileManager && drawCount) {
        drawCount.textContent = gameState.cardPileManager.getDrawPileCount();
    }
    
    // Update discard pile counter
    const discardCount = document.getElementById('discard-count');
    if (gameState.cardPileManager && discardCount) {
        discardCount.textContent = gameState.cardPileManager.getDiscardPileCount();
    }
    
    console.log('[updateHealthBars] Player:', gameState.playerHp + '/' + gameState.playerMaxHp, 'Block:', gameState.playerBlock, 'Energy:', energy + '/' + maxEnergy);
    if (gameState.enemy) {
        console.log('[updateHealthBars] Enemy:', gameState.enemy.name, gameState.enemyHp + '/' + gameState.enemyMaxHp);
    }
}

/**
 * Updates enemy display (emoji, name)
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
    const hand = window.hand;

    if (!gameState || !gameState.turnManager) {
        console.warn('[endTurn] GameState or TurnManager not ready');
        return;
    }

    console.log('[endTurn] Ending player turn...');

    // End player turn
    gameState.turnManager.endTurn();

    // Enemy attacks
    if (gameState.enemy && gameState.enemyHp > 0) {
        const enemyDamage = gameState.enemy.damage || 8;
        const newPlayerHp = gameState.playerHp - enemyDamage;
        gameState.playerHp = newPlayerHp;
        
        console.log(`[endTurn] Enemy attacks for ${enemyDamage} damage! Player HP: ${gameState.playerHp}`);
        
        // Check for defeat
        if (gameState.playerHp <= 0) {
            console.log('[endTurn] Player defeated!');
            onCombatLoss();
            return;
        }
    }

    // Start new turn (resets energy to 3)
    gameState.turnManager.startTurn();

    // Update UI
    if (hud) hud.updateAll();
    updateHealthBars();
    updateEnemyIntent();
    
    // Re-enable hand
    if (hand) {
        hand.updateCardAffordability();
    }

    console.log(`[endTurn] New turn started | Energy: ${gameState.energy}/${gameState.maxEnergy}`);
}

/**
 * Opens deck viewer modal (deck or discard pile)
 * @param {string} type - 'deck' or 'discard'
 */
function openDeckViewer(type) {
    const gameState = window.gameState;
    const deckViewerModal = document.getElementById('deck-viewer-modal');
    const deckViewerTitle = document.getElementById('deck-viewer-title');
    const deckViewerCards = document.getElementById('deck-viewer-cards');
    
    if (!gameState || !gameState.cardPileManager || !deckViewerModal) return;
    
    const pileManager = gameState.cardPileManager;
    let cards = [];
    
    if (type === 'deck') {
        cards = pileManager.drawPile || [];  // Direct property access
        deckViewerTitle.textContent = `Draw Pile (${cards.length} cards)`;
    } else if (type === 'discard') {
        cards = pileManager.discardPile || [];  // Direct property access
        deckViewerTitle.textContent = `Discard Pile (${cards.length} cards)`;
    }
    
    // Clear previous cards
    deckViewerCards.innerHTML = '';
    
    if (cards.length === 0) {
        deckViewerCards.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No cards</p>';
    } else {
        // Show each card
        for (const card of cards) {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.innerHTML = `
                <div class="card-emoji">${card.emoji || '🎴'}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-cost">${card.cost}</div>
            `;
            deckViewerCards.appendChild(cardEl);
        }
    }
    
    // Show modal
    deckViewerModal.style.display = 'flex';
    deckViewerModal.classList.add('active');
    
    console.log(`[DeckViewer] Opened ${type} with ${cards.length} cards`);
}
