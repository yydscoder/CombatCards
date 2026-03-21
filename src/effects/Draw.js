/**
 * Draw Cards Effect Module
 * 
 * Draws X cards from the deck to the player's hand.
 * 
 * @module effects/Draw
 */

export class DrawEffect {
    constructor(count = 1, source = 'Unknown') {
        this.name = 'draw';
        this.type = 'card_advantage';
        this.emoji = '🃏';
        this.count = count;
        this.source = source;
        this.description = `Draw ${count} card(s)`;
    }

    /**
     * Applies the draw effect
     * @param {Object} gameState - Game state reference
     * @param {Object} hand - Hand instance for drawing cards
     * @returns {Object} Effect application result
     */
    apply(gameState, hand) {
        const result = {
            success: true,
            effect: this,
            cardsDrawn: 0,
            message: ''
        };

        // Get deck from game state
        let deck = gameState.deck || [];

        if (deck.length === 0) {
            // Reshuffle discard pile if deck is empty
            if (gameState.discardPile && gameState.discardPile.length > 0) {
                deck = this._reshuffleDiscard(gameState);
                result.message = 'Deck reshuffled from discard! ';
            } else {
                result.success = false;
                result.message = 'No cards left to draw!';
                console.log(`[Effect:Draw] ${result.message}`);
                return result;
            }
        }

        // Draw cards
        const actualDraw = Math.min(this.count, deck.length);
        
        for (let i = 0; i < actualDraw && hand.cards.length < hand.maxCards; i++) {
            const card = deck.pop();
            if (hand.addCard(card)) {
                result.cardsDrawn++;
            } else {
                deck.push(card); // Put card back if hand is full
                break;
            }
        }

        // Update game state deck
        gameState.deck = deck;

        result.message += `Drew ${result.cardsDrawn} card(s)!`;
        console.log(`[Effect:Draw] ${result.message}`);
        
        return result;
    }

    /**
     * Reshuffles discard pile into deck
     * @param {Object} gameState - Game state reference
     * @returns {Array} New shuffled deck
     */
    _reshuffleDiscard(gameState) {
        const newDeck = [...gameState.discardPile];
        gameState.discardPile = [];
        
        // Fisher-Yates shuffle
        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        
        console.log(`[Effect:Draw] Reshuffled ${newDeck.length} cards from discard`);
        return newDeck;
    }

    /**
     * Gets debug info for this effect
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            name: this.name,
            type: this.type,
            count: this.count,
            source: this.source,
            description: this.description
        };
    }

    /**
     * Creates effect from serialized data
     * @param {Object} data - Serialized effect data
     * @returns {DrawEffect} New draw effect
     */
    static fromData(data) {
        return new DrawEffect(
            data.count || 1,
            data.source || 'Unknown'
        );
    }
}

export function createDraw(count = 1, source = 'Unknown') {
    return new DrawEffect(count, source);
}
