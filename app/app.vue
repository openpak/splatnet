<script setup lang="ts">
useHead({
	htmlAttrs: { lang: 'en' },
	link: [
		{ rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
		{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
		{ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
		{ rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' },
		{ rel: 'icon', type: 'image/png', sizes: '512x512', href: '/icon-512.png' }
	],
	meta: [
		{ name: 'color-scheme', content: 'light dark' },
		{ name: 'theme-color', content: '#e9ecf0', media: '(prefers-color-scheme: light)' },
		{ name: 'theme-color', content: '#24272d', media: '(prefers-color-scheme: dark)' }
	]
});

const site = 'https://openpak.org';
const route = useRoute();
const { data: session } = await useSession();
const initial = computed(() => (session.value?.name || '?').trim().charAt(0).toUpperCase() || '?');
</script>

<template>
  <a
    class="skip"
    href="#main"
  >{{ $t('nav.skip') }}</a>
  <header class="top">
    <div class="wrap">
      <a
        href="/"
        class="brand"
      ><img
        src="/opensplat.svg"
        alt=""
        width="32"
        height="32"
      >OpenSplat</a>
      <nav
        class="navlinks"
        :aria-label="$t('nav.main')"
      >
        <NuxtLink
          to="/"
          :aria-current="route.path === '/' ? 'page' : undefined"
        >
          {{ $t('nav.rotations') }}
        </NuxtLink>
        <NuxtLink
          to="/splatfest"
          :aria-current="route.path === '/splatfest' ? 'page' : undefined"
        >
          {{ $t('nav.splatfest') }}
        </NuxtLink>
      </nav>
      <div
        v-if="session?.enabled"
        class="ml-auto"
      >
        <template v-if="session.signedIn">
          <a
            class="btn ghost"
            href="/auth/logout"
          >{{ $t('nav.signout') }}</a>
          <a
            class="avatar-btn"
            href="/?tab=friends"
            :aria-label="$t('nav.account')"
            :title="session.name"
          >{{ initial }}</a>
        </template>
        <a
          v-else
          class="btn ghost"
          :href="`/auth/login?next=${encodeURIComponent(route.fullPath)}`"
        >{{ $t('nav.signin') }}</a>
      </div>
    </div>
  </header>
  <main id="main">
    <NuxtPage />
  </main>
  <footer class="site-foot">
    <div class="wrap">
      <div>
        <a
          href="/"
          class="brand"
        ><img
          src="/opensplat.svg"
          alt=""
          width="28"
          height="28"
        >OpenSplat</a>
        <p class="note">
          {{ $t('footer.note') }}
        </p>
        <p class="note">
          <a :href="`${site}/`">{{ $t('footer.network_line') }}</a>
        </p>
      </div>
      <nav aria-labelledby="foot-net">
        <h2 id="foot-net">
          OpenPak
        </h2>
        <ul>
          <li><a :href="`${site}/`">{{ $t('nav.home') }}</a></li>
          <li><a :href="`${site}/titles`">{{ $t('nav.titles') }}</a></li>
          <li><a :href="`${site}/features`">{{ $t('nav.features') }}</a></li>
          <li><a :href="`${site}/status`">{{ $t('nav.status') }}</a></li>
        </ul>
      </nav>
      <nav aria-labelledby="foot-site">
        <h2 id="foot-site">
          OpenSplat
        </h2>
        <ul>
          <li>
            <NuxtLink to="/">
              {{ $t('nav.rotations') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/splatfest">
              {{ $t('nav.splatfest') }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <nav aria-labelledby="foot-proj">
        <h2 id="foot-proj">
          {{ $t('footer.project') }}
        </h2>
        <ul>
          <li><a href="https://github.com/openpak/splatnet">{{ $t('footer.source') }}</a></li>
          <li><a :href="`${site}/help`">{{ $t('nav.help') }}</a></li>
        </ul>
      </nav>
      <nav aria-labelledby="foot-legal">
        <h2 id="foot-legal">
          {{ $t('footer.legal') }}
        </h2>
        <ul>
          <li><a :href="`${site}/terms`">{{ $t('footer.terms') }}</a></li>
          <li><a :href="`${site}/privacy`">{{ $t('footer.privacy') }}</a></li>
          <li><a :href="`${site}/legal`">{{ $t('footer.legal_notices') }}</a></li>
        </ul>
      </nav>
      <div class="foot-bottom">
        <span>© OpenPak · AGPL-3.0 · {{ $t('footer.nintendo') }}</span>
      </div>
    </div>
  </footer>
</template>
