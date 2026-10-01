# S3b brief check

Summary: the brief can be dispatched once the items below are closed. The ones that change the build:
- (A) The readers' check misses four readers that refuse a value of a writable option.
- (B) Case 16 cannot be reached as it is worded.
- (C) The paths list leaves out `shapes.ts`, `changes.ts` and the `tests/routes/edit/` files where route, change-log and undo tests live.
- (D) The route test fixtures point `engine` at the checkout.
- (E) Case 3's quoted sentence is short of the real text.
- (F) The "Libraries checked" reason is half wrong.

## 1. Names

Command: `git grep -n -I -e config-key -e writeConfigKey -e ConfigKeyWrite -e kind_config_key -e configKeyWrite -- . ':!tools/oculus/config/local.yml'`. Every hit is a ledger file under `.scratch/` (S3a.md, S3-brief-check.md, plan.md, orchestrator-state.md, choices.md, queue.md, and old reviews Q3b and R13b, which use "config-key" in another sense). There are no hits in src, tests, config or docs, so no new name collides.

`git grep -n -w WriteTarget`: the hits are writes.ts, undo.ts, git/deposit.ts:74,142,183,195, tests/routes/edit/{audit-mute,rail,undo-removed,undo,write-fixture}.ts, tests/server/core/changes.test.ts and tests/server/git/deposit.test.ts. The brief does not change the shape of WriteTarget, so none of these becomes false. `answer` and the undo functions (`valueNow`, `undoChange`, `apply`) have hits only in writes.ts and undo.ts, both in the paths.

Hits outside the paths that the step touches or makes false:
- **`src/lib/state/shared/stores/shapes.ts:164`, the `WritesStore` type.** `createWrites(): WritesStore` (writes.svelte.ts:67-69) returns an object literal. Adding `writeConfigKey` to it without adding it to `WritesStore` fails `npm run check` with an excess property error. Without the type change, S3c cannot reach the function through the store either. The file must be added to the paths.
- **`src/lib/server/core/changes.ts:67-71`, the `ChangeRecord.key` doc.** It reads "What the write addressed: a project id, an entry identity, a session id, a collection, `deck`". A record whose `key` is a file name makes it more false than it already is (`rail` is missing from it today). Under spec.md "a sentence ... the change makes false is a defect", this file belongs in the paths.
- **`tests/fixtures/kinds.ts:15-21`.** It finds the body kinds with the regex `body\.kind !== '([a-z-]+)'` over bodies.ts. It is not made false, but the parser must use exactly that form. If it does not, `history.kind_config_key` is an orphan and keys.test.ts goes red. If it does, history.test.ts:178-190 checks the word automatically. The brief does not say this; it should.
- **`tests/routes/edit/write-fixture.ts:110,282` set `engine: engineDir()` (the checkout).** The route calls `writeConfigKey(into.engine, ...)`, so a route test that reuses `target()` or `deckTarget()` without overriding `engine` writes the checkout's `config/`. Verify item 4 would catch this only after the fact. The brief should say that a route test sets `engine` to a temporary engine.
- **`src/lib/server/edit/writes.ts:20-23`, the head comment (in the paths).** "writes/bodies.ts for the ten body parsers" is already false: bodies.ts has 20 parsers. The comment also lists no config writer. The builder should correct it, since the step adds a module and a parser.
- **`src/lib/server/edit/writes/bodies.ts:5`** says `tests/routes/edit/write.test.ts` covers every parser's refusals. The new parser's case 18 belongs there by that sentence, but write.test.ts is not in the paths.
- **HELP.md:256** lists the recorded kinds ("manifest fields, collection entries, subtasks, feeds, deck, per-session overrides, idea, two LinkedIn writes"). It already omits the rail list and the audit mute. Item 7 adds "setting"; the sentence stays incomplete unless rail is added too.
- **DESIGN.md:313** lists the open kinds an app may use. `config-key` is correctly not one, so nothing is made false. DESIGN.md:140 and :376 (the change log) are not made false either.

## 2. The step line

Plan line 184, part by part:
- "one key of a tracked config file set in place": items 2 and 3.
- "comments kept": item 2 (every other byte, trailing comment).
- "refused for `local.yml`": rule 1.
- "a key with no catalog entry": rule 2.
- "a family, a list": rule 3.
- "a value its control does not allow": rule 4.
- "or the config readers refuse": rule 7, which is incomplete (see 5 and A below).
- "its undo": item 4.
- "its History word": item 5.

Z94 (4) (b):
- `{ file, key, value }`: item 1.
- One new write kind: items 1 and 3.
- The three refusals: item 2.
- "recorded in the History view": item 2 (records) and item 5.
- "undoable": item 4.
- The client entry point for S3c: item 6.
- "list or family opens its file at its line": assigned to S3c in the premises.
- **No item: "confirmed".** Z94 (4) (b) reads "one new confirmed write kind `config-key`", and the brief's restatement drops the word. If it means a Confirm before the write (the control's), the brief should say it is S3c's, so the omission is not silent.

Z121 (3) (a): "refuses a value when the config readers refuse the merged config holding it, as checkLocal refuses a local.yml save". This is rule 7, but the brief narrows "the config readers" to "each exported reader of src/lib/data/sources/config/ that takes the merged config and throws". That narrowing drops readers that refuse values of writable options (A below). "So the catalog needs no min or max": no item adds one, which is consistent.

## 3. Premises

Each claim reread:
- options.yml: `yaml.safe_load` gives top key `['options']`, files `appearance, behavior, layout, present, sources, local`. Depths `{1: 59, 2: 49, 3: 16}`. Controls `none 37, text 35, number 34, list 7, choice 6, toggle 5`. Families 21, local keys 16 (21 + 16 = 37). All match.
- `wc -l`: writes.ts 546 and rail.ts 117 match. `answer` at writes.ts:522 matches. `WriteTarget` is 87-124 (doc comment from 78); the brief says 86-125, which is close.
- writes.ts:434-489: rail, audit-mute and deck are the config writes, and each uses `writeTextAtomic` (json.ts:47). This matches.
- **Wrong: "each ... returns records: [...undo: 'field']".** audit-mute.ts:90 returns `{ changed: [IGNORE], refused: [] }` with no records. Only rail.ts:112-116 and deck.ts:106-113 return records.
- undo.ts: the `valueNow` rail branch at :128 matches.
- **Wrong: "`redo` (the branch at :240)".** No function named `redo` exists. The branch is inside `apply` (undo.ts:198, rail at :240). Item 4's "the redo" means `apply`.
- History.svelte:84 matches. history.yml:31 is the comment line, words at 32-49, and `kind_rail: rail list` at :49 is last. Matches.
- writes.svelte.ts: `writeRail` is at 316-321 (brief says 317-321).
- yaml-edit.ts: `pathOf` 130-135, `READ_ONLY` :78 and `renderScalar` :199 match. `rangeOf` :330 and `replaceValue` :391 are private (not exported).
- merge.ts: `loadConfig` :109 matches. `grep -rn "throw new Error" src/lib/data/sources/config/ | wc -l` gives 34 (agents 1, local 18, settings 15), which matches. `changesKeep` settings.ts:142-152 matches. `checkLocal` is at local.ts:350, doc comment 344-349 (brief says 341-356, close).
- DESIGN.md:313 and HELP.md:256 are as described.
- `yaml` `^2.9.0` is in `dependencies` (package.json:42 block, line 81), installed 2.9.0. Matches.
- `ls tools/oculus/docs/adr` gives "No such file or directory". Matches.

Folder limits: `src/lib/server/edit/writes` goes from 8 to 9 items, and `tests/server/edit` from 9 to 10 (at the limit). Both are allowed.

## 4. Cases and checks

**Case 3 quote is not changesKeep's whole text.** settings.ts:149 throws `'config/behavior.yml: changes.keep must be a whole number above zero'`. The brief quotes it without the `config/behavior.yml: ` prefix. The test should assert the full message.

**Case 1 versus the real file.** The real `config/behavior.yml` holds:
```
# === The change log ===...
# Every write that changed something is recorded ...
changes:
  keep: 500
```
That is `keep: 500`, no trailing comment, and the comment above `changes:`, not above `keep`. The test copy must therefore be:
- the whole `config/` folder except `local.yml` (catalogs/options.yml for the catalog lookup, text/ for the findings' words, the other four files for the merged config the readers run on);
- with behavior.yml's `changes:` block rewritten to a comment line above `keep` and `keep: 200  # how many`.

A copy of behavior.yml alone does not work: the writer resolves the catalog and the merged config from the engine.

**Case 16 cannot be reached as worded.** undo.ts:186-187 runs `valueNow` and returns `{ error: 'moved' }` (409) when the file no longer holds `change.after`. A hand change of the same key is therefore 'moved' before any reader runs. No reader in settings.ts ties two keys together (readers at :17, :55, :84, :107, :125, :142, :155 each check their own block), so a hand change to another key cannot make `before` refused either.

A reachable form: the file holds `search.max_hits: 0` by hand (searchSettings throws "config/behavior.yml: search.max_hits must be a number above zero"). A config-key write of 500 is allowed by decision 4. Its undo would write 0 back and is refused with that sentence. `changes.keep` cannot serve here, because `target()` calls `changesKeep(merged)` (writes.ts:221) and throws for every request while keep is bad.

**Cases 10 and 12 interact.** `renderScalar` (yaml-edit.ts:202-207) writes any value holding a newline double-quoted, whatever the old style. A newline value over a single-quoted node (the 11 `present.yml` text options) therefore does not "keep the quote style". The brief should state this exception so case 12's test does not contradict case 10's.

**Cases 13 and 19 name no answer.** Case 13 gives no reason sentence or answer shape (refused list, or 500?). For case 19, "unreadable" can also mean "missing"; rail.test.ts:102-107 answers 500 for a missing file, and that should be said.

**Case 5:** "config/local.yml not opened" needs a stated way to check it in a temporary engine, for example a `local.yml` in the temporary engine whose bytes and mtime are unchanged.

**spec.md "every id or key ... exercised empty, duplicated, and colliding with a configured or reserved key":** cases 6 and 18 cover empty `file` and a non-string `key`. Not covered: an empty `key` (`''`) and reserved keys (`__proto__`, `constructor`, `toString` as `file` or `key`), which a plain `catalog[file][key]` lookup resolves to `Object.prototype` members.

**spec.md "re-parses its own result and refuses when the reparse is not what was asked":** rule 6 checks only that every other key is deep-equal. It does not require that the key itself parses to `value`. See 6 for two inputs where it does not.

The other cases agree with the rules file.

## 5. The question (could it pass without the goal)

- **Rule 7 and its test ("every function in the list is called").** Yes, it can pass without the goal. The test proves the list is called, not that it is complete. The definition misses readers that refuse values of writable options (A):
  - `requirePaintLimit` (src/lib/data/helpers/editor.ts:25-30) throws for `editor.paint_limit_kb: 0`. It is called at server start (server/root/context.ts:213). `behaviorFindings` (catalogs.ts:152) gives a finding for the same value.
  - `watchUsageRefresh` (server/machine/usage/refresh.ts:140,142) throws at start for `usage_refresh_min <= 0` and `usage_refresh_model: ""`. The values reach it from context.ts:266-267 as raw config fields.
  - `themeFindings` (config/themes.ts:31) gives a finding for a `code_theme` that is no code theme (a `text` option).

  `editor.paint_limit_kb` and `usage_refresh_min` are `number` options, and `usage_refresh_model` and `code_theme` are `text` options. Each can be written today with a value that stops the next start or adds a finding, which is exactly what Z121 (3) (a) likens to `checkLocal`. A check that would fail: the readers list compared with the set of every read `createServerContext` (context.ts:205-238) makes on the merged config, findings readers included. The brief should name these readers or define the list as that set.
- **Rule 7's loadConfig half.** Vacuous. After rule 6 passes (same parse, every other key deep-equal), `loadConfig` cannot give a new finding: its findings are does-not-parse, not-a-map and defined-twice (merge.ts:131-163), and a scalar change cannot create any of them. Not harmful, but no case can make it red. The brief should say so rather than ask for a test of it.
- **Reader identity versus message.** "A reader throws that did not throw before" compares readers, not messages. Example: `search.max_hits: 0` is already in the file and the page writes `search.timeout_s: 0`. searchSettings throws before and after, on the first problem both times, so the second defect is written. This passes without the goal; compare messages at least, and add a case.
- **Case 1** (whole file compared byte for byte): No, it could not pass without the goal.
- **Cases 2-9** with the reason asserted: No. Case 3 is distinctive only once the full sentence is asserted (0 is a finite number, so only the reader refuses it).
- **Case 13:** Yes, it could pass whatever rule refuses, because no reason is named.
- **Cases 15 and 17:** No.
- **Case 16:** It cannot be built as worded (see 4). A builder could fit it to the 409 'moved' answer and pass.
- **Item 5 (History word):** No. kinds.ts plus keys.test.ts and history.test.ts gate it, provided the parser form is kept.
- **Item 6 (page write).** Yes. No case checks the body `writeConfigKey` sends; a wrong field name would still pass every case. A unit test over `createWrites` with a recording fetch would check `{ kind: 'config-key', file, key, value }` against `/api/write`.
- **Item 7:** a judgment, read at review.
- **Verify item 3.** Running `npx vitest run tests/server/edit` does not run the place where route, change-log and undo tests live by the tree's pattern (tests/routes/edit/rail.test.ts with write-fixture.ts's change log; undo in tests/routes/edit/undo.test.ts). The paths name `tests/server/edit/writes.test.ts` and `writes-fixture.ts`, which test the manifest writer over a hub with no change log; writes.test.ts:10 is also `@module-tag slow`, so `npm test` leaves it out. Cases 1 (record), 15, 16, 17, 18 and 19 need `tests/routes/edit/config-key.test.ts` (new) and possibly `write-fixture.ts`. The paths and verify item 3 should name `tests/routes/edit`.
- **Verify item 4** (`git status --short config/`): No; it fails if a test wrote the checkout's config.

## 6. Implied inputs

Probed with a throwaway script under $TMPDIR over yaml 2.9.0. A scan of the 80 writable options (text, number, toggle, choice) in the five files found:
- no absent key, no null, no alias, no flow parent, no CRLF, no BOM, no anchor;
- styles PLAIN (most), QUOTE_DOUBLE (board.search and others), QUOTE_SINGLE (11 in present.yml);
- trailing comments on 21 options.

Missing from Cases, each with the result it should have:
- **A key segment holding a dot** (`a: { b.c: 1 }`; the catalog path `a.b.c` is built by `optionPaths`, options.ts:68-79). `getIn(['a','b','c'])` gives undefined. Expected: refused "not in the file". It is also an ambiguity, since `a.b` and `a` holding `b` give one path (options.ts:66). No writable option has one today; `read_limits` and `open.program_ext` are families.
- **A non-string key** (`1: x`, `getIn(['a','1'])` gives undefined). Expected: refused, not in the file.
- **A map or list value for a `text` option**: refused, not a string. For `number`: `"300"`, `true`, `[]` refused.
- **`value: 1e309`.** It crosses JSON as `Infinity` (`JSON.parse('1e309')`). Expected: refused, not a finite number (case 4 says only NaN cannot cross).
- **`value: -0`.** It renders "0" and `isDeepStrictEqual(-0, 0)` is false. The expected result should be stated; written as 0 is the natural one.
- **A number into a node whose file value is a quoted string.** None today. Expected: refused by the control or written plain; to be stated.
- **An alias node** (`b: *v`). Expected: refused, not a scalar node.
- **An anchored node** (`b: &v 5`, `x: *v`). The splice changes `x` too. Expected: refused by rule 6.
- **A tagged node** (`b: !!str 5`; the range excludes the tag). Writing 6 parses back as "6". Expected: refused, which needs rule 6 to also check the key's own value.
- **A block scalar node** (`b: |`). Its range[1] includes the final newline, so the splice can join the next line. Expected: refused by rule 6, or written double-quoted.
- **A flow-map parent `{ a: 1 }` with a text value holding `,` `{` `}` `[` `]`.** Plain rendering is invalid inside a flow map. Expected: written double-quoted, or refused by rule 6; to be stated.
- **An empty node (`key:`), `~` or `null`.** `key:` has a zero-width range [7,7,7] and needs the space `replaceValue` adds (yaml-edit.ts:418-420). Expected: written. Note that the undo then writes `null` back and rule 4 refuses it ("not a number"), so the undo of any write over a null is always refused. An expected result is needed.
- **A CRLF file.** Expected: written, every `\r\n` kept (ranges are string offsets).
- **A BOM file.** Expected: written, BOM kept (offsets count it).
- **A duplicate key in the file** (`doc.errors` 1). Expected: refused as case 13.
- **A top-level key defined in two config files.** loadConfig lets the later file win (merge.ts:150-160), so swapping the edited file's keys into the merged map checks the wrong value. Expected: to be stated.
- **Concurrent writes to one file** (`Promise.all` of two requests). Expected: both land. This holds only if the writer is synchronous from read to write and reads the merged config from disk itself rather than `into.config` (built before the request, writes.ts:199-225). The brief should state both.
- **Readers already throwing or loadConfig already with findings** (decision 4). No case exercises it. Expected: a write that adds none is written; a write to a second key the same reader checks is the masking case in 5.
- **Repairing `changes.keep` when the file already holds 0.** `target()` throws at writes.ts:221 before the writer runs: an unhandled 500 at the route. Expected: written (decision 4). As built, it is not.
- **`file` with a path** (`config/behavior.yml`, `../behavior.yml`, `behavior.yml/../layout.yml`). Expected: refused, no catalog entry.
- **`key: ''`**, and **`file` or `key` set to `__proto__`, `constructor` or `toString`**. Expected: refused, no catalog entry (requires `Object.hasOwn`).
- **A text value with non-ASCII characters** (an em dash, a curly quote, an emoji). It would be written into a tracked config file the hub holds to ASCII. Expected result: a decision (written as given, or refused).
- **An empty string for a `text` option** (`usage_refresh_model: ""` stops start). Expected: refused once the reader list holds the usage refresh check.
- **Undo after the key was removed from the file, or the file no longer parses.** Expected: `gone` (404), as for the other kinds.
- **A `text` value equal to the file's value but in another style.** Expected: nothing written (rule "equal value").

## 7. ADRs

`ls tools/oculus/docs/adr` gives "No such file or directory". No ADR folder exists, so no ADR touches the step.

## yaml setIn

The brief's reason is half wrong; its conclusion holds. Test: a throwaway script under $TMPDIR over copies of the five config files, removed afterwards; `parseDocument(src).toString()` with no edit, then `setIn` on the case keys.
- **Layout is rewritten (true).** With no edit at all, differing lines are: behavior.yml 149 of 160, appearance.yml 111 (67 to 117 lines), layout.yml 230, present.yml 305 (4-space indentation rewritten to 2), sources.yml 81 (94 to 85 lines). Blank lines are dropped and flow-map padding is collapsed (`{ name: light,        class: ""` becomes `{ name: light, class: ""`).
- **Comments are kept but moved.** The `#` count is unchanged in every file (47, 27, 35, 54, 39); comments lose their blank-line spacing and position.
- **Quoting is kept (the brief's claim is false here).** Scalar style counts are identical before and after (behavior PLAIN 130 / QUOTE_DOUBLE 36; present PLAIN 305 / QUOTE_SINGLE 165 / QUOTE_DOUBLE 3), and after `setIn(['deck','meta','kicker'], ...)` the node is still `QUOTE_SINGLE`.

So the reason not to use `setIn` plus `toString()` is that it re-lays-out the whole file (indentation, blank lines, alignment), not that it changes quoting. The brief's sentence should say that.

Also: the brief has the builder splice over `getIn(path, true).range` itself, while `replaceValue` and `rangeOf` (yaml-edit.ts:330, :391) already do this but are private and yaml-edit.ts is not in the paths. That duplicates the zero-width-null space rule and the one-line check (spec.md "a parser, a fold or a rule exists once"). Either add yaml-edit.ts to the paths and export the scalar splice, or say why not.

## Declined to judge

- Whether the refusal reason sentences may be literals in the writer. The existing writers use literals (manifest.ts:110-122, yaml-edit `fail(...)`), while spec.md says every user-facing string comes from `config/text/`. This is a ruling for the orchestrator; not checked further.
- Whether "confirmed" in Z94 (4) (b) means a Confirm in S3c's control or something of the write. DESIGN.md has no definition of a confirmed write kind (searched for "confirmed write"); the meaning is not verified.
- I did not run the vitest suites or `npm run check`. The `shapes.ts` excess property failure is inferred from `createWrites(): WritesStore` returning an object literal, not run.
- The S3c brief does not exist yet (`ls agents/briefs/S3*` shows S3, S3a, S3a-cases, S3a-round1, S3b), so S3c's expectations of this step's answer shape could not be checked.

Usage: claude-opus-5-5, about 140k tokens, 52 tool calls.

## Closed

Each finding closed in `agents/briefs/S3b.md` by the orchestrator before the preparation commit.

- (A) The readers: the list is every reader `createServerContext` runs on the merged config, the findings readers included, and every exported reader of `src/lib/data/sources/config/`; `watchUsageRefresh`'s checks move into an exported function both call (`refresh.ts` added to the paths); case 20 covers `editor.paint_limit_kb`, `usage_refresh_min`, `usage_refresh_model` and `code_theme`.
- (B) Case 16 rewritten to the reachable form (`search.max_hits: 0` by hand, its repair written, the undo refused with `searchSettings`' sentence).
- (C) Paths: `shapes.ts`, `changes.ts`, `yaml-edit.ts`, `merge.ts`, `refresh.ts`, `config/text/server.yml`, `tests/routes/edit/config-key.test.ts`, `write.test.ts`, `write-fixture.ts`, `tests/state/client/writes.test.ts` and `refresh.test.ts` added; `tests/server/edit/writes.test.ts` and `writes-fixture.ts` removed; verify item 3 names `tests/routes/edit`.
- (D) Route tests set `engine` to the temporary engine; verify item 4 compares the five tracked files' sums before and after.
- (E) Case 3 quotes the full sentence with its `config/behavior.yml: ` prefix.
- (F) "Libraries checked" says `setIn` with `toString()` rewrites the layout and keeps quoting; the writer uses `yaml-edit.ts`'s `replaceValue`, exported, so the splice exists once.
- Check 1: `shapes.ts:164`, `changes.ts:67-71`, the `kinds.ts` parser form, `write-fixture.ts`'s engine, `writes.ts:20-23` and `bodies.ts:5` in the premises and items; `HELP.md:256` lists every recorded kind.
- Check 2: "confirmed" is S3c's Confirm, stated in the premises.
- Check 3: `audit-mute` returns no records; `apply` in place of `redo`; line numbers corrected.
- Check 4: case 1's fixture is the whole `config/` folder but `local.yml`, with `behavior.yml`'s block rewritten; cases 10 and 12 state the newline exception; case 13 names its reason; case 19 includes a missing file; case 5 checks the temporary `local.yml`'s bytes and mtime; empty and reserved keys in case 6; rule 7 checks the key parses back to `value`.
- Check 5: masking closed by decision 4 (a reader throwing after the edit refuses, case 21); the `loadConfig` half stated as having no case of its own; the page's body tested (case 27).
- Check 6: every implied input given its result in cases 4, 6, 13, 14, 17, 20 to 26 and 28, with decisions 3, 5 and 7; concurrency by the writer being synchronous and reading from the engine itself.
- Declined points: refusal sentences come from `config/text/server.yml` (decision 6).
