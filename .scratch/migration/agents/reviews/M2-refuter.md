# Step M2 refuter report (on .agents/worktrees/m2, base 209112cd)

## Verification (rerun by the reviewer)
- `npm test` (from tools/oculus), first run: `Test Files 1 failed | 228 passed (229)`, `Tests 1 failed | 3806 passed (3807)`. The failure was `tests/server/hpc/ssh.test.ts:95` "Matcher did not succeed in time" (a 20 s timeout, with other shells running at the same time). Rerunning `npx vitest run tests/server/hpc/ssh.test.ts tests/integrity.test.ts` gave `Test Files 2 passed (2)`, `Tests 13 passed (13)`. A second full `npm test` gave `Test Files 229 passed (229)`, `Tests 3807 passed (3807)`. The ssh file is not touched by the diff.
- `npm run check`: `COMPLETED 1156 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, exit 0.
- `npm run build`: exit 0, `✓ built in 4.88s`, `✔ done`.
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0.
- The perl ASCII gate over `src tests bin config`: prints nothing.
- `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: `970 tests/state/layout.test.ts`, `979 tests/state/board.test.ts`, `153365 total`.
- `python3 tools/cockpit/build.py --selftest`: `✅ SELFTEST PASS`, exit 0.
- `python3 tools/cockpit/build.py --dummy`: `built the example -> dummy/cockpit.html`, exit 0.
- `bash tools/cockpit/tests/run.sh`: exit 1. The only failure is `test_presentation.py` line 12, `ModuleNotFoundError: No module named 'deck_config'`. That module is `tools/present/deck_config.py`, which exists in the main checkout and is absent from this sparse worktree. `test_engine` PASS, the three other suites print `OK` (29, 24 and 19 tests), the JS test prints `PASS - 11 modules load in order, 20/20 window.CK exports present`. Not a finding of this step.
- The `yaml.safe_load` one-liner over the four files: prints nothing, exit 0.
- Brief premises: `python3` over `yaml.safe_load` finds venues 70 entries and 13 words, and data 54 entries and 11 words, with exactly the counts the brief gives. The demo registries carry no `themes` and no `theme_labels`.
- Report evidence:
  - The integrity test reads the worktree root as the hub (`loadLocal` default `resolve(engine, '..', '..')`, `src/lib/data/sources/config.ts:124`; there is no `config/local.yml`), and it passes.
  - After `config.init([])`, the cockpit's `DATA_THEME_LABELS` equals the removed `theme_labels` map (11 rows, `True`).
  - The oculus and cockpit `data_themes` lists are equal.
  - `validate.ts:661`, `guards.ts:65` and `sources/registries.ts:111-115` say what the report says.
  - `validate.ts` is 664 lines, `normalise.ts` 839, `validate.test.ts` 747.
  - The report's grep for `themeLabels|theme_labels` is reproduced: nothing outside the cockpit's `data_themes` read.
- `git status --short` after all runs is the same 33 paths as before.

## 1. Spec
- `tools/oculus/DESIGN.md:310` (a line the diff does not touch) still ends "a research line is a pillar everywhere (M1); theme words are domain keys (M2); compute is `resources.yml` (M3)". That is the withdrawn mapping. The new decision line at `DESIGN.md:324` says the opposite, and nothing marks the older clause as reversed. The brief's "What is on the tree" does not list this line, and the builder's grep did not look for it: the named greps do not match "domain keys". The spec says a sentence in a document that the change makes false is a defect of the change.
- Otherwise none. Items 1 to 5 match the brief:
  - row order and labels;
  - finding file, key and message;
  - one helper;
  - `configMap()` reads in both views;
  - the two registry hunks alone;
  - the cockpit reading `data_themes` through `_build`.

  One change no item asks for: `config/text/views/config.yml` `desc_vocab`. It is required by `tests/views/help.test.ts:123` ("describes every configuration file in the words the Config view shows"), and the report states it.

## 2. Proof
- **`tests/views/venues.test.ts`, "holds a switched-off facet by its word, not its label".** The report names the revert "red if `off` is matched against labels". It does not turn red:
  - On a copy under the scratchpad, `src/lib/views/venues/Facets.svelte` `active={!off.includes(facet.theme)}` changed to `facet.label` gave `Tests 14 passed (14)`.
  - `ontoggle(facet.theme)` changed to `ontoggle(facet.label)` also gave `14 passed`.

  The test goes red only when the label is not drawn at all: `Venues.svelte` passing no labels, or `Facets.svelte` drawing `facet.theme`. The filtering it asserts is the existing `applyThemeFacets` over `held.off`. The "by its word, not its label" half is therefore not covered in the node suite. That the toggle keeps the word needs a press, which is the browser suite's job.
- **The report's limitation "searching 'Core ML' does not find `core-ml`" is false.** `venueSearch` (`src/lib/state/venues.ts:148-158`) splits on whitespace, lowercases, and substring-matches against a haystack that includes the theme words. A probe test on the copy passed all three cases: `venueSearch(v, 'Core ML')` returns the `core-ml` venue, `'CS'` finds `cs`, and `'High-end'` finds `high-end`. Every one of the thirteen venue labels, lowercased and split on spaces, is a substring of its word.
- **The other named reverts turn red as the report says** (each run on the copy):
  - `VenueCard` drawing `theme`: 2 failed.
  - `Data.svelte` passing no labels: 2 failed.
  - `data/Facets.svelte` drawing `facet.theme`: 2 failed.
  - The `checkThemes` call removed: 5 failed.
  - The four `index.ts` lines removed: 1 failed.
  - The `length > 0` guards removed: 1 failed.
  - The `allowed === undefined` guard removed: 1 failed.
  - The `labels.has` guard removed: 1 failed.
  - `state/venues.ts` `label: theme`: 1 failed.
  - The finding key hardcoded to `entries[`: 3 failed.
- None found of the following: a test asserting a defect, a loosened threshold, a check passed by exempting, or module-level mutable state (`THEMED` in `validate-themes.ts:15` is a readonly `as const` literal).

## 3. Standards
- `DESIGN.md:310`: see Spec. The sentence is now false against `DESIGN.md:324`.
- `src/lib/data/validate-themes.ts:3`, head comment: "A word off its list is a facet and a tag drawn under a word no label names". A dataset word draws no tag: the Data view's cards draw no themes (`grep themes src/lib/views/data` finds only the facets). This is true of venues only.
- `src/lib/state/datasets.ts:8` and `src/lib/state/venues.ts:7` now declare the identical `ThemeFacet = { theme; label; count }`. The two `themeFacets` bodies (`datasets.ts:39-50`, `venues.ts:59-67`) differ only in the entity type. The diff made them identical: before, the venue version had no label. The brief named both functions, so this is not a deviation from the brief, but the spec's "a fold exists once" now reads against it.
- No non-ASCII in added lines. No history in the new comments. No file at or over 1000 lines. The new modules carry layer head comments. The greps for `themeLabels`, `theme_labels`, `venue_themes`, `data_themes`, `themeFacets` and `ThemeFacet` over `src tests config HELP.md DESIGN.md README.md demo ../../registries ../cockpit/{src,data,tests,dummy,*.md}` show no other stale hit. `README.md` and `HELP.md` carry no sentence about the venue or data facets that the change falsifies.

## 4. Behaviour
- **Venues view.** The report does not state these changes with a before and after:
  - The facet buttons were `core-ml 29`, `clinical 28`, ... and are now `Core ML 29`, `Clinical 28`, ...
  - Each card's theme tags were the raw word and are now the label.

  The brief's "What it must do" implies it; the report's item 3 row lists the mechanism only. What the reader sees agrees with what they can do: typing a label into the Venues search finds the venues (see Proof), and toggles act on the word.
- **Venue entry form.** The `themes` field is still a free tags input showing raw words (`core-ml`), while the card beside it shows `Core ML`. This is booked by the brief's decision 4, and the report lists it.
- **Data view.** The facet labels are unchanged (config rows equal the removed map). The Data search does not match theme words or labels, as before.
- **Stale `theme_labels:` not reported (unreported).** A hub whose `data.yml` still carries `theme_labels:` now has it ignored with no finding: `validate.ts` checks no registry top-level key other than `schema`, see `validate.ts:393,412`.
- **Theme lists belong to the engine (unreported).** The words are checked against the engine's `config/vocab.yml` rather than the hub's own file. A different hub with its own theme words gets one finding per use. This follows DESIGN's configuration split; the demo hub has no themes, so it stays clean.

## Not checked
- The Playwright browser suite, not run as instructed. I did read the grep of `tests/browser` for venue, theme, facet and clinical: no spec selects a theme facet or tag by text (`nested.spec.ts:176` only opens the view).
- The rendered cockpit Data tab HTML on the real hub: only `DATA_THEME_LABELS` and the `tlabels = DATA_THEME_LABELS` source line were checked.
- The first-load window before the `config` channel arrives, when `configMap()` is `{}` and facets would show raw words. Not observed; it is the same mechanism `Pillars.svelte:77` uses.

Reviewer usage: about 33 tool uses, about 15 minutes.
