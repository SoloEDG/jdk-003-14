<script setup lang="ts">
import { shopState, itemPrice } from "../model/state";
import { quoteMessage } from "../lib/pricing";
import { resolveCard, type ResolvedCard } from "@/shared/branches";
import type { StockItem } from "../lib/stock";

defineProps<{ gold: number }>();
defineEmits<{ buy: [id: string]; leave: [] }>();

/** 用库存的方向临时结算卡面；未定向商品按基础卡展示。 */
function preview(item: StockItem): ResolvedCard {
  return resolveCard({
    id: item.id,
    key: item.card,
    level: item.branch ? 1 : 0,
    branch: item.branch,
  });
}
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">04 / THE TRADER</span><span>旅途补给</span>
    </div>
    <h2>路上的旧相识</h2>
    <template v-if="shopState.open"
      ><p class="muted">
        {{
          quoteMessage(
            shopState.context!.influence.favor,
            shopState.context!.influence.scarcity,
          )
        }}
        带方向徽记的商品已经选定成长路线，购得后必须保留该方向。
      </p>
      <div class="stock">
        <div v-for="item in shopState.stock" :key="item.id">
          <div>
            <b>
              {{ preview(item).name
              }}<em v-if="preview(item).badge" class="branch-tag">{{
                preview(item).badge
              }}</em>
            </b>
            <small>{{ preview(item).text }}</small>
            <small v-if="item.branch" class="lock-note">
              🔒 已定向 · 取得后锁定「{{ preview(item).branchName }}」
            </small>
          </div>
          <button
            :disabled="item.sold || gold < itemPrice(item.id)"
            :data-stock="item.id"
            @click="$emit('buy', item.id)"
          >
            {{ item.sold ? "已售出" : itemPrice(item.id) + " 金 · 购买" }}
          </button>
        </div>
      </div>
      <button data-action="leave-shop" @click="$emit('leave')">
        收好行囊，继续前进 →
      </button></template
    >
    <div v-else class="empty-mini">
      寻找路线上的天平标记。安路的好感让金币走得更远。
    </div>
  </section>
</template>
