# Brief: E4g, the apps guide: `tools/oculus/docs/apps.md`, from which Axel builds an oculus app with no outside help

Size: a full step

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. Then, in full, the files this brief names under "Read, with sections or line ranges". No ADR touches the step: `ls tools/oculus/docs/adr` fails and `.agents/plan.yaml` has no `adr:` key (`grep -n 'adr' .agents/plan.yaml` prints nothing).

The worktree is `.agents/worktrees/E4g`, created at the base when the step is dispatched. The base copy is `.agents/worktrees/E4g-base/tools/oculus/`, unpacked by the orchestrator with `git archive <base> tools/oculus/src tools/oculus/tests tools/oculus/utils tools/oculus/config tools/oculus/docs tools/oculus/HELP.md tools/oculus/DESIGN.md ':!tools/oculus/config/local.yml'`. Read a file as it was there; run no git command.

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

## The plan line and the ruling it names

`plan.md` (`grep -n "^- E4g" plan.md` printed 641): "E4g the apps guide: `tools/oculus/docs/apps.md`, a guide Axel reads to build an oculus app with no outside help, from an empty folder to an approved app that reads channels, keeps a store, writes and opens things, with every manifest key, every method, every refusal word, where the files go, how approval and a change of a file work, and a worked example he can copy and run (ruling Z633)".

Z633, Axel's words: "We also need a docs/ md that decribes exactly how to use and build apps. Kind of like how a README would work. Something, I can read, and use as a guide, to build apps. Without needing outside help."

## What is on the tree (read on main at 10ac00c69)

- `tools/oculus/docs/` holds only `diagrams/` (`ls tools/oculus/docs`), so `apps.md` is a new file and the folder's first Markdown page.
- E4 landed the apps at 10ac00c69 (`git log --oneline -1`).
- DESIGN.md's section "Apps added while oculus runs" starts at line 252 and runs 91 lines, to 342, with `## Relationship to the cockpit` at 343 (`grep -n '^## Apps added' DESIGN.md`). It is the design record and the source of truth for behaviour.
- HELP.md's section "## Apps" is lines 210 to 221, with "## Source Control" at 222 (`grep -n "^## Apps$\|^## Source Control" HELP.md`).
- The manifest keys are `name`, `title`, `description`, `glyph`, `bridge`, `entry`, `reads`, `writes` and `connects` (`KEYS` in `src/lib/server/machine/apps/manifest.ts`). `bridge` takes only `1` (`BRIDGE`). The title is at most 40 characters (`TITLE_MAX`) and the description at most 200 (`DESCRIPTION_MAX`). The entry defaults to `index.html` (`DEFAULT_ENTRY`). The glyph defaults to `app_view`, and `app` is reserved.
- The page exposes nine methods to a frame: `read`, `getTheme`, `getState`, `setState`, `getStore`, `setStore`, `write`, `open` and `key` (`src/lib/state/system/apps/methods.ts`). The app exposes `onChannel`, `onTheme` and `onStore` (`src/lib/server/machine/apps/oculus.js`).
- An app connects with `import { connect } from '/apps/-/oculus.js'` (head comment of `oculus.js`).
- The refusal words are in `REFUSED` in `src/lib/state/system/apps/rules.ts`: `not_declared`, `closed`, `too_large`, `rate`, `declined` and `missing`. Two more forms come from `refusedWith` (`refused:<reason>`) and `failedWith` in the same file, and `setState`/`setStore` reject a value that is not plain JSON with the word `not_json`, the catalog entry `apps.refused_not_json` (`config/text/views/apps/apps.yml:65`).
- The limits are the `apps:` block of `config/behavior.yml`, from line 202 (`grep -n "^apps:" config/behavior.yml`). The Settings view shows nine keys under its Apps heading: connect_timeout_s, state_max_kb, store_max_kb, writes_per_min, opens_per_min, keys_per_s, max_files, max_mb and closed_paths. E4's landing look read these nine on TEST.
- Hub documents enter the view catalogue through the `docs:` list of `config/layout.yml`, lines 176 to 180. Each entry is `{ label, path, group }`, with `path` relative to the research hub (`sed -n 170,180p config/layout.yml`), and `src/lib/server/content/docs.ts` reads such a path inside the hub.
- A machine app's folder is `apps_dir` of `config/local.yml`, and `~/.oculus/apps` only when that key is absent (`src/lib/server/root/watch/apps.ts:92-97`, `config/catalogs/options.yml:1352-1354`, `HELP.md:212`). The approvals file moves with the `approvals` key (DESIGN.md, "Approval").
- An app's page runs under `script-src <base> <shared>` with no `'unsafe-inline'` (`src/lib/server/machine/apps/address.ts:93`), so an inline `<script>` or an `onclick=` attribute never runs. Only the extensions in `TYPED` are served with a type (`address.ts:31-45`). The frame's sandbox flags are `allow-scripts allow-downloads` (`address.ts:27`): no `alert` or `confirm`, no `localStorage`, no forms and no popups. The `connects` origins are in `connect-src` (`address.ts:98`, `HELP.md:214` and `:218`), and DESIGN.md's "What an app does not get" names what no policy stops.
- A write's body is posted unchanged by the page (`sendFromApp` in the writes store) and must carry its own `kind`, equal to the kind named: `src/lib/server/edit/writes/app-gate.ts:4-12` refuses 403 `{ error: 'kind' }` otherwise, which the app sees as `refused:kind` (`methods.ts:183-185`). The bodies are typed in `src/lib/server/edit/writes/bodies.ts:17-104`, for example `DeleteEntryWrite = { kind: 'delete-entry'; collection: string; id: string }`. The kinds open to apps are `OPEN_WRITES` in `src/lib/data/helpers/files/apps.ts`, fifteen of them, and `CONFIRMED_WRITES` asks first for five: `delete-entry`, `feed-delete`, `new-idea`, `linkedin-idea` and `linkedin-post`. `new-idea` (`writes/manifest.ts:482`), and the feed writes at `src/lib/server/edit/feeds.ts:270` and `:323`, record `undo: 'none'`, so History offers no Undo for them.
- Refusals reach an app from more places than `methods.ts`: `getStore` rejects with what `store-cache.ts` gives (`missing`, `failed:<status>`), `setStore` and `write` with the server's reason, `app-store.ts:51-53` answers `{ error: 'unwritable' }`, `key` drops a call it refuses (`methods.ts:336`), and `read` resolves `null` when nothing is held. `open({ file })` is checked again on the server (`src/lib/server/machine/apps/open.ts:1-13`): a link out of the root, a link into a dot folder and oculus's config folder answer `closed`.
- The channel payloads are typed in `src/lib/data/model/` (`ConfigPayload` in `index.ts`, `GitState` in `model-sessions.ts`, and the others DESIGN.md's channel table names).
- The Help group of the view catalogue holds the manual, the Memories wall and four hub documents. Two places count them as `h1-h6`: `HELP.md:82` and `config/text/app.yml:12`. The Help page's arrangement is `help:` in `config/layout.yml:92-98`, whose pane at `:98` holds the manual, the HPC how-to, Data map, Research approach, Agent approach and the Memories wall. `HELP.md:21` lists those tabs, and `DESIGN.md:83` says the Help group "holds the manual, the Memories wall and the hub's documents, which the Help page's arrangement draws". DESIGN.md's file tree (`:79-80`) lists `docs/diagrams/` as the only entry of `docs/`.
- `docs/glossary.md` does not exist in the repository or in `tools/oculus` (`ls`), so the report has no terms section.

## What to build

1. **`tools/oculus/docs/apps.md`, the guide.** It is written for one reader: Axel, opening it cold, building his first app with nothing else open. Every fact in it is read from the code and from DESIGN.md's section on main. Nothing is taken from memory, from this brief's summary or from E4's brief. Where the code and DESIGN.md disagree, the code wins, and the report names the disagreement under "Anything in the brief that was wrong or impossible". The guide holds these parts, in an order that reads as a manual:
   1. What an app is and what it can do, in a few sentences: a folder of web files that oculus draws in a sandboxed tab, with no build and no restart.
   2. Where the files go. A machine app lives in `<apps_dir>/<name>/`, where `apps_dir` is the key of `config/local.yml` and `~/.oculus/apps` is used when the key is absent. A root app lives in `<root>/.oculus/apps/<name>/`, in a folder of the Files view's roots, and travels with that repository. Say which one to choose when, the folder layout with `app.yml` and the entry page, the file and size limits, that a dot file and a link are neither recorded nor served (`record.ts`), and that the approval hash covers the folder's real path, so a moved folder asks again.
   3. A quick start: the smallest app that runs, from an empty folder, as a sequence of steps to follow: make the folder, write `app.yml`, write `index.html`, find it in the catalogue's Apps group, approve it, see it run. The quick start writes `index.html` before `app.yml`, and says that a script goes in its own file, since the page runs no inline script.
   4. The manifest: every key of `KEYS`, each with whether it is required, its type, its default, its limits and what a wrong value does (the finding it raises and whether the app is still offered). Include the name rule and the glyph rule.
   5. Approval and change: what the approval panel shows, what Approve approves (the hash of the app's files), what happens when a file changes (the panel again with its warning, the tab's state kept), Keep approved while I edit for a machine app and what it does not cover (`app.yml`), that Keep approved ends when the oculus server process ends, Revoke and the lock in the tab bar, and how a root app differs.
   6. The bridge: `connect` and its handlers, then every method of the nine, each with its signature, what it returns, every refusal it can give and when (from `methods.ts`, `store-cache.ts`, `app-gate.ts`, `app-store.ts` and `open.ts`, whichever gives it), and a short code example. The channels an app may read, how `reads` gates them, and for each channel the shape of its payload as the types in `src/lib/data/model/` give it: the fields an app uses, each with its type. The write kinds an app may declare and how `writes` gates them, and for each kind the body it takes as `bodies.ts` types it, with the rule that the body carries its own `kind` equal to the kind named. Which kinds ask the reader first, how a write shows in History, which kinds History can undo and which record no Undo. The store (`getStore`, `setStore`, `onStore`, where its file lives for each kind of app, its size limit) against the tab state (`getState`, `setState`, its limit). `open` with each of its four target shapes and their rules: a view, a project, a file of a root (closed paths and dot paths refused, the root rule for a root app) and an address (the Confirm). Theme and keys: what `onTheme` paints, the `color-scheme` the frame gets, and which key presses are forwarded to oculus's chords.
   7. Every refusal word in one table, each with what causes it and what to do about it.
   8. The limits: each of the nine keys of the `apps:` block with its default and what it limits, and that the Settings view's Apps heading edits them.
   9. What an app cannot do, stated once and as the code has it: no files, no cookies, no write token, no inline script, no `alert` or `confirm`, no `localStorage`, no forms and no popups; its network is the `connects` origins in `connect-src` and the addresses it opens through `open`, with what DESIGN.md says no policy stops; the closed channels and the closed paths; and the file types served.
   10. A worked example Axel can copy and run: one complete machine app, every file given whole in a fenced block with its path above it. It reads one channel, keeps a store and shows it, makes a `new-entry` write and then a `delete-entry` write of that same entry, which asks first, opens a view and an address, and shows each refusal it meets on the page. The guide tells the reader to press Cancel on the first delete and see `declined`, then delete again and confirm, so the run leaves the hub's data as it found it (Decision 3). Its script is in its own file. The text says where each file goes, what to press, and what he should see at each press.
   11. When something goes wrong: where a refused manifest shows (the Findings view, with the finding's words), what an app that fails to connect looks like, and how to read a refusal in the browser console.
2. **`tools/oculus/HELP.md`, the Apps section (lines 210 to 221).** One sentence at the end of the section says that `docs/apps.md` is the guide to building an app, step by step, with a worked example, and that it opens in oculus as Apps guide on the Help page and in the view catalogue's Help group.
3. **`tools/oculus/config/layout.yml`, the `docs:` list (lines 176 to 180).** One entry after the Data map line: `- { label: "Apps guide",        path: tools/oculus/docs/apps.md, group: help }`, aligned as the other entries are. The guide then opens from the view catalogue's Help group as the doc view, as the other hub documents do (Decision 1).
4. **`tools/oculus/config/layout.yml`, the Help page (line 98).** The pane gains the guide as a doc tab after Agent approach and before the Memories wall: `{ view: doc, state: { id: tools/oculus/docs/apps.md, path: tools/oculus/docs/apps.md, label: "Apps guide" } }`.
5. **The lines the new entry makes false.** `HELP.md:21` names Apps guide among the Help page's tabs. `HELP.md:82` and the matching row in `config/text/app.yml:12` give the Help group's chords as the count the code gives for seven entries, read from the code that numbers a group's chords, never from this brief. `DESIGN.md:79-80`'s file tree gains `docs/apps.md` under `docs/`, described in the tree's own words.

## Cases

Each case is checked by reading, except the example's reading by `scanApps` (case 9), its run in a scratch oculus (case 13) and the catalogue entry (case 10), which are runs the report quotes. Cases 13 and 14 hold only after the change; their first run notes what the unchanged tree has.

1. Every key of `KEYS` appears in the guide's manifest part with its required/optional state, default and limit, and each limit matches the constant in `manifest.ts` (TITLE_MAX 40, DESCRIPTION_MAX 200, the entry default `index.html`, `bridge: 1`).
2. Every one of the nine methods in `methods.ts` and the three handlers in `oculus.js` has its own entry in the bridge part, with every refusal it can give, read from `methods.ts`, `store-cache.ts`, `app-gate.ts` and `app-store.ts`, and `key` and `read` described as dropping or resolving `null` where they do.
3. Every value of `REFUSED`, the `refused:<reason>` form with each reason the server can give (`kind` among them), the `failed:<status>` form and the word `not_json` appear in the refusal table, each with a cause that matches the code.
4. The nine keys of the `apps:` block of `config/behavior.yml` appear in the limits part with the defaults the file holds.
5. Where the files go: both kinds of app, with the folder paths as `scan.ts` and `watch/apps.ts` find them, `apps_dir` and its default among them, and the store's file for each kind as `store.ts` writes it.
6. Approval: the guide says what DESIGN.md's section and `apps.svelte.ts` do on a changed file, under Keep approved, on an `app.yml` change, and on Revoke, and that a root app has no Keep approved.
7. `open`: each of the four target shapes with its rules, matching `open` in `methods.ts` and `src/lib/server/machine/apps/open.ts` line by line (the server's link and config-folder rules among them, the sole-key shape, the closed paths, the dot paths, `engine` refused, the root rule, the Confirm for an address, the 2048-character limit, no user name or password in the address).
8. The writes: the declared kinds an app may name (`writeAccess` in `data/helpers/files/apps.ts`), each with its body as `bodies.ts` types it, the `kind` rule of `app-gate.ts`, the kinds that ask first (`CONFIRMED_WRITES`), the History row, and the kinds that record no Undo.
9. The worked example is complete and valid. Its files, copied under the session scratchpad and never under `~/.oculus`, are read by `scanApps` (`src/lib/server/machine/apps/scan.ts:92`) with `machine` set to that folder and `roots: []`, in a `node` run of a `.ts` script in the scratchpad (Node 24 strips the types; `npx tsx` is not installed and is not fetched), so the walk, the manifest, the hash and the store read run as oculus runs them. The run gives no finding, and the report quotes it. Every method it calls exists with the arguments it passes. Every channel it reads and every kind it writes is one an app may name, and each write body passes its kind's parser in `bodies.ts`. Every view it opens is listed. No script is inline, no `alert` or `confirm` is called, and every file it ships has an extension in `TYPED`. The run leaves no file outside the scratchpad.
10. The catalogue entry: `config/layout.yml` still parses and the config checks pass, as the run of `npm run test:quick` quotes. The entry names `tools/oculus/docs/apps.md`, which exists.
11. Must refuse: no sentence in the guide states a behaviour that the code does not have. The reviewer reads each claim against its code.
12. Must refuse: no history in the guide (no step names, rulings or dates, and none of the words `agents/spec.md` lists for comments: "before", "used to", "no longer", "still", "always has been", "always had", "as before", "previously"), no em dash, no non-ASCII, no hard wrap. The report quotes the grep of those words over the guide with each hit judged.
13. The worked example runs. In a scratch oculus as E4's brief set one up (`agents/briefs/E4.md`, item 14, the first bullet: `npm run build`, then `node src/server.ts --engine <scratch>/engine` on port 8797 with `HOME`, `TMUX_TMPDIR` and every machine-local key of the scratch `local.yml` under the scratchpad, `apps_dir` among them), with `hub` a scratch folder holding the collection the example writes to and never Axel's hub, the builder opens the page in headless Chrome with a fresh profile, approves the app through `POST /api/approve` as E4's brief did, and runs the example's steps in the guide's order. The report quotes what the page showed at each step (the app's own page text, the store file, the change log lines in the scratch `changes.jsonl`), that the delete's Cancel gives `declined` where the run can press it, and `lsof -nP -iTCP:8797 -sTCP:LISTEN` printing nothing after the server is stopped. A step the headless run cannot press (a Confirm) is named, and the look on TEST at landing presses it.
14. The Help page: `config/layout.yml` line 98's pane holds the Apps guide tab, and `HELP.md:21`, `:82`, `config/text/app.yml:12` and `DESIGN.md:79-80` are true of the tree after the change.

The builder's first task, before any change, is the first run of every case above on the unchanged tree, with each case's result noted.

- A case of a code step (a script, or a product's code) becomes a test of the step only when the rules file's test rule calls for a test of it.
- A case kept as a test is run on the unchanged tree first.
- No prototype script stands in for such a test.
- Every other case of a code step is checked by a run the report quotes, and no test is kept for it.
- A case of a text or judgment step is checked by reading the unchanged tree.
- The first read of a text or judgment case is noted.

This step keeps no test: it changes no code, and `agents/guarded.md` names no entry for a document.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code, and hands back the first run and that case, with the rule and the result it gives. The orchestrator rules on the case and resumes the builder with the ruling, and the final report carries it.

## Paths this step writes

- `tools/oculus/docs/apps.md`
- `tools/oculus/HELP.md` lines 210-221
- `tools/oculus/HELP.md` line 21
- `tools/oculus/HELP.md` line 82
- `tools/oculus/config/layout.yml` line 98
- `tools/oculus/config/layout.yml` lines 176-180
- `tools/oculus/config/text/app.yml` line 12
- `tools/oculus/DESIGN.md` lines 79-80
- `tools/oculus/.scratch/migration/agents/reviews/E4g-report.md`

One path per line: a whole file, or a range of lines of a shared document, numbered as on main at the base. The step writes these paths and nothing else.

## Decisions taken in this brief (each reversible, none silent)

1. The guide opens inside oculus as the other hub guides do: an entry in the view catalogue's Help group (`config/layout.yml`'s `docs:` list, label "Apps guide") and a tab on the Help page's arrangement, with the lines that count or list them made true. The options were (a) the catalogue entry and the Help page tab, chosen, since a hub document on the Help page is how every other guide is reached and DESIGN.md:83 says the group's documents are what the arrangement draws; (b) the catalogue entry only, which costs less and leaves the Help page without the guide and DESIGN.md:83 false, the lazy option; (c) no entry, the guide read only as a file, which leaves Axel to find it outside oculus. Taking the entry and the tab out reverses it.
2. The guide lives at `tools/oculus/docs/apps.md`, the path the step line names, in the folder Z633 names.
3. The worked example is a machine app, since a machine app has Keep approved while I edit and needs no repository. The guide states the one change that makes it a root app. Its write is a `new-entry` and a `delete-entry` of that same entry: the delete asks first, as Z633's "writes" needs a kind that shows the Confirm, and the pair leaves the hub's data as it was. `new-idea`, `linkedin-idea` and `linkedin-post` were not chosen because they record no Undo, and a delete of an existing entry would remove real data.

## Libraries checked

None found: the step writes a document and one catalogue entry, and builds no capability a library could provide. The builder adds no dependency.

The builder adds no dependency this brief does not name. A library the builder finds that would cover its work is reported, not installed.

## Read, with sections or line ranges

1. `tools/oculus/DESIGN.md`, the section "Apps added while oculus runs" (from line 252, 92 lines): the design the guide explains.
2. `tools/oculus/HELP.md` lines 210-221: the reader's summary, which the guide expands and must not contradict.
3. `src/lib/server/machine/apps/` whole (`manifest.ts`, `scan.ts`, `store.ts`, `serve.ts`, `routes.ts`, `open.ts`, `address.ts`, `held.ts`, `record.ts`, `oculus.js`): the files, the manifest, the store and the bridge's app side.
4. `src/lib/state/system/apps/` whole (`methods.ts`, `rules.ts`, `limits.ts`, `words.ts`, `bridge.ts`, `apps.svelte.ts`, `instance.ts`, `store-cache.ts`): the methods, the refusals and approval.
5. `src/lib/data/helpers/files/apps.ts` whole: the name rule, the channels, the write kinds, `CONFIRMED_WRITES`, the path rules.
6. `config/behavior.yml` from line 202, the `apps:` block, and `config/text/views/apps/apps.yml`: the limits and the words the reader sees (panel sentences, notices, findings).
7. `config/text/findings.yml`, the apps findings: the words a refused manifest shows.
8. `src/lib/server/edit/writes/bodies.ts`, `app-gate.ts` and `app-store.ts`, `src/routes/api/(apps)/app-store/+server.ts`, and `src/lib/server/root/watch/apps.ts`: the write bodies, the kind rule, the store's answers and the machine folder.
9. `src/lib/data/model/index.ts` and `model-sessions.ts`, for the payload of each channel an app may read.
10. `src/lib/server/content/docs.ts`: how a relative link in a hub document resolves (against the hub root), so every link the guide holds opens in the doc view.
11. `agents/briefs/E4.md` item 14, the first two bullets: the scratch oculus and how an app is approved in it.

## What it must do

As "What to build" says, part by part. Every count, path, name and claim in the guide is checked on the tree before it is written, and the report gives, for each part of the guide, the files and functions it was read from.

## Conventions

- The hub `CLAUDE.md`'s "Writing docs" section governs the guide whole: one line per paragraph and per bullet, no hard wrap, ASCII only, no em or en dash and no spaced hyphen standing for one, no history, no chatbot framing, no synonym cycling, no forced groups of three, and Ward voice (the so-what first, short plain sentences, bold only on real labels).
- Code blocks carry a language tag (`yaml`, `html`, `js`). The example's files are given whole, never with "..." or elided parts.
- Each name is spelled as the code spells it: method names, keys, refusal words, file names.
- Headings name what the part holds, plainly.

## Verify before you report

Run from `tools/oculus` in the worktree, each must hold, each output piped through the filter the rules file names:

1. `npm run test:quick` passes. It covers the ASCII gate and the config checks over `config/layout.yml`. The report quotes the lines it prints. The plan's whole verify list runs once, at landing on main.
2. `LC_ALL=C grep -n '[^ -~]' docs/apps.md` prints nothing.
3. `grep -n -- ' - \| -- \|\.\.\.' docs/apps.md` prints no line of prose. A hit inside a code block is named and kept only when it is code.
4. The runs of cases 9 and 13 are quoted whole, with their commands.
5. Each new or changed list item and sentence is read against the standards pages' rules on list items and sentence length, and each place it departs from them is named in the report with why it needs its form.

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/E4g-report.md`, with these parts in this order.

- The first line: anything NOT done, or "Everything in the brief is done".
- The open items of the state file, verbatim, which hold only what the user must rule on.
- The cases' first run: every case of "Cases" by its name, none left out, each with the command or the reading that checked it and its output as printed, and each case the brief's rules got wrong with the rule, the result and the orchestrator's ruling.
- The DONE / NOT DONE table with the checks above and their output as printed, the character-set check's line and its exit status included, over the files the step changes.
  - A line shortened with "..." is not verbatim.
- For each part of the guide, the files and functions it was read from.
- The files with line counts.
- Every judgment call the brief left open.
- Every host- or user-visible change with its before and after.
- Anything in the brief that was wrong or impossible, with the evidence, and every place the code and DESIGN.md disagree.
