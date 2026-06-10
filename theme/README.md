# bgporter.net — Pelican theme

A modern-technical refresh. **IBM Plex Sans** for text, **Fira Code** (ligatures on)
for code, a restrained blue accent, and a **muted, low-contrast syntax palette**.
Respects the reader's OS light/dark preference with a manual toggle that persists.
Long code lines **scroll horizontally by default** (with a soft edge-fade hint) so
they never stretch the page; any block can opt into soft-wrap instead.

## Install

```bash
# put this folder somewhere, then in pelicanconf.py:
THEME = "/path/to/theme"
```

Rebuild: `pelican content -s pelicanconf.py` (or `make html` / `invoke build`).

## Recommended settings (`pelicanconf.py`)

```python
THEME = "theme"

# Markdown + Pygments-classed code (required for syntax colors)
MARKDOWN = {
    "extension_configs": {
        "markdown.extensions.codehilite": {"css_class": "highlight"},
        "markdown.extensions.extra": {},
        "markdown.extensions.toc": {},
    },
    "output_format": "html5",
}

# Menu / nav
DISPLAY_PAGES_ON_MENU = True
MENUITEMS = [
    ("Home", "/"),
    ("About", "/pages/about.html"),
    ("now", "/pages/now.html"),
    ("History", "/pages/site-changelog.html"),
]

# Feeds (Atom shown in footer + <head>)
FEED_ALL_ATOM = "feeds/all.atom.xml"

# Dates
DEFAULT_DATE_FORMAT = "%d %b %Y"
DEFAULT_PAGINATION = 10
```

> Code colors come from Pygments **classes**, not inline styles, so keep
> `codehilite` with `css_class: "highlight"` (or `codehilite`). Do **not** set
> `PYGMENTS_STYLE` to an inline style — this theme ships its own `pygments.css`.

## Article metadata this theme uses

All optional except the usual title/date/category.

| Field | Example | Effect |
|---|---|---|
| `Subtitle:` | `Following the Uniform Access Principle…` | shown under the title and as the homepage summary line |
| `Summary:` | `Wow, that was an overstuffed year.` | homepage summary line (falls back to auto-summary) |
| `Image:` | `/images/philly/ar-snow.png` | thumbnail on the homepage row + OG/social image |
| `Tags:` | `cello, juce, programming` | shown in the meta line as `#tag` |

`Image` is read as the article attribute `article.image` (Pelican lower-cases
custom metadata) and is expected to be a site-root-absolute path beginning with
`/` — the templates output `{{ SITEURL }}{{ article.image }}`. It is used for the
listing thumbnail and the `og:image` tag; it is **not** inserted as a hero on the
article page (your post body places its own images).

### Reading time

The meta line shows `~N min read` **if** `article.reading_time` exists. Enable it
with the [`pelican-readtime`](https://github.com/JenkinsDev/pelican-readtime)
plugin (or any plugin that sets `reading_time`). Without it, the field is hidden —
nothing breaks.

## Changelog / history pages

If you publish page-history pages (slugs containing `changelog`, e.g.
`site-changelog`, `now_changelog`) the theme styles them automatically:

- The **site index** is a wide table — it gets zebra rows, monospace
  date/word-count columns, and wraps in a horizontal-scroll container so it
  never breaks the layout on narrow screens.
- **Per-page history** renders each revision as a monospace timestamp heading
  (with a divider), a muted "Changes (words)" line, and the diff itself.
- Diffs are natural-language prose, so on `*changelog` pages the diff blocks
  **soft-wrap** (instead of horizontal-scrolling like source code), and
  `<del>` / `<ins>` markers are shown as struck-through red / highlighted green.

No metadata needed — detection is by slug. Diff blocks come through as plain
`<pre>` (or `<del>`/`<ins>` inline), all of which are now styled in both light
and dark.

## Long-line code behavior

- **Default:** horizontal scroll. The block keeps its exact shape; a soft fade
  appears on the right when there's more to see; swipe/scroll sideways.
- **Soft-wrap a single block:** add the class `wrap` to the generated
  `<div class="highlight">`. The easiest way in Markdown is a wrapping div, e.g.

  ```markdown
  <div class="highlight wrap" markdown="1">
  ​```cpp
  // this block soft-wraps instead of scrolling
  ​```
  </div>
  ```

  (or post-process in a plugin). Wrapped continuation lines hang-indent so
  structure stays readable.
- A **copy** button and the fade are added by `theme.js` automatically.

## Dark mode

Follows `prefers-color-scheme` out of the box. The header toggle flips it and
stores the choice in `localStorage` (`bgp-theme`); clearing the choice (toggling
back to your OS default) resumes following the OS. An inline script in `<head>`
applies the saved choice before first paint, so there's no flash.

## Files

```
theme/
  templates/   base, index, article, page, archives, period_archives,
               categories, category, tags, tag, authors, author, 404, macros
  static/
    css/theme.css      layout + type + light/dark tokens
    css/pygments.css   muted syntax + code-block chrome (uses the tokens)
    js/theme.js        theme toggle + copy buttons + overflow fade
```

A static `preview/` folder (homepage + article) is included so you can see the
theme without building — open `preview/index.html`.
