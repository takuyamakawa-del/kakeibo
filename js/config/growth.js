// キャラクター成長の定義。
// minDays: 「使わなかった日」の累計がこの日数以上でこの段階になる（小さい順に並べる）。
// image:   assets/characters/ の画像。SVG なら表情切り替え（class="face-normal" / "face-smile"）が効く。
//          PNG 等に差し替えても動く（表情切り替えだけ効かなくなる）。

export const CHARACTER_NAME = 'ポッケ';

export const STAGES = [
  { minDays: 0,  name: 'たまご',         image: 'assets/characters/stage1.svg', message: 'あたたかく見守ってね' },
  { minDays: 3,  name: 'ひびわれたまご', image: 'assets/characters/stage2.svg', message: 'なにか動いているよ…！' },
  { minDays: 7,  name: 'あかちゃん',     image: 'assets/characters/stage3.svg', message: 'うまれたよ！よろしくね' },
  { minDays: 15, name: 'こども',         image: 'assets/characters/stage4.svg', message: '元気いっぱい！' },
  { minDays: 30, name: 'おとな',         image: 'assets/characters/stage5.svg', message: 'りっぱに育ったね' },
  { minDays: 60, name: 'キング',         image: 'assets/characters/stage6.svg', message: 'お金の王様だ！' },
];

// 連続ボーナス。minStreak 日以上続いていると有効になる。
// id は ui/character.js が見た目の切り替えに使う（smile=笑顔, sparkle=キラキラ）。
export const STREAK_BONUSES = [
  { id: 'smile',   minStreak: 3, label: 'にこにこ' },
  { id: 'sparkle', minStreak: 7, label: 'キラキラ' },
];
