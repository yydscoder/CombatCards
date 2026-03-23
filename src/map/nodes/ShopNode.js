/**
 * ShopNode Class for Emoji Card Battle
 *
 * Represents a shop/merchant node on the map.
 * Player can buy cards, relics, and services with gold.
 *
 * @module map/nodes/ShopNode
 */

import { MapNode, NodeType, NodeIcon, NodeColor } from '../MapNode.js';

/**
 * ShopNode Class
 *
 * @extends MapNode
 *
 * @example
 * const shopNode = new ShopNode(10, 6, 250, 180);
 * shopNode.setInventory(cards, relics, services);
 * shopNode.enter(player);
 */
export class ShopNode extends MapNode {
    /**
     * Creates a new ShopNode instance
     *
     * @param {number} id - Unique node identifier
     * @param {number} floor - Floor number
     * @param {number} x - X position on map
     * @param {number} y - Y position on map
     */
    constructor(id, floor, x, y) {
        super(id, NodeType.SHOP, floor, x, y);

        /**
         * @type {Array<Object>}
         * @description Cards available for purchase
         */
        this.cardsForSale = [];

        /**
         * @type {Array<Object>}
         * @description Relics available for purchase
         */
        this.relicsForSale = [];

        /**
         * @type {Array<Object>}
         * @description Services available (heal, remove card, upgrade)
         */
        this.services = [];

        /**
         * @type {boolean}
         * @description Whether player is currently shopping
         */
        this.isShopping = false;

        /**
         * @type {number}
         * @description Merchant name/identifier
         */
        this.merchantName = 'Merchant';

        console.log(`[ShopNode] Created at floor ${floor}`);
    }

    /**
     * Sets the shop inventory
     *
     * @param {Array<Object>} cards - Cards for sale
     * @param {Array<Object>} relics - Relics for sale
     * @param {Array<Object>} services - Services available
     */
    setInventory(cards, relics, services) {
        this.cardsForSale = cards || [];
        this.relicsForSale = relics || [];
        this.services = services || [];

        console.log(`[ShopNode] Inventory set: ${cards?.length || 0} cards, ${relics?.length || 0} relics, ${services?.length || 0} services`);
    }

    /**
     * Generates random inventory
     *
     * @param {Object} options - Generation options
     */
    generateInventory(options = {}) {
        const cardCount = options.cards ?? 3;
        const relicCount = options.relics ?? 1;

        // Generate placeholder items (actual generation handled by ShopManager)
        for (let i = 0; i < cardCount; i++) {
            this.cardsForSale.push({
                id: `shop_card_${i}`,
                name: 'Random Card',
                cost: 50 + Math.floor(Math.random() * 100)
            });
        }

        for (let i = 0; i < relicCount; i++) {
            this.relicsForSale.push({
                id: `shop_relic_${i}`,
                name: 'Random Relic',
                cost: 100 + Math.floor(Math.random() * 150)
            });
        }

        // Default services
        this.services = [
            { id: 'heal', name: 'Heal 10 HP', cost: 50 },
            { id: 'remove_card', name: 'Remove Card', cost: 75 },
            { id: 'upgrade_card', name: 'Upgrade Card', cost: 100 }
        ];

        console.log(`[ShopNode] Generated inventory`);
    }

    /**
     * Overrides enter to start shopping
     *
     * @override
     * @param {Object} player - Player object/gameState
     * @returns {Object} Enter result
     */
    enter(player) {
        const enterResult = super.enter(player);

        if (!enterResult.success) {
            return enterResult;
        }

        // Generate inventory if empty
        if (this.cardsForSale.length === 0 && this.relicsForSale.length === 0) {
            this.generateInventory();
        }

        this.isShopping = true;

        return {
            ...enterResult,
            shop: true,
            merchant: this.merchantName,
            cards: this.cardsForSale,
            relics: this.relicsForSale,
            services: this.services,
            message: `Welcome to ${this.merchantName}'s shop!`
        };
    }

    /**
     * Player purchases an item
     *
     * @param {string} itemType - Type: 'card', 'relic', 'service'
     * @param {string} itemId - ID of item to purchase
     * @param {Object} player - Player object
     * @returns {Object} Purchase result
     */
    purchase(itemType, itemId, player) {
        if (!this.isShopping) {
            return {
                success: false,
                reason: 'not_shopping',
                message: 'Not currently shopping'
            };
        }

        let item;
        let itemArray;

        switch (itemType) {
            case 'card':
                itemArray = this.cardsForSale;
                break;
            case 'relic':
                itemArray = this.relicsForSale;
                break;
            case 'service':
                itemArray = this.services;
                break;
            default:
                return {
                    success: false,
                    reason: 'invalid_type',
                    message: 'Invalid item type'
                };
        }

        item = itemArray.find(i => i.id === itemId);

        if (!item) {
            return {
                success: false,
                reason: 'not_found',
                message: 'Item not found'
            };
        }

        // Check player has enough gold
        const playerGold = player?.gold ?? 0;
        if (playerGold < item.cost) {
            return {
                success: false,
                reason: 'insufficient_gold',
                message: `Need ${item.cost} gold, have ${playerGold}`
            };
        }

        // Complete purchase
        itemArray.splice(itemArray.indexOf(item), 1);

        console.log(`[ShopNode] Purchased ${itemType}: ${item.name} for ${item.cost} gold`);

        return {
            success: true,
            itemType,
            item,
            cost: item.cost,
            remainingGold: playerGold - item.cost
        };
    }

    /**
     * Completes the shop node (player leaves)
     *
     * @override
     * @param {Object} result - Shop result
     * @returns {Object} Complete result
     */
    complete(result) {
        this.isShopping = false;

        // Shop completion doesn't give rewards, player spends gold
        this.reward = { visited: true };

        return super.complete({
            shop: true,
            visited: true
        });
    }

    /**
     * Gets display name with merchant info
     *
     * @override
     * @returns {string} Display name
     */
    getDisplayName() {
        return `${this.getIcon()} ${this.merchantName} (Floor ${this.floor})`;
    }

    /**
     * Gets description with shop info
     *
     * @override
     * @returns {string} Description
     */
    getDescription() {
        return `${this.merchantName}: ${this.cardsForSale.length} cards, ${this.relicsForSale.length} relics, ${this.services.length} services`;
    }

    /**
     * Serializes shop node
     *
     * @override
     * @returns {Object} Serialized data
     */
    serialize() {
        const data = super.serialize();
        data.cardsForSale = this.cardsForSale;
        data.relicsForSale = this.relicsForSale;
        data.services = this.services;
        data.isShopping = this.isShopping;
        data.merchantName = this.merchantName;
        return data;
    }
}

export default ShopNode;
