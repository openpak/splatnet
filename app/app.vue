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
        <a :href="`${site}/`">{{ $t('nav.home') }}</a>
        <a :href="`${site}/titles`">{{ $t('nav.titles') }}</a>
        <a :href="`${site}/features`">{{ $t('nav.features') }}</a>
        <a :href="`${site}/downloads`">{{ $t('nav.downloads') }}</a>
        <a :href="`${site}/status`">{{ $t('nav.status') }}</a>
        <a :href="`${site}/help`">{{ $t('nav.help') }}</a>
        <NuxtLink
          to="/"
          :aria-current="route.path === '/' ? 'page' : undefined"
        >
          OpenSplat
        </NuxtLink>
        <NuxtLink
          to="/splatfest"
          :aria-current="route.path === '/splatfest' ? 'page' : undefined"
        >
          {{ $t('nav.splatfest') }}
        </NuxtLink>
      </nav>
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
      </div>
      <nav aria-labelledby="foot-net">
        <h2 id="foot-net">
          {{ $t('footer.network') }}
        </h2>
        <ul>
          <li><a :href="`${site}/titles`">{{ $t('nav.titles') }}</a></li>
          <li><a :href="`${site}/features`">{{ $t('nav.features') }}</a></li>
          <li><a :href="`${site}/status`">{{ $t('nav.status') }}</a></li>
        </ul>
      </nav>
      <nav aria-labelledby="foot-start">
        <h2 id="foot-start">
          {{ $t('nav.getstarted') }}
        </h2>
        <ul>
          <li><a :href="`${site}/downloads`">{{ $t('nav.downloads') }}</a></li>
          <li><a :href="`${site}/register`">{{ $t('nav.register') }}</a></li>
          <li><a :href="`${site}/help`">{{ $t('nav.help') }}</a></li>
        </ul>
      </nav>
      <nav aria-labelledby="foot-proj">
        <h2 id="foot-proj">
          {{ $t('footer.project') }}
        </h2>
        <ul>
          <li><a href="https://github.com/openpak/splatnet">{{ $t('footer.source') }}</a></li>
          <li><a :href="`${site}/feed/news.xml`">{{ $t('footer.feed.news') }}</a></li>
          <li><a :href="`${site}/press`">{{ $t('footer.press') }}</a></li>
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
