/**
 * Centralized logging helper for card effects and related events. That I have added to keep track of debugging when I add new cards in the future. 
 */
export function cardKeeper(event, details = {}) {
    const hasDetails = details && Object.keys(details).length > 0;
    if (hasDetails) {
        console.log(`[card keeper] ${event}`, details);
    } else {
        console.log(`[card keeper] ${event}`);
    }
}

export function buildEffectLog(effect) {
    if (!effect) {
        return { name: 'unknown' };
    }

    const duration = effect.turnsRemaining ?? effect.duration;
    const log = {
        name: effect.name || 'unknown',
        type: effect.type,
        emoji: effect.emoji,
        duration: duration,
        stacks: effect.stacks,
        damagePerTick: effect.damagePerTick,
        damagePerTurn: effect.damagePerTurn,
        healPerTurn: effect.healPerTurn,
        source: effect.source
    };

    Object.keys(log).forEach(key => {
        if (log[key] === undefined || log[key] === null) {
            delete log[key];
        }
    });

    return log;
}
