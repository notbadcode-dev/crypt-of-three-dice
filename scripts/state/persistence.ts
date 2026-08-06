import {
  MAX_SAVE_SLOTS,
  SAVE_KEY,
  SAVE_SLOTS_KEY,
  SAVE_VERSION,
  STARTING_HP,
  classNames,
  levels
} from "../config/app-config.js";
import type { AssignState, ClassId, DieState, EnemyState, GameState, PointState, Position, SaveSlot, SkillState } from "../config/types.js";
import {
  app,
  emptyAssign,
  emptyPoints,
  render,
  say,
  setEndModalHidden,
  setHelpModalHidden,
  setStartModalHidden,
  setUpgradeModalHidden,
  toast,
  updateContinueButton
} from "./app-state.js";

export function freshState(classId: ClassId): GameState {
  return {
    saveVersion: SAVE_VERSION,
    classId,
    level: 1,
    turn: 1,
    hp: STARTING_HP,
    maxHp: STARTING_HP,
    skills: {speed:1, attack:1, defense:1, range:2},
    phase: "energy",
    dice: [],
    assign: emptyAssign(),
    points: emptyPoints(),
    hero: {x:0, y:4},
    enemies: [],
    walls: [],
    classUsed: false,
    preserved: null
  };
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export function isValidPoint(value: unknown): value is Position {
  return isObject(value) && Number.isInteger(value.x) && Number.isInteger(value.y);
}

export function normalizeState(raw: unknown): GameState | null {
  if (!isObject(raw)) {return null;}
  if (raw.saveVersion !== undefined && raw.saveVersion !== SAVE_VERSION) {return null;}
  if (typeof raw.classId !== "string" || !Object.hasOwn(classNames, raw.classId)) {return null;}
  if (!Number.isInteger(raw.level) || (raw.level as number) < 1 || (raw.level as number) > levels.length) {return null;}
  if (!Number.isInteger(raw.turn) || (raw.turn as number) < 1) {return null;}
  if (!Number.isInteger(raw.hp) || !Number.isInteger(raw.maxHp) || (raw.maxHp as number) < 1) {return null;}

  const skills = raw.skills;
  if (!isObject(skills) || !["speed", "attack", "defense", "range"].every((key) => Number.isInteger(skills[key]))) {return null;}
  const assign = raw.assign;
  if (!isObject(assign) || !["speed", "attack", "defense", "range"].every((key) => assign[key] === null || Number.isInteger(assign[key]))) {return null;}
  const points = raw.points;
  if (!isObject(points) || !["speed", "attack", "defense"].every((key) => Number.isInteger(points[key]))) {return null;}
  if (!isValidPoint(raw.hero)) {return null;}
  const rawWalls = raw.walls;
  if (!Array.isArray(rawWalls) || !rawWalls.every(isValidPoint)) {return null;}
  const rawEnemies = raw.enemies;
  if (!Array.isArray(rawEnemies) || !rawEnemies.every((enemy) => isObject(enemy) && typeof enemy.id === "string" && isValidPoint(enemy) && Number.isInteger(enemy.hp) && Number.isInteger(enemy.maxHp))) {return null;}
  const rawDice = raw.dice;
  if (!Array.isArray(rawDice) || !rawDice.every((die) => isObject(die) && Number.isInteger(die.id) && Number.isInteger(die.value) && (die.assigned === null || typeof die.assigned === "string"))) {return null;}
  if (typeof raw.phase !== "string" || !["energy", "assign", "adventure", "monsterMove", "monsterAttack", "upgrade", "end"].includes(raw.phase)) {return null;}

  const walls = rawWalls;
  const enemies = rawEnemies as unknown as EnemyState[];
  const dice = rawDice as unknown as DieState[];
  const tempRange = Number.isInteger(raw._tempRange) ? (raw._tempRange as number) : undefined;

  return {
    saveVersion: SAVE_VERSION,
    classId: raw.classId as ClassId,
    level: raw.level as number,
    turn: raw.turn as number,
    hp: raw.hp as number,
    maxHp: raw.maxHp as number,
    skills: {...skills} as unknown as SkillState,
    phase: raw.phase as GameState["phase"],
    dice: dice.map((die) => ({...die})),
    assign: {...assign} as unknown as AssignState,
    points: {...points} as unknown as PointState,
    hero: {...raw.hero},
    enemies: enemies.map((enemy) => ({...enemy})),
    walls: walls.map((wall) => ({...wall})),
    classUsed: Boolean(raw.classUsed),
    preserved: (raw.preserved as number | null) ?? null,
    ...(tempRange !== undefined ? { _tempRange: tempRange } : {})
  };
}

export function hasSave(): boolean {
  return getSaveSlots().some(Boolean);
}

function normalizeSlot(slot: unknown, index: number): SaveSlot | null {
  if (!isObject(slot)) {return null;}

  const state = normalizeState(slot.state);
  if (!state) {return null;}

  const name = typeof slot.name === "string" ? slot.name.trim().slice(0, 40) : "";
  if (!name) {return null;}

  return {
    id: index,
    name,
    savedAt: typeof slot.savedAt === "number" && Number.isFinite(slot.savedAt) ? slot.savedAt : 0,
    state
  };
}

function persistSaveSlots(slots: (SaveSlot | null)[]) {
  localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(
    slots.map((slot) => slot ? {
      name: slot.name,
      savedAt: slot.savedAt,
      state: slot.state
    } : null)
  ));
  localStorage.removeItem(SAVE_KEY);
}

function buildLegacySlot(): SaveSlot | null {
  try {
    const state = normalizeState(JSON.parse(localStorage.getItem(SAVE_KEY)!));
    if (!state) {return null;}

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

export function getSaveSlots(): (SaveSlot | null)[] {
  let rawSlots: unknown[] | null = null;
  let dirty = false;

  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SAVE_SLOTS_KEY)!);
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
    if (legacySlot || localStorage.getItem(SAVE_KEY) !== null) {dirty = true;}
  }

  const rawSlotsList = rawSlots;
  const normalizedSlots = Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => {
    if (index >= rawSlotsList.length) {
      dirty = true;
      return null;
    }

    const slot = normalizeSlot(rawSlotsList[index], index);
    if (rawSlotsList[index] !== null && !slot) {dirty = true;}
    return slot;
  });

  if (rawSlotsList.length !== MAX_SAVE_SLOTS) {dirty = true;}
  if (dirty) {persistSaveSlots(normalizedSlots);}

  return normalizedSlots;
}

export function save(slotIndex: number, name: string, show = true): boolean {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) {return false;}

  const trimmedName = typeof name === "string" ? name.trim().slice(0, 40) : "";
  if (!trimmedName) {return false;}

  const normalized = normalizeState(app.state);
  if (!normalized) {return false;}

  app.state.saveVersion = SAVE_VERSION;
  const slots = getSaveSlots();
  slots[slotIndex] = {
    id: slotIndex,
    name: trimmedName,
    savedAt: Date.now(),
    state: normalized
  };
  persistSaveSlots(slots);
  app.currentSaveSlot = slotIndex;
  updateContinueButton();
  if (show) {toast(`Partida guardada en ranura ${slotIndex + 1}.`);}
  return true;
}

export function deleteSaveSlot(slotIndex: number): boolean {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) {return false;}

  const slots = getSaveSlots();
  if (!slots[slotIndex]) {return false;}

  slots[slotIndex] = null;
  persistSaveSlots(slots);
  if (app.currentSaveSlot === slotIndex) {app.currentSaveSlot = null;}
  updateContinueButton();
  return true;
}

export function load(slotIndex: number): boolean {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) {return false;}

  try {
    const slot = getSaveSlots()[slotIndex];
    if (!slot) {return false;}

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

export function setTestRolls(values: number[]) {
  app.testRolls = values.map(Number);
}

export function setTestState(rawState: unknown) {
  const normalized = normalizeState(rawState);
  if (!normalized) {throw new Error("Invalid test state");}

  app.state = normalized;
  app.selectedDieId = null;
  setStartModalHidden(true);
  setHelpModalHidden(true);
  setUpgradeModalHidden(true);
  setEndModalHidden(true);
  render();
}
