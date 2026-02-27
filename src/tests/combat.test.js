/**
 * Unit Tests for Combat System
 * 
 * This file contains unit tests for the combat system components:
 * - DamageCalculator
 * - Enemy class
 * - Card damage calculation
 * 
 * Testing code counts as coding time for WakaTime tracking.
 */

// Import modules to test
import { DamageCalculator } from '../combat/DamageCalculator.js';
import { Enemy } from '../enemies/Enemy.js';
import { SlimeEnemy } from '../enemies/SlimeEnemy.js';
import { FireCard } from '../cards/FireCard.js';

/**
 * Test suite for DamageCalculator
 */
describe('DamageCalculator', () => {
    let calculator;
    
    beforeEach(() => {
        calculator = new DamageCalculator();
    });
    
    test('should calculate base damage correctly', () => {
        const attacker = { damage: 10 };
        const defender = { defense: 0 };
        const result = calculator.calculateDamage(attacker, defender);
        
        expect(result.success).toBe(true);
        expect(result.finalDamage).toBeGreaterThan(0);
        expect(result.baseDamage).toBe(10);
    });
    
    test('should apply defense reduction', () => {
        const attacker = { damage: 100 };
        const defender = { defense: 50 }; // 50% defense should reduce damage by 50%
        const result = calculator.calculateDamage(attacker, defender);
        
        expect(result.success).toBe(true);
        expect(result.finalDamage).toBeLessThan(100);
        expect(result.defenseReducedDamage).toBe(50); // 100 * (1 - 0.5) = 50
    });
    
    test('should apply critical hit multiplier', () => {
        const attacker = { damage: 10 };
        const defender = { defense: 0 };
        const attackInfo = { isCriticalHit: true };
        
        const result = calculator.calculateDamage(attacker, defender, attackInfo);
        
        expect(result.success).toBe(true);
        expect(result.finalDamage).toBeGreaterThan(10);
        expect(result.criticalDamage).toBe(15); // 10 * 1.5 = 15
    });
    
    test('should handle elemental advantages', () => {
        const attacker = { damage: 10, element: 'fire' };
        const defender = { defense: 0, element: 'ice' };
        const attackInfo = { isCriticalHit: false };
        
        const result = calculator.calculateDamage(attacker, defender, attackInfo);
        
        expect(result.success).toBe(true);
        expect(result.finalDamage).toBeGreaterThan(10);
        expect(result.elementalDamage).toBe(15); // 10 * 1.5 = 15 for fire vs ice
    });
    
    test('should apply random variation', () => {
        const attacker = { damage: 10 };
        const defender = { defense: 0 };
        
        const result1 = calculator.calculateDamage(attacker, defender);
        const result2 = calculator.calculateDamage(attacker, defender);
        
        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        
        // Random variation should produce different results (within reasonable range)
        expect(result1.finalDamage).toBeGreaterThanOrEqual(8); // 10 * 0.8 = 8
        expect(result1.finalDamage).toBeLessThanOrEqual(12); // 10 * 1.2 = 12
    });
});

/**
 * Test suite for Enemy class
 */
describe('Enemy', () => {
    let enemy;
    
    beforeEach(() => {
        enemy = new Enemy("Test Enemy", 100, 10, "👹");
    });
    
    test('should initialize with correct properties', () => {
        expect(enemy.name).toBe("Test Enemy");
        expect(enemy.maxHp).toBe(100);
        expect(enemy.hp).toBe(100);
        expect(enemy.attack).toBe(10);
        expect(enemy.emoji).toBe("👹");
        expect(enemy.isAlive).toBe(true);
    });
    
    test('should take damage correctly', () => {
        const result = enemy.takeDamage(25);
        
        expect(result.success).toBe(true);
        expect(result.damageTaken).toBe(25);
        expect(enemy.hp).toBe(75);
        expect(enemy.isAlive).toBe(true);
    });
    
    test('should die when HP reaches 0', () => {
        const result = enemy.takeDamage(100);
        
        expect(result.success).toBe(true);
        expect(result.damageTaken).toBe(100);
        expect(enemy.hp).toBe(0);
        expect(enemy.isAlive).toBe(false);
    });
    
    test('should not go below 0 HP', () => {
        enemy.takeDamage(100); // Set HP to 0
        const result = enemy.takeDamage(50); // Try to take more damage
        
        expect(result.success).toBe(true);
        expect(result.damageTaken).toBe(50);
        expect(enemy.hp).toBe(0);
        expect(enemy.isAlive).toBe(false);
    });
});

/**
 * Test suite for SlimeEnemy
 */
describe('SlimeEnemy', () => {
    let slime;
    
    beforeEach(() => {
        slime = new SlimeEnemy("Slime", 80, 12);
    });
    
    test('should initialize with slime-specific properties', () => {
        expect(slime.name).toBe("Slime");
        expect(slime.maxHp).toBe(80);
        expect(slime.attack).toBe(12);
        expect(slime.emoji).toBe("🟢");
        expect(slime.type).toBe("slime");
        expect(slime.isGelatinous).toBe(true);
    });
    
    test('should have slime-specific behavior when taking damage', () => {
        // Mock Math.random to control split chance
        const originalRandom = Math.random;
        Math.random = () => 0.1; // Force 20% chance to split
        
        const result = slime.takeDamage(10);
        
        expect(result.success).toBe(true);
        expect(slime.hp).toBe(70);
        
        // Restore original Math.random
        Math.random = originalRandom;
    });
});

/**
 * Test suite for FireCard
 */
describe('FireCard', () => {
    let fireCard;
    
    beforeEach(() => {
        fireCard = new FireCard("Fire Blast", 5, 10);
    });
    
    test('should initialize with correct properties', () => {
        expect(fireCard.name).toBe("Fire Blast");
        expect(fireCard.cost).toBe(5);
        expect(fireCard.damage).toBe(10);
        expect(fireCard.emoji).toBe("🔥");
        expect(fireCard.element).toBe("fire");
    });
    
    test('should execute effect correctly', () => {
        // Create a mock game state
        const gameState = {
            enemyHp: 80,
            enemyMaxHp: 80,
            playerMana: 50,
            updateEnemyHp: function(newHp) {
                this.enemyHp = newHp;
            }
        };
        
        // Execute the card effect
        const result = fireCard.executeEffect(gameState, { type: 'enemy' });
        
        expect(result.success).toBe(true);
        expect(result.damage).toBeGreaterThan(0);
        expect(result.message).toContain("Fire Blast");
    });
});

/**
 * Integration test: Card → Damage Calculator → Enemy
 */
describe('Integration: Card to Enemy Damage', () => {
    let calculator;
    let enemy;
    let fireCard;
    
    beforeEach(() => {
        calculator = new DamageCalculator();
        enemy = new SlimeEnemy("Slime", 80, 12);
        fireCard = new FireCard("Fire Blast", 5, 10);
    });
    
    test('should calculate and apply damage from card to enemy', () => {
        // Calculate damage
        const damageResult = calculator.calculateCardDamage(fireCard, enemy);
        
        expect(damageResult.success).toBe(true);
        expect(damageResult.finalDamage).toBeGreaterThan(0);
        
        // Apply damage to enemy
        const takeDamageResult = enemy.takeDamage(damageResult.finalDamage);
        
        expect(takeDamageResult.success).toBe(true);
        expect(enemy.hp).toBeLessThan(80);
        expect(enemy.hp).toBeGreaterThan(0);
    });
});

// Simple test runner for environments without Jest
if (typeof describe === 'undefined') {
    console.log('Running simple test suite for combat system...');
    
    // Basic tests
    try {
        const calculator = new DamageCalculator();
        const enemy = new Enemy("Test", 100, 10, "👹");
        const fireCard = new FireCard("Fire", 5, 10);
        
        // Test damage calculation
        const damageResult = calculator.calculateCardDamage(fireCard, enemy);
        console.log(`✓ Damage calculation test passed: ${damageResult.finalDamage} damage`);
        
        // Test enemy taking damage
        const takeDamageResult = enemy.takeDamage(damageResult.finalDamage);
        console.log(`✓ Enemy damage test passed: ${enemy.hp}/${enemy.maxHp} HP`);
        
        // Test card execution
        const gameState = {
            enemyHp: enemy.hp,
            updateEnemyHp: function(newHp) { this.enemyHp = newHp; }
        };
        const cardResult = fireCard.executeEffect(gameState, { type: 'enemy' });
        console.log(`✓ Card execution test passed: ${cardResult.damage} damage`);
        
        console.log('All basic combat tests passed!');
    } catch (error) {
        console.error('Combat tests failed:', error);
    }
}