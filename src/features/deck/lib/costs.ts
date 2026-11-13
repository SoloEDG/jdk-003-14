import { MAX_LEVEL } from "@/shared/branches";

/**
 * 强化费用按目标阶层递增；到达终阶（level 2）后返回 Infinity，
 * 调用方据此禁用强化入口，终阶不再接受付费强化。
 */
export function upgradeCost(level: number, scars: number) {
  if (level >= MAX_LEVEL) return Infinity;
  return (level === 0 ? 25 : 40) + scars * 5;
}

export function removalCost(count: number) {
  return 30 + count * 10;
}

export function campHealing(maxHp: number, heat: number) {
  return Math.max(5, Math.floor(maxHp * 0.3) - heat);
}
