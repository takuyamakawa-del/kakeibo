// DOM まわりの小さなヘルパー

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** HTML エスケープ。ユーザー入力（名前・メモ）を innerHTML に入れる前に必ず通す */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
}

/** イベント委譲。root 内の selector に一致する要素で event が起きたら handler(e, matchedEl) */
export function on(root, event, selector, handler) {
  root.addEventListener(event, (e) => {
    const el = e.target.closest(selector);
    if (el && root.contains(el)) handler(e, el);
  });
}

/** 1234 → "1,234" */
export function yen(n) {
  return n.toLocaleString('ja-JP');
}

/** HTML 文字列から要素を1つ作る */
export function fromHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}
