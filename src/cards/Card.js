/**
 * Base Card Class for Emoji Card Battle
 * 
 * This is the foundational class for all cards in the game.
 * It defines the common properties and methods that all cards will inherit.
 * Each card type will extend this class to implement specific behaviors.
 * 
 * The base class provides:
 * - Core card properties (name, cost, effect)
 * - Standard methods for card usage and validation
 * - Utility functions for card state management
 */

/**
 * Creates a new Card instance
 * 
 * @param {string} name - The name of the card (e.g., "Fire Blast")
 * @param {number} cost - The mana cost to play this card
 * @param {Object} effect - The effect object describing what the card does
 * @param {string} emoji - The emoji representation of the card
 */
export class Card {
    constructor(name, cost, effect, emoji) {
        // Card identification properties
        this.id = Math.random().toString(36).substring(2, 9); // Unique ID for tracking
        this.name = name; // Human-readable name of the card
        this.emoji = emoji; // Visual representation using emoji
        
        // Resource cost properties
        this.cost = cost; // Mana cost required to play this card
        
        // Effect properties
        this.effect = effect; // Object containing effect details
        
        // Card state properties
        this.isPlayable = true; // Whether the card can currently be played
        this.isInHand = false; // Whether the card is currently in the player's hand
        this.isInDeck = false; // Whether the card is currently in the player's deck    
        this.isDiscarded = false; // Whether the card has been discarded
        
        // Metadata properties
        this.createdTimestamp = Date.now(); // When the card was created
        this.lastUsedTimestamp = null; // When the card was last used
        
        // Log card creation for debugging and tracking
        console.log(`Card created: ${this.name} (ID: ${this.id})`);
    }
    
    /**
     * Checks if the card can be played given the current game state
     * 
     * @param {Object} gameState - The current game state object
     * @returns {boolean} True if the card can be played, false otherwise
     */
    canPlay(gameState) {
        // Check if the player has enough mana
        const hasEnoughMana = gameState.playerMana >= this.cost;
        
        // Check if the card is in hand
        const isInHand = this.isInHand;
        
        // Check if the card is not on cooldown (if applicable)
        const isNotOnCooldown = !this.cooldown || this.cooldown <= 0;
        
        // Return true only if all conditions are met
        return hasEnoughMana && isInHand && isNotOnCooldown;
    }
    
    /**
     * Plays the card in the game
     * 
     * This method executes the card's effect and updates the game state accordingly.
     * Subclasses should override this method to implement specific card behaviors.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect (e.g., enemy)
     * @returns {Object} Result object containing success status and details
     */
    play(gameState, target) {
        // Validate that the card can be played
        if (!this.canPlay(gameState)) {
            console.warn(`Cannot play card: ${this.name}. Conditions not met.`);
            return { success: false, reason: 'invalid_conditions' };
        }
        
        // Deduct mana cost from player
        gameState.updatePlayerMana(gameState.playerMana - this.cost);
        
        // Mark card as used
        this.lastUsedTimestamp = Date.now();
        
        // Log the card play for debugging
        console.log(`Playing card: ${this.name} (Cost: ${this.cost} mana)`);
        
        // Execute the card's effect
        // This is a placeholder implementation - subclasses should override
        const result = this.executeEffect(gameState, target);
        
        // Return the result
        return result;
    }
    
    /**
     * Exezcutes the card's effect
     * 
     * This method should be overridden by subclasses to implement specific card effects.
     * The default implementation returns a generic success result.
     * 
     * @param {Object} gameState - The current game state object
     * @param {Object} target - The target of the card's effect
     * @returns {Object} Result object containing success status and details
     */
    executeEffect(gameState, target) {
        // Default implementation - should be overridden by subclasses
        console.log(`Executing default effect for card: ${this.name}`);
        
        return {
            success: true,
            message: `Card ${this.name} executed its default effect`,
            damage: 0,
            healing: 0,
            statusEffects: []
        };
    }
    
    /**
     * Gets the card's display name with cost information
     * 
     * @returns {string} Formatted display name
     */
    getDisplayName() {
        return `${this.name} [${this.cost} mana]`;
    }
    
    /**
     * Gets the card's stats as a string for display
     * 
     * @returns {string} Formatted stats string
     */
    getStatsString() {
        return `Cost: ${this.cost}`;
    }
    
    /**
     * Updates the card's state
     * 
     * @param {Object} newState - Object containing properties to update
     */
    updateState(newState) {
        Object.assign(this, newState);
        
        // Log the state update for debugging
        console.log(`Card state updated: ${this.name}`, newState);
    }
    
    /**
     * Resets the card to its initial state
     */
    reset() {
        this.isPlayable = true;
        this.isInHand = false;
        this.isInDeck = false;
        this.isDiscarded = false;
        this.lastUsedTimestamp = null;
        
        console.log(`Card reset: ${this.name}`);
    }
}