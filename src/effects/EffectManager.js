/**
 * Effect Manager Module for Emoji Card Battle
 *
 * This module provides centralized management for all active effects in the game.
 * It handles:
 * - Damage over time (DoT) effects (burn, poison, etc.)
 * - Healing over time (HoT) effects (regen, lifebloom, etc.)
 * - Delayed damage effects (magma, wild growth)
 * - Buffs and debuffs
 * - Crowd control effects (stun, freeze, root)
 * - Shield and absorption effects
 *
 * @module effects/EffectManager
 */

import { cardKeeper, buildEffectLog } from '../core/cardKeeper.js';

/**
 * Effect Type Constants
 */
export const EffectType = {
    DAMAGE_OVER_TIME: 'damage_over_time',
    HEAL_OVER_TIME: 'heal_over_time',
    DELAYED_ERUPTION: 'delayed_eruption',
    STACKING_BURN: 'stacking_burn',
    NATURE_DOT: 'nature_dot',
    CROWD_CONTROL: 'crowd_control',
    DAMAGE_BUFF: 'damage_buff',
    DAMAGE_REDUCTION: 'damage_reduction',
    SHIELD: 'shield',
    ABSORPTION: 'absorption',
    REFLECTION: 'reflection',
    NEXT_CARD_BUFF: 'next_card_buff'
};

/**
 * Buff consumption result
 * @typedef {Object} BuffConsumptionResult
 * @property {boolean} consumed - Whether a buff was consumed
 * @property {Object|null} buff - The consumed buff object
 * @property {number} damageMultiplier - Damage multiplier from buffs
 * @property {boolean} guaranteedCrit - Whether buff grants guaranteed crit
 */

/**
 * EffectManager Class
 *
 * Centralized manager for all active effects in the game.
 * Provides consistent processing, expiration, and cleanup of effects.
 */
export class EffectManager {
    /**
     * Creates a new EffectManager instance
     * @param {Object} gameState - Reference to the game state object
     */
    constructor(gameState) {
        this.gameState = gameState;
        this.hud = null;
        console.log('[EffectManager] Initialized');
    }

    /**
     * Sets the HUD reference for visual feedback
     * @param {Object} hud - HUD instance
     */
    setHUD(hud) {
        this.hud = hud;
    }

    /**
     * Processes all active effects at turn end
     * Handles DoT, HoT, delayed damage, and buff expiration
     *
     * @returns {Object} Processing results
     */
    processAllEffects() {
        const results = {
            playerEffects: [],
            enemyEffects: [],
            totalDamageDealt: 0,
            totalHealingDone: 0
        };

        // Process player effects (HoT, shields, buffs)
        results.playerEffects = this._processPlayerEffects();

        // Process enemy effects (DoT, debuffs, CC)
        results.enemyEffects = this._processEnemyEffects();

        return results;
    }

    /**
     * Processes all player-side effects
     * @private
     * @returns {Array} Array of effect processing results
     */
    _processPlayerEffects() {
        const gs = this.gameState;
        const results = [];

        if (!gs.activeEffects?.length) {
            return results;
        }

        const remaining = [];

        for (const fx of gs.activeEffects) {
            let result = null;

            // Heal-over-time (Regen, Regrow, Lifebloom)
            if (fx.healPerTurn && fx.healPerTurn > 0) {
                result = this._processHealOverTime(fx);
            }
            // Delayed eruption (Magma pool)
            else if (fx.type === EffectType.DELAYED_ERUPTION) {
                result = this._processDelayedEruption(fx);
            }

            if (result) {
                results.push(result);
            }

            // Decrement turns and keep if still active
            fx.turnsRemaining = (fx.turnsRemaining || 1) - 1;
            if (fx.turnsRemaining > 0) {
                remaining.push(fx);
            } else {
                console.log(`[Effect] ${fx.name} expired`);
                cardKeeper('effect_expired', {
                    target: 'player',
                    effect: buildEffectLog(fx)
                });
            }
        }

        gs.activeEffects = remaining;
        return results;
    }

    /**
     * Processes all enemy-side effects
     * @private
     * @returns {Array} Array of effect processing results
     */
    _processEnemyEffects() {
        const gs = this.gameState;
        const results = [];

        if (!gs.enemy?.activeEffects?.length) {
            // Debug: log if enemy has no effects
            if (gs.enemy) {
                console.log('[EffectManager] Enemy has no activeEffects array or it is empty');
            }
            return results;
        }

        const remaining = [];

        console.log(`[EffectManager] Processing ${gs.enemy.activeEffects.length} enemy effects:`, 
            gs.enemy.activeEffects.map(e => `${e.name} (${e.type})`).join(', '));

        for (const fx of gs.enemy.activeEffects) {
            let result = null;

            console.log(`[EffectManager] Checking effect: ${fx.name}, type=${fx.type}, currentDamage=${fx.currentDamage}, growthMultiplier=${fx.growthMultiplier}, damagePerTick=${fx.damagePerTick}`);

            // Delayed eruption (Magma) - check FIRST (most specific)
            if (fx.type === EffectType.DELAYED_ERUPTION && fx.currentDamage) {
                console.log(`[EffectManager] MATCH: Delayed Eruption (Magma)`);
                result = this._processDelayedEruption(fx);
            }
            // Nature DoT with growth (WildGrowth) - check FIRST (most specific)
            else if (fx.type === EffectType.NATURE_DOT && fx.currentDamage && fx.growthMultiplier) {
                console.log(`[EffectManager] MATCH: WildGrowth growing DoT`);
                result = this._processGrowingDoT(fx);
            }
            // Nature DoT (Overgrowth) - check before standard DoT
            else if (fx.type === EffectType.NATURE_DOT && fx.damagePerTick) {
                console.log(`[EffectManager] MATCH: Nature DoT`);
                result = this._processNatureDoT(fx);
            }
            // Stacking burn (Ignite)
            else if (fx.type === EffectType.STACKING_BURN) {
                console.log(`[EffectManager] MATCH: Stacking burn`);
                result = this._processStackingBurn(fx);
            }
            // Standard damage-over-time (Whirlpool) - check after nature DoT
            else if (fx.type === EffectType.DAMAGE_OVER_TIME && fx.damagePerTurn) {
                console.log(`[EffectManager] MATCH: Standard DoT`);
                result = this._processDamageOverTime(fx);
            }
            // Crowd control tick processing
            else if (fx.type === EffectType.CROWD_CONTROL) {
                console.log(`[EffectManager] MATCH: Crowd control`);
                result = this._processCrowdControl(fx);
            }
            else {
                console.log(`[EffectManager] NO MATCH for effect: ${fx.name}, type=${fx.type}`);
            }

            if (result) {
                results.push(result);
            }

            // Decrement duration
            const hasTurns = fx.turnsRemaining !== undefined;
            if (hasTurns) {
                fx.turnsRemaining -= 1;
                if (fx.turnsRemaining > 0) {
                    remaining.push(fx);
                } else {
                    console.log(`[Effect] ${fx.name} expired`);
                    cardKeeper('effect_expired', {
                        target: gs.enemy.name || 'enemy',
                        effect: buildEffectLog(fx)
                    });
                }
            } else if (fx.duration !== undefined) {
                fx.duration -= 1;
                if (fx.duration > 0) {
                    remaining.push(fx);
                } else {
                    console.log(`[Effect] ${fx.name} expired`);
                }
            }
        }

        gs.enemy.activeEffects = remaining;
        console.log(`[EffectManager] After processing: ${remaining.length} effects remaining`);
        return results;
    }

    /**
     * Processes a heal-over-time effect
     * @private
     * @param {Object} effect - The HoT effect
     * @returns {Object} Processing result
     */
    _processHealOverTime(effect) {
        const gs = this.gameState;
        const heal = effect.healPerTurn;

        gs.updatePlayerHp(gs.playerHp + heal);

        console.log(
            `[HoT] ${effect.emoji || '💚'} ${effect.name}:`,
            `+${heal} HP | HP now ${gs.playerHp}/${gs.playerMaxHp}`,
            `| ${effect.turnsRemaining - 1} ticks left`
        );

        if (this.hud) {
            this.hud.showDamageFeedback(heal, 'player', false);
        }

        cardKeeper('hot_tick', {
            effect: buildEffectLog(effect),
            healing: heal
        });

        return {
            type: 'heal_over_time',
            effect: effect.name,
            healing: heal,
            target: 'player'
        };
    }

    /**
     * Processes a delayed eruption effect (Magma)
     * @private
     * @param {Object} effect - The eruption effect
     * @returns {Object} Processing result
     */
    _processDelayedEruption(effect) {
        const gs = this.gameState;
        let result = null;

        if (effect.turnsRemaining === 1) {
            // Final tick: eruption
            const eruptDmg = Math.floor(
                effect.currentDamage * (effect.eruptionMultiplier || 3)
            );
            gs.updateEnemyHp(gs.enemyHp - eruptDmg);

            console.log(`[Magma] 🌋 ERUPTION! ${eruptDmg} damage to enemy!`);

            if (this.hud) {
                this.hud.showDamageFeedback(eruptDmg, 'enemy', false);
            }

            cardKeeper('magma_eruption', {
                effect: buildEffectLog(effect),
                damage: eruptDmg
            });

            result = {
                type: 'delayed_eruption',
                effect: effect.name,
                damage: eruptDmg,
                isEruption: true,
                target: 'enemy'
            };
        } else {
            // Intermediate tick
            const tickDmg = effect.tickDamage || effect.currentDamage;
            gs.updateEnemyHp(gs.enemyHp - tickDmg);

            // Grow damage for next tick
            effect.currentDamage = Math.floor(
                effect.currentDamage * (effect.growthMultiplier || 2)
            );
            effect.tickDamage = effect.currentDamage;

            console.log(
                `[Magma] 🌋 tick: −${tickDmg} to enemy`,
                `| grows to ${effect.currentDamage}`,
                `| ${effect.turnsRemaining - 1} turns to eruption`
            );

            if (this.hud) {
                this.hud.showDamageFeedback(tickDmg, 'enemy', false);
            }

            cardKeeper('magma_tick', {
                effect: buildEffectLog(effect),
                damage: tickDmg
            });

            result = {
                type: 'delayed_eruption',
                effect: effect.name,
                damage: tickDmg,
                isEruption: false,
                target: 'enemy'
            };
        }

        return result;
    }

    /**
     * Processes a standard damage-over-time effect
     * @private
     * @param {Object} effect - The DoT effect
     * @returns {Object} Processing result
     */
    _processDamageOverTime(effect) {
        const gs = this.gameState;
        // Handle both damagePerTurn and damagePerTick, with stacking
        let dmg = effect.damagePerTurn || effect.damagePerTick || 0;

        // Apply stacking if present
        if (effect.stacks && effect.stacks > 1) {
            dmg = dmg * effect.stacks;
        }

        gs.updateEnemyHp(gs.enemyHp - dmg);

        console.log(
            `[DoT] ${effect.emoji || '💧'} ${effect.name}:`,
            `−${dmg} to enemy | HP now ${gs.enemyHp}`,
            `| ${(effect.turnsRemaining || 1) - 1} turns left` +
            (effect.stacks ? ` (${effect.stacks} stacks)` : '')
        );

        if (this.hud) {
            this.hud.showDamageFeedback(dmg, 'enemy', false);
            this.hud.updateEnemyHealthBar(); // Force immediate HP bar update
        }

        cardKeeper('dot_tick', {
            effect: buildEffectLog(effect),
            damage: dmg
        });

        return {
            type: 'damage_over_time',
            effect: effect.name,
            damage: dmg,
            stacks: effect.stacks,
            target: 'enemy'
        };
    }

    /**
     * Processes a nature DoT effect (Overgrowth)
     * @private
     * @param {Object} effect - The nature DoT effect
     * @returns {Object} Processing result
     */
    _processNatureDoT(effect) {
        const gs = this.gameState;
        const dmg = effect.damagePerTick;

        gs.updateEnemyHp(gs.enemyHp - dmg);

        console.log(
            `[DoT] ${effect.emoji || '🌿'} ${effect.name}:`,
            `−${dmg} to enemy | HP now ${gs.enemyHp}`,
            `| ${(effect.turnsRemaining || 1) - 1} turns left`
        );

        if (this.hud) {
            this.hud.showDamageFeedback(dmg, 'enemy', false);
            this.hud.updateEnemyHealthBar(); // Force immediate HP bar update
        }

        cardKeeper('dot_tick', {
            effect: buildEffectLog(effect),
            damage: dmg
        });

        return {
            type: 'nature_dot',
            effect: effect.name,
            damage: dmg,
            target: 'enemy'
        };
    }

    /**
     * Processes a growing nature DoT effect (WildGrowth)
     * @private
     * @param {Object} effect - The growing DoT effect
     * @returns {Object} Processing result
     */
    _processGrowingDoT(effect) {
        const gs = this.gameState;
        const dmg = effect.currentDamage;

        const oldHp = gs.enemyHp;
        gs.updateEnemyHp(gs.enemyHp - dmg);

        // Double damage for next tick
        effect.currentDamage = Math.floor(
            effect.currentDamage * (effect.growthMultiplier || 2)
        );

        console.log(
            `[DoT] ${effect.emoji || '🌾'} ${effect.name}:`,
            `−${dmg} to enemy (next: ${effect.currentDamage}) | HP now ${gs.enemyHp}`,
            `| ${(effect.turnsRemaining || 1) - 1} turns left`
        );

        if (this.hud) {
            this.hud.showDamageFeedback(dmg, 'enemy', false);
            this.hud.updateEnemyHealthBar(); // Force immediate HP bar update
        }

        cardKeeper('dot_tick', {
            effect: buildEffectLog(effect),
            damage: dmg,
            nextDamage: effect.currentDamage
        });

        return {
            type: 'nature_dot_growing',
            effect: effect.name,
            damage: dmg,
            nextDamage: effect.currentDamage,
            target: 'enemy'
        };
    }

    /**
     * Processes a stacking burn effect (Ignite)
     * @private
     * @param {Object} effect - The stacking burn effect
     * @returns {Object} Processing result
     */
    _processStackingBurn(effect) {
        const gs = this.gameState;
        const dmg = Math.floor(effect.burnDamage * (effect.stacks || 1));

        if (dmg > 0) {
            gs.updateEnemyHp(gs.enemyHp - dmg);

            console.log(
                `[DoT] 🔥 ${effect.name}:`,
                `−${dmg} (${effect.burnDamage}×${effect.stacks} stacks) to enemy`,
                `| HP now ${gs.enemyHp}`
            );

            if (this.hud) {
                this.hud.showDamageFeedback(dmg, 'enemy', false);
                this.hud.updateEnemyHealthBar(); // Force immediate HP bar update
            }

            cardKeeper('dot_tick', {
                effect: buildEffectLog(effect),
                damage: dmg,
                stacks: effect.stacks
            });

            return {
                type: 'stacking_burn',
                effect: effect.name,
                damage: dmg,
                stacks: effect.stacks,
                target: 'enemy'
            };
        }

        return null;
    }

    /**
     * Processes a crowd control effect
     * @private
     * @param {Object} effect - The CC effect
     * @returns {Object} Processing result
     */
    _processCrowdControl(effect) {
        console.log(
            `[CC] ${effect.emoji || '⚠️'} ${effect.name}:`,
            `${effect.turnsRemaining - 1} turns remaining`
        );

        return {
            type: 'crowd_control',
            effect: effect.name,
            turnsRemaining: effect.turnsRemaining - 1,
            target: 'enemy'
        };
    }

    /**
     * Checks if a target has a specific effect type
     * @param {string} effectName - Name of the effect to check
     * @param {string} target - 'player' or 'enemy'
     * @returns {boolean} True if effect exists
     */
    hasEffect(effectName, target = 'enemy') {
        const gs = this.gameState;

        if (target === 'player') {
            return gs.activeEffects?.some(e => e.name === effectName) || false;
        } else {
            return gs.enemy?.activeEffects?.some(e => e.name === effectName) || false;
        }
    }

    /**
     * Gets all active effects for a target
     * @param {string} target - 'player' or 'enemy'
     * @returns {Array} Array of active effects
     */
    getAllEffects(target = 'enemy') {
        const gs = this.gameState;

        if (target === 'player') {
            return gs.activeEffects || [];
        } else {
            return gs.enemy?.activeEffects || [];
        }
    }

    /**
     * Removes a specific effect by name
     * @param {string} effectName - Name of the effect to remove
     * @param {string} target - 'player' or 'enemy'
     * @returns {boolean} True if effect was removed
     */
    removeEffect(effectName, target = 'enemy') {
        const gs = this.gameState;

        if (target === 'player') {
            const index = gs.activeEffects?.findIndex(e => e.name === effectName);
            if (index !== -1) {
                gs.activeEffects.splice(index, 1);
                console.log(`[EffectManager] Removed ${effectName} from player`);
                return true;
            }
        } else {
            return gs.enemy?.removeEffect(effectName) || false;
        }

        return false;
    }

    /**
     * Clears all effects from a target
     * @param {string} target - 'player' or 'enemy'
     * @returns {number} Number of effects removed
     */
    clearAllEffects(target = 'enemy') {
        const gs = this.gameState;
        let count = 0;

        if (target === 'player') {
            count = gs.activeEffects?.length || 0;
            gs.activeEffects = [];
        } else {
            count = gs.enemy?.activeEffects?.length || 0;
            if (gs.enemy) {
                gs.enemy.activeEffects = [];
            }
        }

        console.log(`[EffectManager] Cleared ${count} effects from ${target}`);
        cardKeeper('effects_cleared', { target, count });

        return count;
    }

    /**
     * Consumes applicable buffs when a card is played
     * @param {Object} card - The card being played
     * @returns {BuffConsumptionResult} Result of buff consumption
     */
    consumeBuffsForCard(card) {
        const gs = this.gameState;
        const result = {
            consumed: false,
            buff: null,
            damageMultiplier: 1,
            guaranteedCrit: false
        };

        if (!gs.activeEffects?.length) {
            console.log('[Buff] No active effects to check for buffs');
            return result;
        }

        console.log(`[Buff] Checking for buffs applicable to card: ${card.name} (element: ${card.element})`);
        console.log('[Buff] Active effects:', gs.activeEffects.map(e => `${e.name} (${e.type}, appliesTo: ${e.appliesTo}, consumed: ${e.consumed})`).join(', '));

        // Find applicable buffs
        const applicableBuffs = gs.activeEffects.filter(fx => {
            if (fx.type !== EffectType.DAMAGE_BUFF && fx.type !== EffectType.NEXT_CARD_BUFF) {
                return false;
            }
            if (fx.consumed) {
                return false;
            }
            // Check if buff applies to this card's element or is universal
            return fx.appliesTo === card.element ||
                   fx.appliesTo === 'all' ||
                   !fx.appliesTo;
        });

        console.log(`[Buff] Found ${applicableBuffs.length} applicable buffs`);

        // Consume the first applicable buff
        for (const buff of applicableBuffs) {
            // Apply damage bonus
            if (buff.damageBonusPercent) {
                result.damageMultiplier += buff.damageBonusPercent;
            }
            if (buff.damageBonus) {
                // Flat damage bonus will be applied by the card itself
                result.damageMultiplier += buff.damageBonus / 10; // Approximate
            }

            // Apply guaranteed crit
            if (buff.guaranteedCrit) {
                result.guaranteedCrit = true;
            }

            // Mark buff as consumed (will be removed after card executes)
            buff.consumed = true;
            result.consumed = true;
            result.buff = buff;

            console.log(
                `[Buff] Consumed ${buff.name}: ` +
                `DMG multiplier: ${result.damageMultiplier}x` +
                `${result.guaranteedCrit ? ', Guaranteed Crit!' : ''}`
            );

            cardKeeper('buff_consumed', {
                buff: buildEffectLog(buff),
                card: card.name,
                damageMultiplier: result.damageMultiplier,
                guaranteedCrit: result.guaranteedCrit
            });

            // Note: Buff is marked as consumed but NOT removed yet.
            // Removal happens after card.executeEffect() completes in Hand.js
            // This allows cards to check for buff existence during execution.

            // Only consume one buff per card
            break;
        }

        return result;
    }

    /**
     * Removes a consumed buff by name (called after card executes)
     * @param {string} effectName - Name of the effect to remove
     * @param {string} target - 'player' or 'enemy'
     */
    removeConsumedBuff(effectName, target = 'player') {
        console.log(`[Buff] Removing consumed buff: ${effectName} from ${target}`);
        this.removeEffect(effectName, target);
    }

    /**
     * Gets the current damage multiplier from active buffs
     * @param {string} element - The element to check for (fire, water, nature)
     * @returns {number} Damage multiplier
     */
    getDamageMultiplier(element = 'neutral') {
        const gs = this.gameState;
        let multiplier = 1;

        if (gs.activeDamageBuff) {
            multiplier *= gs.activeDamageBuff;
        }

        if (gs.activeEffects?.length) {
            for (const fx of gs.activeEffects) {
                if ((fx.type === EffectType.DAMAGE_BUFF || fx.type === EffectType.NEXT_CARD_BUFF) &&
                    !fx.consumed &&
                    (fx.appliesTo === element || fx.appliesTo === 'all' || !fx.appliesTo)) {
                    if (fx.damageBonusPercent) {
                        multiplier *= (1 + fx.damageBonusPercent);
                    }
                }
            }
        }

        return multiplier;
    }

    /**
     * ============================================================
     * MODULAR EFFECT SYSTEM
     * ============================================================
     * Methods for applying modular effects (Stun, Draw, Discard, Buff, Debuff)
     */

    /**
     * Applies a modular effect
     * @param {Object} effect - Effect instance (StunEffect, DrawEffect, etc.)
     * @param {Object} context - Context object with gameState, hand, etc.
     * @returns {Object} Effect application result
     */
    applyEffect(effect, context) {
        if (!effect || !effect.apply) {
            console.error('[EffectManager] Invalid effect provided');
            return { success: false, error: 'invalid_effect' };
        }

        console.log(`[EffectManager] Applying modular effect: ${effect.name} (${effect.type})`);
        
        // Route to appropriate apply method based on effect type
        switch (effect.type) {
            case 'crowd_control':
                return effect.apply(context.gameState.enemy, context.gameState);
            
            case 'card_advantage':
                return effect.apply(context.gameState, context.hand);
            
            case 'card_manipulation':
                return effect.apply(context.gameState, context.hand, context.targets);
            
            case 'buff':
                return effect.apply(context.gameState);
            
            case 'debuff':
                return effect.apply(context.gameState);
            
            default:
                console.warn(`[EffectManager] Unknown effect type: ${effect.type}`);
                return { success: false, error: 'unknown_type' };
        }
    }

    /**
     * Gets all active effects for debug display
     * @param {string} target - 'player', 'enemy', or 'all'
     * @returns {Object} Debug information about active effects
     */
    getDebugInfo(target = 'all') {
        const debug = {
            player: [],
            enemy: [],
            shields: [],
            summary: {}
        };

        if (target === 'all' || target === 'player') {
            // Player effects
            if (this.gameState.activeEffects?.length) {
                for (const effect of this.gameState.activeEffects) {
                    if (effect.getDebugInfo) {
                        debug.player.push(effect.getDebugInfo());
                    } else {
                        debug.player.push({
                            name: effect.name || 'unknown',
                            type: effect.type || 'unknown',
                            turnsRemaining: effect.turnsRemaining ?? effect.duration ?? 'N/A'
                        });
                    }
                }
            }

            // Player shields
            if (this.gameState.playerShields) {
                for (const [name, shield] of Object.entries(this.gameState.playerShields)) {
                    debug.shields.push({
                        name: name,
                        remaining: shield.remaining || shield.count,
                        turnsRemaining: shield.turnsRemaining ?? shield.duration ?? 'N/A',
                        reflectPercent: shield.reflectPercent ? `${Math.round(shield.reflectPercent * 100)}%` : '0%'
                    });
                }
            }
        }

        if (target === 'all' || target === 'enemy') {
            // Enemy effects
            if (this.gameState.enemy?.activeEffects?.length) {
                for (const effect of this.gameState.enemy.activeEffects) {
                    if (effect.getDebugInfo) {
                        debug.enemy.push(effect.getDebugInfo());
                    } else {
                        debug.enemy.push({
                            name: effect.name || 'unknown',
                            type: effect.type || 'unknown',
                            turnsRemaining: effect.turnsRemaining ?? effect.duration ?? 'N/A',
                            stacks: effect.stacks ?? 0
                        });
                    }
                }
            }
        }

        // Summary
        debug.summary = {
            playerEffectCount: debug.player.length,
            enemyEffectCount: debug.enemy.length,
            shieldCount: debug.shields.length,
            enemyCooldown: this.gameState.enemyAttackCooldown ?? 0
        };

        return debug;
    }

    /**
     * Logs all active effects to console (debug helper)
     * @param {string} label - Optional label for the log
     */
    logAllEffects(label = 'Current Effects') {
        const debug = this.getDebugInfo();
        
        console.group(`[EffectManager] ${label}`);
        
        if (debug.player.length > 0) {
            console.log('📋 Player Effects:');
            for (const effect of debug.player) {
                console.log(`  ${effect.emoji || ''} ${effect.name} (${effect.type}): ${effect.description || effect.turnsRemaining} turns`);
            }
        } else {
            console.log('📋 Player Effects: (none)');
        }

        if (debug.shields.length > 0) {
            console.log('🛡️ Player Shields:');
            for (const shield of debug.shields) {
                console.log(`  ${shield.name}: ${shield.remaining} remaining, ${shield.turnsRemaining} turns, Reflect: ${shield.reflectPercent}`);
            }
        }

        if (debug.enemy.length > 0) {
            console.log('💀 Enemy Effects:');
            for (const effect of debug.enemy) {
                console.log(`  ${effect.emoji || ''} ${effect.name} (${effect.type}): ${effect.description || effect.turnsRemaining} turns${effect.stacks ? ` (${effect.stacks} stacks)` : ''}`);
            }
        } else {
            console.log('💀 Enemy Effects: (none)');
        }

        console.log(`⏱️ Enemy Cooldown: ${debug.summary.enemyCooldown}`);
        console.groupEnd();
    }

    /**
     * Gets HTML representation of effects for UI display
     * @param {string} target - 'player' or 'enemy'
     * @returns {string} HTML string
     */
    getEffectsHTML(target = 'enemy') {
        const debug = this.getDebugInfo(target);
        const effects = target === 'enemy' ? debug.enemy : debug.player;
        
        if (effects.length === 0) {
            return '<span class="no-effects">No active effects</span>';
        }

        return effects.map(effect => `
            <div class="effect-debug-row">
                <span class="effect-emoji">${effect.emoji || '❓'}</span>
                <span class="effect-name">${effect.name}</span>
                <span class="effect-turns">${effect.turnsRemaining}t</span>
            </div>
        `).join('');
    }
}

/**
 * Creates and initializes an EffectManager instance
 * @param {Object} gameState - The game state object
 * @returns {EffectManager} The created EffectManager
 */
export function createEffectManager(gameState) {
    return new EffectManager(gameState);
}
