// カレンダー：使わなかった日（花丸）と使った日の金額を月表示。日付タップで詳細・後から申告。
// params: ym=YYYY-MM
import { todayKey, monthOf, addMonths, calendarWeeks, partsOf } from '../domain/dates.js';
import { dailyExpense } from '../domain/money.js';
import { countInMonth, canMarkNoSpend } from '../domain/noSpend.js';
import { findCategory } from '../config/categories.js';
import { t, r } from '../ui/ruby.js';
import { esc, on, yen } from '../ui/dom.js';
import { dateLabel, monthLabel, money, days, WEEKDAYS } from '../ui/format.js';
import { catIcon } from '../ui/categoryIcon.js';
import { showModal, toast } from '../ui/dialog.js';

export function render(root, { store, navigate, params }) {
  const today = todayKey();
  let ym = /^\d{4}-\d{2}$/.test(params.ym || '') ? params.ym : monthOf(today);

  const draw = () => {
    const s = store.getState();
    const noSpend = new Set(s.noSpendDays);
    const spent = dailyExpense(s.transactions);
    const weeks = calendarWeeks(ym);

    const cell = (key) => {
      if (!key) return '<div class="cal-cell empty"></div>';
      const { day, weekday } = partsOf(key);
      const cls = ['cal-cell'];
      if (key === today) cls.push('today');
      if (key > today) cls.push('future');
      if (weekday === 0) cls.push('sun');
      if (weekday === 6) cls.push('sat');
      let mark = '';
      if (noSpend.has(key)) { cls.push('nospend'); mark = '<span class="cal-stamp" aria-label="使わなかった日">🌸</span>'; }
      else if (spent.has(key)) { cls.push('spent'); mark = `<span class="cal-amount">-${yen(spent.get(key))}</span>`; }
      return `<button type="button" class="${cls.join(' ')}" data-date="${key}" ${key > today ? 'disabled' : ''}>
        <span class="cal-day">${day}</span>${mark}</button>`;
    };

    root.innerHTML = `
      <section class="view view-calendar">
        <div class="month-nav">
          <button type="button" class="btn-round" data-move="-1" aria-label="前の月">‹</button>
          <h1 class="view-title">${monthLabel(ym)}</h1>
          <button type="button" class="btn-round" data-move="1" aria-label="次の月">›</button>
        </div>
        <p class="cal-summary">🌸 ${t('使わなかった日')}：<strong>${days(countInMonth(s.noSpendDays, ym))}</strong></p>
        <div class="cal">
          ${WEEKDAYS.map(([k, y], i) => `<div class="cal-head ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${r(k, y)}</div>`).join('')}
          ${weeks.flat().map(cell).join('')}
        </div>
        <p class="hint">${t('日付を押すと、その日の記録が見られるよ')}</p>
      </section>`;
  };

  async function openDay(date) {
    const s = store.getState();
    const txs = s.transactions.filter((x) => x.date === date);
    const marked = s.noSpendDays.includes(date);
    const can = canMarkNoSpend({ date, today, transactions: s.transactions });

    const list = txs.length
      ? `<ul class="day-list">${txs.map((x) => {
        const c = findCategory(x.type, x.categoryId);
        return `<li><span>${catIcon(c)} ${t(c.label)}${x.memo ? `（${esc(x.memo)}）` : ''}</span>
          <span class="${x.type}">${x.type === 'expense' ? '-' : '+'}${money(x.amount)}</span></li>`;
      }).join('')}</ul>`
      : `<p class="muted">${t('記録はありません')}</p>`;

    const status = marked
      ? `<p class="day-status">🌸 ${t('使わなかった日')}</p>`
      : '';

    const buttons = [{ label: t('とじる'), value: 'close' }];
    buttons.push({ label: t('記録をつける'), value: 'add', kind: 'plain' });
    if (marked) buttons.push({ label: t('花丸を取り消す'), value: 'unmark', kind: 'plain' });
    else if (can.ok) buttons.push({ label: `🌸 ${t('使わなかった日にする')}`, value: 'mark', kind: 'primary' });

    const v = await showModal(`<h2 class="modal-title">${dateLabel(date)}</h2>${status}${list}`, buttons);
    if (v === 'add') navigate('input', { date });
    else if (v === 'mark') {
      try { store.markNoSpend(date); toast('花丸をつけました🌸'); } catch { toast('この日は申告できません'); }
      draw();
    } else if (v === 'unmark') {
      store.unmarkNoSpend(date);
      draw();
    }
  }

  draw();
  on(root, 'click', '[data-move]', (_e, b) => { ym = addMonths(ym, Number(b.dataset.move)); draw(); });
  on(root, 'click', '.cal-cell[data-date]', (_e, b) => openDay(b.dataset.date));
}
