# Step D55 brief check (on main at 652f5104a)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/D55.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

The head checked: `git rev-parse HEAD` printed `652f5104a8559f843354360ab5da2392dcf3ab53`. `plan.md` has no Goal section: `grep -n -i "goal" plan.md` hits only line 320 (Q77d) and line 786, and `grep -n "^## " plan.md` lists only "Packages, in execution order", "Could run in parallel", "Rulings (2026-09-10)", "Agents" and "Blocked, and by what". The goal used below is the one the task states: a second hub built with its own settings and merged with ids that never collide, writes going to the record's own hub, the chip, every hub's secrets private, and the subtasks undo fixed.

## 1. Names

Write list = the brief's "Paths this step writes" (`files.ts`, `server/root/watch/`, `server/root/context.ts`, `data/index.ts`, `data/model/`, `data/snapshot/`, `data/sources/`, `private-folders.ts` and its six callers, `server/edit/`, `server/core/changes.ts`, `server/content/audit/`, `server/content/docs.ts`, `server/sessions/`, `state/`, `views/`, `shell/`, `config/text/`, `HELP.md` and `DESIGN.md` (appended text only), `docs/DATA-MAP.md` (an appended section only), `tests/`, `docs/diagrams/`, the report).

- **`hub` key on a `roots:` entry.** `git grep -n "hub: true\|hub: false" -- ':!tools/oculus/.scratch' ':!tools/oculus/config/local.yml'` gives `tests/server/edit/config-key.test.ts:89,112,135`. These are a different field (the config-key writer's layer flag, `hub: false` beside `key: 'changes.keep'`), so the change does not make them false. `git grep -n "rootEntryShape\|rootShape\b"` outside `files.ts` gives `src/lib/server/files/fs.ts:235` (`rootShape.safeParse` of a named workspace's roots) and `docs/diagrams/writes.dot:104` / `writes.svg:1219` (regenerated). Neither is false as long as only `rootEntryShape` takes `hub`. The roots writer is inside the write list but the brief never names it: `src/lib/server/edit/writes/config/roots.ts:76` (`RootItem = { key: string; dir: string }`), `:82` (`itemShape = z.object({ key, dir })`), `:89` and `:188` (renders `{ key: ..., dir: ... }`). Add Folder, Remove Folder and the root reorder (G57) rewrite `roots:` through this shape, so with a hub root in the list they may drop `hub: true` or be refused by the read-back compare. Not verified by a run.
- **The id form `<root key>:<id>`.** `git grep -n "startsWith('side:')\|startsWith('root:')\|'side:'\|'root:'\|split(':')\|indexOf(':')" -- src` gives 12 hits, none of which parses an entity id (`feeds.ts:146` a feed line, `hpc/parse.ts:27` a clock, `Lanes.svelte:141` a choice string, and so on). No code is made false. Docs made incomplete: `tools/oculus/DESIGN.md:557` ("Side projects are read into `entities.personal` as `side:<slug>` for a hub folder and `root:<key>` for a repository"). DESIGN.md is on the write list for one appended bullet only.
- **`root` on records and findings.** `src/lib/data/model/model-entities.ts:7-15` defines `Finding` with `file` documented as "Absolute path of the file the problem is in". `AuditFinding` (`src/lib/data/model/index.ts:310-318`) holds a "hub-relative path". The Findings view, `src/lib/views/system/findings/Findings.svelte:44-50`, draws `finding.file` as text in a `<span class="file">` and opens nothing. The view that opens a file is the Audit view, `src/lib/views/system/audit/Audit.svelte:149`: `openSourceFile(client, { root: HUB_ROOT, path: finding.file })`. Entity `file` fields are absolute too: `model-entities.ts:128`, `:148-149` and `:161` say "Absolute path of the registry file" / "of the collection file", and `normalise.ts:493` sets `file: raw.provenance.file`. All of these are inside the write list. Findings: item 4, case 18 and decision 1 rest on wrong premises (see 3 and 4).
- **`privateFolders`.** `git grep -n privateFolders` outside `private-folders.ts`, `server/edit/` and `tests/` gives the six callers (`ops.ts:744`, `search-routes.ts:70`, `machine-file.ts:38`, `rules.ts:41`, `folder.ts:201`, `config-files.ts:36`), which are on the write list. It also gives two comments:
  - `src/lib/server/files/search.ts:523` is off the list and stays true.
  - `src/lib/server/files/search-routes.ts:19` ("the hub's `secrets` and `~/.oculus`") is a caller on the list and becomes false.
  The page caller `config-files.ts:33-36` finds the hub as `roots.find((one) => one.key === HUB_ROOT)` from "the roots ... as the file listing answers them". To give it every hub, the page must learn which served roots are hubs. That means a new field in the workspaces answer (`workspacesAnswer`, `src/lib/server/files/fs.ts`, off the list) or a read of the config channel's `roots:`. The brief names neither, and the first is a wire shape.
- **`fieldValueShape`, `asFieldValue`, `NOT_A_FIELD_VALUE`.** `git grep -n "NOT_A_FIELD_VALUE\|asFieldValue\|fieldValueShape" -- src tests config docs HELP.md DESIGN.md README.md`: every code hit is under `server/edit/` (`yaml/yaml-edit.ts:68,194,205,799,801`, `writes/entries.ts:46,423,425`, `entry-edit/entries.ts:11,60,62`, `entry-edit/subtasks.ts:9,133,168`, `feeds.ts:34,369,372,500,624,626`). `git grep -n "not a string, number, boolean\|metalist, map of scalars"` gives `tools/oculus/docs/apps.md:524`, which quotes the refusal word verbatim in the Apps guide's refusal table. That is outside the write list ("No file under `tools/oculus/docs/` is written"), and item 10 ("its words updated to name the new shape") makes it false. D49 rewrites the same file and keeps "the refusal words table" (`briefs/D49.md` item 3). The widening also reaches every caller: a manifest field (`applyEdits`), a feed field (`feeds.ts:369`) and an entry field (`entry-edit/entries.ts:60`) will accept a list of scalar maps that they refuse today. The brief's item 10 speaks only of "a write of a collection entry".
- **`personalRoots`.** Outside the write list: `tools/oculus/DESIGN.md:557` ("`personalRoots` ... is the one place that drops the `hub` and `engine` keys and a root whose real path is the hub's, the engine's config folder's or an earlier root's"). Item 9 makes this list incomplete, so the sentence becomes false. `src/lib/data/sources/manifests.ts:322` is on the list. Item 9 also makes four more doc sentences false:
  - `docs/DATA-MAP.md:182` (`<root>/.oculus/project.yml` "one side project kept in a repository named by a `roots:` entry")
  - `:312` ("each root's `<root>/.oculus/project.yml` is read as a side project")
  - `:519` ("a `<root>/.oculus/project.yml` inside one is read as a side project")
  - `tools/oculus/HELP.md:107` ("a repository that holds `.oculus/project.yml`")
  The brief limits HELP.md, DESIGN.md and DATA-MAP to appended text.
- **`buildPortfolioWithSchemas`.** Hits outside `data/index.ts` and `watch/` are all under `tests/` (`checks/config/config-folder.test.ts:612`, `checks/config/integrity.test.ts:157`, `data/real-hub.probe.ts:81`, `data/snapshot/cluster-folder.test.ts:46`, `reference-hub.ts:242`, `relation-shapes.test.ts:70,87,106`, `resources.test.ts:52`). Decision 2 keeps the signature as one hub's build, so none is made false.
- **The change log's file naming.** `src/lib/server/core/changes.ts:165-170` (`pathOf`) already answers "the absolute path outside" the hub. Item 6's naming is therefore today's behaviour, and the undo resolves it the same way (`writes/undo.ts:85`, `:101`). Off the server side, `src/lib/state/sessions/source/write-files.ts:34-36` (`inHub` returns `{ root: HUB_ROOT, path }`) and `:108-111` (`case 'undo'` maps the logged file to `inHub(file)`) are on the write list (`state/`) but not named by the brief. They name every write's file, including a field write by project id (`:65`, `:77`, `:125`), and the undo's file, under `hub`. For a second-hub record they name the wrong file, and the page's refusal of a write over a tab with unsaved text then misses.

Findings: `docs/apps.md:524`, `DESIGN.md:557`, `DATA-MAP.md:182,312,519` and `HELP.md:107` are made false by items 9 and 10, but the brief forbids `tools/oculus/docs/` and allows only appended text in the other three. The roots writer (`writes/config/roots.ts`) and the page's write-file naming (`state/sessions/source/write-files.ts`) carry the changed names and are not named. The page's `isPrivateFile` needs a hub flag on the roots answer of `server/files/fs.ts`, which is off the list. The `root`-on-findings premise is wrong.

## 2. The step line

The step line (`plan.md:726`), its Step 0 (`:727`, closed as Z762), Z762 (a) to (i) (`plan.md:1640`, matching `choices.md` "Z762") and Subtasks on undo (`:1668`), mapped to "What to build":

- "any root in `roots:` may be marked `hub: true`": item 1 (Z762 (a)).
- "the portfolio is built per hub and merged": items 2 (Z762 (d)) and 3.
- "each record of a hub other than the first carrying its root in its id": item 3 (Z762 (b)).
- "a write goes to the record's own hub": item 6 (Z762 (f)).
- "the hub views mark where a record comes from": item 7 (Z762 (g)).
- "each hub's `secrets` folder is private": item 8 (Z762 (h)).
- "a write of a collection entry carries a field whose value is a list of maps ... the undo of a deleted entry puts its subtasks back": item 10 (ruling Subtasks on undo).
- "after D50, since each hub needs its own settings folder": item 2.
- Z762 (c) `root` on every record: item 4. Z762 (e) career, website, feeds, audit: item 5. Z762 (i) a hub root's own manifest: item 9.
- Additions (17) "one data model for every hub with no hub override": item 2 (engine schemas under each layer). The brief's quote of (17) stops before "while the lists that describe the hub's research (`domains`, `venue_themes`, `data_themes`) are the hub's". Item 2's "its own `.oculus/config/`" covers this, but the page's domain colours are the first hub's (item 2), so a second hub's own domain has no colour. See 6.

Parts with no requirement:
- Item 11, the sessions filed under a second-hub project. It follows from (b) and (c) but is named by neither.
- Item 6's last sentence, a prefix no hub carries refused. Derived.
- Item 10's "byte for byte as the file held them when the record's text is there". No ruling asks for it, and no record holds the text (see 3).
- Item 4's `root` on findings. This is decision 1, not Z762.

Requirements the brief's parts do not fully serve:
- Z762 (c) "the page opens them under `root`" names no surface. Item 4 lists the Files view, doc view, documents and decks, Show in Files, entry folder and sessions. It omits the expanded card's file finder (`src/lib/server/files/project-files.ts:183-191` reads the first hub's manifests and refuses a folder "not inside the hub"), chat on a project (`server/machine/pty/start/chat.ts:91`), HPC submit (`machine/hpc/submit.ts:151,206`) and deposit (`git/deposit.ts:248,282,435`, which writes a manifest field through `writeManifest(into.hub, ...)`). All of these are off the write list and take a project id from a card.
- Z762 (f) "a write that names a record". The deposit's `code_availability` write is such a write and is not in item 6's list. `linkedin-posted` names a file, not a record (`writes.ts:565`, `markLinkedinPosted(into.hub, into.config, linkedinPost.file)`), so routing it to a hub needs a new request field the brief does not name.

## 3. Premises

| Brief says | Command | Output | Verdict |
|---|---|---|---|
| `readRoots` `files.ts:150-201`, `rootEntryShape` `:139` | `sed -n 130,205p src/lib/server/files/files.ts` | `readRoots` opens at 150 and its `return` is at 200-201; `rootEntryShape` at 139 | holds |
| No entry carries `hub` (`grep -n "hub" .oculus/config/sources.yml`) | that grep; `grep -n "hub:" .oculus/config/sources.yml` | the brief's grep prints 7 comment lines (3, 7, 13, 18, 37, 71, 80); `hub:` exits 1 | the claim holds, but the command quoted does not show it; `grep -n "hub:"` does |
| `hubLayerPath` `hub-names.ts:128-130` | `sed -n 120,132p` | `export function hubLayerPath` at 128-130 | holds |
| `loadConfig` `merge.ts:172` | `grep -n "export function loadConfig"` | `172:` | holds |
| `buildPortfolioWithSchemas` `data/index.ts:242-308` | `grep -n`; `sed -n 236,310p` | `242:`, ends 308 | holds; it also returns `schemas` and `references` (the YAML server's schemas and reference index), which no item says how to merge |
| `Snapshot` `model/index.ts:183-188` | `sed -n 178,190p` | `export type Snapshot` 183-188 | holds |
| watcher call `portfolio.ts:657-664`, audit `671-685`, feeds `687` | `sed -n 640,700p` | build call 657-664, audit try 671-685, `buildFeeds` 687 | holds; the audit also reads `mutedSignatures(config)` (`:682`) |
| `auditFindings` `scan.ts:36`, `buildFeeds` `feeds.ts:103` | `grep -n` | `36:`, `103:` | holds |
| side ids `normalise-personal.ts:61-66` | `sed -n 55,70p` | `identity()` 61-66 | holds |
| `personalRoots` `portfolio.ts:275-289` drops `hub`, `engine` and the hub's real path | `sed -n 260,300p` | 275-289; it also drops the engine config folder's real path and an earlier root's | holds (incomplete) |
| `target()` `writes.ts:260-300` | `grep -n "export function target\|^}"` | `260:` to `316:` | line range wrong: 260-316 |
| write kinds pass `into.hub` at `writes.ts:383-600`; change log `pathOf` `642-645` | `grep -n "into\.hub\|local\.hub" writes.ts` | 385 ... 589, 642, 645 | holds |
| sizes 675 / 525 / 466 / 867 | `wc -l` | `675`, `525`, `466`, `867` | holds; `undo.ts` is already over 520 (source limit 880, so fine) and `yaml-edit.ts` has 13 lines of room |
| `writes/` holds 10 items | `ls src/lib/server/edit/writes \| wc -l` | `10` | holds |
| "a new folder beside `writes/`" (write list) | `git ls-files src/lib/server/edit \| ... \| sort -u \| wc -l` | `10` (block-edit.ts, block-render.ts, block-source.ts, deck-edit.ts, entry-edit, feeds.ts, list-edit.ts, writes, writes.ts, yaml) | **wrong**: `server/edit/` is at the folder limit, so a new folder beside `writes/` makes 11 and `utils/folder-check.sh` fails. `server/edit/yaml/` holds 2 and has room. |
| `NOT_A_FIELD_VALUE` 68-69, `fieldValueShape` 194-202, `asFieldValue` 205-208, refusal 800-802 | brief's grep; `sed -n 185,212p`, `790,806p` | `68:`, `205:`, `801:`; `fieldValueShape` 194-202 | holds |
| the refusal that drops the subtasks on undo | `sed -n 495,525p writes/undo.ts`; `grep -n NOT_A_FIELD_VALUE writes/entries.ts` | the undo of `delete-entry` calls `createEntry(..., mapBeforeShape.parse(change.before))` (undo.ts:505-507), which refuses at `writes/entries.ts:423-425` and renders through `entry-edit/render.ts:20` `renderEntry` | **missing**: the path that drops `subtasks` on undo is `createEntry`, not `applyEdits`, and the brief never names it |
| "byte for byte ... when the record's text is there" | `sed -n 325,350p writes/entries.ts` | the `delete-entry` record holds `before: plain(entry)`, the values; no text | **wrong**: no deletion record holds the entry's text. The branch either never runs, or it asks the builder to add text to the record in `~/.oculus/changes.jsonl`, a saved-record shape the rules file ("No silent design decisions") calls user-visible and the brief does not name |
| `subtasks` at `tasks/tasks.yml:2-4` and `:24-27`; `done` a boolean | `sed -n 22,30p tasks/tasks.yml`; `grep -n "done: true"` | the block is lines 24-29 (5 items); `38: - { do: HCCNet clinical, done: true }` | lines slightly off (24-29); the `done` boolean holds (line 38). The entry at 24-29 holds only `{ do: ... }` strings, which today's metalist shape already accepts |
| `privateFolders` `22-25`, 6 callers | `cat -n private-folders.ts`; `git grep -n "privateFolders(" -- src` | 22-25; 6 callers at the lines named | holds |
| "some 30 modules" name the hub | `git grep -c "<pattern>" -- src/lib/server \| wc -l` | `40` | **count wrong**: 40. The six largest match (30, 25, 17, 16, 14, 8). Of the 40, `files/project-files.ts` (4), `content/deck/read.ts`, `content/images.ts`, `git/deposit.ts` (3), `machine/pty/start/chat.ts` (3) and `machine/hpc/submit.ts` (2) are reached by a record of a second hub and are off the write list |
| `HUB_ROOT` in 28 page modules | `git grep -ln "HUB_ROOT" -- src/lib/state src/lib/views src/lib/shell \| wc -l` | `28` | holds |
| `Chip.svelte` | `ls` | present | holds |
| G2, G3, G8, G9, G14, G32, G66 | `grep -n "^- G" agents/guarded.md` | present | holds; no entry guards ids that never collide across hubs or the findings of `readRoots` (G13's Code line is "the config readers under `src/lib/data/sources/config/`", not `server/files/files.ts`) |
| `demo/` has a `.oculus/config/` layer | `ls demo/.oculus/config` | `behavior.yml`, `catalogs` | holds; no `sources.yml`, no `side-projects/`, no `secrets/`, no `.oculus/project.yml`, and `CAREER.yml` at the top where the engine default is `registries/career.yml` |
| the Findings view opens a finding's file (item 4, case 18) | `sed -n 1,60p src/lib/views/system/findings/Findings.svelte` | the file is drawn as `<span class="file">` text, with no control | **wrong**: the Findings view opens nothing; the Audit view opens `AuditFinding.file` under `HUB_ROOT` (`Audit.svelte:149`) |
| decision 1: "a file path made absolute would make the Findings view's file names differ in shape" | `model-entities.ts:8` | "Absolute path of the file the problem is in" | **wrong**: snapshot findings are already absolute for every hub |
| item 4: `file` "stays relative to its own hub" | `model-entities.ts:128,148-149,161`; `normalise.ts:493` | registry and collection `file` are absolute | **wrong** for `file`; `folder` and `deck` are hub-relative |

## 4. Cases and checks

Read against `agents/spec.md`.

- **Cases 17 and 18, and the chip in case 15, need the page.** The brief's rule under Cases says every case that is not a test "is checked by a run the report quotes, a scratch script under `$TMPDIR` given whole". The rules file ("What every package obeys": "A builder runs no page ... a case that only a page shows is checked by reading and by the unit-level runs that reach it, and its row in the report names the look on landing as its proof") requires these three to be routed to the look. The brief does not say so.
- **Case 18 is built on a wrong premise.** The Findings view opens no file (section 3). As written it cannot pass, or it asks the builder to add an open control to the Findings view, a user-visible change no item names. The view that opens a finding's file is the Audit view, which case 16 already covers in data only.
- **Item 13 and the test rule.** The rules file ("What every package obeys": "A test exists only as the test of one entry of `agents/guarded.md` ... A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled") requires each test to belong to an entry. Item 13 names G8, G9 and G3 for items 6, 8 and 10. It names no entry for the test of item 1's findings or for item 3's ids and relations over two hubs. G13's Code line does not name `server/files/files.ts`, and G14 and G32 do not state that ids never collide. Either the brief names the entry and its new Code line, or those two tests are a stop for a new entry. The brief leaves it to the builder.
- **Reserved keys.** The rules file ("What every package obeys": "Every id or key a step introduces is checked empty, duplicated, and colliding with a configured or reserved key") is not met by item 1 and cases 4 to 6. The reserved root keys `hub` and `engine` (`hub-names.ts:10,19`) are missing. `withFixed` (`files.ts:276-281`) lets a configured root keyed `hub` replace the served hub root, so `{ key: hub, hub: true }` gives second-hub records `root: hub`, the first hub's mark.
- **Asynchronous paths.** The same rule asks for "every asynchronous path in flight, after close, and superseded by a later one". The brief states none for the per-hub rebuild (a change to hub B while hub A's build runs, a hub removed during a build).
- **Folder limit.** The write list's "a new folder beside `writes/`" breaks the rules file's folder rule ("At most ten tracked items in a folder"), since `server/edit/` holds 10 (section 3).
- **Docs made false.** The rules file ("What every package obeys": "A sentence in a document or a head comment that the change makes false is a defect of the change") conflicts with the brief's limit of appended text only and its ban on `tools/oculus/docs/`. `docs/apps.md:524`, `DESIGN.md:557`, `DATA-MAP.md:182,312,519` and `HELP.md:107` become false (section 1).
- **DESIGN.md's write-list line** says "and a head comment's sentence the change makes false". DESIGN.md has no head comment (`sed -n 1,8p DESIGN.md` opens with the title and prose), so the clause names nothing.
- **Case 7's "where a setting decides them"** asks the builder to find a record that `slurm.resource` decides. None exists: `git grep -n "slurm.resource"` shows it read only by `settings.ts:231`, `hpc/host.ts`, `live-settings.ts` and the reference index, never by a record of the build. The case can only be checked by the reference index or vacuously.
- **Checks of places the step does not change.** Case 21 checks that the career and website keys of the copy are not read, which is today's single-hub behaviour. It fits item 5. No case asks the builder to quote or explain an unchanged place beyond the report's list of head comments, which the rules file asks for.
- Cases 1 to 6, 8 to 14, 16, 19 and 20 are consistent with the rules file.

## 5. The question

The step line has no check of its own beyond the verify list. `npm run test:quick` and the vitest folders in "Verify before you report" item 2 can pass on a tree with no second hub, since no existing test builds two hubs. They prove the goal only through the tests item 13 adds.

Per case, could it pass without the goal being reached:
1. Yes, partly. "the copy's ids each `lab:<id>`" passes with projects alone prefixed if the run lists only projects. "no finding" is unverified for a demo copy under the engine's default `sources.yml` (the copy has no layer `sources.yml`).
2. Yes. "no two entities share an id" passes if the merge drops a colliding record. The case should also assert that both hubs' project, venue and person are present (count equals the sum).
3. No. A cross-hub resolution would give a relation pair the case forbids.
4, 5, 6. No for the named inputs. They pass while `hub` and `engine` keys are accepted (section 4).
7. Yes. `slurm.resource` decides no record, so a second hub built with the first hub's settings passes. A setting that decides records (`scan`, `collections`, `data_domains`, a `vocab.yml` list) would fail it.
8. No. It is the manifest field write only.
9, 10. No.
11. No. It fails on the unchanged tree for the named reason.
12. No.
13. Partly. It checks four of the six callers (YAML server, writing-rule folder Fix All, search, paste). It passes with the library rules (`rules.ts:41`) and the page's `isPrivateFile` (`config-files.ts:36`) still given the first hub only.
14. No.
15. Partly. LinkedIn is not checked, and the chip is a page look.
16. No for the files. It passes with mute signatures colliding across hubs (`rules.ts:149-158`: the signature hashes scope, where, kind, key and args, with no root).
17. A page look. It can pass by reading.
18. Cannot pass as written (wrong premise).
19, 20, 21. No.

Per item of "What to build":
1. Covered by cases 4 to 6, except the reserved keys.
2. Can pass without the watcher rebuilding on a change to the second hub. No case edits a second hub's file and waits for a rebuild.
3. Case 2 can pass with dropped records (above).
4. Can pass with only the Projects board's title link opening under `root`. The doc view, a project's documents (`project-files.ts`, off the list), decks, Show in Files, an entry's folder and the sessions have no case.
5. The publications audit (`audit/publications.ts`) per hub is not checked.
6. Can pass with only the manifest field (case 8) and feed field (case 15) routed. An entry field, subtask, subtask added, reorder, deletion, feed deletion, LinkedIn posted, deck write and session override on a second-hub record have no case, and the G8 and G9 tests item 13 asks for are one row each.
7. A look only. Five of the six surfaces it names have no case.
8. See case 13.
9. Case 14 covers it.
10. Cases 11 and 12 cover it. Nothing checks a manifest or feed field write with the newly accepted shape.
11. Case 19 covers it.
12. Read at review.
13. Can pass while the tests for items 1 and 3 are written under no entry (section 4).

## 6. Implied inputs

Each is missing from "Cases", with the result it should have:

- **A hub root keyed `hub` or `engine`.** A finding naming the root, read as a plain root, no record carrying `root: hub` from it. Today `withFixed` (`files.ts:276-281`) lets the config's `hub` entry replace the served hub.
- **A first-hub id that already begins with `<root key>:`** (a registry key such as `lab:x` while a hub root is keyed `lab`). Either a finding, or the route still addressing the first hub's `lab:x`. Today nothing refuses a colon in a registry key, so the merged ids collide and a write to `lab:x` goes to hub `lab`. (`grep` of the real `registries/*.yml`, `tasks/*.yml` and `feeds/*.yml` for such a key printed nothing; the input is possible, not present.)
- **Two hub roots whose real folders are one folder** (a link and its target, or two letter cases). A finding and one hub built, with no duplicated records under two prefixes. The brief compares only against the first hub.
- **A second hub root inside or holding another second hub root.** A finding, since files of the inner hub would be read and written under two ids. The brief checks only against the first hub.
- **A hub root whose directory does not exist.** `readRoots` already reports "no directory at ...". The hub should then be skipped with no build error and no empty records.
- **A hub root removed from `roots:` (or `hub: true` taken off, or its key renamed)** while its records are open in tabs, pinned on Focus, named in session overrides or kept workbench layouts, or named in the change log:
  - its ids leave the snapshot;
  - an undo from History of its absolute file is refused, since the path is outside every root (G2);
  - the open tabs show "not found".
- **The Files view's Add Folder, Remove Folder and root reorder (G57) with a hub root in `roots:`.** The `hub: true` key is kept on every entry and nothing is refused. `writes/config/roots.ts:76,82,89,188` hold key and dir only.
- **A write to a second-hub record whose file changed on disk since the page read it.** Refused with the G8 sentence, nothing written.
- **A write to a second-hub record while a source tab holds unsaved text of its file.** Refused before it is sent, as for a first-hub file. Today `write-files.ts:34-36,65,77,108-111,125` names the file under `hub`, so the guard misses and the tab's text is lost.
- **The YAML language server for a second hub's YAML files.** Its schemas and its reference index (G66) are those of the second hub's build, named under its root. A first-hub file is given no reference into a second hub. Today `buildPortfolioWithSchemas` returns `schemas` and `references` named under `hub` (`references/build.ts:14-15`), and the watcher hands one set to `options.schemas` (`portfolio.ts:665`). The brief says nothing, and `server/machine/lsp/schema-feed.ts` is off the list.
- **The portfolio deck and a project's deck of a second hub.** A project deck opens from its card under `root: lab`, and the second hub's `portfolio_deck` is not the Present view's default. `server/content/deck/read.ts:80` is off the list.
- **The expanded card's file finder, a chat started on a project, an HPC submit and a deposit push of a second-hub project.** Each works in the second hub's folder, and the deposit's `code_availability` write goes to the second hub's manifest. Today `project-files.ts:183-191`, `pty/start/chat.ts:91`, `hpc/submit.ts:151,206` and `git/deposit.ts:248,282,435` use the first hub, and all are off the list.
- **An app's write naming a `lab:` record.** Either refused, as an app reaches only the hub's side-projects tier today (`writes.ts:318-325`), or routed. The brief does not decide.
- **The audit's mute list over two hubs.** A muted first-hub finding does not mute a second-hub finding with the same scope and message. `signatureOf` (`audit/rules.ts:149-158`) has no root in it. The mute list lives in the first hub's settings.
- **The audit's publications section over two hubs.** A website entry that matches a second-hub paper gives no "missing from the portfolio" finding, and the second hub's audit reads no `publications_file`.
- **A second hub's own domain or theme** (`vocab.yml` `domains`, which Additions (17) says is the hub's). Its records draw with the first hub's colours. The expected result (a fallback colour, or a finding) is unstated.
- **A change to a second hub's file while the first hub's build runs, and the reverse.** The merged snapshot holds the latest build of each hub, and no superseded build of one hub replaces a newer one.
- **A manifest field write, a feed field write and an entry field write whose value is a list of scalar maps**, now accepted by the widened `fieldValueShape`. Each is written in the file's form and re-read (the rules file's re-parse rule), or refused where the field's schema type is not a list of maps. The brief states only the collection entry.
- **A session whose working folder is the hub root `<lab dir>` itself**, not a project folder. Filed under no project, as a session at the first hub's root is.
- **A hub root that is also a named workspace's added root.** Served once under the configured key (`rootsFrom`, `files.ts:291-301`), and its `hub: true` comes only from the first hub's layer.
- **The page's saved state** (Focus pins, session overrides, D56's kept workbench layouts, open entry tabs) **naming a `root:<key>` side project that becomes a hub root.** The side project disappears (item 9). What the saved rows do is unstated.

## 7. ADRs

`ls tools/oculus/docs/adr` prints "ls: docs/adr: No such file or directory". `ls ../../docs/adr` (the hub's `docs/adr`, run from `tools/oculus`) prints "ls: ../../docs/adr: No such file or directory". The state file names no `adr` key (`grep -n "standards\|adr" orchestrator-state.md` gives `12:standards: [tools/oculus/.scratch/migration/agents/spec.md]` only). No ADR applies, as the brief says.

## 8. Dictated text

`grep -n -o '"[^"]*"' D55.md` lists the quoted strings. Those dictated for a file:

- "A second hub" (`D55.md:45`, the DATA-MAP section title): holds (plain, no editorialising heading, ASCII; `agents/spec.md` "The working rules that bind every package", Prose).
- "Everything in the brief is done" (`D55.md:143`, the report's first line): holds (the rules file's "Report" section gives the same words).
- "no glossary" (`D55.md:148`, the report's terms part): holds.
- "still true" and "rewritten" (`D55.md:151`, report marks): hold (the rules file's "What every package obeys" uses them).

The other quoted strings are section names, greps and quotes of the plan, not text for a file. The bullets for HELP.md and DESIGN.md are described, not dictated.

## Declined to judge

- Whether a copy of `demo/` builds with no finding under the engine's default `sources.yml` (case 1's "no finding"). Settling it needs a build run over a copy under `$TMPDIR`, which this read-only check did not run.
- Whether the roots writer drops `hub: true` or refuses the write when a hub root is in the list. This report quotes the code lines (`writes/config/roots.ts:76,82,89,188`) but did not run the writer. A run of Add Folder over a layer holding a `hub: true` entry, in a scratch copy, would settle it.
- Whether `linkedin_dir` is a "website key" (item 5 and Z762 (e) put LinkedIn among the per-hub feeds, while `config/sources.yml:4` calls the website folders "one hub's"). The rulings do not settle it.

Agent usage: a1d9331ec3d46e873, claude-opus-5-5, 226,582 tokens, 90 tool uses, 10.7 min.

## Closed

Every finding of this report is closed in `agents/briefs/D55.md` by the orchestrator, under that brief's "Closed" section, with the internal shapes no ruling named booked as Z765 (`plan.md` Rulings, `choices.md`, the closed log of `orchestrator-history.md`).
