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
 * 
 * The calculator is designed to be reusable across different combat scenarios.
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