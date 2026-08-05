import { app } from "./state/app-state.js";
import {
  freshState,
  getSaveSlots,
  normalizeState,
  save,
  setTestRolls,
  setTestState
} from "./state/persistence.js";
import { TEST_MODE } from "./config/app-config.js";
import type { AppTestApi, ClassId, GameState } from "./config/types.js";
import { initializeUi } from "./ui/app-ui.js";

initializeUi();

if (TEST_MODE) {
  const testWindow = window as Window & { __UMBRAL_TEST__?: AppTestApi };
  testWindow.__UMBRAL_TEST__ = {
    getState() {
      return app.state ? JSON.parse(JSON.stringify(app.state)) as GameState : null;
    },
    setState(rawState) {
      setTestState(rawState);
    },
    setRolls(values) {
      setTestRolls(values);
    },
    makeState(overrides: Partial<GameState> & { classId?: ClassId } = {}) {
      return {
        ...freshState(overrides.classId ?? "warden"),
        ...overrides
      };
    },
    getSaveSlots,
    saveCurrent(slotIndex = 0, name = "Test save") {
      save(slotIndex, name, false);
    },
    normalizeState
  };
}
