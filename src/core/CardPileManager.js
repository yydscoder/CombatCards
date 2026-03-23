/**
 * CardPileManager Module for Emoji Card Battle
 *
 * This module implements a manager pattern for handling all card piles
 * in a Slay the Spire-style deterministic card system.
 *
 * Design Philosophy:
 * - Deterministic draw order (no random shuffle unless specified)
 * - Clear separation between logic and UI
 * - Explicit pile management (Draw, Hand, Discard, Exhaust)
 *
 * Pile Structure:
 * - drawPile: Cards waiting to be drawn
 * - hand: Cards currently available to play (max 10)
 * - discardPile: Cards discarded at end of turn or after play
 * - exhaustPile: Cards removed from combat (optional)
 *
 * @module core/CardPileManager
 */

// Import configuration constants
import { GAME_CONFIG } from './config.js';

/**
 * CardPileManager Class
 *
 * Manages all card piles and provides methods for:
 * - Drawing cards from draw pile to hand
 * - Discarding cards from hand to discard pile
 * - Playing cards (removing from hand)
 * - Shuffling discard into draw when empty
 * - Exhausting cards (removing from combat)
 *
 * @example
 * const pileManager = new CardPileManager(gameState);
 * pileManager.drawCard(5); // Draw 5 cards for starting hand
 * pileManager.playCard(card); // Play a card
 * pileManager.endTurn(); // Discard hand, prepare for next turn
 */
export class CardPileManager {
    /**
     * Creates a new CardPileManager instance
     *
     * @param {Object} gameState - Reference to the game state object
     */
    constructor(gameState) {
        /**
         * @private
         * @type {Object}
         * @description Reference to the game state
         */
        this.gameState = gameState;

        /**
         * @type {Array<Object>}
         * @description Cards waiting to be drawn (draw pile)
         */
        this.drawPile = [];

        /**
         * @type {Array<Object>}
         * @description Cards currently in hand (max 10)
         */
        this.hand = [];

        /**
         * @type {Array<Object>}
         * @description Discarded cards (reshuffled into draw when empty)
         */
        this.discardPile = [];

        /**
         * @type {Array<Object>}
         * @description Exhausted cards (removed from combat)
         */
        this.exhaustPile = [];

        /**
         * @type {number}
         * @description Maximum hand size
         */
        this.maxHandSize = GAME_CONFIG.HAND_SIZE;

        /**
         * @type {number}
         * @description Starting hand size at combat start
         */
        this.startingHandSize = GAME_CONFIG.STARTING_HAND_SIZE;

        /**
         * @private
         * @type {Array<Object>}
         * @description History of pile operations for debugging
         */
        this.operationHistory = [];

        console.log('[CardPileManager] Initialized with max hand size:', this.maxHandSize);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Core Pile Operations
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Draws cards from draw pile to hand
     *
     * @param {number} [count=1] - Number of cards to draw
     * @returns {Object} Draw result with drawn cards or failure reason
     *
     * @example
     * const result = pileManager.drawCard(3);
     * if (result.success) {
     *     console.log(`Drew ${result.cards.length} cards`);
     * }
     */
    drawCard(count = 1) {
        const drawnCards = [];
        let cardsToDraw = count;

        // Check hand limit
        const handSpace = this.maxHandSize - this.hand.length;
        if (handSpace <= 0) {
            return {
                success: false,
                reason: 'hand_full',
                handSize: this.hand.length,
                maxHandSize: this.maxHandSize,
                cards: []
            };
        }

        // Limit draw to available hand space
        cardsToDraw = Math.min(cardsToDraw, handSpace);

        // Check if we need to reshuffle
        if (this.drawPile.length === 0) {
            if (this.discardPile.length === 0) {
                // No cards available to draw
                return {
                    success: false,
                    reason: 'no_cards',
                    handSize: this.hand.length,
                    cards: []
                };
            }
            // Reshuffle discard into draw
            this.reshuffleDiscard();
        }

        // Draw cards
        for (let i = 0; i < cardsToDraw && this.drawPile.length > 0; i++) {
            const card = this.drawPile.pop();
            card.isInHand = true;
            card.isInDrawPile = false;
            this.hand.push(card);
            drawnCards.push(card);
        }

        this._logOperation('draw', { count, drawn: drawnCards.length });

        console.log(`[CardPileManager] Drew ${drawnCards.length} cards (hand: ${this.hand.length}/${this.maxHandSize})`);

        return {
            success: true,
            cards: drawnCards,
            count: drawnCards.length,
            handSize: this.hand.length,
            drawPileRemaining: this.drawPile.length
        };
    }

    /**
     * Discards a card from hand to discard pile
     *
     * @param {Object} card - The card to discard
     * @returns {Object} Discard result
     *
     * @example
     * const result = pileManager.discardCard(card);
     * if (result.success) {
     *     console.log('Card discarded');
     * }
     */
    discardCard(card) {
        const index = this.hand.findIndex(c => c.id === card.id);

        if (index === -1) {
            return {
                success: false,
                reason: 'not_in_hand',
                cardName: card.name
            };
        }

        // Remove from hand
        const [removedCard] = this.hand.splice(index, 1);

        // Add to discard
        removedCard.isInHand = false;
        removedCard.isInDiscard = true;
        this.discardPile.push(removedCard);

        this._logOperation('discard', { card: card.name });

        console.log(`[CardPileManager] Discarded: ${card.name}`);

        return {
            success: true,
            card: removedCard,
            discardSize: this.discardPile.length
        };
    }

    /**
     * Discards all cards in hand (end of turn)
     *
     * @returns {Object} Discard result with discarded cards
     *
     * @example
     * const result = pileManager.discardHand();
     * console.log(`Discarded ${result.count} cards`);
     */
    discardHand() {
        const discardedCards = [...this.hand];

        // Move all hand cards to discard
        while (this.hand.length > 0) {
            const card = this.hand.pop();
            card.isInHand = false;
            card.isInDiscard = true;
            this.discardPile.push(card);
        }

        this._logOperation('discard_hand', { count: discardedCards.length });

        console.log(`[CardPileManager] Discarded hand: ${discardedCards.length} cards`);

        return {
            success: true,
            cards: discardedCards,
            count: discardedCards.length,
            discardSize: this.discardPile.length
        };
    }

    /**
     * Plays a card (removes from hand, adds to discard or exhaust)
     *
     * @param {Object} card - The card to play
     * @param {boolean} [exhaust=false] - Whether the card should exhaust instead of discard
     * @returns {Object} Play result
     *
     * @example
     * const result = pileManager.playCard(card);
     * if (result.success) {
     *     console.log('Card played');
     * }
     */
    playCard(card, exhaust = false) {
        const index = this.hand.findIndex(c => c.id === card.id);

        if (index === -1) {
            return {
                success: false,
                reason: 'not_in_hand',
                cardName: card.name
            };
        }

        // Remove from hand
        const [playedCard] = this.hand.splice(index, 1);

        // Add to appropriate pile
        playedCard.isInHand = false;

        if (exhaust || card.exhaust) {
            playedCard.isExhausted = true;
            this.exhaustPile.push(playedCard);
            this._logOperation('play_exhaust', { card: card.name });
            console.log(`[CardPileManager] Played (exhaust): ${card.name}`);
        } else {
            playedCard.isInDiscard = true;
            this.discardPile.push(playedCard);
            this._logOperation('play', { card: card.name });
            console.log(`[CardPileManager] Played: ${card.name}`);
        }

        return {
            success: true,
            card: playedCard,
            exhausted: exhaust || card.exhaust,
            handSize: this.hand.length
        };
    }

    /**
     * Reshuffles discard pile into draw pile
     *
     * @param {boolean} [shuffle=true] - Whether to shuffle (default: true)
     * @returns {Object} Reshuffle result
     *
     * @example
     * const result = pileManager.reshuffleDiscard();
     * console.log(`Draw pile: ${result.drawPileSize} cards`);
     */
    reshuffleDiscard(shuffle = true) {
        if (this.discardPile.length === 0) {
            return {
                success: false,
                reason: 'no_discard',
                drawPileSize: this.drawPile.length
            };
        }

        // Move discard to draw
        this.drawPile = [...this.discardPile];
        this.discardPile = [];

        // Reset card states
        this.drawPile.forEach(card => {
            card.isInDiscard = false;
            card.isInDrawPile = true;
        });

        // Shuffle if requested
        if (shuffle) {
            this.shuffleDrawPile();
        }

        this._logOperation('reshuffle', { drawPileSize: this.drawPile.length });

        console.log(`[CardPileManager] Reshuffled ${this.drawPile.length} cards into draw pile`);

        return {
            success: true,
            drawPileSize: this.drawPile.length,
            shuffled: shuffle
        };
    }

    /**
     * Shuffles the draw pile (Fisher-Yates algorithm)
     *
     * @returns {Object} Shuffle result
     */
    shuffleDrawPile() {
        const deck = this.drawPile;

        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        this._logOperation('shuffle', { deckSize: deck.length });

        console.log('[CardPileManager] Draw pile shuffled');

        return {
            success: true,
            deckSize: deck.length
        };
    }

    /**
     * Exhausts a card (removes from current combat)
     *
     * @param {Object} card - The card to exhaust
     * @param {string} [from='hand'] - Source pile: 'hand', 'draw', 'discard'
     * @returns {Object} Exhaust result
     *
     * @example
     * const result = pileManager.exhaustCard(card, 'hand');
     */
    exhaustCard(card, from = 'hand') {
        let sourcePile = null;
        let cardIndex = -1;

        // Find the card in the specified pile
        switch (from) {
            case 'hand':
                sourcePile = this.hand;
                break;
            case 'draw':
                sourcePile = this.drawPile;
                break;
            case 'discard':
                sourcePile = this.discardPile;
                break;
            default:
                return { success: false, reason: 'invalid_source' };
        }

        cardIndex = sourcePile.findIndex(c => c.id === card.id);

        if (cardIndex === -1) {
            return {
                success: false,
                reason: 'not_found',
                pile: from
            };
        }

        // Remove from source
        const [exhaustedCard] = sourcePile.splice(cardIndex, 1);

        // Add to exhaust
        exhaustedCard.isExhausted = true;
        exhaustedCard.isInHand = false;
        exhaustedCard.isInDrawPile = false;
        exhaustedCard.isInDiscard = false;
        this.exhaustPile.push(exhaustedCard);

        this._logOperation('exhaust', { card: card.name, from });

        console.log(`[CardPileManager] Exhausted: ${card.name} (from: ${from})`);

        return {
            success: true,
            card: exhaustedCard,
            exhaustSize: this.exhaustPile.length
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Information Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Gets the current hand
     *
     * @returns {Array<Object>} Array of cards in hand
     */
    getHand() {
        return [...this.hand];
    }

    /**
     * Gets the draw pile count
     *
     * @returns {number} Number of cards in draw pile
     */
    getDrawPileCount() {
        return this.drawPile.length;
    }

    /**
     * Gets the discard pile count
     *
     * @returns {number} Number of cards in discard pile
     */
    getDiscardPileCount() {
        return this.discardPile.length;
    }

    /**
     * Gets the exhaust pile count
     *
     * @returns {number} Number of cards in exhaust pile
     */
    getExhaustPileCount() {
        return this.exhaustPile.length;
    }

    /**
     * Gets a summary of all piles
     *
     * @returns {Object} Pile summary
     */
    getSummary() {
        return {
            hand: {
                count: this.hand.length,
                max: this.maxHandSize,
                cards: this.hand.map(c => c.name)
            },
            drawPile: {
                count: this.drawPile.length
            },
            discardPile: {
                count: this.discardPile.length
            },
            exhaustPile: {
                count: this.exhaustPile.length
            }
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Setup Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Sets up the starting deck
     *
     * @param {Array<Object>} deck - Array of cards for the starting deck
     * @returns {Object} Setup result
     *
     * @example
     * const starterDeck = [
     *     new Attack('Strike'), new Attack('Strike'), // ... etc
     * ];
     * pileManager.setupDeck(starterDeck);
     */
    setupDeck(deck) {
        // Clear existing piles
        this.drawPile = [];
        this.hand = [];
        this.discardPile = [];
        this.exhaustPile = [];

        // Add cards to draw pile
        deck.forEach(card => {
            card.isInDrawPile = true;
            card.isInHand = false;
            card.isInDiscard = false;
            card.isExhausted = false;
            this.drawPile.push(card);
        });

        // Shuffle the deck
        this.shuffleDrawPile();

        this._logOperation('setup_deck', { deckSize: deck.length });

        console.log(`[CardPileManager] Starting deck set up: ${deck.length} cards`);

        return {
            success: true,
            deckSize: deck.length
        };
    }

    /**
     * Starts a combat (draws starting hand)
     *
     * @returns {Object} Combat start result
     *
     * @example
     * const result = pileManager.startCombat();
     * console.log(`Starting hand: ${result.hand.length} cards`);
     */
    startCombat() {
        // Draw starting hand
        const drawResult = this.drawCard(this.startingHandSize);

        console.log(`[CardPileManager] Combat started, hand: ${this.hand.length} cards`);

        return {
            success: true,
            hand: this.getHand(),
            handSize: this.hand.length,
            drawPileRemaining: this.drawPile.length
        };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Utility Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Logs an operation to the history
     *
     * @private
     * @param {string} type - Operation type
     * @param {Object} data - Operation data
     */
    _logOperation(type, data) {
        this.operationHistory.push({
            type,
            ...data,
            timestamp: Date.now(),
            turn: this.gameState?.turn || 1
        });

        // Keep history limited to last 100 entries
        if (this.operationHistory.length > 100) {
            this.operationHistory.shift();
        }
    }

    /**
     * Resets all piles to initial state
     *
     * @returns {Object} Reset result
     */
    reset() {
        this.drawPile = [];
        this.hand = [];
        this.discardPile = [];
        this.exhaustPile = [];

        this.operationHistory = [];

        console.log('[CardPileManager] Reset all piles');

        return { success: true };
    }
}

/**
 * Creates and returns a new CardPileManager instance
 *
 * @param {Object} gameState - The game state object
 * @returns {CardPileManager} The initialized CardPileManager instance
 *
 * @deprecated Use `new CardPileManager()` directly instead
 */
export function initializeCardPileManager(gameState) {
    return new CardPileManager(gameState);
}

export default CardPileManager;
