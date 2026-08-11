# Supabase — Diamond Tennis Academy

Ky dokument është referenca e ruajtur për strukturën aktuale të Supabase. Skema bazë gjendet te [`supabase/schema.sql`](../supabase/schema.sql); për databazën ekzistuese përdoren vetëm migration-et në [`supabase/migrations`](../supabase/migrations).

## Tabelat aktive

| Tabela | Qëllimi | Fushat kryesore |
| --- | --- | --- |
| `profiles` | Përdoruesit e dashboard-it | `id` = `auth.users.id`, `full_name`, `email`, `phone`, `role`, `is_active` |
| `customers` | Klientët | `first_name`, `last_name`, `phone`, `email`, `notes`, `created_by` |
| `courts` | Fushat e tenisit | `name`, `court_type`, `supports_heating`, `latitude`, `longitude`, `is_active` |
| `court_images` | Galeria e fushave | `court_id`, `storage_path`, `original_name`, `sort_order`, `created_by` |
| `extra_services` | Shërbime shtesë të menaxhueshme | `name`, `description`, `price`, `is_active`, `created_by` |
| `seasons` | Sezonet e çmimeve | `name`, `season_type`, `starts_on`, `ends_on`, `is_active` |
| `official_holidays` | Festat zyrtare që mbyllin rezervimin online | `name`, `starts_on`, `ends_on`, `notes`, `is_active`, `created_by` |
| `price_rules` | Çmimet bazë për 1 orë | `season_id`, `court_type`, `with_heating`, `duration_minutes = 60`, `price`, `is_active` |
| `reservations` | Terminet | `customer_id`, `court_id`, `season_id`, `price_rule_id`, `start_at`, `end_at`, `with_heating`, `status`, `price` |

## Lidhjet

```text
auth.users → profiles
profiles → customers / court_images / extra_services / official_holidays / reservations
customers → reservations
courts → court_images
courts → reservations
seasons → price_rules → reservations
```

## Rregullat e rëndësishme

- Rolet e lejuara janë: `staff`, `admin`, `superadmin`.
- `staff` mund të lexojë të dhënat që i duhen dashboard-it; ndryshimet e menaxhimit kufizohen te `admin` dhe `superadmin`.
- Sezonet aktive nuk mund të mbivendosen.
- Rezervimet aktive nuk mund të mbivendosen në të njëjtën fushë.
- Festat zyrtare aktive nuk mund të mbivendosen. Ato bllokojnë rezervimet publike në UI, API dhe databazë; rezervimet manuale të stafit mbeten të mundshme.
- `latitude` duhet të jetë nga `-90` deri në `90`; `longitude` nga `-180` deri në `180`. Ose ruhen të dyja, ose asnjëra.
- `supports_heating`, `price_rules.with_heating` dhe `reservations.with_heating` ruhen ende për përputhshmëri me rezervimet/çmimet ekzistuese. Konfigurimi i ri i ngrohjes bëhet te `extra_services`, jo te faqja e fushave.
- Çdo rezervim përdor çmimin bazë të rregullit `with_heating = false`; shërbimet shtesë zgjedhen veçmas dhe i shtohen çmimit total.
- Rezervimi pranon intervale nga 1 deri në 5 orë, me hapa prej 30 minutash. Çmimi total është `(çmimi i fushës për 1 orë + shërbimet për 1 orë) × numri i orëve`, edhe për intervalet gjysmëorëshe.
- Shërbimet shtesë lexohen drejtpërdrejt nga `extra_services` gjatë krijimit ose ndryshimit të rezervimit. Nuk ruhet tabelë lidhëse për to; ndryshimi i çmimit ndikon vetëm rezervimet e krijuara ose të ndryshuara pas këtij ndryshimi.

## Rezervimet nga faqja publike

Faqja publike nuk ndryshon skemën e Supabase-it dhe nuk përdor tabelë të re për
shërbimet shtesë. Endpointet `/api/public/*` në server lexojnë vetëm fushat,
sezonet, çmimet dhe shërbimet aktive; gjatë krijimit të rezervimit ruajnë
klientin dhe rreshtin përkatës në `reservations`.

- Çmimi llogaritet gjithmonë në server nga `price_rules` dhe
  `extra_services`; browser-i nuk dërgon çmim.
- Rezervimi publik aktual është një interval prej 60 minutash, nga 08:00 deri
  në 22:00, në zonën `Europe/Belgrade`. Funksionet ekzistuese të dashboard-it
  për intervale më të gjata mbeten të pandryshuara.
- Vlera e ruajtur te `reservations.price` është totali; shërbimet individuale
  nuk ruhen në një tabelë lidhëse, sipas logjikës aktuale të projektit.
- Kërkohet `NUXT_SUPABASE_SECRET_KEY` vetëm në server për API-në publike.
  Çelësi nuk duhet të shfaqet kurrë në browser ose në Git.

## Fotografitë e fushave

Skedarët nuk ruhen në tabelë. `court_images.storage_path` i referohet bucket-it privat `court-images` në Supabase Storage.

- Bucket-i është privat, jo publik.
- Pranohen vetëm `image/jpeg`, `image/png`, `image/webp` deri në 8 MB.
- Stafi aktiv mund t’i lexojë; admin dhe superadmin mund t’i ngarkojnë, ndryshojnë ose fshijnë.
- Aplikacioni krijon URL të nënshkruara, të përkohshme, për shfaqjen e fotografive.

## Migration-et

| Renditja | Skedari | Ndryshimi |
| --- | --- | --- |
| 1 | `202607190001_dashboard_foundation.sql` | RLS, funksionet e roleve, trigger-at, indeksat dhe RPC-të e rezervimeve |
| 2 | `202607200002_remove_commercial_modules.sql` | Heq tabelat/lidhjet e ofertave dhe pakove |
| 3 | `202607200003_court_images.sql` | `court_images`, bucket-i privat `court-images` dhe politikat Storage |
| 4 | `202607200004_court_coordinates.sql` | `latitude`, `longitude` dhe kontrollet e koordinatave për `courts` |
| 5 | `202607200005_extra_services.sql` | Tabela `extra_services`, RLS dhe indeksi i saj |
| 6 | `202607200006_reservation_extra_services.sql` | Shërbimet shtesë në rezervime, çmimi total dhe RPC-ja e përditësuar |
| 7 | `202607200007_hourly_reservation_pricing.sql` | Çmim për orë dhe rezervime nga 1 deri në 5 orë |
| 8 | `202607200008_half_hour_reservation_ranges.sql` | Intervalet e rezervimit në hapa prej 30 minutash dhe llogaritja proporcionale e çmimit |
| 9 | `202607200009_reservation_pricing_function.sql` | Krijon vetëm RPC-në e rezervimit nga tabelat ekzistuese; nuk ndryshon tabela |
| 10 | `202607200010_prevent_reservation_overlap.sql` | Ndalon përplasjen e termineve në të njëjtën fushë |
| 15 | `202608110015_official_holidays.sql` | Festat zyrtare, politikat e stafit dhe bllokimi transaksional i rezervimeve publike |

Ekzekuto migration-et në këtë rend në Supabase SQL Editor. Migration-et 003 dhe 005 krijojnë edhe schema-n private të përdorur për kontrollet e roleve, prandaj mund të përdoren edhe nëse schema `private` mungon.

## Orari i rezervimeve ne dashboard

- Formulari i dashboard-it lejon zgjedhjen e ores nga `10:00` deri ne `00:00`.
- Stafi mund te krijoje intervale me te gjata se 5 ore; cmimi mbetet llogaritja per ore nga `price_rules` dhe `extra_services`.
- Migration-i `202607210012_dashboard_extended_reservation_hours.sql` perditeson vetem funksionin `public.upsert_reservation`; nuk krijon dhe nuk ndryshon tabela.

## Modulet e hequra

`offers`, `customer_packages` dhe `package_members` nuk janë më pjesë e skemës aktive. Referencat e tyre ekzistojnë vetëm në migration-in e heqjes, sepse ai duhet t’i identifikojë për t’i fshirë nga një databazë e vjetër.
