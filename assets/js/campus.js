/* ==========================================================================
   campus.js —— 校区风景照背景（滚动视差 + 缓慢推拉 + 懒加载）
   图片全部来自 Wikimedia Commons，采用 CC BY / CC BY-SA / 公有领域授权，
   作者与许可证见 assets/img/campus/CREDITS.md（页面页脚也标注）。
   换图方法：把同名文件覆盖到 assets/img/campus/ 即可，或改 PHOTOS 里的配置。
   ========================================================================== */
(function () {
  'use strict';

  /* 每屏配图（依据画面干净度、暗部结构、竖屏裁剪友好度挑选） */
  const PHOTOS = {
    s0: { file: 'zhijiang.jpg', campus: '之江校区 · 钟楼', credit: '摄影 Zhangzhugang / CC BY-SA 4.0' },
    s1: { file: 'zijingang-03.jpg', campus: '紫金港校区 · 湖畔黄昏', credit: '摄影 Windmemories / CC BY-SA 4.0' },
    s2: { file: 'zijingang-sunset.jpg', campus: '紫金港校区 · 落日', credit: '摄影 Shengwei Zhang / 公有领域' },
    s3: { file: 'zijingang-sunset.jpg', campus: '紫金港校区 · 落日', credit: '摄影 Shengwei Zhang / 公有领域' },
    s4: { file: 'zijingang-04.jpg', campus: '紫金港校区 · 求是大讲堂', credit: '摄影 Windmemories / CC BY-SA 4.0' },
    s5: { file: 'zijingang-06.jpg', campus: '紫金港校区 · 秋日庭院', credit: '摄影 Windmemories / CC BY-SA 4.0' },
    s6: { file: 'zijingang-06.jpg', campus: '紫金港校区 · 秋日庭院', credit: '摄影 Windmemories / CC BY-SA 4.0' },
    s7: { file: 'xixi-gate.jpg', campus: '西溪校区', credit: '摄影 MNXANL / CC BY-SA 4.0' },
    s8: { file: 'haining-snow.jpg', campus: '海宁国际校区 · 雪后', credit: '摄影 Y Chen / CC BY-SA 4.0' },
    s9: { file: 'haining-snow.jpg', campus: '海宁国际校区 · 雪后', credit: '摄影 Y Chen / CC BY-SA 4.0' }
  };
  const BASE = 'assets/img/campus/';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function boot() {
    const screens = Array.prototype.slice.call(document.querySelectorAll('.screen'));
    if (!screens.length) return;

    /* ---------- 1) 建立背景层 ---------- */
    const layers = [];
    screens.forEach(sec => {
      const id = sec.id;
      const cfg = PHOTOS[id];
      if (!cfg) return;
      const bg = document.createElement('div');
      bg.className = 'screen__bg';
      bg.setAttribute('aria-hidden', 'true');
      bg.dataset.src = BASE + cfg.file;

      const ov = document.createElement('div');
      ov.className = 'screen__overlay';
      ov.setAttribute('aria-hidden', 'true');

      sec.insertBefore(ov, sec.firstChild);
      sec.insertBefore(bg, ov);
      layers.push({ sec, bg, cfg });
    });

    /* ---------- 2) 懒加载：只在即将进入视口时取图 ---------- */
    function load(bg) {
      const src = bg.dataset.src;
      if (!src || bg.dataset.loaded === '1') return;
      bg.dataset.loaded = '1';
      const img = new Image();
      img.onload = () => {
        bg.style.backgroundImage = 'url("' + src + '")';
        bg.classList.add('is-ready');
      };
      img.onerror = () => { bg.classList.add('is-missing'); };   // 失败就保留渐变底色
      img.src = src;
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => {
        es.forEach(e => {
          if (!e.isIntersecting) return;
          const l = layers.find(x => x.bg === e.target);
          if (l) load(l.bg);
          io.unobserve(e.target);
        });
      }, { rootMargin: '60% 0px 60% 0px', threshold: 0.01 });
      layers.forEach(l => io.observe(l.bg));
    } else {
      layers.forEach(l => load(l.bg));
    }
    load(layers[0] && layers[0].bg);            // 首屏立即加载

    /* ---------- 3) 滚动视差：把进度写进 CSS 变量，由 CSS 做位移与缓慢推拉 ---------- */
    if (reduceMotion) return;
    const scroller = window.matchMedia('(min-width:900px)').matches ? document.getElementById('h5') : null;
    let raf = 0;
    function update() {
      raf = 0;
      const vh = scroller ? scroller.clientHeight : window.innerHeight;
      layers.forEach(l => {
        const r = l.sec.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;         // 视口外跳过，省电
        /* p: 0 → 1 表示该屏从"刚进入视口底部"到"完全离开视口顶部" */
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        l.bg.style.setProperty('--p', p.toFixed(4));
        l.bg.style.setProperty('--drift', ((p - 0.5) * 2).toFixed(4));   // -1 → 1
      });
    }
    function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
    (scroller || window).addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* 供署名区使用 */
  window.QIUSHI_PHOTO_CREDITS = Object.keys(PHOTOS).map(k => PHOTOS[k]);
})();
