/* ==========================================================================
   audio.js —— 背景氛围音（Web Audio 实时合成，零素材文件）
   设计：不使用任何 mp3/外部音频，全部用振荡器 + 噪声实时生成，避免版权与加载失败问题。
   音色：五声音阶（宫商角徵羽）钟磬点音 + 低频长音铺底 + 极轻的风声
   浏览器策略：必须由用户手势触发（点击"声音"按钮或"开始行走"），默认静音。
   ========================================================================== */
(function () {
  'use strict';

  const SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00]; // C D E G A 两个八度
  const MOTIF = [523.25, 587.33, 659.25, 587.33, 523.25, 440.00, 392.00, 440.00, 523.25]; // 《大不自多》旋律气息的简短动机

  let ctx = null, master = null, drone = null, wind = null, timer = null;
  let on = false, step = 0, volume = 0.45;

  const btn = document.getElementById('audioToggle');
  const volWrap = document.getElementById('volumeWrap');
  const volRange = document.getElementById('volumeRange');
  const icon = btn ? btn.querySelector('.iconbtn__icon') : null;
  const label = btn ? btn.querySelector('.iconbtn__label') : null;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    /* --- 低频长音铺底：两个微失谐振荡器 + 缓慢呼吸的低通 --- */
    drone = ctx.createGain();
    drone.gain.value = 0.16;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    lp.Q.value = 0.7;
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 65.41;  // C2
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 98.00;  // G2
    const o3 = ctx.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 130.81; // C3
    const g3 = ctx.createGain(); g3.gain.value = 0.35;
    o1.connect(lp); o2.connect(lp); o3.connect(g3); g3.connect(lp);
    lp.connect(drone); drone.connect(master);
    o1.start(); o2.start(); o3.start();

    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.055;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 160;
    lfo.connect(lfoGain); lfoGain.connect(lp.frequency); lfo.start();

    /* --- 风声：白噪声 + 带通 --- */
    const len = Math.floor(ctx.sampleRate * 3);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 620; bp.Q.value = 0.6;
    wind = ctx.createGain(); wind.gain.value = 0.05;
    src.connect(bp); bp.connect(wind); wind.connect(master);
    src.start();

    return ctx;
  }

  /* --- 单音：钟磬感（正弦 + 泛音 + 指数衰减） --- */
  function bell(freq, when, dur, peak) {
    if (!ctx) return;
    const t = when || ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2.01;
    const g2 = ctx.createGain(); g2.gain.value = 0.28;
    o.connect(g); o2.connect(g2); g2.connect(g);
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = (Math.random() * 1.4 - 0.7); g.connect(pan); pan.connect(master); }
    else g.connect(master);
    o.start(t); o2.start(t);
    o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  function schedule() {
    if (!on || !ctx) return;
    const now = ctx.currentTime;
    /* 1/2 概率：走校歌动机；1/2 概率：五声音阶里随机点音 —— 保持"疏"而不"满" */
    if (step % 4 === 0) {
      const n = MOTIF[(step / 4) % MOTIF.length];
      bell(n, now + 0.02, 3.4, 0.17);
    } else if (Math.random() < 0.55) {
      const n = SCALE[Math.floor(Math.random() * SCALE.length)];
      bell(n, now + 0.02, 2.6 + Math.random() * 1.6, 0.09 + Math.random() * 0.06);
    }
    step += 1;
    if (wind && ctx) wind.gain.setTargetAtTime(0.03 + Math.random() * 0.045, now, 1.6);
    timer = setTimeout(schedule, 1700 + Math.random() * 900);
  }

  function fade(to, sec) {
    if (!master) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(to, t + (sec || 1.2));
  }

  function start() {
    const c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    on = true;
    fade(0.34 * volume * (ducked ? 0.18 : 1), 1.6);
    clearTimeout(timer);
    schedule();
    document.documentElement.dataset.audio = 'on';
  }
  function stop() {
    on = false;
    clearTimeout(timer);
    fade(0, 0.9);
    document.documentElement.dataset.audio = 'off';
  }

  function paint() {
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(on));
    if (icon) icon.textContent = on ? '🔊' : '🔇';
    if (label) label.textContent = on ? '静音' : '声音';
    if (volWrap) volWrap.hidden = !on;
  }

  if (btn) {
    btn.addEventListener('click', () => { on ? stop() : start(); paint(); });
  }
  if (volRange) {
    volume = Number(volRange.value) / 100;
    volRange.addEventListener('input', () => {
      volume = Number(volRange.value) / 100;
      if (on && master) master.gain.setTargetAtTime(0.34 * volume, ctx.currentTime, 0.2);
    });
  }

  /* 页面隐藏时淡出，回来时恢复（省电、不打扰） */
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { if (on) fade(0, 0.4); }
    else if (on) fade(0.34 * volume, 0.8);
  });

  /* 暴露给外部：点击"开始行走"时开启；或在校歌播放时压低氛围音 */
  let ducked = false;
  function applyGain(sec) {
    if (!master) return;
    const base = 0.34 * volume * (ducked ? 0.18 : 1);
    if (on) fade(base, sec || 1.2);
  }
  window.QiushiAmbience = {
    toggle() { on ? stop() : start(); paint(); },
    on() { if (!on) { start(); paint(); } },
    /** 校歌播放时把风声/钟磬压到很低，避免两层声音打架 */
    duck(v) { ducked = !!v; applyGain(1.0); },
    get isOn() { return on; }
  };

  paint();
})();
