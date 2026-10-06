# Step Q85a1 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85a1, base 1ea26d17)

A page this report cites is named with its section. A finding in code keeps its `file:line`. Paths are relative to `tools/oculus` in the worktree unless absolute.

## Verification (rerun by the reviewer)

```
$ npm run diagrams            (from tools/oculus; listed docs/diagrams/*.dot and *.svg; `git status --short` after it shows no path under docs/diagrams)
$ sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   -> exit 0
$ npm test
 Test Files  348 passed | 19 skipped (367)
      Tests  5321 passed | 566 skipped (5887)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790779072268 COMPLETED 2472 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

$ npx vitest run tests/server/core/changes.test.ts          (tagged slow, not inside checks.sh)
 Test Files  1 passed (1)
      Tests  24 passed (24)

$ npx vitest run tests/server/core/changes.test.ts tests/server/root/hooks.test.ts tests/server/root/socket.test.ts --reporter=verbose
 Test Files  3 passed (3)
      Tests  76 passed (76)
 (the 27 new cases the builder's report lists each printed as passed, same names)

$ the loop of the brief's "What is on the tree"
3 core/json.ts, 1 core/file-poll.ts, 3 core/git.ts, 1 core/auth.ts, 3 core/changes.ts, 1 root/watch/portfolio.ts, 1 root/hooks.ts, 3 root/watch/git.ts, 4 root/watch/sessions.ts; no line for root/socket.ts

$ grep -n "safeParse" socket.ts hooks.ts changes.ts
socket.ts:70, hooks.ts:66, hooks.ts:138, hooks.ts:254, changes.ts:157
$ grep -c "satisfies z.ZodType"      -> hooks.ts:1, socket.ts:1, changes.ts:1
$ grep -nE "\.issues|prettifyError|treeifyError"   -> nothing
$ grep -nE "\.error"                 -> hooks.ts:194 and hooks.ts:202, both console.error / error.message of osascript; no parse result's .error
$ grep -nE "^const [a-zA-Z]+ = z"    -> changeLineShape, filledTextShape, hookBodyShape, notifyShape, subscriptionShape
$ grep -n '"zod"' package.json       -> 82:        "zod": "^4.6.5"      node_modules/zod/package.json version 4.6.5
$ grep -rn "seven session\|the helper .str" src tests config HELP.md DESIGN.md README.md   -> nothing
$ importers of core/json.ts that name isMap, text, whole or list -> 11 modules (9 under sessions, files/fs.ts, git/git-routes.ts); the brief's isMap count grep -> 9
$ ls tests/server/root | wc -l       -> 10
$ ls docs/adr                        -> No such file or directory
$ cmp of the worktree's report and the ledger's report -> identical
$ git status --short                 -> the 12 modified paths of the diff stat and the untracked report, nothing else
```

One more run, by the reviewer, to compare the old readers with the new: a `node --input-type=module -e` script from `tools/oculus` holding the four hand-written readers copied from the diff's removed lines and the four schema readers copied from its added lines, compared with `isDeepStrictEqual`, key order, `Object.is` on `quietSeconds`, identity of the default object and of the default events array, and own `__proto__`. It printed `compared 179 differences 0`. Inputs: every input of cases 1 to 13 and 17 to 24, plus `undefined`, `true`, a bigint, a function, a symbol, `new String`, `new Number(5)`, an object with a null prototype, an object whose fields are inherited, a lone surrogate, `channels` a string, `channels: [null]`, `token` a list or a map, `events` an array-like object, `quiet_seconds` of `null`, `true`, `[5]`, `Number.MIN_VALUE`, `Number.MAX_VALUE`, and `notify` a `Date`, a `Map`, a function. The same script printed, for the second form of item 3:

```
case-11 line via .data: keys at,kind,file,field,key,before,after,undo,more | own __proto__ in before: true | more: 2 | same object: false
writer-order line: parsed keys at,kind,file,key,field,before,after,undo | .data keys at,kind,file,field,key,before,after,undo
top-level own __proto__: parsed true .data false
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. `package.json:82` and the lock entry `node_modules/zod` 4.6.5 MIT; README.md line 13 names `zod` (MIT) in the sentence's form. The range `^4.6.5` is what the brief's own command `npm install zod@4.6.5` writes; the lock file holds 4.6.5; `package.json` has both exact pins (`shiki` 4.4.3) and ranges (`ws` ^8.21.3). What the range allows: an `npm update` or a regenerated lock takes a later 4.x, and the brief's equality runs (decision 3) and mine were on 4.6.5 only. Whether to pin is the orchestrator's choice; the builder reported it as judgment call 1.
- 2: holds. Each schema is a `const` in its reader's file; the 179-input comparison found no differing answer; the three greps for zod's error text print nothing.
- 3: holds in the code (`socket.ts:70-73`, `hooks.ts:66-81`, `hooks.ts:138-139` read `.data`; `changes.ts:157` answers `parsed`). The test that stands for the second form does not prove it: Proof 1.
- 4: holds. `socket.ts:56-60` is the brief's schema with `satisfies z.ZodType<Subscription>`; the four hand lines and the `typeof` are gone.
- 5: holds. `hooks.ts:45-58`, `:66-81`, `:254-257`; `str` and its comment are gone; `logFirstPayload` receives `body`, never `named.data`. `hookBodyShape.safeParse` runs twice per request (`:254` and `:66`). The brief's verify item 4 counts three calls in `hooks.ts` as the expected form, so this is what the brief asked; the second parse reads six keys of a body capped at 64 KiB.
- 6: holds. `hooks.ts:119-134` is the brief's schema and transform; `notifyConfig` answers `DEFAULT_NOTIFY` itself on refusal (identity compared in the run above).
- 7: holds. `changes.ts:138-143` and `:157`.
- 8: holds. The five names from the grep.
- 9: holds. The diff touches none of `core/auth.ts`, `core/git.ts`, `core/git-parse.ts`, `core/file-poll.ts`, `root/context.ts`, `root/watch/*`; `core/json.ts` changes in its comment only (lines 91-93); the report's table gives a reason per line.
- 10: holds. One line removed from `tests/checks/tree/allow-duplication.txt`, the `channel.ts` / `socket.ts` entry; `npm run test:checks` passes.
- 11: holds as worded (paragraph between `**Auth.**` and `**Processes.**`, README sentence, `json.ts` comment with the counts the grep gives, one sentence added to each head comment, no step id or date). Sentences of it are not true of the tree: Standards 1 to 4.
- 12: holds. The test diff is additions and one reflowed import per file; no test file added; the `changes.test.ts` cases use `target`, `logOf` and two new helpers; the duplication check passes with no allowlist line added.

Cases of the brief's "Cases":

- 1: met, `socket.test.ts` "answers the channels and an absent token", `toStrictEqual`.
- 2: met, "answers null for everything that is not a subscribe message", the nine inputs present.
- 3: met, "keeps the token when it is a string and drops it otherwise", `toStrictEqual` and `Object.keys`.
- 4: met, "refuses a message whose own __proto__ key holds the fields".
- 5: met, `hooks.test.ts` "answers null for a body that is not an object...", the ten inputs present.
- 6: met, "drops a field of the wrong type or empty and leaves its key absent", `toStrictEqual`.
- 7: met, "keeps a blank string as a value and drops only the empty one".
- 8: met, "answers the default for a notify value that is no map" and "takes the default for a field of the wrong type".
- 9: met, "reads quiet_seconds from zero up".
- 10: met, "answers exactly the three fields of a notify map with more keys".
- 11: partial. The test gives the expected result for the brief's line, and would give it equally if `parseLine` answered `safeParse(...).data`; Proof 1.
- 12: met, "skips a line that is no change and reads the lines around it".
- 13: met, "skips a line whose at is no string or that has no field, and reads empty strings".
- 14: met by the read: `hooks.ts` answers 413 on `content-length` and on byte length before `JSON.parse` and before line 254; the existing file passed inside `npm test`.
- 15: met by the diff: the `String(data)` line of `socket.ts` is not in it.
- 16: met by the diff: `core/auth.ts` is not in it.
- 17: met, "logs the first body of a name as it was sent and never the second"; the assertion on the logged text fails if `named.data` were logged.
- 18: met, "logs nothing for a body without a usable name, and answers 200", the eight bodies present.
- 19: met, the `session_id: ' '` line and "leaves the key of a list or a map field absent".
- 20: met, `Object.is(seconds(-0), -0)` and `-Infinity`.
- 21: met, "keeps the good lines and stamps a later moment when the last line was cut off"; the stamp assertion fails if the writer ignored the last good line's time.
- 22: met, "takes the last of a key given twice, so a number then a string is read".
- 23: met, "reads a line with an unknown undo word or a numeric undoes as it is".
- 24: met by the read and the comparison run (the BOM line and the other inputs answer the same from old and new code); the code it names is not in the diff.

## 1. Spec

- `tests/server/root/socket.test.ts:151-157`, `tests/server/root/hooks.test.ts` ("answers null for a Date and for a Map", "reads an unquoted yes as the text it is"), `tests/server/core/changes.test.ts` ("reads a line that ends in a carriage return", "finds a change by its moment past a line that is no change", "answers a page of the log whose before names the first of two given"): "it('takes the last of a key given twice, and channels as sent', ..."; what is wrong: six new cases test the inputs of case 24, which the brief heads "Implied by the step and held by the verify list, not by a new case"; no item asks for them. Three of them assert what `JSON.parse`, `URLSearchParams.get` and the `yaml` parser do, in code the step does not change. Failure scenario: a later change to the runtime or to `yaml` turns one red and a builder spends a round on a case the plan never asked to hold; `changes.test.ts` is tagged slow, so its three run only by hand.

## 2. Proof

- `tests/server/core/changes.test.ts:383-401`: "'{"at":"a","kind":"k","file":"f","field":"x","key":"q","before":{"__proto__":{"z":1},"b":1},"after":1,"undo":"field","more":2}'" with `expect(Object.keys(change)).toEqual(['at','kind','file','field','key',...])`; what is wrong: the test is written for the second form of item 3 (the reader answers the parsed line itself) and would still pass with that behaviour taken out. The line's first four keys are the schema's four in the schema's order, and the `__proto__` key it checks is inside `before`, which a loose schema hands through untouched; my run of `changeLineShape.safeParse(line).data` on that line printed the same nine keys in the same order, `before` with its own `__proto__`, and `more: 2`. The line is the one the brief's case 11 gives, so the gap is the brief's as much as the test's. Failure scenario: a later step changes `changes.ts:157` to answer `.data`; every line oculus's own writer makes (`at, kind, file, key, field, ...`, from `append` at `changes.ts:193-198`) is then answered as `at, kind, file, field, key, ...`, and a line with an own top-level `__proto__` key loses it (both printed by the run above), and this test stays green. A line with `key` before `field`, or with a top-level `__proto__`, would fail on that change. Verdict: case 11 partial.

## 3. Standards

- `src/lib/server/root/hooks.ts:15-17` (head comment): "The body and the `notify:` config are read through zod schemas held to their declared types"; what is wrong: `hookBodyShape` (`:51-58`) has no `satisfies` and the body has no declared type (the brief's item 5 says so; `grep -c "satisfies z.ZodType"` prints 1 for the file, the one on `notifyShape`). The standing spec's rule: a sentence in a head comment that the change makes false is a defect of the change. Failure scenario: a builder of Q85a2 to Q85a5 reads that the hook body has a declared type, looks for it in `data/model`, or changes a field of `hookBodyShape` expecting the compiler to hold it to a type, and nothing does.
- `DESIGN.md`, paragraph "Untyped input": "In `server/core` and `server/root`, a value that comes from outside the process (a request body, ...) is checked by a zod schema" and "each schema is held to its type with `satisfies`" and "A field of the wrong type takes its default or is dropped"; what is wrong: on this tree a request body read through `gatedBody` in `core/auth.ts` is checked by `isMap`, not by a schema (the brief's item 9 keeps it), the config values of `root/context.ts:266-267` are cast with no check (the brief's "What is on the tree"), `hookBodyShape` and `filledTextShape` carry no `satisfies`, and in `changeLineShape` and in the `channels` of `subscriptionShape` a field of the wrong type refuses the whole value. The brief's item 11 asked for the general sentences, so the wording is the brief's. Failure scenario: a reader of DESIGN.md takes every request body that passes `server/core` as schema-checked and writes a route behind `gatedBody` without narrowing its fields.
- `src/lib/server/core/json.ts:91-93`: "The folds of `sessions`, `files` and `git` read a parsed line through these four: eleven modules import one of them, nine of those `isMap`."; what is wrong: the counts match the grep, but `git/git-routes.ts:200-209` calls `text(fields.patch)` on the fields of a request body and `files/fs.ts:164-182,545` calls `isMap` on a JSON file's value and a request body; neither is a fold of a parsed line. The sentence is the brief's item 11 wording. The two counts are also facts about other files that the comment cannot keep true. Failure scenario: Q85a3 converts a `sessions` module, the counts become ten and eight, and no check reads this comment.
- `src/lib/server/root/socket.ts:52-55`: "The one message a page may send."; what is wrong: the file's head comment (lines 6-9) and `:117` say a page that carried the token also sends `input` and `resize`, handed to `terminals.inbound`. Failure scenario: a reader of the schema's comment takes every other frame as refused and removes or bypasses the `inbound` call.
- The builder's report, section "Verify" item 1, "Found outside the brief" and "Note on the no-git rule": "the first run ended `checks: failed with exit 1` ... which I shortened and reran", "a temporary probe in the case-21 test (removed again)", "I ran `git status --short` once, by mistake"; what is wrong: the standing spec's "Where you work" says a builder never runs a git command, `status` named, and its "Report" rule says no narration of wrong turns taken and backed out. The git command was read-only. Failure scenario: a reader of the report takes "failed with exit 1" or "removed again" as a part of the step left undone.

## 4. Behaviour

none. The comparison run found no input on which a converted reader answers differently from the hand-written one, including `null`, arrays, numbers where strings are expected, empty strings, extra keys, `Infinity`, `-Infinity`, `NaN` and `-0` for `quiet_seconds`, and the identity of the default object and of the default events array.

On the builder's statement about `append`: my read confirms it. `changes.ts` `append` ends `appendFileSync(log.file, `${written.join('\n')}\n`, ...)` with no newline written before the first record, and `linesOf` splits on `\n`; when the file's last line was cut off and has no newline after it, the first new record lands on that same line, the joined line fails `JSON.parse`, and `parseLine` answers null for it, so that record is not read back. The diff does not change `append`, `linesOf` or `lastMoment`; of what they call, only `parseLine` changed, and it accepts and refuses the same lines. The behaviour is the same before and after the step. The new case 21 test does not assert the loss and passes with or without it.

## Declined to judge

- The first run of the new cases on the unchanged tree (the report's "76 passed" before any source change): not rerun, since it needs a second tree at the base and the reviewer writes nothing. The comparison run above stands in for it on the readers' answers, not on the test files.
- The brief's premises about the base tree (36 check lines in ten files, the line numbers of each hand check, `allow-duplication.txt:73-76`): read from the diff's removed lines where the diff shows them; the loop was run on the changed tree only.
- The brief's statement that `isMap` and `z.record(z.string(), z.unknown())` accept and refuse the same eleven inputs (item 9): not rerun; `gatedBody` is unchanged and the claim is the brief's, not the builder's.
- The brief's timing figures for `parseLine` over 20,000 lines (6.6 ms against 12.9 ms): not measured; no benchmark is in the verify list.
- Whether `package.json` should hold the exact version: the orchestrator's choice, facts under item 1.
- Whether the writer's glued line is fixed in this step or booked: outside the brief's items and a change of the writer's behaviour; the orchestrator's disposition.
- Whether the six extra cases of Spec 1 are kept: the rule on which tests may exist is applied by the orchestrator.
- The report's line that `docs/diagrams/` was written: `git status --short` shows no change there after `npm run diagrams`; no decision rests on it.
- The existing cases named for 14 and 16 were not run alone; they ran inside `npm test`, which passed.

Reviewer usage: tokens and minutes not measured by the reviewer (the runner's completion notice holds them); 17 tool uses.

## Repair round 1, refuted

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams      (from tools/oculus; listed docs/diagrams/*.dot and *.svg, last lines channels.dot, channels.svg, writes.dot, writes.svg)
$ git status --short                (after it: the 12 modified paths of the diff stat and the untracked report; no path under docs/diagrams)

$ PATH=... sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   -> exit 0
$ npm test
 Test Files  348 passed | 19 skipped (367)
      Tests  5318 passed | 563 skipped (5881)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790781594844 COMPLETED 2472 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
(the run took more than ten minutes; the harness moved it to the background at its 600 s limit and it finished there with exit 0; no test timed out)

$ npx vitest run tests/server/core/changes.test.ts tests/server/root/hooks.test.ts tests/server/root/socket.test.ts
 Test Files  3 passed (3)
      Tests  70 passed (70)

$ npx vitest run tests/server/core/changes.test.ts --reporter=verbose     (tagged slow, not inside checks.sh)
 pass ... > reading a line of the log > answers a line with its keys in the order they were written and its own __proto__ keys
 pass ... > reading a line of the log > skips a line that is no change and reads the lines around it
 pass ... > reading a line of the log > skips a line whose at is no string or that has no field, and reads empty strings
 pass ... > reading a line of the log > takes the last of a key given twice, so a number then a string is read
 pass ... > reading a line of the log > reads a line with an unknown undo word or a numeric undoes as it is
 pass ... > reading a line of the log > keeps the good lines and stamps a later moment when the last line was cut off
 Test Files  1 passed (1)
      Tests  21 passed (21)

$ grep -n "safeParse" socket.ts hooks.ts changes.ts      -> socket.ts:70, hooks.ts:66, hooks.ts:138, hooks.ts:254, changes.ts:168
$ grep -c "satisfies z.ZodType"                          -> socket.ts:1, changes.ts:1, hooks.ts:1
$ grep -nE "\.issues|prettifyError|treeifyError"         -> nothing
$ grep -nE "\.error"                                     -> hooks.ts:194 and hooks.ts:202, console.error and the osascript error.message; no parse result's .error
$ grep -nE "^const [a-zA-Z]+ = z"                        -> subscriptionShape (socket.ts:56), changeLineShape (changes.ts:149), filledTextShape (hooks.ts:45), hookBodyShape (hooks.ts:51), notifyShape (hooks.ts:119)
$ grep -n '"zod"' package.json package-lock.json         -> package.json:82: "zod": "4.6.5"   package-lock.json:50: "zod": "4.6.5"   node_modules/zod/package.json version 4.6.5
$ the loop of the brief's "What is on the tree"          -> 3 core/json.ts, 1 core/file-poll.ts, 3 core/changes.ts, 1 root/hooks.ts, 3 core/git.ts, 1 root/watch/portfolio.ts, 1 core/auth.ts, 3 root/watch/git.ts, 4 root/watch/sessions.ts; no line for root/socket.ts
$ grep -rn "seven session\|the helper .str\|eleven modules" src tests config HELP.md DESIGN.md README.md   -> nothing
$ grep -n "<the six removed titles>\|from 'yaml'\|changeAt\|handleChanges" on the three test files        -> only changes.test.ts:20 import { parse } from 'yaml' (used by deckTarget at :131)
$ grep -n "by mistake\|removed again\|failed with exit\|probe\|git status" on the builder's report          -> nothing
$ LC_ALL=C grep -n '[^ -~]' over the three readers, json.ts, the three test files, the report, DESIGN.md, README.md -> nothing
$ ls tests/server/root | wc -l      -> 10
$ wc -l                             -> socket.ts 140, hooks.ts 284, changes.ts 267, json.ts 134 (the report says 135; no decision rests on it), socket.test.ts 261, hooks.test.ts 558, changes.test.ts 592
$ cmp of the worktree's report and the ledger's copy -> identical
```

One more run, by the reviewer: a `node --input-type=module -e` script from `tools/oculus` that imports the worktree's `src/lib/server/core/changes.ts` and calls `logChanges`, then `readChanges`, over log files written in the reviewer's scratchpad (outside the repository), with one record and with two. For every starting file below, every new record was read back, the file still began with its old text, it ended in a newline, and the earlier good line, where there was one, was still read:

```
absent file | empty file | "\n" | "\n\n" | good line + "\n" | good line with no newline | good line + "\r\n" | good line + "\r" | good line, "\n", cut-off line | the same + "\r" | "   " | good line, "\n", "  " | a BOM alone
joint printed for "good, no LF":   d"}\n{"at":"      for "good + CRLF":  }\r\n{"at":"2      for "good LF cut":  0.0\n{"at":"      for "only newline":  \n{"at":"2   (no newline added)
rewrite keep 2 | lines ["{\"at\":\"9999-01-01T00:00:00.0", "{\"at\":\"2026-09-30T15:23:58.849Z\",...", ""] | rows read [ 'a.yml' ]
rewrite keep 1 | lines ["{\"at\":\"2026-09-30T15:23:58.867Z\",...", ""] | rows read [ 'a.yml' ]
case 11 parsed keys at,kind,file,key,field,__proto__,before,after,undo,more | own __proto__ true
case 11 .data keys  at,kind,file,field,key,before,after,undo,more | own __proto__ false
base hand reader on the case 11 line: keys at,kind,file,key,field,__proto__,before,after,undo,more | own __proto__ true | before own __proto__ true | more 2
```

### The nine round items

- 1 (case 11): closed. `tests/server/core/changes.test.ts:377-396` uses the ruled line and asserts the ten keys in the written order, `Object.hasOwn(change, '__proto__')`, the `before` own `__proto__` and `more`. It would fail with the behaviour taken out: my run of `changeLineShape`'s shape on that line gives `.data` keys `at,kind,file,field,key,before,after,undo,more` with no own `__proto__`, so both `toEqual` on the keys and the `hasOwn` assertion fail. The report quotes the failing run and its diff matches mine (`key` moved after `field`, `__proto__` gone). `changes.ts:168` answers `parsed as Change` on the tree. The case's title changed from "...__proto__ key" to "...__proto__ keys"; see Proof 1.
- 2 (six cases): closed as ruled. The six titles and the `yaml`, `changeAt` and `handleChanges` imports are gone; 76 cases became 70. Three inputs of case 24 remain inside kept cases; see Spec 1.
- 3 (hooks head comment): closed. `src/lib/server/root/hooks.ts:15-17` holds the ruled sentence.
- 4 (DESIGN.md paragraph): closed. The paragraph in the diff is the ruled text, one line, between `**Auth.**` and `**Processes.**`. Its four readers are the four schemas-with-reader on the tree.
- 5 (json.ts comment): closed. `src/lib/server/core/json.ts:91-92` holds the ruled sentence with no count.
- 6 (subscriptionShape comment): closed. `src/lib/server/root/socket.ts:52-55` opens "The subscribe message a page sends."; the rest is unchanged.
- 7 (exact pin): closed. `package.json:82` and the lock file's root entry both hold `"zod": "4.6.5"`.
- 8 (cut-off last line): closed, and nothing found that it gets wrong.
  - The code: `changes.ts:216-218` reads the text once (`textOf`), takes the lines from it (`linesIn`) and sets `closing` to a newline when the text is not empty and does not end in one; `:236` writes it before the first record. `linesOf` (`:141`) answers what it answered, and its one remaining caller is `allOf` (`:173`).
  - Callers: the log is written only by `append`, reached through `logChanges`, whose one caller in `src` is `server/edit/writes.ts:532`; it is read by `readChanges` (`handleChanges`) and `changeAt` (`writes.ts:497`). None changed its call shape. The read and the append are both synchronous inside one `chained` call, so no other write of this process falls between them.
  - Inputs, from the run above: an empty file and a file of only a newline get no added newline; a file ending in `\r\n` gets none; a whole good line with no newline after it now keeps that line and the new record on separate lines (on the base both were glued into one unreadable line); a lone `\r`, spaces or a BOM at the end get a closing newline and the record is read.
  - The rewrite branch (`:231-234`) is not changed by the round. With a cut-off last line among the lines, it writes that line on a line of its own and the new record after it, and the record is read back. The cut-off line takes one of the `keep` places there, as it does on the base.
  - The test (`changes.test.ts:439-453`) would fail with the behaviour taken out: without `closing` the record is glued to the cut text, `rows.find(... 'a.yml')` is undefined so `expect(added?.field).toBe('f')` fails, and the `split('\n')` of the file no longer contains the cut text alone. The log's `keep` is 500 (`tests/routes/edit/write-fixture.ts:238`), so the case goes through the append branch. The report quotes the failing run at `added?.field`, which is the assertion my reading says fails first.
  - Nothing removed: no check was dropped to close it, and the head comment gained the ruled sentence (`changes.ts:21-22`).
- 9 (report): closed. The three narrations are gone (grep above), the heading "Repair round 1" carries the nine rows, both failing runs, the final `checks.sh` lines and the slow file's own run. My reruns reproduce its counts: 5318 passed and 563 skipped, 365 passed and 9 skipped, 70 passed in the three files, 21 passed in `changes.test.ts`.

No finding was closed by removing a check, and no fix reaches beyond its ruling.

### Verdicts

Items of the brief's "What to build":

- 1: holds. `package.json:82` `"zod": "4.6.5"`, the lock's root entry and `node_modules/zod` 4.6.5 MIT; README.md line 13 names `zod` (MIT).
- 2: holds. Each schema is a `const` in its reader's file; the three greps for zod's error text print nothing; the readers' code is unchanged by the round, and the first review's 179-input comparison stands for their answers.
- 3: holds. `socket.ts:70-73`, `hooks.ts:66-81` and `hooks.ts:138-139` read `.data`; `changes.ts:168` answers `parsed`, and case 11's test now fails if it answered `.data`.
- 4: holds. `socket.ts:56-60`.
- 5: holds. `hooks.ts:45-58`, `:66-81`, `:254-257`; `logFirstPayload` receives `body`.
- 6: holds. `hooks.ts:119-134`, `:138-139`.
- 7: holds. `changes.ts:149-154`, `:168`.
- 8: holds. The five names of the grep.
- 9: holds. The diff stat holds no file of `core/auth.ts`, `core/git.ts`, `core/git-parse.ts`, `core/file-poll.ts`, `root/context.ts` or `root/watch/`; `core/json.ts` changes in its comment only.
- 10: holds. One line removed from `tests/checks/tree/allow-duplication.txt`; `npm run test:checks` passes.
- 11: holds. The DESIGN.md paragraph, the README sentence, the `json.ts` comment and the three head comments, each as the round ruled; none carries a step id or a date; `history.test.ts` passed inside `test:checks`.
- 12: holds. The test diff is additions and one reflowed import in `socket.test.ts`; no test file added; `changes.test.ts` builds its logs through `target`, `logOf`, `logHolding` and `lineOf`; no allowlist line added.

Cases of the brief's "Cases":

- 1: met, `socket.test.ts` "answers the channels and an absent token for a plain subscribe message".
- 2: met, "answers null for everything that is not a subscribe message", the nine inputs present.
- 3: met, "keeps the token when it is a string and drops it otherwise, with no other key".
- 4: met, "refuses a message whose own __proto__ key holds the fields".
- 5: met, `hooks.test.ts` "answers null for a body that is not an object or holds no usable name and session", the ten inputs present.
- 6: met, "drops a field of the wrong type or empty and leaves its key absent".
- 7: met, "keeps a blank string as a value and drops only the empty one".
- 8: met, "answers the default for a notify value that is no map" and "takes the default for a field of the wrong type and keeps the others".
- 9: met, "reads quiet_seconds from zero up, infinity included, and refuses the rest".
- 10: met, "answers exactly the three fields of a notify map with more keys".
- 11: met, `changes.test.ts:377-396`; the test fails when `parseLine` answers `.data` (run above). The quoted first run is of the earlier line: Proof 1.
- 12: met, "skips a line that is no change and reads the lines around it".
- 13: met, "skips a line whose at is no string or that has no field, and reads empty strings".
- 14: met by the read: the 413 answers come before `JSON.parse` and before `hooks.ts:254`; the existing file passed inside `npm test`.
- 15: met by the diff: the `String(data)` line of `socket.ts` is not in it.
- 16: met by the diff: `core/auth.ts` is not in it.
- 17: met, "logs the first body of a name as it was sent and never the second".
- 18: met, "logs nothing for a body without a usable name, and answers 200", the eight bodies present.
- 19: met, the `session_id: ' '` line of "keeps a blank string..." and "leaves the key of a list or a map field absent".
- 20: met, `Object.is(seconds(-0), -0)` and `-Infinity` in the `quiet_seconds` case.
- 21: met, "keeps the good lines and stamps a later moment when the last line was cut off": both good lines read, the new record read with a later `at`, the cut text on a line of its own.
- 22: met, "takes the last of a key given twice, so a number then a string is read".
- 23: met, "reads a line with an unknown undo word or a numeric undoes as it is".
- 24: met by the read and the verify list; no case is written for it, apart from the three inputs of Spec 1.

### Findings

Spec

1. `tests/server/root/socket.test.ts:117-118` and `tests/server/root/hooks.test.ts:364`: "'',", "'<BOM>{"type":"subscribe","channels":[]}'," and "expect(notifyConfig({ notify: { events: new Set(['a']) } }).events).toEqual(DEFAULT.events);"; what is wrong: these three inputs are case 24's (`parseSubscription('')`, a text starting with a BOM, `events` a YAML `!!set`), which the brief heads "held by the verify list, not by a new case"; they sit as assertions inside the kept cases for 2 and 8. The round's item 2 named six cases by title and the builder removed exactly those, so the remainder is outside the ruling's wording and inside the first review's Spec 1. The first two assert what `JSON.parse` does before any schema runs. Failure scenario: a runtime whose `JSON.parse` accepts a leading BOM turns the case for 2 red, and a builder spends a round on an input no item asks to hold. Verdict: none changed; cases 2 and 8 are met by their own inputs.

Proof

1. The builder's report, section "The cases' first run on the unchanged tree": "pass tests/server/core/changes.test.ts > reading a line of the log > answers a line with its keys in the order they were written and its own __proto__ key"; what is wrong: that run is of the earlier line of case 11. The rewritten case (title ending "keys", the ruled line) has a passing run after the change and a failing run against `.data`, and no run on the unchanged tree, which the brief's "Verify before you report" item 5 asks the report to quote for each new case. The round's brief did not ask for it again. My run of the base's hand reader, copied from the diff's removed lines, on the ruled line printed the ten keys in the written order, the own `__proto__`, `before`'s own `__proto__` and `more: 2`, so the case would pass there. Failure scenario: a reader takes the first-run list as covering every case in its present form; here the gap hides nothing, since the base reader answers the same. Verdict: none changed.

Standards: none.

Behaviour: none. The one change, in `append`, is stated in the report's "Behaviour that changed" with its before and after. It also holds for a whole last line with no newline after it, which on the base was glued to the next record and lost with it; the report's wording "(no trailing newline)" covers that.

### Declined to judge

- The two failing runs the report quotes (item 1 against `.data`, item 8 before the change to `append`): not rerun, since both need an edit and the reviewer changes nothing. Judged by reading and by the script above.
- The first run of the cases on the unchanged tree (76 passed): not rerun, since it needs a tree at the base.
- Whether the three inputs of Spec 1 are removed at landing or kept: the orchestrator's, as the rule on which tests may exist is.
- A log file that exists and cannot be read: `textOf` answers the empty string, so no closing newline is written, and an append that then succeeds could land on an open line. Not reproduced here; it needs a read that fails while the following append succeeds, and the base behaves the same.
- A second process appending to the same log between the read and the append: outside what one process's write chain holds, and the same on the base.
- The cut-off line taking one of the `keep` places in the rewrite branch: unchanged code, the same on the base, and the round ruled that the branch stays as it is.
- The brief's premises about the base tree and its timing figures for `parseLine`: as in the first review, not rerun.
- The report's line that `docs/diagrams/` was written: `git status --short` shows no change there after `npm run diagrams`; no decision rests on it.

Reviewer usage: tokens and minutes not measured by the reviewer (the runner's completion notice holds them); 21 tool uses.

### Closed

- Spec 1 (three inputs of case 24 inside kept cases) and Proof 1 (no quoted run of the rewritten case 11 on the unchanged tree): both are the findings of the run over the last round, so neither goes to the builder; each is fixed at landing.
