# O105 brief check

Read at oculus main e7bd281aa (brief untracked, state file modified), website at 4e1437c, hub at af91c9d98. Nothing was changed. Each finding is marked [fix] (the brief should change before dispatch) or [note].

The plan has no Goal section: `grep -n -i -E '^\**goal|^## .*goal' .scratch/migration/plan.md` prints nothing. I took the goal from O105's own line: the website keeps its own words, the three generated files hold only what the hub gives, and `website.files` replaces the fixed names.

Six [fix] items matter most:
1. Verify 2 cannot pass.
2. Hub `config.yml:39` is not named.
3. The data-map counts are wrong if read as "+4".
4. Case K has no home.
5. Case F passes without the check, and leaves `site` unguarded.
6. Duplicate and empty paths have no stated result.

## Names

Commands:
- `git grep -n -E 'SITE_FILE|CV_FILE|PAPERS_FILE|INDUSTRY_FILE|GeneratedName|site\.cv|site\.sections|websiteKindShape|readSite' -- src tests docs README.md`
- `git grep -n -E '_data/(data|publications|industry|website)\.yml' -- . ':!config/local.yml' ':!.scratch'`
- `git grep -n -F 'website.yml' -- src config docs tests README.md ':!config/local.yml'`
- `git grep -n -w parts`, over the audit, sources, fixtures, config and doc paths
- in the hub, `git grep -n -w -E 'parts|website\.kinds|titled' -- .oculus ':!.oculus/local.yml' ':!.oculus/data/research'`

Hits the brief does not name, or names only by a catch-all:

1. [fix] Hub `.oculus/config.yml:39`, the comment above `website:`: "the sections come in the rows' order, each titled by its first row,". False once the 8 titles go. The brief's hub patch names only the 8 rows and the two `career.yml` lines. Name this sentence.
2. [fix] `_industry/cv_pdf_generator.py:8`: "A single data file (../_data/industry.yml) holds shared personal info". False once the generator also loads `website.yml`. The brief's list of false sentences gives only the two READMEs.
3. [note] `_industry/README.md:38-40` ("All text is in", "`shared.personal`, name, photo, contact links") is false after the step. The brief names this file. `README.md:10-12` and `:54-55` stay true as far as I read them, so the brief's mention of `README.md` points at no sentence I could find.
4. [fix] `tests/data/sources/career.test.ts:356`: `rows: { shared: { location: 'Enschede', parts: ['a'] } }`. It holds the removed key against the demo schema, is not in the named test list, and falls only under the catch-all. Whether the row goes red once `parts` leaves the schema is not verified. Name it.
5. [fix] `tests/fixtures/hubs/demo/.oculus/data/academic/career.yml:73` is the schema row of `parts`. The premise gives only `:166`. "The demo fixture" covers the file, but both lines must go.
6. [fix] `docs/templates.md`: `:1785` and `:1872` (`parts`), `:312` and `:325-327` (`title` of a kind), `:307`, `:956`. The file is on the write list, but only `:307` is cited. `tests/data/sources/career.test.ts:277` says the demo schema is the one this page gives, so `:1785` and fixture `:73` move together.
7. [fix] `tests/checks/config/templates.test.ts`, 'shows every key of a hub settings file in the config.yml template, and no other', fails unless the `website:` block of the `## config.yml` template shows the four `website.files.*` keys. The brief does not say so. It is a requirement on `docs/templates.md`.
8. [fix] `docs/data-map.md`: the keys list at `:138-140` and the list at `:281` also need the four keys, and the counts are at `:83`, `:293`, `:294` and `:299` (see Premises).
9. [note] `config/defaults/behavior.yml:34` (the comment naming folder, cv, kinds) and `config/options/behavior.yml:1575` (the group line of `website:`) stop being complete. Both files are on the write list; the brief names neither sentence.
10. [fix] `config/text/views/academic/career.yml:37`, `website_unwritable`: "{0} could not be written, so none of the three files was written." Item 3 refuses an outside path with this word, and for `website.files.site` the sentence is false, since the press never writes that file. The file is on the write list. Either the sentence or the word for that key must be decided.
11. [fix] `.scratch/migration/agents/guarded.md`: G125's Code line says `audited.ts` "(the three files watched)", and its Test line names `tests/server/root/watch/website-watch.test.ts` by title. Cases B, C, D and G add audit and watch rows that fall under G125, so "Doc text for G139 and G140" should also cover G125. G139 needs `settings/files.ts` added to its Code line for case E's reader.
12. [note] G32 names rows of `website-files.test.ts`. Its row titles and text stay true as read; a renamed row would need its line changed.

Hits checked and not made false:
- `titleOf` in `latex.ts`, `runner-shell.mjs`, `rows.ts`, `app-rows.ts`, `FileRow.svelte`, `Timeline.svelte`, `References.svelte`, `lint-fixes.ts`, `Breakpoints.svelte` are unrelated functions.
- `src/lib/data/model/machine/model-machine.ts:360-364` (WEBSITE_REFUSALS comment, "a file the writer cannot take") is not on the write list and stays true enough.
- Hub `README.md:8`, `CLAUDE.md:100` and `.oculus/data/academic/education.yml:1` name default paths that stay. `src/lib/data/sources/config/settings/problems.ts:26,65` is unaffected.

## The step line

`grep -n O105 .scratch/migration/plan.md` gives line 1215. Mapping:

- (1) website reads `sections:` and `cv:`, `_industry` loads `website.yml`: item 1.
- (2) `cv.ts`, `papers.ts`, `site.ts` stop writing, `sections`, `cv`, `titleOf`, `parts` go: item 2.
- (3) 8 titles and row key `title` go, headings move, `kinds` keeps the rest: item 2 and item 1's `sections:` bullet.
- (4) `website.files` with four keys, defaults, Settings, replacing the constants: item 3.
- (5) `programs:` check stays: item 4.
- Three repositories, docs and tests: items 1, 2, 6, and the patches paragraph.
- One press at landing: the sentence after item 6, Decision 1.
- No code carries the old form: item 5.
- Rulings 599 to 602 (plan.md:3360-3363): all four cited (a), and all match.

No part of the step line lacks a requirement. Beyond the step line: the outside-path refusal (Decision 4) and `cv.footer` staying (Decision 3), both listed as decisions.

## Premises

Rechecked with `git grep -n`, `grep -n`, `sed -n` and `cat -n`.

Hold:
- `site.ts:13-25`, `:32-41`, `:104`
- `cv.ts:332,341,423`, `papers.ts:154-157,177`
- `website.svelte.ts:29`, `career.yml:27-28`, `behavior.yml:74`, `audited.ts:14`
- `hub-names.ts:755-757`, `defaults/behavior.yml:35`
- `website.ts:147`, `publications.ts:43-46`, `portfolio.ts:657`
- hub `config.yml:44-53`: `grep -c 'kind:.*title:'` prints 8, in 10 rows
- hub `career.yml:76,324`, value `parts: [portrait_url, author, website]`
- `about.html:17,25`, `publications.html:2,10,18`, `head.html:29-30`
- `cv.tex.template:55,60,61,91,110`, the six first lines, `publications.tex.template:1,21,30,32,37,62,73`
- `_industry/src/cv.tex.template:30`, `coverletter.tex.template:19`
- `_industry/cv_pdf_generator.py:46-47,59`, `_scripts/cv_pdf_generator.py` `computeContext`
- `photo_loc` set at `_scripts/cv_pdf_generator.py:133` and `_industry/cv_pdf_generator.py:60`
- `footer`: only `cv.tex.template:83`, a comment, after excluding the site footer and cvfooter
- website clean at 4e1437c

Do not hold, or incomplete:

1. [fix] "Literal file names outside `site.ts`: ... `docs/data-map.md`" is false. `grep -n -E '_data|website\.yml|publications\.yml' docs/data-map.md` prints only `:57`, about something else. The named `git grep` gives no `docs/data-map.md` hit. The same list leaves out `config/schemas/manifest-schema.yml:106` and `docs/templates.md:956`, and the tests' literals at `tests/data/hubs/website-files.test.ts:424` and `tests/routes/sessions/website.test.ts:201,204,215,248`.
2. [note] `websiteKindShape` is at `settings/files.ts:209-217`, not `210-218`: `git grep -n websiteKindShape` prints `:209`.
3. [fix] The data-map counts are already off, so "by the four new keys" gives a wrong number:
   - `awk '/const HUB_LIST/,/^\];/' hub-names.ts | grep -o "key: '[^']*'"` gives 64 keys; `:83` says 62, so 66 would be wrong and the true figure after the step is 68.
   - `comm -23` of that list against `OWN_HUB_KEYS` gives 23 primary-only keys, which matches `:293` and differs from `:294` ("twenty") and `:299` ("seventeen"), which the brief does not cite. All three become 27.
   State the target numbers.
4. [note] `publications.ts:43-46` "does the same" holds for a missing file. A file that does not parse is a finding there and a refusal in the press.

## Cases and checks

1. [fix] Case K against the tree. The tip is computed in a view, `src/lib/views/academic/career/Career.svelte:132`, not in state. `git grep -l -E 'createWebsite|website_tip' -- tests` prints nothing, so no store test exists. No store test file is on the write list. G140's Test line names only `tests/routes/sessions/website.test.ts`. As written, K's test exists only if the builder moves the tip, and then it has no listed file. Rule: move the tip into the store with a test row under G140 (a client store is a unit the rules file names, and `off()` already lives there), or say K is the look.
2. [fix] Case F against item 3. Item 3 refuses a path that "resolves outside", while F says "an absolute path" is refused. An absolute path inside the website's folder is refused by F and not by item 3. Say every absolute path is refused.
3. [fix] Case D "a kept test" for the watch part sits in `tests/server/root/watch/website-watch.test.ts`, which carries `@module-tag slow`. The rules file allows that only when it can only be slow, run alone with `npx vitest run <file>` and named in the report. The brief should say so or put the watch part in a unit test of `siteFiles`.
4. [note] Case H asks to quote what Settings says of a row. The step changes only the options' field list, so this asks to quote behaviour of Settings code it does not change. It has no stated expected result.
5. [note] The Verify intro says "the filter the rules file names". `grep -n -i filter .scratch/migration/agents/spec.md` prints nothing, so the rules file names none. O104's brief carries the same words.
6. [note] `spec.md:36` says a builder never edits under `.scratch/`, and "Nothing in a brief overrides anything here". The brief's write list holds three `.scratch/migration/agents/reviews/` paths. O104 did the same, so this is standing practice against the file's words.
7. [fix] The brief does not say how the patches are made. O104's said "made against copies of the hub's files as they stand on disk". The rules file calls a shell redirect that changes a file a script, so `diff -u ... > O105-hub.patch` is one, and the brief approves none. The state file (`orchestrator-state.md:33`) shows this breach recurring. State the method.
8. [note] The brief names no worktree or base copy, which `spec.md` says a brief names. O104's does not either. `/spec` creates the worktree after this check, so this holds if the dispatch names them.

Places outside the step: only case H above.

## The question

- Case A: No. It reads the generated files' removed keys directly. It may fail for a reason other than the step if the hub has drifted from the files on disk (see Declined to judge).
- Case B: Yes for the person parts. It changes only a title in `sections:`, so a leftover `...site.cv` passes the kept test and only case A's run catches it. Change a `cv:` value in the same row.
- Case C: Yes, if the test keeps the default path, since that row passes today (`website-files.test.ts:424`). It must use a non-default `website.files.site`.
- Case D: No for the press and the audit. The watch part depends on finding 3 above.
- Case E: Yes, if the test hands in a config map rather than the shipped defaults, since a code literal would then pass. It must read through the merged defaults.
- Case F: Yes. `node -e` shows `join('/hub/site','/etc/x.yml')` is `/hub/site/etc/x.yml`, so an absolute path never leaves the folder. It then fails `writable()` at the missing folder (`website.ts:90`) with the same word and no new check. `../outside.yml` does exercise a check when the folder lies inside a root. F also tests only `cv`, so a check over the three generated files passes and leaves `site` unguarded. Add `website.files.site` to F, and an absolute path whose joined folder exists.
- Case G: Yes for "naming the configured path" if it uses the default. The missing-file half passes today by design.
- Case H: No. It passes only when `title` leaves the shape: `checkedRows` walks `entry.fields` only and `z.object` strips the rest. The quote cannot fail.
- Case I: No. With titles gone from the generated files the old reads raise KeyError, and `pdftotext` equality needs the new reads. The other two profiles use the same code.
- Case J: Passes only if it is skipped, which its fallback allows. `bundle check` prints "The Gemfile's dependencies are satisfied" and `jekyll` is on the path, so it can be run. Liquid renders a missing title as empty, which the `grep` compare catches.
- Case K: Yes, it can fall to the look or pass with no test (see above).
- Case L: Read only. It covers `data.yml`; see Implied inputs item 8 for the publications side.
- Step-line check, Verify 1: can be green with the goal unmet only where no case holds it. Verify 2 and 4 are below.
- Verify 2: cannot pass at all, see Dictated text. Its `sharedShape.*parts` part can never match.
- Verify 3: proves applicability only.
- Verify 4: Yes. It leaves out `website`, so a renamed `const SITE = '_data/website.yml'` passes. Add `website` to the alternation with the allowed exceptions.
- Item 1: judged by cases I and J, No. Its comment and sentence corrections have no check but the review.
- Item 2: No, cases A and B and `tsc`.
- Item 3: Yes in three places. The unsaved guard (`FILES`) has no case. Settings rows have only the look. The primary-only reading has no case, though it comes from `primaryOnly` with no code of its own.
- Item 4: see Case C.
- Item 5: Yes as written, since its only check is the vacuous part of Verify 2. For `parts`, use `git grep -n -w parts -- src/lib/server/content/audit/website/cv.ts`, which must print nothing.
- Item 6: Yes for the counts, see Premises 3. `templates.test.ts` holds the template keys.

## Implied inputs

Each is missing from Cases, with the expected result I would write. All are judgments on what the brief should state.

1. [fix] Two keys naming one file (`site` equal to `cv`, or `cv` equal to `papers`). Today's code would overwrite the website's own file, or write one file twice, and the audit would differ for ever. The rules file requires "duplicated" to be checked. Expected: refused with `website-unwritable` naming the path, nothing written.
2. [fix] An empty value, `website.files.cv: ''`. `control: text` without `empty` accepts `''`, since the reader's `defaultOf` holds `website.cv`'s default `''` to that rule. `join(dir, '')` is the folder itself, so the press refuses with an empty name ("  could not be written"), the audit reports a difference naming nothing, and `site: ''` reads as a missing file. Expected: refused naming the key, or the row refuses empty; the brief must pick.
3. [fix] `website.files.site` outside the folder. `builtFiles` parses the site file (`website.ts:147`) before any writable check, and the approval answer comes before that check too. Expected: refused before the read and before the approval is asked.
4. [fix] A symlink inside the folder pointing outside, such as `_data`. "Resolves" must mean the real path, using `realPath` and `inside` of `core/paths.ts` as `writable()` does, with the parent's real path when the file is new. Expected: refused.
5. [fix] A source tab holding unsaved text of a configured path. `FILES` at `website.svelte.ts:29` is the guard, and item 3 names only the client's tip. A hard-coded or stale list loses the user's text at the press. Expected: refused with the existing `unsavedAnswer`.
6. [note] An outside path in the audit and the watch list. Item 3 says only the press refuses, so the audit reads the outside file and offers a press that is always refused. Expected: state whether the audit gives one finding without reading it.
7. [note] `website.files.papers: data/papers.yml` with no `data/`. Expected: `website-unwritable` before the first write, as `writable()` gives now.
8. [fix] A `website.kinds` row whose `kind` has no heading in `sections:`. Headings and rows now live in two repositories with no check between them. Case L covers `data.yml` only. Expected: extend L to `publications.yml` (blank heading on the page, KeyError in the CV for a key in `types`, as a missing title gives today), or report a finding.
9. [note] A hub setting one key only, `website.files: { papers: x }`: the other three stay shipped. `website.files: x`: `findings.config.hub_key_not_map`. `website.files.pdf`: unknown-key finding. A non-primary hub setting one: `hub_key_primary`, not applied. All follow from `hub-layer.ts:565-590` once the rows are listed; no code of the step is needed.
10. [note] A `parts:` key left in a career file: nothing reaches `personal`, the counterpart of case H.

## ADRs

`ls docs/adr` prints "No such file or directory". The brief's statement holds, and no ADR touches the step.

## Dictated text

The brief dictates no catalog sentence and no comment. Its dictated lines:

- Verify 2, `git grep -n -E "SITE_FILE|CV_FILE|PAPERS_FILE|INDUSTRY_FILE|titleOf\(input|site\.cv|sharedShape.*parts" -- src tests`, "prints nothing": breaks, [fix]. `site\.cv` matches `website.cv`, so these lines print and stay after the step:
  - `src/lib/data/helpers/hub-names.ts:756`
  - `src/lib/data/sources/config/settings/files.ts:276`
  - `src/lib/server/machine/runs/website.ts:4`
  - `src/lib/state/sessions/source/website.svelte.ts:3`
  - `tests/routes/sessions/website.test.ts:3`

  `git grep -n -F 'website.cv' -- src tests | wc -l` prints 5. `sharedShape.*parts` cannot match because the two words sit on lines 406 and 407 of `cv.ts`; no such line appears in today's output. Use `\.site\.cv|\bsite\.cv\[` with a form macOS git grep reads, since `git grep -E '\b...'` treats `\b` as a literal b here; `[^b]site\.cv` is a form that works.
- Verify 4, `git grep -n -E "_data/(data|publications|industry)\.yml" -- src config`: holds as a command; today it prints 7 lines, all of which the step changes. The gap is above.
- Verify 1: `grep -n` in `package.json` shows `diagrams`, `docs:palette`, `test:quick`. Holds.
- Verify 3, `patch --dry-run -p1 -d ...`: holds.
- `site.data.website.sections[<key>]`: holds; `coll[0]` and `seckey` are the keys.
- `website['sections'][<key>]`, `website['sections'][type]`, `website['cv'][...]`: hold. `website` is in the context (`computeContext`), `website.yml:30-44` holds `titles`, `portrait_url`, `secondary-title`, `author`, `website`, and no template assigns a name `website`.
- `personal["portrait_url"]` from `../_data/website.yml`: holds; `_industry/cv_pdf_generator.py:190` changes to the file's folder and `:194` uses the same relative form.
- The 8 keys: equal the 8 distinct `kind` values of hub `config.yml:44-53`, with no collision in `website.yml` `sections:`. Holds.
- Four keys and defaults: match the step line. Holds. A three-part key has the precedent `deposit.zenodo.address`, in `config/options/behavior.yml:741` and `heldAt`.
- The brief's character set: `LC_ALL=C grep -c '[^ -~]'` prints 0.
- "Write_data" and other report-part wording: hold against the rules file.

## Declined to judge

- Whether the hub's files give exactly what is on the website's disk today, which case A's "only removed keys" assumes. It needs a generator run on a hub copy, and the rules file allows real-hub reads only to four named tests. The builder's first run settles it.
- Whether `tests/data/sources/career.test.ts:356` goes red once `parts` leaves the schema.
- Whether a `website.files` line is needed under the options' groups as `deposit.zenodo:` has at `:1596`. I found no test requiring it in the grep over `tests/checks/config` and the catalog tests, and did not read further.
- Whether the Settings editor flags a `title` left on a kinds row. That is case H's quote.
- Whether a `text` row is better than a stricter rule. `control: file` would refuse `..` and absolute paths at entry by `pathProblem`, but it would make the reader fall back to the default and write there, which contradicts case F, and it reads as hub-relative. The brief's `text` is consistent with F.

## Usage

25 tool calls, all read-only, plus one temporary folder in the scratchpad made and removed.

Agent ae6e12bde917fae57, claude-opus-5-5, 242743 tokens, 26 tool uses, 662 s.

## Closed

Every [fix] and [note] above that asks for a change is closed by a change to `agents/briefs/O105.md`:

- Names 1, 2, 4, 5, 6, 7, 8, 9, 11: named in "What is on the tree", items 1, 2 and 6, and the paths.
- Names 10 and implied inputs 1 to 4 and 6: a new refusal word and one check of the four paths (item 3), with cases F, M, N, O; `website-unwritable` keeps its sentence.
- Premises 1 to 4: corrected in "What is on the tree", with the target counts in item 6.
- Cases 1: the tip moves into the store, with case K's test. Cases 2: every absolute path is refused. Cases 3: case D stays out of the slow file. Cases 4: case H states its result. Cases 5: the filter words removed. Cases 7: Decision 2 states the method.
- The question: cases B, C, E, F, G, J strengthened; verify 2 and 4 rewritten; a check of `parts` added.
- Implied inputs 5: case P. Implied inputs 7: case Q. Implied inputs 8: case L extended and Decision 5. Implied inputs 10: case H.
- Dictated text: verify 2 rewritten.
- Cases 6 and 8 and the note on Names 3 and 12 stand: standing practice, or nothing to change; the dispatch names the worktree and the base.
