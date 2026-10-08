# D39 premise recheck on main at a60dcb4fa

Read-only. I changed no file and ran no git command that changes state. Base `e61cfc598` is the commit the brief was read at. Every count and line below comes from a command run in this session (`grep -n`, `sed -n`, `wc -l`, `git diff --numstat e61cfc598 a60dcb4fa`, `git ls-files <dir> | cut | sort -u | wc -l`), and each section names the command.

## Findings that change what D39 builds

1. `server/machine/lsp` is now full at 10 items, because D43 added `relay-options.ts` (`git ls-files src/lib/server/machine/lsp | sed 's#.*/lsp/##' | cut -d/ -f1 | sort -u | wc -l` prints 10). Two consequences:
   - The relay split cannot add a file there. It goes in a subfolder.
   - `RelayOptions` now lives in `relay-options.ts:17-53`, and `schemas?: SchemaFeed` is at `:37-41`. That file is not in the brief's path list, but the index has to travel through it.
2. Item 2 says "D43 later uses the same hook", which is now false. D43 landed with its own `diagnostics?` (`servers.ts:185-189`) and `followed?` (`:190-194`) and does not use a page-request hook.
   - texlab now declares `referencesProvider` and `renameProvider: { prepareProvider: true }` (`servers.ts:654-671`).
   - So D39's transport rules apply to texlab too: the null `prepareRename` turned into a rejection, and the preview key.
3. M6 moved the YAML identity walk and the scalar writer into Layer 1, in `data/helpers/files/yaml/collection-text.ts`:
   - `itemWith` (`:86-107`, "the one walk that finds an entry by its identity"), which `lists.ts:102` now uses.
   - `renderScalar` (`:30-46`, "which both layers use for every value they put in a file").
   - `lineAt` (`:48-53`).
   
   By spec.md's DRY rule, the index's definition finder has to reuse `itemWith`. Reusing `renderScalar` for the new key would change case 23's refusals; that is choice C4.
4. Step 0 (`diskName`) is not yet in the brief. It needs a new item, a case, a G28 test, and widened paths (section 3).
5. Item 4's read premise does not hold, at either commit:
   - `loadSource` (`state/sessions/source/draft.ts:323-340`) already answers the text and its hash (`base: await digestOf(held.bytes)`, `:334`) from one read.
   - That read is capped on the page (`readCappedBytes(response, TEXT_LIMIT)`, `:329`).
   - The file route (`routes/api/(files)/file/[root]/[...path]/+server.ts`, 24 lines) has no limit.
   - `readCapped` already takes a required `limit` (`fs-transport.ts:362-368`).
   
   So the limit argument belongs on `loadSource` in `draft.ts`, which is not in the path list. No route change is needed.
6. O5's premise "as every other write route refuses it" is false.
   - `closed_paths` is `apps.closed_paths` (`behavior.yml:264`, under `apps:`, at `:260` at the base).
   - `grep -rln "closedPaths\|closed_paths\|helpers/files/apps" src` names only the app write gate (`server/edit/writes/app-gate.ts`), the app open (`apps/open.ts`), the LSP library rules (`library/rules.ts`) and the config readers. No write route under `server/files` refuses it.
   - The helper already exists: `inClosedPaths` (`data/helpers/files/apps.ts:187`). This is choice C5.
7. `views/sources/repositories/diff/Diff.svelte` is 517 lines (`wc -l`), 3 under 520, and was 517 at the base too. Item 4 edits it at `:119`, which will probably force a split. The brief's list of files near the size line leaves it out. `References.svelte` is 490.
8. D36 is queued and being rechecked at the same base (`queue.md:5`). It shares several paths with D39 (section 2).

## 1. Every premise rerun at a60dcb4fa

Files unchanged since the base keep every line the brief cites (`git diff --numstat e61cfc598 a60dcb4fa -- <file>` prints nothing). That covers:
- **Data and schema:** `field.ts`, `manifest.ts`, `run.ts`, `set.ts`, `static.ts`, `check.ts`, `forms/schema.ts`, `model-collections.ts`, `file-ops.ts`, `text-edits.ts`.
- **Server, LSP and writes:** `schema-feed.ts`, `held/documents.ts`, `lsp-edit.ts`, `history.ts`, `file-undo.ts`, `edits.ts`, `options.ts`.
- **Editor, views and state:** `references.ts`, `references.svelte.ts`, `place.ts`, `services.ts`, `commands.ts`, `source-file.ts`, `MathPreview.svelte`, `replace-preview.ts`, `diff-read.ts`, `answers.ts`, `compare-words.ts`, `Diff.svelte`, `References.svelte`, `registry.ts`, `catalogue.ts`.
- **Config and docs:** `glyphs.yml`, `manifest-schema.yml`, `deck-schema.yml`, `layout.yml`, `search.yml`, `docs/apps.md`.

Changed values (old, then new, then the command):

**Plan lines** (`grep -n "^- D39 \|^- Z347\|^- Z682\|^- Z725\|^- Open item 10\|^- Open item 8\|^- Z730\|^- Z735\|^- Open item 15" plan.md`):
- step line 534 is now 535; sub-bullet 535 is now 536; the Step 0 sub-bullets are 537 and 538.
- Z347 1164 to 1167; Z682 1500 to 1503; Z725 1547 to 1550; open item 10 1552 to 1555; open item 8 1541 to 1544; Z730 1558 to 1562.
- Z735 is at 1567 and open item 15 at 1560.

**Hub data** (`git diff e61cfc598 a60dcb4fa -- registries network education applications funding/funding.yml tasks feeds deck projects/manuscripts/btfno/project.yml`):
- What changed: schema-comment lines, one funding entry's `status`, `deadline` and `note`, and btfno's `authors`, `focus`, `status` and `latest`/`next`.
- No reference field changed. Every hub line the cases cite holds (`sed -n`): btfno :8, hccnet-revision :10 and :35, joint-work :22, people :21, funding :66, radar :41 and :665, `deck/present.yml:9`, `vocab.yml:52`.
- Manifests 94, side projects 3, radar 336,388 bytes, `hccnet-revision` 32 times (the brief's own commands).
- Not recomputed: the 1,115 value count and the per-field counts. The diff above touches none of those fields.
- Versions hold: yaml-language-server 1.24.0, monaco-editor 0.57.0, yaml 2.9.1 (`grep '"version"'`). No ADR folder exists (`ls`).

**Schema helpers** (`grep -n` over each file):
- `lists.ts`:
  - `VOCAB_PREFIX`, `REGISTRIES`, `hubLists` and `listsOf` moved from 26-86 to 27-88.
  - `lineOfItem` moved from 90 to 91; it now calls `itemWith`.
  - `duplicateKeys` moved from 117-145 to 106-138.
- `hub-names.ts`:
  - `REGISTRY_SHAPES` moved from 40-52 to 52-69.
  - New: `ENGINE_IN_HUB` at :22, `diskName` at :24-33, `CAREER_FILE` at :36.
  - Unchanged: `HUB_ROOT` :10, `ENGINE_ROOT` :19, the doc comment :12-18.
- `record.ts`: `FIELD_TYPES` moved from 32-42 to 33-43; the `x-from`/`examples` lines from 126-131 to 127-132.
- `engine.ts`: `optionSource` moved from 53-75 to 51-73.

**Config and catalogs:**
- `findings.yml`: `waiting_on_itself`/`no_waiting_on` moved from 190-191 to 191-192.
- `options.yml` (`grep -n "from:"`): 189, 196 and 339 hold. 1035 is now 1054, 1051 is 1070, 1094 is 1113, and 1118 is 1137.
- `options.ts:184-197` is `catalog/schemas/options.ts`, and `options.ts:430-435` is `catalog/options.ts`. The brief names both as `options.ts`.
- `behavior.yml`: `closed_paths` moved from 260 to 264. `:26` and `:76` hold. `sources.yml:24` and `:92` hold.
- `catalog-files.ts:25` and `:77` hold.

**`servers.ts`** (742 to 741 is wrong; it went from 642 to 741 lines):
- `ServerEntry` moved from 131-163 to 153-195.
- `YAML_SETTINGS` moved from 526-536 to 560-570.
- `yaml()` moved from 544-576 to 578-609; its capabilities from 563-572 to 597-606.
- The head comment is now 1-26.

**`relay.ts`** (864 to 852 lines, 28 under 880):
- `initialize` moved from 434-442 to 419-426.
- `#route` moved from 497-551 to 485-535.
- `SchemaFeed` is now `relay-options.ts:37-41` and is read in the constructor at `relay.ts:117-143`.
- `#schemasChanged` moved from 172 to 158-164.

**`held.ts` and the build:**
- `held.ts` went from 667 to 691 lines; `Doc` still :50-67.
- `data/index.ts`: `PortfolioBuild` is :217 (the brief's 215-216 was off at the base too); `buildPortfolioWithSchemas` is 228-276.
- `portfolio.ts` publish moved from 602-610 to 604-612.
- `server/root/context.ts`: 246 is now 248, 319 is now 326; the file is 810 lines.

**Transport** (`transport.ts` 871 to 868 lines; `transport/` 3 to 5 items):
- The rename branch moved from 660-668 to 640-648.
- `#commit` moved from 504-513 to 485-494.
- `EDITING` moved from `transport.ts:136-140` to `transport/records.ts:32-36`.
- `staleFile` moved from `transport.ts:509` to `transport/edits.ts:47` (called at `transport.ts:489`).
- The "one at a time" sentence moved from 45-47 to 52-53; the head comment from 1-49 to 1-56.

**Client and hosts:**
- `client.ts` went from 666 to 693 lines; `#applyEdit` moved from 540-545 to 567-572.
- `hosts.ts`: the opener moved from 129-160 to 137-165; O4's 136-153 is now 144-158; the comment 136-140 is now 145-149.

**`lsp.ts`:** 212 is now 220; 329/330 are now 337/338; 468 is now 476; the walk 535-538 is now 543-546.

**`state/client/context.ts`** (855 to 821 lines):
- `lspEdits` moved from 595 to 561.
- `diskText` moved from 599-602 to 565-568.
- The type field moved from 235 to 219, and the return from 844 to 810.
- The `createLspEdits` import moved from 116 to 101.

**`fs-transport.ts`:**
- `readHash` moved from 469-477 to 428-440.
- `readCapped` moved from 399 to 362; it takes `limit`.

**Docs and text:**
- `source.yml`: `lsp_edit_*` moved from 66-78 to 68-80. `lsp_edit_outside` is :74; the brief's :69 was wrong at the base, which had :72.
- `edits.ts`: the outside list is at :20, not :19.
- `app.yml`: :12 is now :13.
- `views.md`: :251 ("Six views") is now :253; 67-69 hold.
- `DESIGN.md` 526, 575 and 576 hold. `HELP.md` 46, 81 and 116 hold. The four sentences of `files-and-search.md:85` hold, and :85 now also says texlab renames.
- `DATA-MAP.md` lines all hold. `:436` also lists the schema field's attributes, and the attribute table ends at :469; neither is named for `map`.
- `layout.yml:171-200` is wrong at both commits (184 lines). The Explorer page is `:76-83`.
- `ui/Table.svelte` moved to `ui/display/table/Table.svelte` (M6).

**Folders** (`git ls-files <dir> | ... | wc -l`):
- `server/machine/lsp` went from 9 to 10 (full).
- `data/prose` went from 9 to 10 (full; M6's `linkedin-idea.ts`). D39 writes only `text-edits.ts` there.
- `kit/lsp/transport` went from 3 to 5.
- The others hold: `adapters/yaml` 3, `data/snapshot` 8, `state/system/machine` 6, `views/sources/search` 8, `tests/data/snapshot` 5, `tests/state/system` 3, `tests/routes/replace` 4.
- `tests/data/helpers` has 1 item.

**Tests and paths:**
- Every test file in verify item 2 exists (`[ -e ]`).
- `~/.claude/skills/land/templates/checks.sh`, node v24.21.0 and both `utils` scripts exist (`ls`).

## 2. Where M6 and D43 change what D39 builds

- **Language server entries and hooks (D43):**
  - `ServerEntry` now has `requests?` (requests from the server to the client), `refuses?`, `diagnostics?` and `followed?`. D39's page-request hook is new and is D39's alone.
  - Name the new hook so it is not confused with `requests` (a builder's choice; list it in the report).
  - The relay head comment `relay.ts:23-28` now describes `refuses` and `diagnostics`; the hook joins that paragraph.
- **Relay options (D43):** the index travels through `RelayOptions` in `relay-options.ts` (new path).
- **Transport records (D43):** a mark for the preview key on a waiting rename belongs on `Waiting` (`transport/records.ts:18-29`).
  - D43's `CompletionHook` and `answering` (`hosts.ts:43-49`, `:205-213`) are a per-model hook on answers, keyed by `keyOf(model)`. They are the existing pattern for O4's "kept target ranges of the last answer per editor".
- **Client (D43):** `#applyEdit` is unchanged in shape (`client.ts:567-572`).
- **`diskName` and the unsaved refusal (M6):** see section 3. The page edit `edits.ts` matches tabs by the string `root/path` (`nameOf`, `edits.ts:105-107`), so cases 26 and 46 need the one-file function.
- **The source tab's Add (M6):** Add puts a stub (empty identity and fields) into a tab's unsaved text (`draft-entry.ts`). The overlay of case 18 reads that text, and case 15 (an empty value is no reference and no definition) already covers the stub. Nothing to add. `lsp-edit` posts go through `ops`, not `/api/write`, so M6's `unsavedRefusal` (`writes.svelte.ts:552-561`) does not touch them.
- **YAML helpers (M6):**
  - `itemWith`, `renderScalar` and `lineAt` are now importable by Layer 1. Before, `renderScalar` was at `server/edit/yaml/yaml-values.ts:65` and `lineAt` at `server/edit/entry-edit/lines.ts:99` at the base (`git grep`).
  - `KEYED_FIELDS` (`collection-text.ts:25`, venues to `id`) restates part of `REGISTRY_SHAPES`. D39 reads `REGISTRY_SHAPES`.
- **YAML schemas M8 gave (M6 touched the readers):**
  - `withoutPath` moved from `record.ts` to `collection-text.ts:75`.
  - `ENGINE_IN_HUB` moved to `hub-names.ts:22`.
  - `record.ts`, `field.ts` and `catalog-files.ts` take `map` as the brief says, at the moved lines.
- **Sizes:**
  - None of the files D39 writes is over a limit.
  - Near the line: `transport.ts` 868, `relay.ts` 852, `state/client/context.ts` 821, `server/root/context.ts` 810, `servers.ts` 741, `source.svelte.ts` 742, `client.ts` 693, `held.ts` 691; components `Diff.svelte` 517 of 520 and `References.svelte` 490.
- **Paths at different lines:** every path-list range in section 4's corrections.
- **D36 (queued, rechecked at a60dcb4fa; its brief's write list):** it shares these paths with D39:
  - `server/root/context.ts` 235-260, overlapping D39's 240-330 at the `SchemaFeed` lines 248-252.
  - `state/client/context.ts`.
  - `docs/files-and-search.md`: a new section after :85, beside D39's rewrite of :85.
  - `glyphs.yml` and `icons.yml`.
  - `config/text/`.
  - `docs/diagrams/`.
  - `behavior.yml`: a `lint:` block after :178, which moves D39's :264.
  - `options.yml`: "Linting" entries, which can move D39's 1054-1137.

## 3. Step 0: `diskName`

What it computes now (`sed -n 21,33p src/lib/data/helpers/hub-names.ts`):

```ts
export const ENGINE_IN_HUB = 'tools/oculus/config';                    // :22
export function diskName(file: { root: string; path: string }) {       // :29
    const prefix = `${ENGINE_IN_HUB}/`;
    if (file.root !== HUB_ROOT || !file.path.startsWith(prefix)) return file;
    return { root: ENGINE_ROOT, path: file.path.slice(prefix.length) };
}
```

It names `hub:tools/oculus/config/<x>` as `engine:<x>` and leaves every other name alone. It never looks at which folder the engine root is served from.

Callers (`grep -rn "diskName\|unsavedFile" src tests`):
- `diskName` has one caller: `unsavedFile` (`state/sessions/source/source.svelte.ts:224-232`). That function applies it to the asked file and to each dirty draft's `diskFileOf` (`draft.ts:393-399`).
- `unsavedFile` is called by:
  - `createWrites`' `heldUnsaved` (`state/client/context.ts:288-291`, then `writes.svelte.ts:552-561`, which refuses with `app.file_unsaved`).
  - `EntryCard.svelte:140`, `VenueCard.svelte:105`, `Collection.svelte:131`, `Leads.svelte:106` and `views/boards/focus/rows.ts:81`.
- A rail reorder writes `engine:layout.yml` (`write-files.ts:101-102`, `inConfig`).
- No test exercises `diskName` (`grep -rln "hub-names" tests` names only `boundaries.test.ts` and `career.test.ts`).
- G28's Code line names it (`agents/guarded.md:54`, "`hub-names.ts` (`diskName`, the one name of a disk file)"), but G28's Test line has no row for it.

The data the replacement needs:
- The page has `FsRoot { key, dir, fixed, real? }` (`state/sources/explorer/view/place.ts:53`) from `fs.roots()`. That list is empty while the workspaces are read (`fs.svelte.ts:491-493`).
- The server answers `real: realPath(root.dir) ?? ''` (`server/files/fs.ts:450-456`).
- The relay has `ServedRoot { key, dir, real }` (`server/machine/lsp/uris.ts:42`).
- The relay already keys a page's open documents by real path (`page.opened.get(normal(open.doc.real))`, `held/documents.ts:61`).
- `fs` is made at `state/client/context.ts:374`, before `createSource` at `:450`.

Which test file: `agents/spec.md:57` keeps one test per unit an entry's Code line names. `hub-names.ts` is such a unit of G28 and has no test, so the step writes G28's test of it. This is not a new entry, so it needs no stop. The file goes at `tests/data/helpers/hub-names.test.ts`, mirroring the source path; `tests/data/helpers` holds 1 item.

Text to add (section 4 gives where).

## 4. Corrections, as exact replacements

Brief line numbers are those of `agents/briefs/D39.md` now.

**Plan lines and the base (lines 13-26):**
- **L13:** "`plan.md:534`, the step line" becomes "`plan.md:535`, the step line". Also "`plan.md:535`, its sub-bullet: the premise survey, the DATA-MAP rows rewritten here, the radar over the copy limit, the order before M7." becomes "`plan.md:536`, its sub-bullet: the premise survey, the DATA-MAP rows rewritten here, the radar over the copy limit, the order before M7; `plan.md:537-538`, its Step 0 sub-bullets: this brief, and the one-file rule of M6's review (item 10)."
- **L14:** "`plan.md:1164`" becomes "`plan.md:1167`".
- **L15:** "`plan.md:1500`" becomes "`plan.md:1503`".
- **L16:** "`plan.md:1547`" becomes "`plan.md:1550`".
- **L17:** "`plan.md:1552`" becomes "`plan.md:1555`".
- **L19:** "`plan.md:1541`" becomes "`plan.md:1544`".
- **L20:** "(`plan.md:1558`, automode)" becomes "(`plan.md:1562`, automode)". Also "Z735 (`plan.md`, Rulings, automode)" becomes "Z735 (`plan.md:1567`, automode)".
- **L22:** "run on main at fbc434269. D39 is dispatched after M6 and D43 have landed (Z735); `/spec` then rereads every premise and line number on main at its base, which this brief's preparation commit names." becomes "run on main at a60dcb4fa. M6 (827d5b77c) and D43 (a60dcb4fa) have landed (Z735); every premise and line number below is read on main at a60dcb4fa."
- **L24:** "(read on main at e61cfc598)" becomes "(read on main at a60dcb4fa)".
- **L26:** replace the whole paragraph with: "Since e61cfc598, M6 (827d5b77c) and D43 (a60dcb4fa) changed `tools/oculus` (`git log --oneline e61cfc598..a60dcb4fa -- tools/oculus ':!tools/oculus/.scratch'`); the hub's data files changed only in schema comments, one funding entry's `status`, `deadline` and `note`, and btfno's manifest (`authors`, `focus`, `status`, `latest`, `next`), none a reference field (`git diff e61cfc598 a60dcb4fa -- registries network education applications funding/funding.yml tasks feeds deck projects`). Every premise below was read again at a60dcb4fa."

**What is on the tree, schema and config (lines 31-38):**
- **L31:** "`schema/record.ts:126-131`" becomes "`schema/record.ts:127-132`".
- **L32:**
  - "`src/lib/data/snapshot/schema/field.ts:26-34`" becomes "`:26-35`".
  - "(`schema/lists.ts:26-86`)" becomes "(`schema/lists.ts:27-88`)".
  - "(`src/lib/data/helpers/hub-names.ts:40-52`:" becomes "(`src/lib/data/helpers/hub-names.ts:52-69`:".
  - After ":19)" add "; `ENGINE_IN_HUB = 'tools/oculus/config'` :22 and `diskName` :24-33 (item 10)".
- **L33:**
  - "`engine.ts:53-75`" becomes "`engine.ts:51-73`".
  - "`config/catalogs/options.yml:189`" holds.
- **L34:** "`config/text/findings.yml:190-191`" becomes "`config/text/findings.yml:191-192`".
- **L35:** "(`FIELD_TYPES`, `schema/record.ts:32-42`)" becomes "(`FIELD_TYPES`, `schema/record.ts:33-43`)".
- **L38:** "`lists.ts:117-145`" becomes "`lists.ts:106-138`".

**The YAML server, the relay and the build (lines 44-47):**
- **L44:** "`yaml()` `src/lib/server/machine/lsp/servers.ts:544-576`, `YAML_SETTINGS` :526-536, the capabilities the page is told :563-572" becomes "`yaml()` `src/lib/server/machine/lsp/servers.ts:578-609`, `YAML_SETTINGS` :560-570, the capabilities the page is told :597-606". Also "`ServerEntry` :131-163 has no hook that answers a page request. `servers.ts` is 642 lines." becomes "`ServerEntry` :153-195 has no hook that answers a page request (its hooks: `requests` for the server's requests to its client, `refuses`, `diagnostics`, `followed`). texlab declares `referencesProvider` and `renameProvider: { prepareProvider: true }` (:654-671). `servers.ts` is 741 lines."
- **L45:** replace with: "The relay answers `initialize` with `entry.capabilities(language)` (`src/lib/server/machine/lsp/relay.ts:419-426`) and forwards every document request by `#route` (:485-535). The schemas reach it as `RelayOptions.schemas` (`relay-options.ts:37-41`, read in the constructor `relay.ts:117-143`), whose `publish` tells its listeners only when the set's text changed (`schema-feed.ts:21-27`), and each change asks every YAML server for its settings again (`#schemasChanged`, relay.ts:158-164). `relay.ts` is 852 lines (28 under 880); `server/machine/lsp` holds 10 items."
- **L47:** "(`server/root/watch/portfolio.ts:602-610`)" becomes "(`:604-612`)". Also "(`server/root/context.ts:246`, `:319`)" becomes "(`:248`, `:326`)". Also "(`src/lib/data/index.ts:226-275`)" becomes "(`:228-276`)".

**The page (lines 51-58):**
- **L51:** replace with: "The transport: the rename answer (`src/lib/ui/controls/editor/kit/lsp/transport.ts:640-648`) goes to `#commit` (:485-494), which checks `staleFile` (`transport/edits.ts:47`) and calls `host.applyEdit`; Monaco gets no result. `EDITING` is `transport/records.ts:32-36`, beside `Waiting` (:18-29). Messages are handled one at a time (head comment :52-53), so an `applyEdit` that waited on the reader would hold every later message of the language. `transport.ts` is 868 lines (12 under 880); `kit/lsp/transport/` holds 5 items."
- **L52:** "refusals in the head comment :18-27" becomes ":19-28". Also "Wired at `views/sources/source/language/lsp.ts:212`, called by `client.ts:540-545`" becomes "Wired at `views/sources/source/language/lsp.ts:220`, called by `client.ts:567-572`". Also "`client.ts` is 666 lines (640 at the survey; D33)" becomes "`client.ts` is 693 lines".
- **L55:** "(`kit/lsp/hosts.ts:129-160`)" becomes "(`kit/lsp/hosts.ts:137-165`)".
- **L56:** "(`lsp.ts:468`)" becomes "(`lsp.ts:476`)". Also "(:329)" becomes "(:337)" and "(:330)" becomes "(:338)".
- **L57:** "`config/text/views/sources/source.yml:66-78`" becomes "`:68-80`".
- **L58:** "(`config/layout.yml:171-200`)" becomes "(`config/layout.yml:76-83`)".

**The write chain (line 64):** "(`config/behavior.yml:260`, `closed_paths: [secrets]`)" becomes "(`config/behavior.yml:264`, `apps.closed_paths: [secrets]`, read today by the app write gate `server/edit/writes/app-gate.ts`, the app open `server/machine/apps/open.ts` and the LSP library rules `library/rules.ts:1-9`, through `inClosedPaths`, `data/helpers/files/apps.ts:187`; no route under `server/files` reads it)".

**Folders and sizes (lines 68-70):**
- **L68:** after "`ui/controls/editor/kit/lsp`," add "`server/machine/lsp` (with D43's `relay-options.ts`), `data/prose`,".
- **L69:** "`server/machine/lsp` 9, " is removed. Also "`kit/lsp/transport` 3" becomes "`kit/lsp/transport` 5". Also ", `data/prose` 9" is removed, and "`tests/data/helpers` 1" is added.
- **L70:** replace with: "Near the size line: `transport.ts` 868, `relay.ts` 852, `state/client/context.ts` 821, `server/root/context.ts` 810, `servers.ts` 741, `state/sessions/source/source.svelte.ts` 742, `client.ts` 693, `held/held.ts` 691; components `views/sources/repositories/diff/Diff.svelte` 517 (3 under 520; item 4 edits it, so it is split by concern if it passes) and `References.svelte` 490."

**Base copy and documents (lines 74-85):**
- **L74:** "`git archive e61cfc598`" becomes "`git archive a60dcb4fa`".
- **L81:** "`:251` (\"Six views are opened" becomes "`:253` (\"Six views are opened".
- **L82:** after "`:463` (the `from` attribute)" add ", `:436` (the attributes a schema field may carry) and the attribute table's end at `:469`".
- **L84:** "`config/text/views/sources/source.yml:69`" becomes "`:74`".
- **L85:**
  - "`servers.ts:1-22`" becomes "`servers.ts:1-26`".
  - "`transport.ts:1-49`" becomes "`transport.ts:1-56`".
  - "(its `outside` list at :19)" becomes "(:20)".
  - "`hosts.ts:136-140`" becomes "`hosts.ts:145-149`".
  - Add "`hub-names.ts:24-28` (item 10), `DESIGN.md:553` (item 10), `relay-options.ts:37-41`".

**In flight and guarded entries (lines 87-94):**
- **L87-92:** replace the section body with:
  - "M6 landed at 827d5b77c and D43 at a60dcb4fa; nothing is in flight (`queue.md`)."
  - "D36 (linters on save) is queued with its premises rechecked at a60dcb4fa. It writes `server/root/context.ts` 235-260 (beside D39's 240-330 at the `SchemaFeed` lines 248-252), `state/client/context.ts`, a new section of `docs/files-and-search.md` after :85, `DESIGN.md` 23, 166 and 476, `glyphs.yml` and `icons.yml`, `config/text/`, `behavior.yml` (a `lint:` block after :178, which moves `closed_paths` from :264), `options.yml` (its \"Linting\" entries, which can move :1054-1137) and `docs/diagrams/`."
  - "M7 (a project folder moved in Files) is queued after D39 and rewrites a moved project's id references through D39's index (Z725 C4)."
- **L94:** after "the tree checks G16 to G27;" add "G28 (`hub-names.ts`, `source.svelte.ts`, `writes.svelte.ts`: item 10, whose test of the one-file function this step writes, since G28's Code line names `hub-names.ts`);".

**What to build, items 1-8 (lines 101-140):**
- **L101:** "`options.yml:196, 1035, 1051, 1094, 1118`, read through `options.ts:430-435`" becomes "`options.yml:196, 1054, 1070, 1113, 1137`, read through `data/sources/config/catalog/options.ts:430-435`".
- **L104:** after "and each entry keeps the file's real path, so an open text is matched by real path whatever root a tab holds it under" add " (the function of item 10)".
- **L105:** "Before writing a helper, grep `src` for the exported position helpers (`data/helpers/files/yaml/yaml-ranges.ts` after M6) and reuse what the data layer may import;" becomes "Before writing a helper, grep `src` for the exported YAML helpers and reuse what the data layer may import: `yaml-ranges.ts` and `collection-text.ts` in `data/helpers/files/yaml/`, among them `itemWith` (:86-107), the one walk that finds an entry by its identity, which the definitions use, `renderScalar` (:30-46, see C4) and `lineAt` (:48-53);".
- **L106:** "(`data/index.ts:215-216`)" becomes "(`data/index.ts:216-217`)". Also "(`portfolio.ts:602-610`)" becomes "(`portfolio.ts:604-612`)". Also "(a field of the feed or a feed of its own, the builder's choice, named in the report)" becomes "(a field of the feed or a feed of its own in `RelayOptions`, `relay-options.ts`, the builder's choice, named in the report)".
- **L108:**
  - "returning an answer or nothing, nothing meaning forward as now; D43 later uses the same hook." becomes "returning an answer or nothing, nothing meaning forward as now. It is named apart from `requests` (the server's requests to its client); D43 landed without it."
  - "the new file in `server/machine/lsp/` (9 items, room for one) or a subfolder named for what it holds." becomes "the new file in a subfolder of `server/machine/lsp/` named for what it holds (the folder holds 10 items)."
- **L114:** "so `staleFile` (`transport.ts:509`) does not refuse it" becomes "so `staleFile` (`transport/edits.ts:47`) does not refuse it".
- **L116:** "(`servers.ts:563-572`)" becomes "(`servers.ts:597-606`, declared as texlab's are at :654-671)".
- **L125:** after "for every server (Z735)." add " texlab declares rename with a prepare provider (`servers.ts:665`), so this holds for it too."
- **L127:**
  - "`createLspEdits`'s `diskText` (`state/client/context.ts:599-602`) becomes a read of text and hash through `loadSource` with a limit argument (the source read route and `fs-transport.ts`'s `readCapped` take an optional limit, `TEXT_LIMIT` by default, `data/file-ops.ts:32`), the hash in the form `readHash` answers (`fs-transport.ts:469-477`);" becomes "`createLspEdits`'s `diskText` (`state/client/context.ts:565-568`) becomes a read of `content` and `base` through `loadSource` (`state/sessions/source/draft.ts:323-340`), which already answers the text and its SHA-256 (`base`, `digestOf`, the form `readHash` answers, `fs-transport.ts:428-440`) from one read; `loadSource` gains an optional limit argument, `TEXT_LIMIT` by default (`data/file-ops.ts:32`), passed to its `readCappedBytes` (:329); the file route `routes/api/(files)/file/[root]/[...path]/+server.ts` has no limit and does not change;".
  - Also "the plan makes every check `apply` makes today" becomes "the plan makes every check `apply` makes today, matching a tab to a file by the function of item 10".
- **L128:** "(`state/client/context.ts:595`, split by concern if it passes 880)" becomes "(`state/client/context.ts:561`, split by concern if it passes 880)".
- **L129:** "`Diff.svelte:119`" becomes "`Diff.svelte:119` (517 lines; split by concern if it passes 520)".
- **L131:**
  - "(`config/behavior.yml:260`, `closed_paths: [secrets]`)" becomes "(`config/behavior.yml:264`, `apps.closed_paths: [secrets]`, matched with `inClosedPaths`, `data/helpers/files/apps.ts:187`, and see C5)".
  - "as every other write route refuses it (Z730 O5)" becomes "as an app's write (`app-gate.ts`) and the LSP library read (`library/rules.ts:1-9`) refuse it (Z730 O5)".
  - "(`source.yml:69`)" becomes "(`source.yml:74`)".
  - "the `edits.ts:19` head comment" becomes "the `edits.ts:20` head comment".
- **L134:** "`findings.yml:191`" becomes "`findings.yml:192`".
- **L135:** "`options.ts:184-197`" becomes "`data/sources/config/catalog/schemas/options.ts:184-197`".
- **L138:** "(`references.step`'s pick, `lsp.ts:535-538`)" becomes "(`lsp.ts:543-546`)".
- **L140:**
  - "and :251 counts the views opened for something" becomes "and :253 counts the views opened for something".
  - ":463 (the `from` attribute and the `map` attribute)" becomes ":436 and :463 (the `from` attribute and the `map` attribute, a `map` row after :469)".
  - After "`docs/apps.md:247` names `map?`." add "`DESIGN.md:553` and the doc comment of item 10's function say how one file is decided."

**Tests (after line 148):** add the bullet "- G28's test of the one-file function (item 10): `tests/data/helpers/hub-names.test.ts` (new), describe 'one disk file under two names', one `it.each` table with the rows of case 48."

**Cases (lines 176-222):**
- **L176 (case 18):** append " With the engine root served from a worktree's config folder, `hub:tools/oculus/config/catalogs/vocab.yml` is the main checkout's own file: it is not indexed, its open text is not overlaid on the engine's `catalogs/vocab.yml`, and Find References on `heart` lists the engine's file only (item 10). G66 (the overlay row, both inputs)."
- **L209 (case 35):** "The preview key in the rename box of a TypeScript or pyright rename opens the preview" becomes "The preview key in the rename box of a TypeScript, pyright or texlab rename opens the preview".
- **After L222 (case 47):** add case 48. The text is given in full at the end of this section.

**Verify, paths, decisions and read list (lines 231-331):**
- **L231 (verify 2):** after "`tests/data/sources/present.test.ts` (G32, when the deck schema changes);" add "`tests/data/helpers/hub-names.test.ts` (G28, new, also run on the unchanged tree first), `tests/state/client/held-unsaved.test.ts` and `tests/state/sessions/source.test.ts` (G28);".
- **L242:** "Numbered as on main at e61cfc598." becomes "Numbered as on main at a60dcb4fa."
- **L245:** "lines 215-275" becomes "lines 215-276".
- **L252:** replace with "- `tools/oculus/src/lib/state/sessions/source/draft.ts` lines 320-340 (`loadSource`'s limit)".
- **L253:** delete it (the file route does not change).
- **L254:** "lines 110-125 and 600-612" becomes "lines 110-125 and 602-614".
- **L257:** replace with "- `tools/oculus/src/lib/server/machine/lsp/relay.ts`, `relay-options.ts`, and the subfolder of `server/machine/lsp/` its split makes".
- **L266:** "lines 110-120, 230-240, 590-600 and 840-850" becomes "lines 100-102, 215-222, 445-470, 555-575 and 805-815".
- **L269:** "lines 195-215" becomes "lines 203-223". Also "and 530-540 (the F4 walk)" becomes "and 538-548 (the F4 walk)".
- **L271:** add "(`Diff.svelte` split by concern if it passes 520)".
- **L274:** "lines 60-80" becomes "lines 62-82".
- **L276:** "line 191" becomes "line 192".
- **After L284:** add these lines:
  - "- `tools/oculus/src/lib/data/helpers/hub-names.ts` lines 21-33 (item 10)"
  - "- `tools/oculus/src/lib/state/sessions/source/source.svelte.ts` lines 14-16, 46-53 and 216-232 (item 10)"
  - "- `tools/oculus/tests/data/helpers/hub-names.test.ts` (new, G28)"
- **L285:** "line 526, lines 575-576" becomes "line 526, line 553, lines 575-576".
- **L289:** "and 251" becomes "and 253".
- **L290:** "314, 328, 360, 463 and 497" becomes "314, 328, 360, 436, 463, 469 and 497".
- **L305:** "`kit/lsp`, `state/system`, `state/system/machine/lsp` and `tests/server/machine/lsp` are full" becomes "`kit/lsp`, `server/machine/lsp`, `data/prose`, `state/system`, `state/system/machine/lsp` and `tests/server/machine/lsp` are full". Add decision 10: "One disk file is decided by the served roots' real folders by one function of `hub-names.ts` (item 10), used by `unsavedFile`, the page's plan and the YAML hook."
- **L319:** "`ui/Table.svelte`" becomes "`ui/display/table/Table.svelte`".
- **L326:** "`:251`" becomes "`:253`". Add "`DESIGN.md:553`".
- **L327:** after "`src/lib/data/helpers/hub-names.ts` whole;" add "`src/lib/data/helpers/files/yaml/collection-text.ts:1-108`; `data/helpers/files/apps.ts:180-200`;".
- **L328:** "`servers.ts:1-180`, `:520-600`" becomes "`servers.ts:1-200`, `:555-675`". Also "`relay.ts` whole;" becomes "`relay.ts` whole; `relay-options.ts` whole; `uris.ts:40-60`; `library/rules.ts:1-60`;".
- **L330:** "`client.ts:430-560`" becomes "`client.ts:455-590`". Also add "`transport/records.ts` whole" (it is in `transport/`, already "whole").
- **L331:**
  - "`lsp.ts:160-340`, `:430-500`" becomes "`lsp.ts:165-345`, `:440-550`".
  - "`state/client/context.ts:580-610`" becomes "`state/client/context.ts:280-295`, `:440-470`, `:550-575`".
  - Add "`src/lib/state/sessions/source/source.svelte.ts:40-90`, `:195-235`; `state/sessions/source/draft.ts:315-400`; `state/sources/explorer/view/place.ts:46-53`; `data/helpers/files/paths.ts:55-90`; `state/client/writes.svelte.ts:1-30`, `:545-590`".
- **L334:** "G2, G3, G8, G9," becomes "G2, G3, G8, G9, G28,".
- **L355 (report):** "the new titles of G2, G8, G9 and G64" becomes "the new titles of G2, G8, G9, G28 and G64, G28's Code line with the new function's name in place of `diskName`".

**New item 10, inserted after L148 and before "## Cases":**

"10. **One disk file under two names, decided by the roots' real folders** (`plan.md:538`, Step 0 from M6's review over round 1; G28). `diskName` (`src/lib/data/helpers/hub-names.ts:24-33`) names `hub:tools/oculus/config/<name>` as `engine:<name>` by the constant `ENGINE_IN_HUB` (:22) and leaves every other name alone, whatever folder the engine root is served from. Its one caller is `unsavedFile` (`src/lib/state/sessions/source/source.svelte.ts:224-232`), which answers `createWrites`' refusal of a write over a file a tab holds unsaved text of (`state/client/context.ts:288-291`, `writes.svelte.ts:552-561`) and the disabled controls of `EntryCard.svelte:140`, `VenueCard.svelte:105`, `Collection.svelte:131`, `Leads.svelte:106` and `views/boards/focus/rows.ts:81`; so an oculus whose engine root is not the hub's own `tools/oculus/config` (a worktree's server over the main checkout) refuses a write to one of the two files over unsaved text of the other. `diskName` is replaced, in `hub-names.ts`, by one Layer 1 function that decides from the served roots whether two names `{ root, path }` are one disk file: a name stands for its root's `real` folder (its `dir` when the root carries no `real`) joined with its path, and two names are one file when those agree; a name whose root is not among the roots, or whose root's `real` is empty, is one file with itself alone; while the page has not read its roots, (C2). Its callers: `unsavedFile`, given the page's roots (`fs.roots()`, `FsRoot`, `state/sources/explorer/view/place.ts:53`) through `SourceDeps` (`source.svelte.ts:46-53`) from `createSource`'s call (`state/client/context.ts:450`); `edits.ts`'s plan, which matches a tab to a file by it (cases 26, 46); and the YAML hook, which matches an index entry to the address the page holds the file open under by it, over the relay's `ServedRoot`s (`server/machine/lsp/uris.ts:42`) (cases 18, 42). `ENGINE_IN_HUB` stays for the engine schemas' globs (`engine.ts:31`). The function's doc comment and `DESIGN.md:553` say how one file is decided."

**New case 48, after case 47:**

"48. One disk file under two names (item 10), the G28 rows of `tests/data/helpers/hub-names.test.ts`, each over synthetic folders: the engine root served from the hub's own config folder (engine `real` `<hub>/tools/oculus/config`): `engine:layout.yml` and `hub:tools/oculus/config/layout.yml` are one file; the engine root served from a worktree's config folder (engine `real` `<hub>/.agents/worktrees/D39/tools/oculus/config`, hub `real` `<hub>`): the same two names are two files; a configured root inside the hub (`dir` `<hub>/projects/x`): `x:project.yml` and `hub:projects/x/project.yml` are one file; a root whose `real` is empty: its name and the hub's name of the same folder are two files; a root that carries no `real`: its `dir` is used; a root not among the roots: its names compare by root and path; the roots not yet read: C2's answer. And a run through the client state, quoted: a server whose engine root is a worktree's config folder and whose hub is the main checkout, a dirty tab of `hub:tools/oculus/config/layout.yml`, a rail reorder: the `rail` write is sent; with the engine root served from the hub's own config folder, the same reorder is refused with `app.file_unsaved`'s words and nothing is posted."

## 5. Choices the corrections leave open

None of these sets a config key, vocabulary, wire format or public API, except where marked.

- **C1. Where the one-file function lives.**
  - (a) In `hub-names.ts`, replacing `diskName` (`data/helpers` is full at 10, so a new file there is barred). Pro: the module G28 already names; no folder split. Con: `hub-names.ts` gains a roots-aware function beside plain constants.
  - (b) In `data/helpers/files/paths.ts`, beside `pathUnder` and `underServedRoot`. Pro: it sits with the other root-and-path helpers. Con: G28's Code line moves, and that folder is also full.
  - Recommendation: (a). The lazy option is keeping `diskName` and adding a second comparison beside it for D39, which leaves two rules for one question.
- **C2. The page's roots not yet read** (`fs.roots()` is `[]` while the workspaces load, `fs.svelte.ts:491-493`).
  - (a) Fall back to the prefix rule `diskName` applies now. Pro: errs toward refusing a write, which loses nothing. Con: the worktree over-refusal stays for that short window.
  - (b) Compare by root and path only. Pro: simplest. Con: a write over the engine copy goes out while the hub-root tab of the same file is dirty, and the save then meets D28's conflict.
  - (c) Refuse every write until the roots are read. Con: refuses unrelated writes.
  - Recommendation: (a). Lazy: (b).
- **C3. Symlinks below a root.** The page knows only each root's `real`; the server resolves every file (`realPath`).
  - (a) Join the root's `real` with the path on both sides. Pro: one function for page and server, as `plan.md:538` asks. Con: a file reached through a symlinked folder inside a root counts as a different file from its target (a refusal too few, which then meets D28's conflict at save).
  - (b) The server's `Doc.real` for the hook and the join on the page. Con: two rules, against the plan line.
  - Recommendation: (a), with the case named in the function's doc comment. Lazy: (b).
- **C4. The new key's scalar.** M6 made `renderScalar` Layer 1, and its head comment says both layers use it "for every value they put in a file". `node -e` with `yaml.stringify`: `media-x` and `a, b` stay plain; `123`, `null`, `x: y` and `#x` come out double quoted.
  - (a) The brief as written: plain stays plain, and `123`, `null`, `x: y`, `#x` are refused because they do not read back. Con: a second scalar writer beside `renderScalar`, against DRY and that head comment.
  - (b) `renderScalar(newKey, scalar.type)`, as `yaml-edit.ts:712` renames a key, with the read-back check kept. Pro: one writer; those keys rename, quoted. Con: case 22's row 6 stands (`a, b` in a flow list), but case 23's list shrinks to `a, b` in a flow list and G67's rows change.
  - Recommendation: (b), with case 23 and G67 rewritten to match. Lazy: (a), because it keeps a second writer.
- **C5. What `lsp-edit` refuses as closed.**
  - (a) `apps.closed_paths` through `inClosedPaths`, as Z730 O5 says.
  - (b) `privateFolders` (`data/helpers/files/private-folders.ts`: the hub's `secrets` and `~/.oculus`).
  - (c) Both, as `library/rules.ts` refuses on the same channel's read side.
  - Pros and cons: (c) makes the channel's write side refuse what its read side refuses, but costs two checks; (a) alone follows the ruling's words; (b) ignores the configured list.
  - Recommendation: (c), reusing the library rules' predicates. The `behavior.yml:263` comment of `closed_paths` (it names only "`open({ file })` ... for an app") then says it also closes language-server edits. Widening what a config key means is a user-visible shape, so whether `closed_paths` covers `lsp-edit` is Axel's. Z730 O5 was ruled in automode on the false premise that every write route refuses it, so it goes to him as an open item. Lazy: keeping the false premise sentence.
- **C6. The test of the Step 0 function.**
  - (a) G28's own table test `tests/data/helpers/hub-names.test.ts`, with the rail reorder as a quoted run.
  - (b) Rows in `held-unsaved.test.ts` that build the predicate from the source store and roots. Con: that file tests `writes.svelte.ts`, a different unit.
  - (c) No test, a run only. Con: G28's named unit stays without a test.
  - Recommendation: (a). Lazy: (c).

## Declined to judge

- The per-field counts behind 1,115 values. I did not recompute them; the hub diff since the base touches no reference field (section 1 command).
- Whether the rulings Z725, Z730 and Z735 are right on their merits, beyond the premises above.
- Whether the relay split and transport split by concern fit under 880 after D39's additions. Not measured; it depends on the build.
- Whether D36 and D39 can be in flight together. That is the orchestrator's `shared_paths` judgment.

Usage: agent id not known to me; model claude-opus-5-5; tool uses about 85, counted from this session's calls and not by a command.
