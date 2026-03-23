/**
 * Pathfinder Module for Emoji Card Battle
 *
 * This module handles path validation and movement on the map.
 * Players can only move to connected nodes on the next floor.
 *
 * Design Philosophy: Slay the Spire-style movement
 * - Only move upward (floor + 1)
 * - Only to connected nodes
 * - No backtracking
 * - Clear visual feedback for valid moves
 *
 * @module map/Pathfinder
 */

/**
 * Pathfinder Class
 *
 * Validates movement and tracks player path through the map.
 *
 * @example
 * const pathfinder = new Pathfinder(allNodes);
 * const validMoves = pathfinder.getValidMoves(currentNodeId);
 * if (pathfinder.isValidMove(fromId, toId)) {
 *     player.moveTo(toId);
 * }
 */
export class Pathfinder {
    /**
     * Creates a new Pathfinder instance
     *
     * @param {Array<MapNode>} allNodes - All nodes in the map
     */
    constructor(allNodes) {
        /**
         * @private
         * @type {Array<MapNode>}
         * @description All nodes in the map
         */
        this.allNodes = allNodes;

        /**
         * @private
         * @type {Map<number, Array<number>>}
         * @description Node ID to connected node IDs map
         */
        this.connectionMap = new Map();

        /**
         * @private
         * @type {Array<number>}
         * @description Player's path history (node IDs visited)
         */
        this.pathHistory = [];

        /**
         * @private
         * @type {number|null}
         * @description Current node ID
         */
        this.currentNodeId = null;

        // Build connection map
        this._buildConnectionMap();

        console.log('[Pathfinder] Initialized with', allNodes.length, 'nodes');
    }

    /**
     * Builds a map of node connections for quick lookup
     *
     * @private
     */
    _buildConnectionMap() {
        for (const node of this.allNodes) {
            this.connectionMap.set(node.id, [...node.connections]);
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Movement Validation Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Gets all valid moves from current node
     *
     * @param {number} currentNodeId - Current node ID
     * @returns {Array<number>} Array of valid next node IDs
     *
     * @example
     * const validMoves = pathfinder.getValidMoves(currentNodeId);
     * console.log(`Can move to: ${validMoves.join(', ')}`);
     */
    getValidMoves(currentNodeId) {
        const currentNode = this.allNodes.find(n => n.id === currentNodeId);

        if (!currentNode) {
            console.warn('[Pathfinder] Current node not found:', currentNodeId);
            return [];
        }

        // Get connected nodes
        const connectedIds = currentNode.connections;
        const validMoves = [];

        for (const targetId of connectedIds) {
            const targetNode = this.allNodes.find(n => n.id === targetId);

            if (!targetNode) {
                continue;
            }

            // Validate move
            if (this._validateMove(currentNode, targetNode)) {
                validMoves.push(targetId);
                targetNode.setReachable(true);
            }
        }

        console.log(`[Pathfinder] Valid moves from ${currentNodeId}: ${validMoves.join(', ')}`);

        return validMoves;
    }

    /**
     * Checks if a move is valid
     *
     * @param {number} fromNodeId - Starting node ID
     * @param {number} toNodeId - Target node ID
     * @returns {Object} Validation result with reason
     *
     * @example
     * const result = pathfinder.isValidMove(fromId, toId);
     * if (result.valid) {
     *     console.log('Move is valid');
     * } else {
     *     console.log(`Invalid: ${result.reason}`);
     * }
     */
    isValidMove(fromNodeId, toNodeId) {
        const fromNode = this.allNodes.find(n => n.id === fromNodeId);
        const toNode = this.allNodes.find(n => n.id === toNodeId);

        // Check nodes exist
        if (!fromNode) {
            return {
                valid: false,
                reason: 'from_node_not_found',
                message: 'Starting node not found'
            };
        }

        if (!toNode) {
            return {
                valid: false,
                reason: 'to_node_not_found',
                message: 'Target node not found'
            };
        }

        return this._validateMove(fromNode, toNode);
    }

    /**
     * Internal move validation
     *
     * @private
     * @param {MapNode} fromNode - Starting node
     * @param {MapNode} toNode - Target node
     * @returns {Object} Validation result
     */
    _validateMove(fromNode, toNode) {
        // Must move to next floor
        if (toNode.floor !== fromNode.floor + 1) {
            return {
                valid: false,
                reason: 'wrong_floor',
                message: `Must move to floor ${fromNode.floor + 1}, target is floor ${toNode.floor}`
            };
        }

        // Must be connected
        if (!fromNode.connections.includes(toNode.id)) {
            return {
                valid: false,
                reason: 'not_connected',
                message: 'No path exists to this node'
            };
        }

        // Target must not be visited
        if (toNode.visited) {
            return {
                valid: false,
                reason: 'already_visited',
                message: 'This node has already been visited'
            };
        }

        return {
            valid: true,
            message: 'Move is valid'
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Path Management Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Sets the current node (player position)
     *
     * @param {number} nodeId - Node ID
     * @returns {Object} Result
     */
    setCurrentNode(nodeId) {
        const node = this.allNodes.find(n => n.id === nodeId);

        if (!node) {
            return {
                success: false,
                reason: 'node_not_found'
            };
        }

        // Clear previous current node
        if (this.currentNodeId) {
            const prevNode = this.allNodes.find(n => n.id === this.currentNodeId);
            if (prevNode) {
                prevNode.isSelected = false;
            }
        }

        this.currentNodeId = nodeId;
        node.isSelected = true;
        this.pathHistory.push(nodeId);

        console.log(`[Pathfinder] Current node set to: ${nodeId} (floor ${node.floor})`);

        return {
            success: true,
            nodeId,
            floor: node.floor,
            pathLength: this.pathHistory.length
        };
    }

    /**
     * Gets the current path (nodes visited)
     *
     * @returns {Array<MapNode>} Array of nodes in path order
     */
    getCurrentPath() {
        return this.pathHistory.map(id => this.allNodes.find(n => n.id === id)).filter(n => n);
    }

    /**
     * Gets the current floor
     *
     * @returns {number} Current floor number
     */
    getCurrentFloor() {
        if (!this.currentNodeId) return 0;

        const node = this.allNodes.find(n => n.id === this.currentNodeId);
        return node?.floor ?? 0;
    }

    /**
     * Gets the current node
     *
     * @returns {MapNode|null} Current node
     */
    getCurrentNode() {
        if (!this.currentNodeId) return null;
        return this.allNodes.find(n => n.id === this.currentNodeId) || null;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Reachability Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Updates reachability for all nodes
     *
     * @param {number} currentNodeId - Current node ID
     * @returns {Array<number>} Array of reachable node IDs
     */
    updateReachability(currentNodeId) {
        // Reset all reachability
        for (const node of this.allNodes) {
            node.setReachable(false);
        }

        // Get valid moves and mark as reachable
        const validMoves = this.getValidMoves(currentNodeId);

        console.log(`[Pathfinder] Reachability updated: ${validMoves.length} reachable nodes`);

        return validMoves;
    }

    /**
     * Highlights reachable nodes
     *
     * @param {number} currentNodeId - Current node ID
     */
    highlightReachableNodes(currentNodeId) {
        const reachable = this.updateReachability(currentNodeId);

        for (const nodeId of reachable) {
            const node = this.allNodes.find(n => n.id === nodeId);
            if (node) {
                node.isReachable = true;
            }
        }
    }

    /**
     * Clears all reachability highlights
     */
    clearReachability() {
        for (const node of this.allNodes) {
            node.setReachable(false);
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Statistics Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Gets path statistics
     *
     * @returns {Object} Path statistics
     */
    getPathStats() {
        const path = this.getCurrentPath();
        const floors = path.map(n => n.floor);

        return {
            totalNodesVisited: path.length,
            currentFloor: this.getCurrentFloor(),
            path: path.map(n => ({
                id: n.id,
                type: n.type,
                floor: n.floor
            }))
        };
    }

    /**
     * Resets the pathfinder
     *
     * @returns {Object} Reset result
     */
    reset() {
        this.pathHistory = [];
        this.currentNodeId = null;
        this.clearReachability();

        console.log('[Pathfinder] Reset complete');

        return { success: true };
    }
}

export default Pathfinder;
