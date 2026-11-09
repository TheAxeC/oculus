# O178 repair round 1

Rules: `.scratch/migration/agents/spec.md`, as for the step. The brief `agents/briefs/O178.md` stays in force. The review is `.scratch/migration/agents/reviews/O178-refuter.md`, also in the worktree's ledger at the same path. You write only in the oculus worktree; this round changes nothing in the hub worktree. Besides the brief's write list, this round writes the files it names.

## 1. The button while no section is set (Behaviour B1)

`src/lib/state/sessions/source/website.svelte.ts`, `off()`: with the person known and the folder set, return `t('career.website_no_cv_sections')` when the setting holds no CV section, so the button is disabled with that sentence as its tip, as an empty folder does. The refusal of a press in `runs/website.ts` stays.

## 2. The audit offers no action that is refused (Behaviour B2)

`src/lib/server/content/audit/publications.ts`, the finding that a file differs: it carries `action: 'website'` only while `check.setting.cvSections` holds a section. Add one row to the describe 'the website of the audit' in `tests/routes/docs/audit.test.ts`: over a hub with a website folder and no CV section, no finding carries the action `website`.

## 3. A second refused row gets its own finding (Behaviour B5)

`src/lib/data/sources/config/catalogs.ts`, the `once` key in the flatMap: for `problem.where === 'row'` it also holds `JSON.stringify(problem.issue)`, so two refused rows of one setting are two findings. Add a row beside the existing rows of the refused row in `tests/data/hubs/website-files.test.ts` only if a row there already reads the catalog's findings; otherwise quote a run in the report.

## 4. Sentences (Standards ST1, ST2, ST3)

- ST1, `docs/templates.md:325-328`: say that in an employer CV the period is the period text in the same field the row's `period` picks, and that a supervision entry's student is always in `duration`.
- ST2, the help of `website.cv_sections` in `config/options/behavior.yml` and the same sentence in `docs/templates.md`: a key must start with a lower-case letter and hold only lower-case letters, digits, `_` and `-`, and must not be `personal`. State the pattern the code holds.
- ST3, `tests/data/hubs/website-files.test.ts:566`: retitle the row so that it names no earlier state. Update the title wherever `agents/guarded.md` would name it; you do not edit the ledger, so name that line in the report.

## 5. A publication's `cv_hide` (ruling 740)

`cv_hide` on a manifest's `publication:` is written to the entry of `_data/publications.yml` exactly as `hide` is, true and false alike, and absent when the manifest holds none.

- `src/lib/data/model/model-entities.ts:248`: `cv_hide?: boolean;` after `hide?: boolean;` of `Publication`.
- `src/lib/data/snapshot/normalise-parts/publication.ts:61`: `cv_hide: field(z.boolean(), map.cv_hide),` after the `hide` line of `publication()`.
- `src/lib/server/content/audit/website/papers.ts:104`: `put('cv_hide', held.cv_hide);` after `put('hide', held.hide);`.
- `config/schemas/manifest-schema.yml:112`: after the `publication.hide` row, `"publication.cv_hide": { label: "Hidden on the CV", type: checkbox, section: Website, help: "Tick to keep the paper off the CV while it stays in the file; the website writes the value as it is held." }`.
- `docs/data-map.md:372`: `cv_hide` after `hide` in the `publication.*` list. This is the only line of that file this round writes.
- `docs/templates.md:1005`: after the `hide` line of the `publication:` block, `#   cv_hide: false      # kept off the CV while it stays on the website`.
- `tests/data/hubs/website-files.test.ts`: one row beside 'hide is written through, true and false alike' (line 526) for `cv_hide`, true, false and absent. The file stands at 872 lines and may reach 880; the manifests of the row go in `tests/fixtures/hubs/website-hub.ts`.

Give the first run of the new rows on the tree before this round's code change, as the brief's report shape asks.

## Left as built

- Spec S1: the fixture file stands; the review finds the split needed.
- Spec S2: `agents/guarded.md` G140 is extended by the orchestrator.
- Behaviour B3: `record_fields` left out and empty draw alike; the help states both meanings, and the look at landing judges the drawing.
- Behaviour B4: follows the brief.
- The red rows of `tests/server/edit/config-key.test.ts`: not this round's; they are handled at landing.

## Verify before you report

The brief's "Verify before you report", once after the last change, with `TMPDIR` unset for npm commands, its four-file vitest line run with `tests/data/hubs/website-files.test.ts` covering sections 3 and 5 and `tests/routes/docs/audit.test.ts` covering section 2. The ASCII check runs over every file this round changes. Rewrite the report whole for the state after this round, at the same path in the worktree's ledger, with a section "Repair round 1": what changed, the first run of the new rows, and the verify lines. No git command that writes.
