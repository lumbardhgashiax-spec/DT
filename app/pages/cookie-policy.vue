<script setup lang="ts">
useSeoMeta({
  title: 'Cookie Policy',
  description: 'Politika e cookies per Diamond Tennis Academy.'
})

const sections = [
  {
    title: '1. Cfare jane cookies',
    body: [
      'Cookies jane skedare te vegjel ose mekanizma te ngjashem ruajtjeje qe vendosen ne browser per te mbajtur informata teknike, preferenca ose gjendje te nevojshme te faqes.',
      'Pervec cookies klasike, faqja mund te perdore edhe local storage ose session storage per te ruajtur zgjedhje te klientit, si preferencat e cookies.'
    ]
  },
  {
    title: '2. Cookies te domosdoshme',
    body: [
      'Cookies te domosdoshme nevojiten per funksionimin baze te faqes, sigurine, sesionet teknike, rezervimin, ruajtjen e preferencave te consent-it dhe komunikimin me sherbimet server-side.',
      'Keto nuk perdoren per marketing dhe nuk mund te caktivizohen nga cookie banner, sepse pa to faqja nuk mund te funksionoje si duhet.',
      'Shembuj perfshijne ruajtjen e zgjedhjes se cookie consent, sesionet e sigurise dhe cookies qe sherbimet teknike i perdorin per te mbrojtur aplikacionin.'
    ]
  },
  {
    title: '3. Cookies per preferenca',
    body: [
      'Cookies ose local storage per preferenca mund te perdoren per te mbajtur zgjedhje si gjuha, preferencat e nderfaqes ose konfigurime te ngjashme.',
      'Keto aktivizohen vetem nese klienti i pranon ne banner, pervec preferences se vet cookie consent-it qe eshte e domosdoshme.'
    ]
  },
  {
    title: '4. Cookies analitike',
    body: [
      'Cookies analitike ndihmojne te kuptohet si perdoret faqja, cilat faqe vizitohen dhe ku mund te permiresohet eksperienca e rezervimit.',
      'Keto nuk duhet te aktivizohen pa pelqim te qarte te klientit. Nese klienti i refuzon, rezervimi dhe pagesa vazhdojne te funksionojne normalisht.',
      'Aktualisht sistemi duhet te respektoje zgjedhjen e klientit dhe te mos aktivizoje analitike pa consent.'
    ]
  },
  {
    title: '5. Cookies marketing',
    body: [
      'Cookies marketing perdoren per reklama, matje kampanjash ose personalizim komercial. Keto jane gjithmone opsionale.',
      'Faqja nuk duhet te aktivizoje marketing cookies pa pelqim te qarte dhe te ruajtur nga klienti.',
      'Refuzimi i marketing cookies nuk ndikon ne mundesine per te rezervuar ose paguar.'
    ]
  },
  {
    title: '6. Paysera dhe cookies te paleve te treta',
    body: [
      'Kur klienti vazhdon te pagesa, ai kalon ne ambientin e Paysera-s. Paysera mund te perdore cookies dhe teknologji te veta per siguri, verifikim, parandalim mashtrimi dhe perpunim pagese.',
      'Keto cookies menaxhohen nga Paysera dhe i nenshtrohen politikave te tyre. Diamond Tennis Academy nuk kontrollon cookies qe Paysera vendos ne faqet ose ambientet e veta.',
      'Klienti duhet te lexoje edhe politikat e Paysera-s kur perdor checkout-in e tyre.'
    ]
  },
  {
    title: '7. Menaxhimi i zgjedhjes',
    body: [
      'Klienti mund te pranoje vetem cookies te domosdoshme, te pranoje te gjitha ose te zgjedhe kategori specifike ne banner.',
      'Zgjedhja ruhet ne browser per te mos e shfaqur banner-in ne cdo vizite.',
      'Klienti mund ta ndryshoje zgjedhjen duke fshire cookies/local storage nga browser-i per kete faqe. Pas fshirjes, banner-i do te shfaqet perseri.'
    ]
  },
  {
    title: '8. Bllokimi nga browser-i',
    body: [
      'Klienti mund te bllokoje cookies nga browser-i. Megjithate, bllokimi i cookies te domosdoshme mund te shkaktoje probleme ne funksionimin e faqes, login-in administrativ ose procesin e rezervimit.',
      'Nese shfaqen probleme teknike pas bllokimit te cookies, klienti duhet te lejoje cookies te domosdoshme ose te provoje nje browser tjeter.'
    ]
  }
]
</script>

<template>
  <PublicLegalPage
    eyebrow="Cookies"
    title="Cookie Policy"
    description="Informacion i plote mbi cookies te domosdoshme, preferenca, analitike, marketing dhe cookies qe lidhen me pagesat online."
    updated-at="24.07.2026"
    :sections="sections"
  />
</template>
