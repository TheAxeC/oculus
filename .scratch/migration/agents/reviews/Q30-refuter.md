# Step Q30 refuter report (on .agents/worktrees/q30, base 115da2e7)

## Verification (rerun by the reviewer)
All commands run from `tools/oculus` in the worktree.
- `npx vitest run --reporter=dot`: 3979 passed, 1 failed (`tests/server/hpc/ssh.test.ts` "rejects a command that never returns at the budget", a timing test). Rerun alone with `npx vitest run tests/server/hpc/ssh.test.ts`: 5 passed.
- `npm run check`: `COMPLETED 1181 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run lint`: exit 0.
- `npm run format:check`: `All matched files use Prettier code style!`
- ASCII gate (perl command from the brief): prints nothing, exit 0.
- `python3 -c "import yaml; yaml.safe_load(open('config/text/findings.yml'))"`: exit 0. The file has 76 leaf keys (file 5, collections 2, registries 2, feeds 1, docs 1, manifests 3, present 12, config 7, shape 4, validate 39), matching the builder's count.
- `npm run build`: exit 0, `built in 4.00s`, `done`.
- `npx playwright test tests/browser/audit.spec.ts`: the first try refused because port 8792 was held by pid 55373 (not signalled). Rerun after the port was free: `3 passed (8.9s)`.
- Item 3 grep `grep -n "message: ['\`]" src/lib/data/validate.ts src/lib/data/validate-themes.ts src/lib/data/sources/*.ts`: prints nothing.

## 1. Spec
- `src/lib/data/sources/config.ts:376-377` (`mergeText`): the finding for a catalog fragment whose `text:` is not a map is still oculus's own literal sentence. `flattenText` throws `text catalog: ${prefix || 'root'} is not a map` (config.ts:537) and loadConfig passes that message through unchanged. Brief item 1 covers every finding sentence of `sources/*.ts`. The brief's "error.message only" exclusion was meant for library errors such as the YAML parser's, and this sentence is written in this file. My probe (`config/text/zy.yml` = `text: 5`) shows the finding as `text catalog: root is not a map`. The builder names it as excluded; I consider it a miss.
- `src/lib/data/sources/config.ts:650-716` (`iconFindings`, `behaviorFindings`) use `findingTextOrKey`. Decision 3 makes item 4's fallback "the one place a missing key does not throw". These two functions sit outside `loadConfig` and are not called while the catalog is merged; they receive an already merged config. The brief's premise list did name them among the catalog's own findings, so the builder followed the brief's own text. The effect is that a missing key there writes the key and does not throw. The orchestrator should rule on whether decision 3 extends to them.
- Edits outside decision 5's paths, judged one by one:
  - `data/model.ts`: needed. Item 3 names `ValidationRules`, which lives there.
  - `data/validate-themes.ts`: needed. It is validate's own split file and holds 2 of validate's sentences.
  - The six server files (`deposit.ts` 2 calls, `docs.ts`, `project-files.ts`, `pty/context.ts`, `writes/manifest.ts` 2, `writes/subtasks.ts`): needed only because the catalog became a required parameter of `readManifests` and `readDoc`. They are one-argument call changes, except `server/docs.ts:231-237`, where `answer` gains a catalog parameter. That route's 404 error text now comes from a finding key; see Behaviour.
  - Tests: `keys.test.ts` (item 5), `boundaries.test.ts` (state/text.ts now imports data/finding-text, item 2), `config.test.ts` (item 4), `config-folder.test.ts` (iconFindings needs text), `watch/portfolio.test.ts` (the watcher's engine needs the sentence file). All are needed. `tests/data/real-hub.probe.ts` was also edited and the builder's list omits it; it is a one-argument change and needed.
- Removed parameter defaults: `readCareer(file = CAREER_FILE)` and `readRegistries(files = REGISTRY_FILES)` lost their defaults, and their doc comments were reworded (`career.ts:14`, `registries.ts:22`). No item asks for this. It is harmless, since every caller passes a value, and the new comments are true (`index.ts` `path('career_file', CAREER_FILE)`).
- `tests/config.test.ts:504`: the expectation changed from `config directory does not exist` to `findings.config.directory_missing`, against test item 2's "no expected sentence is changed". Item 4's rule could not have kept this finding readable. With no config directory there is no catalog, and the rule prescribes the key-and-arguments form. Only a literal fallback sentence would keep the words, and that breaks item 3. This is a conflict inside the brief, not a builder miss; it is for the orchestrator to book.
- `src/lib/data/validate.ts:845` area: validate()'s doc comment was moved from above `checkHostStatus` onto `validate`. No item asks for it, but it is a correct repair of a misplaced comment.
- No reserved decision was taken otherwise: the wire shape stays `message: string`, the file is `config/text/findings.yml`, and HELP.md and DESIGN.md are not edited.

## 2. Proof
- **Before-and-after sentence comparison, reproduced independently.** I built two copies of the data layer and config under `scratchpad/q30-review/`: `base` (the worktree copy with `git diff 115da2e7 -- src/lib/data` reverse-applied by `patch -R`, and the new files removed) and `after`. `compare.ts` raises every key of `findings.yml` at least once over synthetic inputs: every reader, `deckFindings`, `loadConfig` (no directory, duplicate top key, duplicate text key, parse, not a map, text not a map), `iconFindings`, `behaviorFindings`, and `validate` with its theme checks, including all four `must_be_*` variants, every shape word and both joint-work forms. Result: 106 findings on each. `diff base.txt after.txt` shows exactly one line:
  ```
  < config.nodir |  | config directory does not exist
  > config.nodir |  | findings.config.directory_missing
  ```
- **Reverts rerun in a full scratch copy of the tree (`scratchpad/q30-review/copy`):**
  - `loadConfig`'s `does_not_parse` switched to `findingText`: `tests/config.test.ts` "names a sentence file that does not parse by its key and arguments, without throwing" red (1 failed).
  - `fillPlaceholders` changed to `return String(arg)`: `finding-text.test.ts` 2 red. `tests/text.test.ts` stays green, so `t()`'s missing-argument rule has no client-side test; only finding-text.test covers the shared rule.
  - A literal sentence left in `sources/docs.ts` (`message: 'document does not exist'`): `keys.test.ts` "has a reader for every catalog key" and "words every data-layer finding..." red; `docs.test.ts` green. Only the unused-key check catches a literal left behind.
  - `no_venue` reworded in `findings.yml`: `validate.test.ts` "reports a dangling id in every relation field" red.
  - `findingTextOrKey` fallback changed to `return key`: `finding-text.test.ts` fallback case and the config.test case red.
  - After each revert the file was restored and checked with `cmp` against the worktree.
- **Key-coverage regex** (`tests/keys.test.ts:41`, `/(?<![\w$.])(words|findingText|findingTextOrKey)\(\s*catalog\s*,/g`). I evaluated the literal regex from the file against probe call shapes (`scratchpad/q30-review/regex.mjs`). It matches only when the first argument is the identifier `catalog`. These calls are NOT MATCHED:
  - `findingText(rules.text, 'findings.validate.nope')`
  - `findingText(CATALOG, 'findings.x.nope')`
  - `findingText(config.text, 'findings.x.nope')`
  - `findingTextOrKey(words, 'findings.config.nope')`
  - `findingText.bind(null, catalog)`

  Any of these would escape "names a catalog key in every literal read", and a misspelt key there would throw only at runtime. The first case is a likely shape, since `validate-themes.ts:47` and `validate.ts:776` bind `const catalog = rules.text` by hand to satisfy the regex. Every current call does name `catalog` (`grep -rnE "findingText(OrKey)?\(" src` plus the next line for multi-line calls).
- No test asserts a defect. No threshold or predicate is loosened: `tests/config.test.ts:136,150,164` widened expected `config.text` and `config` to include `...SENTENCES`, because the synthetic engines now carry the shipped sentence file. The asserted behaviour is the same, but those synthetic engines are no longer minimal.

## 3. Standards
- `src/lib/server/audit.ts:30-37`: `words` is a byte-for-byte copy of `findingText` (`byKey`, a throw, and the same `/\{(\d+)\}/g` replacement). The spec's "a rule exists once" is not met. The file was outside the builder's paths.
- `src/lib/data/finding-text.ts:2-3`: the head comment says the placeholder rule "lives here once". That is false while `server/audit.ts:33` holds the same replacement.
- `src/lib/data/sources/config.ts` is 897 lines and `validate.ts` is 827. Both are under 1000 but grew by 43 and 163 lines. config.ts is within about 100 lines of the cap; the orchestrator should plan a split before the next addition.
- Doc text proposals in the builder's report:
  - The DESIGN.md decision line ends "Package Q30.", a package id. The other decision lines (DESIGN.md:329-331) carry none.
  - The HELP.md sentence "the portfolio is not rebuilt while the hub holds a finding of its own" writes the Behaviour defect below into the manual as intended behaviour.
- `config/text/findings.yml:31` `findings.present.order_not_a_map` repeats `findings.file.not_a_map` (both "is not a map of keys"), against the builder's own shared-group rule.
- The spec items were checked with no other defect found:
  - No new file lacks a head comment (`finding-text.ts`, `finding-text.test.ts` and `findings.yml` each carry one).
  - The history scan of added lines (`git diff 115da2e7 | grep "^+"` for package ids, dates and history words) found nothing.
  - The boundaries test passes, the ASCII gate is clean, and every Svelte file is untouched.

## 4. Behaviour
- **A broken `config/text/findings.yml` takes the portfolio down; reproduced.** I used the watcher's own harness (`watchPortfolio` over a synthetic hub holding one `id: other` manifest in folder `renamed`) in the base copy and in the after copy, with `findings.yml` = `text: [\n` (probe `scratchpad/q30-review/q30-probe.test.ts`).
  - **Before (base), fresh start with the broken file:**
    - Start: portfolio published (1) with its findings (`id "other" is not the folder name renamed`, ...); config findings `does not parse: Flow sequence ...`.
    - After repairing the file: config 2, findings `[]`.
    - After a manifest edit: portfolio 3.
  - **After (worktree), fresh start with the broken file:**
    - Start: portfolio=0; config=1 with `findings.file.does_not_parse Flow sequence ...`; stderr `portfolio watch: rebuild failed: text key not in the text catalog (config/text/): findings.manifests.id_not_folder`.
    - After repairing the file: portfolio=0, config=1, unchanged.
    - After a manifest edit: portfolio=0, config=1, unchanged.

    The rebuild throws at `watch/portfolio.ts:298` before `open(engineConfig, true)` (line 347) and before the hub watches open, so neither the repair nor any hub edit is seen until a restart. The page gets no portfolio at all.
  - **Before (base), running healthy, then the file broken, then repaired:** portfolio 1, 2, 3 and config 1, 2, 3.
  - **After (worktree), same sequence:** portfolio 1, 1, 2 and config 1, 2, 3. While the file is broken, the config channel republishes but the portfolio keeps the stale snapshot and logs "rebuild failed". The repair is seen, because the watches were already open.
- **Per-request routes also throw.** Probe `q30-probe2.test.ts` uses a merged config whose `findings.yml` does not parse:
  - `renderHubDoc({hub, engine, config}, 'gone.md')`: base answers `status 404`; after throws `text key not in the text catalog (config/text/): findings.docs.missing`, which the route serves as a 500, not a 404. The throw comes from `server/docs.ts:236` into `readDoc`.
  - `writeManifest(hub, config, 'good', { title: 'G2' })` on a hub that raises a manifest finding: base writes (`changed: ["title"]`); after throws `... findings.manifests.scan_missing`. A manifest write is refused whenever the hub raises any reader finding. Deposit, project-files, subtasks and undo reach the same throw through `readManifests`.
  - The builder reported only the watcher consequence, and did not run it.
- The one wording change on a working install: a missing engine `config/` directory shows as `findings.config.directory_missing` in the Findings view, which draws config-channel findings (`views/Findings.svelte:31`).
- No other visible change: 105 of 106 finding texts are identical between base and after (above).

## Not checked
- No served server; the watcher and the per-request readers were exercised through their functions in the vitest harness, not over HTTP.
- `tests/data/real-hub.probe.ts` was not run.
- `tests/integrity.test.ts` was not run on its own; it ran inside the full suite, which passed apart from the ssh timing test.
- The Findings view was not looked at in a browser; no browser spec of it exists.

Reviewer usage: about 45 tool uses, about 12 minutes (13:23 to 13:35).


## Repair round 1, refuted
```
All commands from tools/oculus in the worktree (PATH with node v24.21.0). The round's delta = the worktree now against scratchpad/q30-round1 (base 115da2e7 + tracked.patch + untracked.tar), rebuilt under scratchpad/q30-review2/round1; diff -ru covers 13 files (findings.yml, finding-text.ts, sources/config.ts, sources/present.ts, validate-themes.ts, validate.ts, server/audit.ts, tests: config, data/finding-text, keys, routes/docs, text, watch/portfolio).

npx vitest run --reporter=dot                 Test Files 237 passed (237), Tests 3983 passed (3983); no timing failure
npm run check                                 COMPLETED 1181 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run lint                                  exit 0
npm run format:check                          All matched files use Prettier code style!
ASCII gate (perl, from the brief)             prints nothing, exit 0
python3 -c "import yaml; ...findings.yml"     exit 0
grep -n "message: ['\`]" validate.ts validate-themes.ts sources/*.ts   prints nothing (exit 1)
npm run build                                 built in 5.07s, done, exit 0
npx playwright test tests/browser/audit.spec.ts   3 passed (8.6s), port 8792 free on the first try

Reverts, in scratchpad/q30-review2/copy (a clone of the worktree's tools/oculus), each file restored and cmp-checked; copy1 = the same with the pre-round src/tests/config:
A findingText throws on a missing key again       7 red: config.test x4 (missing directory, not-a-map, broken sentence file, paint limit), finding-text fallback, routes/docs 404 case, watch/portfolio broken-sentence case. Matches the report.
B1 now: findingText(rules.text, 'findings.validate.' + 'nope') in validate()      keys.test + validate.test 55 passed (GREEN)
B2 now: findingText(rules.text, `findings.validate.${String(1)}`)                  55 passed (GREEN)
B3 now: findingText(rules.text, 'findings.validate.nope')                           keys "holds every findings. literal ... both ways" red
B1/B2 in copy1 (pre-round, with const catalog = rules.text)                        keys "uses literals except at the documented computed prefixes" + "words every data-layer finding..." red
C mergeText words: () => error.message             config "words a catalog block that is not a map" red, plus keys x2 (the key goes unused)
D audit 'audit.msg_markers' misspelt 'audit.msg_markerz'   now: audit.test 3 red, keys.test 2 red; copy1: audit.test 5 red, keys.test 2 red
E fillPlaceholders returns String(arg)             text.test "leaves a placeholder with no argument as it is written" red
F present.ts back on findings.present.order_not_a_map   keys literal test + present.test red
G 'findings.panel.open' const (not a key) added to state/search.ts   keys literal test red, naming it
H probe-write (engine copy, findings.yml = "text: [", hub with id: other in folder renamed):
  now:   buildPortfolio builds, messages by key ("findings.manifests.id_not_folder \"other\" renamed", ...); renderHubDoc status 404; writeManifest {"found":true,"changed":["title"]}, file "id: good\ntype: active\ntitle: G2\n"
  copy1: buildPortfolio threw ...findings.manifests.scan_missing; renderHubDoc threw ...findings.docs.missing; writeManifest threw ...findings.manifests.scan_missing
I probe-cycle (config/text/zz.yml = "text: &x\n  a: *x\n", yaml parse gives a cyclic map):
  now:   loadConfig threw RangeError: Maximum call stack size exceeded
  copy1: loadConfig findings ["Maximum call stack size exceeded"] (base 115da2e7 has the same catch, config.ts:367-374 there)
J keys.test WORDS regex set to never match      "has a reader for every catalog key" red with 7 orphans: server.chat.chat_focus_note, chat_index_note, chat_instruction, chat_name, chat_name_focus, seed_focus, server.latex.name
K words vs findingText, catalog 'focus {0} {1} {2}', args id, 'a{2}b', /cwd:
  words: "focus id a/cwdb /cwd"; findingText: "focus id a{2}b /cwd"; words on a missing key throws "text key not in config: server.chat.nope"; findingText gives "server.chat.nope 1"
Worktree unchanged by the review: md5 of git diff 115da2e7 equal at start and end.
```
- `tests/keys.test.ts:39-43`: the key gate now misses a computed finding key. It is a new defect of ruling 2. The round narrowed `WORDS` to `words(catalog,` and put `FINDING_LITERAL` in its place, and that regex only matches a whole quoted `findings.a.b`. A `findingText` call whose key is a concatenation, a template or a variable is no longer read by any test. Reverts B1 and B2 stay green now, and the same two calls were red before the round under "uses literals except at the documented computed prefixes". Since `findingText` no longer throws, such a key would show on the page as the key and its arguments, and no test would fail. `server/audit.ts:266` `findingText(catalog, key, ...args)` is such a call; it passes only because it is no longer scanned, and the audit's documented computed-prefix entry was deleted along with it. Today no source has a computed `findings.` key (scratchpad/q30-review2/survey.mjs over src lists only the audit call). The ruling asked for coverage "whatever the variable is named"; it did not ask to drop the check on non-literal keys. Proof.
- `src/lib/data/finding-text.ts:31-32`: the comment says "A key misspelt in the code is caught by tests/keys.test.ts". The builder's DESIGN.md decision line makes the same claim. Per the finding above, it holds only for a key written as a whole literal. Standards.
- `src/lib/data/sources/config.ts:384`: `if (!(error instanceof TextNotAMap)) throw error;` is a new throw path in `loadConfig`. `flattenText` recurses without a depth guard. A text fragment with a self-referencing YAML alias (`text: &x\n  a: *x`) now makes `loadConfig` throw RangeError (probe I). Before the round, and at base, this was a finding: "Maximum call stack size exceeded". `loadConfig` runs on every request in `hooks.server.ts:14`, so one bad catalog fragment would fail every page load instead of showing as a finding. The ruling asked for the not-a-map sentence to come from the file; it did not ask to rethrow every other error. Behaviour.
- `src/lib/data/sources/config.ts:531`: `TextNotAMap` is exported, but nothing outside config.ts imports it (`grep -rn TextNotAMap src tests`). Standards (YAGNI), minor.
- `tests/keys.test.ts:222,235`: in the other direction, any `findings.` string literal now counts as a reader, whether or not it reaches `findingText`. In the other kind of false hit, a `findings.` string that is not a key fails the test loudly and names the file (probe G). No current source string trips it. Behaviour of the gate, noted and not a defect.
- Closure of ruling 1: reproduced. Revert A gives 7 red, as the report says. Probe H confirms the write the builder had not tested: over a broken sentence file, `writeManifest` writes (`changed: ["title"]`) and `renderHubDoc` answers 404; before the round both threw.
- Whether the audit's tests still catch a missing audit key: yes. Revert D gives 3 red in `tests/server/audit.test.ts`, down from 5 before the round, because the two signature tests no longer throw. `tests/keys.test.ts` "names a catalog key in every literal read" also goes red. Behaviour change: an audit key missing from the catalog is now shown as the key and its arguments instead of throwing. The report says so.
- Closures of rulings 3, 7 and 8: reproduced by reverts C, F and E. Ruling 4: `grep -rn findingTextOrKey src tests config DESIGN.md HELP.md` prints nothing.
- `src/lib/server/pty/chat.ts:40-52` `words`: confirmed as a second copy of the placeholder fill, with its own throw. It differs from `fillPlaceholders` in behaviour, not only in code. It runs `replaceAll` once per argument, so an argument that contains `{n}` is itself filled (probe K: "a{2}b" becomes "a/cwdb"), and it throws on a missing key. Replacing it with `findingText` would touch:
  - the function and its uses in chat.ts at lines 64, 124, 126, 127, 131, 132, 134 and 135;
  - `server/pty/routes.ts:24` (the import) and `:224`;
  - `tests/keys.test.ts:39-40` and the `WORDS` loop at 128-137: those 7 `server.*` keys have no other reader in the gate (probe J), so the regex would have to match `findingText(catalog,` or those keys become orphans;
  - behaviour: a missing `server.chat.*` or `server.latex.name` key would give the key and its arguments instead of a throw, and the fill would become single-pass.

  The file is outside the brief's paths and the rulings; not done, and a booking is needed. Spec.
- No history in added lines (`git diff 115da2e7 | grep "^+"` for package ids, dates and history words: nothing). config.ts is 902 lines and validate.ts 826, both under 1000.

Reviewer usage: about 33 tool uses, about 12 minutes (13:46 to 13:58).

## Closed

- The first review's findings: closed by the round's nine rulings, each reproduced by the run over the round (reverts A, C, E, F and probe H).
- The key gate missing a computed finding key (`tests/keys.test.ts`): a fix at landing adds "reads every findingText key as a whole literal, except where a documented rule computes it", which scans every `findingText(` call (its declaration left out) and requires its key to be one whole `findings.` literal or a documented computed key (`COMPUTED_FINDING_KEYS`, the audit collector's `key`, whose keys the `sentence(` scan holds); red with `findingText(rules.text, 'findings.validate.' + ...)` inserted in `validate()` (1 failed), green restored.
- `data/finding-text.ts`'s comment on the key gate: now names both checks, so it is true.
- The rethrow in `mergeText` (`sources/config.ts`): a fix at landing reports any other error `flattenText` raises (a fragment whose aliases loop) as a finding in the error's own words, as before the round; `tests/config.test.ts` "reports a catalog block whose aliases loop as a finding rather than throwing" (red with the rethrow put back: 1 failed).
- `TextNotAMap` exported with no importer: no longer exported.
- `server/pty/chat.ts` `words`, a second placeholder fill with its own throw and a fill that runs once per argument: outside the step's paths, and replacing it changes how a chat instruction is filled and the key gate's `WORDS` scan; booked as Q45, a fix of delivered work.
- The literal scan counting any `findings.` string as a reader: noted by the reviewer as a loud false hit that names its file, not a defect; no change.

After the fixes, in the worktree: `npx vitest run --reporter=dot` 237 files, 3,985 passed; `npm run check` 0 errors; `npm run lint`; `npm run format:check`.
