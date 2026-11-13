import { reactive, readonly } from "vue";
import {
  starter,
  createCard,
  createBranchedCard,
  canRemove,
} from "../lib/collection";
import {
  removalCost,
  campHealing,
  upgradeCost,
} from "../lib/costs";
import type {
  BranchId,
  CardInstance,
  ExpeditionSummary,
} from "@/shared/domain";
import {
  MAX_LEVEL,
  branchAllowed,
  branchMeta,
  normalizeCard,
  previewUpgrade,
  resolveCard,
  type UpgradePreview,
} from "@/shared/branches";

interface PreviewState {
  cardId: string;
  branch: BranchId | null;
  free: boolean;
}

const state = reactive({
  cards: starter(),
  hero: { hp: 72, maxHp: 72, gold: 80, scars: 0 } as ExpeditionSummary,
  removals: 0,
  campUsed: false,
  selected: "",
  /** 强化预览是临时状态：取消即清空，绝不写入永久牌组。 */
  preview: null as PreviewState | null,
});

export const deckState = readonly(state);

export function deckCards(): CardInstance[] {
  return state.cards.map((c) => ({ ...c }));
}

/** 取得一张卡；branch 非空表示来源（商店/奖励）已定向，方向锁定。 */
export function addCard(key: string, branch: BranchId | null = null) {
  state.cards.push(
    branch ? createBranchedCard(key, branch) : createCard(key),
  );
}

export function spendGold(amount: number) {
  if (!Number.isFinite(amount) || amount < 0 || amount > state.hero.gold)
    return false;
  state.hero.gold -= amount;
  return true;
}

export function earnGold(amount: number) {
  state.hero.gold += Math.max(0, amount);
}

export function setHp(hp: number) {
  state.hero.hp = Math.min(state.hero.maxHp, Math.max(0, hp));
}

export function heal(amount: number) {
  setHp(state.hero.hp + amount);
}

export function selectCard(id: string) {
  state.selected = id;
  if (state.preview?.cardId !== id) state.preview = null;
}

function findCard(id: string) {
  return state.cards.find((c) => c.id === id);
}

/** 当前预览（实时按所选方向结算费用、效果与未来升级）；未打开为 null。 */
export function currentPreview(): UpgradePreview | null {
  const p = state.preview;
  const card = p ? findCard(p.cardId) : undefined;
  if (!p || !card || card.level >= MAX_LEVEL) return null;
  const cost = upgradeCost(card.level, state.hero.scars);
  const branch = card.level === 0 ? p.branch : card.branch;
  return previewUpgrade(card, branch, p.free, p.free ? 0 : cost);
}

/** 打开强化预览；终阶牌不可再强化。 */
export function openUpgrade(id: string, free = false) {
  const card = findCard(id);
  if (!card || card.level >= MAX_LEVEL) return false;
  state.selected = id;
  state.preview = {
    cardId: id,
    branch: card.level === 0 ? "value" : card.branch,
    free,
  };
  return true;
}

/** 在预览中切换互斥方向；不触碰永久牌组。 */
export function choosePreviewBranch(branch: BranchId) {
  const p = state.preview;
  const card = p ? findCard(p.cardId) : undefined;
  if (!p || !card || card.level > 0) return;
  if (branchAllowed(card.key, branch)) p.branch = branch;
}

/** 取消预览：仅清空临时状态，永久牌组保持原样。 */
export function cancelUpgrade() {
  state.preview = null;
}

/**
 * 确认强化：先复核预览与扣费，再写入方向/阶层。
 * 已定向的卡只能沿同一方向深化，终阶一律拒绝。
 */
export function confirmUpgrade(id: string, free = false): boolean {
  const card = findCard(id);
  if (!card || card.level >= MAX_LEVEL) return false;
  const preview = currentPreview();
  if (!preview || preview.cardId !== id) return false;
  if (card.level > 0 && preview.branch !== card.branch) return false;
  if (!free && !spendGold(preview.cost)) return false;
  card.level = preview.toLevel;
  card.branch = preview.branch;
  state.preview = null;
  return true;
}

export function removeCard(id: string) {
  if (
    !canRemove(state.cards.length) ||
    !state.cards.some((c) => c.id === id) ||
    !spendGold(removalCost(state.removals))
  )
    return false;
  state.cards = state.cards.filter((c) => c.id !== id);
  state.removals++;
  state.selected = "";
  state.preview = null;
  return true;
}

export function openCamp() {
  state.campUsed = false;
}

export function useCamp(action: "rest", heat: number) {
  if (state.campUsed) return false;
  heal(campHealing(state.hero.maxHp, heat));
  state.campUsed = true;
  state.preview = null;
  return true;
}

/** 篝火免费强化：复用同一套预览与方向规则，但不扣费。 */
export function useCampUpgrade(id: string) {
  if (state.campUsed) return false;
  if (!confirmUpgrade(id, true)) return false;
  state.campUsed = true;
  return true;
}

export {
  branchMeta,
  resolveCard,
  upgradeCost,
  removalCost,
  MAX_LEVEL,
};

export function exportDeck() {
  return JSON.parse(
    JSON.stringify({
      cards: state.cards,
      hero: state.hero,
      removals: state.removals,
      campUsed: state.campUsed,
    }),
  );
}

export function restoreDeck(d: ReturnType<typeof exportDeck>) {
  state.cards = (d.cards ?? []).map(normalizeCard);
  state.hero = d.hero;
  state.removals = d.removals;
  state.campUsed = d.campUsed;
  state.selected = "";
  state.preview = null;
}

export function resetDeck() {
  state.cards = starter();
  state.hero = { hp: 72, maxHp: 72, gold: 80, scars: 0 };
  state.removals = 0;
  state.campUsed = false;
  state.selected = "";
  state.preview = null;
}
