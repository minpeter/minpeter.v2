# Design System — minpeter.v2

## 0. Research Log

- Existing system: `app/globals.css` and `app/root-document.tsx` establish a restrained field-notes shell, 50rem article body measure, Pretendard for Korean prose, Shippori Mincho for display Latin, Geist Mono for data, semantic HSL color tokens, 4px spacing rhythm, and no decorative shadows in articles.
- Live reference: Ramp Labs, “How Prime-RL post training improves agent speed and accuracy for production workflows,” captured on 2026-07-22 at 1440px and 390px. Runtime evidence lives outside Git at `/home/minpeter/github.com/minpeter/ulwulw-evidence/tiny-ko/ramp-reference-{desktop,mobile}.png` and `ramp-runtime{,-mobile}.json`.
- Reference grammar retained: claim-first hero figure, evidence-first section order, 40px section breaks, 32px figure breathing room, restrained grids, methodological captions, monochrome baselines plus one accent, compact tables, and mobile reflow without horizontal page overflow.
- Reference branding rejected: Ramp navigation, logo, Lausanne font, black-only surface, exact lime, proprietary copy, floating controls, and product CTAs.
- Content inventory: hook (final pretraining points), explain (motivation/version changes), prove (architecture/corpus/training charts), qualify (benchmark limits), retain (later lineage and primary sources).

## 1. Direction

**Laboratory field notes, not a dashboard.** The article should feel like measured evidence placed into the existing quiet editorial surface: paper-like light mode and near-black dark mode, hairline rules, tabular numerals, and one chart accent already supplied by the site's theme. The memorable moment is the first figure: four training runs shown as a sparse, annotated constellation before the prose explains why they differ.

The hierarchy remains native to minpeter.v2. Ramp contributes the order and discipline of evidence, not its brand. Charts stay editorial, not dashboard chrome, but the two training figures may expose small, purposeful interactions: run emphasis for pretraining and checkpoint exploration for SFT.

## 2. Foundations

### Color

Use existing semantic tokens only:

- Page and figure surface: `--background`, `--card`.
- Primary copy: `--foreground`; secondary copy: `--muted-foreground`.
- Rules and grids: `--border` at reduced opacity.
- Primary evidence accent: `--chart-4` in light and dark themes.
- Supporting series: `--chart-1`, `--chart-2`, `--chart-3`, `--chart-5`.
- Focus: `--ring`.

No raw hex/rgb values or post-specific brand colors. Meaning may never rely on color alone: every series has a direct label, shape/dash distinction, or both.

### Typography

- Korean article and captions: Pretendard through the existing Korean article selector.
- Display headings: existing blog heading stack; Korean remains Pretendard with `word-break: keep-all`.
- Data labels, values, steps, and source markers: `--font-geist-mono`.
- Existing sizes are authoritative: 0.6875rem metadata, 0.8125rem captions/data labels, 0.9375rem body, 1.2rem H2, responsive 2–2.75rem title.
- Use regular/medium weight; hierarchy comes from spacing, size, and contrast.

### Spacing and geometry

- Base unit: 4px.
- Reading measure: existing 50rem article body.
- Evidence figures use a 40rem visual measure on viewports that can contain it, centered within the standard article body without changing the parent measure.
- Body rhythm: 16px paragraph cadence, 40px before H2, 32px figure block margins, 12px plot-to-caption gap.
- Corners: existing `--radius` only. Article figures are primarily rules and tonal shifts; no new shadows or glass.

### Motion

Figure interactions are state changes, not decoration. Selection, emphasis, and checkpoint scrubbing may use short opacity/stroke transitions; no scroll effect, autoplay animation, decorative hover, or layout-shifting tooltip. Values remain visible after pointer exit. `prefers-reduced-motion` removes nonessential transitions while preserving state and text readouts.

## 3. Article Layout

1. Existing article header and metadata.
2. Reconstruction note in a native `Callout`.
3. Claim-first pretraining run figure.
4. Lede and motivation.
5. Version chronology.
6. Architecture blueprint.
7. Corpus numbers and source table.
8. Pretraining result interpretation.
9. SFT validation-loss chart.
10. Benchmark table with explicit non-comparability notes.
11. Later lineage timeline.
12. Limitations and primary-source list.

Every figure follows: eyebrow/number → title → visual → persistent selection/readout when interactive → methodological caption → source link. Captions explain metric scope and caveats instead of repeating the visible shapes. Interactive charts keep a textual readout after selection rather than relying on transient tooltips.

## 4. Responsive Rules

- Desktop/tablet: figures stay centered at up to 40rem inside the standard 50rem article body; labels remain direct.
- Mobile (390px-class): figures return to the content width; internal chart layout stacks or reduces tick density; tables use block rows rather than page-level horizontal scrolling.
- The document root must satisfy `scrollWidth === clientWidth`.
- Korean headings, labels, and captions use balanced short phrases and `word-break: keep-all`; long repository identifiers may wrap anywhere.
- SVG uses a stable `viewBox`, `width: 100%`, and descriptive accessible names. Text remains real SVG text, not rasterized.

## 5. Reusable Primitives and States

### EvidenceFigure

An editorial `<figure>` wrapper with number/eyebrow, title, body, optional interaction summary/readout, caption, and source line.

- Default: hairline top rule, transparent background, full text labels.
- Chart grids are a dashed hairline lattice (horizontal and vertical); axis tick labels are muted and end-anchored so they never collide with the plot area.
- One accent color per chart: the focal run or primary series takes the accent; comparison series stay muted foreground.
- Interactive: the chart surface itself is the control — points and checkpoint strips are real focusable targets with persistent selected state; no detached control rows. Selected state is visible without pointer hover and announced through a persistent text readout.
- Dense/table: compact vertical rhythm and tabular values.
- Mobile: no negative page overflow; source URLs wrap.
- Focus/hover: only chart controls that change selected evidence; the figure frame itself stays passive.

### MetricStrip

Three or four headline values separated by rules.

- Values use mono tabular numerals; labels are muted prose.
- Mobile stacks into two columns, then one only if content demands it.

### DotPlot

Sparse semantic SVG with grid, axes, direct point labels, and a legend only when direct labels cannot fit.

- Accent identifies the documented focal run; circles plus text retain meaning without color.
- Interactive run selection may mute nonselected points and update a persistent readout; selection is also keyboard accessible.
- No hover-only tooltip.

### LinePlot

Semantic SVG for the five published SFT checkpoints.

- Validation is the single accent series (dashed); training is the muted comparison series (solid); both carry direct end labels.
- Interactive checkpoint scrubbing may emphasize one checkpoint and update a persistent readout; scrubbing is also keyboard accessible.
- Every point has an accessible textual equivalent in the adjacent data summary/caption.

### EvidenceTable

Semantic table on larger screens; CSS grid/card rows on narrow screens when columns would become illegible.

- Header: muted small labels, no fake sort affordance.
- Body: hairline separators, no zebra striping.
- Emphasis: weight/foreground plus explicit label, never fill alone.

### LineageTimeline

Dated list with a single rule and labeled milestones. It is a narrative index, not a quantitative chart.

## 6. Accessibility Constraints

- WCAG AA contrast through existing theme tokens.
- Static SVG figures have `role="img"`, `aria-labelledby`, a `<title>`, and `<desc>`; interactive charts use `role="group"` with the same naming so their on-chart targets stay in the accessibility tree.
- Quantitative visuals have a prose/table equivalent or enumerate all values in caption/source notes.
- No color-only distinctions, tiny interactive targets, auto-motion, or hidden hover-only content. Interactive chart controls stay keyboard-focusable and expose persistent text state.
- External links keep the route renderer's new-tab behavior and visible focus ring.
- Headings stay hierarchical; figure titles do not create fake document headings.
- Korean line breaking and 200% zoom must not clip labels.

## 7. Accepted Debt

- The article does not reproduce full W&B curves because public, durable evidence exposes final run summaries more reliably than sampled history. It plots only auditable final points and labels the comparison as uncontrolled.
- The post does not add a general chart package. The local SVG primitives are deliberately scoped to this evidence set; extract them globally only after a second article proves reuse.
- Lighthouse auditing remains bounded to this changed article route and one existing article because the repository contains many unrelated static routes.

## 8. Verification Contract

- Fresh desktop and 390px mobile screenshots after the last source edit.
- Browser DOM checks: local `/blog/tiny-ko`, article body present, at least four figures, all SVG accessible names, no horizontal overflow, no console errors.
- Source audit: every plotted value matches `article-evidence.json` and every core source returns HTTP 200.
- Focused component/route checks, TypeScript diagnostics, `pnpm test`, `pnpm check`, and `pnpm build` all pass without skips or suppressions.
- Compare fresh captures against the reference for information hierarchy and figure grammar, not brand pixel identity.
