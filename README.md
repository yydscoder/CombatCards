#  CombatCards — Emoji Card Battle

This is a browser-based card battle game built in vanilla JavaScript with no frameworks.
Defeat the Enemy by playing cards from your hand before your mana runs out.

## How to Play (LAST UPDATED 28/2/2026)

1. **Three random cards** start in your hand from a 105-card deck (Fire + Water + Nature)
2. Click a card to attack the enemy
3. Each card costs mana — watch your 💧 mana bar
4. **Click "End Turn" to advance** and gain more mana
5. Cards are discarded after use, then draw a new card
6. Defeat the enemy before you run out of cards and mana
7. Win/loss records are saved automatically between sessions

## Mana System

Mana **resets each turn** (does not carry over):

| Turn | Mana | What You Can Play |
|------|------|-------------------|
| 1 | 3 | Ignite (1), Ember (2), WaterJet (2), IceSpike (2) |
| 2 | 6 | + Most 3-5 cost cards |
| 3 | 9 | + High cost cards (Tsunami, DeepFreeze) |
| 4+ | 10 | Full deck available! |

Mana resets each turn , use it or lose it! Plan your combos wisely!!

## Fire Deck Cards (Should probably have a different section for this since it'll be expanding more in the future)

### Common Cards (3 copies each)
| Card | Emoji | Cost | Effect |
|------|-------|------|--------|
| Fire Blast | 🔥 | 5 | 10 base damage, 15% crit |
| Fireball | 🔵 | 4 | 8 damage, 10% burn chance |
| Ember | 🔶 | 2 | 3 damage + 3/turn DoT × 3 turns |
| Ignite | ✨ | 1 | 2 burn/turn, stacks 6×, explodes at max |

### Uncommon Cards (2 copies each)
| Card | Emoji | Cost | Effect |
|------|-------|------|--------|
| Scorch | 🔥 | 4 | 5 damage, -5 DEF permanently |
| FlameShield | 🛡️ | 5 | 12 shield, 20% reflect, +30% fire buff |
| FireWall | 🧱 | 5 | 10 barrier, 3 retaliation damage |
| FlameStrike | ⚔️ | 3 | Buff: +5 DMG + guaranteed crit on next fire card |
| Combust | 💥 | 3 | 12 damage, 2× below 30% HP, mana refund on kill |
| Blaze | 🔥 | 5 | 6 damage + 2 per fire card played |
| FireBreath | 🐉 | 6 | 10-20 damage, 40% burn chance |

### Rare Cards (2 copies each)
| Card | Emoji | Cost | Effect |
|------|-------|------|--------|
| Magma | 🌋 | 4 | 3 damage, doubles/turn, erupts turn 3 |
| Firestorm | 🌪️ | 7 | 3-5 hits × 4-8 damage each |
| Pyroclasm | ☄️ | 6 | 15 damage, sacrifice 10 HP, 2× at <50% HP |

### Legendary Cards (1 copy)
| Card | Emoji | Cost | Effect |
|------|-------|------|--------|
| Inferno | 🌋 | 9 | 18 damage, 25% crit, 50% DEF penetration |

## Water Deck Cards

### Common Cards (3 copies each)
| Card | Emoji | Cost | Effect |
|------|-------|------|--------|
| WaterJet | 💧 | 2 | 5 damage, 15% chance to Wet |
| IceSpike | 🗡️ | 2 | 6 damage, 25% crit chance |

### Uncommon Cards (2 copies each)
| Card | Emoji | Cost | Effect |
|------|-------|------|--------|
| Heal | 💚 | 3 | Restore 10 HP, 10% crit heal |
| AquaBlast | 💦 | 5 | 11 damage, ignores 30% DEF |
| IceWall | 🧊 | 4 | 12 shield for 3 turns, chill retaliation |
| BubbleShield | 🫧 | 4 | 3 bubbles, 5 absorb each |
| FrostBite | ❄️ | 3 | 4 damage, -10% enemy DMG/stack (max 5) |
| Regen | 💟 | 4 | 4 HP/turn for 4 turns |
| Purify | ✨ | 3 | Remove all debuffs + heal 5 HP |
| ManaSpring | 💙 | 2 | Restore 5 mana (net +3) |
| HydroBoost | 🔵 | 3 | Next water spell +50% damage |
| Whirlpool | 🌀 | 5 | 5 damage/turn × 3, 30% miss chance |

### Rare Cards (2 copies each)
| Card | Emoji | Cost | Effect |
|------|-------|------|--------|
| TidalWave | 🌊 | 8 | 16 damage, 30% stun chance |
| DeepFreeze | 🥶 | 7 | 12 damage, 40% freeze (skip 2 turns) |
| Blizzard | ❄️ | 6 | 4 damage × 3 ticks, 20% slow |
| Tsunami | 🌊 | 10 | 20 damage, guaranteed crit vs Wet |

### Legendary Cards (1 copy)
| Card | Emoji | Cost | Effect |
|------|-------|------|--------|
| Leviathan | 🐋 | 10 | 25 damage, guaranteed crit, 50% DEF pen |

## Nature Deck Cards

### Common Cards (3 copies each)
| Card | Emoji | Cost | Effect |
|------|-------|------|--------|
| VineWhip | 🌿 | 2 | 5 damage + 2 Wild DoT for 2 turns |
| Poison | ☠️ | 3 | 4 Poison DoT/turn × 3, stacks 5× |

### Uncommon Cards (2 copies each)
| Card | Emoji | Cost | Effect |
|------|-------|------|--------|
| Regrow | 🌱 | 4 | Heal 12 HP + 3 HP/turn × 2 turns |
| Bloom | 🌸 | 3 | Buff: Next nature spell +60% damage |
| Roots | 🌳 | 4 | 3 damage, Root (50% miss) × 2 turns |
| Thorns | 🌵 | 4 | Reflect 4 damage × 3 turns |
| Photosynthesis | ☀️ | 2 | 2 mana/turn × 3 turns |
| SeedBomb | 🌰 | 5 | 3 hits × 4-8 damage each |
| BarkSkin | 🪵 | 4 | -40% damage taken × 3 turns |
| Sap | 🩸 | 4 | Drain 8 damage, heal self |
| Lifebloom | 🌺 | 5 | 4 HP/turn × 3 + 12 HP bloom |

### Rare Cards (2 copies each)
| Card | Emoji | Cost | Effect |
|------|-------|------|--------|
| WildGrowth | 🌾 | 6 | 3 damage, doubles/turn × 3 |
| Entangle | 🕸️ | 5 | 4 damage, Stun 1 turn + 2 DoT |
| SolarBeam | ☀️ | 7 | 14 damage, 2× vs undead, 20% crit |
| MushroomCloud | 🍄 | 5 | 4 Poison DoT × 3, -25% accuracy |
| Ironbark | 🛡️ | 6 | 20 shield × 4 turns |
| Overgrowth | 🌿 | 8 | 6 DoT × 4, -30% enemy damage |

### Legendary Cards (1 copy)
| Card | Emoji | Cost | Effect |
|------|-------|------|--------|
| NatureWrath | ⛈️ | 10 | 22 damage, guaranteed crit + 5 Poison |

## Elemental Interactions

| Attacker | vs Defender | Effect |
|----------|-------------|--------|
| 🔥 Fire | ❄️ Ice/Water | 1.5× damage |
| 💧 Water | 🔥 Fire | 1.5× damage |
| ❄️ Ice | 🔥 Fire | Takes 1.5× damage |

> Damage includes ±20% random variation, defense reduction, and a 15% critical hit chance (1.5× damage).

## Running Locally

Just run it locally via localhost or you can use the link I provided for the latest version.

## Save Data

Win/loss stats are stored in `localStorage` under the key `combatCards_stats`.

To reset your record, open the browser console and run:

```js
localStorage.removeItem('combatCards_stats');
```
