# Repository Guidelines

## Project Structure & Module Organization
This repository is a Jekyll-based GitHub Pages site. Core site settings live in `_config.yml`, with shared templates in `_layouts/` and reusable partials in `_includes/`. Blog posts go in `_posts/` using the `YYYY-MM-DD-title.md` pattern, standalone pages live in `pages/`, and wiki content is stored in `_wiki/`. Structured content for links and profile data belongs in `_data/`. Frontend assets are split across `assets/css/`, `assets/js/`, and `assets/images/`; third-party libraries under `assets/vendor/` should usually be treated as vendored code, not hand-edited.

## Build, Test, and Development Commands
Install dependencies with `bundle install`. Run the site locally with `bundle exec jekyll serve` and open the local URL Jekyll prints. Create a production build with `bundle exec jekyll build`; this writes the generated site to `_site/`. If you only need to verify configuration changes, `bundle exec jekyll doctor` is the fastest sanity check.

## Coding Style & Naming Conventions
Match the existing style in each file instead of reformatting unrelated code. Use 2-space indentation in YAML, HTML/Liquid, JavaScript, and CSS edits unless the file already differs. Keep Markdown front matter minimal and explicit: `layout`, `title`, `categories`, `description`, and `keywords` are common fields. Name posts with lowercase, hyphen-separated slugs, for example `_posts/2026-03-15-new-post.md`. Prefer small, targeted edits to `_layouts/` and `_includes/` because they affect the whole site.

## Testing Guidelines
There is no automated test suite in this repository. Validate changes by running `bundle exec jekyll build` before opening a PR, then spot-check the affected page types locally: posts, wiki pages, navigation, search, and asset loading. When editing Markdown, confirm front matter parses cleanly and links/images resolve from the generated site.

## Commit & Pull Request Guidelines
Recent history mixes short imperative messages and lightweight prefixes such as `Fix image load failed`, `style: ...`, and `add: ...`. Follow that pattern: keep commits focused, use a concise imperative summary, and add a scope prefix when it clarifies intent. PRs should include a brief description, note any changed pages or data files, and attach screenshots for visible layout changes.

## Security & Configuration Tips
Treat `_config.yml` and `_data/` as production-facing content. Do not commit real secrets, tokens, or environment-specific values. Review external links, analytics IDs, and comment-system settings carefully before merging.
