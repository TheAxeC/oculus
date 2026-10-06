# Step E2 brief check (on main at 077a0ba9)

# Brief check, step E2 of `oculus/migration`

Nothing was written, no git state changed. Main is at `077a0ba9` (`git rev-parse --short=8 HEAD`), the brief is untracked (`git status --short -- tools/oculus` prints `?? tools/oculus/.scratch/migration/agents/briefs/E2.md`). All commands ran from `/Users/axelfaes/workspace/research-hub/tools/oculus`. `config/local.yml` was excluded from every grep and never opened.

## Names

Command, per name: `grep -rnI --exclude-dir=node_modules --exclude-dir=.svelte-kit --exclude-dir=build --exclude-dir=.agents -- "<name>" . | grep -v config/local.yml`, counted per file. Hits outside the brief's two written paths (`DESIGN.md` 234-312 and `E2-report.md`):

| Name | Hits outside the written paths | Made false by the step |
|---|---|---|
| `Apps added while oculus runs` | ledger only: `plan.md`, `orchestrator-state.md`, `briefs/E1.md`, `reviews/E1-{choices,landing,refuter,report,rulings}.md` | no, the heading stays |
| `apps_dir` | ledger only (`reviews/E1-*`) | no, logs |
| `app-data`, `app-store`, `store_max_kb`, `setStore`, `apps.editing_mark`, `connect_shape`, `Keep approved` | none outside the brief and `E1-rulings.md` | no |
| `getStore` | `src/lib/server/root/vite-plugin.ts` (1) | no, an unrelated identifier |
| `onStore` | `src/lib/state/client/context.ts` (2), `selectors.svelte.ts` (2), `selection.svelte.ts` (2) | no, substring of other identifiers |
| `connects` | prose in `src` (5 files), one test, ledger files, `DESIGN.md` 2 lines outside the section | no, the English verb |
| `findings.apps`, `apps.read.`, `channel_closed`, `allow-downloads`, `x-oculus-app`, `approvals` | `DESIGN.md` inside the section only, plus ledger reviews | no |
| `app:` | `config/text/app.yml:3`, `src/lib/server/files/open.ts:48`, `tests/checks/config/config.test.ts`, `tests/checks/source/text.test.ts`, `tests/routes/files/open-*.ts`, `tests/server/root/watch/portfolio.test.ts` | no: each is the catalog group `app` or an object field `app`, not a view id |
| `/apps/` | ledger only | no |
| `open` (bridge method) | `DESIGN.md:87` and `:385` (`POST /api/open`), and inside the section at 303 the route `open` in "the other thirteen write routes ... closed to apps without exception" | see F1 |

`grep -n -i "\bapps\?\b" HELP.md README.md` gives two lines (`README.md:13`, `README.md:19`), both "the app" meaning oculus; `HELP.md` has none on the apps section. `grep -rn -i "apps_dir\|/apps/\|app:" docs` prints nothing (`docs` holds only `diagrams`). `grep -rnI "oculus/apps\|Apps added\|apps section" src tests config utils bin` prints nothing, so no head comment mentions the section. `grep -n "apps" config/layout.yml config/behavior.yml` prints nothing.

`DESIGN.md` outside 234-312 (`grep -n "apps\b\|app:\|\bapp\b" DESIGN.md | awk -F: '$1<234||$1>312'`): lines 3, 11, 87, 95, 318, 402 use "the app" for oculus itself; none speaks of the apps section and none is made false.

- **F1.** Place: "What to build" item 11 and item 13. Evidence: DESIGN.md:303 "The other thirteen write routes (`calendar`, `connect`, `mail`, `memories`, `fs`, `open`, `source`, ...) are closed to apps without exception", and DESIGN.md:385 "`POST /api/open` takes `{ path }` ... A file is opened only by `/usr/bin/open -b <bundle id>`". The bridge method is also named `open` and takes `{ file: { root, path } }`, the same shape as the closed route's body. A builder reading the section would find `open` both closed without exception and offered. Smallest change: item 11 adds "the section says the bridge method `open` never reaches `POST /api/open`, and the sentence listing the thirteen closed routes stays true".
- **F2.** Place: "What is on the tree", last bullet, and "Verify" item 3. Two citations of the section as it stands are stale, which the brief does not name: `sed -n 534p src/lib/data/model/model-sessions.ts` prints a comment line of `GitState` ("check timed out or whose git would not start..."), while `FilesPayload` is at 555 (the brief's own bullet says 555); `sed -n 387p src/lib/state/client/writes.svelte.ts` prints `): Promise<WriteAnswer> {`, while `grep -rn invalidateAll src` gives `writes.svelte.ts:420-421`. The other 23 citations were printed and say what the section claims. Smallest change: name the two in the bullet as known stale, to be corrected.

## The step line

Step line (`plan.md:374`) mapped to "What to build":

| Part of the line | Items |
|---|---|
| the section rewritten to the rulings | intro paragraph, 13, 14 |
| apps in the machine's folder and in each root's `.oculus/apps/` | 1, 2, 3, 4, 5 |
| a root app's reach | 6 (and the root halves of 7 and 11) |
| the channels | 7 |
| the store | 8 |
| outside addresses | 9 |
| downloads | 10 |
| the `open` method | 11 |
| approval while editing | 12 |
| still a proposal, nothing built | intro paragraph |

No part of the line is without an item.

`E1-rulings.md` mapped to items: line 3 (all as recommended, stays unbuilt) to the intro; C1 to 1; the five consequences of C1 to 2, 3, 4, 5, 5; N1 (a) to 6; C8 (e) to 7; C11 with N2 (c) to 8; N3 (c) to 9; N4 (b) to 10; N5 (b) to 11; N6 (b) to 12; C6 (a) and C27 (a) to "everything the rulings do not change stays". No ruling point is left out. Differences:

- **F3.** Place: item 3 against `E1-rulings.md:10`. The ruling: "the approval entry is keyed by the app's folder, so approving or revoking one app never touches another of the same name". The brief: "An approval entry is found by the app's real folder path ... Approval stays per machine and keyed by content". The file's map key stays `"<kind>:<sha256 hex>"` (DESIGN.md:305) and the hash is "over its name, its manifest bytes and ... each recorded file". Two apps with identical content (one repository cloned twice, or two worktrees of one repository, each a root) then have one hash and one map key, so one entry with one `folder`; approving one approves both by the rule "serves an app's files only while the app's hash is in the file", and revoking by folder removes the entry both rest on. The ruling's "never touches another" fails. Smallest change: item 3 states that the entry's key or the hash input carries the real folder path, and case 1 adds "with the three folders byte-identical".
- **F4.** Place: item 11, "a root app may name only its own root in `file`" and "The method needs no manifest entry". Neither is in `E1-rulings.md:19` ("a method `open` for a view id, a project, or a file shown as source text in the source tab. It never opens a page in the Document view"), and decision 4 lists only "the `open` target's three forms". Smallest change: add both to "Decisions taken in this brief".
- **F5.** Place: item 8, "an app needs no `writes:` entry for its own store". Not in `E1-rulings.md:16`. Consequence: a root app with an empty `writes:` list writes a git-tracked file into the root, and the approval panel (DESIGN.md:307 lists "the writes it may ask for") shows nothing of it. Smallest change: list it under "Decisions taken", and add to item 8 that the approval panel says where the store is written.
- **F6.** Place: items 2, 3 and 9. Wire and file shapes the brief names that the rulings do not and that the six decisions do not list: the `apps` row's new field `root`; the approvals entry field `folder` replacing `name`; `POST /api/approve` carrying the view id; the finding key `findings.apps.connect_shape`; the catalog key `apps.editing_mark`. Smallest change: add each to "Decisions taken".
- **F7.** Place: intro paragraph of "What to build", "its second paragraph now says it is ruled by Axel (2026-09-30)". `grep -c '202[0-9]-[0-9][0-9]-[0-9][0-9]' DESIGN.md` prints 0 and `grep -n "Axel" DESIGN.md` prints nothing: the file holds no date and no person. The brief's own Conventions ban history and then carve out this one date. Smallest change: "its second paragraph says the section is ruled and unbuilt", the date staying in `plan.md:565`.
- **F8.** Place: "What to build" items 13 and 14. No item says what `x-oculus-app` carries once a name no longer identifies an app. DESIGN.md:303: "the headers `x-oculus-app: <name>`" and "The change record carries the app's name". Item 8 needs the server to find the store from that header ("an app can name no store but its own"), and with `notes` in the machine's folder and in two roots the name names three stores. Smallest change: item 3 or 8 adds "the header and the change record carry the view id".
- **F9.** Place: item 13 and "What refuses an app". The findings are "keyed `apps[<folder>]`" (DESIGN.md:240 and 257). Three folders named `notes` give one key. No item names the key's new form. Smallest change: item 2 adds the finding key for a root app (for example `apps[<root key>/<folder>]`) and lists it as a decision.
- **F10.** Place: item 13's paragraph list. It omits five paragraphs the items change: "How oculus finds it while running" (item 5, the row), "The first frame", "The view and the catalogue" (263: "An app's view id is `app:<name>`"), "When an app is added, changed or removed" (item 5, item 12) and "The frame" (286: `<iframe sandbox="allow-scripts"`, item 10). Smallest change: add them, or end the list with "and any other paragraph".

## Premises

| Claim in "What is on the tree" | Command | Result |
|---|---|---|
| main at 077a0ba9 | `git rev-parse --short=8 HEAD` | `077a0ba9`, holds |
| section is lines 234 to 312, ending before `## Relationship to the cockpit` | `grep -n "^## " DESIGN.md` | `234:## Apps added while oculus runs`, `313:## Relationship to the cockpit`, holds |
| second paragraph says unbuilt proposal awaiting a ruling | line 236 read | holds |
| `grep -rn "apps_dir\|appRegistration\|AppFrame" src` prints nothing | run | nothing, exit 1, holds |
| 31 choices, C1 to C31 | `grep -c "^- C[0-9]" E1-choices.md` | `31`, C1 to C31 all present, holds |
| ten points under "Changed from the recommendation" | `E1-rulings.md` lines 7 to 20 read | 8 top-level bullets, one of which holds 5 sub-bullets; "ten" matches no count (8 top-level, 13 in all, 12 without the heading bullet). See F11 |
| a root is `{ key, dir }` at `files.ts:43` | `sed -n 43p` | `export type Root = { key: string; dir: string };`, holds |
| roots shown in Files, `fs.ts:22-27` | lines read | the lines say a workspace is saved at `~/.oculus/workspaces.json` and the hub key and configured keys are reserved; holds for that. Incomplete, see F12 |
| DESIGN.md:148 is the Processes paragraph | read | holds |
| `commands.yml` (D17), `launch.yml` (D11), `cpp.yml` (D23), `settings.yml` (D25), `project.yml` (D24) | `grep -n "\.oculus/<file>" plan.md` | lines 353, 338, 357, 362, 361, holds. "none is built": not verified (the grep over `src` did not run to its end) |
| `penpal` 8.0.1 MIT, not installed | `npm view penpal version license`; `ls node_modules/penpal` | `version = '8.0.1'`, `license = 'MIT'`; `No such file or directory`, holds |
| `files` payload at `model-sessions.ts:555` | `sed -n 555p` | `export type FilesPayload = { root: string; bookmarks?: boolean };`, holds; `GitPayload` is at 544 |
| the section cites `auth.ts:29-38`, `Document.svelte:134-141`, `writes/undo.ts:181` | grep of the section's citations | all three present and each cited line says what the section claims |
| no `docs/adr` | `ls docs/adr` | `No such file or directory` |
| `checks: 7 commands passed` | `sed -n 1,14p orchestrator-state.md` | the verify list has 7 commands, holds |
| node path | `ls ~/.nvm/versions/node/` | `v24.21.0` present |

- **F11.** Place: "What is on the tree", second bullet, "the ten points". Evidence above. Smallest change: "the points under 'Changed from the recommendation'".
- **F12.** Place: third bullet. The roots shown in Files are also the two fixed roots and a fallback: `src/routes/api/(files)/fs/+server.ts:28` builds `fixed` with `rootsFrom`, which puts `hub` and `engine` (the engine's `config/` folder, `files.ts:218-227`, `253-255`) in front; `fs.ts:229-231` adds `~/workspace` under the key `workspace` when no other root exists. So "each root shown in Files" includes the hub (`<hub>/.oculus/apps/`) and `config/.oculus/apps/` inside the oculus tree, which C1 (b) and (c) described as the rejected places. The ruling's words cover them; a builder told only "configured roots and saved roots" could leave them out. Smallest change: name the two fixed roots and the fallback in the bullet, and add a case "an app in `<hub>/.oculus/apps/`: a root app of the root `hub`".
- **F13.** Place: third bullet and decision 1's fourth case. A key made by the page cannot hold a space or `/`: `fs.ts:249-252`, `rootKey` reduces the folder name with `.replace(/[^A-Za-z0-9._-]+/g, '-')` and strips leading `-` and `.`. A folder `my repo` is filed as `my-repo`. Only `config/sources.yml` (`files.ts:153`, any non-empty string) or a hand-written `workspaces.json` (`fs.ts:163-169`) gives `my repo`, `a/b`, `-` or `@x`. The brief calls `my repo` one of "five real cases". Smallest change: say where such a key can come from, so the section's percent-encoding sentence names it.

## Cases and checks

- **F14.** Place: case 13, "the root added again: the app draws again once approved". DESIGN.md:272: a removed app "draws the app again when the folder comes back"; approval is kept in `approvals.json` by folder and content, so an unchanged app is still approved. "once approved" reads as a second approval. Smallest change: "the app draws again at once when its files are unchanged, and asks when they changed".
- **F15.** Place: cases 15 and 16 against each other. Case 16 gives the second folder of one real path `findings.apps.repeated`; case 15 (the same real folder reached as `apps_dir` and as a root's folder) gives "the machine's" and names no finding. Case 15's wording "inside a shown root" also covers `apps_dir: ~/workspace/myapps`, which is no root's `.oculus/apps/` and has no conflict. Smallest change: case 15 reads "a folder that is `apps_dir` and also some root's `.oculus/apps/`: its apps are machine apps, and the root's view of it is [a `repeated` finding or silent]", one of the two stated.
- **F16.** Place: case 16, "listed once by its real path, the second a `findings.apps.repeated`". Across roots nothing orders "first" and "second", and the view id `app:<root key>/<name>` depends on which root keeps the app; DESIGN.md:257 says of a like tie "neither wins by order". Two root keys naming one folder with no link (a configured root and a saved root of the same `dir`) is the same input and is not in the case. Smallest change: state the order (for example the order Files shows the roots) and add the two-keys-one-folder input.
- **F17.** Place: case 7 and item 9. "each once" is a rule with no refusal word: `list_repeated` is defined as "a name twice in `reads` or `writes`" (DESIGN.md:257) and the brief names only `connect_shape` for "a malformed entry". Also unplaced: `https://api.example.org/` (a trailing slash: path or not), `http://localhost:<oculus's own port>`, an entry with a user name, `wss://host`. Smallest change: case 7 adds a repeated origin with its finding, and the four forms with their outcome.
- **F18.** Place: case 1, "three approval entries". See F3: it holds only when the three contents differ.
- **F19.** Place: "Paths this step writes" against item 14. Item 14: a false sentence outside the section "is corrected and named in the report". Paths: "is reported with its line before it is changed", under "The step writes these paths and nothing else". One tells the builder to edit outside lines 234-312, the other reads as a stop. Smallest change: one sentence in both places.
- **F20.** Place: "Report", "Write it to `.scratch/migration/agents/reviews/E2-report.md`". `spec.md:33`: "You never edit anything under `tools/oculus/.scratch/`", and `spec.md:3`: "Nothing in a brief overrides anything here". `grep -l "Write it to \`.scratch/migration/agents/reviews" briefs/*.md | wc -l` prints 12, so twelve earlier briefs carry the same clash. Smallest change: a sentence in the rules file allowing the report file, or the report returned as the builder's message.

No other case contradicts the rules file, the rulings or another case. Cases 2, 3, 4, 5, 6, 8, 10, 11, 12, 14, 17 and 18 agree with the rulings and items as read.

## The question (could this pass without the goal being reached)

- The step line: yes. It is met by any rewrite that names the eight subjects. What holds it to the goal is "What it must do" and cases 17 and 18, which are readings.
- Verify 1 (`checks.sh`, 7 commands): yes. No command reads the section's meaning; it shows only that the tree still builds. Verify 2: yes, `LC_ALL=C grep -c '[^ -~]' DESIGN.md` prints 0 now and measures ASCII only. Verify 3: yes, quoting a cited line passes when the line does not say what the sentence claims, unless the reader compares (F2 shows two that already fail).
- Item 1: no, if the two names are used throughout.
- Item 2: yes. It passes with the forms written and the parse rule left out (the name is the text after the last `/`, which is what makes `app:a/b/c` unambiguous), and with "names the root" unresolved between the root key and the folder. Add both.
- Item 3: yes, by F3.
- Item 4: no.
- Item 5: yes. "follows the roots" passes without saying that a change of the current workspace changes the shown roots, and without the case in "Implied inputs" below of one key naming another folder.
- Item 6: yes. "The section says what the part is ... read from their types" leaves the builder to decide: `GitPayload` is `Record<string, GitState>` (`model-sessions.ts:544`), so the part is one entry; `files` is one notice `{ root, bookmarks? }`, and the bookmarks watcher publishes `{ root: '', bookmarks: true }` (`watch/bookmarks.ts:66`), which belongs to no root. Whether a root app gets that notice, what `read('files')` answers when the newest notice named another root, and whether `onChannel` is called for a change in another root are all open. **F21**: item 6 states these three outcomes, and a case is added for each.
- Item 7: no.
- Item 8: yes. It passes with no mechanism for "a change by one tab reaches the others" (tabs in a popped-out window are another document; DESIGN.md:286), and see F5, F8. **F22**: item 8 names how the change reaches a tab in another window (a channel, or the `apps` push).
- Item 9: yes, by F17.
- Item 10: yes. "what a download is for" passes without saying whether a download link to an outside address sends a request. The page's `frame-src 'self'` is said to stop a navigation of the frame (DESIGN.md:286); whether it stops a navigation that ends as a download is not verified here. For an app with no `connects:` that would be an exit the reader did not see. **F23**: item 10 adds that the section claims nothing for it and the build step measures it in Chrome, as C29 (b) does for WebRTC.
- Item 11: yes. `{ view: <view id> }` "opens a registered view", and `document` and `terminal` are registered view ids (`grep -rhn "id: '[a-z-]*'" src/lib/views` prints `id: 'document'`, `id: 'terminal'`, `id: 'project'`, `id: 'file'`, `id: 'source'`), beside "It never opens the Document view". Unlisted views (`registry.ts:87-91`) "opened bare ... can only report that it was opened for nothing". **F24**: item 11 says which view ids `view` admits (the listed ones, the Document view and the terminal refused `closed`), with a case.
- Item 12: yes. It passes without saying what a change to `app.yml` does while the control holds: a machine app kept approved whose manifest gains `inbox` or a new `connects:` origin. The ruling's words are "while its files change" and the manifest is a file; the reader then never saw the new channel or origin. **F25**: add a case with the outcome stated.
- Item 13: yes, by F10 (case 18 is what would catch a leftover).
- Item 14: no.
- Cases 1 (F18), 13 (F14), 15, 16 (F15, F16), 7 (F17): yes, as found. Case 9, "the browser downloads it": a reading of the section cannot show browser behaviour; it passes on the sentence alone. Cases 2, 3, 4, 5, 6, 8, 10, 11, 12, 14: no, each names an outcome the section must state. Cases 17 and 18: no, provided the before and after are read paragraph by paragraph as written.

## Decisions taken in this brief

1. View id and address. The rulings settle that both carry the root (`E1-rulings.md:9`) and leave the form open. No contradiction found: DESIGN.md:199 gives `ViewId` as a union of bare words and 263 says built-in ids and collection keys are bare words, so `app:` with `/` meets neither; `/apps/` is outside `/api/`. The five cases and the asked variants, checked by reading the forms: a root key holding `/` (`a/b`, app `c`) gives `app:a/b/c`, unambiguous only by splitting at the last `/` (the name pattern has none), a rule the brief does not state (see item 2 above); in the address it is `@a%2Fb`, one segment. A root key starting with `@` gives `/apps/@@x/...`, no collision. A root key equal to `-` gives `/apps/@-/...`, distinct from the shared `/apps/-/`. A machine app named like a root key (`cathedra`) gives `app:cathedra`, distinct from `app:cathedra/notes`. A root key holding `:` leaves the HMAC input readable since the hash is the last field. No collision found. Open: the view id holds the root key, and a key can name another folder after a workspace switch (see "Implied inputs").
2. Store names. The rulings settle the file places, the write kind's existence and the cap's place; they leave `getStore`, `setStore`, `onStore`, `app-store`, `store_max_kb` and 256 open. `app-data` is the ruling's own word. `store_max_kb` fits the file: `grep -n "_kb" config/behavior.yml` prints `paint_limit_kb: 64`, and the section's `state_max_kb`. No contradiction; `app-store` makes a twentieth kind beside the section's "14 open, 5 closed", which item 13 covers under "How it writes".
3. `connects:` entry form. Left open by the rulings. No contradiction; incomplete by F17.
4. `open` target forms. Left open by the rulings. Contradiction inside the brief by F24, name clash by F1, and two unlisted shapes by F4.
5. "machine app" and "root app". Settled by the rulings (`E1-rulings.md:7`); not a decision of the brief.
6. "Keep approved while I edit". The rulings settle the offer, its end at restart and that a root app never gets it; they leave the control's words, the strip mark and "ended by Revoke" open. It departs from DESIGN.md:305 "keyed by the app's content, so a changed app asks again" and from "by the processes rule" in the same sentence; both are inside the section and item 13 lists "Approval". DESIGN.md:148 is about processes and stays true. The control's words are given as a literal and no catalog key is named for them, while `apps.editing_mark` is named; add the key to item 12 and to "Words".

## Implied inputs

Inputs the rulings imply that no case and no item covers:

- **F26.** The store read when the file is absent, does not parse, or is larger than `store_max_kb` (a root app's store arrives by `git pull`): what `getStore` answers.
- **F27.** The store changed from outside the app: by History's undo, by a pull, by hand. Whether `onStore` is called.
- **F28.** `setStore` and the rate limit `apps.writes_per_min` (30): whether a store write counts. An app saving on each change meets `rate`.
- **F29.** `app-store` written in a manifest's `writes:`: accepted, `write_unknown` or `write_closed`.
- **F30.** The change record of a store write: DESIGN.md:140 records "the value the file held and the value written", so one write of a 256 KB store is a line of up to 512 KB in `changes.jsonl`. The section should say what the record holds.
- **F31.** A root app's folder that is a link resolving outside its root. `fs.ts:18-20`: a link "pointing out of the root it is left out" of a listing; the section's rule for the machine's folder follows a link once. Which holds for a root.
- **F32.** One root key naming another folder after the current workspace changes (keys are per workspace, `fs.ts:54`): the tab `app:<key>/notes` then draws another app with the first app's per-tab value.
- **F33.** Two apps of one title (three `notes` titled alike): what the catalogue, the tab and the approval panel draw to tell a root app from a machine app and one root from another.
- **F34.** `open({ file })` naming a file that does not exist, a binary, or a file that opens in a program (`.docx`, DESIGN.md:385): the word it rejects with, and that it never starts the program.
- **F35.** `open` called many times a second: no limit is named, and the limits list has none for it.
- **F36.** A root that cannot be written (read-only, or `.oculus/` absent): what `setStore` rejects with, and whether `.oculus/app-data/` is created.

Smallest change for each: one case with the outcome stated, or the outcome raised to Axel where the rulings do not give it (F31, F32 and F25 are behaviours, not wording).

## ADRs

`ls docs/adr` prints `ls: docs/adr: No such file or directory`; `ls docs` prints `diagrams`. `tools/oculus` has no ADR folder, as the brief's first paragraph says.

## Declined to judge

- Whether SvelteKit's router keeps `%2F` inside one segment for `/apps/@<root key>/...`: read from memory of Kit's decoding, not run; no server was started.
- Whether a view id holding a space or `/` is safe in every place the shell carries one (`data-pane-view`, saved layout, popped-out windows): only `PaneView.svelte:418` and `TabView.svelte:34` were seen; not traced.
- Whether a download from an opaque frame to an outside address is stopped by the page's `frame-src`: needs Chrome, not run (F23).
- "none is built" for the five `.oculus/` files: the grep over `src` did not complete.
- Whether each of the 23 current citations is the best line for its sentence: each was printed and matches in substance; `views/sources/files/opening.ts:59-66` shows the start of `openBookmark` only.
- The options of N1 to N6: `grep -rn "N[1-6] (" plan.md orchestrator-state.md` finds them only as rulings (`orchestrator-state.md:128`), and `E1-choices.md` holds C1 to C31 only, so what the rejected N options were could not be read.

Usage: claude-opus-5-5, 171,296 tokens, 28 tool uses, 501,474 ms (from the completion notice).

## Closed

Each by a change to `agents/briefs/E2.md`, before the preparation commit.

- F1, F24, F34, F35: item 18 and case 20 (the method against `POST /api/open`, the view ids admitted, a missing file, a program never started, the limit).
- F2: the stale citations named under "What is on the tree".
- F3, F18: item 16 and case 1 (the folder path in the hash; three byte-identical folders).
- F4, F5, F6: decisions 7 to 12.
- F7: the second paragraph carries no date and no name.
- F8, F9: item 17 and decision 8.
- F10: item 27.
- F11: the count dropped.
- F12: the fixed roots and the fallback named; item 15, case 19, decision 13.
- F13: where a key with other characters comes from.
- F14: case 13 reworded.
- F15, F16, F31: item 24, cases 15, 16 and 26, decision 14.
- F17: item 20 and case 22.
- F19: one sentence in both places.
- F20: not changed. The builder's report at `agents/reviews/<step>-report.md` in the worktree's copy of the ledger is what `plan-orchestration` Steps 4 ("The builder") requires and what twelve earlier briefs carry; the rules file's sentence is about the plan, the state file and the briefs. The wording of `spec.md:33` is left as it is.
- F21: item 22 and case 24, decision 17.
- F22, F26, F27, F28, F29, F30, F36: item 19 and case 21, decision 9.
- F23: item 21.
- F25: item 23 and case 23, decision 12.
- F32: item 25 and case 25, decision 15.
- F33: item 26 and case 27, decision 16.

The shapes and behaviours the rulings do not give (decisions 1 to 17) are taken in the brief because the section stays an unbuilt proposal; the builder's report lists them under "Shapes named in this step" and Axel rules on them at the landing, before any build step is booked.
