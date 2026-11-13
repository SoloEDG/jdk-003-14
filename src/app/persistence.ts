import { exportRoute, restoreRoute } from "@/features/route";
import { exportBattle, restoreBattle } from "@/features/battle";
import { exportDeck, restoreDeck } from "@/features/deck";
import { exportReward, restoreReward } from "@/features/reward";
import { exportShop, restoreShop } from "@/features/shop";
import { exportSession, restoreSession } from "./session";
const KEY = "ember-path-v1";
function snapshot() {
  return {
    version: 1,
    route: exportRoute(),
    battle: exportBattle(),
    deck: exportDeck(),
    reward: exportReward(),
    shop: exportShop(),
    session: exportSession(),
  };
}
export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot()));
    return true;
  } catch {
    return false;
  }
}
export function load() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return false;
  try {
    const d = JSON.parse(raw);
    // 兼容旧版（v1，单一加号强化）：结构校验通过后由各 restore 内部迁移，
    // 旧加号统一、确定性地转为「淬炼」一阶，不随机分支、不重复收费。
    if (
      d.version !== 1 ||
      !Array.isArray(d.deck?.cards) ||
      !Array.isArray(d.route?.visited) ||
      !d.battle?.piles ||
      !d.reward?.history ||
      !Array.isArray(d.shop?.stock) ||
      !d.session
    )
      return false;
    const old = snapshot();
    try {
      restoreRoute(d.route);
      restoreBattle(d.battle);
      restoreDeck(d.deck);
      restoreReward(d.reward);
      restoreShop(d.shop);
      restoreSession(d.session);
    } catch {
      restoreRoute(old.route);
      restoreBattle(old.battle);
      restoreDeck(old.deck);
      restoreReward(old.reward);
      restoreShop(old.shop);
      restoreSession(old.session);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
export function clearSave() {
  localStorage.removeItem(KEY);
}
