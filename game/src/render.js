// Seaplane Keys — render: golden-hour sea, islands, the plane, HUD, minimap and menus.
(function (global) {
  'use strict';

  var W = null;

  function draw(game, ctx, w, h) {
    W = global.SK.World;
    var world = game.world;
    var plane = game.plane;
    var camX = W.clamp(plane.x - w / 2, 0, world.w - w);
    var camY = W.clamp(plane.y - h / 2, 0, world.h - h);
    if (plane.shake > 0) {
      camX += (Math.random() - 0.5) * plane.shake * 22;
      camY += (Math.random() - 0.5) * plane.shake * 22;
    }

    drawSky(ctx, w, h, world.time);
    drawSea(ctx, w, h, camX, camY, world.time);
    drawIslands(ctx, world, camX, camY);
    drawDocks(ctx, world, camX, camY);
    drawBuoys(ctx, world, camX, camY);
    drawBarrels(ctx, world, camX, camY);
    drawStorms(ctx, world, camX, camY);
    drawBirds(ctx, world, camX, camY);
    drawPlane(ctx, plane, camX, camY, world.time);
    drawHud(ctx, game, w, h);
    if (game.state === 'menu') drawMenu(ctx, game, w, h);
    if (game.state === 'paused') drawPaused(ctx, w, h);
    if (game.state === 'over') drawOver(ctx, game, w, h);
    if (game.state === 'win') drawWin(ctx, game, w, h);
  }

  function drawSky(ctx, w, h, t) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2b1d4e');
    g.addColorStop(0.45, '#7a2d5e');
    g.addColorStop(0.72, '#e2603f');
    g.addColorStop(1, '#ffb347');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Low sun with glow.
    var sx = w * 0.78, sy = h * 0.30;
    var glow = ctx.createRadialGradient(sx, sy, 8, sx, sy, 180);
    glow.addColorStop(0, 'rgba(255, 214, 120, 0.95)');
    glow.addColorStop(0.35, 'rgba(255, 150, 80, 0.45)');
    glow.addColorStop(1, 'rgba(255, 150, 80, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx - 190, sy - 190, 380, 380);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(sx, sy, 34, 0, Math.PI * 2);
    ctx.fill();
    // Drifting high clouds.
    ctx.fillStyle = 'rgba(255, 190, 160, 0.20)';
    for (var i = 0; i < 5; i++) {
      var cx = ((i * 340 + t * 12) % (w + 320)) - 160;
      var cy = 40 + i * 26;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 120, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSea(ctx, w, h, camX, camY, t) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1f6a80');
    g.addColorStop(0.55, '#16607a');
    g.addColorStop(1, '#104e66');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Golden-hour sun glow reflected on the water.
    var glow = ctx.createRadialGradient(w * 0.76, h * 0.26, 20, w * 0.76, h * 0.26, 460);
    glow.addColorStop(0, 'rgba(255, 170, 90, 0.22)');
    glow.addColorStop(0.5, 'rgba(255, 150, 80, 0.08)');
    glow.addColorStop(1, 'rgba(255, 150, 80, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    // Sun glitter on the water.
    ctx.fillStyle = 'rgba(255, 200, 130, 0.28)';
    for (var i = 0; i < 30; i++) {
      var gx = ((i * 173 + Math.floor(t * 30)) % (w + 80)) - 40;
      var gy = h * 0.55 + ((i * 97) % Math.floor(h * 0.42));
      var len = 26 + (i % 5) * 12;
      ctx.fillRect(gx, gy, len, 3);
    }
    // Wave strokes.
    ctx.strokeStyle = 'rgba(140, 210, 235, 0.20)';
    ctx.lineWidth = 2;
    for (var j = 0; j < 14; j++) {
      var wx = ((j * 211 + Math.floor(t * 22)) % (w + 120)) - 60;
      var wy = ((j * 149) % h) + Math.sin(t + j) * 6;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 22, wy - 5, wx + 46, wy);
      ctx.stroke();
    }
  }

  function drawIslands(ctx, world, camX, camY) {
    for (var i = 0; i < world.islands.length; i++) {
      var isl = world.islands[i];
      var x = isl.x - camX, y = isl.y - camY;
      if (x < -isl.r - 40 || x > 1280 + isl.r + 40 || y < -isl.r - 40 || y > 720 + isl.r + 40) continue;
      // Sand ring.
      ctx.fillStyle = '#e8c98a';
      ctx.beginPath();
      ctx.arc(x, y, isl.r, 0, Math.PI * 2);
      ctx.fill();
      // Green heart.
      ctx.fillStyle = '#3f7d4e';
      ctx.beginPath();
      ctx.arc(x, y, isl.r * 0.68, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4c9159';
      ctx.beginPath();
      ctx.arc(x - isl.r * 0.2, y - isl.r * 0.15, isl.r * 0.34, 0, Math.PI * 2);
      ctx.fill();
      // Palm trees.
      ctx.strokeStyle = '#2c5a34';
      ctx.lineWidth = 3;
      var palms = 5;
      for (var p = 0; p < palms; p++) {
        var pa = (p / palms) * Math.PI * 2 + 0.5;
        var px = x + Math.cos(pa) * isl.r * 0.42;
        var py = y + Math.sin(pa) * isl.r * 0.42;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + 4, py - 14);
        ctx.stroke();
        ctx.fillStyle = '#2f7d46';
        ctx.beginPath();
        ctx.arc(px + 4, py - 16, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      // Name label.
      ctx.fillStyle = 'rgba(255, 245, 220, 0.92)';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isl.name, x, y + isl.r + 20);
    }
  }

  function drawDocks(ctx, world, camX, camY) {
    for (var i = 0; i < world.docks.length; i++) {
      var d = world.docks[i];
      var x = d.x - camX, y = d.y - camY;
      if (x < -160 || x > 1440 || y < -160 || y > 880) continue;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(d.angle);
      ctx.fillStyle = '#8a6a42';
      ctx.fillRect(-14, -46, 28, 92);
      ctx.fillStyle = '#a87f4e';
      for (var k = -2; k <= 2; k++) ctx.fillRect(-14, k * 18 - 3, 28, 6);
      ctx.restore();
      // Landing-zone ring.
      ctx.strokeStyle = 'rgba(255, 230, 150, 0.75)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.arc(x, y, d.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawBuoys(ctx, world, camX, camY) {
    for (var i = 0; i < world.buoys.length; i++) {
      var b = world.buoys[i];
      var x = b.x - camX, y = b.y - camY + Math.sin(world.time * 2 + b.phase) * 4;
      if (x < -30 || x > 1310 || y < -30 || y > 750) continue;
      ctx.fillStyle = b.taken ? '#3fae6a' : '#ff7a2f';
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 11, y - 3, 22, 6);
      ctx.fillStyle = '#1c2b33';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBarrels(ctx, world, camX, camY) {
    for (var i = 0; i < world.barrels.length; i++) {
      var b = world.barrels[i];
      if (b.taken) continue;
      var x = b.x - camX, y = b.y - camY + Math.sin(world.time * 1.6 + b.phase) * 3;
      if (x < -30 || x > 1310 || y < -30 || y > 750) continue;
      ctx.fillStyle = '#d23b2e';
      ctx.fillRect(x - 9, y - 11, 18, 22);
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(x - 9, y - 3, 18, 5);
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('F', x, y + 5);
    }
  }

  function drawStorms(ctx, world, camX, camY) {
    for (var i = 0; i < world.storms.length; i++) {
      var st = world.storms[i];
      var x = st.x - camX, y = st.y - camY;
      if (x < -st.r - 60 || x > 1280 + st.r + 60 || y < -st.r - 60 || y > 720 + st.r + 60) continue;
      var g = ctx.createRadialGradient(x, y, 10, x, y, st.r);
      g.addColorStop(0, 'rgba(38, 38, 52, 0.88)');
      g.addColorStop(0.7, 'rgba(52, 52, 70, 0.55)');
      g.addColorStop(1, 'rgba(52, 52, 70, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, st.r, 0, Math.PI * 2);
      ctx.fill();
      if (st.flash > 0) {
        ctx.strokeStyle = 'rgba(255, 240, 150, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 8, y - st.r * 0.4);
        ctx.lineTo(x + 6, y - 6);
        ctx.lineTo(x - 4, y + 8);
        ctx.lineTo(x + 10, y + st.r * 0.35);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255, 220, 220, 0.85)';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STORM', x, y - st.r - 8);
    }
  }

  function drawBirds(ctx, world, camX, camY) {
    ctx.strokeStyle = '#1c2b33';
    ctx.lineWidth = 2.5;
    for (var f = 0; f < world.birds.length; f++) {
      var fl = world.birds[f];
      for (var b = 0; b < fl.birds.length; b++) {
        var x = fl.x + fl.birds[b].dx - camX;
        var y = fl.y + fl.birds[b].dy - camY;
        if (x < -20 || x > 1300 || y < -20 || y > 740) continue;
        var flap = Math.sin(world.time * 9 + b * 2) * 4;
        ctx.beginPath();
        ctx.moveTo(x - 8, y - flap);
        ctx.quadraticCurveTo(x, y + 3, x + 8, y - flap);
        ctx.stroke();
      }
    }
  }

  function drawPlane(ctx, plane, camX, camY, t) {
    var x = plane.x - camX, y = plane.y - camY;
    // Shadow on the water, shrinking with altitude.
    var shScale = Math.max(0.25, 1 - plane.alt / 160);
    ctx.fillStyle = 'rgba(0, 0, 0, ' + (0.28 * shScale).toFixed(2) + ')';
    ctx.beginPath();
    ctx.ellipse(x + plane.alt * 0.35, y + 26 + plane.alt * 0.18, 26 * shScale, 9 * shScale, 0, 0, Math.PI * 2);
    ctx.fill();
    // Splash rings on touchdown.
    if (plane.splashT > 0) {
      ctx.strokeStyle = 'rgba(220, 245, 255, ' + (plane.splashT * 1.4).toFixed(2) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, y + 10, (0.5 - plane.splashT) * 90 + 20, (0.5 - plane.splashT) * 30 + 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(x, y - plane.alt * 0.55);
    ctx.rotate(plane.angle);
    // Floats.
    ctx.fillStyle = '#c94f2e';
    ctx.fillRect(-16, -14, 34, 5);
    ctx.fillRect(-16, 9, 34, 5);
    // Wings.
    ctx.fillStyle = '#f4ede0';
    ctx.fillRect(-6, -34, 14, 68);
    ctx.fillStyle = '#d23b2e';
    ctx.fillRect(-6, -34, 5, 68);
    // Fuselage.
    ctx.fillStyle = '#fbf7ee';
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(10, -8);
    ctx.lineTo(-20, -8);
    ctx.lineTo(-24, 0);
    ctx.lineTo(-20, 8);
    ctx.lineTo(10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d23b2e';
    ctx.fillRect(-20, -2, 34, 4);
    // Cockpit.
    ctx.fillStyle = '#274b63';
    ctx.beginPath();
    ctx.arc(10, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    // Prop blur.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(28, -9);
    ctx.lineTo(28, 9);
    ctx.stroke();
    // Damage smoke.
    if (plane.hull < 45 && !plane.crashed) {
      ctx.fillStyle = 'rgba(60, 60, 60, 0.55)';
      ctx.beginPath();
      ctx.arc(-18 - Math.random() * 8, -4 + Math.sin(t * 6) * 4, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (plane.crashed) {
      ctx.fillStyle = 'rgba(255, 120, 60, 0.85)';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DOWN', x, y - 52);
    }
  }

  function bar(ctx, x, y, w, h, frac, color, label) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#233038';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y - 6);
  }

  function drawHud(ctx, game, w, h) {
    var plane = game.plane;
    var world = game.world;
    ctx.textAlign = 'left';
    // Top-left panel.
    ctx.fillStyle = 'rgba(8, 20, 30, 0.55)';
    ctx.fillRect(14, 14, 250, 92);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('SCORE ' + plane.score, 26, 44);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('DELIVERIES  ' + plane.leg + ' / 5', 26, 70);
    ctx.fillStyle = '#9fd8ef';
    ctx.fillText('BEST  ' + (game.best || 0), 26, 92);
    // Objective banner.
    var target = global.SK.Plane.targetName(world, plane);
    var obj = plane.cargo ? 'DELIVER CARGO TO ' + target : 'PICK UP CARGO AT ' + target;
    ctx.fillStyle = 'rgba(8, 20, 30, 0.55)';
    var ow = ctx.measureText(obj).width + 36;
    ctx.fillRect(w / 2 - ow / 2, 14, ow, 34);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◈ ' + obj, w / 2, 37);
    // Bottom-left bars.
    bar(ctx, 26, h - 66, 190, 14, plane.fuel / 100, plane.fuel < 25 ? '#e0483e' : '#37b6e8', 'FUEL');
    bar(ctx, 26, h - 32, 190, 14, plane.hull / 100, plane.hull < 35 ? '#e0483e' : '#58c96b', 'HULL');
    // Bottom-right speed / altitude.
    ctx.fillStyle = 'rgba(8, 20, 30, 0.55)';
    ctx.fillRect(w - 226, h - 66, 212, 52);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SPEED  ' + Math.round(plane.speed * 1.6) + ' km/h', w - 214, h - 44);
    ctx.fillText('ALT  ' + Math.round(plane.alt * 3) + ' m' + (plane.alt > 8 ? '  ✈ AIRBORNE' : '  ≈ ON WATER'), w - 214, h - 22);
    // Cargo tag.
    if (plane.cargo) {
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('■ CARGO ON BOARD', w / 2, h - 24);
    }
    // Event banner.
    if (game.banner && game.bannerT > 0) {
      ctx.fillStyle = 'rgba(8, 20, 30, 0.62)';
      var bw = ctx.measureText(game.banner).width + 44;
      ctx.fillRect(w / 2 - bw / 2, 96, bw, 40);
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(game.banner, w / 2, 123);
    }
    drawMinimap(ctx, game, w, h);
  }

  function drawMinimap(ctx, game, w, h) {
    var world = game.world;
    var plane = game.plane;
    var mw = 210, mh = 140;
    var mx = w - mw - 14, my = 62;
    var sx = mw / world.w, sy = mh / world.h;
    ctx.fillStyle = 'rgba(8, 20, 30, 0.62)';
    ctx.fillRect(mx - 6, my - 6, mw + 12, mh + 12);
    ctx.fillStyle = '#0e3a55';
    ctx.fillRect(mx, my, mw, mh);
    ctx.fillStyle = '#e8c98a';
    for (var i = 0; i < world.islands.length; i++) {
      var isl = world.islands[i];
      ctx.beginPath();
      ctx.arc(mx + isl.x * sx, my + isl.y * sy, Math.max(3, isl.r * sx), 0, Math.PI * 2);
      ctx.fill();
    }
    // Storms.
    ctx.fillStyle = 'rgba(90, 90, 110, 0.8)';
    for (var s = 0; s < world.storms.length; s++) {
      ctx.beginPath();
      ctx.arc(mx + world.storms[s].x * sx, my + world.storms[s].y * sy, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Target ring.
    var d = global.SK.Plane.targetDock(world, plane);
    var pulse = 6 + Math.sin(world.time * 5) * 2;
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mx + d.x * sx, my + d.y * sy, pulse, 0, Math.PI * 2);
    ctx.stroke();
    // Plane triangle.
    var px = mx + plane.x * sx, py = my + plane.y * sy;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(plane.angle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-5, -4);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CORAL KEYS', mx, my - 10);
  }

  function drawMenu(ctx, game, w, h) {
    ctx.fillStyle = 'rgba(10, 16, 32, 0.55)';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.fillText('SEAPLANE KEYS', w / 2, h * 0.30);
    ctx.fillStyle = '#ff9a5e';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('CORAL KEYS  •  GOLDEN HOUR CARGO RUNS', w / 2, h * 0.30 + 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Fly the seaplane between the islands. Pick up cargo, dodge storms', w / 2, h * 0.52);
    ctx.fillText('and birds, and deliver it before the sun goes down.', w / 2, h * 0.52 + 30);
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillStyle = '#9fd8ef';
    ctx.fillText('↑ / W throttle    ← → steer    ↓ / S slow down    P pause', w / 2, h * 0.66);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('PRESS ENTER TO FLY', w / 2, h * 0.78);
    if (game.best > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.fillText('BEST SCORE  ' + game.best, w / 2, h * 0.86);
    }
  }

  function drawPaused(ctx, w, h) {
    ctx.fillStyle = 'rgba(10, 16, 32, 0.6)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', w / 2, h / 2 - 8);
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Press P to keep flying', w / 2, h / 2 + 32);
  }

  function drawOver(ctx, game, w, h) {
    ctx.fillStyle = 'rgba(20, 8, 8, 0.62)';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6a4d';
    ctx.font = 'bold 58px system-ui, sans-serif';
    ctx.fillText('WRECKED', w / 2, h * 0.34);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(game.plane.crashReason || 'The plane went down.', w / 2, h * 0.34 + 38);
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText('SCORE  ' + game.plane.score + '    •    DELIVERIES  ' + game.plane.leg + ' / 5', w / 2, h * 0.52);
    ctx.fillStyle = '#9fd8ef';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('BEST  ' + game.best, w / 2, h * 0.52 + 32);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('PRESS R TO FLY AGAIN', w / 2, h * 0.68);
  }

  function drawWin(ctx, game, w, h) {
    ctx.fillStyle = 'rgba(10, 26, 16, 0.62)';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillText('ALL DELIVERIES DONE', w / 2, h * 0.32);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Every island in the Coral Keys got its cargo before sunset.', w / 2, h * 0.32 + 38);
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText('FINAL SCORE  ' + game.plane.score, w / 2, h * 0.50);
    ctx.fillStyle = '#9fd8ef';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('BEST  ' + game.best + '    •    TIME  ' + Math.round(game.plane.elapsed) + 's', w / 2, h * 0.50 + 34);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('PRESS R TO FLY AGAIN', w / 2, h * 0.66);
  }

  var Render = { draw: draw };
  global.SK = global.SK || {};
  global.SK.Render = Render;
})(window);
