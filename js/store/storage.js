// 永続化アダプタ。store はこの形 { load(), save(text), backup(text) } にだけ依存する。
// クラウド同期などに変える場合は、同じ形のアダプタを作って app.js で差し替える。

export const STORAGE_KEY = 'kodomo-kakeibo:v1';

/** localStorage 版 */
export function createLocalStorage(key = STORAGE_KEY) {
  return {
    load() {
      return localStorage.getItem(key);
    },
    save(text) {
      localStorage.setItem(key, text); // 容量超過などは例外になる → store が onError に通知
    },
    backup(text) {
      try { localStorage.setItem(`kodomo-kakeibo:broken:${Date.now()}`, text); } catch { /* 退避も失敗したら諦める */ }
    },
  };
}

/** メモリ版（テスト用） */
export function createMemoryStorage(initialText = null) {
  let text = initialText;
  const backups = [];
  return {
    load: () => text,
    save: (t) => { text = t; },
    backup: (t) => { backups.push(t); },
    get backups() { return backups; },
    get text() { return text; },
  };
}
