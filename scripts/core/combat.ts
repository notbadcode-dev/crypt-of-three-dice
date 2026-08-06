import { AUDIO, TURN_TIMING } from "../config/app-config.js";
import type { EnemyState, Position } from "../config/types.js";
import { app, levelData, render, say, toast } from "../state/app-state.js";
import { beep } from "./audio.js";
import { finish, levelComplete } from "./game-flow.js";
import { cost, enemyAt, los, losMove, neighbors, wallAt } from "./geometry.js";

export function monsterScore(position: Position, range: number): number {
  const distance = cost(position, app.state.hero);
  const visible = los(position, app.state.hero);
  if (visible && distance <= range) {return Math.abs(range - distance);}
  return 100 + Math.max(0, distance - range) + (visible ? 0 : 20);
}

export function moveMonsters() {
  const data = levelData();
  const speed = data.stats[0];
  const range = data.stats[3];
  const ordered = app.state.enemies.toSorted((a, b) => cost(a, app.state.hero) - cost(b, app.state.hero));

  for (const enemy of ordered) {
    let budget = speed;
    while (budget >= 2) {
      const options = neighbors(enemy, enemy.id).filter((option) => option.c <= budget);
      if (!options.length) {break;}

      const scored = options
        .map((option) => ({option, score: monsterScore(option, range)}))
        .sort((a, b) => a.score - b.score);

      const best = scored[0];
      if (!best) {break;}
      if (monsterScore(enemy, range) <= best.score) {break;}

      enemy.x = best.option.x;
      enemy.y = best.option.y;
      budget -= best.option.c;
    }
  }
}

export function monsterAttack() {
  const data = levelData();
  const attackStat = data.stats[1];
  const range = data.stats[3];
  const attackers = app.state.enemies.filter((enemy) => cost(enemy, app.state.hero) <= range && los(enemy, app.state.hero));
  const totalAttack = attackers.length * attackStat;
  const damage = app.state.points.defense ? Math.floor(totalAttack / app.state.points.defense) : totalAttack;

  if (damage > 0) {
    app.state.hp -= damage;
    beep(AUDIO.damageTone.freq, AUDIO.damageTone.duration);
    say(`${attackers.length} enemigo(s) atacan: recibes ${damage} de daño.`);
  } else {
    say(attackers.length ? "Tu defensa absorbe todo el daño." : "Ningún enemigo puede atacarte.");
  }

  if (app.state.hp <= 0) {
    finish(false);
    return;
  }

  app.state.turn++;
  app.state.phase = "energy";
  app.state.dice = [];
  app.state.assign = {speed:null, attack:null, defense:null, range:null};
  app.state.points = {speed:0, attack:0, defense:0};

  setTimeout(() => {
    say("Nuevo turno. Lanza los dados.");
    render();
  }, TURN_TIMING.nextTurnDelay);

  render();
}

export function attackable(enemy: EnemyState): boolean {
  return cost(app.state.hero, enemy) <= app.state.skills.range && los(app.state.hero, enemy);
}

export function attack(enemy: EnemyState) {
  if (app.state.phase !== "adventure" || !attackable(enemy)) {return;}

  const defenseCost = levelData().stats[2];
  if (app.state.points.attack < defenseCost) {
    toast(`Necesitas ${defenseCost} de ataque.`);
    return;
  }

  app.state.points.attack -= defenseCost;
  enemy.hp--;
  beep(AUDIO.attackTone.freq, AUDIO.attackTone.duration);

  if (enemy.hp <= 0) {
    app.state.enemies = app.state.enemies.filter((item) => item.id !== enemy.id);
    say("Enemigo derrotado.");
  } else {
    say(`Impacto. Le queda ${enemy.hp} de salud.`);
  }

  if (!app.state.enemies.length) {setTimeout(levelComplete, TURN_TIMING.levelCompleteDelay);}
  render();
}

export function validHeroTarget(x: number, y: number): boolean {
  if (app.state.phase !== "adventure") {return false;}
  if (wallAt(x, y) || enemyAt(x, y)) {return false;}
  if (x === app.state.hero.x && y === app.state.hero.y) {return false;}
  return cost(app.state.hero, {x, y}) <= app.state.points.speed && losMove(app.state.hero, {x, y});
}

export function moveHero(x: number, y: number) {
  if (!validHeroTarget(x, y)) {return;}

  const movementCost = cost(app.state.hero, {x, y});
  app.state.hero = {x, y};
  app.state.points.speed -= movementCost;

  beep(AUDIO.moveTone.freq, AUDIO.moveTone.duration);
  say(`Movimiento realizado. Gastas ${movementCost} puntos.`);
  render();
}
