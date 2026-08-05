import { SIZE } from "../config/app-config.js";
import type { Position } from "../config/types.js";
import { app } from "../state/app-state.js";

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < SIZE && y < SIZE;
}

export function wallAt(x: number, y: number): boolean {
  return app.state.walls.some((wall) => wall.x === x && wall.y === y);
}

export function enemyAt(x: number, y: number) {
  return app.state.enemies.find((enemy) => enemy.x === x && enemy.y === y);
}

export function cost(a: Position, b: Position): number {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return Math.min(dx, dy) * 3 + Math.abs(dx - dy) * 2;
}

export function losMove(a: Position, b: Position): boolean {
  const dx = Math.sign(b.x - a.x);
  const dy = Math.sign(b.y - a.y);

  if (a.x !== b.x && a.y !== b.y && Math.abs(b.x - a.x) !== Math.abs(b.y - a.y)) {
    return false;
  }

  let x = a.x + dx;
  let y = a.y + dy;
  while (x !== b.x || y !== b.y) {
    if (wallAt(x, y) || enemyAt(x, y)) {return false;}
    x += dx;
    y += dy;
  }

  return true;
}

export function los(a: Position, b: Position): boolean {
  const steps = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) * 20;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const cx = Math.floor(x + 0.5);
    const cy = Math.floor(y + 0.5);

    if ((cx === a.x && cy === a.y) || (cx === b.x && cy === b.y)) {continue;}
    if (wallAt(cx, cy) || enemyAt(cx, cy)) {return false;}
  }

  return true;
}

export function neighbors(position: Position, ignoreEnemy: string | null = null) {
  const options: (Position & { c: number })[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) {continue;}
      const x = position.x + dx;
      const y = position.y + dy;
      if (!inBounds(x, y) || wallAt(x, y)) {continue;}
      if (app.state.hero.x === x && app.state.hero.y === y) {continue;}
      if (app.state.enemies.some((enemy) => enemy.id !== ignoreEnemy && enemy.x === x && enemy.y === y)) {continue;}
      options.push({x, y, c:dx && dy ? 3 : 2});
    }
  }

  return options;
}
