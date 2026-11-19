// 表示用の書式（ふりがな付き HTML を返す）
import { partsOf } from '../domain/dates.js';
import { t, r } from './ruby.js';
import { yen } from './dom.js';

export const WEEKDAYS = [
  ['日', 'にち'], ['月', 'げつ'], ['火', 'か'], ['水', 'すい'], ['木', 'もく'], ['金', 'きん'], ['土', 'ど'],
];

/** "2026-11-19" → 11月19日(木) */
export function dateLabel(key, { weekday = true } = {}) {
  const p = partsOf(key);
  const wd = weekday ? `（${r(...WEEKDAYS[p.weekday])}）` : '';
  return `${p.month}${r('月', 'がつ')}${p.day}${r('日', 'にち')}${wd}`;
}

/** "2026-11" → 2026年11月 */
export function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${y}${r('年', 'ねん')}${m}${r('月', 'がつ')}`;
}

/** 金額 → "1,234円" */
export function money(n) {
  return `${yen(n)}${t('円')}`;
}

/** 日数 → "3日" */
export function days(n) {
  return `${n}${r('日', 'にち')}`;
}
