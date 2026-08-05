import {ASSET_PATHS, $, $$, KID_MODE_KEY, MAX_SAVE_SLOTS, classNames} from "./app-config.js";
import {
  app,
  attack,
  attackable,
  allAssigned,
  assignDie,
  assignSelectedDie,
  beginAdventure,
  canAssignToSlot,
  chooseUpgrade,
  classPower,
  deleteSaveSlot,
  enemyAt,
  endAdventure,
  getAudioContext,
  getSaveSlots,
  levelData,
  load,
  moveHero,
  phaseInstruction,
  registerUi,
  reset,
  resetAssignments,
  roll,
  rollOne,
  save,
  setSelectedClass,
  start,
  toggleDieSelection,
  total,
  unassign,
  validHeroTarget
} from "./app-core.js";

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

export function say(message) {
  $("#log").textContent = message;
}

export function toast(message) {
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

export function setStartModalHidden(hidden, opener) {
  setModalHidden("startModal", hidden, opener);
  if (!hidden) updateContinueButtonUi();
}

export function setHelpModalHidden(hidden, opener) {
  setModalHidden("helpModal", hidden, opener);
}

export function setUpgradeModalHidden(hidden, opener) {
  setModalHidden("upgradeModal", hidden, opener);
}

export function setEndModalHidden(hidden, opener) {
  setModalHidden("endModal", hidden, opener);
}

export function setSaveModalHidden(hidden, opener) {
  setModalHidden("saveModal", hidden, opener);
}

export function setLoadModalHidden(hidden, opener) {
  setModalHidden("loadModal", hidden, opener);
}

export function setDeleteConfirmModalHidden(hidden, opener) {
  setModalHidden("deleteConfirmModal", hidden, opener);
}

export function setEndContent(title, text) {
  $("#endTitle").textContent = title;
  $("#endText").textContent = text;
}

export function openHelpModal(opener = null) {
  app.helpPage = 0;
  setHelpModalHidden(false, opener);
  renderHelp();
}

export function renderHelp() {
  $$(".tutorial-page").forEach((page, index) => page.classList.toggle("active", index === app.helpPage));
  $("#helpPrev").disabled = app.helpPage === 0;
  $("#helpNext").classList.toggle("hidden", app.helpPage === 2);
  $("#helpClose").classList.toggle("hidden", app.helpPage !== 2);
}

export function syncClassSelection() {
  $$(".choice-card[data-class]").forEach((card) => {
    card.classList.toggle("selected", card.dataset.class === app.selectedClass);
  });
}

export function setKidMode(enabled) {
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

export function updateContinueButtonUi() {
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

export function updateTurnFlow() {
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

export function render() {
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

export function initializeUi() {
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
