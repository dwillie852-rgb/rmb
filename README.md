# RMbtsdonations

A sharp fan-donation website for a Kim Namjoon-centered Arirang tour marketing campaign.

The app is Vercel-ready: the public site is static, while `/api/config` and `/api/proofs`
handle server-backed admin settings, donation proof records, and proof file uploads.

## Files

- `index.html` contains the page content and donation sections.
- `admin.html` contains the admin dashboard.
- `styles.css` contains the full responsive visual design.
- `admin.css` contains dashboard styling.
- `script.js` contains the amount picker, payment routing, proof upload, mobile nav, chat, and fan notes.
- `admin.js` contains authenticated dashboard settings, proof inbox, and export/import tools.
- `api/config.js` stores campaign, payment, and chat settings.
- `api/proofs.js` stores proof records and uploaded proof files.
- `api/health.js` reports launch-critical environment checks.
- `vercel.json` contains production headers and clean URL settings.
- `assets/arirang-hero-banner.png` is the hero banner artwork.
- `assets/arirang-tour-cover.jpg` is the Arirang tour cover used in the tour section.

## Vercel Launch Setup

1. Create a Vercel project from this folder or connected Git repository.
2. In Vercel, add Blob storage to the project.
3. Add these environment variables in Vercel:

```bash
ADMIN_TOKEN=use-a-long-random-secret
BLOB_READ_WRITE_TOKEN=from-vercel-blob
RMBTS_STORAGE_PREFIX=rmbtsdonations
```

4. Deploy with `vercel --prod`.
5. Open `/admin.html`, paste the same `ADMIN_TOKEN`, then save campaign, payment, chat, and proof settings.
6. Add `rmbtsdonations.com` in Vercel project domains and follow the DNS instructions Vercel gives you.

## Payment Settings

Payment details are managed from `admin.html` after authentication. Donor-facing pages read the
saved server config from `/api/config`.

Supported methods:

- USDT
- Bitcoin
- USDC
- Bank transfer

## Proof Upload

Public proof submissions post to `/api/proofs`. Uploaded files are capped at 3MB and stored in
Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured. Admins can review, verify, reject, clear,
and manually add records from the dashboard.

## Live Chat

The built-in guide remains active by default. For real human support, configure the dashboard with:

- Tawk.to provider ID
- Crisp website ID
- a custom widget script URL
- or a visible admin contact/SLA

## Admin Dashboard

Open `/admin.html`, authenticate with `ADMIN_TOKEN`, and manage:

- preset donation amounts and currency symbol
- fundraising target and receipt update goal
- hero, donation, and budget copy
- budget allocation lines and percentages
- payment wallet and bank details
- proof inbox review states
- live chat guide/provider settings
- config export/import tools

## Run Locally

For a quick static preview:

```bash
python3 -m http.server 5173
```

Then open `http://localhost:5173`.

For Vercel Functions locally:

```bash
npm install
ADMIN_TOKEN=local-dev-admin vercel dev --listen 5173
```

Local admin API writes use the token `local-dev-admin` when `ADMIN_TOKEN` is not set.
