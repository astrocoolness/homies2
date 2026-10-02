# HOMIES²

HOMIES² is a private social space for your people: one-on-one chat, group chat, custom profiles, and a private contact book. The live app is hosted at [homies2.rva.guru](https://homies2.rva.guru/).

## What shipped

- Repaired the blank production screen caused by the missing `app.js` runtime.
- Demo onboarding and crew view with The Block group chat.
- Supabase magic-link authentication when an email is supplied.
- Public profile fields: display name, handle, bio, status, avatar/cover-ready structure, and theme-ready structure.
- Private contact book with E.164 phone normalization.
- Public profile links schema for Instagram, TikTok, Discord, Snapchat, Spotify, website, and other links.
- Friend connection schema with pending, accepted, and blocked states.
- Thread, membership, message, and realtime-ready data model.
- Row-level security on every Homies table.
- Supabase-backed persistence with safe local demo fallback for previewing the experience.

## Backend

The schema is live in the active RVA.guru Supabase project. Tables:

- `homies_profiles`
- `homies_contacts`
- `homies_profile_links`
- `homies_connections`
- `homies_threads`
- `homies_thread_members`
- `homies_messages`

Phone numbers are owner-only data. They are not publicly readable through profile queries. Messaging-app connections are represented as profile links so a user chooses what to expose.

## Local development

This is a static app with no build step:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`. `config.js` contains the public Supabase URL and publishable browser key; the key is safe to ship client-side because access is enforced by Supabase Auth and RLS.

## Next product milestones

1. Add contact invite links and secure phone-hash matching through an Edge Function.
2. Add friend request UI and accepted-friend-only DM thread creation.
3. Add profile links editor, cover/avatar uploads, and theme presets.
4. Add push notifications and unread counts.
5. Add moderation, block/report flows, and privacy controls before broad launch.
