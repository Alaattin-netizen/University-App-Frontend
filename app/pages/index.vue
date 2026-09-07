<script setup lang="ts">
useSeoMeta({
  title: 'University Information System',
  description: 'University Information System home page.',
})
</script>

<template>
  <section class="rounded-3xl border border-default bg-default p-8 shadow-sm sm:p-12">
    <div class="max-w-2xl">
      <div class="mb-6 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <UIcon name="i-lucide-landmark" class="size-7" />
      </div>
      <p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        University Information System
      </p>
      <h1 class="text-4xl font-semibold tracking-tight text-highlighted sm:text-5xl">
        Welcome to the University Information System
      </h1>
      <p class="mt-5 max-w-xl text-lg leading-8 text-muted">
        Use the navigation to access the academic services available for your account.
        Sign in from the header to see pages based on your university roles.
      </p>
    </div>
  </section>
</template>
