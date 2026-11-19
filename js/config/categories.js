// カテゴリ定義。ここに1行足すだけでカテゴリを増やせる。
// id は保存データに残るので、一度使ったら変更しないこと（表示名・アイコンは変更OK）。
// label は ruby.js の t() でふりがなが付く（読みは config/furigana.js）。

export const CATEGORIES = {
  expense: [
    { id: 'snack',      label: 'おかし',     icon: '🍬', color: '#ff9f43' },
    { id: 'toy',        label: 'おもちゃ',   icon: '🧸', color: '#ee5a6f' },
    { id: 'book',       label: '本・まんが', icon: '📚', color: '#4b7bec' },
    { id: 'game',       label: 'ゲーム',     icon: '🎮', color: '#8854d0' },
    { id: 'stationery', label: '文房具',     icon: '✏️', color: '#20bf6b' },
    { id: 'dozle',      label: 'ドズル社グッズ', icon: '🛍️', color: '#e67e22' },
    { id: 'other_out',  label: 'その他',     icon: '💭', color: '#a5b1c2' },
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
