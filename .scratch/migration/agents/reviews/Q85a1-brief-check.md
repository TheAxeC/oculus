# Q85a1 brief check (on main at 077a0ba9)

`git rev-parse HEAD` printed `077a0ba9dfc169681c311d298c4d01d828639723`. Commands ran from `/Users/axelfaes/workspace/research-hub/tools/oculus` unless the scratch folder is named. Probe files written: `bc1.ts`, `bc1.mjs`, `bc2.mjs`, `bc3.ts`, `bc3.mjs`, `tsconfig.bc1.json`, `tsconfig.bc3.json` in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/zodprobe` (zod 4.6.5, TypeScript 6.0.3, node v24.21.0). Nothing in the repository was written. 17 findings, F1 to F17.

## Names

Command: `grep -rnE "<name>" . --exclude-dir=node_modules --exclude-dir=.svelte-kit --exclude-dir=build --exclude-dir=.agents --exclude-dir=.git --exclude=local.yml -I`, once per name. Hits outside "Paths this step writes":

- `parseSubscription`: none outside `src/lib/server/root/socket.ts:52,72,105` (in the paths) and `.scratch` briefs and reviews.
- `handleHook`: none outside `root/hooks.ts:54,235` and `tests/server/root/hooks.test.ts` (both in the paths).
- `notifyConfig`: `src/lib/server/root/context.ts:48,225`, `src/routes/api/(sessions)/hook/+server.ts:7,14`, `tests/server/root/context-fixture.ts:8,47`. Each calls `notifyConfig(config)`; the signature and the answer stay, so none is made false.
- `parseLine`: `core/changes.ts:131,148,175` only. `parseLineMarks` (`core/git.ts:100,513`, `core/git-parse.ts:398`) is another function.
- `str` of `root/hooks.ts`: `grep -n "\bstr\b" src/lib/server/root/hooks.ts` prints lines 41, 44, 60, 63, 65, 67, 69, all removed by item 5. `str` of `data/helpers/guards.ts` is untouched.
- `subscriptionShape`, `hookBodyShape`, `notifyShape`, `changeLineShape`: no hit in the tree.
- Line citations of the four changed source files: `grep -rnoE "(socket|hooks|changes|json)\.ts:[0-9]+(-[0-9]+)?" DESIGN.md HELP.md README.md src tests config utils docs` printed nothing. `DESIGN.md:360` names `server/core/changes.ts` for the record of a write and stays true. `HELP.md`: no hit.
- Checks that read these files: `grep -rn "root/socket\|root/hooks\|core/changes\|core/json" tests/checks tests/fixtures utils` hits `allow-duplication.txt:31` (item 10) and lines 73 to 76 (see F16). No test reads their source text.
- Diagrams: `utils/diagrams/source.mjs:94-97` answers null for a specifier that does not start with `.` or `$lib/` ("or null for a package"), so `import { z } from 'zod'` draws nothing. `docs/diagrams/writes.dot:8,43-46` draws `core/changes.ts`; `npm run diagrams` is in Verify 1 and `docs/diagrams/` is in the paths.

F1. Item 8. `grep -rnE "[a-z]Shape\b"` prints `src/lib/server/core/auth.ts:78` `export type RefusalShape` with its parameter `shape` at `:92`, and `src/lib/state/sources/repositories/repositories.ts:563,566` `RepoShape` and `repoShape`, read by four views. Item 8 says why `Schema` is taken and says nothing of `Shape`, which already names a type in `server/core`, one of this step's two folders. Smallest change: one sentence in item 8 naming `RefusalShape` and `repoShape` and saying how a reader tells a zod schema from them (a lower camel case `const` assigned from `z.`), or another suffix.

F2. Item 5 against item 8. Item 5 writes `const field = z.string().min(1).optional().catch(undefined)`, a module-level zod schema named `field`; item 8 says a schema ends in `Shape`. Smallest change: name it in item 5 (for example `filledTextShape`) and list it in item 8.

F3. `src/lib/data/helpers/guards.ts:3-5` says "A parsed config file, a manifest, a feed, a socket frame and an endpoint's answer all arrive as `unknown`, and every module that reads one narrows it the same few ways". After this step `parseSubscription`, the reader of the subscribe frame, narrows through a schema. The file is not in the paths and no sentence of the brief names it. The other frame reader, `machine/pty/channel.ts:96-124`, still narrows by hand, so the sentence is not yet wholly false. Smallest change: one line under item 9 saying the head comment of `guards.ts` is left to the step that converts its last reader, with that step named.

## The step line

`sed -n 286p .scratch/migration/plan.md` equals the brief's "The plan line" word for word.

- "runtime validation of untyped input on `zod`": items 1, 2, 4, 5, 6, 7.
- "in the server's `core` and `root` folders (10 files with hand checks)": the premise loop, item 9 and Verify 3.
- "the `data/model` types kept as the facade through `satisfies`": items 4 and 7 only (F5).
- "the redundant hand checks deleted": items 4 to 7 ("Lines 59 to 62 and the `typeof` of line 66 go", "The helper `str` and its comment go"), Verify 3.
- "every reader answering what it answers today": items 2, 3, 12, the cases, Verify 5.
- "the unsplit step's brief check": the section "What the unsplit check left" below.
- LA7 (a), Z73, Z96: item 1, "Libraries checked".

No part is without an item.

F5. Items 5 and 6. Two of the four schemas carry no `satisfies`, and item 6 does not say so or why. `notifyShape` can be held to the declared `NotifyConfig`: `npx tsc -p tsconfig.bc3.json` exited 0 on `z.object({...}).transform((held) => ({ enabled: held.enabled, events: held.events, quietSeconds: held.quiet_seconds })) satisfies z.ZodType<NotifyConfig>`, and `bc1.ts` compiles `notifyShape satisfies z.ZodType<{ enabled: boolean; events: string[]; quiet_seconds: number }>`. A builder can leave both `hooks.ts` schemas unheld and meet every Verify item (Verify 4 asks `satisfies` of `socket.ts` and `changes.ts` only). Smallest change: item 6 says which declared type `notifyShape` is held to, item 5 keeps its sentence that the body has no declared type, and Verify 4 counts `satisfies z.ZodType` in `hooks.ts` too.

## Premises

Rerun and equal to the brief:

- `grep -n '"zod"' package.json` printed nothing; `ls node_modules/zod` printed "No such file or directory"; `npm view zod version license` printed `version = '4.6.5'`, `license = 'MIT'`.
- The loop printed `3 core/git.ts`, `1 core/auth.ts`, `1 core/file-poll.ts`, `3 core/json.ts`, `1 root/watch/portfolio.ts`, `3 root/watch/git.ts`, `4 root/socket.ts`, `10 root/hooks.ts`, `6 core/changes.ts`, `4 root/watch/sessions.ts`: ten files, 36 lines.
- Every `file:line` of "What is on the tree" read as stated: `socket.ts:52-68`, `model/index.ts:205`, `hooks.ts:44-47,54-72,104-117,231-234`, `changes.ts:130-143,103-112,203`, `json.ts:91-92,97,102,107`, `auth.ts:118`, `git.ts:191,194,253` with `wc -l` 885, `file-poll.ts:22`, `watch/sessions.ts:143,144,275,281`, `watch/portfolio.ts:227`, `watch/git.ts:124,127,307`, `allow-duplication.txt:31`, `README.md:13`, `DESIGN.md:146,148`.
- `ls tests/server/root | wc -l` printed 10; `tests/server/core` holds 8.
- `grep -rn "core/json.ts'\|'./json.ts'" src/lib/server | grep -c isMap` printed 9.
- `node q85a1.mjs` printed 15 `sub same`, 17 `hook same`, 8 `line same`, no DIFF under variant B, a DIFF under variant A for `Infinity`, and `20000 lines hand 6.6 ms zod 13.2 ms`.

F6. "What is on the tree", the `core/json.ts` bullet: "nine modules import from `core/json.ts` one of `isMap`, `text`, `whole`, `list`". `grep -rnE "import .*\b(isMap|text|whole|list)\b.*(core/json\.ts'|'\./json\.ts')" src/lib/server | wc -l` printed 11: the nine that import `isMap`, plus `sessions/stores/transcripts.ts:39` (`whole`) and `git/git-routes.ts:22` (`text`). Smallest change: "eleven modules import one of the four, nine of them `isMap`", so the comment item 11 has the builder write carries the right count for what it names.

F7. A config value is cast with no check in `root`, and the brief does not list it. `src/lib/server/root/context.ts:266-267`: `model: config.usage_refresh_model as string,` and `refreshMin: config.usage_refresh_min as number,`, where `config` is `make.loadConfig(engine).config` (`context.ts:205`), the same object whose `notify:` key item 6 treats as untyped input. The premise loop cannot see the file: `grep -c unknown src/lib/server/root/context.ts` is 0, and the loop starts from files that hold the word. The only check is downstream in `machine/usage/refresh.ts:139-142` (`Number.isFinite(options.refreshMin)`, `options.model.trim() === ''`); that `.trim()` throws a TypeError on a model that is a number is reasoned from the code, not run. Smallest change: add the two lines to "What is on the tree" and either convert them here (`context.ts` and `tests/server/root/context.test.ts` added to the paths, with a case) or name Q85a4 (`machine`) as the step that owns them and say so in item 9.

F8. Item 9 covers only the lines the loop's regex matches. These places in the two folders take a value typed `unknown`, or read a request or a subprocess, and are in neither list (from `grep -rnE "JSON\.parse|readJson|\.json\(\)|request\.text\(\)|searchParams|from 'yaml'| as Record<string, unknown>|: unknown" src/lib/server/core src/lib/server/root` and a read of the files):
- `core/git.ts:866` `function milliseconds(timeout: unknown)` (`Number(timeout)`), `:878` `function bytesOf(output: unknown)` (`Buffer.isBuffer(output)` on `spawnSync`'s `stdout` and `stderr`, `:809,812`; item 2 names "the answer of a subprocess"), `:883` `short(value: unknown)`.
- `core/git-parse.ts:552` `shortReason(value: unknown, width)` (`instanceof Error`, else `scalar(value)`).
- `root/watch/git.ts:402` `JSON.parse(text) as Message`, text this process's Hub sent to the watcher's own sink.
- `core/changes.ts:234` `new URL(request.url).searchParams.get('before') ?? undefined`; item 2 names "a request's body or query".
- `root/hooks.ts:212-213` `Number(contentLength) > MAX_BODY_BYTES` on a header.
- `root/socket.ts:32` `subscribed(sink, channels, token: unknown, expectedToken)`, which after item 4 receives `string | undefined`, and `:103-104` `ws.on('message', (data: unknown) => String(data))`.
- `core/auth.ts:99` `(await request.json()) as unknown` and `core/json.ts:28-30` `readJson(): unknown`, which hand the value on to callers in other folders.
None is a hand narrowing of an outside value that a schema would replace without changing an answer, on my reading: the timeout and the error are arguments from inside the process, `stdout` is typed by node, the query and the header are `string | null`. The brief's report table is "of the ten files", so `git-parse.ts` and these lines would go unreported. Smallest change: list them under "The other check lines" with one reason each, and make the report's table cover them.

F9. Item 9 and decision 4: "`gatedBody` keeps `isMap`: it answers the object the routes read, and `z.record(z.string(), z.unknown())` answers a copy without an own `__proto__` key." Item 3's second form removes that reason: the schema only accepts or refuses and the input object is answered. `node bc3.mjs` printed `gate same` for `{}`, `{"a":1}`, `{"__proto__":{"x":1},"a":1}`, `[]`, `null`, `"s"`, `3`, `true`, `{"constructor":1}`, `{"1":2}`, `1e999`: `isMap` and `z.record(...).safeParse(...).success` agree on every one. What `isMap` gives that the schema does not is the type narrowing: `bc3.ts` compiles with `// @ts-expect-error` on `return gate.safeParse(body).success ? body : null;` (`tsc` exit 0), so the schema form needs a cast. `gatedBody` is a request body of type `unknown` narrowed by hand in `core`, which is the step line's subject. Smallest change: either convert it by the second form (add `core/auth.ts` to the paths; `tests/server/core/auth.test.ts` holds the 400) or state the real reason (one type guard against a schema plus a cast) in item 9 and decision 4.

Each line the brief says stays is truly not on untyped input, read at its line: `core/git.ts:191,194` (`statusFor(roots: string[], ...)`, called from `root/watch/git.ts:209,379` with `string[]`), `:253` (`pathInside(root: string, path: string)`), `core/changes.ts:103,104,109` (`same`), `core/file-poll.ts:22` and `root/watch/sessions.ts:143,144` (type positions), `:275,281` (timer `unref`), `root/watch/portfolio.ts:227` and `root/watch/git.ts:307` (`fs.watch` filename), `root/watch/git.ts:124,127` (`rootsOf(payload: SessionsPayload)`).

## Cases and checks

Cases 1 to 13 were not run through the real functions, since that needs a test file inside the repository. Each was read against `socket.ts:52-68`, `hooks.ts:44-72,104-117` and `changes.ts:118-165`, and the inputs of cases 1 to 13 were run through copies of the hand code in `q85a1.mjs`. No case has an expected result the code on main does not give.

F10. "Cases", first paragraph: "Existing cases hold 12 and part of 8 and 13". `grep -n "writeFileSync(" tests/server/core/changes.test.ts` prints lines 59, 70 and 127 (a manifest, a collection body, the deck); no case of that file or of `tests/routes/git/changes.test.ts` writes a line into the log, and `grep -rnE "not json|not JSON|half|cut off|malformed" tests/server/core/changes.test.ts` printed nothing. Cases 12 and 13 are held by nothing today. What existing cases do hold: part of 2 (`socket.test.ts:90-93`), part of 5 (`hooks.test.ts:73-84`), part of 8 (`hooks.test.ts:263-273`), and 10 without the `other` key (`hooks.test.ts:258-261`). Smallest change: "Existing cases hold part of 2, 5, 8 and 10; every case is written as a new case".

F11. Item 5, second half, has no case. It converts `handleHookRequest` lines 231 to 234 (the name for the first-payload log). `grep -rn "first .* payload" tests` printed nothing and `logged` appears in `hooks.test.ts` only as the fixture field at line 282, so no existing case holds the log either. A builder who logs `read.data` in place of the body (dropping `transcript_path` and every other key the schema does not name, which is the log's whole use per `hooks.ts:13-15`), or who logs only known names, passes every case and every Verify item. Smallest change: cases in `hooks.test.ts` through `handleHookRequest` with `console.error` spied: a body `{"hook_event_name":"SessionStart","session_id":"a","transcript_path":"/x"}` is logged once with `JSON.stringify` of the body as sent, extra key included, and answers 200; the same name posted twice is logged once; bodies `[]`, `null`, `3`, `{}`, `{"hook_event_name":""}`, `{"hook_event_name":3}`, an empty text and a text that is not JSON are not logged and answer 200.

F12. Verify 3. Two of its numbers are not what the described change gives. I applied the change as items 4 to 7 word it to a scratch copy of `src/lib` and reran the loop and the `safeParse` grep (the copy is removed). Output: `3 core/json.ts`, `3 core/git.ts`, `1 core/file-poll.ts`, `1 core/auth.ts`, `3 core/changes.ts`, `0 root/socket.ts`, `1 root/hooks.ts`, `1 root/watch/portfolio.ts`, `4 root/watch/sessions.ts`, `3 root/watch/git.ts`; `safeParse` at `socket.ts:67`, `hooks.ts:54,110,231`, `changes.ts:147`. The counts match Verify 3 and 4. What does not: (a) the three lines of `same` are 104, 105 and 110, not "103, 104 and 109", since `import { z } from 'zod'` adds a line above them; (b) `hooks.ts` prints 1 only when no `z.infer<typeof hookBodyShape>` is written, and item 5's "the reader uses the schema's inferred type" invites exactly that line, which the regex `typeof ` counts. Smallest change: "3 `core/changes.ts` (the three lines of `same`)" and "1 `root/hooks.ts` (the filter of item 6), plus one for each `z.infer<typeof ...>` written, named in the report". `grep -c "satisfies z.ZodType"` printing 1 each is reasoned from the text of items 4 and 7 (72 characters, under the formatter's 100), not run.

## The question

- Cases 1 to 13: yes, each can pass with the goal unreached. They pass on the unchanged tree by construction (Verify 5), so they hold behaviour and nothing about schemas.
- Cases 14 to 16: yes, same reason. Case 15 is held by the live cases of `socket.test.ts:129,173`, where `ws` hands every frame to the listener as a Buffer.
- The step line and Verify 1: yes. `checks: 7 commands passed` is what main prints with no zod in the tree.
- Verify 3 with Verify 4: no for the four listed places. A hand check left in place shows in the loop's count and a missing schema in the `safeParse` count.
- Item 1: no. An import of a missing package fails `npm run check`. The README sentence: yes, no check reads it (`grep -rln "package\.json\|README\.md" tests/checks utils` hits `history.test.ts`, which reads the documents for plan ids and dates only).
- Item 2: partly. "zod's own error text is never shown or logged" has no check (F13).
- Item 3 and item 7: yes (F14).
- Items 4 and 6: no, given Verify 3 and 4 and cases 1 to 4, 8 to 10.
- Item 5: yes for the log (F11); no for `handleHook`.
- Item 8: yes, no check reads the names (F13).
- Item 9: yes (F7, F8, F9).
- Item 10: no. `duplication.test.ts:596-606` fails on a stale entry.
- Item 11: yes (F15).
- Item 12: no, the diff shows it.

F13. Cases 1, 3, 6, 7 and Verify. (a) `toEqual` treats a key holding `undefined` and an absent key alike, so "the keys `title` and `cwd` are absent, not undefined" (case 6), "the answer has no `extra` key" (case 3) and `token: undefined` (case 1) pass under `toEqual` whatever the reader does; the existing cases use `toEqual` (`hooks.test.ts:45,58`). Smallest change: the brief says these cases assert with `toStrictEqual` or over `Object.keys`. (b) Add to Verify: `grep -nE "\.error\b|\.issues|prettifyError|treeifyError" src/lib/server/root/socket.ts src/lib/server/core/changes.ts` prints nothing, and in `hooks.ts` prints only the `console.error` and `done.error`-style lines that are there today (`hooks.ts:171,179`), so no zod error text is read. (c) Add: `grep -nE "^const [a-zA-Z]+ = z" <the three files>` prints only names ending in `Shape`.

F14. Item 7 against "the `data/model` types kept as the facade through `satisfies`". The schema is held to `Pick<Change, 'at' | 'kind' | 'file' | 'field'>` while `parseLine` answers `Change`, so the answer is a cast. `bc1.ts` compiles with `// @ts-expect-error` on the same schema `satisfies z.ZodType<Change>` (`tsc` exit 0): the four-field schema is not a `Change`. `key`, `before`, `after`, `undo` and `undoes` of a line are checked by nothing and reach `edit/writes/undo.ts:91` (`{ id: change.key }`), `:112`, `:116` (`change.key in held`) typed `string`. No later step line owns this: Q85a2 meets a typed `Change`. Two parts of the plan line pull apart here (every reader answering as today, and the declared type held through `satisfies`); the brief picks the first and says so in item 7, but does not list it under "Decisions taken in this brief". `append` always writes all the fields (`changes.ts:193-198`), so only a line not written by oculus lacks them. Smallest change: add it as a decision with both options stated: (a) as written, four fields, the cast kept; (b) a schema of every field used by the second form, which refuses a line lacking `key`, `before`, `after` or `undo` and changes case 13's last clause. Which one is the orchestrator's or Axel's.

F15. Item 11, the DESIGN.md paragraph. (a) It states as a fact of the tool that "a value from outside the process is checked by a zod schema beside the function that reads it". After this step that holds for four readers in `server/core` and `server/root`; `machine/pty/channel.ts:96-124`, `core/auth.ts:118` and the readers of Q85a2 to Q85d still narrow by hand, so the sentence is false of most of the tree on the day it lands (rules file: "A sentence in a document ... that the change makes false is a defect of the change"). (b) "a reader answers for every input what the hand check answered" describes what came before; `history.test.ts:1-3` says "a document says what the tool is and does". Smallest change: the paragraph names the folders it holds for ("in `server/core` and `server/root`"), each later brief widens it, and the third clause says what a reader does now (a field of the wrong type takes its default or is dropped, a value of the wrong kind is refused).

## The conversions

`npx tsc -p tsconfig.bc1.json` exited 0 under `strict`, `verbatimModuleSyntax`, `isolatedModules`, TypeScript 6.0.3, with the real declarations of `Subscription` (`model/index.ts:205-209`) and `Change` (`changes.ts:35-63`) copied in:

- `subscriptionShape ... satisfies z.ZodType<Subscription>` compiles, with `token: z.string().optional().catch(undefined)`.
- `z.looseObject({ at, kind, file, field }) satisfies z.ZodType<Pick<Change, 'at' | 'kind' | 'file' | 'field'>>` compiles; the same with `z.object` compiles; a schema lacking `field` is refused (`@ts-expect-error` consumed).
- `z.union([z.number().min(0), z.literal(Infinity)])` is accepted by the type-check. At run time `z.literal(Infinity)` accepts `Infinity` and refuses `-Infinity` and `Number.MAX_VALUE`; `z.number().min(0)` refuses `Infinity` and accepts `-0` (`node bc2.mjs`).
- `z.infer<typeof hookBodyShape>` accepts `{ hook_event_name: '' }`.

Inputs the orchestrator's probe did not try, hand code against schema form, deep strict equality (`node bc1.mjs`, `node bc2.mjs`):

- `notifyConfig`, 38 inputs: a `Date`, a `Date` with own keys, a class instance, a null-prototype object, a `Map`, a `Set`, a `RegExp`, a function, a Promise, a getter, inherited keys, `-0`, `-Infinity`, `5e-324`, `Number.MAX_VALUE`, a bigint, a `Number` object, `true`, `null`, `undefined`, a list of lists, a sparse list, `String` objects in the list, an array-like, a typed array, empty strings in the list, a `Boolean` object, a symbol key, an own `__proto__` key. Every one `same`. The default is the same object in both forms (`notify default identity: hand true zod true`).
- `handleHook`, 22 inputs: a `String` object as `session_id`, as `hook_event_name` and as `message`, a class instance, a null-prototype object, a `Date` and a `Map` with own keys, inherited keys, getters, a function with keys, the names `__proto__`, `constructor`, `stop`, ` Stop`, a lone surrogate, a NUL, fields `undefined`, fields that are lists, a 1 MB message. Every one `same`; the key order of the answer is the same.
- The log's name, the same inputs plus six: one difference, a body with a throwing getter (the hand code logs, then `handleHook` throws; the schema form throws before the log). A body comes from `JSON.parse` (`hooks.ts:227`) and holds no getter, so it cannot occur.
- `parseSubscription`, 22 inputs: duplicate keys in both orders, `channels` given twice, a nested list, `[null]`, `[""]`, a repeated channel, `Subscribe`, an own `__proto__` beside the fields, `token` a map or a list, surrounding spaces, a BOM, 200,000 channels. Every one `same`.
- `parseLine`, 22 lines: duplicate keys in both orders, an own `__proto__` at the top and beside the fields, `constructor` and `toString` keys, keys in another order and numeric keys (order kept: `z,field,file,kind,at,a`), `before` nested 5,000 and 100,000 deep, 50,000 keys, `undoes` a number, an unknown `undo` word, a BOM, a trailing CR. Every one `same`; the input object is not changed by `safeParse` and a frozen input parses. 20,000 refused lines: 3.2 ms by hand, 17.6 ms through the schema.
- YAML: `yaml`'s `parse` gives `Infinity` for `.inf`, `-Infinity` for `-.inf`, `NaN` for `.nan`, the string `yes` for `yes`, and a `Set` for `!!set` (`node -e` with the repository's `yaml`); each answers the same in both forms by the rows above.

No finding beyond F2 and F5.

## Repository checks

- Duplication: `run-jscpd.js --min-lines 8 --min-tokens 50 --format typescript,javascript,svelte --ignore-pattern '(?m)^\s*import\b[^;]*;'` over a scratch copy of `src/lib` printed 102 clones before the change, one of them `machine/pty/channel.ts:96-105 | root/socket.ts:52-61`, and 101 after it, none touching `socket.ts`, `hooks.ts`, `changes.ts` or `channel.ts`. Line 31 is the only entry that goes stale, and the three schemas share no clone with each other or with another file, for the text as I wrote it from items 4 to 7.
- Size: after the change `hooks.ts` 261, `socket.ts` 136, `changes.ts` 244 lines; the test files are 204, 393 and 500 against 900. `core/git.ts` (885) is not touched.
- Folder rule: no file is added; `tests/server/root` stays at 10.
- Import order and boundaries: `tests/checks/imports/graph.ts:26-32` resolves only `$lib/` and relative specifiers; a package is outside both checks.
- `package.json` and the README sentence: no check reads either for dependencies.
- Diagrams: packages are not drawn (`source.mjs:94-97`).
- History check: `tests/checks/source/history.test.ts:21` reads `README.md` and `DESIGN.md` whole for plan ids, dates and "this session"; the new sentence and paragraph must hold none (a step id such as the ones in this brief would fail it).

F16. Item 12 and item 10 ("No other line of the file changes"). `allow-duplication.txt:73-76` holds four clones between `tests/routes/edit/write-fixture.ts` and `tests/server/core/changes.test.ts` (at lines 64, 95, 105, 134 of the test file), and `tests/routes/git/changes.test.ts:17-22` has a `log()` helper that builds a `ChangeLog` over a scratch file. Cases 11 to 13 need exactly such a helper in `tests/server/core/changes.test.ts`; one copied from the route test, or a block of new cases sharing fifty tokens over eight lines with another test file, is a new clone and turns `npm run test:checks` red. Smallest change: item 12 says the new cases build their log through the file's own helpers (`scratchDir` is imported at `changes.test.ts:26`, `logOf` is at `:144`) and that a new clone is folded, never added to the allowlist.

Not run: `npm run lint` (typescript-eslint `strictTypeChecked`) on the schema forms; see "Declined to judge".

## Implied inputs

F17. Inputs the step implies and no case lists, each with its expected result (all reasoned from the code on main and, where a probe row exists, from `bc1.mjs` and `bc2.mjs`):

1. A hook body with a name this route does not know (`SessionStart`): answered 200, no event, and logged once with the body as sent. No case (F11).
2. A hook request with an empty text: the body is `{}`, 200, nothing logged (`hooks.ts:227`).
3. `handleHook` with `session_id: ' '`: accepted, `session: ' '` (only the empty string is dropped; case 7 has this for `title` alone).
4. `handleHook` with a field that is a list or a map (`message: ['m']`, `cwd: {}`): the key is absent from the answer.
5. `parseSubscription('')` and a BOM before the JSON: null, and the text goes to `terminals.inbound` (`socket.ts:121`).
6. `parseSubscription` with a key given twice: the last one counts, so `{"type":"other",...,"type":"subscribe"}` is a subscription.
7. `parseSubscription` with `channels: [""]` and with a channel named twice: accepted as sent.
8. `notifyConfig` with `quiet_seconds: -0`: answers `-0` (the probe printed `-0` for both forms; `toEqual` tells `-0` from `0`). With `-Infinity` (YAML `-.inf`): 3.
9. `notifyConfig` with `events` a YAML `!!set`: the default events.
10. `notifyConfig` with `enabled: yes` unquoted in YAML: the string `yes`, so `enabled` is the default `true`.
11. A change log whose last line is cut off, then an append: `lastMoment` (`changes.ts:173-181`) skips the bad line and the new stamp rises past the last good one. `parseLine` has three callers (`:148`, `:175`) and the cases reach one.
12. `changeAt` over a log holding a bad line: the good line is still found.
13. A log line with a trailing CR, and a log starting with a BOM: the CR line is read, the BOM line is skipped.
14. A log line with a key given twice: the last value counts (`at` a number then a string is read; a string then a number is skipped).
15. A log line with `undo` an unknown word or `undoes` a number: read as it is (F14).
16. `GET /api/changes?before=a&before=b`: the first value; `?before=`: the whole first page (`changes.ts:163,234`). Unchanged code, named so the builder leaves it.

Smallest change: add 1, 3, 8, 11 and 14 as cases (they are the ones on a converted function with no case near them) and list the rest under "Implied by the step".

## ADRs

`ls docs/adr ../../docs/adr` from `tools/oculus` printed "No such file or directory" for both; `ls docs` prints `diagrams` only. Findings: none.

## What the unsplit check left ("Closed" of `Q85a-brief-check.md:169`)

- The entry defined by where a value of type `unknown` is narrowed: closed, item 2. The places the definition misses in these two folders are F7, F8, F9.
- Each reader answering exactly what it answers on main:
  - JSON `1e999`: closed for `core` and `root`. The one number a converted reader takes is `quiet_seconds` (case 9 and the union of item 6); in a hook body, a subscription or a log line a number is refused, dropped or passed through unread.
  - The blank string: closed by case 7 for `title`; `session_id` is F17.3.
  - `null`: closed, cases 3, 5, 7, 8.
  - The large integer: closed, case 9 (`2 ** 60`).
  - The own `__proto__` key: closed, cases 4, 5, 11 and item 3.
  - The repeated query key: not addressed. The one query read in the two folders is `core/changes.ts:234`, which stays; the brief does not say so (F8, F17.16).
- `tests/fixtures/kinds.ts`: rightly left to Q85a2; it reads `edit/bodies.ts`.
- `tests/checks/tree/allow-duplication.txt`: closed for these folders, item 10 (line 31). Lines 22 to 25 belong to Q85a2, Q85a4 and Q85a5.
- The DESIGN.md line citations: nothing to close here. The citations are of `auth.ts:29-38` and `watch/git.ts:207`, files this step does not change; if F9 is closed by converting `gatedBody`, `DESIGN.md:276` must be re-cited.
- The head comments: closed for `core/json.ts`, `root/socket.ts`, `root/hooks.ts`, `core/changes.ts` (item 11); missed for `data/helpers/guards.ts:3-5` (F3).
- The schema name form: closed, item 8, with F1 and F2.
- The test files named per case: closed.
- No revert directive: closed, Verify 5 and "Conventions".

## Declined to judge

- Whether `parseLine` should check every field of `Change` (F14) and whether `gatedBody` is converted here (F9): each changes scope or an answer, so the ruling is the orchestrator's or Axel's.
- Whether the config casts at `context.ts:266-267` belong to this step or to Q85a4 (F7): the plan's step lines split by folder and the value crosses two.
- `npm run lint`, `npm run check`, `npm run build`, `npm test` and `npm run test:checks` on the changed tree: not run, since that needs the change written in a checkout. The lint verdict on `z.literal(Infinity)`, on `parsed as Change` and on the `satisfies` lines is not verified.
- Cases 1 to 13 through the real functions with vitest: not run, for the same reason; checked by reading the code and by copies of the hand code.
- Clones among the new test cases: they depend on how the builder writes them (F16).
- The brief has the builder write its report under `.scratch/migration/agents/reviews/`, while the rules file says a builder never edits anything under `tools/oculus/.scratch/`. Earlier reports sit at that path (`Q79a-report.md`), so I read it as the standing practice and did not raise it as a finding.
- `tools/oculus/config/local.yml`: not opened. Ports 8787 and 8790: not touched.

Usage: claude-opus-5-5, 250,287 tokens, 47 tool uses, 799,726 ms (from the completion notice).

## Closed

Each by a change to `agents/briefs/Q85a1.md`, before the preparation commit.

- F1, F2: item 8 names `RefusalShape` and `repoShape` and how a schema is told from them; `field` is `filledTextShape`.
- F3: the head comment of `guards.ts` is booked on Q85a5's line in `plan.md`, and the brief says so under "What is on the tree".
- F5: `notifyShape` ends in a transform held to `NotifyConfig`; Verify 4 counts `satisfies` in `hooks.ts`.
- F6: eleven importers, nine of `isMap`.
- F7: the two casts of `root/context.ts` are booked on Q85a4's line in `plan.md`, since their check is in `machine/usage/refresh.ts`; the brief says so.
- F8: the lines are listed with their reasons, and the report's table covers them.
- F9: item 9 gives the real reason `gatedBody` keeps `isMap`.
- F10: the sentence on existing cases corrected.
- F11: cases 17 and 18.
- F12: Verify 3 reworded.
- F13: `toStrictEqual` for absent keys; the greps added to Verify 4.
- F14: decision 5, with both options.
- F15: the DESIGN.md paragraph names the two folders and says what a reader does.
- F16: item 12 names the file's own helpers and forbids a new allowlist entry.
- F17: cases 19 to 23 and the list of case 24.
