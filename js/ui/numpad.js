// 金額入力用の大きなテンキー（iPad のソフトキーボードを出さない）
import { fromHTML, on } from './dom.js';
import { t } from './ruby.js';

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', 'back'];

/**
 * @param {{ value?: number, max: number, onChange: (v:number)=>void }} opts
 * @returns {{ el: HTMLElement, value: number, set(v:number): void }}
 */
export function createNumpad({ value = 0, max, onChange }) {
  let v = value;
  const el = fromHTML(`
    <div class="numpad">
      ${KEYS.map((k) => `<button type="button" class="numpad-key" data-key="${k}">${k === 'back' ? '⌫' : k}</button>`).join('')}
      <button type="button" class="numpad-key numpad-clear" data-key="clear">${t('全部消す')}</button>
    </div>`);

  on(el, 'click', 'button', (_e, btn) => {
    const k = btn.dataset.key;
    if (k === 'clear') v = 0;
    else if (k === 'back') v = Math.floor(v / 10);
    else {
      const next = Number(String(v === 0 ? '' : v) + k) || 0;
      if (next <= max) v = next;
    }
    onChange(v);
  });

  return {
    el,
    get value() { return v; },
    set(n) { v = n; onChange(v); },
  };
}
