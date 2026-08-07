/**
 * app-state.ts — Global in-memory state
 *
 * This file holds the application's global state that lives in memory only.
 * Data here is LOST on page reload (except for values explicitly saved to localStorage).
 *
 * When to modify this file:
 * - Adding UI state that doesn't need to persist (selectedClass, helpPage, heroDrag, etc.)
 * - Adding gameplay state that gets discarded between sessions (currentSaveSlot, selectedDieId)
 * - Adding hooks to the UI layer (registerUi, render, say, toast, etc.)
 *
 * State in 'app.state' (GameState): the active game session
 * - Loaded from localStorage on startup (if saved)
 * - Can be modified during play
 * - Persisted to localStorage only when player explicitly saves
 * - See persistence.ts for save/load logic
 *
 * When state is NOT persisted:
 * - Page reload → app.state becomes null, must load or create new GameState
 * - Use freshState() from persistence.ts to create a new game
 * - Use loadGame() from persistence.ts to restore from localStorage
 *
 * Note: app.kidMode is persisted separately (see localStorage.getItem(KID_MODE_KEY))
 */

import { KID_MODE_KEY, classNames, levels } from "../config/app-config.js";
import type { AppStore, AssignState, ClassId, GameState, LevelConfig, PointState, UiHooks } from "../config/types.js";

export const app: AppStore = {
  state: null as unknown as GameState,
  selectedClass: "warden",
  helpPage: 0,
  sound: true,
  kidMode: localStorage.getItem(KID_MODE_KEY) === "1",
  heroDrag: false,
  audioCtx: null,
  boardCells: [],
  selectedDieId: null,
  testRolls: [],
  currentSaveSlot: null,
  ui: {}
};

export function registerUi(hooks: UiHooks) {
  app.ui = {...app.ui, ...hooks};
}

export function render() {
  app.ui.render?.();
}

export function say(message: string) {
  app.ui.say?.(message);
}

export function toast(message: string) {
  app.ui.toast?.(message);
}

export function updateContinueButton() {
  app.ui.updateContinueButton?.();
}

export function setStartModalHidden(hidden: boolean) {
  app.ui.setStartModalHidden?.(hidden);
}

export function setHelpModalHidden(hidden: boolean) {
  app.ui.setHelpModalHidden?.(hidden);
}

export function setUpgradeModalHidden(hidden: boolean) {
  app.ui.setUpgradeModalHidden?.(hidden);
}

export function setEndContent(title: string, text: string) {
  app.ui.setEndContent?.(title, text);
}

export function setEndModalHidden(hidden: boolean) {
  app.ui.setEndModalHidden?.(hidden);
}

export function openHelp() {
  app.ui.openHelp?.();
}

export function levelData(): LevelConfig {
  return levels[app.state.level - 1] as LevelConfig;
}

export function setSelectedClass(classId: ClassId) {
  if (Object.hasOwn(classNames, classId)) {
    app.selectedClass = classId;
  }
}

export function emptyAssign(): AssignState {
  return {speed:null, attack:null, defense:null, range:null};
}

export function emptyPoints(): PointState {
  return {speed:0, attack:0, defense:0};
}
