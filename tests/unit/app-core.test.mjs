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

const core = await import("../../scripts/app-core.js");

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
    preserved: null,
    _tempRange: undefined
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
