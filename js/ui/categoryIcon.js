// カテゴリのアイコン表示。image があれば画像、なければ絵文字（icon）を出す。
import { esc } from './dom.js';

export function catIcon(category) {
  if (category.image) {
    return `<img class="cat-img" src="${esc(category.image)}" alt="">`;
  }
  return esc(category.icon);
}
