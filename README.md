# ProzentRechner

A percentage calculator that runs in the browser. The interface is available in Deutsch, English, Français, Español, Italiano, Polski, Nederlands, and Türkçe.

The language follows `?lang=` in the address, then the last choice saved in this browser, then the browser language.

## Calculations

1. **Percent of** — 15% of 200 is 30.
2. **Share** — 30 is 15% of 200.
3. **Change** — from 80 to 100 is an increase of 25%.
4. **Add / subtract** — 200 increased by 15% is 230.

Either `,` or `.` is accepted as the decimal mark. A repeated separator is treated as a thousands separator (`1.234.567` or `1,234,567`). Results are formatted for the selected language. The formula is shown under the answer.

Percentage change uses `(new − old) ÷ old × 100`. When the starting value is 0, the calculator reports that it cannot divide by zero.

## Run it locally

From the repository root:

```bash
python -m http.server 4173 --directory site
```

Then open http://127.0.0.1:4173/

## Publish on GitHub Pages

The site is the `site/` folder: HTML, CSS, and JavaScript, with no build step. `.github/workflows/pages.yml` publishes that folder on every push to `main`.

1. Push this repository to GitHub. The workflow listens to the `main` branch.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Do not also turn on **Deploy from a branch**. Pages would then publish two builds, and the branch path runs the files through Jekyll.
5. Push to `main`, or run **Deploy GitHub Pages** from the Actions tab.

The site is served at `https://<owner>.github.io/ProzentRechner/`.

`site/.nojekyll` is in the published folder so a branch deploy cannot send these files through Jekyll.

## Layout

- `site/index.html` — page
- `site/styles.css` — layout
- `site/calc.js` — parsing and the four formulas
- `site/i18n.js` — translations
- `site/app.js` — interface
- `.github/workflows/pages.yml` — Pages deploy
