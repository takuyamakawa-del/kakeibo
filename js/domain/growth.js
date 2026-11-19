// キャラクター成長の判定（純粋関数）
import { STAGES, STREAK_BONUSES } from '../config/growth.js';

/**
 * 累計日数 → 段階情報
 * @returns {{ index: number, stage: object, next: object|null, daysToNext: number }}
 *   index は 0 始まり。next が null なら最終段階。
 */
export function stageInfo(total, stages = STAGES) {
  let index = 0;
  stages.forEach((s, i) => { if (total >= s.minDays) index = i; });
  const next = stages[index + 1] || null;
  return {
    index,
    stage: stages[index],
    next,
    daysToNext: next ? next.minDays - total : 0,
  };
}

/** 連続日数 → 有効なボーナス id の Set */
export function activeBonuses(streak, bonuses = STREAK_BONUSES) {
  return new Set(bonuses.filter((b) => streak >= b.minStreak).map((b) => b.id));
}
