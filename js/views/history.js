// 一覧：月／年の切り替え、合計、使用目標に対する円グラフ、カテゴリ別内訳、記録（月）／月ごとの支出（年）
// params: kind=month|year, ym=YYYY-MM
import { todayKey, monthOf, addMonths } from '../domain/dates.js';
import { transactionsInMonth, monthTotals, expenseByCategory } from '../domain/money.js';
import { goalFor, usage, donutSegments, monthlyExpenses } from '../domain/budget.js';
import { CATEGORIES, findCategory } from '../config/categories.js';
import { t, r } from '../ui/ruby.js';
import { esc, on, yen } from '../ui/dom.js';
import { catIcon } from '../ui/categoryIcon.js';
import { dateLabel, monthLabel, money } from '../ui/format.js';
import { donutSVG } from '../ui/donut.js';

const ALERT = '#d63031'; // 目標オーバー（css の --danger と同じ）
const REMAIN = '#ebe4d8'; // 円グラフの「のこり」
const ORDER = CATEGORIES.expense.map((c) => c.id);
const pct = (x) => `${Math.round(x * 100)}%`;

export function render(root, { store, navigate, params }) {
  let kind = params.kind === 'year' ? 'year' : 'month';
  let ym = /^\d{4}-\d{2}$/.test(params.ym || '') ? params.ym : monthOf(todayKey());
  const periodKey = () => (kind === 'year' ? ym.slice(0, 4) : ym);
  const periodLabel = () => (kind === 'year' ? `${ym.slice(0, 4)}${r('年', 'ねん')}` : monthLabel(ym));

  // 円グラフの説明文（タップ／ホバーで更新）
  let captions = {};

  const draw = () => {
    const s = store.getState();
    const key = periodKey();
    const totals = monthTotals(s.transactions, key);
    const byCat = expenseByCategory(s.transactions, key)
      .sort((a, b) => ORDER.indexOf(a.categoryId) - ORDER.indexOf(b.categoryId));
    const goal = goalFor(kind, s.settings.monthlyGoal);
    const u = usage(totals.expense, goal);

    root.innerHTML = `
      <section class="view view-history">
        <div class="segmented period-toggle" role="tablist">
          <button type="button" class="seg ${kind === 'month' ? 'active' : ''}" data-kind="month">${r('月', 'つき')}</button>
          <button type="button" class="seg ${kind === 'year' ? 'active' : ''}" data-kind="year">${r('年', 'とし')}</button>
        </div>

        <div class="month-nav">
          <button type="button" class="btn-round" data-move="-1" aria-label="前へ">‹</button>
          <h1 class="view-title">${periodLabel()}</h1>
          <button type="button" class="btn-round" data-move="1" aria-label="次へ">›</button>
        </div>

        <div class="totals">
          <div class="total income"><span>${t('もらった')}</span><strong>+${money(totals.income)}</strong></div>
          <div class="total expense"><span>${t('使った')}</span><strong>-${money(totals.expense)}</strong></div>
          <div class="total diff"><span>${t('のこり')}</span><strong>${money(totals.income - totals.expense)}</strong></div>
        </div>

        <div class="card budget-card">
          <h2 class="card-title">${t('使ったお金と目標')}</h2>
          ${u ? budgetHTML(u, byCat) : noGoalHTML(byCat)}
        </div>

        <div class="card">
          ${kind === 'month' ? recordsHTML(s) : monthsHTML(s)}
        </div>
      </section>`;
  };

  function budgetHTML(u, byCat) {
    const { segments, remainingFraction } = donutSegments(byCat, u.goal, ORDER);
    captions = { remaining: `${t('のこり')} ${money(Math.max(0, u.remaining))}` };
    const segs = segments.map((sg) => {
      const c = findCategory('expense', sg.categoryId);
      captions[sg.categoryId] = `${catIcon(c)} ${t(c.label)} ${money(sg.amount)}（${t('目標')}の${pct(sg.amount / u.goal)}）`;
      return { id: sg.categoryId, color: c.color, fraction: sg.fraction, title: `${c.label} ${yen(sg.amount)}円` };
    });
    const svg = donutSVG({
      segments: segs,
      remainingFraction,
      remainingColor: REMAIN,
      remainingTitle: `のこり ${yen(Math.max(0, u.remaining))}円`,
      alertColor: u.over ? ALERT : null,
      label: `使用率 ${pct(u.rate)}`,
    });
    const goalLine = kind === 'year'
      ? `${t('目標')} ${money(u.goal)}（${t('毎月')} ${money(u.goal / 12)} × 12か${r('月', 'げつ')}）`
      : `${t('目標')} ${money(u.goal)}`;
    const sub = u.over
      ? `<span class="donut-over">⚠ ${t('目標オーバー')}</span>`
      : `<span class="donut-sub">あと ${money(u.remaining)}</span>`;

    return `
      <div class="budget-grid">
        <div class="donut-wrap ${u.over ? 'over' : ''}">
          ${svg}
          <div class="donut-center">
            <span class="donut-label">${t('使用率')}</span>
            <span class="donut-rate">${pct(u.rate)}</span>
            ${sub}
          </div>
        </div>
        <div class="budget-side">
          <p class="goal-line">${goalLine}</p>
          ${legendHTML(byCat, u)}
          <p class="donut-caption" aria-live="polite">${t('円グラフを押すと、くわしく見られるよ')}</p>
        </div>
      </div>`;
  }

  // 凡例＝カテゴリ別の内訳（円グラフと同じ並び・同じ色）
  function legendHTML(byCat, u) {
    if (!byCat.length) return `<p class="muted">${t('まだ使っていません')}</p>`;
    const max = Math.max(1, ...byCat.map((c) => c.amount));
    const rows = byCat.map((c) => {
      const cat = findCategory('expense', c.categoryId);
      return `<li class="bar-row" data-seg="${esc(c.categoryId)}">
        <span class="bar-label"><span class="swatch" style="background:${cat.color}"></span>${catIcon(cat)} ${t(cat.label)}</span>
        <span class="bar"><span class="bar-fill" style="width:${(c.amount / max) * 100}%;background:${cat.color}"></span></span>
        <span class="bar-value">${money(c.amount)}</span></li>`;
    }).join('');
    const remain = u && !u.over
      ? `<li class="bar-row remain" data-seg="remaining">
          <span class="bar-label"><span class="swatch" style="background:${REMAIN}"></span>${t('のこり')}</span>
          <span></span><span class="bar-value">${money(u.remaining)}</span></li>`
      : '';
    return `<ul class="bars legend">${rows}${remain}</ul>`;
  }

  function noGoalHTML(byCat) {
    return `
      <p class="goal-hint">🎯 ${t('設定で「1か月に使う目標」を決めると、円グラフで使用率が見られるよ')}
        <button type="button" class="link-btn" data-act="settings">${t('設定へ')}</button></p>
      ${legendHTML(byCat, null)}`;
  }

  function recordsHTML(s) {
    const txs = transactionsInMonth(s.transactions, ym);
    const groups = [];
    for (const x of txs) {
      if (!groups.length || groups[groups.length - 1].date !== x.date) groups.push({ date: x.date, items: [] });
      groups[groups.length - 1].items.push(x);
    }
    return `
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
        }).join('')}</ul>`).join('') : `<p class="muted">${t('この月の記録はまだありません')}</p>`}`;
  }

  function monthsHTML(s) {
    const year = ym.slice(0, 4);
    const months = monthlyExpenses(s.transactions, year);
    const goal = s.settings.monthlyGoal;
    const max = Math.max(1, goal, ...months);
    return `
      <h2 class="card-title">${r('月', 'つき')}ごとの${t('使ったお金')}</h2>
      <ul class="month-list">${months.map((v, i) => {
        const key = `${year}-${String(i + 1).padStart(2, '0')}`;
        const over = goal > 0 && v > goal;
        return `<li><button type="button" class="month-row ${over ? 'over' : ''}" data-ym="${key}">
          <span class="month-name">${i + 1}${r('月', 'がつ')}</span>
          <span class="bar"><span class="bar-fill" style="width:${(v / max) * 100}%"></span>
            ${goal > 0 ? `<span class="goal-mark" style="left:${(goal / max) * 100}%" title="目標"></span>` : ''}</span>
          <span class="bar-value">${over ? '⚠ ' : ''}${money(v)}</span>
        </button></li>`;
      }).join('')}</ul>
      ${goal > 0 ? `<p class="muted month-legend"><span class="goal-mark-sample"></span> ${t('毎月の目標')}（${money(goal)}）　⚠ ＝ ${t('目標オーバー')}</p>` : ''}`;
  }

  draw();

  on(root, 'click', '[data-kind]', (_e, b) => { kind = b.dataset.kind; draw(); });
  on(root, 'click', '[data-move]', (_e, b) => {
    ym = addMonths(ym, Number(b.dataset.move) * (kind === 'year' ? 12 : 1));
    draw();
  });
  on(root, 'click', '[data-ym]', (_e, b) => { kind = 'month'; ym = b.dataset.ym; draw(); });
  on(root, 'click', '.tx-row', (_e, b) => navigate('input', { id: b.dataset.id }));
  on(root, 'click', '[data-act="settings"]', () => navigate('settings'));

  // 円グラフ・凡例を押す（PC はマウスを乗せる）と説明を表示
  const showCaption = (_e, el) => {
    const cap = root.querySelector('.donut-caption');
    const html = captions[el.dataset.seg];
    if (!cap || !html) return;
    cap.innerHTML = html;
    root.querySelectorAll('[data-seg]').forEach((x) => x.classList.toggle('focus', x.dataset.seg === el.dataset.seg));
  };
  on(root, 'click', '[data-seg]', showCaption);
  on(root, 'pointerover', '[data-seg]', showCaption);
}
