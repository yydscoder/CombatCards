/**
 * EliteNode Class for Emoji Card Battle
 *
 * Represents an elite enemy encounter node on the map.
 * Player fights a powerful enemy with better rewards but higher difficulty.
 *
 * @module map/nodes/EliteNode
 */

import { MapNode, NodeType, NodeIcon, NodeColor } from '../MapNode.js';

/**
 * EliteNode Class
 *
 * @extends MapNode
 *
 * @example
 * const eliteNode = new EliteNode(12, 5, 300, 200);
 * eliteNode.setEnemy(orcChampion);
 * eliteNode.setGoldReward(150);
 */
export class EliteNode extends MapNode {
    /**
     * Creates a new EliteNode instance
     *
     * @param {number} id - Unique node identifier
     * @param {number} floor - Floor number
     * @param {number} x - X position on map
     * @param {number} y - Y position on map
     */
    constructor(id, floor, x, y) {
        super(id, NodeType.ELITE, floor, x, y);

        /**
         * @type {Object|null}
         * @description Elite enemy to fight
         */
        this.enemy = null;

        /**
         * @type {string}
         * @description Enemy type/name
         */
        this.enemyType = 'elite';

        /**
         * @type {number}
         * @description Gold reward (120-200 typical, higher than normal)
         */
        this.goldReward = 0;

        /**
         * @type {number}
         * @description Card reward options (3 cards, higher rarity)
         */
        this.cardRewardCount = 3;

        /**
         * @type {number}
         * @description Relic drop chance (0-1, typically 0.3-0.5)
         */
        this.relicDropChance = 0.4;

        /**
         * @type {boolean}
         * @description Whether combat is in progress
         */
        this.combatInProgress = false;

        console.log(`[EliteNode] Created at floor ${floor}`);
    }

    /**
     * Sets the elite enemy for this combat
     *
     * @param {Object} enemy - Enemy instance
     */
    setEnemy(enemy) {
        this.enemy = enemy;
        this.enemyType = enemy.name || 'Elite Enemy';
        console.log(`[EliteNode] Elite enemy set: ${this.enemyType}`);
    }

    /**
     * Sets the gold reward (typically higher than normal combat)
     *
     * @param {number} gold - Gold amount
     */
    setGoldReward(gold) {
        this.goldReward = gold;
        this.reward = { gold };
        console.log(`[EliteNode] Gold reward set: ${gold}`);
    }

    /**
     * Overrides enter to start elite combat
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
            console.warn('[EliteNode] No elite enemy set!');
            return {
                success: false,
                reason: 'no_enemy',
                message: 'No elite enemy configured'
            };
        }

        this.combatInProgress = true;

        return {
            ...enterResult,
            combat: true,
            elite: true,
            enemy: this.enemy,
            enemyType: this.enemyType,
            message: `⚠️ ELITE ENCOUNTER: ${this.enemyType} blocks the path!`
        };
    }

    /**
     * Completes the elite node
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
                message: 'Defeated by elite enemy!'
            };
        }

        this.combatInProgress = false;

        // Elite rewards: more gold + relic chance
        const hasRelicDrop = Math.random() < this.relicDropChance;

        this.reward = {
            gold: this.goldReward,
            cardOptions: this.cardRewardCount,
            relic: hasRelicDrop ? 1 : 0
        };

        console.log(`[EliteNode] Elite defeated! Gold: ${this.goldReward}, Relic drop: ${hasRelicDrop}`);

        return super.complete({
            victory: true,
            reward: this.reward,
            enemyDefeated: this.enemyType,
            isElite: true,
            relicDropped: hasRelicDrop
        });
    }

    /**
     * Gets display name with elite indicator
     *
     * @override
     * @returns {string} Display name
     */
    getDisplayName() {
        return `${this.getIcon()} ${this.enemyType || 'Elite'} (Floor ${this.floor})`;
    }

    /**
     * Gets description with elite info
     *
     * @override
     * @returns {string} Description
     */
    getDescription() {
        if (this.enemyType && this.enemyType !== 'elite') {
            return `ELITE: ${this.enemyType} | Reward: ${this.goldReward} gold + relic chance`;
        }
        return 'Face a powerful elite enemy (higher difficulty, better rewards)';
    }

    /**
     * Serializes elite node
     *
     * @override
     * @returns {Object} Serialized data
     */
    serialize() {
        const data = super.serialize();
        data.enemyType = this.enemyType;
        data.goldReward = this.goldReward;
        data.cardRewardCount = this.cardRewardCount;
        data.relicDropChance = this.relicDropChance;
        data.combatInProgress = this.combatInProgress;
        return data;
    }
}

export default EliteNode;
