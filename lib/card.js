/* 大衍 · 分享卡片
 * 1080×1440（小红书常用 3:4 竖图）
 * render(canvas, result) —— result 为 DayanEngine.cast() 的返回值
 */
(function (root) {
  const W = 1080, H = 1440;
  const C = {
    gold: '#c8a25c', text: '#e9e3d6', dim: '#8d8578',
    dimmer: '#6b6458', accent: '#e0a24a',
    panel: '#191713', line: '#2a2620'
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

  /* 画六爻：上爻在上，初爻在下 */
  function drawLines(g, cx, top, binary, lines) {
    const BAR_W = 300, BAR_H = 13, GAP = 20, BREAK = 34;
    lines.forEach((_, i) => {
      const idx = 5 - i;                    // 从上往下画
      const y = top + i * (BAR_H + GAP);
      const moving = isMoving(lines[idx]);
      g.fillStyle = moving ? C.accent : '#cfc4ab';
      if (moving) {
        g.shadowColor = C.accent;
        g.shadowBlur = 18;
      }
      if (binary[idx]) {
        roundRect(g, cx - BAR_W / 2, y, BAR_W, BAR_H, 2);
        g.fill();
      } else {
        const seg = (BAR_W - BREAK) / 2;
        roundRect(g, cx - BAR_W / 2, y, seg, BAR_H, 2); g.fill();
        roundRect(g, cx + BREAK / 2, y, seg, BAR_H, 2); g.fill();
      }
      g.shadowBlur = 0;
      // 动爻标记
      if (moving) {
        g.fillStyle = C.accent;
        g.font = '20px ' + MONO;
        g.textAlign = 'left';
        g.fillText(lines[idx] === 9 ? '○' : '×', cx + BAR_W / 2 + 16, y + 12);
      }
    });
  }

  function drawPanel(g, x, y, w, h, cap, hex, binary, lines) {
    g.fillStyle = C.panel;
    roundRect(g, x, y, w, h, 18); g.fill();
    g.strokeStyle = C.line; g.lineWidth = 1.5;
    roundRect(g, x, y, w, h, 18); g.stroke();

    const cx = x + w / 2;

    g.textAlign = 'center';
    g.fillStyle = C.dimmer;
    g.font = '22px ' + SANS;
    g.fillText(cap, cx, y + 56);

    g.fillStyle = C.gold;
    g.font = '86px ' + SERIF;
    g.fillText(hex.symbol, cx, y + 168);

    g.fillStyle = C.text;
    g.font = '600 44px ' + SERIF;
    g.fillText(hex.name, cx, y + 232);

    drawLines(g, cx, y + 288, binary, lines);
  }

  function render(canvas, r, opts) {
    opts = opts || {};
    canvas.width = W; canvas.height = H;
    const g = canvas.getContext('2d');

    /* 背景 */
    const bg = g.createRadialGradient(W / 2, -H * 0.08, 60, W / 2, -H * 0.08, H * 1.05);
    bg.addColorStop(0, '#23201a');
    bg.addColorStop(1, '#100f0d');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);

    /* 外框 */
    g.strokeStyle = 'rgba(200,162,92,0.16)';
    g.lineWidth = 2;
    roundRect(g, 44, 44, W - 88, H - 88, 26);
    g.stroke();

    /* 头部 */
    g.textAlign = 'center';
    g.fillStyle = C.gold;
    g.font = '600 64px ' + SERIF;
    g.fillText('大　衍', W / 2, 172);

    g.fillStyle = C.dim;
    g.font = '24px ' + SANS;
    g.fillText('大衍之数五十 · 其用四十有九 · 十八变而成卦', W / 2, 220);

    const d = opts.date || new Date();
    const pad = n => String(n).padStart(2, '0');
    const dateStr = d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) +
                    '　' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    g.fillStyle = C.dimmer;
    g.font = '22px ' + MONO;
    g.fillText(dateStr, W / 2, 272);

    /* 双卦面板 */
    const hasMove = r.moving.length > 0;
    drawPanel(g, 80, 330, 440, 470, '本 卦 · 当 下', r.primary, r.primaryBinary, r.lines);
    drawPanel(g, 560, 330, 440, 470, hasMove ? '变 卦 · 走 向' : '无 变', r.changed, r.changedBinary, r.lines);

    /* 中间箭头 */
    g.fillStyle = '#4a4438';
    g.font = '40px ' + SANS;
    g.fillText('→', 540, 585);

    /* 六爻数字 */
    g.fillStyle = 'rgba(20,18,16,0.9)';
    roundRect(g, 80, 850, 920, 150, 14); g.fill();
    g.strokeStyle = C.line; g.lineWidth = 1.5;
    roundRect(g, 80, 850, 920, 150, 14); g.stroke();

    for (let i = 0; i < 6; i++) {
      const cx = 80 + 920 / 6 * (i + 0.5);
      const v = r.lines[i];
      const mv = isMoving(v);
      g.fillStyle = mv ? C.accent : (v === 7 ? '#d8c69a' : '#9c9484');
      g.font = '600 46px ' + MONO;
      g.fillText(String(v), cx, 918);
      g.fillStyle = mv ? '#8a6a34' : C.dimmer;
      g.font = '19px ' + SANS;
      g.fillText(POS[i], cx, 956);
    }

    /* 动爻 */
    g.font = '26px ' + SANS;
    if (hasMove) {
      const names = r.moving.map(i => POS[i - 1] + '爻').join('、');
      g.fillStyle = C.dim;
      g.fillText('动爻　' + names, W / 2, 1104);
    } else {
      g.fillStyle = C.dim;
      g.fillText('静卦 · 六爻皆不动', W / 2, 1104);
    }

    /* 分隔线 + 脚注 */
    g.strokeStyle = 'rgba(200,162,92,0.12)';
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(300, 1206); g.lineTo(780, 1206); g.stroke();

    g.fillStyle = C.dimmer;
    g.font = '23px ' + SANS;
    g.fillText('分二 · 挂一 · 揲四 · 归奇', W / 2, 1266);

    g.fillStyle = '#4e4840';
    g.font = '19px ' + MONO;
    g.fillText(r.lines.join('  '), W / 2, 1312);
  }

  root.DayanCard = { render: render, W: W, H: H };
}(typeof self !== 'undefined' ? self : this));
