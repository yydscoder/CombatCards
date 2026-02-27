#  CombatCards — Emoji Card Battle

This is a browser-based card battle game built in vanilla JavaScript with no frameworks.
Defeat the Enemy by playing cards from your hand before your mana runs out.

## 🎮 How to Play (LAST UPDATED 28/2/2026)

1. Three cards start in your hand — **Fire Blast**, **Ember Shot**, and **Flame Jet** MORE TO COME!!!!!!!!!!!!!!!!!
2. Click a card to attack the enemy
3. Each card costs mana — watch your 💧 mana bar
4. Cards are discarded after use
5. Defeat the enemy before you run out of cards in your deck and mana
6. Win/loss records are saved automatically between sessions

## Cards

| Card | Cost | Damage |
|---|---|---|
| 🔥 Fire Blast | 5 mana | 10 base |
| 🔥 Ember Shot | 3 mana | 6 base |
| 🔥 Flame Jet | 7 mana | 15 base |

> Damage includes ±20% random variation, defense reduction, and a 15% critical hit chance (1.5× damage).


## 🚀 Running Locally
Just run it locally via localhost or you can use the link I  provided for the latest version

## 💾 Save Data

Win/loss stats are stored in `localStorage` under the key `combatCards_stats`.
To reset your record, open the browser console and run:

```js
localStorage.removeItem('combatCards_stats');
```
