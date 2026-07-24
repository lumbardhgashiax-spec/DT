<script setup lang="ts">
useSeoMeta({
  title: 'Cancellation & Refund Policy',
  description: 'Politika e anulimit dhe refund per rezervime online.'
})

const sections = [
  {
    title: '1. Qellimi i politikes',
    body: [
      'Kjo politike shpjegon si trajtohen anulimet, zhvendosjet e termineve, pagesat e deshtuara dhe refund-et per rezervimet online te Diamond Tennis Academy.',
      'Politika zbatohet per rezervime te krijuara permes faqes dhe te paguara permes Paysera, si dhe per raste kur stafi administrativ duhet te verifikoje nje termin me reference.'
    ]
  },
  {
    title: '2. Kur konsiderohet rezervimi i konfirmuar',
    body: [
      'Rezervimi konsiderohet i konfirmuar vetem pasi pagesa verifikohet me sukses nga Paysera dhe sistemi gjeneron referencen e rezervimit.',
      'Nese klienti hap checkout-in por nuk e perfundon pagesen, termini nuk konsiderohet i konfirmuar.',
      'Referenca e rezervimit duhet te ruhet dhe te prezantohet te stafi administrativ kur klienti paraqitet per termin.'
    ]
  },
  {
    title: '3. Pagesa ne pritje',
    body: [
      'Gjate pageses, termini mund te mbahet perkohesisht per nje kohe te kufizuar. Ky hold nuk eshte konfirmim final.',
      'Nese pagesa nuk verifikohet brenda kohes se lejuar, hold-i mund te skadoje dhe termini mund te behet perseri i lire per klientet tjere.',
      'Klienti mund te provoje perseri duke zgjedhur nje termin te lire dhe duke hapur nje checkout te ri.'
    ]
  },
  {
    title: '4. Anulimi nga klienti',
    body: [
      'Per te kerkuar anulim, klienti duhet te kontaktoje Diamond Tennis Academy dhe te jape referencen e rezervimit, emrin dhe numrin e telefonit te perdorur ne rezervim.',
      'Kerkesat per anulim me te drejte refund pranohen vetem nese behen se paku 48 ore para fillimit te terminit te rezervuar.',
      'Nese anulimi kerkohet me pak se 48 ore para terminit, pagesa nuk rimbursohet, pervec rasteve kur Diamond Tennis Academy e anulon termin per arsye operative, sigurie, moti, mirembajtjeje ose force madhore.',
      'Anulimi i nje rezervimi te konfirmuar nuk nenkupton automatikisht refund derisa akademia te verifikoje referencen, kohen e kerkeses dhe statusin e pageses.'
    ]
  },
  {
    title: '5. Zhvendosja e terminit',
    body: [
      'Kur eshte e mundur, akademia mund te ofroje zhvendosje te terminit ne vend te refund-it.',
      'Zhvendosja varet nga disponueshmeria e fushave, sezoni, cmimi, kohezgjatja dhe rregullat operative.',
      'Nese termini i ri ka cmim ndryshe, mund te kerkohet pagesa e diferences ose trajtim tjeter sipas rastit.'
    ]
  },
  {
    title: '6. Anulimi nga Diamond Tennis Academy',
    body: [
      'Akademia mund te anuloje ose zhvendose nje termin per arsye moti, sigurie, mirembajtjeje, defekti teknik, force madhore ose rrethana tjera qe e pamundesojne perdorimin normal te fushes.',
      'Ne keto raste, klientit mund ti ofrohet zhvendosje e terminit ose refund sipas rrethanave dhe statusit te pageses.',
      'Akademia do te perdore te dhenat e kontaktit te rezervimit per ta njoftuar klientin sa me shpejt qe eshte praktikisht e mundur.'
    ]
  },
  {
    title: '7. Pagesat e deshtuara ose te refuzuara',
    body: [
      'Nese pagesa refuzohet nga Paysera, banka, leshuesi i karteles ose klienti e mbyll checkout-in pa paguar, rezervimi nuk konfirmohet.',
      'Ne raste te tilla, Diamond Tennis Academy nuk e konsideron pagesen te pranuar dhe nuk garanton mbajtjen e terminit.',
      'Nese klientit i shfaqet nje bllokim i perkohshem ne banke, ai duhet te kontaktoje banken ose Paysera-n; zakonisht bllokimet e deshtuara lirohen sipas procedurave te institucionit financiar.'
    ]
  },
  {
    title: '8. Procesi i refund-it',
    body: [
      'Refund-et per pagesa online realizohen permes kanalit te pageses dhe sipas procedurave te Paysera-s.',
      'Koha e kthimit te parave mund te varet nga Paysera, banka e klientit, menyra e pageses dhe proceset nderbankare.',
      'Akademia mund te kerkoje kohe per verifikim te rezervimit, statusit te pageses dhe arsyeve te refund-it para se ta dergoje kerkesen per procesim.'
    ]
  },
  {
    title: '9. Rastet kur refund mund te refuzohet',
    body: [
      'Refund mund te refuzohet ose kufizohet nese klienti nuk paraqitet ne termin, vonohet, nuk respekton rregullat e fushes, jep te dhena te pasakta ose kerkon anulim shume vone.',
      'Refund mund te refuzohet edhe ne raste abuzimi, rezervimesh te perseritura pa qellim perdorimi, sjellje te papranueshme ose demtim te pronave te akademise.',
      'Cdo rast trajtohet ne baze te fakteve, statusit te pageses dhe rregullave operative.'
    ]
  },
  {
    title: '10. Kontakt per anulime dhe refund',
    body: [
      'Per cdo kerkese anulimi, zhvendosjeje ose refund, klienti duhet te kontaktoje Diamond Tennis Academy me referencen e rezervimit dhe te dhenat e kontaktit.',
      'Pa reference ose te dhena te mjaftueshme verifikimi, trajtimi i kerkeses mund te vonohet.',
      'Kjo politike mund te perditesohet here pas here. Versioni i publikuar ne faqe eshte versioni aktiv.'
    ]
  }
]
</script>

<template>
  <PublicLegalPage
    eyebrow="Pagesa"
    title="Cancellation & Refund Policy"
    description="Rregullat e plota per anulime, zhvendosje terminesh, refund, pagesa te deshtuara dhe verifikim te rezervimit."
    updated-at="24.07.2026"
    :sections="sections"
  />
</template>
