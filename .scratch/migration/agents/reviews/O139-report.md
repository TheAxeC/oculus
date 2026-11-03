# Step O139 report: a finding of another hub names its hub, and every file finding opens its file

Everything in the brief is done.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:205-208` (read with the Read tool, lines 205-210):

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The list holds no entry.

## The cases' first run, on the unchanged tree

No case of the brief came out wrong under the brief's own rules, so the build went on with no hand-back.

The case-run program, `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o139-cases.mjs`, in the session scratchpad. It only prints, and writes no file:

```js
// Case-run program of step O139: prints fileUnder's answer for the inputs of the cases C9, C10,
// C13, C14, C16 and C19. Usage: node o139-cases.mjs <path to paths.ts>. It writes nothing.
const { fileUnder } = await import(process.argv[2]);

const lab = { key: 'lab', dir: '/tmp/lab', real: '/private/tmp/lab' };
const main = { key: 'main', dir: '/w/main', real: '/w/main' };
const inner = { key: 'inner', dir: '/w/main/side/inner', real: '/w/main/side/inner' };
const gone = { key: 'gone', dir: '/w/gone', real: '' };

const cases = [
    ['C9 dir file', '/tmp/lab/.oculus/config.yml', [main, lab], 'main'],
    ['C9 real file', '/private/tmp/lab/x.yml', [main, lab], 'main'],
    ['C10 empty file', '', [main, lab], 'main'],
    ['C13 inner file', '/w/main/side/inner/a.yml', [main, inner], 'main'],
    ['C13 primary file', '/w/main/registries/b.yml', [main, inner], 'main'],
    ['C14 no primary, hub file', '/w/main/registries/b.yml', [main, lab], null],
    ['C14 no primary, lab dir file', '/tmp/lab/.oculus/config.yml', [main, lab], null],
    ['C16 root with empty real', '/w/gone/x.yml', [main, gone], 'main'],
    ['C19 lab collection file', '/tmp/lab/registries/people.yml', [main, lab], 'main'],
    ['C19 lab change record', '/tmp/lab/projects/p/project.yml', [main, lab], 'main']
];

for (const [name, file, roots, primary] of cases) {
    console.log(`${name}: ${JSON.stringify(file)} -> ${JSON.stringify(fileUnder(file, roots, primary))}`);
}
```

Run on the base copy: `PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH node <scratchpad>/o139-cases.mjs /Users/axelfaes/workspace/oculus/.agents/worktrees/O139-base/src/lib/data/helpers/files/paths.ts`:

```
C9 dir file: "/tmp/lab/.oculus/config.yml" -> null
C9 real file: "/private/tmp/lab/x.yml" -> {"root":"lab","path":"x.yml"}
C10 empty file: "" -> {"root":"main","path":""}
C13 inner file: "/w/main/side/inner/a.yml" -> {"root":"inner","path":"a.yml"}
C13 primary file: "/w/main/registries/b.yml" -> {"root":"main","path":"registries/b.yml"}
C14 no primary, hub file: "/w/main/registries/b.yml" -> {"root":"main","path":"registries/b.yml"}
C14 no primary, lab dir file: "/tmp/lab/.oculus/config.yml" -> null
C16 root with empty real: "/w/gone/x.yml" -> null
C19 lab collection file: "/tmp/lab/registries/people.yml" -> null
C19 lab change record: "/tmp/lab/projects/p/project.yml" -> null
exit 0
```

The other cases, read on the base copy (`O139-base/src/lib/views/system/findings/Findings.svelte`):

- C1. Every Files row draws `<span class="file" title={finding.file}>{named(finding.file, finding.line)}</span>` (:134-136), plain words with no chip and no control. Nothing opens the file.
- C2. The same plain span. With `lab` behind no link, `named` (:102-105) gives `.oculus/config.yml:<line>`. No chip, no control.
- C3. The same plain span. With no line, `named` returns the path alone (:104). No control.
- C4. `fileUnder` gives null, so `named` falls back to the whole path (:103). The span's title is the whole path (:134). No chip, no control.
- C5. A relative file with no primary: `fileUnder` gives null (`paths.ts:183`). Plain words with the whole path, as C4.
- C6. A file under `ordo`: `named` gives the path under `ordo`, plain words. No chip, no control.
- C7. `KeyChoice` is drawn under the row when `keyed.get(index)` gives a choice (:132, :139-141).
- C8. The search is `fileSearch(found, search, (finding) => named(finding.file, finding.line))` (:91), and `fileSearch` matches `${named(finding)} ${finding.key} ${finding.message}` (`src/lib/state/system/audit.ts:45-55`).
- C9. Printed above: null for `/tmp/lab/.oculus/config.yml`, so plain words with the whole path. `{ root: 'lab', path: 'x.yml' }` for `/private/tmp/lab/x.yml`.
- C10. Printed above: `fileUnder('')` gives the primary with path `''`. The row draws an empty plain span (:134-136).
- C11. oculus's `config/` finding with oculus's folder a root: `named` gives `config/...`, plain words. No chip, no control. The same for an apps state finding under `oculus-state`.
- C12. The options folder's `defined_twice` finding names `join(dir, OPTIONS_DIR)` (`options-folder.ts:134`), with no closing `/`. Its row is plain words `config/options`. No control.
- C13. Printed above: the inner root wins for a file under it, and the primary holds the rest. The rows are plain words.
- C14. Printed above: with no primary, a file under `main` gives `main`. `lab`'s file under its link gives null.
- C15. `registry.refused()` findings come into `found` (:80). Their files are `pushed?.from[key] ?? ''` (`src/routes/views.ts:106`) or `listFileOf` (`src/lib/data/index.ts:405-409`). The rows are plain words.
- C16. Printed above: null for a file under a root whose `real` is empty (`paths.ts:187-188`).
- C17. No control in a Files row. `<li>` carries no `data-card` (:133), so the shell's arrow keys and Enter (`src/lib/shell/keys/key-dom.ts:62-74`) step only through Audit rows.
- C18. `.file` is `min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap` (:196-202) in a `flex-wrap: wrap` row (:174-181).
- C19. Printed above: the files of `lab` under its link give null. The callers that pass them are `fileShown` (`src/lib/state/sessions/changes.svelte.ts:86`), `registryFile` (`src/lib/views/shared/forms/registry/registry-file.svelte.ts:68`) and Collection's `parts` (`src/lib/views/boards/collection/Collection.svelte:153`).

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1. The chip after the name, with no chip for the primary's file, an unheld file or an empty file | DONE | Findings.svelte:165-188; the look on landing (C1, C2, C4, C6) |
| 2. RootChip's `tip` prop, which keeps today's words by default; `findings_file_root_tip` after `findings_files`; RootChip's head comment | DONE | RootChip.svelte:2-10, 23, 26, 41; findings.yml:8; the key grep below |
| 3. The control: `plain cut` in an `inline-flex; min-width: 0` box, the `named` label, the title `Open <path>`, a source tab at the line, `showFolderInFiles` for a folder, plain words for an unheld file | DONE | Findings.svelte:131-137, 168-182, 261-264; the look on landing (C1, C3, C12) |
| 4. The name on one line and cut, the chip whole, the key and the message wrapping after | DONE | Findings.svelte:243-249; the look on landing (C18) |
| 5. One tab stop each; Enter and Space; the ring drawn whole; the arrow keys as today | DONE | Read at ToolButton.svelte:68, 458-460 and Findings.svelte:166; the look on landing (C17) |
| 6. `named` and the search unchanged | DONE | Findings.svelte:102-104, 114-117 match base :90-92, 102-105 |
| 7. `fileUnder` matches `dir` and `real`, longest folder wins, doc comment | DONE | paths.ts:173-200; the case-run output above |
| 8. The options folder's finding ends in `/`; comment at :128 | DONE | options-folder.ts:128-130, 136 |
| 9. The head comment of Findings.svelte | DONE | Findings.svelte:32-47 |
| 10. The HELP sentence | DONE | `docs/HELP.md:345` |
| 11. No change to `configPayload`, the server or the wire beyond item 8 | DONE | `diff -rq` lists no file under `src/lib/server` or `src/routes` |
| Verify 1: the named checks and the importers of the changed modules | DONE | See below |
| Verify 2: `npm run diagrams`, then `npm run test:quick` | DONE | See below; the list ran twice |
| Verify 3: the character-set checks | DONE | See below |
| Verify 4: `sh utils/unused-exports.sh` against the base | DONE | See below |
| Verify 5: `sh utils/folder-check.sh`, and the sizes | DONE | See below |
| Verify 6: no test added or changed | DONE | `diff -rq ../O139-base/tests tests` prints nothing (exit 0) |

Verify 1. These were run after the last edit to `paths.ts`, `options-folder.ts`, `RootChip.svelte` and the catalog: `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/duplication.test.ts tests/checks/config/config-folder.test.ts tests/state/client/held-unsaved.test.ts tests/data/helpers/hub-names.test.ts tests/routes/docs/wallpaper.test.ts tests/state/sessions/changes-file.test.ts tests/checks/config/config.test.ts tests/checks/source/keys.test.ts --reporter=dot`. The four test files that import `paths.ts` are named in it. No test imports `options-folder.ts`, `RootChip.svelte` or `Findings.svelte` (`grep -rln "options-folder\|readOptionsFolder\|RootChip\|system/findings" tests`). The run printed:

```
 Test Files  1 failed | 8 passed (9)
      Tests  1 failed | 186 passed | 2 skipped (189)
```

The failure was `tests/checks/tree/boundaries.test.ts`, with both tests reporting `Error: Test timed out in 5000ms.` The load average was 13.77 (`uptime`). That file is not one the step changes. Run alone with the verbose reporter, it passes:

```
 Test Files  1 passed (1)
      Tests  11 passed (11)
```

The last edit, which typed the `tip` arrow's parameter on Findings.svelte:185, was covered by the second run of the list. That run held the boundaries, duplication and catalog checks under `vitest checks`.

Verify 2. `npm run diagrams` printed `diagrams exit 0` and regenerated the four diagram files above. Then came `npm run test:quick`, with its output in the scratchpad log `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/quick2.log`:

```
test:quick: 10 changed file(s), from git since HEAD
test:quick: 81 test file(s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (17.8 s)
ok      svelte-check (18.2 s): 1793736788210 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (133.6 s): Duration  112.34s (transform 58.89s, setup 0ms, import 173.33s, tests 263.35s, environment 7.57s)
ok      vitest checks (161.0 s): Duration  138.69s (transform 99.98s, setup 0ms, import 190.33s, tests 284.62s, environment 5ms)
ok      vitest slow (187.0 s): Duration  164.45s (transform 48.77s, setup 0ms, import 123.11s, tests 474.39s, environment 4ms)
test:quick: 189.4 s; every command passed
```

The list ran twice. On the first run, `test:quick: 208.1 s; failed: eslint, vitest slow`.

- The eslint failure was in a file the step changes. Run alone, it printed `Findings.svelte 185:90 error Unsafe argument of type any assigned to a parameter of type string | number @typescript-eslint/no-unsafe-argument`. The `tip` arrow's parameter is now typed `(root: string)`. Rerun alone, `npx eslint --no-warn-ignored src/lib/views/system/findings/Findings.svelte` exits 0.
- The slow failure was `tests/data/hubs/hub-portfolio.test.ts`, "reads a field of a second-hub entry that names a record as the key its file holds (G32)", with `Error: Test timed out in 20000ms.` That file is not one the step changes. Rerun alone, `npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow --testTimeout 20000`, it printed `Test Files 1 passed (1)` and `Tests 16 passed (16)`, with G32 in 2973 ms.
- No whole-suite command was run.

Verify 3. The perl form, over `src/lib/views/system/findings/Findings.svelte src/lib/views/shared/card/RootChip.svelte src/lib/data/helpers/files/paths.ts src/lib/data/sources/config/merge/options-folder.ts config/text/views/system/findings.yml`, printed nothing (`exit 0`). The grep form, `LC_ALL=C grep -n '[^ -~]' docs/HELP.md docs/diagrams/layers.dot docs/diagrams/layers.svg docs/diagrams/layer-views.dot docs/diagrams/layer-views.svg`, printed nothing (`exit 1`, no match). Both were run after the last change.

Verify 4. `sh utils/unused-exports.sh | diff - ../O139-base/unused-exports.txt` printed nothing (`diff exit 0`), after the last change.

Verify 5. `sh utils/folder-check.sh` printed nothing (`exit 0`). `wc -l` gives Findings.svelte 294 and RootChip.svelte 54, both at or under 520, and paths.ts 261 and options-folder.ts 148, both at or under 880.

## The cases after the change

Read in the worktree (`src/lib/views/system/findings/Findings.svelte`, 294 lines). A row's file name and chip sit in `<span class="named">` (:167). `placed(file)` (:123-125) gives null for an empty file and otherwise `fileUnder(file, roots(), primary())`. Where `placed` gives null, the row draws the plain span `<span class="file" title={finding.file}>` (:168-171). Otherwise it draws `<span class="place">` (:173) holding `ToolButton plain cut`, labelled `named(...)` and titled `t('audit.open_place_tip', finding.file)` (:174-181), whose press is `opened(finding.file, under, finding.line)`. Then comes `<RootChip record={{ root: under.root }} tip={(root: string) => t('views.findings_file_root_tip', root)} />` (:183-187). `opened` (:131-137) calls `client.layout.showFolderInFiles(normalisePath(under.path), under.root)` for a file that ends in `/`. For any other file it calls `openSourceFile(client, { ...under, ...(line === undefined ? {} : { line }) })`.

The case-run program on the worktree's `paths.ts`:

```
C9 dir file: "/tmp/lab/.oculus/config.yml" -> {"root":"lab","path":".oculus/config.yml"}
C9 real file: "/private/tmp/lab/x.yml" -> {"root":"lab","path":"x.yml"}
C10 empty file: "" -> {"root":"main","path":""}
C13 inner file: "/w/main/side/inner/a.yml" -> {"root":"inner","path":"a.yml"}
C13 primary file: "/w/main/registries/b.yml" -> {"root":"main","path":"registries/b.yml"}
C14 no primary, hub file: "/w/main/registries/b.yml" -> {"root":"main","path":"registries/b.yml"}
C14 no primary, lab dir file: "/tmp/lab/.oculus/config.yml" -> {"root":"lab","path":".oculus/config.yml"}
C16 root with empty real: "/w/gone/x.yml" -> {"root":"gone","path":"x.yml"}
C19 lab collection file: "/tmp/lab/registries/people.yml" -> {"root":"lab","path":"registries/people.yml"}
C19 lab change record: "/tmp/lab/projects/p/project.yml" -> {"root":"lab","path":"projects/p/project.yml"}
exit 0
```

- C1. A file of the primary, relative (`paths.ts:188`) or absolute under its folder: `under.root` is the primary, so `RootChip` draws nothing (`RootChip.svelte:32-36`). The name is the control (:173-181). Its press opens `{ root: <primary>, path, line }` in a kept source tab (:136). The look on landing shows it.
- C2. `lab`'s `.oculus/config.yml`: `under` is `{ root: 'lab', path: '.oculus/config.yml' }`. The chip reads `lab`, with the tooltip from `config/text/views/system/findings.yml:8`, "This file is under the folder served as lab". The press opens that file at the line. The look on landing shows it.
- C3. No line: the press passes no `line` (:136), so the tab opens at the top. `named` gives no `:<line>` (:116). The look on landing shows it.
- C4. `fileUnder` gives null: the plain span with the whole path as its title, no chip, no control (:168-171). The look on landing shows it.
- C5. A relative file with no primary: `fileUnder` gives null (`paths.ts:188`), so the result is as C4.
- C6. A file under `ordo`: `under.root` is `ordo`. Its chip carries the tooltip "This file is under the folder served as ordo", and the press opens the file under `ordo`. The look on landing shows it.
- C7. `KeyChoice` is drawn under the row as before (:192-194). The look on landing shows it.
- C8. The search line is unchanged (:102-104), and so is `named` (:114-117). The chip and the control are not read by the search.
- C9. Printed above: `{ root: 'lab', path: '.oculus/config.yml' }` for `/tmp/lab/.oculus/config.yml`, so the chip `lab` and a control. `/private/tmp/lab/x.yml` still gives `lab`. The look on landing shows it.
- C10. `placed('')` gives null (:124), so the plain span shows and there is no chip and no control. `fileUnder('')` itself is unchanged and gives the primary with path `''` (printed above).
- C11. oculus's `config/...` file with oculus's folder the root `oculus`: the chip `oculus` with the folder words, and a press opens `config/...` under `oculus` at the line. An apps state file under `~/.oculus` with that folder as the root `oculus-state` gets that chip and a control. The look on landing shows it.
- C12. The finding's file is now `` `${join(dir, OPTIONS_DIR)}/` `` (`options-folder.ts:136`). With oculus's folder a root, `under.path` is `config/options/` and the name shows `config/options/`. The press calls `showFolderInFiles('config/options', 'oculus')` (:133), so no source tab opens. The chip is `oculus`. With oculus's folder no root, the row is plain words and has no chip (:168-171). The look on landing shows it.
- C13. Printed above: the inner root's chip, and a press opens the file under the inner root. A file of the primary outside it gets no chip.
- C14. Printed above: with no primary, a file under `main` gives `main`, and `RootChip` compares it with `primary() ?? ''` (`RootChip.svelte:35`), so the chip `main` is drawn with a control. `lab`'s file gives `lab`.
- C15. A refused-list finding of oculus's `sources.yml` behaves as C11, and one of the primary hub's `.oculus/config.yml` behaves as C1, through the same row code (:165-188).
- C16. Printed above: `{ root: 'gone', path: 'x.yml' }`. The empty `real` is skipped and the file is matched by `dir` (`paths.ts:192-197`).
- C17. Each control is one `<button>` (`ToolButton.svelte:68`). That gives one tab stop, and Enter and Space press it as a native button does. `.place` is `display: inline-flex; min-width: 0` with no `overflow` (:261-264), so nothing clips the ring drawn 1 px outside the words (`ToolButton.svelte:458-460`). The rows still carry no `data-card` (:166), so the arrow keys behave as today. The look on landing shows it.
- C18. `.named` is `display: flex; min-width: 0; max-width: 100%` (:243-249) and holds the name and the chip as one flex item of the wrapping row. The name's box shrinks (`.place` min-width 0), and the label is cut with an ellipsis (`ToolButton.svelte:410-421`). The chip keeps its words (`flex: 0 0 auto`, `RootChip.svelte` style). The look on landing shows it.
- C19. Printed above: the files of `lab` under its link now give `lab`. `fileShown`, `registryFile` and Collection's `parts` pass `fileUnder`'s answer through unchanged (the lines cited in the first run), so they find the file under `lab`.

## Files

`diff -rq` of `O139-base/{src,tests,utils,config,docs}` against the worktree lists these ten files, all in the write list. `git diff --numstat` gives the added and removed lines, and `wc -l` the length now:

| File | + / - | Lines now |
|---|---|---|
| `src/lib/views/system/findings/Findings.svelte` | 85 / 10 | 294 |
| `src/lib/views/shared/card/RootChip.svelte` | 14 / 10 | 54 |
| `src/lib/data/helpers/files/paths.ts` (lines 173-198 now, 170-195 at the base) | 11 / 4 | 261 |
| `src/lib/data/sources/config/merge/options-folder.ts` (lines 128-136) | 4 / 2 | 148 |
| `config/text/views/system/findings.yml` | 1 / 0 | 14 |
| `docs/HELP.md` (line 345) | 1 / 1 | 620 |
| `docs/diagrams/layers.dot`, `layers.svg` | 2 / 2 each | regenerated |
| `docs/diagrams/layer-views.dot`, `layer-views.svg` | 3 / 3 each | regenerated |

The diagrams changed only in their edge counts: `views to state` 1543 to 1544, `views to ui` 1100 to 1101, and in `layer-views`, `views/system to views/shared` 24 to 26, `to layer state` 242 to 243, `to layer ui` 200 to 201.

## The new key and the new prop

- `findings_file_root_tip`. `grep -rn "findings_file_root_tip" src config tests docs` prints two lines: `src/lib/views/system/findings/Findings.svelte` (its one reader) and `config/text/views/system/findings.yml:8`. The key is not empty and is defined once. Its group `views` gains it in the file that holds the Findings view's lines. `grep -rn "root_tip" config/text` prints `hubs.yml:5 root_tip`, `latex.yml:115 pick_root_tip` and this key. Each of the three is a different full key, so none collides.
- RootChip's `tip`. Its type is `tip?: (root: string) => string` (`RootChip.svelte:23`), and its default is `(root) => t('hubs.root_tip', root)` (:26). Unset, the nine callers get the words they had. The only caller that passes it is Findings.svelte: `grep -rn "<RootChip" -A3 src/lib | grep "tip="` prints that one line. It does not clash with `record` or `hub`, the component's only other props (:15-24).

## Judgment calls the brief left open

1. The prop is named `tip`. The brief named no name.
2. The control's box draws the Audit place's underline under the pointer (`.place :global(button:hover) { text-decoration: underline; }`, Findings.svelte:266-268). This matches `AuditSection.svelte:303-305`, since ruling 658 says "as the Audit section's place does". The brief does not name it, and the orchestrator may drop it.
3. The control takes the Files row's existing muted mono face, `--muted-txt` (:251-257). It does not take the accent link colour of `FolderFiles.svelte`, because the Audit place it follows is muted.
4. The name and the chip are wrapped in one flex item, `.named`, so that the wrapping row keeps them on one line and only the key and the message wrap. Without that wrapper, a long name would take a line of its own and push the chip to the next line.
5. The folder's path goes to `showFolderInFiles` through `normalisePath` (`src/lib/state/sources/explorer/view/place.ts:23`, reached through `$lib/state/sources/fs`), which drops the closing `/`. Importing `trimSlash` from `$lib/data/helpers/files/paths` into a view is refused by `tests/checks/tree/boundaries.test.ts`, and `showFolderInFiles` normalises its path as well (`show.ts:75`).
6. Whether a file is a folder is read from `finding.file.endsWith('/')`, not from the path under the root. A root's own folder written as `<root>/` gives the path `''`, which does not end in `/`.
7. `Under` is a local type, `NonNullable<ReturnType<typeof fileUnder>>`. A view may not import `FileName` from `data/helpers/files/paths` (point 5).

## Host- and user-visible changes, before and after

The orchestrator's look is taken in the Findings view, its Files section, on a scratch server with a second hub and a hub under `/tmp`.

- A Files row of the primary's file. Before: the name as plain muted mono words. After: the same words drawn as a control, with no chip. Hovering underlines it and shows "Open <whole path>", and a press opens a kept source tab at the finding's line.
- A row of another hub's file. Before: plain words and no chip. After: the name as a control, then the hub's chip with the tooltip "This file is under the folder served as <hub>". A press opens that hub's file at the line.
- A row of a folder entry's file, such as `ordo`, `oculus` or `oculus-state`. Before: plain words. After: the folder's chip with the same tooltip, and a control that opens the file.
- A row of a hub behind a symbolic link (`/tmp/lab`). Before: the whole path as plain words. After: the path under `lab`, the chip `lab` and a control.
- The options folder's `defined_twice` row. Before: `config/options`, plain words. After, with oculus's folder a root: `config/options/` as a control whose press shows `config/options` as a Files tab of its own, with the chip `oculus`. With oculus's folder no root: the whole path ending in `/`, plain words.
- A row of a file no root holds, or of an empty file. Plain words with the whole path as the tooltip, before and after.
- A long name in a narrow pane. Before: the name could take a line of its own, with the key and the message wrapping. After: the name and the chip stay on one line, the name cut with an ellipsis and the chip whole, and the key and the message wrap after them.
- The other callers of `fileUnder` for a hub behind a symbolic link. History's file column (`fileShown`) names the file `lab/<path>`, where before it showed the whole path. The registry file and Collection's file of `lab` are found under `lab`, where before they were null. Every caller of `fileUnder` and `fileNamed` also matches a file under the `dir` of a root whose `real` is empty, a folder that does not exist.
- The keyboard. Each Files row with a control gains one tab stop, pressed by Enter and Space, with its focus ring drawn whole. The arrow keys still step through Audit rows alone.
- RootChip's other nine callers draw what they drew before. Its head comment now describes the chip as naming a served root.

## Comments and documents re-read

- `Findings.svelte` head comment (:20-49): rewritten to describe the chip with its words, the control, the folder and the plain row.
- `RootChip.svelte` head comment (:2-10) and the `record` prop's doc: rewritten.
- `fileUnder`'s doc comment (`paths.ts:173-182`): rewritten. The head comment of `paths.ts` (:1-18): still true. `fileNamed` (:200-213) and `diskPath` (:215-220): still true.
- `options-folder.ts:128-130`: rewritten. `readOptionsFolder`'s doc (:98-102): still true.
- `AuditSection.svelte:30-41`: still as true as on the base. The brief leaves its line 30-31 note as it stands.
- `docs/HELP.md:345`: rewritten, with the sentence item 10 dictates. `docs/data-map.md:78` and `docs/HELP.md:250`: still true.
- `grep -rn "fileUnder\|RootChip\|root_tip\|options-folder\|config/options" docs README.md` finds only diagram nodes and the HELP and data-map lines about `config/options/` describing options, all still true.

The history-word grep over every added line, `git diff -U0 | grep '^+' | grep -v '^+++' | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O1[0-9][0-9]|20[0-9][0-9]-"`, prints nothing (exit 1).

The reuse grep: `grep -rn "fileUnder(" src/lib` lists the ten callers named in the brief. No new helper was written beside an existing one. `fileUnder`, `openSourceFile`, `showFolderInFiles`, `normalisePath`, `RootChip` and `ToolButton` are all reused.

## Tests

The step adds and changes no test. `diff -rq O139-base/tests migration-O139/tests` prints nothing.

## Wrong or impossible in the brief

Nothing in the brief turned out wrong. One point is to know:

- C16's "skipped by `fileUnder` as today" holds for the root's empty `real` folder alone. Under item 7 its `dir` now matches, so a file under a folder entry that does not exist gets that root's chip and a control. The press then opens a source tab on a file that cannot be read. This is the result item 7 and ruling 662 2 (a) give.

## Limitations and sharp edges

- Everything a DOM shows has been checked by reading only, since a builder runs no page. That covers the cut name beside the chip, the focus ring drawn whole, the press opening the tab at the line, the folder tab, the hover underline and the tooltip words. The look on landing is its proof, for C1, C2, C3, C4, C6, C7, C9, C11, C12, C17 and C18.
- A finding written with a path that passes a symbolic link the root's `dir` does not name (a path from neither `dir` nor `real`) still gives null.
