<script setup lang="ts">
import { battleState, currentIntent } from "../model/state";
import { resolveCard } from "@/shared/branches";
import ActorCard from "./ActorCard.vue";
defineEmits<{ play: [id: string]; end: []; settle: [] }>();
</script>
<template>
  <section class="panel battle-panel">
    <div class="section-top">
      <span class="eyebrow">02 / THE ENCOUNTER</span
      ><span>回合 {{ battleState.turn }}</span>
    </div>
    <h2>{{ battleState.enemy?.name ?? "等待下一场遭遇" }}</h2>
    <div v-if="battleState.enemy" class="arena">
      <ActorCard :actor="battleState.hero" name="余烬旅人" />
      <div class="versus">
        VS<br /><small>{{ battleState.context?.region.toUpperCase() }}</small>
      </div>
      <ActorCard
        :actor="battleState.enemy"
        :name="battleState.enemy.name"
        enemy
        :intent="currentIntent()"
      />
    </div>
    <div v-else class="empty-art">
      ✧
      <p>在路线图中选择一个哨站<br /><small>每次出牌都可能改变战局</small></p>
    </div>
    <div v-if="battleState.phase === 'playing'">
      <div class="energy-line">
        <b>◉ {{ battleState.energy }} / 3 能量</b
        ><span
          >抽牌 {{ battleState.piles.draw.length }} · 弃牌
          {{ battleState.piles.discard.length }} · 消耗
          {{ battleState.piles.exhaust.length }}</span
        ><button data-action="end-turn" @click="$emit('end')">
          结束回合 →
        </button>
      </div>
      <div class="hand">
        <button
          v-for="c in battleState.piles.hand"
          :key="c.id"
          class="playing-card"
          :data-hand-id="c.id"
          :disabled="resolveCard(c).cost > battleState.energy"
          @click="$emit('play', c.id)"
        >
          <i>{{ resolveCard(c).cost }}</i
          ><span>{{
            resolveCard(c).kind === "attack"
              ? "⚔"
              : resolveCard(c).kind === "power"
                ? "✺"
                : "◇"
          }}</span>
          <h3>{{ resolveCard(c).name }}</h3>
          <p>{{ resolveCard(c).text }}</p>
          <small>
            {{ resolveCard(c).badge || resolveCard(c).kind.toUpperCase() }}
          </small>
        </button>
      </div>
    </div>
    <div
      v-if="battleState.phase === 'won' || battleState.phase === 'lost'"
      class="notice"
    >
      <h3>
        {{
          battleState.phase === "won"
            ? "遭遇胜利 · 火种仍在"
            : "旅途结束 · 余烬熄灭"
        }}
      </h3>
      <button data-action="settle" @click="$emit('settle')">
        {{ battleState.phase === "won" ? "收取战利品 →" : "查看旅程结果" }}
      </button>
    </div>
    <details v-if="battleState.log.length" open>
      <summary>效果记录 · 最新在前</summary>
      <div class="battle-log">
        <p v-for="(line, i) in battleState.log" :key="i">{{ line }}</p>
      </div>
    </details>
  </section>
</template>
