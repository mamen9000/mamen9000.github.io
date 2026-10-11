<div align="center">

# LONZILFOX / REDACTED SIGNAL ARCHIVE

**Blood-red glitch · Animated spectral radar · Hacker terminal · Topic-driven portfolio**

[OPEN LIVE WEBSITE](https://lonzilfox.github.io/) · [GITHUB PROFILE](https://github.com/LonzilFox) · [TOPIC CLASSIFICATION GUIDE](./TOPICS.md)

</div>

## SYSTEM OVERVIEW

This repository powers **https://lonzilfox.github.io/** with HTML/CSS/JavaScript, layered canvas effects (blood rain, particle constellation, spectral radar, cursor sparks), glitch fracture overlays, typed messages, synthetic packet-feed animation, interactive terminal, responsive project cards, category filters and search. Motion can be switched off with FX: OFF and honors reduced-motion accessibility preferences.

**Categories are defined by GitHub repository Topics only.** No repository is classified from its name, programming language or description. The live website reads public repositories directly from GitHub; the scheduled GitHub Action also refreshes `data/projects.json` and the section below.

## PROJECT INDEX / AUTOMATICALLY GENERATED

<!-- AUTO-PROJECTS:START -->

_The first workflow run will retrieve public repositories and generate this section. No projects have been manually assigned a category._

<!-- AUTO-PROJECTS:END -->

## DEPLOYMENT

1. Create the public repository `LonzilFox/lonzilfox.github.io` and put **this folder's contents** at its root.
2. Under **Settings → Pages → Build and deployment → Source**, select **GitHub Actions** (not Deploy from a branch).
3. Under **Settings → Actions → General**, ensure Actions are permitted. Under **Workflow permissions**, allow read/write `GITHUB_TOKEN` if your account/repository defaults to read-only. The workflow declares `contents: write` for syncing the generated files.
4. Push to `main`, or open **Actions → Sync Topics and deploy website → Run workflow**.
5. Wait for the GitHub deployment to finish, then open [lonzilfox.github.io](https://lonzilfox.github.io/).

The workflow runs on push, via manual dispatch, and roughly every **6 hours** (`.github/workflows/sync-and-deploy.yml`). Scheduled GitHub Actions may be delayed or disabled after prolonged repository inactivity. The site itself checks the GitHub API when loaded, so new public projects and topic changes normally appear on the next visitor refresh even before the scheduled sync. A snapshot is used if the API is rate-limited/offline; if both sources are missing, it shows a truthful empty/error state rather than fabricated projects.

**Important:** the automatic data update is published using `actions/deploy-pages`; GitHub Actions `GITHUB_TOKEN` commits alone should not be relied on to trigger a Pages build.

## CATEGORY CONTROL

Set Topics in the repository's **About → ⚙ → Topics** section. Examples:

```text
category-tools   ocr   csharp   windows
category-game    category-web   multiplayer   typescript
category-ai      machine-learning   python
category-security   reverse-engineering
```

- `category-*`: category membership; multiple allowed; unknown suffix automatically becomes a new filter / README section.
- Other Topics: additional technology/feature tags; they never select a category.
- No `category-*`: goes to **UNCLASSIFIED**, with no name-based fallback.
- Optional `portfolio-featured`: puts the project first in the site's Featured ordering.
- Private repositories are never indexed. Forks without `category-*` are excluded; explicitly tagged forks are included.
- GitHub topics: lowercase letters, digits, hyphens; at most 20 per repository.

See [TOPICS.md](./TOPICS.md) for a full explanation and the optional Windows tag editor.

## FILES

```text
index.html                     Website structure
assets/style.css               Black / blood-red theme + responsive UI
assets/main.js                 Existing Matrix animation, terminal, GitHub Topics renderer
assets/fx.js                   Spectral radar, cursor particles, animated feeds and typing
assets/animations.css          Extra deconstruction layers / animations / responsive rules
assets/profile-banner.gif      Animated README banner
assets/favicon.svg             Icon
data/projects.json             Generated static snapshot (not the source of truth)
scripts/sync_repos.py          Topics-to-README and JSON generator
.github/workflows/...          Scheduled sync + GitHub Pages deploy
TOPICS.md                      Category rules + GitHub CLI guide
tag_repository.bat              Interactive one-repository Topic editor
apply_topics.bat                User-approved batch Topic editor
topics-plan.csv                 Empty CSV plan for bulk tag assignment
preview_local.bat              Local web preview
README.md                      This website's README
```

No build tools, Node dependencies, PAT, or API key are required. JavaScript only reads public GitHub data. Browsers need network access to GitHub to receive instant live updates.

## LOCAL TEST

Run `preview_local.bat`, or:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`. For a standalone local snapshot update use `python scripts/sync_repos.py --target site --username LonzilFox` (requires access to `api.github.com`).

Generated regions between `AUTO-PROJECTS` markers are overwritten: edit everything outside those markers freely.
