// Seaplane Keys — game: states, input, main loop, scoring, save and screenshot scenes.
(function (global) {
  'use strict';

  var canvas = null;
  var ctx = null;
  var game = null;
  var input = { up: false, down: false, left: false, right: false };
  var lastT = 0;

  function loadBest() {
    try {
      return parseInt(window.localStorage.getItem('seaplane-keys-best') || '0', 10) || 0;
    } catch (e) { return 0; }
  }

  function saveBest(v) {
    try { window.localStorage.setItem('seaplane-keys-best', String(v)); } catch (e) {}
  }

  function newGame() {
    var world = global.SK.World.create();
    var home = world.docks[0];
    var plane = global.SK.Plane.create(world, home.x + 60, home.y + 40);
    return {
      world: world,
      plane: plane,
      state: 'menu',
      best: loadBest(),
      banner: '',
      bannerT: 0,
      menuPan: 0
    };
  }

  function showBanner(text, secs) {
    game.banner = text;
    game.bannerT = secs || 2.4;
  }

  function handleEvents(events) {
    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      if (ev.type === 'load') {
        showBanner('CARGO LOADED — FLY TO ' + ev.island);
        global.SK.Audio.pickup();
      } else if (ev.type === 'deliver') {
        showBanner('CARGO DELIVERED  +' + ev.points + '  •  ' + ev.island, 2.8);
        global.SK.Audio.deliver();
      } else if (ev.type === 'buoy') {
        showBanner('CHECKPOINT  +50');
        global.SK.Audio.pickup();
      } else if (ev.type === 'barrel') {
        showBanner('FUEL BARREL  +30  •  +50');
        global.SK.Audio.pickup();
      } else if (ev.type === 'bird') {
        global.SK.Audio.alarm();
      } else if (ev.type === 'crash') {
        global.SK.Audio.crash();
        global.SK.Audio.engineOff();
        if (game.plane.score > game.best) {
          game.best = game.plane.score;
          saveBest(game.best);
        }
        game.state = 'over';
      } else if (ev.type === 'win') {
        global.SK.Audio.deliver();
        if (game.plane.score > game.best) {
          game.best = game.plane.score;
          saveBest(game.best);
        }
        game.state = 'win';
      }
    }
  }

  function resetToMenu() {
    var keepBest = game.best;
    game = newGame();
    game.best = keepBest;
    game.state = 'menu';
  }

  function startFlying() {
    game.state = 'playing';
    global.SK.Audio.ensure();
    global.SK.Audio.click();
    showBanner('PICK UP CARGO AT CORAL BAY', 2.6);
  }

  function restart() {
    var keepBest = game.best;
    game = newGame();
    game.best = keepBest;
    startFlying();
  }

  function loop(t) {
    window.requestAnimationFrame(loop);
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    if (game.state === 'menu') {
      game.menuPan += dt * 8;
      global.SK.World.update(game.world, dt);
      // Slow scenic pan across the archipelago behind the title.
      var px = 600 + Math.sin(game.menuPan * 0.05) * 500;
      var py = 600 + Math.cos(game.menuPan * 0.04) * 300;
      game.plane.x = px;
      game.plane.y = py;
    } else if (game.state === 'playing') {
      var events = [];
      global.SK.World.update(game.world, dt);
      global.SK.Plane.update(game.plane, input, game.world, dt, events);
      handleEvents(events);
      var speed01 = Math.min(1, game.plane.speed / 300);
      global.SK.Audio.engine(speed01, input.up ? 1 : 0, game.plane.alt > 8);
      if (game.bannerT > 0) game.bannerT -= dt;
      if (game.plane.crashed) game.state = 'over';
      else if (game.plane.won) game.state = 'win';
    } else if (game.state === 'over' || game.state === 'win' || game.state === 'paused') {
      global.SK.World.update(game.world, dt * 0.3);
    }
    global.SK.Render.draw(game, ctx, canvas.width, canvas.height);
  }

  function onKey(e, down) {
    var k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') input.up = down;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') input.down = down;
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') input.left = down;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') input.right = down;
    if (down) {
      if (k === 'Enter' && game.state === 'menu') startFlying();
      else if ((k === 'p' || k === 'P') && game.state === 'playing') { game.state = 'paused'; global.SK.Audio.engineOff(); }
      else if ((k === 'p' || k === 'P') && game.state === 'paused') { game.state = 'playing'; global.SK.Audio.ensure(); }
      else if ((k === 'r' || k === 'R') && (game.state === 'over' || game.state === 'win')) restart();
    }
    if (k === ' ' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault();
    }
  }

  // Screenshot scenes (?shot=menu|fly|deliver|over): real renders of the game in that state.
  function setupShot(name) {
    if (!name) return;
    if (name === 'menu') {
      game.state = 'menu';
      return;
    }
    if (name === 'fly') {
      game.state = 'playing';
      var p = game.plane;
      p.x = 950; p.y = 650;
      p.angle = 0.35;
      p.speed = 210;
      p.alt = 85;
      p.cargo = 1;
      p.score = 650;
      p.leg = 1;
      global.SK.Audio.ensure();
      return;
    }
    if (name === 'deliver') {
      game.state = 'playing';
      var d = game.world.docks[1];
      var pl = game.plane;
      pl.x = d.x + 130;
      pl.y = d.y + 40;
      pl.angle = -1.2;
      pl.speed = 0;
      pl.alt = 0;
      pl.cargo = 0;
      pl.leg = 1;
      pl.score = 500;
      showBanner('CARGO DELIVERED  +500  •  SUNSET ISLE', 60);
      return;
    }
    if (name === 'over') {
      game.state = 'over';
      var po = game.plane;
      po.x = 1500; po.y = 900;
      po.crashed = true;
      po.crashReason = 'Clipped the palms on SUNSET ISLE';
      po.score = 1250;
      po.leg = 2;
      game.best = Math.max(game.best, 1250);
      return;
    }
  }

  function boot() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    game = newGame();
    window.addEventListener('keydown', function (e) { onKey(e, true); });
    window.addEventListener('keyup', function (e) { onKey(e, false); });
    canvas.addEventListener('mousedown', function () { global.SK.Audio.ensure(); });
    var params = new URLSearchParams(window.location.search);
    setupShot(params.get('shot'));
    window.requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.SK = global.SK || {};
  global.SK.Game = { newGame: newGame };
})(window);
