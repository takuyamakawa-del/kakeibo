// 一覧：月ごとの記録・合計・カテゴリ別内訳。行を押すと修正画面へ。
import { todayKey, monthOf, addMonths } from '../domain/dates.js';
import { transactionsInMonth, monthTotals, expenseByCategory } from '../domain/money.js';
import { findCategory } from '../config/categories.js';
import { t } from '../ui/ruby.js';
import { esc, on } from '../ui/dom.js';
import { catIcon } from '../ui/categoryIcon.js';
import { dateLabel, monthLabel, money } from '../ui/format.js';

export function render(root, { store, navigate, params }) {
  let ym = /^\d{4}-\d{2}$/.test(params.ym || '') ? params.ym : monthOf(todayKey());

  const draw = () => {
    const s = store.getState();
    const txs = transactionsInMonth(s.transactions, ym);
    const totals = monthTotals(s.transactions, ym);
    const byCat = expenseByCategory(s.transactions, ym);
    const maxCat = Math.max(1, ...byCat.map((c) => c.amount));

    // 日付ごとにまとめる
    const groups = [];
    for (const x of txs) {
      if (!groups.length || groups[groups.length - 1].date !== x.date) groups.push({ date: x.date, items: [] });
      groups[groups.length - 1].items.push(x);
    }

    root.innerHTML = `
      <section class="view view-history">
        <div class="month-nav">
          <button type="button" class="btn-round" data-move="-1" aria-label="前の月">‹</button>
          <h1 class="view-title">${monthLabel(ym)}</h1>
          <button type="button" class="btn-round" data-move="1" aria-label="次の月">›</button>
        </div>

        <div class="totals">
          <div class="total income"><span>${t('もらった')}</span><strong>+${money(totals.income)}</strong></div>
          <div class="total expense"><span>${t('使った')}</span><strong>-${money(totals.expense)}</strong></div>
          <div class="total diff"><span>${t('のこり')}</span><strong>${money(totals.income - totals.expense)}</strong></div>
        </div>

        <div class="history-grid">
          <div class="card">
            <h2 class="card-title">${t('使ったお金の内訳')}</h2>
            ${byCat.length ? `<ul class="bars">${byCat.map((c) => {
              const cat = findCategory('expense', c.categoryId);
              return `<li class="bar-row">
                <span class="bar-label">${catIcon(cat)} ${t(cat.label)}</span>
                <span class="bar"><span class="bar-fill" style="width:${(c.amount / maxCat) * 100}%;background:${cat.color}"></span></span>
                <span class="bar-value">${money(c.amount)}</span></li>`;
            }).join('')}</ul>` : `<p class="muted">${t('まだありません')}</p>`}
          </div>

          <div class="card">
            <h2 class="card-title">${t('記録')}</h2>
            ${groups.length ? groups.map((g) => `
              <h3 class="group-date">${dateLabel(g.date)}</h3>
              <ul class="tx-list">${g.items.map((x) => {
                const c = findCategory(x.type, x.categoryId);
                return `<li><button type="button" class="tx-row" data-id="${esc(x.id)}">
                  <span class="tx-icon" style="background:${c.color}">${catIcon(c)}</span>
                  <span class="tx-text">${t(c.label)}${x.memo ? `<small>${esc(x.memo)}</small>` : ''}</span>
                  <span class="tx-amount ${x.type}">${x.type === 'expense' ? '-' : '+'}${money(x.amount)}</span>
                </button></li>`;
              }).join('')}</ul>`).join('') : `<p class="muted">${t('この月の記録はまだありません')}</p>`}
          </div>
        </div>
      </section>`;
  };

  draw();
  on(root, 'click', '[data-move]', (_e, b) => { ym = addMonths(ym, Number(b.dataset.move)); draw(); });
  on(root, 'click', '.tx-row', (_e, b) => navigate('input', { id: b.dataset.id }));
}
