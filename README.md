# RepZy website

This is the public-facing website served by Cloudflare Pages. It can render either:
- a premium landing page for the product itself, or
- a business-specific card page from a Trello card when you open `?id=<shortlink>`

## Project structure

```text
website/
├── index.html
├── README.md
├── .gitignore
├── dev.vars.example
├── wrangler.toml
├── functions/
│   └── api/
│       └── business.js
└── ...
```

## Exact Cloudflare Pages setup

### 1) GitHub repo
Create a GitHub repository and push the contents of the `website/` folder as the project root.

If you prefer to keep the Python scraper in the same repo, then use the website folder as the Pages root in Cloudflare. In that case the repo root stays the whole project, but the Pages build settings should point to the website folder.

### 2) Cloudflare Pages
Go to:
- Cloudflare Dashboard
- Workers & Pages
- Pages
- Create project
- Connect GitHub
- Select the repo

Then configure:
- Framework preset: None
- Build command: leave empty
- Build output directory: `.` if the repo root is the website folder
- If the repo root is the full project: set the output directory to `/website`

### 3) Environment variables
Add these in Cloudflare Pages:
- `TRELLO_API_KEY`
- `TRELLO_TOKEN`

Do not store these in the repo.

### 4) Deploy
Once saved, Cloudflare will publish the site at:
- `https://<project-name>.pages.dev`

---

## Local Pages dev

For local testing of the Function endpoint, use Wrangler:

```bash
cd website
npx wrangler pages dev .
```

Then open:

```text
http://localhost:8788/?id=<a-real-trello-shortlink>
```

Example:

```text
http://localhost:8788/?id=N5cFcZMK
```

### Local env file
Copy `dev.vars.example` to `.dev.vars` and fill in the Trello values:

```bash
cp dev.vars.example .dev.vars
```

Then start Wrangler with the local variables available.

---

## Behavior

If no `?id=` is present, the page displays the premium marketing landing page.

If `?id=` is present, the page calls `/api/business` and renders the corresponding business card data.

This keeps the same flow usable for NFC or QR cards while also letting the public landing page live on Cloudflare Pages.

---

## Important notes

- This is a static site, so no Node build is required.
- Cloudflare Pages will serve the `functions/` directory automatically.
- The business API expects Trello card descriptions in the following format:

```text
Ville: Vichy
Adresse: 8 Rue de Paris, 03200 Vichy
Place ID: ChIJ...
Lien avis: https://...
Lien Google Maps: https://maps.google.com/?cid=...
Website: https://example.com
TripAdvisor: https://www.tripadvisor.com/...
Note: 4.8
Avis: 1234
```

This matches the RepZy scraper output and keeps the card page consistent for both desktop and mobile scans.
"# repzy" 
