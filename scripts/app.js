(() => {
/* app-config.js */
const ASSET_PATHS = {
  heroSprite: "assets/images/hero-sprite-alpha.png",
  enemySprite: "assets/images/enemy-sprite.png"
};

const SIZE = 5;
const SAVE_KEY = "crypt_three_dice_retro_board_v1";
const SAVE_SLOTS_KEY = "crypt_three_dice_retro_slots_v1";
const MAX_SAVE_SLOTS = 5;
const KID_MODE_KEY = "crypt_three_dice_kid_mode_v1";
const SAVE_VERSION = 2;
const TEST_MODE = new URLSearchParams(location.search).has("test");

const classNames = {
  warden: "Guardián",
  berserker: "Berserker",
  scout: "Exploradora",
  arcanist: "Arcanista"
};

const levels = [
  {name:"Arañas de ceniza", stats:[5,1,1,2], count:2, hp:2, layout:0},
  {name:"Saqueadores", stats:[4,2,1,3], count:2, hp:2, layout:1},
  {name:"Murciélagos", stats:[6,2,1,2], count:3, hp:1, layout:2},
  {name:"Carroñeros", stats:[5,3,2,3], count:2, hp:3, layout:3},
  {name:"Centinelas", stats:[4,3,2,4], count:3, hp:2, layout:0},
  {name:"Acechadores", stats:[6,3,2,3], count:3, hp:3, layout:1},
  {name:"Gólems", stats:[3,4,3,3], count:2, hp:4, layout:2},
  {name:"Sombras", stats:[6,4,2,5], count:3, hp:3, layout:3},
  {name:"Caballeros huecos", stats:[5,5,3,4], count:3, hp:4, layout:0},
  {name:"Demonios menores", stats:[6,5,3,5], count:4, hp:3, layout:1},
  {name:"Guardianes del sello", stats:[5,6,4,5], count:3, hp:5, layout:2},
  {name:"Heraldo abisal", stats:[6,7,4,6], count:3, hp:6, layout:3}
];

const layouts = [
  {walls:[[1,1],[3,1],[1,3],[3,3]], hero:[0,4], spawns:[[4,0],[4,2],[2,0],[0,0]]},
  {walls:[[2,1],[2,2],[2,3]], hero:[4,4], spawns:[[0,0],[0,2],[4,0],[0,4]]},
  {walls:[[1,2],[3,2]], hero:[2,4], spawns:[[0,0],[2,0],[4,0],[0,3]]},
  {walls:[[1,1],[1,2],[3,2],[3,3]], hero:[0,4], spawns:[[4,0],[2,0],[4,4],[0,0]]}
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

/* app-core.js */
const app = {
  state: null,
  selectedClass: "warden",
  helpPage: 0,
  sound: true,
  kidMode: localStorage.getItem(KID_MODE_KEY) === "1",
  heroDrag: false,
  audioCtx: null,
  boardCells: [],
  selectedDieId: null,
  testRolls: [],
  currentSaveSlot: null,
  ui: {}
};

function registerUi(hooks) {
  app.ui = {...app.ui, ...hooks};
}

function render() {
  app.ui.render?.();
}

function say(message) {
  app.ui.say?.(message);
}

function toast(message) {
  app.ui.toast?.(message);
}

function updateContinueButton() {
  app.ui.updateContinueButton?.();
}

function setStartModalHidden(hidden) {
  app.ui.setStartModalHidden?.(hidden);
}

function setHelpModalHidden(hidden) {
  app.ui.setHelpModalHidden?.(hidden);
}

function setUpgradeModalHidden(hidden) {
  app.ui.setUpgradeModalHidden?.(hidden);
}

function setEndContent(title, text) {
  app.ui.setEndContent?.(title, text);
}

function setEndModalHidden(hidden) {
  app.ui.setEndModalHidden?.(hidden);
}

function openHelp() {
  app.ui.openHelp?.();
}

function levelData() {
  return levels[app.state.level - 1];
}

function rand() {
  if (TEST_MODE && app.testRolls.length) return app.testRolls.shift();
  return 1 + Math.floor(Math.random() * 6);
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < SIZE && y < SIZE;
}

function wallAt(x, y) {
  return app.state.walls.some((wall) => wall.x === x && wall.y === y);
}

function enemyAt(x, y) {
  return app.state.enemies.find((enemy) => enemy.x === x && enemy.y === y);
}

function cost(a, b) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return Math.min(dx, dy) * 3 + Math.abs(dx - dy) * 2;
}

function losMove(a, b) {
  const dx = Math.sign(b.x - a.x);
  const dy = Math.sign(b.y - a.y);

  if (a.x !== b.x && a.y !== b.y && Math.abs(b.x - a.x) !== Math.abs(b.y - a.y)) {
    return false;
  }

  let x = a.x + dx;
  let y = a.y + dy;
  while (x !== b.x || y !== b.y) {
    if (wallAt(x, y) || enemyAt(x, y)) return false;
    x += dx;
    y += dy;
  }

  return true;
}

function los(a, b) {
  const steps = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) * 20;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const cx = Math.floor(x + 0.5);
    const cy = Math.floor(y + 0.5);

    if ((cx === a.x && cy === a.y) || (cx === b.x && cy === b.y)) continue;
    if (wallAt(cx, cy) || enemyAt(cx, cy)) return false;
  }

  return true;
}

function freshState(classId) {
  return {
    saveVersion: SAVE_VERSION,
    classId,
    level: 1,
    turn: 1,
    hp: 6,
    maxHp: 6,
    skills: {speed:1, attack:1, defense:1, range:2},
    phase: "energy",
    dice: [],
    assign: {speed:null, attack:null, defense:null, range:null},
    points: {speed:0, attack:0, defense:0},
    hero: {x:0, y:4},
    enemies: [],
    walls: [],
    classUsed: false,
    preserved: null
  };
}

function isObject(value) {
  return value !== null && typeof value === "object";
}

function isValidPoint(value) {
  return isObject(value) && Number.isInteger(value.x) && Number.isInteger(value.y);
}

function normalizeState(raw) {
  if (!isObject(raw)) return null;
  if (raw.saveVersion !== undefined && raw.saveVersion !== SAVE_VERSION) return null;
  if (!Object.prototype.hasOwnProperty.call(classNames, raw.classId)) return null;
  if (!Number.isInteger(raw.level) || raw.level < 1 || raw.level > levels.length) return null;
  if (!Number.isInteger(raw.turn) || raw.turn < 1) return null;
  if (!Number.isInteger(raw.hp) || !Number.isInteger(raw.maxHp) || raw.maxHp < 1) return null;
  if (!isObject(raw.skills) || !["speed", "attack", "defense", "range"].every((key) => Number.isInteger(raw.skills[key]))) return null;
  if (!isObject(raw.assign) || !["speed", "attack", "defense", "range"].every((key) => raw.assign[key] === null || Number.isInteger(raw.assign[key]))) return null;
  if (!isObject(raw.points) || !["speed", "attack", "defense"].every((key) => Number.isInteger(raw.points[key]))) return null;
  if (!isValidPoint(raw.hero)) return null;
  if (!Array.isArray(raw.walls) || !raw.walls.every(isValidPoint)) return null;
  if (!Array.isArray(raw.enemies) || !raw.enemies.every((enemy) => isObject(enemy) && typeof enemy.id === "string" && isValidPoint(enemy) && Number.isInteger(enemy.hp) && Number.isInteger(enemy.maxHp))) return null;
  if (!Array.isArray(raw.dice) || !raw.dice.every((die) => isObject(die) && Number.isInteger(die.id) && Number.isInteger(die.value) && (die.assigned === null || typeof die.assigned === "string"))) return null;
  if (!["energy", "assign", "adventure", "monsterMove", "monsterAttack", "upgrade", "end"].includes(raw.phase)) return null;

  return {
    saveVersion: SAVE_VERSION,
    classId: raw.classId,
    level: raw.level,
    turn: raw.turn,
    hp: raw.hp,
    maxHp: raw.maxHp,
    skills: {...raw.skills},
    phase: raw.phase,
    dice: raw.dice.map((die) => ({...die})),
    assign: {...raw.assign},
    points: {...raw.points},
    hero: {...raw.hero},
    enemies: raw.enemies.map((enemy) => ({...enemy})),
    walls: raw.walls.map((wall) => ({...wall})),
    classUsed: Boolean(raw.classUsed),
    preserved: raw.preserved ?? null,
    _tempRange: Number.isInteger(raw._tempRange) ? raw._tempRange : undefined
  };
}

function hasSave() {
  return getSaveSlots().some(Boolean);
}

function normalizeSlot(slot, index) {
  if (!isObject(slot)) return null;

  const state = normalizeState(slot.state);
  if (!state) return null;

  const name = typeof slot.name === "string" ? slot.name.trim().slice(0, 40) : "";
  if (!name) return null;

  return {
    id: index,
    name,
    savedAt: Number.isFinite(slot.savedAt) ? slot.savedAt : 0,
    state
  };
}

function persistSaveSlots(slots) {
  localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(
    slots.map((slot) => slot ? {
      name: slot.name,
      savedAt: slot.savedAt,
      state: slot.state
    } : null)
  ));
  localStorage.removeItem(SAVE_KEY);
}

function buildLegacySlot() {
  try {
    const state = normalizeState(JSON.parse(localStorage.getItem(SAVE_KEY)));
    if (!state) return null;

    return {
      id: 0,
      name: `Partida ${classNames[state.classId]}`,
      savedAt: 0,
      state
    };
  } catch {
    return null;
  }
}

function getSaveSlots() {
  let rawSlots = null;
  let dirty = false;

  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_SLOTS_KEY));
    if (Array.isArray(parsed)) {
      rawSlots = parsed;
    } else if (parsed !== null) {
      dirty = true;
    }
  } catch {
    dirty = true;
  }

  if (rawSlots === null) {
    rawSlots = Array.from({ length: MAX_SAVE_SLOTS }, () => null);
    const legacySlot = buildLegacySlot();
    if (legacySlot) {
      rawSlots[0] = legacySlot;
    }
    if (legacySlot || localStorage.getItem(SAVE_KEY) !== null) dirty = true;
  }

  const normalizedSlots = Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => {
    if (index >= rawSlots.length) {
      dirty = true;
      return null;
    }

    const slot = normalizeSlot(rawSlots[index], index);
    if (rawSlots[index] !== null && !slot) dirty = true;
    return slot;
  });

  if (rawSlots.length !== MAX_SAVE_SLOTS) dirty = true;
  if (dirty) persistSaveSlots(normalizedSlots);

  return normalizedSlots;
}

function setSelectedClass(classId) {
  if (Object.prototype.hasOwnProperty.call(classNames, classId)) {
    app.selectedClass = classId;
  }
}

function total(skill) {
  const dieId = app.state.assign[skill];
  const die = app.state.dice.find((item) => item.id === dieId);
  return app.state.skills[skill] + (die ? die.value : 0);
}

function allAssigned() {
  return ["speed", "attack", "defense"].every((slot) => app.state.assign[slot] !== null) ||
    (app.state.classId === "scout" && app.state.classUsed && ["attack", "defense", "range"].every((slot) => app.state.assign[slot] !== null));
}

function nextRollValue() {
  if (app.state.preserved && app.state.dice.length === 0) {
    const value = app.state.preserved;
    app.state.preserved = null;
    return value;
  }

  return rand();
}

function finishRollIfReady() {
  if (app.state.dice.length < 3) return false;
  app.state.assign = {speed:null, attack:null, defense:null, range:null};
  app.state.phase = "assign";
  say("Arrastra cada dado a un atributo.");
  return true;
}

function setupLevel() {
  const data = levelData();
  const layout = layouts[data.layout];

  app.state.hero = {x:layout.hero[0], y:layout.hero[1]};
  app.state.walls = layout.walls.map(([x, y]) => ({x, y}));
  app.state.enemies = layout.spawns.slice(0, data.count).map(([x, y], index) => ({
    id: `e${Date.now()}${index}`,
    x,
    y,
    hp: data.hp,
    maxHp: data.hp
  }));
  app.state.turn = 1;
  app.state.phase = "energy";
  app.state.dice = [];
  app.state.assign = {speed:null, attack:null, defense:null, range:null};
  app.state.points = {speed:0, attack:0, defense:0};
  app.state.classUsed = false;
  app.state.preserved = null;

  say(`Nivel ${app.state.level}: ${data.name}. Lanza los dados.`);
  render();
}

function rollOne() {
  if (app.state.phase !== "energy" || app.state.dice.length >= 3) return;

  app.state.dice.push({
    id: app.state.dice.length,
    value: nextRollValue(),
    assigned: null
  });

  if (!finishRollIfReady()) {
    say(`Dado ${app.state.dice.length} de 3 lanzado. Puedes tirar otro o completar la tirada.`);
  }

  beep(380, 0.05);
  render();
}

function roll() {
  const firstValue = app.state.preserved || rand();
  app.state.preserved = null;

  app.state.dice = [firstValue, rand(), rand()].map((value, index) => ({
    id: index,
    value,
    assigned: null
  }));
  app.state.assign = {speed:null, attack:null, defense:null, range:null};
  app.state.phase = "assign";

  say("Arrastra cada dado a un atributo.");
  beep(380, 0.05);
  render();
}

function beginAdventure() {
  if (!allAssigned()) {
    toast("Debes asignar los tres dados.");
    return;
  }

  app.state.points.speed = app.state.assign.speed === null ? app.state.skills.speed : total("speed");
  app.state.points.attack = total("attack");
  app.state.points.defense = total("defense");

  if (app.state.assign.range !== null) {
    const die = app.state.dice.find((item) => item.id === app.state.assign.range);
    app.state.skills.range += die.value;
    app.state._tempRange = die.value;
  }

  app.state.phase = "adventure";
  say("Tu turno: mueve al héroe y ataca a los enemigos.");
  render();
}

function endAdventure() {
  if (app.state._tempRange) {
    app.state.skills.range -= app.state._tempRange;
    delete app.state._tempRange;
  }

  app.state.phase = "monsterMove";
  say("Las criaturas se están moviendo...");
  render();

  setTimeout(() => {
    moveMonsters();
    app.state.phase = "monsterAttack";
    render();
    setTimeout(monsterAttack, 500);
  }, 450);
}

function neighbors(position, ignoreEnemy = null) {
  const options = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      const x = position.x + dx;
      const y = position.y + dy;
      if (!inBounds(x, y) || wallAt(x, y)) continue;
      if (app.state.hero.x === x && app.state.hero.y === y) continue;
      if (app.state.enemies.some((enemy) => enemy.id !== ignoreEnemy && enemy.x === x && enemy.y === y)) continue;
      options.push({x, y, c:dx && dy ? 3 : 2});
    }
  }

  return options;
}

function monsterScore(position, range) {
  const distance = cost(position, app.state.hero);
  const visible = los(position, app.state.hero);
  if (visible && distance <= range) return Math.abs(range - distance);
  return 100 + Math.max(0, distance - range) + (visible ? 0 : 20);
}

function moveMonsters() {
  const data = levelData();
  const speed = data.stats[0];
  const range = data.stats[3];
  const ordered = [...app.state.enemies].sort((a, b) => cost(a, app.state.hero) - cost(b, app.state.hero));

  for (const enemy of ordered) {
    let budget = speed;
    while (budget >= 2) {
      const options = neighbors(enemy, enemy.id).filter((option) => option.c <= budget);
      if (!options.length) break;

      const scored = options
        .map((option) => ({option, score: monsterScore(option, range)}))
        .sort((a, b) => a.score - b.score);

      if (monsterScore(enemy, range) <= scored[0].score) break;

      enemy.x = scored[0].option.x;
      enemy.y = scored[0].option.y;
      budget -= scored[0].option.c;
    }
  }
}

function monsterAttack() {
  const data = levelData();
  const attack = data.stats[1];
  const range = data.stats[3];
  const attackers = app.state.enemies.filter((enemy) => cost(enemy, app.state.hero) <= range && los(enemy, app.state.hero));
  const totalAttack = attackers.length * attack;
  const damage = app.state.points.defense ? Math.floor(totalAttack / app.state.points.defense) : totalAttack;

  if (damage > 0) {
    app.state.hp -= damage;
    beep(95, 0.12);
    say(`${attackers.length} enemigo(s) atacan: recibes ${damage} de daño.`);
  } else {
    say(attackers.length ? "Tu defensa absorbe todo el daño." : "Ningún enemigo puede atacarte.");
  }

  if (app.state.hp <= 0) {
    finish(false);
    return;
  }

  app.state.turn++;
  app.state.phase = "energy";
  app.state.dice = [];
  app.state.assign = {speed:null, attack:null, defense:null, range:null};
  app.state.points = {speed:0, attack:0, defense:0};

  setTimeout(() => {
    say("Nuevo turno. Lanza los dados.");
    render();
  }, 420);

  render();
}

function attackable(enemy) {
  return cost(app.state.hero, enemy) <= app.state.skills.range && los(app.state.hero, enemy);
}

function attack(enemy) {
  if (app.state.phase !== "adventure" || !attackable(enemy)) return;

  const defenseCost = levelData().stats[2];
  if (app.state.points.attack < defenseCost) {
    toast(`Necesitas ${defenseCost} de ataque.`);
    return;
  }

  app.state.points.attack -= defenseCost;
  enemy.hp--;
  beep(180, 0.05);

  if (enemy.hp <= 0) {
    app.state.enemies = app.state.enemies.filter((item) => item.id !== enemy.id);
    say("Enemigo derrotado.");
  } else {
    say(`Impacto. Le queda ${enemy.hp} de salud.`);
  }

  if (!app.state.enemies.length) setTimeout(levelComplete, 260);
  render();
}

function validHeroTarget(x, y) {
  if (app.state.phase !== "adventure") return false;
  if (wallAt(x, y) || enemyAt(x, y)) return false;
  if (x === app.state.hero.x && y === app.state.hero.y) return false;
  return cost(app.state.hero, {x, y}) <= app.state.points.speed && losMove(app.state.hero, {x, y});
}

function moveHero(x, y) {
  if (!validHeroTarget(x, y)) return;

  const movementCost = cost(app.state.hero, {x, y});
  app.state.hero = {x, y};
  app.state.points.speed -= movementCost;

  beep(260, 0.04);
  say(`Movimiento realizado. Gastas ${movementCost} puntos.`);
  render();
}

function levelComplete() {
  if (app.state.level === 12) {
    finish(true);
    return;
  }

  app.state.phase = "upgrade";
  setUpgradeModalHidden(false);
  render();
}

function chooseUpgrade(type) {
  if (type === "heal") app.state.hp = app.state.maxHp;
  else app.state.skills[type]++;

  app.state.level++;
  setUpgradeModalHidden(true);
  setupLevel();
  if (app.currentSaveSlot !== null) {
    const currentSlot = getSaveSlots()[app.currentSaveSlot];
    if (currentSlot) save(app.currentSaveSlot, currentSlot.name, false);
  }
}

function finish(win) {
  app.state.phase = "end";
  setEndContent(
    win ? "Has conquistado la cripta" : "Has caído en la cripta",
    win
      ? "Has superado los 12 niveles y recuperado la reliquia de la cripta."
      : `Tu expedición termina en el nivel ${app.state.level}. Puedes intentarlo de nuevo o cargar tu guardado.`
  );
  setEndModalHidden(false);
  render();
}

function classPower() {
  if (app.state.classUsed) return;

  if (app.state.classId === "arcanist" && ["energy", "assign"].includes(app.state.phase)) {
    app.state.classUsed = true;
    roll();
    toast("Tirada repetida.");
  } else if (app.state.classId === "berserker" && app.state.hp === 1 && app.state.phase === "assign") {
    app.state.classUsed = true;
    roll();
    toast("Furia: tirada repetida.");
  } else if (app.state.classId === "warden" && app.state.phase === "adventure") {
    const assigned = app.state.dice.find((die) => die.assigned);
    if (!assigned) {
      toast("No hay dado para conservar.");
      return;
    }
    app.state.preserved = assigned.value;
    app.state.classUsed = true;
    toast(`Conservarás un ${assigned.value}.`);
  } else if (app.state.classId === "scout" && app.state.phase === "assign") {
    app.state.classUsed = true;
    toast("Ahora puedes usar un dado en Alcance.");
    render();
  }
}

function save(slotIndex, name, show = true) {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) return false;

  const trimmedName = typeof name === "string" ? name.trim().slice(0, 40) : "";
  if (!trimmedName) return false;

  app.state.saveVersion = SAVE_VERSION;
  const slots = getSaveSlots();
  slots[slotIndex] = {
    id: slotIndex,
    name: trimmedName,
    savedAt: Date.now(),
    state: normalizeState(app.state)
  };
  persistSaveSlots(slots);
  app.currentSaveSlot = slotIndex;
  updateContinueButton();
  if (show) toast(`Partida guardada en ranura ${slotIndex + 1}.`);
  return true;
}

function deleteSaveSlot(slotIndex) {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) return false;

  const slots = getSaveSlots();
  if (!slots[slotIndex]) return false;

  slots[slotIndex] = null;
  persistSaveSlots(slots);
  if (app.currentSaveSlot === slotIndex) app.currentSaveSlot = null;
  updateContinueButton();
  return true;
}

function load(slotIndex) {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) return false;

  try {
    const slot = getSaveSlots()[slotIndex];
    if (!slot) return false;

    app.state = slot.state;
    app.currentSaveSlot = slotIndex;
    setStartModalHidden(true);
    say("Partida restaurada.");
    render();
    return true;
  } catch {
    return false;
  }
}

function start() {
  app.state = freshState(app.selectedClass);
  app.selectedDieId = null;
  app.currentSaveSlot = null;
  setStartModalHidden(true);
  setupLevel();
  openHelp();
}

function reset() {
  app.state = null;
  app.selectedDieId = null;
  app.currentSaveSlot = null;
  location.reload();
}

function assignDie(id, slot) {
  if (app.state.phase !== "assign") return;

  if (slot === "range" && !(app.state.classId === "scout" && app.state.classUsed)) {
    toast("Solo la Exploradora puede asignar a Alcance.");
    return;
  }

  if (slot === "range" && app.state.assign.speed !== null) {
    const oldSpeed = app.state.assign.speed;
    app.state.assign.speed = null;
    app.state.dice.find((die) => die.id === oldSpeed).assigned = null;
  }

  const oldSlot = app.state.dice.find((die) => die.id === id)?.assigned;
  if (oldSlot) app.state.assign[oldSlot] = null;

  const occupied = app.state.assign[slot];
  if (occupied !== null) app.state.dice.find((die) => die.id === occupied).assigned = null;

  app.state.assign[slot] = id;
  app.state.dice.find((die) => die.id === id).assigned = slot;
  app.selectedDieId = null;

  beep(430, 0.025);
  render();
}

function unassign(id) {
  const die = app.state.dice.find((item) => item.id === id);
  if (!die || !die.assigned) return;

  app.state.assign[die.assigned] = null;
  die.assigned = null;
  app.selectedDieId = id;
  render();
}

function canAssignToSlot(slot) {
  if (!app.state || app.state.phase !== "assign") return false;
  if (slot === "range") return app.state.classId === "scout" && app.state.classUsed;
  return ["speed", "attack", "defense"].includes(slot);
}

function toggleDieSelection(id) {
  const die = app.state?.dice.find((item) => item.id === id);
  if (!die || die.assigned || app.state.phase !== "assign") return;
  app.selectedDieId = app.selectedDieId === id ? null : id;
  render();
}

function assignSelectedDie(slot) {
  if (app.selectedDieId === null || !canAssignToSlot(slot)) return;
  assignDie(app.selectedDieId, slot);
}

function resetAssignments() {
  if (!app.state || app.state.phase !== "assign") return;
  app.state.dice.forEach((die) => {
    die.assigned = null;
  });
  app.state.assign = {speed:null, attack:null, defense:null, range:null};
  app.selectedDieId = null;
  say("Asignación reiniciada. Vuelve a colocar los tres dados.");
  render();
}

function phaseInstruction() {
  if (!app.state) return "";

  if (app.state.phase === "energy") {
    const rolled = app.state.dice.length;
    return rolled
      ? `Has lanzado ${rolled} de 3 dados. Tira el siguiente dado o lanza los 3 de nuevo.`
      : "Lanza los dados de uno en uno o los tres a la vez.";
  }

  if (app.state.phase === "assign") {
    if (!allAssigned()) return "Asigna un dado a MOV, ATQ y DEF. ALC es fijo.";
    return "Asignación completa. Entra en acción.";
  }

  if (app.state.phase === "adventure") {
    if (app.state.points.speed > 0 && app.state.points.attack > 0) return "Mueve o ataca con las casillas marcadas.";
    if (app.state.points.speed > 0) return "Queda movimiento.";
    if (app.state.points.attack > 0) return "Queda ataque.";
    return "Sin acciones útiles. Cierra el turno.";
  }

  if (app.state.phase === "monsterMove" || app.state.phase === "monsterAttack") return "Fase enemiga.";
  if (app.state.phase === "upgrade") return "Elige una recompensa para seguir descendiendo.";
  if (app.state.phase === "end") return "La expedicion ha terminado.";
  return "";
}

function getAudioContext() {
  if (app.audioCtx) return app.audioCtx;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  app.audioCtx = new AudioCtor();
  return app.audioCtx;
}

function beep(freq, duration) {
  if (!app.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = freq;
    gain.gain.value = 0.025;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch {}
}

function setTestRolls(values) {
  app.testRolls = values.map(Number);
}

function setTestState(rawState) {
  const normalized = normalizeState(rawState);
  if (!normalized) throw new Error("Invalid test state");

  app.state = normalized;
  app.selectedDieId = null;
  setStartModalHidden(true);
  setHelpModalHidden(true);
  setUpgradeModalHidden(true);
  setEndModalHidden(true);
  render();
}

/* app-ui.js */
let selectedContinueSlot = null;
let selectedSaveSlot = 0;
let pendingDelete = null;
let lastRenderedPhase = null;

const compactEnemyNames = new Map([
  ["Arañas de ceniza", "Araña sombría"],
  ["Caballeros huecos", "Cab. hueco"],
  ["Guardianes del sello", "Guardián sello"]
]);

const modalOrder = [
  "startModal",
  "helpModal",
  "upgradeModal",
  "saveModal",
  "loadModal",
  "deleteConfirmModal",
  "endModal"
];

const modalOptions = {
  startModal: { closeOnEscape: false, initialFocus: "#startBtn" },
  helpModal: { closeOnEscape: true, initialFocus: "#helpNext" },
  upgradeModal: { closeOnEscape: false, initialFocus: "[data-upgrade='heal']" },
  saveModal: { closeOnEscape: true, initialFocus: "#saveNameInput" },
  loadModal: { closeOnEscape: true, initialFocus: "#loadConfirmBtn" },
  deleteConfirmModal: { closeOnEscape: true, initialFocus: "#deleteConfirmCancelBtn" },
  endModal: { closeOnEscape: false, initialFocus: "#endRestart" }
};

const modalReturnFocus = new Map();
const backgroundTabIndexAttr = "data-modal-prev-tabindex";

function say(message) {
  $("#log").textContent = message;
}

function toast(message) {
  const toastEl = $("#toast");
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

function modalElement(id) {
  return document.getElementById(id);
}

function modalPanel(id) {
  return modalElement(id)?.querySelector(".modal");
}

function visibleModalIds() {
  return modalOrder.filter((id) => !modalElement(id)?.classList.contains("hidden"));
}

function topModalId() {
  const ids = visibleModalIds();
  return ids.at(-1) || null;
}

function focusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll(
    "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
  )].filter((element) => !element.closest(".hidden"));
}

function restoreBackgroundFocusability() {
  document.querySelectorAll(`[${backgroundTabIndexAttr}]`).forEach((element) => {
    const previous = element.getAttribute(backgroundTabIndexAttr);
    if (previous === "__none__") element.removeAttribute("tabindex");
    else element.setAttribute("tabindex", previous);
    element.removeAttribute(backgroundTabIndexAttr);
  });
}

function updateModalEnvironment() {
  const activeModalId = topModalId();
  restoreBackgroundFocusability();

  [...document.body.children].forEach((child) => {
    if (child.tagName === "SCRIPT" || child.id === "toast") return;
    child.inert = Boolean(activeModalId) && child.id !== activeModalId;
  });

  if (!activeModalId) return;

  const activePanel = modalPanel(activeModalId);
  if (!activePanel) return;

  focusableElements(document).forEach((element) => {
    if (activePanel.contains(element)) return;
    const previous = element.getAttribute("tabindex");
    element.setAttribute(backgroundTabIndexAttr, previous === null ? "__none__" : previous);
    element.setAttribute("tabindex", "-1");
  });
}

function focusElement(target) {
  if (!(target instanceof HTMLElement) || !target.isConnected) return;

  const applyFocus = () => {
    target.focus({ preventScroll: true });
    if (document.activeElement !== target) {
      setTimeout(() => {
        if (target.isConnected) target.focus({ preventScroll: true });
      }, 0);
    }
  };

  requestAnimationFrame(applyFocus);
}

function focusModal(id) {
  const panel = modalPanel(id);
  if (!panel) return;

  const selector = modalOptions[id]?.initialFocus;
  const preferred = selector ? panel.querySelector(selector) : null;
  const fallback = focusableElements(panel)[0] || panel;
  const target = preferred || fallback;

  focusElement(target);
}

function setModalHidden(id, hidden, opener = null) {
  const modal = modalElement(id);
  const panel = modalPanel(id);
  if (!modal || !panel) return;

  if (!hidden && !modalReturnFocus.has(id)) {
    const returnTarget = opener instanceof HTMLElement ? opener :
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    if (returnTarget) modalReturnFocus.set(id, returnTarget);
  }

  modal.classList.toggle("hidden", hidden);
  modal.setAttribute("aria-hidden", String(hidden));

  if (hidden) {
    const returnFocus = modalReturnFocus.get(id);
    modalReturnFocus.delete(id);
    updateModalEnvironment();
    focusElement(returnFocus);
    return;
  }

  updateModalEnvironment();
  focusModal(id);
}

function closeTopModalWithEscape() {
  const id = topModalId();
  if (!id || !modalOptions[id]?.closeOnEscape) return;

  if (id === "helpModal") setHelpModalHidden(true);
  else if (id === "saveModal") closeSaveModal();
  else if (id === "loadModal") closeLoadModal();
  else if (id === "deleteConfirmModal") closeDeleteConfirm();
}

function setStartModalHidden(hidden, opener) {
  setModalHidden("startModal", hidden, opener);
  if (!hidden) updateContinueButtonUi();
}

function setHelpModalHidden(hidden, opener) {
  setModalHidden("helpModal", hidden, opener);
}

function setUpgradeModalHidden(hidden, opener) {
  setModalHidden("upgradeModal", hidden, opener);
}

function setEndModalHidden(hidden, opener) {
  setModalHidden("endModal", hidden, opener);
}

function setSaveModalHidden(hidden, opener) {
  setModalHidden("saveModal", hidden, opener);
}

function setLoadModalHidden(hidden, opener) {
  setModalHidden("loadModal", hidden, opener);
}

function setDeleteConfirmModalHidden(hidden, opener) {
  setModalHidden("deleteConfirmModal", hidden, opener);
}

function setEndContent(title, text) {
  $("#endTitle").textContent = title;
  $("#endText").textContent = text;
}

function openHelpModal(opener = null) {
  app.helpPage = 0;
  setHelpModalHidden(false, opener);
  renderHelp();
}

function renderHelp() {
  $$(".tutorial-page").forEach((page, index) => page.classList.toggle("active", index === app.helpPage));
  $("#helpPrev").disabled = app.helpPage === 0;
  $("#helpNext").classList.toggle("hidden", app.helpPage === 2);
  $("#helpClose").classList.toggle("hidden", app.helpPage !== 2);
}

function syncClassSelection() {
  $$(".choice-card[data-class]").forEach((card) => {
    card.classList.toggle("selected", card.dataset.class === app.selectedClass);
  });
}

function setKidMode(enabled) {
  app.kidMode = Boolean(enabled);
  document.body.classList.toggle("kid-mode", app.kidMode);
  localStorage.setItem(KID_MODE_KEY, app.kidMode ? "1" : "0");

  ["#kidModeStartBtn", "#kidModeBtn"].forEach((selector) => {
    const toggle = $(selector);
    if (!toggle) return;
    toggle.textContent = app.kidMode ? "Niño ON" : "Niño OFF";
    toggle.title = app.kidMode ? "Desactivar modo niño" : "Activar modo niño";
    toggle.setAttribute("aria-label", toggle.title);
    toggle.setAttribute("aria-pressed", String(app.kidMode));
  });
}

function defaultSaveName(state) {
  return `${classNames[state.classId]} N${state.level}`;
}

function formatSaveDate(savedAt) {
  if (!savedAt) return "Sin fecha";

  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(savedAt);
  } catch {
    return "Guardada";
  }
}

function renderSlotCard(slot, index, selected, emptyLabel = "Vacía") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `choice-card save-slot-card${selected ? " selected" : ""}`;
  button.dataset.slot = String(index);

  const title = document.createElement("strong");
  title.textContent = slot ? slot.name : `Ranura ${index + 1}`;

  const meta = document.createElement("span");
  meta.textContent = slot
    ? `${classNames[slot.state.classId]} · Nivel ${slot.state.level} · Turno ${slot.state.turn}`
    : emptyLabel;

  const time = document.createElement("span");
  time.className = "save-slot-meta";
  time.textContent = slot ? formatSaveDate(slot.savedAt) : "Libre para guardar";

  button.append(title, meta, time);
  return button;
}

function renderContinueSlots() {
  const container = $("#loadSlotsList");
  const slots = getSaveSlots();
  const availableSlots = slots.map((slot, index) => slot ? index : null).filter((value) => value !== null);

  if (!availableSlots.includes(selectedContinueSlot)) {
    selectedContinueSlot = availableSlots[0] ?? null;
  }

  container.replaceChildren();
  if (!availableSlots.length) {
    const empty = document.createElement("p");
    empty.className = "save-slot-empty";
    empty.textContent = "No hay partidas guardadas todavía.";
    container.appendChild(empty);
    return;
  }

  slots.forEach((slot, index) => {
    if (!slot) return;
    container.appendChild(renderSlotCard(slot, index, selectedContinueSlot === index, "Vacía"));
  });
  $("#loadDeleteBtn").disabled = selectedContinueSlot === null;
  $("#loadConfirmBtn").disabled = selectedContinueSlot === null;
}

function updateContinueButtonUi() {
  renderContinueSlots();
  $("#continueBtn").disabled = selectedContinueSlot === null;
}

function renderSaveSlotPicker() {
  const container = $("#saveSlotPicker");
  const slots = getSaveSlots();

  container.replaceChildren();
  slots.forEach((slot, index) => {
    container.appendChild(renderSlotCard(slot, index, selectedSaveSlot === index, "Ranura libre"));
  });
  $("#saveDeleteBtn").disabled = !slots[selectedSaveSlot];
}

function syncSaveNameInput() {
  const input = $("#saveNameInput");
  const slots = getSaveSlots();
  input.value = slots[selectedSaveSlot]?.name || defaultSaveName(app.state);
}

function openSaveModal(opener = null) {
  if (!app.state) return;
  const slots = getSaveSlots();
  const preferredSlot = app.currentSaveSlot ?? slots.findIndex((slot) => !slot);
  selectedSaveSlot = Number.isInteger(preferredSlot) && preferredSlot >= 0 ? preferredSlot : 0;
  renderSaveSlotPicker();
  syncSaveNameInput();
  setSaveModalHidden(false, opener);
  $("#saveNameInput").focus();
  $("#saveNameInput").select();
}

function closeSaveModal() {
  setSaveModalHidden(true);
}

function openLoadModal(opener = null) {
  renderContinueSlots();
  if (selectedContinueSlot === null) {
    toast("No hay partidas guardadas.");
    return;
  }
  setLoadModalHidden(false, opener);
}

function closeLoadModal() {
  setLoadModalHidden(true);
}

function openDeleteConfirm(slotIndex, source, opener = null) {
  const slot = getSaveSlots()[slotIndex];
  if (!slot) return;

  pendingDelete = { slotIndex, source, name: slot.name };
  $("#deleteConfirmText").textContent = `Vas a eliminar la partida guardada "${slot.name}". Esta acción no se puede deshacer.`;
  setDeleteConfirmModalHidden(false, opener);
}

function closeDeleteConfirm() {
  pendingDelete = null;
  setDeleteConfirmModalHidden(true);
}

function confirmDeleteSlot() {
  if (!pendingDelete) return;

  const { slotIndex, source } = pendingDelete;
  if (!deleteSaveSlot(slotIndex)) {
    toast("No se pudo eliminar la partida.");
    closeDeleteConfirm();
    return;
  }

  toast("Partida eliminada.");
  closeDeleteConfirm();

  if (source === "save") {
    renderSaveSlotPicker();
    syncSaveNameInput();
  } else {
    renderContinueSlots();
    if (selectedContinueSlot === null) closeLoadModal();
  }

  updateContinueButtonUi();
}

function dieEl(die) {
  const element = document.createElement("div");
  const isSelected = !die.assigned && die.id === app.selectedDieId;
  element.className = "die" + (die.assigned ? " assigned" : "") + (isSelected ? " selected" : "");
  element.textContent = die.value;
  element.draggable = true;
  element.tabIndex = 0;
  element.setAttribute("role", "button");
  element.setAttribute("aria-label", die.assigned ? `Dado ${die.value} asignado. Pulsa enter para quitarlo.` : `Dado ${die.value}. Pulsa para seleccionarlo o arrástralo a un atributo.`);
  element.setAttribute("aria-pressed", String(isSelected));
  element.dataset.die = die.id;

  element.addEventListener("dragstart", (event) => {
    app.selectedDieId = null;
    event.dataTransfer.setData("text/plain", die.id);
    element.classList.add("dragging");
  });
  element.addEventListener("dragend", () => element.classList.remove("dragging"));
  element.addEventListener("click", () => {
    if (!die.assigned) toggleDieSelection(die.id);
  });
  element.addEventListener("dblclick", () => unassign(die.id));
  element.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && die.assigned) {
      event.preventDefault();
      unassign(die.id);
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && !die.assigned) {
      event.preventDefault();
      toggleDieSelection(die.id);
    }
  });

  return element;
}

function renderDice() {
  const pool = $("#dicePool");
  if (app.selectedDieId !== null && !app.state.dice.some((die) => die.id === app.selectedDieId && !die.assigned)) {
    app.selectedDieId = null;
  }

  pool.innerHTML = "";
  app.state.dice.filter((die) => !die.assigned).forEach((die) => pool.appendChild(dieEl(die)));

  if (app.state.phase === "energy") {
    const pending = Math.max(0, 3 - app.state.dice.length);
    for (let i = 0; i < pending; i++) {
      const ghost = document.createElement("div");
      ghost.className = "die die-placeholder";
      ghost.textContent = "?";
      pool.appendChild(ghost);
    }
  }

  $$(".slot[data-slot]").forEach((slot) => {
    const name = slot.dataset.slot;
    const id = app.state.assign[name];
    const enabled = canAssignToSlot(name);
    slot.classList.toggle("fixed", name === "range" && !enabled);
    slot.classList.toggle("tap-target", enabled);
    slot.setAttribute("role", "button");
    slot.tabIndex = enabled ? 0 : -1;
    slot.setAttribute("aria-disabled", String(!enabled));
    slot.setAttribute("aria-label", id === null ? `Hueco de ${name}. ${enabled ? "Pulsa para asignar el dado seleccionado." : "No disponible."}` : `Hueco de ${name} con dado asignado.`);
    slot.innerHTML = "";

    if (id === null) {
      slot.textContent = name === "range" ? (enabled ? "Suelta dado" : "No consume dado") : "Suelta dado";
    } else {
      slot.appendChild(dieEl(app.state.dice.find((die) => die.id === id)));
    }
  });
}

function ensureBoard() {
  if (app.boardCells.length) return;

  const board = $("#board");
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.tabIndex = -1;
      cell.addEventListener("click", () => {
        if (!app.state) return;
        const cx = Number(cell.dataset.x);
        const cy = Number(cell.dataset.y);
        if (validHeroTarget(cx, cy)) {
          moveHero(cx, cy);
          return;
        }
        const enemy = enemyAt(cx, cy);
        if (enemy && attackable(enemy)) attack(enemy);
      });
      cell.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        cell.click();
      });
      board.appendChild(cell);
      app.boardCells.push(cell);
    }
  }
}

function renderBoard() {
  ensureBoard();

  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const cell = app.boardCells[y * 5 + x];
      cell.className = "cell";
      cell.tabIndex = -1;
      cell.removeAttribute("role");
      cell.removeAttribute("aria-label");
      cell.replaceChildren();

      if (app.state.phase === "adventure" && validHeroTarget(x, y)) {
        cell.classList.add("valid");
        cell.tabIndex = 0;
        cell.setAttribute("role", "button");
        cell.setAttribute("aria-label", `Mover héroe a ${x + 1}, ${y + 1}`);
      }

      const enemy = enemyAt(x, y);
      if (enemy && app.state.phase === "adventure" && attackable(enemy)) {
        cell.classList.add("attackable");
        cell.tabIndex = 0;
        cell.setAttribute("role", "button");
        cell.setAttribute("aria-label", `Atacar enemigo en ${x + 1}, ${y + 1}`);
      }

      if (app.state.walls.some((wall) => wall.x === x && wall.y === y)) {
        const wall = document.createElement("div");
        wall.className = "wall-piece";
        cell.appendChild(wall);
      }

      if (app.state.hero.x === x && app.state.hero.y === y) {
        const piece = document.createElement("div");
        piece.className = "piece hero-piece";
        piece.innerHTML = `
          <img class="sprite hero-sprite" src="${ASSET_PATHS.heroSprite}" alt="Héroe">
        `;
        const heroEl = piece.querySelector(".hero-sprite");
        heroEl.addEventListener("pointerdown", (event) => {
          if (app.state.phase !== "adventure") return;
          app.heroDrag = true;
          heroEl.classList.add("dragging");
          heroEl.setPointerCapture(event.pointerId);
        });
        heroEl.addEventListener("pointermove", (event) => {
          if (!app.heroDrag) return;
          $$(".drop-hover").forEach((target) => target.classList.remove("drop-hover"));
          const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".cell");
          if (target && target.classList.contains("valid")) target.classList.add("drop-hover");
        });
        heroEl.addEventListener("pointerup", (event) => {
          if (!app.heroDrag) return;
          app.heroDrag = false;
          heroEl.classList.remove("dragging");
          const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".cell");
          $$(".drop-hover").forEach((candidate) => candidate.classList.remove("drop-hover"));
          if (target && target.classList.contains("valid")) moveHero(Number(target.dataset.x), Number(target.dataset.y));
        });
        heroEl.addEventListener("pointercancel", () => {
          app.heroDrag = false;
          heroEl.classList.remove("dragging");
          $$(".drop-hover").forEach((candidate) => candidate.classList.remove("drop-hover"));
        });
        cell.appendChild(piece);
        cell.insertAdjacentHTML("beforeend", `<span class="hp-badge">♥ ${app.state.hp}</span>`);
      } else if (enemy) {
        const piece = document.createElement("div");
        piece.className = "piece enemy-piece";
        piece.innerHTML = `
          <img class="sprite enemy-sprite" src="${ASSET_PATHS.enemySprite}" alt="Enemigo">
        `;
        piece.querySelector(".enemy-sprite").addEventListener("click", (event) => {
          event.stopPropagation();
          attack(enemy);
        });
        cell.appendChild(piece);
        cell.insertAdjacentHTML("beforeend", `<span class="hp-badge">♥ ${enemy.hp}</span>`);
      }
    }
  }
}

function updateTurnFlow() {
  const order = ["energy", "assign", "adventure", "finish"];
  const current = order.includes(app.state.phase) ? app.state.phase : "finish";
  const currentIndex = Math.max(0, order.indexOf(current));
  $$("[data-flow-step]").forEach((step) => {
    const index = order.indexOf(step.dataset.flowStep);
    step.classList.toggle("active", index === currentIndex);
    step.classList.toggle("done", index > -1 && index < currentIndex);
  });
}

function scrollActivePanelIntoView(previousPhase) {
  if (previousPhase === app.state.phase) return;
  if (!window.matchMedia("(max-width: 760px)").matches) return;

  const target = app.state.phase === "assign"
    ? $(".board-side-info > .block:nth-child(2)")
    : app.state.phase === "adventure"
      ? $(".game-card")
      : null;
  if (!target) return;

  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  requestAnimationFrame(() => target.scrollIntoView({block:"start", behavior}));
}

function render() {
  if (!app.state) return;
  const previousPhase = lastRenderedPhase;
  if (app.state.phase !== "assign") app.selectedDieId = null;

  const data = levelData();
  $("#levelHud").textContent = `${app.state.level} / 12`;
  $("#turnHud").textContent = app.state.turn;
  $("#classHud").textContent = classNames[app.state.classId];
  $("#enemyTypeHud").textContent = data.name;
  $("#enemyCountHud").textContent = app.state.enemies.length;
  $("#objectiveHud").textContent = app.state.enemies.length === 1
    ? "Derrota al enemigo restante."
    : `Derrota enemigos: ${app.state.enemies.length} · ${data.name}.`;
  const featuredEnemy = app.state.enemies[0];
  const enemyPanelName = $("#enemyPanelName");
  if (enemyPanelName) {
    enemyPanelName.textContent = compactEnemyNames.get(data.name) || data.name;
    enemyPanelName.title = data.name;
  }

  const hpHud = $("#hpHud");
  const currentHp = Math.max(0, app.state.hp);
  const maxHp = Math.max(1, app.state.maxHp);
  const hpRatio = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
  hpHud.innerHTML = `<span class="current-value">${currentHp}</span><span class="max-value">/${app.state.maxHp}</span>`;
  hpHud.style.setProperty("--hp-ratio", `${hpRatio.toFixed(1)}%`);
  $("#topSpeed").textContent = app.state.skills.speed;
  $("#topDefense").textContent = app.state.skills.defense;
  $("#topAttack").textContent = app.state.skills.attack;
  $("#topRange").textContent = app.state.skills.range;

  $("#speedBase").textContent = app.state.skills.speed;
  $("#attackBase").textContent = app.state.skills.attack;
  $("#defenseBase").textContent = app.state.skills.defense;
  $("#rangeBase").textContent = app.state.skills.range;
  $("#speedTotalSide").textContent = total("speed");
  $("#attackTotalSide").textContent = total("attack");
  $("#defenseTotalSide").textContent = total("defense");
  $("#rangeTotalSide").textContent = app.state.assign.range === null ? app.state.skills.range : total("range");

  $("#movePoints").textContent = app.state.points.speed;
  $("#attackPoints").textContent = app.state.points.attack;
  $("#defensePoints").textContent = app.state.points.defense;
  $("#movePointsSide").textContent = app.state.points.speed;
  $("#attackPointsSide").textContent = app.state.points.attack;
  $("#defensePointsSide").textContent = app.state.points.defense;

  const enemyHpMeta = $("#enemyHpMeta");
  if (enemyHpMeta) enemyHpMeta.textContent = featuredEnemy ? featuredEnemy.hp : 0;
  $("#enemyAtkMeta").textContent = data.stats[1];
  $("#enemyDefMeta").textContent = data.stats[2];
  $("#enemyRngMeta").textContent = data.stats[3];
  $(".enemy-panel")?.classList.toggle("empty", !featuredEnemy);
  $("#phaseHint").textContent = phaseInstruction();

  const phaseNames = {
    energy:"Preparación · lanzar dados",
    assign:"Asignar dados",
    adventure:"Actuar con el héroe",
    monsterMove:"Turno enemigo",
    monsterAttack:"Turno enemigo",
    upgrade:"Recompensa",
    end:"Final"
  };
  $("#turnLabel").textContent = `Turno ${app.state.turn}`;
  const phaseTitle = phaseNames[app.state.phase] || app.state.phase;
  if (phaseTitle.includes("·")) {
    const [main, action] = phaseTitle.split("·").map((part) => part.trim());
    $("#phaseLabel").innerHTML = `<span class="phase-main">${main}</span><span class="phase-separator">·</span><span class="phase-action">${action}</span>`;
  } else {
    $("#phaseLabel").innerHTML = `<span class="phase-single">${phaseTitle}</span>`;
  }
  updateTurnFlow();

  const phaseBtn = $("#phaseBtn");
  phaseBtn.disabled = false;
  if (app.state.phase === "energy") {
    phaseBtn.innerHTML = `<span class="btn-kicker">Rápido</span><span class="btn-main">Lanzar 3 dados</span><span class="btn-progress">Completar tirada</span>`;
    phaseBtn.onclick = roll;
  } else if (app.state.phase === "assign") {
    phaseBtn.textContent = "Confirmar asignación";
    phaseBtn.disabled = !allAssigned();
    phaseBtn.onclick = beginAdventure;
  } else if (app.state.phase === "adventure") {
    phaseBtn.textContent = "Terminar turno";
    phaseBtn.onclick = endAdventure;
  } else {
    phaseBtn.textContent = "Procesando…";
    phaseBtn.disabled = true;
  }

  const secondaryBtn = $("#secondaryAction");
  if (app.state.phase === "energy") {
    const nextDie = Math.min(app.state.dice.length + 1, 3);
    secondaryBtn.innerHTML = `<span class="btn-kicker">Paso a paso</span><span class="btn-main">Lanzar 1 dado</span><span class="btn-progress">Dado ${nextDie} de 3</span>`;
    secondaryBtn.disabled = app.state.dice.length >= 3;
    secondaryBtn.onclick = rollOne;
  } else if (app.state.phase === "assign") {
    secondaryBtn.textContent = "Reiniciar asignación";
    secondaryBtn.disabled = !app.state.dice.some((die) => die.assigned !== null);
    secondaryBtn.onclick = resetAssignments;
  } else {
    secondaryBtn.textContent = "Nueva partida";
    secondaryBtn.disabled = false;
    secondaryBtn.onclick = () => confirm("¿Empezar una partida nueva?") && reset();
  }

  const powerBtn = $("#powerBtn");
  powerBtn.disabled = app.state.classUsed || !(
    (app.state.classId === "arcanist" && ["energy", "assign"].includes(app.state.phase)) ||
    (app.state.classId === "berserker" && app.state.hp === 1 && app.state.phase === "assign") ||
    (app.state.classId === "warden" && app.state.phase === "adventure") ||
    (app.state.classId === "scout" && app.state.phase === "assign")
  );
  powerBtn.textContent = app.state.classId === "warden" ? "Conservar dado" :
    app.state.classId === "scout" ? "Usar talento" :
    "Talento";

  const powerHint = $("#powerHint");
  if (app.state.classUsed) {
    powerHint.textContent = "Talento utilizado en este nivel.";
  } else if (app.state.classId === "warden") {
    powerHint.textContent = app.state.phase === "adventure"
      ? "Conserva un dado asignado para el siguiente turno."
      : "Disponible después de asignar dados y entrar en acción.";
  } else if (app.state.classId === "scout") {
    powerHint.textContent = app.state.phase === "assign"
      ? "Permite asignar un dado a Alcance."
      : "Disponible durante la asignación.";
  } else if (app.state.classId === "arcanist") {
    powerHint.textContent = ["energy", "assign"].includes(app.state.phase)
      ? "Repite la tirada completa."
      : "Disponible antes de entrar en acción.";
  } else if (app.state.classId === "berserker") {
    powerHint.textContent = app.state.hp === 1 && app.state.phase === "assign"
      ? "Repite la tirada con 1 de vida."
      : "Solo disponible con 1 de vida durante la asignación.";
  } else {
    powerHint.textContent = "";
  }

  renderDice();
  renderBoard();
  scrollActivePanelIntoView(previousPhase);
  lastRenderedPhase = app.state.phase;
}

function registerSlotEvents() {
  $$(".slot[data-slot]").forEach((slot) => {
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("over");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("over"));
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("over");
      assignDie(Number(event.dataTransfer.getData("text/plain")), slot.dataset.slot);
    });
    slot.addEventListener("click", () => assignSelectedDie(slot.dataset.slot));
    slot.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        assignSelectedDie(slot.dataset.slot);
      }
    });
  });
}

function registerModalAccessibility() {
  modalOrder.forEach((id) => {
    const modal = modalElement(id);
    const panel = modalPanel(id);
    if (modal) modal.setAttribute("aria-hidden", String(modal.classList.contains("hidden")));
    if (!panel) return;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.tabIndex = -1;
  });

  document.addEventListener("keydown", (event) => {
    const activeModalId = topModalId();
    if (!activeModalId) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeTopModalWithEscape();
      return;
    }

    if (event.key !== "Tab") return;

    const panel = modalPanel(activeModalId);
    const focusables = focusableElements(panel);
    if (!focusables.length) {
      event.preventDefault();
      panel?.focus();
      return;
    }

    event.preventDefault();
    const currentIndex = focusables.indexOf(document.activeElement);
    const nextIndex = event.shiftKey
      ? (currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1)
      : (currentIndex === -1 || currentIndex === focusables.length - 1 ? 0 : currentIndex + 1);
    focusElement(focusables[nextIndex]);
  });

  document.addEventListener("focusin", (event) => {
    const activeModalId = topModalId();
    if (!activeModalId) return;

    const panel = modalPanel(activeModalId);
    if (!panel) return;

    const target = event.target;
    if (target instanceof Node && panel.contains(target)) return;

    focusElement(focusableElements(panel)[0] || panel);
  }, true);
}

function initializeUi() {
  registerUi({
    render,
    say,
    toast,
    updateContinueButton: updateContinueButtonUi,
    setStartModalHidden,
    setHelpModalHidden,
    setUpgradeModalHidden,
    setSaveModalHidden,
    setLoadModalHidden,
    setDeleteConfirmModalHidden,
    setEndModalHidden,
    setEndContent,
    openHelp: openHelpModal
  });

  registerSlotEvents();
  registerModalAccessibility();
  updateModalEnvironment();
  syncClassSelection();
  setKidMode(app.kidMode);
  updateContinueButtonUi();

  $("#classGrid").addEventListener("click", (event) => {
    const card = event.target.closest(".choice-card[data-class]");
    if (!card) return;
    setSelectedClass(card.dataset.class);
    syncClassSelection();
  });

  $("#startBtn").onclick = start;
  $("#continueBtn").onclick = (event) => openLoadModal(event.currentTarget);
  $("#kidModeStartBtn").onclick = () => setKidMode(!app.kidMode);
  $("#kidModeBtn").onclick = () => setKidMode(!app.kidMode);
  $("#helpBtn").onclick = (event) => openHelpModal(event.currentTarget);
  $("#helpPrev").onclick = () => {
    app.helpPage--;
    renderHelp();
  };
  $("#helpNext").onclick = () => {
    app.helpPage++;
    renderHelp();
  };
  $("#helpClose").onclick = () => setHelpModalHidden(true);
  $("#saveBtn").onclick = (event) => openSaveModal(event.currentTarget);
  $("#saveSlotPicker").addEventListener("click", (event) => {
    const card = event.target.closest(".save-slot-card[data-slot]");
    if (!card) return;
    selectedSaveSlot = Number(card.dataset.slot);
    renderSaveSlotPicker();
    syncSaveNameInput();
  });
  $("#saveCancelBtn").onclick = closeSaveModal;
  $("#saveDeleteBtn").onclick = () => {
    const slot = getSaveSlots()[selectedSaveSlot];
    if (!slot) return;
    openDeleteConfirm(selectedSaveSlot, "save", $("#saveDeleteBtn"));
  };
  $("#saveConfirmBtn").onclick = () => {
    const name = $("#saveNameInput").value.trim();
    if (!name) {
      toast("Pon un nombre a la partida.");
      $("#saveNameInput").focus();
      return;
    }
    if (!save(selectedSaveSlot, name)) {
      toast("No se pudo guardar la partida.");
      return;
    }
    closeSaveModal();
    updateContinueButtonUi();
  };
  $("#loadSlotsList").addEventListener("click", (event) => {
    const card = event.target.closest(".save-slot-card[data-slot]");
    if (!card) return;
    selectedContinueSlot = Number(card.dataset.slot);
    renderContinueSlots();
  });
  $("#loadCancelBtn").onclick = closeLoadModal;
  $("#loadDeleteBtn").onclick = () => {
    const slot = getSaveSlots()[selectedContinueSlot];
    if (!slot) return;
    openDeleteConfirm(selectedContinueSlot, "load", $("#loadDeleteBtn"));
  };
  $("#loadConfirmBtn").onclick = () => {
    if (!load(selectedContinueSlot)) {
      toast("No se pudo cargar esa partida.");
      return;
    }
    closeLoadModal();
  };
  $("#deleteConfirmCancelBtn").onclick = closeDeleteConfirm;
  $("#deleteConfirmAcceptBtn").onclick = confirmDeleteSlot;

  const legacyNewBtn = $("#newBtn");
  if (legacyNewBtn) {
    legacyNewBtn.onclick = () => confirm("¿Empezar una partida nueva?") && reset();
  }

  $("#powerBtn").onclick = classPower;
  $("#soundBtn").onclick = () => {
    app.sound = !app.sound;
    $("#soundBtn").textContent = app.sound ? "🔊" : "🔇";
    $("#soundBtn").setAttribute("aria-pressed", String(app.sound));
    if (app.sound) getAudioContext();
  };
  $("#endRestart").onclick = reset;
  $$("[data-upgrade]").forEach((button) => {
    button.onclick = () => chooseUpgrade(button.dataset.upgrade);
  });
}

/* app-main.js */
initializeUi();

if (TEST_MODE) {
  window.__UMBRAL_TEST__ = {
    getState() {
      return app.state ? JSON.parse(JSON.stringify(app.state)) : null;
    },
    setState(rawState) {
      setTestState(rawState);
    },
    setRolls(values) {
      setTestRolls(values);
    },
    makeState(overrides = {}) {
      return {
        ...freshState(overrides.classId || "warden"),
        ...overrides
      };
    },
    getSaveSlots,
    saveCurrent(slotIndex = 0, name = "Test save") {
      save(slotIndex, name, false);
    },
    normalizeState
  };
}
})();
