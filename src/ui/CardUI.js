/**
 * Card UI Rendering Module for Emoji Card Battle
 * 
 * This module handles the rendering of cards in the user interface.
 * It creates DOM elements for cards with appropriate styling, emoji,
 * and stats display. The module also manages card interactivity
 * including click events for card usage.
 * 
 * Key responsibilities:
 * 1. Creating card DOM elements from card objects
 * 2. Updating card visual state based on game state
 * 3. Handling card click events and interactions
 * 4. Managing card animations and visual feedback
 */

// Import the FireCard class for demonstration
import { FireCard } from '../cards/FireCard.js';

// Import enemy and damage calculator modules
import { SlimeEnemy } from '../enemies/SlimeEnemy.js';
import { DamageCalculator } from '../combat/DamageCalculator.js';

// Import HUD module for damage feedback
import { HUD } from './HUD.js';

/**
 * CardRenderer class - Manages card rendering and UI interactions
 * 
 * This class encapsulates all functionality related to rendering cards
 * in the game's user interface. It provides methods to create card
 * elements, update their state, and handle user interactions.
 */
export class CardRenderer {
    /**
     * Creates a new CardRenderer instance
     * @param {Object} gameState - Reference to the game state object
     * @param {HUD} hud - Reference to the HUD instance for feedback
     */
    constructor(gameState, hud) {
        // Store reference to game state for access during rendering
        this.gameState = gameState;
        this.hud = hud;
        
        // Initialize damage calculator
        this.damageCalculator = new DamageCalculator();
        
        // Create default enemy if none exists in game state
        if (!gameState.enemy) {
            this.gameState.enemy = new SlimeEnemy("Slime", 80, 12);
            console.log('Default Slime enemy created and assigned to gameState.enemy');
        }
        
        // Cache for card elements to avoid repeated DOM queries
        this.cardElements = new Map();
        
        // Log initialization for debugging and tracking
        console.log('CardRenderer initialized with gameState reference, damage calculator, and HUD');
    }
    
    /**
     * Creates a DOM element for a card
     * 
     * This method creates a card element with appropriate styling,
     * emoji representation, and stats display based on the card object.
     * 
     * @param {Object} card - The card object to render
     * @param {string} containerId - The ID of the container to append the card to
     * @returns {HTMLElement} The created card element
     */
    createCardElement(card, containerId = 'hand') {
        // Create the main card div element
        const cardElement = document.createElement('div');
        
        // Set card element properties
        cardElement.className = 'card';
        cardElement.dataset.cardId = card.id;
        cardElement.dataset.cardName = card.name;
        cardElement.dataset.cardType = card.constructor.name;
        
        // Add click event listener for card interaction
        cardElement.addEventListener('click', (event) => {
            this.handleCardClick(card, event);
        });
        
        // Create card content structure
        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';
        
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
        
        // Append elements to card content
        cardContent.appendChild(emojiElement);
        cardContent.appendChild(nameElement);
        cardContent.appendChild(statsElement);
        
        // Append content to card element
        cardElement.appendChild(cardContent);
        
        // Store reference to the card element
        this.cardElements.set(card.id, cardElement);
        
        // Log card creation for debugging
        console.log(`Card element created: ${card.name} (ID: ${card.id})`);
        
        // Return the created card element
        return cardElement;
    }
    
    /**
     * Renders a card in the specified container
     * 
     * This method creates a card element and appends it to the specified container.
     * 
     * @param {Object} card - The card object to render
     * @param {string} containerId - The ID of the container to append the card to
     */
    renderCard(card, containerId = 'hand') {
        // Get the container element
        const container = document.getElementById(containerId);
        
        // Check if container exists
        if (!container) {
            console.error(`Container with ID '${containerId}' not found`);
            return;
        }
        
        // Create card element
        const cardElement = this.createCardElement(card, containerId);
        
        // Append card to container
        container.appendChild(cardElement);
        
        // Update card state to indicate it's in hand
        card.isInHand = true;
        
        // Log rendering for debugging
        console.log(`Card rendered: ${card.name} in container '${containerId}'`);
    }
    
    /**
     * Updates a card's visual state
     * 
     * This method updates the visual appearance of a card based on its current state.
     * 
     * @param {Object} card - The card object to update
     */
    updateCardVisual(card) {
        // Get the card element from cache
        const cardElement = this.cardElements.get(card.id);
        
        // Check if card element exists
        if (!cardElement) {
            console.warn(`Card element not found for card ID: ${card.id}`);
            return;
        }
        
        // Update card stats display
        const statsElement = cardElement.querySelector('.card-stats');
        if (statsElement) {
            statsElement.textContent = card.getStatsString();
        }
        
        // Update card name display
        const nameElement = cardElement.querySelector('.card-name');
        if (nameElement) {
            nameElement.textContent = card.name;
        }
        
        // Update card emoji if needed
        const emojiElement = cardElement.querySelector('.card-emoji');
        if (emojiElement) {
            emojiElement.textContent = card.emoji;
        }
        
        // Add visual indicators based on card state
        if (card.isPlayable && this.gameState.playerMana >= card.cost) {
            cardElement.classList.add('playable');
            cardElement.classList.remove('unplayable');
        } else {
            cardElement.classList.add('unplayable');
            cardElement.classList.remove('playable');
        }
        
        // Log update for debugging
        console.log(`Card visual updated: ${card.name}`);
    }
    
    /**
     * Handles card click events
     * 
     * This method is called when a card is clicked by the user.
     * It executes the card's effect and provides visual feedback.
     * 
     * @param {Object} card - The card that was clicked
     * @param {Event} event - The click event object
     */
    handleCardClick(card, event) {
        // Prevent default behavior
        event.preventDefault();
        event.stopPropagation();

        // Retrieve the card element from cache
        const cardElement = this.cardElements.get(card.id);

        // Log the card click for debugging
        console.log(`Card clicked: ${card.name} (ID: ${card.id})`);

        // Check if the card can be played
        if (card.canPlay(this.gameState)) {
            // Execute the card's effect
            const result = card.play(this.gameState, { type: 'enemy' });

            // Log the result
            console.log(`Card play result:`, result);

            // Add visual feedback for successful play
            this.addVisualFeedback(cardElement, 'success');

            // Log "Attack Used" as required in the checkpoint
            console.log("Attack Used");
            
            // Update enemy HP based on card effect
            if (result.success && result.damage > 0 && this.gameState.enemy) {
                // Calculate damage using damage calculator
                const damageResult = this.damageCalculator.calculateCardDamage(card, this.gameState.enemy);

                // Apply damage to enemy
                const takeDamageResult = this.gameState.enemy.takeDamage(damageResult.finalDamage, {
                    isCriticalHit: damageResult.details.isCriticalHit,
                    criticalMultiplier: damageResult.details.criticalMultiplier
                });

                // Update game state with new enemy HP
                this.gameState.updateEnemyHp(this.gameState.enemy.hp);

                // Update enemy HP in HUD
                const enemyHpEl = document.getElementById('enemy-hp');
                if (enemyHpEl) {
                    enemyHpEl.textContent = this.gameState.enemy.hp;
                }

                // Show damage feedback via HUD
                if (this.hud) {
                    this.hud.showDamageFeedback(
                        damageResult.finalDamage,
                        'enemy',
                        damageResult.details.isCriticalHit
                    );
                }

                // Log the damage application
                console.log(`Enemy HP updated: ${this.gameState.enemy.hp}/${this.gameState.enemy.maxHp}`);

                // Check if enemy is dead
                if (takeDamageResult.isDead || this.gameState.enemy.hp <= 0) {
                    console.log("Enemy defeated!");
                    this.gameState.isGameOver = true;
                    this.gameState.gameOverReason = 'player_win';
                    if (enemyHpEl) enemyHpEl.textContent = '0';
                    
                    // Show victory animation
                    if (this.hud) {
                        this.hud.showVictory();
                    }
                    
                    alert('Victory! The Slime has been defeated! 🎉');
                }
            }
        } else {
            // Add visual feedback for failed play
            this.addVisualFeedback(cardElement, 'failure');

            // Log why the card couldn't be played
            console.warn(`Cannot play ${card.name}: insufficient mana or card not in hand`);
        }
    }
    
    /**
     * Adds visual feedback to a card element
     * 
     * This method adds temporary visual effects to indicate success or failure.
     * 
     * @param {HTMLElement} cardElement - The card element to add feedback to
     * @param {string} type - The type of feedback ('success' or 'failure')
     */
    addVisualFeedback(cardElement, type) {
        // Remove any existing feedback classes
        cardElement.classList.remove('feedback-success', 'feedback-failure');
        
        // Add the appropriate feedback class
        if (type === 'success') {
            cardElement.classList.add('feedback-success');
            
            // Remove the class after animation completes
            setTimeout(() => {
                cardElement.classList.remove('feedback-success');
            }, 1000);
        } else if (type === 'failure') {
            cardElement.classList.add('feedback-failure');
            
            // Remove the class after animation completes
            setTimeout(() => {
                cardElement.classList.remove('feedback-failure');
            }, 1000);
        }
    }
    
    /**
     * Renders a sample fire card for testing
     * 
     * This method creates and renders a sample fire card to verify
     * the card system is working correctly.
     */
    renderSampleFireCard() {
        // Create a sample fire card
        const fireCard = new FireCard("Fire Blast", 5, 10);
        
        // Render the card in the hand container
        this.renderCard(fireCard, 'hand');
        
        // Log sample card creation for debugging
        console.log('Sample FireCard rendered for testing');
        
        return fireCard;
    }
}

/**
 * Initializes the CardRenderer and renders a sample card
 * 
 * This function creates a CardRenderer instance and renders a sample fire card
 * to demonstrate the card system functionality.
 * 
 * @param {Object} gameState - The game state object
 * @returns {CardRenderer} The initialized CardRenderer instance
 */
export function initializeCardRenderer(gameState) {
    // Create a new CardRenderer instance
    const cardRenderer = new CardRenderer(gameState);
    
    // Render a sample fire card for testing
    cardRenderer.renderSampleFireCard();
    
    // Return the initialized renderer
    return cardRenderer;
}