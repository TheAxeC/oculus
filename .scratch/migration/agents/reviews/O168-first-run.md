Usage: builder a677fb3bffc90a54b (claude-opus-5-5), first run, 276645 tokens, 90 tool uses, 16.3 min.

NOT DONE: O168 is stopped after the first run, before any code was changed, as the brief and the dispatch ask. The first run shows two cases the brief's own rules get wrong: C1 (the row above the stuck section heading) and the C5 sub-case "the server's words under a locale an app gives". The worktree is unchanged: `diff -rq` of `src`, `tests`, `config` and `utils` against `.agents/worktrees/O168-base` prints nothing, and `git status --short` prints nothing. No report file was written. This message is the hand-back.

## Case 1: C1, "no row shows above the sticky section heading"

**What the brief says.** Item 1 and its "What is on the tree" paragraph name one cause for both C1 flaws: the header row sticks inside the `overflow: hidden` box of `BoardList.svelte`. The brief also says "The board's card mode and every other table stay as they draw today."

**What reading shows for the first flaw.** It is explained. The `th` is sticky at `top: var(--group-strip, 0)` (`Table.svelte:107-111`). Inside a GroupHead body, `--group-strip` is the strip's height (`GroupHead.svelte:182-187`). `.list { overflow: hidden }` (`BoardList.svelte:96-104`) makes that box the header's scroll container, and the box never scrolls. So the header is pushed down by the strip's height and drawn over the group's first row.

**What reading shows for the second flaw.** It is not explained by that cause.
- The strip is `position: sticky; z-index: 2` (`GroupHead.svelte:219-222`). The `th` is `z-index: 1`.
- Nothing between them creates a stacking context. `Surface` is `display: contents` without a wallpaper; with one it is `isolation: isolate` at z auto, still under 2. So no row or header paints over the strip.
- The only thing the reading finds that can show above a stuck strip is the pane body's top padding. `Pane.svelte:233-238` gives `.body` `overflow: auto; padding: 10px 12px`. A sticky `top: 0` stands at the scroller's padding edge, so content scrolls through the 10 px band above the stuck heading. This is a judgment from how browsers place sticky elements; I could not check it, since a builder opens no page.
- If that is the cause, it is the same in card mode and in every view that draws GroupHead (Focus, Venues, Settings, Findings and the others listed at `GroupHead.svelte:64-79`). A `stays` table header (Problems, Gallery) has the same band.
- Fixing it at its cause changes card mode and those views, against "card mode and every other table stay as they draw today". It also needs `src/lib/ui/frame/Pane.svelte`, which is not on the path list: GroupHead cannot know the pane's padding without copying the literal 10 px.

**Options.**
- (a) Fix the header row in `BoardList` so it sits at its own place (no strip offset inside the non-scrolling box). Also fix the band at its cause: `Pane.svelte`'s body publishes its top padding as a custom property, and GroupHead's strip (and a `stays` table header) sticks at `top: calc(<its offset> - <that padding>)`, which holds at every nesting level. Nothing then shows above any stuck heading, in list mode, card mode and every other view. This needs `Pane.svelte` added to the path list, and the "card mode stays as it draws today" sentence relaxed for this one difference.
- (b) Fix only the header row. Rows would still show in the band above the stuck heading in list mode, so C1's second half stays unmet. This is the lazy option.
- **Recommendation: (a).** One look settles the premise before the ruling: on the scratch server, scroll the Projects board in card mode until a section heading is stuck, and check whether a card shows in the 10 px above it.

## Case 2: C5, "The server's words under a locale an app gives: that language's form"

**The rule.** G130, and `src/lib/data/sources/config/merge/language.ts:111-129`: "A key of a language file that oculus's catalog lacks is a finding ... and the key is not used". The workspace layer holds `settings.text` to the same rule ("an unknown key a finding").

**The result it gives.** After item 5, oculus's catalogue holds only the English forms of a plural key: `<key>.one` and `<key>.other`. A pack for a language whose rules give `few` or `many` (Polish gives `few` for 3) therefore cannot supply those forms: each is refused as a key oculus lacks, and the helper falls back to `other`. Under `pl`, 3 citations would read in the `other` form and not the language's `few` form. Ruling 716's purpose is lost for any language with more forms than English.

**Run on the unchanged tree.** It shows the rule with today's flat keys. The pack gives `cites_one` and `cites_few`; oculus holds `literature.cites` and `literature.cites_one`:
```
C5 language: oculus keys ["literature.cites","literature.cites_one"]
C5 language: findings ["text.literature.cites_few | text.literature.cites_few is not a key of oculus's text catalog; the display language pl of the app Polski does not use it"]
C5 language: catalog [["literature.cites","{0} citations"],["literature.cites_one","1 cytowanie"]] []
```

**Options.**
- (a) Add `src/lib/data/sources/config/merge/language.ts` and `src/lib/data/sources/config/merge/workspace-layer.ts` to the path list. A language file or `settings.text` may then give any of the six CLDR forms `<key>.<form>` of a key whose `<key>.other` oculus holds; every other unknown key is still a finding. G130's text gets that clause, which is the orchestrator's to write. This would also add a G130 row in `tests/data/sources/config/layers/language.test.ts`, which needs the entry's ruling.
- (b) Keep G130 as it is: a language gives only the forms English has, and draws `other` for every other count. This is the lazy option.
- **Recommendation: (a).**

## The first run of every case (unchanged tree)

**Case-run program.** `<session scratchpad>/caserun/tests/first-run.test.ts`, run with its own config in the same folder: `node_modules/.bin/vitest run --config <scratchpad>/caserun/vitest.config.mjs --root <scratchpad>/caserun --reporter verbose`. It writes nothing into the worktree. Its source will be quoted in the final report.

- **C1** (by reading). Projects list mode: the header row is pushed down by the strip height inside `.list` (`Table.svelte:107-111`, `BoardList.svelte:96-104`, `GroupHead.svelte:182-187`). The "row above the heading" has no cause in the brief's reading; see Case 1. Collection list mode (`EntryList`) has no GroupHead, and its header row sits at its own place (`--group-strip` unset, so `top: 0` inside a box that does not scroll).
- **C2** (program):
  ```
  C2 HubVocab keys: domains,venue_themes,data_themes,collections,list,words
  C2 HubVocab new_project_dir: undefined
  C2 primary reader, research: "projects/research"
  C2 primary reader, wrong shape: ""
  C2 primary reader, no tier entry: ""
  ```
  For a hub that is not the primary, `startFolder` returns `''` (`NewIdeaForm.svelte:85-93`).
- **C3** (program; `award` empty in every row is not known to `fittedColumns`):
  ```
  C3 width 420 [["title","47.059%"],["funder","26.471%"],["status","26.471%"]]
  C3 width 1200 [["title","30.769%"],["funder","17.308%"],["status","17.308%"],["award","17.308%"],["deadline","17.308%"]]
  C3 headers ["Title","funder","status","award","deadline"]
  ```
- **C4** (by reading). `RecordCounts.svelte` draws `Tag` inside a plain `ToolButton` inside `PressBox`. The words are `board.record_count` "{0} {1}" with a one-word `label`, so a count of one reads "1 publications". `Disclosure.svelte:13` requires `expanded`.
- **C5** (program):
  ```
  C5 literature.cites by hand 0 0 citations / 1 1 citation / 2 2 citations
  C5 references.count_one 1 result in 1 file
  C5 search 1 hit 1 file 1 hit in 1 file, 5 ms
  C5 search 1 hit 3 files 1 hit in 3 files, 5 ms
  C5 search 4 hits 2 files 4 hits in 2 files, 5 ms
  C5 noticeWords lsp_edit_partial_one The language server's edit stopped at a.md after 1 file was written. History undoes it.
  C5 noticeWords lsp_edit_partial The language server's edit stopped at a.md after 1 files were written. History undoes them.
  C5 Intl.PluralRules "en" other | "pl" few | "en_US" throws RangeError | "" throws RangeError
  ```
  The helper does not exist yet. The language sub-case is above.
- **C6** (program, `loadConfig` with `instead`):
  ```
  C6 vocab text label (as shipped) | findings: [] | label read: "idea"
  C6 vocab label map one/other | findings: ["categories.2.label | categories.2.label must be a text"] | label read: "idea"
  C6 vocab label map no other | findings: ["categories.2.label | categories.2.label must be a text"]
  C6 vocab label map with several | findings: ["categories.2.label | categories.2.label must be a text"]
  C6 vocab no label | findings: [] | label read: "idea"
  C6 text text map no other | findings: []
  C6 text file.other as shipped | findings: []
  C6 text editor.other as shipped | findings: []
  ```
  The G13 rows are not yet written.
- **C7** (by reading). `keys.test.ts:94` reads only `t|lookup|catalogText|sentence` calls (plus the server's `words` and catalogue indexing). A form key read through a helper has no reader in it, so it would be reported as an orphan.
- **C8** (by reading). `drawnFields` (`collection/index.ts:461-487`) draws the primary key `key` as a text field (KEY). It draws the meta pairs joined as "Students: 7", `related` (tags with `foreign_key: projects`) as tags of raw ids, and fields the schema does not name under their raw key. `websiteGroup` puts the Website fields (CV SECTION, CV PLACE) in the right column (`EntryFields.svelte`). The schema checked is the research hub's `.oculus/data/academic/education.yml`, read only.
- **C9**. `npx vitest run tests/ui/html.dom.test.ts tests/state/sessions/source/source.test.ts --reporter=dot` printed `Test Files  2 passed (2)` and `Tests  35 passed (35)`. A node run of `marked`: `parseInline('job I/O on /local/<jobid>')` returns the text with `<jobid>` intact, and `lexInline` gives the tokens `["text","html"]`, so `<jobid>` reaches the sanitiser as a tag. The hub line is `resources.yml:18`.
- **C10** (by reading). For a failed fetch the route answers `error` = `failureLine(...)` or `outcome.error` (`git-routes.ts:512-523`). `fetchFailureOf`'s line, with ssh's cause, is only kept for the watcher (`git-routes.ts:259`).
- **C11** (by reading). `app.yml:91,96` and `debug.yml:44` take `{0}`, which is filled with `PARTS = ','` at `CppRows.svelte:86,122` and `LaunchEdit.svelte:79`. `debug.yml:50-51` already says "split by commas".
- **C12**. The same run as C9: `source.test.ts` passes alone. The load race is seen by reading only: `settled` (`source-server.ts:198-207`) waits one timer turn, while `digestOf` (`fs-transport.ts:564-566`) awaits `crypto.subtle.digest`.

## One run to report

`npx vitest run --project unit --dir <scratchpad>/caserun` was meant to run one scratchpad file. It started the worktree's whole `unit` project instead, and was stopped with `kill` after about 5.5 minutes, before it finished. It wrote nothing (`git status --short` empty, `diff -rq` against the base empty). Every later case run used the scratchpad's own vitest config. No other whole-suite command was run, and `npm run test:quick` has not been run.

## What happens next

The orchestrator rules on Case 1 and Case 2: an option for each, and for C1 the look on the scratch server that settles the premise. The builder then resumes with the ruling and builds items 1 to 10, and the final report carries the ruling.
