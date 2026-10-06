# Step Q47 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/q47, base b03f22d0)

## Verification (rerun by the reviewer)

```
$ npx vitest run --reporter=dot
 Test Files  249 passed (249)
      Tests  4200 passed (4200)
   Duration  87.59s (transform 30.97s, import 134.22s, tests 158.70s)
(no test rerun alone; nothing timed out)

$ npm run check
1789668473064 COMPLETED 1218 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

$ npm run lint
(no output, exit 0)

$ npm run format:check
All matched files use Prettier code style!

$ LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests bin config -type f ! -name glyphs.yml)
(printed nothing)

$ find src tests bin -type f | xargs wc -l | sort -n | tail -3
     970 tests/state/layout.test.ts
     980 tests/state/board.test.ts
     999 tests/views/sessions.test.ts

$ python3 -c "import yaml; yaml.safe_load(open('config/text/views/changes.yml'))"
(exit 0)

$ npm run build
(exit 0)

$ npx playwright test tests/browser/changes.spec.ts tests/browser/repositories.spec.ts
  9 passed (23.0s)      (2 changes + 7 repositories; port 8792 was free, lock untouched)

Commands the report quotes as evidence, rerun:
$ npx vitest run tests/views/sessions.test.ts --reporter=dot
      Tests  63 passed (63)           (report: "63 passed")
$ grep -rn "ch_norepo|ch_failed|ch_reading|ch_insync|repoShape|data-repo=" src tests config HELP.md DESIGN.md README.md, minus the five changed files
src/lib/views/repositories/Repo.svelte:82: if (bits.length === 0) bits.push(t('sessions.ch_insync'));
(the only hit outside the diff; report's name grep reproduced)
$ wc -l src/lib/views/sessions/Changes.svelte src/lib/views/sessions/ChangesRepo.svelte config/text/views/changes.yml tests/browser/changes.spec.ts
321 / 199 / 59 / 242            (report's line counts reproduced)

Reverts, one at a time in a clone of tools/oculus under the reviewer's scratch folder (rebuilt before each browser run):
1. branchState: `if (bits.length === 0)` -> vitest tests/views/sessions.test.ts: 1 failed | 62 passed
2. repoShape: `if (state === null) return 'none';` -> 1 failed | 62 passed
3. markup: `{#if shape === 'none' || shape === 'failed'}` -> FAIL "says a repository whose read failed could not be read, with git own reason in the text"; 1 failed | 62 passed
4. load(): `branches = listed` unconditional, rebuilt -> changes.spec.ts case 2 red at line 238 (menuitem "main" not found), case 1 green
5. effect: `if (root === '')` in place of the shape test, rebuilt -> changes.spec.ts case 1 red at line 191 (asked.get(plain) = 1, expected 0), case 2 green
Cross-spec check: `npx playwright test tests/browser/changes.spec.ts tests/browser/sanitise.spec.ts` -> 9 passed (sanitise's `ended-h` count of 1 survives the new spec's sessions).
```

## 1. Spec

- `src/lib/views/sessions/Changes.svelte:25`: `if (workspace === '') return 'none';`. The brief's item 1 names `ch_reading` for `repo` null, and line 63 derives `repo` null for `workspace === ''`, so for that session the brief's shape was changed rather than followed. The report's sentence is true of the code (repoShape returns `'none'`, the markup draws the `none` section), but the sentence the reader then sees, `ch_norepo` "This workspace is not a git repository.", is false for that session: `src/lib/data/model-sessions.ts:202` says the workspace is "empty for the unknown workspace", so there is no workspace to be or not be a repository. Neither existing sentence fits and the diff adds no third; the decision is booked in the report as reversible.
- `src/lib/views/sessions/Changes.svelte:128`: `if (bits.length === 0 && state.upstream === true)`. Brief item 3 scopes the fix to a repository with no commit; this rule also drops "in step with the upstream" for every committed branch with no upstream (every agent worktree branch among them). The report states the before and after, so it is not silent, but it is a change no item asks for and it is what puts the Repositories view's copy out of step (Standards 3).

## 2. Proof

- `tests/views/sessions.test.ts:597`: "takes a session with no workspace for no repository" asserts the exported `repoShape` directly, not a render. No case renders `Changes` for a record whose `workspace` is `''`, so the sentence that session actually draws is uncovered; the spec's rule is that an assertion outside a render is an audit, not coverage. The other five new cases render.
- Every count, path and measurement the report quotes reproduced (see the verification block), including the two browser reverts, which came back red in the same cases the report names and green in the other case each time.

## 3. Standards

- `src/lib/views/sessions/Changes.svelte:14-29`: `repoShape` is a pure rule exported from a component's `<script module>`; `grep -rn "export function" $(grep -rl "<script module" src/lib/views)` finds no other function exported from a module script in the tree. The tree's place for a view's pure rule is a `.ts` beside it (`src/lib/views/sessions/session-list.ts`, `src/lib/views/map/labels.ts`) or `state/` (DESIGN.md line 307: `filterGraph()` in `state/graph.ts` is "the one pure rule over a built graph"). The placement also forced the cast at `tests/views/sessions.test.ts:598`, and the module script's head comment (line 2, "Layer 3, view registration. Changes registration stays on the component because the registry discovers this file directly.") now describes only part of what the module holds, which is the rule against a comment the change makes false.
- `src/lib/views/sessions/Changes.svelte:247`: `{:else if repo === null}` decides the reading section on its own predicate rather than `shape === 'reading'`, so the one rule the module exists for is not what that branch reads; the two agree today only because `shape === 'none'` catches the empty workspace first.
- `src/lib/views/repositories/Repo.svelte:82`: `if (bits.length === 0) bits.push(t('sessions.ch_insync'));` is a second copy of `branchState` and keeps the old rule, so one `GitState` with no upstream now reads "in step with the upstream" in Repositories and nothing in Changes. Spec rule: "a parser, a fold or a rule exists once and is reused". Outside the builder's paths, so it needs booking or a landing fix.
- `src/lib/views/sessions/ChangesRepo.svelte:82` and `src/lib/views/sessions/Changes.svelte:238,243,248`: `data-repo="readable|none|failed|reading"` sits beside `src/lib/views/repositories/Repo.svelte:104`'s `data-repo-failed` for the same state under a different spelling. No selector collides (`[data-repo-picker]` and `[data-repo-failed]` still resolve, repositories.spec.ts green), but the vocabulary is now two shapes for one fact.
- `tests/views/sessions.test.ts`: 999 lines against the spec's 1000-line limit, one line of headroom, with no test in the tree enforcing the limit. To fit, the diff also rewrote an existing case, "says the upstream is being looked up, not that there is none, before git has answered", onto the new `other` helper and dropped its trailing restore `receive(...)`; no item of the brief asks for that case. The drop is safe (`beforeEach` at line 51 builds a fresh client per case, and the suite is green), but the file should be split rather than trimmed, as the report says.
- `tests/browser/changes.spec.ts:152`: `made.push(committed, fresh, plain, broken);` runs after all four folders are built, so a failed `expect` inside `gitIn` (line 50) or a `writeFileSync` above it leaves those folders in `tmpdir()` for good; the head comment at line 9 states every folder "is removed when the case ends", and `serve.ts`'s `removeLeftovers` sweeps only the `oculus-browser-` prefix. Line 203 has the same order in case 2.
- `tests/browser/changes.spec.ts:55`: `join(dirname(hubDir()), 'home', '.claude', 'projects', ...)` reconstructs the served run's HOME from `serve.ts`'s directory layout; `hub.ts` exports `hubDir` only, so a move of `home` in `serve.ts` breaks this spec with a "no session" failure rather than a path error.
- `tests/browser/changes.spec.ts:34-51`: `gitIn` is a copy of `tests/browser/repositories.spec.ts:28`; the report names it.

## 4. Behaviour

- The red failed sentence agrees with the other view, contrary to the premise I was given: `Repo.svelte:105` draws the failed read through `TreeItem tone="error"`, and `src/lib/ui/TreeItem.svelte:338-339` is `.error .name { color: var(--c-red-txt, var(--muted)); }`, the same token `Changes.svelte:315` uses. `tests/views/type-scale.test.ts:156` still records `sessions/Changes.svelte` as `.sec-h=fs-sm | .none=fs-xs`, because `.none.failed` sets only a colour; suite green.
- Not in the report's before-and-after list: on every newly selected session the panel now shows "git has not read this workspace yet." for the window before the git channel answers for that workspace (previously that window read "This workspace is not a git repository."). It is the intended state of item 1, but it is what a reader sees on each first selection and the report states the state without that.
- The garbage-index case is what `server/git.ts` reports as `repository: true` with `error` set: the browser case reaches `[data-repo="failed"]`, which `repoShape` returns only for that pair, and it is green.

## Not checked

- The rest of the browser suite (only `changes`, `repositories` and `sanitise` were run); whether a mid-case failure in the new spec leaves sessions that a later spec file reads, since only the clean path was exercised.
- Whether the git watcher drops the removed spec workspaces from the `git` payload after `afterEach`.
- The proposed HELP.md and DESIGN.md sentences (the brief reserves them), beyond confirming that no existing sentence in either file names the changed keys.
- Reverts other than the five above; no A/B or size comparison against a second build.
- Two live Changes instances over one workspace were read in the source (each component instance holds its own `asked` and `branches`) but not exercised in the browser.

Reviewer usage: tokens not known to the reviewer, 32 tool uses, about 32 minutes.

## Repair round 1, refuted

```
$ npx vitest run --reporter=dot
 Test Files  250 passed (250)
      Tests  4200 passed (4200)          Duration 46.97s   (nothing rerun alone, nothing timed out)

$ npm run check
1789670161452 COMPLETED 1221 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

$ npm run lint
(no output, exit 0)

$ npm run format:check
All matched files use Prettier code style!

$ LC_ALL=C perl -ne '...' $(find src tests bin config -type f ! -name glyphs.yml)
(printed nothing, exit 0)

$ find src tests bin -type f | xargs wc -l | sort -n | tail -3
     970 tests/state/layout.test.ts
     980 tests/state/board.test.ts
  170759 total                            (no file over 980; sessions.test.ts 831, changes.test.ts 309)

$ python3 -c "import yaml; yaml.safe_load(open('config/text/views/changes.yml'))"
(exit 0)

$ npm run build
(exit 0)

$ npx playwright test tests/browser/changes.spec.ts tests/browser/repositories.spec.ts tests/browser/sanitise.spec.ts
run 1:  1 failed | 15 passed (48.9s)      changes.spec.ts:192 "keeps the newest branch listing when an older one
                                          answers after it": locator('.row').filter({hasText:'Changes spec
                                          superseded'}) not found in 15000ms
run 2: 16 passed (24.3s)
run 3: 16 passed (24.1s)
$ npx playwright test tests/browser/changes.spec.ts        (x3, alone)   2 passed each

Delta read: round-1 tree rebuilt in the scratch folder from b03f22d0 + tracked.patch + untracked.tar,
`diff -ru round1 now` = 444 lines over 9 files; whole diff read as `git diff b03f22d0` + the 4 untracked files.

Reverts and forced failures, in my own clone of tools/oculus under the scratch folder:
1. repo-shape.ts `workspace === ''` -> 'none'            -> changes.test.ts 1 failed | 15 passed
                                                            ("says a session with no workspace names no folder")
2. Changes.svelte, the `unplaced` markup branch dropped  -> changes.test.ts 1 failed | 15 passed (same case;
                                                            the render, not the repoShape assertion, is what fails)
3. Changes.svelte `{:else if shape === 'reading'}` -> `{:else if repo === null}`
                                                         -> changes.test.ts 16 passed (GREEN)
4. ruling 6, `throw new Error('midway')` after the second folder is made, rebuilt, playwright run
                                                         -> 1 failed | 1 passed; `ls $TMPDIR | grep oculus-changes-spec` = NONE
5. the same throw with round 1's shape restored (no push in `folder()`, `made.push(...)` after all four)
                                                         -> leftovers: oculus-changes-spec-committed-xrdmtB,
                                                            oculus-changes-spec-fresh-pNYEGy
6. ruling 8, serve.ts `join(temp,'home')` -> `join(temp,'home-elsewhere')`, rebuilt, playwright run
                                                         -> Error: the served run has no session store at
                                                            /var/folders/.../T/oculus-browser-yGnddj/home/.claude/projects
7. probe, boot then write a session in a fresh repository and poll 20s for `[data-repo]`
                                                         -> sequence [] (the row never appeared)
8. probe, statusFor() on a path that does not exist       -> {"repository":false,"error":"no such directory"},
                                                            repoShape -> 'none'
$ cmp base sessions.test.ts:587-600  vs  changes.test.ts:281-294   -> identical
$ diff -u base tests/browser/repositories.spec.ts   -> the `./git.ts` import for the `spawnSync` import,
                                                       and its own `gitIn` removed; nothing else
```

- `tests/browser/changes.spec.ts:192`: the new case is intermittently red. One of three runs of the three specs failed with the session row for "Changes spec superseded" never appearing inside 15 s; five further runs (two of the trio, three of the spec alone) were green. Case 2 writes its transcript into the store folder the previous case's `afterEach` (line 123) has just removed, and a probe that wrote a transcript into that folder after boot never saw the session at all in 20 s, so the store's removal and remaking is what is not always picked up. Under Proof.
- `src/lib/views/sessions/repo-shape.ts:12,18`: the doc comments read "The four drawings of the repository section", "the other three are one sentence each" and "Which of the four a workspace and the state ... come to" over a union of five (`unplaced | reading | none | failed | readable`, line 16); the builder's own report says "The five drawings now". The head comment at line 7 was carried to the fifth shape and these three were not; a comment the change makes false. Under Standards.
- `src/lib/views/sessions/Changes.svelte:230`: a workspace the user deleted reads "This workspace is not a git repository.", its real reason only in the `title`. `src/lib/server/git.ts:111` returns `empty('no such directory')` with `repository: false` for it (probe 8), `repo-shape.ts:22` makes that `'none'`, and `src/lib/views/repositories/Repo.svelte:103-105` draws the same `GitState` as "git could not read this repository: no such directory". Two views, one state, two sentences, and the false one is the state the step exists to stop being drawn as "not a git repository". Under Behaviour.
- `src/lib/views/sessions/Changes.svelte:223` against `src/lib/views/repositories/Repo.svelte:104`: `data-repo="unplaced|none|failed|reading|readable"` beside `data-repo-failed` for the same fact under a different spelling. Raised by the first refuter, not among the nine rulings, and `plan.md:141`'s Q52 books only `Repo.svelte`'s second `branchState`, so this one is neither closed nor booked. Under Standards.
- `src/lib/views/sessions/Changes.svelte:237`: ruling 5's closure has no check. Putting the branch back on its own predicate (`{:else if repo === null}`) leaves `changes.test.ts` at 16 passed, because `shape === 'unplaced'` catches the empty workspace first and the two predicates cannot disagree. The ruling is done in the source; nothing would catch its undoing. Under Proof.
- `tests/browser/git.ts:20`: the shared helper commits as "Oculus Browser Spec"; `repositories.spec.ts` committed as "Oculus Repositories Spec" before. No assertion reads the author (`grep -rn "Repositories Spec" tests` finds none) and the spec is green, but it is a change to another spec's behaviour that the report's before-and-after does not carry. Under Behaviour.
- `agents/reviews/Q47-report.md`, "On every newly selected session the panel shows 'git has not read this workspace yet.'": the git watcher reads and publishes every session workspace together (`src/lib/server/watch/git.ts:283-306`) and `gitFor` answers from that one payload (`src/lib/state/selectors.svelte.ts:397-399`), so a session whose workspace is already on the channel draws no `reading` sentence on selection. The window exists only for a workspace the channel has not carried yet, and I could not reach it in the served run at all (probe 7). Under Behaviour.

Closures reproduced, each by its own run: ruling 1 and 3 (reverts 1 and 2, the render load-bearing), ruling 2 (`git status --short` lists no `views/repositories/Repo.svelte`; the in-step rule named in the report's Doc text), ruling 4 (`repo-shape.ts` 24 lines with its own head comment, `changes.test.ts:14` imports it plainly, `npm run check` 1221 files 0 errors), ruling 6 (reverts 4 and 5), ruling 7 (`tests/browser/git.ts` imported by both specs, `repositories.spec.ts` against the base is the import swap and the removal of its own copy), ruling 8 (revert 6), ruling 9 (831 lines; the restored case byte-identical by `cmp`; all eleven base cases of the changes describe present in `changes.test.ts` with five added; `count()` used only by the moved block).

Not checked within the time box: the rest of the browser suite; whether the intermittent failure of `changes.spec.ts:192` is the sessions watcher losing the store folder (only its symptom was reproduced); the proposed HELP.md and DESIGN.md sentences, which the brief reserves; `RepoShape` is exported with no consumer outside its own file, which no rule of the tree names.

Reviewer usage: tokens not known to the reviewer, 35 tool uses, about 62 minutes.

## Closed at landing

- `repo-shape.ts:7,12,18`, comments saying four shapes over a union of five: closed, the three sentences name five.
- `tests/browser/changes.spec.ts:192`, the intermittently red case: closed. The `afterEach` now empties the spec's session store rather than removing the folder, since the session watcher does not always see a directory removed and remade before the next case asks; `npx playwright test tests/browser/changes.spec.ts --repeat-each=3` gives 6 passed.
- `Changes.svelte:230`, a workspace the reader deleted reading "This workspace is not a git repository.": booked as Q57. Telling it apart from a folder that is no repository needs the server to say which, which is a wire change and not a landing fix.
- `Changes.svelte:237`, ruling 5's closure with no check: recorded. `shape === 'reading'` and `repo === null` cannot disagree, because a session with no workspace derives a null state and `unplaced` catches it first; the branch reads the shape, and no test can tell the two apart.
- `tests/browser/git.ts:20`, the shared helper's commit author: recorded. No assertion reads it and both specs are green.
- `data-repo` beside `views/repositories/Repo.svelte`'s `data-repo-failed`: added to Q52, which already covers that file's second `branchState`.
- The report's sentence about the `reading` line on every newly selected session: corrected by the reviewer's probe. The git watcher publishes every session workspace together, so a session whose workspace is already on the channel draws no `reading` line; the window exists only for a workspace the channel has not carried yet.
