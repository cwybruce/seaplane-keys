// Seaplane Keys — sound: all effects synthesized with WebAudio, no audio files.
(function (global) {
  'use strict';
  var ctx = null;
  var engineOsc = null;
  var engineOsc2 = null;
  var engineGain = null;
  var engineFilter = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 55;
      engineOsc2 = ctx.createOscillator();
      engineOsc2.type = 'sine';
      engineOsc2.frequency.value = 110;
      engineFilter = ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 420;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      engineOsc.connect(engineFilter);
      engineOsc2.connect(engineFilter);
      engineFilter.connect(engineGain);
      engineGain.connect(ctx.destination);
      engineOsc.start();
      engineOsc2.start();
      return true;
    } catch (e) {
      return false;
    }
  }

  function tone(freq, dur, type, vol, when) {
    if (!ctx) return;
    var t0 = ctx.currentTime + (when || 0);
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol || 0.15, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, vol, freq) {
    if (!ctx) return;
    var t0 = ctx.currentTime;
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq || 800;
    var g = ctx.createGain();
    g.gain.value = vol || 0.25;
    src.connect(f);
    f.connect(g);
    g.connect(ctx.destination);
    src.start(t0);
  }

  var Audio = {
    ensure: ensure,
    engine: function (speed01, throttle01, airborne) {
      if (!ctx || !engineOsc) return;
      var f = 48 + speed01 * 90 + throttle01 * 30;
      engineOsc.frequency.setTargetAtTime(f, ctx.currentTime, 0.08);
      engineOsc2.frequency.setTargetAtTime(f * 2.01, ctx.currentTime, 0.08);
      var vol = airborne ? 0.045 + throttle01 * 0.05 : 0.02 + throttle01 * 0.04;
      engineGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.1);
    },
    engineOff: function () {
      if (!ctx || !engineGain) return;
      engineGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    },
    click: function () { tone(660, 0.08, 'square', 0.08); },
    pickup: function () { tone(880, 0.12, 'sine', 0.16); tone(1318, 0.18, 'sine', 0.14, 0.08); },
    deliver: function () {
      tone(523, 0.14, 'triangle', 0.18);
      tone(659, 0.14, 'triangle', 0.18, 0.12);
      tone(784, 0.2, 'triangle', 0.2, 0.24);
      tone(1046, 0.3, 'triangle', 0.2, 0.38);
    },
    crash: function () { noiseBurst(0.5, 0.35, 500); tone(70, 0.5, 'sine', 0.3); },
    splash: function () { noiseBurst(0.35, 0.2, 1400); },
    alarm: function () { tone(440, 0.1, 'square', 0.07); tone(330, 0.1, 'square', 0.07, 0.12); }
  };

  global.SK = global.SK || {};
  global.SK.Audio = Audio;
})(window);
