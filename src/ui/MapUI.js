/**
 * MapUI Module for Emoji Card Battle
 *
 * Canvas-based rendering for the campaign map.
 * Displays nodes, paths, and handles player interaction.
 *
 * @module ui/MapUI
 */

import { NodeType, NodeColor, NodeIcon } from '../map/MapNode.js';

/**
 * MapUI Class
 *
 * Renders the map on canvas and handles click interaction.
 *
 * @example
 * const mapUI = new MapUI('map-canvas');
 * mapUI.renderMap(nodes, currentNodeId);
 * mapUI.onNodeClick = (nodeId) => handleMove(nodeId);
 */
export class MapUI {
    /**
     * Creates a new MapUI instance
     *
     * @param {string} canvasId - Canvas element ID
     */
    constructor(canvasId = 'map-canvas') {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas?.getContext('2d');

        // Canvas dimensions
        this.width = 800;
        this.height = 650;

        // Node rendering
        this.nodeRadius = 20;
        this.floorHeight = 40;

        // Current state
        this.nodes = [];
        this.currentNodeId = null;
        this.validMoves = [];

        // Callbacks
        this.onNodeClick = null;

        if (this.canvas) {
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            console.log('[MapUI] Initialized');
        }
    }

    /**
     * Renders the complete map
     *
     * @param {Array<MapNode>} nodes - All nodes to render
     * @param {number} currentNodeId - Current player position
     * @param {Array<number>} validMoves - Valid move node IDs
     */
    renderMap(nodes, currentNodeId, validMoves = []) {
        if (!this.ctx) return;

        this.nodes = nodes;
        this.currentNodeId = currentNodeId;
        this.validMoves = validMoves;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw background
        this._drawBackground();

        // Draw connections first (behind nodes)
        this._drawConnections();

        // Draw nodes
        for (const node of nodes) {
            this._drawNode(node);
        }

        // Draw floor labels
        this._drawFloorLabels();

        console.log('[MapUI] Map rendered');
    }

    /**
     * Draws the background
     *
     * @private
     */
    _drawBackground() {
        // Dark background
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Floor lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        for (let floor = 0; floor <= 16; floor++) {
            const y = 50 + floor * this.floorHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Draws connections between nodes
     *
     * @private
     */
    _drawConnections() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;

        for (const node of this.nodes) {
            for (const connectedId of node.connections) {
                const target = this.nodes.find(n => n.id === connectedId);
                if (target) {
                    this._drawPath(node, target);
                }
            }
        }
    }

    /**
     * Draws a path between two nodes
     *
     * @private
     * @param {MapNode} from - Starting node
     * @param {MapNode} to - Target node
     */
    _drawPath(from, to) {
        const fromY = 50 + from.floor * this.floorHeight;
        const toY = 50 + to.floor * this.floorHeight;

        this.ctx.beginPath();
        this.ctx.moveTo(from.x, fromY);

        // Curved path
        const controlY = (fromY + toY) / 2;
        this.ctx.quadraticCurveTo(from.x, controlY, to.x, toY);

        this.ctx.stroke();
    }

    /**
     * Draws a single node
     *
     * @private
     * @param {MapNode} node - Node to draw
     */
    _drawNode(node) {
        const y = 50 + node.floor * this.floorHeight;
        const isCurrent = node.id === this.currentNodeId;
        const isValidMove = this.validMoves.includes(node.id);
        const isVisited = node.visited;

        // Node color based on type
        const baseColor = NodeColor[node.type] || '#ffffff';

        // Draw node circle
        this.ctx.beginPath();
        this.ctx.arc(node.x, y, this.nodeRadius, 0, Math.PI * 2);

        // Fill based on state
        if (isCurrent) {
            this.ctx.fillStyle = '#ffd700'; // Gold for current
        } else if (isValidMove) {
            this.ctx.fillStyle = baseColor;
            this.ctx.globalAlpha = 1.0;
        } else if (isVisited) {
            this.ctx.fillStyle = '#4a4a6a'; // Dimmed for visited
        } else {
            this.ctx.fillStyle = baseColor;
            this.ctx.globalAlpha = 0.7;
        }

        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = isValidMove ? '#ffffff' : '#3a3a5a';
        this.ctx.lineWidth = isValidMove ? 3 : 2;
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;

        // Draw icon
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(NodeIcon[node.type] || '❓', node.x, y);

        // Draw floor number below node
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#888';
        this.ctx.fillText(`F${node.floor}`, node.x, y + this.nodeRadius + 12);
    }

    /**
     * Draws floor labels
     *
     * @private
     */
    _drawFloorLabels() {
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'left';

        for (let floor = 0; floor <= 16; floor++) {
            const y = 50 + floor * this.floorHeight;
            const label = floor === 0 ? 'START' : floor === 15 ? 'BOSS' : `F${floor}`;
            this.ctx.fillText(label, 10, y + 4);
        }
    }

    /**
     * Handles canvas click
     *
     * @param {Event} event - Click event
     * @returns {number|null} Clicked node ID or null
     */
    handleClick(event) {
        if (!this.canvas) return null;

        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // Check each node
        for (const node of this.nodes) {
            const y = 50 + node.floor * this.floorHeight;
            const dx = clickX - node.x;
            const dy = clickY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.nodeRadius) {
                console.log(`[MapUI] Node clicked: ${node.id}`);

                if (this.onNodeClick) {
                    this.onNodeClick(node.id);
                }

                return node.id;
            }
        }

        return null;
    }

    /**
     * Animates node selection
     *
     * @param {number} nodeId - Node to animate
     */
    animateNodeSelect(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;

        let scale = 1;
        let growing = true;
        let frames = 0;

        const animate = () => {
            if (frames >= 20) return;

            // Simple pulse animation
            if (growing) {
                scale += 0.05;
                if (scale >= 1.3) growing = false;
            } else {
                scale -= 0.05;
            }

            this.renderMap(this.nodes, this.currentNodeId, this.validMoves);

            // Redraw selected node with animation
            const y = 50 + node.floor * this.floorHeight;
            this.ctx.beginPath();
            this.ctx.arc(node.x, y, this.nodeRadius * scale, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            frames++;
            requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Clears the map display
     */
    clear() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
        this.nodes = [];
        this.currentNodeId = null;
        this.validMoves = [];
    }

    /**
     * Destroys the MapUI
     */
    destroy() {
        this.clear();
        this.canvas = null;
        this.ctx = null;
    }
}

export default MapUI;
