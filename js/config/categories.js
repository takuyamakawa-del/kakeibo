// カテゴリ定義。ここに1行足すだけでカテゴリを増やせる。
// id は保存データに残るので、一度使ったら変更しないこと（表示名・アイコンは変更OK）。
// label は ruby.js の t() でふりがなが付く（読みは config/furigana.js）。
// color は円グラフ・横棒・一覧のアイコン背景に使う。支出の色は円グラフで隣り合っても見分けられるよう
//   検証済みの組み合わせ（2026-11-20、作業ログ参照）。変えるときは隣り合う色どうしが似ないように注意。
// icon は絵文字。image（画像のパス）を書くと、絵文字の代わりにその画像が表示される。

export const CATEGORIES = {
  expense: [
    { id: 'snack',      label: 'おかし',     icon: '🍟', image: 'assets/categories/chips.svg', color: '#eda100' },
    { id: 'toy',        label: 'おもちゃ',   icon: '🧸', color: '#e34948' },
    { id: 'book',       label: '本・まんが', icon: '📚', color: '#2a78d6' },
    { id: 'game',       label: 'ゲーム',     icon: '🎮', color: '#e87ba4' },
    { id: 'stationery', label: '文房具',     icon: '✏️', color: '#008300' },
    { id: 'dozle',      label: 'ドズル社グッズ', icon: '🛍️', color: '#6250d6' },
    { id: 'other_out',  label: 'その他',     icon: '💭', color: '#898781' },
  ],
  income: [
    { id: 'allowance',  label: 'お小遣い',   icon: '💰', color: '#f7b731' },
    { id: 'otoshidama', label: 'お年玉',     icon: '🧧', color: '#eb3b5a' },
    { id: 'help',       label: 'お手伝い',   icon: '🧹', color: '#2d98da' },
    { id: 'other_in',   label: 'その他',     icon: '🎁', color: '#a5b1c2' },
  ],
};

const UNKNOWN = { id: 'unknown', label: 'その他', icon: '❔', color: '#a5b1c2' };

/** type と id からカテゴリを探す（削除済みカテゴリでも表示が壊れないよう UNKNOWN を返す） */
export function findCategory(type, id) {
  return (CATEGORIES[type] || []).find((c) => c.id === id) || UNKNOWN;
}

export function isValidCategory(type, id) {
  return (CATEGORIES[type] || []).some((c) => c.id === id);
}
