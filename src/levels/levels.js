/**
 * Enemy Pool and Round Definitions for Survivor Mode
 *
 * This file defines the enemy pool and round progression for survivor mode.
 * Players fight through consecutive rounds with increasing difficulty.
 * Each round spawns one enemy, with stats scaling based on round number.
 *
 * Round progression:
 * - Rounds 1-3: Only Goblins (tutorial)
 * - Rounds 4-6: Goblins + Orcs
 * - Rounds 7-9: Goblins + Orcs + Skeletons
 * - Rounds 10-14: All enemies except Dragon
 * - Rounds 15+: Any enemy including Dragon (boss rounds every 5)
 */

/**
 * Enemy pool definitions with base stats and round availability
 */
export const ENEMY_POOL = {
    goblin: {
        id: 'goblin',
        name: 'Goblin Scout',
        emoji: '👺',
        baseHp: 60,
        baseAttack: 14,
        minRound: 1,
        weight: 3, // Spawn weight (higher = more common)
        class: 'aggressive'
    },
    orc: {
        id: 'orc',
        name: 'Orc Warrior',
        emoji: '👹',
        baseHp: 100,
        baseAttack: 18,
        minRound: 4,
        weight: 2,
        class: 'brute'
    },
    skeleton: {
        id: 'skeleton',
        name: 'Skeleton Knight',
        emoji: '💀',
        baseHp: 70,
        baseAttack: 12,
        minRound: 7,
        weight: 2,
        class: 'defensive'
    },
    ghost: {
        id: 'ghost',
        name: 'Ghost Wraith',
        emoji: '👻',
        baseHp: 55,
        baseAttack: 15,
        minRound: 10,
        weight: 1,
        class: 'special'
    },
    dragon: {
        id: 'dragon',
        name: 'Ancient Dragon',
        emoji: '🐉',
        baseHp: 200,
        baseAttack: 25,
        minRound: 15,
        weight: 0.5, // Rare spawn
        class: 'boss',
        isBoss: true
    }
};

/**
 * Round milestones for survivor mode
 */
export const ROUND_MILESTONES = {
    1: { name: 'First Blood', description: 'Your first challenge begins!' },
    5: { name: 'Veteran', description: 'You\'ve proven your skill!' },
    10: { name: 'Elite Warrior', description: 'The spirits take notice...' },
    15: { name: 'Dragon Slayer', description: 'Face the ancient evil!' },
    20: { name: 'Legend', description: 'Your legend grows!' },
    25: { name: 'Immortal', description: 'Death itself fears you!' },
    30: { name: 'Survivor King', description: 'None can stand against you!' }
};

/**
 * Gets available enemies for a specific round
 *
 * @param {number} round - The current round number
 * @returns {Array} Array of available enemy types
 */
export function getAvailableEnemies(round) {
    const available = [];
    
    for (const [key, enemy] of Object.entries(ENEMY_POOL)) {
        if (round >= enemy.minRound) {
            available.push({ key, ...enemy });
        }
    }
    
    return available;
}

/**
 * Selects a random enemy for the current round
 * Uses weighted random selection based on enemy weights
 *
 * @param {number} round - The current round number
 * @param {boolean} forceBoss - Force a boss spawn (every 5 rounds after 15)
 * @returns {Object} Selected enemy configuration
 */
export function selectEnemyForRound(round, forceBoss = false) {
    const available = getAvailableEnemies(round);
    
    // Boss rounds every 5 rounds after round 15
    if (round >= 15 && round % 5 === 0) {
        forceBoss = true;
    }
    
    if (forceBoss) {
        // Filter to boss enemies only
        const bosses = available.filter(e => e.isBoss || e.class === 'boss');
        if (bosses.length > 0) {
            return bosses[Math.floor(Math.random() * bosses.length)];
        }
    }
    
    // Weighted random selection
    const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const enemy of available) {
        random -= enemy.weight;
        if (random <= 0) {
            return enemy;
        }
    }
    
    // Fallback to first available
    return available[0];
}

/**
 * Calculates scaled enemy stats based on round number
 * Stats increase by 10% per round
 *
 * @param {Object} baseEnemy - Base enemy configuration
 * @param {number} round - Current round number
 * @returns {Object} Scaled enemy stats
 */
export function scaleEnemyStats(baseEnemy, round) {
    const scalingFactor = 1 + ((round - 1) * 0.1); // 10% per round
    
    return {
        name: baseEnemy.name,
        type: baseEnemy.id,
        emoji: baseEnemy.emoji,
        hp: Math.floor(baseEnemy.baseHp * scalingFactor),
        attack: Math.floor(baseEnemy.baseAttack * scalingFactor),
        class: baseEnemy.class,
        isBoss: baseEnemy.isBoss || false,
        round: round
    };
}

/**
 * Gets the milestone info for a round
 *
 * @param {number} round - The round number
 * @returns {Object|null} Milestone info or null
 */
export function getMilestoneForRound(round) {
    return ROUND_MILESTONES[round] || null;
}

/**
 * Gets a difficulty rating based on round number
 *
 * @param {number} round - The round number
 * @returns {string} Difficulty rating
 */
export function getRoundDifficulty(round) {
    if (round <= 3) return 'tutorial';
    if (round <= 6) return 'easy';
    if (round <= 9) return 'medium';
    if (round <= 14) return 'hard';
    if (round <= 19) return 'expert';
    if (round <= 24) return 'master';
    if (round <= 29) return 'legendary';
    return 'mythic';
}

/**
 * Calculates gold reward for completing a round
 *
 * @param {number} round - The completed round
 * @param {Object} enemy - The defeated enemy
 * @returns {number} Gold reward
 */
export function calculateRoundReward(round, enemy) {
    const baseReward = 50;
    const bossMultiplier = enemy.isBoss ? 3 : 1;
    return Math.floor(baseReward * round * bossMultiplier);
}
