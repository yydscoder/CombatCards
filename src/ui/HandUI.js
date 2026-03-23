/**
 * HandUI Module for Emoji Card Battle
 *
 * This module manages the visual rendering and interaction of the player's hand.
 * It handles:
 * - Rendering cards in slots at the bottom of the screen
 * - Click-to-play card functionality
 * - Click-to-move card reordering
 * - Drag-and-drop card management
 * - Visual feedback for playable/unplayable states
 *
 * Patch Notes v0.1.6: + Hand UI rendered. + Card selection logic. + Click-to-move.
 */

// Import CardSlot for slot management
import { CardSlot, createCardSlotFactory } from './CardSlot.js';

/**
 * HandUI class - Manages hand rendering and interactions
 *
 * Handles all visual aspects of the player's hand including:
 * - Creating and managing card slots
 * - Rendering cards with proper styling
 * - Handling click and drag interactions
 * - Managing card selection for reordering
 * - Providing visual feedback
 */
export class HandUI {
    /**
     * Creates a new HandUI instance
     * @param {Object} gameState - Reference to the game state object
     * @param {Object} hand - Reference to the Hand logic instance
     * @param {Object} hud - Reference to the HUD instance for feedback
     */
    constructor(gameState, hand, hud) {
        this.gameState = gameState;
        this.hand = hand;
        this.hud = hud;

        // Get the hand container element
        this.container = document.getElementById('hand');

        // Slot management
        this.slots = [];
        this.maxSlots = 5;

        // Selection state for click-to-move
        this.selectedSlot = null;

        // Drag state
        this.draggedCard = null;
        this.dragSourceIndex = null;

        // Card element cache
        this.cardElements = new Map();

        // Initialize the hand UI
        this.init();
    }

    /**
     * Initializes the hand UI
     */
    init() {
        if (!this.container) {
            console.error('[HandUI] Hand container not found!');
            return;
        }

        // Clear existing content
        this.container.innerHTML = '';

        // Create card slots
        this.createSlots();

        console.log('[HandUI] Initialized with', this.slots.length, 'slots');
    }

    /**
     * Creates card slots in the container
     */
    createSlots() {
        const slotFactory = createCardSlotFactory(this);

        for (let i = 0; i < this.maxSlots; i++) {
            const slot = slotFactory.create(i, this.container);
            this.slots.push(slot);
        }
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

        // Add click event for playing the card (fallback)
        cardElement.addEventListener('click', (e) => this.handleCardClick(card, e));

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
     * Renders a card in a specific slot
     * @param {Object} card - The card to render
     * @param {number} slotIndex - The slot index to render in
     */
    renderCardInSlot(card, slotIndex = -1) {
        // Find an empty slot or use the specified index
        let targetIndex = slotIndex;

        if (targetIndex < 0 || targetIndex >= this.slots.length) {
            // Find first empty slot
            targetIndex = this.slots.findIndex(slot => slot.card === null);

            if (targetIndex < 0) {
                // Hand is full, use last slot
                targetIndex = this.slots.length - 1;
            }
        }

        // Set the card in the slot
        const slot = this.slots[targetIndex];
        if (slot) {
            slot.setCard(card);
            console.log(`[HandUI] Card ${card.name} rendered in slot ${targetIndex}`);
        }
    }

    /**
     * Renders all cards in the hand
     * @param {Object[]} cards - Array of cards to render
     */
    renderHand(cards) {
        // Clear all slots first
        this.clearAllSlots();

        // Render each card in order
        cards.forEach((card, index) => {
            if (index < this.slots.length) {
                this.slots[index].setCard(card);
                this.cardElements.set(card.id, this.slots[index].getCardElement());
            }
        });

        console.log(`[HandUI] Hand rendered with ${cards.length} cards`);
    }

    /**
     * Refreshes all card visuals (e.g., after mana change)
     */
    refreshAllCardVisuals() {
        this.slots.forEach(slot => {
            if (slot.card) {
                const cardElement = slot.getCardElement();
                if (cardElement) {
                    this.updateCardVisual(cardElement, slot.card);
                }
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
        console.log(`[HandUI] Card state: isInHand=${card.isInHand}`);

        // Check if card can be played - Card.canPlay returns boolean
        const canPlay = card.canPlay && card.canPlay(this.gameState);
        console.log(`[HandUI] canPlay result:`, canPlay, typeof canPlay);

        if (!canPlay) {
            console.warn(`[HandUI] Cannot play ${card.name}: cost=${card.cost}, energy=${energy}, isInHand=${card.isInHand}`);
            this.addVisualFeedback(card, 'failure');
            return;
        }

        console.log(`[HandUI] Playing card: ${card.name}...`);

        // Delegate to hand logic for actual card playing
        if (this.hand && this.hand.handleCardClick) {
            this.hand.handleCardClick(card, event);
        } else {
            // Fallback: play card directly
            this.playCard(card);
        }
    }

    /**
     * Plays a card (delegates to hand logic)
     * @param {Object} card - The card to play
     */
    playCard(card) {
        if (!this.hand) {
            console.error('[HandUI] No hand logic instance available');
            return;
        }

        // Find the slot containing this card
        const slotIndex = this.slots.findIndex(s => s.card === card);

        if (slotIndex >= 0) {
            // Execute card effect
            const result = card.executeEffect(this.gameState, this.gameState.enemy);

            if (result && result.success) {
                // Deduct mana
                this.gameState.updatePlayerMana(this.gameState.playerMana - card.cost);

                // Update HUD
                if (this.hud) {
                    this.hud.updateAll();

                    // Show damage feedback if damage was dealt
                    if (result.damage > 0) {
                        this.hud.showDamageFeedback(result.damage, 'enemy', result.isCriticalHit);
                    }
                }

                // Visual feedback
                this.addVisualFeedback(card, 'success');

                // Remove card from slot
                this.slots[slotIndex].clearCard();
                this.cardElements.delete(card.id);

                // Update hand state
                card.isInHand = false;
                card.isDiscarded = true;

                console.log(`[HandUI] Card played: ${card.name}`);
            } else {
                this.addVisualFeedback(card, 'failure');
            }
        }
    }

    /**
     * Selects a slot for click-to-move
     * @param {CardSlot} slot - The slot to select
     */
    selectSlot(slot) {
        // Deselect previous slot
        if (this.selectedSlot && this.selectedSlot !== slot) {
            this.selectedSlot.setSelected(false);
        }

        // Toggle selection
        if (this.selectedSlot === slot) {
            this.selectedSlot = null;
            slot.setSelected(false);
            console.log('[HandUI] Selection cleared');
        } else {
            this.selectedSlot = slot;
            slot.setSelected(true);
            console.log(`[HandUI] Slot ${slot.index} selected`);
        }
    }

    /**
     * Clears the current selection
     */
    clearSelection() {
        if (this.selectedSlot) {
            this.selectedSlot.setSelected(false);
            this.selectedSlot = null;
            console.log('[HandUI] Selection cleared');
        }
    }

    /**
     * Gets the currently selected slot
     * @returns {CardSlot|null} The selected slot or null
     */
    getSelectedSlot() {
        return this.selectedSlot;
    }

    /**
     * Gets a slot by index
     * @param {number} index - The slot index
     * @returns {CardSlot|null} The slot or null
     */
    getSlotByIndex(index) {
        if (index >= 0 && index < this.slots.length) {
            return this.slots[index];
        }
        return null;
    }

    /**
     * Swaps cards between two slots
     * @param {CardSlot} slot1 - First slot
     * @param {CardSlot} slot2 - Second slot
     */
    swapCards(slot1, slot2) {
        if (!slot1 || !slot2 || slot1 === slot2) return;

        // Swap cards in slots
        const tempCard = slot1.card;
        slot1.setCard(slot2.card);
        slot2.setCard(tempCard);

        // Update card elements cache
        if (slot1.card) {
            this.cardElements.set(slot1.card.id, slot1.getCardElement());
        }
        if (slot2.card) {
            this.cardElements.set(slot2.card.id, slot2.getCardElement());
        }

        // Update hand array order if hand logic exists
        if (this.hand && this.hand.cards) {
            const index1 = this.hand.cards.indexOf(slot1.card || tempCard);
            const index2 = this.hand.cards.indexOf(slot2.card || tempCard);

            if (index1 >= 0 && index2 >= 0) {
                // Swap in hand array
                [this.hand.cards[index1], this.hand.cards[index2]] = 
                [this.hand.cards[index2], this.hand.cards[index1]];
            }
        }

        console.log(`[HandUI] Cards swapped between slots ${slot1.index} and ${slot2.index}`);
    }

    /**
     * Clears drag-over state from all slots
     */
    clearAllDragOverStates() {
        this.slots.forEach(slot => {
            slot.isDragOver = false;
            if (slot.element) {
                slot.element.classList.remove('slot-drag-over');
            }
        });
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
        const slotIndex = this.slots.findIndex(s => s.card === card);

        if (slotIndex >= 0) {
            this.slots[slotIndex].clearCard();
            this.cardElements.delete(card.id);
            console.log(`[HandUI] Card removed: ${card.name}`);
        }
    }

    /**
     * Clears all slots
     */
    clearAllSlots() {
        this.slots.forEach(slot => slot.clearCard());
        this.cardElements.clear();
        this.selectedSlot = null;
    }

    /**
     * Handles drag start for card targeting
     * @param {Object} card - The card being dragged
     * @param {Event} event - The dragstart event
     */
    handleDragStart(card, event) {
        // Check if card can be played
        if (!card.canPlay(this.gameState)) {
            event.preventDefault();
            return;
        }

        // Store dragged card info
        this.draggedCard = card;
        event.dataTransfer.setData('text/plain', card.id);
        event.dataTransfer.effectAllowed = 'copy';

        // Set drag image
        const dragImage = event.target.cloneNode(true);
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        event.dataTransfer.setDragImage(dragImage, 50, 75);
        setTimeout(() => document.body.removeChild(dragImage), 0);

        // Add visual feedback
        event.target.classList.add('card-dragging');

        console.log(`[HandUI] Drag started: ${card.name}`);
    }

    /**
     * Handles drag end
     * @param {Object} card - The card
     * @param {Event} event - The dragend event
     */
    handleDragEnd(card, event) {
        if (event.target) {
            event.target.classList.remove('card-dragging');
        }
        this.draggedCard = null;

        // Clear drop zone highlights
        const enemyArea = document.getElementById('enemy-area');
        const playerArea = document.getElementById('player-area');
        if (enemyArea) enemyArea.classList.remove('drop-target');
        if (playerArea) playerArea.classList.remove('drop-target');

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

        // Determine target
        let target;
        if (targetType === 'enemy') {
            target = this.gameState.enemy;
        } else if (targetType === 'player') {
            target = this.gameState;
        }

        if (!target) {
            console.warn('[HandUI] No valid target');
            return;
        }

        // Play the card
        this.handleCardClick(card, { preventDefault: () => {}, stopPropagation: () => {} });
    }

    /**
     * Destroys the hand UI and cleans up
     */
    destroy() {
        this.slots.forEach(slot => slot.destroy());
        this.slots = [];
        this.cardElements.clear();
        this.selectedSlot = null;
        this.container = null;
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
