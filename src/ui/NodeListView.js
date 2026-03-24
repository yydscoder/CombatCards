/**
 * NodeListView - Vertical floor list for map navigation
 * Renders nodes as clickable buttons in a scrollable list
 */

import { NodeType, NodeIcon } from '../map/MapNode.js';

export class NodeListView {
    /**
     * Creates a new NodeListView instance
     * @param {string} containerId - Container element ID
     */
    constructor(containerId = 'modal-node-list') {
        this.container = document.getElementById(containerId);
        this.nodes = [];
        this.currentNodeId = null;
        this.validMoves = [];
        this.onNodeClick = null;
        
        if (this.container) {
            console.log('[NodeListView] Initialized');
        }
    }

    /**
     * Renders the node list
     * @param {Array<MapNode>} nodes - All nodes
     * @param {number} currentNodeId - Current player position
     * @param {Array<number>} validMoves - Valid move node IDs
     */
    render(nodes, currentNodeId, validMoves = []) {
        if (!this.container) {
            console.error('[NodeListView] Container not found!');
            return;
        }

        this.nodes = nodes;
        this.currentNodeId = currentNodeId;
        this.validMoves = validMoves;

        console.log('[NodeListView] Rendering:', nodes.length, 'nodes, current:', currentNodeId, 'validMoves:', validMoves);

        // Clear container
        this.container.innerHTML = '';

        if (!nodes || nodes.length === 0) {
            console.warn('[NodeListView] No nodes to render!');
            this.container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">No nodes available</p>';
            return;
        }

        // Sort nodes by floor
        const sortedNodes = [...nodes].sort((a, b) => a.floor - b.floor);

        let validMoveCount = 0;
        
        // Create button for each node
        for (const node of sortedNodes) {
            const button = this._createNodeButton(node);
            this.container.appendChild(button);
            if (validMoves.includes(node.id)) validMoveCount++;
        }

        console.log('[NodeListView] Rendered', sortedNodes.length, 'nodes,', validMoveCount, 'valid moves');
    }

    /**
     * Creates a node button element
     * @private
     */
    _createNodeButton(node) {
        const button = document.createElement('button');
        button.className = 'node-button';
        button.disabled = true; // Disabled by default

        const isCurrent = node.id === this.currentNodeId;
        const isValidMove = this.validMoves.includes(node.id);

        // Add state classes
        if (isCurrent) button.classList.add('current');
        if (isValidMove) {
            button.classList.add('valid-move');
            button.disabled = false;
        }

        // Node label
        const label = node.floor === 0 ? 'START' : 
                      node.floor === 15 ? 'BOSS' : `F${node.floor}`;

        button.innerHTML = `
            <span class="node-icon">${NodeIcon[node.type] || '❓'}</span>
            <span class="node-label">${label}</span>
        `;

        // Click handler
        if (!button.disabled) {
            button.addEventListener('click', () => {
                if (this.onNodeClick) {
                    this.onNodeClick(node.id, node);
                }
            });
        }

        return button;
    }

    /**
     * Updates button states after selection
     * @param {number} selectedNodeId - Selected node ID
     */
    updateSelection(selectedNodeId) {
        const buttons = this.container.querySelectorAll('.node-button');
        buttons.forEach(btn => {
            btn.classList.remove('selected');
        });

        // Find and highlight selected button
        const selectedNode = this.nodes.find(n => n.id === selectedNodeId);
        if (selectedNode) {
            // Re-render to show selection
            this.render(this.nodes, this.currentNodeId, this.validMoves);
        }
    }

    /**
     * Scrolls to show current node
     */
    scrollToCurrent() {
        if (!this.container) {
            console.warn('[NodeListView] Container not ready for scrollToCurrent');
            return;
        }
        
        const currentButton = this.container.querySelector('.node-button.current');
        if (currentButton) {
            currentButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

export default NodeListView;
