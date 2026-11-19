// 記録：収入・支出の入力と修正
// params: type=expense|income（新規の初期値）, id=取引ID（修正）, date=YYYY-MM-DD（初期日付）
import { todayKey, addDays } from '../domain/dates.js';
import { CATEGORIES } from '../config/categories.js';
import { MAX_AMOUNT, MAX_MEMO } from '../store/store.js';
import { t } from '../ui/ruby.js';
import { esc, on, yen } from '../ui/dom.js';
import { dateLabel } from '../ui/format.js';
import { catIcon } from '../ui/categoryIcon.js';
import { createNumpad } from '../ui/numpad.js';
import { confirmDialog, toast } from '../ui/dialog.js';

export function render(root, { store, navigate, params }) {
  const editing = params.id ? store.getState().transactions.find((x) => x.id === params.id) : null;
  const today = todayKey();
  const form = editing
    ? { ...editing }
    : {
      type: params.type === 'income' ? 'income' : 'expense',
      amount: 0,
      categoryId: null,
      date: params.date && params.date <= today ? params.date : today,
      memo: '',
    };

  root.innerHTML = `
    <section class="view view-input">
      <h1 class="view-title">${editing ? t('記録を直す') : t('記録する')}</h1>

      <div class="segmented" role="tablist">
        <button type="button" class="seg seg-expense" data-type="expense">${t('使った')}（${t('支出')}）</button>
        <button type="button" class="seg seg-income" data-type="income">もらった（${t('収入')}）</button>
      </div>

      <div class="input-grid">
        <div class="input-left">
          <div class="amount-display" aria-live="polite"><span class="amount-value">0</span><span class="amount-unit">${t('円')}</span></div>
          <div class="numpad-holder"></div>
        </div>

        <div class="input-right">
          <p class="field-label">${t('何に？')}</p>
          <div class="category-grid"></div>

          <p class="field-label">${t('いつ？')}</p>
          <div class="date-row">
            <button type="button" class="chip" data-date="${today}">${t('今日')}</button>
            <button type="button" class="chip" data-date="${addDays(today, -1)}">${t('昨日')}</button>
            <button type="button" class="chip chip-date">
              <span class="date-label"></span>
              <input type="date" class="date-input" max="${today}" value="${form.date}" tabindex="-1" aria-hidden="true">
            </button>
          </div>

          <p class="field-label">メモ（なくてもいいよ）</p>
          <input type="text" class="memo-input" maxlength="${MAX_MEMO}" value="${esc(form.memo)}" placeholder="れい：ガム">

          <div class="form-buttons">
            ${editing ? `<button type="button" class="btn btn-danger" data-act="delete">${t('消す')}</button>` : ''}
            <button type="button" class="btn btn-primary btn-save" data-act="save">${t('記録する')}</button>
          </div>
        </div>
      </div>
    </section>`;

  const $ = (sel) => root.querySelector(sel);

  const numpad = createNumpad({
    value: form.amount,
    max: MAX_AMOUNT,
    onChange: (v) => { form.amount = v; $('.amount-value').textContent = yen(v); },
  });
  $('.numpad-holder').appendChild(numpad.el);
  $('.amount-value').textContent = yen(form.amount);

  function drawType() {
    root.querySelectorAll('.seg').forEach((b) => b.classList.toggle('active', b.dataset.type === form.type));
    root.querySelector('.view-input').dataset.type = form.type;
    if (!CATEGORIES[form.type].some((c) => c.id === form.categoryId)) form.categoryId = null;
    $('.category-grid').innerHTML = CATEGORIES[form.type].map((c) => `
      <button type="button" class="cat ${c.id === form.categoryId ? 'active' : ''}" data-cat="${c.id}" style="--cat-color:${c.color}">
        <span class="cat-icon">${catIcon(c)}</span><span class="cat-label">${t(c.label)}</span>
      </button>`).join('');
  }

  function drawDate() {
    root.querySelectorAll('.chip[data-date]').forEach((b) => b.classList.toggle('active', b.dataset.date === form.date));
    const isOther = ![today, addDays(today, -1)].includes(form.date);
    $('.chip-date').classList.toggle('active', isOther);
    $('.date-label').innerHTML = isOther ? dateLabel(form.date) : `📅 ${t('日付を選ぶ')}`;
  }

  drawType();
  drawDate();

  on(root, 'click', '.seg', (_e, b) => { form.type = b.dataset.type; drawType(); });
  on(root, 'click', '.cat', (_e, b) => {
    form.categoryId = b.dataset.cat;
    root.querySelectorAll('.cat').forEach((x) => x.classList.toggle('active', x === b));
  });
  on(root, 'click', '.chip[data-date]', (_e, b) => { form.date = b.dataset.date; $('.date-input').value = form.date; drawDate(); });
  // 「日付を選ぶ」：日付の選択画面をプログラムから開く。
  // （透明な入力欄を重ねる方式だと、PC の Chrome/Edge では右端のアイコン以外を押しても開かないため）
  on(root, 'click', '.chip-date', () => {
    const el = $('.date-input');
    try {
      if (typeof el.showPicker === 'function') return el.showPicker();
    } catch { /* 古いブラウザ等は下の方法で開く */ }
    el.focus();
    el.click();
  });
  $('.date-input').addEventListener('change', (e) => {
    const v = e.target.value;
    if (v && v <= today) form.date = v;
    else e.target.value = form.date;
    drawDate();
  });

  on(root, 'click', '[data-act]', async (_e, el) => {
    if (el.dataset.act === 'delete') {
      if (await confirmDialog('この記録を消す？', { ok: '消す', danger: true })) {
        store.deleteTransaction(editing.id);
        toast('消しました');
        navigate('history');
      }
      return;
    }

    // save
    form.memo = $('.memo-input').value;
    if (form.amount < 1) return toast('金額を入れてね');
    if (!form.categoryId) return toast('何に？を選んでね');

    const s = store.getState();
    if (form.type === 'expense' && s.noSpendDays.includes(form.date)) {
      const okToGo = await confirmDialog(
        'この日は「使わなかった日」になっているよ。記録すると花丸が消えるけど、いい？',
        { ok: '記録する' },
      );
      if (!okToGo) return;
    }

    const data = { type: form.type, amount: form.amount, categoryId: form.categoryId, date: form.date, memo: form.memo };
    try {
      if (editing) store.updateTransaction(editing.id, data);
      else store.addTransaction(data);
    } catch {
      return toast('記録できませんでした。入力を見直してね');
    }
    toast(editing ? '直しました' : '記録しました！');
    navigate(editing ? 'history' : 'home');
  });
}
