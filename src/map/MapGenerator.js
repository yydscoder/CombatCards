/**
 * MapGenerator Module for Emoji Card Battle
 *
 * This module generates procedural maps for the campaign.
 * Each act has 15 floors with branching paths (Slay the Spire style).
 *
 * Design Philosophy: StS-style procedural generation
 * - 3-5 nodes per floor
 * - Branching paths upward
 * - Guaranteed special nodes (Shop, Rest) per act
 * - Boss at floor 15
 *
 * @module map/MapGenerator
 */

import { MapNode, NodeType } from './MapNode.js';
import { CombatNode } from './nodes/CombatNode.js';
import { EliteNode } from './nodes/EliteNode.js';
import { EventNode } from './nodes/EventNode.js';
import { ShopNode } from './nodes/ShopNode.js';
import { RestNode } from './nodes/RestNode.js';
import { BossNode } from './nodes/BossNode.js';

/**
 * MapGenerator Class
 *
 * Generates complete acts with proper node distribution and connections.
 *
 * @example
 * const generator = new MapGenerator();
 * const act = generator.generateAct(1, 15);
 * const campaign = generator.generateCampaign();
 */
export class MapGenerator {
    /**
     * Creates a new MapGenerator instance
     */
    constructor() {
        /**
         * @type {number}
         * @description Nodes per floor (3-5)
         */
        this.minNodesPerFloor = 3;
        this.maxNodesPerFloor = 5;

        /**
         * @type {number}
         * @description Floors per act
         */
        this.floorsPerAct = 15;

        /**
         * @type {Object}
         * @description Node distribution weights
         */
        this.nodeWeights = {
            combat: 0.55,    // 55% combat nodes
            elite: 0.15,     // 15% elite nodes
            event: 0.12,     // 12% event nodes
            shop: 0.08,      // 8% shop nodes
            rest: 0.10       // 10% rest nodes
        };

        /**
         * @type {Array<number>}
         * @description Guaranteed shop floors per act
         */
        this.guaranteedShopFloors = [5, 10];

        /**
         * @type {Array<number>}
         * @description Guaranteed rest floors per act
         */
        this.guaranteedRestFloors = [3, 8, 12];

        console.log('[MapGenerator] Initialized');
    }

    /**
     * Generates a complete act
     *
     * @param {number} actNumber - Act number (1-3)
     * @param {number} [floors=15] - Number of floors
     * @returns {Object} Generated act with nodes
     *
     * @example
     * const act = generator.generateAct(1, 15);
     * console.log(`Act 1: ${act.nodes.length} nodes`);
     */
    generateAct(actNumber, floors = 15) {
        console.log(`[MapGenerator] Generating Act ${actNumber} with ${floors} floors`);

        const nodes = [];
        let nodeId = 0;

        // Generate start node (floor 0)
        const startNode = this._createStartNode(nodeId++, 0);
        nodes.push(startNode);

        // Generate floors 1 to floors-1
        for (let floor = 1; floor < floors; floor++) {
            const floorNodes = this._generateFloor(floor, actNumber, nodeId);
            nodeId += floorNodes.length;
            nodes.push(...floorNodes);
        }

        // Generate boss floor (floor 15)
        const bossNode = this._createBossNode(nodeId++, floors, actNumber);
        nodes.push(bossNode);

        // Connect nodes between floors
        this._connectNodes(nodes, floors);

        // Place guaranteed special nodes
        this._placeGuaranteedNodes(nodes, actNumber);

        console.log(`[MapGenerator] Act ${actNumber} generated: ${nodes.length} nodes`);

        return {
            actNumber,
            floors,
            nodes,
            startNode: startNode.id,
            bossNode: bossNode.id
        };
    }

    /**
     * Generates a complete campaign (3 acts)
     *
     * @returns {Object} Complete campaign with all acts
     */
    generateCampaign() {
        console.log('[MapGenerator] Generating complete campaign (3 acts)');

        const acts = [];

        for (let act = 1; act <= 3; act++) {
            const actData = this.generateAct(act, this.floorsPerAct);
            acts.push(actData);
        }

        console.log(`[MapGenerator] Campaign generated: ${acts.length} acts`);

        return {
            acts,
            totalFloors: acts.length * this.floorsPerAct,
            currentAct: 1,
            currentFloor: 0
        };
    }

    /**
     * Generates nodes for a single floor
     *
     * @private
     * @param {number} floor - Floor number
     * @param {number} actNumber - Act number
     * @param {number} startId - Starting node ID
     * @returns {Array<MapNode>} Array of nodes for this floor
     */
    _generateFloor(floor, actNumber, startId) {
        const nodeCount = this._getNodeCountForFloor();
        const nodes = [];
        const canvasWidth = 800;
        const spacing = canvasWidth / (nodeCount + 1);

        for (let i = 0; i < nodeCount; i++) {
            const nodeId = startId + i;
            const x = spacing * (i + 1);
            const y = floor * 40; // 40px per floor

            // Determine node type based on weights
            const nodeType = this._determineNodeType(floor, actNumber);

            const node = this._createNode(nodeId, nodeType, floor, x, y, actNumber);
            nodes.push(node);
        }

        console.log(`[MapGenerator] Floor ${floor}: ${nodes.length} nodes (${nodes.map(n => n.type).join(', ')})`);

        return nodes;
    }

    /**
     * Gets random node count for floor (3-5)
     *
     * @private
     * @returns {number} Node count
     */
    _getNodeCountForFloor() {
        return Math.floor(this.minNodesPerFloor + Math.random() * (this.maxNodesPerFloor - this.minNodesPerFloor + 1));
    }

    /**
     * Determines node type based on weights and floor
     *
     * @private
     * @param {number} floor - Floor number
     * @param {number} actNumber - Act number
     * @returns {NodeType} Node type
     */
    _determineNodeType(floor, actNumber) {
        const roll = Math.random();
        let cumulative = 0;

        // Check guaranteed floors first
        if (this.guaranteedShopFloors.includes(floor)) {
            return NodeType.SHOP;
        }

        if (this.guaranteedRestFloors.includes(floor)) {
            return NodeType.REST;
        }

        // Elite more common in later acts
        const eliteWeight = actNumber >= 2 ? this.nodeWeights.elite + 0.05 : this.nodeWeights.elite;

        for (const [type, weight] of Object.entries(this.nodeWeights)) {
            cumulative += type === 'elite' ? eliteWeight : weight;
            if (roll <= cumulative) {
                return NodeType[type.toUpperCase()];
            }
        }

        return NodeType.COMBAT;
    }

    /**
     * Creates a node of specified type
     *
     * @private
     * @param {number} id - Node ID
     * @param {NodeType} type - Node type
     * @param {number} floor - Floor number
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} actNumber - Act number
     * @returns {MapNode} Created node
     */
    _createNode(id, type, floor, x, y, actNumber) {
        switch (type) {
            case NodeType.START:
                return this._createStartNode(id, floor);
            case NodeType.COMBAT:
                return new CombatNode(id, floor, x, y);
            case NodeType.ELITE:
                return new EliteNode(id, floor, x, y);
            case NodeType.EVENT:
                return new EventNode(id, floor, x, y);
            case NodeType.SHOP:
                return new ShopNode(id, floor, x, y);
            case NodeType.REST:
                return new RestNode(id, floor, x, y);
            case NodeType.BOSS:
                return this._createBossNode(id, floor, actNumber);
            default:
                return new CombatNode(id, floor, x, y);
        }
    }

    /**
     * Creates a start node
     *
     * @private
     * @param {number} id - Node ID
     * @param {number} floor - Floor number
     * @returns {MapNode} Start node
     */
    _createStartNode(id, floor) {
        const node = new MapNode(id, NodeType.START, floor, 400, floor * 40);
        return node;
    }

    /**
     * Creates a boss node
     *
     * @private
     * @param {number} id - Node ID
     * @param {number} floor - Floor number
     * @param {number} actNumber - Act number
     * @returns {BossNode} Boss node
     */
    _createBossNode(id, floor, actNumber) {
        const node = new BossNode(id, floor, 400, floor * 40, actNumber);
        return node;
    }

    /**
     * Connects nodes between adjacent floors
     *
     * @private
     * @param {Array<MapNode>} nodes - All nodes
     * @param {number} maxFloor - Maximum floor number
     */
    _connectNodes(nodes, maxFloor) {
        console.log('[MapGenerator] Connecting nodes between floors');

        for (let floor = 0; floor < maxFloor; floor++) {
            const currentFloorNodes = nodes.filter(n => n.floor === floor);
            const nextFloorNodes = nodes.filter(n => n.floor === floor + 1);

            for (const currentNode of currentFloorNodes) {
                // Each node connects to 1-3 nodes on next floor
                const connectionCount = Math.min(
                    Math.floor(1 + Math.random() * 3),
                    nextFloorNodes.length
                );

                // Shuffle and pick connections
                const shuffled = [...nextFloorNodes].sort(() => Math.random() - 0.5);
                const connections = shuffled.slice(0, connectionCount);

                for (const targetNode of connections) {
                    currentNode.connectTo(targetNode);
                }
            }
        }

        console.log('[MapGenerator] Node connections complete');
    }

    /**
     * Places guaranteed special nodes (Shop, Rest)
     *
     * @private
     * @param {Array<MapNode>} nodes - All nodes
     * @param {number} actNumber - Act number
     */
    _placeGuaranteedNodes(nodes, actNumber) {
        console.log('[MapGenerator] Placing guaranteed special nodes');

        // Convert some combat nodes to guaranteed shops/rests
        for (const floor of this.guaranteedShopFloors) {
            const floorNodes = nodes.filter(n => n.floor === floor && n.type === NodeType.COMBAT);
            if (floorNodes.length > 0) {
                const nodeToConvert = floorNodes[0];
                const shopNode = new ShopNode(nodeToConvert.id, floor, nodeToConvert.x, nodeToConvert.y);
                Object.assign(nodeToConvert, shopNode);
                console.log(`[MapGenerator] Floor ${floor}: Converted to Shop`);
            }
        }

        for (const floor of this.guaranteedRestFloors) {
            const floorNodes = nodes.filter(n => n.floor === floor && n.type === NodeType.COMBAT);
            if (floorNodes.length > 0) {
                const nodeToConvert = floorNodes[Math.floor(Math.random() * floorNodes.length)];
                const restNode = new RestNode(nodeToConvert.id, floor, nodeToConvert.x, nodeToConvert.y);
                Object.assign(nodeToConvert, restNode);
                console.log(`[MapGenerator] Floor ${floor}: Converted to Rest`);
            }
        }
    }

    /**
     * Gets all nodes for a specific floor
     *
     * @param {Array<MapNode>} nodes - All nodes
     * @param {number} floor - Floor number
     * @returns {Array<MapNode>} Nodes on specified floor
     */
    getNodesForFloor(nodes, floor) {
        return nodes.filter(n => n.floor === floor);
    }

    /**
     * Gets the boss node for an act
     *
     * @param {Array<MapNode>} nodes - All nodes
     * @param {number} actNumber - Act number
     * @returns {BossNode|null} Boss node or null
     */
    getBossNode(nodes, actNumber) {
        return nodes.find(n => n.type === NodeType.BOSS && n.actNumber === actNumber) || null;
    }
}

export default MapGenerator;
