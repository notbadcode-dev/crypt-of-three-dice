import {
  KID_MODE_KEY,
  MAX_SAVE_SLOTS,
  SAVE_KEY,
  SAVE_SLOTS_KEY,
  SAVE_VERSION,
  SIZE,
  TEST_MODE,
  classNames,
  levels,
  layouts
} from "./app-config.js";

export const app = {
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

export function registerUi(hooks) {
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

export function levelData() {
  return levels[app.state.level - 1];
}

export function rand() {
  if (TEST_MODE && app.testRolls.length) return app.testRolls.shift();
  return 1 + Math.floor(Math.random() * 6);
}

export function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < SIZE && y < SIZE;
}

export function wallAt(x, y) {
  return app.state.walls.some((wall) => wall.x === x && wall.y === y);
}

export function enemyAt(x, y) {
  return app.state.enemies.find((enemy) => enemy.x === x && enemy.y === y);
}

export function cost(a, b) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return Math.min(dx, dy) * 3 + Math.abs(dx - dy) * 2;
}

export function losMove(a, b) {
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

export function los(a, b) {
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

export function freshState(classId) {
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

export function isObject(value) {
  return value !== null && typeof value === "object";
}

export function isValidPoint(value) {
  return isObject(value) && Number.isInteger(value.x) && Number.isInteger(value.y);
}

export function normalizeState(raw) {
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

export function hasSave() {
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

export function getSaveSlots() {
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

export function setSelectedClass(classId) {
  if (Object.prototype.hasOwnProperty.call(classNames, classId)) {
    app.selectedClass = classId;
  }
}

export function total(skill) {
  const dieId = app.state.assign[skill];
  const die = app.state.dice.find((item) => item.id === dieId);
  return app.state.skills[skill] + (die ? die.value : 0);
}

export function allAssigned() {
  return ["speed", "attack", "defense"].every((slot) => app.state.assign[slot] !== null) ||
    (app.state.classId === "scout" && app.state.classUsed && ["attack", "defense", "range"].every((slot) => app.state.assign[slot] !== null));
}

export function nextRollValue() {
  if (app.state.preserved && app.state.dice.length === 0) {
    const value = app.state.preserved;
    app.state.preserved = null;
    return value;
  }

  return rand();
}

export function finishRollIfReady() {
  if (app.state.dice.length < 3) return false;
  app.state.assign = {speed:null, attack:null, defense:null, range:null};
  app.state.phase = "assign";
  say("Arrastra cada dado a un atributo.");
  return true;
}

export function setupLevel() {
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

export function rollOne() {
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

export function roll() {
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

export function beginAdventure() {
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

export function endAdventure() {
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

export function neighbors(position, ignoreEnemy = null) {
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

export function monsterScore(position, range) {
  const distance = cost(position, app.state.hero);
  const visible = los(position, app.state.hero);
  if (visible && distance <= range) return Math.abs(range - distance);
  return 100 + Math.max(0, distance - range) + (visible ? 0 : 20);
}

export function moveMonsters() {
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

export function monsterAttack() {
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

export function attackable(enemy) {
  return cost(app.state.hero, enemy) <= app.state.skills.range && los(app.state.hero, enemy);
}

export function attack(enemy) {
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

export function validHeroTarget(x, y) {
  if (app.state.phase !== "adventure") return false;
  if (wallAt(x, y) || enemyAt(x, y)) return false;
  if (x === app.state.hero.x && y === app.state.hero.y) return false;
  return cost(app.state.hero, {x, y}) <= app.state.points.speed && losMove(app.state.hero, {x, y});
}

export function moveHero(x, y) {
  if (!validHeroTarget(x, y)) return;

  const movementCost = cost(app.state.hero, {x, y});
  app.state.hero = {x, y};
  app.state.points.speed -= movementCost;

  beep(260, 0.04);
  say(`Movimiento realizado. Gastas ${movementCost} puntos.`);
  render();
}

export function levelComplete() {
  if (app.state.level === 12) {
    finish(true);
    return;
  }

  app.state.phase = "upgrade";
  setUpgradeModalHidden(false);
  render();
}

export function chooseUpgrade(type) {
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

export function finish(win) {
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

export function classPower() {
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

export function save(slotIndex, name, show = true) {
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

export function deleteSaveSlot(slotIndex) {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) return false;

  const slots = getSaveSlots();
  if (!slots[slotIndex]) return false;

  slots[slotIndex] = null;
  persistSaveSlots(slots);
  if (app.currentSaveSlot === slotIndex) app.currentSaveSlot = null;
  updateContinueButton();
  return true;
}

export function load(slotIndex) {
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

export function start() {
  app.state = freshState(app.selectedClass);
  app.selectedDieId = null;
  app.currentSaveSlot = null;
  setStartModalHidden(true);
  setupLevel();
  openHelp();
}

export function reset() {
  app.state = null;
  app.selectedDieId = null;
  app.currentSaveSlot = null;
  location.reload();
}

export function assignDie(id, slot) {
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

export function unassign(id) {
  const die = app.state.dice.find((item) => item.id === id);
  if (!die || !die.assigned) return;

  app.state.assign[die.assigned] = null;
  die.assigned = null;
  app.selectedDieId = id;
  render();
}

export function canAssignToSlot(slot) {
  if (!app.state || app.state.phase !== "assign") return false;
  if (slot === "range") return app.state.classId === "scout" && app.state.classUsed;
  return ["speed", "attack", "defense"].includes(slot);
}

export function toggleDieSelection(id) {
  const die = app.state?.dice.find((item) => item.id === id);
  if (!die || die.assigned || app.state.phase !== "assign") return;
  app.selectedDieId = app.selectedDieId === id ? null : id;
  render();
}

export function assignSelectedDie(slot) {
  if (app.selectedDieId === null || !canAssignToSlot(slot)) return;
  assignDie(app.selectedDieId, slot);
}

export function resetAssignments() {
  if (!app.state || app.state.phase !== "assign") return;
  app.state.dice.forEach((die) => {
    die.assigned = null;
  });
  app.state.assign = {speed:null, attack:null, defense:null, range:null};
  app.selectedDieId = null;
  say("Asignación reiniciada. Vuelve a colocar los tres dados.");
  render();
}

export function phaseInstruction() {
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

export function getAudioContext() {
  if (app.audioCtx) return app.audioCtx;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  app.audioCtx = new AudioCtor();
  return app.audioCtx;
}

export function beep(freq, duration) {
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

export function setTestRolls(values) {
  app.testRolls = values.map(Number);
}

export function setTestState(rawState) {
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
