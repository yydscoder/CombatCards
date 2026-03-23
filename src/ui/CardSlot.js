/**
 * CardSlot Component for Emoji Card Battle
 *
 * This module implements individual card slots within the hand.
 * Each slot can hold a card and handles:
 * - Click-to-move selection
 * - Drag-and-drop functionality
 * - Visual highlighting on hover/drag-over
 * - Card swapping between slots
 *
 * Patch Notes v0.1.6: + Hand UI rendered. + Card selection logic. + Click-to-move.
 */

/**
 * CardSlot class - Manages individual card slot behavior
 *
 * Handles all interactions for a single card slot including:
 * - Rendering the slot container
 * - Managing drag start/drop events
 * - Handling click-to-move selection
 * - Visual feedback for interactions
 */
export class CardSlot {
    /**
     * Creates a new CardSlot instance
     * @param {number} index - The slot's index in the hand
     * @param {Object} handUI - Reference to the parent HandUI instance
     * @param {HTMLElement} container - The container element for this slot
     */
    constructor(index, handUI, container = null) {
        this.index = index;
        this.handUI = handUI;
        this.card = null;
        this.container = container;
        this.element = null;
        this.isSelected = false;
        this.isDragOver = false;

        // Create slot element if container provided
        if (container) {
            this.createSlotElement();
        }
    }

    /**
     * Creates the slot DOM element
     */
    createSlotElement() {
        const slot = document.createElement('div');
        slot.className = 'card-slot';
        slot.dataset.slotIndex = this.index;

        // Enable drag and drop
        slot.draggable = false; // Slots themselves aren't draggable, cards are

        // Event listeners for click-to-move
        slot.addEventListener('click', (e) => this.handleSlotClick(e));

        // Event listeners for drag-and-drop
        slot.addEventListener('dragover', (e) => this.handleDragOver(e));
        slot.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        slot.addEventListener('drop', (e) => this.handleDrop(e));

        this.element = slot;
        this.container.appendChild(slot);

        return slot;
    }

    /**
     * Sets the card in this slot
     * @param {Object} card - The card to place in this slot
     */
    setCard(card) {
        this.card = card;

        if (this.element) {
            // Clear existing content
            this.element.innerHTML = '';

            if (card) {
                // Render the card element
                const cardElement = this.handUI.createCardElement(card);
                cardElement.draggable = true;
                cardElement.dataset.slotIndex = this.index;

                // Add drag event listeners to card
                cardElement.addEventListener('dragstart', (e) => this.handleDragStart(e, card));
                cardElement.addEventListener('dragend', (e) => this.handleDragEnd(e));

                this.element.appendChild(cardElement);

                // Add has-card class for browser compatibility ( :has() fallback)
                this.element.classList.add('has-card');
            } else {
                // Remove has-card class when slot is empty
                this.element.classList.remove('has-card');
            }
        }
    }

    /**
     * Clears the card from this slot
     */
    clearCard() {
        this.card = null;
        this.isSelected = false;

        if (this.element) {
            this.element.innerHTML = '';
            this.element.classList.remove('slot-selected', 'slot-drag-over', 'has-card');
        }
    }

    /**
     * Handles slot click for click-to-move functionality
     * @param {Event} event - The click event
     */
    handleSlotClick(event) {
        event.stopPropagation();

        const clickedCard = this.card;
        const selectedSlot = this.handUI.getSelectedSlot();

        // If a slot is already selected, try to swap
        if (selectedSlot && selectedSlot !== this) {
            this.handUI.swapCards(selectedSlot, this);
            this.handUI.clearSelection();
        }
        // If clicking on a card, select it for moving
        else if (clickedCard) {
            this.handUI.selectSlot(this);
        }
    }

    /**
     * Handles drag start event
     * @param {Event} event - The dragstart event
     * @param {Object} card - The card being dragged
     */
    handleDragStart(event, card) {
        // Store drag data
        event.dataTransfer.setData('text/plain', JSON.stringify({
            cardId: card.id,
            sourceIndex: this.index
        }));

        // Set drag effect
        event.dataTransfer.effectAllowed = 'move';

        // Add visual feedback
        setTimeout(() => {
            if (this.element) {
                this.element.classList.add('slot-dragging');
            }
        }, 0);

        console.log(`[CardSlot] Drag started: ${card.name} from slot ${this.index}`);
    }

    /**
     * Handles drag end event
     * @param {Event} event - The dragend event
     */
    handleDragEnd(event) {
        // Remove visual feedback
        if (this.element) {
            this.element.classList.remove('slot-dragging');
        }

        // Clear drag-over state from all slots
        this.handUI.clearAllDragOverStates();

        console.log(`[CardSlot] Drag ended`);
    }

    /**
     * Handles drag over event (allows drop)
     * @param {Event} event - The dragover event
     */
    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        if (!this.isDragOver) {
            this.isDragOver = true;
            if (this.element) {
                this.element.classList.add('slot-drag-over');
            }
        }
    }

    /**
     * Handles drag leave event
     * @param {Event} event - The dragleave event
     */
    handleDragLeave(event) {
        this.isDragOver = false;
        if (this.element) {
            this.element.classList.remove('slot-drag-over');
        }
    }

    /**
     * Handles drop event
     * @param {Event} event - The drop event
     */
    handleDrop(event) {
        event.preventDefault();
        this.isDragOver = false;

        if (this.element) {
            this.element.classList.remove('slot-drag-over');
        }

        // Parse drag data
        const data = event.dataTransfer.getData('text/plain');
        if (!data) return;

        try {
            const dragData = JSON.parse(data);
            const sourceSlot = this.handUI.getSlotByIndex(dragData.sourceIndex);

            // Swap cards if source slot exists and is different
            if (sourceSlot && sourceSlot !== this) {
                this.handUI.swapCards(sourceSlot, this);
                console.log(`[CardSlot] Cards swapped: slot ${dragData.sourceIndex} ↔ slot ${this.index}`);
            }
        } catch (e) {
            console.error('[CardSlot] Error parsing drag data:', e);
        }
    }

    /**
     * Sets the selected state of this slot
     * @param {boolean} selected - Whether the slot is selected
     */
    setSelected(selected) {
        this.isSelected = selected;

        if (this.element) {
            if (selected) {
                this.element.classList.add('slot-selected');
            } else {
                this.element.classList.remove('slot-selected');
            }
        }
    }

    /**
     * Gets the card element in this slot
     * @returns {HTMLElement|null} The card element or null
     */
    getCardElement() {
        if (this.element) {
            return this.element.querySelector('.card');
        }
        return null;
    }

    /**
     * Destroys the slot and cleans up
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.card = null;
        this.container = null;
        this.handUI = null;
    }
}

/**
 * Creates a card slot factory for easy slot creation
 * @param {Object} handUI - Reference to the parent HandUI instance
 * @returns {Object} Factory object with creation methods
 */
export function createCardSlotFactory(handUI) {
    return {
        /**
         * Creates a new card slot
         * @param {number} index - The slot index
         * @param {HTMLElement} container - The container element
         * @returns {CardSlot} The created card slot
         */
        create(index, container) {
            return new CardSlot(index, handUI, container);
        },

        /**
         * Creates multiple card slots
         * @param {number} count - Number of slots to create
         * @param {HTMLElement} container - The container element
         * @returns {CardSlot[]} Array of created card slots
         */
        createMultiple(count, container) {
            const slots = [];
            for (let i = 0; i < count; i++) {
                slots.push(this.create(i, container));
            }
            return slots;
        }
    };
}
