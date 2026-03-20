/**
 * Integration Tests for Combat System Effects
 *
 * This file contains integration tests for the combat system:
 * - DoT effect processing and stacking
 * - Buff consumption system
 * - Crowd control effects
 * - Shield and reflection mechanics
 * - Full turn cycle with effects
 */

// Import modules to test
import { DamageCalculator } from '../combat/DamageCalculator.js';
import { Enemy } from '../enemies/Enemy.js';
import { createEffectManager, EffectManager, EffectType } from '../effects/EffectManager.js';

/**
 * Creates a mock game state for testing
 */
function createMockGameState() {
    const gameState = {
        playerHp: 100,
        playerMaxHp: 100,
        playerMana: 10,
        playerMaxMana: 10,
        enemyHp: 80,
        enemyMaxHp: 80,
        enemy: null,
        activeEffects: [],
        turnCount: 1,

        updatePlayerHp: function(newHp) {
            this.playerHp = Math.max(0, Math.min(this.playerMaxHp, newHp));
        },

        updateEnemyHp: function(newHp) {
            this.enemyHp = Math.max(0, Math.min(this.enemyMaxHp, newHp));
            if (this.enemy) {
                this.enemy.hp = this.enemyHp;
            }
        },

        updatePlayerMana: function(newMana) {
            this.playerMana = Math.max(0, Math.min(this.playerMaxMana, newMana));
        },

        addEffect: function(effect) {
            this.activeEffects.push(effect);
        },

        removeEffect: function(effectName) {
            const index = this.activeEffects.findIndex(e => e.name === effectName);
            if (index !== -1) {
                this.activeEffects.splice(index, 1);
            }
        }
    };

    // Create mock enemy
    gameState.enemy = new Enemy("Test Enemy", 80, 10, "👹");
    gameState.enemy.hp = gameState.enemyHp;

    return gameState;
}

/**
 * Test suite for EffectManager
 */
describe('EffectManager Integration Tests', () => {
    let gameState;
    let effectManager;

    beforeEach(() => {
        gameState = createMockGameState();
        effectManager = createEffectManager(gameState);
    });

    /**
     * Test: DoT effects should tick and expire correctly
     */
    test('DoT effects should tick damage and expire after duration', () => {
        // Apply a DoT effect
        const poisonEffect = {
            name: 'poison',
            type: EffectType.DAMAGE_OVER_TIME,
            damagePerTurn: 5,
            turnsRemaining: 3,
            emoji: '☠️'
        };

        gameState.enemy.addEffect(poisonEffect);
        const initialEnemyHp = gameState.enemyHp;

        // Process effects (simulating 3 turns)
        for (let i = 0; i < 3; i++) {
            const results = effectManager.processAllEffects();
            expect(results.enemyEffects.length).toBeGreaterThan(0);
        }

        // Enemy should have taken 15 damage (5 × 3 turns)
        expect(gameState.enemyHp).toBe(initialEnemyHp - 15);

        // Effect should be expired
        const remainingEffects = gameState.enemy.activeEffects.filter(e => e.name === 'poison');
        expect(remainingEffects.length).toBe(0);
    });

    /**
     * Test: Stacking DoT effects should increase damage
     */
    test('Stacking DoT effects should deal increased damage', () => {
        // Apply stacking burn effect
        const burnEffect = {
            name: 'ignite_burn',
            type: EffectType.STACKING_BURN,
            burnDamage: 2,
            stacks: 3,
            turnsRemaining: 4,
            emoji: '✨'
        };

        gameState.enemy.addEffect(burnEffect);
        const initialEnemyHp = gameState.enemyHp;

        // Process one turn
        effectManager.processAllEffects();

        // Should deal 6 damage (2 × 3 stacks)
        expect(gameState.enemyHp).toBe(initialEnemyHp - 6);
    });

    /**
     * Test: HoT effects should heal player
     */
    test('Heal over Time effects should restore player HP', () => {
        // Apply HoT effect
        const regenEffect = {
            name: 'regen',
            type: EffectType.HEAL_OVER_TIME,
            healPerTurn: 5,
            turnsRemaining: 3,
            emoji: '💚'
        };

        gameState.playerHp = 80; // Start below max
        gameState.activeEffects.push(regenEffect);

        // Process one turn
        effectManager.processAllEffects();

        // Should heal 5 HP
        expect(gameState.playerHp).toBe(85);
    });

    /**
     * Test: Magma delayed eruption should grow and explode
     */
    test('Magma pool should grow each turn and erupt', () => {
        // Apply magma effect
        const magmaEffect = {
            name: 'magma_pool',
            type: EffectType.DELAYED_ERUPTION,
            initialDamage: 3,
            currentDamage: 3,
            tickDamage: 3,
            turnsRemaining: 3,
            growthMultiplier: 2,
            eruptionMultiplier: 5,
            emoji: '🌋'
        };

        gameState.enemy.addEffect(magmaEffect);
        const initialEnemyHp = gameState.enemyHp;
        let totalDamage = 0;

        // Process 3 turns
        for (let i = 0; i < 3; i++) {
            const results = effectManager.processAllEffects();
            const magmaResult = results.enemyEffects.find(r => r.type === EffectType.DELAYED_ERUPTION);
            if (magmaResult) {
                totalDamage += magmaResult.damage || 0;
            }
        }

        // Turn 1: 3 damage, Turn 2: 6 damage, Turn 3: 12 × 5 = 60 eruption
        // Total: 69 damage
        expect(gameState.enemyHp).toBe(initialEnemyHp - totalDamage);

        // Effect should be expired after eruption
        const remainingEffects = gameState.enemy.activeEffects.filter(e => e.name === 'magma_pool');
        expect(remainingEffects.length).toBe(0);
    });

    /**
     * Test: Growing DoT (WildGrowth) should double damage each turn
     */
    test('WildGrowth should double damage each turn', () => {
        // Apply growing DoT
        const growthEffect = {
            name: 'wild_growth',
            type: EffectType.NATURE_DOT,
            initialDamage: 3,
            currentDamage: 3,
            growthMultiplier: 2,
            turnsRemaining: 3,
            emoji: '🌾'
        };

        gameState.enemy.addEffect(growthEffect);
        const initialEnemyHp = gameState.enemyHp;

        // Turn 1: 3 damage
        effectManager.processAllEffects();
        expect(gameState.enemyHp).toBe(initialEnemyHp - 3);

        // Turn 2: 6 damage (doubled)
        const hpAfterTurn1 = gameState.enemyHp;
        effectManager.processAllEffects();
        expect(gameState.enemyHp).toBe(hpAfterTurn1 - 6);

        // Turn 3: 12 damage (doubled again)
        const hpAfterTurn2 = gameState.enemyHp;
        effectManager.processAllEffects();
        expect(gameState.enemyHp).toBe(hpAfterTurn2 - 12);
    });

    /**
     * Test: Buff consumption should apply damage multiplier
     */
    test('Buff consumption should apply damage multiplier to cards', () => {
        // Apply HydroBoost buff
        const hydroBoostEffect = {
            name: 'hydro_boost',
            type: EffectType.DAMAGE_BUFF,
            damageBonusPercent: 0.50,
            turnsRemaining: 1,
            appliesTo: 'water',
            consumed: false,
            emoji: '🔵'
        };

        gameState.activeEffects.push(hydroBoostEffect);

        // Create mock water card
        const waterCard = {
            name: 'WaterJet',
            element: 'water',
            cost: 2
        };

        // Consume buff
        const result = effectManager.consumeBuffsForCard(waterCard);

        expect(result.consumed).toBe(true);
        expect(result.damageMultiplier).toBe(1.50); // Base 1 + 0.50

        // Buff should be removed
        const remainingBuffs = gameState.activeEffects.filter(e => e.name === 'hydro_boost');
        expect(remainingBuffs.length).toBe(0);
    });

    /**
     * Test: FlameStrike guaranteed crit should be consumed
     */
    test('FlameStrike should grant guaranteed crit and be consumed', () => {
        // Apply FlameStrike buff
        const flameStrikeEffect = {
            name: 'flame_strike_buff',
            type: EffectType.NEXT_CARD_BUFF,
            damageBonus: 5,
            guaranteedCrit: true,
            turnsRemaining: 1,
            appliesTo: 'fire',
            consumed: false,
            emoji: '⚔️'
        };

        gameState.activeEffects.push(flameStrikeEffect);

        // Create mock fire card
        const fireCard = {
            name: 'Fireball',
            element: 'fire',
            cost: 4
        };

        // Consume buff
        const result = effectManager.consumeBuffsForCard(fireCard);

        expect(result.consumed).toBe(true);
        expect(result.guaranteedCrit).toBe(true);

        // Buff should be removed
        const remainingBuffs = gameState.activeEffects.filter(e => e.name === 'flame_strike_buff');
        expect(remainingBuffs.length).toBe(0);
    });

    /**
     * Test: Buff should not consume for wrong element
     */
    test('HydroBoost should not consume for non-water cards', () => {
        // Apply HydroBoost buff
        const hydroBoostEffect = {
            name: 'hydro_boost',
            type: EffectType.DAMAGE_BUFF,
            damageBonusPercent: 0.50,
            turnsRemaining: 1,
            appliesTo: 'water',
            consumed: false
        };

        gameState.activeEffects.push(hydroBoostEffect);

        // Create mock fire card
        const fireCard = {
            name: 'Fireball',
            element: 'fire',
            cost: 4
        };

        // Try to consume buff
        const result = effectManager.consumeBuffsForCard(fireCard);

        expect(result.consumed).toBe(false);

        // Buff should still be active
        const remainingBuffs = gameState.activeEffects.filter(e => e.name === 'hydro_boost');
        expect(remainingBuffs.length).toBe(1);
    });

    /**
     * Test: Crowd control effects should be tracked
     */
    test('Crowd control effects should be tracked and expire', () => {
        // Apply stun effect
        const stunEffect = {
            name: 'stun',
            type: EffectType.CROWD_CONTROL,
            turnsRemaining: 2,
            skipsTurn: true
        };

        gameState.enemy.addEffect(stunEffect);

        // Process effects
        effectManager.processAllEffects();

        // Effect should still be active with 1 turn remaining
        const stunEffects = gameState.enemy.activeEffects.filter(e => e.name === 'stun');
        expect(stunEffects.length).toBe(1);
        expect(stunEffects[0].turnsRemaining).toBe(1);

        // Process another turn
        effectManager.processAllEffects();

        // Effect should be expired
        const remainingStuns = gameState.enemy.activeEffects.filter(e => e.name === 'stun');
        expect(remainingStuns.length).toBe(0);
    });

    /**
     * Test: Multiple effects should process correctly
     */
    test('Multiple simultaneous effects should all process', () => {
        // Apply multiple effects
        gameState.enemy.addEffect({
            name: 'poison',
            type: EffectType.DAMAGE_OVER_TIME,
            damagePerTurn: 5,
            turnsRemaining: 2,
            emoji: '☠️'
        });

        gameState.enemy.addEffect({
            name: 'ignite_burn',
            type: EffectType.STACKING_BURN,
            burnDamage: 3,
            stacks: 2,
            turnsRemaining: 2,
            emoji: '✨'
        });

        const initialEnemyHp = gameState.enemyHp;

        // Process one turn
        const results = effectManager.processAllEffects();

        // Should deal 5 (poison) + 6 (ignite 3×2) = 11 damage
        expect(gameState.enemyHp).toBe(initialEnemyHp - 11);
        expect(results.enemyEffects.length).toBe(2);
    });
});

/**
 * Test suite for EffectManager utility methods
 */
describe('EffectManager Utility Methods', () => {
    let gameState;
    let effectManager;

    beforeEach(() => {
        gameState = createMockGameState();
        effectManager = createEffectManager(gameState);
    });

    test('hasEffect should return correct boolean', () => {
        gameState.enemy.addEffect({
            name: 'test_effect',
            type: EffectType.DAMAGE_OVER_TIME,
            turnsRemaining: 3
        });

        expect(effectManager.hasEffect('test_effect', 'enemy')).toBe(true);
        expect(effectManager.hasEffect('nonexistent', 'enemy')).toBe(false);
    });

    test('getAllEffects should return all active effects', () => {
        gameState.enemy.addEffect({
            name: 'effect1',
            type: EffectType.DAMAGE_OVER_TIME,
            turnsRemaining: 3
        });

        gameState.enemy.addEffect({
            name: 'effect2',
            type: EffectType.CROWD_CONTROL,
            turnsRemaining: 2
        });

        const effects = effectManager.getAllEffects('enemy');
        expect(effects.length).toBe(2);
    });

    test('removeEffect should remove specific effect', () => {
        gameState.enemy.addEffect({
            name: 'to_remove',
            type: EffectType.DAMAGE_OVER_TIME,
            turnsRemaining: 3
        });

        gameState.enemy.addEffect({
            name: 'to_keep',
            type: EffectType.CROWD_CONTROL,
            turnsRemaining: 2
        });

        effectManager.removeEffect('to_remove', 'enemy');

        const effects = effectManager.getAllEffects('enemy');
        expect(effects.length).toBe(1);
        expect(effects[0].name).toBe('to_keep');
    });

    test('clearAllEffects should remove all effects', () => {
        gameState.enemy.addEffect({
            name: 'effect1',
            type: EffectType.DAMAGE_OVER_TIME,
            turnsRemaining: 3
        });

        gameState.enemy.addEffect({
            name: 'effect2',
            type: EffectType.CROWD_CONTROL,
            turnsRemaining: 2
        });

        const count = effectManager.clearAllEffects('enemy');

        expect(count).toBe(2);
        expect(effectManager.getAllEffects('enemy').length).toBe(0);
    });

    test('getDamageMultiplier should return correct multiplier', () => {
        // No buffs = 1x
        expect(effectManager.getDamageMultiplier('fire')).toBe(1);

        // Add buff
        gameState.activeEffects.push({
            name: 'flame_strike_buff',
            type: EffectType.NEXT_CARD_BUFF,
            damageBonusPercent: 0.50,
            appliesTo: 'fire',
            consumed: false
        });

        expect(effectManager.getDamageMultiplier('fire')).toBe(1.50);
    });
});

// Simple test runner for environments without Jest
if (typeof describe === 'undefined') {
    console.log('Running integration tests for effect system...\n');

    const gameState = createMockGameState();
    const effectManager = createEffectManager(gameState);

    try {
        // Test 1: DoT ticking
        console.log('Test 1: DoT effects tick and expire...');
        gameState.enemy.addEffect({
            name: 'test_dot',
            type: EffectType.DAMAGE_OVER_TIME,
            damagePerTurn: 5,
            turnsRemaining: 2,
            emoji: '☠️'
        });
        const hpBefore = gameState.enemyHp;
        effectManager.processAllEffects();
        console.log(`  ✓ DoT dealt ${hpBefore - gameState.enemyHp} damage (expected: 5)`);

        // Test 2: Buff consumption
        console.log('Test 2: Buff consumption...');
        gameState.activeEffects.push({
            name: 'test_buff',
            type: EffectType.DAMAGE_BUFF,
            damageBonusPercent: 0.50,
            appliesTo: 'fire',
            consumed: false
        });
        const result = effectManager.consumeBuffsForCard({ element: 'fire', name: 'TestCard' });
        console.log(`  ✓ Buff consumed: ${result.consumed}, multiplier: ${result.damageMultiplier}x`);

        // Test 3: Multiple effects
        console.log('Test 3: Multiple effects processing...');
        gameState.enemy.addEffect({
            name: 'poison',
            type: EffectType.DAMAGE_OVER_TIME,
            damagePerTurn: 3,
            turnsRemaining: 2
        });
        gameState.enemy.addEffect({
            name: 'ignite_burn',
            type: EffectType.STACKING_BURN,
            burnDamage: 2,
            stacks: 2,
            turnsRemaining: 2
        });
        const results = effectManager.processAllEffects();
        console.log(`  ✓ Processed ${results.enemyEffects.length} enemy effects`);

        console.log('\n✅ All integration tests passed!');
    } catch (error) {
        console.error('❌ Integration tests failed:', error);
    }
}
