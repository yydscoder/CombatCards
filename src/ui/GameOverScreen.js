/**
 * GameOverScreen.js - Win / Lose overlay for Survivor Mode
 *
 * Injects a full-screen overlay into the DOM and shows either
 * a victory (round complete) or defeat message along with survivor stats.
 */

export class GameOverScreen {
    constructor(saveSystem) {
        this.saveSystem = saveSystem;
        this.overlay = null;
        this._build();
    }

    /** Inject the (hidden) overlay element once */
    _build() {
        if (document.getElementById('game-over-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'game-over-overlay';
        overlay.className = 'game-over-hidden';
        overlay.innerHTML = `
            <div id="game-over-box">
                <div id="game-over-emoji"></div>
                <h1 id="game-over-title"></h1>
                <p id="game-over-subtitle"></p>
                <div id="game-over-stats"></div>
                <div id="game-over-actions">
                    <button id="game-over-retry">🔄 Retry</button>
                    <button id="game-over-continue">⚔️ Continue</button>
                </div>`;
        document.body.appendChild(overlay);

        // Retry button - start new run
        document.getElementById('game-over-retry').addEventListener('click', () => {
            this.hide();
            if (window.survivorMode) {
                window.survivorMode.startNewRun();
            }
        });

        // Continue button - continue current run
        document.getElementById('game-over-continue').addEventListener('click', () => {
            this.hide();
        });

        this.overlay = overlay;
    }

    /**
     * Shows round victory screen
     *
     * @param {Object} roundInfo - Round completion info
     */
    showRoundVictory(roundInfo) {
        const stats = this.saveSystem.getStats();
        const roundManagerStats = window.roundManager?.getStats();
        
        this._show(
            '⚔️',
            `Round ${roundInfo.round} Complete!`,
            `+${roundInfo.goldReward} gold | Total Kills: ${roundInfo.totalKills}`,
            {
                currentRound: roundInfo.round,
                bestRound: roundManagerStats?.bestRound || roundInfo.round,
                totalKills: roundInfo.totalKills,
                totalGold: roundInfo.totalGold,
                difficulty: roundInfo.difficulty
            },
            'victory',
            true // isRoundVictory
        );
    }

    /**
     * Shows game over screen (player defeated)
     *
     * @param {Object} defeatInfo - Defeat info from round manager
     */
    showDefeat(defeatInfo) {
        const stats = this.saveSystem.getStats();
        
        this._show(
            '💀',
            'YOU DIED',
            defeatInfo?.message || 'Your journey ends here...',
            {
                finalRound: defeatInfo?.finalRound || 1,
                bestRound: defeatInfo?.bestRound || 1,
                totalKills: defeatInfo?.totalKills || 0,
                totalGold: defeatInfo?.totalGold || 0,
                isNewRecord: defeatInfo?.isNewRecord || false
            },
            'defeat',
            false // isRoundVictory
        );
    }

    _show(emoji, title, subtitle, stats, type, isRoundVictory = false) {
        document.getElementById('game-over-emoji').textContent = emoji;
        document.getElementById('game-over-title').textContent = title;
        document.getElementById('game-over-subtitle').textContent = subtitle;
        
        // Build stats HTML based on survivor mode
        if (isRoundVictory) {
            document.getElementById('game-over-stats').innerHTML = `
                <div class="stat-row"><span>Round</span><span>${stats.currentRound}</span></div>
                <div class="stat-row"><span>Difficulty</span><span>${stats.difficulty?.toUpperCase() || 'NORMAL'}</span></div>
                <div class="stat-row"><span>Total Kills</span><span>${stats.totalKills}</span></div>
                <div class="stat-row"><span>Total Gold</span><span>${stats.totalGold} 💰</span></div>
                <div class="stat-row"><span>Best Round</span><span>${stats.bestRound} 🏆</span></div>`;
        } else {
            document.getElementById('game-over-stats').innerHTML = `
                <div class="stat-row"><span>Final Round</span><span>${stats.finalRound}</span></div>
                <div class="stat-row"><span>Best Round</span><span>${stats.bestRound} ${stats.isNewRecord ? '🆕' : '🏆'}</span></div>
                <div class="stat-row"><span>Total Kills</span><span>${stats.totalKills}</span></div>
                <div class="stat-row"><span>Total Gold</span><span>${stats.totalGold} 💰</span></div>`;
        }

        const box = document.getElementById('game-over-box');
        box.className = type === 'victory' ? 'victory-box' : 'defeat-box';

        // Show/hide continue button based on round victory vs defeat
        const continueBtn = document.getElementById('game-over-continue');
        if (continueBtn) {
            continueBtn.style.display = isRoundVictory ? 'inline-block' : 'none';
        }

        this.overlay.className = 'game-over-visible';
        console.log(`[GameOverScreen] Showing ${type} screen.`);
    }

    hide() {
        if (this.overlay) this.overlay.className = 'game-over-hidden';
    }
}

export function initializeGameOverScreen(saveSystem) {
    return new GameOverScreen(saveSystem);
}
