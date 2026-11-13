import type { BranchId, JourneyContext, RewardChoice } from "@/shared/domain";
import { branchesFor } from "@/shared/branches";
import { cards } from "@/shared/cards";
import { shuffle, hash } from "@/shared/random";

export function rewardPool(context: JourneyContext): string[] {
  const rare =
    context.influence.heat >= 2 ||
    context.kind === "elite" ||
    context.kind === "boss";
  const pool =
    context.region === "forest"
      ? ["venom", "shelter", "guard", "focus"]
      : context.region === "forge"
        ? ["strike", "guard", "burst", "fury"]
        : ["venom", "burst", "focus", "fury"];
  return shuffle(
    rare
      ? pool
      : [...pool.filter((k) => !["burst", "fury"].includes(k)), "strike"],
    hash(context.nodeId),
  ).slice(0, 3);
}

/**
 * 由节点与槽位确定性地给奖励附上方向（可能为空）。
 * 已定向的奖励取得后必须保留该方向；未定向同名卡仍保持原样。
 */
function pickBranch(key: string, nodeId: string, slot: number): BranchId | null {
  const spec = cards[key];
  if (!spec) return null;
  const options = branchesFor(spec).filter((b) => b !== "value");
  if (!options.length) return null;
  const roll = hash(`${nodeId}-reward-${slot}`) % 100;
  if (roll >= 50) return null;
  return options[roll % options.length]!;
}

export function rewardChoices(context: JourneyContext): RewardChoice[] {
  return rewardPool(context).map((key, slot) => ({
    key,
    branch: pickBranch(key, context.nodeId, slot),
  }));
}
