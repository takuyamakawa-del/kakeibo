// 起動処理：store の作成、タブバー、画面の切り替え、進化のお祝い
import { createStore } from './store/store.js';
import { createLocalStorage } from './store/storage.js';
import { ROUTES, parseHash, navigate, findRoute } from './router.js';
import { totalNoSpend } from './domain/noSpend.js';
import { stageInfo } from './domain/growth.js';
import { STAGES } from './config/growth.js';
import { t } from './ui/ruby.js';
import { on } from './ui/dom.js';
import { toast, showModal } from './ui/dialog.js';
import { renderCharacter } from './ui/character.js';

const store = createStore(createLocalStorage());
const main = document.getElementById('main');
const tabbar = document.getElementById('tabbar');
let cleanup = null;

store.onError(() => toast('保存できませんでした。設定からバックアップを書き出してね', { kind: 'error' }));

// ---- タブバー ----
tabbar.innerHTML = ROUTES.filter((r) => r.tab).map((r) => `
  <button type="button" class="tab" data-route="${r.id}">
    <span class="tab-icon" aria-hidden="true">${r.icon}</span>
    <span class="tab-label">${t(r.label)}</span>
  </button>`).join('');
on(tabbar, 'click', '.tab', (_e, b) => navigate(b.dataset.route));

// ---- 画面の切り替え ----
function render() {
  const { id, params } = parseHash(location.hash);
  const route = findRoute(id);
  if (typeof cleanup === 'function') cleanup();
  // 画面ごとに新しい入れ物を作る（前の画面のイベントが残らないように）
  const container = document.createElement('div');
  container.className = 'view-container';
  main.replaceChildren(container);
  window.scrollTo(0, 0);
  tabbar.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.route === id));
  cleanup = route.view.render(container, { store, navigate, params });
}
window.addEventListener('hashchange', render);

// ---- 進化のお祝い ----
// 前回見た段階（meta.lastSeenStage）より上がっていたらお祝いを出す。
// バックアップ読み込み等で下がった場合は黙って合わせる。
async function checkEvolution(state) {
  const { index } = stageInfo(totalNoSpend(state.noSpendDays));
  const last = state.meta.lastSeenStage;
  if (index === last) return;
  store.setMeta({ lastSeenStage: index });
  if (index < last) return;
  const stage = STAGES[index];
  const body = `
    <div class="celebrate">
      <p class="celebrate-title">🎉 ${t('進化')}した！ 🎉</p>
      <div class="celebrate-chara"></div>
      <p class="celebrate-name">${t(stage.name)}</p>
      <p>${t(stage.message)}</p>
    </div>`;
  const p = showModal(body, [{ label: t('やったね！'), value: true, kind: 'primary' }], { className: 'modal-celebrate' });
  const holder = document.querySelector('.celebrate-chara');
  if (holder) renderCharacter(holder, { stageIndex: index, bonuses: new Set(['sparkle']), size: 'lg' });
  await p;
}

let lastStateRef = null;
store.subscribe((state) => {
  if (state === lastStateRef) return;
  lastStateRef = state;
  checkEvolution(state);
});

render();
checkEvolution(store.getState()); // 起動時にも段階のずれを確認

// ---- オフライン対応（Service Worker） ----
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
