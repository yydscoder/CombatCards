/**
 * GameOverScreen.js - Win / Lose overlay
 *
 * Injects a full-screen overlay into the DOM and shows either
 * a victory or defeat message along with the player's career stats.
 * The "Play Again" button reloads the page.
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
                <button id="game-over-btn">⚔️ Play Again</button>
            </div>`;
        document.body.appendChild(overlay);

        document.getElementById('game-over-btn').addEventListener('click', () => {
            location.reload();
        });

        this.overlay = overlay;
    }

    showVictory() {
        const stats = this.saveSystem.getStats();
        this._show(
            'VICTORY!',
            'The enemy has been defeated!',
            stats,
            'victory'
        );
    }

    showDefeat() {
        const stats = this.saveSystem.getStats();
        this._show(
            '💀',
            'DEFEAT',
            'You have been slain...',
            stats,
            'defeat'
        );
    }

    _show(emoji, title, subtitle, stats, type) {
        document.getElementById('game-over-emoji').textContent = emoji;
        document.getElementById('game-over-title').textContent = title;
        document.getElementById('game-over-subtitle').textContent = subtitle;
        document.getElementById('game-over-stats').innerHTML = `
            <div class="stat-row"><span>Wins</span><span>${stats.wins}</span></div>
            <div class="stat-row"><span>Losses</span><span>${stats.losses}</span></div>
            <div class="stat-row"><span>Games Played</span><span>${stats.totalGames}</span></div>
            <div class="stat-row"><span>Best Streak</span><span>${stats.bestStreak} 🔥</span></div>`;

        const box = document.getElementById('game-over-box');
        box.className = type === 'victory' ? 'victory-box' : 'defeat-box';

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
