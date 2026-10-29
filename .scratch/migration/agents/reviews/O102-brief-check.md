# Step O102 brief check (on main at 200fcc680)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O102.md`. Usage: a21c5d23d4cd30493 (claude-opus-5-5), 261287 tokens, 91 tool uses, 14 min 52 s.

The agent ran one `git ls-files` outside the commands it was given, to count folder items; it took the counts again with `ls` and used only those.

## Summary of the agent's findings

- Four premises are false: four website entries match two manifests each by title; 14 matched manifests have no `year`, not 13; at least eight `data.yml` projects already have side-project manifests (`side-projects/finished/`, `side-projects/school/`); no Focus band code reads `situation`.
- Case 1 cannot pass as written: the rules of item 2 give at least ten differences case 2 does not list.
- `npm run test:quick` goes red on `tests/checks/config/templates.test.ts` while `docs/templates.md` is outside the paths.
- Verify 6 asks for `git -C`, which spec.md bans, and the patch recipe would read the hub's `.oculus/local.yml`.
- The `website.cv` run has no approval step and no rule for splitting it into arguments.
- The `order` rule contradicts ruling 539 (2).
- A manifest at a negative stage carrying `publication:` would be published.

## Names

1. `audit.website` (`git grep -n "audit\.website\|website\.kinds\|setting\.website\|\.website\b" -- . ':!config/local.yml' ':!.scratch'`): made false outside the paths at `docs/data-map.md:136-139` (Doc text) and `src/lib/views/system/audit/Audit.svelte:25`; inside the paths and not named: `src/lib/data/helpers/hub-names.ts:761-764` (HUB_LIST, which must gain `website.folder`, `website.cv`, `website.kinds` or the new key is reported unknown by `hub-layer.ts:587-593`), `src/lib/data/shapes/hub-keys.ts:48-51`, `src/lib/data/model/index.ts:362`, `src/lib/data/shapes/catalog-files/vocab.ts:169`, `config/catalogs/vocab.yml:59`, `config/options/behavior.yml:1525`, `src/lib/server/root/watch/portfolio/audited.ts:94` (watches `setting.website.file`; case 11 needs it to watch the three files).
2. `jaccard`, `normalTitle`, `titleWords` (`git grep -n "jaccard\|normalTitle\|titleWords" -- . ':!config/local.yml'`): no reader outside `publications.ts` and the re-export `scan.ts:83`; verify 4 omits `normalTitle`.
3. `publications.ts`, `publink`, `msg_site_*`: `tests/checks/tree/boundaries.test.ts:152` (allow-list row `'lib/server/content/audit/publications.ts:STOPWORDS'`, an allow-list edit to report before and after); `config/text/views/system/audit.yml:21,66-73`; `src/lib/views/system/audit/Audit.svelte:123` draws the `publink` section, outside the paths; G125's Code line and its tests (describe 'the website of the audit' in `tests/routes/docs/audit.test.ts`).
4. `CareerPanel`, `career-rows` (`git grep -n "CareerPanel\|career-rows\|careerRows" -- . ':!config/local.yml' ':!.scratch'`): `src/lib/ui/controls/heads/FoldHead.svelte:7` outside the paths; `src/lib/state/boards/board/presets.ts:537` inside and not named.
5. `situation` (`git grep -n "situation" -- src config tests ':!config/local.yml'`): `config/defaults/sources.yml:57` outside the paths; `config/options/sources.yml:149`; in the paths `model-collections.ts:477,491`, `normalise-parts/career.ts:63-81`, `career-text.ts:3`, `LabelRows.svelte:4`, `tests/data/sources/career.test.ts`, `tests/server/edit/writes.test.ts:215-293`, the demo fixture's `career.yml:1,7`; G32's test 'reads the title, the milestone and the situation strip'.
6. `career` as a word: `config/defaults/behavior.yml:39-40` and `config/options/behavior.yml:107-109` (`focus.sections`), `src/lib/state/boards/focus.ts:740` (fold key), `config/catalogs/vocab.yml:108` and `config/options/catalogs/vocab.yml:120`; the view id `career` collides with none.
7. `accepted`: `config/catalogs/vocab.yml:112` already has `statuses.accepted` (a separate map); the categories `publications` and `other-outputs` at `vocab.yml:270-271` name `published` and need `accepted`.
8. The hub's `.oculus/config.yml:29` comment describes the old feed check; the hub patch must reword it.

## The step line

1. "`website.yml` keeping only what is the website's own" has no requirement: `website.yml:6,66,89-100,110` hold the person's title, name, ORCID, GitHub, LinkedIn and mail links and contact email; item 10 has `head.html` read them from `website.yml` (542 (6)) while 542 (1) puts them on the `self` entry of `people.yml`. The two rulings clash.
2. Ruling 539 (2) says nothing of the record is derived from `lead`, `collaborators` and `supervisors`; item 2 derives `order` from them, which 543 (1) lists as generated with no source named. A clash between rulings.
3. Every other part of the line and its rulings maps to an item of "What to build"; "Runs beside O101 once O99 lands" is scheduling (`plan.md:890` O99 ticked).
4. The Focus panel's Track record group (`career-rows.ts:226-245`) and `order_note` (`career-rows.ts:265-268`) have no place in item 9.

## Premises

1. False: four entries match two manifests each (algebraic subtyping thesis, causal connectivity abstract, the ICFP abstract and poster); the record goes on the published manifest, the ICFP pair told apart by form.
2. False: 14 matched manifests have no `year` (dongho-ecg-clustering, ward-bttr-crosssubject, raw-pls, bttn-incident-af, meseret-cirrhosis, dries-bttr-ecg, bttd-source-eeg, fed-multicellular-immune, covert-theory, ecg-readable-substrate, covert-applied, hccnet-revision, bt-operator-theory, btfno).
3. False: `cv-autogenerator` matches `side-projects/finished/cv-autogenerator/project.yml`; `finished/cardinal`, `finished/cardinal-revamped`, `finished/ical-kuleuven`, `finished/theaxec-profile-readme`, `school/quasi-monte-carlo-points-on-collections-of-triangles`, `school/row-based-effects-honours-project`, `school/effect-handler-optimization-honours-project` are the same work under other titles; side projects live under `side-projects/<finished|ideas|school>/<id>/` with `stage: released` and no `type`; the manifest schema has no `type` field.
4. False: no Focus band code reads `situation` (`git grep -n -i career -- src/lib/views/boards/focus/Band.svelte` prints nothing).
5. A view registers itself by `export const registration` in its component (`Memories.svelte:6-12`), found by `src/routes/views.ts:69`; `src/lib/state/workbench/layout/` lists no views; `src/lib/views/academic/` holds the LaTeX views.
6. The rest reproduce; `vocab.yml`'s flag comments run 53-62; `ls docs/adr` prints "No such file or directory".

## Cases and checks

1. Case 1 cannot hold: (a) `order` on the 15 entries outside the paper sections; (b) erp-signatures co-first in `lead` gives `coauthor` under the rule; (c) `pub_pre: ""` on the preparation entries and HCCNet-FL; (d) `hide: false` on two entries; (e) the catch-all `kinds` row for dongho (no `form`) and the tech report, and a row's `kind` being a list; (f) the hand-kept order inside a section; (g) the section titles; (h) people's short names in `people.yml` against the full names the website prints; (i) emails written `[at]` beside plain ones; (j) `personal.links` a map of six named links against `people.yml`'s `links` tags list; (k) the FWO award row is funding entry `FWO-PhD`; (l) `bioinformatics` printed twice from one entry, BKO's integer duration.
2. Case 2's `revision` item is no difference.
3. Case 5 depends on the form.
4. Case 6 has no mechanism: `foreign_key` cannot name `website.yml`'s `programs:`.
5. Case 7's second half, case 13's check and case 15's Save are places the step does not change or a DOM run; case 13 holds once HUB_LIST loses `audit.website.*`.
6. Case 1 "called from a test" breaks the rule that only four tests read the real hub; it is a case-run program.
7. No guarded entry is named for the generator, the write and run route, the audit comparison or the career lists; spec.md: "A step that needs a new entry stops and asks Axel for it".
8. Case 12 covers the button only; a missing folder at the audit is not covered.

## The question

1. Parsed-YAML equality ignores the key order of `links`, which the website prints in order (`Code` last today), and the JavaScript `yaml` parser reads `2018-01-01 15:59:00-0400` as text where the CV generator's PyYAML reads a timestamp.
2. Case 11 passes while `audited.ts:94` watches one file.
3. Verify 4 passes with `normalTitle` left.
4. Case 2's wording admits two readings.
5. Item 10 passes with the person moved into `website.yml` by hand.
6. `git apply --check` passes for a patch that leaves out files the generator needs.
7. The other items and cases cannot pass without their part of the goal, by reading.

## Implied inputs

1. The patch recipe: `cp -R` of the hub reads `.oculus/local.yml`; a partial copy diffed against the whole hub reports every other file; copy only the changed files into `a/` and `b/` with hub-relative paths.
2. `website.cv`: no approval before the website's Python and xelatex run, no argv rule, the runner's 20 s limit (`src/lib/server/core/program.ts:5,23`), and `--save` writes the PDF to the home folder (`_scripts/cv_pdf_generator.py:240`).
3. A manifest at a negative or dead-end stage with `publication:`: no entry and a finding.
4. A stage that gives no section: no entry and a finding.
5. A non-empty `website.folder` not there, at the audit.
6. Two hubs: `website:` primary-only, another hub's raising `hub_key_primary`.
7. People already in `people.yml` (students and references) reused with their roles kept.
8. Industry profile entries with no academic record behind them.
9. One hub entry giving two website rows (`bioinformatics`).
10. The first write's text-level diff, comments and quoting dropped, listed for the look.
11. Undo as three History records.
12. A second press while the CV command runs.
13. A generated file open in a source tab with unsaved text (G28).
14. `code_availability.doi: ""` and null both unset.
15. A project of a tier `research_audit.skip_tiers` names carrying `publication:`.
16. `accepted` and the hub's `audit.stage_folders` row.

## ADRs

1. `ls docs/adr`: No such file or directory; no record is touched.

## Dictated text

1. "# Generated by oculus from the research hub; edit the hub, not this file." breaks spec.md's rule against the "not X but Y" construction.
2. The FLLM 2025 `book` text holds.
3. "accepted / to appear" holds.
4. "Write the website" holds, through `t()`.
5. `python _scripts/cv_pdf_generator.py --save --quiet` holds as text.
6. The brief is ASCII.

## Paths and verify

1. `docs/templates.md` outside the paths makes `tests/checks/config/templates.test.ts` red.
2. Verify 6's `git -C` is banned by spec.md.
3. Files outside the paths the work needs: `src/lib/state/forms/`, `src/lib/state/sessions/source/draft-entry.ts:27`, `src/lib/state/sessions/view-source.ts` and `write-files.ts`, `src/lib/state/client/writes.svelte.ts:381`, `src/lib/views/system/audit/Audit.svelte`, `src/lib/ui/controls/heads/FoldHead.svelte:7`, `config/defaults/sources.yml:57`, and `config/catalogs/glyphs.yml` and `icons.yml` for a new glyph.
4. `src/lib/server/content`, `src/routes/api`, `src/lib/server`, `src/lib/state/boards` and `src/lib/views/boards/focus` each hold ten items.
5. The worktree path, the base copy and the base are not named; spec.md names no output filter.
6. The report and patches under `.scratch/` follow the plan's convention.
7. The temp copies must be edited with the Edit and Write tools only; case 15 at the look would write Axel's `career.yml`.

## Declined to judge

1. `self`'s value (`config/options/local.yml` not read); the order run assumed `axel-faes`.
2. Whether the Files writer accepts a path in the website folder.
3. The CV build's time against the 20 s limit.
4. Whether a records-list field with a `foreign_key` in `career.yml`'s schema gets G56's finding today.

## Closed

The step stopped on open item 560 (the `order` source, the person's facts and links, the new guarded entries), which are Axel's: two are clashes between his rulings and the third is a new guarded entry, which spec.md leaves to him. The brief was taken out of the ledger at the stop, as the `spec` skill's "Steps / A stop" 2 says; every other finding is closed in the brief the next `/spec` writes, once 560 is ruled: the premises corrected (Premises 1 to 5), the rules of case 1's differences (a) to (l) given in item 2 and 4 or listed in case 2, the names and paths of "Names" and "Paths and verify" added, the patch recipe of Implied inputs 1, the cases of Implied inputs 3 to 16, the dictated comment reworded, `docs/templates.md` in the paths.
