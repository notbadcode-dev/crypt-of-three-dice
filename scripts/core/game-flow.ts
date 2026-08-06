import { TURN_TIMING, layouts, levels } from "../config/app-config.js";
import type { GameState, UpgradeType } from "../config/types.js";
import {
  app,
  emptyAssign,
  emptyPoints,
  levelData,
  openHelp,
  render,
  say,
  setEndContent,
  setEndModalHidden,
  setStartModalHidden,
  setUpgradeModalHidden,
  toast
} from "../state/app-state.js";
import { freshState, getSaveSlots, save } from "../state/persistence.js";
import { monsterAttack, moveMonsters } from "./combat.js";
import { allAssigned, roll, total } from "./dice.js";

export function setupLevel(): void {
  const data = levelData();
  const layout = layouts[data.layout];
  if (!layout) {return;}

  app.state.hero = {x: layout.hero[0], y: layout.hero[1]};
  app.state.walls = layout.walls.map((pos: [number, number]) => ({x: pos[0], y: pos[1]}));
  app.state.enemies = layout.spawns.slice(0, data.count).map((pos: [number, number], index: number) => ({
    id: `e${Date.now()}${index}`,
    x: pos[0],
    y: pos[1],
    hp: data.hp,
    maxHp: data.hp
  }));
  app.state.turn = 1;
  app.state.phase = "energy";
  app.state.dice = [];
  app.state.assign = emptyAssign();
  app.state.points = emptyPoints();
  app.state.classUsed = false;
  app.state.preserved = null;

  say(`Nivel ${app.state.level}: ${data.name}. Lanza los dados.`);
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
    if (die) {
      app.state.skills.range += die.value;
      app.state._tempRange = die.value;
    }
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
    setTimeout(monsterAttack, TURN_TIMING.monsterAttackDelay);
  }, TURN_TIMING.monsterMoveDelay);
}

export function levelComplete() {
  if (app.state.level === levels.length) {
    finish(true);
    return;
  }

  app.state.phase = "upgrade";
  setUpgradeModalHidden(false);
  render();
}

export function chooseUpgrade(type: UpgradeType) {
  if (type === "heal") {app.state.hp = app.state.maxHp;}
  else {app.state.skills[type]++;}

  app.state.level++;
  setUpgradeModalHidden(true);
  setupLevel();
  if (app.currentSaveSlot !== null) {
    const currentSlot = getSaveSlots()[app.currentSaveSlot];
    if (currentSlot) {save(app.currentSaveSlot, currentSlot.name, false);}
  }
}

export function finish(win: boolean) {
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
  if (app.state.classUsed) {return;}

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

export function start() {
  app.state = freshState(app.selectedClass);
  app.selectedDieId = null;
  app.currentSaveSlot = null;
  setStartModalHidden(true);
  setupLevel();
  openHelp();
}

export function reset() {
  app.state = null as unknown as GameState;
  app.selectedDieId = null;
  app.currentSaveSlot = null;
  location.reload();
}

export function phaseInstruction() {
  if (!app.state) {return "";}

  if (app.state.phase === "energy") {
    const rolled = app.state.dice.length;
    return rolled
      ? `Has lanzado ${rolled} de 3 dados. Tira el siguiente dado o lanza los 3 de nuevo.`
      : "Lanza los dados de uno en uno o los tres a la vez.";
  }

  if (app.state.phase === "assign") {
    if (!allAssigned()) {return "Asigna un dado a MOV, ATQ y DEF. ALC es fijo.";}
    return "Asignación completa. Entra en acción.";
  }

  if (app.state.phase === "adventure") {
    if (app.state.points.speed > 0 && app.state.points.attack > 0) {return "Mueve o ataca con las casillas marcadas.";}
    if (app.state.points.speed > 0) {return "Queda movimiento.";}
    if (app.state.points.attack > 0) {return "Queda ataque.";}
    return "Sin acciones útiles. Cierra el turno.";
  }

  if (app.state.phase === "monsterMove" || app.state.phase === "monsterAttack") {return "Fase enemiga.";}
  if (app.state.phase === "upgrade") {return "Elige una recompensa para seguir descendiendo.";}
  if (app.state.phase === "end") {return "La expedicion ha terminado.";}
  return "";
}
