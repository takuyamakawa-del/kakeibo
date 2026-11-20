// ホーム：残高・キャラ・「今日は使わなかった！」ボタン
import { todayKey, monthOf } from '../domain/dates.js';
import { balance, hasExpenseOn, monthTotals } from '../domain/money.js';
import { usage } from '../domain/budget.js';
import { totalNoSpend, currentStreak } from '../domain/noSpend.js';
import { stageInfo, activeBonuses } from '../domain/growth.js';
import { CHARACTER_NAME } from '../config/growth.js';
import { t } from '../ui/ruby.js';
import { esc, on } from '../ui/dom.js';
import { money, days, dateLabel } from '../ui/format.js';
import { renderCharacter } from '../ui/character.js';
import { confirmDialog, toast } from '../ui/dialog.js';

/** 今月の目標に対する「あといくら」（目標があるときだけ） */
function budgetLine(s, today) {
  const u = usage(monthTotals(s.transactions, monthOf(today)).expense, s.settings.monthlyGoal);
  if (!u) return '';
  return u.over
    ? `<p class="budget-line over">⚠ ${t('今月は目標を')}${money(-u.remaining)}オーバー</p>`
    : `<p class="budget-line">${t('今月')}あと <strong>${money(u.remaining)}</strong> つかえるよ</p>`;
}

export function render(root, { store, navigate }) {
  const draw = () => {
    const s = store.getState();
    const today = todayKey();
    const total = totalNoSpend(s.noSpendDays);
    const streak = currentStreak(s.noSpendDays, today);
    const info = stageInfo(total);
    const marked = s.noSpendDays.includes(today);
    const spent = hasExpenseOn(s.transactions, today);
    const name = s.settings.childName;

    let action;
    if (marked) {
      action = `
        <div class="nospend-done">
          <span class="stamp-big">🌸</span>
          <p>${t('今日は使わなかった日！')}</p>
          <button type="button" class="link-btn" data-act="unmark">${t('取り消す')}</button>
        </div>`;
    } else if (spent) {
      action = `<div class="nospend-spent">${t('今日はお金を使ったよ。また明日がんばろう！')}</div>`;
    } else {
      action = `<button type="button" class="btn-nospend" data-act="mark">🌟 ${t('今日は使わなかった！')}</button>`;
    }

    root.innerHTML = `
      <section class="view view-home">
        <header class="home-header">
          <p class="greeting">${name ? `${esc(name)}さん、` : ''}こんにちは！</p>
          <p class="today">${dateLabel(today)}</p>
        </header>

        <div class="home-grid">
          <div class="card balance-card">
            <p class="card-label">${t('今のお金')}</p>
            <p class="balance">${money(balance(s.transactions))}</p>
            ${budgetLine(s, today)}
            <div class="quick-buttons">
              <button type="button" class="btn btn-expense" data-act="expense">${t('使った')}</button>
              <button type="button" class="btn btn-income" data-act="income">もらった</button>
            </div>
          </div>

          <button type="button" class="card chara-card" data-act="chara">
            <div class="chara-holder"></div>
            <p class="chara-name">${esc(CHARACTER_NAME)}（${t(info.stage.name)}）</p>
            <p class="chara-next">${info.next ? `${t('次の進化まで')} あと${days(info.daysToNext)}` : t('最高の段階！')}</p>
            <div class="stats">
              <div class="stat"><span class="stat-label">${t('連続')}</span><span class="stat-value">${days(streak)}</span></div>
              <div class="stat"><span class="stat-label">${t('累計')}</span><span class="stat-value">${days(total)}</span></div>
            </div>
          </button>
        </div>

        <div class="card action-card">${action}</div>

        ${name ? '' : `<p class="hint"><button type="button" class="link-btn" data-act="settings">${t('設定で名前を入れてね')}</button></p>`}
      </section>`;

    renderCharacter(root.querySelector('.chara-holder'), {
      stageIndex: info.index, bonuses: activeBonuses(streak), size: 'md',
    });
  };

  draw();

  on(root, 'click', '[data-act]', async (_e, el) => {
    const today = todayKey();
    switch (el.dataset.act) {
      case 'mark':
        try {
          store.markNoSpend(today);
          toast('すごい！花丸ゲット🌸');
        } catch { toast('今日は申告できません'); }
        draw();
        break;
      case 'unmark':
        if (await confirmDialog('今日の花丸を取り消す？')) { store.unmarkNoSpend(today); draw(); }
        break;
      case 'expense': navigate('input', { type: 'expense' }); break;
      case 'income': navigate('input', { type: 'income' }); break;
      case 'chara': navigate('character'); break;
      case 'settings': navigate('settings'); break;
    }
  });
}
