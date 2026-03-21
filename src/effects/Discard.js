/**
 * Discard Cards Effect Module
 * 
 * Discards X cards from the player's hand.
 * Can be random, targeted, or player choice.
 * 
 * @module effects/Discard
 */

export class DiscardEffect {
    constructor(count = 1, mode = 'random', source = 'Unknown') {
        this.name = 'discard';
        this.type = 'card_manipulation';
        this.emoji = '🗑️';
        this.count = count;
        this.mode = mode; // 'random', 'targeted', 'choice'
        this.source = source;
        this.description = `Discard ${count} card(s) (${mode})`;
    }

    /**
     * Applies the discard effect
     * @param {Object} gameState - Game state reference
     * @param {Object} hand - Hand instance
     * @param {Array} targets - Optional targeted cards to discard
     * @returns {Object} Effect application result
     */
    apply(gameState, hand, targets = null) {
        const result = {
            success: true,
            effect: this,
            cardsDiscarded: 0,
            discardedCards: [],
            message: ''
        };

        if (hand.cards.length === 0) {
            result.message = 'Hand is already empty!';
            console.log(`[Effect:Discard] ${result.message}`);
            return result;
        }

        const actualDiscard = Math.min(this.count, hand.cards.length);

        switch (this.mode) {
            case 'random':
                result.discardedCards = this._discardRandom(hand, actualDiscard);
                break;
            
            case 'targeted':
                if (targets && targets.length > 0) {
                    result.discardedCards = this._discardTargeted(hand, targets.slice(0, actualDiscard));
                } else {
                    result.success = false;
                    result.message = 'No targets specified for discard!';
                    return result;
                }
                break;
            
            case 'choice':
                // For player choice, this would need UI interaction
                // For now, default to random
                result.discardedCards = this._discardRandom(hand, actualDiscard);
                result.message = '(Player choice defaulted to random) ';
                break;
        }

        result.cardsDiscarded = result.discardedCards.length;
        result.message += `Discarded ${result.cardsDiscarded} card(s): ${result.discardedCards.map(c => c.name).join(', ')}`;
        
        console.log(`[Effect:Discard] ${result.message}`);
        
        return result;
    }

    /**
     * Discards random cards from hand
     * @param {Object} hand - Hand instance
     * @param {number} count - Number of cards to discard
     * @returns {Array} Discarded cards
     */
    _discardRandom(hand, count) {
        const discarded = [];
        
        for (let i = 0; i < count; i++) {
            if (hand.cards.length === 0) break;
            
            const randomIndex = Math.floor(Math.random() * hand.cards.length);
            const card = hand.cards.splice(randomIndex, 1)[0];
            card.isInHand = false;
            card.isDiscarded = true;
            
            if (hand.gameState) {
                hand.gameState.discardPile.push(card);
            }
            
            discarded.push(card);
        }
        
        return discarded;
    }

    /**
     * Discards specific targeted cards
     * @param {Object} hand - Hand instance
     * @param {Array} targets - Cards to discard
     * @returns {Array} Discarded cards
     */
    _discardTargeted(hand, targets) {
        const discarded = [];
        
        for (const target of targets) {
            const index = hand.cards.findIndex(c => c.id === target.id);
            if (index !== -1) {
                const card = hand.cards.splice(index, 1)[0];
                card.isInHand = false;
                card.isDiscarded = true;
                
                if (hand.gameState) {
                    hand.gameState.discardPile.push(card);
                }
                
                discarded.push(card);
            }
        }
        
        return discarded;
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
            mode: this.mode,
            source: this.source,
            description: this.description
        };
    }

    /**
     * Creates effect from serialized data
     * @param {Object} data - Serialized effect data
     * @returns {DiscardEffect} New discard effect
     */
    static fromData(data) {
        return new DiscardEffect(
            data.count || 1,
            data.mode || 'random',
            data.source || 'Unknown'
        );
    }
}

export function createDiscard(count = 1, mode = 'random', source = 'Unknown') {
    return new DiscardEffect(count, mode, source);
}
