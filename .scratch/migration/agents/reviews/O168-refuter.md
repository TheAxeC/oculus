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
