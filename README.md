# Grace Insta CRM

Local, no-auth CRM for tracking Instagram-first outreach to local businesses.

## Run locally

```bash
npm install
npm run dev
```

The app runs at `http://127.0.0.1:5173` and the local API runs at `http://127.0.0.1:8787`.

## Data

Lead and outreach data is stored in `.data/crm.json`. The `.data/` folder is ignored by git because it can contain private lead/contact information.

On static hosts like Vercel, the app falls back to browser `localStorage` so the hosted demo remains usable without an external database. Local development still uses the file-backed API.

## CSV import

The lead importer accepts headers like:

```csv
businessName,niche,location,website,instagramHandle,linkedinUrl,email,owner,source,tags
Apex Roofing,Roofing,Dallas TX,https://example.com,@apexroofing,,owner@example.com,Ana,Instagram search,roofing|texas
```
