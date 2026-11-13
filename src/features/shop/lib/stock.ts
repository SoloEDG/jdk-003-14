import type { BranchId, JourneyContext } from "@/shared/domain";
import { branchesFor } from "@/shared/branches";
import { cards } from "@/shared/cards";
import { shuffle, hash } from "@/shared/random";

export interface StockItem {
  id: string;
  card: string;
  /** 非空表示该商品已经选定成长方向，购得后必须保留。 */
  branch: BranchId | null;
  basePrice: number;
  sold: boolean;
}

/** 已定向商品的额外费用：方向在进店时即固定，不再向玩家重复收取选择费。 */
export const BRANCH_PREMIUM = 18;

/** 由节点与槽位确定性决定该商品是否已定向，刷新/读档保持一致。 */
function pickBranch(card: string, nodeId: string, slot: number): BranchId | null {
  const spec = cards[card];
  if (!spec) return null;
  const options = branchesFor(spec).filter((b) => b !== "value");
  if (!options.length) return null;
  const roll = hash(`${nodeId}-branch-${slot}`) % 100;
  if (roll >= 60) return null;
  return options[roll % options.length]!;
}

export function makeStock(c: JourneyContext): StockItem[] {
  return shuffle(
    ["venom", "focus", "fury", "burst", "shelter", "guard"],
    hash(c.nodeId),
  )
    .slice(0, 3)
    .map((card, i) => {
      const base = ["fury", "burst", "focus"].includes(card) ? 48 : 32;
      const branch = pickBranch(card, c.nodeId, i);
      return {
        id: `${c.nodeId}-stock-${i}`,
        card,
        branch,
        basePrice: base + (branch ? BRANCH_PREMIUM : 0),
        sold: false,
      };
    });
}
