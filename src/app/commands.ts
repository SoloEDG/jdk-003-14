import { enterRoute, resolveRoute, resetRoute } from "@/features/route";
import {
  battleState,
  beginBattle,
  playCard,
  endTurn,
  resetBattle,
} from "@/features/battle";
import {
  deckState,
  deckCards,
  addCard,
  earnGold,
  spendGold,
  setHp,
  heal,
  confirmUpgrade,
  removeCard,
  openCamp,
  useCamp,
  useCampUpgrade,
  resetDeck,
} from "@/features/deck";
import { openReward, claimReward, resetReward } from "@/features/reward";
import {
  openShop,
  preparePurchase,
  completePurchase,
  closeShop,
  resetShop,
} from "@/features/shop";
import {
  session,
  switchTab,
  setContext,
  notify,
  finishRun,
  resetSession,
} from "./session";
import { save, clearSave } from "./persistence";
function persist() {
  if (!save()) notify("本地保存失败，请保留当前页面。");
}
export function navigate(id: string) {
  if (session.ended) return;
  const c = enterRoute(id);
  if (!c) return;
  setContext(c);
  if (c.kind === "shop") {
    openShop(c);
    switchTab("shop");
  } else if (c.kind === "camp") {
    openCamp();
    switchTab("deck");
  } else {
    beginBattle(c, deckCards(), deckState.hero.hp, deckState.hero.maxHp);
    switchTab("battle");
  }
  notify(
    `进入 ${c.nodeId} · 威胁 ${c.influence.heat} / 好感 ${c.influence.favor}`,
  );
  persist();
}
export function play(id: string) {
  playCard(id);
  persist();
}
export function turn() {
  endTurn();
  persist();
}
export function settle() {
  const r = battleState.result;
  if (!r) return;
  if (!r.won) {
    setHp(r.hp);
    finishRun();
    notify("这次旅途已经结束。重新启程可保留你的经验。");
    persist();
    return;
  }
  if (openReward(JSON.parse(JSON.stringify(r)))) {
    setHp(r.hp);
    switchTab("reward");
    notify("胜利！选择一张牌或跳过卡牌，金币都会结算。");
  }
  persist();
}
export function claim(skip: boolean) {
  const grant = claimReward(skip);
  if (!grant) return;
  if (grant.card) addCard(grant.card, grant.branch);
  earnGold(grant.gold);
  heal(grant.heal);
  resolveRoute();
  if (session.context?.kind === "boss") {
    finishRun();
    notify("裂隙已被封存。你把余烬带回了黎明。");
  } else notify("奖励已结算，新的路线开放。");
  switchTab("route");
  persist();
}
export function buy(id: string) {
  const p = preparePurchase(id);
  if (!p || !spendGold(p.price)) {
    notify("无法购买：库存或金币不足。");
    return;
  }
  if (!completePurchase(p)) {
    earnGold(p.price);
    return;
  }
  addCard(p.card, p.branch);
  notify(
    p.branch
      ? `交易完成，已定向卡牌已收入牌组，方向将被保留。`
      : "交易完成，卡牌已收入牌组。",
  );
  persist();
}
export function leaveShop() {
  closeShop();
  resolveRoute();
  switchTab("route");
  persist();
}
export function camp(action: "rest") {
  if (
    !session.context ||
    session.context.kind !== "camp" ||
    !useCamp(action, session.context.influence.heat)
  )
    return;
  resolveRoute();
  notify("篝火逐渐熄灭，你准备好继续上路。");
  persist();
}
/** 篝火免费强化：先在面板预览，确认时走这里，不扣金币。 */
export function campUpgrade(id: string) {
  if (
    !session.context ||
    session.context.kind !== "camp" ||
    !useCampUpgrade(id)
  ) {
    notify("无法强化：篝火已使用或卡牌已到终阶。");
    return;
  }
  resolveRoute();
  notify("篝火强化完成，方向已写入这张牌。");
  persist();
}
/** 付费强化确认：复核通过才扣金币并写入方向。 */
export function confirmPaidUpgrade(id: string) {
  if (battleState.phase === "playing") return;
  notify(
    confirmUpgrade(id, false)
      ? "卡牌强化完成，方向已锁定。"
      : "无法强化：金币不足、已到终阶或预览失效。",
  );
  persist();
}
export function remove(id: string) {
  if (battleState.phase === "playing") return;
  notify(
    removeCard(id)
      ? "已移除卡牌。"
      : "无法移除：至少保留五张牌，且需要足够金币。",
  );
  persist();
}
export function restart() {
  resetRoute();
  resetBattle();
  resetDeck();
  resetReward();
  resetShop();
  resetSession();
  clearSave();
  persist();
}
