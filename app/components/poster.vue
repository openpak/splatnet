<script setup lang="ts">
const { id, gameMode, players, stages = [] } = defineProps<{
	id: string;
	gameMode: number;
	players: string[];
	stages?: Phase[];
}>();

const RANKED = 1;
const SQUAD = 4;
const SLOTS = 8;

function isRanked(): boolean {
	return gameMode === RANKED || gameMode === SQUAD;
}

function getMaps(): string[] {
	const phase = stages?.[0];
	const maps: Stage[] | undefined = isRanked() ? phase?.GachiStages : phase?.RegularStages;
	return (maps ?? []).map(map => map.MapID.toString());
}

function getGameType(): string {
	switch (gameMode) {
		case 0:
			return 'cPnt';
		case 1:
			return 'cVgl';
		case 2:
			return 'cVar';
		case 3:
			return 'cVlf';
		default:
			return 'cNone';
	}
}
</script>

<template>
  <article class="card match sel">
    <div
      v-if="getMaps().length"
      class="art"
    >
      <img
        v-for="map in getMaps()"
        :key="map"
        :src="`/images/stages/${map}.webp`"
        :alt="$t(`stages.${map}`)"
        loading="lazy"
      >
    </div>
    <div class="body">
      <h3>{{ $t('matches.gathering') }} #{{ id }}</h3>
      <p class="meta">
        <span
          v-if="getGameType() !== 'cNone'"
          class="badge"
        >{{ $t(`modes.${getGameType()}`) }}</span>
        <span class="badge">{{ players.length }} / {{ SLOTS }} {{ $t('page.players') }}</span>
      </p>
      <ul class="roster">
        <li
          v-for="name in players"
          :key="name"
        >
          {{ name }}
        </li>
      </ul>
    </div>
  </article>
</template>
