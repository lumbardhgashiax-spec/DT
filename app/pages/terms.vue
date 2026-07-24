<script setup lang="ts">
useSeoMeta({
  title: 'Kushtet e perdorimit',
  description: 'Kushtet e perdorimit per rezervime online te Diamond Tennis Academy.'
})

const sections = [
  {
    title: '1. Informata te pergjithshme',
    body: [
      'Keto kushte rregullojne perdorimin e faqes se Diamond Tennis Academy, rezervimin online te fushave dhe sherbimet qe lidhen me terminet e tenisit ne Hajvali, Prishtine.',
      'Duke perdorur faqen, duke krijuar nje rezervim ose duke vazhduar te pagesa online, klienti konfirmon se i ka lexuar dhe pranuar keto kushte, Privacy Policy dhe Cancellation & Refund Policy.',
      'Faqja ofron informata per fushat, oraret, cmimet, sherbimet shtese dhe disponueshmerine. Te dhenat e shfaqura mund te ndryshojne ne kohe reale sipas rezervimeve, mirembajtjes ose konfigurimit administrativ.'
    ]
  },
  {
    title: '2. Rezervimi online',
    body: [
      'Per te bere rezervim, klienti zgjedh fushen, daten, oren, kohezgjatjen dhe pastaj ploteson te dhenat e kontaktit. Sherbimet shtese jane opsionale dhe nuk jane te detyrueshme per te perfunduar rezervimin.',
      'Rezervimi ruhet fillimisht si kerkese ne pritje. Ai konfirmohet vetem pasi pagesa verifikohet me sukses nga Paysera dhe sistemi gjeneron referencen e rezervimit.',
      'Nese pagesa nuk perfundohet, deshton, mbyllet ose nuk verifikohet brenda afatit te lejuar, termini mund te lirohet automatikisht dhe rezervimi nuk konsiderohet i konfirmuar.'
    ]
  },
  {
    title: '3. Te dhenat e klientit',
    body: [
      'Klienti duhet te jape te dhena te sakta dhe te perditesuara, perfshire emrin, mbiemrin dhe numrin e telefonit. Email-i mund te perdoret per konfirmime ose njoftime kur vendoset nga klienti.',
      'Diamond Tennis Academy mund te perdore keto te dhena per te verifikuar rezervimin, per te kontaktuar klientin rreth terminit, per te trajtuar anulime dhe per te parandaluar keqperdorime.',
      'Rezervimet me te dhena te pasakta, abuzive, te rreme ose te pamundura per verifikim mund te refuzohen ose anulohen.'
    ]
  },
  {
    title: '4. Pagesa online',
    body: [
      'Pagesat online procesohen permes Paysera. Te dhenat e karteles, llogarise bankare ose instrumenteve tjera te pageses plotesohen vetem ne ambientin e sigurt te Paysera-s.',
      'Diamond Tennis Academy nuk ruan numra kartelash, CVV, PIN, kredenciale bankare ose te dhena tjera sensitive te pageses. Sistemi ruan vetem statusin e pageses, shumen, monedhen, referencen e rezervimit dhe identifikuesit teknik te transaksionit.',
      'Pagesa mund te refuzohet nga Paysera, banka ose leshuesi i karteles. Ne ate rast rezervimi nuk konfirmohet dhe klienti mund te provoje perseri me nje termin te lire.'
    ]
  },
  {
    title: '5. Referenca e rezervimit',
    body: [
      'Pas pageses se suksesshme, klienti merr referencen e rezervimit. Kjo reference duhet te ruhet dhe te prezantohet te stafi administrativ kur klienti paraqitet per termin.',
      'Referenca perdoret per verifikim te shpejte te rezervimit, dates, ores, fushes, statusit te pageses dhe sherbimeve te zgjedhura.',
      'Nese klienti nuk mund ta gjeje referencen, stafi mund te kerkoje te dhena shtese si numri i telefonit ose emri i perdorur ne rezervim.'
    ]
  },
  {
    title: '6. Pjesemarrja dhe pajisjet',
    body: [
      'Klienti duhet te paraqitet ne kohe dhe te respektoje periudhen e rezervuar. Vonesa e klientit nuk e zgjat automatikisht kohen e rezervimit.',
      'Klienti duhet te sjelle pajisjet e veta, perfshire raketat, topat, atlete sportive dhe veshje te pershtatshme, pervec rasteve kur nje sherbim shtese ose marreveshje tjeter eshte konfirmuar shprehimisht.',
      'Per sigurine e lojtareve dhe ruajtjen e fushes, Diamond Tennis Academy mund te refuzoje perdorimin e fushes nese pajisjet, veshja ose sjellja nuk jane te pershtatshme.'
    ]
  },
  {
    title: '7. Rregullat e sjelljes',
    body: [
      'Klienti dhe personat shoqerues duhet te sillen me respekt ndaj stafit, lojtareve tjere dhe ambientit. Nuk lejohet demtimi i fushes, pajisjeve, dhomave percjellese ose pronave te akademise.',
      'Ndalohet sjellja agresive, abuzive, e rrezikshme ose cdo veprim qe mund te rrezikoje sigurine e personave tjere.',
      'Diamond Tennis Academy mund te nderprese termin ose te refuzoje rezervime te ardhshme ne raste te shkeljeve serioze.'
    ]
  },
  {
    title: '8. Ndryshime, anulime dhe force madhore',
    body: [
      'Diamond Tennis Academy mund te ndryshoje, pezulloje ose anuloje nje termin per arsye mirembajtjeje, sigurie, moti, defekti teknik, force madhore ose arsye tjera operative.',
      'Kur nje termin nuk mund te mbahet per arsye qe lidhen me akademine, klientit mund ti ofrohet zhvendosje e terminit ose trajtim sipas Cancellation & Refund Policy.',
      'Rregullat per anulim dhe refund jane pjese e ketyre kushteve dhe duhet te lexohen para pageses.'
    ]
  },
  {
    title: '9. Kufizimi i pergjegjesise',
    body: [
      'Diamond Tennis Academy kujdeset qe faqja, cmimet dhe disponueshmeria te jene te sakta, por nuk garanton se sistemi do te jete pa nderprerje, pa gabime teknike ose pa vonesa nga sherbime te paleve te treta.',
      'Akademia nuk mban pergjegjesi per vonesa ose deshtime qe vijne nga Paysera, banka, rrjeti i internetit, pajisja e klientit ose sherbime te jashtme.',
      'Klienti eshte pergjegjes per shendetin, pergatitjen fizike dhe pershtatshmerine e tij per aktivitet sportiv.'
    ]
  },
  {
    title: '10. Ndryshimi i kushteve',
    body: [
      'Keto kushte mund te perditesohen here pas here per arsye ligjore, teknike, operative ose per te reflektuar ndryshime ne sherbime.',
      'Versioni i publikuar ne faqe eshte versioni aktiv. Vazhdimi i perdorimit te faqes pas perditesimit nenkupton pranimin e kushteve te reja.',
      'Per pyetje rreth ketyre kushteve, klienti mund te kontaktoje Diamond Tennis Academy permes faqes se kontaktit.'
    ]
  }
]
</script>

<template>
  <PublicLegalPage
    eyebrow="Kushtet"
    title="Kushtet e perdorimit"
    description="Rregullat e plota per perdorimin e faqes, rezervimet online, pagesat, sjelljen ne fushe dhe pergjegjesite e klientit."
    updated-at="24.07.2026"
    :sections="sections"
  />
</template>
