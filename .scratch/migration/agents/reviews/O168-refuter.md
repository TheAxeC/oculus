# O168 refutation report

Three things are short against the brief, and each needs a fix before landing:
- Item 5 leaves the `ui.tab_close_dirty` / `ui.tabs_close_dirty` pair unfolded.
- Item 1's Pane padding change clips the stuck group strips in Settings by 10px and in Keys by 2px.
- Item 7 keeps a placeholder as text only when its name is not an HTML element, so `<source>`, `<dir>`, `<data>`, `<time>`, `<label>`, `<title>` and `<output>` still disappear.

Everything else holds by reading and by the runs below. The 17 + 53 rows the builder put down to its TMPDIR pass in my ordinary environment.

Usage: ab8d40d30b37bea8a, claude-opus-5-5, 342934 tokens, 104 tool uses, 18.3 min.

## Checks run (worktree root, ordinary environment, TMPDIR not set)

- `uptime` before the run printed "load averages: 3.76 4.29 5.61".
- `npm run test:quick -- --base abebbb552` printed:
  - `ok      prettier (0.8 s): All matched files use Prettier code style!`
  - `ok      ASCII gate (0.9 s)`
  - `ok      svelte-kit sync (2.7 s)`
  - `ok      eslint (4.1 s)`
  - `ok      svelte-check (11.0 s): 1794109331610 COMPLETED 589 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
  - `ok      vitest checks (195.1 s)`
  - `ok      vitest (243.8 s)`
  - `ok      vitest slow (417.5 s)`
  - `test:quick: 420.4 s; every command passed`
  - The file list printed by the run includes `tests/server/machine/lsp/library.test.ts`, `.../tools/languages.test.ts`, `.../debug/channel.test.ts`, `.../pty/sessions.test.ts`, `.../pty/agent-pane.test.ts` and `.../pty/pane-screen.test.ts`. So the rows the report says failed under its TMPDIR ran here and passed. No row fails.
- `npx vitest run tests/checks/config/config-folder.test.ts tests/data/shapes/catalog-files/vocab.test.ts tests/checks/source/keys.test.ts tests/state/sessions/source/source.test.ts tests/ui/html.dom.test.ts tests/data/sources/config/layers/language.test.ts --reporter=dot` printed `Test Files  6 passed (6)` and `Tests  116 passed | 2 skipped (118)`.
- ASCII gate (the brief's perl form) over every changed and untracked file printed one line, `.scratch/migration/agents/spec.md:103`. That is the orchestrator's text: `cmp` with main's `spec.md`, `guarded.md` and `briefs/O168.md` printed SAME for all three.
- `grep -rn --exclude=local.yml -E '^\s+[a-z_]+_one:' config/text` printed only `config/text/views/academic/present.yml:37: drop_one: Drop one image at a time.`
- `grep -rn -E "_one['\"]" src` printed only `src/lib/state/life/present.ts:569`.
- `grep -rn 'count === 1 ?' src` printed `audit.ts:73` and `deck/spec.ts:66` (name suffixes), and `pages.ts:133` (the unfolded pair, finding S1).
- `sh utils/unused-exports.sh 2>&1 | diff ../O168-base/unused-exports.txt -` printed:
  - the count, from 225 to 227
  - `kindOf` dropped from the `collection/index.ts` line
  - two new lines, `launch-form.ts: PARTS` and `cpp-form.ts: PARTS`

  This matches the report.
- `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O168.md .agents/worktrees/O168-base` printed "git does not know the base" (exit 2). With `abebbb552` as the base it printed the 10 paths the report lists.
- `sh utils/folder-check.sh` printed nothing (exit 0).
- The brief's premises reproduce on `O168-base`: 95 `_one:` keys in 28 files, 18 `count === 1 ?` sites, and `ls docs/adr` says no such directory. The premise list misses one non-plural key, `recover.fetch_one` (`data.yml:43`); see S5.
- `npm run diagrams` was not run, because it writes files (see Declined).

## Verdict per item of "What to build"

1. List mode: **violated (in part)**.
   - Holds for the board and the collection: `BoardList.svelte:107` and `EntryList.svelte:155` set `--group-strip: 0px`, so in the clipping box the header row does not stick and is drawn once.
   - Ruling 1's Pane change (`Pane.svelte:238,243,248`, `GroupHead.svelte:224`, `Table.svelte:114`) clips the strips in two views (S2 and B1).
2. New project in another hub: **holds**.
   - `hubVocabOf` carries `new_project_dir: config.newProjectDir` (`data/index.ts:727`), which is the reader the write uses.
   - `newProjectFolder` takes another hub's value (`new-project.ts:59-62`), and the primary keeps its scan-folder rule.
   - The head comment is true.
   - Checked by reading only; no test covers it.
3. Funding list: **holds**.
   - `fittedColumns` drops the rightmost empty column first (`table-rows.ts:77-78`).
   - `EntryList` derives the set of empty columns from the drawn rows.
   - Headers without a `label:` use `wordOf` (`collection/index.ts:228`).
4. Count pills: **holds** by reading.
   - `Disclosure.svelte` takes an optional `expanded`. Without it, it draws no marker and no `aria-expanded`, and its head comment says both uses.
   - `RecordCounts.svelte` draws every count through it, with the total and the waiting count untoned.
5. Plural mechanism: **violated (in part)**.
   - Not done: `ui.tab_close_dirty` / `tabs_close_dirty` (S1).
   - Done:
     - the helper (`finding-text.ts:63-101`)
     - the readers `plural`, `pluralOf`, `pluralWords` and `pluralFindingText`
     - `noticeWords`
     - category labels as maps
     - shape findings (`text.ts` `pluralFindings`, `boards.ts` `labelFindings`, the zod record)
     - the G24 gate
     - `docs/apps.md`, though one sentence there is false (St1)
     - language and workspace layering
6. Entry pages: **holds** by reading.
   - The primary key and the Website section are left out, and fields the schema does not name are labelled with `wordOf`.
   - `records` fields draw named presses in `PressBox`; an unknown id is muted with a `title`.
   - Meta pairs are drawn under their own labels.
7. Angle brackets: **violated (in part)** (S3).
8. Fetch toast: **holds**. `keepFetchOutcome` returns `failure.line` for a failed fetch and `said` otherwise (`git-routes.ts:249-264`, `:516-517`).
9. Separator words: **holds**. The leftover `PARTS` exports are St5.
10. Source row: **holds**.
    - `digestInTurn` (`source-server.ts:39-51`) spies `crypto.subtle.digest` with a `node:crypto` SHA-256 and restores it with `onTestFinished`.
    - `source.test.ts` is not in the diff, and it passed in both of my runs.

## Verdict per case

- **C1: partial.**
  - By reading: met for Projects and Funding list mode, card mode and Focus.
  - Unmet for Settings and Keys (S2), which the ruling's "any view that draws GroupHead" covers.
  - To settle: the look, after S2 is fixed.
- **C2: not verifiable.**
  - The case program was removed, and no test of the step reaches it.
  - Reading is consistent with the report's quoted output.
  - To settle: rerun the quoted program, or the look.
- **C3: not verifiable** by a run (program removed). Reading is consistent: an empty column is dropped first, the header words come from `wordOf`, and Title keeps its 160 minimum through the proportional widths.
- **C4: not verifiable** (the look). Reading is consistent.
- **C5: met** for the parts I could run.
  - My read-only `node -e` import of `finding-text.ts` printed:
    - "en 1 1 citation", and "0 citations" and "2 citations"
    - "pl 3 no few: 3 citations"
    - for the locales `"en_US"` and `""`: "1 citation | 2 citations"
  - The G130 rows (pl `few` laid over, 3 drawing it) pass.
  - The search sentences, `noticeWords` and the server's language words: met by reading (`words.ts:18-55`, `notice-words.ts:13-17`, `words.ts` `pluralWords`).
- **C6: met.** The six rows pass. Five were seen failing on the unchanged tree, as quoted in the report. The no-label row passes on the unchanged tree by its nature (P2). `file.other` and `editor.other` draw no finding: my read-only scan of `config/text` for maps that read as plural maps with a non-form key or no `other` printed nothing.
- **C7: met.** The row passes. On the unchanged tree it failed with a TypeError from the missing helper, not with its own assertion (P3).
- **C8: not verifiable** (the look). By reading: met. The templates give `related` a `foreign_key: projects` (`docs/templates.md:1482,1529,1584`).
- **C9: partial.**
  - `<jobid>` is kept, and `html.dom.test.ts` passes unchanged.
  - The brief's rule ("no tag the sanitiser keeps ... as the text it was written as") is not met for placeholder names that are HTML elements (S3).
- **C10: not verifiable** (the look). By reading: met.
- **C11: met** by reading (`app.yml:91,96`, `debug.yml:44`, `CppRows.svelte:85,121`, `LaunchEdit.svelte:78`).
- **C12: met.** `source.test.ts` passed in my verify run and in the quick list, and its expectations are unchanged.

## Findings

### Spec

**S1. `ui.tab_close_dirty` / `ui.tabs_close_dirty` not folded** (`src/lib/state/workbench/navigation/pages.ts:133`).

```
return count === 1 ? t('ui.tab_close_dirty') : t('ui.tabs_close_dirty', count);
```

- The brief names this pair under "Pairs picked by hand", with `pages.ts:133`.
- The hand-back's Decision 5 argument does not apply. The brief lists this pair explicitly, and its singular names no tab by name. A plural map's `one` form may carry no `{0}`.
- The only extra file the fold needs is `src/lib/shell/panes/strip/close-question.svelte.ts:82`. The three test files that read the key are already in the path list.
- Failure scenario: a hub's language pack or `settings.text` cannot give this sentence a `few` or `many` form, and the code keeps a hand-written pick that item 5 exists to remove.
- Fix at landing: add that file to the path list and fold the pair.

**S2. Ruling 1 regresses the nested scrollers** (`src/lib/ui/frame/Pane.svelte:238`, read with `GroupHead.svelte:224`).

```
--pane-pad-top: 10px;  ...  top: calc(var(--group-above) - var(--pane-pad-top, 0px));
```

- `Settings.svelte:486-490` (`.list { overflow: auto }`, no padding, inside `<Pane tinted>`) inherits the 10px. Its strips, drawn through `settings/List.svelte`, now stick 10px above the list's top edge.
- `Keys.svelte:155-163` (`.view`, padding-top 8px, overflow auto, height 100%) sticks its strips 2px above its edge.
- I read both. The builder's analysis is correct.
- Failure scenario: open Settings, scroll the list, and the stuck group heading loses its top 10px.
- The fix is the one-line `--pane-pad-top` on each scroller: `0px` on Settings' `.list` and `8px` on Keys' `.view`. Both files need adding to the path list.
- Catalogue (`.view` is overflow auto but has no bounded height, so it never scrolls), Hooks, AppHosts and UpdateTray (outside every Pane) are unaffected, by reading.

**S3. Item 7 is narrower than the brief** (`src/lib/ui/html.ts:567-583`).

```
return name.includes('-') || document.createElement(name) instanceof HTMLUnknownElement;
...
return kept || !placeholderTag(name) ? text : escapeAttribute(text);
```

- A placeholder named like an HTML element still goes to the sanitiser and disappears.
- My read-only jsdom check printed "known->sanitiser" for source, dir, data, time, label, title, kbd, u and output, and "unknown->text" for jobid, name, host, user, path, target, svg and math.
- Failure scenario: a Resources note "rsync <source> <target>" draws "rsync  <target>", with `<source>` gone; "~/data/<data>" draws "~/data/".
- The brief says text in angle brackets "that is no tag the sanitiser keeps" shows as written, and C9's `<script>` case is still met if it is escaped to text.

**S4. Three paths outside the list were written without a hand-back first** (brief line 246: "a fix that needs another file is handed back with the reason before the report").
- Judged on the merits, each is needed:
  - `tests/checks/source/catalog-reads.ts`: the split `spec.md:48` requires. `keys.test.ts` would be 951 lines; it is now 867. It is a test helper, not a script.
  - `src/lib/server/content/audit/rules.ts`: `pluralSentence` and the collector's `count`. These are the only way `projects.ts`, which is in the list, can word a counted finding.
  - `tests/data/sources/config/catalog/options-schema.test.ts:162`: a fixture carried to the new label shape, with no expectation changed.
- Low severity. The orchestrator adds the three paths at landing.

**S5. Key renames the items do not name, reported as judgment calls and reversible:**
- `recover.fetch_one` becomes `recover.fetch_file`. The brief's premise list omits this key, and its verify 4 grep forces it to go.
- `settings.scope_unsaved_one` and `scope_unsaved_many` become `settings.scope_unsaved_changes`, because the bare key `scope_unsaved` is an unrelated sentence.
- These are not silent, but a workspace `settings.text` entry under an old name would now be a finding. The brief's premise says the research hub sets no `text:`.

**Decisions the prompt reserves, judged against the brief:**
- The Settings control for a category `label`: the brief asks for it ("shows and writes a row's `label` as its forms"). The `records` control with `key` and `value` is the existing pairs form (`options.ts:130` `isPairs`), and the report states the change before and after. Holds.
- The reserved `locale` catalogue entry (`finding-text.ts:54`, set at `language.ts:144`): internal to the flat catalogue, and it carries the laid language's locale to every reader. It is reported, and it is not a user-visible shape. Its one hazard is that nothing stops a future one-word key `locale` in `config/text` from colliding silently (the head comment asserts "No key of config/text/ is one word"). Low.
- `<svg>` and `<math>` now shown as text: consistent with the brief's own wording and reported. The opposite direction is S3.
- The idea heading now reads "ideas": the brief's own example (`{ one: idea, other: ideas }`) and its rule that headings read `other`. Reported. Holds.

**No unapproved script was found.** The case programs and vitest configs fall under the cases ruling ("Case-run programs, their vitest config"). The report says every edit was made with Edit or Write, and that `npm run diagrams` is the only program that changed tracked files.

### Proof

**P1. False claim about the size allow list.** The report says "`src/lib/state/sources/repositories/repositories.ts` is 885 lines, under its entry in `utils/size-allow.txt`".
- `grep -v '^#' utils/size-allow.txt` prints nothing, so the file has no entries.
- The size check passes only because 885 is under the 900 refusal limit.
- The decision not to split the file rests on this claim (see St4).

**P2. Rows that pass on the unchanged tree, not disclosed.** The cases ruling asks that every row be seen failing on the unchanged tree. These three pass there, by the report's own base run ("6 failed | 33 passed"; they are not among the failures):
- G130 'words a form outside the six plural forms'
- G130 'words a plural form of a key oculus holds as a plain text'
- G13 'reads a category with no label by its key, with no finding'

The finding message is the same before and after, so these rows guard unchanged behaviour and would pass with `isPluralForm` taken out. The report does not say they pass on the unchanged tree. Low.

**P3. C7's base failure is not the row's own assertion.** It is a TypeError (missing `PLURAL_FORMS` and `LSP_COUNTED_NOTICES` imports), so the assertion was never reached on the unchanged tree. The report says so. Inherent to a new helper; no action.

### Standards

**St1. A false sentence in `docs/apps.md:310`:** "a form the language does not give is drawn in its `other` form, then in English".
- A language that gives only `other` still draws oculus's English `one` for a count of 1.
- My `node -e` run printed "pl 1 (language gives only other): 1 citation".
- Failure scenario: an app author reads that a missing `one` falls back to their own `other`, and ships a pack that shows English singulars.
- The behaviour matches G130 ("a key the language lacks shows the English word"). The sentence is what needs to change.

**St2. A refused example in `docs/templates.md:462`:** `#     - { key: idea, label: "early ideas", ... }`.
- A text `label` now draws the finding "must be a map", and the row is drawn by its key.
- Failure scenario: a hub author copies the template and gets a finding and a heading that reads "idea".
- The rules file's "grep it across docs" step missed this file.

**St3. A refused shape in `tests/fixtures/hubs/deck-hub.ts:361`:** `'  - { key: publications, label: publications, ... }'`.
- The brief lists this file among the candidates to carry. A text label is now refused, so the fixture hub carries a finding.
- The tests pass only because the key fallback equals the old label.

**St4. `src/lib/state/sources/repositories/repositories.ts` is 885 lines** (888 at the base). The step changed it, and `spec.md:48` puts the limit at 880 with a split by concern in the step. It was not split (see P1).

**St5. `PARTS` is exported and unused** at `src/lib/state/system/machine/lsp/clangd/cpp-form.ts:26` and `src/lib/state/system/machine/debug/launch-form.ts:33`. The unused-exports diff above lists both. Fix at landing: drop `export` in both files.

**St6. The locale lookup is duplicated.** `pluralOf` (`src/lib/state/shared/words/text.ts:108`) has `const locale = catalog[LOCALE_ENTRY] ?? 'en';`, repeating `pluralText`'s locale lookup with a literal in place of `finding-text.ts`'s `ENGLISH`. A rule written twice. Low.

**St7. Mismatched key names:** `recover.fetch_file` (`data.yml:45`) sits beside its tip `recover.fetch_one_title`, so one control's two keys now use different names. Low.

**Clean:**
- History words: none. My grep of the added lines found only order words ("before git's", "before any column") and interface words ("still in conflict").
- Non-ASCII outside the ledger: none.
- Every changed component is at or under 520 lines, and every source file except repositories.ts (St4) at or under 880.
- `docs/HELP.md:124,130,396` and `docs/data-map.md` stay true.

### Behaviour

**B1. The Settings and Keys strip clipping (S2) is missing from the before and after section.** It is only in the first line, as a hand-back.
- Before: the stuck strip sits at the scroller's top edge.
- After: 10px (Settings) or 2px (Keys) of it is hidden.

**B2. Mutes of count-1 audit findings stop matching** (`audit/projects.ts`, `rules.ts:283`). The signature key changes from `audit.msg_markers_one` / `msg_provisional_one` to the bare key.
- The report states this under "Judgment calls", but not under before and after.
- Before: muted. After: the finding is back in Findings.

**B3. The waiting count's glyph is gone.** Stated under "Judgment calls", not under before and after.

**B4. An entry page's long body is drawn whole, with no clamp** (`EntryFields.svelte`, `pageField`). Stated under "Judgment calls", not under before and after.

## Declined to judge

- `npm run diagrams`: it writes `docs/diagrams/`, and I may write nothing. Whether the five regenerated `.dot`/`.svg` pairs match the source runs at landing.
- The outputs of the case programs for C2, C3, C5 (the `t()`, search and notice lines), C6 and C9. Their programs and configs under `.agents/scratch/` were removed, and I may not write them back. Reading and the runs above cover what they claim.
- The git commands the report quotes other than my three: `git diff HEAD -- tests/state/sessions/source/source.test.ts` and `git diff HEAD --name-only -- src/lib/server/machine src/lib/server/core`.
- Every on-screen state, left to the orchestrator's look at landing:
  - C1 in list mode, card mode and Focus, and Settings, Keys and Catalogue scrolled
  - C3 in a 420 px pane
  - C4 side by side with the Pillars strip
  - C8 on the MSc supervision Education entry, a person's page and a task's page
  - C9 on the UTwente HPC card
  - C10 with the fake ssh
  - C11
- Scrollers nested deeper than the components I checked, and any overlay drawn inside a Pane body with its own vertical scroller holding a `Table`.
- Whether the research hub's real Education schema gives `related` a `foreign_key`. That is under `.oculus/`, which I did not open.
- Whether Axel's workspace file holds mutes of count-1 marker or provisional findings (B2). That is under `.oculus/`, which I did not open.

## Repair round 1, refuted

All four round-1 closures I could rerun hold, and every verify command passes in the ordinary environment. Three things are still wrong, none of them in round 1's delta: Spec 1, the Update tray keeps a 12px band above its stuck strips (handed back by the builder, a one-line fix at landing); Standards 1, the head comments of GroupHead, Pane and Table do not say that a scroller inside the pane body sets its own `--pane-pad-top`; Proof 1, the report's round-0 first line and file table are now false. The Catalogue change goes beyond ruling 2 and is right on the merits (Spec 2). Behaviour 1 is a visible consequence of ruling 3 its before/after does not name.

Usage: a672d6d9bb5e4fe47, claude-opus-5-5, 262459 tokens, 82 tool uses, 22.2 min.

### Verification lines (worktree root, the shell's default `TMPDIR=/var/folders/7r/.../T/`)

- `uptime` before the counted run: "load averages: 8.54 12.15 10.01". `ps` showed no other vitest or svelte-check.
- `npm run test:quick -- --base abebbb552` printed:
  - `test:quick: 176 changed file(s), from git since abebbb552`
  - `test:quick: 310 test file(s)`
  - `ok      prettier (0.9 s): All matched files use Prettier code style!`
  - `ok      ASCII gate (0.9 s)`
  - `ok      svelte-kit sync (2.5 s)`
  - `ok      eslint (2.6 s)`
  - `ok      svelte-check (9.3 s): 1794114336173 COMPLETED 589 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
  - `ok      vitest checks (192.1 s): Duration  176.71s ...`
  - `ok      vitest (226.1 s): Duration  214.87s ...`
  - `ok      vitest slow (394.0 s): Duration  382.69s ...`
  - `test:quick: 396.6 s; every command passed`
  - The 17 library rows and the tmux, debug and app-host rows the builder lists under its `TMPDIR` are in this run, and they pass.
- An earlier run of the same command with `TMPDIR` unset (`env -u TMPDIR`) printed `failed: vitest slow`: 11 rows of `tests/server/edit/config-key.test.ts` at `:458`, `expect(existsSync(join(made.hub, '..', 'x'))).toBe(false)`. With `TMPDIR` unset `os.tmpdir()` is `/tmp`, and `/tmp/x` exists ("-rw-r--r-- 1 axelfaes wheel 1301 Nov  7 23:50", older than the round); nothing in the step creates it. `env -u TMPDIR npx vitest run tests/server/edit/config-key.test.ts` gives `Tests  11 failed | 25 passed (36)`, with the default `TMPDIR` `Tests  36 passed (36)`. The file is not in the diff. Not a finding against the step.
- The ASCII gate (the rules file's perl form) over every changed and untracked file outside `.scratch/` printed nothing (exit 0). The only hit inside the ledger copy is `.scratch/migration/agents/spec.md:103`, the orchestrator's text: `cmp` against main printed SAME for `spec.md`, `guarded.md`, `O168.md`, `O168-cases.md` and `O168-round1.md`.
- `sh utils/unused-exports.sh | sort | diff <(sort ../O168-base/unused-exports.txt) -` printed one changed line, `src/lib/state/boards/collection/index.ts: hasStatusField, statusValues` against the base's `kindOf, hasStatusField, statusValues`. No line added; `PARTS` on no line.
- `sh utils/folder-check.sh` printed nothing (exit 0).
- `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O168.md abebbb552` printed the same 22 paths the report lists (exit 0); each is in the round-0 rulings, round 1's list or S4, or is the ledger copy; `Catalogue.svelte` is covered by round 1's line "any other scroller ruling 2 finds, named in the report".
- `grep -rn "count === 1 ?" src` printed only `src/lib/state/system/audit.ts:73` and `src/lib/data/sources/deck/spec.ts:66`.
- `wc -l src/lib/state/sources/repositories/repositories.ts` printed `682`.

### Reruns of the evidence the Round 1 section quotes

| Command | Output |
|---|---|
| `npx vitest run tests/shell/panes/strip/tab-menu.test.ts tests/shell/panes/strip/app-editor-close.test.ts tests/state/workbench/navigation/pages.test.ts tests/checks/source/keys.test.ts --reporter=dot` | `Test Files  4 passed (4)` / `Tests  36 passed (36)` |
| `grep -rn --exclude=local.yml "tab_close_dirty" src tests config` | nothing |
| `grep -n "placeholderTag\|createElement" src/lib/ui/html.ts` | nothing |
| `grep -rn --exclude=local.yml "fetch_one_title" src config tests` | nothing |
| `grep -n "LOCALE_ENTRY\|'en'" src/lib/state/shared/words/text.ts` | nothing |
| `grep -v '^#' utils/size-allow.txt` | nothing (exit 1) |
| `git show abebbb552:config/text/ui.yml \| grep close_dirty` | the two base sentences; the folded map's `one` and `other` forms carry them unchanged |
| `diff <(sed -n 169,371p <snapshot>/repositories.ts) <(sed -n '14,$p' src/lib/state/sources/repositories/diff/diff-view.ts)` | `IDENTICAL` |
| `npx vitest run tests/ui/html.dom.test.ts --reporter=verbose` | 14 passed, the script row, the five "draws the tag in ... as written" rows and the Literature row among them |
| `npx vitest run` of the brief's verify-3 files plus `language.test.ts`, `--reporter=dot` | `Test Files  6 passed (6)` / `Tests  122 passed / 2 skipped (124)` |
| `npx vitest run <file> --reporter=dot` for `hub-portfolio` / `zenodo` / `cpp` / `app-store` | `16 passed (16)` / `51 passed (51)` / `5 passed (5)` / `15 passed (15)` |
| `git diff abebbb552 --name-only -- src/lib/server/machine src/lib/server/core` | `failure.ts` (core/git), `words.ts`, `processes/failure.ts`, as the report says |
| `git status --short` over `docs/` | `apps.md`, the five diagram pairs and `templates.md`; `palette.md` not listed |
| `LC_ALL=C grep -nP "[^\x00-\x7F]"` over the round's files | exit 1 (nothing) |
| `npx prettier --check` over the 24 files round 1 touched | `All matched files use Prettier code style!` |

### Verdicts, whole diff since abebbb552

Items of "What to build":

1. Violated (in part). Holds for the board, the collection, card mode and Focus; round 1 closes S2 (`Settings.svelte:490` sets `--pane-pad-top: 0px`, `Keys.svelte:158` sets `8px`). The cases ruling (a) covers "any view that draws GroupHead", and the Update tray still draws its strips 12px below its scroller's edge: Spec 1.
2. Holds, by reading. Unchanged in the round.
3. Holds, by reading. Unchanged in the round.
4. Holds, by reading. The look settles it.
5. Holds. S1 closed: `ui.tabs_close_dirty` is a map at `ui.yml:114-116`, read by `plural` at `pages.ts:133` and `close-question.svelte.ts:82`. St6 closed: `catalogLocale` at `finding-text.ts:85-92`, used by `text.ts:108`.
6. Holds, by reading. Unchanged in the round.
7. Holds. S3 closed: `html.ts:560-575` escapes every inline tag not in `ALLOWED_TAGS`, and the output still passes `sanitise` (`inlineDrawing`, `html.ts:582-595`). See Behaviour 1.
8. Holds, by reading.
9. Holds. St5 closed: `PARTS` is module-local in `cpp-form.ts:26` and `launch-form.ts:33`.
10. Holds. `source.test.ts` passed in both runs, its expectations unchanged.

Cases:

- C1: partial. Met by reading for list mode (Projects and Funding), card mode, Focus, Settings, Keys and Catalogue; unmet for the Update tray (Spec 1); the look settles the rest.
- C2: not verifiable. The case program is removed; reading agrees.
- C3: not verifiable by a run; reading agrees.
- C4: not verifiable; the look settles it.
- C5: met for what was run: the folded dirty-tab key gives the singular sentence for 1 and the plural for 3 (the `tab-menu` close-all row and the `pages` and `app-editor-close` rows pass); the helper rows rest on round 0's evidence and the first review's `node -e` run.
- C6: met. `config-folder.test.ts` and `vocab.test.ts` pass, and round 1's ruling 6 states the three rows that already pass on the base.
- C7: met.
- C8: not verifiable; the look settles it; reading agrees.
- C9: met by the G5 file (14 passed); the look settles the HPC card.
- C10: not verifiable; the look settles it; reading agrees.
- C11: met, by reading.
- C12: met.

### Spec

**Spec 1. The Update tray's strips keep the band, handed back** (`src/lib/shell/rail/UpdateTray.svelte:247-258`).

```
.tray { ... max-height: 100%; overflow: auto; padding: 12px; ...
```

The tray holds `GroupHead` at `:170`, and `ScheduleList.svelte:70` holds another. It is drawn in a `Modal` (`src/lib/shell/Workbench.svelte:57`) outside any `Pane`, so `--pane-pad-top` falls back to `0px` (`GroupHead.svelte:224`). Failure scenario: open the Update tray with enough schedules and tasks that it scrolls, then scroll it; the stuck "Tasks" strip stands 12px below the tray's top edge, and rows show in that band. The base does the same. The cases ruling (a) fixes this band "for every view"; the reviewer's import trace agrees with the builder's survey that this is the only scroller left with the band. The hand-back is correct procedure. Fix at landing: `--pane-pad-top: 12px;` on `.tray`, with the one-line comment Settings and Keys carry.

**Spec 2. Catalogue: a change beyond ruling 2's text, right on the merits** (`src/lib/views/system/workbench/Catalogue.svelte:375-382`).

```
-        overflow: auto;
-        min-height: 0;
```

Ruling 2 asks for a `--pane-pad-top` line where a scroller's padding differs from the pane body's. Catalogue's `.view` was a scroll container that never scrolls (`Pane.svelte:237-245`, the body is a block box; `.view` has no height and grows with its content), so on the base its strips never stuck. The builder removed the dead overflow, so the pane body scrolls the view and the strips stick. A visible change no ruling names, stated under ruling 11's before/after. It matches GroupHead's sticky design, and nothing in Catalogue reads the scroll (`grep -n scroll Catalogue.svelte` shows only the new comment). Not a defect. Failure scenario if it is not wanted: the Catalogue scrolled shows sticky group headings it did not show before.

`pages.test.ts`: on the brief's own list (`O168.md:226`); four expectations carried from `t('ui.tab_close_dirty')` to `t('ui.tabs_close_dirty.one')` with the same sentence, no row added. Holds.

`docs/apps.md:310`: read against `pluralPick` (`finding-text.ts:77-83`, the count's form, else `other`) and the merge by dotted key, the sentence "English words for the form where they give it, else in the language's `other`, else in English `other`" is true. Holds.

### Proof

**Proof 1. The report's round-0 text is now false** (`.scratch/migration/agents/reviews/O168-report.md:1`, `:17-20`, `:633`).

```
NOT done: ... (2) `ui.tab_close_dirty` and `ui.ta...
| src/lib/state/sources/repositories/repositories.ts | 888 | 885 |
```

Round 1 appended its section but left the report's first line listing the dirty-tab pair and the Settings/Keys hand-back as NOT done; the table row gives repositories.ts as 885; Hand-back 1 says `pages.ts:133` "still reads count === 1 ?". All three are false now; `spec.md` says a figure from before the last change is "taken again or removed". Failure scenario: a reader of the first line takes the pair and the scrollers as still open. Fix at landing: mark those lines superseded by "Round 1", or correct them.

The two `html.dom.test.ts` rows whose failing run is against the base's source (the `<script>` row and the carried Literature row): `spec.md` asks for the failing line on the unchanged tree, which is the base; round 0's code also sent `<script>` to the sanitiser, so base and round 0 fail them alike, and the quoted failures are what DOMPurify gives on the base. Not rerun (the redirecting config is removed).

Changed assertions are carried, not loosened: the sanitiser loop drops `<script>alert(1)</script>`, which a new row covers more strictly (exact escaped text, plus `sanitise(field) === field`); the Literature row drops `alert` from its negative pattern and adds `toContain('&lt;script&gt;alert(1)&lt;/script&gt;')`, keeping `not.toMatch(/onerror|<script/)`. G5's property (no element, no handler) is still asserted.

### Standards

**Standards 1. The sticky contract is not stated where a reader of the strip learns it** (`src/lib/ui/controls/heads/GroupHead.svelte:27-30`, also `Pane.svelte:232-236`, `Table.svelte:108-110`).

```
// inside its scroller's padding, so the strip takes the pane body's top padding, which
// ui/frame/Pane.svelte publishes as `--pane-pad-top`, off its `top`: it then sticks at the
// body's top edge, and nothing scrolling under it shows in a band above it.
```

After round 1 correct placement depends on a scroller other than the pane body setting `--pane-pad-top` to its own top padding (Settings `0px`, Keys `8px`, the tray of Spec 1). "It then sticks at the body's top edge" is false for a strip in such a scroller, and none of the three head comments tells the author of a new scroller to set the property. Failure scenario: a developer adds a view with its own `overflow: auto` box and `padding-top: 4px` inside a `Pane`, holding a GroupHead; the strip sticks 6px above the box's edge, its top cut off, and nothing points to the property. Fix: one sentence in GroupHead's head comment (and Pane's): a scroller inside the pane body sets `--pane-pad-top` to its own top padding.

Checked and fine: no history word in the round's added comments; comments within 100 columns; `diff-view.ts` opens with a head comment and the moved block is identical to the base; `Diff.svelte:82-83` follows the file's split of type imports, the component at 518 lines and `DiffSection.svelte` at 520; no reference to `KEEP_UNKNOWN_TAGS`, `placeholderTag`, `tab_close_dirty` or `fetch_one_title` remains in `src`, `tests`, `config`, `docs` or `README.md`.

### Behaviour

**Behaviour 1. Inline fields now show the markup of every tag the sanitiser drops, known elements included** (`src/lib/ui/html.ts:569-571`).

```
const kept = name === undefined || (ALLOWED_TAGS as readonly string[]).includes(name);
return kept ? text : escapeAttribute(text);
```

What ruling 3 orders ("whatever its name"), so not a defect against the brief. Round 1's before/after names `<source>`, `<data>`, `<time>`, `<title>` and `<script>` but not the common inline tags `ALLOWED_TAGS` (`html.ts:80`) leaves out, which used to lose their tag and keep their words. Failure scenario: a hub note "Press `<kbd>Ctrl</kbd>+<kbd>S</kbd>`" read "Press Ctrl+S" on the base and in round 0 and now reads "Press <kbd>Ctrl</kbd>+<kbd>S</kbd>"; the same for `<u>`, `<mark>`, `<s>`, `<q>` and `<cite>`. Radar and Literature titles reach `inlineMarkdown` (`RadarCard.svelte:342`), and `src/lib/server/edit/feeds/literature.ts` does not strip tags, so a feed title carrying such a tag shows it raw; unknown names such as `<scp>` already did in round 0.

No other behaviour finding: `plural('ui.tabs_close_dirty', 1, 1)`'s `one` form has no `{0}`, so the extra argument is harmless; a workspace `settings.text` or an app pack naming `ui.tab_close_dirty` or `recover.fetch_one_title` now draws an unknown-key finding, the class of S5, which was accepted.

### Declined to judge

- `npm run diagrams` and `npm run docs:palette`: both write files. The diagram deltas in `layer-state`, `layer-views` and `layers` are checked at landing.
- The builder's case program `.agents/scratch/case-r1.test.ts` and the configs `tree.config.mjs` and `base.config.mjs`, removed: ruling 6's base run of the three rows, ruling 7's Polish output, ruling 8's category-findings output, ruling 10's `pl` output, the audit signature hashes, the before-runs of the `<script>` and Literature rows against the base's source, the C5 program lines. Reading agrees with each.
- The before run of ruling 3's four rows on the round-0 tree: it needs the snapshot's `html.ts` in place. The first review's jsdom check already showed those names going to the sanitiser.
- The builder's 70 rows under `TMPDIR=.agents/scratch/tmp`: a builder environment not reproduced; they pass in the ordinary run.
- The `sed -n 169,371p` before-the-move comparison: done against the round snapshot. IDENTICAL.
- Every on-screen state, left to the orchestrator's look: C1 in Settings, Keys and Catalogue scrolled, and the Update tray; C3 at 420 px; C4 beside the Pillars strip; C8; C9 on the UTwente HPC card; C10 with the fake ssh; C11; Behaviour 1 on a note or feed title holding `<kbd>`.
- Stored mutes of count-1 audit findings (B2): under `.oculus/`, not read.

### Rule breaches the reviewer reports of its own

- Two greps went over `config/` without `--exclude=local.yml` (`grep -rn "tab_close_dirty" src tests config` and `grep -rn "fetch_one_title" src config tests`). They printed nothing, so no content of `config/local.yml` was shown. Every later grep over `config/` carried the exclude.
- It wrote three temporary files in the session scratchpad (a status list and two copies of the base `repositories.ts`) and deleted them within minutes. No file in the worktree, the snapshot or the ledger was written.

### Closed

- Spec 1: fixed at landing, `--pane-pad-top: 12px` on `UpdateTray.svelte`'s `.tray` with its comment (inside the cases ruling C1 (a), "every view"); seen at the look.
- Spec 2: accepted at landing; the Catalogue scrolled is looked at.
- Proof 1: fixed at landing, the report's round-0 lines marked superseded by "Round 1".
- Standards 1: fixed at landing, one sentence in the head comments of `GroupHead.svelte` and `Pane.svelte`.
- Behaviour 1: the ruled behaviour of item 7 and round 1's ruling 3; a grep of the hub's data files for `<kbd>`, `<u>`, `<mark>`, `<s>`, `<q>`, `<cite>`, `<abbr>` and `<scp>` printed nothing; the landing booking states its before and after.
