/* No Pulse — combat test (Milestone 1). Top-down twin-stick, 2D canvas.
   World units are meters. Origin top-left of the map, x right, y down. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const canvas = $('game'); const ctx = canvas.getContext('2d');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------- Data (from the design plan and the loot spec) ---------------- */
  const SURVIVORS = {
    shadow: { name: 'Shadow', who: 'Andre “Dre” Hale · 35', story: 'Raised his little brother by stealing. Buck caught him at 20 and gave him a second chance; he has been a butcher for 15 years. Marcus went into the north tunnel.', role: 'Assassin · Single-target DPS', color: '#9b59b6', hp: 850, dmg: 92, as: 1.25, crit: 0.30, critCap: 0.85, spd: 1.10, dr: 0, dodges: 2, critAffixMult: 2,
      favored: ['smg', 'silenced', 'knife', 'machete'], primary: 'smg', melee: 'machete',
      kit: '<b>Killer Instinct</b> 25% crit, double crit gear. <b>Quiet Feet</b> half notice range. <b>Combo</b> ability hits build Combo (max 3, +10% damage each, fades 5 s after the last ability hit). <b>Kill Reset</b> every kill takes 1 s off Execute; an Execute kill resets Execute and takes 3 s off Ghost Step and Blade Cyclone. <b>Ghost Step</b> stealth 6 s, heals 4%/s unseen; the opener crits and builds Combo, an opener kill halves Ghost Step\'s cooldown. <b>Execute</b> dash + guaranteed crit, 350% +75% per Combo point (spends them); double damage under 30%, under 50% as a 3-point Finisher. <b>Blade Cyclone</b> melee spin that crits, builds Combo on first contact, kills extend it. <b>Lights Out</b> crits up to 8 Hollows, every kill refunds 2 s of everything, ends at full Combo.' },
    wolf: { name: 'Wolf', who: 'Dr. Owen Wolcott · 29', story: 'Resident at St. Brendan’s who walked out on Day 2 with what he could carry. Runs the sick car at the Terminal.', role: 'Medic · Healer', color: '#2ecc71', hp: 1000, dmg: 110, as: 1.00, crit: 0.05, critCap: 0.60, spd: 1.00, dr: 0, dodges: 2, critAffixMult: 1,
      favored: ['pistol', 'smg', 'crossbow'], primary: 'pistol', melee: 'knife',
      kit: '<b>Bedside Manner</b> heals give Triage stacks (+3% dmg, +2% speed). <b>Field Dressing</b> 2 charges, heal an ally 30% (half on himself). <b>Bad Medicine</b> dart: 300%, slows, bursts Spitters. <b>Antiviral Cloud</b> cures Infection in 3 m. <b>Code Blue</b> healing zone that revives.' },
    buck: { name: 'Buck', who: 'Officer Ray Buckley · 39', story: 'Fifteen years on the force. Held the north bridge on Day 9 and turned back a van he still thinks about.', role: 'Tank', color: '#3498db', hp: 1550, dmg: 105, as: 0.85, crit: 0.03, critCap: 0.60, spd: 0.90, dr: 0.25, dodges: 1, critAffixMult: 0.5,
      favored: ['shotgun', 'baton'], primary: 'shotgun', melee: 'baton',
      kit: '<b>Grit</b> every hit you take builds a stack (max 5): +3% reduction and +6% damage each. <b>Stopping Power</b> hits stagger. <b>Body Armor</b> 25% reduction, no knockback. Taunted Hollows that die heal you 3%. <b>Riot Stance</b> 4 s mobile front shield (80%) + heal 20%; blocked hits add Grit. <b>Breaching Shot</b> 350% cone blast, knockdown, +1 Grit per Hollow hit (max 2); spends Grit for +20% damage and 4% heal per stack. <b>Over Here!</b> taunt 10 m, +2 Grit. <b>Hold the Line</b> stun + barricade, full Grit locked in for 8 s.' },
    flight: { name: 'Flight', who: 'Jalen Price · 24', story: 'Lifeguard and swim coach. Six kids from his class vanished on Day 11; a chalk arrow points north.', role: 'Scout · Support', color: '#e74c3c', hp: 850, dmg: 95, as: 1.15, crit: 0.08, critCap: 0.60, spd: 1.30, dr: 0, dodges: 3, critAffixMult: 1,
      favored: ['pistol', 'smg', 'rifle'], primary: 'rifle', melee: 'knife',
      kit: '<b>Momentum</b> builds while you move (dashes add 50): hits do up to +30% at full. Stand still and it drains. <b>Pacesetter</b> allies near him move and reload faster; loot from twice as far. <b>Rescue Run</b> 9 m dash, untouchable, heals 20%, shoves and slows Hollows in the way, leaves a 4 s slipstream allies run faster in (fast revive on a downed ally). <b>Fast Break</b> burst of 3 shots +1 per 25 Momentum (max 7), all crits at 75+; kills refund Momentum. <b>Flare Run</b> pulled Hollows take +15% from everyone. <b>Second Wind</b> squad speed, attack speed, dodges, +10% health; Momentum locked at 100.' },
    savage: { name: 'Savage', who: 'Marcus Hale · 33', story: 'Shadow’s little brother. Worked the docks for 15 years. Walked into the north tunnel on Day 38 and hasn’t come back.', role: 'Bruiser · Area DPS', color: '#c0392b', hp: 1150, dmg: 105, as: 0.95, crit: 0.05, critCap: 0.60, spd: 1.00, dr: 0, dodges: 2, critAffixMult: 1,
      favored: ['sledge', 'fireaxe', 'shotgun'], primary: 'shotgun', melee: 'sledge',
      kit: '<b>Rage</b> is a meter: melee hits +6, hits taken +10, kills +15. Every 25 points +5% damage, +3% reduction; at 100 Rage erupts for 10 s (+40% damage, 25% reduction, hits heal 5%, no crits). Drains out of combat. <b>Shake It Off</b> heal 15% + 10% over 3 s, +30 Rage (+3 s while raging). <b>Ground Pound</b> 4 m 150% knockdown, 225% to Hollows under half health; +5 Rage per Hollow, kills −2 s. <b>Protector</b> leap, shockwave, +20 Rage; the ally you land by takes 30% less for 4 s. <b>Unchained</b> 12 s +60%/35%/heal 10%; Ground Pound reset and twice as fast, swings hit two extra Hollows.' },
    fuse: { name: 'Fuse', who: 'Kerry Dunne · 31', story: 'Transit electrician who bought the city four minutes of light. Last heard tapping Morse from a Southside substation.', role: 'Engineer · Crowd Control', color: '#f1c40f', hp: 950, dmg: 95, as: 1.00, crit: 0.05, critCap: 0.60, spd: 0.95, dr: 0, dodges: 2, critAffixMult: 1,
      favored: ['nailgun', 'shotgun', 'wrench'], primary: 'nailgun', melee: 'wrench',
      kit: '<b>Scrapper</b> +20% Scrap, gadgets 30% stronger. <b>Jumper Cables</b> heal 20%, refreshes and repairs nearby turrets. <b>Junction Turret</b> two charges, each on its own 14 s timer: a 500 HP, 65 dps, 14 m auto-turret for 30 s that finishes the weakest Hollow in range first. Brutes smash it; when destroyed it self-destructs for 300 in 3 m, and a kill refunds half the turret cooldown. <b>Arc Mine</b> two charges, 9 s each: placed mine, stuns 3 m. <b>Third Rail</b> restores both turret charges, repairs turrets, and for 12 s they fire piercing lasers that burn for 10 s.' },
    hush: { name: 'Hush', who: 'June Sato · 48', story: 'Photographer, mute from birth. She talks in sign and index cards, and she photographed everything on Day 9.', role: 'Marksman · Single-target DPS', color: '#95a5a6', hp: 900, dmg: 120, as: 1.00, crit: 0.10, critCap: 0.70, spd: 1.00, dr: 0, dodges: 2, critAffixMult: 1,
      favored: ['marksman', 'sniper', 'revolver'], primary: 'marksman', melee: 'knife',
      kit: '<b>Deadeye</b> every hit builds Focus (up to +35% damage, +20% range; fades only after 2.5 s without a hit). Every 3rd hit in a row on the same Hollow is a guaranteed crit at +50% crit damage. <b>Weak Spot</b> focused hits on Brutes +35%. <b>Collateral</b> with a sniper rifle, a round that passes through a second Hollow crits every Hollow it hit. <b>Second Wind</b> heal 12% now + 12% over 4 s, instant reload, next shot crits. <b>Headshot</b> 300% guaranteed crit that pins; a kill refunds 6 s and fills Focus. <b>Spotter\'s Call</b> marks the target and everything within 4 m (+15% from the squad, 8 s); your hits on Marked Hollows ricochet to another Marked one for 35%. <b>Dead Air</b> 6 s: no reloads, +50% attack speed, every shot pierces and crits.' },
    torch: { name: 'Torch', who: 'Valeria “Val” Reyes · 38', story: 'Pier 9 pyro tech. Handed her niece Luz to Flight on Day 4 and believes the van made it across.', role: 'Demolition · Area DPS', color: '#e67e22', hp: 1000, dmg: 90, as: 0.90, crit: 0.05, critCap: 0.60, spd: 1.00, dr: 0.10, dodges: 2, critAffixMult: 1,
      favored: ['flamethrower', 'flaregun', 'fireaxe'], primary: 'flamethrower', melee: 'fireaxe',
      kit: '<b>Burn</b> her hits set Hollows on fire and splash 2 m. <b>Fireproof</b> immune to fire. <b>Controlled Burn</b> fire under her feet; heals 5%/s in her own fire. <b>Molotov</b> 200% blast, heavy burn, fire pool 5 s. <b>Fire Break</b> aimed line Hollows won\'t cross. <b>Grand Finale</b> 8 s wide-cone flamethrower.' },
  };
  /* Abilities: every survivor has Sustain (s), Damage (d), Utility (u) and an Ultimate (r).
     kind: instant | aimed (direction) | target (one Hollow) | ally (an ally, or self) | throw (landing point) | place (landing point + ghost).
     Tap = quick cast on the nearest target in range. Hold-and-drag = aim. */
  const ADREN_MAX = 300;
  const KITS = {
    shadow: { s: { name: 'Ghost Step', cd: 16, kind: 'instant' }, d: { name: 'Execute', cd: 7, kind: 'target', range: 4.5 }, u: { name: 'Blade Cyclone', cd: 12, kind: 'instant' }, r: { name: 'Lights Out' } },
    wolf:   { s: { name: 'Field Dressing', cd: 12, kind: 'ally', range: 10, charges: 2 }, d: { name: 'Bad Medicine', cd: 8, kind: 'aimed', range: 20 }, u: { name: 'Antiviral Cloud', cd: 16, kind: 'throw', range: 8, radius: 3 }, r: { name: 'Code Blue' } },
    buck:   { s: { name: 'Riot Stance', cd: 14, kind: 'instant' }, d: { name: 'Breaching Shot', cd: 10, kind: 'aimed', range: 4.5 }, u: { name: 'Over Here!', cd: 14, kind: 'instant' }, r: { name: 'Hold the Line' } },
    flight: { s: { name: 'Rescue Run', cd: 14, kind: 'aimed', range: 9 }, d: { name: 'Fast Break', cd: 8, kind: 'aimed', range: 26 }, u: { name: 'Flare Run', cd: 14, kind: 'throw', range: 12, radius: 1 }, r: { name: 'Second Wind' } },
    savage: { s: { name: 'Shake It Off', cd: 14, kind: 'instant' }, d: { name: 'Ground Pound', cd: 12, kind: 'instant' }, u: { name: 'Protector', cd: 14, kind: 'ally', range: 12, dir: true }, r: { name: 'Unchained' } },
    fuse:   { s: { name: 'Jumper Cables', cd: 15, kind: 'instant' }, d: { name: 'Junction Turret', cd: 14, kind: 'place', range: 6, radius: 0.6, multi: 2 }, u: { name: 'Arc Mine', cd: 9, kind: 'place', range: 6, radius: 0.4, multi: 2 }, r: { name: 'Third Rail' } },
    hush:   { s: { name: 'Second Wind', cd: 16, kind: 'instant' }, d: { name: 'Headshot', cd: 12, kind: 'target', range: 40 }, u: { name: "Spotter's Call", cd: 14, kind: 'target', range: 40 }, r: { name: 'Dead Air' } },
    torch:  { s: { name: 'Controlled Burn', cd: 14, kind: 'instant' }, d: { name: 'Molotov', cd: 10, kind: 'throw', range: 9, radius: 2 }, u: { name: 'Fire Break', cd: 14, kind: 'aimed', range: 2 }, r: { name: 'Grand Finale' } },
  };
  // iLvl 1 Common. dmg per hit, rate/s, mag, reload s, range m, noise (0 silent,1 low,2 med,3 loud), targets (pellets / cleave)
  const WEAPONS = {
    pistol:   { name: 'Pistol', type: 'gun', dmg: 66, rate: 1.8, mag: 12, reload: 1.1, range: 18, noise: 2, spread: 0.03 },
    silenced: { name: 'Silenced pistol', type: 'gun', dmg: 52, rate: 1.8, mag: 12, reload: 1.1, range: 16, noise: 0, spread: 0.03 },
    revolver: { name: 'Revolver', type: 'gun', dmg: 190, rate: 0.6, mag: 6, reload: 2.0, range: 24, noise: 3, spread: 0.015, critDmg: 0.25 },
    smg:      { name: 'SMG', type: 'gun', dmg: 38, rate: 3.6, mag: 30, reload: 1.6, range: 15, noise: 2, spread: 0.08 },
    rifle:    { name: 'Carbine', type: 'gun', dmg: 78, rate: 1.6, mag: 24, reload: 1.8, range: 26, noise: 2, spread: 0.03 },
    shotgun:  { name: 'Shotgun', type: 'gun', dmg: 19, rate: 1.0, mag: 6, reload: 1.5, range: 11, noise: 3, spread: 0.12, pellets: 8, knock: 1.8, shake: 0.18 },
    crossbow: { name: 'Crossbow', type: 'gun', dmg: 230, rate: 0.7, mag: 1, reload: 1.2, range: 28, noise: 0, spread: 0.01, pierce: 2 },
    nailgun:  { name: 'Nail gun', type: 'gun', dmg: 34, rate: 4.0, mag: 40, reload: 1.8, range: 12, noise: 1, spread: 0.05, pin: 1.0 },
    marksman: { name: 'Marksman rifle', type: 'gun', dmg: 135, rate: 1.0, mag: 10, reload: 2.0, range: 38, noise: 3, spread: 0.008, critDmg: 0.25 },
    sniper:   { name: 'Sniper rifle', type: 'gun', dmg: 390, rate: 0.3, mag: 5, reload: 2.8, range: 50, noise: 3, spread: 0.004, pierce: 3, critDmg: 0.5, shake: 0.12 },
    flamethrower: { name: 'Flamethrower', type: 'gun', dmg: 14, rate: 8.0, mag: 100, reload: 3.0, range: 8, noise: 2, spread: 0, cone: 0.5, burn: 1 },
    flaregun: { name: 'Flare gun', type: 'gun', dmg: 90, rate: 0.5, mag: 1, reload: 1.6, range: 30, noise: 1, spread: 0.01, firePool: 2.5, lure: 15 },
    knife:    { name: 'Knife', type: 'melee', dmg: 80, rate: 2.2, range: 2.4, noise: 0, arc: 1.5, targets: 1 },
    machete:  { name: 'Machete', type: 'melee', dmg: 135, rate: 1.1, range: 3.0, noise: 0, arc: 1.9, targets: 2 },
    baton:    { name: 'Baton', type: 'melee', dmg: 95, rate: 1.3, range: 2.8, noise: 0, arc: 1.9, targets: 2, stagger3: true, knock: 1.2 },
    sledge:   { name: 'Sledgehammer', type: 'melee', dmg: 240, rate: 0.5, range: 2.8, noise: 1, arc: 2.4, targets: 3, knock: 2.0, knockdown: 1.0, shake: 0.15 },
    fireaxe:  { name: 'Fire axe', type: 'melee', dmg: 170, rate: 0.8, range: 2.8, noise: 1, arc: 2.0, targets: 2, knock: 0.8 },
    wrench:   { name: 'Wrench', type: 'melee', dmg: 90, rate: 1.3, range: 2.4, noise: 0, arc: 1.6, targets: 1, knock: 0.6 },
  };
  const NOISE_M = [0, 8, 15, 25];
  const RARITY = [
    { id: 'common', name: 'Common', w: 55, mult: 1.00, affixes: 0, color: '#9aa4b0', gs: 0 },
    { id: 'uncommon', name: 'Uncommon', w: 27, mult: 1.05, affixes: 1, color: '#2ecc71', gs: 5 },
    { id: 'rare', name: 'Rare', w: 12, mult: 1.10, affixes: 2, color: '#3498db', gs: 10 },
    { id: 'epic', name: 'Epic', w: 5, mult: 1.15, affixes: 3, color: '#9b59b6', gs: 15 },
    { id: 'legendary', name: 'Legendary', w: 0.9, mult: 1.20, affixes: 3, color: '#e67e22', gs: 20 },
  ];
  const AFFIXES = {
    weapon: [['dmg', 'Damage', 0.03, 0.08, '%'], ['crit', 'Crit chance', 0.01, 0.03, '%'], ['critDmg', 'Crit damage', 0.04, 0.08, '%'], ['as', 'Attack speed', 0.02, 0.05, '%'], ['handling', 'Handling', 0.05, 0.12, '%']],
    armor: [['hp', 'Health', 0.03, 0.06, '%'], ['dr', 'Damage reduction', 0.01, 0.03, '%'], ['spd', 'Move speed', 0.02, 0.04, '%'], ['infres', 'Infection resist', 0.05, 0.12, '%'], ['healrecv', 'Healing received', 0.04, 0.10, '%']],
  };
  const ARMOR_SLOTS = ['Head', 'Chest', 'Gloves', 'Legs', 'Boots'];
  const HOLLOWS = {
    walker: { name: 'Walker', hp: 250, dmg: 40, spd: 1.1, r: 0.45, notice: 10, attackRange: 0.9, attackRate: 1.0, drop: 0.2, color: '#6f8f6a', bite: 0.5 },
    runner: { name: 'Runner', hp: 160, dmg: 30, spd: 3.4, r: 0.38, notice: 16, attackRange: 0.9, attackRate: 1.6, drop: 0.3, color: '#8fa87a', bite: 0.5 },
    brute:  { name: 'Brute', hp: 3000, dmg: 110, spd: 1.5, r: 0.9, notice: 14, attackRange: 1.5, attackRate: 0.6, drop: 1.0, color: '#56604f', bite: 3, armor: true },
    // Screamer: spots you, winds up for 2 s, then calls a horde. Kill it before it screams: guaranteed drop, one rarity step up.
    screamer: { name: 'Screamer', hp: 160, dmg: 25, spd: 1.3, r: 0.42, notice: 14, attackRange: 0.9, attackRate: 0.8, drop: 0.5, color: '#b08a5a', bite: 0.5, screamWindup: 2.0, screamRadius: 25 },
    // Spitter: keeps 5–9 m away and lobs acid that leaves a pool. Acid damages over time and builds Infection fast. Always drops Chemicals.
    spitter:  { name: 'Spitter', hp: 300, dmg: 0, spd: 1.25, r: 0.48, notice: 18, attackRange: 9, keepAway: 5, attackRate: 0.5, drop: 0.25, color: '#7fb347', bite: 0, acidDps: 20, acidInf: 0.025, poolR: 1.5, poolT: 5 },
  };
  const RUN_SECONDS = 180;
  // quest items: recoverable objectives scattered through Southside. Walk up and hold position to recover; squad-shared.
  const QUEST_ITEMS = [
    { key: 'sample', name: 'Antiviral sample', short: 'Sample', col: '46,204,113', hex: '#2ecc71' },
    { key: 'cache', name: 'Supply cache', short: 'Cache', col: '241,196,15', hex: '#f1c40f' },
    { key: 'log', name: 'Patrol log', short: 'Log', col: '52,152,219', hex: '#3498db' },
  ];
  const QUEST_PICK_R = 1.4, QUEST_PICK_T = 1.2;

  /* ---------------- Map: Southside greybox ---------------- */
  const MAP = { w: 64, h: 48, blocks: [], lights: [], spawns: [], extract: { x: 58, y: 6 } };
  (function buildMap() {
    // rowhouse blocks laid out on a street grid, with alleys between
    const rows = [4, 16, 28, 40], cols = [4, 18, 32, 46];
    rows.forEach((ry, i) => cols.forEach((cx, j) => {
      if (i === 0 && j === 3) return; // extraction lot in the NE corner
      if (i === 1 && j === 1) { MAP.blocks.push({ x: cx, y: ry, w: 4.5, h: 6 }); MAP.blocks.push({ x: cx + 6.5, y: ry, w: 4.5, h: 6 }); return; } // a gap for the start courtyard
      const w = 10, h = 6;
      MAP.blocks.push({ x: cx, y: ry, w, h });
      // porches / cars as small obstacles
      if ((i + j) % 2 === 0) MAP.blocks.push({ x: cx + 2, y: ry + h + 1.2, w: 1.8, h: 0.9, car: true });
      if ((i + j) % 3 === 0) MAP.blocks.push({ x: cx + w + 1.5, y: ry + 1, w: 0.9, h: 1.8, car: true });
    }));
    // streetlights at intersections
    for (let y = 2; y < MAP.h; y += 12) for (let x = 2; x < MAP.w; x += 14) MAP.lights.push({ x: x + rand(-0.5, 0.5), y: y + rand(-0.5, 0.5), r: 7 + rand(0, 2), flicker: Math.random() < 0.25 });
    MAP.lights.push({ x: MAP.extract.x, y: MAP.extract.y, r: 5, flicker: false, warm: true });
    // spawn points along the edges
    for (let x = 2; x < MAP.w; x += 6) { MAP.spawns.push({ x, y: 1 }); MAP.spawns.push({ x, y: MAP.h - 1 }); }
    for (let y = 2; y < MAP.h; y += 6) { MAP.spawns.push({ x: 1, y }); MAP.spawns.push({ x: MAP.w - 1, y }); }
  })();
  const solidAt = (x, y, r = 0) => {
    if (x < r || y < r || x > MAP.w - r || y > MAP.h - r) return true;
    for (const b of MAP.blocks) if (x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.h + r) return true;
    return false;
  };
  // move with simple axis-separated collision
  function moveEntity(e, dx, dy) {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    if (!solidAt(e.x + dx, e.y, e.r)) e.x += dx;
    if (!solidAt(e.x, e.y + dy, e.r)) e.y += dy;
  }
  // flow field toward the player (BFS on 1 m cells)
  const GW = MAP.w, GH = MAP.h; const walk = new Uint8Array(GW * GH); const FIELD_MAIN = new Int16Array(GW * GH);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) walk[y * GW + x] = solidAt(x + 0.5, y + 0.5, 0.35) ? 0 : 1;
  const queue = new Int32Array(GW * GH); const flareField = new Int16Array(GW * GH);
  function computeField(px, py, fld) {
    const field = fld || FIELD_MAIN;
    field.fill(-1); let qh = 0, qt = 0;
    const sx = clamp(Math.floor(px), 0, GW - 1), sy = clamp(Math.floor(py), 0, GH - 1);
    field[sy * GW + sx] = 0; queue[qt++] = sy * GW + sx;
    while (qh < qt) {
      const c = queue[qh++]; const cx = c % GW, cy = (c / GW) | 0; const d = field[c] + 1;
      if (cx > 0 && walk[c - 1] && field[c - 1] < 0) { field[c - 1] = d; queue[qt++] = c - 1; }
      if (cx < GW - 1 && walk[c + 1] && field[c + 1] < 0) { field[c + 1] = d; queue[qt++] = c + 1; }
      if (cy > 0 && walk[c - GW] && field[c - GW] < 0) { field[c - GW] = d; queue[qt++] = c - GW; }
      if (cy < GH - 1 && walk[c + GW] && field[c + GW] < 0) { field[c + GW] = d; queue[qt++] = c + GW; }
    }
  }
  function flowDir(x, y, fld) {
    const field = fld || FIELD_MAIN; const cx = clamp(Math.floor(x), 0, GW - 1), cy = clamp(Math.floor(y), 0, GH - 1);
    let best = field[cy * GW + cx], bx = 0, by = 0;
    if (best < 0) return null;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      if (!ox && !oy) continue; const nx = cx + ox, ny = cy + oy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const v = field[ny * GW + nx]; if (v < 0) continue;
      if (ox && oy && (!walk[cy * GW + nx] || !walk[ny * GW + cx])) continue; // no corner cutting
      if (v < best) { best = v; bx = ox; by = oy; }
    }
    if (!bx && !by) return null;
    const l = Math.hypot(bx, by); return { x: bx / l, y: by / l };
  }

  /* ---------------- Audio (synth, starts on first gesture) ---------------- */
  const audio = { ctx: null, on: false };
  function audioInit() { if (audio.ctx) return; try { audio.ctx = new (window.AudioContext || window.webkitAudioContext)(); audio.on = true; } catch (e) { audio.on = false; } }
  function sfx(kind, vol = 1) {
    if (S.coop && S.isHost) { if (ctxPlayer && ctxPlayer !== S.p) { if (netSfx.length < 12) netSfx.push([ctxPlayer.sid, kind, vol]); return; } if (!ctxPlayer && netSfx.length < 12) netSfx.push([-1, kind, vol]); }
    if (!audio.on) return; const c = audio.ctx; if (c.state === 'suspended') c.resume(); const t = c.currentTime;
    const g = c.createGain(); g.connect(c.destination);
    const env = (a, peak, d) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak * vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
    if (kind === 'shot' || kind === 'shotgun' || kind === 'silenced') {
      const n = c.createBufferSource(); const len = kind === 'shotgun' ? 0.18 : 0.07; const buf = c.createBuffer(1, c.sampleRate * len, c.sampleRate); const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      n.buffer = buf; const f = c.createBiquadFilter(); f.type = kind === 'silenced' ? 'bandpass' : 'lowpass'; f.frequency.value = kind === 'silenced' ? 900 : kind === 'shotgun' ? 700 : 2200; n.connect(f); f.connect(g);
      env(0.004, kind === 'silenced' ? 0.12 : kind === 'shotgun' ? 0.5 : 0.28, len); n.start(t); n.stop(t + len + 0.02);
    } else if (kind === 'melee') {
      const o = c.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.12); o.connect(g); env(0.005, 0.12, 0.12); o.start(t); o.stop(t + 0.15);
    } else if (kind === 'hit') {
      const o = c.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.08); o.connect(g); env(0.003, 0.1, 0.08); o.start(t); o.stop(t + 0.1);
    } else if (kind === 'bite') {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.2); o.connect(g); env(0.005, 0.25, 0.2); o.start(t); o.stop(t + 0.22);
    } else if (kind === 'pickup') {
      [660, 990].forEach((f, i) => { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; const gg = c.createGain(); gg.connect(c.destination); gg.gain.setValueAtTime(0.0001, t + i * 0.07); gg.gain.exponentialRampToValueAtTime(0.12 * vol, t + i * 0.07 + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.18); o.connect(gg); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.2); });
    } else if (kind === 'beep') {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 1000; o.connect(g); env(0.004, 0.08, 0.06); o.start(t); o.stop(t + 0.08);
    } else if (kind === 'roar') {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(45, t + 0.6); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400; o.connect(f); f.connect(g); env(0.05, 0.3, 0.6); o.start(t); o.stop(t + 0.7);
    } else if (kind === 'screamWind') {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(180, t); o.frequency.linearRampToValueAtTime(420, t + 1.8); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 3; o.connect(f); f.connect(g); env(0.1, 0.12, 1.9); o.start(t); o.stop(t + 2.0);
    } else if (kind === 'scream') {
      [0, 0.03].forEach(off => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(500, t + off); o.frequency.exponentialRampToValueAtTime(1500, t + off + 0.25); o.frequency.exponentialRampToValueAtTime(700, t + off + 0.8); const gg = c.createGain(); gg.connect(c.destination); gg.gain.setValueAtTime(0.0001, t + off); gg.gain.exponentialRampToValueAtTime(0.28 * vol, t + off + 0.05); gg.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.9); o.connect(gg); o.start(t + off); o.stop(t + off + 0.95); });
    } else if (kind === 'spit') {
      const n = c.createBufferSource(); const buf = c.createBuffer(1, c.sampleRate * 0.15, c.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.5); n.buffer = buf; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; n.connect(f); f.connect(g); env(0.01, 0.18, 0.14); n.start(t); n.stop(t + 0.17);
    } else if (kind === 'acid') {
      const n = c.createBufferSource(); const buf = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); n.buffer = buf; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000; n.connect(f); f.connect(g); env(0.02, 0.1, 0.38); n.start(t); n.stop(t + 0.42);
    } else if (kind === 'fire') {
      const n = c.createBufferSource(); const buf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 0.7); n.buffer = buf; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; n.connect(f); f.connect(g); env(0.02, 0.3, 0.48); n.start(t); n.stop(t + 0.52);
    } else if (kind === 'zap') {
      const o = c.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(1800, t); o.frequency.exponentialRampToValueAtTime(200, t + 0.18); o.connect(g); env(0.003, 0.2, 0.2); o.start(t); o.stop(t + 0.22);
    } else if (kind === 'ability') {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.15); o.connect(g); env(0.01, 0.1, 0.2); o.start(t); o.stop(t + 0.25);
    } else if (kind === 'flat') {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 1000; o.connect(g); g.gain.setValueAtTime(0.12 * vol, t); g.gain.linearRampToValueAtTime(0.0001, t + 2.2); o.start(t); o.stop(t + 2.3);
    }
  }

  /* ---------------- State ---------------- */
  const S = { mode: 'title', t: 0, time: 0, wave: 0, kills: 0, dmgDealt: 0, survivor: null, p: null, zombies: [], bullets: [], fx: [], decals: [], loot: [], found: [], spawnTimer: 2, bruteTimer: 60, extractOpen: false, fieldTimer: 0, shake: 0, lowBeep: 0, result: null, nextToastKey: 0, flares: [], spits: [], pools: [], chems: 0, screamerTimer: 40, spitterTimer: 70, turrets: [], mines: [], fires: [] };
  const input = { mx: 0, my: 0, ax: 0, ay: 0, fire: false, keys: {}, mouse: { x: 0, y: 0, down: false }, touches: { move: null, pan: null }, dodge: false, swap: false, ult: false, casts: [], attack: null, lock: null, cand: null, prio: null, ret: null, camOff: { x: 0, y: 0 } };
  let W = 0, H = 0, PPM = 32, DPR = 1; const cam = { x: 0, y: 0 };

  function makeItem(kind, rar, ilvl) {
    const r = RARITY[rar];
    if (kind === 'weapon') {
      const keys = Object.keys(WEAPONS); const key = keys[(Math.random() * keys.length) | 0]; const base = WEAPONS[key];
      const item = { kind: 'weapon', key, name: base.name, rar: r, ilvl, mult: r.mult * Math.pow(1.055, ilvl - 1), affixes: rollAffixes('weapon', r.affixes), gs: ilvl * 10 + r.gs };
      item.label = `${r.name} ${base.name}`; return item;
    }
    const slot = ARMOR_SLOTS[(Math.random() * ARMOR_SLOTS.length) | 0];
    const hpFlat = Math.round(40 * r.mult * Math.pow(1.055, ilvl - 1));
    return { kind: 'armor', slot, name: slot, rar: r, ilvl, hpFlat, affixes: rollAffixes('armor', r.affixes), gs: ilvl * 10 + r.gs, label: `${r.name} ${slot}` };
  }
  function rollAffixes(pool, n) {
    const src = AFFIXES[pool].slice(); const out = [];
    for (let i = 0; i < n && src.length; i++) { const k = (Math.random() * src.length) | 0; const [id, name, lo, hi] = src.splice(k, 1)[0]; out.push({ id, name, v: +(rand(lo, hi)).toFixed(3) }); }
    return out;
  }
  function rollRarity(luck = 0, minTier = 0) {
    const ws = RARITY.map((r, i) => (i < minTier ? 0 : r.w * (i >= 2 ? Math.pow(1.01, luck * 100) : 1)));
    const tot = ws.reduce((a, b) => a + b, 0); let x = Math.random() * tot;
    for (let i = 0; i < ws.length; i++) { x -= ws[i]; if (x <= 0) return i; } return 0;
  }

  function newPlayer(id, sid = 0, name) {
    const d = SURVIVORS[id];
    const p = { id, d, x: 23.5, y: 19, r: 0.45, hp: d.hp, maxHp: d.hp, inf: 0, aim: 0, vx: 0, vy: 0, moving: false,
      weapons: { primary: { kind: 'weapon', key: d.primary, name: WEAPONS[d.primary].name, rar: RARITY[0], ilvl: 1, mult: 1, affixes: [], gs: 10, label: 'Common ' + WEAPONS[d.primary].name }, melee: { kind: 'weapon', key: d.melee, name: WEAPONS[d.melee].name, rar: RARITY[0], ilvl: 1, mult: 1, affixes: [], gs: 10, label: 'Common ' + WEAPONS[d.melee].name } },
      slot: 'primary', bag: [], scrap: 0, mag: WEAPONS[d.primary].mag, reserve: 240, reloading: 0, fireCd: 0, armor: {}, dodges: d.dodges, dodgeT: 0, dodgeRecharge: 0, invuln: 0,
      cd: { s: 0, d: 0, u: 0 }, mcd: {}, mcAvail: {}, overT: 0, deadAir: 0, focusT: 0, grit: 0, gritT: 0, gritLock: 0, mom: 0, stillT: 0, rageM: 0, guard: 0, lastCombat: -9, pounding: false, fbFiring: false, slipLast: null, streak: 0, streakZ: null, collateralN: 0, combo: 0, comboT: 0, qCharges: id === 'wolf' ? 2 : 1, adren: 0, hitMult: 1, forceCrit: false, digIn: 0, digX: 0, digY: 0, breathe: 0, cburn: 0, boost: 0, unchained: 0, longExp: 0, finale: 0, slow: 0, ultChain: null, ultT: 0, stealth: 0, exposedHit: false, cyclone: 0, cycloneTick: 0, shield: 0, taunt: 0, immune: 0, triage: [], hot: 0, hotT: 0, hurtT: 0, swing: 0, swingDir: 0, lastNoise: 0, moveT: 0, tailwind: false, acidT: 0, rage: 0, rageCd: 0, rageSpent: 0, focus: 0, leap: false, fireT: 0,
      sid, name: name || d.name, input: { mx: 0, my: 0, ax: 1, ay: 0, aimActive: false, mouseAim: false, fire: false, dodge: false, swap: false, casts: [], ult: false, lock: null }, down: false, downT: 0, reviveP: 0, dead: false, rescueBoost: false, found: [], st: { k: 0, dmg: 0, taken: 0, heal: 0, rev: 0, downs: 0 } };
    return p;
  }
  // derived stats from gear
  function stats(p) {
    const w = p.weapons[p.slot]; const base = WEAPONS[w.key];
    let dmgPct = 0, crit = p.d.crit, critDmg = 0.5 + (base.critDmg || 0), as = 0, handling = 0, hpPct = 0, dr = p.d.dr, spd = 0, infres = 0, healrecv = 0, hpFlat = 0;
    const applyAff = (a) => { if (a.id === 'dmg') dmgPct += a.v; else if (a.id === 'crit') crit += a.v * p.d.critAffixMult; else if (a.id === 'critDmg') critDmg += a.v * p.d.critAffixMult; else if (a.id === 'as') as += a.v; else if (a.id === 'handling') handling += a.v; else if (a.id === 'hp') hpPct += a.v; else if (a.id === 'dr') dr += a.v; else if (a.id === 'spd') spd += a.v; else if (a.id === 'infres') infres += a.v; else if (a.id === 'healrecv') healrecv += a.v; };
    w.affixes.forEach(applyAff);
    Object.values(p.armor).forEach(it => { hpFlat += it.hpFlat; it.affixes.forEach(applyAff); });
    const tri = p.triage.length; dmgPct += tri * 0.03; spd += tri * 0.02;
    if (p.shield > 0) dr += 0; if (p.taunt > 0) dr += 0.30;
    const ghost = perk('ghost') && (p.id === 'shadow' || p.id === 'flight') && S.players.every(o => o.dead || (o.id !== 'shadow' && o.id !== 'flight') || (S.time - (o.lastHitAt || -9)) > 4);
    if (p.rage > 0) { dmgPct += p.unchained > 0 ? 0.60 : 0.40; dr += p.unchained > 0 ? 0.35 : 0.25; crit = 0; }
    else if (p.id === 'savage') { const tier = Math.floor((p.rageM || 0) / 25); dmgPct += 0.05 * tier; dr += 0.03 * tier; }
    if (p.id === 'buck') { dmgPct += 0.06 * (p.grit || 0); dr += 0.03 * (p.grit || 0); }
    if (p.id === 'flight') dmgPct += 0.003 * (p.mom || 0);
    if (S.zones.some(zn => zn.kind === 'slip' && dist(zn.x, zn.y, p.x, p.y) <= zn.r)) spd += 0.25;
    if (p.id === 'hush') { dmgPct += p.deadAir > 0 ? 0.5 : p.focus * 0.7; if (p.deadAir > 0) as += 0.5; }
    if (p.id === 'shadow') dmgPct += 0.10 * (p.combo || 0);
    if (p.boost > 0) { spd += 0.3; as += 0.2; }
    if (p.id !== 'flight' && S.players.some(o => o !== p && o.id === 'flight' && !o.down && !o.dead && dist(o.x, o.y, p.x, p.y) <= 8)) { spd += 0.1; handling += 0.15; }
    crit = Math.min(crit, p.d.critCap); dr = Math.min(dr, 0.6);
    const range = base.range * (p.id === 'hush' ? 1 + 0.4 * p.focus : 1);
    const maxHp = Math.round((p.d.hp + hpFlat) * (1 + hpPct) * (p.inf >= 0.75 ? 0.8 : 1));
    const favored = p.d.favored.includes(w.key);
    return { range, dmgPct, crit, critDmg, as, handling, dr, spd: p.d.spd * (1 + spd) * (ghost ? 1.08 : 1) * (p.stealth > 0 ? 1.15 : 1) * (p.cyclone > 0 ? 0.5 : 1) * (p.digIn > 0 ? 0.7 : 1) * (p.slow > 0 ? 0.6 : 1), infres, healrecv, maxHp, favored, base, w };
  }

  /* ---------------- Screens ---------------- */
  const screens = { title: $('title'), select: $('select'), hud: $('hud'), summary: $('summary'), lobby: $('lobby') };
  function show(name) { Object.entries(screens).forEach(([k, el]) => el.classList.toggle('hidden', k !== name && !(name === 'game' && k === 'hud'))); }
  // landscape: ask for fullscreen + lock where the browser allows it (Android); iPhone only gets the rotate prompt
  const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  let portraitOk = false;
  function tryLandscape() {
    if (!isTouch) return;
    const el = document.documentElement; const req = el.requestFullscreen || el.webkitRequestFullscreen;
    const lock = () => { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) {} };
    try { if (req && !document.fullscreenElement) { const r = req.call(el); if (r && r.then) r.then(lock, lock); else lock(); } else lock(); } catch (e) { lock(); }
  }
  function checkOrientation() {
    const portrait = window.innerHeight > window.innerWidth;
    $('rotate').classList.toggle('hidden', !(isTouch && portrait && !portraitOk));
  }
  window.addEventListener('resize', checkOrientation); window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 150)); checkOrientation();
  $('btnPortrait').addEventListener('click', () => { portraitOk = true; checkOrientation(); });
  $('btnStart').addEventListener('click', () => { audioInit(); tryLandscape(); S.mode = 'select'; show('select'); });
  (function buildCards() {
    $('cards').innerHTML = Object.entries(SURVIVORS).map(([id, d]) => `<button class="card" style="--role:${d.color}" data-pick="${id}" data-interactive><img src="./assets/${id}-sm.jpg" alt=""><div class="body"><div class="role">${d.role}</div><div class="name">${d.name}</div><div class="who">${d.who}</div><div class="story">${d.story}</div><div class="kit">${d.kit}</div><div class="kit" style="margin-top:6px">Starts with <b>${WEAPONS[d.primary].name}</b> + <b>${WEAPONS[d.melee].name}</b> · ${d.hp.toLocaleString()} HP</div></div></button>`).join('');
    $('cards').addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (!b) return; if (net.active) net.pick(b.dataset.pick); else startRun(b.dataset.pick); });
  })();
  $('btnAgain').addEventListener('click', () => { if (S.coop) net.restart(); else startRun(S.survivor); });
  $('btnSwitch').addEventListener('click', () => { if (S.coop) net.toLobby(true); else { S.mode = 'select'; show('select'); } });

  function startRun(id, roster) {
    audioInit();
    // roster: [{ sid, id, name }] for co-op; S.mySid picks which one is ours
    input.lock = null; input.cand = null; input.attack = null; S.survivor = id; S.zombies = []; S.bullets = []; S.fx = netArr('fx'); S.decals = netArr('decals'); S.loot = []; S.found = []; S.zid = 0; S.lid = 0; netEv.length = 0; netSfx.length = 0;
    if (roster) { S.players = roster.map(r => newPlayer(r.id, r.sid, r.name)); S.p = S.players.find(p => p.sid === S.mySid) || S.players[0]; const spots = [[23.5, 19], [23.5, 20.4], [23.5, 17.6], [23.5, 21.8]]; S.players.forEach((p, i) => { p.x = spots[i % 4][0]; p.y = spots[i % 4][1]; }); } // the start courtyard is a 2 m gap, so line up in it
    else { S.coop = false; S.isHost = true; S.isClient = false; S.mySid = 0; S.p = newPlayer(id); S.players = [S.p]; }
    id = S.p.id;
    S.perks = new Set(DUO_PERKS.filter(dp => dp.pair.every(pid => S.players.some(o => o.id === pid))).map(dp => dp.key));
    S.time = 0; S.wave = 1; S.kills = 0; S.dmgDealt = 0; S.spawnTimer = 1.5; S.bruteTimer = 55; S.extractOpen = false; S.result = null; S.shake = 0; S.flares = []; S.spits = []; S.pools = []; S.chems = 0; S.screamerTimer = 40; S.spitterTimer = 70; S.turrets = []; S.mines = []; S.fires = []; S.zones = []; S.throws = []; S.barricades = [];
    cam.x = S.p.x; cam.y = S.p.y;
    $('hudPortrait').src = `./assets/${id}-sm.jpg`; $('hudName').textContent = SURVIVORS[id].name; setupWheel(S.p); buildMinimap(); layoutWheel();
    $('toasts').innerHTML = ''; $('vignette').className = 'vignette'; S.paused = false; hidePickup(); $('bag').classList.add('hidden'); $('btnBag').classList.remove('new'); renderBag();
    S.quest = { items: [], done: 0, total: QUEST_ITEMS.length, bonus: false }; if (S.isHost || !S.coop) spawnQuestItems(); renderQuestHud();
    S.mode = 'game'; show('game'); objective('Survive. Recover the 3 supply drops. Extraction opens at 0:30 left.', false, 5);
    // opening pack so there is something to shoot right away
    if (!S.isClient) for (let i = 0; i < 5; i++) spawnZombie('walker', 23.5 + rand(-3, 3), 28 + rand(-1, 1));
    const K = KITS[id]; withPlayer(S.p, () => { if (isTouch) toast('<b>Hold Attack</b> to keep hitting the gold-ringed Hollow. <b>Elite</b> locks the nearest Brute, Screamer or Spitter; tap it again to unlock. <b>Hold and drag</b> a skill to aim it, drag onto <b>✕</b> to cancel. Drag the right side of the screen to look around.', '#e67e22'); else toast(`<b>${SURVIVORS[id].name}</b> heading out. ${K.s.name} on 1, ${K.d.name} on 2, ${K.u.name} on 3, ${K.r.name} on R. Tap a key for the nearest target, hold it to aim with the mouse.`, SURVIVORS[id].color);
    if (S.coop) toast(`<b>Co-op.</b> ${S.players.length} survivors. Stand still next to a downed ally to revive.`, '#e67e22'); if (S.perks.size) toast(`<b>Squad perks:</b> ${DUO_PERKS.filter(dp => S.perks.has(dp.key)).map(dp => dp.name).join(', ')}.`, '#e67e22'); });
    $('btnAgain').textContent = S.coop ? 'Run it back (same squad)' : 'Run it back'; $('btnAgain').classList.toggle('hidden', S.isClient); $('btnSwitch').textContent = S.coop ? 'Back to lobby' : 'Switch survivor';
  }

  /* ---------------- Toasts and objective ---------------- */
  const netEv = []; const netSfx = [];
  function toast(html, color) { if (S.coop && S.isHost) { if (ctxPlayer && ctxPlayer !== S.p) { netEv.push({ k: 'toast', sid: ctxPlayer.sid, html, color }); return; } if (!ctxPlayer) netEv.push({ k: 'toast', sid: -1, html, color }); }
    const el = document.createElement('div'); el.className = 'toast'; el.style.setProperty('--c', color || '#e67e22'); el.innerHTML = html; $('toasts').appendChild(el); setTimeout(() => el.remove(), 3100); while ($('toasts').children.length > (window.innerHeight < 460 ? 2 : 3)) $('toasts').firstChild.remove(); }
  let objT = 0; function objective(text, alert, secs) { if (S.coop && S.isHost) netEv.push({ k: 'obj', sid: -1, text, alert: !!alert, secs }); const o = $('objective'); o.textContent = text; o.classList.toggle('alert', !!alert); o.classList.add('show'); objT = secs || 3; }

  /* ---------------- Spawning ---------------- */
  const ZCAP = () => 60 + 15 * (S.players.length - 1);
  // over the cap: quietly remove only Hollows that are far from every survivor and not engaged (never anything within 22 m, hurt recently, an Elite, or taunted/marked)
  function cullZombies() {
    const over = S.zombies.length - ZCAP(); if (over <= 0) return;
    const ps = alivePlayers(); const far = (z) => Math.min(...ps.map(p => dist(z.x, z.y, p.x, p.y)), 1e9);
    const cands = S.zombies.filter(z => !z.dead && z.type !== 'brute' && z.type !== 'screamer' && z.type !== 'spitter' && z.hits === 0 && !(z.taunted > 0) && !(z.marked > 0) && far(z) > 22).sort((a, b) => far(b) - far(a)).slice(0, over);
    for (const z of cands) S.zombies.splice(S.zombies.indexOf(z), 1);
  }
  const alivePlayers = () => S.players.filter(p => !p.dead && !p.down);
  const perk = (k) => !!(S.perks && S.perks.has(k)); const byId = (id) => S.players.find(o => o.id === id && !o.dead);
  const zById = (id) => id == null ? null : S.zombies.find(z => z.id === id && !z.dead) || null;
  let atkP = null; const bySid = (sid) => S.players.find(o => o.sid === sid) || null; const creditDmg = (p, amt) => { if (p && p.st) p.st.dmg += amt; };
  // per-player context so toasts / sounds reach the right screen in co-op
  let ctxPlayer = null; function withPlayer(p, fn) { const prev = ctxPlayer; ctxPlayer = p; try { fn(); } finally { ctxPlayer = prev; } }
  function spawnZombie(type, x, y) {
    const d = HOLLOWS[type]; let sx = x, sy = y;
    if (sx == null) {
      // pick a spawn point out of view but not too far
      const cands = MAP.spawns.filter(s => { const ds = alivePlayers().map(p => dist(s.x, s.y, p.x, p.y)); return ds.every(v => v > 14) && ds.some(v => v < 34); });
      const s = (cands.length ? cands : MAP.spawns)[(Math.random() * (cands.length || MAP.spawns.length)) | 0]; sx = s.x + rand(-1, 1); sy = s.y + rand(-1, 1);
    }
    let tries = 0; while (solidAt(sx, sy, d.r) && tries++ < 20) { sx = clamp(sx + rand(-2, 2), 1, MAP.w - 1); sy = clamp(sy + rand(-2, 2), 1, MAP.h - 1); }
    S.zombies.push({ id: ++S.zid, type, d, x: sx, y: sy, r: d.r, hp: d.hp * (1 + 0.04 * (S.wave - 1)), maxHp: d.hp * (1 + 0.04 * (S.wave - 1)), aware: type === 'runner' || type === 'brute', atk: 0, stag: 0, hurt: 0, wander: rand(0, Math.PI * 2), wt: rand(0, 2), kx: 0, ky: 0, hits: 0, face: 0 });
  }
  function spawnLogic(dt) {
    if (S.noSpawn) { S.wave = 1 + Math.floor(S.time / 30); return; }
    S.spawnTimer -= dt;
    const t = S.time; S.wave = 1 + Math.floor(t / 30);
    if (S.spawnTimer <= 0) {
      const packs = 1 + Math.floor(t / 60);
      const size = Math.round((3 + Math.floor(t / 30) + (Math.random() * 3 | 0)) * (1 + 0.5 * (S.players.length - 1)));
      const room = Math.max(0, ZCAP() - S.zombies.length); let budget = room;
      for (let k = 0; k < packs && budget > 0; k++) { const cands = MAP.spawns.filter(s => { const ds = alivePlayers().map(p => dist(s.x, s.y, p.x, p.y)); return ds.every(v => v > 14) && ds.some(v => v < 30); }); const s = (cands.length ? cands : MAP.spawns)[(Math.random() * (cands.length || MAP.spawns.length)) | 0]; for (let i = 0; i < size && budget > 0; i++, budget--) spawnZombie('walker', s.x + rand(-2, 2), s.y + rand(-2, 2)); }
      if (t > 25) for (let i = 0; i < 1 + Math.floor(t / 40) && budget > 0; i++, budget--) spawnZombie('runner');
      S.spawnTimer = Math.max(5, 11 - t / 30);
      cullZombies();
    }
    S.bruteTimer -= dt;
    if (S.bruteTimer <= 0) { spawnZombie('brute'); sfx('roar'); objective('A Brute is coming.', true, 3); S.bruteTimer = 50; }
    S.screamerTimer -= dt;
    if (S.screamerTimer <= 0) { if (S.zombies.filter(z => z.type === 'screamer').length < 2) { spawnZombie('screamer'); objective('Screamer nearby. Drop it before it calls the horde.', true, 3); } S.screamerTimer = 22; }
    S.spitterTimer -= dt;
    if (S.spitterTimer <= 0) { if (S.zombies.filter(z => z.type === 'spitter').length < 3) { spawnZombie('spitter'); objective('Spitter. Stay out of the acid.', true, 3); } S.spitterTimer = 18; }
    if (!S.extractOpen && S.time >= RUN_SECONDS - 30) { S.extractOpen = true; objective('Extraction open: northeast lot. Get there.', true, 6); sfx('ability'); }
  }

  /* ---------------- Combat ---------------- */
  function noiseAt(x, y, radius) { if (radius <= 0) return; for (const z of S.zombies) if (!z.aware && dist(z.x, z.y, x, y) <= radius) z.aware = true; }
  function scream(z) {
    z.screamed = true; z.screamT = null; sfx('scream'); S.shake = Math.max(S.shake, 0.35);
    S.fx.push({ kind: 'ring', x: z.x, y: z.y, t: 0, life: 0.9, r: z.d.screamRadius, tan: true });
    noiseAt(z.x, z.y, z.d.screamRadius);
    const n = 4 + Math.floor(S.time / 40), runners = 1 + Math.floor(S.time / 60);
    for (let i = 0; i < n + runners; i++) { const a = rand(0, Math.PI * 2), r = rand(5, 9); spawnZombie(i < n ? 'walker' : 'runner', z.x + Math.cos(a) * r, z.y + Math.sin(a) * r); S.zombies[S.zombies.length - 1].aware = true; }
    cullZombies();
    objective('The Screamer called the horde.', true, 3);
    S.spawnTimer = Math.max(S.spawnTimer, 7); // the horde call replaces the next regular pack instead of stacking on it
  }
  function addCombo(p, n) { if (p.id !== 'shadow') return; const before = p.combo; p.combo = Math.min(3, p.combo + n); p.comboT = 5; if (p.combo !== before) S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.3, t: 0, life: 0.7, text: p.combo >= 3 ? 'COMBO ×3 · FINISHER' : `COMBO ×${p.combo}`, purple: true }); }
  function onKill(p, z) { // kill hooks per survivor
    if (!p) return;
    if (p.id === 'buck') { if (z.taunted > 0) { heal(p, p.maxHp * 0.03); S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.3, t: 0, life: 0.6, text: '+3%', heal: true }); } if (p.breaching) { p.cd.u = Math.max(0, p.cd.u - 3); S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.7, t: 0, life: 0.8, text: 'OVER HERE −3 s', col: '52,152,219' }); } return; }
    if (p.id === 'savage') { addRage(p, 15); if (p.pounding) { p.cd.d = Math.max(0, p.cd.d - 2); S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.7, t: 0, life: 0.8, text: 'POUND −2 s', col: '192,57,43' }); } return; }
    if (p.id === 'flight') { if (p.fbFiring) { addMom(p, 40); S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.7, t: 0, life: 0.8, text: '+40 MOMENTUM', col: '231,76,60' }); } return; }
    if (p.id !== 'shadow') return; let off = 1 + (z.marked > 0 && perk('marked') ? 1 : 0); if (p.ultChain) { off = 2; p.cd.s = Math.max(0, p.cd.s - 2); p.cd.u = Math.max(0, p.cd.u - 2); }
    p.cd.d = Math.max(0, p.cd.d - off);
  }
  function damageZombie(z, amount, crit, fromX, fromY, knock = 0.5, stagger = false) {
    z.hp -= amount; z.hurt = 0.12; z.hits++; S.dmgDealt += amount; z.aware = true; creditDmg(atkP, amount); if (atkP) z.lastBy = atkP;
    S.fx.push({ kind: 'num', x: z.x + rand(-0.2, 0.2), y: z.y - z.r - 0.2, t: 0, life: 0.7, text: Math.round(amount), crit });
    if (crit) critFx(z, atkP, fromX, fromY);
    if (fromX != null) { const dx = z.x - fromX, dy = z.y - fromY, l = Math.hypot(dx, dy) || 1; const ux = dx / l, uy = dy / l; const n = crit ? 7 : 4; for (let i = 0; i < n; i++) { const sp = rand(2, crit ? 7 : 5); S.fx.push({ kind: 'blood', x: z.x - ux * z.r * 0.4, y: z.y - uy * z.r * 0.4, vx: ux * sp + rand(-1.5, 1.5), vy: uy * sp + rand(-1.5, 1.5), t: 0, life: rand(0.2, 0.45) }); } S.fx.push({ kind: 'hit', x: z.x - ux * z.r * 0.8, y: z.y - uy * z.r * 0.8, ang: Math.atan2(uy, ux), t: 0, life: crit ? 0.18 : 0.1, crit }); }
    if (fromX != null && !(z.type === 'brute' && !stagger)) { const dx = z.x - fromX, dy = z.y - fromY, l = Math.hypot(dx, dy) || 1; z.kx += dx / l * knock; z.ky += dy / l * knock; }
    if (stagger && z.type !== 'brute') z.stag = Math.max(z.stag, 0.5);
    S.decals.push({ x: z.x + rand(-0.3, 0.3), y: z.y + rand(-0.3, 0.3), r: rand(0.15, 0.35) * (crit ? 1.4 : 1), a: 0.8 }); if (S.decals.length > 220) S.decals.shift();
    sfx('hit', 0.6);
    if (z.hp <= 0) killZombie(z);
  }
  // critical hits: a shared heavy burst plus each survivor's signature mark on the target
  function critFx(z, p, fromX, fromY) {
    const ang = fromX != null ? Math.atan2(z.y - fromY, z.x - fromX) : (p ? p.aim : 0); const id = p ? p.id : null; const col = p ? hexRgb(p.d.color) : '255,236,170';
    S.shake = Math.max(S.shake, id === 'savage' || id === 'buck' ? 0.14 : 0.07);
    S.fx.push({ kind: 'ring', x: z.x, y: z.y, t: 0, life: 0.3, r: z.r + 0.9, col: '255,236,170' });
    S.fx.push({ kind: 'critstar', x: z.x, y: z.y, ang, t: 0, life: 0.28, col });
    S.decals.push({ x: z.x + rand(-0.5, 0.5), y: z.y + rand(-0.5, 0.5), r: rand(0.25, 0.45), a: 0.85 });
    for (let i = 0; i < 6; i++) { const an = rand(0, Math.PI * 2); S.fx.push({ kind: 'blood', spark: true, col: '255,236,170', x: z.x, y: z.y, vx: Math.cos(an) * rand(3, 7), vy: Math.sin(an) * rand(3, 7), t: 0, life: rand(0.2, 0.4) }); }
    if (id === 'shadow') { S.fx.push({ kind: 'slash', x: z.x, y: z.y, ang: ang + 0.8, half: 0.9, r: z.r + 0.8, t: 0, life: 0.25, col }); S.fx.push({ kind: 'slash', x: z.x, y: z.y, ang: ang - 0.8 + Math.PI, half: 0.9, r: z.r + 0.8, t: 0, life: 0.25, col }); S.fx.push({ kind: 'puff', x: z.x, y: z.y, t: 0, life: 0.4, seed: rand(0, 6), col }); }
    else if (id === 'wolf') { const L = z.r + 0.5; S.fx.push({ kind: 'trail', x0: z.x - L, y0: z.y, x1: z.x + L, y1: z.y, t: 0, life: 0.3, col }); S.fx.push({ kind: 'trail', x0: z.x, y0: z.y - L, x1: z.x, y1: z.y + L, t: 0, life: 0.3, col }); S.fx.push({ kind: 'num', x: z.x, y: z.y - z.r - 1.1, t: 0, life: 0.6, text: 'VITAL', col }); }
    else if (id === 'buck') { S.fx.push({ kind: 'ring', x: z.x, y: z.y, t: 0, life: 0.45, r: 2, blue: true }); S.fx.push({ kind: 'cone', x: z.x, y: z.y, r: 1.6, ang, half: 0.7, t: 0, life: 0.25, col }); }
    else if (id === 'flight') { const L = 3; S.fx.push({ kind: 'trail', x0: z.x - Math.cos(ang) * L * 0.5, y0: z.y - Math.sin(ang) * L * 0.5, x1: z.x + Math.cos(ang) * L, y1: z.y + Math.sin(ang) * L, t: 0, life: 0.3, col }); for (let i = 0; i < 4; i++) S.fx.push({ kind: 'blood', spark: true, col, x: z.x, y: z.y, vx: Math.cos(ang + rand(-0.3, 0.3)) * rand(6, 11), vy: Math.sin(ang + rand(-0.3, 0.3)) * rand(6, 11), t: 0, life: 0.3 }); }
    else if (id === 'savage') { for (let i = -1; i <= 1; i++) S.fx.push({ kind: 'cone', x: z.x, y: z.y, r: 1.8, ang: ang + i * 1.1, half: 0.18, t: 0, life: 0.35, col }); S.fx.push({ kind: 'puff', x: z.x, y: z.y, t: 0, life: 0.5, seed: rand(0, 6), col: '120,90,70' }); S.decals.push({ x: z.x, y: z.y, r: rand(0.4, 0.6), a: 0.9 }); }
    else if (id === 'fuse') { S.fx.push({ kind: 'ring', x: z.x, y: z.y, t: 0, life: 0.3, r: 1.3, yellow: true }); for (let i = 0; i < 5; i++) { const a0 = rand(0, Math.PI * 2), L = rand(0.6, 1.4); S.fx.push({ kind: 'trail', x0: z.x, y0: z.y, x1: z.x + Math.cos(a0) * L, y1: z.y + Math.sin(a0) * L, t: 0, life: 0.15, col }); } for (let i = 0; i < 8; i++) S.fx.push({ kind: 'blood', spark: true, col, x: z.x, y: z.y, vx: rand(-6, 6), vy: rand(-6, 2), t: 0, life: rand(0.2, 0.4) }); }
    else if (id === 'hush') { S.fx.push({ kind: 'ring', x: z.x, y: z.y, t: 0, life: 0.35, r: z.r + 0.4, white: true }); S.fx.push({ kind: 'pierce', x: z.x, y: z.y, ang, n: 1, t: 0, life: 0.3, white: true }); S.fx.push({ kind: 'reticle', x: z.x, y: z.y, r: z.r + 0.5, t: 0, life: 0.35 }); }
    else if (id === 'torch') { S.fx.push({ kind: 'ring', x: z.x, y: z.y, t: 0, life: 0.35, r: 1.2, fire: true }); for (let i = 0; i < 7; i++) S.fx.push({ kind: 'flame', x: z.x + rand(-0.5, 0.5), y: z.y + rand(-0.5, 0.5), vx: rand(-2, 2), vy: rand(-3, -0.5), t: 0, life: rand(0.3, 0.6) }); }
  }
  function killZombie(z) {
    z.dead = true; S.kills++; if (z.lastBy && z.lastBy.st) z.lastBy.st.k++; onKill(z.lastBy, z);
    for (const pl of S.players) if (pl.rage > 0 && pl.rageSpent < 5) { pl.rage += 1; pl.rageSpent++; }
    S.decals.push({ x: z.x, y: z.y, r: z.r * 1.6, a: 0.9 });
    for (let i = 0; i < 6; i++) S.fx.push({ kind: 'blood', x: z.x, y: z.y, vx: rand(-3, 3), vy: rand(-3, 3), t: 0, life: rand(0.3, 0.6) });
    // loot
    const silenced = z.type === 'screamer' && !z.screamed;
    const n = z.type === 'brute' ? 1 + (Math.random() < 0.5 ? 1 : 0) : silenced ? 1 : (Math.random() < z.d.drop ? 1 : 0);
    if (silenced) { toast('<b>Silenced.</b> Screamer dropped before it screamed: better loot.', '#b08a5a'); sfx('pickup', 0.5); }
    if (z.type === 'spitter') { const c = 2 + (Math.random() * 3 | 0); S.chems += c; toast(`+${c} <b>Chemicals</b> (Antiviral crafting)`, '#7fb347'); }
    for (let i = 0; i < n; i++) {
      const minTier = (z.type === 'brute' && i === 0 && Math.random() < 0.25) ? 2 : 0;
      let rar = rollRarity(0, minTier); if (silenced) rar = Math.min(RARITY.length - 1, rar + 1); const ilvl = 1 + Math.floor(S.time / 60) + (Math.random() < 0.3 ? 1 : 0);
      const item = makeItem(Math.random() < 0.5 ? 'weapon' : 'armor', rar, ilvl);
      S.loot.push({ item, x: z.x + rand(-0.6, 0.6), y: z.y + rand(-0.6, 0.6), t: 0 });
    }
    if (z.type === 'brute') { S.shake = 0.5; }
  }
  function playerHit(z, raw, p) { p.lastHitAt = S.time;
    if (p.dead || p.down || p.invuln > 0 || p.stealth > 0) return;
    const st = stats(p); let dmg = raw;
    let blocked = false; if (p.shield > 0) { const ang = Math.atan2(z.y - p.y, z.x - p.x); let d = Math.abs(((ang - p.aim) + Math.PI * 3) % (Math.PI * 2) - Math.PI); if (d < Math.PI / 2) { dmg *= 0.2; blocked = true; } }
    if (p.guard > 0) dmg *= 0.7; p.lastCombat = S.time;
    if (p.taunt > 0) dmg *= 0.85;
    dmg *= (1 - st.dr);
    p.hp -= dmg; p.hurtT = 0.3; p.st.taken += dmg; if (p === S.p) S.shake = Math.max(S.shake, 0.25); p.adren = Math.min(ADREN_MAX, p.adren + dmg / 20);
    if (p.immune <= 0) p.inf = Math.min(1, p.inf + (z.d.bite / 100) * (1 - st.infres));
    if (!(p.id === 'buck') && p === S.p) { const dx = p.x - z.x, dy = p.y - z.y, l = Math.hypot(dx, dy) || 1; moveEntity(p, dx / l * 0.35, dy / l * 0.35); }
    withPlayer(p, () => sfx('bite'));
    if (p.stealth > 0) p.stealth = 0;
    if (p.id === 'savage' && p.hp > 0) addRage(p, 10);
    if (p.id === 'buck' && p.hp > 0) addGrit(p, blocked ? 2 : 1);
    if (p.hp <= 0 || p.inf >= 1) playerDown(p, p.inf >= 1 ? 'infection' : 'downed');
  }
  // solo: the run ends. co-op: you're down for 30 s and an ally can pick you up; everyone down ends the run
  function playerDown(p, why) {
    if (!S.coop) { endRun(false, why); return; }
    if (p.down || p.dead) return;
    p.down = true; p.downT = 30; p.reviveP = 0; p.hp = 0; p.st.downs++; p.stealth = 0; p.cyclone = 0; p.shield = 0; p.rage = 0; p.input.fire = false;
    toast(`<b>${p.name} is down.</b> Stand still next to them to revive.`, '#bf2618'); sfx('flat', 0.5);
    for (const o of S.players) if (o !== p && o.id === 'savage' && !o.down && !o.dead && o.rage <= 0 && o.rageCd <= 0 && dist(o.x, o.y, p.x, p.y) < 15) startRage(o);
    if (perk('brothers') && p.id === 'savage') { const sh = byId('shadow'); if (sh && !sh.down) { sh.stealth = 6; sh.exposedHit = true; sh.cd.s = 0; withPlayer(sh, () => toast("<b>Brothers' Keeper.</b> Ghost Step: go get him.", '#9b59b6')); } }
    if (!S.players.some(o => !o.down && !o.dead)) endRun(false, why);
  }
  function revive(p, by) { if (by && by !== p && by.st) by.st.rev++; p.down = false; p.downT = 0; p.reviveP = 0; p.rescueBoost = false; p.hp = Math.round(p.maxHp * 0.3); p.invuln = 1.5; toast(`<b>${by.name}</b> picked up <b>${p.name}</b>.`, '#2ecc71'); sfx('pickup', 0.7); }
  function addRage(p, n) { if (p.id !== 'savage' || p.dead || p.down) return; if (p.rage > 0) return; p.rageM = clamp((p.rageM || 0) + n, 0, 100); if (p.rageM >= 100) { p.rageM = 0; startRage(p); } }
  function addGrit(p, n) { if (p.id !== 'buck') return; const b4 = p.grit || 0; p.grit = Math.min(5, b4 + n); p.gritT = 6; if (p.grit > b4) { S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.3, t: 0, life: 0.6, text: `GRIT ${p.grit}`, col: '52,152,219' }); if (p.grit === 5 && b4 < 5) S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.5, r: 1.6, blue: true }); } }
  function addMom(p, n) { if (p.id !== 'flight') return; p.mom = clamp((p.mom || 0) + n, 0, 100); }
  function startRage(p) { p.rage = 10; p.rageSpent = 0; p.rageCd = 0; p.rageM = 0; S.shake = Math.max(S.shake, 0.3); sfx('roar', 0.6); toast('<b>RAGE.</b> 10 s: +40% damage, 25% reduction, hits heal 5%. No crits.', '#c0392b'); S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.5, r: 3, crimson: true }); }
  function fireWeapon(p, st, dt) {
    if (p.finale > 0) st = Object.assign({}, st, { base: FINALE_BASE, range: 9 });
    const base = st.base, w = st.w;
    if (base.type === 'melee') {
      if (p.fireCd > 0) return; p.fireCd = 1 / (base.rate * p.d.as * (1 + st.as)); p.swing = 0.18; p.swingDir = p.aim;
      sfx('melee');
      S.fx.push({ kind: 'slash', x: p.x, y: p.y, ang: p.aim, half: base.arc / 2, r: st.range, t: 0, life: 0.22, heavy: base.dmg >= 150, col: hexRgb(p.d.color) });
      const near = S.zombies.some(z => !z.dead && dist(z.x, z.y, p.x, p.y) <= st.range + z.r + 1.0 && Math.abs(((Math.atan2(z.y - p.y, z.x - p.x) - p.aim) + Math.PI * 3) % (Math.PI * 2) - Math.PI) <= base.arc / 2);
      if (near) moveEntity(p, Math.cos(p.aim) * 0.6, Math.sin(p.aim) * 0.6);
      const targets = S.zombies.filter(z => { if (z.dead) return false; const d = dist(z.x, z.y, p.x, p.y); if (d > st.range + z.r) return false; const tol = base.arc / 2 + Math.atan2(z.r, Math.max(0.3, d)); return Math.abs(((Math.atan2(z.y - p.y, z.x - p.x) - p.aim) + Math.PI * 3) % (Math.PI * 2) - Math.PI) <= tol; }).sort((a, b) => dist(a.x, a.y, p.x, p.y) - dist(b.x, b.y, p.x, p.y)).slice(0, base.targets + (p.id === 'savage' ? (p.unchained > 0 ? 3 : 1) : 0));
      targets.forEach(z => { hitZombie(z, p, st, 1, base.stagger3 && p.hits3 === 2 ? true : p.id === 'buck', base.knock || 0.4); if (base.knockdown && !z.dead) z.stag = Math.max(z.stag, z.type === 'brute' ? 0.3 : base.knockdown); });
      if (base.shake && targets.length) S.shake = Math.max(S.shake, base.shake); if (base.noise) noiseAt(p.x, p.y, NOISE_M[base.noise]);
      if (base.dmg >= 150 && targets.length) { const ix = p.x + Math.cos(p.aim) * st.range * 0.7, iy = p.y + Math.sin(p.aim) * st.range * 0.7; S.fx.push({ kind: 'puff', x: ix, y: iy, t: 0, life: 0.4, seed: rand(0, 6), col: '140,130,120' }); for (let k = 0; k < 6; k++) S.fx.push({ kind: 'blood', spark: true, col: '255,230,170', x: ix, y: iy, vx: rand(-4, 4), vy: rand(-4, 4), t: 0, life: rand(0.15, 0.3) }); }
      if (targets.length) for (const z of targets) S.fx.push({ kind: 'blood', spark: true, col: '255,240,210', x: z.x, y: z.y, vx: Math.cos(p.aim + rand(-1, 1)) * rand(2, 5), vy: Math.sin(p.aim + rand(-1, 1)) * rand(2, 5), t: 0, life: 0.2 });
      if (base.stagger3) p.hits3 = ((p.hits3 || 0) + 1) % 3;
      return; // melee is silent
    }
    if (p.fireCd > 0) return;
    if (p.finale <= 0) { if (p.reloading > 0) return; if (p.mag <= 0) { startReload(p, st); return; } p.mag--; }
    p.fireCd = 1 / (base.rate * p.d.as * (1 + st.as));
    const pellets = base.pellets || 1;
    sfx(base.pellets ? 'shotgun' : base.noise === 0 ? 'silenced' : 'shot');
    { const mx = p.x + Math.cos(p.aim) * 0.75, my = p.y + Math.sin(p.aim) * 0.75; const big = !!base.pellets || base.dmg >= 150; const quiet = base.noise === 0;
      S.fx.push({ kind: 'muzzle', x: mx, y: my, ang: p.aim, t: 0, life: quiet ? 0.05 : 0.07, big, quiet });
      if (!quiet) S.fx.push({ kind: 'puff', x: mx + Math.cos(p.aim) * 0.3, y: my + Math.sin(p.aim) * 0.3, t: 0, life: big ? 0.5 : 0.3, seed: rand(0, 6), col: '160,160,160', big });
      if (!base.cone) { const ea = p.aim + Math.PI / 2; S.fx.push({ kind: 'blood', spark: true, col: '214,170,80', x: p.x + Math.cos(p.aim) * 0.3, y: p.y + Math.sin(p.aim) * 0.3, vx: Math.cos(ea) * rand(1.5, 3) + Math.cos(p.aim) * rand(-0.5, 0.5), vy: Math.sin(ea) * rand(1.5, 3) - 1.5, t: 0, life: rand(0.3, 0.5) }); } }
    const noiseR = NOISE_M[base.noise]; noiseAt(p.x, p.y, noiseR); p.lastNoise = noiseR;
    if (base.cone) { // flamethrower: everything in the cone with line of sight, no tracer
      p.fireT = 0.12;
      for (const z of S.zombies) { if (z.dead) continue; const d = dist(z.x, z.y, p.x, p.y); if (d > st.range + z.r) continue; const a = Math.atan2(z.y - p.y, z.x - p.x); if (Math.abs(((a - p.aim) + Math.PI * 3) % (Math.PI * 2) - Math.PI) > base.cone / 2 + Math.atan2(z.r, Math.max(0.3, d))) continue; let ok = true; for (let t = 0.5; t < d; t += 0.5) if (solidAt(p.x + Math.cos(a) * t, p.y + Math.sin(a) * t, 0)) { ok = false; break; } if (ok) { hitZombie(z, p, st, 1, false, 0.05); if (base.burn > 1) burnZombie(z, base.burn - 1); } }
      for (let i = 0; i < 3; i++) { const a = p.aim + rand(-base.cone / 2, base.cone / 2); S.fx.push({ kind: 'flame', x: p.x + Math.cos(p.aim) * 0.8, y: p.y + Math.sin(p.aim) * 0.8, vx: Math.cos(a) * rand(6, 11), vy: Math.sin(a) * rand(6, 11), t: 0, life: rand(0.35, 0.6) }); }
      if (p.finale <= 0 && p.mag <= 0) startReload(p, st); return;
    }
    const pelletHits = new Map();
    const longExp = p.deadAir > 0; if (longExp) { p.forceCrit = true; p.mag = st.base.mag; }
    for (let i = 0; i < pellets; i++) {
      const ang = p.aim + rand(-base.spread, base.spread) * (p.moving ? 1.4 : 1);
      // hitscan: nearest zombie along the ray within range, stop at walls
      let hits = []; const step = 0.25; let x = p.x, y = p.y, trav = 0; let pierce = longExp ? 99 : (base.pierce || 0);
      const hitSet = new Set(); const pad = base.pellets ? 0.25 : 0.1;
      while (trav < st.range) { x += Math.cos(ang) * step; y += Math.sin(ang) * step; trav += step; if (solidAt(x, y, 0)) break;
        for (const z of S.zombies) { if (z.dead || hitSet.has(z)) continue; if (dist(z.x, z.y, x, y) <= z.r + pad) { hits.push(z); hitSet.add(z); if (pierce-- <= 0) { trav = st.range; break; } } } }
      if (base.firePool) { const fp = { x, y, r: base.firePool, t: 5, max: 5 }; S.fires.push(fp); const fl = { x, y, t: 5, r: base.lure }; S.flares.push(fl); computeField(fl.x, fl.y, flareField); S.zombies.forEach(z => { if (dist(z.x, z.y, fl.x, fl.y) <= fl.r && z.type !== 'spitter') { z.aware = true; z.flare = fl; } }); sfx('fire'); }
      S.fx.push({ kind: 'tracer', x0: p.x + Math.cos(p.aim) * 0.6, y0: p.y + Math.sin(p.aim) * 0.6, x1: x, y1: y, t: 0, life: base.dmg >= 150 ? 0.14 : 0.08, heavy: base.dmg >= 150, quiet: base.noise === 0, bolt: w.key === 'crossbow' });
      if (!hits.length && trav < st.range) { S.fx.push({ kind: 'puff', x, y, t: 0, life: 0.35, seed: rand(0, 6), col: '150,140,130' }); for (let k = 0; k < 3; k++) S.fx.push({ kind: 'blood', spark: true, col: '230,220,200', x, y, vx: -Math.cos(ang) * rand(1, 4) + rand(-2, 2), vy: -Math.sin(ang) * rand(1, 4) + rand(-2, 2), t: 0, life: rand(0.15, 0.3) }); }
      hits.forEach(z => pelletHits.set(z, (pelletHits.get(z) || 0) + 1));
    }
    // Hush + sniper rifle: Collateral. A round that goes through a second Hollow crits everything it touched.
    if (p.id === 'hush' && w.key === 'sniper' && pelletHits.size >= 2) {
      p.collateralN = pelletHits.size; const list = [...pelletHits.keys()]; const ca = Math.cos(p.aim), sa = Math.sin(p.aim);
      list.forEach((z, i) => { const along = (z.x - p.x) * ca + (z.y - p.y) * sa; S.fx.push({ kind: 'pierce', x: p.x + ca * (along - z.r * 0.6), y: p.y + sa * (along - z.r * 0.6), ang: p.aim, n: i + 1, t: 0, life: 0.35, white: true }); for (let k = 0; k < 4; k++) S.fx.push({ kind: 'blood', spark: true, white: true, x: z.x + ca * z.r * 0.7, y: z.y + sa * z.r * 0.7, vx: ca * rand(3, 6) + rand(-1.5, 1.5), vy: sa * rand(3, 6) + rand(-1.5, 1.5), t: 0, life: rand(0.25, 0.45) }); });
      const last = list[list.length - 1]; const la = (last.x - p.x) * ca + (last.y - p.y) * sa; S.fx.push({ kind: 'num', x: p.x + ca * (la + last.r + 0.5), y: p.y + sa * (la + last.r + 0.5) - 0.7, t: 0, life: 1, text: `COLLATERAL ×${list.length}`, crit: true });
      S.fx.push({ kind: 'laser', x0: p.x + ca * 0.6, y0: p.y + sa * 0.6, x1: p.x + ca * (la + last.r + 1.5), y1: p.y + sa * (la + last.r + 1.5), t: 0, life: 0.35, white: true }); S.shake = Math.max(S.shake, 0.18);
    }
    // one hit per zombie per trigger pull: shotgun pellets add up into a single number
    pelletHits.forEach((n, z) => { hitZombie(z, p, st, n, p.id === 'buck', (base.knock || 0.3) * Math.min(1, n / 3)); if (base.pin && !z.dead && z.type === 'walker') z.stag = Math.max(z.stag, base.pin); });
    if (base.shake) S.shake = Math.max(S.shake, base.shake);
    if (p.mag <= 0) startReload(p, st);
  }
  const FINALE_BASE = Object.assign({}, WEAPONS.flamethrower, { cone: 1.3, range: 9, burn: 3, dmg: 18 });
  function hitZombie(z, p, st, mult, stagger, knock = 0.4, splash = false) {
    atkP = p;
    const base = st.base; const w = st.w;
    let dmg = base.dmg * w.mult * (p.d.dmg / 100) * (st.favored ? 1.1 : 1) * (1 + st.dmgPct) * mult;
    if (z.marked > 0) dmg *= 1.15;
    if (z.marked > 0 && p.id === 'shadow' && perk('marked')) dmg *= 1.15;
    if ((p.id === 'shadow' || p.id === 'savage') && perk('brothers')) { const bro = byId(p.id === 'shadow' ? 'savage' : 'shadow'); if (bro && !bro.down && dist(bro.x, bro.y, p.x, p.y) <= 8) dmg *= 1.1; }
    if (p.id === 'hush' && z.type === 'brute' && p.focus >= 0.3) { dmg *= 1.35; if (!splash) S.fx.push({ kind: 'num', x: z.x, y: z.y - z.r - 0.9, t: 0, life: 0.6, text: 'WEAK SPOT', crit: true }); }
    dmg *= p.hitMult || 1;
    let crit = p.rage > 0 ? false : Math.random() < st.crit; let cd = st.critDmg;
    if (p.forceCrit) { crit = true; p.forceCrit = false; }
    if (p.collateralN > 0 && !splash) { crit = true; cd += 0.25; p.collateralN--; }
    if (p.id === 'hush' && !splash) { // Deadeye: hits build Focus; every 3rd hit in a row on the same Hollow is a crit
      p.focus = Math.min(0.5, p.focus + 0.15 * (perk('spotter') && S.zombies.some(o => o.taunted > 0) ? 2 : 1)); p.focusT = 2.5;
      if (p.streakZ === z) p.streak++; else { p.streakZ = z; p.streak = 1; }
      if (p.streak % 3 === 0) { crit = true; cd += 0.5; S.fx.push({ kind: 'num', x: z.x, y: z.y - z.r - 1.2, t: 0, life: 0.7, text: 'DEADEYE', crit: true }); }
    }
    let opener = false; if (p.stealth > 0 || p.exposedHit) { crit = true; cd += 0.5; p.exposedHit = false; p.stealth = 0; z.exposed = 6; opener = true; addCombo(p, 1); toast('<b>Exposed.</b> Opener from stealth.', '#9b59b6'); }
    if (z.exposed > 0 && !crit) crit = Math.random() < 0.15;
    if (crit) dmg *= (1 + cd);
    if (z.flare) dmg *= 1.15;
    if (p.id === 'buck' && p.breaching) { dmg *= 1 + 0.2 * p.breaching; }
    if (p.id === 'savage' && p.pounding && z.hp / z.maxHp < 0.5) { dmg *= 1.5; if (!splash) S.fx.push({ kind: 'num', x: z.x, y: z.y - z.r - 0.9, t: 0, life: 0.6, text: 'CRUSH', crit: true }); }
    p.lastCombat = S.time;
    if (base.type === 'melee' && z.type === 'brute' && w.key === 'fireaxe') dmg *= 1.25;
    if (p.rage > 0) p.hp = Math.min(p.maxHp, p.hp + dmg * (p.unchained > 0 ? 0.10 : 0.05));
    if (p.id === 'savage' && !splash) addRage(p, p.pounding ? 5 : base.type === 'melee' ? 6 : 3);
    p.adren = Math.min(ADREN_MAX, p.adren + dmg / 25);
    const wasAlive = !z.dead; damageZombie(z, dmg, crit, p.x, p.y, knock, stagger);
    if (opener && p.id === 'shadow' && wasAlive && z.dead) { p.cd.s = Math.min(p.cd.s, KITS.shadow.s.cd / 2); S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.6, t: 0, life: 0.8, text: 'GHOST STEP −9 s', purple: true }); }
    if (p.id === 'torch' || base.burn) burnZombie(z, 1);
    if (p.id === 'hush' && !splash && z.marked > 0 && wasAlive) { // Spotter's Call: ricochet to another Marked Hollow
      let o2 = null, bd = 6; for (const o of S.zombies) { if (o === z || o.dead || o.marked <= 0) continue; const d = dist(o.x, o.y, z.x, z.y); if (d < bd) { bd = d; o2 = o; } }
      if (o2) { S.fx.push({ kind: 'tracer', x0: z.x, y0: z.y, x1: o2.x, y1: o2.y, t: 0, life: 0.15 }); hitZombie(o2, p, st, mult * 0.35, false, 0.2, true); }
    }
    if (p.id === 'torch' && !splash && wasAlive) { for (const o of S.zombies) { if (o === z || o.dead) continue; if (dist(o.x, o.y, z.x, z.y) <= 2.0 + o.r) hitZombie(o, p, st, mult * 0.6, false, 0.2, true); } }
  }
  // fire: 10 dps per stack, up to 3 stacks, 3 s. Can't crit, doesn't heal Savage.
  function burnZombie(z, stacks, dur = 3) { if (z.dead) return; z.burn = Math.min(3, (z.burn || 0) + stacks); z.burnT = Math.max(z.burnT || 0, dur); if (atkP) z.burnBy = atkP; }
  function tickBurn(z, dt) { if (!z.burn) return; z.burnT -= dt; const d = 10 * z.burn * dt * (z.flare && perk('moth') ? 1.2 : 1); z.hp -= d; S.dmgDealt += d; z.aware = true; creditDmg(z.burnBy, d); if (z.burnBy) z.lastBy = z.burnBy; if (z.burnT <= 0) { z.burn = 0; } if (Math.random() < dt * 2) S.fx.push({ kind: 'num', x: z.x + rand(-0.2, 0.2), y: z.y - z.r - 0.2, t: 0, life: 0.6, text: Math.round(10 * z.burn), fire: true }); if (z.hp <= 0 && !z.dead) killZombie(z); }
  function startReload(p, st) { if (p.reserve <= 0 && p.mag <= 0) { toast('Out of ammo. Swap to melee (F).', '#e74c3c'); return; } if (p.reserve <= 0) return; p.reloading = st.base.reload * (1 - st.handling); p.reloadTotal = p.reloading; }
  /* ---------------- Abilities ---------------- */
  // aim = { ang, x, y, z (target Hollow), ally }. Missing pieces are filled by the nearest-target rule.
  const angTo = (p, x, y) => Math.atan2(y - p.y, x - p.x);
  const angDiff = (a, b) => Math.abs(((a - b) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
  // lowest-HP pick (used by nothing in the player loop since v35; kept for turrets/tests)
  function weakestZombie(p, range, filter) { let best = null, bs = 1e9; for (const z of S.zombies) { if (z.dead || (filter && !filter(z))) continue; const d = dist(z.x, z.y, p.x, p.y); if (d > range + z.r) continue; const sc = z.hp + d * 0.01; if (sc < bs) { bs = sc; best = z; } } return best; }
  function nearestZombie(p, range, filter) { let best = null, bd = 1e9; for (const z of S.zombies) { if (z.dead || (filter && !filter(z))) continue; const d = dist(z.x, z.y, p.x, p.y); if (d <= range + z.r && d < bd) { bd = d; best = z; } } return best; }
  function nearestAlly(p, range, filter) { let best = null, bd = 1e9; for (const o of S.players) { if (o === p || o.dead || (filter && !filter(o))) continue; const d = dist(o.x, o.y, p.x, p.y); if (d <= range && d < bd) { bd = d; best = o; } } return best; }
  // the Hollow closest to a world point (used when the player drags an aim onto a crowd)
  function zombieNear(x, y, tol) { let best = null, bd = 1e9; for (const z of S.zombies) { if (z.dead) continue; const d = dist(z.x, z.y, x, y); if (d <= tol + z.r && d < bd) { bd = d; best = z; } } return best; }
  function allyNear(p, x, y, tol) { let best = null, bd = 1e9; for (const o of S.players) { if (o === p || o.dead) continue; const d = dist(o.x, o.y, x, y); if (d <= tol && d < bd) { bd = d; best = o; } } return best; }
  // resolve a cast request into a complete aim using the nearest-target rule
  function resolveAim(p, ab, aim) {
    const a = Object.assign({}, aim || {}); const range = ab.range || 0;
    if (ab.kind === 'instant') { a.ang = a.ang ?? p.aim; return a; }
    const tapCast = a.ang == null && a.x == null && !a.z && !a.ally; const lz = tapCast && p.input ? zById(p.input.lock) : null; const lzd = lz && !lz.dead ? dist(lz.x, lz.y, p.x, p.y) : 1e9;
    if (ab.kind === 'target' && lz && lzd <= range + lz.r + 0.5) a.z = lz;
    if (ab.kind === 'aimed' && lz && lzd <= range + 6) a.ang = angTo(p, lz.x, lz.y);
    if ((ab.kind === 'throw' || ab.kind === 'place') && lz && lzd <= range + 2) { const k = ab.kind === 'place' ? Math.min(1, 2.5 / Math.max(lzd, 0.01)) : 1; a.x = p.x + (lz.x - p.x) * k; a.y = p.y + (lz.y - p.y) * k; }
    if (ab.kind === 'target') { if (!a.z && a.x != null) a.z = zombieNear(a.x, a.y, 1.6); if (!a.z && a.ang != null && a.x == null) a.z = pickTargetAng(p, a.ang, range); if (!a.z) a.z = nearestZombie(p, range); if (a.z) a.ang = angTo(p, a.z.x, a.z.y); return a; }
    if (ab.kind === 'ally') { if (!a.ally && a.x != null) a.ally = allyNear(p, a.x, a.y, 2.5); if (!a.ally && a.ang != null && a.x == null) a.ally = nearestAlly(p, range, o => angDiff(angTo(p, o.x, o.y), a.ang) < 0.6); if (!a.ally && a.ang == null) a.ally = nearestAlly(p, range, o => o.down || o.hp / o.maxHp < 0.6) || nearestAlly(p, range); if (a.ally) a.ang = angTo(p, a.ally.x, a.ally.y); else if (a.ang == null) a.ang = p.aim; return a; }
    if (ab.kind === 'aimed') { if (a.ang == null) { const z = nearestZombie(p, range + 2); a.ang = z ? angTo(p, z.x, z.y) : p.aim; } return a; }
    // throw / place: a landing point
    if (a.x == null) { const z = nearestZombie(p, range); if (z) { const d = dist(z.x, z.y, p.x, p.y); const k = ab.kind === 'place' ? Math.min(1, 2.5 / Math.max(d, 0.01)) : 1; a.x = p.x + (z.x - p.x) * k; a.y = p.y + (z.y - p.y) * k; } else if (ab.kind === 'place') { a.x = p.x + Math.cos(p.aim) * 1; a.y = p.y + Math.sin(p.aim) * 1; } else { a.x = p.x + Math.cos(p.aim) * 3; a.y = p.y + Math.sin(p.aim) * 3; } }
    const d = dist(a.x, a.y, p.x, p.y); if (d > range) { a.x = p.x + (a.x - p.x) / d * range; a.y = p.y + (a.y - p.y) / d * range; }
    a.x = clamp(a.x, 0.5, MAP.w - 0.5); a.y = clamp(a.y, 0.5, MAP.h - 0.5); a.ang = angTo(p, a.x, a.y);
    // auto-placed gadgets: if the default spot is taken, walk around the survivor for the nearest free one
    if (ab.kind === 'place' && !aim && !placeOk(a.x, a.y, 0.3)) { const base = a.ang; outer: for (const r of [2.5, 1.5, 3.5]) for (const off of [0.5, -0.5, 1, -1, 1.6, -1.6, 2.2, -2.2, Math.PI]) { const x = clamp(p.x + Math.cos(base + off) * r, 0.5, MAP.w - 0.5), y = clamp(p.y + Math.sin(base + off) * r, 0.5, MAP.h - 0.5); if (placeOk(x, y, 0.3)) { a.x = x; a.y = y; a.ang = angTo(p, x, y); break outer; } } }
    return a;
  }
  function pickTargetAng(p, ang, range) { let best = null, bs = 1e9; for (const z of S.zombies) { if (z.dead) continue; const d = dist(z.x, z.y, p.x, p.y); if (d > range + z.r) continue; const diff = angDiff(angTo(p, z.x, z.y), ang); if (diff < 0.7 && diff * 8 + d < bs) { bs = diff * 8 + d; best = z; } } return best; }
  function pickTarget(p, st) { return pickTargetAng(p, p.aim, st.range) || nearestZombie(p, st.range); }
  const meleeStats = (p, st) => { const mw = p.weapons.melee; return Object.assign({}, st, { base: WEAPONS[mw.key], w: mw, favored: p.d.favored.includes(mw.key) }); };
  const gunStats = (p, st) => { const gw = p.weapons.primary; return Object.assign({}, st, { base: WEAPONS[gw.key], w: gw, favored: p.d.favored.includes(gw.key), range: WEAPONS[gw.key].range }); };
  function heal(p, amount, by) { if (p.dead || p.down) return; if (by && by.id === 'wolf' && p.id === 'savage' && p.rage > 0 && perk('triage')) amount *= 1.5; const before = p.hp; p.hp = Math.min(p.maxHp, p.hp + amount); const got = p.hp - before; if (got > 0) { if (by && by !== p && by.st) by.st.heal += got; (by || p).adren = Math.min(ADREN_MAX, (by || p).adren + got / 15); S.fx.push({ kind: 'num', x: p.x, y: p.y - 0.9, t: 0, life: 0.7, text: '+' + Math.round(got), heal: true }); } }
  function hotHeal(p, amount, secs, by) { p.hot += amount; p.hotT = Math.max(p.hotT, secs); p.hotBy = by && by !== p ? by : null; }
  function knockdown(z, secs, fromX, fromY, force) { if (z.dead) return; z.stag = Math.max(z.stag, z.type === 'brute' ? Math.min(secs, 0.6) : secs); if (z.type !== 'brute' && fromX != null) { const d = dist(z.x, z.y, fromX, fromY) || 1; z.kx += (z.x - fromX) / d * force; z.ky += (z.y - fromY) / d * force; } }
  function spawnQuestItems() {
    const origin = { x: 23.5, y: 19 }; const placed = [];
    QUEST_ITEMS.forEach((def, i) => {
      let best = null;
      for (let tries = 0; tries < 400 && !best; tries++) {
        const x = rand(4, MAP.w - 4), y = rand(4, MAP.h - 4);
        if (solidAt(x, y, 0.7)) continue; if (dist(x, y, origin.x, origin.y) < 14) continue; if (dist(x, y, MAP.extract.x, MAP.extract.y) < 6) continue; if (placed.some(q => dist(q.x, q.y, x, y) < 12)) continue;
        best = { id: i + 1, key: def.key, x, y, t: rand(0, 6), got: false, prog: 0, by: -1 };
      }
      if (!best) best = { id: i + 1, key: def.key, x: 16 + i * 4, y: 13, t: 0, got: false, prog: 0, by: -1 };
      placed.push(best); S.quest.items.push(best);
    });
  }
  function questDef(q) { return QUEST_ITEMS.find(d => d.key === q.key) || QUEST_ITEMS[0]; }
  function questTick(dt) {
    const Q = S.quest; if (!Q) return; const hostSide = S.isHost || !S.coop;
    for (const q of Q.items) { q.t += dt; if (q.got) continue; const near = S.players.filter(p => !p.dead && !p.down && dist(p.x, p.y, q.x, q.y) <= QUEST_PICK_R); if (!hostSide) continue; if (near.length) { q.prog = Math.min(1, q.prog + dt / QUEST_PICK_T * (1 + 0.5 * (near.length - 1))); if (q.prog >= 1) recoverQuest(q, near[0]); } else q.prog = Math.max(0, q.prog - dt * 1.5); }
  }
  function recoverQuest(q, p) {
    const Q = S.quest, def = questDef(q); q.got = true; q.by = p.sid; Q.done++; p.st.q = (p.st.q || 0) + 1; p.adren = Math.min(ADREN_MAX, p.adren + ADREN_MAX * 0.25);
    S.fx.push({ kind: 'ring', x: q.x, y: q.y, t: 0, life: 0.7, r: 2.2, col: def.col }); S.fx.push({ kind: 'num', x: q.x, y: q.y - 1.3, t: 0, life: 1.2, text: `${def.name.toUpperCase()} ${Q.done}/${Q.total}`, col: def.col });
    for (let i = 0; i < 14; i++) { const an = rand(0, Math.PI * 2); S.fx.push({ kind: 'blood', spark: true, col: def.col, x: q.x, y: q.y, vx: Math.cos(an) * rand(1, 4), vy: Math.sin(an) * rand(1, 4) - 2, t: 0, life: rand(0.4, 0.8) }); }
    netSfx.push('pickup'); sfx('pickup', 1);
    if (Q.done >= Q.total) { Q.bonus = true; for (const o of S.players) { if (o.dead) continue; o.adren = ADREN_MAX; heal(o, o.maxHp * 0.25); S.fx.push({ kind: 'ring', x: o.x, y: o.y, t: 0, life: 0.8, r: 2, col: '46,204,113' }); } const item = makeItem(Math.random() < 0.5 ? 'weapon' : 'armor', Math.max(2, rollRarity(0, 2)), 2 + Math.floor(S.time / 60)); S.loot.push({ item, x: q.x + 0.8, y: q.y, t: 0 }); objective(`All supplies recovered. Squad: Adrenaline full, +25% health. ${item.rar.name} drop at the last cache.`, true, 7); }
    else objective(`${p.name} recovered the ${def.name}. ${Q.done}/${Q.total}`, false, 4);
    renderQuestHud();
  }
  function renderQuestHud() { const el = $('quest'); if (!el || !S.quest) return; el.innerHTML = `<span class="ql">Supplies</span>` + S.quest.items.map(q => { const d = questDef(q); return `<i class="${q.got ? 'got' : ''}" style="--c:${d.hex}" title="${d.name}"></i>`; }).join('') + `<b>${S.quest.done}/${S.quest.total}</b>`; el.classList.toggle('done', S.quest.done >= S.quest.total); }
  function placeOk(x, y, r) { return !solidAt(x, y, r) && !S.turrets.some(t => dist(t.x, t.y, x, y) < 1) && !S.mines.some(m => dist(m.x, m.y, x, y) < 0.8); }
  function lobThrow(p, kind, x, y, extra) { const d = dist(p.x, p.y, x, y); S.throws.push(Object.assign({ kind, x: p.x, y: p.y, tx: x, ty: y, t: 0, life: Math.max(0.3, d / 14), sid: p.sid }, extra || {})); }
  function dropFlare(x, y) { const ok = !solidAt(x, y, 0.3); const f = { x: ok ? x : x, y: ok ? y : y, t: 6, r: 25 }; S.flares.push(f); computeField(f.x, f.y, flareField); S.zombies.forEach(z => { if (dist(z.x, z.y, f.x, f.y) <= f.r && z.type !== 'spitter') { z.aware = true; z.flare = f; if (perk('livebait')) z.taunted = Math.max(z.taunted || 0, 3); } }); }
  const multiCd = (p, slot) => p.mcd[slot] || (p.mcd[slot] = Array(KITS[p.id][slot].multi).fill(0));
  // p.cd mirrors the soonest-ready timer (0 while any charge is up) so the HUD fill, aim gating and snapshots keep working unchanged
  const syncMultiCd = (p, slot) => { const arr = multiCd(p, slot); p.cd[slot] = arr.every(t => t > 0) ? Math.min(...arr) : 0; p.mcAvail[slot] = arr.filter(t => t <= 0).length; };
  const chargesLeft = (p, slot) => { const ab = KITS[p.id][slot]; if (!ab.multi) return null; if (S.isClient) return p.mcAvail[slot] ?? ab.multi; syncMultiCd(p, slot); return p.mcAvail[slot]; };
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; };
  // every successful cast: a ring + sparks in the survivor's colour, so each button press is visible to the whole squad
  function castBurst(p, slot) { p.lastCombat = S.time; const col = hexRgb(p.d.color); S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.45, r: slot === 'r' ? 3 : 1.6, col }); for (let i = 0; i < (slot === 'r' ? 16 : 8); i++) { const an = rand(0, Math.PI * 2), sp = rand(2, slot === 'r' ? 6 : 4); S.fx.push({ kind: 'blood', spark: true, col, x: p.x, y: p.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, t: 0, life: rand(0.25, 0.5) }); } }
  const localFx = (f) => Array.prototype.push.call(S.fx, f); // draw-time ambience: never replicated
  function castAbility(p, slot, aim) {
    atkP = p;
    if (p.dead || p.down) return false;
    const ab = KITS[p.id][slot]; const st = stats(p);
    if (slot === 'r') { if (p.adren < ADREN_MAX) { toast('Adrenaline not full.', '#e67e22'); return false; } p.adren = 0; castBurst(p, 'r'); withPlayer(p, () => useUlt(p, st, resolveAim(p, { kind: 'aimed', range: 10 }, aim))); S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.5, r: 2.5, white: true }); sfx('roar', 0.5); return true; }
    if (ab.multi) { // independent charges (Fuse): each placed turret / mine runs its own cooldown timer
      const arr = multiCd(p, slot); const i = arr.findIndex(t => t <= 0); if (i < 0) return false;
      const a = resolveAim(p, ab, aim); arr[i] = ab.cd; syncMultiCd(p, slot);
      let ok = true; withPlayer(p, () => { ok = ABILITY_FX[p.id][slot](p, st, a) !== false; });
      if (!ok) { arr[i] = 0; syncMultiCd(p, slot); return false; }
      castBurst(p, slot); sfx('ability'); return true;
    }
    if (p.cd[slot] > 0 && !(ab.charges && p.qCharges > 0)) return false;
    const a = resolveAim(p, ab, aim);
    const prevCd = p.cd[slot], prevCh = p.qCharges;
    if (ab.charges) { p.qCharges--; if (p.cd[slot] <= 0) p.cd[slot] = ab.cd; } else p.cd[slot] = ab.cd;
    let ok = true;
    withPlayer(p, () => { ok = ABILITY_FX[p.id][slot](p, st, a) !== false; });
    if (!ok) { p.cd[slot] = prevCd; p.qCharges = prevCh; return false; }
    castBurst(p, slot); sfx('ability');
    return true;
  }
  const ABILITY_FX = {
    shadow: {
      s(p) { p.stealth = 6; p.exposedHit = true; S.fx.push({ kind: 'puff', x: p.x, y: p.y, t: 0, life: 0.7, seed: rand(0, 6), col: '155,89,182', big: true }); S.zombies.forEach(z => { if (dist(z.x, z.y, p.x, p.y) < 30) z.aware = false; }); toast('<b>Ghost Step.</b> Unseen for 6 s, healing 4%/s. First hit crits hard.', p.d.color); },
      d(p, st, a) { const z = a.z; if (!z) { toast('No target in reach.', p.d.color); return false; } const d = dist(z.x, z.y, p.x, p.y); const ox = p.x, oy = p.y; if (d > 1.2) { const k = (d - z.r - p.r) / d; const nx = p.x + (z.x - p.x) * k, ny = p.y + (z.y - p.y) * k; if (!solidAt(nx, ny, p.r)) { p.x = nx; p.y = ny; } } S.fx.push({ kind: 'trail', x0: ox, y0: oy, x1: p.x, y1: p.y, t: 0, life: 0.3, col: '155,89,182' }); S.fx.push({ kind: 'ghost', x: ox, y: oy, r: p.r * PPM, t: 0, life: 0.3, col: '155,89,182' }); S.fx.push({ kind: 'cone', x: z.x, y: z.y, r: 1.3, ang: angTo(p, z.x, z.y) + 1.2, half: 0.5, t: 0, life: 0.2, col: '220,200,240' }); p.aim = angTo(p, z.x, z.y); const pts = p.combo; const fin = pts >= 3; const low = z.hp / z.maxHp < (fin ? 0.5 : 0.3); p.forceCrit = true; p.hitMult = (3.5 + 0.75 * pts) * (low ? 2 : 1) * (z.taunted > 0 && perk('cleanslate') ? 1.25 : 1); p.combo = 0; p.comboT = 0; hitZombie(z, p, meleeStats(p, st), 1, true, 0.3); p.hitMult = 1; p.forceCrit = false; p.swing = 0.18; p.swingDir = p.aim; sfx('melee'); S.fx.push({ kind: 'num', x: z.x, y: z.y - z.r - 0.9, t: 0, life: 0.7, text: fin ? (low ? 'FINISHER · EXECUTED' : 'FINISHER') : low ? 'EXECUTED' : 'EXECUTE', crit: true }); if (fin) { S.fx.push({ kind: 'ring', x: z.x, y: z.y, t: 0, life: 0.4, r: 2, purple: true }); S.shake = Math.max(S.shake, 0.15); } if (z.dead) { p.cd.d = 0; p.cd.s = Math.max(0, p.cd.s - 3); p.cd.u = Math.max(0, p.cd.u - 3); S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.6, t: 0, life: 0.8, text: 'EXECUTE RESET', purple: true }); toast('<b>Execute</b> kill: cooldown reset, Ghost Step and Blade Cyclone −3 s.', p.d.color); } },
      u(p) { p.cyclone = 1.0; p.cycloneTick = 0; p.cycloneHit = false; toast('<b>Blade Cyclone.</b>', p.d.color); },
    },
    wolf: {
      s(p, st, a) { const t = a.ally || p; if (t === p) hotHeal(p, p.maxHp * 0.15 * (1 + st.healrecv) * (p.inf >= 0.5 ? 0.7 : 1), 3); else { hotHeal(t, t.maxHp * 0.30, 3, p); if (t.id === 'buck' && perk('frontline')) { t.shield = Math.max(t.shield, 4); } withPlayer(t, () => toast(`<b>${p.name}</b> patched you up. +30% over 3 s.${t.id === 'buck' && perk('frontline') ? ' Frontline Medicine: front shield up 4 s.' : ''}`, p.d.color)); S.fx.push({ kind: 'tracer', x0: p.x, y0: p.y, x1: t.x, y1: t.y, t: 0, life: 0.2, green: true }); } S.fx.push({ kind: 'ring', x: t.x, y: t.y, t: 0, life: 0.6, r: 1.4, green: true }); S.fx.push({ kind: 'num', x: t.x, y: t.y - 1.1, t: 0, life: 0.9, text: '+ DRESSED', heal: true }); for (let i = 0; i < 6; i++) S.fx.push({ kind: 'blood', spark: true, green: true, x: t.x + rand(-0.4, 0.4), y: t.y + rand(-0.2, 0.2), vx: rand(-0.6, 0.6), vy: rand(-2.5, -1), t: 0, life: rand(0.4, 0.7) }); p.triage.push(10); if (p.triage.length > 10) p.triage.shift(); toast(t === p ? `<b>Field Dressing</b> on yourself: 15% over 3 s. Triage ×${p.triage.length}.` : `<b>Field Dressing</b> to ${t.name}. Triage ×${p.triage.length}.`, p.d.color); },
      d(p, st, a) { const gs = gunStats(p, st); let x = p.x, y = p.y, hit = null; for (let t = 0; t < 20; t += 0.25) { x += Math.cos(a.ang) * 0.25; y += Math.sin(a.ang) * 0.25; if (solidAt(x, y, 0)) break; hit = S.zombies.find(z => !z.dead && dist(z.x, z.y, x, y) <= z.r + 0.15); if (hit) break; } S.fx.push({ kind: 'tracer', x0: p.x, y0: p.y, x1: x, y1: y, t: 0, life: 0.15, green: true }); sfx('silenced'); if (!hit) { toast('Dart missed.', p.d.color); return; } if (hit.type === 'spitter' && hit.hp / hit.maxHp < 0.4) { S.fx.push({ kind: 'num', x: hit.x, y: hit.y - 1, t: 0, life: 0.8, text: 'SAC BURST', crit: true }); hit.noAcid = true; damageZombie(hit, hit.hp + 1, true, p.x, p.y, 0.2); } else { p.hitMult = 3.0; hitZombie(hit, p, gs, 1, false, 0.3); p.hitMult = 1; if (!hit.dead) hit.slow = 3; } S.fx.push({ kind: 'puff', x: hit.x, y: hit.y, t: 0, life: 0.5, seed: rand(0, 6), col: '46,204,113' }); S.fx.push({ kind: 'num', x: hit.x, y: hit.y - hit.r - 0.9, t: 0, life: 0.7, text: 'SLOWED', heal: true }); p.triage.push(10); if (p.triage.length > 10) p.triage.shift(); toast(`<b>Bad Medicine.</b> ${hit.d.name} slowed 50% for 3 s. Triage ×${p.triage.length}.`, p.d.color); },
      u(p, st, a) { lobThrow(p, 'cloud', a.x, a.y); toast('<b>Antiviral Cloud.</b> Cures Infection and gives 8 s immunity inside.', p.d.color); },
    },
    buck: {
      s(p) { p.digIn = 4; p.digX = p.x; p.digY = p.y; p.shield = 4; hotHeal(p, p.maxHp * 0.2, 4); S.fx.push({ kind: 'puff', x: p.x, y: p.y, t: 0, life: 0.6, seed: rand(0, 6), col: '150,130,100', big: true }); S.fx.push({ kind: 'cone', x: p.x, y: p.y, r: 1.6, ang: p.aim, half: 1.4, t: 0, life: 0.4, col: '52,152,219' }); toast('<b>Riot Stance.</b> 4 s: 80% blocked from the front, healing 20%. Blocked hits build Grit. Move at 70%.', p.d.color); },
      d(p, st, a) { const gs = gunStats(p, st); p.aim = a.ang; const hits = S.zombies.filter(z => !z.dead && dist(z.x, z.y, p.x, p.y) <= 4.5 + z.r && angDiff(angTo(p, z.x, z.y), a.ang) < 0.5); S.fx.push({ kind: 'flash', x: p.x + Math.cos(a.ang) * 0.7, y: p.y + Math.sin(a.ang) * 0.7, t: 0, life: 0.1, big: true }); S.fx.push({ kind: 'cone', x: p.x, y: p.y, r: 4.5, ang: a.ang, half: 0.5, t: 0, life: 0.3, col: '52,152,219' }); for (let i = 0; i < 10; i++) { const an = a.ang + rand(-0.5, 0.5); S.fx.push({ kind: 'blood', spark: true, col: '255,220,160', x: p.x + Math.cos(an) * 0.8, y: p.y + Math.sin(an) * 0.8, vx: Math.cos(an) * rand(6, 12), vy: Math.sin(an) * rand(6, 12), t: 0, life: rand(0.15, 0.3) }); } S.shake = Math.max(S.shake, 0.3); sfx('shotgun'); noiseAt(p.x, p.y, 25); const g = p.grit || 0; p.breaching = g; let gained = 0; for (const z of hits) { gained++; z.windup = null; z.spitWind = null; if (z.screamT != null) z.screamT += 1; p.hitMult = 3.5; hitZombie(z, p, gs, 1, true, 1.5); p.hitMult = 1; knockdown(z, 2, p.x, p.y, 2); } p.breaching = 0; if (g > 0) { heal(p, p.maxHp * 0.04 * g); p.grit = 0; p.gritT = 0; } if (gained) { addGrit(p, Math.min(2, gained)); }
        if (false) { S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.3, t: 0, life: 0.9, text: `GRIT SPENT ×${g} · +${4 * g}%`, heal: true }); } toast(hits.length ? `<b>Breaching Shot.</b> ${hits.length} down${g ? `, Grit ×${g}: +${20 * g}% and healed ${4 * g}%` : ''}.` : '<b>Breaching Shot.</b> Nothing in the cone.', p.d.color); },
      u(p) { p.taunt = 5; S.shake = 0.3; S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.5, r: 10, blue: true }); S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.8, r: 10, blue: true }); S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.4, t: 0, life: 1, text: 'OVER HERE!', col: '52,152,219' }); S.zombies.forEach(z => { const d = dist(z.x, z.y, p.x, p.y); if (d <= 10) { z.aware = true; z.taunted = 5; z.tauntBy = p; } if (d <= 3 && z.type !== 'brute') { const l = d || 1; z.kx += (z.x - p.x) / l * 2.2; z.ky += (z.y - p.y) / l * 2.2; z.stag = Math.max(z.stag, 0.6); } }); addGrit(p, 2); toast('<b>Over Here!</b> Every Hollow within 10 m wants you. +30% reduction, +2 Grit. Taunted kills heal you.', p.d.color); },
    },
    flight: {
      s(p, st, a) { const ally = S.players.filter(o => o !== p && o.down && !o.dead && dist(o.x, o.y, p.x, p.y) <= 15).sort((x, y) => dist(x.x, x.y, p.x, p.y) - dist(y.x, y.y, p.x, p.y))[0]; if (ally) { const d = dist(ally.x, ally.y, p.x, p.y) || 1; p.ddx = (ally.x - p.x) / d; p.ddy = (ally.y - p.y) / d; p.dodgeT = Math.min(0.5, Math.max(0.05, (d - 1) / 18)); ally.rescueBoost = true; ally.invuln = 2; } else { p.ddx = Math.cos(a.ang); p.ddy = Math.sin(a.ang); p.dodgeT = 0.5; } p.invuln = 0.7; p.rescue = true; p.slow = 0; heal(p, p.maxHp * 0.20); p.trailCol = '231,76,60'; addMom(p, 50); p.slipLast = { x: p.x, y: p.y }; S.zones.push({ kind: 'slip', x: p.x, y: p.y, r: 1.4, t: 4, max: 4, sid: p.sid }); toast(ally ? `<b>Rescue Run</b> to ${ally.name}: fast revive. Slipstream down.` : '<b>Rescue Run.</b> 9 m dash, untouchable, +20% health, +50 Momentum. Slipstream down for 4 s.', p.d.color); },
      d(p, st, a) { const gs = gunStats(p, st); if (gs.base.type !== 'gun') return false; p.aim = a.ang; const mom = p.boost > 0 ? 100 : (p.mom || 0); const shots = 3 + Math.floor(mom / 25); const allCrit = mom >= 75; p.hitMult = 1.4; p.fbFiring = true; const n = Math.min(shots, Math.max(1, p.mag)); for (let i = 0; i < n; i++) { p.fireCd = 0; p.reloading = 0; if (allCrit) p.forceCrit = true; fireWeapon(p, gs, 0); } p.forceCrit = false; p.fbFiring = false; p.hitMult = 1; if (p.boost <= 0) p.mom = 0; S.fx.push({ kind: 'cone', x: p.x, y: p.y, r: 3, ang: a.ang, half: 0.25, t: 0, life: 0.25, col: '231,76,60' }); S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.3, t: 0, life: 0.8, text: `FAST BREAK ×${n}${allCrit ? ' · ALL CRIT' : ''}`, col: '231,76,60' }); toast(`<b>Fast Break.</b> ${n} shots, +40%${allCrit ? ', every one a crit' : ''}. Momentum spent.`, p.d.color); },
      u(p, st, a) { lobThrow(p, 'flare', a.x, a.y); toast('<b>Flare Run.</b> Every Hollow within 25 m goes for the flare for 6 s and takes +15% from everyone.', p.d.color); },
    },
    savage: {
      s(p) { heal(p, p.maxHp * 0.15); hotHeal(p, p.maxHp * 0.10, 3); p.slow = 0; if (p.rage > 0) p.rage += 3; else addRage(p, 30); S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.5, r: 2, crimson: true }); S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.3, t: 0, life: 0.9, text: 'SHAKE IT OFF +15%', heal: true }); toast(p.rage > 0 ? '<b>Shake It Off.</b> +15% now, +10% over 3 s, Rage +3 s.' : '<b>Shake It Off.</b> +15% now, +10% over 3 s, +30 Rage.', p.d.color); },
      d(p, st) { S.shake = 0.45; S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.5, r: 4, crimson: true }); S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.8, r: 4, col: '120,90,70' }); S.fx.push({ kind: 'puff', x: p.x, y: p.y, t: 0, life: 0.8, seed: rand(0, 6), col: '120,100,80', big: true }); for (let i = 0; i < 14; i++) { const an = rand(0, Math.PI * 2); S.fx.push({ kind: 'blood', spark: true, col: '150,120,90', x: p.x, y: p.y, vx: Math.cos(an) * rand(3, 7), vy: Math.sin(an) * rand(3, 7), t: 0, life: rand(0.3, 0.6) }); } const ms = meleeStats(p, st); let n = 0; p.pounding = true; S.zombies.forEach(z => { const d = dist(z.x, z.y, p.x, p.y); if (d <= 4 + z.r && !z.dead) { p.hitMult = 1.5 * (z.zapped > 0 && perk('breaker') ? 1.3 : 1); if (perk('scorched') && S.fires.some(f => dist(f.x, f.y, p.x, p.y) < f.r + 0.3)) burnZombie(z, 2); hitZombie(z, p, ms, 1, true, 1.5); p.hitMult = 1; knockdown(z, 1.5, p.x, p.y, 1.5); n++; } }); p.pounding = false; noiseAt(p.x, p.y, 15); toast(`<b>Ground Pound.</b> ${n} Hollow${n === 1 ? '' : 's'} down${n ? `, +${5 * n} Rage` : ''}.`, p.d.color); },
      u(p, st, a) { const ally = a.ally; if (ally) { const d = dist(ally.x, ally.y, p.x, p.y) || 1; p.ddx = (ally.x - p.x) / d; p.ddy = (ally.y - p.y) / d; p.dodgeT = Math.min(0.3, d / 20); } else { p.ddx = Math.cos(a.ang); p.ddy = Math.sin(a.ang); p.dodgeT = 0.3; } p.invuln = 0.45; p.leap = true; p.trailCol = '192,57,43'; p.leapAlly = ally || null; addRage(p, 20); if ((p.hp / p.maxHp < 0.35 || (ally && (ally.down || ally.hp / ally.maxHp < 0.35))) && p.rage <= 0) startRage(p); toast(ally ? `<b>Protector.</b> To ${ally.name}: they take 30% less for 4 s. +20 Rage.` : '<b>Protector.</b> Leap and shove. +20 Rage.', p.d.color); },
    },
    fuse: {
      s(p) { hotHeal(p, p.maxHp * 0.2, 4); const tr = S.turrets.filter(t => dist(t.x, t.y, p.x, p.y) <= 3); tr.forEach(t => { t.t = 30; const fixed = Math.round((t.maxHp || 500) - t.hp); t.hp = t.maxHp || 500; t.repT = 1.2; S.fx.push({ kind: 'ring', x: t.x, y: t.y, t: 0, life: 0.7, r: 1.4, green: true }); S.fx.push({ kind: 'num', x: t.x, y: t.y - 0.9, t: 0, life: 1.1, text: fixed > 0 ? `REPAIRED +${fixed}` : 'RESET', heal: true }); for (let i = 0; i < 8; i++) S.fx.push({ kind: 'blood', spark: true, green: true, x: t.x, y: t.y, vx: rand(-1.5, 1.5), vy: rand(-2, 0.5), t: 0, life: rand(0.3, 0.6) }); }); if (tr.length) sfx('pickup', 0.6); toast(tr.length ? `<b>Jumper Cables.</b> Healing 20% over 4 s, ${tr.length} turret${tr.length > 1 ? 's' : ''} reset.` : '<b>Jumper Cables.</b> Healing 20% over 4 s.', p.d.color); },
      d(p, st, a) { if (!placeOk(a.x, a.y, 0.3)) { toast('No room for a turret there.', p.d.color); return false; } S.turrets.push({ x: a.x, y: a.y, t: 30, cd: 0, aim: a.ang, dps: 65, range: 14, sid: p.sid, hp: 500, maxHp: 500 }); S.fx.push({ kind: 'ring', x: a.x, y: a.y, t: 0, life: 0.5, r: 1.2, yellow: true }); for (let i = 0; i < 8; i++) S.fx.push({ kind: 'blood', spark: true, x: a.x, y: a.y, vx: rand(-2, 2), vy: rand(-3, -0.5), t: 0, life: rand(0.3, 0.5) }); sfx('zap', 0.3); const own = S.turrets.filter(t => !t.ult); if (own.length > 2) S.turrets.splice(S.turrets.indexOf(own[0]), 1); toast('<b>Junction Turret.</b> 30 s, 65 dps, 14 m, 500 HP. Explodes when destroyed.', p.d.color); },
      u(p, st, a) { if (!placeOk(a.x, a.y, 0.2)) { toast('No room for a mine there.', p.d.color); return false; } S.mines.push({ x: a.x, y: a.y, t: 30, arm: 0.6 }); if (S.mines.length > 4) S.mines.shift(); S.fx.push({ kind: 'ring', x: a.x, y: a.y, t: 0, life: 0.6, r: 0.9, yellow: true }); toast('<b>Arc Mine</b> set. Stuns 3 m for 2 s.', p.d.color); },
    },
    hush: {
      s(p, st) { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.12); hotHeal(p, p.maxHp * 0.12, 4); p.reloading = 0; p.mag = st.base.mag; p.forceCrit = true; S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.5, r: 1.5, white: true }); sfx('heal', 0.6); toast('<b>Second Wind.</b> +12% now, +12% over 4 s, reloaded. Next shot crits.', p.d.color); },
      d(p, st, a) { const z = a.z; if (!z) { toast('No target in sight.', p.d.color); return false; } p.aim = angTo(p, z.x, z.y); const gs = gunStats(p, st); p.hitMult = 3.0; p.forceCrit = true; hitZombie(z, p, gs, 1, false, 0.2); p.hitMult = 1; if (!z.dead) { z.stag = Math.max(z.stag, z.type === 'brute' ? 1 : 3); z.pinned = z.type === 'brute' ? 1 : 3; z.kx = 0; z.ky = 0; } else { p.cd.d = Math.max(0, KITS.hush.d.cd - 6); p.focus = 0.5; p.focusT = 2.5; S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.2, t: 0, life: 0.8, text: 'HEADSHOT −6 s', crit: true }); } S.fx.push({ kind: 'laser', x0: p.x + Math.cos(p.aim) * 0.6, y0: p.y + Math.sin(p.aim) * 0.6, x1: z.x, y1: z.y, t: 0, life: 0.3, white: true }); S.fx.push({ kind: 'pierce', x: z.x, y: z.y, ang: p.aim, n: 2, t: 0, life: 0.35, white: true }); S.fx.push({ kind: 'flash', x: z.x, y: z.y, t: 0, life: 0.2, big: true }); S.shake = Math.max(S.shake, 0.12); sfx('shot'); noiseAt(p.x, p.y, 25); if (perk('overwatch')) { const fl = byId('flight'); if (fl && !fl.down && dist(fl.x, fl.y, z.x, z.y) <= 6 && fl.dodges < fl.d.dodges) { fl.dodges++; withPlayer(fl, () => toast('<b>Overwatch.</b> Dodge refunded.', '#95a5a6')); } } toast(z.dead ? '<b>Headshot.</b> Dropped it: 6 s refunded, Focus full.' : `<b>Headshot.</b> ${z.d.name} pinned for ${z.type === 'brute' ? 1 : 3} s.`, p.d.color); },
      u(p, st, a) { const z = a.z; if (!z) { toast('No target in sight.', p.d.color); return false; } let n = 0; for (const o of S.zombies) { if (o.dead || dist(o.x, o.y, z.x, z.y) > 4 + o.r) continue; o.marked = 8; o.aware = true; n++; S.fx.push({ kind: 'ring', x: o.x, y: o.y, t: 0, life: 0.5, r: o.r + 0.3, white: true }); } S.fx.push({ kind: 'ring', x: z.x, y: z.y, t: 0, life: 0.6, r: 4, white: true }); S.fx.push({ kind: 'num', x: z.x, y: z.y - z.r - 1.1, t: 0, life: 0.9, text: `MARKED ×${n}`, col: '236,240,241' }); sfx('pickup', 0.5); toast(`<b>Spotter's Call.</b> ${n} Hollow${n > 1 ? 's' : ''} marked: +15% from everyone for 8 s, your hits ricochet between them.`, p.d.color); },
    },
    torch: {
      s(p) { S.fires.push({ x: p.x, y: p.y, r: 2, t: 4, max: 4, sid: p.sid }); p.cburn = 4; sfx('fire'); S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.5, r: 2, fire: true }); for (let i = 0; i < 10; i++) S.fx.push({ kind: 'flame', x: p.x + rand(-1.5, 1.5), y: p.y + rand(-1.5, 1.5), t: 0, life: rand(0.3, 0.6) }); toast('<b>Controlled Burn.</b> Stand in your fire: +5% health per second for 4 s.', p.d.color); },
      d(p, st, a) { lobThrow(p, 'molotov', a.x, a.y); sfx('melee', 0.4); toast('<b>Molotov.</b>', p.d.color); },
      u(p, st, a) { const cx = p.x + Math.cos(a.ang) * 2, cy = p.y + Math.sin(a.ang) * 2; const px = -Math.sin(a.ang), py = Math.cos(a.ang); let n = 0; for (let i = -3; i <= 3; i++) { const fx = cx + px * i * 0.9, fy = cy + py * i * 0.9; if (!solidAt(fx, fy, 0.2)) { const fw = perk('firewall') && S.barricades.some(b => dist(b.x, b.y, fx, fy) < 1.2); S.fires.push({ x: fx, y: fy, r: 0.7, t: fw ? 12 : 6, max: fw ? 12 : 6, wall: true, sid: p.sid }); n++; for (let k = 0; k < 3; k++) S.fx.push({ kind: 'flame', x: fx + rand(-0.3, 0.3), y: fy + rand(-0.3, 0.3), t: 0, life: rand(0.3, 0.6) }); } } if (!n) { toast('No room for a fire line there.', p.d.color); return false; } sfx('fire'); noiseAt(p.x, p.y, 15); toast('<b>Fire Break.</b> Hollows won\'t cross it for 6 s. Brutes push through and burn.', p.d.color); },
    },
  };
  function useUlt(p, st, a) {
    const id = p.id;
    if (id === 'shadow') { const chain = S.zombies.filter(z => !z.dead && dist(z.x, z.y, p.x, p.y) <= 10).sort((x, y) => dist(x.x, x.y, p.x, p.y) - dist(y.x, y.y, p.x, p.y)).slice(0, 8); if (!chain.length) { p.adren = ADREN_MAX; toast('No Hollows in reach.', p.d.color); return; } p.ultChain = chain; p.ultT = 0; p.invuln = chain.length * 0.14 + 0.3; toast(`<b>Lights Out.</b> ${chain.length} Hollows.`, p.d.color); }
    if (id === 'wolf') { S.zones.push({ kind: 'heal', x: p.x, y: p.y, r: 4, t: 6, max: 6, sid: p.sid }); S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.8, r: 4, green: true }); S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.4, t: 0, life: 1, text: 'CODE BLUE', heal: true }); toast('<b>Code Blue.</b> 8%/s for 6 s, revives, clears Infection.', p.d.color); }
    if (id === 'buck') { S.shake = 0.5; S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.6, r: 5, blue: true }); S.zombies.forEach(z => { if (!z.dead && dist(z.x, z.y, p.x, p.y) <= 5 + z.r) { z.stag = Math.max(z.stag, 2); z.zapped = 1; } }); const cx = p.x + Math.cos(a.ang) * 2.2, cy = p.y + Math.sin(a.ang) * 2.2; const px = -Math.sin(a.ang), py = Math.cos(a.ang); for (let i = -3; i <= 3; i++) { const bx = cx + px * i * 0.95, by = cy + py * i * 0.95; if (!solidAt(bx, by, 0.3)) S.barricades.push({ x: bx, y: by, r: 0.55, t: perk('hardpoint') ? 12 : 8, max: perk('hardpoint') ? 12 : 8 }); } p.grit = 5; p.gritT = 8; p.gritLock = 8; toast('<b>Hold the Line.</b> Stunned everything within 5 m. Barricade up for 8 s. Grit maxed and locked for 8 s.', p.d.color); }
    if (id === 'flight') { p.mom = 100; for (const o of S.players) { if (o.dead) continue; o.boost = 8; o.dodges = o.d.dodges; heal(o, o.maxHp * 0.10); S.fx.push({ kind: 'ring', x: o.x, y: o.y, t: 0, life: 0.6, r: 1.6, red: true }); S.fx.push({ kind: 'num', x: o.x, y: o.y - 1.3, t: 0, life: 0.9, text: 'SECOND WIND', col: '231,76,60' }); if (o !== p) withPlayer(o, () => toast(`<b>${p.name}: Second Wind.</b> +30% speed, +20% attack speed, dodges refilled.`, p.d.color)); } toast('<b>Second Wind.</b> Squad +30% speed, +20% attack speed, +10% health for 8 s. Dodges refilled. Momentum locked at 100.', p.d.color); }
    if (id === 'savage') { p.rage = 12; p.unchained = 12; p.rageSpent = 0; p.rageCd = 0; p.rageM = 0; p.cd.d = 0; S.shake = 0.4; sfx('roar'); S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.6, r: 4, crimson: true }); toast('<b>UNCHAINED.</b> 12 s: +60% damage, 35% reduction, hits heal 10%. Ground Pound reset and twice as fast; swings hit two extra Hollows.', p.d.color); }
    if (id === 'fuse') { p.overT = 12; const arr = multiCd(p, 'd'); arr.fill(0); syncMultiCd(p, 'd'); let n = 0; S.turrets.forEach(t => { if (t.sid !== p.sid) return; n++; t.hp = t.maxHp || 500; t.t = Math.max(t.t, 12); t.repT = 1.2; S.fx.push({ kind: 'ring', x: t.x, y: t.y, t: 0, life: 0.6, r: 1.6, cyan: true }); }); S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.7, r: 4, cyan: true }); sfx('zap'); toast(`<b>Third Rail.</b> 12 s: turrets fire piercing lasers that burn for 10 s. Both turret charges restored${n ? `, ${n} turret${n > 1 ? 's' : ''} repaired` : ''}.`, p.d.color); }
    if (id === 'hush') { p.deadAir = 6; p.focus = 0.5; p.reloading = 0; p.mag = st.base.mag; S.fx.push({ kind: 'num', x: p.x, y: p.y - 1.3, t: 0, life: 0.9, text: 'DEAD AIR', col: '236,240,241' }); toast('<b>Dead Air.</b> 6 s: no reloads, +50% attack speed, every shot pierces and crits.', p.d.color); }
    if (id === 'torch') { p.finale = 8; p.fireCd = 0; p.reloading = 0; sfx('fire'); S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.7, r: 3, fire: true }); for (let i = 0; i < 16; i++) S.fx.push({ kind: 'flame', x: p.x + rand(-1, 1), y: p.y + rand(-1, 1), vx: rand(-3, 3), vy: rand(-3, 3), t: 0, life: rand(0.4, 0.8) }); toast('<b>Grand Finale.</b> 8 s of overcharged fire. Hold Attack.', p.d.color); }
  }
  function dodge(p, st) {
    if (p.dodges <= 0 || p.dodgeT > 0) return;
    p.dodges--; p.dodgeT = 0.25; p.invuln = 0.3; const mx = p.input.mx, my = p.input.my; const l = Math.hypot(mx, my);
    p.ddx = l > 0.1 ? mx / l : Math.cos(p.aim); p.ddy = l > 0.1 ? my / l : Math.sin(p.aim); if (p.dodgeRecharge <= 0) p.dodgeRecharge = 4;
    sfx('melee', 0.5);
  }
  function swapWeapon(p) { p.slot = p.slot === 'primary' ? 'melee' : 'primary'; p.reloading = 0; p.fireCd = 0.15; }
  const BAG_MAX = 8;
  function equipLoot(l, p) {
    const it = l.item; p.found.push(it); if (p === S.p) S.found.push(it); sfx('pickup', it.rar.gs >= 10 ? 1 : 0.6);
    if (it.kind === 'weapon') {
      if (p.bag.length >= BAG_MAX) { salvage(p, it); toast(`Bag full. <b>${it.label}</b> salvaged.`, it.rar.color); }
      else { p.bag.push(it); if (p === S.p) { $('btnBag').classList.add('new'); showPickup(it); } else if (S.coop && S.isHost) netEv.push({ k: 'pickup', sid: p.sid, i: p.bag.length - 1 }); }
    } else {
      const cur = p.armor[it.slot];
      if (!cur || it.gs > cur.gs) { p.armor[it.slot] = it; toast(`Equipped <b>${it.label}</b> +${it.hpFlat} HP ${affixText(it)}`, it.rar.color); const st = stats(p); p.maxHp = st.maxHp; p.hp = Math.min(p.hp + it.hpFlat, p.maxHp); }
      else { salvage(p, it); toast(`<b>${it.label}</b> salvaged. Not an upgrade.`, it.rar.color); }
    }
    if (p.reserve < 240) p.reserve = Math.min(240, p.reserve + 24); p.gearVer = (p.gearVer || 0) + 1;
  }
  function salvage(p, it) { p.scrap += Math.round((2 + ((it.rar.gs / 5) | 0) + it.ilvl) * (p.id === 'fuse' ? 1.2 : 1)); }
  const slotOf = (it) => WEAPONS[it.key].type === 'melee' ? 'melee' : 'primary';
  // rough damage-per-second estimate for comparisons (survivor stats included)
  function dpsOf(p, it) { const b = WEAPONS[it.key]; const fav = p.d.favored.includes(it.key) ? 1.1 : 1; let dmgPct = 0, crit = p.d.crit, cd = 0.5 + (b.critDmg || 0), as = 0; it.affixes.forEach(a => { if (a.id === 'dmg') dmgPct += a.v; if (a.id === 'crit') crit += a.v * p.d.critAffixMult; if (a.id === 'critDmg') cd += a.v * p.d.critAffixMult; if (a.id === 'as') as += a.v; }); crit = Math.min(crit, p.d.critCap); const per = b.dmg * it.mult * (p.d.dmg / 100) * fav * (1 + dmgPct) * (b.pellets || 1) * (1 + crit * cd); return Math.round(per * b.rate * p.d.as * (1 + as)); }
  const itemMeta = (it) => { const b = WEAPONS[it.key]; const bits = [b.type === 'melee' ? `melee · ${b.targets} target${b.targets > 1 ? 's' : ''}` : `${b.mag} rd · ${b.range} m · ${['silent', 'low', 'medium', 'loud'][b.noise]}`]; if (it.affixes.length) bits.push(it.affixes.map(a => `${a.name} +${Math.round(a.v * 100)}%`).join(', ')); return bits.join(' · '); };
  let pickupItem = null, pickupT = 0;
  function showPickup(it) {
    const p = S.p; pickupItem = it; pickupT = 7; const cur = p.weapons[slotOf(it)]; const nd = dpsOf(p, it), cdps = dpsOf(p, cur);
    pickupT = isTouch ? 9 : 7; const el = $('pickup'); el.style.setProperty('--pc', it.rar.color); el.classList.remove('hidden'); $('pkHint').textContent = isTouch ? 'Quick tap right side to equip · left side to keep' : 'G to equip · F swaps gun / melee';
    $('pkRar').textContent = it.rar.name; $('pkRar').className = 'rar ' + it.rar.id; $('pkName').textContent = it.name; $('pkIlvl').textContent = `iLvl ${it.ilvl} · GS ${it.gs}`;
    $('pkNewDps').textContent = nd + ' dps'; $('pkNewDps').className = nd > cdps ? 'up' : nd < cdps ? 'down' : ''; $('pkNewAff').textContent = itemMeta(it);
    $('pkCurLabel').textContent = `Your ${cur.name}`; $('pkCurDps').textContent = cdps + ' dps'; $('pkCurDps').className = ''; $('pkCurAff').textContent = itemMeta(cur);
  }
  function hidePickup() { pickupItem = null; $('pickup').classList.add('hidden'); }
  function equipFromBag(it, p = S.p) {
    if (S.isClient) { net.act({ a: 'equip', i: p.bag.indexOf(it) }); if (pickupItem === it) hidePickup(); return; }
    const slot = slotOf(it); const i = p.bag.indexOf(it); if (i < 0) return;
    p.bag.splice(i, 1); const old = p.weapons[slot]; p.weapons[slot] = it; p.bag.push(old);
    if (slot === 'primary') { p.mag = WEAPONS[it.key].mag; p.reloading = 0; } if (p.slot !== slot) { p.slot = slot; p.fireCd = 0.15; }
    withPlayer(p, () => { toast(`Equipped <b>${it.label}</b>`, it.rar.color); sfx('ability', 0.6); }); p.gearVer = (p.gearVer || 0) + 1; if (pickupItem === it) hidePickup(); if (p === S.p) renderBag();
  }
  function salvageFromBag(it, p = S.p) { if (S.isClient) { net.act({ a: 'salvage', i: p.bag.indexOf(it) }); if (pickupItem === it) hidePickup(); return; } const i = p.bag.indexOf(it); if (i < 0) return; p.bag.splice(i, 1); salvage(p, it); p.gearVer = (p.gearVer || 0) + 1; withPlayer(p, () => toast(`<b>${it.label}</b> salvaged · ${p.scrap} Scrap`, it.rar.color)); if (pickupItem === it) hidePickup(); if (p === S.p) renderBag(); }
  function renderBag() {
    const p = S.p; if (!p) return;
    const row = (it, equipped, slot) => `<div class="item ${equipped ? 'equipped' : ''}" style="--pc:${it.rar.color}"><div class="t">${slot ? `<span class="slot">${slot}</span>` : ''}<strong style="color:${it.rar.color}">${it.label}</strong><small>iLvl ${it.ilvl} · ${dpsOf(p, it)} dps · ${itemMeta(it)}</small></div><div class="a">${equipped ? '' : `<button class="btn btn-primary" data-equip="${p.bag.indexOf(it)}" data-interactive>Equip</button><button class="btn" data-salvage="${p.bag.indexOf(it)}" data-interactive>Salvage</button>`}</div></div>`;
    $('bagEquipped').innerHTML = row(p.weapons.primary, true, 'Primary') + row(p.weapons.melee, true, 'Melee') + Object.values(p.armor).map(a => `<div class="item equipped" style="--pc:${a.rar.color}"><div class="t"><span class="slot">${a.slot}</span><strong style="color:${a.rar.color}">${a.label}</strong><small>+${a.hpFlat} HP ${affixText(a)}</small></div></div>`).join('');
    $('bagCap').textContent = `${p.bag.length} / ${BAG_MAX} · ${p.scrap} Scrap`;
    $('bagItems').innerHTML = p.bag.length ? p.bag.map(it => row(it, false)).join('') : '<div class="empty">Nothing carried yet. Weapons you pick up land here.</div>';
    $('bagCount').textContent = p.bag.length; $('bagCount').classList.toggle('zero', p.bag.length === 0);
  }
  function openBag() { if (S.mode !== 'game') return; S.paused = !S.coop; $('bagEyebrow').textContent = S.coop ? 'Co-op · not paused' : 'Paused'; renderBag(); $('bag').classList.remove('hidden'); $('btnBag').classList.remove('new'); input.touches.move = null; input.touches.pan = null; input.mouse.down = false; }
  function closeBag() { S.paused = false; $('bag').classList.add('hidden'); if (S.coop) renderBag(); }
  $('bagItems').addEventListener('click', (e) => { const eq = e.target.closest('[data-equip]'), sv = e.target.closest('[data-salvage]'); if (eq) equipFromBag(S.p.bag[+eq.dataset.equip]); else if (sv) salvageFromBag(S.p.bag[+sv.dataset.salvage]); });
  $('bagClose').addEventListener('click', closeBag);
  $('pkEquip').addEventListener('click', () => { if (pickupItem) equipFromBag(pickupItem); });
  $('pkLater').addEventListener('click', hidePickup);
  const affixText = (it) => it.affixes.length ? '· ' + it.affixes.map(a => `${a.name} +${Math.round(a.v * 100)}%`).join(', ') : '';

  function endRun(success, why) {
    if (S.mode !== 'game') return; S.mode = 'summary'; S.result = { success, why }; if (S.coop && S.isHost) net.final = 3; showSummary(success, why);
  }
  function showSummary(success, why) {
    S.paused = false; hidePickup(); $('bag').classList.add('hidden'); if (S.isClient) S.found = S.p.found.slice();
    if (!success) sfx('flat'); else sfx('pickup');
    const p = S.p; const mins = Math.floor(S.time / 60), secs = Math.floor(S.time % 60);
    $('sumEyebrow').textContent = (success ? 'Extracted' : 'Run over') + (S.players.length > 1 ? ` · ${mins}:${String(secs).padStart(2, '0')} · Wave ${S.wave}` : '');
    const squad = S.players.length > 1;
    $('sumTitle').textContent = squad ? (success ? `Squad extracted · ${S.players.filter(o => !o.dead && !o.down).length} of ${S.players.length} made it back` : 'The squad went down in Southside') : success ? `${p.d.name} made it back to the Terminal` : why === 'infection' ? `${p.d.name} turned. Infection hit 100%.` : `${p.d.name} went down in Southside`;
    $('sumBoard').classList.toggle('hidden', !squad); if (squad) renderBoard();
    $('sumGrid').innerHTML = [['Time', `${mins}:${String(secs).padStart(2, '0')}`], ['Kills', S.kills], ['Damage dealt', Math.round(S.dmgDealt).toLocaleString()], ['Wave', S.wave], ['Supplies', S.quest ? `${S.quest.done}/${S.quest.total}${S.quest.bonus ? ' · bonus' : ''}` : '—'], ['Gear found', `${S.found.length} · ${p.scrap} Scrap${S.chems ? ' · ' + S.chems + ' Chem' : ''}`], ['Best drop', S.found.length ? S.found.reduce((a, b) => (b.rar.gs > a.rar.gs ? b : a)).rar.name : '—']].map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join('');
    $('sumLoot').innerHTML = S.found.length ? S.found.map(it => `<span style="color:${it.rar.color}">${it.label}${it.kind === 'weapon' ? '' : ''} · iLvl ${it.ilvl}</span>`).join('') : '<span style="color:#9aa4b0">Nothing this run.</span>';
    setTimeout(() => show('summary'), success ? 600 : 1500);
  }
  // squad leaderboard: same data on every screen (host stats ride along in every snapshot)
  const fmtN = (n) => Math.round(n).toLocaleString();
  function renderBoard() {
    const rows = S.players.map(o => { const st = o.st || { k: 0, dmg: 0, taken: 0, heal: 0, rev: 0, downs: 0, q: 0 }; const found = o.foundN != null ? o.foundN : o.found.length; const scrap = o.scrapN != null ? o.scrapN : o.scrap; const score = st.k * 10 + st.dmg / 40 + st.heal / 30 + st.rev * 120 - st.downs * 30 + (st.q || 0) * 150; return { o, st, found, scrap, score }; }).sort((a, b) => b.score - a.score);
    const tot = rows.reduce((t, r) => ({ k: t.k + r.st.k, dmg: t.dmg + r.st.dmg, taken: t.taken + r.st.taken, heal: t.heal + r.st.heal, rev: t.rev + r.st.rev, downs: t.downs + r.st.downs, found: t.found + r.found, q: t.q + (r.st.q || 0) }), { k: 0, dmg: 0, taken: 0, heal: 0, rev: 0, downs: 0, found: 0, q: 0 });
    const cell = (v, best) => `<td class="${best ? 'best' : ''}">${v}</td>`;
    const max = (key) => Math.max(...rows.map(r => key(r)));
    $('sumBoard').innerHTML = `<h3>Squad leaderboard</h3><table class="board"><thead><tr>${[['Survivor', 'Survivor'], ['Kills', 'Kills'], ['Damage', 'Dmg'], ['Taken', 'Taken'], ['Healing', 'Heal'], ['Revives', 'Rev'], ['Downs', 'Down'], ['Supplies', 'Sup'], ['Gear', 'Gear']].map(([l, sh]) => `<th><span class="l">${l}</span><span class="s">${sh}</span></th>`).join('')}</tr></thead><tbody>` +
      rows.map((r, i) => `<tr class="${r.o === S.p ? 'me' : ''} ${r.o.dead ? 'dead' : ''}"><td class="who"><span class="w"><i style="background:${r.o.d.color}"></i><b>${r.o.d.name}</b><small>${r.o.name !== r.o.d.name ? '<em class="pn">' + r.o.name + ' · </em>' : ''}${i === 0 ? 'MVP' : r.o.dead ? 'lost' : r.o.down ? 'down' : ''}</small></span></td>` +
        cell(r.st.k, r.st.k > 0 && r.st.k === max(x => x.st.k)) + cell(fmtN(r.st.dmg), r.st.dmg > 0 && r.st.dmg === max(x => x.st.dmg)) + cell(fmtN(r.st.taken), false) + cell(fmtN(r.st.heal), r.st.heal > 0 && r.st.heal === max(x => x.st.heal)) + cell(r.st.rev, r.st.rev > 0 && r.st.rev === max(x => x.st.rev)) + cell(r.st.downs, false) + cell(r.st.q || 0, (r.st.q || 0) > 0 && (r.st.q || 0) === max(x => x.st.q || 0)) + cell(`${r.found}${r.scrap ? ' · ' + r.scrap + 's' : ''}`, false) + `</tr>`).join('') +
      `<tr class="tot"><td class="who"><b>Squad</b></td><td>${tot.k}</td><td>${fmtN(tot.dmg)}</td><td>${fmtN(tot.taken)}</td><td>${fmtN(tot.heal)}</td><td>${tot.rev}</td><td>${tot.downs}</td><td>${tot.q}</td><td>${tot.found}</td></tr></tbody></table>`;
  }

  /* ---------------- Update ---------------- */
  // which living survivor a Hollow goes for: taunt first, then the nearest one it can see
  function nearestTurret(z, range) { let best = null, bd = range; for (const t of S.turrets) { const d = dist(t.x, t.y, z.x, z.y); if (d < bd) { bd = d; best = t; } } return best; }
  function hitTurret(tr, dmg, z) {
    tr.hp -= dmg; S.fx.push({ kind: 'ring', x: tr.x, y: tr.y, t: 0, life: 0.25, r: 0.8, yellow: true }); sfx('hit', 0.5);
    if (tr.hp > 0) return;
    const i = S.turrets.indexOf(tr); if (i >= 0) S.turrets.splice(i, 1);
    blowTurret(tr, z);
  }
  // self-destruct: the junction box blows, hurting every Hollow within 3 m; a kill refunds half of the turret cooldown
  function blowTurret(tr, z) {
    const owner = bySid(tr.sid); atkP = owner;
    S.fx.push({ kind: 'flash', x: tr.x, y: tr.y, t: 0, life: 0.25, big: true }); S.fx.push({ kind: 'ring', x: tr.x, y: tr.y, t: 0, life: 0.5, r: 3, yellow: true }); S.fx.push({ kind: 'ring', x: tr.x, y: tr.y, t: 0, life: 0.7, r: 3, fire: true });
    for (let i = 0; i < 18; i++) S.fx.push({ kind: 'blood', spark: true, x: tr.x, y: tr.y, vx: rand(-4, 4), vy: rand(-4, 4), t: 0, life: rand(0.3, 0.7) });
    for (let i = 0; i < 6; i++) S.fx.push({ kind: 'flame', x: tr.x + rand(-0.6, 0.6), y: tr.y + rand(-0.6, 0.6), t: 0, life: rand(0.3, 0.6) });
    S.shake = Math.max(S.shake, 0.4); sfx('zap', 0.8); sfx('shot', 0.6); noiseAt(tr.x, tr.y, 20);
    let hit = 0, kills = 0;
    for (const o of S.zombies) { if (o.dead) continue; const d = dist(o.x, o.y, tr.x, tr.y); if (d > 3 + o.r) continue; hit++; damageZombie(o, 300, false, tr.x, tr.y, 0.9, true); if (!o.dead) { o.zapped = Math.max(o.zapped, 1.5); o.stag = Math.max(o.stag, 1); } else kills++; }
    if (owner && kills > 0) { const arr = multiCd(owner, 'd'); for (let k = 0; k < arr.length; k++) arr[k] *= 0.5; syncMultiCd(owner, 'd'); }
    if (owner) withPlayer(owner, () => toast(`<b>Turret destroyed</b> by a ${z ? z.d.name : 'Hollow'}. Self-destruct hit ${hit}${kills ? `, killed ${kills}. <b>Turret cooldown −50%.</b>` : '.'}`, kills ? '#f1c40f' : '#e74c3c'));
  }
  function targetFor(z) {
    if (z.taunted > 0 && z.tauntBy && !z.tauntBy.down && !z.tauntBy.dead) return z.tauntBy;
    let best = null, bd = 1e9;
    for (const p of S.players) { if (p.dead || p.down) continue; const d = dist(z.x, z.y, p.x, p.y) + (p.stealth > 0 ? 40 : 0); if (d < bd) { bd = d; best = p; } }
    return best;
  }
  function computeFieldMulti(sources, fld) {
    const field = fld || FIELD_MAIN; field.fill(-1); let qh = 0, qt = 0;
    for (const sp of sources) { const sx = clamp(Math.floor(sp.x), 0, GW - 1), sy = clamp(Math.floor(sp.y), 0, GH - 1); if (field[sy * GW + sx] < 0) { field[sy * GW + sx] = 0; queue[qt++] = sy * GW + sx; } }
    while (qh < qt) {
      const c = queue[qh++]; const cx = c % GW, cy = (c / GW) | 0; const d = field[c] + 1;
      if (cx > 0 && walk[c - 1] && field[c - 1] < 0) { field[c - 1] = d; queue[qt++] = c - 1; }
      if (cx < GW - 1 && walk[c + 1] && field[c + 1] < 0) { field[c + 1] = d; queue[qt++] = c + 1; }
      if (cy > 0 && walk[c - GW] && field[c - GW] < 0) { field[c - GW] = d; queue[qt++] = c - GW; }
      if (cy < GH - 1 && walk[c + GW] && field[c + GW] < 0) { field[c + GW] = d; queue[qt++] = c + GW; }
    }
  }
  function updatePlayer(p, dt) {
    if (p.dead) return;
    const inp = p.input; const st = stats(p); p.maxHp = st.maxHp; if (p.hp > p.maxHp) p.hp = p.maxHp;
    ['fireCd', 'reloading', 'invuln', 'dodgeT', 'stealth', 'shield', 'taunt', 'immune', 'hurtT', 'swing', 'cyclone', 'rageCd', 'fireT', 'digIn', 'breathe', 'cburn', 'boost', 'unchained', 'finale', 'slow', 'acidT', 'overT', 'deadAir', 'guard', 'gritLock'].forEach(k => { if (p[k] > 0) p[k] = Math.max(0, p[k] - dt); });
    if (p.id === 'buck' && p.grit > 0 && p.gritLock <= 0) { p.gritT -= dt; if (p.gritT <= 0) { p.grit = 0; } }
    if (p.id === 'savage' && p.rage <= 0 && p.rageM > 0 && S.time - p.lastCombat > 3) p.rageM = Math.max(0, p.rageM - 8 * dt);
    if (p.id === 'savage' && p.unchained > 0 && p.cd.d > 0) p.cd.d = Math.max(0, p.cd.d - dt);
    for (const k of ['s', 'd', 'u']) { if (KITS[p.id][k].multi) { const arr = multiCd(p, k); for (let i = 0; i < arr.length; i++) arr[i] = Math.max(0, arr[i] - dt); syncMultiCd(p, k); } else if (p.cd[k] > 0) p.cd[k] = Math.max(0, p.cd[k] - dt); }
    if (p.rage > 0) { p.rage -= dt; if (p.rage <= 0) { p.rage = 0; p.unchained = 0; p.rageCd = 8; p.rageM = 0; toast('Rage fades. Keep swinging to build it back.', '#c0392b'); } }
    const wolfMax = perk('ambulance') ? 3 : 2; if (p.id === 'wolf' && p.cd.s <= 0 && p.qCharges < wolfMax) { p.qCharges++; if (p.qCharges < wolfMax) p.cd.s = KITS.wolf.s.cd; }
    if (p.reloading === 0 && p.mag < st.base.mag && p.reserve > 0 && p._wasReloading) { const need = st.base.mag - p.mag, take = Math.min(need, p.reserve); p.mag += take; p.reserve -= take; }
    p._wasReloading = p.reloading > 0;
    if (p.dodgeRecharge > 0) { p.dodgeRecharge -= dt; if (p.dodgeRecharge <= 0 && p.dodges < p.d.dodges) { p.dodges++; if (p.dodges < p.d.dodges) p.dodgeRecharge = 4; } }
    p.triage = p.triage.map(t => t - dt).filter(t => t > 0);
    if (p.hotT > 0) { const h = Math.min(p.hot, p.hot / p.hotT * dt); const b4 = p.hp; p.hp = Math.min(p.maxHp, p.hp + h); if (p.hotBy && p.hotBy.st) p.hotBy.st.heal += p.hp - b4; p.hot -= h; p.hotT -= dt; if (p.hotT <= 0) p.hot = 0; }
    // sustain passives
    if (p.id === 'shadow' && p.stealth > 0) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.04 * dt);
    if (p.id === 'hush' && p.breathe > 0) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.04 * dt);
    if (p.id === 'torch' && p.cburn > 0 && S.fires.some(f => (f.sid == null || f.sid === p.sid) && dist(f.x, f.y, p.x, p.y) < f.r + p.r * 0.5)) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.05 * dt);
    // downed: bleed out, or get picked up by an ally standing still next to you
    if (p.down) {
      p.downT -= dt; p.moving = false; p.vx = p.vy = 0;
      if (p.downT <= 0) { p.dead = true; toast(`<b>${p.name}</b> bled out.`, '#bf2618'); if (!S.players.some(o => !o.down && !o.dead)) endRun(false, 'downed'); return; }
      const reviver = S.players.find(o => o !== p && !o.down && !o.dead && !o.moving && dist(o.x, o.y, p.x, p.y) <= 1.8);
      if (reviver) { p.reviveP += dt / (reviver.id === 'flight' && perk('ambulance') ? 1 : (p.rescueBoost ? 1.5 : 3) * (reviver.id === 'wolf' ? 0.5 : 1)); if (p.reviveP >= 1) revive(p, reviver); } else p.reviveP = Math.max(0, p.reviveP - dt * 0.5);
      return;
    }
    // movement (net clients own their own position; the host just reads it)
    let mx = inp.mx, my = inp.my; const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
    p.moving = ml > 0.1; p.hm = !!(p.ultChain || p.leap || p.rescue); const localMove = !(S.isHost && S.coop && p !== S.p) || p.hm;
    const speed = 4.2 * st.spd;
    if (p.ultChain) { // Lights Out: hop between targets
      p.ultT -= dt; p.moving = false;
      if (p.ultT <= 0) { const z = p.ultChain.shift(); if (z && !z.dead) { const d = dist(z.x, z.y, p.x, p.y) || 1; const nx = z.x - (z.x - p.x) / d * (z.r + p.r), ny = z.y - (z.y - p.y) / d * (z.r + p.r); const hx = p.x, hy = p.y; if (!solidAt(nx, ny, p.r)) { p.x = nx; p.y = ny; } S.fx.push({ kind: 'trail', x0: hx, y0: hy, x1: p.x, y1: p.y, t: 0, life: 0.35, col: '155,89,182' }); S.fx.push({ kind: 'ghost', x: hx, y: hy, r: p.r * PPM, t: 0, life: 0.35, col: '155,89,182' }); p.aim = angTo(p, z.x, z.y); p.forceCrit = true; p.hitMult = 1.5; hitZombie(z, p, meleeStats(p, st), 1, true, 0.5); p.hitMult = 1; p.forceCrit = false; p.swing = 0.14; p.swingDir = p.aim; sfx('melee'); S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.2, r: 1, purple: true }); } p.ultT = 0.14; if (!p.ultChain.length) { p.ultChain = null; p.stealth = 3; p.exposedHit = true; addCombo(p, 3); } }
    }
    else if (p.dodgeT > 0) { const sp = p.rescue ? 18 : p.leap ? 20 : 12; const tx0 = p.x, ty0 = p.y; if (localMove) moveEntity(p, p.ddx * sp * dt, p.ddy * sp * dt); if (S.isHost || !S.coop) { const col = p.trailCol || hexRgb(p.d.color); S.fx.push({ kind: 'ghost', x: tx0, y: ty0, r: p.r * PPM, t: 0, life: p.rescue || p.leap ? 0.35 : 0.2, col }); if (p.rescue || p.leap) S.fx.push({ kind: 'trail', x0: tx0, y0: ty0, x1: p.x, y1: p.y, t: 0, life: 0.3, col }); if (p.rescue) { for (const z of S.zombies) { if (z.dead) continue; const d = dist(z.x, z.y, p.x, p.y); if (d <= z.r + p.r + 0.3 && z.type !== 'brute') { const l = d || 1; const side = Math.sign((z.x - p.x) * p.ddy - (z.y - p.y) * p.ddx) || 1; z.kx += (-p.ddy * side) * 2.5 + (z.x - p.x) / l; z.ky += (p.ddx * side) * 2.5 + (z.y - p.y) / l; z.slow = Math.max(z.slow || 0, 2); z.stag = Math.max(z.stag, 0.4); } } if (!p.slipLast || dist(p.slipLast.x, p.slipLast.y, p.x, p.y) >= 1.4) { p.slipLast = { x: p.x, y: p.y }; S.zones.push({ kind: 'slip', x: p.x, y: p.y, r: 1.4, t: 4, max: 4, sid: p.sid }); } } } if (p.dodgeT - dt <= 0) p.trailCol = null; if (p.dodgeT - dt <= 0) { p.rescue = false; if (p.leap) { p.leap = false; S.shake = 0.35; S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.4, r: 3, crimson: true }); S.zombies.forEach(z => { const d = dist(z.x, z.y, p.x, p.y); if (d <= 3 + z.r && z.type !== 'brute') { const l = d || 1; z.kx += (z.x - p.x) / l * 2.5; z.ky += (z.y - p.y) / l * 2.5; z.stag = Math.max(z.stag, 0.6); } }); const al = p.leapAlly; if (al && !al.dead && dist(al.x, al.y, p.x, p.y) <= 3) { al.guard = 4; S.fx.push({ kind: 'ring', x: al.x, y: al.y, t: 0, life: 0.6, r: 1.6, crimson: true }); S.fx.push({ kind: 'num', x: al.x, y: al.y - 1.3, t: 0, life: 0.9, text: 'GUARDED', col: '192,57,43' }); withPlayer(al, () => toast(`<b>${p.name}</b> has your back: 30% less damage for 4 s.`, '#c0392b')); } p.leapAlly = null; } } }
    else if (localMove) moveEntity(p, mx * speed * dt, my * speed * dt);
    p.vx = mx * speed; p.vy = my * speed;
    if (p.id === 'flight') { if (p.boost > 0) p.mom = 100; else if (p.moving || p.dodgeT > 0) { p.stillT = 0; p.mom = Math.min(100, (p.mom || 0) + 30 * dt); } else { p.stillT += dt; if (p.stillT > 0.8) p.mom = Math.max(0, (p.mom || 0) - 25 * dt); } p.tailwind = false; }
    if (p.id === 'shadow' && p.comboT > 0) { p.comboT -= dt; if (p.comboT <= 0) p.combo = 0; }
    if (p.id === 'hush') { if (p.deadAir > 0) p.focus = 0.5; else if (p.focusT > 0) p.focusT -= dt; else p.focus = Math.max(0, p.focus - 0.25 * dt); }
    // aim: manual stick / mouse, else the move direction; Attack snaps to the nearest Hollow when nothing is aimed
    const lockZ = zById(inp.lock);
    if (lockZ) p.aim = angTo(p, lockZ.x, lockZ.y);
    else if (inp.aimActive) { const a = Math.atan2(inp.ay, inp.ax); if (Number.isFinite(a)) p.aim = a; }
    else if (p.moving) p.aim = Math.atan2(my, mx);
    if (inp.fire && !p.ultChain) {
      if (lockZ) { /* locked target: face it and fire, no auto-snap */ }
      else if (!inp.aimActive) { const z = nearestZombie(p, st.range + 1); if (z) p.aim = angTo(p, z.x, z.y); }
      else { let best = null, bs = -1; for (const z of S.zombies) { if (z.dead) continue; const d = dist(z.x, z.y, p.x, p.y); if (d > st.range + 1) continue; const a = angTo(p, z.x, z.y); const diff = angDiff(a, p.aim); const tol = st.base.type === 'melee' ? 1.7 : d < 2.5 ? 1.1 : 0.21; if (diff < tol) { const score = (1 - diff / tol) + (z.type === 'brute' ? 0.3 : 0) + (z.type === 'screamer' && !z.screamed ? 0.5 : 0) - d * 0.02; if (score > bs) { bs = score; best = a; } } } if (best != null) p.aim = best; }
      if (p.cyclone <= 0 && p.dodgeT <= 0) fireWeapon(p, st, dt);
    }
    if (inp.dodge) { inp.dodge = false; dodge(p, st); }
    if (inp.swap) { inp.swap = false; swapWeapon(p); }
    if (inp.ult) { inp.ult = false; castAbility(p, 'r', null); }
    while (inp.casts.length) { const c = inp.casts.shift(); castAbility(p, c.slot, c.aim); }
    // Blade Cyclone ticks
    if (p.cyclone > 0) { p.cycloneTick -= dt; if (p.cycloneTick <= 0) { p.cycloneTick = 0.33; const mst = meleeStats(p, st); let kills = 0; S.zombies.forEach(z => { if (!z.dead && dist(z.x, z.y, p.x, p.y) <= 3.5 + z.r) { const before = S.kills; hitZombie(z, p, mst, 0.7, false, 0.6); if (S.kills > before) kills++; if (!p.cycloneHit) { p.cycloneHit = true; addCombo(p, 1); } } }); p.cyclone = Math.min(p.cyclone + kills * 0.3, 2.5); S.fx.push({ kind: 'ring', x: p.x, y: p.y, t: 0, life: 0.3, r: 3.5 }); for (let i = 0; i < 4; i++) { const an = S.time * 14 + i * Math.PI / 2; S.fx.push({ kind: 'blood', spark: true, col: '195,155,211', x: p.x + Math.cos(an) * 3.2, y: p.y + Math.sin(an) * 3.2, vx: -Math.sin(an) * 5, vy: Math.cos(an) * 5, t: 0, life: 0.3 }); } sfx('melee'); } }
    // Savage: an ally in trouble triggers Rage
    if (p.id === 'savage' && p.rage <= 0 && p.rageCd <= 0 && S.players.some(o => o !== p && !o.dead && (o.down || o.hp / o.maxHp < 0.35) && dist(o.x, o.y, p.x, p.y) < 15)) startRage(p);
    // low health heartbeat (own screen only)
    if (p === S.p && p.hp / p.maxHp < 0.3) { S.lowBeep -= dt; if (S.lowBeep <= 0) { sfx('beep'); S.lowBeep = p.hp / p.maxHp < 0.15 ? 0.45 : 0.8; } }
  }
  function update(dt) {
    if (S.mode !== 'game' || S.paused) return;
    if (pickupItem) { pickupT -= dt; if (pickupT <= 0) hidePickup(); }
    S.time += dt;
    if (S.time >= RUN_SECONDS + 30) { endRun(false, 'downed'); return; }
    for (const p of S.players) { withPlayer(p, () => updatePlayer(p, dt)); if (S.mode !== 'game') return; }
    // turrets: nearest Hollow in range with line of sight, 4 shots a second
    for (let i = S.turrets.length - 1; i >= 0; i--) { const tr = S.turrets[i]; tr.t -= dt; if (tr.repT > 0) tr.repT -= dt; if (tr.t <= 0) { S.turrets.splice(i, 1); continue; } tr.cd -= dt; if (tr.cd > 0) continue; let best = null, bd = 1e9; for (const z of S.zombies) { if (z.dead) continue; const d = dist(z.x, z.y, tr.x, tr.y); if (d > tr.range) continue; const score = z.hp + d * 0.01 - (z.marked > 0 && perk('relay') ? 1e6 : 0); if (score >= bd) continue; const a = Math.atan2(z.y - tr.y, z.x - tr.x); let ok = true; for (let t = 0.5; t < d; t += 0.5) if (solidAt(tr.x + Math.cos(a) * t, tr.y + Math.sin(a) * t, 0)) { ok = false; break; } if (ok) { best = z; bd = score; } } /* lowest health first (Marked first with Targeting Relay), nearest breaks ties */ if (best && bySid(tr.sid) && bySid(tr.sid).overT > 0) { // Third Rail: a laser that pierces every Hollow in the line and sets them burning for 10 s
      tr.cd = 0.25; tr.aim = Math.atan2(best.y - tr.y, best.x - tr.x); atkP = bySid(tr.sid); const ca = Math.cos(tr.aim), sa = Math.sin(tr.aim); let len = tr.range; for (let t = 0.5; t < tr.range; t += 0.5) if (solidAt(tr.x + ca * t, tr.y + sa * t, 0)) { len = t; break; }
      const pierced = [];
      for (const z of S.zombies) { if (z.dead) continue; const rx = z.x - tr.x, ry = z.y - tr.y; const along = rx * ca + ry * sa; if (along < 0 || along > len + z.r) continue; const off = Math.abs(-rx * sa + ry * ca); if (off > z.r + 0.3) continue; pierced.push({ z, along }); damageZombie(z, tr.dps * 0.25 * (z.marked > 0 && perk('relay') ? 1.2 : 1), false, tr.x, tr.y, 0.05, false); if (!z.dead) burnZombie(z, 1, 10); const owner = bySid(tr.sid); if (owner) owner.adren = Math.min(ADREN_MAX, owner.adren + tr.dps * 0.25 / 25); }
      S.fx.push({ kind: 'laser', x0: tr.x + ca * 0.5, y0: tr.y + sa * 0.5, x1: tr.x + ca * len, y1: tr.y + sa * len, t: 0, life: 0.3 });
      // pierce feedback: an impact burst where the beam enters each Hollow (brighter the deeper it is in the line), exit sparks, and a PIERCE ×N tag past the last one
      pierced.sort((p1, p2) => p1.along - p2.along);
      pierced.forEach((h, i) => { const ex = tr.x + ca * (h.along - h.z.r * 0.6), ey = tr.y + sa * (h.along - h.z.r * 0.6); S.fx.push({ kind: 'pierce', x: ex, y: ey, ang: tr.aim, n: i + 1, t: 0, life: 0.3 }); if (i > 0 || pierced.length > 1) for (let k = 0; k < 3; k++) S.fx.push({ kind: 'blood', spark: true, cyan: true, x: h.z.x + ca * h.z.r * 0.7, y: h.z.y + sa * h.z.r * 0.7, vx: ca * rand(2, 4) + rand(-1.2, 1.2), vy: sa * rand(2, 4) + rand(-1.2, 1.2), t: 0, life: rand(0.2, 0.4) }); });
      tr.pierceT = (tr.pierceT || 0) - 0.25; if (pierced.length >= 2 && tr.pierceT <= 0) { tr.pierceT = 0.6; const last = pierced[pierced.length - 1]; S.fx.push({ kind: 'num', x: tr.x + ca * (last.along + last.z.r + 0.4), y: tr.y + sa * (last.along + last.z.r + 0.4) - 0.6, t: 0, life: 0.9, text: `PIERCE ×${pierced.length}`, cyan: true }); } if (Math.random() < 0.35) sfx('zap', 0.25); noiseAt(tr.x, tr.y, 10);
    } else if (best) { const buck = byId('buck'); tr.cd = perk('hardpoint') && buck && buck.digIn > 0 && dist(buck.x, buck.y, tr.x, tr.y) <= 3 ? 0.2 : 0.25; tr.aim = Math.atan2(best.y - tr.y, best.x - tr.x); atkP = bySid(tr.sid); damageZombie(best, tr.dps * 0.25 * (best.marked > 0 && perk('relay') ? 1.2 : 1), false, tr.x, tr.y, 0.1, false); if (perk('backlight') && S.fires.some(f => dist(f.x, f.y, tr.x, tr.y) < f.r + 0.3) && Math.random() < 0.5) burnZombie(best, 1); const owner = S.players.find(o => o.sid === tr.sid); if (owner) owner.adren = Math.min(ADREN_MAX, owner.adren + tr.dps * 0.25 / 25); S.fx.push({ kind: 'tracer', x0: tr.x + Math.cos(tr.aim) * 0.5, y0: tr.y + Math.sin(tr.aim) * 0.5, x1: best.x, y1: best.y, t: 0, life: 0.06 }); if (Math.random() < 0.3) sfx('silenced', 0.5); noiseAt(tr.x, tr.y, 8); } }
    // arc mines
    for (let i = S.mines.length - 1; i >= 0; i--) { const m = S.mines[i]; m.t -= dt; if (m.arm > 0) m.arm -= dt; if (m.t <= 0) { S.mines.splice(i, 1); continue; } if (m.arm > 0) continue; if (S.zombies.some(z => !z.dead && dist(z.x, z.y, m.x, m.y) <= 1.6 + z.r)) { S.mines.splice(i, 1); S.fx.push({ kind: 'ring', x: m.x, y: m.y, t: 0, life: 0.5, r: 3, yellow: true }); S.shake = Math.max(S.shake, 0.25); sfx('zap'); S.zombies.forEach(z => { if (!z.dead && dist(z.x, z.y, m.x, m.y) <= 3 + z.r) { z.stag = Math.max(z.stag, z.type === 'brute' ? 1 : 2); z.zapped = 2; z.aware = true; } }); } }
    // thrown things in the air: molotovs, flares, antiviral clouds
    for (let i = S.throws.length - 1; i >= 0; i--) { const th = S.throws[i]; th.t += dt; if (th.t < th.life) continue; S.throws.splice(i, 1); const owner = S.players.find(o => o.sid === th.sid) || S.p;
      if (th.kind === 'molotov') { S.fires.push({ x: th.tx, y: th.ty, r: 2, t: 5, max: 5, sid: th.sid }); S.fx.push({ kind: 'ring', x: th.tx, y: th.ty, t: 0, life: 0.35, r: 2.2, fire: true }); sfx('fire'); noiseAt(th.tx, th.ty, 15); const dmg = owner.d.dmg * 2.0 * (1 + stats(owner).dmgPct); S.zombies.forEach(z => { if (!z.dead && dist(z.x, z.y, th.tx, th.ty) <= 2 + z.r) { burnZombie(z, 3); damageZombie(z, dmg, false, th.tx, th.ty, 0.8, false); owner.adren = Math.min(ADREN_MAX, owner.adren + dmg / 25); } }); }
      else if (th.kind === 'flare') dropFlare(th.tx, th.ty);
      else if (th.kind === 'cloud') { S.zones.push({ kind: 'cure', x: th.tx, y: th.ty, r: 3, t: 4, max: 4, sid: th.sid }); sfx('acid', 0.4); }
    }
    // zones: antiviral cloud, Code Blue, Third Rail ring
    for (let i = S.zones.length - 1; i >= 0; i--) { const zn = S.zones[i]; zn.t -= dt; if (zn.t <= 0) { S.zones.splice(i, 1); continue; } const owner = S.players.find(o => o.sid === zn.sid);
      if (zn.kind === 'cure') for (const o of S.players) { if (!o.dead && dist(o.x, o.y, zn.x, zn.y) <= zn.r) { if (o.inf > 0 && owner && owner !== o) withPlayer(o, () => toast(`<b>${owner.name}</b> cured your Infection.`, '#2ecc71')); o.inf = 0; o.immune = Math.max(o.immune, 8); if (perk('burnward') && !o.down && S.fires.some(f => f.sid != null && dist(f.x, f.y, o.x, o.y) < f.r + 0.5)) heal(o, o.maxHp * 0.05 * dt, owner); } }
      if (zn.kind === 'heal') for (const o of S.players) { if (o.dead || dist(o.x, o.y, zn.x, zn.y) > zn.r) continue; if (o.down) revive(o, owner || o); heal(o, o.maxHp * 0.08 * dt, owner); o.inf = 0; }
      if (zn.kind === 'ring') for (const z of S.zombies) { if (z.dead) continue; const d = dist(z.x, z.y, zn.x, zn.y); if (Math.abs(d - zn.r) < 0.6 + z.r * 0.5 && z.zapped <= 0) { z.stag = Math.max(z.stag, z.type === 'brute' ? 0.8 : 1.5); z.zapped = 1.5; z.aware = true; S.fx.push({ kind: 'ring', x: z.x, y: z.y, t: 0, life: 0.25, r: 0.8, yellow: true }); if (Math.random() < 0.5) sfx('zap', 0.4); } }
    }
    S.barricades = S.barricades.filter(b => (b.t -= dt) > 0);
    // fire pools: burn Hollows standing in them, hurt anyone but Torch
    for (let i = S.fires.length - 1; i >= 0; i--) { const f = S.fires[i]; f.t -= dt; if (f.t <= 0) { S.fires.splice(i, 1); continue; } for (const p of S.players) { if (!p.dead && !p.down && p.id !== 'torch' && p.invuln <= 0 && dist(f.x, f.y, p.x, p.y) < f.r + p.r * 0.5) { p.hp -= 15 * dt * (1 - stats(p).dr); p.hurtT = 0.2; if (p.hp <= 0) playerDown(p, 'downed'); } } f.tick = (f.tick || 0) - dt; const doTick = f.tick <= 0; if (doTick) f.tick = 0.5; for (const z of S.zombies) { if (z.dead) continue; if (dist(z.x, z.y, f.x, f.y) <= f.r + z.r) { atkP = bySid(f.sid); if (doTick) burnZombie(z, 1); z.hp -= 10 * dt; S.dmgDealt += 10 * dt; z.aware = true; creditDmg(atkP, 10 * dt); if (atkP) z.lastBy = atkP; if (z.hp <= 0) killZombie(z); } } if (Math.random() < dt * 6) S.fx.push({ kind: 'flame', x: f.x + rand(-f.r, f.r) * 0.8, y: f.y + rand(-f.r, f.r) * 0.6, vx: rand(-0.5, 0.5), vy: rand(-2.5, -1), t: 0, life: rand(0.3, 0.6) }); }
    if (S.mode !== 'game') return;
    // flares, acid in flight, acid pools
    S.flares = S.flares.filter(f => (f.t -= dt) > 0);
    for (let i = S.spits.length - 1; i >= 0; i--) { const sp = S.spits[i]; sp.t += dt; if (sp.t >= sp.life) { S.pools.push({ x: sp.tx, y: sp.ty, r: sp.r, t: sp.poolT, max: sp.poolT, d: sp.d }); S.spits.splice(i, 1); sfx('acid'); } }
    for (let i = S.pools.length - 1; i >= 0; i--) { const po = S.pools[i]; po.t -= dt; if (po.t <= 0) { S.pools.splice(i, 1); continue; } for (const p of S.players) { if (p.dead || p.down || p.invuln > 0 || dist(po.x, po.y, p.x, p.y) >= po.r + p.r * 0.5) continue; const st = stats(p); const hd = HOLLOWS.spitter; p.hp -= hd.acidDps * dt * (1 - st.dr); if (p.immune <= 0) p.inf = Math.min(1, p.inf + hd.acidInf * dt * (1 - st.infres)); p.acidT = 0.4; if (p.hp <= 0 || p.inf >= 1) playerDown(p, p.inf >= 1 ? 'infection' : 'downed'); } }
    if (S.mode !== 'game') return;
    // flow field from every living survivor
    S.fieldTimer -= dt; if (S.fieldTimer <= 0) { const src = alivePlayers(); computeFieldMulti(src.length ? src : S.players); if (S.flares.length) computeField(S.flares[S.flares.length - 1].x, S.flares[S.flares.length - 1].y, flareField); S.fieldTimer = 0.25; }
    // zombies
    for (const z of S.zombies) {
      if (z.dead) continue;
      if (z.hurt > 0) z.hurt -= dt; if (z.stag > 0) z.stag -= dt; if (z.exposed > 0) z.exposed -= dt; if (z.taunted > 0) z.taunted -= dt; if (z.marked > 0) z.marked -= dt; if (z.zapped > 0) z.zapped -= dt; if (z.pinned > 0) z.pinned -= dt; if (z.slow > 0) z.slow -= dt;
      tickBurn(z, dt); if (z.dead) continue;
      // notice: each survivor separately (Shadow is harder to spot)
      for (const p of S.players) { if (p.dead || p.down) continue; const d = dist(z.x, z.y, p.x, p.y); if (!z.aware && p.stealth <= 0 && d < z.d.notice * (p.id === 'shadow' ? 0.5 : 1) * (p.moving ? 1 : 0.7)) z.aware = true; }
      const p = targetFor(z); const d = p ? dist(z.x, z.y, p.x, p.y) : 99;
      if (p && p.stealth > 0 && z.aware && d > 2 && !alivePlayers().some(o => o.stealth <= 0)) z.aware = Math.random() < 0.985; // they lose him
      // knockback decay
      if (Math.abs(z.kx) > 0.01 || Math.abs(z.ky) > 0.01) { moveEntity(z, z.kx * dt * 6, z.ky * dt * 6); z.kx *= 0.8; z.ky *= 0.8; }
      if (z.stag > 0) continue;
      let vx = 0, vy = 0;
      if (z.flare && (z.flare.t <= 0 || !S.flares.includes(z.flare))) z.flare = null;
      if (z.flare) {
        const fd = dist(z.x, z.y, z.flare.x, z.flare.y);
        if (fd > 1.2) { const f = fd < 3 ? { x: (z.flare.x - z.x) / fd, y: (z.flare.y - z.y) / fd } : (flowDir(z.x, z.y, flareField) || { x: (z.flare.x - z.x) / fd, y: (z.flare.y - z.y) / fd }); vx = f.x; vy = f.y; }
        else { vx = Math.cos(S.time * 2 + z.wander || 0) * 0.3; vy = Math.sin(S.time * 2 + z.wander || 0) * 0.3; }
      } else if (z.aware && p && z.type === 'screamer' && !z.screamed) {
        if (z.screamT == null) { z.screamT = z.d.screamWindup; sfx('screamWind'); }
        z.screamT -= dt; z.face = Math.atan2(p.y - z.y, p.x - z.x);
        if (z.screamT <= 0) scream(z);
      } else if (z.aware && p && z.type === 'spitter') {
        z.face = Math.atan2(p.y - z.y, p.x - z.x);
        if (d > z.d.attackRange) { const f = flowDir(z.x, z.y) || { x: (p.x - z.x) / d, y: (p.y - z.y) / d }; vx = f.x; vy = f.y; }
        else if (d < z.d.keepAway) { vx = (z.x - p.x) / d; vy = (z.y - p.y) / d; }
        if (d <= z.d.attackRange + 1) { z.atk -= dt; if (z.atk <= 0) { z.atk = 1 / z.d.attackRate; z.spitWind = 0.45; } }
        if (z.spitWind != null) { z.spitWind -= dt; if (z.spitWind <= 0) { z.spitWind = null; const lead = 0.5; const tx = clamp(p.x + p.vx * lead + rand(-0.6, 0.6), 1, MAP.w - 1), ty = clamp(p.y + p.vy * lead + rand(-0.6, 0.6), 1, MAP.h - 1); const fl = dist(z.x, z.y, tx, ty) / 11; S.spits.push({ x: z.x, y: z.y, tx, ty, t: 0, life: Math.max(0.35, fl), r: z.d.poolR, poolT: z.d.poolT, d: z.d }); sfx('spit'); } }
      } else if (z.type === 'brute' && (z.tt = nearestTurret(z, z.aware ? 6 : 3)) && (!p || !z.aware || dist(z.x, z.y, z.tt.x, z.tt.y) < d)) {
        // Brutes smash turrets: closer turret beats the survivor
        const tt = z.tt, td = dist(z.x, z.y, tt.x, tt.y); z.face = Math.atan2(tt.y - z.y, tt.x - z.x);
        if (td > z.d.attackRange + 0.5) { vx = (tt.x - z.x) / td; vy = (tt.y - z.y) / td; }
        else { z.atk -= dt; if (z.atk <= 0) { z.atk = 1 / z.d.attackRate; z.windup = 0.25; z.windT = tt; } }
        if (z.windup != null) { z.windup -= dt; if (z.windup <= 0) { z.windup = null; const w = z.windT || tt; if (S.turrets.includes(w) && dist(z.x, z.y, w.x, w.y) <= z.d.attackRange + 0.9) hitTurret(w, Math.round(z.d.dmg * 1.5), z); z.windT = null; } }
      } else if (z.aware && p) {
        if (d > z.d.attackRange + p.r) {
          const f = (d < 3) ? { x: (p.x - z.x) / d, y: (p.y - z.y) / d } : (flowDir(z.x, z.y) || { x: (p.x - z.x) / d, y: (p.y - z.y) / d });
          vx = f.x; vy = f.y;
        } else {
          z.atk -= dt; if (z.atk <= 0) { z.atk = 1 / z.d.attackRate; z.windup = 0.25; }
        }
        if (z.windup != null) { z.windup -= dt; if (z.windup <= 0) { z.windup = null; if (dist(z.x, z.y, p.x, p.y) <= z.d.attackRange + p.r + 0.3) playerHit(z, z.d.dmg, p); } }
      } else {
        z.wt -= dt; if (z.wt <= 0) { z.wt = rand(1, 3); z.wander = Math.random() < 0.4 ? null : rand(0, Math.PI * 2); }
        if (z.wander != null) { vx = Math.cos(z.wander) * 0.3; vy = Math.sin(z.wander) * 0.3; }
      }
      // separation
      let sx = 0, sy = 0; for (const o of S.zombies) { if (o === z || o.dead) continue; const dd = dist(o.x, o.y, z.x, z.y); const min = z.r + o.r; if (dd < min && dd > 0.001) { sx += (z.x - o.x) / dd * (min - dd); sy += (z.y - o.y) / dd * (min - dd); } }
      vx += sx * 2; vy += sy * 2;
      // fire break: regular Hollows won't step into a wall of fire; Brutes push through. Barricades stop everyone.
      if (z.type !== 'brute' && S.fires.length) { for (const f of S.fires) { if (!f.wall) continue; const nx = z.x + vx * 0.4, ny = z.y + vy * 0.4; const dd = dist(nx, ny, f.x, f.y); if (dd < f.r + z.r + 0.2) { const away = dist(z.x, z.y, f.x, f.y) || 1; vx = (z.x - f.x) / away * 0.5; vy = (z.y - f.y) / away * 0.5; break; } } }
      for (const b of S.barricades) { const nx = z.x + vx * 0.4, ny = z.y + vy * 0.4; const dd = dist(nx, ny, b.x, b.y); if (dd < b.r + z.r + 0.15) { const away = dist(z.x, z.y, b.x, b.y) || 1; vx = (z.x - b.x) / away * 0.4; vy = (z.y - b.y) / away * 0.4; break; } }
      const l = Math.hypot(vx, vy); if (l > 0) { const sp = z.d.spd * (z.aware ? 1 : 0.6) * (z.slow > 0 ? 0.5 : 1); moveEntity(z, vx / l * Math.min(l, 1) * sp * dt, vy / l * Math.min(l, 1) * sp * dt); z.face = Math.atan2(vy, vx); }
      // keep out of survivors and barricades
      for (const o of S.players) { if (o.dead) continue; const dz = dist(z.x, z.y, o.x, o.y); const minD = z.r + o.r; if (dz < minD && dz > 0.001) { const push = (minD - dz); z.x += (z.x - o.x) / dz * push; z.y += (z.y - o.y) / dz * push; } }
      for (const b of S.barricades) { const dz = dist(z.x, z.y, b.x, b.y); const minD = z.r + b.r; if (dz < minD && dz > 0.001) { const push = (minD - dz); z.x += (z.x - b.x) / dz * push; z.y += (z.y - b.y) / dz * push; } }
    }
    if (S.mode !== 'game') return;
    S.zombies = S.zombies.filter(z => !z.dead);
    // loot pickup: each survivor grabs what's near them
    questTick(dt);
    for (let i = S.loot.length - 1; i >= 0; i--) { const l = S.loot[i]; l.t += dt; let taker = null, bd = 1e9; for (const p of S.players) { if (p.dead || p.down) continue; const d = dist(l.x, l.y, p.x, p.y); const reach = p.id === 'flight' ? 4.4 : 2.2; if (d < reach && d < bd) { bd = d; taker = p; } } if (taker) { l.x = lerp(l.x, taker.x, 8 * dt); l.y = lerp(l.y, taker.y, 8 * dt); if (bd < 0.6) { withPlayer(taker, () => equipLoot(l, taker)); S.loot.splice(i, 1); } } }
    // extraction: everyone still standing has to be in the circle
    if (S.extractOpen) { const alive = alivePlayers(); if (alive.length && alive.every(p => dist(p.x, p.y, MAP.extract.x, MAP.extract.y) < 2.5)) { endRun(true, 'extracted'); return; } }
    spawnLogic(dt);
    // fx
    for (const f of S.fx) { f.t += dt; if (f.kind === 'flame' && f.vx) { f.x += f.vx * dt; f.y += f.vy * dt; } if (f.kind === 'blood') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.9; f.vy *= 0.9; } else if (f.kind === 'flame') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.93; f.vy *= 0.93; } }
    S.fx = netArr('fx', S.fx.filter(f => f.t < f.life));
    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 2);
    if (objT > 0) { objT -= dt; if (objT <= 0) $('objective').classList.remove('show'); }
    // camera + HUD follow our own survivor
    const me = S.p; cam.x = lerp(cam.x, me.x + input.camOff.x, 8 * dt); cam.y = lerp(cam.y, me.y + input.camOff.y, 8 * dt);
    updateHUD(me, stats(me));
  }

  /* ---------------- HUD ---------------- */
  const KIND_TAG = { instant: 'tap', aimed: 'aim', target: 'target', ally: 'ally', throw: 'throw', place: 'place' };
  function setupWheel(p) {
    const K = KITS[p.id];
    for (const slot of ['s', 'd', 'u']) { $('lbl' + slot.toUpperCase()).textContent = K[slot].name; $('tag' + slot.toUpperCase()).textContent = KIND_TAG[K[slot].kind]; }
    $('lblR').textContent = K.r.name; $('btnR').style.setProperty('--c', p.d.color); $('wheel').style.setProperty('--c', p.d.color);
  }
  const SPECIAL_GLYPH = { brute: 'B', screamer: 'S', spitter: 'P' };
  // minimap: the city once, then live dots
  const mmBase = document.createElement('canvas'); mmBase.width = 150; mmBase.height = 112; const MMS = 150 / MAP.w;
  function buildMinimap() { const c = mmBase.getContext('2d'); c.clearRect(0, 0, 150, 112); c.fillStyle = '#1c242c'; c.fillRect(0, 0, 150, 112); c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 1; for (let x = 0; x <= 150; x += MMS * 8) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 112); c.stroke(); } for (let y = 0; y <= 112; y += MMS * 8) { c.beginPath(); c.moveTo(0, y); c.lineTo(150, y); c.stroke(); } for (const b of MAP.blocks) { c.fillStyle = b.car ? '#3b444f' : '#55362c'; c.fillRect(b.x * MMS, b.y * MMS, Math.max(1, b.w * MMS), Math.max(1, b.h * MMS)); } for (const L of MAP.lights) { c.fillStyle = 'rgba(230,126,34,0.35)'; c.fillRect(L.x * MMS - 0.5, L.y * MMS - 0.5, 1.5, 1.5); } }
  function drawMinimap(p) {
    const mc = $('minimap').getContext('2d'); mc.clearRect(0, 0, 150, 112); mc.drawImage(mmBase, 0, 0);
    if (S.quest) for (const q of S.quest.items) { if (q.got) continue; const d = questDef(q); mc.fillStyle = d.hex; mc.save(); mc.translate(q.x * MMS, q.y * MMS); mc.rotate(Math.PI / 4); const s = 2.6 + Math.sin(S.time * 4); mc.fillRect(-s, -s, s * 2, s * 2); mc.restore(); }
    const ex = MAP.extract.x * MMS, ey = MAP.extract.y * MMS; mc.strokeStyle = S.extractOpen ? '#2ecc71' : 'rgba(46,204,113,0.5)'; mc.lineWidth = 1.5; mc.beginPath(); mc.arc(ex, ey, 4 + (S.extractOpen ? Math.sin(S.time * 4) * 1.5 : 0), 0, Math.PI * 2); mc.stroke();
    for (const z of S.zombies) { if (z.dead) continue; mc.fillStyle = z.type === 'brute' ? '#e67e22' : z.type === 'walker' ? 'rgba(191,38,24,0.8)' : '#e74c3c'; const r = z.type === 'brute' ? 2.4 : 1.4; mc.beginPath(); mc.arc(z.x * MMS, z.y * MMS, r, 0, Math.PI * 2); mc.fill(); }
    for (const o of S.players) { if (o.dead) continue; mc.fillStyle = o.d.color; mc.beginPath(); mc.arc(o.x * MMS, o.y * MMS, o === p ? 3.2 : 2.6, 0, Math.PI * 2); mc.fill(); if (o === p || o.down) { mc.strokeStyle = o.down ? '#bf2618' : '#fff'; mc.lineWidth = 1.2; mc.stroke(); } }
    mc.strokeStyle = 'rgba(232,230,225,0.35)'; mc.lineWidth = 1; mc.strokeRect((cam.x - W / 2 / PPM) * MMS, (cam.y - H / 2 / PPM) * MMS, W / PPM * MMS, H / PPM * MMS);
  }
  // Wild Rift wheel geometry: Attack in the corner, Special/Unlock hugging it, the three skills on an arc, Ult and Dodge on the outer ring, Cancel (while aiming) at the top of the cluster
  const WHEEL = { desk: { atk: 124, ab: 82, ult: 68, dodge: 76, small: 50, gap: 10 }, phone: { atk: 108, ab: 72, ult: 60, dodge: 66, small: 44, gap: 10 } };
  function layoutWheel() {
    const phone = W <= 640 || H <= 460; const portrait = W <= 640 && H > 460; const g = phone ? WHEEL.phone : WHEEL.desk; const c = g.atk / 2; const D = Math.PI / 180;
    const R1 = c + g.gap + g.small / 2, R2 = R1 + g.small / 2 + g.gap + g.ab / 2, R3 = R2 + g.ab / 2 + g.gap;
    const put = (id, size, ang, rad) => { const b = $(id); const x = c + Math.cos(ang) * rad, y = c + Math.sin(ang) * rad; b.style.width = b.style.height = size + 'px'; b.style.right = (x - size / 2) + 'px'; b.style.bottom = (y - size / 2) + 'px'; };
    put('btnAttack', g.atk, 0, 0); put('btnSpecial', g.small, 75 * D, R1);
    put('btnS', g.ab, 0, R2); put('btnD', g.ab, 45 * D, R2); put('btnU', g.ab, 90 * D, R2);
    put('btnR', g.ult, 90 * D, R3 + g.ult / 2); put('btnDodge', g.dodge, 0, R3 + g.dodge / 2); put('btnCancel', g.small, 58 * D, R3 + g.small / 2 + 4);
    const wW = Math.ceil(c + R3 + g.dodge + 2), wH = Math.ceil(c + R3 + g.ult + 2); const wh = $('wheel'); wh.style.width = wW + 'px'; wh.style.height = wH + 'px';
    const sc = portrait ? 0.82 : 1; $('items').style.right = `calc(${Math.round(wW * sc + 14)}px + ${phone ? 22 : 28}px + env(safe-area-inset-right, 0px))`;
    document.documentElement.style.setProperty('--wheel-w', Math.round(wW * sc) + 'px');
  }
  window.addEventListener('resize', () => { if ($('wheel')) layoutWheel(); });
  function updateHUD(p, st) {
    $('hudHP').textContent = `${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`; $('meCard').classList.toggle('hurt', p.hp / p.maxHp < 0.3);
    $('dodgeCount').textContent = p.dodges; $('dodgeCount').classList.toggle('zero', p.dodges <= 0);
    // Wild Rift priority target: the Hollow a plain Attack tap will hit (closest), shown with a gold ring unless something is locked
    if (p === S.p) { if (input.lock != null) input.prio = null; else { const z = nearestZombie(p, Math.max(st.range + 1, 7)); input.prio = z ? z.id : null; } }
    const left = Math.max(0, RUN_SECONDS - S.time); $('hudTime').textContent = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`;
    $('hudWave').textContent = S.wave; $('hudKills').textContent = S.kills;
    const w = p.weapons[p.slot]; $('wName').textContent = p.finale > 0 ? 'GRAND FINALE' : w.name; $('wRarity').textContent = w.rar.name; $('wRarity').className = 'rar ' + w.rar.id;
    $('wAmmo').textContent = p.finale > 0 ? `${Math.ceil(p.finale)} s of fire` : st.base.type === 'melee' ? 'Melee · silent' : p.reloading > 0 ? 'Reloading…' : `${p.mag} / ${p.reserve}`;
    $('wSwap').textContent = isTouch ? 'tap · swap' : 'F · swap'; $('wReload').style.width = (p.reloading > 0 && p.reloadTotal ? (1 - p.reloading / p.reloadTotal) * 100 : 0) + '%';
    const setCd = (id, cd, max, active, ready) => { const b = $(id); b.querySelector('.cd').style.height = (cd > 0 ? cd / max * 100 : 0) + '%'; const n = b.querySelector('.cdn'); if (n) { n.textContent = cd > 0.05 ? (cd >= 10 ? String(Math.ceil(cd)) : cd.toFixed(1)) : ''; b.classList.toggle('oncd', cd > 0.05); } b.classList.toggle('active', !!active); b.classList.toggle('ready', !!ready && cd <= 0); };
    const K = KITS[p.id];
    const activeS = p.stealth > 0 || p.digIn > 0 || p.hotT > 0 || p.breathe > 0 || p.cburn > 0 || (p.id === 'flight' && p.rescue);
    if (p.id === 'savage') $('btnD').classList.toggle('ready', p.rage > 0 || p.cd.d <= 0);
    setCd('btnS', K.s.charges && p.qCharges > 0 ? 0 : p.cd.s, K.s.cd, activeS, true);
    setCd('btnD', K.d.multi && chargesLeft(p, 'd') > 0 ? 0 : p.cd.d, K.d.cd, false, true);
    setCd('btnU', K.u.multi && chargesLeft(p, 'u') > 0 ? 0 : p.cd.u, K.u.cd, p.cyclone > 0 || p.taunt > 0, true);
    setCd('btnDodge', p.dodges > 0 ? 0 : p.dodgeRecharge, 4, p.dodgeT > 0, p.dodges > 0);
    const ult = $('btnR'); const k = clamp(p.adren / ADREN_MAX, 0, 1); ult.style.setProperty('--p', (k * 100) + '%'); ult.classList.toggle('ready', k >= 1); ult.classList.toggle('active', p.ultChain != null || p.unchained > 0 || p.deadAir > 0 || p.finale > 0 || p.boost > 0);
    $('lblS').textContent = p.id === 'wolf' ? `Field Dressing ×${p.qCharges}` : K.s.name;
    $('lblD').textContent = p.id === 'fuse' ? `Turret ×${chargesLeft(p, 'd')}` : K.d.name;
    $('lblU').textContent = p.id === 'fuse' ? `Arc Mine ×${chargesLeft(p, 'u')}` : K.u.name;
    if (p.id === 'hush') $('lblD').textContent = p.focus > 0.01 ? `Headshot · ${Math.round(p.focus * 100)}%` : 'Headshot';
    if (p.id === 'shadow') $('lblD').textContent = p.combo >= 3 ? 'Finisher' : p.combo > 0 ? `Execute ×${p.combo}` : 'Execute';
    if (p.id === 'savage') $('lblD').textContent = p.rage > 0 ? `RAGE ${Math.ceil(p.rage)} s` : `Pound · Rage ${Math.round(p.rageM || 0)}`;
    if (p.id === 'flight') { const mom = p.boost > 0 ? 100 : (p.mom || 0); $('lblD').textContent = `Fast Break ×${3 + Math.floor(mom / 25)}${mom >= 75 ? ' ⚡' : ''}`; }
    if (p.id === 'buck') $('lblD').textContent = p.grit > 0 ? `Breach · Grit ×${p.grit}` : 'Breaching Shot';
    $('lblR').textContent = k >= 1 ? K.r.name : `${Math.round(k * 100)}%`;
    // squad list (co-op)
    const sq = $('squad'); const allies = S.players.filter(o => o !== p); if (allies.length) { sq.classList.remove('hidden'); const key = allies.map(o => `${o.sid}${o.id}${Math.round(o.hp / o.maxHp * 50)}${o.down ? 'd' : ''}${o.dead ? 'x' : ''}`).join('|'); if (sq.dataset.key !== key) { sq.dataset.key = key; sq.innerHTML = allies.map(o => `<div class="pm ${o.down ? 'down' : ''} ${o.dead ? 'dead' : ''} ${o.hp / o.maxHp < 0.3 ? 'hurt' : ''}" style="--c:${o.d.color}"><img src="./assets/${o.id}-sm.jpg" alt=""><div class="pm-r"><span>${o.d.name}</span><div class="bar hp"><div style="width:${clamp(o.hp / o.maxHp * 100, 0, 100)}%"></div></div></div></div>`).join(''); } } else sq.classList.add('hidden');
    drawMinimap(p);
    const v = $('vignette'); if (p.hurtT > 0) { v.className = 'vignette hurt'; v.style.opacity = 1; } else if (p.acidT > 0) { v.className = 'vignette acid'; v.style.opacity = 1; } else if (p.inf >= 0.75) { v.className = 'vignette'; v.style.opacity = 1; } else if (p.inf >= 0.5) { v.className = 'vignette'; v.style.opacity = 0.45; } else v.style.opacity = 0;
  }

  /* ---------------- Render ---------------- */
  function resize() { DPR = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight; canvas.width = W * DPR; canvas.height = H * DPR; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; PPM = clamp(Math.min(W, H) / 17, 22, 44); }
  window.addEventListener('resize', resize); resize();
  const toScreen = (x, y) => [(x - cam.x) * PPM + W / 2, (y - cam.y) * PPM + H / 2];
  function drawPlayer(p, me) {
    const [px, py] = toScreen(p.x, p.y); const r = p.r * PPM;
    if (p.dead) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(px, py, r * 1.3, r * 0.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6b6f75'; ctx.font = `700 ${Math.max(10, PPM * 0.3)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(p.name, px, py - r - 8); return; }
    if (p.down) { // lying down, with the revive ring filling up
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(px, py + r * 0.3, r * 1.4, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.d.color; ctx.beginPath(); ctx.ellipse(px, py, r * 1.3, r * 0.65, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#e8e6e1'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = 'rgba(191,38,24,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p.downT / 30, 0, 1)); ctx.stroke();
      if (p.reviveP > 0) { ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(px, py, r + 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p.reviveP, 0, 1)); ctx.stroke(); }
      ctx.fillStyle = '#ff6b5e'; ctx.font = `700 ${Math.max(10, PPM * 0.32)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(`${p.name} · ${Math.ceil(p.downT)} s`, px, py - r - 20);
      return;
    }
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(px + r * 0.25, py + r * 0.4, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = p.stealth > 0 ? 0.35 : 1;
      if (p.cyclone > 0) { ctx.strokeStyle = 'rgba(155,89,182,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, 3.5 * PPM, S.time * 14, S.time * 14 + 4.5); ctx.stroke(); }
      if (p.shield > 0) { ctx.strokeStyle = 'rgba(52,152,219,0.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(px, py, r + 8, p.aim - Math.PI / 2, p.aim + Math.PI / 2); ctx.stroke(); }
      if (p.rage > 0) { ctx.strokeStyle = `rgba(192,57,43,${0.5 + 0.3 * Math.sin(S.time * 10)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(px, py, r + 7 + 2 * Math.sin(S.time * 10), 0, Math.PI * 2); ctx.stroke(); }
      if (p.id === 'shadow' && p.combo > 0) { for (let i = 0; i < 3; i++) { ctx.fillStyle = i < p.combo ? (p.combo >= 3 ? '#f1c40f' : '#c39bd3') : 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(px - 10 + i * 10, py - r - 22, 3.5, 0, Math.PI * 2); ctx.fill(); } }
      if (p.id === 'buck' && p.grit > 0) { for (let i = 0; i < 5; i++) { ctx.fillStyle = i < p.grit ? (p.grit >= 5 ? '#f1c40f' : '#3498db') : 'rgba(255,255,255,0.18)'; ctx.fillRect(px - 17 + i * 7, py - r - 24, 5, 5); } }
      if (p.id === 'flight' && p.mom > 0.5) { const m = Math.min(100, p.boost > 0 ? 100 : p.mom) / 100; ctx.strokeStyle = m >= 0.75 ? 'rgba(241,196,15,0.9)' : 'rgba(231,76,60,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * m); ctx.stroke(); }
      if (p.id === 'savage' && p.rage <= 0 && p.rageM > 0.5) { const m = p.rageM / 100; ctx.strokeStyle = `rgba(192,57,43,${0.6 + 0.3 * m})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * m); ctx.stroke(); }
      if (p.guard > 0) { ctx.strokeStyle = `rgba(192,57,43,${0.5 + 0.3 * Math.sin(S.time * 8)})`; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(px, py, r + 12, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
      if (p.id === 'hush' && p.focus > 0.01) { ctx.strokeStyle = 'rgba(236,240,241,0.75)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (p.focus / 0.5)); ctx.stroke(); }
      // persistent buff/state auras (all survivors)
      if (p.hotT > 0 || (p.id === 'torch' && p.cburn > 0)) { ctx.save(); ctx.setLineDash([4, 4]); ctx.lineDashOffset = -S.time * 25; ctx.strokeStyle = p.id === 'torch' && p.cburn > 0 ? 'rgba(255,140,40,0.85)' : 'rgba(46,204,113,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, r + 11, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); if (Math.random() < 0.15) localFx({ kind: 'blood', spark: true, col: p.id === 'torch' && p.cburn > 0 ? '255,160,60' : '46,204,113', x: p.x + rand(-0.5, 0.5), y: p.y + rand(-0.2, 0.4), vx: 0, vy: -1.5, t: 0, life: 0.6 }); }
      if (p.boost > 0) { ctx.strokeStyle = `rgba(231,76,60,${0.5 + 0.3 * Math.sin(S.time * 12)})`; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const an = p.aim + Math.PI + (i - 1) * 0.5; ctx.beginPath(); ctx.moveTo(px + Math.cos(an) * (r + 6), py + Math.sin(an) * (r + 6)); ctx.lineTo(px + Math.cos(an) * (r + 18 + 4 * Math.sin(S.time * 20 + i)), py + Math.sin(an) * (r + 18 + 4 * Math.sin(S.time * 20 + i))); ctx.stroke(); } }
      if (p.invuln > 0) { ctx.strokeStyle = `rgba(255,255,255,${0.3 + 0.4 * Math.abs(Math.sin(S.time * 25))})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, r + 4, 0, Math.PI * 2); ctx.stroke(); }
      if (p.stealth > 0 && Math.random() < 0.25) localFx({ kind: 'puff', x: p.x + rand(-0.4, 0.4), y: p.y + rand(-0.4, 0.4), t: 0, life: 0.6, seed: rand(0, 6), col: '120,80,160' });
      if (p.digIn > 0) { const [dx, dy] = toScreen(p.digX, p.digY); ctx.strokeStyle = 'rgba(150,130,100,0.9)'; ctx.lineWidth = 6; ctx.setLineDash([8, 5]); ctx.beginPath(); ctx.arc(dx, dy, r + 14, p.aim - 1.3, p.aim + 1.3); ctx.stroke(); ctx.setLineDash([]); }
      if (p.taunt > 0) { ctx.fillStyle = '#3498db'; ctx.font = `800 ${Math.max(14, PPM * 0.55)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('!', px, py - r - 30 + 3 * Math.sin(S.time * 10)); }
      if (p.unchained > 0) { ctx.strokeStyle = `rgba(255,120,90,${0.5 + 0.4 * Math.sin(S.time * 14)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, r + 13 + 3 * Math.sin(S.time * 14), 0, Math.PI * 2); ctx.stroke(); if (Math.random() < 0.3) localFx({ kind: 'blood', spark: true, col: '255,90,60', x: p.x + rand(-0.5, 0.5), y: p.y + rand(-0.5, 0.5), vx: rand(-1, 1), vy: rand(-3, -1), t: 0, life: 0.5 }); }
      if (p.deadAir > 0) { ctx.strokeStyle = `rgba(236,240,241,${0.6 + 0.3 * Math.sin(S.time * 16)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, r + 12, S.time * 6, S.time * 6 + 1.2); ctx.stroke(); ctx.beginPath(); ctx.arc(px, py, r + 12, S.time * 6 + Math.PI, S.time * 6 + Math.PI + 1.2); ctx.stroke(); if (Math.random() < 0.4) localFx({ kind: 'blood', spark: true, col: '240,220,160', x: p.x + Math.cos(p.aim + 1.6) * 0.5, y: p.y + Math.sin(p.aim + 1.6) * 0.5, vx: Math.cos(p.aim + 1.8) * 3, vy: Math.sin(p.aim + 1.8) * 3 - 1, t: 0, life: 0.4 }); }
      if (p.finale > 0) { ctx.strokeStyle = `rgba(255,140,40,${0.5 + 0.4 * Math.sin(S.time * 18)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, r + 10 + 3 * Math.sin(S.time * 18), 0, Math.PI * 2); ctx.stroke(); if (Math.random() < 0.5) localFx({ kind: 'flame', x: p.x + rand(-0.6, 0.6), y: p.y + rand(-0.6, 0.6), vx: 0, vy: -1.5, t: 0, life: rand(0.3, 0.5) }); }
      if (p.overT > 0) { ctx.strokeStyle = `rgba(80,220,255,${0.5 + 0.4 * Math.sin(S.time * 10)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, r + 11, 0, Math.PI * 2); ctx.stroke(); }
      if (p.taunt > 0) { ctx.strokeStyle = 'rgba(52,152,219,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 10 * PPM * clamp(1 - p.taunt / 5 + 0.2, 0, 1), 0, Math.PI * 2); ctx.stroke(); }
      // body
      ctx.fillStyle = p.hurtT > 0 && Math.floor(p.hurtT * 20) % 2 ? '#ffffff' : p.d.color; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#e8e6e1'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#1a1d22'; ctx.beginPath(); ctx.arc(px, py, r * 0.55, 0, Math.PI * 2); ctx.fill(); // cap / head
      if (p.id === 'shadow') { ctx.fillStyle = '#2b2f6b'; ctx.beginPath(); ctx.arc(px, py, r * 0.5, p.aim - 2.2, p.aim + 2.2); ctx.fill(); }
      if (p.id === 'buck') { ctx.fillStyle = '#d9c3a5'; ctx.beginPath(); ctx.arc(px, py, r * 0.45, 0, Math.PI * 2); ctx.fill(); }
      if (p.id === 'wolf') { ctx.fillStyle = '#4a5560'; ctx.beginPath(); ctx.arc(px, py, r * 0.5, 0, Math.PI * 2); ctx.fill(); }
      if (p.id === 'savage') { ctx.fillStyle = '#2a1a12'; ctx.beginPath(); ctx.arc(px, py, r * 0.52, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#1a0f0a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px - Math.cos(p.aim) * r * 0.3, py - Math.sin(p.aim) * r * 0.3); ctx.lineTo(px - Math.cos(p.aim) * r * 1.1, py - Math.sin(p.aim) * r * 1.1); ctx.stroke(); }
      if (p.id === 'fuse') { ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(px, py, r * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(px + Math.cos(p.aim) * r * 0.45, py + Math.sin(p.aim) * r * 0.45, r * 0.18, 0, Math.PI * 2); ctx.fill(); }
      if (p.id === 'hush') { ctx.fillStyle = '#4b4f54'; ctx.beginPath(); ctx.arc(px, py, r * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#bdc3c7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px - r * 0.2, py - r * 0.4); ctx.lineTo(px - r * 0.6, py + r * 0.2); ctx.stroke(); }
      if (p.id === 'torch') { ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.arc(px, py, r * 0.5, p.aim + 1.2, p.aim - 1.2 + Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff8c1a'; ctx.beginPath(); ctx.arc(px, py, r * 0.5, p.aim - 1.2, p.aim + 1.2); ctx.fill(); }
      if (p.id === 'flight') { ctx.fillStyle = '#8e1f16'; ctx.beginPath(); ctx.arc(px, py, r * 0.55, p.aim + 0.9, p.aim - 0.9 + Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.arc(px, py, r * 0.36, 0, Math.PI * 2); ctx.fill(); if (p.tailwind) { ctx.strokeStyle = 'rgba(255,220,120,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, r + 5, 0, Math.PI * 2); ctx.stroke(); } if (p.moving && p.moveT > 0.3) { ctx.strokeStyle = 'rgba(231,76,60,0.35)'; ctx.lineWidth = 2; for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(px - p.vx * i * 1.6, py - p.vy * i * 1.6 + (i - 2) * 4); ctx.lineTo(px - p.vx * (i + 1.2) * 1.6, py - p.vy * (i + 1.2) * 1.6 + (i - 2) * 4); ctx.stroke(); } } }
      // weapon
      const st = stats(p); const len = st.base.type === 'melee' ? r * 1.6 : r * 2.1; const ang = p.swing > 0 ? p.swingDir + Math.sin((0.18 - p.swing) / 0.18 * Math.PI) * 1.2 - 0.6 : p.aim;
      ctx.strokeStyle = st.base.type === 'melee' ? '#cfd3d6' : '#8a949e'; ctx.lineWidth = st.base.type === 'melee' ? 3 : 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px + Math.cos(ang) * r * 0.6, py + Math.sin(ang) * r * 0.6); ctx.lineTo(px + Math.cos(ang) * len, py + Math.sin(ang) * len); ctx.stroke();
      ctx.globalAlpha = 1;
      // aim line for guns
      if (st.base.type === 'gun') { ctx.strokeStyle = 'rgba(232,230,225,0.16)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(p.aim) * st.range * PPM, py + Math.sin(p.aim) * st.range * PPM); ctx.stroke(); }

    if (!me) { // name tag and health for squadmates
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(px - 20, py - r - 16, 40, 4); ctx.fillStyle = p.d.color; ctx.fillRect(px - 20, py - r - 16, 40 * clamp(p.hp / p.maxHp, 0, 1), 4);
      ctx.fillStyle = '#e8e6e1'; ctx.font = `700 ${Math.max(9, PPM * 0.28)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(p.name, px, py - r - 20);
    } else { // Wild Rift: your own health lives above your model, not in a HUD card
      const bw = Math.max(56, r * 3.6), bh = 7, bx = px - bw / 2, by = py - r - 20; const k = clamp(p.hp / p.maxHp, 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2); ctx.fillStyle = k < 0.3 ? '#ff5a4a' : k < 0.6 ? '#e67e22' : '#2ecc71'; ctx.fillRect(bx, by, bw * k, bh);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; for (let i = 1; i < Math.min(10, Math.round(p.maxHp / 250)); i++) { const x = bx + bw * i / Math.min(10, Math.round(p.maxHp / 250)); ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x, by + bh); ctx.stroke(); }
      if (p.shield > 0) { ctx.fillStyle = 'rgba(52,152,219,0.85)'; ctx.fillRect(bx, by, bw * clamp(p.shield / p.maxHp, 0, 1), 2); }
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(bx - 1, by + bh + 1, bw + 2, 3); ctx.fillStyle = '#4fbf5a'; ctx.fillRect(bx, by + bh + 1.5, bw * clamp(p.inf, 0, 1), 2);
      ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.max(9, PPM * 0.26)}px Inter, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(`${Math.max(0, Math.ceil(p.hp))}`, px, by + bh - 0.5); ctx.textAlign = 'left'; ctx.font = `700 ${Math.max(9, PPM * 0.27)}px Satoshi, sans-serif`; ctx.fillStyle = '#e8e6e1'; ctx.fillText(p.name, bx, by - 4);
    }
    if (p.digIn > 0) { ctx.strokeStyle = 'rgba(52,152,219,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(toScreen(p.digX, p.digY)[0], toScreen(p.digX, p.digY)[1], 2 * PPM, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    if (p.breathe > 0) { ctx.strokeStyle = 'rgba(46,204,113,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, r + 12 + Math.sin(S.time * 3) * 3, 0, Math.PI * 2); ctx.stroke(); }
    if (p.boost > 0) { ctx.strokeStyle = 'rgba(231,76,60,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, r + 10, S.time * 6, S.time * 6 + 2); ctx.stroke(); }
    if (p.unchained > 0) { ctx.strokeStyle = `rgba(255,60,40,${0.6 + 0.3 * Math.sin(S.time * 14)})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(px, py, r + 12, 0, Math.PI * 2); ctx.stroke(); }
  }
  // what the thumb is doing: a direction arrow, a landing ring, a placement ghost or a target highlight
  function drawAimPreview(p) {
    const a = aimState; if (!a || !a.aiming || !p) return; const ab = KITS[p.id][a.slot]; const res = resolveAim(p, ab, a.aim);
    const [px, py] = toScreen(p.x, p.y); ctx.save(); ctx.lineWidth = 2;
    const col = p.d.color;
    if (a.cancel) { ctx.strokeStyle = '#bf2618'; ctx.fillStyle = '#bf2618'; ctx.font = `700 ${Math.max(12, PPM * 0.4)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('✕ cancel', px, py - PPM * 1.6); ctx.restore(); return; }
    if (ab.kind === 'aimed' || ab.kind === 'target' || ab.kind === 'ally') { ctx.save(); ctx.strokeStyle = col + '55'; ctx.setLineDash([3, 6]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, (ab.range || 6) * PPM, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (ab.kind === 'aimed') { const len = (ab.range || 6) * PPM; const ex = px + Math.cos(res.ang) * len, ey = py + Math.sin(res.ang) * len; ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(ex + Math.cos(res.ang) * 10, ey + Math.sin(res.ang) * 10); ctx.lineTo(ex + Math.cos(res.ang + 2.5) * 10, ey + Math.sin(res.ang + 2.5) * 10); ctx.lineTo(ex + Math.cos(res.ang - 2.5) * 10, ey + Math.sin(res.ang - 2.5) * 10); ctx.closePath(); ctx.fill();
      if (p.id === 'buck' && a.slot === 'd') { ctx.fillStyle = col + '33'; ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, 4.5 * PPM, res.ang - 0.5, res.ang + 0.5); ctx.closePath(); ctx.fill(); }
      if (p.id === 'torch' && a.slot === 'u') { const cx = px + Math.cos(res.ang) * 2 * PPM, cy = py + Math.sin(res.ang) * 2 * PPM; const vx = -Math.sin(res.ang) * 3 * PPM, vy = Math.cos(res.ang) * 3 * PPM; ctx.strokeStyle = '#ff8c1a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx - vx, cy - vy); ctx.lineTo(cx + vx, cy + vy); ctx.stroke(); } }
    if (ab.kind === 'throw' || ab.kind === 'place') { const [tx, ty] = toScreen(res.x, res.y); const ok = ab.kind !== 'place' || placeOk(res.x, res.y, 0.3); const c = ok ? col : '#bf2618';
      if (ab.kind === 'throw') { ctx.strokeStyle = c + '99'; ctx.setLineDash([4, 6]); ctx.beginPath(); const mx = (px + tx) / 2, my = (py + ty) / 2 - Math.min(80, dist(px, py, tx, ty) * 0.35); ctx.moveTo(px, py); ctx.quadraticCurveTo(mx, my, tx, ty); ctx.stroke(); ctx.setLineDash([]); }
      ctx.strokeStyle = c; ctx.fillStyle = c + '22'; ctx.beginPath(); ctx.arc(tx, ty, (ab.radius || 1) * PPM, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (ab.kind === 'place') { ctx.fillStyle = c + 'aa'; if (a.slot === 'd') ctx.fillRect(tx - 8, ty - 8, 16, 16); else { ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI * 2); ctx.fill(); } }
      // range ring
      ctx.strokeStyle = col + '44'; ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.arc(px, py, (ab.range || 6) * PPM, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    if (ab.kind === 'target') { if (res.z) { const [zx, zy] = toScreen(res.z.x, res.z.y); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(zx, zy, res.z.r * PPM + 8, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = col + '66'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(zx, zy); ctx.stroke(); } else { ctx.fillStyle = '#bf2618'; ctx.font = `700 ${Math.max(12, PPM * 0.36)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('no target', px, py - PPM * 1.6); } }
    if (ab.kind === 'ally') { const t = res.ally || (a.slot === 's' ? p : null); if (t) { const [ax, ay] = toScreen(t.x, t.y); ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ax, ay, t.r * PPM + 8, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#2ecc71'; ctx.font = `700 ${Math.max(11, PPM * 0.32)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(t === p ? 'self' : t.name, ax, ay - t.r * PPM - 14); } else if (ab.dir) { const len = (ab.range || 6) * PPM * 0.5; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(res.ang) * len, py + Math.sin(res.ang) * len); ctx.stroke(); } }
    ctx.restore();
  }
  let rainOff = 0; const lightCanvas = document.createElement('canvas'); const lightCtx = lightCanvas.getContext('2d');
  function render(dt) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#0b0d10'; ctx.fillRect(0, 0, W, H);
    if (S.mode === 'title' || S.mode === 'select') return;
    const p = S.p; if (!p) return;
    const shx = S.shake > 0 ? rand(-1, 1) * S.shake * 8 : 0, shy = S.shake > 0 ? rand(-1, 1) * S.shake * 8 : 0;
    ctx.save(); ctx.translate(shx, shy);
    const [ox, oy] = toScreen(0, 0);
    // ground
    ctx.fillStyle = '#1c232c'; ctx.fillRect(ox, oy, MAP.w * PPM, MAP.h * PPM);
    // street markings: faint grid of asphalt seams
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0; x <= MAP.w; x += 2) { ctx.moveTo(ox + x * PPM, oy); ctx.lineTo(ox + x * PPM, oy + MAP.h * PPM); }
    for (let y = 0; y <= MAP.h; y += 2) { ctx.moveTo(ox, oy + y * PPM); ctx.lineTo(ox + MAP.w * PPM, oy + y * PPM); }
    ctx.stroke();
    // sidewalks around blocks
    for (const b of MAP.blocks) { if (b.car) continue; ctx.fillStyle = '#262f3a'; ctx.fillRect(ox + (b.x - 1) * PPM, oy + (b.y - 1) * PPM, (b.w + 2) * PPM, (b.h + 2) * PPM); }
    // decals
    for (const d of S.decals) { ctx.fillStyle = `rgba(90,12,10,${d.a * 0.6})`; ctx.beginPath(); ctx.arc(ox + d.x * PPM, oy + d.y * PPM, d.r * PPM, 0, Math.PI * 2); ctx.fill(); }
    // extraction
    if (S.quest && S.p) { const left = S.quest.items.filter(q => !q.got); if (left.length) { const q = left.sort((a, b) => dist(a.x, a.y, S.p.x, S.p.y) - dist(b.x, b.y, S.p.x, S.p.y))[0]; const def = questDef(q); const [qx, qy] = toScreen(q.x, q.y); const m = 54; if (qx < m || qy < m + 70 || qx > W - m || qy > H - m - 90) { const cx = W / 2, cy = H / 2; const an = Math.atan2(qy - cy, qx - cx); const ax = clamp(qx, m, W - m), ay = clamp(qy, m + 70, H - m - 90); ctx.save(); ctx.translate(ax, ay); ctx.rotate(an); ctx.fillStyle = def.hex; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-4, 0); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.fillStyle = def.hex; ctx.font = `700 ${Math.max(10, PPM * 0.3)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(`${def.short} ${Math.round(dist(q.x, q.y, S.p.x, S.p.y))} m`, ax, ay + 26); } } }
    if (S.extractOpen) { const [ex, ey] = toScreen(MAP.extract.x, MAP.extract.y); const pulse = 0.8 + 0.2 * Math.sin(S.time * 4); ctx.strokeStyle = `rgba(230,126,34,${pulse})`; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.arc(ex, ey, 2.5 * PPM, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(230,126,34,0.12)'; ctx.fill(); ctx.fillStyle = '#e67e22'; ctx.font = `700 ${Math.max(12, PPM * 0.45)}px "Clash Display", sans-serif`; ctx.textAlign = 'center'; ctx.fillText('EXTRACT', ex, ey - 2.9 * PPM); }
    // acid pools
    for (const po of S.pools) { const [ax, ay] = toScreen(po.x, po.y); const k = clamp(po.t / po.max, 0, 1); ctx.fillStyle = `rgba(120,190,60,${0.22 + 0.25 * k})`; ctx.beginPath(); ctx.ellipse(ax, ay, po.r * PPM, po.r * PPM * 0.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(170,240,90,${0.5 * k})`; ctx.lineWidth = 1.5; ctx.stroke(); for (let i = 0; i < 4; i++) { const b = (S.time * 2 + i * 1.7) % 1; ctx.fillStyle = `rgba(200,255,120,${0.5 * (1 - b)})`; ctx.beginPath(); ctx.arc(ax + Math.cos(i * 2.1) * po.r * PPM * 0.5, ay + Math.sin(i * 2.1) * po.r * PPM * 0.4 - b * 6, 2 + b * 3, 0, Math.PI * 2); ctx.fill(); } }
    // fire pools and fire breaks
    for (const f of S.fires) { const [fx, fy] = toScreen(f.x, f.y); const k = clamp(f.t / f.max, 0, 1); const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, f.r * PPM); g.addColorStop(0, `rgba(255,140,40,${0.55 * k + 0.15})`); g.addColorStop(0.6, `rgba(220,70,20,${0.35 * k + 0.1})`); g.addColorStop(1, 'rgba(120,20,10,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(fx, fy, f.r * PPM, f.r * PPM * 0.85, 0, 0, Math.PI * 2); ctx.fill(); for (let i = 0; i < (f.wall ? 2 : 5); i++) { const b = (S.time * 3 + i * 1.3 + f.x) % 1; ctx.fillStyle = `rgba(255,${160 + 80 * b | 0},60,${0.8 * (1 - b)})`; ctx.beginPath(); ctx.arc(fx + Math.cos(i * 1.9 + f.y) * f.r * PPM * 0.55, fy + Math.sin(i * 1.9) * f.r * PPM * 0.4 - b * PPM * 0.7, (3 + 4 * (1 - b)) * (f.wall ? 0.8 : 1), 0, Math.PI * 2); ctx.fill(); } }
    // arc mines
    for (const m of S.mines) { const [mx, my] = toScreen(m.x, m.y); ctx.fillStyle = m.arm > 0 ? '#7f8c8d' : '#f1c40f'; ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(241,196,15,${0.25 + 0.2 * Math.sin(S.time * 6)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(mx, my, 3 * PPM, 0, Math.PI * 2); ctx.stroke(); }
    // junction turrets
    for (const tr of S.turrets) { const [tx, ty] = toScreen(tr.x, tr.y); const own = bySid(tr.sid); const over = own && own.overT > 0;
      if (over) { ctx.strokeStyle = `rgba(80,220,255,${0.55 + 0.35 * Math.sin(S.time * 10)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tx, ty, 16, 0, Math.PI * 2); ctx.stroke(); }
      // repair indicator: Fuse standing within Jumper Cables reach sees a green dashed ring (grey while Cables is on cooldown) and a wrench tag
      if (S.p && S.p.id === 'fuse' && S.p === own && !S.p.down && dist(S.p.x, S.p.y, tr.x, tr.y) <= 3) { const ready = S.p.cd.s <= 0; ctx.save(); ctx.setLineDash([5, 4]); ctx.lineDashOffset = -S.time * 20; ctx.strokeStyle = ready ? 'rgba(46,204,113,0.9)' : 'rgba(150,160,170,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tx, ty, 21, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); if (tr.hp < (tr.maxHp || 500)) { ctx.font = `700 ${Math.max(10, PPM * 0.3)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = ready ? '#2ecc71' : '#9aa4b0'; ctx.fillText(ready ? 'REPAIR READY' : 'REPAIR ' + Math.ceil(S.p.cd.s) + 's', tx, ty + 34); } }
      if (tr.repT > 0) { ctx.strokeStyle = `rgba(46,204,113,${tr.repT / 1.2})`; ctx.lineWidth = 3; ctx.strokeRect(tx - 11, ty - 11, 22, 22); }
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(tx + 3, ty + 4, 10, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#5d6d7e'; ctx.fillRect(tx - 8, ty - 8, 16, 16); ctx.fillStyle = '#f1c40f'; ctx.fillRect(tx - 5, ty - 5, 10, 10); ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(tr.aim) * 14, ty + Math.sin(tr.aim) * 14); ctx.stroke(); const hf = tr.maxHp ? clamp(tr.hp / tr.maxHp, 0, 1) : 1; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(tx - 11, ty - 19, 22, 4); ctx.fillStyle = tr.repT > 0 ? '#ffffff' : hf > 0.5 ? '#2ecc71' : hf > 0.25 ? '#f39c12' : '#e74c3c'; ctx.fillRect(tx - 11, ty - 19, 22 * hf, 4); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(tx - 10, ty - 14, 20, 2); ctx.fillStyle = '#f1c40f'; ctx.fillRect(tx - 10, ty - 14, 20 * clamp(tr.t / (tr.ult ? 12 : 30), 0, 1), 2); }
    // flares on the ground
    for (const f of S.flares) { const [fx, fy] = toScreen(f.x, f.y); ctx.fillStyle = '#ff5a3c'; ctx.beginPath(); ctx.arc(fx, fy, 4 + Math.random() * 2, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(231,76,60,${0.25 + 0.15 * Math.sin(S.time * 10)})`; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.arc(fx, fy, f.r * PPM * clamp(f.t / 6, 0, 1), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(255,${120 + Math.random() * 100 | 0},60,0.8)`; ctx.fillRect(fx + rand(-6, 6), fy - rand(0, 14), 2, 2); } }
    // zones: antiviral cloud (green), Code Blue (bright green), Third Rail ring (yellow)
    for (const zn of S.zones) { const [zx, zy] = toScreen(zn.x, zn.y); const k = clamp(zn.t / zn.max, 0, 1); if (zn.kind === 'ring') { ctx.strokeStyle = `rgba(241,196,15,${0.5 + 0.3 * Math.sin(S.time * 12)})`; ctx.lineWidth = 4; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.arc(zx, zy, zn.r * PPM, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); for (let i = 0; i < 6; i++) { const an = S.time * 5 + i; ctx.fillStyle = 'rgba(255,240,150,0.9)'; ctx.fillRect(zx + Math.cos(an) * zn.r * PPM - 2, zy + Math.sin(an) * zn.r * PPM - 2, 4, 4); } continue; } if (zn.kind === 'slip') { ctx.fillStyle = `rgba(231,76,60,${0.16 * k + 0.04})`; ctx.beginPath(); ctx.arc(zx, zy, zn.r * PPM, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(231,76,60,${0.5 * k})`; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { const off = ((S.time * 3 + i / 3) % 1) * zn.r * PPM; ctx.beginPath(); ctx.moveTo(zx - zn.r * PPM * 0.6, zy - zn.r * PPM * 0.6 + off * 1.2); ctx.lineTo(zx + zn.r * PPM * 0.2, zy - zn.r * PPM * 0.6 + off * 1.2); ctx.stroke(); } continue; } const g = ctx.createRadialGradient(zx, zy, 0, zx, zy, zn.r * PPM); const c = zn.kind === 'heal' ? '46,204,113' : '120,220,160'; g.addColorStop(0, `rgba(${c},${0.3 * k + 0.1})`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(zx, zy, zn.r * PPM, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(${c},${0.6 * k})`; ctx.lineWidth = 2; ctx.stroke(); if (zn.kind === 'heal') { ctx.fillStyle = `rgba(255,255,255,${0.7 * k})`; ctx.font = `700 ${Math.max(10, PPM * 0.4)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('+', zx, zy - zn.r * PPM - 6); } }
    // barricades (Hold the Line)
    for (const b of S.barricades) { const [bx, by] = toScreen(b.x, b.y); const k = clamp(b.t / b.max, 0, 1); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx - b.r * PPM + 3, by - 6 + 4, b.r * 2 * PPM, 14); ctx.fillStyle = '#3d4a58'; ctx.fillRect(bx - b.r * PPM, by - 8, b.r * 2 * PPM, 16); ctx.fillStyle = k > 0.25 ? '#e67e22' : '#bf2618'; for (let i = 0; i < 3; i++) ctx.fillRect(bx - b.r * PPM + 2 + i * (b.r * 2 * PPM / 3), by - 6, b.r * 2 * PPM / 6, 12); }
    // thrown bottles and flares in the air
    for (const th of S.throws) { const k = th.t / th.life; const x = lerp(th.x, th.tx, k), y = lerp(th.y, th.ty, k); const h = Math.sin(k * Math.PI) * 2.5; const [sx, sy] = toScreen(x, y); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(sx, sy, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = th.kind === 'molotov' ? '#ff8c1a' : th.kind === 'flare' ? '#ff5a3c' : '#9be2b5'; ctx.beginPath(); ctx.arc(sx, sy - h * PPM, 5, 0, Math.PI * 2); ctx.fill(); if (th.kind === 'molotov') { ctx.fillStyle = `rgba(255,${160 + Math.random() * 80 | 0},60,0.9)`; ctx.fillRect(sx - 2 + rand(-3, 3), sy - h * PPM - 8 - rand(0, 6), 3, 3); } const [tx, ty] = toScreen(th.tx, th.ty); ctx.strokeStyle = 'rgba(232,230,225,0.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(tx, ty, (th.kind === 'molotov' ? 2 : th.kind === 'cloud' ? 3 : 1) * PPM, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    // loot
    for (const l of S.loot) { const [lx, ly] = toScreen(l.x, l.y); const bob = Math.sin(l.t * 4) * 3; ctx.save(); ctx.translate(lx, ly + bob); ctx.fillStyle = l.item.rar.color; ctx.shadowColor = l.item.rar.color; ctx.shadowBlur = 12; ctx.rotate(Math.PI / 4); const s = PPM * 0.22; ctx.fillRect(-s, -s, s * 2, s * 2); ctx.restore(); if (l.item.rar.gs >= 10) { ctx.fillStyle = l.item.rar.color + '55'; ctx.fillRect(lx - 1.5, ly - 60, 3, 56); } }
    // quest items
    if (S.quest) for (const q of S.quest.items) { if (q.got) continue; const def = questDef(q); const [qx, qy] = toScreen(q.x, q.y); if (qx < -80 || qy < -80 || qx > W + 80 || qy > H + 80) continue; const bob = Math.sin(q.t * 3) * 3; const pulse = 0.6 + 0.4 * Math.sin(q.t * 4);
      ctx.strokeStyle = `rgba(${def.col},${0.35 + 0.25 * pulse})`; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -q.t * 20; ctx.beginPath(); ctx.arc(qx, qy, QUEST_PICK_R * PPM, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = `rgba(${def.col},0.25)`; ctx.beginPath(); ctx.ellipse(qx, qy + 6, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(qx, qy + bob - 8); ctx.shadowColor = def.hex; ctx.shadowBlur = 16 * pulse; ctx.fillStyle = '#1a1d22'; ctx.strokeStyle = def.hex; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.rect(-11, -8, 22, 16); ctx.fill(); ctx.stroke(); ctx.fillStyle = def.hex; ctx.fillRect(-11, -2, 22, 4); ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (q.prog <= 0) { ctx.fillStyle = def.hex; ctx.font = `800 ${Math.max(10, PPM * 0.3)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(def.name.toUpperCase(), qx, qy - 26 + bob); }
    }
    // zombies
    for (const z of S.zombies) {
      const [zx, zy] = toScreen(z.x, z.y); if (zx < -60 || zy < -60 || zx > W + 60 || zy > H + 60) continue;
      const r = z.r * PPM;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(zx + r * 0.25, zy + r * 0.35, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = z.hurt > 0 ? '#e8e6e1' : z.d.color; ctx.beginPath(); ctx.arc(zx, zy, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      if (z.type === 'brute') { ctx.strokeStyle = '#2a2f28'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(zx, zy, r * 0.75, 0, Math.PI * 2); ctx.stroke(); }
      if (z.type === 'walker') { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(zx - r * 0.3, zy - r * 0.2, r * 0.45, 0, Math.PI * 2); ctx.fill(); }
      if (z.type === 'screamer') { // giant jaw: a dark wedge opening toward where it faces; it gapes wider as it winds up
        const open = z.screamT != null ? 0.35 + 0.65 * (1 - z.screamT / z.d.screamWindup) : 0.25; ctx.fillStyle = '#2a0f0c'; ctx.beginPath(); ctx.moveTo(zx, zy); ctx.arc(zx, zy, r * 1.05, z.face - open, z.face + open); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#e8d9c4'; for (let i = -2; i <= 2; i++) { const a = z.face + i * open * 0.4; ctx.beginPath(); ctx.arc(zx + Math.cos(a) * r * 0.85, zy + Math.sin(a) * r * 0.85, Math.max(1, r * 0.1), 0, Math.PI * 2); ctx.fill(); }
        if (z.screamT != null) { const k = 1 - z.screamT / z.d.screamWindup; ctx.strokeStyle = `rgba(255,170,80,${0.4 + 0.5 * k})`; ctx.lineWidth = 2 + 3 * k; ctx.beginPath(); ctx.arc(zx, zy, r + 6 + k * 10, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#ffb060'; ctx.font = `700 ${Math.max(10, PPM * 0.34)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('KILL IT', zx, zy - r - 12); } }
      if (z.type === 'spitter') { // swollen throat: a pulsing sac in front of the face
        const pulse = 1 + 0.12 * Math.sin(S.time * 6) + (z.spitWind != null ? 0.35 * (1 - z.spitWind / 0.45) : 0); const fx = Math.cos(z.face), fy = Math.sin(z.face); ctx.fillStyle = '#b9e27a'; ctx.beginPath(); ctx.arc(zx + fx * r * 0.55, zy + fy * r * 0.55, r * 0.62 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = 'rgba(60,110,30,0.6)'; ctx.beginPath(); ctx.arc(zx + fx * r * 0.7, zy + fy * r * 0.7, r * 0.22 * pulse, 0, Math.PI * 2); ctx.fill(); }
      // face direction + eyes
      const fx = Math.cos(z.face), fy = Math.sin(z.face); ctx.fillStyle = z.aware ? '#b8ff6a' : '#6d8a4a'; ctx.beginPath(); ctx.arc(zx + fx * r * 0.55 - fy * r * 0.3, zy + fy * r * 0.55 + fx * r * 0.3, Math.max(1.5, r * 0.12), 0, Math.PI * 2); ctx.arc(zx + fx * r * 0.55 + fy * r * 0.3, zy + fy * r * 0.55 - fx * r * 0.3, Math.max(1.5, r * 0.12), 0, Math.PI * 2); ctx.fill();
      if (z.windup != null) { ctx.strokeStyle = 'rgba(231,76,60,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(zx, zy, r + 4, 0, Math.PI * 2); ctx.stroke(); }
      if (z.exposed > 0) { ctx.strokeStyle = '#9b59b6'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(zx, zy, r + 6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
      if (z.burn > 0) { for (let i = 0; i < z.burn; i++) { const b = (S.time * 4 + i * 0.7) % 1; ctx.fillStyle = `rgba(255,${150 + 90 * b | 0},50,${0.9 * (1 - b)})`; ctx.beginPath(); ctx.arc(zx + Math.sin(i * 2.3 + S.time * 7) * r * 0.5, zy - r * 0.3 - b * r * 1.2, Math.max(2, r * 0.3 * (1 - b)), 0, Math.PI * 2); ctx.fill(); } }
      if (z.marked > 0) { ctx.strokeStyle = '#ecf0f1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(zx, zy - r - 14); ctx.lineTo(zx + 6, zy - r - 8); ctx.lineTo(zx, zy - r - 2); ctx.lineTo(zx - 6, zy - r - 8); ctx.closePath(); ctx.stroke(); }
      if (z.pinned > 0) { ctx.strokeStyle = '#ecf0f1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(zx - r, zy - r); ctx.lineTo(zx + r, zy + r); ctx.moveTo(zx + r, zy - r); ctx.lineTo(zx - r, zy + r); ctx.stroke(); }
      if (z.zapped > 0) { ctx.strokeStyle = `rgba(241,196,15,${0.5 + 0.5 * Math.random()})`; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = Math.random() * Math.PI * 2; ctx.moveTo(zx, zy); ctx.lineTo(zx + Math.cos(a) * r * 1.6, zy + Math.sin(a) * r * 1.6); } ctx.stroke(); }
      if (z.flare) { ctx.fillStyle = '#e74c3c'; ctx.font = `700 ${Math.max(10, PPM * 0.4)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('?', zx, zy - r - 8); }
      if (z.taunted > 0) { ctx.fillStyle = '#3498db'; ctx.font = `700 ${Math.max(10, PPM * 0.4)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('!', zx, zy - r - 8); }
      if (z.hp < z.maxHp) { const bw = Math.max(18, r * 2.2); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(zx - bw / 2, zy - r - 7, bw, 4); ctx.fillStyle = z.type === 'brute' ? '#e67e22' : '#bf2618'; ctx.fillRect(zx - bw / 2, zy - r - 7, bw * clamp(z.hp / z.maxHp, 0, 1), 4); }
    }
    // off-screen Screamer winding up: edge marker so you know where the horde call is coming from
    for (const z of S.zombies) { if (z.type !== 'screamer' || z.screamT == null) continue; const [zx, zy] = toScreen(z.x, z.y); if (zx > 20 && zy > 20 && zx < W - 20 && zy < H - 20) continue; const ex = clamp(zx, 24, W - 24), ey = clamp(zy, 70, H - 90); const a = Math.atan2(zy - ey, zx - ex); ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = '#ffb060'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.fillStyle = '#ffb060'; ctx.font = `700 ${Math.max(10, PPM * 0.3)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('SCREAMER', ex, ey + 24); }
    // acid in flight: lobbed blob with a shadow on the ground
    for (const sp of S.spits) { const k = sp.t / sp.life; const x = lerp(sp.x, sp.tx, k), y = lerp(sp.y, sp.ty, k); const h = Math.sin(k * Math.PI) * 2.2; const [sx, sy] = toScreen(x, y); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(sx, sy, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#a8e060'; ctx.beginPath(); ctx.arc(sx, sy - h * PPM, 5 + 2 * Math.sin(k * Math.PI), 0, Math.PI * 2); ctx.fill(); const [tx, ty] = toScreen(sp.tx, sp.ty); ctx.strokeStyle = `rgba(170,240,90,${0.35 + 0.4 * k})`; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.ellipse(tx, ty, sp.r * PPM, sp.r * PPM * 0.8, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    // survivors (squadmates first so our own is drawn on top)
    for (const o of S.players) if (o !== p) drawPlayer(o, false);
    drawPlayer(p, true);
    // quest recovery progress sits above the survivors so it is never hidden by a body or name tag
    if (S.quest) for (const q of S.quest.items) { if (q.got || q.prog <= 0) continue; const def = questDef(q); const [qx, qy] = toScreen(q.x, q.y); const R = 36; ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(qx, qy, R, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = `rgba(${def.col},0.35)`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(qx, qy, R, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = def.hex; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(qx, qy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * q.prog); ctx.stroke(); ctx.lineCap = 'butt'; ctx.fillStyle = def.hex; ctx.font = `800 ${Math.max(11, PPM * 0.32)}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(`RECOVERING ${def.name.toUpperCase()} ${Math.round(q.prog * 100)}%`, qx, qy + R + 18); }
    // blocks (drawn above entities so alleys read as walls)
    for (const b of MAP.blocks) {
      const x = ox + b.x * PPM, y = oy + b.y * PPM, w = b.w * PPM, h = b.h * PPM;
      if (b.car) { ctx.fillStyle = '#2b3139'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#3a4552'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); continue; }
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x + 6, y + 8, w, h);
      ctx.fillStyle = '#4a2f28'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#32201f'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 1; i < 4; i++) { ctx.moveTo(x + w * i / 4, y); ctx.lineTo(x + w * i / 4, y + h); } ctx.stroke();
      // a few lit windows
      ctx.fillStyle = 'rgba(230,126,34,0.35)'; for (let i = 0; i < 3; i++) ctx.fillRect(x + 10 + i * (w / 3.2), y + h / 2 - 4, 6, 6);
    }
    // fx
    for (const f of S.fx) {
      const k = f.t / f.life;
      if (f.kind === 'flame') { const [bx, by] = toScreen(f.x, f.y); ctx.fillStyle = `rgba(255,${120 + 120 * (1 - k) | 0},40,${0.85 * (1 - k)})`; ctx.beginPath(); ctx.arc(bx, by, 3 + 7 * k, 0, Math.PI * 2); ctx.fill(); }
      else if (f.kind === 'tracer') { const [ax, ay] = toScreen(f.x0, f.y0), [bx, by] = toScreen(f.x1, f.y1); if (f.heavy || f.bolt) { ctx.strokeStyle = `rgba(255,220,160,${0.25 * (1 - k)})`; ctx.lineWidth = f.heavy ? 7 : 5; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); } ctx.strokeStyle = f.fire ? `rgba(255,140,40,${0.9 * (1 - k)})` : f.green ? `rgba(46,204,113,${0.9 * (1 - k)})` : f.quiet ? `rgba(200,210,220,${0.5 * (1 - k)})` : f.bolt ? `rgba(230,200,150,${0.95 * (1 - k)})` : `rgba(255,230,180,${0.9 * (1 - k)})`; ctx.lineWidth = f.fire ? 4 : f.green ? 2.5 : f.heavy ? 2.5 : f.bolt ? 3 : f.quiet ? 1.2 : 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
      else if (f.kind === 'muzzle') { const [mx, my] = toScreen(f.x, f.y); const a = 1 - k; const L = (f.big ? 26 : 16) * (f.quiet ? 0.5 : 1); ctx.save(); ctx.translate(mx, my); ctx.rotate(f.ang); ctx.fillStyle = `rgba(255,${f.quiet ? 200 : 170},${f.quiet ? 140 : 60},${0.9 * a})`; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(L, -1.5); ctx.lineTo(L * 1.25, 0); ctx.lineTo(L, 1.5); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(L * 0.45, -L * 0.35); ctx.lineTo(L * 0.6, 0); ctx.lineTo(L * 0.45, L * 0.35); ctx.closePath(); ctx.fill(); ctx.fillStyle = `rgba(255,255,230,${a})`; ctx.beginPath(); ctx.arc(2, 0, f.big ? 6 : 4, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      else if (f.kind === 'critstar') { const [cx, cy] = toScreen(f.x, f.y); const a = 1 - k; ctx.save(); ctx.translate(cx, cy); ctx.rotate(f.ang + k * 0.6); const R = (10 + 22 * k); ctx.fillStyle = `rgba(${f.col},${0.85 * a})`; ctx.beginPath(); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; const rr = i % 2 ? R * 0.42 : R; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); ctx.fillStyle = `rgba(255,255,240,${a})`; ctx.beginPath(); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4 + 0.39; const rr = i % 2 ? R * 0.2 : R * 0.55; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); }
      else if (f.kind === 'reticle') { const [cx, cy] = toScreen(f.x, f.y); const a = 1 - k; const rr = f.r * PPM * (1.6 - 0.6 * k); ctx.strokeStyle = `rgba(236,240,241,${a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 4; i++) { const an = i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * rr * 0.7, cy + Math.sin(an) * rr * 0.7); ctx.lineTo(cx + Math.cos(an) * rr * 1.3, cy + Math.sin(an) * rr * 1.3); ctx.stroke(); } }
      else if (f.kind === 'hit') { const [hx, hy] = toScreen(f.x, f.y); const a = 1 - k; ctx.save(); ctx.translate(hx, hy); ctx.rotate(f.ang); ctx.strokeStyle = f.crit ? `rgba(255,236,170,${a})` : `rgba(255,255,255,${0.9 * a})`; ctx.lineWidth = f.crit ? 2.5 : 1.5; for (let i = 0; i < (f.crit ? 6 : 4); i++) { const an = (i / (f.crit ? 6 : 4)) * Math.PI * 2 + 0.4; const r0 = 3 + 6 * k, r1 = r0 + (f.crit ? 9 : 5) * (1 - k * 0.5); ctx.beginPath(); ctx.moveTo(Math.cos(an) * r0, Math.sin(an) * r0); ctx.lineTo(Math.cos(an) * r1, Math.sin(an) * r1); ctx.stroke(); } ctx.fillStyle = `rgba(255,255,255,${0.9 * a})`; ctx.beginPath(); ctx.arc(0, 0, (f.crit ? 5 : 3) * (1 - k), 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      else if (f.kind === 'slash') { const [sx, sy] = toScreen(f.x, f.y); const a = 1 - k; const sweep = f.half * 2; const start = f.ang - f.half + sweep * Math.min(1, k * 1.6); const end = Math.min(f.ang + f.half, start + sweep * 0.55); const rr = f.r * PPM; ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(${f.col},${0.25 * a})`; ctx.lineWidth = f.heavy ? 14 : 9; ctx.beginPath(); ctx.arc(sx, sy, rr * 0.8, start, end); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${0.8 * a})`; ctx.lineWidth = f.heavy ? 4 : 2.5; ctx.beginPath(); ctx.arc(sx, sy, rr * 0.8, start, end); ctx.stroke(); }
      else if (f.kind === 'flash') { const [fx, fy] = toScreen(f.x, f.y); ctx.fillStyle = 'rgba(255,200,120,0.9)'; ctx.beginPath(); ctx.arc(fx, fy, (f.big ? 10 : 6) * (1 - k), 0, Math.PI * 2); ctx.fill(); }
      else if (f.kind === 'blood') { const [bx, by] = toScreen(f.x, f.y); ctx.fillStyle = f.spark ? (f.col ? `rgba(${f.col},${1 - k})` : f.green ? `rgba(46,204,113,${1 - k})` : f.cyan ? `rgba(120,235,255,${1 - k})` : f.white ? `rgba(255,240,200,${1 - k})` : `rgba(255,${200 + 55 * (1 - k) | 0},80,${1 - k})`) : `rgba(150,20,15,${1 - k})`; ctx.fillRect(bx - 2, by - 2, 4, 4); }
      else if (f.kind === 'cone') { const [cx, cy] = toScreen(f.x, f.y); const a = 1 - k; ctx.fillStyle = `rgba(${f.col || '255,220,160'},${0.35 * a})`; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, f.r * PPM * (0.5 + 0.5 * k), f.ang - f.half, f.ang + f.half); ctx.closePath(); ctx.fill(); ctx.strokeStyle = `rgba(${f.col || '255,220,160'},${0.8 * a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, f.r * PPM * (0.5 + 0.5 * k), f.ang - f.half, f.ang + f.half); ctx.stroke(); }
      else if (f.kind === 'trail') { const [ax, ay] = toScreen(f.x0, f.y0), [bx, by] = toScreen(f.x1, f.y1); const a = 1 - k; ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(${f.col},${0.25 * a})`; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.strokeStyle = `rgba(${f.col},${0.7 * a})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
      else if (f.kind === 'puff') { const [cx, cy] = toScreen(f.x, f.y); const a = 1 - k; for (let i = 0; i < 5; i++) { const an = f.seed + i * 1.257; const d = (4 + 14 * k) * (0.7 + 0.3 * ((i * 7) % 3) / 2); ctx.fillStyle = `rgba(${f.col},${0.45 * a})`; ctx.beginPath(); ctx.arc(cx + Math.cos(an) * d, cy + Math.sin(an) * d, (5 + 4 * k) * (f.big ? 1.6 : 1), 0, Math.PI * 2); ctx.fill(); } }
      else if (f.kind === 'ghost') { const [cx, cy] = toScreen(f.x, f.y); ctx.fillStyle = `rgba(${f.col},${0.35 * (1 - k)})`; ctx.beginPath(); ctx.arc(cx, cy, f.r * (1 - 0.3 * k), 0, Math.PI * 2); ctx.fill(); }
      else if (f.kind === 'pierce') { const [px, py] = toScreen(f.x, f.y); const a = 1 - k; const r = 5 + 9 * k + Math.min(f.n, 4) * 1.5; ctx.strokeStyle = f.white ? `rgba(255,236,170,${0.95 * a})` : `rgba(120,235,255,${0.9 * a})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = `rgba(255,255,255,${0.9 * a})`; ctx.beginPath(); ctx.arc(px, py, 3 + 2 * a, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(255,255,255,${0.8 * a})`; ctx.lineWidth = 2; const sp = r + 4; for (let i = 0; i < 4; i++) { const an = f.ang + Math.PI / 4 + i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(px + Math.cos(an) * (sp - 4), py + Math.sin(an) * (sp - 4)); ctx.lineTo(px + Math.cos(an) * (sp + 4 * a), py + Math.sin(an) * (sp + 4 * a)); ctx.stroke(); } }
      else if (f.kind === 'laser') { const [ax, ay] = toScreen(f.x0, f.y0), [bx, by] = toScreen(f.x1, f.y1); const a = Math.sqrt(1 - k); ctx.lineCap = 'round'; ctx.strokeStyle = f.white ? `rgba(255,220,140,${0.3 * a})` : `rgba(80,220,255,${0.35 * a})`; ctx.lineWidth = f.white ? 10 : 16; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.strokeStyle = f.white ? `rgba(255,236,170,${0.85 * a})` : `rgba(120,235,255,${0.8 * a})`; ctx.lineWidth = f.white ? 4 : 6; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill(); }
      else if (f.kind === 'num') { const [nx, ny] = toScreen(f.x, f.y - k * 0.8); ctx.font = `${f.crit ? 700 : 500} ${Math.max(11, PPM * (f.crit ? 0.5 : 0.38))}px Satoshi, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = f.col ? `rgba(${f.col},${1 - k})` : f.purple ? `rgba(195,155,211,${1 - k})` : f.cyan ? `rgba(120,235,255,${1 - k})` : f.crit ? `rgba(241,196,15,${1 - k})` : f.fire ? `rgba(255,140,40,${0.9 * (1 - k)})` : f.heal ? `rgba(46,204,113,${0.9 * (1 - k)})` : `rgba(232,230,225,${0.9 * (1 - k)})`; ctx.fillText(f.text + (f.crit ? '!' : ''), nx, ny); }
      else if (f.kind === 'ring') { const [rx, ry] = toScreen(f.x, f.y); ctx.strokeStyle = f.col ? `rgba(${f.col},${0.9 * (1 - k)})` : f.green ? `rgba(46,204,113,${0.9 * (1 - k)})` : f.cyan ? `rgba(80,220,255,${0.9 * (1 - k)})` : f.blue ? `rgba(52,152,219,${0.8 * (1 - k)})` : f.crimson ? `rgba(192,57,43,${0.9 * (1 - k)})` : f.yellow ? `rgba(241,196,15,${0.9 * (1 - k)})` : f.tan ? `rgba(255,170,80,${0.8 * (1 - k)})` : f.red ? `rgba(255,220,120,${0.9 * (1 - k)})` : f.white ? `rgba(232,230,225,${0.9 * (1 - k)})` : f.fire ? `rgba(255,140,40,${0.9 * (1 - k)})` : `rgba(155,89,182,${0.7 * (1 - k)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(rx, ry, f.r * PPM * (0.6 + 0.4 * k), 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.restore();
    // darkness + streetlights, composed on an offscreen canvas so the holes only cut the darkness
    if (lightCanvas.width !== canvas.width || lightCanvas.height !== canvas.height) { lightCanvas.width = canvas.width; lightCanvas.height = canvas.height; }
    const lc = lightCtx; lc.setTransform(DPR, 0, 0, DPR, 0, 0); lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, W, H);
    lc.fillStyle = 'rgba(6,8,12,0.5)'; lc.fillRect(0, 0, W, H);
    lc.globalCompositeOperation = 'destination-out';
    for (const L of MAP.lights) { const [lx, ly] = toScreen(L.x, L.y); if (lx < -300 || ly < -300 || lx > W + 300 || ly > H + 300) continue; const fl = L.flicker && Math.random() < 0.05 ? 0.6 : 1; const g = lc.createRadialGradient(lx, ly, 0, lx, ly, L.r * PPM); g.addColorStop(0, `rgba(0,0,0,${0.95 * fl})`); g.addColorStop(1, 'rgba(0,0,0,0)'); lc.fillStyle = g; lc.beginPath(); lc.arc(lx, ly, L.r * PPM, 0, Math.PI * 2); lc.fill(); }
    for (const f of S.fires) { const [fx, fy] = toScreen(f.x, f.y); const rr = (f.r + 3) * PPM; const g = lc.createRadialGradient(fx, fy, 0, fx, fy, rr); g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)'); lc.fillStyle = g; lc.beginPath(); lc.arc(fx, fy, rr, 0, Math.PI * 2); lc.fill(); }
    for (const f of S.flares) { const [fx, fy] = toScreen(f.x, f.y); const g = lc.createRadialGradient(fx, fy, 0, fx, fy, 6 * PPM); g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); lc.fillStyle = g; lc.beginPath(); lc.arc(fx, fy, 6 * PPM, 0, Math.PI * 2); lc.fill(); }
    { const [px, py] = toScreen(p.x, p.y); const g = lc.createRadialGradient(px, py, 0, px, py, 8 * PPM); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)'); lc.fillStyle = g; lc.beginPath(); lc.arc(px, py, 8 * PPM, 0, Math.PI * 2); lc.fill(); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(lightCanvas, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const L of MAP.lights) { const [lx, ly] = toScreen(L.x, L.y); if (lx < -300 || ly < -300 || lx > W + 300 || ly > H + 300) continue; const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, L.r * PPM); g.addColorStop(0, L.warm ? 'rgba(230,126,34,0.22)' : 'rgba(230,140,40,0.14)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, L.r * PPM, 0, Math.PI * 2); ctx.fill(); }
    for (const f of S.fires) { const [fx, fy] = toScreen(f.x, f.y); const rr = (f.r + 3) * PPM; const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, rr); g.addColorStop(0, `rgba(255,120,30,${0.22 + 0.06 * Math.random()})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, rr, 0, Math.PI * 2); ctx.fill(); }
    for (const f of S.flares) { const [fx, fy] = toScreen(f.x, f.y); const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 6 * PPM); g.addColorStop(0, `rgba(255,70,40,${0.35 + 0.1 * Math.random()})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, 6 * PPM, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    // rain
    rainOff = (rainOff + dt * 900) % 60; ctx.strokeStyle = 'rgba(200,215,230,0.07)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < 70; i++) { const x = ((i * 97) % W) + (rainOff * 0.3), y = ((i * 53 + rainOff * 7) % (H + 40)) - 20; ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14); }
    ctx.stroke();
    drawAimPreview(p);
    drawLock(p);
    // touch sticks
    drawStick(input.touches.move, '#e8e6e1');
  }
  function drawLock(p) {
    if (!p) return; const t = performance.now() / 1000; const GOLD = '#f5c242';
    // priority ring: a gold ring on whatever a plain Attack tap will hit; while dragging Attack it jumps to the Hollow under the yellow line
    const ringZ = input.lock == null ? zById(input.prio) : null;
    if (ringZ && !ringZ.dead) { const [zx, zy] = toScreen(ringZ.x, ringZ.y); const r = ringZ.r * PPM + 6; ctx.save(); ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(zx, zy, r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.ellipse(zx, zy + ringZ.r * PPM * 0.35, r * 0.9, r * 0.45, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    // locked target: yellow bracket ring that stays until it dies, you release it, or it gets far away
    const z = zById(input.lock);
    if (z && !z.dead) { const [zx, zy] = toScreen(z.x, z.y); const r = z.r * PPM + 8 + Math.sin(t * 6) * 1.5; ctx.save(); ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(zx, zy, r, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const b = i * Math.PI / 2 + Math.PI / 4; ctx.beginPath(); ctx.arc(zx, zy, r + 5, b - 0.35, b + 0.35); ctx.stroke(); } ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.moveTo(zx, zy - r - 16); ctx.lineTo(zx - 5, zy - r - 24); ctx.lineTo(zx + 5, zy - r - 24); ctx.closePath(); ctx.fill(); ctx.restore(); }
  }
  function drawStick(t, color) { if (!t) return; ctx.strokeStyle = color; ctx.globalAlpha = 0.35; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(t.ox, t.oy, 44, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 0.8; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(t.x, t.y, 18, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }

  /* ---------------- Input ---------------- */
  // Casting: tap a skill = nearest target. Hold and drag (or hold the key and point the mouse) = aim. Drag back onto the button = cancel.
  const KEYMAP = { w: 'up', a: 'left', s: 'down', d: 'right', arrowup: 'up', arrowleft: 'left', arrowdown: 'down', arrowright: 'right' };
  const SLOT_KEYS = { 1: 's', 2: 'd', 3: 'u' };
  let aimState = null; // { slot, src: 'touch' | 'key', aiming, cancel, aim: { ang, x, y }, ox, oy, t0, pointerId }
  const screenToWorld = (sx, sy) => [cam.x + (sx - W / 2) / PPM, cam.y + (sy - H / 2) / PPM];
  function queueCast(slot, aim) { input.casts.push({ slot, aim: aim || null }); }
  function beginAim(slot, src, extra) { if (!S.p || S.mode !== 'game') return; const ab = KITS[S.p.id][slot]; if (S.p.cd[slot] > 0.05 && !(ab.charges && S.p.qCharges > 0)) { if (src === 'touch') sfx('click', 0.2); return; } if (ab.kind === 'instant') { queueCast(slot, null); return; } aimState = Object.assign({ slot, src, aiming: false, cancel: false, aim: null, t0: performance.now() }, extra || {}); }
  const overCancel = (x, y) => { const c = $('btnCancel'); if (c.classList.contains('hidden')) return false; const r = c.getBoundingClientRect(); return x >= r.left - 10 && x <= r.right + 10 && y >= r.top - 10 && y <= r.bottom + 10; };
  function updateTouchAim(x, y) { const a = aimState; if (!a || a.src !== 'touch' || !S.p) return; const dx = x - a.ox, dy = y - a.oy, l = Math.hypot(dx, dy); if (l > 18) a.aiming = true; if (!a.aiming) return; a.cancel = l < 24 || overCancel(x, y); const ab = KITS[S.p.id][a.slot]; const ang = Math.atan2(dy, dx); const range = ab.range || 6; const d = Math.min(1, (l - 18) / 90) * range; a.aim = { ang, x: S.p.x + Math.cos(ang) * d, y: S.p.y + Math.sin(ang) * d }; }
  function endAim(slot) { const a = aimState; if (!a || (slot && a.slot !== slot)) return; aimState = null; if (a.cancel) return; if (!a.aiming) queueCast(a.slot, null); else queueCast(a.slot, a.aim); }
  window.addEventListener('keydown', (e) => { if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return; const k = e.key.toLowerCase(); if (KEYMAP[k]) input.keys[KEYMAP[k]] = true; if (k === ' ') { input.dodge = true; e.preventDefault(); } if (SLOT_KEYS[k] && !e.repeat) beginAim(SLOT_KEYS[k], 'key'); if (k === 'r' && !e.repeat) input.ult = true; if (k === 'f') input.swap = true; if (k === 'b' || k === 'tab') { e.preventDefault(); if (S.mode === 'game') ($('bag').classList.contains('hidden') ? openBag() : closeBag()); } if (k === 'g' && pickupItem) equipFromBag(pickupItem); if (k === 'x') { const p = S.p; if (p) startReload(p, stats(p)); } if (k === 'escape' && aimState) aimState = null; if (k === 'enter' && S.mode === 'summary') startRun(S.survivor); audioInit(); });
  window.addEventListener('keyup', (e) => { const k = e.key.toLowerCase(); if (KEYMAP[k]) input.keys[KEYMAP[k]] = false; if (SLOT_KEYS[k]) endAim(SLOT_KEYS[k]); });
  canvas.addEventListener('mousemove', (e) => { input.mouse.x = e.clientX; input.mouse.y = e.clientY; input.mouseAim = true; });
  canvas.addEventListener('mousedown', (e) => { if (e.button === 0) input.mouse.down = true; audioInit(); });
  window.addEventListener('mouseup', () => { input.mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  // touch on the open screen: left half = move stick, right half = aim stick (auto-fire). Quick taps: right = swap / equip, left = dodge / keep.
  const touchStart = (e) => { audioInit(); for (const t of e.changedTouches) { const side = t.clientX < W / 2 ? 'move' : 'pan'; if (input.touches[side]) continue; input.touches[side] = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY, dx: 0, dy: 0, t0: performance.now(), maxMove: 0 }; } e.preventDefault(); };
  const touchMove = (e) => { for (const t of e.changedTouches) for (const side of ['move', 'pan']) { const s = input.touches[side]; if (s && s.id === t.identifier) { const dx = t.clientX - s.ox, dy = t.clientY - s.oy, l = Math.hypot(dx, dy); s.maxMove = Math.max(s.maxMove, l); s.dx = dx; s.dy = dy; const max = 44; s.x = s.ox + dx * Math.min(1, max / (l || 1)); s.y = s.oy + dy * Math.min(1, max / (l || 1)); } } e.preventDefault(); };
  const touchEnd = (e) => { for (const t of e.changedTouches) for (const side of ['move', 'pan']) { const s = input.touches[side]; if (s && s.id === t.identifier) { input.touches[side] = null; if (performance.now() - s.t0 < 230 && s.maxMove < 12) quickTap(side); } } e.preventDefault(); };
  function quickTap(side) { if (S.mode !== 'game' || S.paused) return; if (pickupItem && side === 'move') hidePickup(); }
  // iOS Safari: kill pinch-zoom, two-finger pans, double-tap zoom and rubber-banding everywhere except on real buttons/links
  const isControl = (t) => !!(t && t.closest && t.closest('button, a, [data-pick], [data-interactive], .bag-card, #select'));
  document.addEventListener('touchstart', (e) => { if (e.touches.length > 1 || !isControl(e.target)) e.preventDefault(); }, { passive: false });
  document.addEventListener('touchmove', (e) => { if (!(e.target && e.target.closest && e.target.closest('.bag-card, #select, .lobby-card, .sum-card'))) e.preventDefault(); }, { passive: false });
  document.addEventListener('touchend', (e) => { if (!isControl(e.target)) e.preventDefault(); }, { passive: false });
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(k => document.addEventListener(k, (e) => e.preventDefault(), { passive: false }));
  document.addEventListener('dblclick', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => { if (!isControl(e.target)) e.preventDefault(); });
  window.addEventListener('scroll', () => window.scrollTo(0, 0));
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  if (isIOS && !standalone) $('a2hs').classList.remove('hidden');
  canvas.addEventListener('touchstart', touchStart, { passive: false }); canvas.addEventListener('touchmove', touchMove, { passive: false }); canvas.addEventListener('touchend', touchEnd, { passive: false }); canvas.addEventListener('touchcancel', touchEnd, { passive: false });
  const press = (id, fn) => { const b = $(id); const h = (e) => { e.preventDefault(); e.stopPropagation(); audioInit(); fn(); }; b.addEventListener('touchstart', h, { passive: false }); b.addEventListener('mousedown', h); };
  press('btnDodge', () => input.dodge = true); press('btnBag', () => { if ($('bag').classList.contains('hidden')) openBag(); else closeBag(); }); press('weaponBox', () => input.swap = true); press('btnR', () => input.ult = true);
  // the skill wheel: pointer events so a drag that leaves the button keeps aiming
  for (const slot of ['s', 'd', 'u']) {
    const b = $('btn' + slot.toUpperCase());
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); audioInit(); if (S.mode !== 'game') return; b.setPointerCapture(e.pointerId); const r = b.getBoundingClientRect(); beginAim(slot, 'touch', { ox: r.left + r.width / 2, oy: r.top + r.height / 2, pointerId: e.pointerId }); if (aimState) updateTouchAim(e.clientX, e.clientY); });
    b.addEventListener('pointermove', (e) => { if (aimState && aimState.pointerId === e.pointerId) updateTouchAim(e.clientX, e.clientY); });
    const up = (e) => { if (aimState && aimState.pointerId === e.pointerId) { updateTouchAim(e.clientX, e.clientY); endAim(slot); } };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', (e) => { if (aimState && aimState.pointerId === e.pointerId) aimState = null; });
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  { // Attack: hold to keep firing at the gold-ringed (nearest) Hollow, or at the Elite you locked. Finger wobble never interrupts it.
    const b = $('btnAttack');
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); audioInit(); b.setPointerCapture(e.pointerId); input.attack = { id: e.pointerId, t0: performance.now() }; });
    const up = (e) => { const a = input.attack; if (a && a.id === e.pointerId) input.attack = null; };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('contextmenu', (e) => e.preventDefault());
    // one button for Elites: tap to lock the nearest Brute / Screamer / Spitter, tap again to unlock
    press('btnSpecial', () => { const p = S.p; if (!p || S.mode !== 'game') return; if (input.lock != null) { input.lock = null; toast('Lock released.', '#9aa4b0'); return; } const z = nearestZombie(p, 30, o => SPECIAL_GLYPH[o.type]); if (!z) { toast('No Elite nearby.', '#9aa4b0'); return; } input.lock = z.id; sfx('pickup', 0.4); });
  }
  function readInput() {
    const k = input.keys; let mx = (k.right ? 1 : 0) - (k.left ? 1 : 0), my = (k.down ? 1 : 0) - (k.up ? 1 : 0);
    const tm = input.touches.move; if (tm) { mx = (tm.x - tm.ox) / 44; my = (tm.y - tm.oy) / 44; }
    input.mx = mx; input.my = my;
    const ta = null; input.aimActive = false; input.fire = false;
    if (input.attack) input.fire = true;
    if (!ta && !input.attack && input.mouseAim && S.p) { const [px, py] = toScreen(S.p.x, S.p.y); input.ax = input.mouse.x - px; input.ay = input.mouse.y - py; input.aimActive = true; input.fire = input.mouse.down; }
    // keyboard aiming: hold the key, point the mouse
    if (aimState && aimState.src === 'key' && S.p) { if (performance.now() - aimState.t0 > 180) { aimState.aiming = true; const [wx, wy] = screenToWorld(input.mouse.x, input.mouse.y); aimState.aim = { ang: Math.atan2(wy - S.p.y, wx - S.p.x), x: wx, y: wy }; } }
    // while aiming a skill by touch, face that way
    if (aimState && aimState.src === 'touch' && aimState.aiming && aimState.aim && !ta && !input.attack) { input.ax = Math.cos(aimState.aim.ang); input.ay = Math.sin(aimState.aim.ang); input.aimActive = true; }
    // camera: Wild Rift aim panning (view leans toward what you're aiming) plus a right-half drag to peek around; eases back when you let go
    { let tx = 0, ty = 0; const tp = input.touches.pan;
      if (tp && tp.maxMove > 12) { tx = clamp(-tp.dx / PPM * 0.9, -7, 7); ty = clamp(-tp.dy / PPM * 0.9, -7, 7); }
      else if (aimState && aimState.src === 'touch' && aimState.aiming && aimState.aim && !aimState.cancel && S.p) { const ab = KITS[S.p.id][aimState.slot]; const k = Math.min(ab.range || 6, 12) * 0.3; tx = Math.cos(aimState.aim.ang) * k; ty = Math.sin(aimState.aim.ang) * k; }
      input.camOff.x = lerp(input.camOff.x, tx, 0.12); input.camOff.y = lerp(input.camOff.y, ty, 0.12); }
    // hand everything to our survivor (in co-op the host reads clients' inputs from the network instead)
    const p = S.p; if (!p) return;
    // lock-on: drop it when the target dies or gets far away; while locked, face it (clients predict this too)
    if (input.lock != null) { const z = zById(input.lock); if (!z || dist(z.x, z.y, p.x, p.y) > 40) { input.lock = null; } else if (!ta) { input.ax = z.x - p.x; input.ay = z.y - p.y; input.aimActive = true; } }
    { const locked = input.lock != null; const sb = $('btnSpecial'); if (sb.dataset.on !== String(locked)) { sb.dataset.on = String(locked); sb.querySelector('.lbl').textContent = locked ? 'Unlock' : 'Elite'; sb.classList.toggle('on', locked); } } $('btnAttack').classList.toggle('locked', input.lock != null); $('btnCancel').classList.toggle('hidden', !(aimState && aimState.src === 'touch' && aimState.aiming)); $('btnCancel').classList.toggle('hot', !!(aimState && aimState.aiming && aimState.cancel)); 
    const pi = p.input; pi.mx = mx; pi.my = my; pi.ax = input.ax; pi.ay = input.ay; pi.aimActive = input.aimActive; pi.mouseAim = !!input.mouseAim; pi.fire = input.fire; pi.lock = input.lock;
    if (input.dodge) { pi.dodge = true; input.dodge = false; } if (input.swap) { pi.swap = true; input.swap = false; } if (input.ult) { pi.ult = true; input.ult = false; }
    while (input.casts.length) pi.casts.push(input.casts.shift());
  }

  /* ---------------- Co-op networking (Supabase Realtime broadcast, host-authoritative) ---------------- */
  // Host runs the whole sim and sends ~10 snapshots a second. Clients move their own survivor locally, send input
  // ~10 times a second, and draw everything else from the latest snapshot (positions eased between snapshots).
  const SB_URL = 'https://wyozxzlcqdaymhoqkemx.supabase.co';
  const SB_KEY = 'sb_publishable_CIdprqCcm-E0FBd0tZUlzQ_6ggCNt3_'; // publishable key: safe to ship, Realtime broadcast only
  const SB_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
  const ZTYPES = Object.keys(HOLLOWS); const MAX_PLAYERS = 4; const SNAP_HZ = 10, IN_HZ = 10;
  const PF = ['x', 'y', 'aim', 'hp', 'maxHp', 'inf', 'downT', 'reviveP', 'stealth', 'shield', 'taunt', 'digIn', 'digX', 'digY', 'breathe', 'boost', 'unchained', 'cyclone', 'rage', 'rageCd', 'focus', 'moveT', 'hurtT', 'acidT', 'swing', 'swingDir', 'mag', 'reserve', 'reloading', 'reloadTotal', 'dodges', 'dodgeRecharge', 'dodgeT', 'invuln', 'qCharges', 'adren', 'longExp', 'finale', 'vx', 'vy', 'slow', 'immune', 'overT', 'deadAir', 'combo', 'grit', 'mom', 'rageM', 'guard'];
  const PB = ['down', 'dead', 'tailwind', 'moving', 'hm', 'ultChain', 'rescue', 'leap'];
  const r2 = (v) => Math.round((+v || 0) * 100) / 100;
  const netNew = { fx: [], decals: [] };
  function netArr(name, base) { const a = base || []; a.push = function (...items) { if (S.coop && S.isHost) { const q = netNew[name]; if (q.length < 160) q.push(...items); } return Array.prototype.push.apply(this, items); }; return a; }
  const serItem = (it) => Object.assign({}, it, { rar: RARITY.indexOf(it.rar) });
  const deserItem = (it) => Object.assign({}, it, { rar: RARITY[it.rar] || RARITY[0] });
  function serGear(p) { return { w: { primary: serItem(p.weapons.primary), melee: serItem(p.weapons.melee) }, b: p.bag.map(serItem), a: Object.fromEntries(Object.entries(p.armor).map(([k, it]) => [k, serItem(it)])), sc: p.scrap, f: p.found.map(serItem), v: p.gearVer || 0 }; }
  function applyGear(p, g) { p.weapons = { primary: deserItem(g.w.primary), melee: deserItem(g.w.melee) }; p.bag = g.b.map(deserItem); p.armor = Object.fromEntries(Object.entries(g.a).map(([k, it]) => [k, deserItem(it)])); p.scrap = g.sc; p.found = g.f.map(deserItem); p.gearVer = g.v; if (p === S.p) { renderBag(); if (pickupItem && !p.bag.includes(pickupItem)) hidePickup(); } }
  function serZombie(z) { const fl = (z.aware ? 1 : 0) | (z.hurt > 0 ? 2 : 0) | (z.stag > 0 ? 4 : 0) | (z.marked > 0 ? 8 : 0) | (z.pinned > 0 ? 16 : 0) | (z.zapped > 0 ? 32 : 0) | (z.exposed > 0 ? 64 : 0) | (z.taunted > 0 ? 128 : 0) | (z.slow > 0 ? 256 : 0) | (z.screamed ? 512 : 0) | (z.flare ? 1024 : 0); return [z.id, ZTYPES.indexOf(z.type), r2(z.x), r2(z.y), Math.round(z.hp), Math.round(z.maxHp), r2(z.face), fl, z.burn || 0, z.screamT == null ? null : r2(z.screamT), z.spitWind == null ? null : r2(z.spitWind), z.windup == null ? null : r2(z.windup)]; }
  function applyZombies(list) { const map = new Map(S.zombies.map(z => [z.id, z])); const next = []; for (const a of list) { const [id, ti, x, y, hp, maxHp, face, fl, burn, sT, sW, wu] = a; let z = map.get(id); const type = ZTYPES[ti] || 'walker'; if (!z) { z = { id, type, d: HOLLOWS[type], r: HOLLOWS[type].r, x, y, kx: 0, ky: 0, atk: 0 }; } z.tx = x; z.ty = y; z.hp = hp; z.maxHp = maxHp; z.face = face; z.aware = !!(fl & 1); z.hurt = fl & 2 ? 0.12 : 0; z.stag = fl & 4 ? 1 : 0; z.marked = fl & 8 ? 1 : 0; z.pinned = fl & 16 ? 1 : 0; z.zapped = fl & 32 ? 1 : 0; z.exposed = fl & 64 ? 1 : 0; z.taunted = fl & 128 ? 1 : 0; z.slow = fl & 256 ? 1 : 0; z.screamed = !!(fl & 512); z.flare = fl & 1024 ? true : null; z.burn = burn; z.burnT = burn ? 1 : 0; z.screamT = sT; z.spitWind = sW; z.windup = wu; next.push(z); } S.zombies = next; }
  function serPlayer(p) { const bits = PB.reduce((m, k, i) => m | (p[k] ? 1 << i : 0), 0); return [p.sid, PF.map(k => r2(p[k])), bits, r2(p.cd.s), r2(p.cd.d), r2(p.cd.u), p.slot === 'melee' ? 1 : 0, [p.st.k, Math.round(p.st.dmg), Math.round(p.st.taken), Math.round(p.st.heal), p.st.rev, p.st.downs, p.found.length, p.scrap, p.st.q || 0], [p.mcAvail.d ?? -1, p.mcAvail.u ?? -1]]; }
  function applyPlayer(a) { const [sid, vals, bits, cs, cd, cu, slot, stt, mc] = a; const p = S.players.find(o => o.sid === sid); if (!p) return; if (mc) { if (mc[0] >= 0) p.mcAvail.d = mc[0]; if (mc[1] >= 0) p.mcAvail.u = mc[1]; } if (stt) { p.st = { k: stt[0], dmg: stt[1], taken: stt[2], heal: stt[3], rev: stt[4], downs: stt[5] }; p.foundN = stt[6]; p.scrapN = stt[7]; p.st.q = stt[8] || 0; } const mine = p === S.p; const hm = !!(bits & (1 << PB.indexOf('hm'))); PF.forEach((k, i) => { if (mine && !hm && (k === 'x' || k === 'y')) return; if (mine && (k === 'aim' || k === 'dodgeT' || k === 'vx' || k === 'vy')) return; if (!mine && (k === 'x' || k === 'y')) { p[k === 'x' ? 'tx' : 'ty'] = vals[i]; if (p.tx != null && p.ty != null && dist(p.tx, p.ty, p.x, p.y) > 4) { p.x = p.tx; p.y = p.ty; } return; } p[k] = vals[i]; }); PB.forEach((k, i) => { if (mine && k === 'moving') return; p[k] = !!(bits & (1 << i)); }); if (mine && hm) { p.x = vals[PF.indexOf('x')]; p.y = vals[PF.indexOf('y')]; } p.cd.s = cs; p.cd.d = cd; p.cd.u = cu; p.slot = slot ? 'melee' : 'primary'; }
  const copyList = (arr, keys) => arr.map(o => { const r = {}; for (const k of keys) if (o[k] !== undefined) r[k] = typeof o[k] === 'number' ? r2(o[k]) : o[k]; return r; });
  function buildSnap(gearSent) {
    const gear = {}; for (const p of S.players) if ((p.gearVer || 0) !== (gearSent[p.sid] ?? -1)) { gear[p.sid] = serGear(p); gearSent[p.sid] = p.gearVer || 0; }
    for (const l of S.loot) if (!l.id) l.id = ++S.lid;
    const snap = { t: r2(S.time), w: S.wave, k: S.kills, dd: Math.round(S.dmgDealt), m: S.mode, res: S.result, ex: S.extractOpen, sh: r2(S.shake), ch: S.chems, q: S.quest ? { d: S.quest.done, b: S.quest.bonus, it: S.quest.items.map(q => [q.id, q.key, r2(q.x), r2(q.y), q.got ? 1 : 0, r2(q.prog), q.by]) } : null,
      z: S.zombies.filter(z => !z.dead).map(serZombie), p: S.players.map(serPlayer),
      l: S.loot.map(l => [l.id, r2(l.x), r2(l.y), serItem(l.item)]),
      fi: copyList(S.fires, ['x', 'y', 'r', 't', 'max', 'wall', 'sid']), tu: copyList(S.turrets, ['x', 'y', 'aim', 't', 'ult', 'sid', 'hp', 'maxHp', 'repT', 'range']), mi: copyList(S.mines, ['x', 'y', 'arm', 't']),
      sp: copyList(S.spits, ['x', 'y', 'tx', 'ty', 't', 'life', 'r']), po: copyList(S.pools, ['x', 'y', 'r', 't', 'max']), fl: copyList(S.flares, ['x', 'y', 't']),
      zn: copyList(S.zones, ['kind', 'x', 'y', 'r', 't', 'max', 'sid']), th: copyList(S.throws, ['kind', 'x', 'y', 'tx', 'ty', 't', 'life', 'sid']), ba: copyList(S.barricades, ['x', 'y', 'r', 't', 'max']),
      fx: netNew.fx.splice(0).map(f => Object.assign({}, f, { t: 0 })), de: netNew.decals.splice(0), ev: netEv.splice(0), sf: netSfx.splice(0), gear };
    return snap;
  }
  function applySnap(snap) {
    const wasMode = S.mode; S.time = snap.t; S.wave = snap.w; S.kills = snap.k; S.dmgDealt = snap.dd; S.extractOpen = snap.ex; S.shake = Math.max(S.shake, snap.sh); S.chems = snap.ch; S.result = snap.res;
    if (snap.q) { const prevDone = S.quest ? S.quest.done : -1; const prevN = S.quest ? S.quest.items.length : -1; const old = new Map((S.quest ? S.quest.items : []).map(q => [q.id, q])); S.quest = { done: snap.q.d, bonus: snap.q.b, total: snap.q.it.length, items: snap.q.it.map(([id, key, x, y, got, prog, by]) => ({ id, key, x, y, got: !!got, prog, by, t: (old.get(id) || {}).t || 0 })) }; if (prevDone !== S.quest.done || prevN !== S.quest.items.length) renderQuestHud(); }
    for (const sid in snap.gear) { const p = S.players.find(o => o.sid === +sid); if (p) applyGear(p, snap.gear[sid]); }
    applyZombies(snap.z); snap.p.forEach(applyPlayer);
    const lmap = new Map(S.loot.map(l => [l.id, l])); S.loot = snap.l.map(([id, x, y, it]) => { const old = lmap.get(id); if (old) { old.tx = x; old.ty = y; old.item = deserItem(it); return old; } return { id, x, y, tx: x, ty: y, t: 0, item: deserItem(it) }; });
    S.fires = snap.fi; S.turrets = snap.tu; S.mines = snap.mi; S.spits = snap.sp; S.pools = snap.po; S.flares = snap.fl; S.zones = snap.zn; S.throws = snap.th; S.barricades = snap.ba;
    for (const f of snap.fx) S.fx.push(f); for (const d of snap.de) S.decals.push(d); while (S.decals.length > 220) S.decals.shift();
    for (const ev of snap.ev) { if (ev.sid !== -1 && ev.sid !== S.mySid) continue; if (ev.k === 'toast') toast(ev.html, ev.color); else if (ev.k === 'obj') objective(ev.text, ev.alert, ev.secs); else if (ev.k === 'pickup' && S.p) { const it = S.p.bag[ev.i]; if (it) { $('btnBag').classList.add('new'); showPickup(it); } } }
    for (const [sid, kind, vol] of snap.sf) if (sid === -1 || sid === S.mySid) sfx(kind, vol);
    if (snap.m === 'summary' && wasMode === 'game') { S.mode = 'summary'; showSummary(snap.res.success, snap.res.why); }
  }
  // client-side frame: own movement, easing, timers, HUD
  const pending = { dodge: false, swap: false, ult: false, casts: [] };
  function clientTick(dt) {
    if (S.mode !== 'game') return; const p = S.p; if (!p) return; const inp = p.input;
    if (pickupItem) { pickupT -= dt; if (pickupT <= 0) hidePickup(); }
    S.time += dt; const st = stats(p); p.maxHp = st.maxHp;
    if (p.dodgeT > 0) p.dodgeT = Math.max(0, p.dodgeT - dt);
    let mx = inp.mx, my = inp.my; const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; } p.moving = ml > 0.1;
    if (!p.down && !p.dead && !p.hm) { if (p.dodgeT > 0) moveEntity(p, p.ddx * 12 * dt, p.ddy * 12 * dt); else moveEntity(p, mx * 4.2 * st.spd * dt, my * 4.2 * st.spd * dt); }
    p.vx = mx * 4.2 * st.spd; p.vy = my * 4.2 * st.spd;
    if (inp.aimActive) { const a = Math.atan2(inp.ay, inp.ax); if (Number.isFinite(a)) p.aim = a; } else if (p.moving) p.aim = Math.atan2(my, mx);
    if (inp.fire && !inp.aimActive) { const z = nearestZombie(p, st.range + 1); if (z) p.aim = angTo(p, z.x, z.y); }
    if (inp.dodge) { inp.dodge = false; if (p.dodges > 0 && p.dodgeT <= 0 && !p.down) { pending.dodge = true; p.dodgeT = 0.25; p.ddx = ml > 0.1 ? mx : Math.cos(p.aim); p.ddy = ml > 0.1 ? my : Math.sin(p.aim); sfx('melee', 0.5); } }
    if (inp.swap) { inp.swap = false; pending.swap = true; } if (inp.ult) { inp.ult = false; pending.ult = true; }
    while (inp.casts.length) pending.casts.push(inp.casts.shift());
    const k = Math.min(1, dt * 14);
    for (const z of S.zombies) { if (z.tx != null) { z.x = lerp(z.x, z.tx, k); z.y = lerp(z.y, z.ty, k); } if (z.hurt > 0) z.hurt -= dt; }
    for (const o of S.players) { if (o !== p && o.tx != null) { o.x = lerp(o.x, o.tx, k); o.y = lerp(o.y, o.ty, k); } }
    questTick(dt);
    for (const l of S.loot) { l.t += dt; if (l.tx != null) { l.x = lerp(l.x, l.tx, k); l.y = lerp(l.y, l.ty, k); } }
    for (const f of S.fx) { f.t += dt; if (f.kind === 'blood') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.9; f.vy *= 0.9; } else if (f.kind === 'flame') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.93; f.vy *= 0.93; } }
    S.fx = S.fx.filter(f => f.t < f.life); for (const th of S.throws) th.t += dt; for (const sp of S.spits) sp.t += dt;
    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 2);
    if (objT > 0) { objT -= dt; if (objT <= 0) $('objective').classList.remove('show'); }
    if (p.hp / p.maxHp < 0.3 && !p.down) { S.lowBeep -= dt; if (S.lowBeep <= 0) { sfx('beep'); S.lowBeep = p.hp / p.maxHp < 0.15 ? 0.45 : 0.8; } }
    cam.x = lerp(cam.x, p.x + input.camOff.x, 8 * dt); cam.y = lerp(cam.y, p.y + input.camOff.y, 8 * dt); updateHUD(p, st);
    if (net.lastSnap && performance.now() - net.lastSnap > 7000) { net.lastSnap = 0; toast('<b>Lost the host.</b> Back to the title screen.', '#bf2618'); setTimeout(() => net.leave(), 1200); }
  }
  const ROOM_ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const net = {
    active: false, host: false, final: 0, ch: null, sb: null, code: null, public: false, mm: null, mmBusy: false, joinWait: null, autoT: 0, autoTimer: null, uid: Math.random().toString(36).slice(2, 8), lobby: [], lastSnap: 0, timers: [], gearSent: {}, lastSend: 0, lastSnapSend: 0, status: '',
    async load() { if (window.supabase) return; await new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = SB_CDN; sc.onload = res; sc.onerror = () => rej(new Error('Could not load the networking library.')); document.head.appendChild(sc); }); },
    async connect(code, host) {
      this.setStatus('Connecting…'); await this.load();
      if (!this.sb) this.sb = window.supabase.createClient(SB_URL, SB_KEY, { realtime: { params: { eventsPerSecond: 40 } } });
      if (this.ch) { try { this.sb.removeChannel(this.ch); } catch (e) {} }
      this.code = code; this.host = host; this.active = true; this.lobby = host ? [{ uid: this.uid, sid: 0, name: 'Host', id: null }] : []; S.mySid = host ? 0 : -1; this.stopAuto();
      const ch = this.sb.channel('np-' + code, { config: { broadcast: { self: false, ack: false } } }); this.ch = ch;
      ch.on('broadcast', { event: '*' }, (msg) => this.onMsg(msg.event, msg.payload));
      await new Promise((res, rej) => { const to = setTimeout(() => rej(new Error('Connection timed out.')), 12000); ch.subscribe((status, err) => { if (status === 'SUBSCRIBED') { clearTimeout(to); res(); } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { clearTimeout(to); rej(err || new Error('Realtime channel error: ' + status)); } }); });
      this.setStatus(host ? 'Room open. Share the code.' : 'Finding the host…');
      this.timers.push(setInterval(() => this.tick(), 1000));
      if (!host) this.send('join', { uid: this.uid });
      show('lobby'); S.mode = 'lobby'; this.renderLobby();
    },
    send(event, payload) { if (!this.ch) return; try { this.ch.send({ type: 'broadcast', event, payload }); } catch (e) {} },
    setStatus(t) { this.status = t; const el = $('lobbyStatus'); if (el) el.textContent = t; },
    tick() { // once a second: host re-sends the lobby, client re-asks to join until it is listed; both watch for silence
      if (!this.active) return;
      if (S.mode === 'lobby' || S.mode === 'select') { if (this.host) this.send('lobby', { players: this.lobby, pub: this.public, at: this.autoT }); else if (S.mySid < 0) this.send('join', { uid: this.uid }); }
      if (this.host && S.mode === 'game') { const now = performance.now(); for (const p of S.players) { if (p !== S.p && !p.dead && p.lastIn && now - p.lastIn > 8000) { p.dead = true; p.down = false; p.lostLink = true; toast(`<b>${p.name}</b> lost connection.`, '#bf2618'); if (!S.players.some(o => !o.down && !o.dead)) endRun(false, 'downed'); } } }
    },
    onMsg(event, m) {
      if (!m) return;
      if (this.host) {
        if (event === 'join') { let e = this.lobby.find(x => x.uid === m.uid); if (!e) { if (this.lobby.length >= MAX_PLAYERS || S.mode === 'game') { this.send('full', { uid: m.uid }); return; } const used = new Set(this.lobby.map(x => x.sid)); let sid = 1; while (used.has(sid)) sid++; e = { uid: m.uid, sid, name: 'Guest ' + sid, id: null }; this.lobby.push(e); } this.send('lobby', { players: this.lobby, pub: this.public, at: this.autoT }); this.renderLobby(); }
        else if (event === 'pick') { const e = this.lobby.find(x => x.uid === m.uid); if (e && !this.lobby.some(x => x.id === m.id && x.uid !== m.uid)) { e.id = m.id; e.ready = false; } this.send('lobby', { players: this.lobby, pub: this.public, at: this.autoT }); this.renderLobby(); }
        else if (event === 'ready') { const e = this.lobby.find(x => x.uid === m.uid); if (e && e.id) e.ready = !!m.ready; this.send('lobby', { players: this.lobby, pub: this.public, at: this.autoT }); this.renderLobby(); }
        else if (event === 'leave') { const i = this.lobby.findIndex(x => x.uid === m.uid); if (i >= 0) { const e = this.lobby[i]; this.lobby.splice(i, 1); const p = S.players.find(o => o.sid === e.sid); if (p && S.mode === 'game' && !p.dead) { p.dead = true; p.down = false; toast(`<b>${p.name}</b> left the run.`, '#bf2618'); if (!S.players.some(o => !o.down && !o.dead)) endRun(false, 'downed'); } this.send('lobby', { players: this.lobby, pub: this.public, at: this.autoT }); this.renderLobby(); } }
        else if (event === 'in') { this.onIn(m); }
        else if (event === 'act') { const p = S.players.find(o => o.sid === m.sid); if (!p) return; const it = p.bag[m.i]; if (!it) return; if (m.a === 'equip') equipFromBag(it, p); else if (m.a === 'salvage') salvageFromBag(it, p); }
      } else {
        if (event === 'lobby') { this.lobby = m.players; const me = this.lobby.find(x => x.uid === this.uid); S.mySid = me ? me.sid : -1; if (me && this.joinWait) { const w = this.joinWait; this.joinWait = null; w(true); } this.public = !!m.pub; if (me) this.setStatus(!me.id ? 'Choose your survivor.' : me.ready ? (m.at > 0 ? `Everyone is ready. Starting in ${m.at} s.` : 'Ready. Waiting for the host to start.') : 'Tap Ready up when you are set.'); if (S.mode === 'lobby') this.renderLobby(); }
        else if (event === 'full') { if (m.uid === this.uid) { if (this.joinWait) { const w = this.joinWait; this.joinWait = null; w(false); return; } this.setStatus('That room is full or already running.'); setTimeout(() => this.leave(), 1500); } }
        else if (event === 'start') { const me = m.roster.find(r => r.sid === S.mySid); if (!me) return; S.coop = true; S.isHost = false; S.isClient = true; this.lastSnap = performance.now(); this.gearSent = {}; startRun(me.id, m.roster); }
        else if (event === 'snap') { if (S.isClient && S.mode === 'game') { this.lastSnap = performance.now(); applySnap(m); } else if (S.isClient && S.mode === 'summary' && m.m === 'game') { /* host restarted before our start message: ignore */ } }
        else if (event === 'tolobby') { if (S.coop) { S.mode = 'lobby'; show('lobby'); this.renderLobby(); } }
      }
    },
    onIn(m) { const p = S.players.find(o => o.sid === m.sid); if (!p || p === S.p) return; p.lastIn = performance.now(); const pi = p.input; pi.mx = +m.mx || 0; pi.my = +m.my || 0; pi.ax = +m.ax || 0; pi.ay = +m.ay || 0; pi.aimActive = !!m.aa; pi.fire = !!m.f; pi.lock = Number.isFinite(m.lk) ? m.lk : null; if (m.dg) pi.dodge = true; if (m.sw) pi.swap = true; if (m.ul) pi.ult = true; if (Array.isArray(m.c)) for (const c of m.c) if (c && KITS[p.id][c.slot]) pi.casts.push({ slot: c.slot, aim: c.aim || null }); if (!p.hm && !p.down && !p.dead && Number.isFinite(m.x) && Number.isFinite(m.y)) { const nx = clamp(m.x, 0.5, MAP.w - 0.5), ny = clamp(m.y, 0.5, MAP.h - 0.5); if (dist(nx, ny, p.x, p.y) < 8 && !solidAt(nx, ny, p.r * 0.5)) { p.x = nx; p.y = ny; } } if (Number.isFinite(m.aim)) p.aim = m.aim; },
    // called every frame from the loop
    pump() {
      if (!this.active) return; const now = performance.now();
      if (this.host) { if ((S.mode === 'game' || this.final > 0) && now - this.lastSnapSend >= 1000 / SNAP_HZ) { this.lastSnapSend = now; this.send('snap', buildSnap(this.gearSent)); if (S.mode !== 'game') this.final--; } }
      else if (S.mode === 'game' && S.p && now - this.lastSend >= 1000 / IN_HZ) { this.lastSend = now; const p = S.p, pi = p.input; this.send('in', { sid: S.mySid, x: r2(p.x), y: r2(p.y), aim: r2(p.aim), mx: r2(pi.mx), my: r2(pi.my), ax: r2(pi.ax), ay: r2(pi.ay), aa: pi.aimActive, f: pi.fire, lk: pi.lock, dg: pending.dodge, sw: pending.swap, ul: pending.ult, c: pending.casts.splice(0) }); pending.dodge = pending.swap = pending.ult = false; }
    },
    act(a) { this.send('act', Object.assign({ sid: S.mySid }, a)); },
    pick(id) { if (this.host) { const me = this.lobby.find(x => x.uid === this.uid); if (this.lobby.some(x => x.id === id && x.uid !== this.uid)) { toast(`${SURVIVORS[id].name} is taken.`, '#e67e22'); return; } me.id = id; me.ready = false; this.send('lobby', { players: this.lobby, pub: this.public, at: this.autoT }); } else this.send('pick', { uid: this.uid, id }); S.mode = 'lobby'; show('lobby'); this.renderLobby(); },
    start() { if (!this.allReady()) { this.renderLobby(); return; } this.stopAuto(); const ready = this.lobby.filter(x => x.id); const roster = ready.map(x => ({ sid: x.sid, id: x.id, name: SURVIVORS[x.id].name })); S.coop = true; S.isHost = true; S.isClient = false; S.mySid = 0; this.gearSent = {}; this.send('start', { roster }); setTimeout(() => this.send('start', { roster }), 400); startRun(roster.find(r => r.sid === 0).id, roster); for (const p of S.players) p.lastIn = performance.now() + 4000; this.publish(); },
    toggleReady() { const me = this.lobby.find(x => x.uid === this.uid); if (!me || !me.id) return; if (this.host) { me.ready = !me.ready; this.send('lobby', { players: this.lobby, pub: this.public, at: this.autoT }); this.renderLobby(); } else { me.ready = !me.ready; this.send('ready', { uid: this.uid, ready: me.ready }); this.renderLobby(); } },
    allReady() { const picked = this.lobby.filter(x => x.id); return picked.length > 0 && picked.length === this.lobby.length && picked.every(x => x.ready); },
    // ---- matchmaking: a presence channel acts as the room directory (no tables, no auth) ----
    async mmChannel() { await this.load(); if (!this.sb) this.sb = window.supabase.createClient(SB_URL, SB_KEY, { realtime: { params: { eventsPerSecond: 40 } } }); if (this.mm) return this.mm; const ch = this.sb.channel('np-mm', { config: { presence: { key: this.uid } } }); this.mm = ch; this.mmSynced = false; ch.on('presence', { event: 'sync' }, () => { this.mmSynced = true; }); await new Promise((res, rej) => { const to = setTimeout(() => rej(new Error('Matchmaking timed out.')), 12000); ch.subscribe((st, err) => { if (st === 'SUBSCRIBED') { clearTimeout(to); res(); } else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') { clearTimeout(to); rej(err || new Error('Matchmaking channel error.')); } }); }); return ch; },
    openRooms() { if (!this.mm) return []; const st = this.mm.presenceState(); const out = []; for (const k in st) for (const e of st[k]) { if (e && e.code && e.open && e.n < MAX_PLAYERS && k !== this.uid) out.push(e); } return out.sort((a, b) => b.n - a.n || a.t - b.t); },
    async publish() { if (!this.host || !this.active) return; if (!this.public) { this.unlist(); return; } try { const ch = await this.mmChannel(); await ch.track({ code: this.code, n: this.lobby.length, open: S.mode === 'lobby' || S.mode === 'select', t: Date.now() }); } catch (e) {} },
    unlist() { if (this.mm) { try { this.mm.untrack(); } catch (e) {} } },
    setPublic(v) { this.public = !!v; this.publish(); this.send('lobby', { players: this.lobby, pub: this.public, at: this.autoT }); this.renderLobby(); if (!v) this.stopAuto(); },
    tryJoin(code) { return new Promise(async (res) => { let done = false; const finish = (ok) => { if (done) return; done = true; this.joinWait = null; res(ok); }; this.joinWait = finish; const to = setTimeout(() => finish(false), 5000); try { await this.connect(code, false); } catch (e) { clearTimeout(to); finish(false); } }); },
    async quickMatch() {
      if (this.mmBusy) return; this.mmBusy = true; $('mmStatus').textContent = 'Looking for a party…'; $('mmStatus').classList.remove('hidden');
      try {
        await this.mmChannel(); for (let i = 0; i < 30 && !(this.mmSynced && Object.keys(this.mm.presenceState()).length); i++) await new Promise(r => setTimeout(r, 100)); await new Promise(r => setTimeout(r, 200)); // wait for the directory to sync (3 s cap when nobody is hosting)
        const rooms = this.openRooms(); let joined = false;
        for (const r of rooms) { $('mmStatus').textContent = `Joining room ${r.code}…`; if (await this.tryJoin(r.code)) { joined = true; break; } this.leaveQuiet(); }
        if (!joined) { $('mmStatus').textContent = 'No open party. Opening one…'; const code = Array.from({ length: 4 }, () => ROOM_ALPHA[(Math.random() * ROOM_ALPHA.length) | 0]).join(''); await this.connect(code, true); this.public = true; await this.publish(); this.renderLobby(); }
        $('mmStatus').classList.add('hidden');
      } catch (e) { $('mmStatus').classList.add('hidden'); this.leave(); toast(`<b>Matchmaking failed.</b> ${e.message}`, '#bf2618'); }
      this.mmBusy = false;
    },
    leaveQuiet() { if (this.ch && !this.host) this.send('leave', { uid: this.uid }); this.timers.forEach(clearInterval); this.timers = []; if (this.ch && this.sb) { try { this.sb.removeChannel(this.ch); } catch (e) {} } this.ch = null; this.active = false; this.host = false; this.lobby = []; S.mySid = -1; },
    // public rooms start on their own once everyone present is ready (host can still start sooner)
    startAuto() { if (this.autoTimer || !this.host || !this.public) return; this.autoT = 10; this.autoTimer = setInterval(() => { if (!this.allReady() || !this.public || S.mode !== 'lobby') { this.stopAuto(); this.renderLobby(); return; } this.autoT--; if (this.autoT <= 0) { this.stopAuto(); this.start(); return; } this.renderLobby(); }, 1000); },
    stopAuto() { if (this.autoTimer) clearInterval(this.autoTimer); this.autoTimer = null; this.autoT = 0; },
    restart() { if (this.host) this.start(); },
    toLobby(broadcast) { S.mode = 'lobby'; show('lobby'); if (this.host) { this.lobby.forEach(x => x.ready = false); setTimeout(() => this.publish(), 50); if (broadcast) this.send('tolobby', {}); this.send('lobby', { players: this.lobby, pub: this.public, at: this.autoT }); } this.renderLobby(); },
    renderLobby() {
      $('lobbyCode').textContent = this.code || '----'; const me = this.lobby.find(x => x.uid === this.uid);
      if (this.host) { const sig = `${this.lobby.length}|${this.public}|${S.mode}`; if (sig !== this.pubSig) { this.pubSig = sig; this.publish(); } if (this.public && this.allReady() && this.lobby.length >= 2) this.startAuto(); else if (!this.allReady()) this.stopAuto(); }
      $('btnPublic').classList.toggle('hidden', !this.host); $('btnPublic').textContent = this.public ? 'Listed for Quick match · tap to make private' : 'Private · tap to list for Quick match'; $('btnPublic').classList.toggle('ready-on', this.public);
      $('lobbyKind').textContent = this.public ? 'Public party · anyone can Quick match in' : 'Private room · invite link or code';
      const rows = []; for (let sid = 0; sid < MAX_PLAYERS; sid++) { const e = this.lobby.find(x => x.sid === sid); if (!e) { rows.push(`<div class="lob empty"><span>Open slot</span></div>`); continue; } const d = e.id ? SURVIVORS[e.id] : null; rows.push(`<div class="lob ${e.uid === this.uid ? 'me' : ''}" style="--c:${d ? d.color : '#6b6f75'}">${d ? `<img src="./assets/${e.id}-sm.jpg" alt="">` : '<i class="ph"></i>'}<div><div class="lob-name">${d ? d.name : 'Choosing…'}${e.uid === this.uid ? ' <small>(you)</small>' : ''}</div><div class="lob-sub">${e.name}${d ? ' · ' + d.role : ''}</div></div><span class="rdy ${e.ready ? 'on' : ''}">${e.ready ? 'Ready' : d ? 'Not ready' : '…'}</span></div>`); }
      $('lobbyList').innerHTML = rows.join('');
      const picked = this.lobby.filter(x => x.id), waiting = this.lobby.filter(x => !x.ready); const all = this.allReady();
      $('btnLobbyStart').classList.toggle('hidden', !this.host); $('btnLobbyStart').disabled = !all; $('btnLobbyStart').textContent = all ? (this.autoTimer ? `Start now · auto in ${this.autoT} s` : `Start run · ${picked.length} survivor${picked.length === 1 ? '' : 's'}`) : !(me && me.id) ? 'Pick a survivor first' : !(me && me.ready) ? 'Ready up first' : `Waiting for ${waiting.map(x => x.id ? SURVIVORS[x.id].name : x.name).join(', ')}`;
      $('btnLobbyReady').classList.toggle('hidden', !(me && me.id)); $('btnLobbyReady').textContent = me && me.ready ? 'Ready ✓ (tap to undo)' : 'Ready up'; $('btnLobbyReady').classList.toggle('ready-on', !!(me && me.ready));
      if (this.host) this.setStatus(all ? (this.autoTimer ? `Everyone is ready. Starting in ${this.autoT} s.` : 'Everyone is ready.') : picked.length < this.lobby.length ? 'Waiting for everyone to pick a survivor.' : 'Waiting for everyone to ready up.');
      $('btnLobbyPick').textContent = me && me.id ? 'Change survivor' : 'Choose survivor';
      $('lobbyHint').textContent = this.host ? 'Share the room code. Everyone picks a survivor, then you start the run. No two players can take the same survivor.' : 'Pick a survivor and wait for the host. The host sees your pick in their lobby.';
      // duo perks preview
      const ids = this.lobby.map(x => x.id).filter(Boolean); const perks = DUO_PERKS.filter(dp => dp.pair.every(id => ids.includes(id)));
      $('lobbyPerks').innerHTML = perks.length ? `<div class="eyebrow">Squad perks</div>` + perks.map(dp => `<div class="perk"><b>${dp.name}</b> <span>${dp.text}</span></div>`).join('') : (ids.length > 1 ? '<div class="hint">No squad perks for this combination yet.</div>' : '');
    },
    leave() { this.stopAuto(); this.unlist(); if (this.ch && !this.host) this.send('leave', { uid: this.uid }); this.timers.forEach(clearInterval); this.timers = []; if (this.ch && this.sb) { try { this.sb.removeChannel(this.ch); } catch (e) {} } this.ch = null; this.active = false; this.host = false; this.lobby = []; S.coop = false; S.isHost = true; S.isClient = false; S.mySid = 0; S.mode = 'title'; show('title'); },
  };
  window.addEventListener('beforeunload', () => { if (net.active && !net.host) net.send('leave', { uid: net.uid }); });
  const DUO_PERKS = [
    { pair: ['shadow', 'savage'], key: 'brothers', name: "Brothers' Keeper", text: 'Shadow and Savage within 8 m of each other: +10% damage. A brother going down triggers Savage\'s Rage and refreshes Shadow\'s Ghost Step.' },
    { pair: ['shadow', 'buck'], key: 'cleanslate', name: 'Clean Slate', text: 'Buck taunts, Shadow executes: Execute hits taunted Hollows for +25%.' },
    { pair: ['shadow', 'hush'], key: 'marked', name: 'Marked for Death', text: 'Marked Hollows take +15% from Shadow; killing one shaves an extra 1 s off Execute.' },
    { pair: ['shadow', 'flight'], key: 'ghost', name: 'Ghost Runners', text: 'Both move 8% faster while neither has been hit for 4 s.' },
    { pair: ['wolf', 'buck'], key: 'frontline', name: 'Frontline Medicine', text: 'Field Dressing on Buck also raises his Riot Stance shield for 4 s.' },
    { pair: ['wolf', 'savage'], key: 'triage', name: 'Triage Under Fire', text: 'Wolf heals Savage for +50% while Savage is in Rage.' },
    { pair: ['wolf', 'flight'], key: 'ambulance', name: 'Ambulance', text: 'Flight revives anyone in 1 s; Wolf carries a third Field Dressing charge.' },
    { pair: ['wolf', 'torch'], key: 'burnward', name: 'Burn Ward', text: 'Allies standing in Torch\'s fire inside an Antiviral Cloud heal 5%/s.' },
    { pair: ['buck', 'hush'], key: 'spotter', name: 'Spotter', text: 'Hush builds Focus twice as fast per hit while Buck has Hollows taunted.' },
    { pair: ['buck', 'fuse'], key: 'hardpoint', name: 'Hardpoint', text: 'Turrets within 3 m of Buck while he holds Riot Stance fire 25% faster; Hold the Line barricades last 12 s instead of 8.' },
    { pair: ['buck', 'torch'], key: 'firewall', name: 'Firewall', text: 'Fire Break laid along a barricade line burns for 12 s instead of 6.' },
    { pair: ['flight', 'torch'], key: 'moth', name: 'Moth to Flame', text: 'Hollows pulled by Flare Run take +20% burn damage.' },
    { pair: ['flight', 'buck'], key: 'livebait', name: 'Live Bait', text: 'Hollows pulled by Flight\'s flare count as taunted for 3 s (feeds Clean Slate and Spotter).' },
    { pair: ['flight', 'hush'], key: 'overwatch', name: 'Overwatch', text: 'Headshot on a Hollow within 6 m of Flight refunds one of Flight\'s dodges.' },
    { pair: ['savage', 'torch'], key: 'scorched', name: 'Scorched Earth', text: 'Ground Pound in Torch\'s fire spreads Burn to every Hollow hit.' },
    { pair: ['savage', 'fuse'], key: 'breaker', name: 'Breaker', text: 'Arc-stunned Hollows take +30% from Ground Pound.' },
    { pair: ['fuse', 'hush'], key: 'relay', name: 'Targeting Relay', text: 'Turrets prioritise Marked Hollows and hit them for +20%.' },
    { pair: ['fuse', 'torch'], key: 'backlight', name: 'Backlight', text: 'Turrets standing in Torch\'s fire set the Hollows they shoot on fire.' },
  ];
  // title / lobby buttons
  $('btnQuick').addEventListener('click', async () => { audioInit(); tryLandscape(); net.quickMatch(); }); $('btnPublic').addEventListener('click', () => net.setPublic(!net.public));
  $('btnHost').addEventListener('click', async () => { audioInit(); tryLandscape(); const code = Array.from({ length: 4 }, () => ROOM_ALPHA[(Math.random() * ROOM_ALPHA.length) | 0]).join(''); try { await net.connect(code, true); } catch (e) { net.leave(); toast(`<b>Couldn't open a room.</b> ${e.message}`, '#bf2618'); } });
  $('btnJoin').addEventListener('click', () => { audioInit(); $('joinRow').classList.toggle('hidden'); $('joinCode').focus(); });
  $('btnJoinGo').addEventListener('click', async () => { const code = $('joinCode').value.trim().toUpperCase(); if (code.length !== 4) { $('joinCode').focus(); return; } tryLandscape(); try { await net.connect(code, false); } catch (e) { net.leave(); toast(`<b>Couldn't join.</b> ${e.message}`, '#bf2618'); } });
  $('joinCode').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btnJoinGo').click(); });
  // invite link: ?room=CODE auto-opens the join flow (one tap to join on phones)
  const inviteUrl = () => `${location.origin}${location.pathname}?room=${net.code}`;
  const canShare = !!(navigator.share && /iPhone|Android/i.test(navigator.userAgent)); if (canShare) $('btnInvite').textContent = 'Share invite link';
  $('btnInvite').addEventListener('click', async () => { if (!net.code) return; const url = inviteUrl(); const text = `Join my No Pulse run — room ${net.code}`; try { if (canShare) { await navigator.share({ title: 'No Pulse co-op', text, url }); return; } await navigator.clipboard.writeText(url); $('btnInvite').textContent = 'Link copied ✓'; setTimeout(() => { $('btnInvite').textContent = canShare ? 'Share invite link' : 'Copy invite link'; }, 1800); } catch (e) { prompt('Copy this invite link:', url); } });
  (() => { const room = (new URLSearchParams(location.search).get('room') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); if (room.length === 4) { $('joinRow').classList.remove('hidden'); $('joinCode').value = room; history.replaceState(null, '', location.pathname); const go = () => { $('btnJoinGo').click(); }; setTimeout(go, 150); } })();
  $('btnLobbyPick').addEventListener('click', () => { S.mode = 'select'; show('select'); });
  $('btnLobbyStart').addEventListener('click', () => net.start()); $('btnLobbyReady').addEventListener('click', () => net.toggleReady());
  $('btnLobbyLeave').addEventListener('click', () => net.leave());
  window.net = net;

  /* ---------------- Loop + test hooks ---------------- */
  let last = performance.now(), acc = 0, fpsT = 0, fpsN = 0, fps = 0; const STEP = 1 / 60; let manual = false;
  function frame(now) {
    requestAnimationFrame(frame); if (manual) return;
    let dt = Math.min(0.1, (now - last) / 1000); last = now; acc += dt;
    readInput(); if (S.isClient) { clientTick(dt); acc = 0; } else { let n = 0; while (acc >= STEP && n < 4) { update(STEP); acc -= STEP; n++; } }
    net.pump(); render(dt); fpsN++; fpsT += dt; if (fpsT >= 0.5) { fps = Math.round(fpsN / fpsT); fpsN = 0; fpsT = 0; $('debug').textContent = `fps ${fps} · hollows ${S.zombies.length}`; }
  }
  requestAnimationFrame(frame);
  window.advanceTime = (ms) => { manual = true; const steps = Math.max(1, Math.round(ms / 1000 / STEP)); for (let i = 0; i < steps; i++) { readInput(); if (S.isClient) clientTick(STEP); else update(STEP); } render(STEP); $('debug').textContent = `step · hollows ${S.zombies.length}`; };
  window.resumeLoop = () => { manual = false; last = performance.now(); };
  window.setInput = (o) => { if (o.q) { delete o.q; input.casts.push({ slot: 's', aim: null }); } if (o.e) { delete o.e; input.casts.push({ slot: 'u', aim: null }); } Object.assign(input, o); }; window.castAbility = (slot, aim) => input.casts.push({ slot, aim: aim || null }); window.debugAdren = () => { if (S.p) S.p.adren = ADREN_MAX; }; window.debugHeal = (v) => { if (S.p) S.p.hp = v; };
  window.startRun = startRun; window.debugForceCrit = () => { const z = S.zombies.find(z => !z.dead); if (!z) return 0; atkP = S.p; damageZombie(z, 100, true, S.p.x, S.p.y, 0.3); return 1; }; window.debugQuest = () => S.quest; window.debugNoSpawn = (v) => { S.noSpawn = v !== false; }; window.debugMe = () => S.p; window.debugZones = () => S.zones.map(z => ({ kind: z.kind, x: +z.x.toFixed(1), y: +z.y.toFixed(1), t: +z.t.toFixed(1) })); window.debugTeleportSid = (sid, x, y) => { const o = S.players.find(p => p.sid === sid); if (o) { o.x = x; o.y = y; } return !!o; }; window.debugQuestTo = (i) => { const q = S.quest.items[i]; if (q) { S.p.x = q.x; S.p.y = q.y; } return q; }; window.debugSquad = (ids) => { S.coop = true; S.isHost = true; S.isClient = false; S.mySid = 0; startRun(ids[0], ids.map((id, i) => ({ sid: i, id, name: SURVIVORS[id].name }))); }; window.debugPerks = () => [...(S.perks || [])]; window.debugDropNear = (sid) => { const p = S.players.find(o => o.sid === sid); if (p) S.loot.push({ item: makeItem('weapon', 2, 1), x: p.x + 0.6, y: p.y, t: 0 }); }; window.debugWeaponOf = (sid) => { const p = S.players.find(o => o.sid === sid); return p && p.weapons[p.slot].label; }; window.debugHurt = (sid, frac) => { const p = S.players.find(o => o.sid === sid); if (p) { p.hp -= p.maxHp * frac; if (p.hp <= 0) playerDown(p, 'downed'); } }; window.debugTeleport = (x, y) => { if (S.p) { S.p.x = x; S.p.y = y; } }; window.debugSpawn = (type, x, y) => spawnZombie(type, x, y); window.debugKillTurret = () => { const t = S.turrets[0]; if (t) hitTurret(t, 1e9, null); }; window.debugGive = (key) => { if (!S.p) return; const base = WEAPONS[key]; S.p.weapons.primary = { kind: 'weapon', key, name: base.name, rar: RARITY[0], ilvl: 1, mult: 1, affixes: [], gs: 10, label: 'Common ' + base.name }; S.p.slot = 'primary'; S.p.mag = base.mag; S.p.reserve = 999; S.p.reloading = 0; }; window.debugHurtZ = (id, dmg) => { const z = S.zombies.find(o => o.id === id); if (z) z.hp = Math.max(1, z.hp - dmg); }; window.debugClear = () => { S.zombies.length = 0; }; window.debugDrop = (kind, rar) => { if (S.p) S.loot.push({ item: makeItem(kind || 'weapon', rar == null ? rollRarity() : rar, 1 + Math.floor(S.time / 60)), x: S.p.x + 1.2, y: S.p.y, t: 0 }); };
  window.render_game_to_text = () => { const p = S.p; if (!p || !S.players) return JSON.stringify({ mode: S.mode, net: { coop: !!S.coop, host: !!net.host, code: net.code } }); return JSON.stringify({ quest: S.quest ? { done: S.quest.done, total: S.quest.total, bonus: S.quest.bonus, items: S.quest.items.map(q => ({ id: q.id, key: q.key, x: r2(q.x), y: r2(q.y), got: q.got, prog: r2(q.prog) })) } : null, note: 'meters, origin top-left, x right, y down', mode: S.mode, prio: input.prio, camOff: { x: +input.camOff.x.toFixed(2), y: +input.camOff.y.toFixed(2) }, cancelVisible: !$('btnCancel').classList.contains('hidden'), paused: !!S.paused, time: +S.time.toFixed(1), dmgDealt: Math.round(S.dmgDealt), pickup: pickupItem ? pickupItem.label : null, wave: S.wave, kills: S.kills, dmgDealt: Math.round(S.dmgDealt), time: +S.time.toFixed(2), extractOpen: S.extractOpen, extract: MAP.extract, player: p && { id: p.id, x: +p.x.toFixed(2), y: +p.y.toFixed(2), hp: Math.round(p.hp), maxHp: p.maxHp, inf: +p.inf.toFixed(2), aim: +p.aim.toFixed(2), slot: p.slot, weapon: p.weapons[p.slot].label, mag: p.mag, reserve: p.reserve, dodges: p.dodges, cd: { s: +p.cd.s.toFixed(1), d: +p.cd.d.toFixed(1), u: +p.cd.u.toFixed(1) }, charges: { d: chargesLeft(p, 'd'), u: chargesLeft(p, 'u') }, mcd: p.mcd, overT: +(p.overT || 0).toFixed(1), combo: p.combo, grit: p.grit, mom: r2(p.mom), rageM: r2(p.rageM), guard: r2(p.guard), rage: r2(p.rage), comboT: +(p.comboT || 0).toFixed(1), focus: +(p.focus || 0).toFixed(2), deadAir: +(p.deadAir || 0).toFixed(1), streak: p.streak, mag: p.mag, mines: S.mines.length, qcd: +p.cd.s.toFixed(1), ecd: +p.cd.u.toFixed(1), adren: Math.round(p.adren), adrenMax: ADREN_MAX, down: p.down, dead: p.dead, digIn: +p.digIn.toFixed(1), breathe: +p.breathe.toFixed(1), cburn: +p.cburn.toFixed(1), boost: +p.boost.toFixed(1), unchained: +p.unchained.toFixed(1), longExp: p.longExp, finale: +p.finale.toFixed(1), stealth: +p.stealth.toFixed(1), cyclone: +p.cyclone.toFixed(1), shield: +p.shield.toFixed(1), taunt: +p.taunt.toFixed(1), armor: Object.keys(p.armor).length, bag: p.bag.map(b => b.label), scrap: p.scrap, tailwind: !!p.tailwind, moveT: +p.moveT.toFixed(1), rage: +p.rage.toFixed(1), rageCd: +p.rageCd.toFixed(1), focus: +p.focus.toFixed(2), range: +stats(p).range.toFixed(1) }, zombies: S.zombies.slice(0, 20).map(z => ({ id: z.id, t: z.type, x: +z.x.toFixed(1), y: +z.y.toFixed(1), hp: Math.round(z.hp), marked: +(z.marked || 0).toFixed(1), burn: z.burn || 0, burnT: +(z.burnT || 0).toFixed(1), aware: z.aware })), zombieCount: S.zombies.length, screamers: S.zombies.filter(z => z.type === 'screamer').map(z => ({ x: +z.x.toFixed(1), y: +z.y.toFixed(1), hp: Math.round(z.hp), aware: z.aware, screamT: z.screamT == null ? null : +z.screamT.toFixed(2), screamed: !!z.screamed })), spitters: S.zombies.filter(z => z.type === 'spitter').map(z => ({ x: +z.x.toFixed(1), y: +z.y.toFixed(1), hp: Math.round(z.hp), aware: z.aware })), spits: S.spits.length, pools: S.pools.map(po => ({ x: +po.x.toFixed(1), y: +po.y.toFixed(1), t: +po.t.toFixed(1) })), flares: S.flares.map(f => ({ x: +f.x.toFixed(1), y: +f.y.toFixed(1), t: +f.t.toFixed(1) })), chems: S.chems, turrets: S.turrets.map(t => ({ x: +t.x.toFixed(1), y: +t.y.toFixed(1), t: +t.t.toFixed(1), hp: t.hp, range: t.range })), mines: S.mines.length, fires: S.fires.map(f => ({ x: +f.x.toFixed(1), y: +f.y.toFixed(1), r: f.r, t: +f.t.toFixed(1), wall: !!f.wall })), burning: S.zombies.filter(z => z.burn > 0).length, marked: S.zombies.filter(z => z.marked > 0).length, pinned: S.zombies.filter(z => z.pinned > 0).length, brutes: S.zombies.filter(z => z.type === 'brute').map(z => ({ x: +z.x.toFixed(1), y: +z.y.toFixed(1), hp: Math.round(z.hp), aware: z.aware })), loot: S.loot.slice(0, 8).map(l => ({ x: +l.x.toFixed(1), y: +l.y.toFixed(1), label: l.item.label })), found: S.found.length, result: S.result, players: S.players.map(o => ({ sid: o.sid, id: o.id, name: o.name, x: +o.x.toFixed(1), y: +o.y.toFixed(1), hp: Math.round(o.hp), down: o.down, dead: o.dead, reviveP: +o.reviveP.toFixed(2), grit: o.grit || 0, mom: Math.round(o.mom || 0), rageM: Math.round(o.rageM || 0), rage: +(o.rage || 0).toFixed(1), guard: +(o.guard || 0).toFixed(1), digIn: +(o.digIn || 0).toFixed(1), adren: Math.round(o.adren || 0) })), zones: S.zones.map(z => ({ kind: z.kind, x: +z.x.toFixed(1), y: +z.y.toFixed(1), r: z.r, t: +z.t.toFixed(1) })), barricades: S.barricades.length, throws: S.throws.length, aiming: aimState ? { slot: aimState.slot, aiming: aimState.aiming, cancel: aimState.cancel } : null, lock: input.lock, attacking: !!input.attack, net: { coop: !!S.coop, host: !!S.isHost, client: !!S.isClient, mySid: S.mySid, manual, mx: p && p.input.mx, hm: p && !!p.hm, lastSnapAge: net.lastSnap ? Math.round(performance.now() - net.lastSnap) : null }, kit: p && KITS[p.id] }); };
})();
