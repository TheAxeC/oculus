## Verification lines

```
npx vitest run --reporter=dot        Test Files 273 passed (273); Tests 4447 passed (4447); exit 0
npm run check                        COMPLETED 1282 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run build                        exit 0
npm run format:check                 All matched files use Prettier code style!
npm run lint                         exit 0
the ASCII gate (perl, spec form)     printed nothing, exit 0
python3 -c "yaml.safe_load(...)"     the four YAML files parse, exit 0
sh bin/size-check.sh                 exit 0
sh bin/folder-check.sh               exit 0
npm run build && npm run test:browser  288 passed (6.3m); exit 0
ls -d $TMPDIR/oculus-* | wc -l       7022 before, 7022 after the node run, 7022 after the browser run, 7022 after the revert-check runs
```

`node bin/revert-check.mjs` over fifteen files I chose (eight of them the report names, five of them J's files, two of them browser specs): `tests/checks/source/comment-width.test.ts` 2 reverts 0 unproven | `tests/server/content/images.test.ts` 4/0 | `tests/views/whole/type-scale.test.ts` 1/0 | `tests/state/client/writes.test.ts` 1/0 | `tests/views/boards/project.test.ts` 1/0 | `tests/checks/config/config-folder.test.ts` 2/0 | `tests/state/forms/form-drafts.test.ts` 8/0 | `tests/checks/tree/audits.test.ts` 10/0 | `tests/browser/views/map.spec.ts` 1/0 | `tests/browser/views/memories.spec.ts` 2/0 | `tests/state/sources/explorer.test.ts` 2/0 | `tests/views/boards/person.test.ts` 2/0 | `tests/views/feeds/leads.test.ts` 1/0 | `tests/views/feeds/radar.test.ts` 1/0 | `tests/server/edit/writes-collection.test.ts` 2/0. Every count the report quotes reproduced.

The nine premises the brief says no longer stand: I re-ran each on the main checkout at bdc6aad1 and agree with all nine. Two carry a line-number drift that does not change the premise: the `words` fixture is `tests/checks/source/keys.test.ts:397`, not `:396`; `repoShape` answers `reading` at `src/lib/views/shared/changes/repo-shape.ts:26`, not `:24-25`.

Report counts reproduced: `git diff bdc6aad1 --numstat` gives 542 files, 6330 insertions, 4160 deletions; `-- tools/oculus/src` 337 files 3421/2160; `-- tools/oculus/tests` 194 files 2797/1933; config, bin, DESIGN.md, HELP.md 11 files 112/67. Nothing outside `tools/oculus/` is touched. A1 verified with the brief's own awk: 85 comment lines past 100 columns remain, 82 of them tool directives and 3 of them `#` lines inside a template literal in `bin/migrate-joint-work.mjs`.

## Spec

1. **E5's row width was named a defect to fix and was kept.** The brief (Q59.md section E, item 5): "the row width and the tooltip's description are defects and are fixed with a case each; the picker and the touch controls are fixed or kept with the reason in the report." The report keeps the row width: "E5, the row width. Kept." `src/lib/ui/tree/TreeItem.svelte:222-232` still reads `.item { display: flex; ... min-width: 0; ... }` with no bound. Only the picker and the touch controls were the brief's "fixed or kept" pair; the row width was not.

2. **F's floor was not regenerated and the report says nothing about it.** `git diff bdc6aad1 --stat -- tests/checks/tree/allow-audits.txt` prints nothing; the file holds 150 entries. The brief: "the floor regenerated from the tree under the new rule in the same change, with the entries that leave and join it listed in the report", and the report shape asks for "the floor entries F moved". Instead, 31 test cases were renamed to open with "audits that" (`git diff bdc6aad1 -- tests | grep -c "^+.*it('audits that"` = 31 added, 0 removed), across `tests/views/{feeds,personal,sessions,shared,sources,structure,system,whole}`. `grep -n -i "audits that\|renamed\|floor"` over the report prints nothing: neither the renames nor the unchanged floor appear anywhere in it. I checked each of the 31 bodies for a real `render(`/`html(` call in code and found none, so the renames are honest, but they are a reclassification of 31 cases from coverage to audit and the report does not state it.

3. **A3's reader check is a looser shape than the brief named.** Brief A3 asked for "a literal `glyph=` or `glyph:` value, a catalog value naming it, a view registration, a config value". `tests/checks/config/config-folder.test.ts` `glyphReaders` instead collects `for (const match of text.matchAll(/['"\`]([\w-]+)['"\`]/g)) found.add(match[1]);` over every file under `src`, plus every string value of every config file. Any glyph name that happens to appear as a quoted word anywhere in `src` passes. Not named as a decision in the report.

4. **D2 substitutes a runtime throw for the test the brief asked for.** Brief D2: "if none can, a test states the one-add-form rule where the key is made, so a view that adds a second fails it." `src/lib/state/forms/form-drafts.svelte.ts` `claimForm` throws instead: `if (held.includes(form)) throw new Error(\`a second form is drawn over ${form} in ${instance}\`);`, claimed from `src/lib/views/shared/forms/EntryForm.svelte:138` `$effect(() => target.claim(form));`. The rule now lives in production code as a page error, not in a test.

5. **Two file reorganisations no brief item asks for, neither in the report.** `tests/views/boards/focus-fixture.ts` (366 lines) was cut out of `focus.test.ts` (871 -> 563 lines), and two whole cases moved from `tests/browser/sources/files.spec.ts` (893 -> 844 lines) into `tests/browser/sources/files-sections.spec.ts` (44 -> 140). Both are forced by `bin/size-check.sh`'s 900-line limit once the rewrap added lines, which is a good reason, but the report lists the new file with no reason and does not mention the moved cases at all.

6. **A1's exception set is wider than the brief's two.** Decision 1 of the brief: "its two exceptions are named in its head comment" (a `revert:` directive, an unwrappable word). `tests/checks/source/comment-width.test.ts:25` is `const WHOLE = /revert:|eslint-disable|eslint-enable|prettier-ignore|svelte-ignore|@ts-expect-error/;`. 42 of the 82 exempted long lines are `eslint-disable-next-line`, not revert directives. The exemption is correct in substance (eslint reads the line whole) but is a widening the report does not name.

7. **C2 adds a query key to a served endpoint without naming it.** `src/lib/views/personal/memories/Memories.svelte` `source()` now returns `${base}&again=${again}`. A wire-format addition on `/api/memories` that the brief does not name; the report says only "at an address of its own".

## Proof

1. **The C3 change is proven by nothing, by the builder's own account.** `tests/browser/views/map.spec.ts` carries `// revert: src/lib/views/structure/map/Graph.svelte:125 => delete`. Line 125 is `void tick().then(measure);`; the C3 fix is `void textScale();` at line 124. My run reproduces `1 reverts, 0 unproven`, but what turns red is the measure call, not the fix. The report states it: "removing that read alone leaves the case green ... The case's revert is the measure itself." Under the spec's "Every new or changed test names the revert that turns it red", C3 has no such revert, and on the report's own reasoning `void textScale()` changes nothing.

2. **The brief's verification item 8 is absent from the report.** Row J cites "the full revert-check run below" and there is no such section; the "Verify, on the worktree" block lists nine lines and the whole-tree `node bin/revert-check.mjs` is not among them. `grep -n "212\|unproven" ` over the report finds only the per-file counts in the DONE table. The claim in row J, "Every directive of the tree names the line its prose names", rests on a run that is not quoted. My fifteen-file sample found 0 unproven, which is consistent with it but does not establish it for the tree.

3. **B1's stated measurement is wider than the committed case, and the case has no revert.** The report: "Measured at 1, 1.25, 1.5, 2 and 3 device pixels a CSS pixel". The case added at `tests/browser/workbench/tabs.spec.ts:630` loops `for (const ratio of [1.25, 1.5, 2])` and carries no `// revert:` directive, so `bin/revert-check.mjs` reports it unchecked. Ratios 1 and 3 are asserted by no committed check.

4. **E4 covers six of the seven catches the brief named.** Brief E4 lists `src/lib/server/files/open.ts` catches at `:93, :142, :154, :185, :200, :207, :230` (base numbering). Three are pinned: `tests/routes/files/open-program.test.ts:167,196,344` name `open.ts:164` (`aliasFlagged`), `:150` (`hasBookmarkHead`) and `:240` (`openable`). Three are named as audits in the report: `fileOrFolder`'s and `openTarget`'s `statSync`, and `allowed`'s `realpathSync`. The seventh, base `:207` / now `src/lib/server/files/open.ts:216`, the per-root `try { if (inside(real, realpathSync(root.dir))) return real; } catch { continue; }` inside `allowed`, is neither pinned nor named.

5. **The negatives check's predicate was widened, undisclosed.** `tests/checks/tree/negatives.test.ts` replaced `if (at > 0 && explains(lines[at - 1], lines[at])) continue;` with `if (explains(commentAbove(lines, at), lines[at])) continue;`, and `explains` now joins the whole comment block above the assertion before applying `isReason`. A block whose last line alone would fail the four-word floor now passes. The rewrap makes the change necessary, and the list itself did not grow (`git diff bdc6aad1 --numstat -- tests/checks/tree/allow-negatives.ts` gives 7 added, 22 removed, and every added line is head comment or a trailing-comma change), but the report does not mention the rule change at all.

6. **A4's defect shape is reintroduced by the move in finding Spec-5.** `keepServedFiles()` in `tests/browser/helpers/files.ts` restores `.oculus/bookmarks.yml` and `.oculus/workspaces.json` in an `afterEach`. The two note cases moved into `tests/browser/sources/files-sections.spec.ts` write notes into the served home, delete them as their last statements, and that file does not call `keepServedFiles()` (`grep -rn 'keepServedFiles()' tests/browser` lists `unsaved-forms`, `source`, `repositories`, `files`, `files-forms` and the helper, not `files-sections`). A case that stops halfway there leaves its note for the cases after it, which is exactly the shape A4 was raised for.

The two allow lists my brief flagged did not grow: `tests/checks/tree/allow-duplication.txt` is 747 lines before and after, changes confined to line numbers; `tests/checks/tree/allow-negatives.ts` shrank; `bin/size-allow.txt` and `tests/checks/tree/allow-audits.txt` are untouched; `tests/checks/tree/allow-styling.ts` lost the CardActions entry and changed only line numbers otherwise.

## Standards

1. **A head comment the tree contradicts, the same defect class as A6.** `tests/views/boards/focus-fixture.ts:3-4`: "The Focus view's test files share it, each case building its client afresh." `grep -rn "focus-fixture" tests` finds one importer, `tests/views/boards/focus.test.ts:40`; `tests/views/boards/focus-rows.test.ts` imports it not at all.

2. **A literal the reader sees.** `src/lib/state/client/writes.svelte.ts` adds `export const TIMED_OUT = 'timeout';` and returns it as `answer.error`. Only `src/lib/views/shared/forms/EntryForm.svelte:200` tests `answer.timedOut` and words it from the catalog. Every other reader draws `answer.error` straight: `views/shared/card/ProjectCard.svelte:225,263,269`, `views/shared/forms/NewIdeaForm.svelte:48`, `views/shared/forms/Subtasks.svelte:65`, `views/shared/links/BookmarkStar.svelte:45`, `views/shared/links/ProgramButton.svelte:45`, `views/feeds/leads/LeadCard.svelte:71`, `views/feeds/radar/RadarCard.svelte:66`, `views/feeds/linkedin/PostCard.svelte:38`, `views/feeds/inbox/InboxCard.svelte:99`, `views/sessions/changes/Changes.svelte:119`, `views/sessions/terminal/Terminal.svelte:201`, `views/system/history/rows.ts:93`, and `views/sources/files/Files.svelte`'s `refusal(answer.error ?? '')`. The spec: "every user-facing string from a catalog file under `config/text/` through `t("group.key")` ... A literal string ... anywhere a reader sees it is a defect."

3. **A name now exported twice with two meanings.** `src/lib/server/files/search.ts:45` already has `export const TIMED_OUT = 'the search timed out';`.

4. **A file written under `.scratch/` beyond the report.** `tools/oculus/.scratch/migration/agents/reviews/q59-storage-probe.spec.ts`. `agents/spec.md` line 33 reserves everything under `.scratch/` to the orchestrator; the brief authorises the report file alone.

No history in any added comment (`git diff bdc6aad1 -- src tests bin config | grep '^+' | grep -iE '\b(Q[0-9]+|R1[0-9]|D2[0-9])\b|20[0-9]{2}-[01][0-9]-[0-3][0-9]'` prints nothing). No `globalThis` added; `drawn` in `createFormDrafts` and `answers` in `Memories.svelte` are closure- and component-scoped, not module state. `README.md` mentions none of the names the diff changed. DESIGN.md's Configuration, live-data, unsaved-input, tree-row, card (with the Memories sentence), Show in Files and tabs lines and HELP.md's opened-for-something line are corrected, seven and one.

## Behaviour

1. **The write timeout reaches every write, not only the entry form.** The report states one line: "the entry form says `editor.timed_out`". `send()` is the single path for `writeGit`, `addBookmark`, `addRoot`, `saveWorkspace`, `addMemory`, `writeSession`, `deleteNote` and the rest, so a git commit, a bookmark star, a root add or a memory upload that outlasts `writes.timeout_seconds` now shows the reader the bare word "timeout" through the readers listed in Standards 2. Before: the control stayed disabled until Cancel or a reload. After: at 30 s the reader gets an untranslated word in most places and a sentence in the entry form. The report gives the after for one surface only.

2. **A second form over one draft key now throws.** `claimForm` raises inside `EntryForm`'s `$effect`, which surfaces as a page error rather than a refusal line. The report says "a second claim over one key of one instance is refused" and gives neither the before (the two forms shared a draft) nor the after (the page errors).

3. **Picture requests carry a new query key after a failure.** `/api/memories?file=<name>&again=<n>`. Stated in the report only as "an address of its own".

4. **The sash's reach before a handle shrank from 1px to 0.1px.** `src/lib/themes/tokens.css` adds `--sash-reach-start: 0.1px` and `src/lib/ui/frame/Sash.svelte` uses it for `left`/`top` of `.sash::before`. A pointer on the last device-pixel column of the pane before the handle used to catch the handle and now does not. The report's B1 paragraph explains why the two differ but does not put it as a before and after, and the head comment records that the sliver holds only to ten device pixels a CSS pixel.

## Not checked

- The whole-tree `node bin/revert-check.mjs`, which the brief's verification item 8 requires and which my own brief puts at over two hours. I sampled fifteen files instead, named above.
- `tests/browser/workbench/unsaved-forms.spec.ts`, the sixteenth of J's revert lines; the other fifteen (form-drafts 7, writes-collection 2, explorer 2, person 2, leads 1, radar 1) all came back 0 unproven.
- The on-screen look on the TEST page, which is the orchestrator's.
- I did not re-measure D1's storage-write numbers (20 writes, 374 bytes, under 0.1 ms each) or re-fetch E2's four VS Code sources; both are taken as the report gives them.
- `sh bin/scratch-count.sh` was not run; the `$TMPDIR/oculus-*` count was taken by hand around each suite instead.

## Usage

About 45 tool calls. My harness does not expose a token count.

# Repair round 1, refuted

## Verification lines

```
npx vitest run --reporter=dot           Test Files 274 passed (274); Tests 4451 passed (4451); exit 0
npm run check                           COMPLETED 1284 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run build                           exit 0
npm run format:check                    All matched files use Prettier code style!; exit 0
npm run lint                            exit 0
the ASCII gate (the brief's perl)       printed nothing, exit 0
python3 yaml.safe_load over config/     58 yaml files parse, exit 0
sh bin/size-check.sh                    exit 0
sh bin/folder-check.sh                  exit 0
npm run build && npx playwright test     289 passed (6.4m), exit 0   (lsof -iTCP:8792 -sTCP:LISTEN found no listener before the run)
ls -d $TMPDIR/oculus-* | wc -l          7022 before; 7022 after the node run; 7022 after the browser run; 7022 after both revert-check runs
npx vitest run tests/views/structure/map.test.ts   Test Files 1 passed (1); Tests 19 passed (19)
```

`node bin/revert-check.mjs` over eleven files, in two runs:

```
writes.test.ts add-forms.test.ts config-folder.test.ts audits.test.ts form-drafts.test.ts map.test.ts open-program.test.ts
  -> 27 reverts, 0 unproven, 96 unchecked (exit 1 for the unchecked)
comment-width.test.ts images.test.ts type-scale.test.ts project.test.ts
  -> 8 reverts, 0 unproven, 55 unchecked
```

Per file, against the report's numbers: `comment-width.test.ts` 2 red, `images.test.ts` 4 red, `type-scale.test.ts` 1 red, `project.test.ts` 1 red, `writes.test.ts` 1 red, `config-folder.test.ts` 2 red, `add-forms.test.ts` 2 red, `audits.test.ts` 11 red, `open-program.test.ts` 4 red. Every count the report quotes for these reproduced. `form-drafts.test.ts` came back 7 red, 0 unproven (the report names no count for it in this round).

Diff shape re-run: `git diff bdc6aad1 --numstat` gives 545 tracked files, +6405 / -4206; `-- src` 339 files +3410/-2197; `-- tests` 195 files +2882/-1941; `-- config` 4 files +10/-15; `-- bin` 5 files +94/-44; `DESIGN.md` +8/-8; `HELP.md` +1/-1. `git status --short | grep '^??'` lists the six new files the report names. Nothing outside `tools/oculus/` is touched, and no commit sits on the branch (`git log --oneline bdc6aad1..HEAD` is empty).

A1 re-run with the brief's awk: 86 comment lines past 100 columns remain; 83 are `revert:` / `eslint-disable` / `svelte-ignore` / `@ts-expect-error` markers and 3 are `#` lines inside a template literal in `bin/migrate-joint-work.mjs`, which the check reads as string and not comment.

The first review's findings, re-checked one by one, all closed in the tree: Spec 1 (`.main { flex: 0 1 auto }` at `src/lib/ui/tree/TreeItem.svelte:264`, with the case and revert at `tests/browser/shell/views.spec.ts:27-49`); Spec 2 (`git diff bdc6aad1 --stat -- tests/checks/tree/allow-audits.txt` prints nothing, the file holds 150 entries, the report's floor section states the 31 renames, and I checked all 32 renamed "audits that" cases for a `render(`/`html(` call or a file-bound rendering helper in code and found none); Spec 3 (`glyphReaders` now matches the four named shapes plus config string values and `{G.name}`, `tests/checks/config/config-folder.test.ts:44-89`); Spec 4 (`claimForm` gone from `form-drafts.svelte.ts` and `EntryForm.svelte`; `grep -rn "claim" src/lib/state/forms/form-drafts.svelte.ts` finds nothing; the rule is `tests/checks/source/add-forms.test.ts`); Spec 5 (both reorganisations stated in the report); Spec 6 (each exempted marker named in `comment-width.test.ts:6-9`); Spec 7 (`&again=` in DESIGN.md's Memories line); Proof 1 (the named audit at `tests/views/structure/map.test.ts:460`); Proof 2 (the 49-file run quoted in the verify block); Proof 3 (`tabs.spec.ts` walks ratios 1, 1.25, 1.5, 2, 3 and carries `// revert: src/lib/ui/frame/Sash.svelte:135`); Proof 4 (`open.ts:217` pinned, red in my run); Proof 5 (the negatives predicate stated in the report); Proof 6 (`keepServedFiles()` restores the notes and `files-sections.spec.ts:10` calls it; `grep -rn keepServedFiles tests/browser` lists six specs and the helper); Standards 1 (`focus-fixture.ts:3` names `focus.test.ts`, and `grep -rn focus-fixture tests` finds that one importer); Standards 2 and 3 (`TIMED_OUT` and `timedOut` gone from `writes.svelte.ts`, words from `app.write_timed_out`, `server/files/search.ts:45` keeps its own name); Standards 4 (`ls .scratch/migration/agents/reviews/` no longer holds `q59-storage-probe.spec.ts`).

## Spec

none

## Proof

1. **Three of the four cases of the new `tests/state/client/writes.test.ts` are proven by nothing.** `agents/spec.md:56`: "Every new or changed test names the revert that turns it red." My run prints:

```
unchecked tests/state/client/writes.test.ts :: is the positive number of seconds the configuration names, in milliseconds
unchecked tests/state/client/writes.test.ts :: is none for a configuration that names no positive number
unchecked tests/state/client/writes.test.ts :: reads the time at each write, so a changed configuration holds for the next one
```

The first two assert over the pure function `writeTimeout`, which the same spec line calls an audit rather than coverage, and neither says so in its name. The third (`writes.test.ts:67`) is a behaviour case over code this step wrote and carries no directive; `createWrites` reads `settings()` inside `send` (`writes.svelte.ts:412`), so a revert that hoists the read out of `send` would redden it.

2. **The report's insertion counts are one higher than the tree's.** Report, "Files changed": "6,406 insertions ... 195 under `tests` (2,883 and 1,941)". `git diff bdc6aad1 --numstat` totals +6405, and `-- tests` totals +2882.

3. **The report's count of the state file's booked list does not match the file.** Report, "Open items": "Booked list: two entries in the state file." `sed -n 104,110p .scratch/migration/orchestrator-state.md | grep -c '^- '` prints 4: the three unlooked landings, the audits scan's three holes, the steps a review booked, and the sixteen revert lines. The two it does not name (the audits holes, the sixteen revert lines) are this step's F and J, so nothing is missing from the work; the count is wrong.

4. **The duplication floor's churn is not stated.** The report says the three entries that held the `answerWords` copies are gone. Comparing `git show bdc6aad1:tools/oculus/tests/checks/tree/allow-duplication.txt` with the file: 735 entries before, 732 after, and the difference is not only those three. Forty-nine entries are repointed from `tests/views/boards/focus.test.ts` to `tests/views/boards/focus-fixture.ts`, and two clone hashes are new to the list: `17012fccc62f` for `src/lib/views/personal/calendar/Head.svelte` / `src/lib/views/feeds/inbox/Head.svelte` (which lost `7818d57fbe19`, the same file pair re-hashed after the rewrap) and `de8f468bfe51` for `tests/state/boards/focus.test.ts` / `tests/views/boards/focus-fixture.ts` at line 745, which no entry of the base carries under any file pair. The list shrank overall; the report accounts for three of the nine removals and none of the six additions.

## Standards

1. **`src/lib/ui/tree/TreeItem.svelte:7-8`, a head comment the same file's diff makes false.**

```
    // A row with something to do when pressed carries one button over the whole line, which is what
    // a pointer presses; a row given nothing to do is the same line as text.
```

The button no longer covers the line: `.main` is `flex: 0 1 auto` at `:264`, and the row's own space is pressed through `pressedRow` on the `.item` div (`:128-130`, `:183`). The file's own CSS comment at `:258-261` states the new rule, so the head comment contradicts the block twenty lines further down. `agents/spec.md` and the hub `CLAUDE.md` both make a comment the code contradicts a defect; item A6 of this very brief is that defect class.

2. **`src/lib/views/sources/files/Files.svelte:54`, a sentence the change makes false.**

```
    // first bytes. One click opens the pane's preview tab and a double click opens a tab that is
    // kept.
```

`ondblclick` is given to `TreeItem` at `src/lib/views/sources/files/tree/Tree.svelte:219` and `TreeItem` puts it on the `<button class="main">` alone (`:204`). With `.main` bounded to its content, a double click on the row's space beyond its parts fires `pressedRow` twice and no `ondblclick`, so it opens the preview tab twice. The sentence now holds over the name, the glyph and the detail only.

3. **`tests/checks/source/code.ts` exports a name nothing reads, and holds the same body twice.** `grep -rn '\bfileKinds\b' tests` finds it only inside `code.ts`, where `fileCode` and `commentLines` call it. `code` (`:113-121`) and `fileCode` (`:124-131`) differ only in `kinds` against `fileKinds`; `code(text)` is `fileCode('x.ts', text)`. `tests/checks/tree/duplication.test.ts` does not flag it at eight lines.

## Behaviour

1. **A tree row's double click and its tooltip shrank from the row to the name, and the report states neither.** The report's before and after covers the single press ("a press on the row's own space beyond its parts opens it as a press on the name does"). Two other things the same change moved:
   - Before: `.main` was `flex: 1 1 auto`, so the button ran from the row's left edge to the controls and a double click anywhere on it opened the kept tab. After: a double click on the row's space beyond the name reaches no `ondblclick` and opens the preview tab a second time. `grep -rn dblclick tests/browser tests/views` finds one hit, `tests/browser/sources/files.spec.ts:176`, on a tab and not a row, so no case covers either state.
   - Before: `Tooltip ... block` inside that full-width button carried the row's `titleOf(row)` words over the whole row. After: the wrapper is the width of the name, so a pointer resting on the row's empty space shows no tooltip.

## Not checked

- The whole-tree `node bin/revert-check.mjs` over the 49 files carrying a directive. I ran eleven files in two runs, named above; the orchestrator's own run of 218 reverts, 0 unproven, 652 unchecked stands unrechecked by me.
- `tests/browser/workbench/unsaved-forms.spec.ts`, `tests/browser/sources/files-forms.spec.ts`, `tests/browser/sources/files.spec.ts` and the other browser specs whose directives this round repointed: not run through `revert-check` here.
- D1's storage-write numbers (20 writes, 374 bytes, under 0.1 ms each) and E2's four VS Code sources: taken as the report gives them, not re-measured or re-fetched.
- The on-screen look on the TEST page, which is the orchestrator's.
- Whether each of the 32 cases renamed to "audits that" reaches a render through a chain of helpers the scan follows: I checked each body for a `render(`/`html(` call in code and for any name the same file binds whose own block renders, and found none; I did not reproduce the scan's full multi-pass name resolution.
- `sh bin/scratch-count.sh` was not run; the `$TMPDIR/oculus-*` count was taken by hand around each suite.

## Usage

About 40 tool calls, two of them background runs (the browser suite, 6.4 minutes; the two revert-check runs, about 12 minutes together). My harness does not expose a token count.

## Closed

Every finding of both runs is closed in the tree; none is booked. The first run's, in the order it raised them: Spec 1 the row width, fixed with `tests/browser/shell/views.spec.ts`'s row case; Spec 2 the floor, regenerated (unchanged) and held by a case of its own, the 31 renames stated in the report; Spec 3 the glyph reader scan, tightened to four named shapes; Spec 4 the runtime throw, replaced by `tests/checks/source/add-forms.test.ts`; Spec 5 the two reorganisations, stated with their reason; Spec 6 A1's exceptions, each named in the check's head comment; Spec 7 the `&again=` key, named in DESIGN.md; Proof 1 C3, held by a named audit; Proof 2 the whole-tree run, run and quoted; Proof 3 B1, the case walks all five ratios; Proof 4 the seventh catch, pinned by a case; Proof 5 the negatives predicate, stated; Proof 6 the notes a halted case leaves, restored by `keepServedFiles()` which `files-sections.spec.ts` now calls; Standards 1 the fixture's head comment, corrected; Standards 2 and 3 the literal and the clashing name, both gone with `app.write_timed_out`; Standards 4 the probe spec, deleted; Behaviour 1 to 4, each a before and after in the report.

The run over repair round 1: Proof 1, the three unproven cases of `writes.test.ts`, each given the revert that reddens it (`node bin/revert-check.mjs tests/state/client/writes.test.ts` 4 reverts, 0 unproven, 0 unchecked); Proof 2, the insertion counts, recomputed in the report from `git diff bdc6aad1 --numstat`; Proof 3, the booked list, counted again as four; Proof 4, the duplication list's churn, stated in the report entry by entry; Standards 1, `TreeItem.svelte`'s head comment, rewritten to what the file does; Standards 2 and Behaviour 1, the double press and the tooltip, closed by `Tooltip`'s `over` prop, which puts the row's words back over the whole row, with the double press stated as a before and after; Standards 3, `code.ts`, folded so that `kinds` and `fileKinds` are internal and `code(text)` is `fileCode('one.ts', text)`.
