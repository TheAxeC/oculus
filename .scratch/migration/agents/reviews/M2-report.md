Not everything passes. `bash tools/cockpit/tests/run.sh` exits 1 because `tools/cockpit/tests/test_presentation.py` fails at line 12 with `ModuleNotFoundError: No module named 'deck_config'`. That module lives in `tools/present`, and this worktree's sparse checkout leaves that folder out: `git sparse-checkout list` names only applications, education, feeds, funding, network, projects, registries, tasks, tools/cockpit and tools/oculus. The import fails before the test loads any cockpit module, so this change does not cause it, but I could not show the test passing. The other five Python test files and the JS module test pass (per-file exit codes below). Everything else in the brief is done.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 Vocabulary: `venue_themes` (13) and `data_themes` (11) after `venue_tiers` in `config/vocab.yml` | DONE | A `python3` probe with `yaml.safe_load` shows the rows. Counts in the worktree registries match the brief: venues 70 entries, 13 words; data 54 entries, 11 words. Data labels match HEAD's `theme_labels` byte for byte. `HELP.md:157`, `DESIGN.md:47` and the `DESIGN.md:122` paragraph name the theme words. `config/text/views/config.yml` `desc_vocab` changed too, because `tests/views/help.test.ts` requires the manual and the Config view to use the same words. |
| 2 Finding | DONE | `Vocabulary.venueThemes` / `dataThemes` (`model.ts`), filled in `portfolioConfigFrom` (`index.ts:131-134`). `checkThemes` in the new `src/lib/data/validate-themes.ts`, called from `validate` (`validate.ts:661`). The Validate paragraph and a dated decision line are in `DESIGN.md`; the layout list gains the new file. On the real hub (worktree copy): `npx vitest run tests/integrity.test.ts --reporter=verbose` gives "validates with no findings" passing, with 70 venues and 54 datasets. A node probe that cut `method` and `mammography` from the lists gave exactly 3 findings: `entries[68].themes[0]`, `entries[69].themes[0]`, `datasets[21].themes[0]`. |
| 3 Labels from config | DONE | `Collection.themeLabels` and its read in `normalise.ts` are gone. The new helper is `src/lib/state/themes.ts` (`themeWordLabels(rows)` returns a Map; `themeWordLabel(labels, word)` falls back to the word). Both `themeFacets` take the labels. `Data.svelte` and `Venues.svelte` read `configMap().data_themes` / `.venue_themes`. `venues/Facets.svelte` draws `facet.label`. `VenueCard.svelte` draws `themeWordLabel(labels, theme)`. Toggles and `off` keep the word. |
| 4 Hub files | DONE | `git diff -- registries/data.yml registries/venues.yml` is quoted below; it shows those hunks alone. |
| 5 Cockpit | DONE | `data/config/vocab.yml` gains `data_themes`. `config.py` `_build` builds `DATA_THEME_LABELS` (added to `_DERIVED`). `render/collections.py` uses it in place of `data.get("theme_labels")`. Rendering `datasets_tab_html` on the worktree hub gives the same 11 labels and counts (Single-cell 12, EEG 9, MRI imaging 8, BCI / ECoG 6, ECG 5, Survival (tabular) 5, Clinical EHR 4, PDE operator 3, CT imaging 1, Mammography 1, Simulated (copula) 1). |
| Test 1 validate | DONE | `tests/data/validate.test.ts`, new describe block with 7 cases: venue word off list, dataset word off list (file, key, message), words on list and each word checked against its own list, lists absent, two bad words at indexes 0 and 2, `constructor`/`__proto__` and a duplicated bad word, non-list and non-string values. Turns red if: the `checkThemes` call is removed from `validate.ts`; the `known.has` test is dropped; the `allowed === undefined` guard is dropped; the `Array.isArray` or string guard is dropped. |
| Test 2 portfolioConfigFrom | DONE | `tests/config-folder.test.ts` "reads the venue and dataset theme words..." and "leaves the theme lists absent...". Red if the four lines in `index.ts` are removed, or the `length > 0` guard is dropped. |
| Test 3 label helper | DONE | New `tests/state/themes.test.ts`: word with a row, word without, empty/absent/non-list, duplicate key (first wins), malformed rows, prototype names. Red if the `labels.has` guard is removed, if the Map becomes a plain object, or if `?? word` is removed. |
| Test 4 themeFacets and views | DONE | `tests/state/datasets.test.ts` and `tests/state/venues.test.ts` (red if the label goes back to the word). `tests/views/data.test.ts` "draws a facet under its label" (red if `Data.svelte` passes no labels). `tests/views/venues.test.ts`: facet label test (red if `Venues.svelte` passes no labels or `Facets.svelte` draws `facet.theme`); card tag test `>Systems</span>` (red if `VenueCard` draws `theme`); "holds a switched-off facet by its word" (red if `off` is matched against labels). The existing journal card assertions now expect `>Clinical</span>`. |
| Test 5 removals | DONE | The `theme_labels`/`themeLabels` lines are removed from `collections.test.ts`, `registries.test.ts`, `normalise.test.ts` and `views/data.test.ts`. `config-folder.test.ts` EXPECTED names `venue_themes` and `data_themes` (red if either key leaves `vocab.yml`). The orphan-key test in `tests/keys.test.ts` passes. No text keys were added. |
| Test 6 browser selectors | DONE (read; not run) | I read `grep -rn 'data-\|locator(\|getByRole' tests/browser`. No spec finds a venue or data facet or theme tag by its text. The only venue hit is `nested.spec.ts:176` (`openView(page, 'venues', ...)`), and the board specs' `.tag .label` lines are dataset keys and pillars, not themes. No spec changed. The orchestrator runs the suite. |
| Test 7 reverts | DONE | Named in each row above. |

## Verify commands (run from `tools/oculus` in the worktree unless noted)
1. `npx vitest run --reporter=dot`: `Test Files 229 passed (229)`, `Tests 3807 passed (3807)`.
2. `npm run check`: exit 0, `COMPLETED 1156 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
3. `npm run build`: exit 0, `built in 3.86s`, `done`.
4. `npm run format:check`: exit 0, `All matched files use Prettier code style!`.
5. `npm run lint`: exit 0.
6. The perl ASCII gate prints nothing. A grep of the added lines of the whole diff plus the three new files also prints nothing. The cockpit vocab.yml and `registries/venues.yml` hold older cockpit glyphs on lines this change does not touch.
7. `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: `970 tests/state/layout.test.ts`, `979 tests/state/board.test.ts`, `153365 total`.
8. From the worktree root: `python3 tools/cockpit/build.py --selftest` exits 0 with `SELFTEST PASS`. `python3 tools/cockpit/build.py --dummy` exits 0 with `built the example -> dummy/cockpit.html`. `bash tools/cockpit/tests/run.sh` exits 1 (NOT PASSING). Per file: test_engine 0, test_pillars_tab 0, test_presentation 1 (`deck_config` missing, sparse checkout), test_sessions 0, test_sessions_group 0, test_sessions_git 0; JS: `PASS - 11 modules load in order`.
9. The `yaml.safe_load` one-liner prints nothing and exits 0.

## Greps
`grep -rn 'themeLabels\|theme_labels' src tests config HELP.md DESIGN.md README.md demo ../../registries ../cockpit/src ../cockpit/data` prints nothing (exit 1). The cockpit reads the labels as `DATA_THEME_LABELS` from `data_themes`.

`git diff -- registries/data.yml registries/venues.yml`:
```
@@ -25,28 +25,12 @@ intro: >
-# Pretty display labels for the Modality facet buttons (Data tab). Keys = the `themes:` values used on the
-# datasets below; this only renames the BUTTON - the data-facet token stays the key, so matching is unchanged.
-# Add a line whenever you introduce a new `themes:` value.
-theme_labels:
-  single-cell:      Single-cell
-  survival-tabular: Survival (tabular)
-  ecg:              ECG
-  mri-imaging:      MRI imaging
-  ct-imaging:       CT imaging
-  pde-operator:     PDE operator
-  clinical-ehr:     Clinical EHR
-  bci-ecog:         BCI / ECoG
-  eeg:              EEG
-  mammography:      Mammography
-  simulated-copula: Simulated (copula)
-
-  - { field: themes,      type: tags,     help: "Modality theme keys (facet filter)" }
+  - { field: themes,      type: tags,     help: "Modality theme keys (facet filter), listed in config/vocab.yml data_themes" }
--- registries/venues.yml @@ -24,7 +24,7 @@
-  - { field: themes,         type: tags }
+  - { field: themes,         type: tags,     help: "Theme words, listed in config/vocab.yml venue_themes" }
```

## Files changed (added / removed lines from `git diff --numstat`)
- Hub and cockpit: `registries/data.yml` 1/17; `registries/venues.yml` 1/1; `tools/cockpit/data/config/vocab.yml` 14/0; `tools/cockpit/src/cockpit/config.py` 9/1; `tools/cockpit/src/cockpit/render/collections.py` 4/4.
- oculus docs and config: `DESIGN.md` 5/3; `HELP.md` 1/1; `config/text/views/config.yml` 1/1; `config/vocab.yml` 30/0.
- oculus source: `src/lib/data/index.ts` 4/0; `model-collections.ts` 0/2; `model.ts` 7/0; `normalise.ts` 0/8; `validate.ts` 2/0; `state/datasets.ts` 7/3; `state/venues.ts` 8/4; `views/Data.svelte` 3/1; `views/Venues.svelte` 5/1; `views/data/Facets.svelte` 1/1; `views/venues/Facets.svelte` 4/3; `views/venues/VenueCard.svelte` 16/3.
- oculus tests: `config-folder.test.ts` 52/0; `data/collections.test.ts` 0/2; `data/normalise.test.ts` 0/2; `data/registries.test.ts` 0/2; `data/validate.test.ts` 90/0; `state/datasets.test.ts` 12/2; `state/venues.test.ts` 15/5; `views/data.test.ts` 17/1; `views/venues.test.ts` 45/2.
- New files: `src/lib/data/validate-themes.ts` 43 lines; `src/lib/state/themes.ts` 29; `tests/state/themes.test.ts` 59.
- File sizes now: `validate.ts` 664, `normalise.ts` 839, `validate.test.ts` 747.

## Decisions the orchestrator may reverse
1. The theme check has its own module, `src/lib/data/validate-themes.ts`, even though `validate.ts` would have been about 695 lines with it inline.
2. A theme list that is present but empty, or has no row with a string key, counts as absent: nothing is checked, as with `chips` and `lanes`.
3. The helper's names are `themeWordLabels`, `themeWordLabel` and the type `ThemeWordLabels`, in `src/lib/state/themes.ts`. It returns a Map, so a word like `constructor` or `__proto__` never picks up a label it was not given; the first row of a duplicated key wins.
4. `VenueCard` takes the labels as a required `labels` prop from `Venues.svelte`, which reads `configMap()` once; the card does not read the config itself.
5. The existing handling of a malformed `themes` value, which the check leaves alone: `strings()` in `guards.ts:65` returns `[]` for a non-list and drops non-string items, with no finding anywhere. `checkThemes` skips the same values.
6. The data.yml help text keeps its old wording and appends ", listed in config/vocab.yml data_themes".
7. The cockpit gets its labels through a new `DATA_THEME_LABELS` value built in `config.py` `_build`. The dummy vocab.yml gets no `data_themes`; the dummy registries carry no `themes`, so the dummy build shows nothing different.
8. Each list's comment in `vocab.yml` is one line, following the one-line-per-paragraph rule; the file is excluded from Prettier.

## Limitations
- In a theme finding, `entries[i]` / `datasets[i]` is the position in the list the reader kept. `sources/registries.ts:111-115` drops an item that is not a map, so if such an item comes before a themed entry, the index is off from the file's position. That item already raises its own finding. `checkPeople` has the same behaviour. Not fixed.
- Venue search (`venueSearch` in `state/venues.ts`) still matches the raw words, not the labels, so searching "Core ML" does not find `core-ml`.
- Both registry help strings point to `config/vocab.yml`, which means oculus's copy. The cockpit's own vocab.yml has `data_themes` but no `venue_themes`, as the brief says.
- The entry form's `themes` field is still a free tags input, per the brief's decision 4.
- The cockpit commands wrote gitignored files inside the worktree: `tools/cockpit/cockpit.local.yml`, `tools/cockpit/AUDIT_AUTO.md`, `tools/cockpit/dummy/AUDIT_AUTO.md`, `tools/cockpit/dummy/cockpit.html` and `__pycache__` folders.
- I did not run the browser suite.

Nothing in the brief was wrong: its line numbers, counts, file paths and the `theme_labels` block all matched the tree.
