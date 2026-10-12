/* ==========================================================================
   music.js —— 背景音乐：《大不自多》（浙江大学校歌）
   三级音源，按顺序自动降级（任一步失败就换下一个，不会静默失败）：
     ① 官方录音（浙江大学官网"校歌"页面公开发布，链接 + 明确署名）
     ② 本地音频文件 assets/audio/zju-song-official.mp3（断网/官方直链失效时兜底）
     ③ 自创钢琴版（原创旋律，非校歌原曲；仅在①②都不可用时使用）
   另外提供"上传本地音频"入口：文件只在浏览器内以 blob 播放，不会上传到任何地方。

   版权说明（页面上也会显示）：
     校歌词：马一浮 / 曲：应尚能。录音制品的权利属于浙江大学与表演者。
     课程作业内部使用一般无碍；公开挂在 GitHub Pages 属于公开传播，
     稳妥做法是只放官网链接或先取得授权。详见 tools/fetch_song_audio.py 顶部说明。
   ========================================================================== */
(function () {
  'use strict';

  /* 官方出处（可用于随时改回"只放链接"的最稳做法） */
  const OFFICIAL_PAGE = 'https://www.zju.edu.cn/574/';
  const OFFICIAL_MP3 = 'https://www.zju.edu.cn/_upload/article/audios/12/9f/60d4433a44c3ab48e15f62baf138/a2ebdf90-3d5c-4d6a-8aa5-e3d26c650bb8.mp3';
  const LOCAL_MP3 = 'assets/audio/zju-song-official.mp3';

  const el = {
    btn: document.getElementById('musicToggle'),
    icon: document.querySelector('#musicToggle [data-music-icon]'),
    label: document.querySelector('#musicToggle [data-music-label]'),
    state: document.getElementById('musicState'),
    vol: document.getElementById('musicVol'),
    head: document.getElementById('musicHead'),
    panel: document.getElementById('musicPanel'),
    useOfficial: document.getElementById('musicUseOfficial'),
    useSynth: document.getElementById('musicUseSynth'),
    file: document.getElementById('musicFile'),
    fileLabel: document.getElementById('musicFileLabel'),
    credit: document.getElementById('musicCredit'),
    link: document.getElementById('musicLink')
  };

  let audio = null;              // ① / ② 用的 <audio>
  let mode = 'idle';             // idle | official | local | custom | synth | off
  let volume = 0.55;
  let triedLocal = false;        // 官方失败后是否已尝试本地
  let customSrc = '';            // 用户上传的 blob URL
  let synth = null;              // ③ 自创钢琴版
  let wantPlay = false;

  function setState(text) { if (el.state) el.state.textContent = text || ''; }
  function paint(on) {
    if (el.btn) el.btn.setAttribute('aria-pressed', String(!!on));
    if (el.icon) el.icon.textContent = on ? '♪' : '🔇';
    if (el.label) el.label.textContent = on ? '音乐播放中' : '播放校歌';
  }
  function setCredit(text) { if (el.credit) el.credit.textContent = text; }

  /* ---------------- <audio> 播放路径（官方 / 本地 / 自定义） ---------------- */
  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.loop = true;
    audio.preload = 'none';
    audio.volume = 0;
    audio.addEventListener('error', onAudioError);
    audio.addEventListener('playing', () => {
      paint(true);
      setState(mode === 'official' ? '正在播放：浙江大学校歌《大不自多》（官方录音）'
        : mode === 'local' ? '正在播放：校歌（本地文件）'
          : mode === 'custom' ? '正在播放：你自己选择的音频'
            : '');
    });
    return audio;
  }
  function fadeTo(target, ms) {
    if (!audio) return;
    const from = audio.volume, t0 = performance.now(), dur = ms || 900;
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      audio.volume = Math.max(0, Math.min(1, from + (target - from) * p));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  function playUrl(url, kind, credit) {
    mode = kind;
    const a = ensureAudio();
    if (a.src !== url) a.src = url;
    a.volume = 0;
    const pr = a.play();
    fadeTo(volume, 1200);
    if (pr && pr.catch) {
      pr.catch(err => {
        /* 自动播放被拦：等用户再点一次 */
        setState('浏览器阻止了自动播放，请再点一次"播放校歌"');
        wantPlay = false;
        paint(false);
      });
    }
    if (credit) setCredit(credit);
    if (el.link) el.link.href = OFFICIAL_PAGE;
  }

  function onAudioError() {
    if (mode === 'official' && !triedLocal) {
      triedLocal = true;
      setState('官方直链取不到，改用本地音频文件…');
      playUrl(LOCAL_MP3, 'local', '校歌录音：浙江大学官网发布（本地副本，仅课程作业演示用）');
      return;
    }
    /* 官方 + 本地都失败 → 自创钢琴版 */
    setState('音频文件不可用，已改用自创钢琴版（非校歌原曲）');
    startSynth('音频不可用，当前为自创钢琴版');
  }

  /* ---------------- ③ 自创钢琴版（原创旋律，五声音阶，非校歌原曲） ---------------- */
  function createSynth() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2600;
    lp.connect(master);

    /* 原创旋律：C 大调五声音阶，带歌词句读的呼吸感（每音 0.95 拍） */
    const N = { C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99 };
    const MELODY = [
      ['C4', 1], ['D4', 1], ['E4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['G4', 2],
      ['E4', 1], ['D4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['D4', 1], ['C4', 2],
      ['G4', 1], ['A4', 1], ['C5', 1], ['A4', 1], ['G4', 1], ['E4', 1], ['D4', 2],
      ['C4', 1], ['E4', 1], ['G4', 1], ['A4', 1], ['G4', 1], ['E4', 1], ['C4', 2]
    ];
    const BASS = [['C4', 4], ['G4', 4], ['A4', 4], ['E4', 4], ['C4', 4], ['G4', 4], ['C4', 4], ['G4', 4]];
    const BEAT = 0.95;

    function voice(freq, when, dur, peak, type, detune) {
      const o = ctx.createOscillator();
      o.type = type || 'triangle';
      o.frequency.value = freq;
      if (detune) o.detune.value = detune;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(peak, when + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g); g.connect(lp);
      o.start(when); o.stop(when + dur + 0.05);
      return g;
    }

    return {
      ctx, master,
      play() {
        if (ctx.state === 'suspended') ctx.resume();
        let t = ctx.currentTime + 0.08;
        for (let rep = 0; rep < 2; rep++) {
          MELODY.forEach(([n, beats]) => {
            const dur = beats * BEAT;
            voice(N[n], t, dur * 0.96, 0.26, 'triangle');          // 主旋律
            voice(N[n] * 2, t, dur * 0.45, 0.05, 'sine');          // 泛音，更像琴
            voice(N[n] * 0.5, t, dur * 1.05, 0.08, 'sine', -6);    // 低八度轻铺
            t += dur;
          });
        }
        BASS.forEach(([n, beats], i) => {
          voice(N[n] * 0.5, ctx.currentTime + 0.08 + i * beats * BEAT, beats * BEAT * 0.95, 0.1, 'sine');
        });
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(0.0001, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.5 * volume, ctx.currentTime + 1.2);
        this._loopTimer = setInterval(() => {
          if (mode !== 'synth') return;
          this.play();
        }, Math.round(MELODY.reduce((s, x) => s + x[1], 0) * BEAT * 2 * 1000) - 900);
      },
      stop() {
        clearInterval(this._loopTimer);
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0.0001, t + 0.5);
      },
      setVolume(v) { if (mode === 'synth') master.gain.setTargetAtTime(0.5 * v, ctx.currentTime, 0.2); }
    };
  }

  function startSynth(creditText) {
    stopAll(false);
    if (!synth) synth = createSynth();
    if (!synth) { setState('这台设备不支持网页音频，可以点"在官网收听"'); return; }
    mode = 'synth';
    wantPlay = true;
    synth.play();
    paint(true);
    setState('当前为自创钢琴版（原创旋律，非校歌原曲）——可点"用官方录音"或上传本地文件切换');
    setCredit(creditText || '自创钢琴版：原创旋律，与校歌原曲无关');
  }

  function stopAll(resetMode) {
    if (audio) { fadeTo(0, 400); setTimeout(() => { try { audio.pause(); } catch (e) {} }, 420); }
    if (synth) synth.stop();
    if (resetMode !== false) mode = 'off';
    paint(false);
    if (resetMode !== false) setState('');
  }

  /* ---------------- 对外动作 ---------------- */
  function playPreferred() {
    wantPlay = true;
    triedLocal = false;
    if (customSrc) { playUrl(customSrc, 'custom', '音频来自你选择的本地文件（仅本机播放，未上传）'); return; }
    const saved = (function () { try { return localStorage.getItem('zju-qiushi-h5/music'); } catch (e) { return null; } })();
    if (saved === 'synth') { startSynth(); return; }
    setState('正在连接官方录音…');
    playUrl(OFFICIAL_MP3, 'official', '校歌录音：浙江大学官网发布 · 词 马一浮 / 曲 应尚能（版权归浙江大学及表演者）');
  }

  if (el.btn) {
    el.btn.addEventListener('click', () => {
      /* 首次点击顺便把氛围音压到很低，突出校歌 */
      if (window.QiushiAmbience && window.QiushiAmbience.isOn) window.QiushiAmbience.duck(true);
      if (mode === 'off' || mode === 'idle' || !wantPlay) playPreferred();
      else stopAll();
    });
  }
  if (el.vol) {
    volume = Number(el.vol.value) / 100;
    el.vol.addEventListener('input', () => {
      volume = Number(el.vol.value) / 100;
      if (audio) audio.volume = volume;
      if (synth) synth.setVolume(volume);
    });
  }
  /* 面板展开/收起 */
  if (el.head && el.panel) {
    el.head.addEventListener('click', () => {
      const open = el.panel.hidden;
      el.panel.hidden = !open;
      el.head.setAttribute('aria-expanded', String(open));
    });
  }
  if (el.useOfficial) el.useOfficial.addEventListener('click', () => {
    customSrc = ''; triedLocal = false;
    try { localStorage.setItem('zju-qiushi-h5/music', 'official'); } catch (e) {}
    playPreferred();
  });
  if (el.useSynth) el.useSynth.addEventListener('click', () => {
    try { localStorage.setItem('zju-qiushi-h5/music', 'synth'); } catch (e) {}
    startSynth();
  });
  /* 上传本地音频：只在浏览器内播放，不上传 */
  if (el.file) el.file.addEventListener('change', () => {
    const f = el.file.files && el.file.files[0];
    if (!f) return;
    if (customSrc) { try { URL.revokeObjectURL(customSrc); } catch (e) {} }
    customSrc = URL.createObjectURL(f);
    if (el.fileLabel) el.fileLabel.textContent = '已选择：' + f.name;
    playUrl(customSrc, 'custom', '音频来自你选择的本地文件（仅本机播放，未上传到任何服务器）');
  });

  /* 暴露给别处（例如"开始行走"时自动尝试播放） */
  window.QiushiMusic = {
    play: playPreferred,
    stop: () => stopAll(),
    get mode() { return mode; },
    get isPlaying() { return wantPlay && mode !== 'off' && mode !== 'idle'; }
  };

  paint(false);
  setCredit('校歌词 马一浮 / 曲 应尚能 · 录音版权归浙江大学及表演者，本页用于课程作业演示');
  if (el.link) el.link.href = OFFICIAL_PAGE;
})();
