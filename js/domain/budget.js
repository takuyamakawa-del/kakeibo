// 使用目標（毎月定額）と使用率の計算（純粋関数）
// period は { kind: 'month', key: 'YYYY-MM' } か { kind: 'year', key: 'YYYY' }。
// key は money.js の集計関数（monthTotals 等）にそのまま渡せる（'YYYY-' で始まる記録が対象になる）。

/** 期間の目標金額。年は毎月の目標 × 12 */
export function goalFor(kind, monthlyGoal) {
  if (!monthlyGoal) return 0;
  return kind === 'year' ? monthlyGoal * 12 : monthlyGoal;
}

/**
 * 使用状況。目標がなければ null。
 * @returns {{ goal, spent, rate, remaining, over } | null}  rate は 0.62 のような割合（100% 超もそのまま）
 */
export function usage(spent, goal) {
  if (!goal) return null;
  return { goal, spent, rate: spent / goal, remaining: goal - spent, over: spent > goal };
}

/**
 * 円グラフの区切り。円全体＝目標（こえたら使った合計）。
 * 区切りはカテゴリの定義順に並べる（金額順にすると月ごとに色の並びが変わってしまうため）。
 * @param {{categoryId:string, amount:number}[]} byCategory
 * @param {number} goal
 * @param {string[]} order カテゴリ id の表示順
 * @returns {{ segments: {categoryId:string, amount:number, fraction:number}[], remainingFraction: number }}
 */
export function donutSegments(byCategory, goal, order) {
  const spent = byCategory.reduce((s, c) => s + c.amount, 0);
  const whole = Math.max(goal, spent);
  if (!whole) return { segments: [], remainingFraction: 1 };
  const rank = (id) => { const i = order.indexOf(id); return i === -1 ? order.length : i; };
  const segments = byCategory
    .filter((c) => c.amount > 0)
    .sort((a, b) => rank(a.categoryId) - rank(b.categoryId))
    .map((c) => ({ ...c, fraction: c.amount / whole }));
  return { segments, remainingFraction: Math.max(0, goal - spent) / whole };
}

/** その年の月ごとの支出（12 個の配列、0=1月） */
export function monthlyExpenses(txs, year) {
  const out = Array(12).fill(0);
  for (const tx of txs) {
    if (tx.type !== 'expense' || !tx.date.startsWith(year + '-')) continue;
    out[Number(tx.date.slice(5, 7)) - 1] += tx.amount;
  }
  return out;
}
