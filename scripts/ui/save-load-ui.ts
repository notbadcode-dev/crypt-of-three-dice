import { app, deleteSaveSlot, getSaveSlots, load, save } from "../app-core.js";
import { $, classNames } from "../config/app-config.js";
import type { GameState, SaveSlot } from "../config/types.js";
import { setDeleteConfirmModalHidden, setLoadModalHidden, setSaveModalHidden } from "./modal-manager.js";
import { toast } from "./ui-feedback.js";

let selectedContinueSlot: number | null = null;
let selectedSaveSlot = 0;
let pendingDelete: { slotIndex: number; source: "save" | "load"; name: string } | null = null;

function defaultSaveName(state: GameState): string {
  return `${classNames[state.classId]} N${state.level}`;
}

function formatSaveDate(savedAt: number): string {
  if (!savedAt) {return "Sin fecha";}

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

function renderSlotCard(slot: SaveSlot | null, index: number, selected: boolean, emptyLabel = "Vacía"): HTMLButtonElement {
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

export function renderContinueSlots() {
  const container = $("#loadSlotsList");
  const slots = getSaveSlots();
  const availableSlots = slots
    .map((slot, index) => slot ? index : null)
    .filter((value): value is number => value !== null);

  if (selectedContinueSlot === null || !availableSlots.includes(selectedContinueSlot)) {
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
    if (!slot) {return;}
    container.appendChild(renderSlotCard(slot, index, selectedContinueSlot === index, "Vacía"));
  });
  $<HTMLButtonElement>("#loadDeleteBtn").disabled = selectedContinueSlot === null;
  $<HTMLButtonElement>("#loadConfirmBtn").disabled = selectedContinueSlot === null;
}

export function updateContinueButtonUi() {
  renderContinueSlots();
  $<HTMLButtonElement>("#continueBtn").disabled = selectedContinueSlot === null;
}

export function renderSaveSlotPicker() {
  const container = $("#saveSlotPicker");
  const slots = getSaveSlots();

  container.replaceChildren();
  slots.forEach((slot, index) => {
    container.appendChild(renderSlotCard(slot, index, selectedSaveSlot === index, "Ranura libre"));
  });
  $<HTMLButtonElement>("#saveDeleteBtn").disabled = !slots[selectedSaveSlot];
}

export function syncSaveNameInput() {
  const input = $<HTMLInputElement>("#saveNameInput");
  const slots = getSaveSlots();
  input.value = slots[selectedSaveSlot]?.name ?? defaultSaveName(app.state);
}

export function openSaveModal(opener: HTMLElement | null = null) {
  if (!app.state) {return;}
  const slots = getSaveSlots();
  const preferredSlot = app.currentSaveSlot ?? slots.findIndex((slot) => !slot);
  selectedSaveSlot = Number.isInteger(preferredSlot) && preferredSlot >= 0 ? preferredSlot : 0;
  renderSaveSlotPicker();
  syncSaveNameInput();
  setSaveModalHidden(false, opener);
  $<HTMLInputElement>("#saveNameInput").focus();
  $<HTMLInputElement>("#saveNameInput").select();
}

export function closeSaveModal() {
  setSaveModalHidden(true);
}

export function openLoadModal(opener: HTMLElement | null = null) {
  renderContinueSlots();
  if (selectedContinueSlot === null) {
    toast("No hay partidas guardadas.");
    return;
  }
  setLoadModalHidden(false, opener);
}

export function closeLoadModal() {
  setLoadModalHidden(true);
}

export function openDeleteConfirm(slotIndex: number, source: "save" | "load", opener: HTMLElement | null = null) {
  const slot = getSaveSlots()[slotIndex];
  if (!slot) {return;}

  pendingDelete = { slotIndex, source, name: slot.name };
  $("#deleteConfirmText").textContent = `Vas a eliminar la partida guardada "${slot.name}". Esta acción no se puede deshacer.`;
  setDeleteConfirmModalHidden(false, opener);
}

export function closeDeleteConfirm() {
  pendingDelete = null;
  setDeleteConfirmModalHidden(true);
}

function confirmDeleteSlot() {
  if (!pendingDelete) {return;}

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
    if (selectedContinueSlot === null) {closeLoadModal();}
  }

  updateContinueButtonUi();
}

export function registerSaveLoadEvents() {
  $("#saveSlotPicker").addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const card = target?.closest<HTMLElement>(".save-slot-card[data-slot]");
    if (!card) {return;}
    selectedSaveSlot = Number(card.dataset.slot);
    renderSaveSlotPicker();
    syncSaveNameInput();
  });
  $<HTMLButtonElement>("#saveCancelBtn").onclick = closeSaveModal;
  $<HTMLButtonElement>("#saveDeleteBtn").onclick = () => {
    const slot = getSaveSlots()[selectedSaveSlot];
    if (!slot) {return;}
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments -- la inferencia contextual cae al constraint (Element) sin el genérico explícito
    openDeleteConfirm(selectedSaveSlot, "save", $<HTMLElement>("#saveDeleteBtn"));
  };
  $<HTMLButtonElement>("#saveConfirmBtn").onclick = () => {
    const name = $<HTMLInputElement>("#saveNameInput").value.trim();
    if (!name) {
      toast("Pon un nombre a la partida.");
      $<HTMLInputElement>("#saveNameInput").focus();
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
    const target = event.target as HTMLElement | null;
    const card = target?.closest<HTMLElement>(".save-slot-card[data-slot]");
    if (!card) {return;}
    selectedContinueSlot = Number(card.dataset.slot);
    renderContinueSlots();
  });
  $<HTMLButtonElement>("#loadCancelBtn").onclick = closeLoadModal;
  $<HTMLButtonElement>("#loadDeleteBtn").onclick = () => {
    if (selectedContinueSlot === null) {return;}
    const slot = getSaveSlots()[selectedContinueSlot];
    if (!slot) {return;}
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments -- la inferencia contextual cae al constraint (Element) sin el genérico explícito
    openDeleteConfirm(selectedContinueSlot, "load", $<HTMLElement>("#loadDeleteBtn"));
  };
  $<HTMLButtonElement>("#loadConfirmBtn").onclick = () => {
    if (selectedContinueSlot === null || !load(selectedContinueSlot)) {
      toast("No se pudo cargar esa partida.");
      return;
    }
    closeLoadModal();
  };

  $<HTMLButtonElement>("#deleteConfirmCancelBtn").onclick = closeDeleteConfirm;
  $<HTMLButtonElement>("#deleteConfirmAcceptBtn").onclick = confirmDeleteSlot;
}
