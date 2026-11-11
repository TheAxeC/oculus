# Step O186 refuter report (on .agents/worktrees/migration-O186, base 448c2b636)

## Verification (rerun by the reviewer)

All commands were run from the worktree root with Node from `$HOME/.nvm/versions/node/v24.21.0/bin`. I may not run `git grep`, so the brief's checks 3 and 4 were run as plain `grep -rn ... --exclude=local.yml` over the same paths. The unused-exports output was saved to a temporary file outside the repository, `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o186-unused.txt`, so it could be compared with `diff`. No file in the repository was written.

```
$ npm run diagrams   (TMPDIR unset; git status --short afterwards lists only the six changed files and the report)
$ npm run test:quick
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (3.3 s)
ok      eslint (2.8 s)
ok      svelte-check (11.3 s): 1794410184427 COMPLETED 592 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (35.0 s): Duration  21.28s (transform 33.34s, setup 0ms, import 71.23s, tests 10.18s, environment 657ms)
ok      vitest slow (38.2 s): Duration  24.33s (transform 14.63s, setup 0ms, import 21.74s, tests 7.06s, environment 1ms)
ok      vitest checks (55.7 s): Duration  41.63s (transform 21.99s, setup 0ms, import 46.16s, tests 108.04s, environment 3ms)
test:quick: 59.1 s; every command passed

$ LC_ALL=C perl -ne '...' <the six files of the brief>      -> printed nothing, rc=0
$ LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O186-report.md   -> printed nothing, rc=1
$ grep -rn settings_open_unavailable src tests config docs README.md --exclude=local.yml   -> nothing
$ grep -rn "can be opened once a folder" src tests config docs README.md --exclude=local.yml  -> nothing
$ grep -rn '\.unavailable' src/lib/views/system/workbench/settings   -> nothing (rc=1)
$ sh utils/unused-exports.sh > <scratch file>; diff .agents/worktrees/O186-unused-base.txt <scratch file>  -> no output, rc=0; wc -l: 334 and 334
$ git diff -U0 448c2b636 | grep '^+' | grep -v '^+++' | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"   -> nothing, rc=1
$ git diff 448c2b636 --stat
 config/text/views/system/workbench.yml             | 17 ++++++-----
 src/lib/state/system/config/config-files.ts        |  3 +-
 src/lib/state/system/config/groups.ts              |  2 ++
 src/lib/state/system/config/scopes/rows.ts         |  7 +++--
 src/lib/state/system/config/view/folders.ts        |  4 ++-
 .../views/system/workbench/settings/List.svelte    | 35 ++++++++++++----------
 6 files changed, 40 insertions(+), 28 deletions(-)
$ wc -l <six files>  -> 322, 130, 371, 134, 71, 263
$ grep -rn <showDefaults|showOculusFile|settings_open_unavailable|show_file|texts_about|desc_agents|desc_file_nesting|desc_glyphs|desc_icons|desc_latex|desc_unimath> src tests config docs README.md --exclude=local.yml
   showDefaults: none; settings_open_unavailable: none; showOculusFile: List.svelte:109,139,174;
   show_file: List.svelte:170,172, workbench.yml:73,74; texts_about: groups.ts:333, workbench.yml:92;
   each desc_* key: its workbench.yml line only (read through descriptionKey/describedAs, config-files.ts:118-125)
$ grep -rln -e openTarget -e folderGroup -e CATALOGS_GROUP -e SCHEMAS_GROUP -e TEXTS_GROUP -e settings_open_unavailable -e showDefaults -e showOculusFile tests  -> nothing, rc=1
$ find ~/Applications/oculus.app -type d -name catalogs -path '*config*'  -> .../Resources/app/config/catalogs and .../config/options/catalogs; file counts catalogs 7, schemas 3, text 68; grep -c settings_open_unavailable in the app's workbench.yml -> 1
$ ls docs/adr  -> No such file or directory
```

Every command the builder's report quotes as evidence reproduces, except one count in its file table (see Proof 1).

## Verdicts

Items:
1. Every file row opens its file to read: holds. `List.svelte:169-175` draws a compact `ToolButton` with `settings.show_file`, glyph `open_preview` and tip `settings.show_file_tip` with `row.file`. It sits outside any condition and calls `showOculusFile(row.file)`, which opens `sourceTabState(OCULUS_CONFIG_ROOT, path)`; that tab is read-only per `draft.ts:385`. The heading lines keep Show Defaults and its words (`List.svelte:134-140`). The function the brief names, `showDefaults`, was renamed (Spec 1).
2. The edit open where the file can be edited: holds. `List.svelte:176-185` draws the unchanged Open file after Show File, under `targetOf(...) !== null`.
3. No dead row: holds. The span, the catalog key and the `.unavailable` rule are gone (the greps above).
4. Where the values are set: holds. The six `desc_*` sentences each name the workspace file's `settings:` and the right key (`agents`, `patterns`, `glyphs`, `icons`, `latex_editing`, `latex_unimath`), matching `workspace-layer.ts:8-13` and each options file's head. `texts_about` names `settings:` under `text`. `desc_vocab` is unchanged. Two prose findings on the nouns are under Standards 1 and 2.
5. Comments: holds for the five files of the write list. Two comments outside the list are made incomplete by the change (Standards 3).

Cases:
- Catalogs row `catalogs/glyphs.yml`, workspace without oculus's config folder: met by reading. Show File is unconditional, there is no else branch, and the route is `:oculus`, which reads `configDir(engine)` (`oculus-config.ts:26`). The press is confirmed at the look on landing.
- Same row, workspace holding the oculus repository: met by reading (Show File, then Open file through `openTarget`'s engine target). Look at landing.
- Before the workspaces answer has come (`engine: null`, `fs-transport.ts:206`): met by reading. Show File does not depend on `targetOf`, and Open file follows it in the markup.
- Schemas row `schemas/deck-schema.yml` and Texts row `text/views/system/workbench.yml`: met by reading. The tip "Open oculus's {0} in a tab that only reads it" makes no claim about values, so it is true of a schema file that holds none. The nested path is served under the config root.
- The six catalogs' help names `settings:` and the right key, true on the heading line: met. Headings verified with `grep -n heading config/options/catalogs/*.yml`: agents sessions; file-nesting and unimath editor; glyphs and icons appearance. The latex options file has no heading at line 9, but `latex_editing` is `heading: editor` in its body.
- Texts group sentence: met (`workbench.yml:92`).
- Search for `workspace`: met by reading. `search.ts:27` reads `row.help`, and the report names this as a visible change.
- Keyboard: met by reading. With the folder held a row has two tab stops, Show File then Open file, one more than before; without it there is one, where there was none. The accessible name is the label because `ToolButton.svelte:52-54,93` sets `aria-label={label}` for a compact button with a glyph. Look at landing.
- A file open in both a Show File tab and an Open file tab: met. `source.svelte.ts:395` skips `disk.track` for `OCULUS_CONFIG_ROOT`, and the report names this as a behaviour of the change.

## 1. Spec

1. `src/lib/views/system/workbench/settings/List.svelte:104-111,139,174`, the rename of `showDefaults`:
   ```
   -    function showDefaults(path: string): void {
   +    function showOculusFile(path: string): void {
   ```
   What is wrong: item 1 says the row opens "by the same `showDefaults` function the heading lines call", and no item asks for a rename. The body is unchanged and both buttons call it. The report lists the rename as judgment call 1, which the orchestrator may reverse.
   Failure scenario: none at run time (no other reader; the grep above finds no hit outside `List.svelte`). It is a change no item asks for. Item 1 still holds.

The premises of "What is on the tree" that I checked all reproduce:
- `fs-transport.ts:206` (`engine: null`);
- `source.svelte.ts:395`;
- the `oculus-config.ts` route;
- the heading grep;
- `describedAs` read at `groups.ts:182,243`;
- the installed app's folder and its 7/3/68 file counts;
- no test reading the changed names;
- no `docs/adr`.

The report gives the first run of every case. No dependency was added, no script was written, and no change falls outside the write list. The groups.ts head comment grew past line 19 by two lines, which stays inside that head comment.

## 2. Proof

1. `.scratch/migration/agents/reviews/O186-report.md`, the file table row:
   ```
   | `config/text/views/system/workbench.yml` | +8 -9 | 322 | yes |
   ```
   What is wrong: the diff gives 9 insertions and 8 deletions. There are six `desc_*` lines replaced, `show_file` and `show_file_tip` added, `texts_about` replaced and `settings_open_unavailable` removed, so `--stat` shows 17 changed lines with 6 added lines beyond the replacements, and the file grows by one line. The report's "+8 -9" is inverted.
   Failure scenario: a reader of the table would believe the catalog file shrank by one line. No decision rests on it.

No other claim fails to reproduce. No test was added or changed, and no check was widened.

## 3. Standards

1. `config/text/views/system/workbench.yml:29`, `desc_unimath`:
   ```
   ... per command, its glyph (and the package that defines it) and its words. The open workspace lays its own commands over these in its workspace file's `settings:`, under `latex_unimath`.
   ```
   What is wrong: "these" are "The Unicode math symbols" of the sentence before. What a workspace lays over them is rows (symbols), each matched by its `command` (`config/options/catalogs/unimath.yml` head: "a row naming oculus's command replaces it ..., a row with a new command comes after oculus's rows"). "Commands" names the key a row is matched by, not the unit laid over.
   Failure scenario: a reader on the Unimath line under Editor, or on the `catalogs/unimath.yml` row, reads that a workspace defines its own LaTeX commands there, when it sets symbol rows (command, glyph, words). "Symbols" is the noun the sentence's own subject uses. This is prose that is imprecise for the file it describes.
2. `config/text/views/system/workbench.yml:22`, `desc_latex`:
   ```
   ... the keys of the formatting chords and the math symbol groups the TeX view lists. The open workspace lays its own sections over these in its workspace file's `settings:`, under `latex_editing`.
   ```
   What is wrong: "sections" is the true name in `config/options/catalogs/latex.yml`'s head ("a section the workspace names (notice, at, environments, chords, symbols) replaces oculus's section whole"), but the description never introduces the word. Its list of four items also leaves out `environments`, which is one of the sections a workspace can set.
   Failure scenario: a reader cannot tell what a "section" is from the line and does not learn that a workspace's section replaces oculus's whole. The omitted `environments` is in the first sentence the step left as it was, so only the undefined noun belongs to this step.
   The other four nouns match their options files: agents (`agents.yml`: "an agent the workspace names replaces oculus's entry"), patterns (`file-nesting.yml`: "a pattern the workspace names"), stand-ins (`glyphs.yml`: "replaces oculus's stand-in") and icons (`icons.yml`: "replaces oculus's icon"). In `desc_agents` the "these" has no plural antecedent (the sentence's subject is "The composer"); that is minor.
3. Two comments outside the write list are made incomplete by the change:
   - `src/lib/server/files/workspace/oculus-config.ts:1-2`: "The read-only view of oculus's own `config/` folder that the Settings view reads its defaults from: the text of one file and the listing of one folder". Through this route Settings now also reads files that are no defaults: every `text/` file and `schemas/cpp-schema.yml` and `schemas/deck-schema.yml`, which the brief itself says hold no values anyone sets.
   - `src/lib/state/sessions/source/draft.ts:378-379`: "read through the read-only route over it (Settings' Show Defaults)". The route is now also Show File's.

   What is wrong: spec.md:72 makes a head comment that the change makes false a defect. These two are made partial rather than false, and the builder named both as "still true" and "outside the write list". The lazy-option rule (spec.md:13) says a path list is widened rather than leaving a comment stale.
   Failure scenario: a maintainer reading `oculus-config.ts` takes the route for a defaults-only reader and narrows it to defaults files, which would break Show File on the Texts and Schemas rows. Each fix is one clause, which can be made at landing.
4. `src/lib/state/system/config/view/folders.ts:27-31`:
   ```
   * One file listed in a group: its path, which the view draws with Show File, the open that only
   * reads it, and with Open file where a folder of the workspace holds oculus's config/ folder, and
   * its description when it has one.
   ```
   What is wrong: the chain "which the view draws with Show File ..., and with Open file ..., and its description" reads as if the description were a third thing drawn with the path. The type holds two things, a path and a description; the controls are the view's.
   Failure scenario: a reader parses the description as part of the clause about drawing. This is minor.

No non-ASCII, no history wording (the grep above prints nothing), no file over the size limits (263 lines for the component), no comment line over 100 columns, and no code larger than its job.

## 4. Behaviour

1. The help sentences render their backticked words (`settings:`, `agents`, `patterns`, `glyphs`, `icons`, `latex_editing`, `latex_unimath`, `text`) as inline code through `CodeText` (`List.svelte:144,149,188`; `CodeText.svelte:1-4`). The report's before and after says the lines "end with the new sentence naming the workspace file's `settings:` and the key". It does not say these pieces are drawn as code spans, on the heading lines of Appearance, Editor and Sessions and usage as well as on the Catalogs rows and under the Texts group heading.
   Failure scenario: the look at landing has no stated expectation for that styling. This is minor; the other visible changes (the drawn controls, the tooltip, the order, the tab stops, the accessible names, the removed muted line, the search hits, the longer heading-line descriptions, the two-tab refresh) are each stated with before and after.

## Declined to judge

- Whether the brief's `git grep` forms of checks 3 and 4 print the same as my plain `grep` (the reviewer may not run `git grep`). They cover the same paths, and tracked versus untracked files make no difference here.
- Whether the diagrams `npm run diagrams` rewrote differ from the committed ones (`git status --short` lists no diagram file, so none changed).

Reviewer usage: a739bf17e54eff7c3, claude-opus-5-5, 152376 tokens, 25 tool uses, 343.7 s.

## Closed

- Spec 1, `showDefaults` renamed `showOculusFile`: kept; the one function now serves Show Defaults and Show File, and its new name says so. No other reader.
- Proof 1, the report's file table row for `workbench.yml` (+8 -9 inverted): named in the booking; the diff is 9 insertions and 8 deletions.
- Standards 1, `desc_unimath` "commands": fixed at landing to "symbols".
- Standards 2, `desc_latex` "sections" undefined: fixed at landing, the sentence naming the sections a workspace sets and that each replaces oculus's whole.
- Standards 3, `oculus-config.ts:1-2` and `draft.ts:378-379`: fixed at landing, each naming Show File beside Show Defaults; the two paths join the step's at landing.
- Standards 4, `view/folders.ts:27-31`: fixed at landing, the comment reworded so the description is the type's second field.
- Standards 2's minor note, `desc_agents` "these" with no plural antecedent: fixed at landing.
- Behaviour 1, the code spans in the new sentences: an expectation of the look at landing.
