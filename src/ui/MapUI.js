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

        // Canvas dimensions - updated for smaller panel
        this.width = 400;
        this.height = 600;

        // Node rendering
        this.nodeRadius = 16;
        this.floorHeight = 38;

        // Current state
        this.nodes = [];
        this.currentNodeId = null;
        this.validMoves = [];
        this.hoveredNodeId = null;
        this.selectedNodeId = null;

        // Mouse tracking for hover
        this.mouseX = 0;
        this.mouseY = 0;

        // Callbacks
        this.onNodeClick = null;
        this.onNodeHover = null;

        if (this.canvas) {
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            
            // Add mouse tracking
            this.canvas.addEventListener('mousemove', (e) => this._handleMouseMove(e));
            this.canvas.addEventListener('mouseleave', () => this._handleMouseLeave());
            this.canvas.addEventListener('click', (e) => this.handleClick(e));
            
            console.log('[MapUI] Initialized');
        }
    }

    /**
     * Handles mouse move for hover detection
     * @private
     */
    _handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        // Find hovered node
        const hoveredNode = this._getNodeAtPosition(this.mouseX, this.mouseY);
        
        if (hoveredNode?.id !== this.hoveredNodeId) {
            this.hoveredNodeId = hoveredNode?.id || null;
            this.canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
            
            // Re-render to show hover effect
            this.renderMap(this.nodes, this.currentNodeId, this.validMoves);
            
            // Trigger hover callback
            if (this.onNodeHover) {
                this.onNodeHover(hoveredNode);
            }
        }
    }

    /**
     * Handles mouse leave
     * @private
     */
    _handleMouseLeave() {
        this.hoveredNodeId = null;
        this.renderMap(this.nodes, this.currentNodeId, this.validMoves);
        
        if (this.onNodeHover) {
            this.onNodeHover(null);
        }
    }

    /**
     * Gets node at mouse position
     * @private
     */
    _getNodeAtPosition(x, y) {
        for (const node of this.nodes) {
            const nodeX = this._getNodeX(node);
            const nodeY = this._getNodeY(node);
            const dist = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
            if (dist <= this.nodeRadius) {
                return node;
            }
        }
        return null;
    }

    /**
     * Calculates node X position based on index
     * @private
     */
    _getNodeX(node) {
        const floorNodes = this.nodes.filter(n => n.floor === node.floor);
        const index = floorNodes.indexOf(node);
        const totalWidth = (floorNodes.length - 1) * 60;
        const startX = (this.width - totalWidth) / 2;
        return startX + index * 60;
    }

    /**
     * Calculates node Y position based on floor
     * @private
     */
    _getNodeY(node) {
        return this.height - 40 - (node.floor * this.floorHeight);
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
        const x = this._getNodeX(node);
        const y = this._getNodeY(node);
        const isCurrent = node.id === this.currentNodeId;
        const isValidMove = this.validMoves.includes(node.id);
        const isHovered = node.id === this.hoveredNodeId;
        const isSelected = node.id === this.selectedNodeId;
        const isVisited = node.visited;

        // Node color based on type
        const baseColor = NodeColor[node.type] || '#ffffff';

        // Draw hover/selection glow
        if (isHovered || isSelected) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.nodeRadius + 4, 0, Math.PI * 2);
            this.ctx.fillStyle = isHovered ? 'rgba(76, 175, 80, 0.4)' : 'rgba(255, 215, 0, 0.4)';
            this.ctx.fill();
        }

        // Draw valid move indicator
        if (isValidMove && !isCurrent) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.nodeRadius + 3, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#4caf50';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // Draw node circle
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.nodeRadius, 0, Math.PI * 2);

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
            const nodeX = this._getNodeX(node);
            const nodeY = this._getNodeY(node);
            const dx = clickX - nodeX;
            const dy = clickY - nodeY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.nodeRadius) {
                console.log(`[MapUI] Node clicked: ${node.id} (${node.type})`);
                
                // Only allow clicking valid moves
                if (this.validMoves.includes(node.id)) {
                    this.selectedNodeId = node.id;
                    
                    if (this.onNodeClick) {
                        this.onNodeClick(node.id, node);
                    }
                } else if (node.id !== this.currentNodeId) {
                    console.log('[MapUI] Node not reachable');
                }

                return node.id;
            }
        }

        return null;
    }

    /**
     * Gets tooltip info for hovered node
     * @param {MapNode} node - Node to get info for
     * @returns {Object} Tooltip data
     */
    getNodeTooltip(node) {
        if (!node) return null;
        
        const isCurrent = node.id === this.currentNodeId;
        const isValidMove = this.validMoves.includes(node.id);
        
        return {
            title: `${NodeIcon[node.type]} ${node.type.charAt(0).toUpperCase() + node.type.slice(1)}`,
            subtitle: `Floor ${node.floor}`,
            description: isCurrent ? 'Your current position' : isValidMove ? 'Click to select' : 'Not reachable',
            canSelect: isValidMove
        };
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
