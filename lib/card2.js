/* 大衍 · 解卦卡片
 * 1080×1440
 * 版式：卦象 → 彖曰 → 爻辞 → 小象 → 断语（断语块吃剩余空间，按长度自适应字号）
 * DayanCard2.render(canvas, data)
 *   data = { r, catLabel, quote, yaoLabel, yaoText, xiangText, tuan, date }
 */
(function (root) {
  const W = 1080, H = 1440;
  const C = {
    gold: '#d9b877', gold2: '#a8823f', text: '#ece5d6', dim: '#8a8275',
    dimmer: '#5f584c', accent: '#e0a24a', panel: '#191510', line: 'rgba(200,162,92,.16)'
  };
  const SERIF = '"Songti SC","Noto Serif SC","Source Han Serif SC",serif';
  const SANS = '-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
  const MONO = 'ui-monospace,"SF Mono",Menlo,monospace';
  const POS = ['初', '二', '三', '四', '五', '上'];
  const isMoving = v => v === 6 || v === 9;

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  /* 中文按字符折行 */
  function wrap(g, text, maxW) {
    const out = [];
    let cur = '';
    for (const ch of String(text)) {
      if (ch === '\n') { out.push(cur); cur = ''; continue; }
      if (cur && g.measureText(cur + ch).width > maxW) { out.push(cur); cur = ch; }
      else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
  }

  /* 卦象：六爻自下而上 */
  function drawLines(g, cx, top, binary, lines) {
    const BAR_W = 268, BAR_H = 10, GAP = 12, BREAK = 30;
    lines.forEach((_, i) => {
      const idx = 5 - i;
      const y = top + i * (BAR_H + GAP);
      const mv = isMoving(lines[idx]);
      g.fillStyle = mv ? C.accent : '#cfc4ab';
      if (mv) { g.shadowColor = C.accent; g.shadowBlur = 14; }
      if (binary[idx]) {
        roundRect(g, cx - BAR_W / 2, y, BAR_W, BAR_H, 2); g.fill();
      } else {
        const seg = (BAR_W - BREAK) / 2;
        roundRect(g, cx - BAR_W / 2, y, seg, BAR_H, 2); g.fill();
        roundRect(g, cx + BREAK / 2, y, seg, BAR_H, 2); g.fill();
      }
      g.shadowBlur = 0;
      if (mv) {
        g.fillStyle = C.accent;
        g.font = '16px ' + MONO;
        g.textAlign = 'left';
        g.fillText(lines[idx] === 9 ? '○' : '×', cx + BAR_W / 2 + 12, y + 10);
      }
    });
  }

  function drawPanel(g, x, y, w, h, cap, hex, binary, lines) {
    g.fillStyle = 'rgba(28,24,18,.92)';
    roundRect(g, x, y, w, h, 15); g.fill();
    g.strokeStyle = C.line; g.lineWidth = 1.5;
    roundRect(g, x, y, w, h, 15); g.stroke();

    const lg = g.createLinearGradient(x + w * 0.2, 0, x + w * 0.8, 0);
    lg.addColorStop(0, 'rgba(217,184,119,0)');
    lg.addColorStop(0.5, 'rgba(217,184,119,.42)');
    lg.addColorStop(1, 'rgba(217,184,119,0)');
    g.fillStyle = lg;
    g.fillRect(x + w * 0.18, y, w * 0.64, 1);

    const cx = x + w / 2;
    g.textAlign = 'center';
    g.fillStyle = C.dimmer;
    g.font = '18px ' + SANS;
    g.fillText(cap, cx, y + 38);

    g.fillStyle = C.gold;
    g.font = '62px ' + SERIF;
    g.fillText(hex.symbol, cx, y + 118);

    g.fillStyle = C.text;
    g.font = '600 34px ' + SERIF;
    g.fillText(hex.name, cx, y + 166);

    drawLines(g, cx, y + 200, binary, lines);
  }

  /* 一行「标签 + 原文」；返回占用高度 */
  function row(g, y, label, text, fs, lh, maxLines, color) {
    g.textAlign = 'left';
    g.fillStyle = C.gold2;
    g.font = '17px ' + SANS;
    g.fillText(label, 80, y + 17);

    g.font = fs + 'px ' + SERIF;
    const all = wrap(g, text, 842);
    const lines = all.slice(0, maxLines);
    if (all.length > maxLines && lines.length) {
      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1) + '…';
    }
    g.fillStyle = color;
    lines.forEach((l, i) => g.fillText(l, 158, y + 17 + i * lh));
    return lines.length * lh;
  }

  /* 断语自适应字号 */
  function fit(g, text, maxW, maxH) {
    const tries = [[42, 62], [36, 55], [31, 48], [27, 42], [23, 36]];
    for (const t of tries) {
      g.font = t[0] + 'px ' + SERIF;
      const lines = wrap(g, text, maxW);
      if (lines.length * t[1] <= maxH) return { lines: lines, fs: t[0], lh: t[1] };
    }
    const last = tries[tries.length - 1];
    g.font = last[0] + 'px ' + SERIF;
    const lines = wrap(g, text, maxW);
    const maxLines = Math.floor(maxH / last[1]);
    const cut = lines.slice(0, maxLines);
    if (cut.length) cut[cut.length - 1] = cut[cut.length - 1].slice(0, -1) + '…';
    return { lines: cut, fs: last[0], lh: last[1] };
  }

  function render(canvas, data) {
    const r = data.r;
    canvas.width = W; canvas.height = H;
    const g = canvas.getContext('2d');

    const bg = g.createRadialGradient(W / 2, -H * 0.08, 60, W / 2, -H * 0.08, H * 1.05);
    bg.addColorStop(0, '#272119');
    bg.addColorStop(0.42, '#15120e');
    bg.addColorStop(1, '#0b0a08');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);

    g.strokeStyle = 'rgba(200,162,92,.15)';
    g.lineWidth = 2;
    roundRect(g, 44, 44, W - 88, H - 88, 26);
    g.stroke();

    /* 头部 */
    g.textAlign = 'center';
    g.fillStyle = C.gold;
    g.font = '600 54px ' + SERIF;
    g.fillText('大　衍　·　解　卦', W / 2, 158);

    g.fillStyle = C.dim;
    g.font = '20px ' + SANS;
    g.fillText('取 辞 · 检 索 · 原 文', W / 2, 198);

    const d = data.date || new Date();
    const pad = n => String(n).padStart(2, '0');
    g.fillStyle = C.dimmer;
    g.font = '19px ' + MONO;
    g.fillText(d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) +
               '　' + pad(d.getHours()) + ':' + pad(d.getMinutes()), W / 2, 236);

    /* 双卦 */
    const hasMove = r.moving.length > 0;
    drawPanel(g, 80, 266, 440, 336, '本 卦 · 当 下', r.primary, r.primaryBinary, r.lines);
    drawPanel(g, 560, 266, 440, 336, hasMove ? '变 卦 · 走 向' : '无 变', r.changed, r.changedBinary, r.lines);
    g.fillStyle = '#4b4336';
    g.font = '32px ' + SANS;
    g.fillText('→', 540, 452);

    /* 动爻 */
    g.font = '23px ' + SANS;
    g.fillStyle = C.dim;
    g.fillText(hasMove
      ? '动爻　' + r.moving.map(i => POS[i - 1] + '爻').join('、')
      : '静卦 · 六爻皆不动', W / 2, 648);

    /* 原文三行 */
    let y = 700;
    if (data.tuan) {
      y += row(g, y, '彖 曰', data.tuan, 21, 31, 3, '#9e9584') + 9;
    }
    if (data.yaoText) {
      y += row(g, y, data.yaoLabel || '爻 辞', data.yaoText, 26, 35, 2, '#cfc7b6') + 8;
    }
    if (data.xiangText) {
      y += row(g, y, '小 象', '《象》曰：' + data.xiangText, 20, 28, 1, '#8a8275') + 4;
    }
    y += 16;

    /* 断语块：吃掉剩余空间 */
    const boxTop = y;
    const boxBottom = 1308;
    const boxH = boxBottom - boxTop;
    g.fillStyle = 'rgba(10,9,7,.55)';
    roundRect(g, 80, boxTop, 920, boxH, 14); g.fill();
    g.strokeStyle = C.line; g.lineWidth = 1.5;
    roundRect(g, 80, boxTop, 920, boxH, 14); g.stroke();
    g.fillStyle = C.gold;
    roundRect(g, 80, boxTop + 16, 3, boxH - 32, 2); g.fill();

    g.textAlign = 'left';
    g.fillStyle = C.gold2;
    g.font = '17px ' + SANS;
    g.fillText(data.catLabel || ('问 ' + (data.cat || '综 合')), 116, boxTop + 42);

    const inner = fit(g, data.quote || '', 836, boxH - 92);
    g.fillStyle = '#e0d8c8';
    g.font = inner.fs + 'px ' + SERIF;
    inner.lines.forEach((ln, i) => g.fillText(ln, 116, boxTop + 54 + inner.lh + i * inner.lh));

    /* 脚注 */
    g.textAlign = 'center';
    g.fillStyle = '#443e35';
    g.font = '18px ' + SANS;
    g.fillText('取辞依朱熹《易学启蒙》七条 · 断语为高岛易断原文', W / 2, 1350);

    return { fs: inner.fs, lines: inner.lines.length, boxTop: boxTop, boxH: boxH, textEnd: y };
  }

  root.DayanCard2 = { render: render, W: W, H: H };
}(typeof self !== 'undefined' ? self : this));
