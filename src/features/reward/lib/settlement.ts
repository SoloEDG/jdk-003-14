import type { BattleResult, RewardOffer } from "@/shared/domain";
import { rewardChoices } from "./pool";

export function offerFrom(result: BattleResult): RewardOffer {
  return {
    id: `reward-${result.id}`,
    source: result.id,
    cards: rewardChoices(result.context),
    gold: result.gold + result.context.influence.favor * 2,
    heal: result.context.region === "forest" ? 3 : 0,
    claimed: false,
  };
}

export function validChoice(
  offer: RewardOffer | null,
  choice: { key: string; branch: string | null } | null,
) {
  if (!offer || offer.claimed) return false;
  if (choice === null) return true;
  return offer.cards.some(
    (c) => c.key === choice.key && c.branch === choice.branch,
  );
}
