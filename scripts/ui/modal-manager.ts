import { app } from "../app-core.js";
import { $, $$ } from "../config/app-config.js";
import { closeDeleteConfirm, closeLoadModal, closeSaveModal, updateContinueButtonUi } from "./save-load-ui.js";

// Debe coincidir con la duración de la animación "modal-out"/"scrim-out"
// (--transition-base, 0.25s) declarada en styles/modals/modal-shell.css.
const MODAL_CLOSE_MS = 260;

const modalOrder = [
  "startModal",
  "helpModal",
  "upgradeModal",
  "saveModal",
  "loadModal",
  "deleteConfirmModal",
  "endModal"
] as const;

type ModalId = typeof modalOrder[number];

const modalOptions: Record<ModalId, { closeOnEscape: boolean; initialFocus: string }> = {
  startModal: { closeOnEscape: false, initialFocus: "#startBtn" },
  helpModal: { closeOnEscape: true, initialFocus: "#helpNext" },
  upgradeModal: { closeOnEscape: false, initialFocus: "[data-upgrade='heal']" },
  saveModal: { closeOnEscape: true, initialFocus: "#saveNameInput" },
  loadModal: { closeOnEscape: true, initialFocus: "#loadConfirmBtn" },
  deleteConfirmModal: { closeOnEscape: true, initialFocus: "#deleteConfirmCancelBtn" },
  endModal: { closeOnEscape: false, initialFocus: "#endRestart" }
};

const modalReturnFocus = new Map<ModalId, HTMLElement>();
const backgroundTabIndexAttr = "data-modal-prev-tabindex";

function modalElement(id: ModalId) {
  return document.getElementById(id);
}

function modalPanel(id: ModalId) {
  return modalElement(id)?.querySelector(".modal") as HTMLElement | null;
}

function visibleModalIds(): ModalId[] {
  return modalOrder.filter((id) => !modalElement(id)?.classList.contains("hidden"));
}

function topModalId(): ModalId | null {
  const ids = visibleModalIds();
  return ids.at(-1) ?? null;
}

function focusableElements(container: ParentNode | null | undefined): HTMLElement[] {
  if (!container) {return [];}
  return [...container.querySelectorAll<HTMLElement>(
    "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
  )].filter((element) => !element.closest(".hidden"));
}

function restoreBackgroundFocusability() {
  document.querySelectorAll(`[${backgroundTabIndexAttr}]`).forEach((element) => {
    const previous = element.getAttribute(backgroundTabIndexAttr);
    if (previous === "__none__") {element.removeAttribute("tabindex");}
    else if (previous !== null) {element.setAttribute("tabindex", previous);}
    element.removeAttribute(backgroundTabIndexAttr);
  });
}

export function updateModalEnvironment() {
  const activeModalId = topModalId();
  restoreBackgroundFocusability();

  [...document.body.children].forEach((child) => {
    const element = child as HTMLElement & { inert?: boolean };
    if (element.tagName === "SCRIPT" || element.id === "toast") {return;}
    element.inert = Boolean(activeModalId) && element.id !== activeModalId;
  });

  if (!activeModalId) {return;}

  const activePanel = modalPanel(activeModalId);
  if (!activePanel) {return;}

  focusableElements(document).forEach((element) => {
    if (activePanel.contains(element)) {return;}
    const previous = element.getAttribute("tabindex");
      element.setAttribute(backgroundTabIndexAttr, previous ?? "__none__");
    element.setAttribute("tabindex", "-1");
  });
}

function focusElement(target: Element | EventTarget | null | undefined) {
  if (!(target instanceof HTMLElement) || !target.isConnected) {return;}

  const applyFocus = () => {
    target.focus({ preventScroll: true });
    if (document.activeElement !== target) {
      setTimeout(() => {
        if (target.isConnected) {target.focus({ preventScroll: true });}
      }, 0);
    }
  };

  requestAnimationFrame(applyFocus);
}

function focusModal(id: ModalId) {
  const panel = modalPanel(id);
  if (!panel) {return;}

  const selector = modalOptions[id]?.initialFocus;
  const preferred = selector ? panel.querySelector(selector) : null;
  const fallback = focusableElements(panel)[0] ?? panel;
  const target = preferred ?? fallback;

  focusElement(target);
}

function setModalHidden(id: ModalId, hidden: boolean, opener: HTMLElement | null = null) {
  const modal = modalElement(id);
  const panel = modalPanel(id);
  if (!modal || !panel) {return;}

  if (!hidden && !modalReturnFocus.has(id)) {
    const returnTarget = opener instanceof HTMLElement ? opener :
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    if (returnTarget) {modalReturnFocus.set(id, returnTarget);}
  }

  if (!hidden) {
    modal.classList.remove("closing");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    updateModalEnvironment();
    focusModal(id);
    return;
  }

  const finishClose = () => {
    modal.classList.remove("closing");
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    const returnFocus = modalReturnFocus.get(id);
    modalReturnFocus.delete(id);
    updateModalEnvironment();
    focusElement(returnFocus);
  };

  if (modal.classList.contains("hidden") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finishClose();
    return;
  }

  modal.classList.add("closing");
  setTimeout(finishClose, MODAL_CLOSE_MS);
}

function closeTopModalWithEscape() {
  const id = topModalId();
  if (!id || !modalOptions[id]?.closeOnEscape) {return;}

  if (id === "helpModal") {setHelpModalHidden(true);}
  else if (id === "saveModal") {closeSaveModal();}
  else if (id === "loadModal") {closeLoadModal();}
  else if (id === "deleteConfirmModal") {closeDeleteConfirm();}
}

export function setStartModalHidden(hidden: boolean, opener: HTMLElement | null = null) {
  setModalHidden("startModal", hidden, opener);
  if (!hidden) {updateContinueButtonUi();}
}

export function setHelpModalHidden(hidden: boolean, opener: HTMLElement | null = null) {
  setModalHidden("helpModal", hidden, opener);
}

export function setUpgradeModalHidden(hidden: boolean, opener: HTMLElement | null = null) {
  setModalHidden("upgradeModal", hidden, opener);
}

export function setEndModalHidden(hidden: boolean, opener: HTMLElement | null = null) {
  setModalHidden("endModal", hidden, opener);
}

export function setSaveModalHidden(hidden: boolean, opener: HTMLElement | null = null) {
  setModalHidden("saveModal", hidden, opener);
}

export function setLoadModalHidden(hidden: boolean, opener: HTMLElement | null = null) {
  setModalHidden("loadModal", hidden, opener);
}

export function setDeleteConfirmModalHidden(hidden: boolean, opener: HTMLElement | null = null) {
  setModalHidden("deleteConfirmModal", hidden, opener);
}

export function setEndContent(title: string, text: string) {
  $("#endTitle").textContent = title;
  $("#endText").textContent = text;
}

export function openHelpModal(opener: HTMLElement | null = null) {
  app.helpPage = 0;
  setHelpModalHidden(false, opener);
  renderHelp();
}

export function renderHelp() {
  $$(".tutorial-page").forEach((page, index) => page.classList.toggle("active", index === app.helpPage));
  $<HTMLButtonElement>("#helpPrev").disabled = app.helpPage === 0;
  $("#helpNext").classList.toggle("hidden", app.helpPage === 2);
  $("#helpClose").classList.toggle("hidden", app.helpPage !== 2);
}

export function registerModalAccessibility() {
  modalOrder.forEach((id) => {
    const modal = modalElement(id);
    const panel = modalPanel(id);
    if (modal) {modal.setAttribute("aria-hidden", String(modal.classList.contains("hidden")));}
    if (!panel) {return;}
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.tabIndex = -1;
  });

  document.addEventListener("keydown", (event) => {
    const activeModalId = topModalId();
    if (!activeModalId) {return;}

    if (event.key === "Escape") {
      event.preventDefault();
      closeTopModalWithEscape();
      return;
    }

    if (event.key !== "Tab") {return;}

    const panel = modalPanel(activeModalId);
    const focusables = focusableElements(panel);
    if (!focusables.length) {
      event.preventDefault();
      panel?.focus();
      return;
    }

    event.preventDefault();
    const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);
    const nextIndex = event.shiftKey
      ? (currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1)
      : (currentIndex === -1 || currentIndex === focusables.length - 1 ? 0 : currentIndex + 1);
    focusElement(focusables[nextIndex]);
  });

  document.addEventListener("focusin", (event) => {
    const activeModalId = topModalId();
    if (!activeModalId) {return;}

    const panel = modalPanel(activeModalId);
    if (!panel) {return;}

    const target = event.target;
    if (target instanceof Node && panel.contains(target)) {return;}

      focusElement(focusableElements(panel)[0] ?? panel);
  }, true);
}
