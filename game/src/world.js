// Seaplane Keys — world: the Coral Keys archipelago, its docks, storms, birds and pickups.
(function (global) {
  'use strict';

  var MAP_W = 4800;
  var MAP_H = 3200;

  var ISLANDS = [
    { name: 'CORAL BAY', x: 600, y: 600, r: 170, home: true },
    { name: 'SUNSET ISLE', x: 1500, y: 900, r: 150 },
    { name: 'PALM REEF', x: 2600, y: 600, r: 140 },
    { name: 'TURTLE CAY', x: 3600, y: 1100, r: 160 },
    { name: 'HERON ROCK', x: 4200, y: 2200, r: 130 },
    { name: 'GOLDEN SHORE', x: 1800, y: 2400, r: 180 }
  ];

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function dist(x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

  function makeDock(island, angle) {
    return {
      x: island.x + Math.cos(angle) * (island.r + 70),
      y: island.y + Math.sin(angle) * (island.r + 70),
      angle: angle,
      island: island.name,
      r: 100
    };
  }

  function create() {
    var world = {
      w: MAP_W,
      h: MAP_H,
      islands: ISLANDS,
      docks: [],
      buoys: [],
      barrels: [],
      storms: [],
      birds: [],
      time: 0
    };
    // One dock per island, facing the next island on the route (last faces home).
    for (var i = 0; i < ISLANDS.length; i++) {
      var cur = ISLANDS[i];
      var nxt = ISLANDS[(i + 1) % ISLANDS.length];
      var ang = Math.atan2(nxt.y - cur.y, nxt.x - cur.x);
      world.docks.push(makeDock(cur, ang));
    }
    // Buoys mark the route between consecutive islands, two per leg.
    for (var leg = 0; leg < ISLANDS.length - 1; leg++) {
      var a = ISLANDS[leg], b = ISLANDS[leg + 1];
      for (var k = 1; k <= 2; k++) {
        var t = k / 3;
        var bx = a.x + (b.x - a.x) * t + rand(-70, 70);
        var by = a.y + (b.y - a.y) * t + rand(-70, 70);
        world.buoys.push({ x: bx, y: by, taken: false, phase: rand(0, 6.28) });
      }
    }
    // Fuel barrels floating in open water.
    var barrelSpots = [[1100, 1500], [2100, 1500], [3200, 1900], [3900, 1600], [2600, 2600], [900, 2200]];
    for (var s = 0; s < barrelSpots.length; s++) {
      world.barrels.push({ x: barrelSpots[s][0], y: barrelSpots[s][1], taken: false, phase: rand(0, 6.28) });
    }
    // Storm clouds drifting across the map.
    var stormSpots = [[2000, 1400, 150], [3400, 700, 180], [1500, 1900, 140]];
    for (var c = 0; c < stormSpots.length; c++) {
      world.storms.push({
        x: stormSpots[c][0], y: stormSpots[c][1], r: stormSpots[c][2],
        vx: rand(-14, 14), vy: rand(-9, 9), flash: 0
      });
    }
    // Bird flocks crossing the sky at low altitude.
    for (var f = 0; f < 4; f++) {
      var flock = { x: rand(400, 4400), y: rand(400, 2800), vx: rand(-55, 55), vy: rand(-35, 35), alt: rand(25, 60), birds: [] };
      for (var b = 0; b < 3; b++) flock.birds.push({ dx: rand(-30, 30), dy: rand(-22, 22) });
      world.birds.push(flock);
    }
    return world;
  }

  function update(world, dt) {
    world.time += dt;
    for (var i = 0; i < world.storms.length; i++) {
      var st = world.storms[i];
      st.x += st.vx * dt;
      st.y += st.vy * dt;
      if (st.x < -200) st.x = world.w + 200;
      if (st.x > world.w + 200) st.x = -200;
      if (st.y < -200) st.y = world.h + 200;
      if (st.y > world.h + 200) st.y = -200;
      if (Math.random() < dt * 0.25) st.flash = 0.25;
      if (st.flash > 0) st.flash -= dt;
    }
    for (var j = 0; j < world.birds.length; j++) {
      var fl = world.birds[j];
      fl.x += fl.vx * dt;
      fl.y += fl.vy * dt;
      if (fl.x < 100 || fl.x > world.w - 100) fl.vx = -fl.vx;
      if (fl.y < 100 || fl.y > world.h - 100) fl.vy = -fl.vy;
    }
  }

  function isLand(world, x, y) {
    for (var i = 0; i < world.islands.length; i++) {
      var isl = world.islands[i];
      if (dist(x, y, isl.x, isl.y) < isl.r) return isl;
    }
    return null;
  }

  function inStorm(world, x, y) {
    for (var i = 0; i < world.storms.length; i++) {
      var st = world.storms[i];
      if (dist(x, y, st.x, st.y) < st.r) return st;
    }
    return null;
  }

  var World = {
    MAP_W: MAP_W,
    MAP_H: MAP_H,
    create: create,
    update: update,
    isLand: isLand,
    inStorm: inStorm,
    dist: dist,
    clamp: clamp
  };

  global.SK = global.SK || {};
  global.SK.World = World;
})(window);
