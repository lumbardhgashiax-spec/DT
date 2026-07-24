<script setup lang="ts">
useSeoMeta({
  title: 'Privacy Policy',
  description: 'Politika e privatesise per te dhenat e klienteve te Diamond Tennis Academy.'
})

const sections = [
  {
    title: '1. Qellimi i kesaj politike',
    body: [
      'Kjo Privacy Policy shpjegon se si Diamond Tennis Academy mbledh, perdor, ruan dhe mbron te dhenat personale kur klienti perdor faqen, ben rezervim online ose paguan permes Paysera.',
      'Politika vlen per faqen publike, procesin e rezervimit, komunikimin me klientin dhe menaxhimin administrativ te rezervimeve.'
    ]
  },
  {
    title: '2. Te dhenat qe mund te mblidhen',
    body: [
      'Gjate rezervimit mund te mblidhen emri, mbiemri, numri i telefonit, email-i opsional, fusha e zgjedhur, data, ora, kohezgjatja, sherbimet shtese, cmimi dhe referenca e rezervimit.',
      'Per pagesa online ruhen vetem te dhena teknike te transaksionit, si statusi i pageses, shuma, monedha, referenca e rezervimit, identifikuesi i porosise dhe koha e pageses.',
      'Per siguri dhe mirembajtje mund te perpunohen IP adresa, user-agent, koha e kerkeses, gabime teknike dhe log-e te domosdoshme te serverit.'
    ]
  },
  {
    title: '3. Te dhenat qe nuk ruhen',
    body: [
      'Diamond Tennis Academy nuk ruan numra te plote kartelash, CVV, PIN, kredenciale bankare ose te dhena tjera sensitive te pageses.',
      'Keto te dhena perpunohen nga Paysera ne ambientin e tyre te sigurt dhe sipas kushteve, certifikimeve dhe politikave te Paysera-s.',
      'Faqja nuk kerkon krijim llogarie nga klienti per rezervim publik.'
    ]
  },
  {
    title: '4. Si perdoren te dhenat',
    body: [
      'Te dhenat perdoren per te krijuar rezervimin, per te kontrolluar disponueshmerine, per te llogaritur cmimin, per te hapur checkout-in e pageses dhe per te konfirmuar statusin pas pageses.',
      'Te dhenat perdoren edhe per te kontaktuar klientin rreth terminit, per te trajtuar anulime ose refund, per te parandaluar abuzime dhe per te mbajtur evidenca operative.',
      'Te dhenat nuk shiten dhe nuk ndahen per marketing te paleve te treta pa pelqim te vecante.'
    ]
  },
  {
    title: '5. Baza ligjore dhe interesi legjitim',
    body: [
      'Perpunimi i te dhenave per rezervim dhe pagese behet per te permbushur kerkesen e klientit dhe per te ofruar sherbimin e rezervuar.',
      'Disa te dhena mund te ruhen per detyrime ligjore, kontabel, tatimore, sigurie ose per mbrojtje ndaj mosmarreveshjeve dhe abuzimeve.',
      'Cookies opsionale ose mjete analitike aktivizohen vetem nese klienti jep pelqim ne cookie banner.'
    ]
  },
  {
    title: '6. Palet e treta teknike',
    body: [
      'Aplikacioni perdor Supabase per databaze, autentikim administrativ dhe ruajtje te te dhenave operative.',
      'Aplikacioni perdor Paysera per krijim te checkout-it, perpunim te pageses, verifikim te statusit dhe njoftime teknike permes webhook.',
      'Sherbime te tjera hosting-u, rrjeti ose infrastrukture mund te perpunojne te dhena teknike vetem aq sa eshte e nevojshme per funksionimin dhe sigurine e faqes.'
    ]
  },
  {
    title: '7. Ruajtja e te dhenave',
    body: [
      'Te dhenat e rezervimeve ruhen aq kohe sa eshte e nevojshme per menaxhim operativ, raportim, kontabilitet, mbrojtje ligjore dhe permiresim te sherbimit.',
      'Log-et teknike ruhen per periudha te kufizuara sipas nevojes per siguri, diagnostikim dhe parandalim abuzimi.',
      'Kur nuk ka me nevoje ligjore ose operative, te dhenat mund te fshihen, anonimizohen ose arkivohen sipas procedurave te brendshme.'
    ]
  },
  {
    title: '8. Siguria',
    body: [
      'Qasja ne dashboard dhe ne te dhenat administrative duhet te jete e kufizuar vetem per personat e autorizuar.',
      'Te dhenat sensitive server-side si Supabase service key dhe Paysera client secret nuk duhet te publikohen ne browser, repository publik ose komunikime te pasigurta.',
      'Pagesa kryhet ne Paysera dhe komunikimi me webhook verifikohet teknikisht per te ulur rrezikun e manipulimit te statusit te pageses.'
    ]
  },
  {
    title: '9. Te drejtat e klientit',
    body: [
      'Klienti mund te kerkoje qasje ne te dhenat e tij, korrigjim te te dhenave te pasakta, kufizim te perpunimit ose fshirje kur kjo lejohet nga ligji.',
      'Disa kerkesa mund te mos realizohen menjehere nese te dhenat duhen ruajtur per detyrime ligjore, kontabel, sigurie ose per trajtim te mosmarreveshjeve.',
      'Per kerkesa rreth privatesise, klienti duhet te kontaktoje Diamond Tennis Academy me te dhena te mjaftueshme per verifikim te rezervimit.'
    ]
  },
  {
    title: '10. Ndryshime ne politike',
    body: [
      'Kjo politike mund te perditesohet per te reflektuar ndryshime ligjore, teknike ose operative.',
      'Versioni aktiv publikohet ne kete faqe dhe mban daten e perditesimit.',
      'Perdorimi i vazhdueshem i faqes pas perditesimit nenkupton se klienti eshte njoftuar me versionin e ri.'
    ]
  }
]
</script>

<template>
  <PublicLegalPage
    eyebrow="Privatesia"
    title="Privacy Policy"
    description="Si mblidhen, ruhen, mbrohen dhe perdoren te dhenat personale gjate rezervimit dhe pageses online."
    updated-at="24.07.2026"
    :sections="sections"
  />
</template>
