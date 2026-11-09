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
