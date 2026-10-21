# O39 part D, builder report

Worktree: /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O39

Not done or left broken by the brief's limits (read first):
- src/lib/data/places/shipped.ts:13 still lists 'DESIGN.md' (a code line, left as item 4 says). src/desktop/release.ts:93 copies every SHIPPED_SOURCES entry with cpSync, so `npm run app:release` now fails on the missing file until that line goes. Not run, judged from the code.
- tests/checks/source/history.test.ts:22 `const DOCS = ['HELP.md', 'DESIGN.md', 'README.md'];` names two files that no longer exist at the root. tests/routes/docs/docs.test.ts:74 expects `body.manual` to be 'HELP.md', and MANUAL is now 'docs/HELP.md'. Both are code lines the brief forbids changing; no test was run, so whether they go red is not verified.
- The repository TheAxeC/oculus is private (`gh repo view TheAxeC/oculus --json visibility` answered PRIVATE). The README's release link and clone command work only for someone with access until it is made public.

## README.md

Sections of the new README: intro (two paragraphs), Install, Run from source, Start with a hub, Documentation, Checks. Facts were checked against package.json (engines, scripts), src/lib/server/root/process/start/first-run.ts (the programs and the start checks), src/lib/data/sources/config/local.ts:153 (port 8790), src/desktop/release.ts and package.ts (archive names, ad hoc signing, Mac-only macOS build), config/text/views/sources/files.yml (menu labels), config/defaults/layout.yml (Explorer page holds Files), config/text/views/system/status.yml:11 (hooks block), tests/fixtures/hubs/demo/README.md, and `gh release view v0.1.0 -R TheAxeC/oculus` (the three asset names).

The old README's sections:
- Intro paragraph: kept in substance, rewritten.
- Quickstart: kept, split into Install, Run from source and Start with a hub, rewritten.
- Demo hub paragraph: kept, shortened.
- "DESIGN.md is what oculus is measured against": cut, since DESIGN.md is deleted and the README must not name it.
- Running it: cut to the requirements and one sentence on the start check; the built server's flags, `node src/server.ts`, `app:package`, window state paths, login shell environment and the local.yml key reference are reference detail a first reader does not need.
- The release-app paragraph: kept as one line on `npm run app:release`.
- The workspace and local.yml paragraph: cut to two sentences in Start with a hub.
- Runtime dependencies with licences: cut (licence list).
- Checking it: kept as a plain command list; the client-runtime note, OCULUS_TEST_HUB, slow tagging and the diagram and palette tree checks are internal test-suite detail and were cut.
- Two Claude accounts: cut (machine-specific), except the hooks-block step, which moved to Start with a hub.

## Files changed

- README.md: rewritten as above.
- docs/HELP.md: new, written from HELP.md; `diff HELP.md docs/HELP.md` before the delete showed only the 17 lines whose links changed: `](docs/apps.md)` to `](apps.md)`, `](docs/templates.md)` to `](templates.md)`, `](docs/palette.md)` to `](palette.md)`, `](docs/data-map.md)` to `](data-map.md)`. It held no DESIGN.md citation and no "Axel".
- HELP.md: deleted (`rm HELP.md`).
- DESIGN.md: deleted (`rm DESIGN.md`).
- src/lib/server/content/docs.ts: code line 812 `'HELP.md'` to `'docs/HELP.md'`; comments: 5 "DESIGN.md's wire model" to "The wire model"; 17 and 831 "own HELP.md" to "own docs/HELP.md"; 38 "(HELP.md, DESIGN.md, the Apps guide" to "(docs/HELP.md, the Apps guide"; 674 "`docs/`, DESIGN.md, README.md and HELP.md" to "`docs/`, README.md and docs/HELP.md"; 809 "own manual, beside DESIGN.md." to "own manual."
- src/lib/data/places/shipped.ts: the 'HELP.md' entry removed.
- config/defaults/behavior.yml:267: "approved it (DESIGN.md, "Apps added while oculus runs"). These" to "approved it. These".
- config/defaults/layout.yml:34: "layout tree of DESIGN.md with" to "layout tree with".
- config/text/views/system/help.yml:1: "the HELP.md of oculus's folder" to "the docs/HELP.md of oculus's folder".
- CLAUDE.md:5: "`README.md` (how to run and check oculus), `DESIGN.md` (what oculus is measured against: its goals, its decisions and the shape of the code) and `HELP.md`" to "`README.md` (how to run and check oculus) and `docs/HELP.md`".
- CLAUDE.md:36: "justified from oculus's own `DESIGN.md`, citing" to "justified from oculus's own goals and decisions, citing".
- docs/apps.md:3: "[HELP.md](../HELP.md)" to "[HELP.md](HELP.md)".
- tests/checks/tree/boundaries.test.ts:1: "the layers of DESIGN.md, section "Boundaries"." to "the layers."
- tests/checks/config/integrity.test.ts:5: "the gate DESIGN.md names:" to "the gate:".
- tests/checks/source/history.test.ts:4: "(HELP.md, DESIGN.md, README.md" to "(docs/HELP.md, README.md".
- tests/server/machine/approvals/approvals.test.ts:1: "The approvals file DESIGN.md's "Approval" paragraph describes, as the" to "The approvals file, as the".
- tests/server/machine/apps/tools/streams/streams.test.ts:2: "`oculus/stream/*` rows of DESIGN.md:" to "`oculus/stream/*` methods:".
- tests/server/machine/apps/manifest/manifest.test.ts:1-2: "apps folders DESIGN.md's "Apps added while oculus runs" / describes: each" to "apps folders: / each".
- tests/server/git/git-scan-depth.test.ts:205 and tests/server/git/clone-exclude.test.ts:23: "as HELP.md names them" to "as docs/HELP.md names them".
- utils/migrations/convert-decks.mjs:4: "slide files (DESIGN.md, "Decks"). Run it" to "slide files. Run it".
- utils/diagrams/diagrams.mjs:61: "Every diagram, in the order DESIGN.md names them." to "Every diagram."
- src/app.d.ts:11: "The write token of DESIGN.md's "Auth", minted" to "The write token, minted".
- src/lib/ui/controls/Confirm.svelte:7: "DESIGN.md's decision on git writes" to "The decision on git writes".
- src/lib/ui/controls/editor/options.ts:13: "inside it (DESIGN.md, Theming). What" to "inside it. What".
- src/lib/ui/controls/editor/chords.ts:111: "HELP.md's key table" to "docs/HELP.md's key table".
- src/lib/server/core/channels.ts:6: "The rule DESIGN.md names is" to "The rule is".
- src/lib/server/core/auth.ts:1: "DESIGN.md's "Auth", in one module" to "Auth, in one module"; 43: "by DESIGN.md's one "Auth" rule" to "by the one auth rule".
- src/lib/server/core/git/compare.ts:8: "DESIGN.md, "Git": exactly these" to "Exactly these".
- src/lib/server/core/git/run.ts:11: "DESIGN.md, "Git": exactly these" to "Exactly these"; 74: "belongs to Axel alone" to "belongs to the user alone".
- src/lib/server/edit/writes/manifest.ts:83: "the boundary table of DESIGN.md lets" to "the boundary table lets".
- src/lib/server/sessions/stores/turns.ts:4: "DESIGN.md's "Sessions" folds" to "The sessions channel folds".
- src/lib/server/machine/pty/routes.ts:11: "a write in DESIGN.md's "Auth" sense" to "a write in the auth sense"; 14: "is DESIGN.md's one explicit migration" to "is the one explicit migration".
- src/lib/server/machine/pty/latex/approval.ts:3-4: "by the processes rule of / DESIGN.md ("Approval"), and neither" to "by the processes rule, / and neither".
- src/lib/server/machine/pty/channel.ts:1: "channels of DESIGN.md's "The socket", and" to "channels, and"; 10-12: "DESIGN.md's "The socket accepts ... channel", made concrete" to "the rule that the socket accepts ... channel, made concrete".
- src/lib/server/machine/pty/tmux.ts:1: "boundary of DESIGN.md's "PTY":" to "boundary of the PTY:".
- src/lib/server/machine/pty/sessions.ts:3: "DESIGN.md's "PTY" puts a" to "Oculus puts a"; 5: "one Axel started" to "one the user started"; 42: "DESIGN.md's two agents" to "the two agents".
- src/lib/server/machine/lsp/adapters/pyright/interpreter.ts:11: "so DESIGN.md's processes" to "so the processes".
- src/lib/server/machine/approvals/approvals.ts:1: "The approvals file DESIGN.md's "Approval" paragraph describes, as the project" to "The approvals file, as the project".
- src/lib/server/machine/apps/tools/streams.ts:1: "end of DESIGN.md's `oculus/stream/*` rows:" to "end of the `oculus/stream/*` methods:".
- src/lib/server/machine/apps/host/runner/host-runner.mjs:8-9: "on both ends; the / methods are in DESIGN.md's "Apps added while oculus runs". The process" to "on both ends. / The process".
- src/lib/server/machine/apps/host/runner/streams.mjs:3: "as DESIGN.md's `oculus/stream/*` rows say and never" to "through the `oculus/stream/*` methods and never".
- src/lib/server/machine/apps/host/connection.ts:4-5: "is its other end. The methods are in DESIGN.md's "Apps added while oculus / runs"." to "is its other end." (the second line, which held only the citation's tail, is gone).
- src/lib/server/machine/apps/reach/open.ts:2-3: "in the order DESIGN.md's "Opening / things in oculus" gives, answered as" to "in order, / answered as".
- src/lib/server/root/socket.ts:1: "WebSocket of DESIGN.md, "The socket":" to "WebSocket:"; 6: "DESIGN.md's "The socket" names the three exceptions:" to "The three exceptions are these:"; 24: "read half of DESIGN.md's "Auth"." to "read half of the auth rule."
- src/lib/server/root/watch/portfolio.ts:2-3: "DESIGN.md's third row of "Hot / reload", the one that is identical" to "the kind of hot / reload that is identical".
- src/lib/server/root/watch/git.ts:2-3: "changes. DESIGN.md, / "Watchers": git watches" to "changes. / Git watches".
- src/lib/server/root/watch/sessions.ts:2: "DESIGN.md, "Watchers": sessions watches" to "It watches".
- src/lib/server/root/hooks.ts:2: "(DESIGN.md, "Auth": the hook" to "(the hook".
- src/lib/server/files/search/search-routes.ts:8: "DESIGN.md's "Auth" puts" to "the auth rule puts".
- src/lib/server/files/project/project-files.ts:7: "DESIGN.md's wire model" to "The wire model".
- src/lib/server/files/files.ts:5: "what DESIGN.md's decision needs" to "what the decision needs"; 10: "which is DESIGN.md's "Auth" applied" to "which is the auth rule applied".
- src/lib/server/git/deposit/deposit-git.ts:3: "DESIGN.md's decision on git writes" to "The decision on git writes"; 19-20: "exactly once (DESIGN.md, "Git", / "Fixed git choices": the one forced push in oculus)." to "exactly once / (the one forced push in oculus)."; 376: "deposit (DESIGN.md, "Fixed git choices"), kept" to "deposit, kept".
- src/lib/server/git/deposit/deposit-routes.ts:9 and deposit.ts:1: "DESIGN.md's decision on git writes" to "The decision on git writes" / "the decision on git writes".
- src/lib/server/git/git-write.ts:3: "DESIGN.md, "Git": the read-only module" to "The read-only module"; 52: "DESIGN.md's decision on git writes" to "The decision on git writes"; 363: "is Axel's at a terminal" to "is the user's at a terminal".
- src/lib/server/git/git-message.ts:2: "for Axel to edit" to "for the user to edit".
- src/lib/shell/Workbench.svelte:343: "a session wants Axel:" to "a session wants the user:".
- src/lib/state/system/docs.svelte.ts:4, src/lib/state/sessions/transcript.svelte.ts:3, src/lib/state/client/queries/queries.svelte.ts:4: "DESIGN.md's wire model" to "The wire model".
- src/lib/state/system/machine/lsp/lsp.svelte.ts:5: "`lsp:<language>` (DESIGN.md, "The socket")." to "`lsp:<language>`."; 24: "this page (DESIGN.md, "The language servers"), has" to "this page, has".
- src/lib/state/sessions/transcript.svelte.ts:40 and changes.svelte.ts:7: "the boundary table of DESIGN.md" to "the boundary table".
- src/lib/state/sessions/terminals.svelte.ts:1: "end of DESIGN.md's "PTY":" to "end of the PTY:"; 33: "a write in DESIGN.md's "Auth" sense" to "a write in the auth sense"; 523: "DESIGN.md's one explicit migration" to "the one explicit migration".
- src/lib/state/workbench/selection.svelte.ts:10: "DESIGN.md, "sessions are six views, not one":" to "Sessions are six views, not one:".
- src/lib/state/workbench/layout/open/float/return-place.ts:3: "(HELP.md, Pages" to "(docs/HELP.md, Pages".
- src/lib/state/sources/search/search.svelte.ts:10: "since DESIGN.md's "Auth" puts" to "since the auth rule puts".
- src/lib/state/sources/search/search.ts:44: "module: DESIGN.md's / boundary table" to "module: the / boundary table".
- src/lib/state/client/selectors.svelte.ts:1: "The joins, as DESIGN.md's "Client state" names them:" to "The joins:".
- src/lib/state/client/writes.svelte.ts:2: "DESIGN.md's decision on live data" to "The decision on live data".
- src/lib/state/client/socket.svelte.ts:3: "development (DESIGN.md, "Hot reload", second row), so" to "development, so".
- src/lib/data/snapshot/normalise.ts:1: "The wire model of DESIGN.md:" to "The wire model:".
- src/lib/data/snapshot/validate.ts:1: "integrity gate of DESIGN.md that" to "integrity gate that".
- src/lib/data/model/machine/model-machine.ts:224: "tmux side of DESIGN.md's "PTY":" to "tmux side of the PTY:"; 229: "DESIGN.md's two agents" to "the two agents".
- src/lib/data/model/index.ts:199: "the wire (DESIGN.md, "Normalise")." to "the wire."; 211: "the socket (DESIGN.md, "The socket")." to "the socket."; 247: "to none (DESIGN.md, "Auth")." to "to none."
- src/lib/data/sources/documents/docs.ts:4: "snapshot (DESIGN.md, "Layer 1, data"):" to "snapshot:".
- src/lib/data/helpers/guards.ts:4-5: "at its reader, as DESIGN.md's "Untyped / input" says. What" to "at its reader. / What"; 14: "row of DESIGN.md's boundary table" to "row of the boundary table".
- src/lib/views/system/help/Help.svelte:18: "the HELP.md of its folder" to "the docs/HELP.md of its folder"; 20: "a file beside DESIGN.md rather than" to "a file rather than"; 23: "its path is HELP.md" to "its path is docs/HELP.md".
- src/lib/views/shared/prose/doc-link.ts:3: "`../HELP.md#the-keys`" to "`docs/HELP.md#the-keys`".
- src/lib/views/sessions/session-detail/DetailsBody.svelte:47: "DESIGN.md's explicit migration" to "the explicit migration".
- src/lib/views/boards/projects/Projects.svelte:42: "DESIGN.md's boundary table" to "the boundary table".
- src/lib/views/boards/editor/Editor.svelte:15-17: "(DESIGN.md, "Configuration": the edit form is data / ...; "Decisions taken": "Unsaved form input is instance / state"):" to "(the edit form is data / ...; unsaved form input is instance / state):".
- src/lib/views/sources/source/status/library-tab.svelte.ts:2-3: "this page (DESIGN.md, "The language / servers"), shown read-only." to "this page, / shown read-only."
- src/hooks.server.ts:50 and 79: "DESIGN.md's one "Auth" rule" to "the one auth rule".
- src/routes/+page.server.ts:53: "how DESIGN.md's "Auth" delivers it" to "how the auth rule delivers it".

## SHIPPED_SOURCES

The `docs` entry already ships the whole folder (src/lib/data/places/shipped.ts, entry 'docs'), so the 'HELP.md' entry was removed rather than changed.

## Code lines left unchanged

DESIGN.md:
- src/lib/data/places/shipped.ts:13 `'DESIGN.md',`
- tests/checks/source/history.test.ts:22 `const DOCS = ['HELP.md', 'DESIGN.md', 'README.md'];`

Axel:
- tests/server/core/changes.test.ts:367
- tests/server/edit/deck-acts.test.ts:206, 209, 212
- tests/server/edit/literature.test.ts:35, 72, 78, 171
- tests/routes/sessions/terminal-actions.test.ts:571, 575

HELP.md at the old path, in code lines (not asked to list, listed because they now disagree with the move): tests/checks/source/history.test.ts:22; tests/views/shared/prose/doc-link.test.ts:17, 30, 60, 74, 80, 122; tests/routes/docs/docs.test.ts:28, 29, 74, 157.

## Seen and not touched

- docs/templates.md:1141 `#    authors: [Axel Faes, Marc M. Van Hulle]` is left as it is. It is an author name in a sample bibliography entry (with the real title, DOI and key faes2024blockterm), the same kind of data the brief exempts in code; "the user" would make the sample's author list wrong. This is Markdown text, so item 5 read literally covers it: a ruling is needed.
- The comments of src/lib/data/places/shipped.ts:2 and src/desktop/release.ts:5 still say "the three documents"; SHIPPED_SOURCES now lists README.md and DESIGN.md as root files, and the manual ships inside docs/.
- CLAUDE.md:36 now tells an agent to justify a design choice from oculus's own goals and decisions, and with DESIGN.md gone no file in the tree states them.
- Many comments now name a rule without a source: "the auth rule", "the wire model", "the boundary table", "the processes rule", "the one explicit migration", "the decision on git writes". The text that defined them was DESIGN.md.
- The release body of v0.1.0 calls macOS's first open "right-click the app, then Open"; the README says the same.

## Commands

No test, check, lint, format, build or diagram command was run. No script was written and no file was edited by a shell command; every edit used the Edit or Write tool. No git command was run. The shell commands run were reads (cat, sed -n, grep, ls, head, tail, diff, od, wc), `gh release view` and `gh repo view` (network reads), and the two deletions `rm HELP.md` and `rm DESIGN.md`.

## Repair round 1

- README.md:7-23: new section "## What it shows" after the two opening paragraphs, one line under the heading and one bullet per rail page in the order of `rail:` in config/defaults/layout.yml (Focus, Projects, Incoming, Sessions, Explorer, Academic Life, Pillars, Registries, Literature, Present, Apps, Help, System). Each sentence was written from the views each page's arrangement holds (config/defaults/layout.yml `arrangements:`) and what docs/HELP.md's "The views" table says of those views. The README has no non-ASCII character (`grep -c '[^ -~]' README.md` gives 0). The rest of the README is unchanged.
- src/lib/data/places/shipped.ts:13: the `'DESIGN.md',` entry removed; SHIPPED_SOURCES now holds package.json, package-lock.json, .npmrc, README.md, src, config, docs, assets. Head comment line 2: "the three documents" to "the one document" (README.md is the one root document left).
- src/desktop/release.ts:5 (comment): "the three documents" to "the one document".
- tests/checks/source/history.test.ts:22: `const DOCS = ['HELP.md', 'DESIGN.md', 'README.md'];` to `const DOCS = ['HELP.md', 'README.md'];`. 'HELP.md' left as it is, so the test still names the old root path of the manual.

No test, check, lint, format, build or other code was run, no git command was run, and every edit used the Edit tool.

## Repair round 2

### 1. Tests follow the manual to docs/HELP.md

- tests/checks/source/history.test.ts:22: `'HELP.md'` to `'docs/HELP.md'`.
- tests/routes/docs/docs.test.ts:28: fixture `'hub/engine/HELP.md'` to `'hub/engine/docs/HELP.md'`; :29: the guide's link `](../HELP.md)` to `](HELP.md)`; :74: expected `manual` `'HELP.md'` to `'docs/HELP.md'`; :157: expected manual `path` `'HELP.md'` to `'docs/HELP.md'` (renderManual answers MANUAL as its path, src/lib/server/content/docs.ts).
- tests/views/shared/prose/doc-link.test.ts:17: hub manual `${engineAt}/HELP.md` to `${engineAt}/docs/HELP.md`; :30: engine manual `'HELP.md'` to `'docs/HELP.md'`; :60: href `'../tools/oculus/HELP.md'` to `'../tools/oculus/docs/HELP.md'` (from docs/AGENT-APPROACH.md it normalises to tools/oculus/docs/HELP.md, the hub doc's manual); :74: href from docs/apps.md `'../HELP.md'` to `'HELP.md'` (normalises to docs/HELP.md, the manual); :80-81: from `'HELP.md'` with href `'docs/apps.md'` to from `'docs/HELP.md'` with href `'apps.md'` (still the path docs/apps.md, same expected opening); :122-123: from `'HELP.md'` with href `'.scratch/x.md'` to from `'docs/HELP.md'` with href `'../.scratch/x.md'` (still the path .scratch/x.md, same expected null). Each expectation was worked out from docLinkOf and openingOf in src/lib/views/shared/prose/doc-link.ts; row names unchanged.

### 2. Comments over 100 columns rewrapped

Found with `git diff a2e367d6 -U0 -- src tests utils config`, its added lines filtered by length with awk (a read-only filter over the diff output; nothing was edited by it). Each paragraph was rewrapped at 100 columns with its words unchanged:
- src/lib/server/content/docs.ts:17-18 (the "A request names one of four things" paragraph; lines 9-16 already fill to 100 and are unchanged).
- src/lib/server/content/docs.ts:830-834 (the handleDocs doc comment).
- src/lib/server/core/git/run.ts:74-76.
- src/lib/server/machine/pty/sessions.ts:1-5 (now five lines, was six).
- src/lib/shell/Workbench.svelte:343-345.
- src/lib/views/system/help/Help.svelte:20-24.
After the rewrap the same filter finds no added line over 100 columns in src/, tests/ or utils/. Not rewrapped: config/defaults/behavior.yml:267, config/defaults/layout.yml:34 and config/text/views/system/help.yml:1 are `#` comment lines that were already over 100 columns at a2e367d6 (270, 1500 and 158 bytes by `git show a2e367d6:<path> | sed -n <n>p | wc -c`), written one line per paragraph like the rest of those files, so part D did not make them long.

### 3. "Axel" in example and test data to John Smith

`grep -rnw Axel src tests docs config utils README.md` now finds nothing.
- docs/templates.md:1141: `[Axel Faes, Marc M. Van Hulle]` to `[John Smith, Marc M. Van Hulle]`.
- tests/routes/sessions/terminal-actions.test.ts:571 and :575: `'Axel Faes'` to `'John Smith'`.
- tests/server/core/changes.test.ts:367: `'Axel Faes'` to `'John Smith'`; :372 and :373: key `faes2024blockterm` to `smith2024blockterm`, since citationBase in src/lib/server/edit/feeds/literature-key.ts takes the first author's last word as the surname.
- tests/server/edit/deck-acts.test.ts:206, :209, :212: `"Axel's talk"` to `"John Smith's talk"`, `title: 'Axel''s talk'` to `title: 'John Smith''s talk'`, `# Axel's talk` to `# John Smith's talk`.
- tests/server/edit/literature.test.ts:35, :72, :171: `'Axel Faes'` to `'John Smith'`; :78: `'Faes, Axel'` to `'Smith, John'`; the keys derived from those authors, :75, :78, :122, :139-141, :188-189: `faes2024blockterm`(b, c) to `smith2024blockterm`(b, c). Line 77 (`authors: ['Faes A']`, key `faes2024blockterm`) names no Axel and is unchanged.

### Seen and not touched

- tests/checks/source/history.test.ts: `documentsOf` (line 137) returns DOCS and every Markdown file under docs/, so docs/HELP.md is now read twice; its head comment (line 128) still says "the three at its root".
- docs/templates.md:1139: the sample's key `faes2024blockterm` no longer matches its first author John Smith.
- utils/migrations/convert-decks.mjs:158 holds `contact: 'axel.faes@gmail.com'` (lower case, so the `-w Axel` grep does not find it).
- "Faes" remains as a surname example in comments (src/lib/server/content/literature/sources/europe-pmc.ts:79, src/lib/server/edit/feeds/literature-key.ts:57), in docs/HELP.md:299 (`faes2024blockterm`) and in other test data (tests/state/forms/form-draft.test.ts, tests/data/snapshot/normalise.test.ts, tests/state/client/held-unsaved.test.ts).

No test, check, lint, format or build was run. The only git commands were `git diff a2e367d6` and `git show a2e367d6:<path>` inside the worktree. Every edit used the Edit tool.
