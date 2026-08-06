import {
  app,
  attack,
  attackable,
  canAssignToSlot,
  enemyAt,
  moveHero,
  toggleDieSelection,
  unassign,
  validHeroTarget
} from "../app-core.js";
import { $, $$, ASSET_PATHS, SIZE } from "../config/app-config.js";
import type { DieState, SlotKey } from "../config/types.js";

function dieEl(die: DieState | { id: number; value: number; assigned: string | null }): HTMLElement {
  const element = document.createElement("div");
  const isSelected = !die.assigned && die.id === app.selectedDieId;
  element.className = "die" + (die.assigned ? " assigned" : "") + (isSelected ? " selected" : "");
  element.textContent = String(die.value);
  element.draggable = true;
  element.tabIndex = 0;
  element.setAttribute("role", "button");
  element.setAttribute("aria-label", die.assigned ? `Dado ${die.value} asignado. Pulsa enter para quitarlo.` : `Dado ${die.value}. Pulsa para seleccionarlo o arrástralo a un atributo.`);
  element.setAttribute("aria-pressed", String(isSelected));
  element.dataset.die = String(die.id);

  element.addEventListener("dragstart", (event) => {
    app.selectedDieId = null;
    const dragEvent = event;
    dragEvent.dataTransfer?.setData("text/plain", String(die.id));
    element.classList.add("dragging");
  });
  element.addEventListener("dragend", () => { element.classList.remove("dragging"); });
  element.addEventListener("click", () => {
    if (!die.assigned) {toggleDieSelection(die.id);}
  });
  element.addEventListener("dblclick", () => { unassign(die.id); });
  element.addEventListener("keydown", (event) => {
    const keyEvent = event;
    if ((keyEvent.key === "Enter" || keyEvent.key === " ") && die.assigned) {
      keyEvent.preventDefault();
      unassign(die.id);
      return;
    }
    if ((keyEvent.key === "Enter" || keyEvent.key === " ") && !die.assigned) {
      keyEvent.preventDefault();
      toggleDieSelection(die.id);
    }
  });

  return element;
}

export function renderDice() {
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
    const slotKey = slot.dataset.slot as SlotKey | undefined;
    if (!slotKey) {return;}
    const name = slotKey;
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
      const die = app.state.dice.find((item) => item.id === id);
      if (die) {slot.appendChild(dieEl(die));}
    }
  });
}

function ensureBoard(): void {
  if (app.boardCells.length) {return;}

  const board = $("#board");
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      cell.tabIndex = -1;
      cell.addEventListener("click", () => {
        if (!app.state) {return;}
        const cx = Number(cell.dataset.x);
        const cy = Number(cell.dataset.y);
        if (validHeroTarget(cx, cy)) {
          moveHero(cx, cy);
          return;
        }
        const enemy = enemyAt(cx, cy);
        if (enemy && attackable(enemy)) {attack(enemy);}
      });
      cell.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {return;}
        event.preventDefault();
        cell.click();
      });
      board.appendChild(cell);
      app.boardCells.push(cell);
    }
  }
}

export function renderBoard(): void {
  ensureBoard();

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = app.boardCells[y * SIZE + x];
      if (cell === undefined) {continue;}
      const cellEl = cell as HTMLElement;
      cellEl.className = "cell";
      cellEl.tabIndex = -1;
      cellEl.removeAttribute("role");
      cellEl.removeAttribute("aria-label");
      cellEl.replaceChildren();

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
        const heroEl = piece.querySelector(".hero-sprite") as HTMLElement;
        heroEl.addEventListener("pointerdown", (event) => {
          if (app.state.phase !== "adventure") {return;}
          app.heroDrag = true;
          heroEl.classList.add("dragging");
          heroEl.setPointerCapture(event.pointerId);
        });
        heroEl.addEventListener("pointermove", (event) => {
          if (!app.heroDrag) {return;}
          $$(".drop-hover").forEach((target) => { target.classList.remove("drop-hover"); });
          const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".cell") as HTMLElement | null;
          if (target?.classList.contains("valid")) {target.classList.add("drop-hover");}
        });
        heroEl.addEventListener("pointerup", (event) => {
          if (!app.heroDrag) {return;}
          app.heroDrag = false;
          heroEl.classList.remove("dragging");
          const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".cell") as HTMLElement | null;
          $$(".drop-hover").forEach((candidate) => { candidate.classList.remove("drop-hover"); });
          if (target?.classList.contains("valid")) {moveHero(Number(target.dataset.x), Number(target.dataset.y));}
        });
        heroEl.addEventListener("pointercancel", () => {
          app.heroDrag = false;
          heroEl.classList.remove("dragging");
          $$(".drop-hover").forEach((candidate) => { candidate.classList.remove("drop-hover"); });
        });
        cell.appendChild(piece);
        cell.insertAdjacentHTML("beforeend", `<span class="hp-badge">♥ ${app.state.hp}</span>`);
      } else if (enemy) {
        const piece = document.createElement("div");
        piece.className = "piece enemy-piece";
        piece.innerHTML = `
          <img class="sprite enemy-sprite" src="${ASSET_PATHS.enemySprite}" alt="Enemigo">
        `;
        piece.querySelector(".enemy-sprite")?.addEventListener("click", (event) => {
          event.stopPropagation();
          attack(enemy);
        });
        cell.appendChild(piece);
        cell.insertAdjacentHTML("beforeend", `<span class="hp-badge">♥ ${enemy.hp}</span>`);
      }
    }
  }
}
