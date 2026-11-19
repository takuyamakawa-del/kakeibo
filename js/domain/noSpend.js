// 「お金を使わなかった日」のルール（純粋関数）。days は "YYYY-MM-DD" の配列。
import { addDays } from './dates.js';
import { hasExpenseOn } from './money.js';

/** 申告できるか。reason: 'future'（未来日） | 'hasExpense'（支出あり） | null */
export function canMarkNoSpend({ date, today, transactions }) {
  if (date > today) return { ok: false, reason: 'future' };
  if (hasExpenseOn(transactions, date)) return { ok: false, reason: 'hasExpense' };
  return { ok: true, reason: null };
}

export function totalNoSpend(days) {
  return new Set(days).size;
}

/**
 * 今続いている連続日数。
 * 今日が申告済みなら今日から、まだなら昨日から数える（今日の申告前に途切れて見えないように）。
 */
export function currentStreak(days, today) {
  const set = new Set(days);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (set.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function countInMonth(days, ym) {
  return new Set(days.filter((d) => d.startsWith(ym + '-'))).size;
}
