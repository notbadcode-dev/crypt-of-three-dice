import {
  app,
  assignDie,
  assignSelectedDie,
  chooseUpgrade,
  classPower,
  getAudioContext,
  registerUi,
  reset,
  setSelectedClass,
  start
} from "../app-core.js";
import { $, $$, KID_MODE_KEY } from "../config/app-config.js";
import type { ClassId, SlotKey, UpgradeType } from "../config/types.js";
import { render } from "./hud-ui.js";
import {
  openHelpModal,
  registerModalAccessibility,
  renderHelp,
  setDeleteConfirmModalHidden,
  setEndContent,
  setEndModalHidden,
  setHelpModalHidden,
  setLoadModalHidden,
  setSaveModalHidden,
  setStartModalHidden,
  setUpgradeModalHidden,
  updateModalEnvironment
} from "./modal-manager.js";
import {
  openLoadModal,
  openSaveModal,
  registerSaveLoadEvents,
  updateContinueButtonUi
} from "./save-load-ui.js";
import { say, toast } from "./ui-feedback.js";

function syncClassSelection() {
  $$(".choice-card[data-class]").forEach((card) => {
    card.classList.toggle("selected", card.dataset.class === app.selectedClass);
  });
}

function setKidMode(enabled: boolean) {
  app.kidMode = enabled;
  document.body.classList.toggle("kid-mode", app.kidMode);
  localStorage.setItem(KID_MODE_KEY, app.kidMode ? "1" : "0");

  ["#kidModeStartBtn", "#kidModeBtn"].forEach((selector) => {
    const toggle = $(selector);
    if (!toggle) {return;}
    toggle.textContent = app.kidMode ? "Niño ON" : "Niño OFF";
    toggle.title = app.kidMode ? "Desactivar modo niño" : "Activar modo niño";
    toggle.setAttribute("aria-label", toggle.title);
    toggle.setAttribute("aria-pressed", String(app.kidMode));
  });
}

function registerDiceSlotEvents() {
  $$(".slot[data-slot]").forEach((slot) => {
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("over");
    });
    slot.addEventListener("dragleave", () => { slot.classList.remove("over"); });
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("over");
      const dragEvent = event;
      const dieId = Number(dragEvent.dataTransfer?.getData("text/plain"));
      assignDie(dieId, slot.dataset.slot as SlotKey);
    });
    slot.addEventListener("click", () => { assignSelectedDie(slot.dataset.slot as SlotKey); });
    slot.addEventListener("keydown", (event) => {
      const keyEvent = event;
      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
        keyEvent.preventDefault();
        assignSelectedDie(slot.dataset.slot as SlotKey);
      }
    });
  });
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

  registerDiceSlotEvents();
  registerModalAccessibility();
  registerSaveLoadEvents();
  updateModalEnvironment();
  syncClassSelection();
  setKidMode(app.kidMode);
  updateContinueButtonUi();

  $("#classGrid").addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const card = target?.closest<HTMLElement>(".choice-card[data-class]");
    if (!card) {return;}
    setSelectedClass(card.dataset.class as ClassId);
    syncClassSelection();
  });

  $<HTMLButtonElement>("#startBtn").onclick = start;
  $<HTMLButtonElement>("#continueBtn").onclick = (event) => { openLoadModal(event.currentTarget as HTMLElement); };
  $("#kidModeStartBtn").onclick = () => { setKidMode(!app.kidMode); };
  $("#kidModeBtn").onclick = () => { setKidMode(!app.kidMode); };
  $("#helpBtn").onclick = (event) => { openHelpModal(event.currentTarget as HTMLElement); };
  $("#helpPrev").onclick = () => {
    app.helpPage--;
    renderHelp();
  };
  $("#helpNext").onclick = () => {
    app.helpPage++;
    renderHelp();
  };
  $("#helpClose").onclick = () => { setHelpModalHidden(true); };
  $("#saveBtn").onclick = (event) => { openSaveModal(event.currentTarget as HTMLElement); };

  const legacyNewBtn = $("#newBtn");
  if (legacyNewBtn) {
    legacyNewBtn.onclick = () => {
      if (confirm("¿Empezar una partida nueva?")) {reset();}
    };
  }

  $("#powerBtn").onclick = classPower;
  $("#soundBtn").onclick = () => {
    app.sound = !app.sound;
    $("#soundBtn").textContent = app.sound ? "🔊" : "🔇";
    $("#soundBtn").setAttribute("aria-pressed", String(app.sound));
    if (app.sound) {getAudioContext();}
  };
  $("#endRestart").onclick = reset;
  $$<HTMLButtonElement>("[data-upgrade]").forEach((button) => {
    button.onclick = () => { chooseUpgrade(button.dataset.upgrade as UpgradeType); };
  });
}
