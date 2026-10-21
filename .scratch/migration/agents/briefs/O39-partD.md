# Brief: O39 part D, the README rewritten and the two documents moved into docs/

Size: a full step

Read `.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. The configuration lists one standards page, `spec.md` itself (`orchestrator-state.md`, `standards: [.scratch/migration/agents/spec.md]`), and the repository has no ADR folder (`ls docs/adr`: "No such file or directory"), so no ADR touches the step.

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

The step is part D of O39 (rulings 193 and 194). Its brief, reports and round files carry the suffix `-partD` (`agents/briefs/O39-partD.md`, `agents/reviews/O39-partD-report.md`), since `agents/briefs/O39.md` and `agents/reviews/O39-*.md` hold parts A to C.

## What is on the tree (read on main at 784756d5)

- `README.md` is 64 lines with the sections Quickstart, Running it, Checking it and Two Claude accounts (`grep -n "^#" README.md`). "Running it" (lines 16-31) holds, each as one paragraph: the install and start checks (line 18), `npm run dev` (20), the native app and `app:package` (22), `app:release` (24), the built server's three arguments (26), the workspace file and `local.yml` keys (28), and the runtime dependencies with their licences (30). Line 14 says "`DESIGN.md` is what oculus is measured against". Line 22 links "[manual](HELP.md#the-window)".
- The release `v0.1.0` is published on `TheAxeC/oculus` (`gh release view v0.1.0`: "v0.1.0 false https://github.com/TheAxeC/oculus/releases/tag/v0.1.0"), with `oculus-0.1.0-darwin-arm64.zip`, `oculus-0.1.0-linux-arm64.tar.gz` and `oculus-0.1.0-linux-x64.tar.gz`. The repository is private.
- `HELP.md` is 544 lines and `DESIGN.md` 768 lines, both at the repository root (`wc -l`). `docs/` holds `apps.md`, `data-map.md`, `palette.md`, `templates.md` and `diagrams/` (`ls docs`).
- 82 tracked files outside `.scratch/` name `HELP.md` or `DESIGN.md`, 170 lines in all (`git grep -l -I "HELP\.md\|DESIGN\.md" -- . ':!.scratch' | wc -l`; `git grep -c ... | awk` sums 170). `HELP.md` is named in 16 files (`git grep -c -I "HELP\.md" -- . ':!.scratch'`), among them code that reads the file by name: `src/lib/server/content/docs.ts:812` `export const MANUAL = 'HELP.md';`, `src/lib/data/places/shipped.ts:13-14` (`'HELP.md'`, `'DESIGN.md'` in `SHIPPED_SOURCES`, the entries a release app copies), `tests/checks/source/history.test.ts:22` `const DOCS = ['HELP.md', 'DESIGN.md', 'README.md'];`, `tests/routes/docs/docs.test.ts:28,29,74,157` and `tests/views/shared/prose/doc-link.test.ts:17,30,60,74,80,122`. `DESIGN.md` is named in 73 files, most of them code comments under `src/lib` (57 files).
- `DESIGN.md` has nine Markdown links, all `docs/diagrams/<name>.svg` (`grep -o "\]([^)]*)" DESIGN.md`), and names `docs/apps.md`, `docs/data-map.md`, `docs/palette.md` and `docs/templates.md` only inside code spans and the layout block (`grep -o "docs/[a-z-]*\.md" DESIGN.md | sort | uniq -c`; corrected at the brief check). `HELP.md` holds the guide links: `](docs/apps.md)` 4, `](docs/data-map.md)` 2, `](docs/palette.md)` 1, `](docs/templates.md)` 11, and `](#the-keys)` 2. `docs/apps.md:3` links `[HELP.md](../HELP.md)`. `DESIGN.md:36` "Repository layout" lists the root files at `DESIGN.md:40`.
- Sentences the change makes false or inexact outside the two names: `DESIGN.md:655` ("The arguments and the environment the server is given are in `README.md`."), `DESIGN.md:741` ("started and packaged as `README.md` says"), `DESIGN.md:705` and `src/desktop/release.ts:5` ("and the three documents"), `src/lib/data/places/shipped.ts:2` ("the three documents") (`grep -n`). `HELP.md:3`, `DESIGN.md:198` and `DESIGN.md:581` stay true, since the README keeps install from source and the checks.
- The Status view's line counts (`src/lib/server/machine/lines.ts:71-77`, `folderOf`, the first segment of a path) count a root Markdown file under the top level and a file under `docs/` under the `docs` row.
- The release notes (`gh release view v0.1.0 --json body`) say: the macOS app for Apple silicon in the `.zip`; the Linux app folder in each `.tar.gz`, "started by its `oculus` program"; "The macOS bundle is signed ad hoc, so macOS asks for confirmation the first time it opens (right-click the app, then Open)"; the app names at its first window any program it needs and cannot find.
- No test reads the real manual or a real engine document's diagram parts (`git grep -ln "diagramOf\|ownScope\|renderEngineDoc" -- tests` prints nothing); the diagram rule has no `agents/guarded.md` entry beyond G25, the committed-diagram check.
- `src/lib/server/content/docs.ts:333-350`: a diagram is found by the image's resolved path lying directly in the engine's `docs/diagrams/`, so `docs/diagrams/x.svg` in a root document and `diagrams/x.svg` in a document under `docs/` both name the diagram `x`. `src/lib/server/content/docs.ts:672-690` serves any `.md` inside the engine folder by its relative path. `src/lib/views/shared/prose/doc-link.ts:76-101` opens the Help view for a link whose path equals the answer's `manual`.
- `CLAUDE.md:5` names `README.md`, `DESIGN.md` and `HELP.md` for orientation; `CLAUDE.md:36` names `DESIGN.md`.
- Outside the step's paths, kept for the orchestrator (the builder never edits them): the ledger's standing files `.scratch/migration/agents/spec.md:7,22,55,70,103`, `.scratch/migration/agents/guarded.md:341,343`, `.scratch/migration/orchestrator-state.md:3,117,312`, `.scratch/migration/plan.md:3` and `.scratch/ROADMAP.md:3` name `DESIGN.md` (and `spec.md:70` `HELP.md`); the hub's `CLAUDE.md:33` names oculus's `DESIGN.md`; two memories of the oculus memory folder name them. The rest of `.scratch/` is the plan's log and is not changed.
- `~/.oculus/views.json` holds `HELP.md` and `DESIGN.md` only inside saved document text (`grep -o`), no view key or path.

## What to build

1. `HELP.md` moves to `docs/HELP.md` and `DESIGN.md` to `docs/DESIGN.md`, each moved whole with its text unchanged except for links, paths and the sentences the move makes false. The names stay `HELP.md` and `DESIGN.md`. `DESIGN.md:655` and `:741` name the page that now holds the server's arguments and the app's start and packaging (`docs/reference.md`, by its relative link from `docs/`); `DESIGN.md:705`, `src/desktop/release.ts:5` and `src/lib/data/places/shipped.ts:2` say what the release holds without counting the two moved documents twice (the README at the root, the two documents inside `docs/`).
2. Every reference is updated, so no tracked file outside `.scratch/` names either document at the repository root. A path or a link names the new place: from the root `docs/HELP.md` and `docs/DESIGN.md`; from a file under `docs/`, the relative link (`HELP.md`, `DESIGN.md`, `diagrams/x.svg`, `apps.md`). A code comment that names a document names it `docs/DESIGN.md` or `docs/HELP.md`, so a reader can open it from the name. Inside the two moved documents every Markdown link `](...)` resolves from `docs/`: `DESIGN.md`'s nine `](docs/diagrams/x.svg)` become `](diagrams/x.svg)`, `HELP.md`'s `](docs/apps.md)` becomes `](apps.md)` and so on for its 18 guide links, `](#the-keys)` stays, and a link to `README.md` or another root file becomes `../<file>`. A path in a code span or in the layout code block is a path from the repository root and stays one (`docs/apps.md` stays `docs/apps.md`); a code span naming one of the two moved documents names it `docs/HELP.md` or `docs/DESIGN.md`, a fragment kept (`docs/HELP.md#the-window`). `DESIGN.md`'s "Repository layout" lists the two documents under `docs/`.
3. The code reads the manual at its new place: `MANUAL` is `docs/HELP.md`; the comments of `docs.ts` say where it is; `SHIPPED_SOURCES` drops `HELP.md` and `DESIGN.md` (the `docs` entry carries them) and its head comment says what it now holds; `history.test.ts` reads the documents at their places; the tests of `docs.test.ts` and `doc-link.test.ts` give the manual's new path. The Help view draws the manual, a link from the manual to `apps.md` or from `apps.md` to the manual opens in the right view (the Help view for the manual), and the doc view draws `DESIGN.md` with its diagrams, as before the move. No test reads the real engine folder; the proof of this sentence is C4's reading of every link and the look at landing (the Help view, a manual link to the Apps guide and back, the doc view of `docs/DESIGN.md` with a diagram), which the orchestrator takes. The Status view's line counts then count the two documents and `docs/reference.md` under the `docs` row; the report states that before and after.
4. `README.md` is rewritten for a reader who meets oculus first on its GitHub page. It holds, in this order: what oculus is, in a short paragraph, written for a reader who does not know the hub; install from the Release (the release page `https://github.com/TheAxeC/oculus/releases`; the three archives of v0.1.0 by platform and what each holds, the ad hoc signature and macOS's confirmation at the first open, and the programs the app names at its first window, each as the release notes state them, the notes quoted in the report as the source; no install place the notes do not give); install from source (the requirements as the present Quickstart lists them, `npm ci`, `npm run dev` and `npm run app`); the first hub (the present Quickstart step 4 and the demo hub); where the documents are (`docs/HELP.md`, the manual; `docs/DESIGN.md`, what oculus is measured against; the guides under `docs/` and the new reference page, each by link); and the checks (the present "Checking it" list, kept whole). Every fact the README states is kept from the present text, checked on the tree, or taken from the release notes; no other claim is added.
5. The reference paragraphs move to a new page (decision 6 for the four paragraphs ruling 193 does not name), `docs/reference.md`: the install and start checks, `npm run dev`, the native app with `app:package`, `app:release`, the server's three arguments, the workspace file and `local.yml` keys, and the runtime dependencies with their licences, each with its text whole, its links resolved from `docs/`. "Two Claude accounts" moves there too, whole, under its own heading. Nothing of the present README is dropped: every sentence of it is in the new README or in `docs/reference.md`, reworded only where its place or a link needs it. The page opens with one sentence saying what it holds. `docs/reference.md` is one of the engine's documents (the doc view serves it like `docs/apps.md`) and is read by `history.test.ts` as a document under `docs/`.
6. `CLAUDE.md:5` names the three documents at their new places and the reference page; `CLAUDE.md:36` names `docs/DESIGN.md`. `docs/apps.md:3` links `HELP.md`.
7. The report's section "Doc text" gives the exact lines for the files outside the step's paths: `spec.md:7,22,55,70,103`, `guarded.md:341,343`, `orchestrator-state.md:3,117,312`, `plan.md:3`, `ROADMAP.md:3` and the hub's `CLAUDE.md:33`, each as `grep -n` prints it and its replacement naming `docs/DESIGN.md` or `docs/HELP.md`. The orchestrator applies them at landing.

## Cases

- C1 (a test). The doc endpoint asked for the manual (`manual=1`) answers the text of `docs/HELP.md` and names `manual: 'docs/HELP.md'`, in `tests/routes/docs/docs.test.ts` (G2), whose fixture plants `hub/engine/docs/HELP.md`. Expected: as stated; the changed rows fail on the unchanged tree (the server still reads `HELP.md`), and the report quotes that failure.
- C2 (a test that the change preserves). `tests/views/shared/prose/doc-link.test.ts` (G74) with its data moved to the new place: `manual: 'docs/HELP.md'`, a link `HELP.md` from `docs/apps.md` opens the Help view, a link `apps.md` from `docs/HELP.md` opens the Apps guide in the engine's space. `doc-link.ts` is not changed, so these rows pass on the unchanged tree and after the change, both runs quoted; no row is added whose opening another row already gives.
- C3 (a run). `git grep -n -I "HELP\.md\|DESIGN\.md" -- . ':!.scratch'` after the change, quoted whole. Expected: every hit names `docs/HELP.md` or `docs/DESIGN.md`, or is a link or an example address relative to a file under `docs/` (in a document under `docs/`, in test data whose `from` is under `docs/`, or the example of `doc-link.ts:3` rewritten as a link between two files under `docs/`); no hit names a root `HELP.md` or `DESIGN.md`.
- C4 (a reading). Every Markdown link of `docs/HELP.md`, `docs/DESIGN.md`, `docs/apps.md`, `docs/reference.md` and `README.md` resolves to a file that exists, and each fragment (`#the-window`, `#the-keys`, any other) is a heading of the file it names; every `docs/HELP.md#...` code span of `docs/DESIGN.md` names a heading of `docs/HELP.md`. The report lists each link with the file and heading it resolves to.
- C5 (a reading). `SHIPPED_SOURCES` after the change carries the two documents through `docs`, and its head comment and `release.ts:5` say what the release holds. `history.test.ts`'s `DOCS` lists the root documents that remain and its `GUIDES` walk reads `docs/*.md`, so `docs/HELP.md`, `docs/DESIGN.md` and `docs/reference.md` are read: checked by reading `history.test.ts`, since a missing file is skipped (`history.test.ts:142`) and a pass proves nothing about what was read. The test runs green after the change.
- C6 (a reading). Every sentence of the present `README.md` is in the new `README.md` or in `docs/reference.md`; the report gives the mapping, paragraph by paragraph of the old file.
- C7 (a reading). The new `README.md` follows item 4's order and states only facts of the tree or of the release notes; its install-from-Release part names the three archive files as `gh release view v0.1.0 --json assets` lists them.
- C8 (implied input, a reading). An engine folder without `docs/HELP.md` (a `--engine` folder holding `config/` only, an older copy, or a built server or app stub whose build predates the move while the checkout has moved the file): `manual=1` answers the 404 with its message (`answer`, `docs.ts:515-517`), no crash, until the build is made again (`npm run build`, or one `npm run app` for the stub). Checked by reading `renderManual` and `answer`; the report names it as the effect on an existing build. No migration code is added for an older place.
- C9 (implied input, a reading). A saved document tab or a hub link naming the old root path (`engine:DESIGN.md`, `HELP.md` at an engine root): it answers the engine documents' 404, with no code carrying the old place. `~/.oculus/layouts.json` holds none (`grep -o 'engine:[A-Za-z/._-]*'`, the four `docs/` guides only).
- C10 (implied input, a reading). A cached document: the manual's entity tag is the process, the size and the modification time (`docs.ts:31-35`), so the moved file answers 200 with its text at the next ask. Checked by reading.

The builder's first task, before any change, is the first run of every case above on the unchanged tree, with each case's result noted.

- A case of a code step (a script, or a product's code) becomes a test of the step only when the rules file's test rule calls for a test of it.
- A case kept as a test is run on the unchanged tree first.
- No prototype script stands in for such a test.
- Every other case of a code step is checked by a run the report quotes, and no test is kept for it.
- A case of a text or judgment step is checked by reading the unchanged tree.
- The first read of a text or judgment case is noted.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code, and hands back the first run and that case, with the rule and the result it gives. The orchestrator rules on the case and resumes the builder with the ruling, and the final report carries it.

## Paths this step writes

- `README.md`
- `HELP.md` (deleted)
- `DESIGN.md` (deleted)
- `docs/HELP.md`
- `docs/DESIGN.md`
- `docs/reference.md`
- `docs/apps.md`
- `CLAUDE.md`
- `config/defaults/behavior.yml`
- `config/defaults/layout.yml`
- `config/text/views/system/help.yml`
- `docs/diagrams/channels.dot`
- `docs/diagrams/channels.svg`
- `docs/diagrams/layer-data.dot`
- `docs/diagrams/layer-data.svg`
- `docs/diagrams/layer-server.dot`
- `docs/diagrams/layer-server.svg`
- `docs/diagrams/layer-shell.dot`
- `docs/diagrams/layer-shell.svg`
- `docs/diagrams/layer-state.dot`
- `docs/diagrams/layer-state.svg`
- `docs/diagrams/layer-ui.dot`
- `docs/diagrams/layer-ui.svg`
- `docs/diagrams/layer-views.dot`
- `docs/diagrams/layer-views.svg`
- `docs/diagrams/layers.dot`
- `docs/diagrams/layers.svg`
- `docs/diagrams/writes.dot`
- `docs/diagrams/writes.svg`
- `src/app.d.ts`
- `src/desktop/release.ts`
- `src/hooks.server.ts`
- `src/lib/data/helpers/guards.ts`
- `src/lib/data/model/index.ts`
- `src/lib/data/model/machine/model-machine.ts`
- `src/lib/data/places/shipped.ts`
- `src/lib/data/snapshot/normalise.ts`
- `src/lib/data/snapshot/validate.ts`
- `src/lib/data/sources/documents/docs.ts`
- `src/lib/server/content/docs.ts`
- `src/lib/server/core/auth.ts`
- `src/lib/server/core/channels.ts`
- `src/lib/server/core/git/compare.ts`
- `src/lib/server/core/git/run.ts`
- `src/lib/server/edit/writes/manifest.ts`
- `src/lib/server/files/files.ts`
- `src/lib/server/files/project/project-files.ts`
- `src/lib/server/files/search/search-routes.ts`
- `src/lib/server/git/deposit/deposit-git.ts`
- `src/lib/server/git/deposit/deposit-routes.ts`
- `src/lib/server/git/deposit/deposit.ts`
- `src/lib/server/git/git-write.ts`
- `src/lib/server/machine/approvals/approvals.ts`
- `src/lib/server/machine/apps/host/connection.ts`
- `src/lib/server/machine/apps/host/runner/host-runner.mjs`
- `src/lib/server/machine/apps/host/runner/streams.mjs`
- `src/lib/server/machine/apps/reach/open.ts`
- `src/lib/server/machine/apps/tools/streams.ts`
- `src/lib/server/machine/lsp/adapters/pyright/interpreter.ts`
- `src/lib/server/machine/pty/channel.ts`
- `src/lib/server/machine/pty/latex/approval.ts`
- `src/lib/server/machine/pty/routes.ts`
- `src/lib/server/machine/pty/sessions.ts`
- `src/lib/server/machine/pty/tmux.ts`
- `src/lib/server/root/hooks.ts`
- `src/lib/server/root/socket.ts`
- `src/lib/server/root/watch/git.ts`
- `src/lib/server/root/watch/portfolio.ts`
- `src/lib/server/root/watch/sessions.ts`
- `src/lib/server/sessions/stores/turns.ts`
- `src/lib/state/client/queries/queries.svelte.ts`
- `src/lib/state/client/selectors.svelte.ts`
- `src/lib/state/client/socket.svelte.ts`
- `src/lib/state/client/writes.svelte.ts`
- `src/lib/state/sessions/changes.svelte.ts`
- `src/lib/state/sessions/terminals.svelte.ts`
- `src/lib/state/sessions/transcript.svelte.ts`
- `src/lib/state/sources/search/search.svelte.ts`
- `src/lib/state/sources/search/search.ts`
- `src/lib/state/system/docs.svelte.ts`
- `src/lib/state/system/machine/lsp/lsp.svelte.ts`
- `src/lib/state/workbench/layout/open/float/return-place.ts`
- `src/lib/state/workbench/selection.svelte.ts`
- `src/lib/ui/controls/Confirm.svelte`
- `src/lib/ui/controls/editor/chords.ts`
- `src/lib/ui/controls/editor/options.ts`
- `src/lib/views/boards/editor/Editor.svelte`
- `src/lib/views/boards/projects/Projects.svelte`
- `src/lib/views/sessions/session-detail/DetailsBody.svelte`
- `src/lib/views/shared/prose/doc-link.ts`
- `src/lib/views/sources/source/status/library-tab.svelte.ts`
- `src/lib/views/system/help/Help.svelte`
- `src/routes/+page.server.ts`
- `tests/checks/config/integrity.test.ts`
- `tests/checks/source/history.test.ts`
- `tests/checks/tree/boundaries.test.ts`
- `tests/routes/docs/docs.test.ts`
- `tests/server/git/clone-exclude.test.ts`
- `tests/server/git/git-scan-depth.test.ts`
- `tests/server/machine/approvals/approvals.test.ts`
- `tests/server/machine/apps/manifest/manifest.test.ts`
- `tests/server/machine/apps/tools/streams/streams.test.ts`
- `tests/views/shared/prose/doc-link.test.ts`
- `utils/diagrams/diagrams.mjs`
- `utils/migrations/convert-decks.mjs`
- `.scratch/migration/agents/reviews/O39-partD-report.md`

Each file of the list other than the six documents and `CLAUDE.md` is changed only on the lines that name the two documents or say what the release holds, and the comment paragraphs those lines sit in. A diagram file changes only when `npm run diagrams` rewrites it.

No script is written for this step, by the builder or by the session that runs it inline, other than a script the step builds under "What to build". Any other script needs the user's approval of what it computes, quoted from a line of `plan.md`'s Rulings. This brief's mention of a script is no approval. The moves and the reference edits are made with the editing tools, file by file.

## Decisions taken in this brief (each reversible, none silent)

1. The reference page is `docs/reference.md`, titled "Reference", beside the other guides; ruling 193 names "a page under `docs/`" and no name.
2. "Two Claude accounts" moves to `docs/reference.md` whole: it is setup of one machine, not what a first reader of the README needs, and ruling 193's README list does not name it.
3. The two documents keep their names (`HELP.md`, `DESIGN.md`) under `docs/`; ruling 194 says "move", not "rename".
4. A comment naming a document names it with its folder (`docs/DESIGN.md`), across the 57 `src/lib` files, so the name stays a path a reader can open. Five cases from the tree under this decision: `src/hooks.server.ts:79` "DESIGN.md's one "Auth" rule" becomes "docs/DESIGN.md's one "Auth" rule"; `tests/checks/tree/boundaries.test.ts:1` "the layers of DESIGN.md, section "Boundaries"" becomes "the layers of docs/DESIGN.md, section "Boundaries""; `utils/diagrams/diagrams.mjs:61` "in the order DESIGN.md names them" becomes "in the order docs/DESIGN.md names them"; `src/lib/views/system/help/Help.svelte:18` "the HELP.md of its folder" becomes "the docs/HELP.md of its folder"; `config/defaults/behavior.yml:267` "(DESIGN.md, "Apps added while oculus runs")" becomes "(docs/DESIGN.md, "Apps added while oculus runs")". A comment the step edits is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short (`spec.md`, "What every package obeys").
5. The ledger files and the hub's `CLAUDE.md` are not in the step's paths (builders never edit the ledger; the hub is another repository); their lines come back under "Doc text" (item 7).
6. The four README paragraphs ruling 193 does not name (the install and start checks, `npm run dev`, the native app with `app:package`, and `app:release`) move to `docs/reference.md` whole: each is reference detail of the same kind as the three ruled ones, and the new README keeps the short form a first reader needs (the requirements, `npm ci`, `npm run dev`, `npm run app`). Keeping them in the README would leave it the reference it was, which ruling 193 calls the lazy option.
7. `docs/reference.md` gets no tab of its own on the Help page (`config/defaults/layout.yml:159-162` pins the four guides): the README's text had none, so the page draws nothing new; the page opens from the README, the manual and the doc view by link.

## Libraries checked

None found: the step moves and edits text and changes two path constants, a capability no library covers. The step adds no dependency.

The builder adds no dependency this brief does not name. A library the builder finds that would cover its work is reported, not installed.

## Read, with sections or line ranges

1. `README.md` whole: every sentence, for the mapping of C6.
2. `src/lib/server/content/docs.ts:1-60`, `:180-200`, `:325-360`, `:665-700`, `:800-850`: the manual, the engine documents and the diagram rule.
3. `src/lib/views/shared/prose/doc-link.ts` whole: how a link opens the Help view.
4. `src/lib/data/places/shipped.ts` whole and `src/desktop/release.ts:1-30`.
5. `tests/routes/docs/docs.test.ts`, `tests/views/shared/prose/doc-link.test.ts` and `tests/checks/source/history.test.ts` whole.
6. `DESIGN.md:36-90` (Repository layout) and every `](` link of both documents.

## What it must do

As "What to build" says, items 1 to 7.

## Conventions

The rules file's character set (ASCII, accented letters in names allowed as it says) and its prose rules: each paragraph and bullet one line, no em or en dash, no spaced hyphen as a dash, plain sentences. Prettier formats `.md` files only where the repository's format check covers them; run `npm run format` after the last change. A comment the step edits is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short.

## Verify before you report

Run from the worktree's root, each must hold, each output piped through the filter the rules file names:

1. `npm run test:quick` (the plan's verify list) prints its pass line. The character-set and format checks run inside it over the changed files.
2. `npx vitest run tests/routes/docs/docs.test.ts tests/views/shared/prose/doc-link.test.ts tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts tests/checks/diagrams/diagrams.test.ts` passes.
3. The C3 grep, quoted whole, with no root `HELP.md` or `DESIGN.md`.
4. `ls HELP.md DESIGN.md` prints "No such file or directory" for both; `ls docs/HELP.md docs/DESIGN.md docs/reference.md` lists all three.
5. Each new or changed test is run once on the unchanged tree, before the code is changed, and again after the change.
   - A test of a behaviour the change adds or changes fails on the unchanged tree, that run is its proof, and the report quotes the failure.
     - An edit to the test after that run is checked by reading it, with no further run on the unchanged tree.
   - A test of a behaviour the change preserves passes on the unchanged tree where it can run there, and passes after the change, and the report quotes those runs.
   - A test that would still pass with the behaviour it is written for taken out of the code is an audit, not a proof, and this brief says which it is.
   - A case checked by a quoted run is no test and is not judged as one.
6. Each new or changed list item and sentence is read against the standards pages' rules on list items and sentence length, and each place it departs from them is named in the report with why it needs its form.

The plan's whole verify list (`npm run test:landing`) runs once, at landing on main.

## Report

Write it to `.scratch/migration/agents/reviews/O39-partD-report.md` in the worktree, in the rules file's character set, a character outside it in quoted output written by its name in angle brackets, such as `<tab>` or `<em dash>`, with these parts in this order.

- The first line: anything NOT done, or "Everything in the brief is done".
- The open items of the state file, verbatim, which hold only what the user must rule on.
- The cases' first run: every case of "Cases" by its name, none left out, each with the command or the reading that checked it and its output as printed.
- The DONE / NOT DONE table with the checks above and their output as printed. A line shortened with "..." is not verbatim.
- The files with line counts.
- Every judgment call the brief left open.
- Every host- or user-visible change with its before and after.
- Anything in the brief that was wrong or impossible, with the evidence.
- The section "Doc text" of item 7.
