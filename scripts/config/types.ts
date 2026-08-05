export const CLASS_IDS = ["warden", "berserker", "scout", "arcanist"] as const;
export const PRIMARY_SLOT_KEYS = ["speed", "attack", "defense"] as const;
export const SLOT_KEYS = [...PRIMARY_SLOT_KEYS, "range"] as const;
export const PHASES = ["energy", "assign", "adventure", "monsterMove", "monsterAttack", "upgrade", "end"] as const;
export const UPGRADE_TYPES = ["heal", "speed", "attack", "defense", "range"] as const;

export type ClassId = typeof CLASS_IDS[number];
export type PrimarySlotKey = typeof PRIMARY_SLOT_KEYS[number];
export type SlotKey = typeof SLOT_KEYS[number];
export type Phase = typeof PHASES[number];
export type UpgradeType = typeof UPGRADE_TYPES[number];

export interface Position { x: number; y: number; }
export interface EnemyState extends Position { id: string; hp: number; maxHp: number; }
export interface DieState { id: number; value: number; assigned: SlotKey | null; }
export interface SkillState { speed: number; attack: number; defense: number; range: number; }
export interface AssignState { speed: number | null; attack: number | null; defense: number | null; range: number | null; }
export interface PointState { speed: number; attack: number; defense: number; }
export interface GameState {
  saveVersion: number;
  classId: ClassId;
  level: number;
  turn: number;
  hp: number;
  maxHp: number;
  skills: SkillState;
  phase: Phase;
  dice: DieState[];
  assign: AssignState;
  points: PointState;
  hero: Position;
  enemies: EnemyState[];
  walls: Position[];
  classUsed: boolean;
  preserved: number | null;
  _tempRange?: number;
}
export interface SaveSlot { id: number; name: string; savedAt: number; state: GameState; }
export interface LevelConfig { name: string; stats: [number, number, number, number]; count: number; hp: number; layout: number; }
export interface LayoutConfig { walls: [number, number][]; hero: [number, number]; spawns: [number, number][]; }
export interface UiHooks {
  render?(): void;
  say?(message: string): void;
  toast?(message: string): void;
  updateContinueButton?(): void;
  setStartModalHidden?(hidden: boolean, opener?: HTMLElement | null): void;
  setHelpModalHidden?(hidden: boolean, opener?: HTMLElement | null): void;
  setUpgradeModalHidden?(hidden: boolean, opener?: HTMLElement | null): void;
  setSaveModalHidden?(hidden: boolean, opener?: HTMLElement | null): void;
  setLoadModalHidden?(hidden: boolean, opener?: HTMLElement | null): void;
  setDeleteConfirmModalHidden?(hidden: boolean, opener?: HTMLElement | null): void;
  setEndModalHidden?(hidden: boolean, opener?: HTMLElement | null): void;
  setEndContent?(title: string, text: string): void;
  openHelp?(): void;
}
export interface AppStore {
  state: GameState;
  selectedClass: ClassId;
  helpPage: number;
  sound: boolean;
  kidMode: boolean;
  heroDrag: boolean;
  audioCtx: AudioContext | null;
  boardCells: HTMLDivElement[];
  selectedDieId: number | null;
  testRolls: number[];
  currentSaveSlot: number | null;
  ui: UiHooks;
}
export interface AppTestApi {
  getState(): GameState | null;
  setState(rawState: unknown): void;
  setRolls(values: number[]): void;
  makeState(overrides?: Partial<GameState> & { classId?: ClassId }): GameState;
  getSaveSlots(): (SaveSlot | null)[];
  saveCurrent(slotIndex?: number, name?: string): void;
  normalizeState(rawState: unknown): GameState | null;
}
