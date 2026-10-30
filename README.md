# Natalia Gelitashvili — site (stage 1)
**Done:** home page (bilingual ka/en switch, hero, counters, clubs, live news from Supabase, professional-development graphic), schema + RLS + storage.
**Not built yet:** about/stem/robotics/projects/news/contact/admin pages, translation Edge Function (DeepL/Google, key stored as a Supabase secret), contact-form wiring, admin login.
## Run
1. Supabase: new project → Auth → disable sign-ups → run `supabase/schema.sql`. Create Natalia's user manually, add her id to `admins`.
2. Put URL + anon key in `js/config.js`.
3. `python3 -m http.server` in this folder.
## Needed from Natalia
Her STEM-shirt photo, club photos (with parental permission), email, phone, WhatsApp, real project list.
