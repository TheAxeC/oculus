Everything in the brief and in repair round 1 is done. One limit: `tests/server/core/changes.test.ts` is tagged slow, so its cases do not run inside `checks.sh` (section "Limits of the green result"; the file's own run is quoted under "Repair round 1").

# Q85a1 report

## Open items of the state file (verbatim, `.scratch/migration/orchestrator-state.md` line 119)

- Z97, the looks are stuck: the Chrome window the looks run in is minimised (raised 2026-09-30 15:50; Axel asked for an open item whenever the looks are stuck). A new tab on `http://localhost:8790/` opens in the window of the Claude tab group; in it `document.visibilityState` reads "hidden", `window.outerWidth` by `outerHeight` reads 149 by 81 at `screenY` 982 (a window in the Dock), and a `requestAnimationFrame` loop ran 3 frames in 1.5 s, each forced by a screenshot. A still screenshot draws, so a view that paints once can be read; nothing that runs on animation frames can be looked at: Q86c's drag, D13c's repaint in place, D13b's Monaco diff and merge editor, Q102's terminals. Q103's look also needs the cluster, which the status bar shows as unreachable (UT network or EduVPN). U2's audit waits on the same window, since the views drawn by Monaco, xterm, the Map and the virtual lists would be audited from frames that did not run. What ends it: the Chrome window of the Claude tab group restored from the Dock and left on screen, not covered by another window, and EduVPN up for Q103. There is one way to end it and no choice to make; the looks and the audit are taken on the next turn after Axel says the window is up.

## The cases' first run on the unchanged tree

Command, run before any source change, from `tools/oculus` in the worktree: `npx vitest run tests/server/core/changes.test.ts tests/server/root/hooks.test.ts tests/server/root/socket.test.ts --reporter=verbose`. Result: `Test Files  3 passed (3)`, `Tests  76 passed (76)`, which counted six further cases that repair round 1 then removed as not asked for. Every case passed there; no case was wrong under the brief's rules, so no stop. The new cases, as the run printed them (millisecond figures dropped):

```
pass tests/server/root/hooks.test.ts > handleHook, fields and refusals > answers null for a body that is not an object or holds no usable name and session
pass tests/server/root/hooks.test.ts > handleHook, fields and refusals > drops a field of the wrong type or empty and leaves its key absent
pass tests/server/root/hooks.test.ts > handleHook, fields and refusals > keeps a blank string as a value and drops only the empty one
pass tests/server/root/hooks.test.ts > handleHook, fields and refusals > leaves the key of a list or a map field absent
pass tests/server/root/hooks.test.ts > notifyConfig, the values it takes and drops > answers the default for a notify value that is no map
pass tests/server/root/hooks.test.ts > notifyConfig, the values it takes and drops > takes the default for a field of the wrong type and keeps the others
pass tests/server/root/hooks.test.ts > notifyConfig, the values it takes and drops > reads quiet_seconds from zero up, infinity included, and refuses the rest
pass tests/server/root/hooks.test.ts > notifyConfig, the values it takes and drops > answers exactly the three fields of a notify map with more keys
pass tests/server/root/hooks.test.ts > handleHookRequest, the first payload of each name > logs the first body of a name as it was sent and never the second
pass tests/server/root/hooks.test.ts > handleHookRequest, the first payload of each name > logs a name once per name and with every key the body holds
pass tests/server/root/hooks.test.ts > handleHookRequest, the first payload of each name > logs nothing for a body without a usable name, and answers 200
pass tests/server/root/socket.test.ts > parseSubscription > answers the channels and an absent token for a plain subscribe message
pass tests/server/root/socket.test.ts > parseSubscription > answers null for everything that is not a subscribe message
pass tests/server/root/socket.test.ts > parseSubscription > keeps the token when it is a string and drops it otherwise, with no other key
pass tests/server/root/socket.test.ts > parseSubscription > refuses a message whose own __proto__ key holds the fields
pass tests/server/core/changes.test.ts > reading a line of the log > answers a line with its keys in the order they were written and its own __proto__ key
pass tests/server/core/changes.test.ts > reading a line of the log > skips a line that is no change and reads the lines around it
pass tests/server/core/changes.test.ts > reading a line of the log > skips a line whose at is no string or that has no field, and reads empty strings
pass tests/server/core/changes.test.ts > reading a line of the log > takes the last of a key given twice, so a number then a string is read
pass tests/server/core/changes.test.ts > reading a line of the log > reads a line with an unknown undo word or a numeric undoes as it is
pass tests/server/core/changes.test.ts > reading a line of the log > keeps the good lines and stamps a later moment when the last line was cut off
```

Case to test:

| Case | Test (file, describe) |
|---|---|
| 1 | socket.test.ts, parseSubscription, "answers the channels and an absent token..." |
| 2 | same, "answers null for everything that is not a subscribe message" (the nine inputs) |
| 3 | same, "keeps the token when it is a string and drops it otherwise, with no other key" |
| 4 | same, "refuses a message whose own __proto__ key holds the fields" |
| 5, 6, 7 | hooks.test.ts, "handleHook, fields and refusals", first three tests |
| 19 | same describe, "keeps a blank string..." (`session_id: ' '`) and "leaves the key of a list or a map field absent" |
| 8, 9, 10, 20 | hooks.test.ts, "notifyConfig, the values it takes and drops" (20 is in the `quiet_seconds` test: `-0` by `Object.is`, `-Infinity`) |
| 17, 18 | hooks.test.ts, "handleHookRequest, the first payload of each name" (`console.error` spied) |
| 11 | changes.test.ts, "reading a line of the log", first test (rewritten in round 1, see below) |
| 12 | same, "skips a line that is no change and reads the lines around it" |
| 13 | same, "skips a line whose at is no string or that has no field, and reads empty strings" |
| 21 | same, "keeps the good lines and stamps a later moment when the last line was cut off" |
| 22 | same, "takes the last of a key given twice, so a number then a string is read" |
| 23 | same, "reads a line with an unknown undo word or a numeric undoes as it is" |
| 24 | held by the verify list and by no new case |
| 14, 15, 16 | not new cases, as the brief says; 14 and 16 are existing cases, 15 is `root/socket.ts:104`, unchanged |

After the change and repair round 1 the same three files: `Test Files  3 passed (3)`, `Tests  70 passed (70)` (`npx vitest run` on the three files). No existing case was edited; no file was added.

Case 11 as rewritten in repair round 1, run at landing by the orchestrator on the unchanged tree (a detached tree at 1ea26d17 with the round's `changes.test.ts` copied in): `npx vitest run tests/server/core/changes.test.ts -t "own __proto__ keys"` printed `pass ... answers a line with its keys in the order they were written and its own __proto__ keys`, `Tests  1 passed | 20 skipped (21)`. The base's hand reader already answers the ruled line in the written key order, so the case holds a behaviour the change preserves.

At landing the three inputs of case 24 that sat inside the cases for 2 and 8 were removed (`''` and the BOM-prefixed message in `socket.test.ts`, the YAML set for `events` in `hooks.test.ts`); case 24 is held by the verify list, as the brief says.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 dependency | DONE | `grep -n '"zod"' package.json` prints `82:        "zod": "4.6.5"`; `package-lock.json` holds `node_modules/zod` version 4.6.5; README.md:13 names `zod` (MIT) |
| 2, 3 rule and two forms | DONE | schemas beside their readers; `parseLine` answers the parsed line (second form), the other three read `safeParse(...).data` |
| 4 `parseSubscription` | DONE | `socket.ts:56` `subscriptionShape`, `satisfies z.ZodType<Subscription>`; the hand checks and the `typeof` of `token` are gone |
| 5 `handleHook` and the log's name | DONE | `hooks.ts:45` `filledTextShape`, `:51` `hookBodyShape`; `str` and its comment deleted; `handleHookRequest` logs `body` itself, never `named.data` |
| 6 `notifyConfig` | DONE | `hooks.ts:119` `notifyShape` with the union and the `.transform`, `satisfies z.ZodType<NotifyConfig>` |
| 7 `parseLine` | DONE | `changes.ts:149` `changeLineShape` (`z.looseObject`, four fields), `satisfies z.ZodType<Pick<Change, 'at' | 'kind' | 'file' | 'field'>>` |
| 8 names | DONE | verify 4 below |
| 9 what stays | DONE | `auth.ts`, `git.ts`, `git-parse.ts`, `file-poll.ts`, `root/context.ts`, `root/watch/*` not written; reasons in the table below |
| 10 allowlist | DONE | line 31 of `tests/checks/tree/allow-duplication.txt` removed, no other line touched; `npm run test:checks` passes, and it includes the check that fails on a stale entry |
| 11 docs | DONE | DESIGN.md `**Untyped input.**` between `**Auth.**` and `**Processes.**`; README.md:13 sentence; `json.ts:90-92` comment; head comments of the three readers; `history.test.ts` passes inside `test:checks` |
| 12 tests | DONE | new cases in the three named files only; `changes.test.ts` builds its logs through `target()`, `logOf` and two new helpers `logHolding` and `lineOf`; the duplication check reports no new clone |

### Verify

1. `npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`; the last run's lines:

```
$ npm test
 Test Files  348 passed | 19 skipped (367)
      Tests  5318 passed | 563 skipped (5881)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790780429495 COMPLETED 2472 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
(vite build output; exit 0)
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```
exit status 0.

2. Only the three test files I changed were run while working.
3. The loop of "What is on the tree", after the change (`for f in $(grep -rl unknown src/lib/server/core src/lib/server/root --include='*.ts'); do ... done`):

```
3 src/lib/server/core/json.ts
1 src/lib/server/core/file-poll.ts
3 src/lib/server/core/git.ts
3 src/lib/server/core/changes.ts
1 src/lib/server/core/auth.ts
1 src/lib/server/root/watch/portfolio.ts
1 src/lib/server/root/hooks.ts
4 src/lib/server/root/watch/sessions.ts
3 src/lib/server/root/watch/git.ts
```
`root/socket.ts` prints no line. This is the expected list. `root/hooks.ts` keeps one line, `hooks.ts:124`, the filter of item 6; no `z.infer<typeof ...>` is written.

4. `grep -n "safeParse"` on the three files:
```
src/lib/server/root/socket.ts:70:    const message = subscriptionShape.safeParse(parsed);
src/lib/server/root/hooks.ts:66:    const parsed = hookBodyShape.safeParse(body);
src/lib/server/root/hooks.ts:138:    const held = notifyShape.safeParse(config.notify);
src/lib/server/root/hooks.ts:254:    const named = hookBodyShape.safeParse(body);
src/lib/server/core/changes.ts:168:    return changeLineShape.safeParse(parsed).success ? (parsed as Change) : null;
```
`grep -c "satisfies z.ZodType"`: socket.ts 1, hooks.ts 1, changes.ts 1. `grep -nE "\.issues|prettifyError|treeifyError"` on the three files prints nothing. A wider `grep -nE "\.error"` prints two hits in `hooks.ts` (`console.error` at 194 and 202, and `error.message` in the osascript callback at 194); no parse result's `.error` is read. `grep -nE "^const [a-zA-Z]+ = z"` prints `subscriptionShape`, `filledTextShape`, `hookBodyShape`, `notifyShape`, `changeLineShape`.
5. Each new case passes on the unchanged tree (first-run section) and after the change (70 passed in the three files after the six unrequested cases were removed).

Also run: `LC_ALL=C perl -ne 'print ... if /[^\x20-\x7E\n]/'` over every file I touched printed nothing; the name grep `grep -rn "seven session\|the helper .str" src tests config HELP.md DESIGN.md README.md` prints nothing; `parseSubscription`, `handleHook`, `notifyConfig` outside their files are used only by `root/context.ts:225` and `src/routes/api/(sessions)/hook/+server.ts:14` (`notifyConfig`), whose call shape is unchanged.

## The ten files and the other lines

Before: the brief's figures (I did not run the loop on the unchanged tree). After: the loop above.

| File or lines | Schema added | Check lines before / after | What stays and why |
|---|---|---|---|
| `root/socket.ts` | `subscriptionShape` | 4 / 0 | `:32` `token: unknown` and `:103-104` `String(data)` stay: a parameter passed on and a frame turned to text |
| `root/hooks.ts` | `filledTextShape`, `hookBodyShape`, `notifyShape` | 10 / 1 | `:124` the `typeof` in the events filter (drops non-strings of a list where `z.array(z.string())` refuses the list); `Number(contentLength)` a `string | null` header |
| `core/changes.ts` | `changeLineShape` | 6 / 3 | the three lines of `same`, a structural comparison of two recorded values; `before` (`searchParams.get`, `string | null`) |
| `core/json.ts` | none | 3 / 3 | `text`, `whole`, `list`, the `isMap` re-export: their callers in `sessions`, `files` and `git` are later steps'; only the comment at 90-92 changed |
| `core/auth.ts` | none, file not changed | 1 / 1 | `gatedBody` keeps `isMap`: the guard narrows `unknown` to `Record<string, unknown>` for the compiler, where a zod record schema would need a cast to answer the same object; `:99` `request.json() as unknown` hands the value on |
| `core/git.ts`, `core/git-parse.ts` | none, files not changed | 3 / 3 | arguments typed `string[]` and `string` from server functions; `milliseconds`, `bytesOf`, `short`, `shortReason` take a caught error or what `spawnSync` answered; `git.ts` is 885 lines against 900 |
| `core/file-poll.ts` | none, not changed | 1 / 1 | `typeof` in a type position |
| `root/watch/portfolio.ts` | none, not changed | 1 / 1 | narrows the `string | Buffer | null` `fs.watch` hands its listener |
| `root/watch/sessions.ts` | none, not changed | 4 / 4 | `typeof` in a type position (143, 144); a timer tested for `unref` (275, 281) |
| `root/watch/git.ts` | none, not changed | 3 / 3 | a `SessionsPayload` this process published (124, 127); `:307` the `fs.watch` listener argument; `:402` `JSON.parse(text) as Message`, text this process's Hub sent |
| `root/context.ts` | none, not changed | (outside the loop) | `:266-267` casts are Q85a4's, as the brief says |
| `data/helpers/guards.ts:3-5` | none, not changed | | still true while `machine/pty/channel.ts` and the later readers narrow by hand; Q85a5's |

Files written: `package.json` (+1 line, `"zod": "4.6.5"`), `package-lock.json` (npm's rewrite for zod), `README.md` (line 13), `DESIGN.md` (+1 paragraph), `src/lib/server/root/socket.ts` (140 lines), `src/lib/server/root/hooks.ts` (284), `src/lib/server/core/changes.ts` (267), `src/lib/server/core/json.ts` (135, comment only), `tests/server/root/socket.test.ts` (261), `tests/server/root/hooks.test.ts` (558), `tests/server/core/changes.test.ts` (592), `tests/checks/tree/allow-duplication.txt` (line 31 removed), `docs/diagrams/` (as `npm run diagrams` wrote it), this report.

## Judgment calls (each reversible)

1. The brief says the head comments are corrected "where they describe a hand check"; none of the three describes one. I added one sentence to each of `socket.ts`, `hooks.ts` and `changes.ts` saying the input is read through a zod schema, and left the rest.
2. `hookBodyShape.safeParse` is called twice in `hooks.ts`, once in `handleHook` and once for the log's name in `handleHookRequest`, not through a shared helper, since `handleHook(body, now)` is a public pure function with its own tests and a helper would still parse twice.
3. `parseLine` answers `parsed as Change`, the cast the brief's decision 5 keeps; the four-field schema is deliberately not a schema of `Change`.
4. The DESIGN.md paragraph names the four readers that exist and does not say later steps widen it.

## Behaviour that changed

One, in `core/changes.ts` `append`. Before: a log whose last line was cut off (no trailing newline) received the next record on that same line, `{"at":"9999-01-01T00:00:00.0{"at":"2026-...","kind":"manifest",...}`, which `parseLine` refuses, so the record was lost from `readChanges`. After: `append` writes a newline first when the file is not empty and does not end in one, so the record sits on its own line and is read back. The readers of the four schemas answer what they answered before (the same cases pass on the unchanged and the changed tree).

## Limits of the green result

- `tests/server/core/changes.test.ts` is tagged `@module-tag slow` (existing head comment), so `npm test` and `npm run test:checks` leave it out. The new `parseLine` cases (11 to 13, 21 to 23) therefore did not run inside `checks.sh`; they ran through `npx vitest run tests/server/core/changes.test.ts` (21 tests, passed). The socket and hooks cases run inside `npm test`.
- The cases cover the behaviours listed; they do not cover a binary socket frame end to end (case 15 is unchanged code) or the routes' answers (`tests/routes` runs in `npm test` and passed).
- No look, since nothing a reader sees changed.

## Wrong or impossible in the brief

Nothing impossible. The brief's case 11 line kept the schema's four keys first and no top-level `__proto__` key, so it could not tell `parsed` from `safeParse(...).data`; the case now uses a line in the order oculus's writer makes and with a top-level `__proto__` key.

## Repair round 1

| Item | State | Command that shows it |
|---|---|---|
| 1 case 11 | DONE | the case uses `{"at":"a","kind":"k","file":"f","key":"q","field":"x","__proto__":{"z":1},"before":{"__proto__":{"z":1},"b":1},"after":1,"undo":"field","more":2}` and asserts `Object.keys(change)` in the order `at, kind, file, key, field, __proto__, before, after, undo, more`, `Object.hasOwn(change, '__proto__')`, the `before` own `__proto__` and `more`; passes in `npx vitest run tests/server/core/changes.test.ts`; failing run below |
| 2 six cases | DONE | the six titles are gone from `socket.test.ts`, `hooks.test.ts` and `changes.test.ts`; the `yaml` import of `hooks.test.ts` and the `changeAt` and `handleChanges` imports of `changes.test.ts` are gone (`grep -n "changeAt\|handleChanges\|from 'yaml'" tests/server/core/changes.test.ts tests/server/root/hooks.test.ts` prints only `changes.test.ts:20: import { parse } from 'yaml'`, which the file's deck fixture already used); the three files: `Tests  70 passed (70)` |
| 3 hooks head comment | DONE | `sed -n 15,17p src/lib/server/root/hooks.ts` prints the sentence "The body is read through a zod schema, and the `notify:` config through one held to `NotifyConfig`, ..." |
| 4 DESIGN.md paragraph | DONE | `grep -n '^\*\*Untyped input' DESIGN.md` prints the one-line paragraph as ruled |
| 5 json.ts comment | DONE | `sed -n 91,93p src/lib/server/core/json.ts` prints the two lines with no count |
| 6 subscriptionShape comment | DONE | `sed -n 52,55p src/lib/server/root/socket.ts` opens "The subscribe message a page sends." |
| 7 exact pin | DONE | `npm install --save-exact zod@4.6.5 --no-audit --no-fund`; `grep -n '"zod"' package.json` prints `82:        "zod": "4.6.5"`; `package-lock.json` holds `node_modules/zod` version 4.6.5 and the root entry `"zod": "4.6.5"` |
| 8 cut-off last line | DONE | `append` reads the text once (`textOf`, `linesIn`), sets `closing` (`changes.ts:218`) and writes it before the first record (`:236`); the case asserts the new record (`file` `a.yml`, `field` `f`) is read back, its `at` is later than the last good line's, and the cut-off text is still in the file on a line of its own; failing run below; the head comment gained the ruled sentence |
| 9 report | DONE | this file |

Failing run of item 1, with `changes.ts` answering `checked.data as Change` in place of `parsed as Change` (a one-line change, then `changes.ts` put back as it is above): `npx vitest run tests/server/core/changes.test.ts -t "own __proto__ keys"`:

```
 FAIL  tests/server/core/changes.test.ts > reading a line of the log > answers a line with its keys in the order they were written and its own __proto__ keys
AssertionError: expected [ 'at', 'kind', 'file', 'field', 5 more ] to deeply equal [ 'at', 'kind', 'file', 'key', 6 more ]
  [
    "at",
    "kind",
    "file",
-   "key",
    "field",
-   "__proto__",
+   "key",
    "before",
    "after",
    "undo",
    "more",
  ]
 Tests  1 failed | 23 skipped (24)
```

Failing run of item 8, on the code before the change to `append`: `npx vitest run tests/server/core/changes.test.ts -t "cut off"`:

```
 FAIL  tests/server/core/changes.test.ts > reading a line of the log > keeps the good lines and stamps a later moment when the last line was cut off
AssertionError: expected undefined to be 'f' // Object.is equality
 tests/server/core/changes.test.ts:450:        expect(added?.field).toBe('f');
 Tests  1 failed | 20 skipped (21)
```

After the change: `npx vitest run tests/server/core/changes.test.ts` printed `Test Files  1 passed (1)` and `Tests  21 passed (21)`.

Last lines of the final `checks.sh` run (after `npm run diagrams`):

```
$ npm test
 Test Files  348 passed | 19 skipped (367)
      Tests  5318 passed | 563 skipped (5881)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790780429495 COMPLETED 2472 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The loop of "What is on the tree" after round 1 prints the same counts as before (json.ts 3, file-poll.ts 1, git.ts 3, changes.ts 3, auth.ts 1, hooks.ts 1, watch/git.ts 3, watch/portfolio.ts 1, watch/sessions.ts 4; none for socket.ts). The ASCII gate over the files touched printed nothing.
