# ⚔️ CombatCards — Emoji Card Battle

A browser-based card battle game built in vanilla JavaScript with no frameworks.
Defeat the Slime enemy by playing cards from your hand before your mana runs out.

## 🎮 How to Play

1. Three cards start in your hand — **Fire Blast**, **Ember Shot**, and **Flame Jet**
2. Click a card to attack the enemy
3. Each card costs mana — watch your 💧 mana bar
4. Cards are discarded after use
5. Defeat the enemy before you run out of cards and mana
6. Win/loss records are saved automatically between sessions

## 🃏 Cards

| Card | Cost | Damage |
|---|---|---|
| 🔥 Fire Blast | 5 mana | 10 base |
| 🔥 Ember Shot | 3 mana | 6 base |
| 🔥 Flame Jet | 7 mana | 15 base |

> Damage includes ±20% random variation, defense reduction, and a 15% critical hit chance (1.5× damage).

## 🗂️ Project Structure

```
CombatCards/
├── index.html
├── main.js                     # Entry point
├── style.css
├── src/
│   ├── cards/
│   │   ├── Card.js             # Base card class
│   │   └── FireCard.js         # Fire card implementation
│   ├── combat/
│   │   └── DamageCalculator.js # Damage math (defense, crits, elemental)
│   ├── core/
│   │   ├── config.js           # Game constants
│   │   ├── engine.js           # Game loop + turn manager
│   │   ├── SaveSystem.js       # localStorage win/loss tracking
│   │   └── state.js            # Central game state
│   ├── css/
│   │   └── animations.css      # Pure CSS @keyframes
│   ├── enemies/
│   │   ├── Enemy.js            # Base enemy class
│   │   └── SlimeEnemy.js       # Slime implementation
│   ├── tests/
│   │   └── combat.test.js      # Unit tests (Jest compatible)
│   └── ui/
│       ├── CardUI.js           # Card DOM renderer
│       ├── GameOverScreen.js   # Victory / defeat overlay
│       ├── Hand.js             # Hand management + combat wiring
│       └── HUD.js              # Health bars, mana, turn counter
└── docs/
    └── dev_log.md
```

## 🚀 Running Locally

Requires a local HTTP server (ES modules don't work over `file://`):

```bash
# Option 1 — npx serve (no install needed)
npx serve .

# Option 2 — VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then open **http://localhost:3000** in your browser.

## 🧪 Running Tests

Tests are written to be Jest-compatible:

```bash
npm install --save-dev jest
npx jest src/tests/combat.test.js
```

## 💾 Save Data

Win/loss stats are stored in `localStorage` under the key `combatCards_stats`.
To reset your record, open the browser console and run:

```js
localStorage.removeItem('combatCards_stats');
```

## 🌐 Deployment

This is a static site — deploy instantly with:

- **Vercel**: `npx vercel` in the project folder
- **Netlify**: Drag the folder into [netlify.com/drop](https://app.netlify.com/drop)
- **GitHub Pages**: Push to `main`, enable Pages in repo settings → deploy from root

## 📅 Dev Log

See [docs/dev_log.md](docs/dev_log.md) for daily progress notes.
