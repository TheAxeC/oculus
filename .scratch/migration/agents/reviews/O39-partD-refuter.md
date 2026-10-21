# Step O39 part D refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O39, base a2e367d6)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

No test, check, lint, format, svelte-check, build, npm script or node/python program was run, by the user's order. The evidence is reading and text commands, run from the worktree:

```
git status --short
  91 paths: D DESIGN.md, D HELP.md, ?? docs/HELP.md, M README.md, M CLAUDE.md, the rest M under config/, docs/, src/, tests/, utils/
git diff a2e367d6 --stat | tail -1
  91 files changed, 235 insertions(+), 1523 deletions(-)

grep -rIn -i "design\.md\|design doc" --exclude-dir={node_modules,.scratch,.agents,.git} .
  (nothing)
grep -rIn "Axel" --exclude-dir={node_modules,.scratch,.agents,.git} .
  (nothing)
grep -rIn "HELP\.md" ... | grep -v "docs/HELP\.md"
  only relative links from inside docs/ (docs/apps.md:3 "](HELP.md)", the docs.test.ts and doc-link.test.ts fixtures)
grep -rIl "Fixed git choices|Apps added while oculus runs|Decisions taken|Hot reload|Untyped input" (each)
  (nothing for each: DESIGN.md's content is in no file)

diff <(git show a2e367d6:HELP.md) docs/HELP.md
  17 changed lines, each only a link "](docs/X.md)" made "](X.md)" (lines 3, 96, 103, 106, 330, 352, 376, 382, 427, 434, 439, 460, 470, 510, 512, 516, 519); every link target (apps.md, templates.md, palette.md, data-map.md) exists in docs/
grep -on "\]([^)#][^)]*)" README.md docs/*.md | grep -v http
  README.md:74-78 link docs/HELP.md, docs/templates.md, docs/data-map.md, docs/apps.md, docs/palette.md (all exist); docs/apps.md:3 HELP.md, :99 templates.md

git diff a2e367d6 -U0 -- src utils config tests, lines not starting with a comment marker
  shipped.ts -'HELP.md' -'DESIGN.md'; docs.ts MANUAL 'HELP.md' -> 'docs/HELP.md'; history.test.ts DOCS; docs.test.ts (4 lines); doc-link.test.ts (9 lines); test data in terminal-actions, changes, deck-acts, literature tests
git diff a2e367d6 -U0 -- '*.ts' '*.svelte' '*.mjs' | awk (added lines over 100 columns)
  (nothing)
git diff a2e367d6 -U0 | grep '^+' | LC_ALL=C grep '[^ -~<tab>]';  LC_ALL=C grep -c '[^ -~<tab>]' README.md docs/HELP.md
  (nothing); 0 and 0

The builder report's quoted commands:
grep -rnw Axel src tests docs config utils README.md   -> reproduced by the whole-tree grep above: nothing
the awk length filter over git diff a2e367d6 -U0         -> reproduced above: nothing over 100 columns
diff HELP.md docs/HELP.md (17 link lines)               -> reproduced against the base copy: 17
gh release view / gh repo view                          -> not run (network command outside this review's allowed commands); see Declined
```

## Verdicts

Items (the ruling "O39 part D list (2026-10-21)" (1) to (6), then the two rounds):

- (1) README rewrite: holds. 92 lines; sections What it shows, Install, Run from source, Start with a hub, Documentation, Checks; one line per paragraph; ASCII; no DESIGN.md, no new page. Checked against the code: every npm command it names is a script of package.json (dev, app, app:release, test, test:checks, test:slow, check, lint, format:check, format, build, docs:palette); Node `^24.15.0 || >=26.0.0` and npm `>=11` are package.json `engines`; the 13 rail pages and their order are `rail:` of config/defaults/layout.yml and each page's description matches its `arrangements:` views; the archive names follow src/desktop/release.ts:133 with version 0.1.0; `-- --platform linux --arch x64` is accepted by `scriptArgs` (src/desktop/package.ts:54); port 8790 is src/lib/data/sources/config/local.ts:153; the labels Add Folder to Workspace, Make Folder a Hub..., Make Folder a Project, Save Workspace As... are in config/text/views/sources/files.yml:141,153,154,176; the hooks step matches config/text/views/system/status.yml:11; tests/fixtures/hubs/demo/ exists. What it cut and what it lacks against the model READMEs is listed under Declined, as the user's call.
- (2) HELP.md to docs/: holds. docs/HELP.md is the base HELP.md with only its 17 links rewritten relative to docs/ (diff above); `MANUAL` is 'docs/HELP.md' (src/lib/server/content/docs.ts:812). In `SHIPPED_SOURCES` the 'HELP.md' entry is removed rather than rewritten to 'docs/HELP.md': the 'docs' entry already ships the folder, so the literal path would list the file twice. docs/HELP.md is untracked (`?? docs/HELP.md`), so the landing's wip commit must add it.
- (3) DESIGN.md deleted, content moved nowhere: holds (`D DESIGN.md`; its section names grep to nothing in the tree).
- (4) every citation of DESIGN.md removed, rest of each comment kept: holds (whole-tree grep finds none outside .scratch and .agents); one rewording made a sentence false, Standards 2.
- (5) every "Axel" in a comment or text made "the user": holds (whole-tree grep finds no "Axel"); lower-case "axel" left in text and data is listed under Declined.
- (6) no other code change, no comment reformatted, no test run: holds. The changed non-comment lines are exactly the two allowed lines plus the round additions (list above). Comment line breaks moved only where a removed citation spanned two lines (guards.ts:142-143, connection.ts:4, host-runner.mjs:8-9, open.ts:2-4, deposit-git.ts:19-20, latex/approval.ts:3-4, manifest.test.ts:1-2, library-tab.svelte.ts:2-3, Editor.svelte:15-17, git.ts:2-3, portfolio.ts:2-3) or round 2 required a rewrap. The builder reports no test run.
- Round 1, a "What it shows" section in README.md: holds (README.md:7-23).
- Round 1, the DESIGN.md entries of shipped.ts and history.test.ts removed: holds (shipped.ts:8-17; history.test.ts:22).
- Round 2, the tests follow the manual to docs/HELP.md: holds. Read row by row: docs.test.ts plants the manual at hub/engine/docs/HELP.md and expects 'docs/HELP.md' where MANUAL is answered (renderManual answers MANUAL as its path), so it tests what it did; doc-link.test.ts's hubDoc manual `${engineAt}/docs/HELP.md` matches `manualInHub` (docs.ts:470-473), and each changed row resolves to the same path as before (docs/HELP.md, docs/apps.md, .scratch/x.md) with the same expected opening. history.test.ts now reads docs/HELP.md twice, Standards 1.
- Round 2, comments part D made longer than 100 columns rewrapped: holds (no added code line over 100 columns; the three YAML comment lines were over 100 at the base and are one line per paragraph by that file's convention).
- Round 2, every "Axel Faes" in example and test data made John Smith: violated, Spec 1 (the template's key left at faes2024blockterm).

Cases: none.

## 1. Spec

- docs/templates.md:1139-1141: "#  - key: faes2024blockterm ... #    authors: [John Smith, Marc M. Van Hulle]"; what is wrong: the author was made John Smith but the sample's key was left `faes2024blockterm`, while docs/HELP.md:299 states the key is "the first author's surname, the year and the first word of the title" and the builder changed the same key to `smith2024blockterm` in every test for that reason (changes.test.ts:372-373, literature.test.ts); failure scenario: a user copying the Literature template reads a key that contradicts the manual's rule, and a Save to Literature of this very paper writes `smith2024blockterm`, not the template's key; verdict: Round 2 "Axel Faes made John Smith" violated.

## 2. Proof

- .scratch/migration/agents/reviews/O39-partD-report.md, opening list "Not done or left broken by the brief's limits (read first)": "src/lib/data/places/shipped.ts:13 still lists 'DESIGN.md' ... tests/checks/source/history.test.ts:22 ... names two files that no longer exist ... tests/routes/docs/docs.test.ts:74 expects `body.manual` to be 'HELP.md'"; what is wrong: none of the three holds on the tree (shipped.ts has no 'DESIGN.md', history.test.ts:22 is `['docs/HELP.md', 'README.md']`, docs.test.ts:74 expects 'docs/HELP.md'); the rounds were appended below and the head section was not rewritten; the landing's list of what is still open rests on this section; failure scenario: the orchestrator reads the "read first" list at landing and books or blocks on two defects the rounds already closed; verdict: none.

## 3. Standards

- tests/checks/source/history.test.ts:22 and :128-137: "const DOCS = ['docs/HELP.md', 'README.md'];" with "/** The documents of a tree: the three at its root and every Markdown file under its `docs/`. */" and `return [...DOCS, ...guides];`; what is wrong: `guides` already lists every `docs/*.md`, so docs/HELP.md is read twice, and the doc comment's "the three at its root" is false (one root document is left, README.md); spec.md "What every package obeys": a sentence in a head or doc comment that the change makes false is a defect of the change; failure scenario: a date or package id in docs/HELP.md fails "names no package id, date or session in any document" with every hit printed twice, and a reader of the comment looks for three root documents; verdict: none (Round 2 tests item holds).
- src/lib/server/root/watch/git.ts:3: "// Git watches each workspace's .git and worktree and re-reads on change, no more often"; what is wrong: in the base the subject "git" was the watcher's name in DESIGN.md's "Watchers" list; capitalised as the sentence's subject it now says the git program watches, which is false (this module's channel watches); same rule as above; failure scenario: a reader looks for a git hook or a git-side watch rather than this module's watcher; verdict: none.
- Outside the worktree, sentences the deletion and the move make false: /Users/axelfaes/workspace/research-hub/CLAUDE.md:33 (and AGENTS.md, its symlink) "Every oculus design choice is justified from oculus's own `DESIGN.md`"; the ledger's .scratch/migration/agents/spec.md:7, 22, 55, 70 (70 also names `HELP.md` at the root), 103 and agents/guarded.md:341, 343 name DESIGN.md; what is wrong: each names a file the step deletes or moves; these are the orchestrator's files and outside the step's paths; failure scenario: an agent briefed from spec.md is told to grep `DESIGN.md` and `HELP.md` and to measure its package against DESIGN.md's sections, which do not exist; verdict: none.

## 4. Behaviour

- src/lib/server/machine/lines.ts:71-77 (`folderOf`, the first segment of a path) over SHIPPED_SOURCES and the git file list: "if (parts.length === 1) return TOP_LEVEL;"; what is wrong: the Status view's line counts change: the top-level row loses HELP.md (544 lines at the base) and DESIGN.md (768 lines at the base, `git show a2e367d6:DESIGN.md | wc -l`) and the `docs` row gains docs/HELP.md's 544 (cloc counts Markdown; not run); the builder's report states no before and after for this view; failure scenario: at the look the Status view shows a smaller top level and a larger docs row and the reader has no stated expectation to read it against; verdict: none.

## Declined to judge

- Every test run the rules file asks for (spec.md "What every package obeys": the failing line of each changed test on the unchanged tree, and the verify list): no test is run, by the user's order.
- The clash between spec.md "What every package obeys" ("A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short") and ruling item (6) ("no comment is reformatted"): many edited comments now hold a line ending short inside a sentence (for example host-runner.mjs:9 "// The process ends when its standard", deposit-git.ts:19, manifest.test.ts:1, open.ts:2); the builder followed the ruling; which rule governs is the user's call.
- CLAUDE.md:36 now says a design choice is justified from "oculus's own goals and decisions", and with DESIGN.md deleted no file in the tree states them; likewise the comments now name "the auth rule", "the wire model", "the boundary table", "the processes rule", "the one explicit migration" and "the decision on git writes" with no text that defines them (the boundary table survives as the table in tests/checks/tree/boundaries.test.ts). This follows from ruling (3) and is the user's call.
- What the README cut that is now documented nowhere outside the code: the built server's arguments `--engine`, `--default-port`, `--handler`; `node src/server.ts` and `npm run preview`; `npm run app:package` and where it writes; `npm run diagrams`; the window-state and storage paths; the login-shell environment; the runtime dependency licence list (the LPPL notice of config/catalogs/unimath.yml stays in that file's head comment). `npm run test:quick` and `test:landing` are named only in CLAUDE.md. Against the model READMEs, the new README has no project-structure section and no licence section, and the repository holds no LICENSE file (`git show a2e367d6:LICENSE` fails; `ls` shows none). Whether each belongs is the user's call under ruling (1).
- The README's release link and `git clone https://github.com/TheAxeC/oculus.git` work only for someone with access while the repository is private (the builder's `gh repo view` answer and the brief say private; not rerun here, a network command outside this review).
- README.md:29 "right-click the app and choose Open": in my judgment (not verified here), recent macOS versions no longer open an unnotarized downloaded app that way and send the user to System Settings, Privacy and Security, Open Anyway; settled by opening the released zip on the current macOS.
- The user's names left in example, test and shown text, not judged, as asked: config/text/app.yml:24 `host: axel@research`, which src/lib/shell/panes/workbench-title.ts:27 puts into every window's document title; utils/migrations/convert-decks.mjs:158 `contact: 'axel.faes@gmail.com'` with a personal research-portfolio deck around it; tests/server/machine/runs/recover/harness.ts:42-43, safety.test.ts:260,265, access.test.ts:219,224 (`axel`, `axelk`); tests/server/edit/literature.test.ts:77 `['Faes A']` with key `faes2024blockterm`; tests/state/forms/form-draft.test.ts:41,139,151, tests/data/snapshot/normalise.test.ts:74,75,120,258,259 (`Faes`); tests/state/client/held-unsaved.test.ts:195 (`faes2024`); docs/HELP.md:299 (`faes2024blockterm`); docs/templates.md:1139; comments src/lib/server/content/literature/sources/europe-pmc.ts:79 and src/lib/server/edit/feeds/literature-key.ts:57 (`Faes A`).
- The landing: main carries O47's new HELP.md lines (275a276, 281, 308 differ between the base copy and the main checkout's HELP.md), so the cherry-pick meets a deleted-versus-modified HELP.md and those lines must be carried into docs/HELP.md, as the state file already says; whether main changed other files part D touched needs `git log` or `git diff` against main, which this review does not run. Main adds no new DESIGN.md citation or "Axel" after the base (per-file counts in the main checkout equal the base's).

Reviewer usage: ad9adbd388b50b8f9, claude-opus-5-5, 236,517 tokens, 73 tool uses, 7.7 min.

## Closed

- Spec 1: fixed at landing, `docs/templates.md:1139` key `smith2024blockterm`.
- Proof 1: closed with no change; the builder report's head list predates the two rounds, and each of its three points is closed by them (shipped.ts, history.test.ts:22, docs.test.ts:74 read on main).
- Standards 1: fixed at landing, `tests/checks/source/history.test.ts` `DOCS = ['README.md']` with its two doc comments made true.
- Standards 2: fixed at landing, `src/lib/server/root/watch/git.ts:3` "It watches".
- Standards 3: the ledger's `agents/spec.md` and `agents/guarded.md` fixed at landing; the hub's `CLAUDE.md:33` raised as open item 201 (Axel's file).
- Behaviour 1: stated in the booking (the Status view's line counts move with the manual into the `docs` row and lose `DESIGN.md`).
- Declined, the rewrap rule against ruling (6): ruling (6) governs this step.
- Declined, the README's macOS step: fixed at landing (System Settings, Privacy and Security, Open Anyway).
- Declined, the user's names: ruled by Axel (ruling "O39 part D names"): the window title `Oculus`, `convert-decks.mjs` deleted, the Recover users `john` and `johnsmith`, the `Faes` citation rows kept.
