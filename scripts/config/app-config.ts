import type { ClassId, LayoutConfig, LevelConfig } from "./types.js";

export const ASSET_PATHS = {
  heroSprite: "assets/images/hero-sprite-alpha.png",
  enemySprite: "assets/images/enemy-sprite.png"
} as const;

export const SIZE = 5;
export const SAVE_KEY = "crypt_three_dice_retro_board_v1";
export const SAVE_SLOTS_KEY = "crypt_three_dice_retro_slots_v1";
export const MAX_SAVE_SLOTS = 5;
export const KID_MODE_KEY = "crypt_three_dice_kid_mode_v1";
export const SAVE_VERSION = 2;
export const TEST_MODE = new URLSearchParams(location.search).has("test");

export const STARTING_HP = 6;

export const AUDIO = {
  gain: 0.025,
  rollTone: { freq: 380, duration: 0.05 },
  assignTone: { freq: 430, duration: 0.025 },
  moveTone: { freq: 260, duration: 0.04 },
  attackTone: { freq: 180, duration: 0.05 },
  damageTone: { freq: 95, duration: 0.12 }
} as const;

export const TURN_TIMING = {
  monsterMoveDelay: 450,
  monsterAttackDelay: 500,
  nextTurnDelay: 420,
  levelCompleteDelay: 260,
  toastDuration: 1800
} as const;

export const classNames: Record<ClassId, string> = {
  warden: "Guardián",
  berserker: "Berserker",
  scout: "Exploradora",
  arcanist: "Arcanista"
};

export const levels: LevelConfig[] = [
  { name: "Arañas de ceniza", stats: [5, 1, 1, 2], count: 2, hp: 2, layout: 0 },
  { name: "Saqueadores", stats: [4, 2, 1, 3], count: 2, hp: 2, layout: 1 },
  { name: "Murciélagos", stats: [6, 2, 1, 2], count: 3, hp: 1, layout: 2 },
  { name: "Carroñeros", stats: [5, 3, 2, 3], count: 2, hp: 3, layout: 3 },
  { name: "Centinelas", stats: [4, 3, 2, 4], count: 3, hp: 2, layout: 0 },
  { name: "Acechadores", stats: [6, 3, 2, 3], count: 3, hp: 3, layout: 1 },
  { name: "Gólems", stats: [3, 4, 3, 3], count: 2, hp: 4, layout: 2 },
  { name: "Sombras", stats: [6, 4, 2, 5], count: 3, hp: 3, layout: 3 },
  { name: "Caballeros huecos", stats: [5, 5, 3, 4], count: 3, hp: 4, layout: 0 },
  { name: "Demonios menores", stats: [6, 5, 3, 5], count: 4, hp: 3, layout: 1 },
  { name: "Guardianes del sello", stats: [5, 6, 4, 5], count: 3, hp: 5, layout: 2 },
  { name: "Heraldo abisal", stats: [6, 7, 4, 6], count: 3, hp: 6, layout: 3 }
];

export const layouts: LayoutConfig[] = [
  { walls: [[1, 1], [3, 1], [1, 3], [3, 3]], hero: [0, 4], spawns: [[4, 0], [4, 2], [2, 0], [0, 0]] },
  { walls: [[2, 1], [2, 2], [2, 3]], hero: [4, 4], spawns: [[0, 0], [0, 2], [4, 0], [0, 4]] },
  { walls: [[1, 2], [3, 2]], hero: [2, 4], spawns: [[0, 0], [2, 0], [4, 0], [0, 3]] },
  { walls: [[1, 1], [1, 2], [3, 2], [3, 3]], hero: [0, 4], spawns: [[4, 0], [2, 0], [4, 4], [0, 0]] }
];

export const $ = <T extends Element = HTMLElement>(selector: string): T =>
  document.querySelector(selector)!;
export const $$ = <T extends Element = HTMLElement>(selector: string): T[] =>
  [...document.querySelectorAll(selector)] as T[];
