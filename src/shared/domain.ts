export type Region = "forest" | "forge" | "abyss";
export type NodeKind = "battle" | "elite" | "shop" | "camp" | "boss";
/**
 * 互斥成长方向：
 * value 淬炼＝全数值强化（旧加号的兼容去向）；
 * attune 轻装＝攻击牌降费；venom 淬毒＝攻击牌附带中毒；
 * bulwark 坚壁＝护盾牌更高格挡；thorns 反刺＝护盾牌被击反伤。
 */
export type BranchId =
  | "value"
  | "attune"
  | "venom"
  | "bulwark"
  | "thorns";
export interface Influence {
  heat: number;
  favor: number;
  scarcity: number;
}
export interface RouteNode {
  id: string;
  region: Region;
  depth: number;
  lane: number;
  kind: NodeKind;
  title: string;
  influence: Influence;
  next: string[];
}
export interface CardInstance {
  id: string;
  key: string;
  /** 强化阶层：0 未强化，1 已选定方向，2 终阶（不再接受付费强化）。 */
  level: number;
  /** 成长方向。level 为 0 时恒为 null；选定后互斥、不可更改。 */
  branch: BranchId | null;
  /** 兼容旧存档字段，新代码不再写入，仅用于一次性迁移。 */
  upgraded?: boolean;
}
export interface CardSpec {
  key: string;
  name: string;
  cost: number;
  kind: "attack" | "skill" | "power";
  text: string;
  rarity: "common" | "rare";
  effects: Effect[];
}
export type Effect = {
  type:
    | "damage"
    | "block"
    | "draw"
    | "poison"
    | "strength"
    | "heal"
    | "energy"
    | "thorns";
  amount: number;
  target: "hero" | "enemy";
};
export interface Actor {
  hp: number;
  maxHp: number;
  block: number;
  strength: number;
  poison: number;
  thorns: number;
}
export interface JourneyContext {
  nodeId: string;
  region: Region;
  depth: number;
  kind: NodeKind;
  influence: Influence;
}
export interface BattleResult {
  id: string;
  nodeId: string;
  won: boolean;
  hp: number;
  gold: number;
  context: JourneyContext;
}
export interface RewardOffer {
  id: string;
  source: string;
  /** 奖励候选；branch 非空表示已定向，取得后必须保留该方向。 */
  cards: RewardChoice[];
  gold: number;
  heal: number;
  claimed: boolean;
}
export interface RewardChoice {
  key: string;
  branch: BranchId | null;
}
export interface Purchase {
  id: string;
  card: string;
  branch: BranchId | null;
  price: number;
}
export interface ExpeditionSummary {
  hp: number;
  maxHp: number;
  gold: number;
  scars: number;
}
export const regionNames: Record<Region, string> = {
  forest: "苔光林地",
  forge: "熔铁边境",
  abyss: "无声深渊",
};
