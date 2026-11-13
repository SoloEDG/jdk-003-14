import { reactive, readonly } from "vue";
import type {
  BattleResult,
  RewardChoice,
  RewardOffer,
} from "@/shared/domain";
import { offerFrom, validChoice } from "../lib/settlement";

const state = reactive({
  offer: null as RewardOffer | null,
  history: [] as string[],
  selected: null as RewardChoice | null,
});

export const rewardState = readonly(state);

export function openReward(result: BattleResult) {
  if (!result.won || state.history.includes(result.id)) return false;
  state.offer = offerFrom(result);
  state.selected = null;
  return true;
}

export function chooseReward(choice: RewardChoice) {
  if (
    state.offer?.cards.some(
      (c) => c.key === choice.key && c.branch === choice.branch,
    )
  )
    state.selected = choice;
}

export function claimReward(skip = false) {
  if (!validChoice(state.offer, skip ? null : state.selected)) return null;
  const offer = state.offer!;
  offer.claimed = true;
  state.history.push(offer.source);
  return {
    card: skip ? null : state.selected!.key,
    branch: skip ? null : state.selected!.branch,
    gold: offer.gold,
    heal: offer.heal,
  };
}

export function exportReward() {
  return JSON.parse(
    JSON.stringify({ offer: state.offer, history: state.history }),
  );
}

export function restoreReward(d: ReturnType<typeof exportReward>) {
  state.offer = migrateOffer(d.offer);
  state.history = d.history;
  state.selected = null;
}

/** 旧存档的奖励候选是纯字符串 key，迁移为未定向候选。 */
function migrateOffer(offer: RewardOffer | null): RewardOffer | null {
  if (!offer) return null;
  offer.cards = (offer.cards ?? []).map((c: unknown) =>
    typeof c === "string"
      ? { key: c, branch: null }
      : (c as RewardChoice),
  );
  return offer;
}

export function resetReward() {
  state.offer = null;
  state.history = [];
  state.selected = null;
}
