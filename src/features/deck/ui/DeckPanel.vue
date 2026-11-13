<script setup lang="ts">
import { computed } from "vue";
import {
  deckState,
  selectCard,
  currentPreview,
  openUpgrade,
  choosePreviewBranch,
  cancelUpgrade,
  resolveCard,
  upgradeCost,
  removalCost,
  branchMeta,
} from "../model/state";
import { branchesFor, type ResolvedCard } from "@/shared/branches";
import { cards } from "@/shared/cards";

const props = defineProps<{ camp: boolean; locked: boolean }>();
const emit = defineEmits<{
  "confirm-upgrade": [id: string];
  "camp-upgrade": [id: string];
  remove: [id: string];
  camp: [action: "rest"];
}>();

const selectedCard = computed(() =>
  deckState.cards.find((c) => c.id === deckState.selected) ?? null,
);
const selectedResolved = computed<ResolvedCard | null>(() =>
  selectedCard.value ? resolveCard(selectedCard.value) : null,
);
const selectedUpgradeCost = computed(() =>
  selectedCard.value
    ? upgradeCost(selectedCard.value.level, deckState.hero.scars)
    : Infinity,
);
const canAfford = computed(() =>
  selectedUpgradeCost.value === Infinity
    ? false
    : deckState.hero.gold >= selectedUpgradeCost.value,
);

function optionsFor(key: string) {
  return branchesFor(cards[key]!).map((id) => branchMeta[id]);
}
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">05 / YOUR ARSENAL</span
      ><span>{{ deckState.cards.length }} 张</span>
    </div>
    <h2>行囊中的可能</h2>
    <p class="muted">
      同名卡可走互斥的成长方向，构筑各不相同。强化先预览费用、效果与未来升级，确认后才扣费；取消不会改动牌组。
    </p>
    <div v-if="camp" class="camp">
      <h3>篝火 · {{ deckState.campUsed ? "已经休整" : "选择一次休整" }}</h3>
      <button :disabled="deckState.campUsed" @click="emit('camp', 'rest')">
        休息 · 回复生命</button
      ><button
        :disabled="
          deckState.campUsed ||
          !selectedCard ||
          !!currentPreview() ||
          (selectedResolved?.maxed ?? true)
        "
        @click="openUpgrade(deckState.selected, true)"
      >
        免费强化选中牌（先预览）
      </button>
    </div>
    <div class="deck-list">
      <button
        v-for="c in deckState.cards"
        :key="c.id"
        :data-card-id="c.id"
        :class="{ selected: deckState.selected === c.id }"
        @click="selectCard(c.id)"
      >
        <span>
          {{ resolveCard(c).name
          }}<em v-if="resolveCard(c).badge" class="branch-tag">{{
            resolveCard(c).badge
          }}</em>
        </span>
        <small>{{ resolveCard(c).text }}</small>
        <i class="card-id">{{ c.id.slice(-6) }}</i>
      </button>
    </div>

    <!-- 强化预览：临时状态，取消不落地 -->
    <div v-if="currentPreview()" class="upgrade-preview">
      <div class="preview-head">
        <h3>强化预览 · {{ currentPreview()!.resolved.name }}</h3>
        <button class="ghost" @click="cancelUpgrade()">✕ 取消</button>
      </div>
      <p class="muted">
        目标阶层：{{ currentPreview()!.toLevel }} / 2 · 强化后费用
        <b>{{ currentPreview()!.resolved.cost }}</b>
      </p>

      <div v-if="currentPreview()!.selectable.length" class="branch-row">
        <button
          v-for="meta in optionsFor(currentPreview()!.resolved.key)"
          :key="meta.id"
          :class="{ active: currentPreview()!.branch === meta.id }"
          @click="choosePreviewBranch(meta.id)"
        >
          <b>{{ meta.name }}</b
          ><small>{{
            currentPreview()!.toLevel === 1 ? meta.tier1 : meta.tier2
          }}</small>
        </button>
      </div>
      <p v-else class="muted">
        已锁定方向「{{ currentPreview()!.resolved.branchName }}」，本次只能沿该方向深化。
      </p>

      <div class="preview-effect">
        <small>强化后效果</small>
        <p>{{ currentPreview()!.resolved.text }}</p>
        <small>未来升级</small>
        <p>{{ currentPreview()!.future }}</p>
      </div>

      <div class="toolbar">
        <button
          data-action="confirm-upgrade"
          :disabled="
            props.locked ||
            (!currentPreview()!.free && !canAfford)
          "
          @click="
            currentPreview()!.free
              ? emit('camp-upgrade', currentPreview()!.cardId)
              : emit('confirm-upgrade', currentPreview()!.cardId)
          "
        >
          {{
            currentPreview()!.free
              ? "确认 · 篝火免费强化"
              : "确认强化 · " + currentPreview()!.cost + " 金"
          }}
        </button>
      </div>
    </div>

    <div class="toolbar">
      <button
        :disabled="
          locked ||
          !selectedCard ||
          !!currentPreview() ||
          (selectedResolved?.maxed ?? true)
        "
        @click="openUpgrade(deckState.selected)"
      >
        强化 ·
        {{
          selectedUpgradeCost === Infinity
            ? "已终阶"
            : selectedUpgradeCost + " 金"
        }}
      </button>
      <button
        :disabled="locked || !deckState.selected || deckState.cards.length <= 5"
        @click="emit('remove', deckState.selected)"
      >
        移除 · {{ removalCost(deckState.removals) }} 金
      </button>
    </div>
  </section>
</template>
