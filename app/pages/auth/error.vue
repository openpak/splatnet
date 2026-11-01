<script setup lang="ts">
import '~/assets/css/index.css';

const { t } = useI18n();

if (import.meta.server) {
	setResponseStatus(useRequestEvent()!, 400);
}
useHead({ title: t('auth.failed_title'), meta: [{ name: 'robots', content: 'noindex' }] });
</script>

<template>
  <div class="wrap page">
    <h1>{{ $t('auth.failed_title') }}</h1>
    <p class="lede">
      {{ $t('auth.failed') }}
    </p>
    <p>
      <a
        class="btn"
        href="/"
      >{{ $t('auth.back') }}</a>
    </p>
  </div>
</template>
