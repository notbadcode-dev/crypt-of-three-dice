import { $, TURN_TIMING } from "../config/app-config.js";

type ToastElement = HTMLElement & { _timer?: ReturnType<typeof setTimeout> };

export function say(message: string) {
  const logEl = $("#log");
  logEl.textContent = message;
  logEl.classList.remove("log-flash");
  void logEl.offsetWidth;
  logEl.classList.add("log-flash");
}

export function toast(message: string) {
  const toastEl = $<ToastElement>("#toast");
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => { toastEl.classList.remove("show"); }, TURN_TIMING.toastDuration);
}
