# Step D13b refuter report (on .agents/worktrees/D13b, base 444b9601)

## Verification (rerun by the reviewer)

The command as briefed, from the worktree root, stops at once because the verify list runs from `tools/oculus`:

```
$ cd .../.agents/worktrees/D13b && PATH=... sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md </dev/null
$ npm test
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/Users/axelfaes/workspace/research-hub/.agents/worktrees/D13b/package.json'
checks: failed with exit 254: npm test
```

The same command from `tools/oculus` in the worktree (load average 14.58):

```
$ npm test
 FAIL  tests/checks/source/keys.test.ts > text keys > reads every findingText key ... Error: Test timed out in 5000ms.
 FAIL  tests/server/core/git-reads.test.ts > the state beside the changes > puts an unmerged path in its own list ... Error: Test timed out in 5000ms.
 FAIL  tests/server/core/git.test.ts > the log, the branches and the worktrees > caps the branch list  AssertionError: expected +0 to be 200
 FAIL  tests/server/git/git-ops.test.ts > the amend > ... Error: Hook timed out in 10000ms.
 FAIL  tests/server/machine/pty/sessions.test.ts > starts, lists, feeds ... timed out waiting for the typed line to come back as output
 Test Files  5 failed | 371 passed (376)
      Tests  5 failed | 5902 passed | 1 skipped (5908)
checks: failed with exit 1: npm test
```

Each of the five files run alone (`npx vitest run <file> --reporter=dot`): git.test.ts 42 passed, git-reads.test.ts 32 passed, git-ops.test.ts 37 passed, keys.test.ts 8 passed, sessions.test.ts 19 passed. Two of them (git.test.ts and git-reads.test.ts) are files this step changes, so they do not fall under the load exemption on their own terms. I therefore reran the whole suite at load 6.58:

```
$ npm test -- --reporter=dot
 Test Files  376 passed (376)
      Tests  5907 passed | 1 skipped (5908)
exit 0
```

"caps the branch list" read zero branches because `state()` turns a git command that timed out (TIMEOUT_MS 5000) into empty lists. That is load, and it is green in both reruns.

The rest of the list, run by hand in its order:

```
$ npm run check    -> COMPLETED 2136 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS (exit 0)
$ npm run build    -> built in 8.47s / built in 19.34s (exit 0)
$ npm run format:check -> All matched files use Prettier code style! (exit 0)
$ npm run lint     -> exit 0, no output
$ ! LC_ALL=C grep -rna '[^ -~]' src tests -> no output (grep exit 1)
```

The commands the report quotes as evidence:

```
grep -rn "diff-rows\|diff-words\|DiffFile\|pairedWords\|wordDiff\|function common" src tests -> nothing, exit 1
grep -n "from 'node-diff3'" .../merge-regions.ts -> 16:import { diff3MergeRegions } from 'node-diff3';
perl ASCII gate -> nothing, exit 0
grep -rlE "StandaloneCodeEditor|createDiffEditor" build/server -> nothing, exit 1
bash bin/folder-check.sh -> exit 0
grep -rn "// revert:" src tests -> exit 1
npm run diagrams (in a scratch copy) -> exit 0; diff -rq of docs/diagrams against the worktree -> identical
```

Thirteen of the report's revert runs, reproduced in a scratch copy under $TMPDIR (`npx vitest run <files> --reporter=verbose`, the source restored after each). Every red matches the report:

```
R1  grouping joins only gaps under six -> 2 red: "joins changes at most six ..." (diff.test) and hunks-git "two changes six lines apart"
R2  head without context -> 6 red: the head case and all five hunks-git pairs
R17 patch without context -> 14 red (7 diff.test, 7 diff-patch.test)
R18 stage drops unchosen removed lines -> 3 red, as the report names them
R23 deletion given to the wrong side -> 1 red: "settles a deletion one side made ..."
R15 filter driver not a conversion -> 1 red; R16 -text still converts -> 1 red
R36b autocrlf lost -> 1 red; R47 diff= answer loses attributes -> 2 red (routes and git-reads)
R29 stash without untracked -> 1 red; R30 commit ignores rename's old path -> 2 red
R31 conflict read against the index -> 1 red; R48 default 1 MB buffer -> 1 red
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. git-reads.test.ts "the diff answer" has 14 cases, and R29 to R31, R36b, R47 and R48 turn them red.
- 2: holds. `DiffEditor.svelte:119-139` sets every option the brief names. The view state is restored in `updated()` after `onDidUpdateDiff` (:183-189), the palette listing comes from `chordActions` (:166), and the kit move is done (the folder holds 10 items).
- 3: holds. `diff-hunks.ts` over the cases, with R1, R2, R12 and R11 (the report's; R1 and R2 reproduced).
- 4: holds. R17 and R18 reproduced against git in diff-patch.test.ts.
- 5: violated. Behaviour 1 (the pane crashes on a type change), 2 (view state written after close) and 3 (a line-ending-only change shows no change and no note).
- 6: holds. Behaviour 5 is a minor edge with no verdict.
- 7: violated, minor, by Standards 3.
- 8: violated by Standards 1 and 2.

Cases of the brief's "Cases":

- The answer, a file's changes: met (git-reads.test.ts:342).
- The answer, staged: met (:359).
- The answer, a commit: met (:372, R30).
- The answer, a stash and a worktree: met (:406, :424, R29).
- The answer, binary: met (:444).
- The answer, refusals: met (:456).
- Hunks against git: met (hunks-git.test.ts, R1 and R2 reproduced).
- Hunks: met (diff.test.ts:95).
- Chosen rows: met (diff.test.ts:120-168).
- The patch, stage of a whole hunk: met (diff-patch.test.ts, R17).
- The patch, one line of three, one of two, unstage and revert: met (R18).
- The patch, the edges: met (diff.test.ts:286-349).
- Steps: met (diff.test.ts:182).
- The hunk a pane opens at: met (diff.test.ts:199).
- The pane's view state: met in unit (`diffViewOf`, `sameFiles`, repositories.test.ts). The write path has Behaviour 2.
- Merge regions on node-diff3: met, as ruled (merge.test.ts:45, :56, R23).
- The grep case: met.
- The answer's edges: met (git-reads.test.ts:468-525).
- The withheld actions: met for the pure function (diff.test.ts:208-243, R15 and R16). The drawing gap is Behaviour 3.
- The view state (`diffViewOf`): met.
- The look: not verifiable here (no browser). It is settled at the look on TEST.

## 1. Spec

- none.

## 2. Proof

- `agents/reviews/D13b-report.md`, Findings F1: "I expect `git apply` to refuse it with its own error rather than write anything". This is disproved by the probe under Behaviour 4. It is Z59's premise, so it is reported there and not raised again here.

## 3. Standards

- `HELP.md:181`: "A file holding carriage returns, or one git converts on the way in (a `filter`, `text` or `eol` attribute, or `core.autocrlf` set), has no block actions". What is wrong: ruling 3 and `diff-hunks.ts:223-231` withhold the actions only for a filter driver, or for `text` not unset together with `eol=crlf` or `autocrlf` `true`/`input`. A bare `text` attribute, `-text`, `eol=lf` and `autocrlf=false` keep the actions (diff.test.ts:235). The spec rule broken: a document sentence the change makes false is a defect. Failure scenario: a reader with `*.md text` in `.gitattributes` reads that such files have no block actions, and gets Stage Block on them. Verdict: item 8 violated.
- `HELP.md:179`: "A diff of several files, a commit's or a stash's, lists each file under its path". What is wrong: a commit diff opens one file per pane (`CommitFiles.svelte:62` passes `path`, and `commitDiff` diffs one path). The multi-file diffs are a stash's and a worktree's, and the worktree is not named. Failure scenario: a reader looks for a commit's files listed in one pane. Verdict: item 8 violated.
- `src/lib/ui/controls/editor/Editor.svelte:66`: "Oculus's name for the language, which grammars.ts answers the Shiki id of." What is wrong: the file is now `kit/grammars.ts`. `DiffEditor.svelte:45` says `kit/grammars.ts` for the same prop. The spec rule broken: grep and carry a moved name to every head or prop comment. Verdict: item 7 violated (minor).

## 4. Behaviour

- **Behaviour 1.** `src/lib/views/sources/repositories/diff/Diff.svelte:113` and `:412`: `const keys = $derived(files.map((file) => (file.newPath === '' ? file.oldPath : file.newPath)));` and `{#each files as file, index (keys[index])}`.
    - What is wrong: git reports a type change (a file replaced by a symlink, or the reverse) as two entries with the same path. The scratch repository gave, for `git diff --no-color --no-ext-diff -U0 -- x` and for `show -M` of the commit: `diff --git a/x b/x / deleted file mode 100644 ... diff --git a/x b/x / new file mode 120000`. The keyed each then holds a duplicate key. Svelte 5.57.1 throws `each_key_duplicate` in production as well as in development (`node_modules/svelte/src/internal/client/dom/blocks/each.js:355-361`). The view states keyed by path collide too. The base keyed by index (`{#each files as file, index (index)}`) and did not throw.
    - Failure scenario: replace a tracked file with a symlink and open its diff from Changes, or open a commit or stash that did this. The pane throws in place of drawing the two entries.
    - Verdict: item 5 violated. The spec's "every key exercised duplicated" also applies.
- **Behaviour 2.** `Diff.svelte:327-330` (`onDestroy(() => { keep(); forget(instance.id); })`) with `DiffEditor.svelte:297-302` (`if (state !== null) onview?.(state);` in its `onDestroy`) and `Diff.svelte:286-289` (`keeping ??= setTimeout(keep, KEEP_AFTER_MS)`).
    - What is wrong: closing a tab runs `clearInstanceState(id)` synchronously (`state/workbench/layout/instances.ts:182`). The components tear down afterwards. Svelte destroys an effect's children in creation order (`reactivity/effects.js:518-542`), so `Diff`'s own `onDestroy` (a script effect) runs first with nothing pending. Then each `DiffEditor`'s `onDestroy` hands its view state to `viewed()`, which arms the 400 ms timer. `keep()` then runs `setInstanceState(closedId, { mode, views })` (`ui.svelte.ts:353-355`). Nothing clears that entry again (`clearInstanceState` runs only on a close of that id), and the store is saved to localStorage.
    - Failure scenario: open and close a diff pane of a drawn file. `instances` keeps an entry for the closed id holding the Monaco view state, one more per closed diff pane, persisted. At base the pane wrote only on a reader's action. This is read from the code, not observed in a browser.
    - Verdict: item 5 violated. The spec's "every asynchronous path exercised after close" also applies.
- **Behaviour 3.** `DiffSection.svelte:99-102` (bars only per hunk) with `diff-hunks.ts:236-237`.
    - What is wrong: when the only change in a file is its line endings, Monaco computes no line change. The probe `monacoLineChanges('a\r\nb\r\nc\r\n', 'a\nb\nc\n')` printed `[] hunks 0`. `diffActions` answers `'none'`, but the `diff_whole` note is drawn only inside a hunk bar, so with no hunks there is neither bar nor note. `hideUnchangedRegions` hides the whole file.
    - Failure scenario: a file converted from CRLF to LF opens as an unchanged, fully hidden file with nothing saying why git lists it as changed. At base, git's own diff drew every line as changed.
    - Verdict: item 5 violated (the note for a file with a carriage return).
- **Behaviour 4.** Z59 tested (F1). `server/core/git.ts` `version()` (`readFileSync(full, 'utf8')`) and `run()` (`encoding: 'utf8'`), with `diffActions` offering line actions.
    - The probe: a scratch test in a copy of the tree read `f.txt` (Latin-1) through `handleGitGet` as `tests/server/git/diff-patch.test.ts` does, cut the whole hunk with `sidesPatch` over `monacoLineChanges`, and applied it with `applyHunk`. Results:
        - The changed line holds `\xe9` on both sides: `{"ok":false,"error":"error: patch failed: f.txt:6"}`, index unchanged. git refused.
        - Only a context line holds `\xe9`: `patch failed: f.txt:1`, index unchanged. git refused.
        - Only the added line holds `\xe9` (removed line and context ASCII): `{"ok":true}`. Index before `...6f6c640a7a0a` ("old"), after `...636166efbfbd0a7a0a` ("caf" U+FFFD in UTF-8), worktree `...636166e90a7a0a`. Status `MM f.txt`. git applied the patch and staged bytes the file never held.
        - A revert where only the removed line holds `\xe9`: `{"ok":true}`. Worktree before `...6e65770a7a0a` ("new"), after `...636166efbfbd0a7a0a`. The revert wrote U+FFFD bytes into the worktree file in place of the original `\xe9`.
    - What is wrong: git refuses only when a non-UTF-8 byte sits on a line the patch must match. When it sits only on a line the patch writes, git applies it, and the index (stage) or the worktree file (revert) is silently corrupted.
    - Z59's option (b) rests on the opposite premise and must be re-read with this result. A `working-tree-encoding` attribute (UTF-16 worktree) reaches the same path, and ruling 3's rule does not check it.
    - Verdict: item 5, pending Z59.
- **Behaviour 5 (minor).** `Diff.svelte:123` (`stops = counts.some((count) => count !== 0)`) with `diff-hunks.ts:196-211`.
    - What is wrong: a binary file and a file with equal texts never mount a `DiffEditor`, so their count stays `null` and each is a permanent stop.
    - Failure scenario: Previous and Next are enabled on a rename-only commit diff and do nothing when pressed. In a stash holding a binary file, Alt+F5 stops on the binary file every round.
    - Verdict: none (the Steps case is met as tested).
- **Behaviour 6 (minor).** `Merge.svelte` `typed()`: `if (last?.after === result && next === last.before) { restore(last.was); ...`.
    - What is wrong: undo is recognised by whole-text equality.
    - Failure scenario: a choice is made; the reader types into another conflict (marked `edited`) and types back until the text equals the choice's `after`; then they edit the chosen conflict's text back to what it was before the choice. That edit is taken as undo, and `restore(last.was)` puts every choice back to its value before the choice, so the other conflict loses its `edited` mark and reads open. Typing only the chosen conflict back to its ancestor text reads it `open` in place of `edited`, which matches its text.
    - Verdict: none.

Points the orchestrator named, where no finding is written above:

- `drawn()` goes to a line only for file 0. This holds. The only opener with a line is `Source.svelte:243-248` (`openMark`), always a single file's own diff. Stashes (`Stashes.svelte:24`) and commits (`CommitFiles.svelte:62`) open with no line. The only two-entry file diff is the type change of Behaviour 1.
- `fresh()` and model names. This holds. `modelUri` puts the file path in the URI (`kit/load.ts:57-63`), and `name` is read only at build. A reordered list keeps each editor's models, since the sections are keyed by path. Two sections share a URI only when they share a path, which is Behaviour 1.
- `MAX_OUTPUT` 32 MiB on every read of `git.ts`. This holds. It is a cap, not an allocation: 50 `spawnSync('git', ['--version'])` calls with the cap moved rss from 44.5 to 46.4 MB, against 46.6 MB with the default. Memory per read follows the output's size. The change is that a status or log output between 1 and 32 MiB now parses where it used to fail with ENOBUFS. The file diff's head read still goes through `git-write.ts` `MAX_OUTPUT` 8 MiB, as at base.
- `converted`. This holds as ruling 3 words it:
    - `text=auto` keeps the actions (no conversion without `eol=crlf` or autocrlf, and a CRLF text is caught by the `\r` check);
    - `eol=crlf` with `text` unspecified withholds them (git says setting `eol` sets `text`);
    - a `filter` naming an unconfigured driver withholds them, which is the ruling's conservative reading.
- `hunkNear` and `stepFiles`. These hold against the brief's cases (diff.test.ts:182, :199). The only exception is Behaviour 5.
- The six path widenings. Each holds with its reason:
    1. Ruling 6: the listing is drawn in `Palette.svelte`.
    2. `size.test.ts:28` `LINES = 900`: `git.ts` is 865 after the move and was over 900 before it.
    3. The allowed clone of `short` starts at base `git.ts:802`, inside `count`, so moving `count` changed its mark. `deposit-git.ts` is folded to `shortReason` rather than the allow list being widened.
    4. `git-ops.test.ts` is 788 at base; the new cases went to `diff-patch.test.ts`.
    5. `LineBars`, `built.svelte.ts` and `look.ts` remove clones between the two editors.
    6. `MAX_OUTPUT`, with R48 reproduced red.
- Old names. `grep` over src, tests, bin, DESIGN.md, HELP.md, README.md and docs finds no `DiffFile`, `diff-rows`, `diff-words` or `WHOLE_FILE`, and no editor file at its old path, except Standards 3.
- The `unfold` glyph and the removed keys. No user is left (`grep` for `unfold`, `fold_open`, `line_choose` hits only Monaco's own `editor.unfold*` ids). Oculus's `glyphs.yml` has no twin: the two byte-identical `glyphs.yml` (md5 2e4cb501...) are the cockpit's and are untouched.
- `node-diff3` 3.2.1. This holds: it is named under the brief's "Libraries checked" (LA8 (b)). Its license is MIT (package.json `license`, LICENSE file, the lock entry `"license": "MIT"`), and it has no dependencies.

## Declined to judge

- The look items (alignment of the hunk bars between the two sides, word marks, themes, drawing time of HELP.md). They need a browser, which this review may not use. They are settled at the look on TEST.
- Whether an `ident` attribute (`$Id$` expanded on checkout) should also withhold the partial actions. Ruling 3 fixed the rule and does not name it, so it is the orchestrator's or Axel's call. The staged text would carry the expanded form.
- Z59's options themselves are Axel's. Behaviour 4 only supplies the measurement.

Reviewer usage: 287482 tokens, 80 tool uses, 27 min (from its completion notice).
