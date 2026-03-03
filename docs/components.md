# Components Style Guide

## ProjectCard

Use `renderProjectCard(project)` in `scripts/site.js` as the single source of truth for Selected Projects cards.

### Required structure

```html
<a class="project-card [variant-class]" href="..." target="_blank" rel="noopener">
  <div class="project-thumb-wrap [thumb-class]">
    <img class="project-thumb" src="..." alt="...">
  </div>
  <div class="project-meta">
    <div class="project-company">...</div>
    <div class="project-title">...</div>
    <!-- subtitle/impact block -->
    <div class="project-tags" aria-label="Project tags">...</div>
  </div>
</a>
```

### Data contract (`projects` array)

- `company`
- `title`
- `subtitle`
- `impact` (optional)
- `link`
- `imageSrc`
- `imageAlt`
- `tags` (array)
- `cardClass` (optional)
- `thumbClass` (required for hover accent behavior)
- `subtitleClass` (optional)

## ImpactBlock

Use `renderImpactBlock({ subtitle, impact, subtitleClass })`.

- If `impact` is missing: render a plain `project-subtitle` paragraph.
- If `impact` exists: render a shared impact variant block.

### Shared impact variant classes

- Card variant: `project-card--with-impact`
- Subtitle variant: `project-subtitle--with-impact`

### Impact visual spec

- Left accent: `2px solid #AB1F26`
- Left padding: `12px`
- Top spacing from subtitle: `16px`
- Tags spacing after impact subtitle: `18px`
- Accent line under card meta aligns on shared track (`.project-meta::after { bottom: -12px; }`)

## Guardrails

- Do not hand-edit project card HTML in `index.html`.
- Add/edit cards only in the `projects` data array.
- Reuse `project-card--with-impact` + `project-subtitle--with-impact` for all impact cards.
- Avoid per-card CSS overrides unless a documented exception is required.
