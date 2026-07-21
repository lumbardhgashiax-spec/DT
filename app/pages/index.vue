<script setup lang="ts">
import BookingStory from '~/components/public/BookingStory.vue'
import CourtShowcase from '~/components/public/CourtShowcase.vue'
import FaqSection from '~/components/public/FaqSection.vue'
import FinalBookingCta from '~/components/public/FinalBookingCta.vue'
import HeroSection from '~/components/public/HeroSection.vue'
import LiveAvailability from '~/components/public/LiveAvailability.vue'
import LocationSection from '~/components/public/LocationSection.vue'
import TennisLifestyleSections from '~/components/public/TennisLifestyleSections.vue'
import { brandConfig } from '~/config/brand'
import { faqItems } from '~/config/publicContent'

useSeoMeta({
  title: 'Kryefaqja',
  description: 'Diamond Tennis Academy ne Hajvali, Prishtine: fusha tenisi, rezervim online dhe sherbime shtese sipas disponueshmerise.'
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SportsActivityLocation',
        'name': brandConfig.name,
        'image': brandConfig.logo,
        'address': brandConfig.locationLabel,
        'amenityFeature': ['Tennis court', 'Online booking']
      })
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqItems.map(item => ({
          '@type': 'Question',
          'name': item.label,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': item.content
          }
        }))
      })
    }
  ]
})
</script>

<template>
  <main class="home-page">
    <HeroSection />
    <LiveAvailability />
    <TennisLifestyleSections />
    <CourtShowcase />
    <BookingStory />
    <LocationSection />
    <FaqSection />
    <FinalBookingCta />
  </main>
</template>

<style scoped>
.home-page {
  min-height: 100dvh;
  background: #F5F7F1;
}
</style>
