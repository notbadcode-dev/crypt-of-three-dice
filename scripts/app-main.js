import {TEST_MODE} from "./app-config.js";
import {
  app,
  freshState,
  getSaveSlots,
  normalizeState,
  save,
  setTestRolls,
  setTestState
} from "./app-core.js";
import {initializeUi} from "./app-ui.js";

initializeUi();

if (TEST_MODE) {
  window.__UMBRAL_TEST__ = {
    getState() {
      return app.state ? JSON.parse(JSON.stringify(app.state)) : null;
    },
    setState(rawState) {
      setTestState(rawState);
    },
    setRolls(values) {
      setTestRolls(values);
    },
    makeState(overrides = {}) {
      return {
        ...freshState(overrides.classId || "warden"),
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
