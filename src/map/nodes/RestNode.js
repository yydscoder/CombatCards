/**
 * RestNode Class for Emoji Card Battle
 *
 * Represents a rest site/campfire node on the map.
 * Player can rest to recover HP or upgrade a card.
 *
 * @module map/nodes/RestNode
 */

import { MapNode, NodeType, NodeIcon, NodeColor } from '../MapNode.js';

/**
 * RestOptions Enum - Available rest options
 * @readonly
 * @enum {string}
 */
export const RestOption = {
    /** Rest to recover HP */
    REST: 'rest',
    /** Upgrade a card */
    UPGRADE: 'upgrade',
    /** Smith (remove card from deck) */
    SMITH: 'smith'
};

/**
 * RestNode Class
 *
 * @extends MapNode
 *
 * @example
 * const restNode = new RestNode(7, 4, 180, 220);
 * restNode.setHealAmount(30);
 * restNode.enter(player);
 */
export class RestNode extends MapNode {
    /**
     * Creates a new RestNode instance
     *
     * @param {number} id - Unique node identifier
     * @param {number} floor - Floor number
     * @param {number} x - X position on map
     * @param {number} y - Y position on map
     */
    constructor(id, floor, x, y) {
        super(id, NodeType.REST, floor, x, y);

        /**
         * @type {number}
         * @description HP recovered when resting
         */
        this.healAmount = 30;

        /**
         * @type {number}
         * @description Percentage heal (0.3 = 30% of max HP)
         */
        this.healPercentage = 0.3;

        /**
         * @type {boolean}
         * @description Whether player has rested here
         */
        this.hasRested = false;

        /**
         * @type {string}
         * @description Current rest option selected
         */
        this.selectedOption = null;

        /**
         * @type {boolean}
         * @description Whether rest site is still available
         */
        this.isAvailable = true;

        console.log(`[RestNode] Created at floor ${floor}`);
    }

    /**
     * Sets the heal amount for this rest site
     *
     * @param {number} amount - HP to restore
     * @param {boolean} [usePercentage=false] - Whether to use percentage instead
     */
    setHealAmount(amount, usePercentage = false) {
        if (usePercentage) {
            this.healPercentage = amount;
            console.log(`[RestNode] Heal percentage set: ${amount * 100}%`);
        } else {
            this.healAmount = amount;
            console.log(`[RestNode] Heal amount set: ${amount} HP`);
        }
    }

    /**
     * Calculates actual heal amount based on player max HP
     *
     * @param {Object} player - Player object
     * @returns {number} Heal amount
     */
    calculateHeal(player) {
        const maxHp = player?.maxHp ?? 100;
        const percentHeal = Math.floor(maxHp * this.healPercentage);
        return Math.max(this.healAmount, percentHeal);
    }

    /**
     * Overrides enter to offer rest options
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

        if (!this.isAvailable) {
            return {
                success: false,
                reason: 'already_used',
                message: 'This campfire has been used'
            };
        }

        const healAmount = this.calculateHeal(player);

        return {
            ...enterResult,
            rest: true,
            options: [
                { type: RestOption.REST, name: 'Rest', description: `Recover ${healAmount} HP`, value: healAmount },
                { type: RestOption.UPGRADE, name: 'Upgrade', description: 'Upgrade a card' },
                { type: RestOption.SMITH, name: 'Smith', description: 'Remove a card from deck' }
            ],
            message: 'A warm campfire. You feel safe here.'
        };
    }

    /**
     * Player chooses a rest option
     *
     * @param {string} option - Rest option chosen
     * @param {Object} player - Player object
     * @returns {Object} Choice result
     */
    chooseOption(option, player) {
        if (!this.isAvailable) {
            return {
                success: false,
                reason: 'already_used',
                message: 'This campfire has been used'
            };
        }

        this.selectedOption = option;

        let result;

        switch (option) {
            case RestOption.REST:
                result = this._rest(player);
                break;

            case RestOption.UPGRADE:
                result = this._upgrade(player);
                break;

            case RestOption.SMITH:
                result = this._smith(player);
                break;

            default:
                result = {
                    success: false,
                    reason: 'invalid_option',
                    message: 'Invalid rest option'
                };
        }

        return result;
    }

    /**
     * Rests to recover HP
     *
     * @private
     * @param {Object} player - Player object
     * @returns {Object} Rest result
     */
    _rest(player) {
        const healAmount = this.calculateHeal(player);
        const currentHp = player?.hp ?? 0;
        const maxHp = player?.maxHp ?? 100;

        const actualHeal = Math.min(healAmount, maxHp - currentHp);

        console.log(`[RestNode] Player rests and recovers ${actualHeal} HP`);

        this.hasRested = true;

        return {
            success: true,
            option: RestOption.REST,
            healAmount: actualHeal,
            newHp: currentHp + actualHeal
        };
    }

    /**
     * Upgrades a card
     *
     * @private
     * @param {Object} player - Player object
     * @returns {Object} Upgrade result
     */
    _upgrade(player) {
        console.log(`[RestNode] Player chooses to upgrade a card`);

        this.hasRested = true;

        return {
            success: true,
            option: RestOption.UPGRADE,
            upgradeAvailable: true,
            message: 'Select a card to upgrade'
        };
    }

    /**
     * Removes a card from deck (smithing)
     *
     * @private
     * @param {Object} player - Player object
     * @returns {Object} Smith result
     */
    _smith(player) {
        console.log(`[RestNode] Player chooses to smith (remove card)`);

        this.hasRested = true;

        return {
            success: true,
            option: RestOption.SMITH,
            smithAvailable: true,
            message: 'Select a card to remove from deck'
        };
    }

    /**
     * Completes the rest node
     *
     * @override
     * @param {Object} result - Rest result
     * @returns {Object} Complete result
     */
    complete(result) {
        this.isAvailable = false;
        this.hasRested = true;
        this.selectedOption = null;

        // Rest site reward is the benefit gained
        this.reward = {
            rested: true,
            option: result?.option
        };

        return super.complete({
            rest: true,
            option: result?.option,
            reward: this.reward
        });
    }

    /**
     * Gets display name with rest info
     *
     * @override
     * @returns {string} Display name
     */
    getDisplayName() {
        const status = this.isAvailable ? '' : ' (Used)';
        return `${this.getIcon()} Campfire (Floor ${this.floor})${status}`;
    }

    /**
     * Gets description with rest info
     *
     * @override
     * @returns {string} Description
     */
    getDescription() {
        if (this.isAvailable) {
            return `Rest: Recover ${this.healAmount} HP or ${this.healPercentage * 100}% max HP | Upgrade a card | Remove a card`;
        }
        return 'This campfire has been used';
    }

    /**
     * Serializes rest node
     *
     * @override
     * @returns {Object} Serialized data
     */
    serialize() {
        const data = super.serialize();
        data.healAmount = this.healAmount;
        data.healPercentage = this.healPercentage;
        data.hasRested = this.hasRested;
        data.selectedOption = this.selectedOption;
        data.isAvailable = this.isAvailable;
        return data;
    }
}

export default RestNode;
