// アプリの状態を一元管理する。画面（views）はここの関数だけを通してデータを変更する。
import { todayKey } from '../domain/dates.js';
import { canMarkNoSpend } from '../domain/noSpend.js';
import { isValidCategory } from '../config/categories.js';

export const SCHEMA_VERSION = 1;
export const MAX_AMOUNT = 999999;
export const MAX_MEMO = 30;

export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { childName: '', monthlyGoal: 0 }, // monthlyGoal: 毎月の使用目標（円）。0 = 目標なし
    transactions: [],
    noSpendDays: [],
    meta: { lastSeenStage: 0 },
  };
}

// スキーマ移行。データの形を変えるときは SCHEMA_VERSION を上げ、
// MIGRATIONS[旧バージョン] に「旧 → 旧+1」の変換関数を追加する。
// 例: MIGRATIONS[1] = (d) => ({ ...d, schemaVersion: 2, goals: [] });
const MIGRATIONS = {};

/** 読み込んだデータを最新の形にそろえる。不正なら例外 */
export function migrate(data) {
  if (!data || typeof data !== 'object' || !Number.isInteger(data.schemaVersion)) {
    throw new Error('invalid data');
  }
  if (data.schemaVersion > SCHEMA_VERSION) throw new Error('newer schema');
  let d = data;
  while (d.schemaVersion < SCHEMA_VERSION) {
    const fn = MIGRATIONS[d.schemaVersion];
    if (!fn) throw new Error(`no migration from ${d.schemaVersion}`);
    d = fn(d);
  }
  const base = defaultState();
  const out = {
    ...base,
    ...d,
    settings: { ...base.settings, ...d.settings },
    meta: { ...base.meta, ...d.meta },
  };
  if (!Array.isArray(out.transactions) || !Array.isArray(out.noSpendDays)) throw new Error('invalid data');
  if (!isValidGoal(out.settings.monthlyGoal)) out.settings.monthlyGoal = 0;
  out.transactions.forEach((tx) => validateTransaction(tx));
  return out;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isValidGoal = (n) => Number.isInteger(n) && n >= 0 && n <= MAX_AMOUNT;

/** 取引の検証。不正なら例外 */
export function validateTransaction(tx) {
  if (tx.type !== 'income' && tx.type !== 'expense') throw new Error('type');
  if (!Number.isInteger(tx.amount) || tx.amount < 1 || tx.amount > MAX_AMOUNT) throw new Error('amount');
  if (!DATE_RE.test(tx.date)) throw new Error('date');
  if (typeof tx.categoryId !== 'string' || !tx.categoryId) throw new Error('category');
  if (typeof tx.memo !== 'string' || tx.memo.length > MAX_MEMO) throw new Error('memo');
}

const defaultId = () => `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export function createStore(storage, { now = () => new Date(), idGen = defaultId } = {}) {
  let state = load();
  const listeners = new Set();
  const errorListeners = new Set();

  function load() {
    let text;
    try { text = storage.load(); } catch { return defaultState(); }
    if (!text) return defaultState();
    try {
      return migrate(JSON.parse(text));
    } catch {
      storage.backup(text); // 壊れたデータは消さずに退避
      return defaultState();
    }
  }

  function commit(next) {
    state = next;
    try {
      storage.save(JSON.stringify(state));
    } catch (err) {
      errorListeners.forEach((fn) => fn(err));
    }
    listeners.forEach((fn) => fn(state));
  }

  const today = () => todayKey(now());

  /** 支出が入った日の「使わなかった日」申告を外す */
  const withoutNoSpendOn = (days, tx) =>
    tx.type === 'expense' ? days.filter((d) => d !== tx.date) : days;

  return {
    getState: () => state,

    /** 状態が変わるたびに呼ばれる。戻り値で購読解除 */
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    onError(fn) { errorListeners.add(fn); return () => errorListeners.delete(fn); },

    addTransaction(input) {
      const tx = {
        id: idGen(),
        type: input.type,
        amount: input.amount,
        categoryId: input.categoryId,
        date: input.date,
        memo: (input.memo || '').trim(),
        createdAt: now().toISOString(),
      };
      validateTransaction(tx);
      if (!isValidCategory(tx.type, tx.categoryId)) throw new Error('category');
      commit({
        ...state,
        transactions: [...state.transactions, tx],
        noSpendDays: withoutNoSpendOn(state.noSpendDays, tx),
      });
      return tx;
    },

    updateTransaction(id, patch) {
      const old = state.transactions.find((t) => t.id === id);
      if (!old) throw new Error('not found');
      const tx = { ...old, ...patch, id, createdAt: old.createdAt };
      if (typeof tx.memo === 'string') tx.memo = tx.memo.trim();
      validateTransaction(tx);
      if (!isValidCategory(tx.type, tx.categoryId)) throw new Error('category');
      commit({
        ...state,
        transactions: state.transactions.map((t) => (t.id === id ? tx : t)),
        noSpendDays: withoutNoSpendOn(state.noSpendDays, tx),
      });
      return tx;
    },

    deleteTransaction(id) {
      commit({ ...state, transactions: state.transactions.filter((t) => t.id !== id) });
    },

    markNoSpend(date) {
      const check = canMarkNoSpend({ date, today: today(), transactions: state.transactions });
      if (!check.ok) throw new Error(check.reason);
      if (state.noSpendDays.includes(date)) return;
      commit({ ...state, noSpendDays: [...state.noSpendDays, date].sort() });
    },

    unmarkNoSpend(date) {
      commit({ ...state, noSpendDays: state.noSpendDays.filter((d) => d !== date) });
    },

    updateSettings(patch) {
      commit({ ...state, settings: { ...state.settings, ...patch } });
    },

    /** 毎月の使用目標（0〜999,999 の整数。0 = 目標なし）。不正なら例外 */
    setMonthlyGoal(amount) {
      if (!isValidGoal(amount)) throw new Error('goal');
      commit({ ...state, settings: { ...state.settings, monthlyGoal: amount } });
    },

    setMeta(patch) {
      commit({ ...state, meta: { ...state.meta, ...patch } });
    },

    exportJSON() {
      return JSON.stringify(state, null, 2);
    },

    /** バックアップから置き換え。不正なら例外（状態は変えない） */
    importJSON(text) {
      const data = migrate(JSON.parse(text));
      commit(data);
    },

    resetAll() {
      commit(defaultState());
    },
  };
}
