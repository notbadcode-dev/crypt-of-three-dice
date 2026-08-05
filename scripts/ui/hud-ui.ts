import {
  allAssigned,
  app,
  beginAdventure,
  endAdventure,
  levelData,
  phaseInstruction,
  reset,
  resetAssignments,
  roll,
  rollOne,
  total
} from "../app-core.js";
import { $, $$, classNames } from "../config/app-config.js";
import type { Phase } from "../config/types.js";
import { renderBoard, renderDice } from "./board-ui.js";

let lastRenderedPhase: Phase | null = null;

const compactEnemyNames = new Map([
  ["Arañas de ceniza", "Araña sombría"],
  ["Caballeros huecos", "Cab. hueco"],
  ["Guardianes del sello", "Guardián sello"]
]);

export function updateTurnFlow() {
  const order = ["energy", "assign", "adventure", "finish"];
  const current = order.includes(app.state.phase) ? app.state.phase : "finish";
  const currentIndex = Math.max(0, order.indexOf(current));
  $$("[data-flow-step]").forEach((step) => {
    const index = order.indexOf(step.dataset.flowStep!);
    step.classList.toggle("active", index === currentIndex);
    step.classList.toggle("done", index > -1 && index < currentIndex);
  });
}

function scrollActivePanelIntoView(previousPhase: Phase | null) {
  if (previousPhase === app.state.phase) {return;}
  if (!window.matchMedia("(max-width: 760px)").matches) {return;}

  const target = app.state.phase === "assign"
    ? $(".board-side-info > .block:nth-child(2)")
    : app.state.phase === "adventure"
      ? $(".game-card")
      : null;
  if (!target) {return;}

  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  requestAnimationFrame(() => { target.scrollIntoView({block:"start", behavior}); });
}

export function render() {
  if (!app.state) {return;}
  const previousPhase = lastRenderedPhase;
  if (app.state.phase !== "assign") {app.selectedDieId = null;}

  const data = levelData();
  $("#levelHud").textContent = `${app.state.level} / 12`;
  $("#turnHud").textContent = String(app.state.turn);
  $("#classHud").textContent = classNames[app.state.classId];
  $("#enemyTypeHud").textContent = data.name;
  $("#enemyCountHud").textContent = String(app.state.enemies.length);
  $("#objectiveHud").textContent = app.state.enemies.length === 1
    ? "Derrota al enemigo restante."
    : `Derrota enemigos: ${app.state.enemies.length} · ${data.name}.`;
  const featuredEnemy = app.state.enemies[0];
  const enemyPanelName = $("#enemyPanelName");
  if (enemyPanelName) {
    enemyPanelName.textContent = compactEnemyNames.get(data.name) ?? data.name;
    enemyPanelName.title = data.name;
  }

  const hpHud = $("#hpHud");
  const currentHp = Math.max(0, app.state.hp);
  const maxHp = Math.max(1, app.state.maxHp);
  const hpRatio = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
  hpHud.innerHTML = `<span class="current-value">${currentHp}</span><span class="max-value">/${app.state.maxHp}</span>`;
  hpHud.style.setProperty("--hp-ratio", `${hpRatio.toFixed(1)}%`);
  $("#topSpeed").textContent = String(app.state.skills.speed);
  $("#topDefense").textContent = String(app.state.skills.defense);
  $("#topAttack").textContent = String(app.state.skills.attack);
  $("#topRange").textContent = String(app.state.skills.range);

  $("#speedBase").textContent = String(app.state.skills.speed);
  $("#attackBase").textContent = String(app.state.skills.attack);
  $("#defenseBase").textContent = String(app.state.skills.defense);
  $("#rangeBase").textContent = String(app.state.skills.range);
  $("#speedTotalSide").textContent = String(total("speed"));
  $("#attackTotalSide").textContent = String(total("attack"));
  $("#defenseTotalSide").textContent = String(total("defense"));
  $("#rangeTotalSide").textContent = String(app.state.assign.range === null ? app.state.skills.range : total("range"));

  $("#movePoints").textContent = String(app.state.points.speed);
  $("#attackPoints").textContent = String(app.state.points.attack);
  $("#defensePoints").textContent = String(app.state.points.defense);
  $("#movePointsSide").textContent = String(app.state.points.speed);
  $("#attackPointsSide").textContent = String(app.state.points.attack);
  $("#defensePointsSide").textContent = String(app.state.points.defense);

  const enemyHpMeta = $("#enemyHpMeta");
  if (enemyHpMeta) {enemyHpMeta.textContent = String(featuredEnemy ? featuredEnemy.hp : 0);}
  $("#enemyAtkMeta").textContent = String(data.stats[1]);
  $("#enemyDefMeta").textContent = String(data.stats[2]);
  $("#enemyRngMeta").textContent = String(data.stats[3]);
  $(".enemy-panel")?.classList.toggle("empty", !featuredEnemy);
  $("#phaseHint").textContent = phaseInstruction();

  const phaseNames: Record<Phase, string> = {
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

  const phaseBtn = $<HTMLButtonElement>("#phaseBtn");
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

  const secondaryBtn = $<HTMLButtonElement>("#secondaryAction");
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
    secondaryBtn.onclick = () => {
      if (confirm("¿Empezar una partida nueva?")) {reset();}
    };
  }

  const powerBtn = $<HTMLButtonElement>("#powerBtn");
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
