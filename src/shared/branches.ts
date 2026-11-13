import type {
  BranchId,
  CardInstance,
  CardSpec,
  Effect,
} from "./domain";
import { cards } from "./cards";
import { uid } from "./random";

export const MAX_LEVEL = 2;

export interface BranchMeta {
  id: BranchId;
  name: string;
  /** 该方向适用的卡牌类别描述。 */
  scope: string;
  /** 一阶预览说明。 */
  tier1: string;
  /** 终阶预览说明。 */
  tier2: string;
}

export const branchMeta: Record<BranchId, BranchMeta> = {
  value: {
    id: "value",
    name: "淬炼",
    scope: "全部卡牌",
    tier1: "所有非能量数值 +2（旧强化路线）。",
    tier2: "所有非能量数值再 +2（累计 +4）。",
  },
  attune: {
    id: "attune",
    name: "轻装",
    scope: "攻击牌",
    tier1: "费用 −1（最低为 0）。",
    tier2: "费用保持 −1，所有非能量数值 +2。",
  },
  venom: {
    id: "venom",
    name: "淬毒",
    scope: "攻击牌",
    tier1: "额外施加 3 中毒（已有中毒则 +3）。",
    tier2: "额外施加 6 中毒（已有中毒则 +6）。",
  },
  bulwark: {
    id: "bulwark",
    name: "坚壁",
    scope: "护盾牌",
    tier1: "格挡 +4。",
    tier2: "格挡 +8。",
  },
  thorns: {
    id: "thorns",
    name: "反刺",
    scope: "护盾牌",
    tier1: "获得 3 荆棘，本回合受击时反伤敌人。",
    tier2: "获得 6 荆棘，本回合受击时反伤敌人。",
  },
};

/** 某张卡牌规格可选的互斥方向。 */
export function branchesFor(spec: CardSpec): BranchId[] {
  const result: BranchId[] = ["value"];
  if (spec.kind === "attack") result.push("attune", "venom");
  if (spec.effects.some((e) => e.type === "block"))
    result.push("bulwark", "thorns");
  return result;
}

export function branchAllowed(key: string, branch: BranchId): boolean {
  const spec = cards[key];
  return !!spec && branchesFor(spec).includes(branch);
}

export interface ResolvedCard {
  key: string;
  name: string;
  cost: number;
  kind: CardSpec["kind"];
  rarity: CardSpec["rarity"];
  text: string;
  effects: Effect[];
  level: number;
  branch: BranchId | null;
  branchName: string | null;
  /** 卡面阶层徽记，如「轻装 · 终阶」。 */
  badge: string;
  /** 是否到达终阶（不再接受付费强化）。 */
  maxed: boolean;
}

const effectNames: Record<Effect["type"], string> = {
  damage: "伤害",
  block: "格挡",
  draw: "抽牌",
  poison: "中毒",
  strength: "力量",
  heal: "回复",
  energy: "能量",
  thorns: "荆棘",
};

export function effectText(e: Effect): string {
  const action =
    e.type === "draw"
      ? "抽"
      : e.type === "damage"
        ? "造成"
        : e.type === "heal"
          ? "回复"
          : "获得";
  return `${action} ${e.amount} ${effectNames[e.type]}`;
}

/**
 * 依据卡牌实例的实际方向与阶层结算费用与效果。
 * 战斗队列、手牌可用性、所有卡面说明都从这里取数，
 * 保证保存恢复后的卡面说明与真实结算完全一致。
 */
export function resolveCard(instance: CardInstance): ResolvedCard {
  const spec = cards[instance.key];
  const level = Math.max(0, Math.min(MAX_LEVEL, instance.level || 0));
  const branch = level > 0 ? instance.branch : null;
  const cost =
    branch === "attune" ? Math.max(0, spec.cost - 1) : spec.cost;
  const effects: Effect[] = spec.effects.map((e) => ({ ...e }));
  const bump = (type: Effect["type"], delta: number) => {
    for (const e of effects) if (e.type === type) e.amount += delta;
  };
  if (level > 0) {
    if (branch === "value") {
      for (const e of effects) if (e.type !== "energy") e.amount += 2 * level;
    } else if (branch === "attune" && level === 2) {
      for (const e of effects) if (e.type !== "energy") e.amount += 2;
    } else if (branch === "venom") {
      const add = level === 2 ? 6 : 3;
      const existing = effects.find((e) => e.type === "poison");
      if (existing) existing.amount += add;
      else effects.push({ type: "poison", amount: add, target: "enemy" });
    } else if (branch === "bulwark") {
      bump("block", level === 2 ? 8 : 4);
    } else if (branch === "thorns") {
      effects.push({
        type: "thorns",
        amount: level === 2 ? 6 : 3,
        target: "hero",
      });
    }
  }
  const text = effects.map(effectText).join("，") + "。";
  const meta = branch ? branchMeta[branch] : null;
  const badge = meta
    ? `${meta.name} · ${level === MAX_LEVEL ? "终阶" : "一阶"}`
    : "";
  return {
    key: instance.key,
    name: spec.name,
    cost,
    kind: spec.kind,
    rarity: spec.rarity,
    text,
    effects,
    level,
    branch,
    branchName: meta?.name ?? null,
    badge,
    maxed: level >= MAX_LEVEL,
  };
}

export interface UpgradePreview {
  cardId: string;
  /** 本次强化后到达的阶层（1 或 2）。 */
  toLevel: number;
  /** 一阶时待玩家选择；二阶时沿用既有方向。 */
  selectable: BranchId[];
  branch: BranchId | null;
  /** 选择该方向并强化后的结算结果（含费用与效果）。 */
  resolved: ResolvedCard;
  /** 本次强化对未来升级的影响说明。 */
  future: string;
  free: boolean;
  cost: number;
  maxed: boolean;
}

/** 生成强化预览；纯函数，不改动任何状态。 */
export function previewUpgrade(
  instance: CardInstance,
  branch: BranchId | null,
  free: boolean,
  cost: number,
): UpgradePreview | null {
  const spec = cards[instance.key];
  if (!spec) return null;
  const level = Math.max(0, Math.min(MAX_LEVEL, instance.level || 0));
  if (level >= MAX_LEVEL) return null;
  const toLevel = level + 1;
  const selectable = level === 0 ? branchesFor(spec) : [];
  const chosen: BranchId | null =
    level === 0 ? branch : instance.branch;
  if (!chosen || !branchAllowed(instance.key, chosen)) return null;
  const resolved = resolveCard({
    ...instance,
    level: toLevel,
    branch: chosen,
  });
  const future =
    toLevel >= MAX_LEVEL
      ? "已到达终阶，此后不再接受付费强化。"
      : `下次强化将沿用「${branchMeta[chosen].name}」方向并抵达终阶。`;
  return {
    cardId: instance.id,
    toLevel,
    selectable,
    branch: chosen,
    resolved,
    future,
    free,
    cost,
    maxed: toLevel >= MAX_LEVEL,
  };
}

/** 新建一张未强化、未定向的同名卡。 */
export function createCard(key: string): CardInstance {
  return { id: uid("card"), key, level: 0, branch: null };
}

/** 新建一张已定向的卡（商店/奖励产出），取得后方向锁定。 */
export function createBranchedCard(
  key: string,
  branch: BranchId | null,
): CardInstance {
  if (!branch || !branchAllowed(key, branch)) return createCard(key);
  return { id: uid("card"), key, level: 1, branch };
}

/**
 * 规范化卡牌实例：
 * 旧存档的 upgraded:true 统一、确定性地迁移为 value 一阶，
 * 不随机分支、不额外收费；非法方向回退到 value。
 */
export function normalizeCard(raw: unknown): CardInstance {
  const d = (raw ?? {}) as Record<string, unknown>;
  const key = String(d.key ?? "strike");
  const id = typeof d.id === "string" ? d.id : uid("card");
  const legacy = d.upgraded === true;
  let level = Number(d.level);
  if (!Number.isFinite(level)) level = legacy ? 1 : 0;
  level = Math.max(0, Math.min(MAX_LEVEL, Math.trunc(level)));
  let branch = (d.branch as BranchId | null) ?? null;
  if (level > 0 && (!branch || !branchAllowed(key, branch))) {
    branch = "value";
  }
  if (level === 0) branch = null;
  return { id, key, level, branch };
}
