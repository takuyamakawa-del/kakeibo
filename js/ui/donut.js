// ドーナツ型の円グラフ（SVG 文字列を返す。外部ライブラリなし）
//   segments: [{ id, color, fraction, title }]  fraction の合計 + remainingFraction ≦ 1
//   区切りの間には背景色のすき間（約2px）を入れる。各区切りは data-seg="<id>" を持ち、
//   画面側でタップ／ホバー時の説明表示に使う。<title> は PC のホバー用。
import { esc } from './dom.js';

const SIZE = 200;
const C = SIZE / 2;
const R_OUT = 92;
const R_IN = 62;
const GAP_PX = 2; // 区切りのすき間（外周上の長さ, viewBox 単位）

function point(r, angle) {
  // angle: 0 = 12時の位置、時計回り（ラジアン）
  return [C + r * Math.sin(angle), C - r * Math.cos(angle)];
}

function arcPath(a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = point(R_OUT, a0);
  const [x1, y1] = point(R_OUT, a1);
  const [x2, y2] = point(R_IN, a1);
  const [x3, y3] = point(R_IN, a0);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R_OUT} ${R_OUT} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} `
    + `L${x2.toFixed(2)} ${y2.toFixed(2)} A${R_IN} ${R_IN} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)} Z`;
}

/**
 * @param {{ segments: {id:string, color:string, fraction:number, title:string}[],
 *           remainingFraction?: number, remainingColor?: string, remainingTitle?: string,
 *           alertColor?: string|null, label?: string }} opts
 *   alertColor を渡すと外側に警告色の輪を描く（目標オーバー時）
 */
export function donutSVG({ segments, remainingFraction = 0, remainingColor = '#ebe4d8', remainingTitle = '', alertColor = null, label = '' }) {
  const parts = [...segments];
  if (remainingFraction > 0.0001) parts.push({ id: 'remaining', color: remainingColor, fraction: remainingFraction, title: remainingTitle });

  const gapAngle = parts.length > 1 ? GAP_PX / R_OUT : 0;
  let angle = 0;
  const paths = parts.map((p) => {
    const sweep = p.fraction * Math.PI * 2;
    const a0 = angle + gapAngle / 2;
    const a1 = angle + sweep - gapAngle / 2;
    angle += sweep;
    if (a1 <= a0) return '';
    // 1区切りで一周する場合、円弧は 2 つに分けて描く（SVG の円弧は始点＝終点を描けないため）
    const d = sweep >= Math.PI * 2 - 1e-6
      ? `${arcPath(0, Math.PI)} ${arcPath(Math.PI, Math.PI * 2)}`
      : arcPath(a0, a1);
    return `<path d="${d}" fill="${esc(p.color)}" data-seg="${esc(p.id)}" class="donut-seg"><title>${esc(p.title)}</title></path>`;
  }).join('');

  const ring = alertColor
    ? `<circle cx="${C}" cy="${C}" r="${R_OUT + 5}" fill="none" stroke="${esc(alertColor)}" stroke-width="4"/>`
    : '';

  return `<svg class="donut" viewBox="-8 -8 ${SIZE + 16} ${SIZE + 16}" role="img" aria-label="${esc(label)}">${ring}${paths}</svg>`;
}
