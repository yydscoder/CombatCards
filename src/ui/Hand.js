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
import { Phoenix } from '../cards/fire/Phoenix.js';
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

import { DamageCalculator } from '../combat/DamageCalculator.js';
import { SlimeEnemy } from '../enemies/SlimeEnemy.js';

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

        // Create enemy if none exists
        if (!gameState.enemy) {
            gameState.enemy = new SlimeEnemy('Slime', 80, 12);
            gameState.enemyHp = gameState.enemy.hp;
            gameState.enemyMaxHp = gameState.enemy.maxHp;
        }
        this.handContainer = document.getElementById('hand');
        this.deckContainer = document.getElementById('deck');
        
        // Hand state
        this.cards = []; // Array of cards currently in hand
        this.maxCards = 5; // Maximum number of cards in hand
        
        // Log initialization
        console.log('Hand initialized with gameState reference');
    }
    
    /**
     * Initializes the hand with starting cards
     * Draws 3 random cards from the combined fire and water deck
     */
    initHand() {
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

        // Update playable/unplayable classes based on starting mana
        this.updateCardAffordability();

        console.log(`Hand initialized with ${this.cards.length} random cards from ${deck.length + this.cards.length} card deck`);
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
        for (let i = 0; i < 2; i++) deck.push(new Phoenix());
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
        // Check if hand is full
        if (this.cards.length >= this.maxCards) {
            console.warn(`Cannot add card: hand is full (${this.maxCards} cards)`);
            return false;
        }
        
        // Set card state to be in hand
        card.isInHand = true;
        card.isInDeck = false;
        
        // Add card to hand array
        this.cards.push(card);
        
        // Update game state
        this.gameState.hand = this.cards;
        
        // Render the card
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
        // Find card index
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

        // Remove card element from DOM
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        if (cardElement && cardElement.parentNode) {
            cardElement.parentNode.removeChild(cardElement);
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
        // Create card element (reusing CardRenderer logic)
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.cardId = card.id;
        cardElement.dataset.cardName = card.name;
        cardElement.dataset.cardType = card.constructor.name;

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
            console.warn(`Cannot play ${card.name}: not enough mana or not in hand`);
            this.addVisualFeedback(card, 'failure');
            return;
        }

        // Deduct mana
        this.gameState.updatePlayerMana(this.gameState.playerMana - card.cost);

        const effectTarget = card.effect?.target || 'enemy';

        if (effectTarget === 'self') {
            // ── Self-targeted card (heal, mana restore, shield, buff) ──
            this._applyPlayerEffect(card);
        } else {
            // ── Enemy-targeted card (damage, DoT, stacking effects) ──
            // Route through each card's own executeEffect so that DoT effects
            // (Whirlpool, Overgrowth, Ignite, Magma, etc.) get registered.
            if (this.gameState.enemy) {
                const result = card.executeEffect(this.gameState, this.gameState.enemy);

                if (!result?.success) {
                    // Refund mana — card effect failed (e.g. effect already active)
                    this.gameState.updatePlayerMana(this.gameState.playerMana + card.cost);
                    console.warn(`${card.name} effect failed (${result?.reason || 'unknown'}). Mana refunded.`);
                    this.addVisualFeedback(card, 'failure');
                    return;
                }

                // executeEffect uses gameState.updateEnemyHp(); keep enemy object in sync
                if (this.gameState.enemy.hp !== undefined) {
                    this.gameState.enemy.hp = this.gameState.enemyHp;
                }

                const damageDealt = result.damage || 0;
                const isCrit     = result.isCriticalHit || false;

                console.log(
                    `Attack Used — ${card.name} dealt ${damageDealt} damage` +
                    `${isCrit ? ' (CRIT!)' : ''}` +
                    ` | Enemy HP: ${this.gameState.enemyHp}/${this.gameState.enemyMaxHp}` +
                    (result.statusEffects?.length ? ` | DoT applied: ${result.statusEffects.map(e => e.name).join(', ')}` : '')
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
                // Apply immediate first tick
                this.gameState.updatePlayerHp(this.gameState.playerHp + perTick);
                console.log(
                    `[Hand] REGEN — ${card.name}:`,
                    `+${perTick} HP per turn for ${dur} turns`,
                    `| first tick applied now`,
                    `| HP: ${hpBefore} → ${this.gameState.playerHp}/${this.gameState.playerMaxHp}`
                );
                if (this.hud) this.hud.showDamageFeedback(perTick, 'player', false);
                // Register remaining ticks so endTurn() can process them
                if (dur > 1) {
                    const hotEffect = {
                        name: card.name.toLowerCase().replace(/\s+/g, '_'),
                        healPerTurn: perTick,
                        duration: dur,
                        turnsRemaining: dur - 1, // first tick already applied
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
                    console.log(`[Hand] REGEN registered: ${dur - 1} more ticks of +${perTick} HP/turn`);
                }
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
                this.gameState.updatePlayerHp(this.gameState.playerHp + shield);
                console.log(
                    `[Hand] SHIELD — ${card.name}:`,
                    `absorbs ${shield} damage for ${dur} turns`,
                    `| HP buffer: ${hpBefore} → ${this.gameState.playerHp}/${this.gameState.playerMaxHp}`
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

    /**
     * Draws a card from the deck
     *
     * @returns {Object|null} The drawn card or null if no cards available
     */
    drawCard() {
        // Check if deck exists and has cards
        if (!this.gameState.deck || this.gameState.deck.length === 0) {
            console.warn('Cannot draw card: deck is empty');
            
            // Reshuffle discard pile into deck if hand is empty
            if (this.cards.length === 0 && this.gameState.discardPile?.length > 0) {
                console.log('Reshuffling discard pile into new deck...');
                this.gameState.deck = [...this.gameState.discardPile];
                this.gameState.discardPile = [];
                this._shuffleDeck(this.gameState.deck);
            } else {
                // Create a new deck if everything is exhausted
                console.log('Creating new deck...');
                this.gameState.deck = this._createCombinedDeck();
                this._shuffleDeck(this.gameState.deck);
            }
        }
        
        // Draw from deck
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
     * Applies per-turn healing or damage, decrements turnsRemaining, and
     * removes expired effects.  Called by endTurn() before advancing the turn.
     */
    _processActiveEffects() {
        const gs = this.gameState;
        let anyChanged = false;

        // ── Player effects (HoT, Magma pool, damage buffs, etc.) ──────────────
        if (gs.activeEffects?.length) {
            const remaining = [];

            for (const fx of gs.activeEffects) {
                // Heal-over-time  (Regen, Regrow, Lifebloom …)
                if (fx.healPerTurn && fx.healPerTurn > 0) {
                    const heal = fx.healPerTurn;
                    gs.updatePlayerHp(gs.playerHp + heal);
                    console.log(
                        `[HoT] ${fx.emoji || '💚'} ${fx.name}:`,
                        `+${heal} HP | HP now ${gs.playerHp}/${gs.playerMaxHp}`,
                        `| ${fx.turnsRemaining - 1} ticks left`
                    );
                    if (this.hud) this.hud.showDamageFeedback(heal, 'player', false);
                    anyChanged = true;
                }

                // Delayed eruption — Magma pool grows each tick then erupts
                if (fx.type === 'delayed_eruption') {
                    if (fx.turnsRemaining === 1) {
                        // Final tick: full eruption burst
                        const eruptDmg = Math.floor(
                            fx.currentDamage * (fx.eruptionMultiplier || 3)
                        );
                        gs.updateEnemyHp(gs.enemyHp - eruptDmg);
                        console.log(`[Magma] 🌋 ERUPTION! ${eruptDmg} damage to enemy!`);
                        if (this.hud) this.hud.showDamageFeedback(eruptDmg, 'enemy', false);
                    } else {
                        // Intermediate tick: deal current damage, then grow it
                        const tickDmg = fx.tickDamage || fx.currentDamage;
                        gs.updateEnemyHp(gs.enemyHp - tickDmg);
                        fx.currentDamage = Math.floor(
                            fx.currentDamage * (fx.growthMultiplier || 1.5)
                        );
                        console.log(
                            `[Magma] 🌋 tick: −${tickDmg} to enemy`,
                            `| grows to ${fx.currentDamage}`,
                            `| ${fx.turnsRemaining - 1} turns to eruption`
                        );
                        if (this.hud) this.hud.showDamageFeedback(tickDmg, 'enemy', false);
                    }
                    anyChanged = true;
                }

                // Decrement and keep if still alive
                fx.turnsRemaining = (fx.turnsRemaining || 1) - 1;
                if (fx.turnsRemaining > 0) {
                    remaining.push(fx);
                } else {
                    console.log(`[Effect] ${fx.name} expired`);
                }
            }

            gs.activeEffects = remaining;
        }

        // ── Enemy effects (burn, DoT, debuffs) ───────────────────────────────
        if (gs.enemy?.activeEffects?.length) {
            const remaining = [];

            for (const fx of gs.enemy.activeEffects) {
                // Standard damage-over-time  (Whirlpool: damagePerTurn)
                if (fx.type === 'damage_over_time' && fx.damagePerTurn) {
                    const dmg = fx.damagePerTurn;
                    gs.updateEnemyHp(gs.enemyHp - dmg);
                    console.log(
                        `[DoT] ${fx.emoji || '💧'} ${fx.name}:`,
                        `−${dmg} to enemy | HP now ${gs.enemyHp}`,
                        `| ${(fx.turnsRemaining || 1) - 1} turns left`
                    );
                    if (this.hud) this.hud.showDamageFeedback(dmg, 'enemy', false);
                    anyChanged = true;
                }

                // Nature DoT  (Overgrowth: damagePerTick)
                if (fx.type === 'nature_dot' && fx.damagePerTick) {
                    const dmg = fx.damagePerTick;
                    gs.updateEnemyHp(gs.enemyHp - dmg);
                    console.log(
                        `[DoT] ${fx.emoji || '🌿'} ${fx.name}:`,
                        `−${dmg} to enemy | HP now ${gs.enemyHp}`,
                        `| ${(fx.turnsRemaining || 1) - 1} turns left`
                    );
                    if (this.hud) this.hud.showDamageFeedback(dmg, 'enemy', false);
                    anyChanged = true;
                }

                // Stacking burn  (Ignite: burnDamage × stacks)
                if (fx.type === 'stacking_burn') {
                    const dmg = Math.floor(fx.burnDamage * (fx.stacks || 1));
                    if (dmg > 0) {
                        gs.updateEnemyHp(gs.enemyHp - dmg);
                        console.log(
                            `[DoT] 🔥 ${fx.name}:`,
                            `−${dmg} (${fx.burnDamage}×${fx.stacks} stacks) to enemy`,
                            `| HP now ${gs.enemyHp}`
                        );
                        if (this.hud) this.hud.showDamageFeedback(dmg, 'enemy', false);
                        anyChanged = true;
                    }
                }

                // Decrement duration  (effects may use turnsRemaining or duration)
                const hasTurns = fx.turnsRemaining !== undefined;
                if (hasTurns) {
                    fx.turnsRemaining -= 1;
                    if (fx.turnsRemaining > 0) remaining.push(fx);
                    else console.log(`[Effect] ${fx.name} expired`);
                } else if (fx.duration !== undefined) {
                    fx.duration -= 1;
                    if (fx.duration > 0) remaining.push(fx);
                    else console.log(`[Effect] ${fx.name} expired`);
                }
                // if neither field exists just let the effect expire
            }

            gs.enemy.activeEffects = remaining;
        }

        if (anyChanged && this.hud) this.hud.updateAll();
    }

    /**
     * Centralised enemy-death handler — keeps victory logic in one place.
     */
    _handleEnemyDeath() {
        console.log('Enemy defeated!');
        this.gameState.isGameOver = true;
        this.gameState.gameOverReason = 'player_win';
        if (this.hud) this.hud.showVictory();
        if (this.saveSystem) this.saveSystem.saveWin();
        if (this.gameOverScreen) {
            setTimeout(() => this.gameOverScreen.showVictory(), 400);
        }
    }

    endTurn() {
        console.log('Ending turn...');

        // Tick DoT / HoT effects before the new turn's mana is granted
        this._processActiveEffects();

        // Keep enemy object HP in sync after DoT ticks
        if (this.gameState.enemy?.hp !== undefined) {
            this.gameState.enemy.hp = this.gameState.enemyHp;
        }

        // Check if DoT killed the enemy
        if (this.gameState.enemyHp <= 0 && !this.gameState.isGameOver) {
            this._handleEnemyDeath();
            return;
        }

        // Advance turn (this will also regenerate mana)
        if (this.gameState.turnManager) {
            this.gameState.turnManager.advanceTurn();
            if (this.hud) this.hud.updateAll(); // refresh mana bar + turn counter
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
        
        console.log(`Turn ended. Now on turn ${this.gameState.turnCount}`);
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