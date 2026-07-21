# Dashboard pages

Kjo dosje eshte nje Nuxt route-group. Emri `(dashboard)` perdoret vetem per
organizimin e kodit dhe nuk shfaqet ne URL.

Faqet ketu:

- perdorin `layout: 'dashboard'`;
- jane pjese e panelit administrativ;
- duhet te mbrohen nga Supabase auth redirect;
- nuk duhet te permbajne faqe publike.

URL-te e dashboard-it perfshijne `/dashboard`, `/kalendari`, `/rezervimet`,
`/raportet` dhe `/stafi`. Faqet e menaxhimit jane te grupuara te
`/menaxhimi/fushat`, `/menaxhimi/sezonet`, `/menaxhimi/cmimet` dhe
`/menaxhimi/sherbime-shtese`.
