# GitHub Topics as the ONLY source of project categories

Add a GitHub Topic to each repository: open a project -> **About** -> **gear icon** -> **Topics** -> type the tags -> **Save changes**.

| Category Topic | Section on website / READMEs |
|---|---|
| `category-tools` | DEV / TOOLS |
| `category-game` | GAMES / MODS |
| `category-ai` | AI / VISION |
| `category-automation` | AUTOMATION |
| `category-web` | WEB / APPS |
| `category-creative` | CREATIVE |
| `category-security` | SECURITY |
| Any `category-your-label` | Auto-created YOUR LABEL category |
| No category Topic | UNCLASSIFIED |

**Important:** only the `category-` prefix determines classification. Standard GitHub Topics (e.g. `python`, `windows`, `ocr`, `unity`, `csharp`) appear as feature labels, never determine categories.

A repo can have multiple categories. For instance, a game website should use `category-game`, `category-web`, `multiplayer`, `typescript`. It will show under both Games and Web filters. The repo itself is not duplicated in the All view.

You can assign `portfolio-featured` to promote a repo in the site's FEATURED sort (otherwise sorted by stars/name). It does not make a category.

## Optional GitHub CLI commands

```powershell
gh auth login
gh repo edit LonzilFox/OCRCaptureTool --add-topic 'category-tools,ocr,windows,csharp'
gh repo edit LonzilFox/SlimeLounge --add-topic 'category-game,category-web,multiplayer'
```

`--add-topic` adds and keeps existing Topics. Review and choose the categories yourself: **the project intentionally contains no implicit mapping of repository names to category labels**.

For one project on Windows, run `tag_repository.bat`: it lets you type the repo name and comma-separated Topics, confirms, and then invokes the GitHub CLI.

For **many repositories**, fill the editable `topics-plan.csv` yourself using CSV rows such as `YourRepo,"category-tools,windows,csharp"`, then run `apply_topics.bat`. The script previews every planned update and only changes GitHub after you type `APPLY`. No classification is pre-filled or inferred. It **adds**, never removes, Topics.

To remove an incorrect Topic:

```powershell
gh repo edit LonzilFox/SlimeLounge --remove-topic category-tools
```

### Refresh behavior

| Content | How it updates | Typical timing |
|---|---|---|
| Website category list and project cards | Browser fetches public GitHub API, falls back to generated JSON | Next page load, assuming GitHub API available |
| `lonzilfox.github.io/README.md` | Site repository's GitHub Actions workflow | Approximately every 6 h, manual dispatch, or push |
| `LonzilFox/README.md` (public profile) | Profile repository's independent GitHub Actions workflow | Approximately every 6 h or manual dispatch |

GitHub Actions cron times are best-effort, not precise; GitHub may delay runs and may disable them for public repositories inactive for prolonged periods. If a workflow has been disabled, re-enable it in the repository's Actions page.

### Privacy and completeness

- Only public repos are indexed, regardless of the token's access.
- Forks without explicit category Topics are ignored. Add `category-*` to deliberately include one.
- Category topics on private repos are still **publicly visible as Topic names** on GitHub even though the repository itself is private, so don't use sensitive labels.
- The site excludes `LonzilFox` and `LonzilFox.github.io` from its project cards.
- The API is paginated at 100 repos/page (up to 30 pages); never relies on a hardcoded repository list.
