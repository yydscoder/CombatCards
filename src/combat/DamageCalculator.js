/**
 * Damage Calculator Module for Emoji Card Battle
 *
 * This module implements the core damage calculation logic for the game.
 * It handles all aspects of damage calculation including:
 * - Base damage calculation
 * - Defense reduction
 * - Critical hit calculation
 * - Elemental modifiers
 * - Random variation
 * - Healing calculation
 * - Shield/defense calculation
 *
 * The calculator is designed to be reusable across different combat scenarios similar to the engine component
 */

// Import configuration constants
import { GAME_CONFIG } from '../core/config.js';

/**
 * DamageCalculator class - Manages damage calculation logic
 *
 * This class encapsulates all damage calculation functionality.
 * It provides methods to calculate damage for different scenarios
 * and can be extended for more complex damage formulas.
 */
export class DamageCalculator {
    /**
     * Creates a new DamageCalculator instance
     */
    constructor() {
        // Log initialization for debugging and tracking
        console.log('DamageCalculator initialized');
    }

    /**
     * Calculates damage based on attacker and defender stats
     *
     * This method calculates the final damage amount after applying
     * all relevant modifiers and calculations.
     *
     * @param {Object} attacker - The attacker's stats (card, enemy, etc.)
     * @param {Object} defender - The defender's stats (enemy, player, etc.)
     * @param {Object} attackInfo - Additional attack information (critical hit, element, etc.)
     * @returns {Object} Result object containing calculated damage and details
     */
    calculateDamage(attacker, defender, attackInfo = {}) {
        // Validate inputs
        if (!attacker || !defender) {
            console.error('Invalid attacker or defender provided to calculateDamage');
            return { success: false, error: 'invalid_inputs' };
        }

        // Get base damage from attacker
        let baseDamage = this._getBaseDamage(attacker, attackInfo);

        // Apply defense reduction
        const defenseReducedDamage = this._applyDefenseReduction(baseDamage, defender);

        // Apply critical hit multiplier
        const criticalDamage = this._applyCriticalHit(defenseReducedDamage, attackInfo);

        // Apply elemental modifiers
        const elementalDamage = this._applyElementalModifiers(criticalDamage, attacker, defender, attackInfo);

        // Apply random variation
        const finalDamage = this._applyRandomVariation(elementalDamage);

        // Ensure minimum damage of 1
        const minDamage = Math.max(1, finalDamage);

        // Create result object
        const result = {
            success: true,
            baseDamage: baseDamage,
            defenseReducedDamage: defenseReducedDamage,
            criticalDamage: criticalDamage,
            elementalDamage: elementalDamage,
            finalDamage: minDamage,
            details: {
                attacker: attacker.name || 'unknown',
                defender: defender.name || 'unknown',
                isCriticalHit: attackInfo.isCriticalHit || false,
                elementalBonus: attackInfo.elementalBonus || 1,
                defenseReduction: this._calculateDefenseReductionPercentage(defender)
            }
        };

        // Log the damage calculation for debugging
        console.log(`Damage calculation: ${result.details.attacker} → ${result.details.defender}: ${result.finalDamage} damage`);

        return result;
    }

    /**
     * Calculates healing amount based on healer stats and bonuses
     *
     * This method calculates the final healing amount after applying
     * all relevant modifiers such as critical heals and bonuses.
     *
     * @param {Object} healer - The healer's stats (card, effect, etc.)
     * @param {Object} target - The target receiving healing
     * @param {Object} healInfo - Additional healing information (crit, bonus, etc.)
     * @returns {Object} Result object containing calculated healing and details
     */
    calculateHealing(healer, target, healInfo = {}) {
        // Validate inputs
        if (!healer) {
            console.error('Invalid healer provided to calculateHealing');
            return { success: false, error: 'invalid_healer' };
        }

        // Get base healing amount
        let baseHeal = healInfo.baseHeal || healer.healAmount || healer.value || 0;

        if (baseHeal <= 0) {
            console.warn('Healing amount is 0 or negative');
            return { success: false, error: 'no_healing_base', baseHeal: 0 };
        }

        // Apply healing bonus multiplier (from buffs, cards, etc.)
        const healingBonus = healInfo.healingBonus || 1.0;
        let bonusHeal = baseHeal * healingBonus;

        // Check for critical heal (some cards can crit heal)
        const isCriticalHeal = healInfo.isCriticalHeal || (Math.random() < (healInfo.critChance || 0));
        let critHeal = bonusHeal;
        
        if (isCriticalHeal) {
            const critMultiplier = healInfo.critMultiplier || GAME_CONFIG.CRITICAL_HIT_MULTIPLIER;
            critHeal = bonusHeal * critMultiplier;
            console.log(`Critical Heal! Multiplier: ${critMultiplier}x`);
        }

        // Apply random variation (±10% for healing - less variance than damage)
        const variation = critHeal * (0.9 + Math.random() * 0.2);
        const finalHeal = Math.floor(variation);

        // Ensure minimum healing of 1
        const minHeal = Math.max(1, finalHeal);

        // Create result object
        const result = {
            success: true,
            baseHeal: baseHeal,
            bonusHeal: bonusHeal,
            criticalHeal: critHeal,
            finalHeal: minHeal,
            details: {
                healer: healer.name || 'unknown',
                target: target?.name || target?.type || 'self',
                isCriticalHeal: isCriticalHeal,
                healingBonus: healingBonus,
                critMultiplier: isCriticalHeal ? (healInfo.critMultiplier || GAME_CONFIG.CRITICAL_HIT_MULTIPLIER) : 1
            }
        };

        // Log the healing calculation for debugging
        console.log(`Healing calculation: ${result.details.healer} → ${result.details.target}: ${result.finalHeal} HP`);

        return result;
    }

    /**
     * Calculates shield/barrier amount based on card stats
     *
     * This method calculates the final shield amount after applying
     * all relevant modifiers.
     *
     * @param {Object} card - The card providing the shield
     * @param {Object} target - The target receiving the shield
     * @param {Object} shieldInfo - Additional shield information (bonus, duration, etc.)
     * @returns {Object} Result object containing calculated shield and details
     */
    calculateShield(card, target, shieldInfo = {}) {
        // Validate inputs
        if (!card) {
            console.error('Invalid card provided to calculateShield');
            return { success: false, error: 'invalid_card' };
        }

        // Get base shield amount
        let baseShield = shieldInfo.baseShield || card.shieldAmount || card.value || 0;

        if (baseShield <= 0) {
            console.warn('Shield amount is 0 or negative');
            return { success: false, error: 'no_shield_base', baseShield: 0 };
        }

        // Apply shield bonus multiplier
        const shieldBonus = shieldInfo.shieldBonus || 1.0;
        const finalShield = Math.floor(baseShield * shieldBonus);

        // Get shield duration
        const duration = shieldInfo.duration || card.shieldDuration || 3;

        // Create result object
        const result = {
            success: true,
            baseShield: baseShield,
            finalShield: finalShield,
            duration: duration,
            details: {
                source: card.name || 'unknown',
                target: target?.name || target?.type || 'self',
                shieldBonus: shieldBonus
            }
        };

        // Log the shield calculation for debugging
        console.log(`Shield calculation: ${result.details.source} → ${result.details.target}: ${result.finalShield} shield for ${duration} turns`);

        return result;
    }
    
    /**
     * Gets the base damage from the attacker
     * 
     * @param {Object} attacker - The attacker object
     * @param {Object} attackInfo - Attack information
     * @returns {number} Base damage value
     */
    _getBaseDamage(attacker, attackInfo) {
        // Check if attacker has a damage property
        if (attacker.damage !== undefined) {
            return attacker.damage;
        }
        
        // Check if attacker has an attackPower property (for enemies)
        if (attacker.attackPower !== undefined) {
            return attacker.attackPower;
        }
        
        // Default to 1 if no damage/attack property found
        console.warn(`Attacker has no damage or attack property. Using default damage of 1.`);
        return 1;
    }
    
    /**
     * Applies defense reduction to damage
     * 
     * @param {number} damage - The damage before defense reduction
     * @param {Object} defender - The defender object
     * @returns {number} Damage after defense reduction
     */
    _applyDefenseReduction(damage, defender) {
        // Get defender's defense value
        const defense = defender.defense || 0;
        
        // Calculate defense reduction (max 50% reduction)
        const defenseReduction = Math.min(defense / 100, 0.5);
        
        // Apply reduction
        const reducedDamage = damage * (1 - defenseReduction);
        
        // Log for debugging
        if (defense > 0) {
            console.log(`Defense reduction: ${defense}% (${defenseReduction * 100}%)`);
        }
        
        return reducedDamage;
    }
    
    /**
     * Applies critical hit multiplier
     * 
     * @param {number} damage - The damage before critical hit
     * @param {Object} attackInfo - Attack information
     * @returns {number} Damage after critical hit multiplier
     */
    _applyCriticalHit(damage, attackInfo) {
        // Check if critical hit should be applied
        const isCriticalHit = attackInfo.isCriticalHit || 
            (Math.random() < GAME_CONFIG.CRITICAL_HIT_CHANCE);
        
        // Apply critical hit multiplier if applicable
        const criticalMultiplier = isCriticalHit ? GAME_CONFIG.CRITICAL_HIT_MULTIPLIER : 1;
        const criticalDamage = damage * criticalMultiplier;
        
        // Update attackInfo with critical hit status
        attackInfo.isCriticalHit = isCriticalHit;
        attackInfo.criticalMultiplier = criticalMultiplier;
        
        // Log for debugging
        if (isCriticalHit) {
            console.log(`Critical hit! Multiplier: ${criticalMultiplier}x`);
        }
        
        return criticalDamage;
    }
    
    /**
     * Applies elemental modifiers
     * 
     * @param {number} damage - The damage before elemental modifiers
     * @param {Object} attacker - The attacker object
     * @param {Object} defender - The defender object
     * @param {Object} attackInfo - Attack information
     * @returns {number} Damage after elemental modifiers
     */
    _applyElementalModifiers(damage, attacker, defender, attackInfo) {
        // Get elemental types
        const attackerElement = attacker.element || 'neutral';
        const defenderElement = defender.element || 'neutral';
        
        // Define elemental relationships (simplified)
        const elementalAdvantages = {
            fire: { ice: 1.5, grass: 1.5 },
            ice: { fire: 1.5, water: 1.5 },
            water: { fire: 1.5, earth: 1.5 },
            earth: { water: 1.5, wind: 1.5 },
            wind: { earth: 1.5, fire: 1.5 },
            grass: { water: 1.5, earth: 1.5 }
        };
        
        // Calculate elemental bonus
        let elementalBonus = 1;
        
        // Check for elemental advantage
        if (elementalAdvantages[attackerElement] && 
            elementalAdvantages[attackerElement][defenderElement]) {
            elementalBonus = elementalAdvantages[attackerElement][defenderElement];
            console.log(`Elemental advantage: ${attackerElement} vs ${defenderElement} → ${elementalBonus}x bonus`);
        }
        
        // Apply elemental bonus
        const elementalDamage = damage * elementalBonus;
        
        // Update attackInfo with elemental bonus
        attackInfo.elementalBonus = elementalBonus;
        
        return elementalDamage;
    }
    
    /**
     * Applies random variation to damage
     * 
     * @param {number} damage - The damage before random variation
     * @returns {number} Damage after random variation
     */
    _applyRandomVariation(damage) {
        // Add ±20% random variation
        const variation = damage * (0.8 + Math.random() * 0.4);
        
        // Round down to nearest integer
        return Math.floor(variation);
    }
    
    /**
     * Calculates defense reduction percentage
     * 
     * @param {Object} defender - The defender object
     * @returns {number} Defense reduction percentage
     */
    _calculateDefenseReductionPercentage(defender) {
        const defense = defender.defense || 0;
        return Math.min(defense / 100, 0.5) * 100;
    }
    
    /**
     * Calculates damage for card attacks
     * 
     * This is a convenience method specifically for card-based attacks.
     * 
     * @param {Object} card - The card being played
     * @param {Object} enemy - The enemy being attacked
     * @returns {Object} Result object containing calculated damage
     */
    calculateCardDamage(card, enemy) {
        // Create attack info object
        const attackInfo = {
            isCriticalHit: Math.random() < GAME_CONFIG.CRITICAL_HIT_CHANCE,
            elementalBonus: 1
        };
        
        // Calculate damage
        return this.calculateDamage(card, enemy, attackInfo);
    }
}

/**
 * Initializes the DamageCalculator
 * 
 * This function creates and returns a new DamageCalculator instance.
 * 
 * @returns {DamageCalculator} A new DamageCalculator instance
 */
export function initializeDamageCalculator() {
    const calculator = new DamageCalculator();
    console.log('DamageCalculator initialized successfully');
    return calculator;
}