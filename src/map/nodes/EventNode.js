/**
 * EventNode Class for Emoji Card Battle
 *
 * Represents a random event node on the map.
 * Player encounters a random event with choices and outcomes.
 *
 * @module map/nodes/EventNode
 */

import { MapNode, NodeType, NodeIcon, NodeColor } from '../MapNode.js';

/**
 * Event Templates
 * @type {Array<Object>}
 */
const EVENT_TEMPLATES = [
    {
        id: 'mysterious_orb',
        title: 'Mysterious Orb',
        description: 'A glowing orb pulses with energy. Do you touch it?',
        choices: [
            { text: 'Touch it', effect: 'random_reward_or_damage' },
            { text: 'Leave it', effect: 'nothing' }
        ]
    },
    {
        id: 'lost_merchant',
        title: 'Lost Merchant',
        description: 'A merchant offers you a deal. Buy now or pass?',
        choices: [
            { text: 'Buy (50 gold)', effect: 'get_card', cost: 50 },
            { text: 'Decline', effect: 'nothing' }
        ]
    },
    {
        id: 'fountain',
        title: 'Magic Fountain',
        description: 'A fountain shimmers with magical energy.',
        choices: [
            { text: 'Drink (heal 10 HP)', effect: 'heal', value: 10 },
            { text: 'Fill flask (gain potion)', effect: 'get_potion' },
            { text: 'Leave', effect: 'nothing' }
        ]
    },
    {
        id: 'cursed_tome',
        title: 'Cursed Tome',
        description: 'An ancient book radiates dark energy.',
        choices: [
            { text: 'Read (gain curse, get relic)', effect: 'curse_for_relic' },
            { text: 'Destroy', effect: 'nothing' }
        ]
    },
    {
        id: 'golden_shrine',
        title: 'Golden Shrine',
        description: 'A shrine gleams with gold.',
        choices: [
            { text: 'Pray (gain 100 gold)', effect: 'gold', value: 100 },
            { text: 'Desecrate (fight guardian)', effect: 'combat' }
        ]
    }
];

/**
 * EventNode Class
 *
 * @extends MapNode
 *
 * @example
 * const eventNode = new EventNode(8, 4, 150, 250);
 * eventNode.setEventTemplate(EVENT_TEMPLATES[0]);
 * eventNode.enter(player);
 */
export class EventNode extends MapNode {
    /**
     * Creates a new EventNode instance
     *
     * @param {number} id - Unique node identifier
     * @param {number} floor - Floor number
     * @param {number} x - X position on map
     * @param {number} y - Y position on map
     */
    constructor(id, floor, x, y) {
        super(id, NodeType.EVENT, floor, x, y);

        /**
         * @type {Object|null}
         * @description Selected event template
         */
        this.eventTemplate = null;

        /**
         * @type {string}
         * @description Event ID
         */
        this.eventId = 'random';

        /**
         * @type {number}
         * @description Current choice index
         */
        this.currentChoice = -1;

        /**
         * @type {boolean}
         * @description Whether event is in progress
         */
        this.eventInProgress = false;

        console.log(`[EventNode] Created at floor ${floor}`);
    }

    /**
     * Sets the event template for this node
     *
     * @param {Object} template - Event template object
     */
    setEventTemplate(template) {
        this.eventTemplate = { ...template };
        this.eventId = template.id;
        console.log(`[EventNode] Event set: ${template.title}`);
    }

    /**
     * Randomizes event from templates
     */
    randomizeEvent() {
        const randomIndex = Math.floor(Math.random() * EVENT_TEMPLATES.length);
        this.setEventTemplate(EVENT_TEMPLATES[randomIndex]);
        return this.eventTemplate;
    }

    /**
     * Overrides enter to start event
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

        // Randomize event if not set
        if (!this.eventTemplate) {
            this.randomizeEvent();
        }

        this.eventInProgress = true;

        return {
            ...enterResult,
            event: true,
            eventTemplate: this.eventTemplate,
            eventId: this.eventId,
            message: this.eventTemplate.description
        };
    }

    /**
     * Makes a choice in the event
     *
     * @param {number} choiceIndex - Index of chosen option
     * @param {Object} player - Player object/gameState
     * @returns {Object} Choice result
     */
    makeChoice(choiceIndex, player) {
        if (!this.eventInProgress) {
            return {
                success: false,
                reason: 'not_in_event',
                message: 'No event in progress'
            };
        }

        if (choiceIndex < 0 || choiceIndex >= this.eventTemplate.choices.length) {
            return {
                success: false,
                reason: 'invalid_choice',
                message: 'Invalid choice'
            };
        }

        this.currentChoice = choiceIndex;
        const choice = this.eventTemplate.choices[choiceIndex];

        console.log(`[EventNode] Choice made: ${choice.text}`);

        // Apply choice effect
        const effectResult = this._applyEffect(choice.effect, choice, player);

        return {
            success: true,
            choice: choice.text,
            effect: choice.effect,
            result: effectResult
        };
    }

    /**
     * Applies the effect of a choice
     *
     * @private
     * @param {string} effect - Effect type
     * @param {Object} choice - Choice object
     * @param {Object} player - Player object
     * @returns {Object} Effect result
     */
    _applyEffect(effect, choice, player) {
        const result = { effect, applied: true };

        switch (effect) {
            case 'nothing':
                result.message = 'Nothing happens.';
                break;

            case 'heal':
                result.healAmount = choice.value || 10;
                result.message = `You heal ${result.healAmount} HP.`;
                break;

            case 'gold':
                result.goldAmount = choice.value || 50;
                result.message = `You gain ${result.goldAmount} gold!`;
                break;

            case 'get_card':
                result.cardReward = 1;
                result.message = 'You receive a card!';
                break;

            case 'get_potion':
                result.potionReward = 1;
                result.message = 'You receive a potion!';
                break;

            case 'random_reward_or_damage':
                const roll = Math.random();
                if (roll < 0.5) {
                    result.goldAmount = Math.floor(50 + Math.random() * 50);
                    result.message = `The orb glows warmly. You gain ${result.goldAmount} gold!`;
                } else {
                    result.damageAmount = Math.floor(5 + Math.random() * 10);
                    result.message = `The orb shocks you! You take ${result.damageAmount} damage.`;
                }
                break;

            case 'curse_for_relic':
                result.curse = true;
                result.relic = true;
                result.message = 'You gain a relic but also a curse...';
                break;

            case 'combat':
                result.combat = true;
                result.message = 'A guardian appears!';
                break;

            default:
                result.message = 'Unknown effect.';
        }

        return result;
    }

    /**
     * Completes the event node
     *
     * @override
     * @param {Object} result - Event result
     * @returns {Object} Complete result
     */
    complete(result) {
        this.eventInProgress = false;

        // Set reward based on event outcome
        this.reward = result?.reward || { gold: 0 };

        return super.complete({
            eventId: this.eventId,
            choice: this.currentChoice,
            reward: this.reward
        });
    }

    /**
     * Gets display name with event info
     *
     * @override
     * @returns {string} Display name
     */
    getDisplayName() {
        return `${this.getIcon()} ${this.eventTemplate?.title || 'Event'} (Floor ${this.floor})`;
    }

    /**
     * Gets description with event info
     *
     * @override
     * @returns {string} Description
     */
    getDescription() {
        if (this.eventTemplate) {
            return `${this.eventTemplate.title}: ${this.eventTemplate.description}`;
        }
        return 'Encounter a random event with choices';
    }

    /**
     * Serializes event node
     *
     * @override
     * @returns {Object} Serialized data
     */
    serialize() {
        const data = super.serialize();
        data.eventId = this.eventId;
        data.eventTemplate = this.eventTemplate;
        data.currentChoice = this.currentChoice;
        data.eventInProgress = this.eventInProgress;
        return data;
    }
}

export default EventNode;
