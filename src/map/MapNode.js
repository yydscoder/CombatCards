/**
 * MapNode Base Class for Emoji Card Battle
 *
 * This is the foundational class for all map nodes in the game.
 * Each node represents a point on the map that the player can visit.
 *
 * Design Philosophy: Slay the Spire-style map nodes
 * - Each node has a type (Combat, Elite, Event, Shop, Rest, Boss)
 * - Nodes are connected to form paths upward through floors
 * - Player can only move to connected nodes on the next floor
 *
 * @module map/MapNode
 */

/**
 * NodeType Enum - Valid node types for the map
 * @readonly
 * @enum {string}
 */
export const NodeType = {
    /** Starting node (🏁) */
    START: 'start',
    /** Normal combat encounter (⚔️) */
    COMBAT: 'combat',
    /** Elite enemy encounter (💀) */
    ELITE: 'elite',
    /** Random event (❓) */
    EVENT: 'event',
    /** Shop/merchant (🏪) */
    SHOP: 'shop',
    /** Rest site/campfire (🔥) */
    REST: 'rest',
    /** Boss fight (👑) */
    BOSS: 'boss'
};

/**
 * NodeIcon Map - Emoji icons for each node type
 * @readonly
 */
export const NodeIcon = {
    [NodeType.START]: '🏁',
    [NodeType.COMBAT]: '⚔️',
    [NodeType.ELITE]: '💀',
    [NodeType.EVENT]: '❓',
    [NodeType.SHOP]: '🏪',
    [NodeType.REST]: '🔥',
    [NodeType.BOSS]: '👑'
};

/**
 * NodeColor Map - Colors for each node type (for Canvas rendering)
 * @readonly
 */
export const NodeColor = {
    [NodeType.START]: '#4caf50',      // Green
    [NodeType.COMBAT]: '#ff5252',     // Red
    [NodeType.ELITE]: '#e040fb',      // Purple
    [NodeType.EVENT]: '#ffd740',      // Yellow
    [NodeType.SHOP]: '#69f0ae',       // Light Green
    [NodeType.REST]: '#448aff',       // Blue
    [NodeType.BOSS]: '#ff6d00'        // Orange
};

/**
 * MapNode Class
 *
 * Base class for all map nodes. Subclasses should override
 * methods to implement type-specific behavior.
 *
 * @example
 * const node = new MapNode(1, NodeType.COMBAT, 5, 100, 200);
 * node.connectTo(otherNode);
 * node.enter(player);
 */
export class MapNode {
    /**
     * Creates a new MapNode instance
     *
     * @param {number} id - Unique node identifier
     * @param {NodeType} type - Type of node
     * @param {number} floor - Floor number (1-15 per act)
     * @param {number} x - X position on map (for rendering)
     * @param {number} y - Y position on map (for rendering)
     */
    constructor(id, type, floor, x, y) {
        // ───────────────────────────────────────────────────────────────────────
        // Node Identification
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {number}
         * @description Unique node identifier
         */
        this.id = id;

        /**
         * @type {NodeType}
         * @description Type of node
         */
        this.type = type;

        /**
         * @type {number}
         * @description Floor number (1-15 per act)
         */
        this.floor = floor;

        // ───────────────────────────────────────────────────────────────────────
        // Position (for rendering and path validation)
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {number}
         * @description X position on map
         */
        this.x = x;

        /**
         * @type {number}
         * @description Y position on map
         */
        this.y = y;

        // ───────────────────────────────────────────────────────────────────────
        // Connections (nodes this can move to)
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {Array<number>}
         * @description Array of connected node IDs (next floor only)
         */
        this.connections = [];

        /**
         * @type {Array<number>}
         * @description Array of node IDs that connect TO this node (previous floor)
         */
        this.incomingConnections = [];

        // ───────────────────────────────────────────────────────────────────────
        // State
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {boolean}
         * @description Whether this node has been visited
         */
        this.visited = false;

        /**
         * @type {boolean}
         * @description Whether this node is currently selected
         */
        this.isSelected = false;

        /**
         * @type {boolean}
         * @description Whether this node is reachable from current position
         */
        this.isReachable = false;

        // ───────────────────────────────────────────────────────────────────────
        // Reward (what player gets for completing this node)
        // ───────────────────────────────────────────────────────────────────────

        /**
         * @type {Object|null}
         * @description Reward object (gold, cards, relics)
         */
        this.reward = null;

        /**
         * @type {boolean}
         * @description Whether reward has been claimed
         */
        this.rewardClaimed = false;

        /**
         * @type {number}
         * @description Timestamp when node was created
         */
        this.createdTimestamp = Date.now();

        console.log(`[MapNode] Created: ${type} at floor ${floor} (${x}, ${y})`);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Connection Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Connects this node to another node
     *
     * @param {MapNode} targetNode - Node to connect to
     * @returns {Object} Connection result
     *
     * @example
     * node.connectTo(nextFloorNode);
     */
    connectTo(targetNode) {
        // Validate connection (must be next floor)
        if (targetNode.floor !== this.floor + 1) {
            console.warn(`[MapNode] Cannot connect: target must be on floor ${this.floor + 1}, got ${targetNode.floor}`);
            return {
                success: false,
                reason: 'invalid_floor',
                message: 'Can only connect to nodes on the next floor'
            };
        }

        // Check if already connected
        if (this.connections.includes(targetNode.id)) {
            console.log(`[MapNode] Already connected to node ${targetNode.id}`);
            return {
                success: false,
                reason: 'already_connected',
                message: 'Already connected to this node'
            };
        }

        // Add connection
        this.connections.push(targetNode.id);
        targetNode.incomingConnections.push(this.id);

        console.log(`[MapNode] Connected: ${this.id} (floor ${this.floor}) → ${targetNode.id} (floor ${targetNode.floor})`);

        return {
            success: true,
            from: this.id,
            to: targetNode.id
        };
    }

    /**
     * Removes a connection to another node
     *
     * @param {number} targetNodeId - ID of node to disconnect
     * @returns {Object} Disconnection result
     */
    disconnectFrom(targetNodeId) {
        const index = this.connections.indexOf(targetNodeId);

        if (index === -1) {
            return { success: false, reason: 'not_connected' };
        }

        this.connections.splice(index, 1);
        console.log(`[MapNode] Disconnected from node ${targetNodeId}`);

        return { success: true };
    }

    /**
     * Gets all connected nodes from a map array
     *
     * @param {Array<MapNode>} allNodes - Array of all nodes in the map
     * @returns {Array<MapNode>} Array of connected nodes
     */
    getConnectedNodes(allNodes) {
        return allNodes.filter(node => this.connections.includes(node.id));
    }

    /**
     * Gets all nodes that connect to this node
     *
     * @param {Array<MapNode>} allNodes - Array of all nodes in the map
     * @returns {Array<MapNode>} Array of incoming nodes
     */
    getIncomingNodes(allNodes) {
        return allNodes.filter(node => this.incomingConnections.includes(node.id));
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Node Interaction Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Called when player enters this node
     *
     * @param {Object} player - Player object/gameState
     * @returns {Object} Enter result
     *
     * @example
     * const result = node.enter(player);
     * if (result.success) {
     *     console.log(`Entered ${node.type} node`);
     * }
     */
    enter(player) {
        if (this.visited) {
            console.log(`[MapNode] Node ${this.id} already visited`);
            return {
                success: false,
                reason: 'already_visited',
                message: 'This node has already been visited'
            };
        }

        this.visited = true;
        this.isSelected = true;

        console.log(`[MapNode] Player entered ${this.type} node ${this.id}`);

        return {
            success: true,
            nodeType: this.type,
            nodeId: this.id,
            floor: this.floor
        };
    }

    /**
     * Called when player completes this node
     *
     * @param {Object} result - Completion result (combat win, shop purchase, etc.)
     * @returns {Object} Complete result with reward
     */
    complete(result) {
        this.isSelected = false;
        this.visited = true;

        if (result && result.reward) {
            this.reward = result.reward;
        }

        console.log(`[MapNode] Node ${this.id} completed`, result);

        return {
            success: true,
            nodeId: this.id,
            reward: this.reward,
            nextFloor: this.floor + 1
        };
    }

    /**
     * Claims the reward from this node
     *
     * @returns {Object|null} Reward object or null
     */
    claimReward() {
        if (!this.reward || this.rewardClaimed) {
            return null;
        }

        this.rewardClaimed = true;
        console.log(`[MapNode] Reward claimed from node ${this.id}`);

        return { ...this.reward };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // State Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Sets this node as reachable
     *
     * @param {boolean} reachable - Whether node is reachable
     */
    setReachable(reachable) {
        this.isReachable = reachable;
    }

    /**
     * Resets node state (for new runs)
     */
    reset() {
        this.visited = false;
        this.isSelected = false;
        this.isReachable = false;
        this.reward = null;
        this.rewardClaimed = false;
        this.connections = [];
        this.incomingConnections = [];

        console.log(`[MapNode] Node ${this.id} reset`);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Display Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Gets the icon emoji for this node type
     *
     * @returns {string} Icon emoji
     */
    getIcon() {
        return NodeIcon[this.type] || '❓';
    }

    /**
     * Gets the color for this node type
     *
     * @returns {string} Color hex code
     */
    getColor() {
        return NodeColor[this.type] || '#ffffff';
    }

    /**
     * Gets display name for this node
     *
     * @returns {string} Display name
     */
    getDisplayName() {
        const typeNames = {
            [NodeType.START]: 'Start',
            [NodeType.COMBAT]: 'Combat',
            [NodeType.ELITE]: 'Elite',
            [NodeType.EVENT]: 'Event',
            [NodeType.SHOP]: 'Shop',
            [NodeType.REST]: 'Rest',
            [NodeType.BOSS]: 'Boss'
        };

        return `${this.getIcon()} ${typeNames[this.type] || 'Unknown'} (Floor ${this.floor})`;
    }

    /**
     * Gets a description of this node
     *
     * @returns {string} Description
     */
    getDescription() {
        const descriptions = {
            [NodeType.START]: 'Starting point of your journey',
            [NodeType.COMBAT]: 'Face an enemy in combat',
            [NodeType.ELITE]: 'Battle a powerful elite enemy',
            [NodeType.EVENT]: 'Encounter a random event',
            [NodeType.SHOP]: 'Buy cards and relics',
            [NodeType.REST]: 'Rest to recover HP or upgrade a card',
            [NodeType.BOSS]: 'Defeat the act boss!'
        };

        return descriptions[this.type] || 'Unknown node type';
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Serialization
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Serializes node to plain object for saving
     *
     * @returns {Object} Serialized node data
     */
    serialize() {
        return {
            id: this.id,
            type: this.type,
            floor: this.floor,
            x: this.x,
            y: this.y,
            connections: this.connections,
            incomingConnections: this.incomingConnections,
            visited: this.visited,
            isSelected: this.isSelected,
            isReachable: this.isReachable,
            reward: this.reward,
            rewardClaimed: this.rewardClaimed
        };
    }

    /**
     * Deserializes node from plain object
     *
     * @param {Object} data - Serialized node data
     * @returns {MapNode} Deserialized node
     */
    static deserialize(data) {
        const node = new MapNode(data.id, data.type, data.floor, data.x, data.y);
        node.connections = data.connections || [];
        node.incomingConnections = data.incomingConnections || [];
        node.visited = data.visited || false;
        node.isSelected = data.isSelected || false;
        node.isReachable = data.isReachable || false;
        node.reward = data.reward || null;
        node.rewardClaimed = data.rewardClaimed || false;
        return node;
    }
}

export default MapNode;
