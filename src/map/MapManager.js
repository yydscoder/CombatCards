/**
 * MapManager Module for Emoji Card Battle
 *
 * This module manages the campaign map and run progression.
 * It replaces the RoundManager for the new map-based progression system.
 *
 * Features:
 * - Generate 3-act campaign map
 * - Track player progress through nodes
 * - Handle node completion (combat, shop, rest, etc.)
 * - Persist progress (localStorage)
 *
 * @module map/MapManager
 */

import { MapGenerator } from './MapGenerator.js';
import { Pathfinder } from './Pathfinder.js';
import { NodeType, MapNode } from './MapNode.js';

/**
 * MapManager Class
 *
 * Manages the complete campaign run from start to finish.
 *
 * @example
 * const mapManager = new MapManager();
 * mapManager.startNewRun();
 * mapManager.moveToNode(nodeId);
 * mapManager.completeNode(nodeId, result);
 */
export class MapManager {
    /**
     * Creates a new MapManager instance
     */
    constructor() {
        /**
         * @type {Object|null}
         * @description Complete campaign with all acts
         */
        this.campaign = null;

        /**
         * @type {Array<MapNode>}
         * @description All nodes in current act
         */
        this.nodes = [];

        /**
         * @type {Pathfinder|null}
         * @description Pathfinder for movement validation
         */
        this.pathfinder = null;

        /**
         * @type {number}
         * @description Current act number (1-3)
         */
        this.currentAct = 1;

        /**
         * @type {number}
         * @description Current floor number
         */
        this.currentFloor = 0;

        /**
         * @type {number|null}
         * @description Current node ID
         */
        this.currentNodeId = null;

        /**
         * @type {number}
         * @description Player gold
         */
        this.gold = 0;

        /**
         * @type {number}
         * @description Total kills this run
         */
        this.totalKills = 0;

        /**
         * @type {number}
         * @description Best run (highest act reached)
         */
        this.bestAct = 1;

        /**
         * @type {number}
         * @description Floors per act
         */
        this.floorsPerAct = 15;

        /**
         * @type {string}
         * @description localStorage key
         */
        this.storageKey = 'combatCards_campaign';

        /**
         * @type {number|null}
         * @description Currently selected node ID (for UI)
         */
        this.selectedNodeId = null;

        // Load saved progress
        this.loadProgress();

        console.log(`[MapManager] Initialized. Current Act: ${this.currentAct}`);
    }

    /**
     * Starts a new campaign run
     */
    startNewRun() {
        console.log('[MapManager] Starting new campaign run...');

        this.reset();

        // Generate new campaign
        const mapGenerator = new MapGenerator();
        this.campaign = mapGenerator.generateCampaign();

        // Set up first act
        this._loadAct(1);

        // Reset run stats
        this.gold = 0;
        this.totalKills = 0;
        this.currentFloor = 0;
        this.currentNodeId = this.nodes[0]?.id || null;

        // Initialize pathfinder
        this.pathfinder = new Pathfinder(this.nodes);
        if (this.currentNodeId) {
            this.pathfinder.setCurrentNode(this.currentNodeId);
        }

        this.selectedNodeId = null;

        // Save progress
        this.saveProgress();

        console.log(`[MapManager] New campaign started. Act ${this.currentAct}, Floor ${this.currentFloor}`);

        return {
            success: true,
            campaign: this.campaign,
            currentAct: this.currentAct,
            currentFloor: this.currentFloor,
            currentNodeId: this.currentNodeId
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Run Management
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Gets valid moves from current position
     * @returns {Array<number>} Array of valid node IDs
     */
    getValidMoves() {
        if (!this.pathfinder || !this.currentNodeId) return [];
        return this.pathfinder.getValidMoves(this.currentNodeId);
    }

    /**
     * Moves player to a node
     * @param {number} nodeId - Target node ID
     * @returns {Object} Move result
     */
    moveToNode(nodeId) {
        if (!this.pathfinder) return { success: false, reason: 'no_pathfinder' };

        const result = this.pathfinder.moveToNode(nodeId);
        if (result.success) {
            this.currentNodeId = nodeId;
            const node = this.nodes.find(n => n.id === nodeId);
            this.currentFloor = node?.floor || this.currentFloor;
            this.selectedNodeId = null;
            this.saveProgress();
        }
        return result;
    }

    /**
     * Spawns a random enemy for combat node
     * @returns {Object} Enemy object
     */
    spawnEnemy() {
        const enemies = [
            { name: 'Slime', hp: 42, maxHp: 42, emoji: '🟢', attackInterval: 1, damage: 8 },
            { name: 'Goblin', hp: 38, maxHp: 38, emoji: '👺', attackInterval: 1, damage: 10 },
            { name: 'Skeleton', hp: 35, maxHp: 35, emoji: '💀', attackInterval: 1, damage: 12 }
        ];
        const enemy = enemies[Math.floor(Math.random() * enemies.length)];
        return { ...enemy, hp: enemy.maxHp, id: `enemy_${Date.now()}` };
    }

    /**
     * Spawns an elite enemy
     * @returns {Object} Elite enemy object
     */
    spawnElite() {
        const elites = [
            { name: 'Orc Warrior', hp: 75, maxHp: 75, emoji: '👹', attackInterval: 1, damage: 14 },
            { name: 'Dark Mage', hp: 60, maxHp: 60, emoji: '🧙', attackInterval: 1, damage: 18 }
        ];
        const enemy = elites[Math.floor(Math.random() * elites.length)];
        return { ...enemy, hp: enemy.maxHp, id: `elite_${Date.now()}`, isElite: true };
    }

    /**
     * Spawns a boss enemy
     * @returns {Object} Boss enemy object
     */
    spawnBoss() {
        const bosses = [
            { name: 'Dragon', hp: 150, maxHp: 150, emoji: '🐉', attackInterval: 2, damage: 20 },
            { name: 'Demon Lord', hp: 180, maxHp: 180, emoji: '👿', attackInterval: 2, damage: 25 }
        ];
        const enemy = bosses[Math.floor(Math.random() * bosses.length)];
        return { ...enemy, hp: enemy.maxHp, id: `boss_${Date.now()}`, isBoss: true };
    }

    /**
     * Loads an act's nodes
     *
     * @private
     * @param {number} actNumber - Act number to load
     */
    _loadAct(actNumber) {
        if (!this.campaign || !this.campaign.acts[actNumber - 1]) {
            console.error('[MapManager] Act not found:', actNumber);
            return;
        }

        this.nodes = this.campaign.acts[actNumber - 1].nodes;
        this.currentAct = actNumber;

        console.log(`[MapManager] Loaded Act ${actNumber}: ${this.nodes.length} nodes`);
    }

    /**
     * Advances to the next act
     *
     * @returns {Object} Act advance result
     */
    advanceToNextAct() {
        if (this.currentAct >= 3) {
            return {
                success: false,
                reason: 'campaign_complete',
                message: 'Campaign completed!'
            };
        }

        this.currentAct++;
        this._loadAct(this.currentAct);

        // Update pathfinder with new act nodes
        this.pathfinder = new Pathfinder(this.nodes);
        this.currentNodeId = this.nodes[0]?.id || null;
        this.pathfinder.setCurrentNode(this.currentNodeId);
        this.currentFloor = 0;

        console.log(`[MapManager] Advanced to Act ${this.currentAct}`);

        return {
            success: true,
            currentAct: this.currentAct,
            message: `Entering Act ${this.currentAct}!`
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Movement
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Moves to a node
     *
     * @param {number} nodeId - Target node ID
     * @returns {Object} Move result
     */
    moveToNode(nodeId) {
        if (!this.currentNodeId) {
            return {
                success: false,
                reason: 'no_current_node',
                message: 'No current position'
            };
        }

        // Validate move
        const validation = this.pathfinder.isValidMove(this.currentNodeId, nodeId);

        if (!validation.valid) {
            return validation;
        }

        // Move to node
        const result = this.pathfinder.setCurrentNode(nodeId);

        if (result.success) {
            this.currentNodeId = nodeId;
            const node = this.nodes.find(n => n.id === nodeId);
            this.currentFloor = node.floor;

            console.log(`[MapManager] Moved to node ${nodeId} (Floor ${this.currentFloor})`);
        }

        return result;
    }

    /**
     * Gets valid moves from current position
     *
     * @returns {Array<number>} Array of valid node IDs
     */
    getValidMoves() {
        return this.pathfinder.getValidMoves(this.currentNodeId);
    }

    /**
     * Gets current node
     *
     * @returns {MapNode|null} Current node
     */
    getCurrentNode() {
        return this.pathfinder.getCurrentNode();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Node Completion
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Completes a node (after combat, shop visit, etc.)
     *
     * @param {number} nodeId - Node ID
     * @param {Object} result - Completion result
     * @returns {Object} Complete result
     */
    completeNode(nodeId, result) {
        const node = this.nodes.find(n => n.id === nodeId);

        if (!node) {
            return {
                success: false,
                reason: 'node_not_found'
            };
        }

        // Complete the node
        const completeResult = node.complete(result);

        if (!completeResult.success) {
            return completeResult;
        }

        // Handle rewards
        if (result.reward) {
            this._applyRewards(result.reward);
        }

        // Handle kills
        if (result.victory && (node.type === NodeType.COMBAT || node.type === NodeType.ELITE || node.type === NodeType.BOSS)) {
            this.totalKills++;
        }

        // Handle boss defeat
        if (node.type === NodeType.BOSS && result.victory) {
            return this._handleBossVictory(node);
        }

        console.log(`[MapManager] Node ${nodeId} completed`);

        return {
            success: true,
            nodeId,
            floor: this.currentFloor,
            canMoveTo: this.getValidMoves()
        };
    }

    /**
     * Applies rewards from node completion
     *
     * @private
     * @param {Object} reward - Reward object
     */
    _applyRewards(reward) {
        if (reward.gold) {
            this.gold += reward.gold;
            console.log(`[MapManager] Gained ${reward.gold} gold (total: ${this.gold})`);
        }
    }

    /**
     * Handles boss victory
     *
     * @private
     * @param {BossNode} bossNode - Boss node
     * @returns {Object} Boss victory result
     */
    _handleBossVictory(bossNode) {
        console.log(`[MapManager] Act ${bossNode.actNumber} boss defeated!`);

        if (bossNode.actNumber >= 3) {
            // Campaign complete!
            return {
                success: true,
                campaignComplete: true,
                message: 'Congratulations! You have completed the campaign!'
            };
        }

        // Advance to next act
        return {
            success: true,
            bossDefeated: true,
            actComplete: bossNode.actNumber,
            advanceToNextAct: true
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Save/Load System
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Saves progress to localStorage
     */
    saveProgress() {
        const data = {
            campaign: this.campaign,
            currentAct: this.currentAct,
            currentFloor: this.currentFloor,
            currentNodeId: this.currentNodeId,
            gold: this.gold,
            totalKills: this.totalKills,
            bestAct: this.bestAct,
            nodes: this.nodes.map(n => n.serialize())
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            console.log('[MapManager] Progress saved');
        } catch (e) {
            console.warn('[MapManager] Failed to save progress:', e);
        }
    }

    /**
     * Loads progress from localStorage
     *
     * @returns {boolean} Whether load was successful
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem(this.storageKey);

            if (!saved) {
                console.log('[MapManager] No saved progress found');
                return false;
            }

            const data = JSON.parse(saved);

            this.campaign = data.campaign;
            this.currentAct = data.currentAct || 1;
            this.currentFloor = data.currentFloor || 0;
            this.currentNodeId = data.currentNodeId;
            this.gold = data.gold || 0;
            this.totalKills = data.totalKills || 0;
            this.bestAct = data.bestAct || 1;

            // Deserialize nodes
            if (data.nodes) {
                this.nodes = data.nodes.map(n => {
                    // Reconstruct node class based on type
                    return MapNode.deserialize(n);
                });

                this.pathfinder = new Pathfinder(this.nodes);
                if (this.currentNodeId) {
                    this.pathfinder.setCurrentNode(this.currentNodeId);
                }
            }

            console.log(`[MapManager] Progress loaded: Act ${this.currentAct}, Floor ${this.currentFloor}`);

            return true;
        } catch (e) {
            console.error('[MapManager] Failed to load progress:', e);
            return false;
        }
    }

    /**
     * Clears saved progress
     */
    clearProgress() {
        localStorage.removeItem(this.storageKey);
        console.log('[MapManager] Progress cleared');
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Statistics
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Gets current run statistics
     *
     * @returns {Object} Run statistics
     */
    getStats() {
        return {
            currentAct: this.currentAct,
            currentFloor: this.currentFloor,
            gold: this.gold,
            totalKills: this.totalKills,
            bestAct: this.bestAct,
            path: this.pathfinder?.getPathStats()
        };
    }

    /**
     * Resets the map manager
     *
     * @returns {Object} Reset result
     */
    reset() {
        this.campaign = null;
        this.nodes = [];
        this.pathfinder = null;
        this.currentAct = 1;
        this.currentFloor = 0;
        this.currentNodeId = null;
        this.gold = 0;
        this.totalKills = 0;
        this.selectedNodeId = null;

        console.log('[MapManager] Reset complete');

        return { success: true };
    }

    /**
     * Generates the next act after defeating boss
     */
    generateNextAct() {
        console.log(`[MapManager] Generating Act ${this.currentAct}...`);
        
        const mapGenerator = new MapGenerator();
        const act = mapGenerator.generateAct(this.currentAct, this.floorsPerAct);
        
        this.nodes = act.nodes;
        this.pathfinder = new Pathfinder(this.nodes);
        
        // Set starting position (first floor of new act)
        const startNode = this.nodes.find(n => n.floor === 1);
        if (startNode) {
            this.currentNodeId = startNode.id;
            this.currentFloor = 1;
            this.pathfinder.setCurrentNode(startNode.id);
        }
        
        this.selectedNodeId = null;
        
        console.log(`[MapManager] Act ${this.currentAct} generated with ${this.nodes.length} nodes`);
    }
}

/**
 * Creates and initializes a MapManager instance
 *
 * @returns {MapManager} Initialized MapManager
 */
export function initializeMapManager() {
    return new MapManager();
}

export default MapManager;
