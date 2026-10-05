# Step E4 brief check (on main at eba29a18e)

This is the report of the fresh agent from the `spec` skill's "Steps / The brief check", run on `agents/briefs/E4.md` (written at 53908af5c). `git log --oneline 53908af5c..HEAD -- tools/oculus ':!tools/oculus/.scratch'` printed `eba29a18e Refactor layout.yml ...`, `0aea28449 Land D20 ...`, `b07d24766 Land D38 ...`, `ee0407a5a Land X3f ...` and `71017ce60 Land S5 ...`. `git status --short tools/oculus ':!tools/oculus/.scratch'` printed nothing, so every read below is main at HEAD.

The biggest findings, in order of weight:

- **The test plan is out of date.** Axel ruled GA, GC and G1's Code line yes (Z523, plan.md:1247). The brief still says the cases marked "proposed GA/GC" get no test (Decision 16; "The tests of this step").
- **Decision 9 is out of date.** It says the `closed_paths` clash "goes to Axel", but Z521 (plan.md:1245) ruled it as (a).
- **D38 added the open write kind `radar-add`.** The brief's kind list does not have it, and it still says "fourteen open kinds".
- **The scratch server command is wrong.** The built server is `node src/server.ts --engine <dir>`, not `node build`.
- **`data/helpers` already holds 10 items.** Adding `apps.ts` there breaks the ten-item folder rule.
- **The `options.yml` entries need a `heading`.** S5's catalog rule requires `heading`, `section` and `default`, and no HEADINGS word fits apps. The heading is a user-visible choice that nothing names.
- **Four test files are outside the write list but must change:** `context-fixture.ts`, `keys.test.ts`, `write-fixture.ts`, and `file.test.ts` if the new `serveFile` parameter is required.
- **The Document.svelte premises are false after X3f.** The `window.open` at :113 is gone, and `tabOf` is now `tabForKind`, which `read-again.ts` also uses.
- **M1, M2 and M4 have no control run, and they run top-level instead of inside the frame.**

## 1. Names

- `badgeMark` (becomes "a catalog key or a function"). Command: `git grep -n -e badgeMark -- ':!tools/oculus/config/local.yml' ':!tools/oculus/.scratch'`.
  - `tools/oculus/tests/checks/source/keys.test.ts:322: if (registration.badgeMark !== undefined) allowed.add(registration.badgeMark);` is made false. A function is added to the `Set<string>` of allowed keys, which is a type error under the type check in `test:quick`.
  - The same test registers views only through `registerAll` and `registerCollections` (keys.test.ts:24, :38). So `apps.label`, `apps.glyph`, `apps.unapproved_mark` and `apps.editing_mark`, which only an app registration carries, have no reader there, and G24 reports them as orphans unless they are read by a literal elsewhere.
  - `src/lib/views/feeds/linkedin/Linkedin.svelte:11 badgeMark: 'views.linkedin_badge_mark'` stays true, since a key stays allowed.
  - `DESIGN.md:231` ("the words its registration's `badgeMark` names") stays true.
- `registrationLabel` and `registrationGlyph`. Same `git grep`. Hits outside the paths: `Palette.svelte:69,108`, `PaneView.svelte:74-75,197-198,206`, `workbench-title.ts:7,19`, `pages.ts:30,76`, `catalogue.ts:11,178`, `Catalogue.svelte:55-56,183,198`. Each passes a whole `Registration`, so adding the optional `words` and `glyphName` makes none of them false.
- `unregisterView`, `dropView`, `registerCollections`, `registerApps`, `appRegistration`. Hits outside the paths: `tests/checks/config/config-folder.test.ts:31,487,532` and `tests/checks/source/keys.test.ts:24,38` call `registerCollections`, which is unchanged, so neither is made false. keys.test.ts is the G24 problem above.
- The registry map becomes a `SvelteMap`. `grep -rln "navigation/registry" src tests | wc -l` printed `64`. The type does not change, so no importer is made false.
- `app-view` and `app_view`. `git grep` printed only `tools/oculus/DESIGN.md:273` (`app-view`, inside the section E4 rewrites), so nothing is made false.
- `serveFile` (gains the held `folders`). `git grep -n serveFile` printed `tests/routes/files/file.test.ts:14,51` (`serveFile(roots(), key, path)`), outside the paths. It is made false if the new parameter is required, and stays true if it is optional. The brief does not say which.
- `ServerContext` (gains the watcher, `rows`, `findings`, `folders` and the second secret). `tests/server/root/context-fixture.ts:33,53` builds a complete `ServerContext` literal (`const context: ServerContext = {`). It is outside the paths and made false (type error). A3's and D44's diffs both edit this file.
- `WriteTarget` (brief: "`WriteTarget`, `target()`"). `tests/routes/edit/write-fixture.ts:33,68,126` builds a `WriteTarget` literal in `targetOver`, outside the paths. It is made false if a required field is added, which the store folder, the held rows and the `.undo` folder imply.
- `tabOf` (named in the brief's premise for `opening.ts`). It no longer exists: `tabForKind` (opening.ts:50, exported) is used by `src/lib/views/sources/source/read-again.ts:11,38`, outside the paths. If the apps-folder rule goes into `openRow`, `openRowBeside` and `openBookmark` only, read-again.ts's path stays able to open an apps-folder `.html` in the Document view.
- The rail count. `git grep -n -i -e eleven -e twelve -- tools/oculus` hits only `HELP.md:19` among rail sentences, and that line is in the paths. `config/layout.yml:8` ("the digits 1 to 9 showing the first nine") stays true with Apps tenth.
- The channel list. `DESIGN.md:114` is in the paths, and the `+page.svelte` connect list is in the paths.
- `Content-Security-Policy` and `frame-src`. `git grep -n -i` hits only DESIGN.md (in the paths) and `src/lib/server/content/diagrams.ts:32` (its own policy, unaffected). `tests/server/root/hooks-server.test.ts` asserts no header (`grep -n "headers\|it(" ` printed only its one case at :42).

Findings:

- **keys.test.ts:322** and the four app registration keys (G24) need an edit outside the write list, or a design that keeps `badgeMark` a string.
- **`tests/server/root/context-fixture.ts`** must change and is not in the paths.
- **`tests/routes/edit/write-fixture.ts`** must change if `WriteTarget` gains a required field.
- **`tests/routes/files/file.test.ts:51`** breaks if the `serveFile` parameter is required. The brief should say it is optional or list the file.
- **read-again.ts:38** reaches `tabForKind`, outside the three functions item 12 names.

## 2. The step line

The line is `plan.md:624` (the brief cites :617).

- "DESIGN.md's section ... built as ruled (Z93, Z103 (b), Z106 (a), Z107 (b2), Z112 (a))": items 1 to 14 as a whole.
  - Z103 (b) is item 10.
  - Z106 (a) is items 8 (the GET route), 10 (dot-led paths) and 14 (M3, `wss:`).
  - Z107 (b2) is items 10 and 13.
  - Z112 (a) is item 10 (`GET /api/app-open`).
- "machine and root apps": items 1, 2 and 4.
- "the frame on `penpal` (LA18)": items 6 and 7.
- "the channels": item 2 (the `apps` channel), item 3 (`connect` gains `apps`) and item 7 (`read` and `onChannel`).
- "the store and its GET route": items 8 and 9.
- "`open`": item 10.
- "`closed_paths`": items 10 and 13.
- "approval while editing": item 11.
- "the measurements the section says the build owes": item 14 (M1 to M4).

Findings: none. Every part has a requirement.

## 3. Premises

Commands run from `tools/oculus` unless stated otherwise.

- **Nothing of the section exists.** `grep -rln -e "app-store" -e "app-open" -e "appsSettings" -e "AppFrame" -e "penpal" src tests` printed nothing (rc=1). `ls src/routes/apps` printed `No such file or directory`. `grep -n '"penpal"' package.json` printed nothing. Holds.
- **No ADR.** `ls docs` printed `diagrams`, and `ls docs/adr` at the repository root printed `No such file or directory`. `grep -n adr` on `.agents/plan.yaml` and on the state file printed nothing. Holds.
- **penpal.**
  - `npm view penpal version license maintainers time.modified --json` printed `"version": "8.0.1"`, `"license": "MIT"`, `"aaronius <aaron@aaronhardy.com>"`, `"time.modified": "2026-08-14T00:24:18.910Z"`.
  - `npm view penpal@8.0.1 dependencies` printed nothing.
  - `npm view penpal@8.0.1 exports --json` printed an object with `import` (`types ./dist/penpal.d.ts`, `default ./dist/penpal.mjs`) and `require` (`./dist/penpal.cjs`), and no subpath keys. In substance this matches "names only `.`", though the brief's wording omits `require`.
  - From `npm pack penpal@8.0.1`, unpacked in my scratchpad: `grep -n "^import" dist/penpal.mjs` printed nothing; `serializeError` is at :15-20; `createErrorReplyMessage` is at :88-97; `allowedOrigins?.length ? allowedOrigins : [window.origin]` is at :516; `if (source !== this.#remoteWindow) return;` is at :597; the origin test is at :599; `export { ... WindowMessenger ... connect ...}` is at :756. Holds.
- **The roots.**
  - `grep -n "export function browserRoots\|export function repositoryRoots"` printed `25:` and `45:`. browserRoots is :25-36; repositoryRoots is :45-49, where the brief says :44-48. That file is unchanged since 53908af5c.
  - `grep -n "ENGINE_ROOT = " src/lib/server/files/files.ts` printed `242:`.
  - `grep -n "export function workspaceRoots" src/lib/server/files/fs.ts` printed `283:`.
  - `grep -n game-engine config/sources.yml` printed `90:`.
  - Holds.
- **Real paths.**
  - `grep -n "export function" src/lib/server/core/paths.ts` printed `15: inside`, `22: permitted`, `28: below`, `39: realPath`. realPath is :39-45; the brief says :40-46, and it was :39 at the base too (`git show 53908af5c:... | grep -n` printed `39:`). `inside` is :15-19, which holds.
  - `grep -rn "realPath(.*true)" src` printed `processes/read.ts:47` and `:52`, and `portfolio.ts:246`. The brief says :242; portfolio.ts gained 7 lines since the base.
- **The hub.** `channels.ts` has `publish` at :142-149 and `version(channel)` at :48. Holds.
- **The git payload.**
  - `grep -n "export type GitPayload\|export type FilesPayload" src/lib/data/model/model-sessions.ts` printed `661:` and `672:`; the brief says :655 and :666.
  - `watch/git.ts:237` and `watch/bookmarks.ts:76` publish `files`. Holds.
- **The page's channels.** `+page.svelte:177-190` still lists the twelve channels, ending in `'processes'` at :189. `processes/watch.ts:19 const CHANNEL = 'processes';`. Holds.
- **The first frame.**
  - The `untrack` block is :66-71, which holds.
  - The token effect is :74-76; the brief says :75-77.
  - The collections effect ends at :93. The brief's "two new effects after :96" lands inside a doc comment (:95-100).
  - The `+page.server.ts` head comment is at :24-27, which holds.
  - The 403 path: `grep -n "403\|invalidateAll" src/lib/state/client/writes.svelte.ts` printed `502:` and `505-506:`; the brief says :496-497. D20 changed this file (`git diff --stat` printed `28 +++++++++++++++-------`).
- **Registration.**
  - views.ts: `registerModules` :32-40 and `registerCollections` :68-80 hold.
  - registry.ts is 205 lines; Map at :166, `registerView` :169, `unregisterView` :186, `viewFor` :195, `views` :200, `listed` :91, `badgeMark` :101. Holds.
  - The importer count changed from 62 to 64 (`grep -rln "navigation/registry" src tests | wc -l` printed `64`).
  - The navigation folder has 10 items, which holds.
- **Unknown views.** `ui.yml:126` holds. `PaneView.svelte:190` (the brief says :187). `workbench-title.ts:18` holds.
- **The guard.** `handle` is at :65-91, `UNGUARDED` :15, `HEADERLESS` :23. `allowedOrigin` is `auth.ts:29-38`; the brief says :28-37. Holds otherwise.
- **The file route.** `serveFile` is at :216-226, `typeOf` :66, `CACHE` :59. Holds.
- **The frames: changed.**
  - `wc -l Document.svelte` printed `204`; the brief says 169.
  - `grep -n "iframe\|contextmenu\|window.open"` printed the iframe at :169-176, the contextmenu listener at `140: frame?.contentDocument?.addEventListener('contextmenu', inFrame);` and **no `window.open`**. The brief's "opens its own address with `window.open(src, '_blank', 'noopener')` at :113" is false on main. That control moved to `pages.ts:506` and `row-menu.ts:524` (`window.open(fileBytesUrl(...), '_blank', 'noopener')`).
  - Document.svelte now also has `keyInFrame` (:117-133), which re-raises Cmd and Ctrl keys from its frame.
  - `File.svelte`'s iframe is at :220 (the brief says :238).
  - `grep -rln iframe src` now also lists `src/lib/shell/panes/PaneBody.svelte` (:159, `inputOf` gives the keyboard to a tab's `iframe`).
  - The DESIGN.md section's own references `Document.svelte:113`, `:125` and `:153-160` (rewritten by X3f) do not match the file either.
- **The key handler.** `grep -n "svelte:window" src/lib/shell/Workbench.svelte` printed `290:`; the brief says :281.
- **Opening: changed.**
  - `wc -l opening.ts` printed `110`; the brief says 85.
  - `tabOf` is now the exported `tabForKind` at :50-61, sending `html` to `document` at :57. `openRow` is :68-81, `openRowBeside` :84-88, `openBookmark` :98-110 (`.html` to Document at :105-106).
  - `tabForKind` is also called by `views/sources/source/read-again.ts:38`. That landed with X3f (`git log` printed `ee0407a5a`).
- **Writes: changed.**
  - `wc -l writes.ts` printed `556`; the brief says 542.
  - `handleWrite` is at :268 and the token check at :274, which holds.
  - `grep -o "answer(.*'[a-z-]*'"` printed the brief's list plus **`answer(outcome, 'radar-add'`** (writes.ts:463, landed with D38). DESIGN.md's open list now holds `radar-add` (DESIGN.md:326).
  - The `settled('` kinds hold.
  - `collectionFile` moved to `src/lib/server/files/fs/collections.ts:30` and is re-exported at writes.ts:175; the brief says `writes/entries.ts:65-75`.
  - `undo.ts:228` and `manifest.ts:482` hold. `feeds.ts:270` and `:323`; the brief says :265 and :318.
- **The routes.** `ls src/routes/api/*/` now also shows `(docs)/literature` (D38). Holds otherwise.
- **Approvals.** approvals.ts is 139 lines and unchanged since the base: `entryShape` :35, `isApproved` :92, `privateFolder` :102, `approveTexts` :113. `grep -rn "api/approve" src` printed nothing. Holds.
- **The configuration: changed after S5 and D38.**
  - `grep -n "^apps:" config/behavior.yml` printed nothing, which holds.
  - behavior.yml is now 201 lines, with `literature:` at :183 and `open:` at :190; the brief says it ends with `open:` at :183.
  - `changes.keep` is at :158, which holds.
  - `mailSettings` is now `settings.ts:323`; the brief says :194-200.
  - `behaviorFindings` is now `catalogs.ts:163`; the brief says :176.
  - `LOCAL_KEYS` is now `local.ts:130-150` (ending `'literature'`); the path keys are at :380-381; the brief says :108-127 and :303-318.
  - `options.yml`: `local.yml:` is at :1205 and `mail_dir` at :1257, followed by seven `literature.*` entries to :1280. `behavior.yml:`'s entries run :170-663. The brief says :686 and :721, with `mail_dir` last.
  - **S5's rule as it now stands** (`settings.ts:1-10` head comment): "a key that is missing is the entry's `default`, and a key whose value the rule refuses is the `default` too and comes back as a problem naming the key". `PROBLEM_READERS` is at :447-466, and `settingProblems` at :472.
  - **options.yml:9 says every entry outside local.yml holds `description`, `heading`, `section`, `default` and `control`.** `HEADINGS` (catalog/options.ts:55-66) is `appearance, editor, terminal, sessions, cluster, boards, rail, presentation, sources, calendar`. A missing or unknown heading is `findings.options.heading_missing` or `heading_unknown` (option-findings.ts:48-51).
  - The brief's "S5 with Q119 (repair round 1 in flight)" is now on main as just described.
- **Layout.** layout.yml has `rail:` at :9 (entries :10-20), `nav_groups:` :24 (:25-35), `direct_chord: v` :39, `arrangements:` :43 and `floats:` :114. Holds. eba29a18e moved tabs inside the help and views arrangements without changing the line count.
- **Glyphs.**
  - `grep -n "^  app:\|^  app_view:\|^  app-view:"` printed nothing, and `grep -c` of hyphenated names printed `0`. Holds.
  - Underscore names: `40` (the brief says 38).
  - `edit` :29, `lock` :82, `page` :128 (the brief says :27, :79, :125).
  - `ls node_modules/lucide-static/icons` holds both `blocks.svg` and `app-window.svg`.
  - **Not stated in the brief:** `grep -n "blocks\|app-window" config/catalogs/icons.yml` printed `17: open_program: app-window`. So `app_view` would draw the same icon as Open in Program. That mapping was already present at the base (`git log -S` printed a5bcb7af4).
- **Theme.** `tokensCss` is imported at `theme.ts:14` and `WALL_CLASS` is at :33; the brief says :12 and :31.
- **Notices.** notices.svelte.ts is 97 lines and `allFindings` is at status.ts:224. Holds.
- **Folder counts** (`ls -A <f> | wc -l`). Same as the brief except `src/lib/server/machine` is `8` (was 7) and `src/lib/data/sources/config` is `10` (was 9).
  - **Not in the brief:** `src/lib/data/helpers` holds `10` items at the base and at HEAD (`git ls-tree --name-only 53908af5c tools/oculus/src/lib/data/helpers/ | wc -l` printed `10`). Item 1's `src/lib/data/helpers/apps.ts` makes it 11, against agents/spec.md's ten-item rule.
- **Sizes** (`wc -l`), brief value first:
  - context.ts: 732 then 737
  - writes.ts: 542 then 556
  - model-sessions.ts: 853 then 859
  - model/index.ts: 520 then 546
  - writes.svelte.ts: 585 then 595
  - client context.ts: 497 then 505
  - undo.ts: 389 then 393
  - bodies.ts: 441 then 454
  - `+page.svelte` 221 and changes.ts 320 hold.
- **Other moved lines.** The token is minted at `context.ts:294` (the brief says :289). The client registry is at `state/client/context.ts:443` (the brief says :436). `target()` is writes.ts:225-262.
- **Chrome.** `ls -d "/Applications/Google Chrome.app"` printed the path. Holds.
- **Guarded tests.** All six files exist. `describe('mailSettings'` is at settings.test.ts:336; the brief says :93.
  - settings.test.ts runs each reader over a synthetic catalog (:1-8, `describe('the synthetic catalog'` at :120) and has a case "the shipped files" (:535-575) that lists every wrong key from `wrong-settings.ts`.
- **The plan and state lines the brief cites have moved.**
  - plan.md: E4 is :624 (brief :617), Z93 :777 (:770), Z112 :787 (:780), Z107 :792 (:785), Z103 :795 (:788), Z106 :796 (:789).
  - Z467 is at `orchestrator-state.md:124` (brief :125) and Z488 at :122 (brief :123).
- **Rulings since the brief.** `sed -n 1240,1286p plan.md` printed:
  - `Z521 ... (a): a missing or wrong closed_paths closes every file target to apps, with a finding.`
  - `Z522 ... no package beside penpal 8.0.1.`
  - `Z523 ... yes to GA, GC and G1's Code line; written into agents/guarded.md before E4 is dispatched.`
  - `Z520` (E4's choices: the rail place, the glyphs and icons, the limits, `allow-downloads`, `not_declared`/`closed`).
  - `grep -n "GA\b\|GC\b" agents/guarded.md` printed nothing, and G1's Code line (`agents/guarded.md:8`) does not name `approve` yet.
- **S5, X3f, D38 and D20, which the brief treats as in flight:**
  - S5 landed at 71017ce60: the reader rule above, `options.yml` rewritten (1280 lines), the readers moved.
  - X3f landed at ee0407a5a: `opening.ts` restructured, Document.svelte rewritten (no `window.open`, `keyInFrame`), PaneBody focuses an `iframe`, the section's :307, :326 and :336 changed.
  - D20 landed at 0aea28449: `writes.svelte.ts` is 595 lines, `collectionFile` moved.
  - D38 landed at b07d24766: `radar-add`, `literature:` in behavior.yml and options.yml, `literature` in LOCAL_KEYS, `(docs)/literature`.
  - So the brief's "E4 is dispatched after X3f lands" and "after S5 lands" are both met.
  - DESIGN.md: the section is now :249-341 (`grep -n "^## "` printed `249:## Apps added while oculus runs` and `342:## Relationship to the cockpit`). E4's path :149 is now :151.
  - HELP.md: `## Source Control` is now :201, so E4's :198 is now :200. Its :267 is now :269 (the behavior.yml row) and its :282 is now :284 (local.yml). :19 holds.
  - options.yml: "before :396" is now before :664, and "after :722" is now after :1280.

Findings:

- **Document.svelte.** The `window.open` at :113 is gone. The file is 204 lines, its iframe at :169-176, its listeners at :140-141. Item 6's "beside :103-113" must point at `loaded()` (:139-142), and its "as its own control does" should cite `pages.ts:506` or `row-menu.ts:524`.
- **opening.ts.** `tabOf` is now `tabForKind`, the file is 110 lines, and read-again.ts uses it.
- **`radar-add` is missing from the kind list,** and "fourteen open kinds" (item 13) is now fifteen.
- **S5's rule.** `appsSettings` should join `PROBLEM_READERS`. The `options.yml` entries need `heading`, `section` and `default`, and no HEADINGS word fits apps.
- **`data/helpers` holds 10.**
- **Line moves:** `mailSettings`, `behaviorFindings`, `LOCAL_KEYS`, `options.yml`, behavior.yml's end, writes.ts and the other sizes, `GitPayload`/`FilesPayload`, `realPath`, `repositoryRoots`, `allowedOrigin`, the token effect, the 403 path, the Workbench key handler, PaneView, File.svelte, `theme.ts`, the glyph line numbers and the 40 underscore names, the 64 importers, the two folder counts, the plan/state line numbers, the DESIGN.md and HELP.md path lines, and "after :96".
- **The test plan, Decision 16 and Decision 9 predate Z521 and Z523.** "Listed for Axel" on Decisions 5, 6, 10, 11 and 17 is now Z520.
- **`open_program` already draws `app-window`** (icons.yml:17). Z520 ruled `app_view` to `app-window` without that fact in the brief.

## 4. Cases and checks

- **Cases marked "proposed GA" (C1-C21, C30-C36, C40, C58-C59, C63-C73, the approve route of C75-C77, C81) and "proposed GC" (C54).** These are inconsistent with agents/spec.md, "What every package obeys", test rule: "An entry keeps one test per unit it covers: each API route, write kind, config reader, parser, client store ...". GA and GC now stand by Z523, so their units need tests: the manifest reader, `routes/apps`, the three `(apps)` routes, `app-gate.ts`, the page methods and root parts, and the store cache. Quoted runs in their place break that rule.
- **C76 "without the token: 403".** Under G1's widened Code line (Z523) this is a G1 test row, and the brief keeps no test for it.
- **C40** ("run, a client test of the methods module"). This is inconsistent with agents/spec.md: "A behaviour that needs a DOM ... is seen at the look on landing. The unit suite renders to a string" and `*.client.test.ts` "runs in Svelte client runtime with no DOM". A message from a second frame, another tab or the page's own window needs real windows. Without a DOM, the only thing testable is penpal's own `source` check.
- **C74 under "Test G13".** G13 reads "A wrong config value is refused with a finding that names the key, and its default is used" (`agents/guarded.md:101`). C74 asserts "every `file` target `closed`", which Z521 rules but G13's sentence does not cover. The finding half fits G13; the "closed" half belongs with GA's open checks. Otherwise G13's text needs Axel's widening.
- **C82** "by the rule `settings.ts` holds at the base" is now concrete. Default is the `options.yml` entry's `default`; the problem is `{ key: 'apps.writes_per_min', where: 'value' }`. The case should say so, since the synthetic-catalog pattern of settings.test.ts:1-8 is what catches a default written in code.
- **C48** "the not-JSON word". No such word exists in the section's list (DESIGN.md:320), so the case cannot be checked as written.
- **C49, C55 and C56 write under `~/.oculus/app-data/` and `.undo/`.** agents/spec.md, "Where you work", says: "Tests use synthetic fixtures in a temporary directory and assert the resolved path is inside it before any write". Item 9 hardcodes `~/.oculus/app-data/.undo/`. The case needs the folder to come from a parameter or a configured path, and the brief names none.
- **All other cases** (C22-C29, C37-C39, C41-C47, C50-C53, C57, C60-C62, C75, C77-C80, C83, M1-M4) are consistent with agents/spec.md.

Findings:

- **The proposed GA/GC cases and C76** must become tests under GA, GC and G1 (Z523).
- **C40** cannot be a DOM-less client test.
- **C74** does not fit G13's sentence.
- **C48** names an undefined word.
- **C49, C55 and C56** need the store and undo folders injectable so the tests stay in a temporary folder.

## 5. The question

"The goal" here is the section built and holding in the code, with its measurements in it.

- **C1-C18: no.** Each is an input to the manifest reader with an exact finding key or row.
- **C19: partly.** A run of the reader alone passes with `registerApps`' `words` wrong. The catalogue words come from the registration, so the run must exercise `registerApps`, and the brief does not say so.
- **C20, C21: no.**
- **C22-C29: no.** Each is observed on a running server or at the look.
- **C30-C36: no.** curl against the route with exact status and headers.
- **C37: no.**
- **C38, C39: no** (look).
- **C40: yes.** A DOM-less test can only drive penpal's `source !== remoteWindow` check (`dist/penpal.mjs:597`). It passes while the page wires `remoteWindow` or `allowedOrigins` wrongly, since nothing in it posts from a real second window.
- **C41-C43: no.** These are pure method checks with exact words and payloads.
- **C44-C47: no** (look).
- **C48: yes.** A direct call to `setState` with a function passes, but a function cannot cross `postMessage` (structured clone throws in the app before the page sees it), while a cycle does cross and must be refused with a word nobody has named. The case can pass without the bridge path being checked.
- **C49-C66, C68-C80: no.**
- **C67: yes for its last clause.** A quoted run sees `closed` whether or not the route statted the file first. "The existence of the file is never read before the answer" needs an injected file system or an order check.
- **C81: yes for the view half.** It passes with `openRow`, `openRowBeside` and `openBookmark` changed, while `read-again.ts:38` (via `tabForKind`) and the Document-view links (`RailFoot.svelte:56`, `card.ts:85`, `CardDocs.svelte:81`, `EntryCard.svelte:225`, `Lanes.svelte:151`) still open an apps-folder `.html` in the Document view. Item 12's `text/plain` answer keeps a script from running there, but the section's "never opens in the Document view, from ... a link" is not met.
- **C82, C83: no.**
- **M1 (WebRTC), M2 (DNS prefetch) and M4 (download): yes.**
  - Each runs once, with no control run of the same probe served without the policy and outside a sandbox. So "no datagram", "no host resolution" and "no connection" cannot be told apart from a headless Chrome that never sends them in this setup.
  - M2 in particular: headless and automated Chrome may not prefetch DNS at all.
  - All four load the probe as the top-level document (`--dump-dom <the probe's address>`). The iframe drawn by `AppFrame.svelte`, with its `sandbox` attribute under the page's `frame-src 'self'`, is never exercised, and that is the case the section's sentences are about.
- **M3: no.** A `securitypolicyviolation` event and a listener connection are each a positive signal.
- **The step line's check.** The plan line has none of its own. The verification list (`test:quick`, sizes, the ASCII gate) passes without the behaviour, so the goal rests on the cases; this is answered by the cases above.
- **Items 1-5 and 7-13: no.** Each has cases with exact results.
- **Item 6: yes for one sub-part.** "Nothing painted, `color-scheme` from the body" has no case, so the frame can ship without `color-scheme` and pass.
- **Item 14: yes.** See M1, M2 and M4.

Findings:

- C40, C48 and C67's last clause.
- C81's view half.
- C19 unless the run names `registerApps`.
- Item 6's `color-scheme`.
- M1, M2 and M4: no control, and not measured inside the frame.

## 6. Implied inputs

Missing from "Cases", each with the result the section or main implies:

1. **`writes: [radar-add]` and `write('radar-add', body)`.** Expected: offered; written without a Confirm; undoable; worded by `apps.write.radar-add`. This is an open kind on main since D38, and the brief's kind list and count lack it.
2. **`reads: [schedule]` once A3 (in flight) lands its `schedule` channel.** Expected: refused before approval, by "A channel added to oculus is closed to apps until this section names it", as `channel_closed` naming "every app" with `findings.apps.carries.schedule`. The carries list (item 13) lacks it, and whichever of A3 and E4 lands second must add it.
3. **`setState` or `setStore` of a value structured clone carries but JSON does not** (a cycle, `undefined`, `NaN`, a `Map`, a `Date`). Expected: a rejection by a named word. No word is named.
4. **A source tab of `<root>/.oculus/apps/notes/index.html` read again after it was missing** (`read-again.ts`). Expected: it stays a source tab.
5. **A rail document mark, a card's or entry's docs link, or a Lanes link naming a file in an apps folder.** Expected: never the Document view, or at most a frame answered as `text/plain` with nothing run.
6. **"Open in a browser tab" (`row-menu.ts:524`, `pages.ts:506`) on an apps-folder `.html`.** Expected: `/api/file` answers `text/plain; charset=utf-8` with `nosniff`, and nothing runs.
7. **A frame destroyed while a call is in flight** (a `write` waiting on its Confirm, an `open` waiting on `/api/app-open`, a `getStore` waiting on its fetch, an `onChannel` in flight). Expected: no reply to the destroyed bridge, nothing written after the frame is gone, no notice. agents/spec.md asks for "every asynchronous path in flight, after close, and superseded".
8. **The apps watcher's debounce or two-second timer firing after `close()`.** Expected: nothing published and no handle left.
9. **Two tabs of one app calling `setStore` at once.** Expected: two writes, each recorded; the file holds the later value; one `storeVersion` push per write.
10. **A write with `x-oculus-app` naming no held row, or holding a malformed escape.** Expected: refused (403 `{ error: 'kind' }` or a stated status) with nothing written. No result is given.
11. **A root key holding `/`** (`a/b`). Expected: id `app:a/b/todo`, address `/apps/@a%2Fb/todo/<key>/index.html`, header `x-oculus-app: app:a%2Fb/todo`. The section says such a key parses; C20 covers only a space.
12. **A HEAD request for an app file and for `/apps/-/penpal.js`.** Expected: the headers of the GET with no body. The section allows GET or HEAD; C31 and C35 test only POST.
13. **An unreadable `app.yml`, an unreadable recorded file at serve time, and an unreadable store file.** Expected: a finding naming the file; an empty 404; counted absent (0 and `''`). Only the folder case of C52 is listed.
14. **`apps_dir` naming a file rather than a folder.** Expected: no apps, and either a finding or none (state which).
15. **The folder `setStore` writes to and the `.undo` folder, in a test.** Expected: resolved from a parameter so G8 and G9 write under a temporary folder.
16. **The `options.yml` entries of the `apps.*` limits.** Expected: listed in the Settings view under a named heading, with no `findings.options.heading_missing` or `heading_unknown` (G12). The heading is a user-visible choice the brief does not make.
17. **`GET /apps/-/penpal.js` on the dev server Axel runs (`npm run dev`, state file "Where things are").** Expected: 200 with the bytes of `dist/penpal.mjs`. Vite 8.3.0's module runner implements `import.meta.resolve` through a Node customization hook (`node_modules/vite/dist/node/module-runner.js:769`) and throws `"import.meta.resolve" is not supported` when the hook cannot register (:784). The landing look runs under dev, so this needs its own case.

Findings: items 1 to 17 above are each missing.

## 7. ADRs

- No record: `ls docs/adr` at the repository root printed `No such file or directory`, `ls tools/oculus/docs` printed `diagrams`, and neither `.agents/plan.yaml` nor the state file has an `adr` key.

Findings: none.

## 8. Dictated text

- `{ label: "Apps", glyph: app, page: apps }`. Found by `grep -n 'label: "Apps", glyph: app, page: apps' agents/briefs/E4.md` (`57:`). Holds.
- `apps: { label: "Apps", glyph: app }`. Found by `grep -n 'apps: { label: "Apps", glyph: app }' E4.md` (`57:`). Holds: layout.yml:23's rule that a group's heading glyph is "one no view of the group carries" holds, since app views draw `app_view` or their own glyph and a manifest `glyph: app` is refused (C13).
- `apps: { root: { kind: pane, view: [] } }`. Found by `grep -n "apps: { root: { kind: pane, view: \[\] } }" E4.md` (`57:`). Holds.
- The `apps:` block values `connect_timeout_s: 10` ... `closed_paths: [secrets]`. Found by `grep -n "connect_timeout_s: 10" E4.md` (`67:`). Holds: they equal the section's values. The comment lines are not dictated.
- The stand-ins `[A]` and `[a]` and the icons `blocks` and `app-window`. Found by `grep -n 'stand-in \`\[A\]\`' E4.md` (`283:`). Holds against the ASCII and glyph rules (`grep -n '"\[A\]"\|"\[a\]"' glyphs.yml` printed nothing). See section 3 for the `app-window` collision with `open_program`.
- `<iframe sandbox="allow-scripts allow-downloads" allow="" referrerpolicy="no-referrer">` and `Content-Security-Policy: frame-src 'self'`. Found by `grep -n` (`60:`, `127:`). Holds, read whole as code.
- The headers `x-oculus-app` and `x-oculus-write-kind`, and `{ error: 'kind' }`. Found by `grep -n "x-oculus-write-kind" E4.md` (`63:`, `153:`). Holds.
- `"penpal": "8.0.1"`. Found by `grep -n '"penpal": "8.0.1"' E4.md` (`282:`). Holds (Z522).
- The `options.yml` entries `control: number`, `whole: true`, `min: 1`, and `max` 2147483 for `connect_timeout_s`. Found by `grep -n "max\` except \`connect_timeout_s\`" E4.md` (`288:`). The words hold: `max` is the longest timer in whole seconds. The entry is incomplete, though: `options.yml:9` and `option-findings.ts:48-51` require `description`, `heading`, `section` and `default` for an entry outside local.yml. As dictated, the entries give `findings.options.heading_missing`, which fails G12.
- `apps_dir` "in the words of `calendar_dir`". Found by `grep -n "in the words of \`calendar_dir\`" E4.md` (`67:`). Holds: options.yml:1251-1253's sentence fits with `~/.oculus/apps`, and "A change is read again at once" is true by item 2.
- `describe('appsSettings')`. Found by `grep -n "describe('appsSettings')" E4.md` (`202:`). Holds: no history word.
- The probe lines `<link rel="dns-prefetch" href="//e4-probe.test">`, `iceServers: [{ urls: 'stun:127.0.0.1:3478' }]`, `new WebSocket('wss://localhost:9443/')`, `<a href="http://127.0.0.1:9444/x" download>`, and the Chrome command line. Found by `grep -n` (`72:`-`76:`). They hold as code in a scratch probe; section 5 covers the missing control and frame.
- The server start "`node build` started with `--engine <scratch>/engine`" (`69:`). This breaks a fact of the tree.
  - `HELP.md:344` says "The built server is `node src/server.ts`, and its one argument is `--engine <dir>`".
  - `src/server.ts:19-23` parses `--engine`.
  - `node build` runs adapter-node's own entry, which ignores `--engine`, and every request then throws `'oculus server context is absent from event.platform.req'` (`context.ts:731-737`).
  - The command must be `node src/server.ts --engine <scratch>/engine`.

Findings:

- The options entries, as dictated, lack `heading`, `section` and `default`.
- `node build` must be `node src/server.ts`.

## Shared paths

A3's and D44's diffs were read in their worktrees (`git diff HEAD -U0` in `.agents/worktrees/A3` and `.agents/worktrees/D44`, both at base 6044d753c). O30 has no worktree yet, so it was read from `agents/briefs/O30.md`'s write list, numbered at 94bb9b3a8. `git diff --stat 94bb9b3a8 53908af5c -- +page.svelte DESIGN.md` printed nothing, so its lines are as at the base. E4's lines are given at HEAD.

E4 and A3:

- **`src/routes/+page.svelte` :189.** A3 turns `'processes'` into `'processes',` and adds `'schedule'`; E4 adds `'apps'` at the same place. One-line conflict, both only adding to one list: simple, keep both.
- **`DESIGN.md:114`.** A3 adds `` `schedule`, `` to the channel sentence; E4 adds `apps`. Both only add: simple.
- **`HELP.md:269`** (the behavior.yml row). A3 adds the `tasks:` words; E4 adds the `apps` block. Both only add: simple.
- **`settings.ts`.**
  - A3 rewrites `heldAt` (:67-93), adds a reader after :445, and edits the last line of `PROBLEM_READERS` (:465).
  - E4 adds `appsSettings` beside `mailSettings` (:323) and, under S5's rule, a `PROBLEM_READERS` entry.
  - The list is a both-add, so simple. A3's rewrite of `heldAt` is in a hunk E4 does not touch.
- **`settings.test.ts`.** A3 changes 108 lines; E4 adds a describe, and rows of the shipped-files list if it adds wrong apps keys. Both add: simple.
- **`wrong-settings.ts`.** A3 writes :6-27. E4 needs it only if it adds apps keys to the shipped-files case, and the file is not in E4's paths.
- **`options.yml`.** A3 writes :11 and :389-423; E4 writes the end of `behavior.yml:`'s entries and the end of `local.yml:`'s. Separate hunks: simple.
- **`behavior.yml`.** A3 :90-96; E4 the end. Simple.
- **`findings.yml`.** A3 :102 and :119-120; E4 the end. Simple.
- **`context.ts`.** A3 adds lines at :36, :78, :124, :220, :241, after :290, :400-454 and :487; E4 adds the watcher, the secret beside :294, and `close()`. Both add, and the `close()` list is a both-add: simple.
- **`context-fixture.ts`.** A3 adds 6 lines; E4 needs it but does not list it. Both add: simple.
- **`state/client/payloads.ts`, `entities.svelte.ts`, `state/client/context.ts`.** Both add their own entry: simple.
- **`data/model/index.ts`.** A3 reshapes the `model-processes` export at :535 into a block; E4 adds its own types elsewhere. Simple.
- **`package.json`.** Each adds one dependency: simple. `package-lock.json` is regenerated with `npm install` at landing.
- **`docs/diagrams/`.** Regenerated at landing.

E4 and D44:

- `context.ts`: D44 adds after :63, :141, :437, :463 and :486. Both add: simple.
- `context-fixture.ts`: D44 adds :13 and :101. Both add: simple, with E4's path missing as above.
- `glyphs.yml` and `icons.yml`: D44 adds `submit_job` at :21 and one icon row; E4 adds two rows each. Simple.
- `findings.yml`: D44 :152; E4 the end. Simple.
- `package.json` and the lockfile: simple, as above.
- HELP.md (D44 :49, :146) and DESIGN.md (D44 :128, :135) are disjoint from E4's lines: simple.

E4 and O30:

- **`+page.svelte`.** O30 writes :40-50 and :185-195; E4 writes :35 (the import), :66-71, after :93, and :177-190. The ranges overlap at :185-190. The merge is simple only if O30's hunk starts at :191 (`takeCarried`) or later, with `]);` at :190 left between the two. O30's brief does not fix that, and its brief check said the same (`O30-brief-check.md:216`).
- **`DESIGN.md` :305 and :322 at O30's base** (now :307 and :324, "The frame" and "What an app keeps"). O30 rewrites them to say "a popped-out window is a page of its own, which mounts its own frame and makes its own fetch of an app's store". E4 rewrites the whole section :249-341 as built, including the Document references in "The frame" and the measured results. **Not simple:** each step rewrites lines the other changes.
- **`state/client/context.ts`.** O30 :204; E4 :443. Simple.
- **`package.json` and the lockfile.** Simple, as above.
- **HELP.md.** O30 :3, :11-15, :40, :43, :155 and :340; E4 :19, :200, :269 and :284. Simple.
- **Dependencies, not shared paths.** O30 writes `state/workbench/drag.svelte.ts` and `shell/Workbench.svelte`, which E4 reads: AppFrame's `pointer-events: none` reads the tab-drag state, and `key()` dispatches to the `svelte:window` handler. A change of either API by O30 reaches E4's code without a shared-path conflict.

The brief's own shared-path section still treats X3f, S5 and D20 as in flight (E4.md:269-272). It calls `DESIGN.md:114` and `HELP.md:267` with A3 "not simple", while the state file (:219) recorded them as simple. Both of A3's changes there only add, so they are simple under the definition used here.

## Declined to judge

- **Whether `app-window` for `app_view` should stand,** given `open_program` already draws it. That is Axel's; Z520 ruled it without that fact.
- **Which Settings heading the `apps.*` limits go under,** or whether HEADINGS gains `apps`. This is a user-visible shape, and it is Axel's or the orchestrator's under automode.
- **Whether Vite 8.3.0's `import.meta.resolve` works under `npm run dev` on this machine.** Settling it needs a run of the dev server, which this check may not start.
- **Whether headless Chrome 's DNS prefetch, STUN to 127.0.0.1 and `download` click behave as the probe assumes.** Settling it needs Chrome runs, which this check may not make.
- **Whether `__data.json`'s encoding gives the token to a plain `curl`** as item 14 assumes. Settling it needs a running server.
- **Whether O30's change at `+page.svelte:185-195` touches the connect list.** O30 has no diff yet.

Agent usage: aeb43ede13fd69892, claude-opus-5-5, 315,721 tokens, 114 tool uses, 17.3 min (from its completion notice).

## Closed

- Left to the session.
