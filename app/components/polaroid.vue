<script setup lang="ts">
const { t } = useI18n();
const { mapId, gameMode } = defineProps<{
	mapId: number;
	gameMode: string;
}>();
</script>

<template>
  <figure class="stage sel">
    <img
      :src="`/images/stages/${mapId}.webp`"
      :alt="t(`stages.${mapId}`)"
      loading="lazy"
    >
    <figcaption>
      <strong>{{ t(`stages.${mapId}`) }}</strong>
      <span v-if="gameMode">{{ t(`modes.${gameMode}`) }}</span>
    </figcaption>
  </figure>
</template>
