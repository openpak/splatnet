<script setup lang="ts">
import '~/assets/css/index.css';

const { t, locale } = useI18n();
const config = useRuntimeConfig();
const { loginDomain, hostname } = config.public;

useHead({
	title: t('meta.title'),
	meta: [
		{ name: 'description', content: t('page.lede') }
	]
});

const { data: stages, pending: stagesPending } = await useFetch<Settings>('/api/stages', { server: true });
const { data: matches, pending: matchesPending } = await useFetch<Match[]>('/api/matches', { server: true });
const { data: friends } = await useFetch<Friend[] | null>('/api/friends');

type Tab = 'regular' | 'ranked' | 'gatherings' | 'friends';
const tab = ref<Tab>('regular');
const tabs = computed<{ id: Tab; label: string }[]>(() => {
	const list: { id: Tab; label: string }[] = [
		{ id: 'regular', label: t('titles.regular') },
		{ id: 'ranked', label: t('titles.ranked') },
		{ id: 'gatherings', label: t('titles.gatherings') }
	];
	if (friends.value) {
		list.push({ id: 'friends', label: t('titles.friends') });
	}
	return list;
});

const time = (d: Date): string => d.toLocaleString(locale.value, { weekday: 'short', hour: 'numeric', minute: '2-digit' });

function span(phase: Phase): string {
	const start = new Date(phase.Date);
	const end = new Date(start.getTime() + Number(phase.Time) * 3600 * 1000);
	return `${time(start)} ${t('page.until')} ${time(end)}`;
}

function isNow(phase: Phase): boolean {
	return new Date(phase.Date).getTime() <= Date.now();
}

const hasStages = computed(() => !!stages.value?.Phases?.length);
</script>

<template>
  <div class="wrap page">
    <h1>SplatNet</h1>
    <p class="lede">
      {{ $t('page.lede') }}
    </p>

    <div
      class="tabs"
      role="tablist"
    >
      <button
        v-for="item in tabs"
        :id="`tab-${item.id}`"
        :key="item.id"
        role="tab"
        class="tab"
        :class="{ active: tab === item.id }"
        :aria-selected="tab === item.id"
        :aria-controls="`panel-${item.id}`"
        @click="tab = item.id"
      >
        {{ item.label }}
      </button>
    </div>

    <section
      v-for="mode in (['regular', 'ranked'] as const)"
      v-show="tab === mode"
      :id="`panel-${mode}`"
      :key="mode"
      role="tabpanel"
      :aria-labelledby="`tab-${mode}`"
    >
      <p
        v-if="stagesPending"
        class="empty"
      >
        {{ $t('loading') }}
      </p>
      <div
        v-else-if="!hasStages"
        class="card empty-card"
      >
        <h2>{{ $t('page.stages_none') }}</h2>
        <p>{{ $t('page.stages_hint') }}</p>
      </div>
      <div
        v-for="(phase, index) in stages?.Phases ?? []"
        :key="String(phase.Date)"
        class="phase"
      >
        <h2>
          <span
            v-if="index === 0 && isNow(phase)"
            class="badge ok"
          >{{ $t('page.now') }}</span>
          <span
            v-else-if="index <= 1"
            class="badge"
          >{{ $t('page.next') }}</span>
          {{ span(phase) }}
        </h2>
        <div class="stages">
          <Polaroid
            v-for="stage in (mode === 'regular' ? phase.RegularStages : phase.GachiStages)"
            :key="stage.MapID"
            :map-id="stage.MapID"
            :game-mode="mode === 'regular' ? phase.RegularRule : phase.GachiRule"
          />
        </div>
      </div>
    </section>

    <section
      v-show="tab === 'gatherings'"
      id="panel-gatherings"
      role="tabpanel"
      aria-labelledby="tab-gatherings"
    >
      <p
        v-if="matchesPending"
        class="empty"
      >
        {{ $t('loading') }}
      </p>
      <div
        v-else-if="!matches || matches.length === 0"
        class="card empty-card"
      >
        <h2>{{ $t('matches.none') }}</h2>
      </div>
      <div class="matches">
        <Poster
          v-for="match in matches ?? []"
          :id="match.id"
          :key="match.id"
          :game-mode="Number(match.game_mode)"
          :players="(match.participants as unknown as string[])"
          :stages="stages?.Phases"
        />
      </div>
    </section>

    <section
      v-if="friends"
      v-show="tab === 'friends'"
      id="panel-friends"
      role="tabpanel"
      aria-labelledby="tab-friends"
    >
      <ul class="roster friends">
        <li
          v-for="friend in friends"
          :key="friend.nnaInfo?.principalBasicInfo?.pid"
        >
          {{ friend.pnid?.mii?.name ?? friend.nnaInfo?.principalBasicInfo?.mii?.name }}
        </li>
      </ul>
    </section>
    <p
      v-if="loginDomain && !friends"
      class="note-line"
    >
      <a
        class="btn primary"
        :href="`${loginDomain}/account/login?redirect=${hostname}`"
      >{{ $t('sign_in') }}</a>
    </p>
    <p
      v-else-if="!friends"
      class="note-line"
    >
      {{ $t('page.signin_note') }}
    </p>
  </div>
</template>
