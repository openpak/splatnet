<script setup lang="ts">
import '~/assets/css/index.css';

const { t, locale } = useI18n();

useHead({
	title: `${t('fest.title')} - OpenSplat`,
	meta: [{ name: 'description', content: t('fest.lede') }]
});

const route = useRoute();
const requested = computed(() => (route.query.id ? String(route.query.id) : ''));
const { data, pending } = await useFetch<SplatfestView>('/api/splatfest', {
	server: true,
	query: computed(() => (requested.value ? { id: requested.value } : {}))
});

const number = (n: number): string => n.toLocaleString(locale.value);
const when = (iso: string | null): string => (iso ? new Date(iso).toLocaleString(locale.value) : '');

const teamNames = ['fest.alpha', 'fest.bravo'] as const;
const teamClass = ['alpha', 'bravo'] as const;
</script>

<template>
  <div class="wrap page">
    <h1>{{ $t('fest.title') }}</h1>
    <p class="lede">
      {{ $t('fest.lede') }}
    </p>

    <p
      v-if="pending"
      class="empty"
    >
      {{ $t('loading') }}
    </p>

    <div
      v-else-if="!data || data.selected === null"
      class="card empty-card"
    >
      <h2>{{ $t('fest.none') }}</h2>
      <p>{{ $t('fest.none_hint') }}</p>
    </div>

    <template v-else>
      <nav
        class="fest-pick"
        :aria-label="$t('fest.pick')"
      >
        <NuxtLink
          v-for="fest in data.fests"
          :key="fest.festId"
          class="tab"
          :class="{ active: fest.festId === data.selected }"
          :to="{ path: '/splatfest', query: { id: fest.festId } }"
          :aria-current="fest.festId === data.selected ? 'page' : undefined"
        >
          {{ $t('fest.fest_n', { id: fest.festId }) }}
        </NuxtLink>
      </nav>

      <section class="fest-source">
        <h2>{{ $t('fest.judd') }}</h2>
        <p v-if="!data.juddAvailable">
          {{ $t('fest.judd_off') }}
        </p>
        <div
          v-else-if="!data.judd || data.judd.matches === 0"
          class="card empty-card"
        >
          <p>{{ $t('fest.judd_none') }}</p>
        </div>
        <template v-else>
          <p v-if="data.judd.lastUpload">
            {{ $t('fest.last') }}: {{ when(data.judd.lastUpload) }}
          </p>
          <div class="teams">
            <article
              v-for="team in data.judd.teams"
              :key="team.team"
              class="card team"
              :class="teamClass[team.team]"
            >
              <h3>
                {{ $t(teamNames[team.team] ?? 'fest.alpha') }}
                <span
                  v-if="data.judd.leader === team.team"
                  class="badge ok"
                >{{ $t('fest.leading') }}</span>
              </h3>
              <div
                class="share"
                role="img"
                :aria-label="`${$t('fest.win_share')}: ${team.winPercent}%`"
              >
                <span :style="{ width: `${team.winPercent}%` }" />
              </div>
              <dl>
                <dt>{{ $t('fest.win_share') }}</dt>
                <dd>{{ team.winPercent }}%</dd>
                <dt>{{ $t('fest.players') }}</dt>
                <dd>{{ number(team.players) }}</dd>
                <dt>{{ $t('fest.matches') }}</dt>
                <dd>{{ number(team.matches) }}</dd>
                <dt>{{ $t('fest.wins') }}</dt>
                <dd>{{ number(team.wins) }}</dd>
                <dt>{{ $t('fest.paint') }}</dt>
                <dd>{{ number(team.paint) }}</dd>
                <dt>{{ $t('fest.kills') }}</dt>
                <dd>{{ number(team.kills) }}</dd>
                <dt>{{ $t('fest.best_power') }}</dt>
                <dd>{{ number(team.bestPower) }}</dd>
              </dl>
            </article>
          </div>
        </template>
      </section>

      <section class="fest-source">
        <h2>{{ $t('fest.nex') }}</h2>
        <p>{{ $t('fest.nex_hint') }}</p>
        <div
          v-if="!data.nex || data.nex.players === 0"
          class="card empty-card"
        >
          <p>{{ $t('fest.nex_none') }}</p>
        </div>
        <div
          v-else
          class="teams"
        >
          <article
            v-for="team in [0, 1]"
            :key="team"
            class="card team"
            :class="teamClass[team]"
          >
            <h3>{{ $t(teamNames[team] ?? 'fest.alpha') }}</h3>
            <dl>
              <dt>{{ $t('fest.votes') }}</dt>
              <dd>{{ number(data.nex.votes[team] ?? 0) }}</dd>
              <dt>{{ $t('fest.wins') }}</dt>
              <dd>{{ number(data.nex.wins[team] ?? 0) }}</dd>
            </dl>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
