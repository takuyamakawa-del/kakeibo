// 画面の登録とハッシュルーティング（#/home, #/input?type=expense など）
// 新しい画面を足すときは views/ にファイルを作り、ROUTES に1行追加する。
// tab: true にすると下のタブバーに表示される。
import * as home from './views/home.js';
import * as input from './views/input.js';
import * as calendar from './views/calendar.js';
import * as history from './views/history.js';
import * as character from './views/character.js';
import * as settings from './views/settings.js';

export const ROUTES = [
  { id: 'home',      label: 'ホーム',     icon: '🏠', view: home,      tab: true },
  { id: 'input',     label: '記録',       icon: '✏️', view: input,     tab: true },
  { id: 'calendar',  label: 'カレンダー', icon: '📅', view: calendar,  tab: true },
  { id: 'history',   label: '一覧',       icon: '📋', view: history,   tab: true },
  { id: 'character', label: 'キャラ',     icon: '🥚', view: character, tab: true },
  { id: 'settings',  label: '設定',       icon: '⚙️', view: settings,  tab: true },
];

export const DEFAULT_ROUTE = 'home';

/** "#/input?type=expense" → { id: 'input', params: { type: 'expense' } } */
export function parseHash(hash) {
  const m = /^#\/([\w-]+)(?:\?(.*))?$/.exec(hash || '');
  const id = m && ROUTES.some((r) => r.id === m[1]) ? m[1] : DEFAULT_ROUTE;
  const params = Object.fromEntries(new URLSearchParams((m && m[2]) || ''));
  return { id, params };
}

export function buildHash(id, params = {}) {
  const q = new URLSearchParams(params).toString();
  return `#/${id}${q ? `?${q}` : ''}`;
}

export function navigate(id, params = {}) {
  const hash = buildHash(id, params);
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}

export function findRoute(id) {
  return ROUTES.find((r) => r.id === id);
}
