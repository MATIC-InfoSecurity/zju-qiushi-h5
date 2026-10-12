/* ==========================================================================
   app.js —— 交互逻辑
   ① 滚动：进度条 / 导航点 / 入场动画 / 时间轴填充
   ② 组件：时间轴、引语、西迁地图、两问打字机与本地保存、翻转卡、人物、小测、求是卡
   ========================================================================== */
(function () {
  'use strict';

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STORE = 'zju-qiushi-h5/v1';

  /* ---------------- 存储（隐私友好：只存本地） ---------------- */
  const store = {
    data: {},
    load() { try { this.data = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { this.data = {}; } },
    get(k, d) { return Object.prototype.hasOwnProperty.call(this.data, k) ? this.data[k] : d; },
    set(k, v) { this.data[k] = v; try { localStorage.setItem(STORE, JSON.stringify(this.data)); } catch (e) { /* 隐私模式忽略 */ } },
    del(k) { delete this.data[k]; try { localStorage.setItem(STORE, JSON.stringify(this.data)); } catch (e) {} }
  };

  /* ---------------- 滚动容器：桌面端是手机框，移动端是窗口 ---------------- */
  const scroller = window.matchMedia('(min-width:900px)').matches ? $('#h5') : null;
  const scrollEl = scroller || window;
  function scrollToTop(smooth) {
    if (scroller) scroller.scrollTo({ top: 0, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
    else window.scrollTo({ top: 0, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
  }
  function jumpTo(el) {
    if (!el) return;
    if (scroller) {
      scroller.scrollTo({ top: el.offsetTop, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else {
      const y = el.getBoundingClientRect().top + window.scrollY - 44;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  /* ---------------- 滚动根元素（用于 IntersectionObserver） ---------------- */
  const ioRoot = scroller || null;

  /* ==========================================================
     ① 入场动画
     ========================================================== */
  function initReveal() {
    const targets = $$('[data-reveal], .stagger');
    if (!('IntersectionObserver' in window)) { targets.forEach(t => t.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { root: ioRoot, rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    targets.forEach(t => io.observe(t));
  }

  /* ==========================================================
     ② 进度条 + 导航点 + 当前屏
     ========================================================== */
  const screens = $$('.screen');
  let dots = [];
  function initNav() {
    const box = $('#dots');
    if (!box) return;
    dots = screens.map((sec, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dot-item';
      b.setAttribute('aria-label', '前往第 ' + i + ' 屏：' + (sec.dataset.nav || ''));
      b.innerHTML = '<span class="dot-item__label">' + (sec.dataset.nav || '') + '</span><span class="dot-item__pip"></span>';
      b.addEventListener('click', () => jumpTo(sec));
      box.appendChild(b);
      return b;
    });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          const i = screens.indexOf(en.target);
          dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
          document.body.dataset.screen = String(i);
        });
      }, { root: ioRoot, threshold: 0.55 });
      screens.forEach(s => io.observe(s));
    }
  }

  function initProgress() {
    const bar = $('#progressBar');
    const hint = $('#scrollHint');
    const tlFill = $('#timelineFill');
    const tl = $('#timeline');
    let raf = 0;
    function update() {
      raf = 0;
      const el = scroller || document.documentElement;
      const top = scroller ? scroller.scrollTop : (window.scrollY || el.scrollTop);
      const max = Math.max(1, (scroller ? scroller.scrollHeight - scroller.clientHeight : el.scrollHeight - window.innerHeight));
      const p = Math.min(1, Math.max(0, top / max));
      if (bar) bar.style.width = (p * 100).toFixed(2) + '%';
      if (hint) hint.classList.toggle('is-hidden', p > 0.02);
      if (tlFill && tl) {
        const r = tl.getBoundingClientRect();
        const vh = scroller ? scroller.clientHeight : window.innerHeight;
        const passed = Math.min(1, Math.max(0, (vh * 0.72 - r.top) / Math.max(1, r.height)));
        tlFill.style.height = (passed * 100).toFixed(1) + '%';
      }
    }
    function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ==========================================================
     ③ 第 1 屏 · 时间轴
     ========================================================== */
  function buildTimeline() {
    const list = $('#timelineList');
    if (!list || typeof TIMELINE === 'undefined') return;
    list.innerHTML = TIMELINE.map((it, i) => {
      const cls = it.now ? 'tl__dot tl__dot--now' : (it.red ? 'tl__dot tl__dot--red' : 'tl__dot');
      return '<li class="tl" data-i="' + i + '" tabindex="0" role="button" aria-expanded="false">' +
        '<span class="' + cls + '"></span>' +
        '<span class="tl__year">' + it.year + '</span>' +
        '<span class="tl__label">' + it.label + '</span>' +
        '<p class="tl__detail">' + it.detail + '</p></li>';
    }).join('');

    function toggle(li) {
      const open = li.classList.contains('is-open');
      $$('.tl', list).forEach(x => { x.classList.remove('is-open'); x.setAttribute('aria-expanded', 'false'); });
      if (!open) { li.classList.add('is-open'); li.setAttribute('aria-expanded', 'true'); }
    }
    list.addEventListener('click', e => {
      const li = e.target.closest('.tl'); if (li) toggle(li);
    });
    list.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const li = e.target.closest('.tl');
      if (li) { e.preventDefault(); toggle(li); }
    });
  }

  /* ==========================================================
     ④ 第 2 屏 · 引语手风琴
     ========================================================== */
  function initQuotes() {
    const wrap = $('#quotes');
    if (!wrap) return;
    const items = $$('.quote', wrap);
    /* 点已展开的收起；点未展开的展开，其余自动收起 */
    function toggle(el) {
      const isOpen = el.getAttribute('aria-expanded') === 'true';
      items.forEach(x => x.setAttribute('aria-expanded', String(!isOpen && x === el)));
    }
    items.forEach(el => {
      el.addEventListener('click', () => toggle(el));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(el); }
      });
    });
  }

  /* ==========================================================
     ⑤ 第 3 屏 · 西迁地图
     ========================================================== */
  function initRoute() {
    const nodesG = $('#routeNodes');
    const stepsBox = $('#routeSteps');
    if (!nodesG || typeof ROUTE === 'undefined') return;

    const SVGNS = 'http://www.w3.org/2000/svg';
    const path = $('#routePath');
    const len = path ? path.getTotalLength() : 0;
    const T = ROUTE.map((_, i) => (ROUTE.length > 1 ? i / (ROUTE.length - 1) : 0));
    /* 让折线上的行走点与站点标记尽量贴合 */
    const idxOf = id => ROUTE.findIndex(r => r.id === id);

    /* 站点标记 */
    ROUTE.forEach((r, i) => {
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', 'route__node');
      g.dataset.id = r.id;
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', r.name + ' ' + r.date);
      const c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', r.x); c.setAttribute('cy', r.y); c.setAttribute('r', r.id === 'hangzhou' || r.id === 'back' ? 6.5 : 5.5);
      const t = document.createElementNS(SVGNS, 'text');
      t.setAttribute('x', r.x + 10); t.setAttribute('y', r.y + 4);
      t.textContent = r.map;
      g.appendChild(c); g.appendChild(t);
      nodesG.appendChild(g);
      g.addEventListener('click', () => select(i));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i); } });
    });

    /* 行走的光点 */
    let walker = null;
    if (path && len) {
      walker = document.createElementNS(SVGNS, 'circle');
      walker.setAttribute('class', 'route__walker');
      walker.setAttribute('r', '3.4');
      walker.setAttribute('cx', ROUTE[0].x); walker.setAttribute('cy', ROUTE[0].y);
      nodesG.appendChild(walker);
    }

    /* 站点按钮条 */
    ROUTE.forEach((r, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'route__step';
      b.textContent = r.name;
      b.addEventListener('click', () => select(i));
      stepsBox.appendChild(b);
    });
    const stepBtns = $$('.route__step', stepsBox);

    const story = {
      kicker: $('#storyKicker'), title: $('#storyTitle'), date: $('#storyDate'),
      text: $('#storyText'), people: $('#storyPeople')
    };
    const odo = $('#odoNum');
    let shownKm = 0, tweenId = 0;

    function tweenNum(to) {
      cancelAnimationFrame(tweenId);
      const from = shownKm, start = performance.now(), dur = reduceMotion ? 0 : 620;
      function step(now) {
        const p = dur ? Math.min(1, (now - start) / dur) : 1;
        const e = 1 - Math.pow(1 - p, 3);
        shownKm = Math.round(from + (to - from) * e);
        if (odo) odo.textContent = shownKm.toLocaleString('en-US');
        if (p < 1) tweenId = requestAnimationFrame(step);
      }
      tweenId = requestAnimationFrame(step);
    }

    let current = -1;
    function select(i) {
      if (i === current) return;
      current = i;
      const r = ROUTE[i];
      $$('.route__node', nodesG).forEach(g => g.classList.toggle('is-active', g.dataset.id === r.id));
      stepBtns.forEach((b, k) => b.classList.toggle('is-active', k === i));

      if (story.kicker) story.kicker.textContent = r.kicker;
      if (story.title) story.title.textContent = r.name;
      if (story.date) story.date.textContent = r.date;
      if (story.text) story.text.textContent = r.text;
      if (story.people) story.people.innerHTML = r.people.map(p => '<li>' + p + '</li>').join('');
      const card = $('#routeStory');
      if (card) { card.classList.remove('is-swap'); void card.offsetWidth; card.classList.add('is-swap'); }

      tweenNum(r.km);
      if (walker && len) {
        const pt = path.getPointAtLength(len * T[i]);
        walker.setAttribute('cx', pt.x); walker.setAttribute('cy', pt.y);
      }
    }
    if (odo) odo.textContent = '0';
    select(0);
  }

  /* ==========================================================
     ⑥ 第 3 屏 · 数字滚动
     ========================================================== */
  function initCounters() {
    const nums = $$('[data-count]');
    if (!nums.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion) {
      nums.forEach(n => n.textContent = Number(n.dataset.count).toLocaleString('en-US') + (n.dataset.suffix || ''));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target, to = Number(el.dataset.count), suf = el.dataset.suffix || '';
        const t0 = performance.now(), dur = 1100;
        (function step(now) {
          const p = Math.min(1, (now - t0) / dur);
          const e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * e).toLocaleString('en-US') + suf;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
        io.unobserve(el);
      });
    }, { root: ioRoot, threshold: 0.4 });
    nums.forEach(n => io.observe(n));
  }

  /* ==========================================================
     ⑦ 第 4 屏 · 两问：打字机 + 本地保存
     ========================================================== */
  function initAsk() {
    const q1 = $('#q1'), q2 = $('#q2');
    if (!q1 || !q2) return;
    const T1 = '第一，到浙大来做什么？';
    const T2 = '第二，将来毕业后要做什么样的人？';

    function type(el, text, speed) {
      return new Promise(res => {
        if (reduceMotion) { el.textContent = text; res(); return; }
        let i = 0;
        const cur = document.createElement('span');
        cur.className = 'cursor'; cur.textContent = '|';
        (function tick() {
          el.textContent = text.slice(0, i);
          el.appendChild(cur);
          if (i++ < text.length) setTimeout(tick, speed);
          else { el.textContent = text; res(); }
        })();
      });
    }

    let done = false;
    function run() {
      if (done) return; done = true;
      type(q1, T1, 92).then(() => new Promise(r => setTimeout(r, 320))).then(() => type(q2, T2, 92));
    }
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(); io.disconnect(); } }),
        { root: ioRoot, threshold: 0.35 });
      io.observe($('#ask'));
    } else run();

    const toggle = $('#answerToggle'), answers = $('#answers');
    if (toggle && answers) {
      toggle.addEventListener('click', () => {
        const show = answers.hidden;
        answers.hidden = !show;
        toggle.textContent = show ? '收起竺校长的回答' : '竺校长自己怎么回答？';
      });
    }

    /* 我的回答：本地保存 + 实时回显 */
    const a1 = $('#myA1'), a2 = $('#myA2'), status = $('#saveStatus'), echoMine = $('#echoMine');
    if (a1) a1.value = store.get('a1', '');
    if (a2) a2.value = store.get('a2', '');
    echo();

    function echo() {
      if (!echoMine) return;
      const x = (a1 && a1.value.trim()) || '', y = (a2 && a2.value.trim()) || '';
      if (!x && !y) { echoMine.textContent = '—— 写下你的答案，它就会出现在这里。'; return; }
      echoMine.innerHTML = '';
      if (x) echoMine.appendChild(document.createTextNode('来做什么：' + x + ' '));
      if (y) {
        const b = document.createElement('b'); b.textContent = '要成为：' + y;
        echoMine.appendChild(b);
      }
    }
    [a1, a2].forEach(el => {
      if (!el) return;
      el.addEventListener('input', () => {
        const c = $('[data-count-for="' + el.id + '"]');
        if (c) c.textContent = el.value.length + '/' + (el.maxLength > 0 ? el.maxLength : 120);
        echo();
        if (status) status.textContent = '';
      });
      const c = $('[data-count-for="' + el.id + '"]');
      if (c) c.textContent = el.value.length + '/' + (el.maxLength > 0 ? el.maxLength : 120);
    });
    const save = $('#saveAnswer');
    if (save) save.addEventListener('click', () => {
      store.set('a1', a1 ? a1.value.trim() : '');
      store.set('a2', a2 ? a2.value.trim() : '');
      if (status) {
        status.textContent = '已保存在本机浏览器（不会上传）';
        setTimeout(() => { status.textContent = ''; }, 2600);
      }
    });
    const clr = $('#clearAnswer');
    if (clr) clr.addEventListener('click', () => {
      if (a1) a1.value = ''; if (a2) a2.value = '';
      store.del('a1'); store.del('a2');
      [a1, a2].forEach(el => {
        const c = el && $('[data-count-for="' + el.id + '"]');
        if (c) c.textContent = '0/120';
      });
      echo();
      if (status) status.textContent = '已清空';
    });
  }

  /* ==========================================================
     ⑧ 第 5 屏 · 六张翻转卡
     ========================================================== */
  function buildCards() {
    const box = $('#cards');
    if (!box || typeof CARDS === 'undefined') return;
    box.innerHTML = CARDS.map((c, i) =>
      '<div class="card" data-i="' + i + '" tabindex="0" role="button" aria-expanded="false" aria-label="' + c.title + '，点击翻面">' +
        '<div class="card__inner">' +
          '<div class="card__face card__face--front">' +
            '<p class="card__idx">' + c.idx + '</p>' +
            '<h3 class="card__title">' + c.title + '</h3>' +
            '<p class="card__sub">' + c.sub + '</p>' +
            '<p class="card__more">点击翻面 · 看它的含义 →</p>' +
          '</div>' +
          '<div class="card__face card__face--back">' +
            '<h4>' + c.title + ' · 含义</h4>' +
            '<p>' + c.mean + '</p>' +
            '<p>' + c.hist + '</p>' +
            '<p class="card__q">' + c.q + '</p>' +
          '</div>' +
        '</div>' +
      '</div>').join('');
    box.classList.add('stagger');
    $$('.card', box).forEach(card => {
      const flip = () => {
        card.classList.toggle('is-flipped');
        card.setAttribute('aria-expanded', String(card.classList.contains('is-flipped')));
      };
      card.addEventListener('click', flip);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    });
  }

  /* ==========================================================
     ⑨ 第 6 屏 · 人物
     ========================================================== */
  function buildPeople() {
    const box = $('#people');
    if (!box || typeof PEOPLE === 'undefined') return;
    box.innerHTML = PEOPLE.map(p =>
      '<article class="person" data-accent="' + (p.accent || 'blue') + '">' +
        '<div class="person__top">' +
          '<div class="person__avatar" aria-hidden="true">' + p.initial + '</div>' +
          '<div><h3 class="person__name">' + p.name + '</h3><p class="person__tag">' + p.tag + '</p></div>' +
        '</div>' +
        '<p class="person__role">' + p.role + '</p>' +
        '<p class="person__body">' + p.body + '</p>' +
        '<p class="person__quote">' + p.quote + '</p>' +
      '</article>').join('');
    box.classList.add('stagger');
  }

  /* ==========================================================
     ⑩ 第 7 屏 · 小测
     ========================================================== */
  function buildQuiz() {
    const box = $('#quiz');
    if (!box || typeof QUIZ === 'undefined') return;
    const result = $('#quizResult'), scoreNum = $('#scoreNum'), verdict = $('#quizVerdict');
    const answered = new Set();
    let right = 0;

    box.innerHTML = QUIZ.map((item, qi) =>
      '<div class="q" data-q="' + qi + '">' +
        '<p class="q__title">' + (qi + 1) + '. ' + item.q + '</p>' +
        '<div class="q__opts">' +
          item.opts.map((o, oi) =>
            '<button type="button" class="opt" data-ok="' + (o.ok ? '1' : '0') + '">' +
              '<span class="opt__key">' + 'ABCD'[oi] + '</span><span>' + o.t + '</span></button>').join('') +
        '</div>' +
        '<p class="q__why" hidden>' + item.why + '</p>' +
      '</div>').join('');

    box.addEventListener('click', e => {
      const btn = e.target.closest('.opt');
      if (!btn || btn.disabled) return;
      const qEl = btn.closest('.q');
      const qi = Number(qEl.dataset.q);
      if (answered.has(qi)) return;
      answered.add(qi);
      const ok = btn.dataset.ok === '1';
      btn.classList.add(ok ? 'is-right' : 'is-wrong');
      if (!ok) {
        const rightBtn = $$('.opt', qEl).find(b => b.dataset.ok === '1');
        if (rightBtn) rightBtn.classList.add('is-right');
      } else right += 1;
      $$('.opt', qEl).forEach(b => { b.disabled = true; });
      const why = $('.q__why', qEl); if (why) why.hidden = false;

      if (result) result.hidden = false;
      if (scoreNum) scoreNum.textContent = String(right);
      if (verdict) verdict.textContent = verdictText(right, answered.size);
    });

    function verdictText(r, n) {
      if (n < QUIZ.length) return '还有 ' + (QUIZ.length - n) + ' 题没答，继续。';
      if (r === QUIZ.length) return '三题全中。你不是记住了答案，而是真的读懂了"求是"——接下来，轮到你去用它。';
      if (r === 2) return '答对两题。没关系，"无曰已是，无曰遂真"，求是本来就是一件要一直做下去的事。';
      return '答对一题。回看第二屏的三段引语，再来一次会更清楚。';
    }

    const reset = $('#quizReset');
    if (reset) reset.addEventListener('click', () => {
      answered.clear(); right = 0;
      $$('.opt', box).forEach(b => { b.disabled = false; b.classList.remove('is-right', 'is-wrong'); });
      $$('.q__why', box).forEach(w => w.hidden = true);
      if (result) result.hidden = true;
    });
  }

  /* ==========================================================
     ⑪ 第 8 屏 · 求是卡
     ========================================================== */
  function initPledge() {
    const chips = $('#pledgeChips');
    if (!chips || typeof PLEDGES === 'undefined') return;
    const nameEl = $('#pledgeName'), noteEl = $('#pledgeNote');
    const lineEl = $('#pcardLine'), noteOut = $('#pcardNote'), signEl = $('#pcardSign'), dateEl = $('#pcardDate');
    let chosen = store.get('pledge', PLEDGES[0]);
    if (PLEDGES.indexOf(chosen) < 0) chosen = PLEDGES[0];

    chips.innerHTML = PLEDGES.map(p =>
      '<button type="button" class="chip' + (p === chosen ? ' is-on' : '') + '" data-p="' + p + '">' + p + '</button>').join('');
    chips.addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      chosen = b.dataset.p;
      $$('.chip', chips).forEach(c => c.classList.toggle('is-on', c === b));
      render();
    });

    if (nameEl) nameEl.value = store.get('name', '');
    if (noteEl) noteEl.value = store.get('note', '');

    function render() {
      if (lineEl) lineEl.innerHTML = '从今天起，<b>' + esc(chosen) + '</b>';
      if (noteOut) noteOut.textContent = noteEl && noteEl.value.trim() ? '“' + noteEl.value.trim() + '”' : '';
      if (signEl) signEl.textContent = '—— ' + ((nameEl && nameEl.value.trim()) || '一名求是人');
      if (dateEl) {
        const d = new Date();
        dateEl.textContent = d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
      }
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }

    [nameEl, noteEl].forEach(el => { if (el) el.addEventListener('input', render); });
    const gen = $('#genPledge');
    if (gen) gen.addEventListener('click', () => {
      store.set('pledge', chosen);
      store.set('name', nameEl ? nameEl.value.trim() : '');
      store.set('note', noteEl ? noteEl.value.trim() : '');
      render();
      const card = $('#pcard');
      if (card) {
        card.style.transform = 'scale(.94)';
        card.style.transition = 'transform .5s cubic-bezier(.22,.68,.24,1)';
        requestAnimationFrame(() => { card.style.transform = ''; });
      }
      if (gen.dataset.busy !== '1') {
        gen.dataset.busy = '1';
        const old = gen.textContent;
        gen.textContent = '已生成 · 可截图保存';
        setTimeout(() => { gen.textContent = old; gen.dataset.busy = '0'; }, 2200);
      }
    });
    const rp = $('#resetPledge');
    if (rp) rp.addEventListener('click', () => {
      if (nameEl) nameEl.value = ''; if (noteEl) noteEl.value = '';
      chosen = PLEDGES[0];
      $$('.chip', chips).forEach(c => c.classList.toggle('is-on', c.dataset.p === chosen));
      store.del('name'); store.del('note'); store.set('pledge', chosen);
      render();
    });

    render();
  }

  /* ==========================================================
     ⑫ 封面打字标语 + 分享 + 回到开头
     ========================================================== */
  function initCover() {
    const el = $('#tagline');
    if (el) {
      let lines = [];
      try { lines = JSON.parse(el.dataset.lines || '[]'); } catch (e) { lines = []; }
      if (lines.length) {
        let li = 0, ci = 0, del = false;
        (function loop() {
          const full = lines[li];
          el.textContent = full.slice(0, ci);
          let wait = del ? 26 : (ci === 0 ? 420 : 74);
          if (!del && ci === full.length) { del = true; wait = 2100; }
          else if (del && ci === 0) { del = false; li = (li + 1) % lines.length; wait = 320; }
          else ci += del ? -1 : 1;
          setTimeout(loop, reduceMotion ? 4000 : wait);
        })();
      }
    }
    const begin = $('#beginBtn');
    if (begin) begin.addEventListener('click', () => jumpTo($('#s1')));

    /* ---------- 分享网址与二维码：三层优先级 ----------
       ① 用户在当前页面粘贴的地址（本地预览时用这个，改了立刻重画）
       ② 浏览器地址栏的真实地址（部署到 GitHub Pages / 学校服务器后自动生效）
       ③ index.html 顶部 window.QIUSHI_SITE_URL 里配置的地址（兜底/离线）
       另外：只有 http/https 才会生成二维码；file:// 双击打开时提示先填真实网址，
       避免生成一张扫不出东西的假码。
    ------------------------------------------------------ */
    const urlEl = $('#shareUrl');
    const copy = $('#copyUrl');
    const qrBox = $('#qrBox');
    const hintEl = $('#shareHint');
    const applyBtn = $('#qrApply');
    const dlBtn = $('#qrDownload');
    const cfgUrl = (typeof window.QIUSHI_SITE_URL === 'string') ? window.QIUSHI_SITE_URL.trim() : '';

    /* 未填/仍是模板占位的地址都不生成码：避免做出一张"扫了打不开"的假码。
       example.github.io 是工程自带的示例地址，同样视为占位。 */
    const isPlaceholder = (u) => !u || u.indexOf('你的用户名') >= 0 || u.indexOf('example.github.io') >= 0;
    const isWebUrl = (u) => /^https?:\/\/\S+$/i.test(u || '');
    const cleanUrl = (u) => (u || '').trim();
    const saved = store.get('shareUrl', '');
    let current = '';

    if (hintEl) hintEl.dataset.state = 'info';
    function setHint(text, state) {
      if (!hintEl) return;
      hintEl.textContent = text || '';
      hintEl.dataset.state = state || 'info';
    }

    /* 保留静态兜底二维码的原始标记（无 JS 时的 <img>），需要时恢复 */
    const fallbackQR = qrBox ? qrBox.innerHTML : '';
    function restoreFallbackQR() {
      if (qrBox && fallbackQR) {
        qrBox.innerHTML = fallbackQR;
        qrBox.classList.remove('is-live');
      }
      current = '';
    }

    function renderQR(url) {
      if (!qrBox || !window.QiushiQR) return false;
      /* scale/border 放大一档：下载出来的 PNG 够清晰，打印海报也不糊 */
      const ok = window.QiushiQR.draw(qrBox, url, { scale: 10, border: 4, dark: '#0d1a2b', light: '#ffffff' });
      qrBox.classList.toggle('is-live', !!ok);
      if (ok) current = url;
      return !!ok;
    }

    function applyUrl(raw, opts) {
      const url = cleanUrl(raw);
      if (!isWebUrl(url) || isPlaceholder(url)) {
        /* 地址不合法：撤掉实时码、恢复静态兜底图，页面上不留一张"扫了打不开"的假码 */
        restoreFallbackQR();
        setHint('请填写完整的网址，形如 https://MATIC-InfoSecurity.github.io/zju-qiushi-h5/（必须以 http:// 或 https:// 开头）', 'warn');
        return false;
      }
      if (urlEl) urlEl.value = url;
      const ok = renderQR(url);
      if (ok) {
        if (opts && opts.persist) store.set('shareUrl', url);
        setHint(url === cleanUrl(location.href)
          ? '二维码已按当前页面的真实网址生成 —— 这就是你的作品入口。'
          : '二维码已按这个网址生成，可以用它做海报或发给同学。', 'ok');
      } else {
        restoreFallbackQR();
        setHint('二维码生成失败，请检查网址是否过长（本实现支持约 106 字节以内）。', 'warn');
      }
      return ok;
    }

    if (urlEl) {
      if (saved && !isPlaceholder(saved)) urlEl.value = saved;
      else if (isWebUrl(location.href) && !isPlaceholder(location.href)) urlEl.value = location.href;
      else if (cfgUrl) urlEl.value = cfgUrl;
    }

    /* 初始化：按 ① ② ③ 依次尝试 */
    (function initShare() {
      if (saved && !isPlaceholder(saved)) { applyUrl(saved); return; }
      if (isWebUrl(location.href) && !isPlaceholder(location.href)) { applyUrl(location.href); return; }
      if (cfgUrl && !isPlaceholder(cfgUrl)) { applyUrl(cfgUrl); return; }
      setHint('现在是用本地文件（file://）打开的，二维码还指不到你的作品。把上面输入框改成部署后的真实网址，点"用这个网址生成二维码"即可。', 'warn');
    })();

    /* 点按钮 / 在输入框回车 → 用输入的网址重画 */
    if (applyBtn) applyBtn.addEventListener('click', () => applyUrl(urlEl && urlEl.value, { persist: true }));
    if (urlEl) urlEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); applyUrl(urlEl.value, { persist: true }); }
    });
    /* 输入框内容被改回占位符时，恢复提示 */
    if (urlEl) urlEl.addEventListener('input', () => {
      if (isPlaceholder(urlEl.value)) setHint('把这里换成你的真实网址，二维码会立刻重新生成。', 'warn');
    });

    /* 下载二维码：优先给 PNG（方便贴进 PPT/海报），浏览器不支持时退回 SVG */
    if (dlBtn) dlBtn.addEventListener('click', () => {
      if (!current || !window.QiushiQR) { setHint('还没有可下载的二维码，请先填网址并生成。', 'warn'); return; }
      const dlScale = 14, dlBorder = 4;
      try {
        const svgMarkup = window.QiushiQR.encode(current).svg({ scale: dlScale, border: dlBorder, dark: '#0d1a2b', light: '#ffffff' });
        const dim = Number((svgMarkup.match(/width="(\d+)"/) || [])[1] || 300);
        const img = new Image();
        img.onload = () => {
          const cv = document.createElement('canvas');
          cv.width = cv.height = dim;
          const ctx = cv.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, dim, dim);
          ctx.drawImage(img, 0, 0, dim, dim);
          triggerDownload(cv.toDataURL('image/png'), '求是H5-二维码.png');
        };
        img.onerror = () => triggerDownload('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarkup), '求是H5-二维码.svg');
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgMarkup)));
      } catch (e) {
        setHint('下载失败，可以长按/右键页面里的二维码图片保存。', 'warn');
      }
    });

    function triggerDownload(href, filename) {
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setHint('已下载 ' + filename + '（点"复制"可同时把网址发给同学）。', 'ok');
    }

    if (copy && urlEl) copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(urlEl.value);
        copy.textContent = '已复制';
      } catch (e) {
        urlEl.select(); document.execCommand && document.execCommand('copy');
        copy.textContent = '已复制';
      }
      setTimeout(() => { copy.textContent = '复制'; }, 1800);
    });

    const restart = $('#restartBtn');
    if (restart) restart.addEventListener('click', () => scrollToTop(true));
  }

  /* ==========================================================
     启动
     ========================================================== */
  function boot() {
    store.load();
    buildTimeline();
    initQuotes();
    buildCards();
    buildPeople();
    buildQuiz();
    initPledge();
    initRoute();
    initAsk();
    initCover();
    initCounters();
    initNav();
    initProgress();
    initReveal();
    document.documentElement.classList.add('is-ready');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
