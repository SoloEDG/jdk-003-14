<script setup lang="ts">
import { rewardState, chooseReward } from "../model/state";
import { resolveCard, type ResolvedCard } from "@/shared/branches";
import type { RewardChoice } from "@/shared/domain";

defineEmits<{ claim: [skip: boolean] }>();

function preview(choice: RewardChoice): ResolvedCard {
  return resolveCard({
    id: `offer-${choice.key}`,
    key: choice.key,
    level: choice.branch ? 1 : 0,
    branch: choice.branch,
  });
}

function isSelected(choice: RewardChoice) {
  const s = rewardState.selected;
  return !!s && s.key === choice.key && s.branch === choice.branch;
}
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">03 / THE SPOILS</span><span>三选一</span>
    </div>
    <h2>把胜利带进下一场</h2>
    <p class="muted">
      战斗结束后结算金币，并选择一张新牌。带方向徽记的卡牌已经选定成长路线，取得后必须保留；无徽记的同名卡仍保持原样。
    </p>
    <div v-if="rewardState.offer && !rewardState.offer.claimed">
      <div class="notice">
        ✦ {{ rewardState.offer.gold }} 金币 · 回复
        {{ rewardState.offer.heal }} 生命
      </div>
      <div class="reward-options">
        <button
          v-for="(choice, i) in rewardState.offer.cards"
          :key="choice.key + '-' + i"
          :class="{ selected: isSelected(choice) }"
          @click="chooseReward(choice)"
        >
          <b>
            {{ preview(choice).name
            }}<em
              v-if="preview(choice).badge"
              class="branch-tag"
              >{{ preview(choice).badge }}</em
            >
          </b>
          <small>{{ preview(choice).text }}</small>
          <small v-if="choice.branch" class="lock-note">
            🔒 已定向 · 取得后锁定「{{ preview(choice).branchName }}」
          </small>
          <em>{{ preview(choice).rarity }}</em>
        </button>
      </div>
      <div class="toolbar">
        <button
          :disabled="!rewardState.selected"
          data-action="claim"
          @click="$emit('claim', false)"
        >
          收下选中牌与战利品</button
        ><button data-action="skip-reward" @click="$emit('claim', true)">
          仅收取金币
        </button>
      </div>
    </div>
    <div v-else class="empty-mini">
      {{
        rewardState.offer?.claimed
          ? "战利品已收入行囊。下一段路线已开放。"
          : "战胜敌人，发现下一张关键卡牌。"
      }}
    </div>
  </section>
</template>
