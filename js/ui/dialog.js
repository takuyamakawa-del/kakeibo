// モーダル・確認ダイアログ・トースト（ブラウザ標準の confirm はふりがなが付けられないので自前）
import { fromHTML, on } from './dom.js';
import { t } from './ruby.js';

/**
 * 汎用モーダル。buttons: [{ label(HTML), value, kind?: 'primary'|'danger'|'plain' }]
 * 押されたボタンの value を返す（背景タップは null）。
 * bodyHTML 内の [data-value] 要素を押しても閉じてその値を返す。
 */
export function showModal(bodyHTML, buttons = [], { className = '' } = {}) {
  return new Promise((resolve) => {
    const el = fromHTML(`
      <div class="modal-backdrop">
        <div class="modal ${className}" role="dialog" aria-modal="true">
          <div class="modal-body">${bodyHTML}</div>
          <div class="modal-buttons">
            ${buttons.map((b, i) => `<button type="button" class="btn btn-${b.kind || 'plain'}" data-index="${i}">${b.label}</button>`).join('')}
          </div>
        </div>
      </div>`);
    const close = (value) => {
      el.classList.add('closing');
      setTimeout(() => el.remove(), 150);
      resolve(value);
    };
    on(el, 'click', '[data-index]', (_e, b) => close(buttons[Number(b.dataset.index)].value));
    on(el, 'click', '.modal-body [data-value]', (_e, b) => close(b.dataset.value));
    el.addEventListener('click', (e) => { if (e.target === el) close(null); });
    document.body.appendChild(el);
  });
}

/** はい／いいえ。message はプレーン文字列（t() でふりがなが付く）か、html オプションで HTML */
export async function confirmDialog(message, { ok = 'はい', cancel = 'やめる', danger = false, html = false } = {}) {
  const body = `<p class="modal-message">${html ? message : t(message)}</p>`;
  const v = await showModal(body, [
    { label: t(cancel), value: false },
    { label: t(ok), value: true, kind: danger ? 'danger' : 'primary' },
  ]);
  return v === true;
}

let toastTimer = null;
/** 画面下に短いメッセージ */
export function toast(message, { html = false, kind = '' } = {}) {
  document.querySelector('.toast')?.remove();
  const el = fromHTML(`<div class="toast ${kind}" role="status">${html ? message : t(message)}</div>`);
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2600);
}
