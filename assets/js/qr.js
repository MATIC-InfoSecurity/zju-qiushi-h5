/* ==========================================================================
   qr.js —— 零依赖 QR 码生成器（版本 1-6，字节模式，纠错等级 M）
   与 tools/qrgen.py 同源同算法，并已通过 tools/qrcheck.py 的"PNG 反解 + RS 伴随式"
   端到端校验。放在页面里运行时生成，好处是：
     · 二维码永远指向当前真实地址（GitHub Pages / 学校服务器 / 本地预览都正确）
     · 不请求任何外部接口，断网也能显示
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------------- GF(256) ---------------- */
  const EXP = new Array(512).fill(0);
  const LOG = new Array(256).fill(0);
  (function () {
    let x = 1;
    for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function gmul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }
  function rsGen(n) {
    let poly = [1];
    for (let i = 0; i < n; i++) {
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= gmul(poly[j], 1);
        next[j + 1] ^= gmul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }
  function rsEncode(data, ecLen) {
    const gen = rsGen(ecLen);
    const res = data.concat(new Array(ecLen).fill(0));
    for (let i = 0; i < data.length; i++) {
      const coef = res[i];
      if (!coef) continue;
      for (let j = 0; j < gen.length; j++) res[i + j] ^= gmul(gen[j], coef);
    }
    return res.slice(data.length);
  }

  /* ---------------- 容量表（纠错等级 M） ---------------- */
  const RS_M = { 1: [16, 1, 26], 2: [28, 1, 44], 3: [22, 2, 70], 4: [16, 4, 100], 5: [22, 4, 134], 6: [28, 4, 172] };
  const ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34] };
  const EC_BITS = 0b00; // M

  function Encoder(text) {
    const bytes = [];
    // UTF-8 编码
    const s = String(text);
    for (let i = 0; i < s.length; i++) {
      let c = s.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) { bytes.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F)); }
      else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {
        const c2 = s.charCodeAt(++i);
        const cp = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00);
        bytes.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
      } else { bytes.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)); }
    }
    this.data = bytes;

    let version = null;
    for (let v = 1; v <= 6; v++) {
      const [per, blocks] = RS_M[v];
      const need = 4 + (v === 1 ? 8 : 16) + bytes.length * 8;
      if (need <= per * blocks * 8) { version = v; break; }
    }
    if (version === null) throw new Error('内容过长：本实现支持到版本 6（约 106 字节）');
    this.version = version;
    this.size = 17 + 4 * version;
    this.matrix = Array.from({ length: this.size }, () => new Array(this.size).fill(null));
    this.reserved = Array.from({ length: this.size }, () => new Array(this.size).fill(false));
    this._build();
  }

  Encoder.prototype._set = function (x, y, val) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return;
    this.matrix[y][x] = val;
    this.reserved[y][x] = true;
  };
  Encoder.prototype._finder = function (cx, cy) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      this._set(cx + dx, cy + dy, (d !== 2 && d <= 3) ? 1 : 0);
    }
  };
  Encoder.prototype._align = function (cx, cy) {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      this._set(cx + dx, cy + dy, d !== 1 ? 1 : 0);
    }
  };
  Encoder.prototype._functionPatterns = function () {
    const n = this.size;
    this._finder(3, 3); this._finder(n - 4, 3); this._finder(3, n - 4);
    // 校正图形先于定时图形，避免重叠
    for (const cy of ALIGN[this.version]) for (const cx of ALIGN[this.version]) {
      if (this.matrix[cy][cx] !== null) continue;
      this._align(cx, cy);
    }
    for (let i = 8; i < n - 8; i++) {
      this._set(i, 6, i % 2 === 0 ? 1 : 0);
      this._set(6, i, i % 2 === 0 ? 1 : 0);
    }
    this._set(8, n - 8, 1);                              // 固定黑模块
    for (let i = 0; i < 9; i++) {
      if (i !== 6) { this._set(i, 8, 0); this._set(8, i, 0); }
    }
    for (let i = 0; i < 8; i++) { this._set(n - 1 - i, 8, 0); this._set(8, n - 1 - i, 0); }
  };

  Encoder.prototype._codewords = function () {
    const v = this.version, [per, blocks, total] = RS_M[v];
    const bits = [];
    const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
    put(4, 4);
    put(this.data.length, v === 1 ? 8 : 16);
    for (const b of this.data) put(b, 8);
    const cap = per * blocks * 8;
    for (let i = 0; i < Math.min(4, cap - bits.length); i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    const cw = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      cw.push(b);
    }
    const pad = [0xEC, 0x11];
    for (let k = 0; cw.length < per * blocks; k++) cw.push(pad[k % 2]);
    const ecPer = total / blocks - per;
    const dataBlocks = [], ecBlocks = [];
    for (let i = 0; i < blocks; i++) {
      const blk = cw.slice(i * per, (i + 1) * per);
      dataBlocks.push(blk);
      ecBlocks.push(rsEncode(blk, ecPer));
    }
    const out = [];
    for (let i = 0; i < per; i++) for (const b of dataBlocks) out.push(b[i]);
    for (let i = 0; i < ecPer; i++) for (const b of ecBlocks) out.push(b[i]);
    return out;
  };

  Encoder.prototype._placeData = function (cw) {
    const n = this.size, bits = [];
    for (const c of cw) for (let i = 7; i >= 0; i--) bits.push((c >> i) & 1);
    while (bits.length < n * n) bits.push(0);
    let idx = 0, col = n - 1, up = true;
    while (col > 0) {
      if (col === 6) col -= 1;
      const left = col - 1;
      for (let k = 0; k < n; k++) {
        const row = up ? (n - 1 - k) : k;
        const pair = up ? [col, left] : [left, col];
        for (const c of pair) {
          if (!this.reserved[row][c]) { this.matrix[row][c] = bits[idx++]; }
        }
      }
      up = !up;
      col -= 2;
    }
  };

  function maskFn(m, i, j) {
    switch (m) {
      case 0: return (i + j) % 2 === 0;
      case 1: return i % 2 === 0;
      case 2: return j % 3 === 0;
      case 3: return (i + j) % 3 === 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case 5: return (i * j) % 2 + (i * j) % 3 === 0;
      case 6: return ((i * j) % 2 + (i * j) % 3) % 2 === 0;
      default: return ((i + j) % 2 + (i * j) % 3) % 2 === 0;
    }
  }
  Encoder.prototype._formatBits = function (mask) {
    const val = (EC_BITS << 3) | mask;
    let rem = val << 10;
    for (let i = 4; i >= 0; i--) if ((rem >> (10 + i)) & 1) rem ^= 0x537 << i;
    return ((val << 10) | rem) ^ 0x5412;
  };
  Encoder.prototype._drawFormat = function (m, mask) {
    const n = this.size, f = this._formatBits(mask), bit = i => (f >> i) & 1;
    for (let i = 0; i < 6; i++) { m[8][i] = bit(i); m[i][8] = bit(14 - i); }
    m[8][7] = bit(6); m[8][8] = bit(7); m[7][8] = bit(8); m[8][n - 8] = bit(8);
    for (let i = 6; i < 15; i++) m[8][n - 15 + i] = bit(i);
    for (let i = 0; i < 7; i++) m[n - 1 - i][8] = bit(i);
  };
  Encoder.prototype._masked = function (mask) {
    const n = this.size;
    const m = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let v = this.matrix[y][x] === null ? 0 : this.matrix[y][x];
      if (!this.reserved[y][x] && maskFn(mask, y, x)) v ^= 1;
      m[y][x] = v;
    }
    return m;
  };
  Encoder.prototype._penalty = function (m) {
    const n = this.size;
    let score = 0;
    const lines = m.map(r => r.slice());
    for (let x = 0; x < n; x++) { const col = []; for (let y = 0; y < n; y++) col.push(m[y][x]); lines.push(col); }
    for (const line of lines) {
      let run = 1;
      for (let i = 1; i < line.length; i++) {
        if (line[i] === line[i - 1]) run++;
        else { if (run >= 5) score += 3 + (run - 5); run = 1; }
      }
      if (run >= 5) score += 3 + (run - 5);
    }
    for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) {
      const v = m[y][x];
      if (v === m[y][x + 1] && v === m[y + 1][x] && v === m[y + 1][x + 1]) score += 3;
    }
    const pat = [1, 0, 1, 1, 1, 0, 1];
    const matchAt = (line, i) => pat.every((p, k) => line[i + k] === p);
    for (const line of lines) {
      for (let i = 0; i + 6 < line.length; i++) {
        if (!matchAt(line, i)) continue;
        let before = i >= 4 ? line.slice(i - 4, i) : null;
        let after = line.slice(i + 7, i + 11);
        if ((before && before.every(v => v === 0)) || (after.length === 4 && after.every(v => v === 0))) score += 40;
      }
    }
    let dark = 0;
    for (const row of m) for (const v of row) dark += v;
    score += Math.floor(Math.abs(dark * 100 / (n * n) - 50) / 5) * 10;
    return score;
  };
  Encoder.prototype._build = function () {
    this._functionPatterns();
    this._placeData(this._codewords());
    let best = 0, bestM = null, bestScore = null;
    for (let mask = 0; mask < 8; mask++) {
      const m = this._masked(mask);
      const s = this._penalty(m);
      if (bestScore === null || s < bestScore) { best = mask; bestM = m; bestScore = s; }
    }
    this.mask = best;
    this._drawFormat(bestM, best);
    this.matrix = bestM;
  };

  /* ---------------- 输出 ---------------- */
  Encoder.prototype.svg = function (opt) {
    const o = Object.assign({ scale: 8, border: 4, dark: '#0d1a2b', light: '#ffffff' }, opt || {});
    const n = this.size, dim = (n + o.border * 2) * o.scale;
    let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + dim + '" height="' + dim + '" viewBox="0 0 ' + dim + ' ' + dim + '" shape-rendering="crispEdges" role="img" aria-label="扫码打开本页">';
    s += '<rect width="100%" height="100%" fill="' + o.light + '"/><g fill="' + o.dark + '">';
    for (let y = 0; y < n; y++) {
      let x = 0;
      while (x < n) {
        if (this.matrix[y][x]) {
          const x0 = x;
          while (x < n && this.matrix[y][x]) x++;
          s += '<rect x="' + ((x0 + o.border) * o.scale) + '" y="' + ((y + o.border) * o.scale) + '" width="' + ((x - x0) * o.scale) + '" height="' + o.scale + '"/>';
        } else x++;
      }
    }
    return s + '</g></svg>';
  };

  global.QiushiQR = {
    encode(text) { return new Encoder(text); },
    /** 把二维码画进某个容器（容器里的内容会被替换） */
    draw(el, text, opt) {
      if (!el) return null;
      try {
        const q = new Encoder(text);
        el.innerHTML = q.svg(opt);
        return q;
      } catch (e) {
        return null;
      }
    }
  };
})(window);
