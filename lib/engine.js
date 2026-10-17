/* 大衍筮法 · 起卦引擎
 *
 * 两种模式：
 *   true    （默认·保真）逐变真模拟：分二 → 挂一 → 揲四 → 归奇，连跑 18 变。
 *                        每一变的 5/9、4/8 都是真摇出来的，可展示、可核对。
 *   classic（经典）      直接按朱熹数理 3:5:7:1 定爻，再反推一组自洽的三变数字。
 *                        分布严格等于经典概率，但中间数字是补的。
 *
 * 为什么默认保真：产品要能把「这一卦怎么来的」摊开给人看，
 * 补出来的中间数字经不起追问。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DayanEngine = api;
}(typeof self !== 'undefined' ? self : this, function () {

  /* ── 真随机：crypto + 拒绝采样，避免取模偏差 ── */
  function randomInt(maxExclusive) {
    const c = (typeof crypto !== 'undefined' && crypto.getRandomValues)
      ? crypto : require('crypto').webcrypto;
    const limit = Math.floor(4294967296 / maxExclusive) * maxExclusive;
    const buf = new Uint32Array(1);
    let x;
    do { c.getRandomValues(buf); x = buf[0]; } while (x >= limit);
    return x % maxExclusive;
  }

  /* ── 一变：对 n 根蓍草做 分二/挂一/揲四/归奇 ──
     返回这一变"拿掉"的根数：一变必为 5 或 9，二三变必为 4 或 8 */
  function oneChange(n) {
    const left = randomInt(n - 1) + 1;   // 分二：随手分两堆
    const right = n - left;
    const rightAfter = right - 1;        // 挂一：右堆取 1 根
    const r1 = left % 4 || 4;            // 揲四：整除时按 4 计
    const r2 = rightAfter % 4 || 4;
    // 归奇：挂的 1 根 + 两堆余数，一并收走
    return { taken: 1 + r1 + r2, left, rightAfter, r1, r2 };
  }

  /* ── 保真模式：三变成一爻 ── */
  function oneLineTrue() {
    let n = 49;                          // 大衍之数五十，其用四十有九
    const changes = [];
    for (let i = 0; i < 3; i++) {
      const c = oneChange(n);
      changes.push(c.taken);
      n -= c.taken;
    }
    return { value: n / 4, remain: n, changes };  // 剩余 36/32/28/24 → 9/8/7/6
  }

  /* ── 经典模式：按 3:5:7:1 定爻，再补一组自洽的三变 ── */
  const WEIGHTS = [[9, 3], [8, 7], [7, 5], [6, 1]];
  const COMBOS = {
    9: [[5, 4, 4]],
    8: [[9, 4, 4], [5, 8, 4], [5, 4, 8]],
    7: [[5, 8, 8], [9, 8, 4], [9, 4, 8]],
    6: [[9, 8, 8]]
  };
  function oneLineClassic() {
    let r = randomInt(16), acc = 0, value = 6;
    for (const [v, w] of WEIGHTS) { acc += w; if (r < acc) { value = v; break; } }
    const cs = COMBOS[value];
    const changes = cs[randomInt(cs.length)].slice();
    return { value, remain: value * 4, changes, synthesized: true };
  }

  function oneLine(mode) {
    return (mode === 'classic') ? oneLineClassic() : oneLineTrue();
  }

  /* ── 六爻成卦：初爻在最前（最下），上爻在最后（最上） ── */
  function cast(mode) {
    const lines = [], steps = [];
    for (let i = 0; i < 6; i++) {
      const L = oneLine(mode);
      lines.push(L.value);
      steps.push(L.changes);
    }
    return Object.assign({ lines: lines, steps: steps, mode: mode || 'true' }, read(lines));
  }

  /* ── 数字 → 卦（纯函数，确定性，可单测） ── */
  function read(lines) {
    const primary = lines.map(v => (v === 9 || v === 7) ? 1 : 0);   // 9/7 阳，8/6 阴
    const changed = lines.map(v => {
      if (v === 9) return 0;                                        // 老阳变阴
      if (v === 6) return 1;                                        // 老阴变阳
      return (v === 7) ? 1 : 0;                                     // 少阳/少阴不动
    });
    const moving = [];
    lines.forEach((v, i) => { if (v === 6 || v === 9) moving.push(i + 1); });

    const H = (typeof window !== 'undefined') ? window.HEXAGRAMS : null;
    const lookup = bin => {
      if (!H || !H[bin]) return null;
      return { name: H[bin].n, symbol: H[bin].s, id: H[bin].i };
    };
    return {
      primaryBinary: primary,
      changedBinary: changed,
      moving: moving,
      primary: lookup(primary.join('')),
      changed: lookup(changed.join(''))
    };
  }

  return { cast, oneLine, oneChange, read };
}));
