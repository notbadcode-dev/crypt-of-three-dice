import { AUDIO, TEST_MODE } from "../config/app-config.js";
import type { SlotKey } from "../config/types.js";
import { PRIMARY_SLOT_KEYS } from "../config/types.js";
import { app, emptyAssign, render, say, toast } from "../state/app-state.js";
import { beep } from "./audio.js";

export function rand(): number {
  if (TEST_MODE && app.testRolls.length) {return app.testRolls.shift()!;}
  return 1 + Math.floor(Math.random() * 6);
}

export function total(skill: SlotKey): number {
  const dieId = app.state.assign[skill];
  const die = app.state.dice.find((item) => item.id === dieId);
  return app.state.skills[skill] + (die ? die.value : 0);
}

export function allAssigned() {
  return [...PRIMARY_SLOT_KEYS].every((slot) => app.state.assign[slot] !== null) ||
    (app.state.classId === "scout" && app.state.classUsed && (["attack", "defense", "range"] as const).every((slot) => app.state.assign[slot] !== null));
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
  if (app.state.dice.length < 3) {return false;}
  app.state.assign = emptyAssign();
  app.state.phase = "assign";
  say("Arrastra cada dado a un atributo.");
  return true;
}

export function rollOne() {
  if (app.state.phase !== "energy" || app.state.dice.length >= 3) {return;}

  app.state.dice.push({
    id: app.state.dice.length,
    value: nextRollValue(),
    assigned: null
  });

  if (!finishRollIfReady()) {
    say(`Dado ${app.state.dice.length} de 3 lanzado. Puedes tirar otro o completar la tirada.`);
  }

  beep(AUDIO.rollTone.freq, AUDIO.rollTone.duration);
  render();
}

export function roll() {
  const firstValue = app.state.preserved ?? rand();
  app.state.preserved = null;

  app.state.dice = [firstValue, rand(), rand()].map((value, index) => ({
    id: index,
    value,
    assigned: null
  }));
  app.state.assign = emptyAssign();
  app.state.phase = "assign";

  say("Arrastra cada dado a un atributo.");
  beep(AUDIO.rollTone.freq, AUDIO.rollTone.duration);
  render();
}

export function assignDie(id: number, slot: SlotKey) {
  if (app.state.phase !== "assign") {return;}

  if (slot === "range" && !(app.state.classId === "scout" && app.state.classUsed)) {
    toast("Solo la Exploradora puede asignar a Alcance.");
    return;
  }

  if (slot === "range" && app.state.assign.speed !== null) {
    const oldSpeed = app.state.assign.speed;
    app.state.assign.speed = null;
    const oldSpeedDie = app.state.dice.find((die) => die.id === oldSpeed);
    if (oldSpeedDie) {oldSpeedDie.assigned = null;}
  }

  const oldSlot = app.state.dice.find((die) => die.id === id)?.assigned;
  if (oldSlot) {app.state.assign[oldSlot] = null;}

  const occupied = app.state.assign[slot];
  if (occupied !== null) {
    const occupiedDie = app.state.dice.find((die) => die.id === occupied);
    if (occupiedDie) {occupiedDie.assigned = null;}
  }

  app.state.assign[slot] = id;
  const targetDie = app.state.dice.find((die) => die.id === id);
  if (targetDie) {targetDie.assigned = slot;}
  app.selectedDieId = null;

  beep(AUDIO.assignTone.freq, AUDIO.assignTone.duration);
  render();
}

export function unassign(id: number) {
  const die = app.state.dice.find((item) => item.id === id);
  if (!die?.assigned) {return;}

  app.state.assign[die.assigned] = null;
  die.assigned = null;
  app.selectedDieId = id;
  render();
}

export function canAssignToSlot(slot: string): boolean {
  if (app.state?.phase !== "assign") {return false;}
  if (slot === "range") {return app.state.classId === "scout" && app.state.classUsed;}
  return (PRIMARY_SLOT_KEYS as readonly string[]).includes(slot);
}

export function toggleDieSelection(id: number) {
  const die = app.state?.dice.find((item) => item.id === id);
  if (!die || die.assigned || app.state.phase !== "assign") {return;}
  app.selectedDieId = app.selectedDieId === id ? null : id;
  render();
}

export function assignSelectedDie(slot: SlotKey) {
  if (app.selectedDieId === null || !canAssignToSlot(slot)) {return;}
  assignDie(app.selectedDieId, slot);
}

export function resetAssignments() {
  if (app.state?.phase !== "assign") {return;}
  app.state.dice.forEach((die) => {
    die.assigned = null;
  });
  app.state.assign = emptyAssign();
  app.selectedDieId = null;
  say("Asignación reiniciada. Vuelve a colocar los tres dados.");
  render();
}
