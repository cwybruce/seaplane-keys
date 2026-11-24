// Seaplane Keys — plane: seaplane physics, cargo runs, damage, fuel and scoring events.
(function (global) {
  'use strict';

  var W = null; // SK.World, bound in create via global

  function create(world, x, y) {
    W = global.SK.World;
    return {
      x: x, y: y,
      angle: -0.4,
      speed: 0,
      alt: 0,
      fuel: 100,
      hull: 100,
      cargo: 0, // 0 = empty, 1 = carrying
      leg: 0, // deliveries completed, 0..5
      score: 0,
      elapsed: 0,
      crashed: false,
      crashReason: '',
      won: false,
      splashT: 0,
      shake: 0
    };
  }

  // Route: home -> SUNSET -> PALM -> TURTLE -> HERON -> GOLDEN. leg = deliveries done.
  function targetDock(world, plane) {
    // Next delivery target is island leg+1; when cargo is empty, the pickup dock is island leg.
    var idx = plane.cargo ? plane.leg + 1 : plane.leg;
    if (idx >= world.docks.length) idx = world.docks.length - 1;
    return world.docks[idx];
  }

  function targetName(world, plane) {
    var d = targetDock(world, plane);
    return d.island;
  }

  function update(plane, input, world, dt, events) {
    if (plane.crashed || plane.won) return;
    plane.elapsed += dt;

    // Throttle and steering.
    var throttle = input.up ? 1 : 0;
    if (plane.fuel <= 0) throttle = 0;
    var airborne = plane.alt > 8;
    var accel = throttle * (airborne ? 55 : 70);
    if (input.down) accel -= airborne ? 90 : 110;
    plane.speed += accel * dt;
    plane.speed -= plane.speed * (airborne ? 0.12 : 0.55) * dt;
    if (plane.speed < 0) plane.speed = 0;
    var maxSpeed = airborne ? 300 : 95;
    if (plane.speed > maxSpeed) plane.speed = maxSpeed;

    // Altitude follows speed: fast = climbing, slow = settling onto the water.
    var altTarget = plane.speed > 75 ? Math.min(120, (plane.speed - 75) / 225 * 120) : 0;
    plane.alt += (altTarget - plane.alt) * Math.min(1, dt * 1.4);
    if (plane.alt < 0) plane.alt = 0;

    // Turn rate depends on speed (no turn when beached still).
    var turn = 0;
    if (input.left) turn -= 1;
    if (input.right) turn += 1;
    var turnRate = (airborne ? 1.15 : 1.7) * Math.min(1, plane.speed / 40 + 0.25);
    plane.angle += turn * turnRate * dt;

    // Storm turbulence shakes the plane.
    var storm = W.inStorm(world, plane.x, plane.y);
    if (storm && plane.alt > 15) {
      plane.angle += (Math.random() - 0.5) * 1.6 * dt;
      plane.hull -= 7 * dt;
      plane.speed -= 25 * dt;
      plane.shake = 0.35;
      if (plane.hull <= 0) {
        plane.hull = 0;
        plane.crashed = true;
        plane.crashReason = 'Torn apart inside a storm cell';
        events.push({ type: 'crash' });
        return;
      }
    }
    if (plane.shake > 0) plane.shake -= dt;

    // Move.
    plane.x += Math.cos(plane.angle) * plane.speed * dt;
    plane.y += Math.sin(plane.angle) * plane.speed * dt;
    plane.x = W.clamp(plane.x, 40, world.w - 40);
    plane.y = W.clamp(plane.y, 40, world.h - 40);

    // Island collision: land is solid when low, a crash when fast.
    var land = W.isLand(world, plane.x, plane.y);
    if (land) {
      if (plane.alt < 25) {
        if (plane.speed > 45) {
          plane.crashed = true;
          plane.crashReason = 'Clipped the palms on ' + land.name;
          events.push({ type: 'crash' });
          return;
        }
        // Gentle beaching: push back out to the shore.
        var dx = plane.x - land.x, dy = plane.y - land.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        plane.x = land.x + dx / d * (land.r + 4);
        plane.y = land.y + dy / d * (land.r + 4);
        plane.speed *= 0.4;
      }
    }

    // Birds: a hit at close altitude costs hull.
    for (var f = 0; f < world.birds.length; f++) {
      var fl = world.birds[f];
      for (var b = 0; b < fl.birds.length; b++) {
        var bx = fl.x + fl.birds[b].dx, by = fl.y + fl.birds[b].dy;
        if (W.dist(plane.x, plane.y, bx, by) < 26 && Math.abs(plane.alt - fl.alt) < 16) {
          plane.hull -= 25;
          fl.birds[b].dx += (Math.random() - 0.5) * 160;
          fl.birds[b].dy += (Math.random() - 0.5) * 160;
          plane.shake = 0.5;
          events.push({ type: 'bird' });
          if (plane.hull <= 0) {
            plane.hull = 0;
            plane.crashed = true;
            plane.crashReason = 'Bird strike over the open sea';
            events.push({ type: 'crash' });
            return;
          }
        }
      }
    }

    // Fuel: drains with throttle; empty tank forces a glide down, then a rescue trickle.
    if (throttle) plane.fuel -= 1.1 * dt;
    else plane.fuel -= 0.15 * dt;
    if (plane.fuel < 0) plane.fuel = 0;
    if (plane.fuel <= 0 && plane.alt < 5 && plane.speed < 20) {
      plane.fuel = Math.min(25, plane.fuel + 6 * dt); // rescue boat tops you up
    }

    // Splash ring when touching down.
    if (plane.alt < 6 && plane.speed > 60 && plane.splashT <= 0) plane.splashT = 0.5;
    if (plane.splashT > 0) plane.splashT -= dt;

    // Buoys: fly through for points (once per leg).
    for (var i = 0; i < world.buoys.length; i++) {
      var bu = world.buoys[i];
      if (!bu.taken && W.dist(plane.x, plane.y, bu.x, bu.y) < 70) {
        bu.taken = true;
        plane.score += 50;
        events.push({ type: 'buoy' });
      }
    }

    // Fuel barrels: scoop them low over the water.
    for (var j = 0; j < world.barrels.length; j++) {
      var ba = world.barrels[j];
      if (!ba.taken && plane.alt < 12 && W.dist(plane.x, plane.y, ba.x, ba.y) < 55) {
        ba.taken = true;
        plane.fuel = Math.min(100, plane.fuel + 30);
        plane.score += 50;
        events.push({ type: 'barrel' });
      }
    }

    // Docks: load cargo when empty, deliver when carrying — on the water and slow.
    var dock = targetDock(world, plane);
    if (plane.alt < 5 && plane.speed < 55 && W.dist(plane.x, plane.y, dock.x, dock.y) < dock.r) {
      if (plane.cargo === 0) {
        plane.cargo = 1;
        plane.fuel = Math.min(100, plane.fuel + 40);
        events.push({ type: 'load', island: dock.island });
      } else {
        plane.cargo = 0;
        plane.leg += 1;
        var bonus = 500;
        plane.score += bonus;
        events.push({ type: 'deliver', island: dock.island, points: bonus });
        if (plane.leg >= 5) {
          plane.won = true;
          var timeBonus = Math.max(0, Math.round((300 - plane.elapsed)) * 5);
          plane.score += timeBonus;
          events.push({ type: 'win', timeBonus: timeBonus });
        }
      }
    }
  }

  var Plane = {
    create: create,
    update: update,
    targetDock: targetDock,
    targetName: targetName
  };

  global.SK = global.SK || {};
  global.SK.Plane = Plane;
})(window);
