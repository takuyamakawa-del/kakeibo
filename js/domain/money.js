// お金の集計（純粋関数）。transaction = { id, type: 'income'|'expense', amount, categoryId, date, memo, createdAt }

const sign = (tx) => (tx.type === 'income' ? tx.amount : -tx.amount);

export function balance(txs) {
  return txs.reduce((sum, tx) => sum + sign(tx), 0);
}

/** その月の記録（日付の新しい順、同日は作成の新しい順） */
export function transactionsInMonth(txs, ym) {
  return txs
    .filter((tx) => tx.date.startsWith(ym + '-'))
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
}

export function monthTotals(txs, ym) {
  const totals = { income: 0, expense: 0 };
  for (const tx of txs) {
    if (tx.date.startsWith(ym + '-')) totals[tx.type] += tx.amount;
  }
  return totals;
}

/** 月の支出をカテゴリ別に合計（金額の大きい順） */
export function expenseByCategory(txs, ym) {
  const map = new Map();
  for (const tx of txs) {
    if (tx.type !== 'expense' || !tx.date.startsWith(ym + '-')) continue;
    map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + tx.amount);
  }
  return [...map].map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** 日付 → その日の支出合計 */
export function dailyExpense(txs) {
  const map = new Map();
  for (const tx of txs) {
    if (tx.type === 'expense') map.set(tx.date, (map.get(tx.date) || 0) + tx.amount);
  }
  return map;
}

export function hasExpenseOn(txs, date, ignoreId = null) {
  return txs.some((tx) => tx.type === 'expense' && tx.date === date && tx.id !== ignoreId);
}
