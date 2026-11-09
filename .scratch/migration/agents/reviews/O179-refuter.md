Verification lines (TMPDIR and GIT_CEILING_DIRECTORIES set to /tmp/v179r, removed at the end)

1. `npm run test:quick -- <the five changed paths>` (the report's form): `test:quick: 120.4 s; failed: vitest checks`, with `Test Files  1 failed | 14 passed (15)`, `Tests  2 failed | 186 passed | 9 skipped (197)`. The two failed tests are both in tests/checks/source/keys.test.ts: "uses literals except at the documented computed prefixes" and "has a reader for every catalog key". The report quotes 12 files and 108 tests; no decision rests on that count.
2. `npm run test:quick` with no arguments (the brief's form), run once: last line `test:quick: 184.3 s; failed: vitest, vitest checks, vitest slow`. I kept only the last 30 lines of that run. They show two `{ tags: ['slow'] }` tests of tests/data/hubs/hub-portfolio.test.ts timing out at 20000ms; the step changes no test file. See "Declined to judge".
3. `npx vitest run tests/checks/source/keys.test.ts --reporter=dot`: `Test Files  1 failed (1)`, `Tests  2 failed | 9 passed (11)`. Received: `lib/server/content/audit/publications.ts: sentence(` twice, and `audit.msg_site_differs`, `audit.msg_site_differs_whole`, `audit.msg_site_differs_no_cv`, `audit.msg_site_differs_whole_no_cv`. The red reported on the verify line holds in my run. This step does not cause it: `diff ../O179-base/src/lib/server/content/audit/publications.ts src/lib/server/content/audit/publications.ts` exits 0, keys.test.ts and config/text/views/system/audit.yml are not in the diff, and no changed file holds those keys or that call.
4. `npx vitest run tests/checks/config --reporter=dot`: `Test Files  5 passed (5)`, `Tests  117 passed | 9 skipped (126)`.
5. Cases program, my own equivalent in `.agents/scratch/` (removed), rendering the current FieldControl and a copy of the base files from `git show 48b25ff64:`:
```
empty_undefined: Not set=yes Empty list=no Clear=no Add=yes items=0 bytes=397 sha=6ef22ced9061 | base: Not set=no Empty list=no Clear=no Add=yes | same-as-base-stripped=false same-as-base-raw=false
empty_held: Not set=no Empty list=yes Clear=yes Add=yes items=0 bytes=531 sha=62b5451cd918 | base: Not set=no Empty list=no Clear=no Add=yes | same-as-base-stripped=false same-as-base-raw=false
empty_one_item: Not set=no Empty list=no Clear=no Add=yes items=1 bytes=1443 sha=9db38e632856 | base: Not set=no Empty list=no Clear=no Add=yes | same-as-base-stripped=true same-as-base-raw=true
plain_undefined: Not set=no Empty list=no Clear=no Add=yes items=0 bytes=310 sha=59df985b4067 | base: Not set=no Empty list=no Clear=no Add=yes | same-as-base-stripped=true same-as-base-raw=false
plain_held: Not set=no Empty list=no Clear=no Add=yes items=0 bytes=310 sha=59df985b4067 | base: Not set=no Empty list=no Clear=no Add=yes | same-as-base-stripped=true same-as-base-raw=false
parked_held: Not set=no Empty list=no Clear=no Add=yes items=0 bytes=312 sha=8198d7a5cc16 | base: Not set=no Empty list=no Clear=no Add=yes | same-as-base-stripped=true same-as-base-raw=false
words_empty_undefined: Not set=yes Empty list=no Clear=no Add=yes items=0 bytes=397 sha=6ef22ced9061 | base: Not set=no Empty list=no Clear=no Add=yes | same-as-base-stripped=false same-as-base-raw=false
words_empty_held: Not set=no Empty list=yes Clear=yes Add=yes items=0 bytes=531 sha=62b5451cd918 | base: Not set=no Empty list=no Clear=no Add=yes | same-as-base-stripped=false same-as-base-raw=false
```
Every sha and byte count of the report's final run is reproduced. Hash-normalised raw markup of plain_held: base `<!--[--><!--]-->`, now `<!--[!--><!--[-1--><!--]--><!--]-->`. The two differ only in Svelte's hydration comment markers.
6. ASCII gate of agents/spec.md over the five changed files: prints nothing. `LC_ALL=C grep -n '[^ -~]'` over the report: prints nothing.
7. `sh utils/unused-exports.sh` against `../O179-base/unused-exports.txt`: exit 0, 335 lines each, `diff` exit 0.
8. Report-quoted commands: `diff -rq` against `../O179-base` over src, config, tests and utils gives the same five paths. `grep -rn --exclude=local.yml -E "list_empty|list_clear" config` gives workbench.yml:93-94 and server.yml:310. The name grep's hits for the new names are as the report lists. `awk 'length > 100'` over the three files prints nothing. The history-word grep over the `+` lines of `git diff 48b25ff64` prints nothing (exit 1). `sed -n 174,181p` of the state file shows an empty open-items list. `ls -a .agents` shows plan.yaml alone. `ls -d ../tmp-O179`: no such file. Line counts now: FieldControl 495, InlineItems 123, options.ts 869. Counts from my saved diff agree with the report's table (options.ts +15 -13, InlineItems 33, FieldControl 20).

What to build

1. The three states: holds. `FieldControl.svelte:205-214` and `424-425`, `InlineItems.svelte:81-90`; cases of line 5 above; `withField` at `draft.ts:268-270` takes the key out for undefined. `parked` and a spec with no `empty` draw no note (`tellsEmpty` is false).
2. The words: holds. `workbench.yml:93-94`, directly after `unset`; `settings` is declared in that file alone.
3. The comments: violated as to one sentence, see Standards S1. The comments exist at all four places; two of them state `empty` on a `list` control more widely than the code does.

Cases

- `value` undefined: met (empty_undefined; the base draws neither word).
- `value` `[]`: met (empty_held; the base draws neither word).
- `value` `['url']`: met (empty_one_item, identical to base).
- spec `{ control: 'list' }`, undefined and `[]`: met on the markup with Svelte's comment markers removed, which is the method the brief points at (`schedule-dialog.test.ts:37`). The raw string differs only in hydration markers (line 5). The report discloses this at lines 95 and 193.
- spec `{ control: 'parked', empty: true }`, `[]`: met (parked_held).
- Implied, read in the diff: met. `FieldControl.svelte:425` passes `() => onpick(undefined)`. `InlineItems.svelte:78` hands the filtered list, so removing the last item hands `[]`. `withField` keeps `[]`, and `listValue` returns `done([])`, so the empty list is written.

Spec: none. Every premise of "What is on the tree" reproduces: base line ranges from `git show 48b25ff64:`, 475 and 96 lines, one `control: list` field carrying `empty` (`website.cv_sections.record_fields`, from a walk of config/options/**/*.yml), no `parked` carrying it, no test naming either component. The first run of each case is quoted in the report at lines 13-22.

Proof: none.

Standards

S1. `src/lib/data/sources/config/catalog/options.ts:84-86` and `config/options/appearance.yml:11`. Quoted: "and on a `list` control, in either form, tells a key the record lacks (drawn as not set) from a list held empty"; "on a list, either form tells a key the record lacks (drawn as not set) from a list held empty". What is wrong: the `FieldSpec` comment opens by covering both a family field and "the part of an entry that is not its heading", so the new sentence claims the behaviour for an option too. The code does it only for a field drawn by a family card. A top-level `control: list` option never reaches the list branch of FieldControl: `writtenWhole` makes it non-`single` (`rows.ts:203`, `Control.svelte:138`), and `specsOf` gives its items `{ control: 'text' }` (`draft.ts:124-127`). Failure scenario: an option `foo: { control: list, empty: true }` is drawn by Editor.svelte with `settings.editor_empty` above its Add, the same for an absent value and `[]`, with no Not set, no Empty list and no Clear, while both comments say otherwise. No shipped option sets it (walk output), so the fault is in the sentence. It should say "a list field of a record".

S2. Comment wrapping (agents/spec.md:45, "no line inside a sentence ends short"). `FieldControl.svelte:29` is 97 columns and the next word, `no`, fits within 100: "// set. A list with an item, a list whose spec does not set `empty` and a `parked` field draw". `options.ts:90` is 97 columns and the next word, `be`, fits: " * `joined` writes a multi as one text separated by spaces; `allow_missing` lets a folder or file". Failure scenario: none at run time; the rewrap the spec requires is off by one word in each paragraph.

Behaviour

B1. `InlineItems.svelte:85-86`, `<ToolButton label={t('settings.list_clear')} onclick={onclear} />`. A press takes the key out, `heldEmpty` turns false and the button is removed while it holds the focus; nothing in the diff moves the focus. Failure scenario, read from the code and not run: a keyboard user tabs to Clear and presses Enter on a `record_fields: []` row, and the focus falls to the body, so the next Tab no longer starts from that row. The report (line 153) gives the new tab stop but not where the focus lands after the press, and agents/spec.md:61 counts focus and tab stops as visible. Removing the last item already loses the focus the same way on the tree. The look on landing should check it.

B2. Same place: the accessible name is `Clear` alone. The item buttons beside it name the field (`settings.editor_item_remove` with `label`). `website.cv_sections` draws one card per row, so several rows held empty give several buttons with one identical name. The brief fixes the label, so this is no spec violation. The report does not state the accessible name.

Points asked, no finding: a `list` field drawn in Settings outside a family card never reaches the list branch (see S1); `AppControl` passes a value that is never undefined and `app-rows.ts` holds no `empty` (`grep` printed nothing). A family card whose record is not yet saved gets `emptyCard()` (`fields: {}`, `fields.ts:198`), so `value` is undefined: it draws Not set and no Clear, and Save leaves the key out through `OK_NOTHING`. Tab order is note row (Clear), then Add, as the report says.

Declined to judge

- `npm run diagrams`: not run. It writes docs/diagrams and I change nothing. `git diff 48b25ff64` holds no docs/diagrams path and `git status --short` lists only the five files and the report.
- Whether the base tree fails keys.test.ts the same way: the base copy has no node_modules and no other git command is allowed. The unchanged file and the content of the failure settle only that this step does not cause it.
- The `vitest` entry of the no-argument run's last line (line 2 above): my `tail -30` cut its failing test, so it is unidentified. It does not appear in the report-form run (`failed: vitest checks`). agents/spec.md:80 says a failure or timeout in another test file is not the step's and is not rerun; a full log of that form would name it.
- How the note reads beside Add, and the press of Clear in a page: no page was run. From the markup and CSS, the note row sits above the Add in the column `.items`, and `.field` is `align-items: center` with `.tall` only for `words` (`Cards.svelte:281`). The field name therefore centres against the two-line block, as it already does for a list with items. The look on landing settles it.

Usage: a79c6329d16447dbe, claude-opus-5-5, 184490 tokens, 30 tool uses, 785 s

## Repair round 1, refuted

### Verification lines

All commands ran under bash from the worktree, one at a time, with TMPDIR and GIT_CEILING_DIRECTORIES set to `.agents/worktrees/tmp-O179-r`. That folder is removed (`ls -d` says no such file). `git status --short` is unchanged after the runs.

1. `npm run test:quick -- <five separate paths>`, run once: `test:quick: 5 changed file(s), from the given paths`, `test:quick: 75 test file(s)`, last line `test:quick: 209.3 s; failed: vitest, vitest checks, vitest slow`.
   - The other tasks print: `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok eslint`, `ok svelte-check ... 0 ERRORS 0 WARNINGS`.
   - I did not run the no-argument form as well. By `tests/tiers/quick.mjs:changedFiles` it adds only the three `.scratch` files, which choose no test and no formatter.
2. Red rows of that run, none in a file of this step:
   - `tests/checks/source/keys.test.ts`, 2 tests, the known red: `lib/server/content/audit/publications.ts: sentence(` twice and the four `audit.msg_site_differs*` keys. `Test Files  1 failed | 14 passed (15)`, `Tests  2 failed | 186 passed | 9 skipped (197)`.
   - `tests/data/hubs/hub-portfolio.test.ts`, 2 tests, `Test timed out in 20000ms`.
   - `tests/data/hubs/workspace-projects.test.ts`, 1 test, `Test timed out in 5000ms`.
   - The vitest task: `Test Files  1 failed | 49 passed | 10 skipped (60)`, `Tests  1 failed | 1059 passed | 163 skipped (1223)`.
3. `npx vitest run tests/data/hubs/workspace-projects.test.ts --reporter=dot`, alone: `Test Files  1 passed (1)`, `Tests  5 passed (5)`.
4. The two other rows the report runs alone:
   - `npx vitest run tests/routes/docs/primary-key.test.ts --reporter=dot`: `Tests  7 passed (7)`.
   - `npx vitest run tests/state/system/settings/editor-saved.test.ts --reporter=dot`: `Tests  11 passed (11)`.
   - Neither failed in my list run; the report's list-run reds for these two came under load.
5. `npx vitest run tests/checks/config --reporter=dot`: `Test Files  5 passed (5)`, `Tests  117 passed | 9 skipped (126)`.
6. Cases program, my own in the scratch folder, rendering the current `FieldControl` and a copy of the two base components from `git show 48b25ff64:`:
```
empty_undefined: Not set=yes Empty list=no Clear-words=[] Add=yes items=0 aria=[] bytes=397 sha=6ef22ced9061 | base: Not set=no Empty list=no Clear-words=[] Add=yes items=0 aria=[] | same-as-base-stripped=false same-as-base-raw=false
empty_held: Not set=no Empty list=yes Clear-words=["Clear Field"] Add=yes items=0 aria=[] bytes=537 sha=6b57b9bed7c5 | base: Not set=no Empty list=no Clear-words=[] Add=yes items=0 aria=[] | same-as-base-stripped=false same-as-base-raw=false
empty_one_item: Not set=no Empty list=no Clear-words=[] Add=yes items=1 aria=[aria-label="Item 1 of Field" aria-label="Move item 1 of Field up" aria-label="Move item 1 of Field down" aria-label="Remove item 1 of Field"] bytes=1443 sha=9db38e632856 | base: same words and items | same-as-base-stripped=true same-as-base-raw=true
plain_undefined: Not set=no Empty list=no Clear-words=[] Add=yes items=0 aria=[] bytes=310 sha=59df985b4067 | base: same | same-as-base-stripped=true same-as-base-raw=false
plain_held: Not set=no Empty list=no Clear-words=[] Add=yes items=0 aria=[] bytes=310 sha=59df985b4067 | base: same | same-as-base-stripped=true same-as-base-raw=false
parked_held: Not set=no Empty list=no Clear-words=[] Add=yes items=0 aria=[] bytes=312 sha=8198d7a5cc16 | base: same | same-as-base-stripped=true same-as-base-raw=false
words_held_real_label: Not set=no Empty list=yes Clear-words=["Clear Entry 1, record_fields"] Add=yes items=0 aria=[] bytes=554 sha=c658c010dc61
```
   - Every byte count and sha of the report's Repair round 1 table is reproduced.
   - The markup of the held-empty render shows the Add's `span.tip` as the last element child of `.items`, with the Add's `button` inside it.
   - The `plain_*` and `parked` raw markup differs from the base only in Svelte's hydration comment markers (stripped comparison true).
7. ASCII gate of `agents/spec.md` over the five changed files: prints nothing, exit 0. `LC_ALL=C grep -n '[^ -~]'` over the report: prints nothing.
8. `sh utils/unused-exports.sh` against `../O179-base/unused-exports.txt`: 335 lines each, `diff` exit 0.
9. History-word grep over the `+` lines of `git diff 48b25ff64`: prints nothing, exit 1.
10. `awk 'length > 100'` over the three source files: prints nothing.
11. A next-word-fits computation over `InlineItems.svelte:2-9`, `FieldControl.svelte:26-30` and `options.ts:79-96`: no line ends short.
12. `sed -n 174,181p .scratch/migration/orchestrator-state.md`: the open-items heading, blank lines, then the paragraph; no entry.
13. `ls -a .agents`: `plan.yaml` alone. `ls -d ../tmp-O179`: no such file.
14. `diff -rq` against `../O179-base` over src, config, tests and utils: the same five paths.
15. Walk of `config/options/*.yml` with the `yaml` package: one hit, `behavior.yml.options.website.cv_sections.fields.record_fields control=list empty=true sparse-ancestor=false`. Disclosure: this walk also parsed `config/options/local.yml`, a file other than the banned `config/local.yml`. Nothing from it was printed or is used here.

### Verdicts

What to build

1. The three states: holds.
   - Cases of line 6.
   - `FieldControl.svelte:205-213` and `424-425`; `InlineItems.svelte:90-99`.
   - `tellsEmpty` is false for `parked` and for a spec with no `empty`.
2. The words: holds, as the round brief amended them. `workbench.yml:93-94`, `list_empty: Empty list` and `list_clear: 'Clear {0}'`, read at `InlineItems.svelte:95`.
3. The comments: violated narrowly, see Standards S3. Both sentences now say what round finding S1 asked for, and they hold for every field the catalog ships. One qualifier is still wider than the code on a sparse family card. The head comments of `FieldControl.svelte` and `InlineItems.svelte` hold.

Cases

- `value` undefined: met (empty_undefined; the base draws neither word).
- `value` `[]`: met (empty_held). The round's added case, `Clear` followed by the label given to the render, is met: `Clear-words=["Clear Field"]`.
- `value` `['url']`: met (empty_one_item, raw and stripped equal to the base).
- Spec `{ control: 'list' }`, undefined and `[]`: met on the markup with Svelte's comment markers removed, the method of `tests/shell/rail/schedule-dialog.test.ts`. The raw strings differ only in those markers.
- Spec `{ control: 'parked', empty: true }`, `[]`: met (parked_held).
- Implied, read in the diff: met. `FieldControl.svelte:425` passes `() => onpick(undefined)`. `InlineItems.svelte:87` hands the filtered list, unchanged by the round. `draft.ts:268-270` takes the key out for undefined.
- The focus after Clear (round item 3): not verifiable here for the press. Read in the diff, `InlineItems.svelte:36-39` focuses the Add's button, then calls `onclear`. The selector reaches that button by the markup of line 6. The look at landing settles the press.

### Spec

none. S1, S2, B1 and B2 are each closed as the round brief words them. No check, test or predicate changed (`diff -rq`, line 14). The delta against the snapshot touches the five files and nothing beyond the four findings: the two sentences, the rewraps, the focus call, the key and its call.

### Proof

P1. `.scratch/migration/agents/reviews/O179-report.md:213`, "Cases program, same six cases as above with the check for the label added and the first run's shas held as constants".
- What is wrong: `agents/spec.md:66` asks that a case-run program have "its source and its output quoted in the report, so the reviewer can run it again". The source of the round's program is described and not quoted; the quoted source (report lines 38-93) is the first round's, with a different output format and a comparison against saved files.
- Failure scenario: a reviewer rerunning the report's program gets lines that differ from the table at lines 216-221 and has to write the program itself, as I did. The output itself is reproduced (line 6), so no closure is in doubt.

### Standards

S3. `src/lib/data/sources/config/catalog/options.ts:84-86` and `config/options/appearance.yml:11`, quoted: "on a list field of a record, drawn by a family card, in either form, tells a key the record lacks (drawn as not set)".
- What is wrong: `shownFields` (`src/lib/state/system/config/editors/fields.ts:332-336`) drops a field the record lacks from a sparse family's card, so on a sparse card a lacked key is not drawn at all.
- The wording is what round item 1 dictated. This is the same class of fault as S1 of the first report, and the verdict is item 3's.
- Failure scenario: a sparse family field `{ control: list, empty: true }` with no value draws no control and no Not set, while both comments say it draws Not set. On such a card a press of Clear takes the key out and removes the whole `FieldControl`, the Add with it, so round item 3's focus falls to the body. No shipped field reaches it: the one hit of line 15 has `sparse-ancestor=false`. The sentence would need "of a card that is not sparse", or the like.

S4. `.scratch/migration/agents/reviews/O179-report.md:247`, "`npm run test:quick` ran twice in this round ... once with the five paths as one argument".
- What is wrong: `agents/spec.md:26` allows one run of the list after the last change, and calls a run beyond that a finding. The first run's form was the same shell error the report corrects at line 200.
- Failure scenario: cost only, a second full list on a machine that had crashed under load the same day. No result is affected.

### Behaviour

B3, the decision the report names. `src/lib/views/system/workbench/editors/InlineItems.svelte:95`, `<ToolButton label={t('settings.list_clear', label)} onclick={clear} />`, with `workbench.yml:94`.

- Judgment: the accessible name is what B2 asked for, and it is closed. The render has no `aria-label` on that button and its text is `Clear Entry 1, record_fields`, so the name differs per row.
- The visible words `Clear Entry 1, record_fields` are not what B2 asked for. B2 reads "the accessible name is `Clear` alone. The item buttons beside it name the field". It says nothing of the visible words, and the item buttons it points to draw no field name: they are `compact` with a glyph, so their `label` reaches only `aria-label` and the tip (`ToolButton.svelte:52-54`, `93`; line 6 `empty_one_item`).
- The longer visible words come from the round brief, not from a shortcut of the builder. It names the one key and call and the case "shows `Clear` followed by the label". On a `ToolButton` with no glyph and no children, `label` is the drawn words (`ToolButton.svelte:118-122`).
- The builder's stated alternative is real: a `children` snippet sets `named` (`ToolButton.svelte:54`), so `aria-label` carries the long name and the snippet draws `Clear`. It takes a second catalog key for the drawn word.
- Failure scenario: a row `record_fields: []` of `website.cv_sections` draws, for a family card with `worded` true (`Cards.svelte:204,282`), the field word `record_fields`, then `Empty list`, then a button reading `Clear Entry 1, record_fields`, so the field's name is on screen twice and the row's place once, where `Clear` was the brief's visible word. Whether to keep that or draw `Clear` with the long accessible name is the orchestrator's to rule; the round brief as written is met.

### Declined to judge

- Whether the longer words of the button fit on screen and how the row reads: no page was run; the look at landing settles it (brief, task limits).
- The press of Clear in a page, that the focus lands on the Add, and that no effect moves it afterward: no page was run. `Cards.svelte` keeps the card by place and the field by name (`drawn ... (at)`, `drawnOf ... (name)`), read only.
- `npm run diagrams`: not run. It writes `docs/diagrams` and I change nothing. The report's statement that each list run followed it, and that it changed no tracked file, is not verified by a run of mine; `git status --short` lists no docs path.
- Why `editor-saved.test.ts` failed in the builder's list run and passes alone: it did not fail in my list run. `agents/spec.md:80` makes it not the step's.
- Whether the base tree fails `keys.test.ts` the same way: the base copy has no `node_modules`, and no git command beyond the three allowed would settle it (`git stash`-style runs are not allowed). The content of the failure names only `audit/publications.ts`, which is unchanged in the step's diff.

Usage: ae26e9f3cb94fc224, claude-opus-5-5, 176078 tokens, 26 tool uses, 686 s.

### Closed

- S3 (the comment on a sparse card): fixed at landing in `options.ts` and `appearance.yml`, which now limit the sentence to a card that is not sparse.
- B3 (the visible words of Clear): fixed at landing; the button draws `Clear`, and `Clear <label>` stays its accessible name.
- P1 (the round's cases program described and not quoted): closed with no change; the reviewer wrote its own program and every count and sha of the report's table was reproduced.
- S4 (a second list run in the round): closed with no change; it cost time and affected no result.
