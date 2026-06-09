# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static marketing website for **此食此客Saas运营管理平台** — an unattended vending machine SaaS operation platform. The site covers product introduction, platform capabilities, merchant onboarding, settlement flow, legal policies, and contact info. All content is in Simplified Chinese (zh-CN).

## Development

No build tools, package manager, or server required. Open any HTML file directly in a browser, or serve locally with any static file server, e.g.:

```
python -m http.server 8080
```

## Architecture

The site is a flat collection of static files with a shared header/footer pattern:

- `index.html` — single-page layout with anchor-linked sections: `#products`, `#platform`, `#merchant`, `#settlement`, `#contact`
- `terms.html`, `privacy.html`, `refund.html`, `merchant-agreement.html` — legal/policy pages sharing the same header and `.policy-article` layout
- `assets/css/style.css` — single stylesheet for the entire site; all design tokens are CSS variables defined in `:root`
- `assets/js/main.js` — minimal JS; handles the merchant onboarding form (`#merchantForm`), which saves submissions to `localStorage` (no backend)
- `assets/images/` — static images referenced by CSS background-url

### CSS Design Tokens

All colors, radius, and shadow are defined as CSS variables at the top of `style.css`:

```css
--primary: #0f766e   /* teal brand color */
--ink: #172033       /* body text */
--muted: #647082     /* secondary text */
--line: #dbe4e7      /* borders */
--surface: #ffffff
--bg: #f7faf9
```

### Responsive Breakpoints

- `≤980px`: stacked header, single-column layouts (split-layout, merchant-layout, footer)
- `≤640px`: single-column form, stacked buttons/metrics, reduced font sizes

### Form Behavior

The merchant form (`#merchantForm` in `index.html`) prevents default submission, serializes fields into an object with a `submittedAt` timestamp, prepends it to a `merchantApplications` array in `localStorage`, and caps the stored list at 20 entries.

## Contact Info

Published in `index.html`:
- Customer service phone: `18049450179`
- Business email: `office@zyktech.com`
- Office address: `陕西省西安市高新区天谷六路789号大华股份西安数智产业园8号楼505室`

## Placeholder Content to Replace

Before going live, update the following in `index.html`:
- ICP filing number: `备案号请替换为实际备案信息`
