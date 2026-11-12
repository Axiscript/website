# website

Static site for axiscript.com, served from `main` on GitHub Pages.

## Waitlist

1. Run `supabase/waitlist.sql` in the Supabase SQL editor for project `ghvafuxmusfaolzrwefm`. This repo does not apply it.
2. Before publishing the daily-report device question, run `supabase/waitlist-report-devices.sql` in the same SQL editor. Until that runs, the form still accepts signups and simply omits the device answer.
3. Paste the publishable key into `assets/waitlist-config.js`. That is the only place the key goes. Do not paste the secret key.
