Everything in the brief is done. One unrelated slow test fails on the unchanged tree as well as on this one: `tests/server/core/paths.test.ts` ("are written nowhere under src") matches `insideFolder` in `src/lib/state/sources/repositories/change-tree.ts`, a file this step does not touch (`npx vitest run tests/server/core/paths.test.ts` in the unchanged copy: 1 failed, 8 passed).

# Q85a4 report: zod schemas at the untyped inputs of the server's machine, accounts, files, content and git folders

Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85a4`, oculus at `tools/oculus`. Node: `export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. Scratch (outside the tree): `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/Q85a4/`, holding `src-orig` (the unchanged `src`), `unchanged/` (the unchanged tree with the new tests copied in, `config/local.yml` left out), `timing.ts`, the before and after lists and the raw outputs quoted below.

## Open items of the state file (verbatim, `orchestrator-state.md`, section "Open items")

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z138 (raised 2026-10-01 03:36, step X3d, its builder's open item A). Your ruling of 2026-09-25 says Seti's own table and colours, and X3d's round-0 ruling 4 draws them as `--seti-*` tokens set to `seti-ui`'s `ui-variables.less` values in every theme. Its premise that one set serves every theme is wrong: VS Code's Seti theme carries a `light` set (238 extension, 98 filename and 82 language entries; the default file icon `#d4d7d6` dark, `#bfc2c1` light), and on oculus's light panel Seti's own colours measure a contrast of 1.45 for white, 1.73 for yellow (every `.json`) and 2.13 for green (the builder's report, `agents/reviews/X3d-report.md`). (1) Keep Seti's colours in every theme. For: your ruling's words exactly. Against: icons on the light themes are hard to see, `.json` worst. (2) Copy VS Code's light values. For: what VS Code shows. Against: breaks the brief's rule that no VS Code hex is copied. (3) Keep Seti's values on the dark themes and set each `--seti-*` token on the light themes to a darker value derived from the same colour in `themes/derive.ts`, as other light tokens are derived. For: Seti's colours where they were made for, readable icons everywhere, no copied hex. Against: the light theme's icon colours are oculus's, not Seti's. Recommendation: (3). The lazy option is (1). What waits: only the light-theme colours of X3d's icons. X3d landed at 06:19 with Seti's colours in every theme, as (1) reads; a ruling of (3) or (2) is a change on top of it, folded into U2's fixes or the next step that touches `themes/`.

## The cases' first run on the unchanged tree

The 28 test files of the brief's Cases section and path list (`tests/routes/files/open.test.ts` among them gained no case: its existing cases already hold `path` of the wrong type) were run against the unchanged `src` with the new cases in place: `cd unchanged && npx vitest run <the 28 files> --reporter=json`. Result: 640 passed, 4 failed. After the change, the same command in the worktree, with one case more (the `scalarShape` case of `audit.test.ts`, which imports a name that exists only after the change): 645 passed, 0 failed. The four that fail before and pass after, each with the reason:

| Test file | Case | Why it fails on the unchanged tree |
| --- | --- | --- |
| `tests/server/machine/usage/refresh.test.ts` | the settings the refresher requires, read as one value: answers the two settings as a number and a string | `requireRefreshSettings` answered nothing (item 7, marked "after the change" in case 13) |
| `tests/server/root/context.test.ts` | throws the same sentence before a replaced refresher is started | `context.ts` did not call `requireRefreshSettings` itself (item 7, case 26) |
| `tests/server/accounts/mail/triage.test.ts` | holds the notes of a file with a `__proto__` note under the plain object prototype | the prototype of `notes` was the `__proto__` note (item 13, case 19) |
| `tests/server/machine/pty/compose.test.ts` | composeRequest of a body that is no map: starts a shell with nothing in it | `composeRequest(null)` threw `TypeError: Cannot read properties of null (reading 'agent')`; it now takes `unknown` (see "Changed behaviours", the one unmarked case) |

Every other case passes on both trees, per file (before / after, passed):

| File | Before | After |
| --- | --- | --- |
| `tests/routes/docs/memories.test.ts` | 26 passed, 0 failed | 26 passed, 0 failed |
| `tests/routes/docs/wallpaper.test.ts` | 17 passed, 0 failed | 17 passed, 0 failed |
| `tests/routes/files/file.test.ts` | 25 passed, 0 failed | 25 passed, 0 failed |
| `tests/routes/files/open.test.ts` | 25 passed, 0 failed | 25 passed, 0 failed |
| `tests/routes/files/source.test.ts` | 20 passed, 0 failed | 20 passed, 0 failed |
| `tests/routes/git/deposit.test.ts` | 8 passed, 0 failed | 8 passed, 0 failed |
| `tests/routes/git/git.test.ts` | 34 passed, 0 failed | 34 passed, 0 failed |
| `tests/routes/sessions/terminal.test.ts` | 17 passed, 0 failed | 17 passed, 0 failed |
| `tests/server/accounts/calendar/providers.test.ts` | 9 passed, 0 failed | 9 passed, 0 failed |
| `tests/server/accounts/calendar/routes.test.ts` | 7 passed, 0 failed | 7 passed, 0 failed |
| `tests/server/accounts/connect/rows.test.ts` | 18 passed, 0 failed | 18 passed, 0 failed |
| `tests/server/accounts/mail/plate.test.ts` | 17 passed, 0 failed | 17 passed, 0 failed |
| `tests/server/accounts/mail/routes.test.ts` | 16 passed, 0 failed | 16 passed, 0 failed |
| `tests/server/accounts/mail/triage.test.ts` | 10 passed, 1 failed | 11 passed, 0 failed |
| `tests/server/content/audit.test.ts` | 54 passed, 0 failed | 55 passed, 0 failed |
| `tests/server/content/doc-findings.test.ts` | 7 passed, 0 failed | 7 passed, 0 failed |
| `tests/server/content/images.test.ts` | 32 passed, 0 failed | 32 passed, 0 failed |
| `tests/server/files/fs.test.ts` | 42 passed, 0 failed | 42 passed, 0 failed |
| `tests/server/files/project-files.test.ts` | 16 passed, 0 failed | 16 passed, 0 failed |
| `tests/server/files/search.test.ts` | 30 passed, 0 failed | 30 passed, 0 failed |
| `tests/server/git/deposit.test.ts` | 32 passed, 0 failed | 32 passed, 0 failed |
| `tests/server/git/git-write.test.ts` | 45 passed, 0 failed | 45 passed, 0 failed |
| `tests/server/machine/lines.test.ts` | 21 passed, 0 failed | 21 passed, 0 failed |
| `tests/server/machine/pty/channel.test.ts` | 25 passed, 0 failed | 25 passed, 0 failed |
| `tests/server/machine/pty/compose.test.ts` | 18 passed, 1 failed | 19 passed, 0 failed |
| `tests/server/machine/usage/refresh.test.ts` | 41 passed, 1 failed | 42 passed, 0 failed |
| `tests/server/machine/usage/usage.test.ts` | 21 passed, 0 failed | 21 passed, 0 failed |
| `tests/server/root/context.test.ts` | 7 passed, 1 failed | 8 passed, 0 failed |

## DONE / NOT DONE

Commands run from `tools/oculus` in the worktree. NOT DONE: nothing in the brief.

| Brief item | State | Command that proves it |
| --- | --- | --- |
| 1 The rule: `Shape` names, `satisfies` where the answer has a declared type, no zod text shown | DONE | `grep -rnE "^(export )?const [a-zA-Z]+ = z" <five folders> \| grep -vE "const [A-Za-z]+Shape = z"` and `grep -rnE "\.issues\|prettifyError\|treeifyError"` print nothing |
| 2 Bodies and frames (`terminalMessage`, `composeRequest`, `sourceBody`, `upload`, `triageFields`, `handleOpen`, `handleTerminal`, `handleGit`, `handleDeposit`, `handleFsWrite`, `addRow`) | DONE | the loop and the cast greps below; `npx vitest run tests/routes tests/server/machine/pty tests/server/files tests/server/accounts` |
| 3 Output of other programs (`clocked`, ripgrep readers, `defaultBranchOf`, `urlOf`) | DONE | the same loop; `search.test.ts`, `lines.test.ts`, `deposit.test.ts` (slow, run by name below) |
| 4 The files (`usage/accounts.ts`, `foldFile`, `readSaved`, `readBookmarks`, `noteOf`/`readTriage`, `field`, `rowsIn`) | DONE | the loop; `usage.test.ts`, `refresh.test.ts`, `fs.test.ts`, `triage.test.ts`, `rows.test.ts` |
| 5 Answers of services (`codeOf`, `rowsOf`, `refusal`, token answer, calendar and mail providers) | DONE | the loop; `providers.test.ts`, `plate.test.ts`, `rows.test.ts` |
| 6 Configuration (`readRoots`, `docFindings`, `fileIndex`, audit rules, `sitePapers`, `folderOf`, `wallpaper`, `messageModel`, `depositFor`) | DONE | the loop; `audit.test.ts`, `doc-findings.test.ts`, `images.test.ts`, `wallpaper.test.ts`, `project-files.test.ts`, `file.test.ts`, `git-write.test.ts` |
| 7 `requireRefreshSettings` typed, `context.ts` casts gone | DONE | `grep -n " as string\| as number" src/lib/server/root/context.ts` prints nothing; `refresh.test.ts` and `context.test.ts` cases fail on the unchanged tree and pass now |
| 8 Duplicates of `guards.ts`; allowlist lines 22, 23, 24, 27 removed | DONE | `npx vitest run tests/checks/tree/duplication.test.ts` failed with exactly those four entries listed stale before the removal, passes after; lines 28 and 29 stay (their clones are still shared) |
| 9 `core/json.ts` | DONE, nothing to delete | `grep -rnE "from '[./]*(core/)?json(\.ts)?'" src/lib/server \| grep -E "\b(text\|whole\|list\|isMap)\b"` lists only `sessions/` importers (`fold.ts`, `group.ts`, `registry.ts`, `cache.ts`, `overrides.ts`, `stores/turns.ts`, `stores/background.ts`, `stores/transcripts.ts`, `stores/codex.ts`); `text` has no caller left in this step's folders, three in `sessions` (`registry.ts:17`, `stores/turns.ts:22`, `stores/codex.ts:18`); the comment at `core/json.ts:91-92` now says "which modules of `sessions` import" |
| 10 Docs: `DESIGN.md:148`, `guards.ts` head comment | DONE | `grep -n "Untyped input" DESIGN.md` (line 148, one paragraph); `sed -n 1,12p src/lib/data/helpers/guards.ts` |
| 11 No existing case edited | DONE | `diff` of each changed test file against the unchanged copy (`scratchpad/Q85a4/tests-orig`): no line of an existing case differs; the only changed existing lines are import lists (`source.test.ts`, `git.test.ts`, `git-write.test.ts`, `refresh.test.ts`) and the head comment of `routes/git/git.test.ts`, which now says its last describe runs git |
| 12 Hot readers' time | DONE, all three under 1.5 times | "Hot readers" below |
| 13 Prototype set from file content | DONE | `triage.ts:99` skips `__proto__`; the case fails on the unchanged tree and passes now; the other readers probed below |

### Verify 1: `npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`

The command lines and the tail of its output, verbatim (full output in `scratchpad/Q85a4/checks.txt`):

```
$ npm test
 Test Files  371 passed | 20 skipped (391)
      Tests  5977 passed | 596 skipped (6573)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
$ npm run build
$ npm run format:check
Checking formatting...
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
exit 0
```

### Verify 5: the slow-tagged changed files, by name

`grep -l "@module-tag slow"` over the 28 test files lists `tests/server/machine/lines.test.ts`, `tests/server/git/deposit.test.ts` and `tests/server/git/git-write.test.ts`. `npx vitest run tests/server/git/deposit.test.ts tests/server/git/git-write.test.ts tests/server/machine/lines.test.ts tests/server/git/git-ops.test.ts` (git-ops.test.ts is slow-tagged and runs `handleGit` with the real operations): `Test Files  4 passed (4)`, `Tests  135 passed (135)`.

## Verify 3 and 4: the loop, its twin, the helper greps

Before (`scratchpad/Q85a4/loop-before.txt`, `twin-before.txt`, the commands of the brief on the unchanged tree): the loop lists 44 files with 222 lines, the twin 9 files with 20 lines. After, the same commands: the loop lists 36 files with 102 lines (`awk '{s+=$1} END {print s, NR}' loop-after.txt`), the twin 9 files with 20 lines. Every one of the 122 remaining lines was read (`grep -nE` over each file) and falls in one of the brief's classes, listed per file in the table of the next section: a `typeof` in a type, an argument check of one `unknown` or `string` argument with its own sentence or fallback, `node` values (`stdout` of `execFile`, a timer's `unref`, an exit code), a bare map test (the brief's list, and the body's own map test of `handleTerminal`, `handleGit`, `handleDeposit`, `handleFsWrite`, `handleOpen`, the token answer of `oauth.ts` and the triage file), or a line inside a schema.

`grep -rnE "\b(text|str|scalar|fields|strings|word|number)\(" <the five folders> | grep -v "function "` prints: `z.number()` inside schemas (`lines.ts:130`, `refresh.ts:140`, `accounts.ts:54,209,491`, `rules.ts:96,101`), `ics.ts`'s own `text(component, name)` over `ICAL` (`:91,104,105,111,137,141,145,150`), `response.text()` (`ics.ts:196`), `scalar(error.message, 'failed')` (`open.ts:110`, a node error) and `scalar(path)` (`git-write.ts:172`, `checkPaths`). Nothing else.

`grep -rnE "\.issues|prettifyError|treeifyError" <the five folders>` prints nothing. `grep -rnE "^(export )?const [a-zA-Z]+ = z" <the five folders> | grep -vE "const [A-Za-z]+Shape = z"` prints nothing. No `.error` of a parse result is read: `grep -rnE "\b(parsed|result|named|found|held|body|read)\.error\b"` finds only `found.error` in `fs.ts:420` and `open.ts:314` (the files' own result types) and `read.error` in `git-reads.ts` (git's outcome). `grep -n " as string\| as number" src/lib/server/root/context.ts` prints nothing. `grep -nE " as (number|string|TerminalKind|TaskKind|LatexStep|TerminalResume)" src/lib/server/machine/pty/routes.ts` prints nothing. `grep -n "as AccountRow" src/lib/server/accounts/connect/actions.ts` prints `186:    return lists.success ? lists.data[list].map((row) => row as AccountRow) : [];`, `rowsIn`'s line: it keeps every map row the file holds whatever its fields, as the file's reader does (the doc comment above `rowsIn` says so).

## Verify 7: the rename grep

`grep -rnw <name> src tests config HELP.md DESIGN.md README.md --exclude=local.yml` for the names the step removes. `mapOf`: remaining hits are the separate private `mapOf` functions of `src/lib/server/edit/deck-edit.ts:34`, `edit/writes/audit-mute.ts:40` and `edit/writes/rail.ts:36` (Q85a2's folder), none of this step's. `wordSet`, `wordList`, `chipPairs`, `readRoot`: no hit. `listOf`: only `server/edit/entry-edit/lines.ts:183` and `server/edit/writes/entries.ts:180`, other functions of that name. `kindOf` (removed from `mail/routes.ts`): the hits are `pty/sessions.ts:172` (a different, exported function), `state/feeds/inbox.ts:54` and `state/boards/collection.ts:143`. `statusOf` (removed from `calendar/google.ts`): the hits are `calendar/ics.ts:65`, `calendar/microsoft.ts:98` (this step's own function, rewritten with another signature) and the editor-status function of `shell/`. `text`, `number`, `scalar`, `word`, `json`: the definitions and imports in the five folders are `grep -rnwE "function <name>|const <name> =|import \{[^}]*\b<name>\b[^}]*\}"`: `word` none; `number` one local variable in `content/latex.ts:287`; `scalar` imports in `files/open.ts:26` and `git/git-write.ts:64` (the guard, kept); `text`: `ics.ts:73` (its own function over `ICAL`) and local variables; `json`: every hit is `import { json } from '@sveltejs/kit'`, the response helper. No `core/json.ts` helper was deleted.

## The files

The loop and twin lists hold 53 files (44 + 9); the brief counts 45 for its table; this table has one row per file of the 53, and `root/context.ts` last. Columns: the schemas added (names, all ending in `Shape`), the check lines before and after (the loop's own count per file), `satisfies z.ZodType` and `safeParse` counts (`grep -c`), and what stays with its reason.

| File (under `src/lib/server/`) | Schemas | Check lines before | After | satisfies | safeParse | What stays, with its reason |
| --- | --- | --- | --- | --- | --- | --- |
| `accounts/calendar/google.ts` | `optionalTextShape`, `pageTokenShape`, `calendarRowShape`, `statusShape`, `edgeShape`, `eventRowShape` | 1 | 0 | 1 | 3 | none left. |
| `accounts/calendar/ics.ts` | none | 2 | 2 | 0 | 0 | 66,75: an `ICAL` property value tested once; ics.ts's own `text(component, name)` and `response.text()` are not the guard `text`. |
| `accounts/calendar/microsoft.ts` | `optionalTextShape`, `nextLinkShape`, `calendarRowShape`, `edgeShape`, `eventRowShape` | 2 | 0 | 0 | 3 | none left. |
| `accounts/calendar/routes.ts` | none | 1 | 1 | 0 | 0 | 54: the event key, answering "no such event". |
| `accounts/connect/actions.ts` | `rowListShape`, `accountListsShape`, `addedRowShape` | 3 | 1 | 1 | 2 | 129 `accountFor`'s key. The one `row as AccountRow` at 186 stays: the label rule compares a map row's provider and label whatever its other fields, and the file's reader keeps every map row. |
| `accounts/connect/api.ts` | `optionalTextShape`, `refusalShape`, `rowsShape` | 6 | 2 | 0 | 2 | 77 and 103: bare map tests of an answer. |
| `accounts/connect/loop.ts` | none | 1 | 1 | 0 | 0 | 108 `typeof` in a type. |
| `accounts/connect/oauth.ts` | `tokenRefusalShape`, `tokenAnswerShape` | 3 | 2 | 0 | 2 | 28 `typeof` in a type; 288 the answer body's own map test. |
| `accounts/connect/rows.ts` | none | 3 | 3 | 0 | 0 | 72 `same()` compares with `===`; 163 bare map test; 193 hands a list on whole. |
| `accounts/connect/store.ts` | `fieldShape` | 2 | 1 | 0 | 1 | 113 `readRecord`'s bare map test. |
| `accounts/mail/google.ts` | `optionalTextShape`, `threadRowShape`, `headerShape`, `messageShape`, `threadBodyShape`, `profileShape` | 2 | 2 | 0 | 4 | 50 inside a schema; 56 `typeof` in a type. |
| `accounts/mail/microsoft.ts` | `optionalTextShape`, `personShape`, `messageShape`, `listShape`, `folderShape` | 4 | 2 | 0 | 3 | 77 inside a schema; 83 `typeof` in a type. |
| `accounts/mail/plate.ts` | none | 1 | 1 | 0 | 0 | 90 `typeof` in a type. |
| `accounts/mail/routes.ts` | `triageFieldsShape` | 5 | 2 | 1 | 1 | 91 `addressed`'s `id` argument; 160 a reply's `body`, "an answer needs words". |
| `accounts/mail/triage.ts` | `inboxKindShape`, `noteShape`, `triageFileShape` | 3 | 1 | 1 | 2 | 94 the file's own map test. |
| `content/audit/projects.ts` | `entryFieldsShape` | 1 | 1 | 0 | 0 | 106 `asDate`'s argument check. |
| `content/audit/publications.ts` | `feedShape`, `sectionShape`, `paperShape` | 4 | 0 | 0 | 3 | none left. |
| `content/audit/rules.ts` | `wordShape`, `wordListShape`, `namesShape`, `wordSetShape`, `chipPairShape`, `lifecycleShape`, `readLimitsShape`, `scalarShape`, `signatureListShape` | 16 | 1 | 0 | 9 | 87 inside `scalarShape`. |
| `content/docs.ts` | `docShape`, `docEntryShape`, `docListShape`, `groupsShape` | 6 | 1 | 0 | 6 | 438 inside `groupsShape` (an object that is not null, a list included). |
| `content/images.ts` | `dirBlockShape` | 3 | 1 | 0 | 1 | 226 `typeof` in a type. |
| `content/memories.ts` | `uploadShape` | 2 | 0 | 1 | 1 | none left. |
| `content/wallpaper.ts` | `pickShape`, `wallpaperBlockShape` | 3 | 0 | 1 | 2 | none left. |
| `files/files.ts` | `rootShape`, `rootEntryShape`, `rootListShape` | 4 | 0 | 1 | 4 | none left. |
| `files/fs.ts` | `savedFileShape`, `workspaceFileShape`, `textShape`, `fsBodyShape` | 10 | 2 | 0 | 4 | 448 `typeof` in a type; 573 the body's own map test. |
| `files/fs/bookmarks.ts` | `bookmarkItemShape`, `bookmarkLabelShape`, `bookmarksFileShape` | 4 | 1 | 0 | 3 | 86 inside a schema. |
| `files/open.ts` | `openBodyShape` | 4 | 2 | 0 | 1 | 309 the root key, answering its own refusal; 343 the body's own map test; `scalar` at 110 is a node error message. |
| `files/project-files.ts` | `fileIndexShape` | 4 | 2 | 0 | 1 | 106 and 108 inside the schema. |
| `files/search.ts` | `anyNumberShape`, `textFieldShape`, `submatchShape`, `ripgrepLineShape` | 10 | 3 | 0 | 2 | 148 an exit code (node); 185 inside a schema; 222 `typeof` in a type. |
| `files/source.ts` | `sourceBodyShape` | 4 | 0 | 1 | 1 | none left. |
| `git/deposit-git.ts` | none | 3 | 3 | 0 | 0 | 106,107,156: argument checks of an exported operation; `stdout` of `execFile`. |
| `git/deposit-routes.ts` | `textFieldShape`, `depositBodyShape` | 2 | 2 | 0 | 1 | 93 `typeof` in a type; 185 the body's own map test. |
| `git/deposit.ts` | `textFieldShape`, `codeFieldsShape`, `repoViewShape` | 7 | 5 | 0 | 2 | 229 and 799 `typeof` in types; 365,431,764: argument checks of exported operations. |
| `git/git-index.ts` | none | 5 | 5 | 0 | 0 | 91,148,151,184,205: argument checks of exported operations. |
| `git/git-message.ts` | `messageModelShape` | 4 | 2 | 0 | 1 | 73 `prompt` argument check; 103 `stdout` of `execFile`. |
| `git/git-reads.ts` | none | 7 | 7 | 0 | 0 | 66-72 `typeof` in a type. |
| `git/git-refs.ts` | none | 4 | 4 | 0 | 0 | 64,92,100,119: argument checks of exported operations. |
| `git/git-remote.ts` | none | 1 | 1 | 0 | 0 | 71: `remote` argument check. |
| `git/git-routes.ts` | `textFieldShape`, `gitBodyShape` | 2 | 4 | 0 | 1 | 178 and 193 inside the schema; 196 `typeof` in a type; 286 the body's own map test. |
| `git/git-write.ts` | none | 6 | 6 | 0 | 0 | 137,164,170,241,421,666 argument checks and `stdout` of `execFile`; `scalar(path)` at 172 in `checkPaths`. |
| `machine/hpc/poll.ts` | none | 1 | 1 | 0 | 0 | 118 `typeof` in a type. |
| `machine/hpc/routes.ts` | none | 2 | 2 | 0 | 0 | 11 `typeof` in a type; 25: a body's `id` tested once with its own refusal. |
| `machine/hpc/ssh.ts` | none | 1 | 1 | 0 | 0 | 35 `typeof` in a type. |
| `machine/lines.ts` | `lineCountShape`, `clocFileShape` | 3 | 1 | 1 | 1 | `isMap(parsed)` at 151: the bare map test of cloc's answer. |
| `machine/pty/channel.ts` | `anyNumberShape`, `terminalChannelShape`, `terminalMessageShape` | 13 | 9 | 1 | 1 | `typeof` in types (187,188,198,202,312) and a timer's `unref` (199,356,453): what node types; `anyNumberShape` at 122 is inside a schema. |
| `machine/pty/chat.ts` | none | 4 | 4 | 0 | 0 | 79,86,87,97: one `id` argument tested with its own sentence. `cols`/`rows` casts removed. |
| `machine/pty/compose.ts` | `composeRequestShape` | 11 | 3 | 1 | 2 | 71 `typeof` in a type; 201 and 220 inside `picksOf` and the images schema. |
| `machine/pty/edit.ts` | none | 5 | 5 | 0 | 0 | 66,94,100,107,108: argument checks with their own sentences. |
| `machine/pty/routes.ts` | `latexStepShape`, `startNameShape`, `steerTextShape`, `resumeToolShape` | 9 | 8 | 0 | 2 | 72,81 `typeof` in types; 95 inside `steerTextShape`; 140,284,397,411 argument checks; 458 `handleTerminal`'s map test. |
| `machine/pty/sessions.ts` | none | 8 | 8 | 0 | 0 | 68,168,223,234,249,372,400,530: argument checks with their own sentences (`geometry`, `name`, `cwd`, `text`, `argv`). |
| `machine/usage/accounts.ts` | `textShape`, `finiteShape`, `mapShape`, `oauthShape`, `cachedLimitShape`, `cachedUsageShape`, `claudeFileShape`, `statusWindowShape`, `claudeStatusShape`, `rolloutRecordShape`, `codexWindowShape`, `codexLimitsShape` | 23 | 3 | 0 | 6 | 47 `jsonFile`'s bare map test; 137 and 506 `typeof` in types. |
| `machine/usage/refresh.ts` | `refreshSettingsShape` | 2 | 0 | 1 | 2 | none left. |
| `machine/usage/routes.ts` | none | 1 | 1 | 0 | 0 | 19: a body's `account` tested once with its own refusal. |
| `machine/usage/transcripts.ts` | `turnContextShape` | 4 | 2 | 0 | 1 | 42 `dayOf`'s argument check; 100 the per-line `isMap` kept because the fold reads every line of seven days (timing in "Hot readers"). |
| `root/context.ts` | none (calls `requireRefreshSettings`) | 2 casts | 0 casts | 0 | 0 | the import line 63-67 is outside the brief's lines 262-269; it adds `requireRefreshSettings`. |

`root/context.ts` is outside the brief's lines 262-269 in one place: its import of `../machine/usage/refresh.ts` (lines 63-67) gains `requireRefreshSettings`. `src/lib/data/helpers/guards.ts` changed only in its head comment, `src/lib/server/core/json.ts` only in the comment at 91-92, `DESIGN.md` only at line 148, `tests/checks/tree/allow-duplication.txt` only by removing lines 22, 23, 24 and 27 (185 lines remain: `wc -l`).

`safeParse` against converted readers. The brief wants each file's `safeParse` count to be at least its converted readers. Two readers use `.parse` on a schema that cannot fail, and the report names them: `content/audit/projects.ts:453` (`entryFieldsShape.parse(entry.fields)`; `entry.fields` is typed `Record<string, unknown>` and every field of the schema has a fallback, so a `safeParse` would carry a branch that cannot run) and `machine/pty/routes.ts:471,498` (`startNameShape.parse`, `steerTextShape.parse`, each a single total field). The constants `NO_CLAUDE_FILE`, `NO_CODEX_LIMITS`, `NO_LIFECYCLE`, `NO_FILE_INDEX` are `shape.parse({})` of a schema whose fields all carry a fallback, and the helper `nested()` in `usage/accounts.ts` builds a default the same way. Every other converted reader reads `safeParse(...)`; `grep -c safeParse` per file is in the table.

## Hot readers (Verify 6)

`scratchpad/Q85a4/timing.ts <src root>` feeds `createFold` 50,000 ripgrep JSON lines, runs `newestCodexLimits` over a 50,000-record rollout, and runs `new UsageTranscriptFold().fold(...)` over a 50,000-record Claude transcript and a 50,000-record Codex rollout, each timed five times after a warm-up. The answer lines of `createFold` and `newestCodexLimits` that the script prints are identical in the output of both trees. Baseline on the unchanged tree, taken before any change (`timing-before.txt`):

```
createFold 50000 ripgrep lines: mean 264.4 ms, min 220.7, max 302.7
newestCodexLimits over a 50000-record rollout: mean 43.0 ms, min 41.3, max 45.3
UsageTranscriptFold 50000 Claude + 50000 Codex records: mean 125.1 ms, min 119.0, max 136.0
```

The machine was shared with two other running builders, so single runs vary by 20 percent either way. Six runs of each tree, alternating (`timing-pairs2.txt`), means in ms (min to max of the five passes of a run in `timing-pairs2.txt`):

| | createFold | newestCodexLimits | UsageTranscriptFold |
| --- | --- | --- | --- |
| unchanged tree, six runs | 269.4, 256.3, 237.3, 228.8, 227.6, 218.0 (mean 239.6) | 40.2, 40.6, 40.7, 40.4, 43.0, 42.8 (mean 41.3) | 115.7, 127.2, 116.6, 116.3, 123.3, 128.2 (mean 121.2) |
| changed tree, six runs | 271.4, 271.2, 217.8, 260.9, 248.3, 242.2 (mean 252.0) | 46.2, 51.3, 46.3, 46.3, 50.4, 51.2 (mean 48.6) | 129.1, 136.0, 134.4, 121.5, 125.7, 119.2 (mean 127.7) |
| ratio of the means | 1.05 | 1.18 | 1.05 |

Earlier runs of the changed tree against the unchanged baseline file: 235.6 / 50.4 / 121.9, 238.3 / 57.3 / 128.4 and one loaded run of 293.2 / 67.1 / 158.5; the unchanged tree measured 306.0 / 66.9 / 180.8 in a loaded run of its own (`timing-pairs.txt`). Every mean is under 1.5 times its baseline in the paired comparison; `lastRateLimits`/`newestCodexLimits` pays the most (1.18) and stays under the bound, so no reader fell back to a hand narrowing for time. `transcripts.ts:100` keeps its per-line `isMap(value)` as Z96 closed it, and only the `turn_context` payload goes through `turnContextShape`.

## Judgment calls the brief left open

1. **Case 5 (triage write).** The brief says `{ what: 'w', triaged: false }` "sets exactly `what` and `triaged`". `writeNote` takes `triaged` off a note when it is given as false, so the case writes `{ triaged: true }` and then `{ what: 'w', triaged: false }` and asserts the keys `['what', 'written']`; a `{}` and a `{ triaged: 'yes' }` are refused as before (`tests/server/accounts/mail/routes.test.ts:375`).
2. **Decision 2, `handleTerminal`.** `kind`, `cols` and `rows` are passed as they came (typed `unknown` in `StartRequest`), as the brief says. `cwd` is typed `unknown` too, since `startTerminal` refuses every value that is not an absolute string with the same sentence. `name` cannot be passed as it came: `name: 3` and `name: null` must start with no name, so `startNameShape` reads it (`z.string().optional().catch(undefined)`). `startTerminal` uses a new exported `isTerminalKind(value: unknown)` over `KINDS`.
3. **Bare map tests kept beside a schema.** `handleGit`, `handleDeposit`, `handleFsWrite`, `handleOpen`, `oauth.ts`'s token answer and `readTriage` keep their `isMap` as the brief lists them, and then read fields through a schema, so `!isMap(x) || !parsed.success` is one refusal.
4. **`rules.ts`'s `scalar`** became `scalarShape` (exported, used inside `entryFieldsShape` and `paperShape`) rather than `guards.ts`'s `scalar`, because a schema field needs a schema. It answers what `guards.ts`'s `scalar(value, '')` answers on `'a'`, `''`, `0`, `5`, `-1.5`, `NaN`, `Infinity`, `true`, `false`, `null`, `undefined`, `[]`, `{}`, `[1]` and `10n`, shown by a case (`tests/server/content/audit.test.ts`, "a scalar field read as text").
5. **`depositFor`'s `code_availability`** is read by `codeFieldsShape` (each text field `z.string().catch('')`, `topics` as `z.array(z.unknown())` mapped through `String`), with `NO_CODE_BLOCK` for a block that is no map, which answers what `mapOf` plus `textOf` answered. `defaultBranchOf` and `urlOf` read through one `repoViewShape` and answer `''` for output that is not JSON, a list, `null`, or a field of the wrong type.
6. **`handleGit` and `handleDeposit`.** `gitBodyShape` and `depositBodyShape` are `z.looseObject`s with `action` among the route's actions and every other field a total text field (`z.string().catch('')`), `paths` the string items of a list, `amend` true only for the boolean `true`, `mode` any non-empty string (else `tracked`) so that `stash` still refuses an unknown mode with "that is not a way to stash". The injected `run` receives the raw body map exactly as before; the real operations read the parsed body. `ACTIONS` of both routes is now `as const` for `z.enum`.
7. **`handleOpen`'s body** is `openBodyShape`, a `z.looseObject({ path })`, so `root` and the other keys reach `resolved` as they came.
8. **Argument checks of the exported git operations** (`git-refs.ts`, `git-write.ts`, `git-index.ts`, `git-remote.ts`, `deposit.ts`) stay whole, per Decision 1, `typeof` included.
9. **Where the new usage cases live.** The two new describes of `tests/server/machine/usage/usage.test.ts` ("usage readers over files of the wrong shape", "Codex rollouts of the wrong shape") brought it to 1121 lines, over the 900 the tree check allows and with an empty `utils/size-allow.txt`. They now sit at the end of `tests/server/machine/usage/refresh.test.ts` (840 lines) beside three small helpers (`put`, `line`, `limitsFile`); `usage.test.ts` is back at 896 lines, its original count and content. No existing case was edited, and no test file was added.
10. **`composeRequest` takes `unknown`** and answers the empty shell for a value that is no map (see "Changed behaviours").
11. **Schemas I wrote that differ from the five probe rules, found by running them in zod 4.6.5** (below, "What in the brief was wrong").

## Changed behaviours, with before and after

1. **`readTriage` with a `__proto__` note** (item 13). Before: a triage file `{"notes":{"__proto__":{"what":"w"},"b":{...}}}` answered `notes` whose own keys were `['b']` and whose prototype was the `__proto__` note. After: the key is skipped; own keys `['b']`, prototype `Object.prototype` (`triage.test.ts`, fails before, passes after). The probes of the other readers that build an answer by assigning a file's keys, with the commands:
   - `pty/compose.ts:203` (`picks[key] = string`) and `audit/rules.ts:97` (`readLimits[key] = number`): `node proto.ts <src>` and `node proto2.ts <src>` (scratchpad) on `{"picks":{"__proto__":"x","a":"b"}}` and `{"read_limits":{"__proto__":5,"b":7}}` print own keys `['a']` / `['b']` and prototype `Object.prototype` on both trees: assigning a string or a number to `__proto__` sets nothing, so there is no defect to end (the key is dropped on both trees, as before).
   - `wallpaper.ts:62` assigns a string chosen from a directory listing, not a file key. `triage.ts:139` (`held.notes[thread] = ...`) takes the thread id from the action (`addressed` resolves it through the state the poller published), not from a file. Probe (`node proto3.ts <src>` in the scratchpad: `writeNote(dir, '__proto__', { what: 'w' })`, then `readTriage(dir)`): on both trees `writeNote` returns the note and the file holds no note (`notes` keys `[]`), because the assignment set the prototype of the in-memory map. This is unfixed and is not changed here: the input is not file content (item 13 covers file keys), no provider issues a thread id `__proto__`, and a fix needs a decision on what a write for that id should do (refuse it, or store it), which is a user-visible shape.
   - `sitePapers` (website file), `readBookmarks`, `readRoots`, `docFindings`, `fileIndex`, `clocked` and the Codex rate limits use `Object.entries`, spread or `Object.fromEntries` and define own properties; cases 15, 26d and the `__proto__` cases of `lines.test.ts`, `audit.test.ts`, `refresh.test.ts` and `fs.test.ts` assert the keys stay.
2. **`composeRequest(null)`, `composeRequest([])`, `composeRequest('text')`, `composeRequest(3)`**. Before: `TypeError: Cannot read properties of null (reading 'agent')` (its parameter was typed `Record<string, unknown>`; the route calls it only with a map). After: the empty shell `{ agent: 'shell', cwd: '', account: '', picks: {}, prompt: '', images: [] }`. Not reachable through the route, only by a direct call. The case is `compose.test.ts` "composeRequest of a body that is no map".
3. **`requireRefreshSettings`** answers `{ refreshMin, model }` where it answered nothing, and `root/context.ts` calls it itself (item 7); with `watchUsageRefresh` replaced by a stub the unchanged tree did not throw for `usage_refresh_min: 0` and the changed one throws the same sentence at start-up (case 26, the brief's design).

## What in the brief was wrong or imprecise, with evidence

1. **Case 5**, above: `writeNote` removes `triaged` when false.
2. **The list of "the 45 files"**: the loop (44 files) and its twin (9 files) hold 53 files (`wc -l loop-before.txt twin-before.txt`), the table lists all 53; the 222 lines are the loop's alone (`awk '{s+=$1}'`: 222), the twin adds 20 lines, none of which is converted.
3. **`mail/routes.ts:85`** is `addressed`'s `id` argument check (now line 91), not a reply's `body` (the body check is now line 160); both stay as argument checks.
4. **`core/json.ts` helpers**: the brief expected `text` to have no caller in this step's folders and to be deletable at the second landing; it has none in these folders, and three in `sessions/` (`registry.ts:17`, `stores/turns.ts:22`, `stores/codex.ts:18`). `whole`, `list` and `isMap` have `sessions/` callers too, so none was deleted here.
5. **zod 4.6.5 behaviours the five probe rules do not name**, each met while converting and handled in the schemas: (a) an object field of `z.unknown()` or `z.any()` fails with "expected nonoptional" when the key is absent, so it is written `.optional()` (`rootEntryShape`, `cachedLimitShape.kind`, `composeRequestShape.picks`); (b) `z.unknown().transform(fn)` fails the same way on an absent key, so `z.unknown().optional().transform(fn)` (`picks`); (c) `z.custom<number>(fn)` fails on an absent key, so it carries `.catch(...)` (`fileIndexShape.max_per_project`); (d) a schema's `.catch(...)` makes the field total, which is how every "reads as the default" field is written; (e) a nested object whose fields all default is built with `shape.catch(shape.parse({}))` (`nested()` in `usage/accounts.ts`). A comparison of a result against defaults can pass by coincidence when a parse silently fails (it did once, for `picks`), so `compose.test.ts` and `refresh.test.ts` carry cases with non-default values.
6. **The brief's `kind as TaskKind` casts at 309 and 327** are replaced by an `isTask` guard over `TASKS` in `pty/routes.ts`, as the brief says; no `as` cast of an outside value remains in the step's files except `rowsIn`'s.
7. **Q85a2 shares four paths** (`DESIGN.md:148`, `core/json.ts:91-92`, `allow-duplication.txt`, `docs/diagrams`). This step wrote them as if Q85a2 were not there: `DESIGN.md:148` names `server/core`, `server/root` and this step's five folders only; the allowlist loses 22, 23, 24 and 27; the merging landing combines them as the brief says.
