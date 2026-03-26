import { HandLayout } from './HandLayout.js';
import { DOMHelper } from '../utils/DOMHelper.js';
import { debouncer } from '../utils/Debounce.js';

let handUiInstanceCounter = 0;

export class HandUI {
    constructor(gameState, hand, hud, handLayout = null) {
        this.gameState = gameState;
        this.hand = hand;
        this.hud = hud;

        this.handContainer = document.getElementById('hand');
        this.cardElements = new Map();
        this.hoveredIndex = -1;
        this.draggedCard = null;
        this.pendingRenderCards = null;

        this.lastCardCount = -1;
        this.lastContainerWidth = -1;
        this.lastContainerHeight = -1;
        this.recalcMetrics = {
            total: 0,
            reasons: {}
        };

        handUiInstanceCounter += 1;
        this.instanceId = handUiInstanceCounter;
        this.debounceKeys = {
            hover: `hand-hover-${this.instanceId}`,
            resize: `hand-resize-${this.instanceId}`,
            recalc: `hand-recalc-${this.instanceId}`
        };

        this.handLayout = handLayout || hand?.handLayout || gameState?.handLayout || new HandLayout({
            cardWidth: 112,
            cardHeight: 156,
            centerXRatio: 0.39
        });

        this.resizeObserver = null;
        this.windowResizeHandler = null;
        this.previewOverlay = null;
        this.previewCardId = null;
        this.keydownHandler = (event) => {
            if (event.key === 'Escape') {
                this.closeCardPreview();
            }
        };
        this.initialized = false;
        this.initPromise = this.init();
    }

    async init() {
        if (!this.handContainer) {
            console.error('[HandUI] Hand container not found!');
            return;
        }

        try {
            const rect = await DOMHelper.waitForLayout(this.handContainer, 2500);
            console.log(`[HandUI] Hand container: ${rect.width}px x ${rect.height}px`);
            console.log(`[HandUI] Hand container bounds: left=${rect.left}, top=${rect.top}, right=${rect.right}, bottom=${rect.bottom}`);
        } catch (error) {
            console.error('[HandUI] Container layout wait failed:', error);
            return;
        }

        this.logReferenceElements();

        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => {
                debouncer.execute(this.debounceKeys.resize, () => {
                    this.updateHandPositions(true, 'resize');
                }, 100);
            });
            this.resizeObserver.observe(this.handContainer);
        } else {
            this.windowResizeHandler = () => {
                this.scheduleRecalculation(true, 'window-resize');
            };
            window.addEventListener('resize', this.windowResizeHandler);
        }

        this.initialized = true;
        console.log('[HandUI] Initialized');

        if (this.pendingRenderCards) {
            const queuedCards = this.pendingRenderCards;
            this.pendingRenderCards = null;
            this.renderHand(queuedCards);
        }
    }

    logReferenceElements() {
        const elements = {
            'Draw pile': document.getElementById('draw-pile'),
            'Discard pile': document.getElementById('discard-pile'),
            'End Turn button': document.getElementById('end-turn-btn'),
            'Energy orb': document.getElementById('energy-orb')
        };

        for (const [name, element] of Object.entries(elements)) {
            if (!element) {
                console.log(`[HandUI] ${name}: NOT FOUND`);
                continue;
            }

            const rect = element.getBoundingClientRect();
            console.log(`[HandUI] ${name}: ${rect.width}x${rect.height} @ (${rect.left}, ${rect.top}) to (${rect.right}, ${rect.bottom})`);
        }

        const drawRect = elements['Draw pile']?.getBoundingClientRect();
        const discardRect = elements['Discard pile']?.getBoundingClientRect();
        const containerRect = this.handContainer.getBoundingClientRect();

        if (drawRect && discardRect) {
            const drawRightEdge = drawRect.right - containerRect.left;
            const discardLeftEdge = discardRect.left - containerRect.left;
            const midpoint = (drawRightEdge + discardLeftEdge) / 2;
            console.log(`[HandUI] Space between piles: ${drawRightEdge.toFixed(0)}px to ${discardLeftEdge.toFixed(0)}px (width: ${(discardLeftEdge - drawRightEdge).toFixed(0)}px)`);
            console.log(`[HandUI] Midpoint between piles: ${midpoint.toFixed(0)}px from left edge of hand container`);
        }
    }

    createCardElement(card) {
        card.isInHand = true;

        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.cardId = card.id;
        cardElement.dataset.cardName = card.name;
        cardElement.dataset.cardType = card.constructor.name;

        if (card.element) {
            cardElement.dataset.element = card.element;
        }

        cardElement.draggable = true;

        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';

        const manaBadge = document.createElement('div');
        manaBadge.className = 'card-mana-cost';
        manaBadge.textContent = card.cost;
        manaBadge.title = `${card.cost} Energy`;

        const emojiElement = document.createElement('div');
        emojiElement.className = 'card-emoji';
        emojiElement.textContent = card.emoji;

        const nameElement = document.createElement('div');
        nameElement.className = 'card-name';
        nameElement.textContent = card.name;

        const statsElement = document.createElement('div');
        statsElement.className = 'card-stats';
        statsElement.textContent = card.getStatsString();

        cardContent.appendChild(manaBadge);
        cardContent.appendChild(emojiElement);
        cardContent.appendChild(nameElement);
        cardContent.appendChild(statsElement);
        cardElement.appendChild(cardContent);

        cardElement.addEventListener('click', (event) => this.handleCardClick(card, event));

        cardElement.addEventListener('mouseenter', () => {
            const cards = this.hand?.cards || [];
            this.hoveredIndex = cards.findIndex((handCard) => handCard.id === card.id);
            this.scheduleRecalculation(false, 'hover-enter');
        });

        cardElement.addEventListener('mouseleave', () => {
            this.hoveredIndex = -1;
            this.scheduleRecalculation(false, 'hover-leave');
        });

        cardElement.addEventListener('dragstart', (event) => this.handleDragStart(card, event));
        cardElement.addEventListener('dragend', (event) => this.handleDragEnd(card, event));
        cardElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.openCardPreview(card);
        });

        this.cardElements.set(card.id, cardElement);
        this.updateCardVisual(cardElement, card);

        return cardElement;
    }

    updateCardVisual(cardElement, card) {
        if (!cardElement) {
            return;
        }

        const canPlay = card.canPlay && card.canPlay(this.gameState);

        if (canPlay) {
            cardElement.classList.add('playable');
            cardElement.classList.remove('unplayable');
        } else {
            cardElement.classList.add('unplayable');
            cardElement.classList.remove('playable');
        }
    }

    renderHand(cards) {
        if (!this.handContainer) {
            return;
        }

        if (!this.initialized) {
            this.pendingRenderCards = cards;
            return;
        }

        this.handContainer.innerHTML = '';
        this.cardElements.clear();
        this.hoveredIndex = -1;

        cards.forEach((card) => {
            const cardElement = this.createCardElement(card);
            this.handContainer.appendChild(cardElement);
            this.cardElements.set(card.id, cardElement);
        });

        this.updateHandPositions(true, 'render');
        console.log(`[HandUI] Hand rendered with ${cards.length} cards`);
    }

    scheduleRecalculation(immediate = false, reason = 'scheduled') {
        if (immediate) {
            debouncer.flush(this.debounceKeys.recalc, () => {
                this.updateHandPositions(false, reason);
            });
            return;
        }

        debouncer.execute(this.debounceKeys.recalc, () => {
            this.updateHandPositions(false, reason);
        }, 50);
    }

    updateHandPositions(force = false, reason = 'update') {
        if (!this.handLayout || !this.handContainer || !this.initialized) {
            return;
        }

        const cards = this.hand?.cards || [];
        const bounds = DOMHelper.getBounds(this.handContainer);

        if (bounds.width <= 0 || bounds.height <= 0) {
            console.warn('[HandUI] Skipping position update because hand container dimensions are not ready');
            return;
        }

        if (!force &&
            cards.length === this.lastCardCount &&
            Math.abs(bounds.width - this.lastContainerWidth) <= 1 &&
            Math.abs(bounds.height - this.lastContainerHeight) <= 1 &&
            this.hoveredIndex === this.handLayout.lastState.hoveredIndex) {
            return;
        }

        this.lastCardCount = cards.length;
        this.lastContainerWidth = bounds.width;
        this.lastContainerHeight = bounds.height;

        this.recalcMetrics.total += 1;
        this.recalcMetrics.reasons[reason] = (this.recalcMetrics.reasons[reason] || 0) + 1;

        console.log(`[HandUI] Recalculate reason: ${reason}`);
        if (this.recalcMetrics.total % 10 === 0) {
            console.log('[HandUI] Recalculate metrics:', JSON.stringify(this.recalcMetrics));
        }

        const transforms = this.handLayout.calculateCardPositions(
            cards.length,
            bounds.width,
            this.hoveredIndex,
            bounds.height
        );

        cards.forEach((card, index) => {
            const cardElement = this.cardElements.get(card.id);
            if (cardElement && transforms[index]) {
                this.handLayout.applyTransform(cardElement, transforms[index]);
            }
        });

        if (cards.length > 0) {
            const firstCard = this.cardElements.get(cards[0].id);
            const centerCard = this.cardElements.get(cards[Math.floor(cards.length / 2)]?.id);

            if (firstCard) {
                const firstRect = firstCard.getBoundingClientRect();
                console.log(`[HandUI] Card 0 actual position: (${(firstRect.left - bounds.left).toFixed(2)}, ${(firstRect.top - bounds.top).toFixed(2)}) relative to container`);
            }

            if (centerCard) {
                const centerRect = centerCard.getBoundingClientRect();
                console.log(`[HandUI] Center card actual position: (${(centerRect.left - bounds.left).toFixed(2)}, ${(centerRect.top - bounds.top).toFixed(2)}) relative to container`);
            }
        }
    }

    refreshAllCardVisuals() {
        this.cardElements.forEach((cardElement, cardId) => {
            const card = this.hand?.cards?.find((handCard) => handCard.id === cardId);
            if (card) {
                this.updateCardVisual(cardElement, card);
            }
        });
    }

    handleCardClick(card, event, dropTarget = null) {
        event.preventDefault();
        event.stopPropagation();

        const energy = this.gameState.energy ?? 0;
        console.log(`[HandUI] Card clicked: ${card.name} (cost: ${card.cost}, energy: ${energy})`);

        const canPlay = card.canPlay && card.canPlay(this.gameState);
        if (!canPlay) {
            console.warn(`[HandUI] Cannot play ${card.name}: cost=${card.cost}, energy=${energy}`);
            this.addVisualFeedback(card, 'failure');
            return;
        }

        if (this.hand && this.hand.handleCardClick) {
            this.hand.handleCardClick(card, event, dropTarget);
        }
    }

    addVisualFeedback(card, type) {
        const cardElement = this.cardElements.get(card.id);
        if (!cardElement) {
            return;
        }

        cardElement.classList.remove('feedback-success', 'feedback-failure');
        void cardElement.offsetWidth;

        if (type === 'success') {
            cardElement.classList.add('feedback-success');
        } else {
            cardElement.classList.add('feedback-failure');
        }

        setTimeout(() => {
            cardElement.classList.remove('feedback-success', 'feedback-failure');
        }, 500);
    }

    removeCard(card) {
        const cardElement = this.cardElements.get(card.id);

        if (cardElement) {
            cardElement.remove();
            this.cardElements.delete(card.id);
            this.scheduleRecalculation(true, 'remove-card');
            console.log(`[HandUI] Card removed: ${card.name}`);
        }
    }

    handleDragStart(card, event) {
        if (!card.canPlay(this.gameState)) {
            if (event.preventDefault) {
                event.preventDefault();
            }
            return;
        }

        this.draggedCard = card;
        event.dataTransfer.setData('text/plain', JSON.stringify({ cardId: card.id }));
        event.dataTransfer.effectAllowed = 'copy';

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

    handleDragEnd(card) {
        const pendingCard = this.draggedCard;

        const enemyArea = document.getElementById('enemy-area');
        const playerArea = document.getElementById('player-area');
        if (enemyArea) {
            enemyArea.classList.remove('drop-target');
        }
        if (playerArea) {
            playerArea.classList.remove('drop-target');
        }

        if (pendingCard && window.__dropTarget) {
            console.log(`[HandUI] Drag ended over ${window.__dropTarget}, applying card`);
            this.handleDropOnTarget(pendingCard, window.__dropTarget);
        }

        this.draggedCard = null;
        window.__dropTarget = null;

        console.log(`[HandUI] Drag ended: ${card.name}`);
    }

    handleDropOnTarget(card, targetType) {
        if (!card) {
            return;
        }

        console.log(`[HandUI] Card dropped on ${targetType}: ${card.name}`);
        this.handleCardClick(card, { preventDefault: () => {}, stopPropagation: () => {} }, targetType);
    }

    buildCardPreviewContent(card) {
        const displayName = typeof card.getDisplayName === 'function' ? card.getDisplayName() : (card.name || 'Unknown Card');
        const stats = typeof card.getStatsString === 'function' ? card.getStatsString() : `Cost: ${card.cost ?? 0}`;
        const description = card.effect?.description || card.description || 'No description available.';
        const targetText = card.targetType || card.effect?.target || 'enemy';
        const typeText = card.cardType || card.effect?.type || 'card';

        return `
            <div class="card-preview-shell">
                <button class="card-preview-close" type="button" aria-label="Close card preview">x</button>
                <div class="card-preview-card" data-element="${card.element || ''}">
                    <div class="card-mana-cost">${card.cost ?? 0}</div>
                    <div class="card-content card-preview-content">
                        <div class="card-emoji">${card.emoji || '🃏'}</div>
                        <div class="card-name">${displayName}</div>
                        <div class="card-stats">${stats}</div>
                        <div class="card-preview-meta">Type: ${typeText}</div>
                        <div class="card-preview-meta">Target: ${targetText}</div>
                        <div class="card-preview-description">${description}</div>
                    </div>
                </div>
            </div>
        `;
    }

    ensurePreviewOverlay() {
        if (this.previewOverlay) {
            return this.previewOverlay;
        }

        const overlay = document.createElement('div');
        overlay.className = 'card-preview-overlay';
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                this.closeCardPreview();
            }
        });

        document.body.appendChild(overlay);
        this.previewOverlay = overlay;
        return overlay;
    }

    openCardPreview(card) {
        const overlay = this.ensurePreviewOverlay();
        overlay.innerHTML = this.buildCardPreviewContent(card);
        overlay.classList.add('active');
        this.previewCardId = card.id;

        const closeButton = overlay.querySelector('.card-preview-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.closeCardPreview());
        }

        window.addEventListener('keydown', this.keydownHandler);
    }

    closeCardPreview() {
        if (!this.previewOverlay) {
            return;
        }

        this.previewOverlay.classList.remove('active');
        this.previewOverlay.innerHTML = '';
        this.previewCardId = null;
        window.removeEventListener('keydown', this.keydownHandler);
    }

    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }

        if (this.windowResizeHandler) {
            window.removeEventListener('resize', this.windowResizeHandler);
            this.windowResizeHandler = null;
        }

        this.closeCardPreview();
        if (this.previewOverlay && this.previewOverlay.parentNode) {
            this.previewOverlay.parentNode.removeChild(this.previewOverlay);
        }
        this.previewOverlay = null;

        debouncer.cancel(this.debounceKeys.hover);
        debouncer.cancel(this.debounceKeys.resize);
        debouncer.cancel(this.debounceKeys.recalc);

        if (this.handContainer) {
            this.handContainer.innerHTML = '';
        }

        this.cardElements.clear();
        this.draggedCard = null;
        this.hoveredIndex = -1;
        this.pendingRenderCards = null;
        this.handContainer = null;
        this.initialized = false;
    }
}

export function initializeHandUI(gameState, hand, hud) {
    return new HandUI(gameState, hand, hud);
}
