/**
 * CombatNode Class for Emoji Card Battle
 *
 * Represents a normal combat encounter node on the map.
 * Player fights a standard enemy and receives gold/card reward on victory.
 *
 * @module map/nodes/CombatNode
 */

import { MapNode, NodeType, NodeIcon, NodeColor } from '../MapNode.js';

/**
 * CombatNode Class
 *
 * @extends MapNode
 *
 * @example
 * const combatNode = new CombatNode(5, 3, 200, 150);
 * combatNode.setEnemy(goblinEnemy);
 * combatNode.enter(player);
 */
export class CombatNode extends MapNode {
    /**
     * Creates a new CombatNode instance
     *
     * @param {number} id - Unique node identifier
     * @param {number} floor - Floor number
     * @param {number} x - X position on map
     * @param {number} y - Y position on map
     */
    constructor(id, floor, x, y) {
        super(id, NodeType.COMBAT, floor, x, y);

        /**
         * @type {Object|null}
         * @description Enemy to fight
         */
        this.enemy = null;

        /**
         * @type {string}
         * @description Enemy type/name
         */
        this.enemyType = 'random';

        /**
         * @type {number}
         * @description Gold reward (80-120 typical)
         */
        this.goldReward = 0;

        /**
         * @type {number}
         * @description Card reward options (3 cards to choose from)
         */
        this.cardRewardCount = 3;

        /**
         * @type {boolean}
         * @description Whether combat is in progress
         */
        this.combatInProgress = false;

        console.log(`[CombatNode] Created at floor ${floor}`);
    }

    /**
     * Sets the enemy for this combat
     *
     * @param {Object} enemy - Enemy instance
     */
    setEnemy(enemy) {
        this.enemy = enemy;
        this.enemyType = enemy.name || 'Unknown Enemy';
        console.log(`[CombatNode] Enemy set: ${this.enemyType}`);
    }

    /**
     * Sets the gold reward
     *
     * @param {number} gold - Gold amount
     */
    setGoldReward(gold) {
        this.goldReward = gold;
        this.reward = { gold };
        console.log(`[CombatNode] Gold reward set: ${gold}`);
    }

    /**
     * Overrides enter to start combat
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

        if (!this.enemy) {
            console.warn('[CombatNode] No enemy set!');
            return {
                success: false,
                reason: 'no_enemy',
                message: 'No enemy configured for this combat'
            };
        }

        this.combatInProgress = true;

        return {
            ...enterResult,
            combat: true,
            enemy: this.enemy,
            enemyType: this.enemyType,
            message: `A wild ${this.enemyType} appears!`
        };
    }

    /**
     * Completes the combat node
     *
     * @override
     * @param {Object} result - Combat result (win/loss)
     * @returns {Object} Complete result
     */
    complete(result) {
        if (!result || !result.victory) {
            return {
                success: false,
                reason: 'defeat',
                message: 'Defeated in combat!'
            };
        }

        this.combatInProgress = false;

        // Set reward
        this.reward = {
            gold: this.goldReward,
            cardOptions: this.cardRewardCount
        };

        return super.complete({
            victory: true,
            reward: this.reward,
            enemyDefeated: this.enemyType
        });
    }

    /**
     * Gets display name with enemy info
     *
     * @override
     * @returns {string} Display name
     */
    getDisplayName() {
        return `${this.getIcon()} ${this.enemyType || 'Combat'} (Floor ${this.floor})`;
    }

    /**
     * Gets description with enemy info
     *
     * @override
     * @returns {string} Description
     */
    getDescription() {
        if (this.enemyType && this.enemyType !== 'random') {
            return `Battle: ${this.enemyType} | Reward: ${this.goldReward} gold`;
        }
        return 'Face a random enemy in combat';
    }

    /**
     * Serializes combat node
     *
     * @override
     * @returns {Object} Serialized data
     */
    serialize() {
        const data = super.serialize();
        data.enemyType = this.enemyType;
        data.goldReward = this.goldReward;
        data.cardRewardCount = this.cardRewardCount;
        data.combatInProgress = this.combatInProgress;
        return data;
    }
}

export default CombatNode;
