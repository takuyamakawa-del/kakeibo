// ふりがな付与。t('今日は使わなかった') → '<ruby>今日<rt>きょう</rt></ruby>は<ruby>使<rt>つか</rt></ruby>わなかった'
// 戻り値は HTML 文字列（入力はエスケープ済み）。ユーザー入力にも安全に使える。
import { FURIGANA } from '../config/furigana.js';
import { esc } from './dom.js';

let dict = FURIGANA;
let keys = sortKeys(dict);

function sortKeys(d) {
  return Object.keys(d).sort((a, b) => b.length - a.length);
}

/** テストや将来の切り替え用に辞書を差し替える */
export function setDictionary(d) {
  dict = d;
  keys = sortKeys(d);
}

/** 1語に明示的にふりがなを付ける */
export function r(kanji, yomi) {
  return `<ruby>${esc(kanji)}<rt>${esc(yomi)}</rt></ruby>`;
}

function renderEntry(key, value) {
  if (typeof value === 'string') return r(key, value);
  return value.map((seg) => (Array.isArray(seg) ? r(seg[0], seg[1]) : esc(seg))).join('');
}

/** 文字列中の辞書語にふりがなを付ける（長い語を優先） */
export function t(text) {
  const s = String(text ?? '');
  let out = '';
  let i = 0;
  outer: while (i < s.length) {
    for (const k of keys) {
      if (s.startsWith(k, i)) {
        out += renderEntry(k, dict[k]);
        i += k.length;
        continue outer;
      }
    }
    out += esc(s[i]);
    i++;
  }
  return out;
}
