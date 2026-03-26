/**
 * HandUI Module for Emoji Card Battle
 *
 * This module manages the visual rendering and interaction of the player's hand.
 * It handles:
 * - Rendering cards directly in the hand container (no slot abstraction)
 * - Click-to-play card functionality
 * - Drag-and-drop card targeting
 * - Visual feedback for playable/unplayable states
 * - Arc fan positioning using HandLayout
 */

// Import HandLayout for STS-style positioning
import { HandLayout } from './HandLayout.js';

/**
 * HandUI class - Manages hand rendering and interactions
 *
 * Handles all visual aspects of the player's hand including:
 * - Creating and managing card elements directly
 * - Rendering cards with proper arc fan positioning
 * - Handling click and drag interactions
 * - Providing visual feedback
 */
export class HandUI {
    /**
     * Creates a new HandUI instance
     * @param {Object} gameState - Reference to the game state object
     * @param {Object} hand - Reference to the Hand logic instance
     * @param {Object} hud - Reference to the HUD instance for feedback
     * @param {HandLayout} handLayout - Optional shared HandLayout instance
     */
    constructor(gameState, hand, hud, handLayout = null) {
        this.gameState = gameState;
        this.hand = hand;
        this.hud = hud;

        // Get the hand container element
        this.handContainer = document.getElementById('hand');

        // Card element cache for quick lookups
        this.cardElements = new Map();

        // Track hovered card index for arc positioning
        this.hoveredIndex = -1;

        // Drag state for targeting
        this.draggedCard = null;

        // Use provided handLayout or get from hand/gameState
        this.handLayout = handLayout;
        if (!this.handLayout) {
            if (hand && hand.handLayout) {
                this.handLayout = hand.handLayout;
                console.log('[HandUI] Got handLayout from hand instance');
            } else if (gameState && gameState.handLayout) {
                this.handLayout = gameState.handLayout;
                console.log('[HandUI] Got handLayout from gameState');
            }
        }
        if (!this.handLayout) {
            // Create fallback instance (should not happen if Hand passes layout)
            this.handLayout = new HandLayout({
                arcRadius: 300,
                arcAngle: 40,
                hoverLift: 50,
                hoverScale: 1.2,
                neighborPush: 30,
                cardWidth: 100,
                cardHeight: 140
            });
            console.log('[HandUI] Created fallback handLayout instance');
        }

        // Initialize the hand UI
        this.init();
    }

    /**
     * Initializes the hand UI
     */
    init() {
        if (!this.handContainer) {
            console.error('[HandUI] Hand container not found!');
            return;
        }

        // Clear existing content
        this.handContainer.innerHTML = '';

        console.log('[HandUI] Initialized');
    }

    /**
     * Creates a card DOM element
     * @param {Object} card - The card to create an element for
     * @returns {HTMLElement} The card element
     */
    createCardElement(card) {
        // Ensure card is marked as in hand
        card.isInHand = true;

        // Create card element
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.cardId = card.id;
        cardElement.dataset.cardName = card.name;
        cardElement.dataset.cardType = card.constructor.name;

        // Add element type for theme styling
        if (card.element) {
            cardElement.dataset.element = card.element;
        }

        // Make card draggable for targeting
        cardElement.draggable = true;

        // Create card content
        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';

        // Create mana cost badge
        const manaBadge = document.createElement('div');
        manaBadge.className = 'card-mana-cost';
        manaBadge.textContent = card.cost;
        manaBadge.title = `${card.cost} Energy`;

        // Create emoji element
        const emojiElement = document.createElement('div');
        emojiElement.className = 'card-emoji';
        emojiElement.textContent = card.emoji;

        // Create name element
        const nameElement = document.createElement('div');
        nameElement.className = 'card-name';
        nameElement.textContent = card.name;

        // Create stats element
        const statsElement = document.createElement('div');
        statsElement.className = 'card-stats';
        statsElement.textContent = card.getStatsString();

        // Assemble card content
        cardContent.appendChild(manaBadge);
        cardContent.appendChild(emojiElement);
        cardContent.appendChild(nameElement);
        cardContent.appendChild(statsElement);
        cardElement.appendChild(cardContent);

        // Add click event for playing the card
        cardElement.addEventListener('click', (e) => this.handleCardClick(card, e));

        // Add hover events for arc positioning
        cardElement.addEventListener('mouseenter', () => {
            const cards = this.hand?.cards || [];
            const index = cards.findIndex(c => c.id === card.id);
            this.hoveredIndex = index;
            this.updateHandPositions();
        });
        cardElement.addEventListener('mouseleave', () => {
            this.hoveredIndex = -1;
            this.updateHandPositions();
        });

        // Add drag events for targeting
        cardElement.addEventListener('dragstart', (e) => this.handleDragStart(card, e));
        cardElement.addEventListener('dragend', (e) => this.handleDragEnd(card, e));

        // Store in cache
        this.cardElements.set(card.id, cardElement);

        // Update visual state
        this.updateCardVisual(cardElement, card);

        return cardElement;
    }

    /**
     * Updates a card's visual state
     * @param {HTMLElement} cardElement - The card element to update
     * @param {Object} card - The card object
     */
    updateCardVisual(cardElement, card) {
        if (!cardElement) return;

        // Check if card can be played
        const canPlay = card.canPlay && card.canPlay(this.gameState);

        if (canPlay) {
            cardElement.classList.add('playable');
            cardElement.classList.remove('unplayable');
        } else {
            cardElement.classList.add('unplayable');
            cardElement.classList.remove('playable');
        }
    }

    /**
     * Renders all cards in the hand with arc fan positioning
     * @param {Object[]} cards - Array of cards to render
     */
    renderHand(cards) {
        // Clear container
        if (this.handContainer) {
            this.handContainer.innerHTML = '';
        }

        // Clear cache
        this.cardElements.clear();
        this.hoveredIndex = -1;

        // Render each card directly into container
        cards.forEach((card, index) => {
            if (!this.handContainer) return;

            const cardElement = this.createCardElement(card);
            this.handContainer.appendChild(cardElement);
            this.cardElements.set(card.id, cardElement);
        });

        // Initial positioning
        this.updateHandPositions();

        console.log(`[HandUI] Hand rendered with ${cards.length} cards`);
    }

    /**
     * Updates all card positions based on hover state
     */
    updateHandPositions() {
        if (!this.handLayout || !this.handContainer) return;

        const cards = this.hand?.cards || [];
        const containerWidth = this.handContainer.offsetWidth || 800;

        const transforms = this.handLayout.calculateCardPositions(
            cards.length,
            containerWidth,
            this.hoveredIndex
        );

        cards.forEach((card, index) => {
            const cardEl = this.cardElements.get(card.id);
            if (cardEl && transforms[index]) {
                this.handLayout.applyTransform(cardEl, transforms[index]);
            }
        });
    }

    /**
     * Refreshes all card visuals (e.g., after mana change)
     */
    refreshAllCardVisuals() {
        this.cardElements.forEach((cardElement, cardId) => {
            // Find the card object
            const card = this.hand?.cards?.find(c => c.id === cardId);
            if (card) {
                this.updateCardVisual(cardElement, card);
            }
        });
    }

    /**
     * Handles card click for playing
     * @param {Object} card - The card that was clicked
     * @param {Event} event - The click event
     */
    handleCardClick(card, event) {
        event.preventDefault();
        event.stopPropagation();

        const energy = this.gameState.energy ?? 0;
        console.log(`[HandUI] Card clicked: ${card.name} (cost: ${card.cost}, energy: ${energy})`);

        // Check if card can be played
        const canPlay = card.canPlay && card.canPlay(this.gameState);

        if (!canPlay) {
            console.warn(`[HandUI] Cannot play ${card.name}: cost=${card.cost}, energy=${energy}`);
            this.addVisualFeedback(card, 'failure');
            return;
        }

        console.log(`[HandUI] Card is playable, passing to Hand...`);

        // Delegate to hand logic for actual card playing
        if (this.hand && this.hand.handleCardClick) {
            this.hand.handleCardClick(card, event);
        }
    }

    /**
     * Adds visual feedback to a card
     * @param {Object} card - The card
     * @param {string} type - Feedback type ('success' or 'failure')
     */
    addVisualFeedback(card, type) {
        const cardElement = this.cardElements.get(card.id);

        if (!cardElement) return;

        // Remove existing feedback classes
        cardElement.classList.remove('feedback-success', 'feedback-failure');

        // Force reflow to restart animation
        void cardElement.offsetWidth;

        // Add feedback class
        if (type === 'success') {
            cardElement.classList.add('feedback-success');
        } else {
            cardElement.classList.add('feedback-failure');
        }

        // Remove after animation
        setTimeout(() => {
            cardElement.classList.remove('feedback-success', 'feedback-failure');
        }, 500);
    }

    /**
     * Removes a card from the hand UI
     * @param {Object} card - The card to remove
     */
    removeCard(card) {
        const cardElement = this.cardElements.get(card.id);

        if (cardElement) {
            cardElement.remove();
            this.cardElements.delete(card.id);
            console.log(`[HandUI] Card removed: ${card.name}`);

            // Update positions after removal
            this.updateHandPositions();
        }
    }

    /**
     * Handles drag start for card targeting
     * @param {Object} card - The card being dragged
     * @param {Event} event - The dragstart event
     */
    handleDragStart(card, event) {
        // Check if card can be played
        if (!card.canPlay(this.gameState)) {
            if (event.preventDefault) event.preventDefault();
            return;
        }

        // Store dragged card info
        this.draggedCard = card;
        event.dataTransfer.setData('text/plain', JSON.stringify({ cardId: card.id }));
        event.dataTransfer.effectAllowed = 'copy';

        // Set drag image using the actual card element if available
        const cardElement = this.cardElements.get(card.id);
        if (cardElement) {
            const dragImage = cardElement.cloneNode(true);
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            dragImage.style.left = '-1000px';
            document.body.appendChild(dragImage);
            event.dataTransfer.setDragImage(dragImage, 50, 75);
            setTimeout(() => {
                if (document.body.contains(dragImage)) {
                    document.body.removeChild(dragImage);
                }
            }, 0);
        }

        console.log(`[HandUI] Drag started: ${card.name}`);
    }

    /**
     * Handles drag end
     * @param {Object} card - The card
     * @param {Event} event - The dragend event
     */
    handleDragEnd(card, event) {
        const pendingCard = this.draggedCard;

        // Clear drop zone highlights
        const enemyArea = document.getElementById('enemy-area');
        const playerArea = document.getElementById('player-area');
        if (enemyArea) enemyArea.classList.remove('drop-target');
        if (playerArea) playerArea.classList.remove('drop-target');

        // Handle drop on target if applicable
        if (pendingCard && window.__dropTarget) {
            console.log(`[HandUI] Drag ended over ${window.__dropTarget}, applying card`);
            this.handleDropOnTarget(pendingCard, window.__dropTarget);
        }

        // Clear dragged card reference
        this.draggedCard = null;
        window.__dropTarget = null;

        console.log(`[HandUI] Drag ended: ${card.name}`);
    }

    /**
     * Handles drop on target
     * @param {Object} card - The card
     * @param {string} targetType - 'enemy' or 'player'
     */
    handleDropOnTarget(card, targetType) {
        if (!card) return;

        console.log(`[HandUI] Card dropped on ${targetType}: ${card.name}`);

        // Play the card with the target
        this.handleCardClick(card, { preventDefault: () => {}, stopPropagation: () => {} }, targetType);
    }

    /**
     * Destroys the hand UI and cleans up
     */
    destroy() {
        if (this.handContainer) {
            this.handContainer.innerHTML = '';
        }
        this.cardElements.clear();
        this.draggedCard = null;
        this.hoveredIndex = -1;
        this.handContainer = null;
    }
}

/**
 * Initializes the HandUI instance
 * @param {Object} gameState - The game state object
 * @param {Object} hand - The hand logic instance
 * @param {Object} hud - The HUD instance
 * @returns {HandUI} The initialized HandUI instance
 */
export function initializeHandUI(gameState, hand, hud) {
    return new HandUI(gameState, hand, hud);
}
