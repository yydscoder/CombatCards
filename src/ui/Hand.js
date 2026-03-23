/**
 * Hand UI Module for Emoji Card Battle
 *
 * This module manages the player's hand of cards.
 * It handles drawing cards, displaying them, and managing hand state.
 */

// Import card classes - Fire
import { FireCard } from '../cards/fire/FireCard.js';
import { Fireball } from '../cards/fire/Fireball.js';
import { Inferno } from '../cards/fire/Inferno.js';
import { Ember } from '../cards/fire/Ember.js';
import { FlameShield } from '../cards/fire/FlameShield.js';
import { Combust } from '../cards/fire/Combust.js';
import { Firestorm } from '../cards/fire/Firestorm.js';
import { Scorch } from '../cards/fire/Scorch.js';
import { Blaze } from '../cards/fire/Blaze.js';
import { Pyroclasm } from '../cards/fire/Pyroclasm.js';
import { FireWall } from '../cards/fire/FireWall.js';
import { Ignite } from '../cards/fire/Ignite.js';
import { Magma } from '../cards/fire/Magma.js';
import { FireBreath } from '../cards/fire/FireBreath.js';
import { FlameStrike } from '../cards/fire/FlameStrike.js';

// Import card classes - Water
import { WaterJet } from '../cards/water/WaterJet.js';
import { TidalWave } from '../cards/water/TidalWave.js';
import { Heal } from '../cards/water/Heal.js';
import { IceWall } from '../cards/water/IceWall.js';
import { FrostBite } from '../cards/water/FrostBite.js';
import { AquaBlast } from '../cards/water/AquaBlast.js';
import { BubbleShield } from '../cards/water/BubbleShield.js';
import { Tsunami } from '../cards/water/Tsunami.js';
import { Regen } from '../cards/water/Regen.js';
import { IceSpike } from '../cards/water/IceSpike.js';
import { Purify } from '../cards/water/Purify.js';
import { DeepFreeze } from '../cards/water/DeepFreeze.js';
import { Whirlpool } from '../cards/water/Whirlpool.js';
import { ManaSpring } from '../cards/water/ManaSpring.js';
import { Blizzard } from '../cards/water/Blizzard.js';
import { HydroBoost } from '../cards/water/HydroBoost.js';
import { Leviathan } from '../cards/water/Leviathan.js';

// Import card classes - Nature
import { VineWhip } from '../cards/nature/VineWhip.js';
import { Regrow } from '../cards/nature/Regrow.js';
import { Poison } from '../cards/nature/Poison.js';
import { Roots } from '../cards/nature/Roots.js';
import { Bloom } from '../cards/nature/Bloom.js';
import { Thorns } from '../cards/nature/Thorns.js';
import { Photosynthesis } from '../cards/nature/Photosynthesis.js';
import { SeedBomb } from '../cards/nature/SeedBomb.js';
import { BarkSkin } from '../cards/nature/BarkSkin.js';
import { WildGrowth } from '../cards/nature/WildGrowth.js';
import { Entangle } from '../cards/nature/Entangle.js';
import { Lifebloom } from '../cards/nature/Lifebloom.js';
import { SolarBeam } from '../cards/nature/SolarBeam.js';
import { MushroomCloud } from '../cards/nature/MushroomCloud.js';
import { NatureWrath } from '../cards/nature/NatureWrath.js';
import { Sap } from '../cards/nature/Sap.js';
import { Ironbark } from '../cards/nature/Ironbark.js';
import { Overgrowth } from '../cards/nature/Overgrowth.js';

// Import HandUI for rendering
import { HandUI } from './HandUI.js';

// Import CardPileManager for pile operations
import { CardPileManager } from '../core/CardPileManager.js';

import { DamageCalculator } from '../combat/DamageCalculator.js';
import { SlimeEnemy } from '../enemies/SlimeEnemy.js';
import { createEffectManager } from '../effects/EffectManager.js';

/**
 * Hand class - Manages the player's hand of cards
 * 
 * This class handles all hand-related functionality, including:
 * - Drawing cards from the deck
 * - Displaying cards in the hand
 * - Managing card selection and interaction
 * - Handling card discards
 */
export class Hand {
    /**
     * Creates a new Hand instance
     * @param {Object} gameState - Reference to the game state object
     */
    constructor(gameState, hud, saveSystem, gameOverScreen) {
        // Store reference to game state
        this.gameState = gameState;

        // Store reference to HUD for updates
        this.hud = hud;

        // Save system for recording wins/losses
        this.saveSystem = saveSystem;

        // Game over screen
        this.gameOverScreen = gameOverScreen;

        // Damage calculator for combat
        this.damageCalculator = new DamageCalculator();

        // Effect manager for centralized effect processing
        this.effectManager = createEffectManager(gameState);
        this.effectManager.setHUD(hud);

        // Create enemy if none exists
        if (!gameState.enemy) {
            gameState.enemy = new SlimeEnemy('Slime', 80, 12);
            gameState.enemyHp = gameState.enemy.hp;
            gameState.enemyMaxHp = gameState.enemy.maxHp;
        }
        if (!gameState.enemyAttackInterval) {
            gameState.enemyAttackInterval = gameState.enemy?.attackInterval || 1;
        }
        if (!gameState.enemyAttackCooldown) {
            gameState.enemyAttackCooldown = gameState.enemyAttackInterval;
        }
        gameState.player = this._buildPlayerProxy();
        this.handContainer = document.getElementById('hand');
        this.deckContainer = document.getElementById('deck');

        // Hand state (legacy - kept for backward compatibility)
        this.cards = []; // Array of cards currently in hand
        this.maxCards = 5; // Maximum number of cards in hand (legacy)

        // Initialize CardPileManager for pile operations (Slay the Spire style)
        this.cardPileManager = new CardPileManager(gameState);
        gameState.cardPileManager = this.cardPileManager;

        // Initialize HandUI for rendering and interactions
        this.handUI = new HandUI(gameState, this, hud);

        // Log initialization
        console.log('Hand initialized with CardPileManager and HandUI');
    }
    
    /**
     * Initializes the hand with starting cards
     * Uses CardPileManager for Slay the Spire-style deck management
     */
    initHand() {
        // Create the full combined deck
        const deck = this._createCombinedDeck();

        // Set up the CardPileManager with the deck
        if (this.cardPileManager) {
            this.cardPileManager.setupDeck(deck);
            this.cardPileManager.startCombat(); // Draw starting hand

            // Sync legacy cards array with CardPileManager hand
            this.cards = this.cardPileManager.getHand();

            // Debug: log card states
            console.log(`[Hand] Started combat with ${this.cards.length} cards in hand`);
            this.cards.forEach((card, i) => {
                console.log(`[Hand] Card ${i}: ${card.name}, isInHand=${card.isInHand}`);
            });
        } else {
            // Fallback: legacy behavior
            this._initHandLegacy();
        }

        // Render hand using HandUI
        if (this.handUI) {
            this.handUI.renderHand(this.cards);
        }

        // Update playable/unplayable classes based on current energy
        this.updateCardAffordability();

        console.log(`[Hand] Initialized with ${this.cards.length} cards`);
    }

    /**
     * Legacy initHand fallback (if CardPileManager not available)
     * @private
     */
    _initHandLegacy() {
        // Create the full combined deck
        const deck = this._createCombinedDeck();

        // Shuffle the deck
        this._shuffleDeck(deck);

        // Draw 3 random cards for starting hand
        const startingHandSize = 3;
        for (let i = 0; i < startingHandSize && deck.length > 0; i++) {
            const card = deck.pop();
            this.addCard(card);
        }

        // Store remaining cards in gameState deck
        this.gameState.deck = deck;
    }
    
    /**
     * Creates a combined deck with fire and water cards
     * @returns {Array} Array of card instances
     */
    _createCombinedDeck() {
        const deck = [];
        
        // === FIRE DECK ===
        // Basic fire cards (more common)
        for (let i = 0; i < 3; i++) deck.push(new FireCard("Fire Blast", 5, 10));
        for (let i = 0; i < 3; i++) deck.push(new Fireball());
        for (let i = 0; i < 3; i++) deck.push(new Ember());
        for (let i = 0; i < 2; i++) deck.push(new Ignite());
        
        // Mid-cost fire cards
        for (let i = 0; i < 2; i++) deck.push(new Scorch());
        for (let i = 0; i < 2; i++) deck.push(new FlameShield());
        for (let i = 0; i < 2; i++) deck.push(new FireWall());
        for (let i = 0; i < 2; i++) deck.push(new FlameStrike());
        for (let i = 0; i < 2; i++) deck.push(new Combust());
        for (let i = 0; i < 2; i++) deck.push(new Blaze());
        for (let i = 0; i < 2; i++) deck.push(new FireBreath());
        
        // High-cost fire cards
        for (let i = 0; i < 2; i++) deck.push(new Magma());
        for (let i = 0; i < 2; i++) deck.push(new Firestorm());
        for (let i = 0; i < 2; i++) deck.push(new Pyroclasm());
        
        // Ultimate fire card
        deck.push(new Inferno());
        
        // === WATER DECK ===
        // Basic water cards
        for (let i = 0; i < 3; i++) deck.push(new WaterJet());
        for (let i = 0; i < 3; i++) deck.push(new IceSpike());
        for (let i = 0; i < 2; i++) deck.push(new Heal());
        for (let i = 0; i < 2; i++) deck.push(new AquaBlast());
        
        // Mid-cost water cards
        for (let i = 0; i < 2; i++) deck.push(new IceWall());
        for (let i = 0; i < 2; i++) deck.push(new BubbleShield());
        for (let i = 0; i < 2; i++) deck.push(new FrostBite());
        for (let i = 0; i < 2; i++) deck.push(new Regen());
        for (let i = 0; i < 2; i++) deck.push(new Purify());
        for (let i = 0; i < 2; i++) deck.push(new ManaSpring());
        for (let i = 0; i < 2; i++) deck.push(new HydroBoost());
        for (let i = 0; i < 2; i++) deck.push(new Whirlpool());
        
        // High-cost water cards
        for (let i = 0; i < 2; i++) deck.push(new TidalWave());
        for (let i = 0; i < 2; i++) deck.push(new DeepFreeze());
        for (let i = 0; i < 2; i++) deck.push(new Blizzard());
        for (let i = 0; i < 2; i++) deck.push(new Tsunami());
        
        // Ultimate water card
        deck.push(new Leviathan());
        
        // === NATURE DECK ===
        // Basic nature cards
        for (let i = 0; i < 3; i++) deck.push(new VineWhip());
        for (let i = 0; i < 2; i++) deck.push(new Poison());
        for (let i = 0; i < 2; i++) deck.push(new Regrow());
        for (let i = 0; i < 2; i++) deck.push(new Bloom());
        
        // Mid-cost nature cards
        for (let i = 0; i < 2; i++) deck.push(new Roots());
        for (let i = 0; i < 2; i++) deck.push(new Thorns());
        for (let i = 0; i < 2; i++) deck.push(new Photosynthesis());
        for (let i = 0; i < 2; i++) deck.push(new SeedBomb());
        for (let i = 0; i < 2; i++) deck.push(new BarkSkin());
        for (let i = 0; i < 2; i++) deck.push(new Sap());
        for (let i = 0; i < 2; i++) deck.push(new Lifebloom());
        
        // High-cost nature cards
        for (let i = 0; i < 2; i++) deck.push(new WildGrowth());
        for (let i = 0; i < 2; i++) deck.push(new Entangle());
        for (let i = 0; i < 2; i++) deck.push(new SolarBeam());
        for (let i = 0; i < 2; i++) deck.push(new MushroomCloud());
        for (let i = 0; i < 2; i++) deck.push(new Ironbark());
        for (let i = 0; i < 2; i++) deck.push(new Overgrowth());
        
        // Ultimate nature card
        deck.push(new NatureWrath());

        return deck;
    }
    
    /**
     * Shuffles a deck using Fisher-Yates algorithm for unbiased shuffling
     * @param {Array} deck - The deck to shuffle
     */
    _shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        console.log('Deck shuffled using Fisher-Yates algorithm');
    }
    
    /**
     * Adds a card to the hand
     *
     * @param {Object} card - The card to add
     * @returns {boolean} True if card was added successfully, false otherwise
     */
    addCard(card) {
        // Use CardPileManager if available
        if (this.cardPileManager) {
            // Add card to draw pile and draw it immediately
            this.cardPileManager.drawPile.push(card);
            card.isInDrawPile = true;

            const drawResult = this.cardPileManager.drawCard(1);

            if (drawResult.success) {
                // Sync legacy cards array
                this.cards = this.cardPileManager.getHand();

                // Render the card
                this.renderCard(card);

                console.log(`[Hand] Card added: ${card.name}`);
                return true;
            } else {
                console.warn(`[Hand] Could not add card: ${drawResult.reason}`);
                return false;
            }
        }

        // Fallback: legacy behavior
        if (this.cards.length >= this.maxCards) {
            console.warn(`Cannot add card: hand is full (${this.maxCards} cards)`);
            return false;
        }

        card.isInHand = true;
        card.isInDeck = false;
        this.cards.push(card);
        this.gameState.hand = this.cards;
        this.renderCard(card);

        console.log(`Card added to hand: ${card.name}`);
        return true;
    }

    /**
     * Removes a card from the hand
     *
     * @param {Object} card - The card to remove
     * @returns {boolean} True if card was removed successfully, false otherwise
     */
    removeCard(card) {
        // Use CardPileManager if available
        if (this.cardPileManager) {
            const playResult = this.cardPileManager.playCard(card);

            if (playResult.success) {
                // Sync legacy cards array
                this.cards = this.cardPileManager.getHand();

                // Remove card element from DOM via HandUI
                if (this.handUI) {
                    this.handUI.removeCard(card);
                }

                console.log(`[Hand] Card removed: ${card.name}`);

                // Draw a new card to replace the played one (maintain hand size)
                if (!this.gameState.isGameOver && this.cards.length < 5) {
                    this.drawCard();
                }

                return true;
            } else {
                console.warn(`[Hand] Could not remove card: ${playResult.reason}`);
                return false;
            }
        }

        // Fallback: legacy behavior
        const index = this.cards.indexOf(card);
        if (index === -1) {
            console.warn(`Card not found in hand: ${card.name}`);
            return false;
        }

        // Remove card from array
        this.cards.splice(index, 1);

        // Update card state
        card.isInHand = false;

        // Add to discard pile
        card.isDiscarded = true;
        if (!this.gameState.discardPile) {
            this.gameState.discardPile = [];
        }
        this.gameState.discardPile.push(card);

        // Update game state
        this.gameState.hand = this.cards;

        // Remove card using HandUI
        if (this.handUI) {
            this.handUI.removeCard(card);
        } else {
            // Fallback: direct DOM removal
            const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
            if (cardElement && cardElement.parentNode) {
                cardElement.parentNode.removeChild(cardElement);
            }
        }

        console.log(`Card removed from hand: ${card.name} (discard pile: ${this.gameState.discardPile.length})`);

        // Draw a new card to replace the played one (maintain hand size)
        if (!this.gameState.isGameOver && this.cards.length < 5) {
            this.drawCard();
        }

        return true;
    }
    
    /**
     * Renders a card in the hand
     *
     * @param {Object} card - The card to render
     */
    renderCard(card) {
        // Delegate to HandUI for rendering
        if (this.handUI) {
            this.handUI.renderCardInSlot(card);
        } else {
            // Fallback: direct rendering (legacy support)
            this._renderCardLegacy(card);
        }

        console.log(`Card rendered in hand: ${card.name}`);
    }

    /**
     * Legacy card rendering (fallback if HandUI not available)
     * @private
     */
    _renderCardLegacy(card) {
        // Create card element (reusing CardRenderer logic)
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.cardId = card.id;
        cardElement.dataset.cardName = card.name;
        cardElement.dataset.cardType = card.constructor.name;
        // Add element type for theme styling (fire, water, nature)
        if (card.element) {
            cardElement.dataset.element = card.element;
        }

        // Add click event listener
        cardElement.addEventListener('click', (event) => {
            this.handleCardClick(card, event);
        });

        // Create card content
        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';

        // Create mana cost badge (top-left corner)
        const manaBadge = document.createElement('div');
        manaBadge.className = 'card-mana-cost';
        manaBadge.textContent = card.cost;
        manaBadge.title = `${card.cost} Mana`;

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

        // Append elements
        cardContent.appendChild(manaBadge);
        cardContent.appendChild(emojiElement);
        cardContent.appendChild(nameElement);
        cardContent.appendChild(statsElement);
        cardElement.appendChild(cardContent);

        // Mark affordability so player can see what's playable
        if (card.canPlay(this.gameState)) {
            cardElement.classList.add('playable');
        } else {
            cardElement.classList.add('unplayable');
        }

        // Append to hand container
        if (this.handContainer) {
            this.handContainer.appendChild(cardElement);
        }

        console.log(`Card rendered in hand: ${card.name}`);
    }
    
    /**
     * Handles card click events in the hand
     * 
     * @param {Object} card - The card that was clicked
     * @param {Event} event - The click event
     */
    handleCardClick(card, event) {
        // Prevent default behavior
        event.preventDefault();
        event.stopPropagation();

        // Log the card click
        console.log(`Hand card clicked: ${card.name} (ID: ${card.id})`);

        // Check if card can be played
        if (!card.canPlay(this.gameState)) {
            console.warn(`Cannot play ${card.name}: not enough energy or not in hand`);
            this.addVisualFeedback(card, 'failure');
            return;
        }

        // Play the card (CardBase.play() handles energy spending)
        const playResult = card.play(this.gameState, this.gameState.enemy);

        if (!playResult.success) {
            console.warn(`Card play failed: ${playResult.reason}`);
            this.addVisualFeedback(card, 'failure');
            return;
        }

        // Consume applicable buffs before executing card effect
        const buffResult = this.effectManager.consumeBuffsForCard(card);
        console.log(`[Hand] Buff result for ${card.name}: consumed=${buffResult.consumed}, multiplier=${buffResult.damageMultiplier}, guaranteedCrit=${buffResult.guaranteedCrit}`);

        const effectTarget = card.effect?.target || 'enemy';

        if (effectTarget === 'self') {
            // ── Self-targeted card (heal, mana restore, shield, buff) ──
            this._applyPlayerEffect(card);

            // Remove consumed buff AFTER card effect completes
            if (buffResult.consumed && buffResult.buff?.name) {
                console.log(`[Hand] Removing buff ${buffResult.buff.name} after self-targeted card`);
                this.effectManager.removeConsumedBuff(buffResult.buff.name, 'player');
            }
        } else {
            // ── Enemy-targeted card (damage, DoT, stacking effects) ──
            // Route through each card's own executeEffect so that DoT effects
            // (Whirlpool, Overgrowth, Ignite, Magma, etc.) get registered.
            if (this.gameState.enemy) {
                // Apply buff effects to card if applicable
                if (buffResult.consumed) {
                    console.log(`[Hand] Applying buff to card ${card.name}: multiplier=${buffResult.damageMultiplier}, guaranteedCrit=${buffResult.guaranteedCrit}`);
                    if (buffResult.guaranteedCrit) {
                        // Override card's crit chance for guaranteed crit
                        card._originalCritChance = card.critChance;
                        card.critChance = 1.0;
                    }
                    // Store damage multiplier for card to use
                    card._activeDamageMultiplier = buffResult.damageMultiplier;
                }

                const result = card.executeEffect(this.gameState, this.gameState.enemy);

                // Remove consumed buff AFTER card effect completes
                if (buffResult.consumed && buffResult.buff?.name) {
                    console.log(`[Hand] Removing buff ${buffResult.buff.name} after enemy-targeted card`);
                    this.effectManager.removeConsumedBuff(buffResult.buff.name, 'player');
                }

                // Restore original crit chance if overridden
                if (buffResult.guaranteedCrit && card._originalCritChance !== undefined) {
                    card.critChance = card._originalCritChance;
                    delete card._originalCritChance;
                }
                if (card._activeDamageMultiplier !== undefined) {
                    delete card._activeDamageMultiplier;
                }

                if (!result?.success) {
                    // Refund mana — card effect failed (e.g. effect already active)
                    this.gameState.updatePlayerMana(this.gameState.playerMana + card.cost);
                    
                    // Revert buff consumption if card effect failed
                    if (buffResult.consumed && buffResult.buff) {
                        buffResult.buff.consumed = false;
                        console.log(`Buff ${buffResult.buff.name} reverted (card effect failed)`);
                    }
                    
                    console.warn(`${card.name} effect failed (${result?.reason || 'unknown'}). Mana refunded.`);
                    this.addVisualFeedback(card, 'failure');
                    return;
                }

                // Sync enemy HP after card effect
                this._syncEnemyHP();

                const damageDealt = result.damage || 0;
                const isCrit     = result.isCriticalHit || false;

                console.log(
                    `Attack Used — ${card.name} dealt ${damageDealt} damage` +
                    `${isCrit ? ' (CRIT!)' : ''}` +
                    ` | Enemy HP: ${this.gameState.enemyHp}/${this.gameState.enemyMaxHp}` +
                    (result.statusEffects?.length ? ` | DoT applied: ${result.statusEffects.map(e => e.name).join(', ')}` : '') +
                    (buffResult.consumed ? ` | Buff consumed: ${buffResult.buff?.name}` : '')
                );

                // Show HUD damage feedback and update all values
                if (this.hud) {
                    this.hud.showDamageFeedback(damageDealt, 'enemy', isCrit);
                    this.hud.updateAll();
                }

                // Flash the enemy graphic
                const enemyArea = document.getElementById('enemy-area');
                if (enemyArea) {
                    enemyArea.classList.remove('hit');
                    void enemyArea.offsetWidth;
                    enemyArea.classList.add('hit');
                    setTimeout(() => enemyArea.classList.remove('hit'), 400);
                }

                // Check if enemy is dead from initial hit
                if (this.gameState.enemyHp <= 0) {
                    this._handleEnemyDeath();
                    this.removeCard(card);
                    return;
                }
            }
        }

        // Remove card from hand after use
        this.removeCard(card);

        // Visual feedback + refresh affordability
        this.addVisualFeedback(card, 'success');
        this.updateCardAffordability();
    }

    /**
     * Applies a self-targeted card effect to the player.
     * Handles heal, heal_over_time, heal_and_buff, mana_restore,
     * shield, shield_and_buff, damage_buff, and damage_reduction types.
     * @param {Object} card - The card being played
     */
    _applyPlayerEffect(card) {
        const type = card.effect?.type || 'unknown';
        const hpBefore   = this.gameState.playerHp;
        const manaBefore = this.gameState.playerMana;

        console.log(
            `[Hand] Self-effect triggered — ${card.name} (ID: ${card.id})`,
            `| type: ${type}`,
            `| cost: ${card.cost}`,
            `| HP before: ${hpBefore}/${this.gameState.playerMaxHp}`,
            `| Mana before: ${manaBefore}/${this.gameState.playerMaxMana}`
        );

        switch (type) {
            case 'heal':
            case 'heal_and_buff': {
                const base   = card.healAmount || card.effect?.value || 5;
                const isCrit = Math.random() < (card.critChance || 0.10);
                const amount = Math.max(1, Math.floor(base * (isCrit ? 1.5 : 1) * (0.9 + Math.random() * 0.2)));
                this.gameState.updatePlayerHp(this.gameState.playerHp + amount);
                console.log(
                    `[Hand] HEAL — ${card.name}:`,
                    `base=${base}`,
                    `| rolled amount=${amount}`,
                    `| crit=${isCrit}`,
                    `| HP: ${hpBefore} → ${this.gameState.playerHp}/${this.gameState.playerMaxHp}`
                );
                if (this.hud) this.hud.showDamageFeedback(amount, 'player', isCrit);
                break;
            }

            case 'heal_over_time': {
                const perTick = card.healPerTurn || card.effect?.value || 3;
                const dur     = card.duration || 3;
                console.log(
                    `[Hand] REGEN — ${card.name}:`,
                    `+${perTick} HP per turn for ${dur} turns`,
                    `| HP: ${hpBefore}/${this.gameState.playerMaxHp}`
                );
                // Register ALL ticks (including first) to be processed at turn end
                // This ensures consistent timing and prevents double-healing
                const hotEffect = {
                    name: card.name.toLowerCase().replace(/\s+/g, '_'),
                    healPerTurn: perTick,
                    duration: dur,
                    turnsRemaining: dur, // All ticks processed at turn end
                    source: card.name,
                    type: 'heal_over_time',
                    emoji: '💚'
                };
                if (typeof this.gameState.addEffect === 'function') {
                    this.gameState.addEffect(hotEffect);
                } else {
                    this.gameState.activeEffects = this.gameState.activeEffects || [];
                    this.gameState.activeEffects.push(hotEffect);
                }
                console.log(`[Hand] REGEN registered: ${dur} ticks of +${perTick} HP/turn (processed at turn end)`);
                break;
            }

            case 'mana_restore': {
                const amount = card.manaRestore || card.effect?.value || 5;
                this.gameState.updatePlayerMana(this.gameState.playerMana + amount);
                console.log(
                    `[Hand] MANA RESTORE — ${card.name}:`,
                    `restored ${amount} mana`,
                    `| Mana: ${manaBefore} → ${this.gameState.playerMana}/${this.gameState.playerMaxMana}`,
                    `| net gain: +${this.gameState.playerMana - manaBefore}`
                );
                break;
            }

            case 'shield':
            case 'shield_and_buff': {
                const shield = card.shieldAmount || card.effect?.value || 8;
                const dur    = card.shieldDuration || card.duration || 3;
                
                // Add shield to the shield system (NOT as HP)
                const shieldName = card.name.toLowerCase().replace(/\s+/g, '_');
                this.gameState.addShield(shieldName, {
                    remaining: shield,
                    duration: dur,
                    turnsRemaining: dur
                });
                
                console.log(
                    `[Hand] SHIELD — ${card.name}:`,
                    `${shield} shield for ${dur} turns`,
                    `| Total shields:`, Object.keys(this.gameState.playerShields).join(', ')
                );
                if (this.hud) this.hud.showDamageFeedback(shield, 'player', false);
                break;
            }

            case 'damage_buff':
            case 'next_card_buff': {
                const bonus    = card.damageBonus || card.effect?.value || 0.5;
                const appliesTo = card.appliesTo || card.effect?.appliesTo || 'all';
                const prevBuff = this.gameState.activeDamageBuff || 1;
                this.gameState.activeDamageBuff = prevBuff * (1 + bonus);
                console.log(
                    `[Hand] DAMAGE BUFF — ${card.name}:`,
                    `+${(bonus * 100).toFixed(0)}% damage to [${appliesTo}]`,
                    `| multiplier: ${prevBuff.toFixed(2)} → ${this.gameState.activeDamageBuff.toFixed(2)}`,
                    `| duration: ${card.duration || 1} turn(s)`
                );
                break;
            }

            case 'damage_reduction': {
                const reduction = card.damageReduction || card.effect?.value || 0.3;
                const prevReduction = this.gameState.activeDamageReduction || 0;
                this.gameState.activeDamageReduction = Math.min(0.75, prevReduction + reduction);
                console.log(
                    `[Hand] DAMAGE REDUCTION — ${card.name}:`,
                    `+${(reduction * 100).toFixed(0)}% reduction`,
                    `| total reduction: ${(prevReduction * 100).toFixed(0)}% → ${(this.gameState.activeDamageReduction * 100).toFixed(0)}%`,
                    `| duration: ${card.duration || 3} turn(s)`,
                    `| cap: 75%`
                );
                break;
            }

            default:
                console.warn(
                    `[Hand] UNKNOWN self-effect — ${card.name} (type: "${type}")`,
                    `| effect object:`, card.effect
                );
                break;
        }

        console.log(
            `[Hand] Self-effect complete — ${card.name}`,
            `| HP: ${hpBefore} → ${this.gameState.playerHp}`,
            `| Mana: ${manaBefore} → ${this.gameState.playerMana}`,
            `| activeDamageBuff: ${this.gameState.activeDamageBuff ?? 'none'}`,
            `| activeDamageReduction: ${this.gameState.activeDamageReduction ?? 'none'}`
        );

        if (this.hud) this.hud.updateAll();
        this.updateCardAffordability();
    }
    
    /**
     * Adds visual feedback to a card
     * 
     * @param {Object} card - The card to add feedback to
     */
    addVisualFeedback(card, type = 'success') {
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        if (cardElement) {
            const cls = type === 'success' ? 'feedback-success' : 'feedback-failure';
            cardElement.classList.add(cls);
            setTimeout(() => cardElement.classList.remove(cls), 600);
        }
    }
    
    /**
     * Re-evaluates playable/unplayable classes for all cards in hand
     * based on current mana. Call this whenever mana changes.
     */
    updateCardAffordability() {
        // Use HandUI if available
        if (this.handUI) {
            this.handUI.refreshAllCardVisuals();
        } else {
            // Fallback: direct DOM manipulation
            this.cards.forEach(card => {
                const el = document.querySelector(`[data-card-id="${card.id}"]`);
                if (!el) return;
                if (card.canPlay(this.gameState)) {
                    el.classList.add('playable');
                    el.classList.remove('unplayable');
                } else {
                    el.classList.add('unplayable');
                    el.classList.remove('playable');
                }
            });
        }
    }

    /**
     * Draws a card from the deck
     *
     * @returns {Object|null} The drawn card or null if no cards available
     */
    drawCard() {
        // Use CardPileManager if available
        if (this.cardPileManager) {
            const drawResult = this.cardPileManager.drawCard(1);

            if (drawResult.success) {
                // Sync legacy cards array
                this.cards = this.cardPileManager.getHand();

                // Render the new card
                if (drawResult.cards.length > 0) {
                    const newCard = drawResult.cards[0];
                    this.renderCard(newCard);
                    console.log(`[Hand] Drew: ${newCard.name} (${drawResult.drawPileRemaining} remaining)`);
                    return newCard;
                }
            } else {
                console.warn(`[Hand] Could not draw: ${drawResult.reason}`);
                return null;
            }
        }

        // Fallback: legacy behavior
        if (!this.gameState.deck || this.gameState.deck.length === 0) {
            console.warn('Cannot draw card: deck is empty');

            if (this.cards.length === 0 && this.gameState.discardPile?.length > 0) {
                console.log('Reshuffling discard pile into new deck...');
                this.gameState.deck = [...this.gameState.discardPile];
                this.gameState.discardPile = [];
                this._shuffleDeck(this.gameState.deck);
            } else {
                console.log('Creating new deck...');
                this.gameState.deck = this._createCombinedDeck();
                this._shuffleDeck(this.gameState.deck);
            }
        }

        const newCard = this.gameState.deck.pop();
        this.addCard(newCard);

        console.log(`Card drawn: ${newCard.name} (${this.gameState.deck.length} cards remaining)`);
        return newCard;
    }
    
    /**
     * Discards a card from the hand
     * 
     * @param {Object} card - The card to discard
     */
    discardCard(card) {
        // Remove from hand
        this.removeCard(card);
        
        // Add to discard pile
        card.isDiscarded = true;
        this.gameState.discardPile.push(card);
        
        console.log(`Card discarded: ${card.name}`);
    }
    
    /**
     * Updates the hand display
     */
    updateDisplay() {
        // Clear current hand
        if (this.handContainer) {
            this.handContainer.innerHTML = '';
        }

        // Render all cards in hand
        this.cards.forEach(card => {
            this.renderCard(card);
        });

        console.log(`Hand display updated with ${this.cards.length} cards`);
    }
    
    /**
     * Initializes the end turn button
     */
    initEndTurnButton() {
        const endTurnBtn = document.getElementById('end-turn-btn');
        if (endTurnBtn) {
            endTurnBtn.addEventListener('click', () => this.endTurn());
            console.log('End Turn button initialized');
        } else {
            console.warn('End Turn button not found in DOM');
        }
    }

    /**
     * Processes all active DoT / HoT / buff effects at the end of each turn.
     * Delegates to EffectManager for centralized processing.
     * Called by endTurn() before advancing the turn.
     */
    _processActiveEffects() {
        const results = this.effectManager.processAllEffects();

        // Log all active effects for debugging
        this.effectManager.logAllEffects(`Turn ${this.gameState.turnCount} End`);

        // Update HUD if there were any changes
        if ((results.playerEffects?.length || results.enemyEffects?.length) && this.hud) {
            this.hud.updateAll();
        }

        return results;
    }

    /**
     * Syncs enemy HP between gameState.enemyHp and gameState.enemy.hp
     * This ensures consistency across the game state
     */
    _syncEnemyHP() {
        if (this.gameState.enemy && this.gameState.enemy.hp !== undefined) {
            this.gameState.enemy.hp = this.gameState.enemyHp;
        }
    }

    /**
     * Centralised enemy-death handler — keeps victory logic in one place.
     */
    _handleEnemyDeath() {
        console.log('Enemy defeated!');
        this.gameState.isGameOver = false;
        this.gameState.gameOverReason = null;
        if (this.hud) this.hud.showVictory();
        if (this.saveSystem) this.saveSystem.saveWin();
        const roundResult = window.survivorMode?.completeRound?.();
        if (this.gameOverScreen?.showRoundVictory && roundResult?.completeResult) {
            setTimeout(() => this.gameOverScreen.showRoundVictory(roundResult.completeResult), 400);
        }

        this.gameState.updatePlayerHp(this.gameState.playerMaxHp);
        this.gameState.updatePlayerMana(this.gameState.playerMaxMana);
        if (this.hud) this.hud.updateAll();
    }

    _handlePlayerDefeat() {
        console.log('Player defeated!');
        this.gameState.isGameOver = true;
        this.gameState.gameOverReason = 'player_loss';
        if (this.hud) this.hud.showDefeat();
        const defeatInfo = window.survivorMode?.onPlayerDefeat?.();
        if (this.gameOverScreen?.showDefeat) {
            setTimeout(() => this.gameOverScreen.showDefeat(defeatInfo), 400);
        }
    }

    _buildPlayerProxy() {
        return {
            takeDamage: (damage, attackInfo = {}) => {
                return this._applyEnemyDamage(damage, attackInfo);
            }
        };
    }

    _applyEnemyDamage(damage, attackInfo = {}) {
        const reduction = this.gameState.activeDamageReduction || 0;
        const rawDamage = Math.max(0, Math.floor(damage));
        let remainingDamage = rawDamage;

        // Apply enemy damage reduction debuffs (FrostBite, etc.)
        const enemyReduction = this.effectManager.getEnemyDamageReduction();
        if (enemyReduction > 0) {
            remainingDamage = Math.floor(remainingDamage * (1 - enemyReduction));
            console.log(`[Enemy Debuff] Damage reduced by ${Math.round(enemyReduction * 100)}%: ${rawDamage} → ${remainingDamage}`);
        }

        // Check for FrostBite damage reduction stacks on enemy
        // FrostBite reduces enemy damage by 10% per stack, max 5 stacks = 50%
        let frostBiteReduction = 0;
        if (this.gameState.enemy?.activeEffects?.length) {
            const frostBiteEffect = this.gameState.enemy.activeEffects.find(
                effect => effect.name === 'frostbite' || effect.type === 'frostbite'
            );
            if (frostBiteEffect?.stacks) {
                // 10% reduction per stack, max 50%
                frostBiteReduction = Math.min(frostBiteEffect.stacks * 0.10, 0.50);
                console.log(`[FrostBite] ${frostBiteEffect.stacks} stacks: -${frostBiteReduction * 100}% enemy damage`);
            }
        }

        // Apply FrostBite reduction
        if (frostBiteReduction > 0) {
            remainingDamage = Math.floor(remainingDamage * (1 - frostBiteReduction));
        }

        // Apply player damage reduction buffs (BarkSkin, etc.)
        const playerReduction = this.effectManager.getPlayerDamageReduction();
        if (playerReduction > 0) {
            remainingDamage = Math.floor(remainingDamage * (1 - playerReduction));
            console.log(`[Player Buff] Damage reduced by ${Math.round(playerReduction * 100)}%: ${rawDamage} → ${remainingDamage}`);
        }

        // Use the new shield absorption system
        const shieldResult = this.gameState.absorbDamage(remainingDamage);
        remainingDamage = shieldResult.remainingDamage;
        
        if (shieldResult.absorbed > 0) {
            console.log(`[Shield] Total absorbed: ${shieldResult.absorbed}, remaining: ${remainingDamage}`);
        }

        // Apply retaliation damage from shields (FireWall, etc.)
        if (shieldResult.retaliationDamage > 0 && this.gameState.enemy) {
            this.gameState.updateEnemyHp(this.gameState.enemyHp - shieldResult.retaliationDamage);
            if (this.gameState.enemy.hp !== undefined) {
                this.gameState.enemy.hp = this.gameState.enemyHp;
            }
            console.log(`[Shield Retaliation] ${shieldResult.retaliationDamage} damage dealt to ${this.gameState.enemy.name}`);
            if (this.hud) this.hud.showDamageFeedback(shieldResult.retaliationDamage, 'enemy', false);
        }

        // Apply final damage to player HP
        const finalDamage = Math.max(0, Math.floor(remainingDamage * (1 - reduction)));
        this.gameState.updatePlayerHp(this.gameState.playerHp - finalDamage);
        this.gameState.lastDamageTaken = finalDamage;
        this.gameState.isCriticalHit = !!attackInfo.isCriticalHit;

        // Reflect damage back to enemy (from shields and effects)
        let reflectDamage = 0;

        // Check effect-based reflection (Thorns - flat damage)
        if (this.gameState.activeEffects?.length && this.gameState.enemy) {
            for (const fx of this.gameState.activeEffects) {
                if (fx.type === 'reflection' && fx.reflectDamage) {
                    reflectDamage += fx.reflectDamage;
                }
            }
        }

        // Check shield-based reflection (FlameShield - percentage)
        if (this.gameState.playerShields?.flame_shield?.reflectPercent && finalDamage > 0) {
            reflectDamage += Math.floor(finalDamage * this.gameState.playerShields.flame_shield.reflectPercent);
            console.log(`[Reflect] FlameShield reflects ${reflectDamage} damage`);
        }

        if (reflectDamage > 0 && this.gameState.enemy) {
            this.gameState.updateEnemyHp(this.gameState.enemyHp - reflectDamage);
            if (this.gameState.enemy.hp !== undefined) {
                this.gameState.enemy.hp = this.gameState.enemyHp;
            }
            console.log(`[Reflect] ${reflectDamage} damage reflected to ${this.gameState.enemy.name}`);
            if (this.hud) this.hud.showDamageFeedback(reflectDamage, 'enemy', false);
        }

        if (this.hud) {
            this.hud.showDamageFeedback(finalDamage, 'player', !!attackInfo.isCriticalHit);
            this.hud.updateAll();
        }

        return {
            success: true,
            damageTaken: finalDamage,
            remainingHp: this.gameState.playerHp,
            isDead: this.gameState.playerHp <= 0,
            reflected: reflectDamage
        };
    }

    _performEnemyAttack() {
        const enemy = this.gameState.enemy;
        if (!enemy || !enemy.isAlive) {
            return;
        }

        // Check for crowd control effects that skip enemy turn
        const ccEffects = ['stun', 'freeze', 'entangled', 'paralyzed', 'sleep', 'rooted'];
        const hasCC = enemy.activeEffects?.some(
            effect => ccEffects.includes(effect.name.toLowerCase())
        );

        // Also check legacy isStunned flag
        if (enemy.isStunned || hasCC) {
            // Find the CC effect
            const ccEffect = enemy.activeEffects?.find(
                effect => ccEffects.includes(effect.name.toLowerCase())
            );

            if (ccEffect) {
                console.log(`${enemy.name} is affected by ${ccEffect.name} and skips the attack.`);
            } else {
                console.log(`${enemy.name} is stunned and skips the attack.`);
                enemy.isStunned = false;
            }
            return;
        }

        // Check for miss chance effects (Roots, MushroomCloud, Whirlpool)
        let missChance = 0;
        if (enemy.activeEffects?.length) {
            for (const effect of enemy.activeEffects) {
                // Roots: 50% miss chance
                if (effect.name === 'rooted' && effect.missChance) {
                    missChance += effect.missChance;
                    console.log(`[Rooted] ${Math.round(effect.missChance * 100)}% miss chance`);
                }
                // MushroomCloud: accuracy reduction
                if (effect.name === 'spore_cloud' && effect.accuracyReduction) {
                    missChance += effect.accuracyReduction;
                    console.log(`[Spore Cloud] ${Math.round(effect.accuracyReduction * 100)}% miss chance`);
                }
                // Whirlpool and other miss chance effects
                if (effect.missChance && effect.name !== 'rooted') {
                    missChance += effect.missChance;
                }
            }
        }

        // Cap miss chance at 75%
        missChance = Math.min(missChance, 0.75);

        // Roll for miss
        if (missChance > 0 && Math.random() < missChance) {
            console.log(`${enemy.name}'s attack missed! (Miss chance: ${missChance * 100}%)`);
            this._logStatusSnapshot('enemy_attack_missed');
            return;
        }

        let result = null;
        if (typeof enemy.performAction === 'function') {
            result = enemy.performAction(this.gameState);
        } else if (typeof enemy.attack === 'function') {
            result = enemy.attack(this.gameState);
        }

        if (result?.damage !== undefined && result.damageTaken === undefined) {
            this._applyEnemyDamage(result.damage, { isCriticalHit: result.isCriticalHit });
        }

        if (this.gameState.playerHp <= 0 && !this.gameState.isGameOver) {
            this._handlePlayerDefeat();
        }
        this._logStatusSnapshot('enemy_attack');
    }

    _formatEffectList(effects) {
        if (!effects || effects.length === 0) {
            return 'none';
        }

        return effects.map(effect => {
            const name = effect.name || 'unknown';
            const turns = effect.turnsRemaining ?? effect.duration;
            const stacks = effect.stacks ? ` x${effect.stacks}` : '';
            const time = turns !== undefined ? ` (${turns}t)` : '';
            return `${name}${stacks}${time}`;
        }).join(', ');
    }

    _logStatusSnapshot(label) {
        const playerEffects = this._formatEffectList(this.gameState.activeEffects);
        const enemyEffects = this._formatEffectList(this.gameState.enemy?.activeEffects);
        const playerBuffs = {
            damageBuff: this.gameState.activeDamageBuff,
            damageReduction: this.gameState.activeDamageReduction
        };
        const enemyStatus = {
            stunned: this.gameState.enemy?.isStunned || false,
            poisoned: this.gameState.enemy?.isPoisoned || false
        };

        console.log(
            `[Status] ${label} | Player HP ${this.gameState.playerHp}/${this.gameState.playerMaxHp}`,
            `| Player effects: ${playerEffects}`,
            `| Buffs:`, playerBuffs,
            `| Enemy ${this.gameState.enemy?.name || 'Enemy'} HP ${this.gameState.enemyHp}/${this.gameState.enemyMaxHp}`,
            `| Enemy effects: ${enemyEffects}`,
            `| Debuffs:`, enemyStatus
        );
    }

    endTurn() {
        console.log('Ending turn...');

        // Tick DoT / HoT effects before the new turn's energy is granted
        this._processActiveEffects();

        // Sync enemy HP after DoT ticks
        this._syncEnemyHP();

        // Check if DoT killed the enemy
        if (this.gameState.enemyHp <= 0 && !this.gameState.isGameOver) {
            this._handleEnemyDeath();
            return;
        }

        // Enemy turn + cooldown model: CD ticks once per full round (player+enemy)
        if (!this.gameState.isGameOver) {
            const interval = this.gameState.enemyAttackInterval || 1;
            let cooldown = this.gameState.enemyAttackCooldown ?? interval;

            // Enemy acts when CD hits 0 on their turn (CD=1 means attack now)
            if (cooldown <= 1) {
                this.gameState.enemyAttackCooldown = 0;
                if (this.hud) this.hud.updateAll();
                this._performEnemyAttack();
                cooldown = interval;
            } else {
                cooldown -= 1;
            }

            this.gameState.enemyAttackCooldown = cooldown;
            if (this.hud) this.hud.updateAll();
        }

        this._logStatusSnapshot('end_turn');

        // End current turn and start next (this will reset energy)
        if (this.gameState.turnManager) {
            this.gameState.turnManager.endTurn();
            this.gameState.turnManager.startTurn();
            if (this.hud) this.hud.updateAll(); // refresh energy bar + turn counter
        }
        this.updateCardAffordability();

        // Visual feedback on button
        const endTurnBtn = document.getElementById('end-turn-btn');
        if (endTurnBtn) {
            endTurnBtn.textContent = 'Turn Ended ✓';
            endTurnBtn.disabled = true;

            setTimeout(() => {
                endTurnBtn.textContent = 'End Turn';
                endTurnBtn.disabled = false;
            }, 1000);
        }

        console.log(`Turn ended. Now on turn ${this.gameState.turn}`);
    }
}

/**
 * Initializes the Hand and returns the instance
 *
 * @param {Object} gameState - The game state object
 * @returns {Hand} The initialized Hand instance
 */
export function initializeHand(gameState, hud, saveSystem, gameOverScreen) {
    const hand = new Hand(gameState, hud, saveSystem, gameOverScreen);
    hand.initHand();
    hand.initEndTurnButton();
    console.log('Hand initialized successfully');
    return hand;
}