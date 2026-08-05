import { AUDIO } from "../config/app-config.js";
import { app } from "../state/app-state.js";

export function getAudioContext() {
  if (app.audioCtx) {return app.audioCtx;}
  const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) {return null;}
  app.audioCtx = new AudioCtor();
  return app.audioCtx;
}

export function beep(freq: number, duration: number) {
  if (!app.sound) {return;}
  try {
    const ctx = getAudioContext();
    if (!ctx) {return;}
    if (ctx.state === "suspended") {void ctx.resume();}
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = freq;
    gain.gain.value = AUDIO.gain;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch {}
}
