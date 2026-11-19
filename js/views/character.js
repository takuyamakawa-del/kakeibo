// キャラ：成長段階・次の進化まで・連続ボーナス・成長の道のり
import { todayKey } from '../domain/dates.js';
import { totalNoSpend, currentStreak } from '../domain/noSpend.js';
import { stageInfo, activeBonuses } from '../domain/growth.js';
import { STAGES, STREAK_BONUSES, CHARACTER_NAME } from '../config/growth.js';
import { t } from '../ui/ruby.js';
import { esc } from '../ui/dom.js';
import { days } from '../ui/format.js';
import { renderCharacter } from '../ui/character.js';

export function render(root, { store }) {
  const s = store.getState();
  const total = totalNoSpend(s.noSpendDays);
  const streak = currentStreak(s.noSpendDays, todayKey());
  const info = stageInfo(total);
  const bonuses = activeBonuses(streak);
  const progress = info.next
    ? ((total - info.stage.minDays) / (info.next.minDays - info.stage.minDays)) * 100
    : 100;

  root.innerHTML = `
    <section class="view view-character">
      <div class="chara-main card">
        <div class="chara-holder"></div>
        <div class="chara-info">
          <p class="chara-title">${esc(CHARACTER_NAME)}</p>
          <p class="chara-stage">${t(info.stage.name)}</p>
          <p class="chara-message">「${t(info.stage.message)}」</p>
          <p>${t('使わなかった日')}（${t('累計')}）：<strong>${days(total)}</strong></p>
          ${info.next
            ? `<p>あと <strong class="big">${days(info.daysToNext)}</strong> で${t('進化')}するよ！</p>`
            : `<p>${t('最高の段階まで育ったよ！')}</p>`}
          <div class="progress"><div class="progress-fill" style="width:${progress}%"></div></div>
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">${t('連続')}ボーナス（${t('今')} ${days(streak)}）</h2>
        <ul class="bonus-list">
          ${STREAK_BONUSES.map((b) => `
            <li class="${bonuses.has(b.id) ? 'on' : ''}">
              <span>${bonuses.has(b.id) ? '✅' : '⬜'}</span>
              ${days(b.minStreak)}${t('連続')}で「${t(b.label)}」
            </li>`).join('')}
        </ul>
      </div>

      <div class="card">
        <h2 class="card-title">${t('成長')}の${t('道')}のり</h2>
        <ol class="roadmap">
          ${STAGES.map((st, i) => `
            <li class="${i <= info.index ? 'unlocked' : 'locked'} ${i === info.index ? 'current' : ''}">
              <div class="roadmap-img">${i <= info.index ? `<img src="${esc(st.image)}" alt="">` : '❓'}</div>
              <p class="roadmap-name">${i <= info.index ? t(st.name) : '？？？'}</p>
              <p class="roadmap-days">${days(st.minDays)}〜</p>
            </li>`).join('')}
        </ol>
      </div>
    </section>`;

  renderCharacter(root.querySelector('.chara-holder'), { stageIndex: info.index, bonuses, size: 'lg' });
}
