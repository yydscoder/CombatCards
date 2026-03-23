/**
 * BossNode Class for Emoji Card Battle
 *
 * Represents a boss encounter node at the end of each act.
 * Player fights a powerful boss with unique rewards.
 *
 * @module map/nodes/BossNode
 */

import { MapNode, NodeType, NodeIcon, NodeColor } from '../MapNode.js';

/**
 * BossNode Class
 *
 * @extends MapNode
 *
 * @example
 * const bossNode = new BossNode(16, 16, 200, 100, 1);
 * bossNode.setBoss(dragonBoss);
 * bossNode.enter(player);
 */
export class BossNode extends MapNode {
    /**
     * Creates a new BossNode instance
     *
     * @param {number} id - Unique node identifier
     * @param {number} floor - Floor number (typically 15 per act)
     * @param {number} x - X position on map
     * @param {number} y - Y position on map
     * @param {number} actNumber - Act number (1-3)
     */
    constructor(id, floor, x, y, actNumber = 1) {
        super(id, NodeType.BOSS, floor, x, y);

        /**
         * @type {number}
         * @description Act number this boss belongs to
         */
        this.actNumber = actNumber;

        /**
         * @type {Object|null}
         * @description Boss enemy instance
         */
        this.boss = null;

        /**
         * @type {string}
         * @description Boss name/title
         */
        this.bossName = 'Act Boss';

        /**
         * @type {number}
         * @description Gold reward (200-400 typical)
         */
        this.goldReward = 0;

        /**
         * @type {boolean}
         * @description Whether boss is defeated
         */
        this.isDefeated = false;

        /**
         * @type {boolean}
         * @description Whether combat is in progress
         */
        this.combatInProgress = false;

        /**
         * @type {Object}
         * @description Act completion reward (relic choice)
         */
        this.actReward = null;

        console.log(`[BossNode] Created: Act ${actNumber} Boss at floor ${floor}`);
    }

    /**
     * Sets the boss for this node
     *
     * @param {Object} boss - Boss enemy instance
     */
    setBoss(boss) {
        this.boss = boss;
        this.bossName = boss.name || 'Unknown Boss';
        console.log(`[BossNode] Boss set: ${this.bossName} (Act ${this.actNumber})`);
    }

    /**
     * Sets the gold reward
     *
     * @param {number} gold - Gold amount
     */
    setGoldReward(gold) {
        this.goldReward = gold;
        console.log(`[BossNode] Gold reward set: ${gold}`);
    }

    /**
     * Overrides enter to start boss combat
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

        if (!this.boss) {
            console.warn('[BossNode] No boss set!');
            return {
                success: false,
                reason: 'no_boss',
                message: 'No boss configured for this act'
            };
        }

        this.combatInProgress = true;

        return {
            ...enterResult,
            combat: true,
            boss: true,
            actBoss: true,
            actNumber: this.actNumber,
            enemy: this.boss,
            bossName: this.bossName,
            message: `⚠️ ACT ${this.actNumber} BOSS: ${this.bossName} awaits!`
        };
    }

    /**
     * Completes the boss node
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
                message: 'Defeated by the act boss!'
            };
        }

        this.combatInProgress = false;
        this.isDefeated = true;

        // Boss rewards: gold + act completion (relic choice)
        this.reward = {
            gold: this.goldReward,
            actComplete: this.actNumber,
            relicChoice: 3, // Choose 1 of 3 relics
            actReward: this.actReward
        };

        console.log(`[BossNode] Act ${this.actNumber} Boss defeated! Gold: ${this.goldReward}`);

        return super.complete({
            victory: true,
            bossDefeated: this.bossName,
            actComplete: this.actNumber,
            reward: this.reward,
            isBoss: true
        });
    }

    /**
     * Sets the act completion reward
     *
     * @param {Object} reward - Act reward object
     */
    setActReward(reward) {
        this.actReward = reward;
        console.log(`[BossNode] Act ${this.actNumber} reward set`);
    }

    /**
     * Gets display name with boss info
     *
     * @override
     * @returns {string} Display name
     */
    getDisplayName() {
        return `${this.getIcon()} ${this.bossName} (Act ${this.actNumber})`;
    }

    /**
     * Gets description with boss info
     *
     * @override
     * @returns {string} Description
     */
    getDescription() {
        if (this.isDefeated) {
            return `${this.bossName} has been defeated! Act ${this.actNumber} complete.`;
        }
        return `ACT ${this.actNumber} BOSS: ${this.bossName} | Reward: ${this.goldReward} gold + relic choice`;
    }

    /**
     * Serializes boss node
     *
     * @override
     * @returns {Object} Serialized data
     */
    serialize() {
        const data = super.serialize();
        data.actNumber = this.actNumber;
        data.bossName = this.bossName;
        data.goldReward = this.goldReward;
        data.isDefeated = this.isDefeated;
        data.combatInProgress = this.combatInProgress;
        data.actReward = this.actReward;
        return data;
    }
}

export default BossNode;
