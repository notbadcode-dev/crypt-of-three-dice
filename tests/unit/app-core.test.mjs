import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

function createStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

globalThis.localStorage = createStorage();
globalThis.location = {
  search: "?test=1",
  reload() {}
};
globalThis.window = {};

const core = await import("../../.tsbuild/scripts/app-core.js");

function makeState(overrides = {}) {
  return {
    ...core.freshState(overrides.classId || "warden"),
    ...overrides
  };
}

beforeEach(() => {
  localStorage.clear();
  core.app.sound = false;
  core.app.ui = {};
  core.app.selectedDieId = null;
  core.app.testRolls = [];
  core.app.state = null;
  core.app.currentSaveSlot = null;
  core.app.selectedClass = "warden";
});

test("cost calcula movimiento recto y diagonal", () => {
  assert.equal(core.cost({ x: 0, y: 0 }, { x: 1, y: 0 }), 2);
  assert.equal(core.cost({ x: 0, y: 0 }, { x: 1, y: 1 }), 3);
  assert.equal(core.cost({ x: 0, y: 0 }, { x: 2, y: 1 }), 5);
});

test("losMove solo permite trayectorias rectas o diagonales sin bloqueos", () => {
  core.setTestState(makeState({
    phase: "adventure",
    hero: { x: 0, y: 4 },
    enemies: [{ id: "blocker", x: 1, y: 2, hp: 1, maxHp: 1 }],
    walls: [{ x: 1, y: 4 }]
  }));

  assert.equal(core.losMove({ x: 0, y: 0 }, { x: 2, y: 0 }), true);
  assert.equal(core.losMove({ x: 0, y: 0 }, { x: 2, y: 2 }), true);
  assert.equal(core.losMove({ x: 0, y: 4 }, { x: 2, y: 4 }), false);
  assert.equal(core.losMove({ x: 0, y: 3 }, { x: 2, y: 1 }), false);
  assert.equal(core.losMove({ x: 0, y: 0 }, { x: 2, y: 1 }), false);
});

test("los detecta muros y enemigos bloqueando la linea de vision", () => {
  core.setTestState(makeState({
    phase: "adventure",
    hero: { x: 0, y: 4 },
    enemies: [{ id: "blocker", x: 2, y: 2, hp: 1, maxHp: 1 }],
    walls: [{ x: 1, y: 3 }]
  }));

  assert.equal(core.los({ x: 0, y: 4 }, { x: 4, y: 4 }), true);
  assert.equal(core.los({ x: 0, y: 4 }, { x: 4, y: 0 }), false);

  core.setTestState(makeState({
    phase: "adventure",
    hero: { x: 0, y: 4 },
    enemies: [{ id: "blocker", x: 2, y: 2, hp: 1, maxHp: 1 }],
    walls: []
  }));

  assert.equal(core.los({ x: 0, y: 4 }, { x: 4, y: 0 }), false);
});

test("normalizeState clona estados validos y rechaza fases invalidas", () => {
  const valid = makeState({
    phase: "assign",
    dice: [{ id: 0, value: 6, assigned: "speed" }],
    assign: { speed: 0, attack: null, defense: null, range: null }
  });

  const normalized = core.normalizeState(valid);
  assert.ok(normalized);
  assert.notEqual(normalized, valid);
  assert.notEqual(normalized.hero, valid.hero);
  assert.deepEqual(normalized, {
    ...valid,
    saveVersion: 2,
    classUsed: false,
    preserved: null
  });

  assert.equal(core.normalizeState({ ...valid, phase: "bogus" }), null);
});

test("save y load gestionan ranuras con nombre", () => {
  core.setTestState(makeState({
    level: 4,
    turn: 2,
    hero: { x: 2, y: 3 }
  }));

  assert.equal(core.save(2, "Expedicion alfa", false), true);

  const slots = core.getSaveSlots();
  assert.equal(slots.filter(Boolean).length, 1);
  assert.equal(slots[2].name, "Expedicion alfa");
  assert.equal(slots[2].state.level, 4);

  core.app.state = null;
  assert.equal(core.load(2), true);
  assert.equal(core.app.currentSaveSlot, 2);
  assert.equal(core.app.state.level, 4);
  assert.deepEqual(core.app.state.hero, { x: 2, y: 3 });
});

test("getSaveSlots migra la partida antigua a la primera ranura", () => {
  localStorage.setItem("crypt_three_dice_retro_board_v1", JSON.stringify(makeState({
    classId: "scout",
    level: 3
  })));

  const slots = core.getSaveSlots();
  assert.equal(slots.filter(Boolean).length, 1);
  assert.equal(slots[0].state.classId, "scout");
  assert.equal(slots[0].state.level, 3);
  assert.match(slots[0].name, /Exploradora/);
  assert.equal(localStorage.getItem("crypt_three_dice_retro_board_v1"), null);
});

test("reset no elimina las partidas guardadas", () => {
  core.setTestState(makeState({ level: 2 }));
  core.save(0, "Persistente", false);
  core.reset();

  const slots = core.getSaveSlots();
  assert.equal(slots[0].name, "Persistente");
  assert.equal(core.app.state, null);
});

test("deleteSaveSlot elimina una ranura concreta", () => {
  core.setTestState(makeState({ level: 2 }));
  core.save(0, "Uno", false);
  core.save(1, "Dos", false);

  assert.equal(core.deleteSaveSlot(0), true);

  const slots = core.getSaveSlots();
  assert.equal(slots[0], null);
  assert.equal(slots[1].name, "Dos");
});

test("allAssigned contempla la rama normal y la especial de exploradora", () => {
  core.setTestState(makeState({
    classId: "warden",
    phase: "assign",
    dice: [
      { id: 0, value: 1, assigned: "speed" },
      { id: 1, value: 2, assigned: "attack" },
      { id: 2, value: 3, assigned: null }
    ],
    assign: { speed: 0, attack: 1, defense: null, range: null }
  }));
  assert.equal(core.allAssigned(), false);

  core.setTestState(makeState({
    classId: "scout",
    classUsed: true,
    phase: "assign",
    dice: [
      { id: 0, value: 1, assigned: "attack" },
      { id: 1, value: 2, assigned: "defense" },
      { id: 2, value: 3, assigned: "range" }
    ],
    assign: { speed: null, attack: 0, defense: 1, range: 2 }
  }));
  assert.equal(core.allAssigned(), true);
});

test("assignDie restringe alcance y la exploradora mueve velocidad fuera al usar rango", () => {
  const toasts = [];
  core.registerUi({ toast: (message) => toasts.push(message) });

  core.setTestState(makeState({
    classId: "warden",
    phase: "assign",
    dice: [
      { id: 0, value: 4, assigned: null },
      { id: 1, value: 2, assigned: null },
      { id: 2, value: 6, assigned: null }
    ]
  }));
  core.assignDie(0, "range");
  assert.equal(core.app.state.assign.range, null);
  assert.match(toasts.at(-1), /Exploradora/);

  core.setTestState(makeState({
    classId: "scout",
    classUsed: true,
    phase: "assign",
    dice: [
      { id: 0, value: 4, assigned: "speed" },
      { id: 1, value: 2, assigned: null },
      { id: 2, value: 6, assigned: null }
    ],
    assign: { speed: 0, attack: null, defense: null, range: null }
  }));
  core.assignDie(2, "range");

  assert.equal(core.app.state.assign.speed, null);
  assert.equal(core.app.state.assign.range, 2);
  assert.equal(core.app.state.dice[0].assigned, null);
  assert.equal(core.app.state.dice[2].assigned, "range");
});

test("validHeroTarget y attackable respetan fase, coste, ocupacion y vision", () => {
  core.setTestState(makeState({
    phase: "adventure",
    hero: { x: 0, y: 4 },
    skills: { speed: 1, attack: 1, defense: 1, range: 4 },
    points: { speed: 4, attack: 2, defense: 0 },
    enemies: [{ id: "enemy", x: 2, y: 4, hp: 2, maxHp: 2 }],
    walls: [{ x: 1, y: 3 }]
  }));

  assert.equal(core.validHeroTarget(2, 4), false);
  assert.equal(core.validHeroTarget(1, 3), false);
  assert.equal(core.validHeroTarget(0, 3), true);
  assert.equal(core.attackable(core.app.state.enemies[0]), true);

  core.setTestState(makeState({
    phase: "adventure",
    hero: { x: 0, y: 4 },
    skills: { speed: 1, attack: 1, defense: 1, range: 2 },
    points: { speed: 4, attack: 2, defense: 0 },
    enemies: [{ id: "enemy", x: 2, y: 2, hp: 2, maxHp: 2 }],
    walls: [{ x: 1, y: 3 }]
  }));

  assert.equal(core.attackable(core.app.state.enemies[0]), false);
});

test("moveMonsters acerca enemigos al heroe sin atravesar ocupantes", () => {
  core.setTestState(makeState({
    level: 1,
    phase: "monsterMove",
    hero: { x: 0, y: 4 },
    enemies: [
      { id: "front", x: 4, y: 4, hp: 2, maxHp: 2 },
      { id: "rear", x: 4, y: 3, hp: 2, maxHp: 2 }
    ],
    walls: []
  }));

  const before = core.app.state.enemies.map((enemy) => ({
    id: enemy.id,
    distance: core.cost(enemy, core.app.state.hero)
  }));

  core.moveMonsters();

  const after = core.app.state.enemies.map((enemy) => ({
    id: enemy.id,
    distance: core.cost(enemy, core.app.state.hero),
    x: enemy.x,
    y: enemy.y
  }));

  assert.ok(after.every((enemy) => {
    const previous = before.find((item) => item.id === enemy.id);
    return enemy.distance <= previous.distance;
  }));
  assert.equal(new Set(after.map((enemy) => `${enemy.x},${enemy.y}`)).size, after.length);
});

test("el guardian conserva un dado y nextRollValue lo reutiliza al siguiente turno", () => {
  const toasts = [];
  core.registerUi({ toast: (message) => toasts.push(message) });

  core.setTestState(makeState({
    classId: "warden",
    phase: "adventure",
    dice: [
      { id: 0, value: 5, assigned: "speed" },
      { id: 1, value: 2, assigned: "attack" },
      { id: 2, value: 1, assigned: "defense" }
    ],
    assign: { speed: 0, attack: 1, defense: 2, range: null }
  }));

  core.classPower();

  assert.equal(core.app.state.classUsed, true);
  assert.equal(core.app.state.preserved, 5);
  assert.match(toasts.at(-1), /Conservaras un 5|Conservarás un 5/);

  core.app.state.dice = [];
  assert.equal(core.nextRollValue(), 5);
  assert.equal(core.app.state.preserved, null);
});

// ---------------------------------------------------------------------------
// core/geometry.ts
// ---------------------------------------------------------------------------

test("inBounds valida los limites del tablero 5x5", () => {
  assert.equal(core.inBounds(0, 0), true);
  assert.equal(core.inBounds(4, 4), true);
  assert.equal(core.inBounds(-1, 0), false);
  assert.equal(core.inBounds(0, 5), false);
  assert.equal(core.inBounds(5, 0), false);
});

test("wallAt y enemyAt detectan ocupantes en una celda del estado actual", () => {
  core.setTestState(makeState({
    walls: [{ x: 1, y: 1 }],
    enemies: [{ id: "e1", x: 2, y: 2, hp: 1, maxHp: 1 }]
  }));

  assert.equal(core.wallAt(1, 1), true);
  assert.equal(core.wallAt(0, 0), false);
  assert.equal(core.enemyAt(2, 2)?.id, "e1");
  assert.equal(core.enemyAt(0, 0), undefined);
});

test("neighbors descarta fuera de tablero, muros, heroe y enemigos ocupando celdas", () => {
  core.setTestState(makeState({
    hero: { x: 0, y: 0 },
    walls: [{ x: 1, y: 0 }],
    enemies: [
      { id: "blocker", x: 1, y: 1, hp: 1, maxHp: 1 },
      { id: "self", x: 0, y: 1, hp: 1, maxHp: 1 }
    ]
  }));

  const options = core.neighbors({ x: 0, y: 1 }, "self");
  const coords = options.map((option) => `${option.x},${option.y}`).sort();

  assert.deepEqual(coords, ["0,2", "1,2"]);
  assert.equal(options.find((option) => option.x === 1 && option.y === 2).c, 3);
  assert.equal(options.find((option) => option.x === 0 && option.y === 2).c, 2);
});

test("neighbors ignora al propio enemigo mediante el parametro ignoreEnemy", () => {
  core.setTestState(makeState({
    hero: { x: 4, y: 4 },
    walls: [],
    enemies: [{ id: "mover", x: 0, y: 1, hp: 1, maxHp: 1 }]
  }));

  const withoutIgnore = core.neighbors({ x: 1, y: 1 });
  const withIgnore = core.neighbors({ x: 1, y: 1 }, "mover");

  assert.equal(withoutIgnore.some((option) => option.x === 0 && option.y === 1), false);
  assert.equal(withIgnore.some((option) => option.x === 0 && option.y === 1), true);
});

// ---------------------------------------------------------------------------
// core/dice.ts
// ---------------------------------------------------------------------------

test("total suma la habilidad base y el valor del dado asignado, o solo la base sin dado", () => {
  core.setTestState(makeState({
    skills: { speed: 2, attack: 3, defense: 1, range: 2 },
    dice: [{ id: 0, value: 5, assigned: "speed" }],
    assign: { speed: 0, attack: null, defense: null, range: null }
  }));

  assert.equal(core.total("speed"), 7);
  assert.equal(core.total("attack"), 3);
});

test("rand respeta app.testRolls en modo test, consumiendo valores en orden FIFO", () => {
  core.setTestState(makeState());
  core.setTestRolls([2, 4, 6]);

  assert.equal(core.rand(), 2);
  assert.equal(core.rand(), 4);
  assert.equal(core.app.testRolls.length, 1);
});

test("rollOne acumula dados de uno en uno hasta completar la tirada y pasar a assign", () => {
  core.setTestState(makeState({ phase: "energy", dice: [] }));
  core.setTestRolls([3, 5, 1]);

  core.rollOne();
  assert.equal(core.app.state.dice.length, 1);
  assert.equal(core.app.state.phase, "energy");

  core.rollOne();
  core.rollOne();
  assert.equal(core.app.state.dice.length, 3);
  assert.equal(core.app.state.phase, "assign");
  assert.deepEqual(core.app.state.assign, core.emptyAssign());

  core.rollOne();
  assert.equal(core.app.state.dice.length, 3);
});

test("roll tira los tres dados de golpe, reutiliza el valor conservado y pasa a assign", () => {
  core.setTestState(makeState({ phase: "energy", dice: [], preserved: 9 }));
  core.setTestRolls([2, 3]);

  core.roll();

  assert.equal(core.app.state.dice.length, 3);
  assert.equal(core.app.state.dice[0].value, 9);
  assert.equal(core.app.state.dice[1].value, 2);
  assert.equal(core.app.state.dice[2].value, 3);
  assert.equal(core.app.state.preserved, null);
  assert.equal(core.app.state.phase, "assign");
});

test("unassign libera el dado, actualiza el slot y lo deja seleccionado", () => {
  core.setTestState(makeState({
    phase: "assign",
    dice: [{ id: 0, value: 4, assigned: "speed" }],
    assign: { speed: 0, attack: null, defense: null, range: null }
  }));

  core.unassign(0);

  assert.equal(core.app.state.dice[0].assigned, null);
  assert.equal(core.app.state.assign.speed, null);
  assert.equal(core.app.selectedDieId, 0);

  core.unassign(99);
  core.unassign(0);
  assert.equal(core.app.selectedDieId, 0);
});

test("canAssignToSlot exige fase assign y restringe alcance a la exploradora activada", () => {
  core.setTestState(makeState({ classId: "warden", phase: "assign" }));
  assert.equal(core.canAssignToSlot("speed"), true);
  assert.equal(core.canAssignToSlot("range"), false);

  core.setTestState(makeState({ classId: "scout", classUsed: true, phase: "assign" }));
  assert.equal(core.canAssignToSlot("range"), true);

  core.setTestState(makeState({ classId: "warden", phase: "energy" }));
  assert.equal(core.canAssignToSlot("speed"), false);
});

test("toggleDieSelection alterna la seleccion solo de dados libres en fase assign", () => {
  core.setTestState(makeState({
    phase: "assign",
    dice: [
      { id: 0, value: 4, assigned: null },
      { id: 1, value: 2, assigned: "speed" }
    ],
    assign: { speed: 1, attack: null, defense: null, range: null }
  }));

  core.toggleDieSelection(0);
  assert.equal(core.app.selectedDieId, 0);
  core.toggleDieSelection(0);
  assert.equal(core.app.selectedDieId, null);

  core.toggleDieSelection(1);
  assert.equal(core.app.selectedDieId, null);
});

test("assignSelectedDie asigna el dado seleccionado si el slot es valido", () => {
  core.setTestState(makeState({
    phase: "assign",
    dice: [{ id: 0, value: 4, assigned: null }]
  }));

  core.app.selectedDieId = 0;
  core.assignSelectedDie("attack");

  assert.equal(core.app.state.assign.attack, 0);
  assert.equal(core.app.state.dice[0].assigned, "attack");
  assert.equal(core.app.selectedDieId, null);
});

test("resetAssignments limpia asignaciones y seleccion solo en fase assign", () => {
  core.setTestState(makeState({
    phase: "assign",
    dice: [{ id: 0, value: 4, assigned: "speed" }],
    assign: { speed: 0, attack: null, defense: null, range: null }
  }));
  core.app.selectedDieId = 0;

  core.resetAssignments();

  assert.equal(core.app.state.dice[0].assigned, null);
  assert.deepEqual(core.app.state.assign, core.emptyAssign());
  assert.equal(core.app.selectedDieId, null);
});

// ---------------------------------------------------------------------------
// core/combat.ts
// ---------------------------------------------------------------------------

test("monsterAttack reduce el daño segun la defensa cuando hay atacantes en rango con vision", () => {
  core.setTestState(makeState({
    level: 3,
    phase: "monsterAttack",
    hero: { x: 0, y: 4 },
    hp: 6,
    maxHp: 6,
    turn: 3,
    points: { speed: 0, attack: 0, defense: 1 },
    enemies: [
      { id: "e1", x: 1, y: 4, hp: 1, maxHp: 1 },
      { id: "e2", x: 0, y: 3, hp: 1, maxHp: 1 }
    ],
    dice: [{ id: 0, value: 4, assigned: "speed" }],
    assign: { speed: 0, attack: null, defense: null, range: null }
  }));

  core.monsterAttack();

  assert.equal(core.app.state.hp, 2);
  assert.equal(core.app.state.turn, 4);
  assert.equal(core.app.state.phase, "energy");
  assert.deepEqual(core.app.state.dice, []);
  assert.deepEqual(core.app.state.assign, core.emptyAssign());
  assert.deepEqual(core.app.state.points, core.emptyPoints());
});

test("monsterAttack no reduce vida si la defensa absorbe todo el daño, pero avanza el turno", () => {
  core.setTestState(makeState({
    level: 1,
    phase: "monsterAttack",
    hero: { x: 0, y: 4 },
    hp: 6,
    maxHp: 6,
    turn: 1,
    points: { speed: 0, attack: 0, defense: 5 },
    enemies: [{ id: "e1", x: 1, y: 4, hp: 1, maxHp: 1 }]
  }));

  core.monsterAttack();

  assert.equal(core.app.state.hp, 6);
  assert.equal(core.app.state.turn, 2);
  assert.equal(core.app.state.phase, "energy");
});

test("monsterAttack no inflige daño si ningun enemigo esta en rango o con vision", () => {
  core.setTestState(makeState({
    level: 1,
    phase: "monsterAttack",
    hero: { x: 0, y: 4 },
    hp: 6,
    maxHp: 6,
    turn: 1,
    points: { speed: 0, attack: 0, defense: 0 },
    enemies: []
  }));

  core.monsterAttack();

  assert.equal(core.app.state.hp, 6);
  assert.equal(core.app.state.turn, 2);
});

test("monsterAttack finaliza la partida sin avanzar el turno si el heroe llega a 0hp", () => {
  const hooks = [];
  core.registerUi({ setEndContent: (title) => hooks.push(title) });

  core.setTestState(makeState({
    level: 1,
    phase: "monsterAttack",
    hero: { x: 0, y: 4 },
    hp: 1,
    maxHp: 6,
    turn: 5,
    points: { speed: 0, attack: 0, defense: 0 },
    enemies: [{ id: "e1", x: 1, y: 4, hp: 1, maxHp: 1 }],
    dice: [{ id: 0, value: 4, assigned: "speed" }],
    assign: { speed: 0, attack: null, defense: null, range: null }
  }));

  core.monsterAttack();

  assert.equal(core.app.state.hp, 0);
  assert.equal(core.app.state.phase, "end");
  assert.equal(core.app.state.turn, 5);
  assert.equal(core.app.state.dice.length, 1);
  assert.match(hooks.at(-1), /caído/);
});

test("attack no hace nada fuera de fase adventure o si el enemigo no es atacable", () => {
  core.setTestState(makeState({
    phase: "assign",
    hero: { x: 0, y: 4 },
    skills: { speed: 1, attack: 1, defense: 1, range: 4 },
    points: { speed: 0, attack: 5, defense: 0 },
    enemies: [{ id: "e1", x: 1, y: 4, hp: 2, maxHp: 2 }]
  }));
  core.attack(core.app.state.enemies[0]);
  assert.equal(core.app.state.enemies[0].hp, 2);

  core.setTestState(makeState({
    phase: "adventure",
    hero: { x: 0, y: 4 },
    skills: { speed: 1, attack: 1, defense: 1, range: 1 },
    points: { speed: 0, attack: 5, defense: 0 },
    enemies: [{ id: "e1", x: 4, y: 4, hp: 2, maxHp: 2 }]
  }));
  core.attack(core.app.state.enemies[0]);
  assert.equal(core.app.state.enemies[0].hp, 2);
});

test("attack avisa si faltan puntos de ataque suficientes para golpear", () => {
  const toasts = [];
  core.registerUi({ toast: (message) => toasts.push(message) });

  core.setTestState(makeState({
    level: 1,
    phase: "adventure",
    hero: { x: 0, y: 4 },
    skills: { speed: 1, attack: 1, defense: 1, range: 4 },
    points: { speed: 0, attack: 0, defense: 0 },
    enemies: [{ id: "e1", x: 1, y: 4, hp: 2, maxHp: 2 }]
  }));

  core.attack(core.app.state.enemies[0]);

  assert.equal(core.app.state.enemies[0].hp, 2);
  assert.match(toasts.at(-1), /Necesitas/);
});

test("attack inflige daño, consume puntos, derrota al enemigo y encadena levelComplete", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });

  core.setTestState(makeState({
    level: 1,
    phase: "adventure",
    hero: { x: 0, y: 4 },
    skills: { speed: 1, attack: 1, defense: 1, range: 4 },
    points: { speed: 0, attack: 1, defense: 0 },
    enemies: [{ id: "e1", x: 1, y: 4, hp: 1, maxHp: 1 }]
  }));

  core.attack(core.app.state.enemies[0]);

  assert.equal(core.app.state.points.attack, 0);
  assert.equal(core.app.state.enemies.length, 0);
  assert.equal(core.app.state.phase, "adventure");

  t.mock.timers.tick(260);
  assert.equal(core.app.state.phase, "upgrade");
});

test("moveHero mueve al heroe y descuenta puntos de velocidad solo si el destino es valido", () => {
  core.setTestState(makeState({
    phase: "adventure",
    hero: { x: 0, y: 4 },
    points: { speed: 4, attack: 0, defense: 0 },
    enemies: [],
    walls: []
  }));

  core.moveHero(4, 4);
  assert.deepEqual(core.app.state.hero, { x: 0, y: 4 });

  core.moveHero(1, 4);
  assert.deepEqual(core.app.state.hero, { x: 1, y: 4 });
  assert.equal(core.app.state.points.speed, 2);
});

// ---------------------------------------------------------------------------
// core/game-flow.ts
// ---------------------------------------------------------------------------

test("setupLevel coloca al heroe, genera enemigos segun el nivel y reinicia energia/asignacion", () => {
  core.setTestState(makeState({ level: 2, classUsed: true, preserved: 5 }));

  core.setupLevel();

  const state = core.app.state;
  assert.deepEqual(state.hero, { x: 4, y: 4 });
  assert.equal(state.enemies.length, 2);
  assert.equal(state.walls.length, 3);
  assert.equal(state.phase, "energy");
  assert.equal(state.turn, 1);
  assert.deepEqual(state.dice, []);
  assert.equal(state.classUsed, false);
  assert.equal(state.preserved, null);
});

test("beginAdventure exige los tres dados asignados antes de activar la fase adventure", () => {
  const toasts = [];
  core.registerUi({ toast: (message) => toasts.push(message) });

  core.setTestState(makeState({
    classId: "warden",
    phase: "assign",
    dice: [{ id: 0, value: 4, assigned: "speed" }],
    assign: { speed: 0, attack: null, defense: null, range: null }
  }));

  core.beginAdventure();

  assert.equal(core.app.state.phase, "assign");
  assert.match(toasts.at(-1), /asignar los tres dados/);
});

test("beginAdventure calcula puntos de movimiento, ataque y defensa segun habilidad y dado asignado", () => {
  core.setTestState(makeState({
    classId: "warden",
    phase: "assign",
    skills: { speed: 1, attack: 1, defense: 1, range: 2 },
    dice: [
      { id: 0, value: 4, assigned: "speed" },
      { id: 1, value: 3, assigned: "attack" },
      { id: 2, value: 2, assigned: "defense" }
    ],
    assign: { speed: 0, attack: 1, defense: 2, range: null }
  }));

  core.beginAdventure();

  assert.equal(core.app.state.phase, "adventure");
  assert.equal(core.app.state.points.speed, 5);
  assert.equal(core.app.state.points.attack, 4);
  assert.equal(core.app.state.points.defense, 3);
});

test("beginAdventure añade el bono temporal de alcance cuando la exploradora asigna a range", () => {
  core.setTestState(makeState({
    classId: "scout",
    classUsed: true,
    phase: "assign",
    skills: { speed: 1, attack: 1, defense: 1, range: 2 },
    dice: [
      { id: 0, value: 4, assigned: "attack" },
      { id: 1, value: 2, assigned: "defense" },
      { id: 2, value: 3, assigned: "range" }
    ],
    assign: { speed: null, attack: 0, defense: 1, range: 2 }
  }));

  core.beginAdventure();

  assert.equal(core.app.state.skills.range, 5);
  assert.equal(core.app.state._tempRange, 3);
  assert.equal(core.app.state.points.speed, 1);
});

test("endAdventure retira el bono temporal de alcance y encadena movimiento y ataque enemigo tras los retrasos", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });

  core.setTestState(makeState({
    level: 1,
    phase: "adventure",
    hero: { x: 0, y: 4 },
    hp: 6,
    maxHp: 6,
    turn: 1,
    points: { speed: 0, attack: 0, defense: 5 },
    enemies: [{ id: "e1", x: 4, y: 4, hp: 2, maxHp: 2 }],
    skills: { speed: 1, attack: 1, defense: 1, range: 2 },
    _tempRange: 3
  }));
  core.app.state.skills.range = 5;

  core.endAdventure();

  assert.equal(core.app.state.skills.range, 2);
  assert.equal(core.app.state._tempRange, undefined);
  assert.equal(core.app.state.phase, "monsterMove");

  t.mock.timers.tick(450);
  assert.equal(core.app.state.phase, "monsterAttack");

  t.mock.timers.tick(500);
  assert.equal(core.app.state.phase, "energy");
  assert.equal(core.app.state.turn, 2);
});

test("levelComplete pasa a fase upgrade salvo en el ultimo nivel, donde finaliza con victoria", () => {
  const hooks = { upgradeHidden: [], endContent: [] };

  core.setTestState(makeState({ level: 1 }));
  core.registerUi({
    setUpgradeModalHidden: (hidden) => hooks.upgradeHidden.push(hidden),
    setEndContent: (title, text) => hooks.endContent.push([title, text])
  });
  core.levelComplete();
  assert.equal(core.app.state.phase, "upgrade");
  assert.deepEqual(hooks.upgradeHidden, [false]);

  core.app.ui = {};
  core.setTestState(makeState({ level: 12 }));
  core.registerUi({
    setUpgradeModalHidden: (hidden) => hooks.upgradeHidden.push(hidden),
    setEndContent: (title, text) => hooks.endContent.push([title, text])
  });
  core.levelComplete();
  assert.equal(core.app.state.phase, "end");
  assert.match(hooks.endContent.at(-1)[0], /conquistado/);
});

test("chooseUpgrade sana al elegir heal y sube estadisticas en otros casos, avanzando de nivel", () => {
  core.setTestState(makeState({ level: 1, hp: 2, maxHp: 6, skills: { speed: 1, attack: 1, defense: 1, range: 2 } }));

  core.chooseUpgrade("heal");
  assert.equal(core.app.state.hp, core.app.state.maxHp);
  assert.equal(core.app.state.level, 2);
  assert.equal(core.app.state.phase, "energy");

  core.setTestState(makeState({ level: 2, skills: { speed: 1, attack: 1, defense: 1, range: 2 } }));
  core.chooseUpgrade("attack");
  assert.equal(core.app.state.skills.attack, 2);
  assert.equal(core.app.state.level, 3);
});

test("chooseUpgrade guarda automaticamente en la ranura activa tras subir de nivel", () => {
  core.setTestState(makeState({ level: 1 }));
  core.save(0, "Auto", false);
  core.app.currentSaveSlot = 0;

  core.chooseUpgrade("speed");

  const slots = core.getSaveSlots();
  assert.equal(slots[0].name, "Auto");
  assert.equal(slots[0].state.level, 2);
});

test("finish define el contenido final y la fase end tanto en victoria como en derrota", () => {
  const hooks = { content: [], hiddenCalls: [] };

  core.setTestState(makeState({ level: 5 }));
  core.registerUi({
    setEndContent: (title, text) => hooks.content.push([title, text]),
    setEndModalHidden: (hidden) => hooks.hiddenCalls.push(hidden)
  });

  core.finish(false);
  assert.equal(core.app.state.phase, "end");
  assert.match(hooks.content.at(-1)[0], /caído/);
  assert.match(hooks.content.at(-1)[1], /nivel 5/);
  assert.deepEqual(hooks.hiddenCalls, [false]);

  core.finish(true);
  assert.match(hooks.content.at(-1)[0], /conquistado/);
});

test("start crea una partida nueva para la clase seleccionada y prepara el primer nivel", () => {
  core.app.selectedClass = "berserker";
  core.app.currentSaveSlot = 3;
  core.app.selectedDieId = 2;

  core.start();

  assert.equal(core.app.state.classId, "berserker");
  assert.equal(core.app.state.level, 1);
  assert.equal(core.app.state.phase, "energy");
  assert.equal(core.app.currentSaveSlot, null);
  assert.equal(core.app.selectedDieId, null);
});

test("phaseInstruction devuelve texto vacio sin estado y textos distintos segun fase y progreso", () => {
  core.app.state = null;
  assert.equal(core.phaseInstruction(), "");

  core.setTestState(makeState({ phase: "energy", dice: [] }));
  assert.match(core.phaseInstruction(), /uno en uno/);

  core.setTestState(makeState({
    phase: "energy",
    dice: [{ id: 0, value: 3, assigned: null }]
  }));
  assert.match(core.phaseInstruction(), /Has lanzado 1 de 3/);

  core.setTestState(makeState({
    phase: "assign",
    dice: [{ id: 0, value: 3, assigned: null }],
    assign: { speed: null, attack: null, defense: null, range: null }
  }));
  assert.match(core.phaseInstruction(), /Asigna un dado/);

  core.setTestState(makeState({
    classId: "scout",
    classUsed: true,
    phase: "assign",
    dice: [
      { id: 0, value: 1, assigned: "attack" },
      { id: 1, value: 2, assigned: "defense" },
      { id: 2, value: 3, assigned: "range" }
    ],
    assign: { speed: null, attack: 0, defense: 1, range: 2 }
  }));
  assert.match(core.phaseInstruction(), /Asignación completa/);

  core.setTestState(makeState({ phase: "adventure", points: { speed: 2, attack: 1, defense: 0 } }));
  assert.match(core.phaseInstruction(), /Mueve o ataca/);

  core.setTestState(makeState({ phase: "adventure", points: { speed: 3, attack: 0, defense: 0 } }));
  assert.match(core.phaseInstruction(), /Queda movimiento/);

  core.setTestState(makeState({ phase: "adventure", points: { speed: 0, attack: 2, defense: 0 } }));
  assert.match(core.phaseInstruction(), /Queda ataque/);

  core.setTestState(makeState({ phase: "adventure", points: { speed: 0, attack: 0, defense: 0 } }));
  assert.match(core.phaseInstruction(), /Sin acciones/);

  core.setTestState(makeState({ phase: "monsterMove" }));
  assert.match(core.phaseInstruction(), /Fase enemiga/);

  core.setTestState(makeState({ phase: "upgrade" }));
  assert.match(core.phaseInstruction(), /recompensa/);

  core.setTestState(makeState({ phase: "end" }));
  assert.match(core.phaseInstruction(), /terminado/);
});

test("classPower activa la habilidad de arcanista repitiendo la tirada en fase energy o assign", () => {
  const toasts = [];
  core.registerUi({ toast: (message) => toasts.push(message) });

  core.setTestState(makeState({
    classId: "arcanist",
    phase: "assign",
    dice: [{ id: 0, value: 3, assigned: "speed" }],
    assign: { speed: 0, attack: null, defense: null, range: null }
  }));
  core.setTestRolls([1, 2, 6]);

  core.classPower();

  assert.equal(core.app.state.classUsed, true);
  assert.equal(core.app.state.dice.length, 3);
  assert.equal(core.app.state.phase, "assign");
  assert.match(toasts.at(-1), /repetida/);
});

test("classPower activa la furia del berserker solo con 1hp en fase assign", () => {
  core.setTestState(makeState({
    classId: "berserker",
    phase: "assign",
    hp: 1,
    dice: [{ id: 0, value: 3, assigned: "speed" }],
    assign: { speed: 0, attack: null, defense: null, range: null }
  }));
  core.setTestRolls([4, 5, 6]);

  core.classPower();

  assert.equal(core.app.state.classUsed, true);
  assert.equal(core.app.state.dice.length, 3);
});

test("classPower habilita el slot de alcance para la exploradora en fase assign", () => {
  core.setTestState(makeState({ classId: "scout", phase: "assign" }));

  core.classPower();

  assert.equal(core.app.state.classUsed, true);
});

test("classPower no repite efectos si la habilidad de clase ya se uso en este nivel", () => {
  core.setTestState(makeState({ classId: "scout", phase: "assign", classUsed: true, dice: [] }));

  core.classPower();

  assert.equal(core.app.state.classUsed, true);
  assert.equal(core.app.state.dice.length, 0);
});

// ---------------------------------------------------------------------------
// state/persistence.ts
// ---------------------------------------------------------------------------

test("hasSave refleja si existe alguna ranura ocupada", () => {
  assert.equal(core.hasSave(), false);

  core.setTestState(makeState({ level: 2 }));
  core.save(0, "Alguna", false);

  assert.equal(core.hasSave(), true);
});

test("normalizeState rechaza estados con campos invalidos o de tipo incorrecto", () => {
  const valid = makeState();

  assert.equal(core.normalizeState(null), null);
  assert.equal(core.normalizeState("no-es-un-objeto"), null);
  assert.equal(core.normalizeState({ ...valid, saveVersion: 999 }), null);
  assert.equal(core.normalizeState({ ...valid, classId: "inexistente" }), null);
  assert.equal(core.normalizeState({ ...valid, level: 0 }), null);
  assert.equal(core.normalizeState({ ...valid, level: 999 }), null);
  assert.equal(core.normalizeState({ ...valid, turn: 0 }), null);
  assert.equal(core.normalizeState({ ...valid, hp: 1.5 }), null);
  assert.equal(core.normalizeState({ ...valid, maxHp: 0 }), null);
  assert.equal(core.normalizeState({ ...valid, skills: { ...valid.skills, speed: "1" } }), null);
  assert.equal(core.normalizeState({ ...valid, assign: { ...valid.assign, speed: "0" } }), null);
  assert.equal(core.normalizeState({ ...valid, points: { ...valid.points, attack: null } }), null);
  assert.equal(core.normalizeState({ ...valid, hero: { x: 0 } }), null);
  assert.equal(core.normalizeState({ ...valid, walls: "no-array" }), null);
  assert.equal(core.normalizeState({ ...valid, walls: [{ x: 0, y: "1" }] }), null);
  assert.equal(core.normalizeState({ ...valid, enemies: [{ x: 0, y: 0, hp: 1, maxHp: 1 }] }), null);
  assert.equal(core.normalizeState({ ...valid, dice: [{ id: 0, value: "6", assigned: null }] }), null);
  assert.equal(core.normalizeState({ ...valid, phase: "bogus" }), null);

  const withoutVersion = core.normalizeState({ ...valid, saveVersion: undefined });
  assert.ok(withoutVersion);
  assert.equal(withoutVersion.saveVersion, valid.saveVersion);

  const withTempRange = core.normalizeState({ ...valid, _tempRange: 3 });
  assert.equal(withTempRange._tempRange, 3);
});

test("save y deleteSaveSlot rechazan indices fuera de rango o nombres vacios", () => {
  core.setTestState(makeState({ level: 1 }));

  assert.equal(core.save(-1, "X"), false);
  assert.equal(core.save(core.getSaveSlots().length, "X"), false);
  assert.equal(core.save(0, "   "), false);
  assert.equal(core.save(0, ""), false);

  assert.equal(core.deleteSaveSlot(-1), false);
  assert.equal(core.deleteSaveSlot(99), false);
  assert.equal(core.deleteSaveSlot(0), false);
});

test("load rechaza indices invalidos o ranuras vacias sin lanzar", () => {
  assert.equal(core.load(-1), false);
  assert.equal(core.load(99), false);
  assert.equal(core.load(0), false);
});

test("getSaveSlots normaliza datos corruptos en localStorage a ranuras vacias sin lanzar", () => {
  localStorage.setItem("crypt_three_dice_retro_slots_v1", "{no-es-json-valido");

  const slots = core.getSaveSlots();

  assert.equal(slots.length, 5);
  assert.ok(slots.every((slot) => slot === null));

  localStorage.setItem("crypt_three_dice_retro_slots_v1", JSON.stringify([
    { name: "", savedAt: 1, state: makeState() },
    { state: makeState() },
    "no-es-un-objeto"
  ]));

  const normalized = core.getSaveSlots();
  assert.ok(normalized.every((slot) => slot === null));
});
