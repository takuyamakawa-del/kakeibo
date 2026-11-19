// キャラクター表示。SVG はインライン展開して、CSS で表情（#face-normal / #face-smile）を切り替える。
// ボーナス id はそのまま CSS クラス "bonus-<id>" になる（css/views.css の .chara 参照）。
import { STAGES } from '../config/growth.js';
import { esc } from './dom.js';

const svgCache = new Map();

async function loadSVG(url) {
  if (!svgCache.has(url)) {
    svgCache.set(url, fetch(url).then((r) => (r.ok ? r.text() : '')).catch(() => ''));
  }
  return svgCache.get(url);
}

/**
 * @param {HTMLElement} el 描画先
 * @param {{ stageIndex: number, bonuses?: Set<string>, size?: 'sm'|'md'|'lg' }} opts
 */
export async function renderCharacter(el, { stageIndex, bonuses = new Set(), size = 'md' }) {
  const stage = STAGES[stageIndex] || STAGES[0];
  const classes = ['chara', `chara-${size}`, ...[...bonuses].map((b) => `bonus-${b}`)].join(' ');
  const sparkles = bonuses.has('sparkle')
    ? '<span class="spark s1">✦</span><span class="spark s2">✧</span><span class="spark s3">✦</span><span class="spark s4">✧</span>'
    : '';
  let art;
  if (stage.image.endsWith('.svg')) {
    const svg = await loadSVG(stage.image);
    art = svg || `<span class="chara-fallback">🥚</span>`;
  } else {
    art = `<img src="${esc(stage.image)}" alt="${esc(stage.name)}">`;
  }
  el.innerHTML = `<div class="${classes}"><div class="chara-art">${art}</div>${sparkles}</div>`;
}
