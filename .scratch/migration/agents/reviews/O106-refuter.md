# Refutation of O106, cards and the entry page show what a reader needs

Usage: a9ef6e624f674e5a8, claude-opus-5-5, 198813 tokens, 23 tool uses, 749 s

## 1. Verification lines, verbatim

Run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O106`.

Verify 1, `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
ok      svelte-kit sync (2.4 s)
ok      prettier (2.4 s): All matched files use Prettier code style!
ok      ASCII gate (2.4 s)
ok      eslint (19.9 s)
ok      svelte-check (43.0 s): 1793404969091 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (90.9 s): Duration  82.09s (transform 72.12s, setup 0ms, import 165.62s, tests 135.99s, environment 5.05s)
ok      vitest checks (92.1 s): Duration  83.05s (transform 44.34s, setup 0ms, import 109.63s, tests 190.00s, environment 4ms)
ok      vitest slow (106.6 s): Duration  97.91s (transform 11.71s, setup 0ms, import 78.63s, tests 293.18s, environment 6ms)
test:quick: 109.3 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

Verify 2, `grep -rnw students src/lib/state/boards src/lib/views/shared/forms/entry`: printed nothing, exit 1.

Verify 3, `patch --dry-run -p1 -d ~/workspace/research-hub < .scratch/migration/agents/reviews/O106-hub.patch`:

```
patching file '.oculus/data/academic/education.yml'
patching file '.oculus/data/academic/events.yml'
patching file '.oculus/data/academic/funding.yml'
```

Exit 0. `grep -c '^+.*label:'` over the patch printed `28`.

Verify 4: each new sentence read against the rules file. The results are under Standards.

`LC_ALL=C grep -n '[^ -~]'` printed nothing over the nine changed tree files and nothing over the report. Over the patch it printed the six `---` and `+++` header lines, whose tab is `diff`'s own. `grep -c` for the ESC character over the patch printed `0`.

`tests/server/machine/apps/tools/tasks.test.ts`: not reproduced.
- Alone, `npx vitest run tests/server/machine/apps/tools/tasks.test.ts` printed `Tests  6 passed (6)`, and the list above was green.
- So the report's first line (the list did not print "every command passed") does not reproduce here.
- By the rules file this is no finding against the step.
- None of the test's direct imports is in the diff. A grep of `files.ts`, `shell/commands.ts`, `apps/world/hosts-world.ts` and `apps/world/tmux-terminals.ts` for `boards/collection`, `model-entities`, `manifest-schema` and `collection.yml` printed nothing.
- Its type import from `src/lib/data/model/index.ts` was not followed.

## 2. Items of "What to build"

| Item | Verdict | Evidence |
| --- | --- | --- |
| 1. Card leaves out Website | holds | My rerun of A and D: the card holds `note`, none of the four; `role` under Core draws; no schema and an unnamed field draw as on the base. `WEBSITE_SECTION` at `index.ts:436` only selects rows. |
| 2. Page has a Website group | violated, S2 only (no hub row reaches it) | Labels, Yes/No, body kind and "none" all reproduce. A filled Website `records` list with no person is left out of the group. `EntryCard.svelte:317` hands `page`. |
| 3. A person's rows by name | holds | Rerun of E to H. The schema decides, and `students` is not in the code (verify 2). Unknown key: same `personChip`, read. |
| 4. Plain labels | violated in part, S1 | The 28 labels hold: the patch applied in memory and read through `fieldsOf` gives the brief's words on 8 + 8 + 11 rows and `students`. `docs/templates.md` matches. The `min` help states one of the template's three states. |
| 5. Docs | holds | `docs/HELP.md:274-275`, `docs/data-map.md:267`, `docs/templates.md:1088` and the three head comments are present. One false clause in a head comment is St1. |

## 3. Cases

| Case | Verdict | Evidence |
| --- | --- | --- |
| A | met | Rerun output equals the report's |
| B | met | `hide` No and Yes, `x_web` draws its field name, `about` kind `body`. The label over a body is by reading of `EntryFields.svelte` `{#if drawn.kind === 'body'}`. |
| C | met | `GROUP none` |
| D | met | Equal to the base run |
| E | met | `["p1","p2","p3"]` with `t1 \| d1` and so on; `mentees` leaves out `paid`. The page line is by reading the `people && page` branch. |
| F | met | No person, empty person, word and null left out; one map is one row; string and number left out; nothing throws |
| G | met | Rerun |
| H | met | Rerun |
| I | not verifiable | Settled by the look on 8790 after the hub patch: Education, Events and Funding collections, one entry page of each, a supervision entry, a Person page, and the editor once for the labels. |

First run on the unchanged tree: reproduced line for line. I ran the report's program with the base source of `index.ts` served by a `registerHooks` load hook reading `git show c18dc9126:...`, so no file was written.

## 4. Findings named by a verdict

- Item 2: S2.
- Item 4: S1.

## 5. Findings

### Spec

**S1. `min`: the treatment as outside the step is wrong in part. Main finding.**

Place: `config/schemas/manifest-schema.yml:118`, `docs/templates.md:1402`, the `min` row of `O106-hub.patch` (`funding.yml`), and the report's last section.

```
+    "cv.min": { label: "On the short CV", type: checkbox, section: Website, help: "Tick to keep the project on the short CV." }
+  - { field: min,        type: checkbox, label: "On the short CV", section: Website, help: "Ticked keeps the row on the short CV." }
```

The builder's point is right, and I reproduced it:
- The report's python over `projects.tex.template` line 6 prints `min true short CV: kept`, `min false short CV: left off`, `no min short CV: kept`.
- `record-values.ts:284` is `if (field.type === 'checkbox') return edit === true ? true : saved === true ? false : null;`, so an untouched box writes nothing and only clearing a saved tick writes `false`.

An empty box therefore means two opposite things, and the common one is the wrong reading:
- 16 manifests hold a `cv:` key and 4 hold `min:`.
- 4 funding rows are `cv_section: projects`, 1 of them with `min`.
- `min: false` occurs 0 times (`grep -c 'min: false' _data/data.yml`, and the find and grep over the manifests).
- That is 15 rows showing an empty box under "On the short CV" while they are printed on it.

Why "outside this brief's paths" is not accepted:
1. The wrong reading is made by this diff. Under the base label "Left out of the short CV", an untouched empty box read true and a tick read false. Under the new label the tick reads true and the untouched box reads false. A sentence the change makes false is a defect of the change (`spec.md:71`), and a path list is not a reason.
2. Item 4 says "corrected to what the templates do". The three help lines are on the write list and state only the ticked state. Nothing tells a reader that an unticked untouched row stays on, or how a row is left off. Saying so needs no code and is inside the item. That part is a narrower reading of the item and a limit stated instead of a defect fixed.
3. The rest is partly correct. A two-state box cannot show a three-state value, and the fix (the checkbox payload for every checkbox, or the website's template in another repository, or the label's words the brief itself fixed) is a user-visible shape. That is a stop, an open item for Axel with options, and the report does not name it as one or give the options. It says only that the fix "is outside this brief's paths". The orchestrator must book it before landing. It is not in the state file's open items (line 182 holds 604 alone).

The report's table under "User-visible changes" also omits this: the row for the project editor gives the new words and help, with no before and after for the untouched box.

Failure scenario: Axel opens a project with a `cv:` row and no `min` to take it off the short CV. He sees the box empty under "On the short CV", leaves it, and the short CV still prints the row. The only way to leave it off is tick, save, clear, save.

Fix inside the step: the help words in the three places. Fix for Axel: booked open item.

**S2. A filled Website `records` list draws nowhere. Low.**

Place: `src/lib/state/boards/collection/index.ts:495`.

```
    const row = drawnRow(field, held, person);
    if (row === null || LABELLED.includes(row.kind)) return row;
```

Item 2 says "each filled Website field: its label, then its value". The report's call 6 says "so every field has its label then its value". My probe gave a row `{field:'lst',type:'records',fields:[{field:'a',type:'text'}]}` the value `[{a:'x'}]`. `lst` is absent from `GROUP` and from `CARD`.

Failure scenario: a hub adds a Website list of records, and its values are on neither the card nor the page, while the report's call says every field has its value. No hub row is of this type today. The call list does not name it.

The `min` comment at `src/lib/data/model/model-entities.ts:265`, outside the write list: not a finding.
- The base comment made the false claim item 4 corrects.
- The new words agree with the python run, the line is disclosed by the report's rule (`spec.md:35`), and it is code-neutral.
- Keep it. The brief's write list was short by this line.

Nothing else under Spec:
- `docs/adr` does not exist (`ls` error), so no ADR contradiction.
- No new dependency, no script beyond the patch, no substitute mechanism.
- The first run exists for every case.
- Premises reproduced: `drawnFields` has one caller; 8, 8 and 11 rows; 4 entries hold 17 students with 0 rows lacking `person` and sub-keys `person`, `topic`, `degree`; `section: Website` in the three hub files alone; `foreign_key` is a list of one on a sub-row; `people.yml` and `data.yml` records name no person.

### Proof

**P1. Case programs not quoted whole. Low.**

Place: `O106-report.md`, "The cases on the changed tree", "Sentences the brief gives", and the DONE row for item 4.

`spec.md:65` and the brief's "Cases" ask for the source quoted so a reviewer can run it again. Three pieces are described instead:
- `sch` with the patch applied, and the `setCatalog` call.
- The whole search program ("the same stand-ins and `collectionBar`").
- "the python read of the three `b` files", whose files are gone.

I reconstructed each.
- Labels: as in item 4.
- Case output: equal to the report's line for line.
- Search: `card shows [] Enschede shown 1 Nothing shown 0`.

The report's card line was `["key"]` on its own unquoted entry. So no decision rests on a claim I could not reproduce.

Failure scenario: a reviewer who does not rebuild the program has to take the DONE row on trust.

Everything else quoted reproduces: the template python, `grep -c` of 5 and 0, the `min` grep (nothing), `git diff --numstat` against the base, the `wc -l` figures, `ls` of the card folder (4), `sh utils/unused-exports.sh` (the two lines, and `kindOf`, `hasStatusField`, `statusValues`, `FieldKind` are exported at the base), the reuse grep, the history grep against the base (nothing), `grep -rn drawnFields`, `README.md` and `docs/apps.md` (nothing), `cv.ts:45`. `tests/checks/config/templates.test.ts`, the test file G83's `docs/templates.md` rule matches by grep, printed `Tests  5 passed (5)`.

No threshold widened, no fallback in place of a fix other than S1.

### Standards

**St1. A sentence the diff adds is false. Low.**

Place: `src/lib/state/boards/collection/index.ts:16-17`.

```
// draws them as one group after its fields (`websiteGroup`). Search, the list's columns and the
// bar's filters read the entry itself and hold every field.
```

The bar's filters hold only rows flagged `filter: true` of a filtered type (`filteredFields`, `bar.ts:167-175`), and no row of the three schemas carries `filter: true` (grep printed nothing).

Failure scenario: a maintainer reads that every Website field can be filtered and looks for a facet that does not exist. Reword the clause to say what is true: they read the entry and are not narrowed by this rule.

The twelve judgment calls, read, give no further finding:
- `LABELLED` is needed by item 2: my probe shows `status` and `tags` rows keep label and value, and a `status` row would draw nothing without it.
- `details` as a parallel optional array is small. Its `?.` and `?? ''` in the view guard a case that does not arise.
- `heading` can only hold the constant's value, but the brief forbids the constant from being the drawn word.
- `.group` matches `CardDetails.svelte` `.more` for margin, padding and border by reading.

Sizes: `index.ts` 784, `EntryFields.svelte` 338, `EntryCard.svelte` 363.

Considered and not a finding: the `section` doc comments at `model-collections.ts:238`, `field.ts:5` and `record.ts:424` say only the editor. They are incomplete, not false.

### Behaviour

**B1. The page can state a false word for a grant. Low.**

Place: `index.ts:488-495` with the hub's `min` row.

`cv.ts:44` carries no `min` for `grants`, and `grants.tex.template` does not read it (grep printed nothing). A funding entry with `cv_section: grants` and `min: false` shows "On the short CV No" on its page while the short CV prints it. The help also promises an effect it does not have there.

The report names the fact without saying what the page draws. No hub row reaches it: the one `min` is `true` on a `projects` row, `2025-fwo-project-fl4phm`, and 2 rows are `grants`. It belongs in the open item of S1.

Otherwise the user-visible table reproduces by the runs and by reading.

## 6. Declined to judge

- Case I and everything that needs a DOM: the look at landing.
- The report's list-run count (3), its first two runs' red lines, the timeouts it reran alone, and the one failure of `keys.test.ts`: past runs, not reproducible. `keys.test.ts` passes in my list.
- "`git status` before it printed nothing to commit": a past state.
- The report's history grep is quoted as `git diff -U0 -- src config`. I ran it with the base named instead.
- Whether the worktree's head is the base, and the relation of `cccba492f` to `c18dc9126`: both need other git commands. Every premise was rechecked on the worktree.
- `tasks.test.ts` beyond the two statements in section 1.
- The audit's findings on the patched hub: the patch was applied only in memory and read through `fieldsOf`. The integrity test over a patched hub was not run, since the hub is read-only.
- The count of 15 rows rests on line greps of `cv:` and `min:`, not on parsed manifests.
- Whether each file the list selected is right: the selection is the tool's.

## Repair round 1, refuted

Usage: abbb6b69650985cf8, claude-opus-5-5, 192099 tokens, 23 tool uses, 488 s

## 1. Verification lines, verbatim

All from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O106`.

Verify 1, `npm run diagrams && npm run docs:palette && npm run test:quick` (exit 0):

```
ok      ASCII gate (1.7 s)
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.8 s)
ok      eslint (7.8 s)
ok      svelte-check (13.3 s): 1793441610602 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (81.4 s): Duration  73.51s (transform 62.90s, setup 0ms, import 141.09s, tests 116.16s, environment 3.05s)
ok      vitest checks (85.4 s): Duration  77.46s (transform 68.00s, setup 0ms, import 139.20s, tests 150.51s, environment 4ms)
ok      vitest slow (92.2 s): Duration  84.50s (transform 12.17s, setup 0ms, import 64.00s, tests 251.83s, environment 4ms)
test:quick: 94.7 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

Verify 2, `grep -rnw students src/lib/state/boards src/lib/views/shared/forms/entry`: printed nothing, exit 1.

Verify 3, `patch --dry-run -p1 -d ~/workspace/research-hub < .scratch/migration/agents/reviews/O106-hub.patch` (exit 0):

```
patching file '.oculus/data/academic/education.yml'
patching file '.oculus/data/academic/events.yml'
patching file '.oculus/data/academic/funding.yml'
patching file 'side-projects/finished/axeski/project.yml'
patching file 'side-projects/finished/iot-sensor-platform/project.yml'
patching file 'side-projects/finished/search-recommendation-vod/project.yml'
patching file 'side-projects/finished/starcraft-rl-agent/project.yml'
```

`grep -c '^+.*label:'` over the patch: `27`. Ruling 607 removes the brief's 28th, the `min` row.

Website, `patch --dry-run -p1 -d ~/workspace/research-hub/side-projects/theaxec.github.io < .scratch/migration/agents/reviews/O106-website.patch` (exit 0):

```
patching file '_scripts/cv_pdf_generator.py'
patching file '_scripts/src/cv/education.tex.template'
patching file '_scripts/src/cv/experience.tex.template'
patching file '_scripts/src/cv/projects.tex.template'
```

Verify 4: each new sentence and list item read against the rules file. The results are under Standards.

The reruns of the report's "Repair round 1" evidence:

- `LC_ALL=C grep -n '[^ -~]'` over the eleven changed tree files: nothing, exit 1. Over the two patches it prints their `---` and `+++` header lines only. `grep -c` of the ESC character: 0 in each patch. Worktree and main copies of both patches and the report compare equal (`cmp`).
- The case program, cut from the report by line number and run unchanged with `HUB` built by its shell block: the output compares equal to the report's 28 lines (`diff`).
- The search program, unchanged: `card shows ["key"] search Enschede keeps true search Nothing keeps false`.
- The python read of the three patched files: the report's three lines, `min in entries 0` on each.
- The report's field grep: stdout empty. Stderr printed `ugrep: warning: tests/server/content: No such file or directory`. My grep of the whole `tests` folder prints three unrelated lines (`--min-tokens`, the options catalog's `min` twice), so the claim holds.
- History-word grep, run as `git diff c18dc9126 -U0 -- src config | ...` with the base named: nothing, exit 1.
- `sh utils/unused-exports.sh`, for changed files: `src/lib/state/boards/collection/index.ts: kindOf, hasStatusField, statusValues`, `src/lib/state/boards/collection/index.ts: FieldKind`, and a third line the report does not list, `src/lib/data/model/model-entities.ts: Chip`. `model-entities.ts` only loses `min` in the diff, so the step did not add that line, and nothing the round added is listed.
- `git diff c18dc9126 --numstat` and `wc -l`: every row of "Files after the round" reproduces (`index.ts` 805, +174 -28; `EntryFields.svelte` 348, +101 -13; `docs/templates.md` +28 -29; `manifest-schema.yml` +1 -2).
- `npx vitest run tests/checks/config/integrity.test.ts tests/checks/config/templates.test.ts`: `Tests  12 passed | 7 skipped (19)`.

## 2. Items of "What to build", over the whole diff since the base

| Item | Verdict | Evidence |
| --- | --- | --- |
| 1. Card leaves out Website | holds | Case rerun A and D. `WEBSITE_SECTION` only selects rows. The real entry `2025-fwo-project-fl4phm` on the patched schema has a card of `key, sub, status, date, meta, tags, note, link, lead`. |
| 2. Page has a Website group | violated, B2 (no hub row reaches it) | Every hub row type draws: on the real entry the group holds the labels in schema order. A filled Website `records` row holding a string, plain words, or one map under `open` draws nowhere. |
| 3. A person's rows by name | violated in part, B3 (Website section only, no hub row reaches it) | Off the Website section it holds. Real `msc-supervision-computer-science-2025-2026` gives `Students`, 3 rows, `brecht-heeren`, with topic and degree joined. |
| 4. Plain labels | holds as ruled by 607 | 26 Website rows and `students` carry the brief's words (python read); `docs/templates.md` prints the same; no `min` row anywhere. |
| 5. Docs | holds | `docs/HELP.md`, `docs/data-map.md:267`, `docs/templates.md:1087` and the three head comments are present and read true. |

## 3. Cases

| Case | Verdict | Evidence |
| --- | --- | --- |
| A | met | Rerun equal to the report |
| B | met | Rerun equal. The round's `lst` row with `[{a:'x'}]` gives label and `x` in the group and is absent from the card. |
| C | met | `GROUP none` |
| D | met | Rerun equal |
| E | met | Rerun equal. The page line is by reading the `drawn.kind === 'people' && page` branch. |
| F | met | Rerun equal on `students`, which is not a Website row. The same rule on a Website row is B3. |
| G | met | Rerun equal |
| H | met | Rerun equal |
| I | not verifiable | The look on 8790 with the hub patch applied. Add one thing: any plain text field on a card, a long value wrapping, label on the first line's baseline (the `.values` wrapper). |

## 4. Closures claimed

| Finding | Closed? |
| --- | --- |
| S1 | Yes, by ruling 607 (a). No reader remains (Spec below). No check was removed: with the schema row gone, a stray `cv.min` is now an unknown key. |
| S2 | In part. Closed for a list of maps with declared sub-fields, which is item 4's case. The new branch leaves other filled rows drawn nowhere: B2. |
| St1 | Yes. `index.ts:16-17` reads as item 5 asked. `drawnFields` has one caller, so columns and search are untouched. |
| P1 | Yes. All three programs ran unchanged from the report's text and matched. |
| B1 of the first review | Moot. The patched `funding.yml` holds no `min` row or value. |

## 5. The changes the round list does not name, and the size of the helpers

- `publication.ts:74`, the reader line: right and inside item 1, whose grep sentence covers it, and `min?` going away requires it. Not a reach.
- The `cv:` description in `manifest-schema.yml`: right, same grep sentence, and true, since `cv.hide` is what remains.
- `.values` in `EntryFields.svelte`: right. Item 4 gives `text` several values and the branch drew the first alone. By reading the CSS, one value draws as before: `.field` stays baseline-aligned flex, a column flex container's first baseline is its first `.value`, and `min-width: 0` keeps `overflow-wrap: anywhere` wrapping. The DOM half is for the look. The report's user-visible table does not list this wrapper, so case I above names it.
- The scratch copy for the hub patch (`patch -p1 <` of the old patch, then Edit-tool changes): a departure from the letter of `spec.md`'s "every edit to a file is made with the Edit and Write tools", disclosed, on a scratch file outside the diff. No finding. Every changed line is accounted for: `diff` against the hub gives 17, 16 and 22 lines, which are 8 row pairs plus `label: "Students"`, 8 row pairs, and 10 row pairs plus the `min` row and value.
- `recordRows`, `rowWords` and the `peopleRows` signature: the right size. `peopleRows` and `groupRow` share them, and nothing is duplicated. The `map:` branch of `recordRows` cannot be reached from `peopleRows`, but `groupRow` needs it. The `Drawn` comment gains one clause and is true by reading `valuesOf` and `groupRow`. What is wrong is the condition guarding the new branch: B2 and B3.

## 6. Findings

### Spec

None. Remaining readers of the field, by grep:

- The tree: `src`, `config`, `docs`, `tests`, `utils`, `README.md` and `guarded.md` hold no line naming this field. The hits are the options' `min`, `grow.min`, `.min.css`, `{0} min`, `--min-tokens` and `--min-lines`.
- The hub: the field is at `funding.yml:32` and `:210` and in four manifests, and the patch removes all of them. A patched copy shows none. No other `project.yml` in the hub, and no `~/workspace/*/.oculus/project.yml`, holds one.
- The website: the three template lines and `is_minimal` are all removed by the patch, with no other caller. `_data/data.yml` holds 5, by the ruling, and `--minimal` and `check_minimal` stay, by the ruling.
- `grep 'short CV'` over the website: no file.

### Proof

None. The field grep's missing path and the unlisted `Chip` line are noted in section 1, and no decision rests on either.

### Standards

None.

### Behaviour

B1 is the first review's finding and is moot. New findings start at B2.

**B2. The S2 fix drops filled values the round-start code drew, and leaves others on neither card nor page. Low.**

Place: `src/lib/state/boards/collection/index.ts:513-518` (`groupRow`).

```
+    if (field.type === 'records' && row?.kind !== 'people') {
+        const items = recordRows(field, held).map((one) => rowWords(one, field.fields ?? []));
+        const values = items.filter((words) => words !== '');
+        if (values.length === 0) return null;
```

The branch replaces every non-people `records` row, including rows `drawnRow` had already drawn. In the snapshot those rows went on to the `LABELLED` check and drew, so this reaches beyond S2, which concerned a row that drew nothing. The same value under a non-Website section shows what the row gives today. My run through the report's harness:

```
open no fields one map WEB CARD [] GROUP none
open no fields one map CORE CARD [["lst","lst","pairs",["x: 1","y: 2"]]] GROUP none
string WEB CARD [] GROUP none
string CORE CARD [["lst","lst","text",["plain"]]] GROUP none
list of strings WEB CARD [] GROUP none
list of strings CORE CARD [["lst","lst","text",["p | q"]]] GROUP none
open undeclared key WEB CARD [] GROUP ["Website",[["lst","lst","text",["x"]]]]
open undeclared key CORE CARD [["lst","lst","pairs",["a: x","other: y"]]] GROUP none
```

- The report lists `B records string CARD [] GROUP none` as covered and does not say it is a filled field drawn nowhere. Item 2 asks for "each filled Website field: its label, then its value".
- `if (values.length === 0) return row;` would give the first six lines their value back.
- Two cases that fix does not reach, and which stay nowhere: a list of maps under `open` with no declared sub-fields, and a `type: raw` Website row holding a list or a map of maps (my run: `GROUP none`). The undeclared key `other` above is also dropped.
- `map: true` rows lose their names (`{fwo:{a:'x'},nwo:{a:'y'}}` gives `x`, `y`). That follows item 4's words, so it is named for the orchestrator and is no defect of the builder.

Failure scenario: a hub keeps an `open` Website list as one map, or a hand-written string under a `records` row. The value leaves the card by item 1 and has no place on the page, while the report's S2 closure says a filled row draws. No hub row reaches it: the Website rows of the three files are text, textarea and checkbox, by the python read.

**B3. On a Website row the branch draws what item 3 leaves out. Low.**

Place: the same line, `row?.kind !== 'people'` at `index.ts:513`, with the comment above `groupRow`.

```
+ * in both states. A list of records that gives no people reads as one line per item, its filled
+ * sub-fields joined.
```

`row` is also null for a person field whose rows name no person, so the condition is wider than round item 4's "whose items name no person" against the field's schema. My run:

```
person rows none with person WEB CARD [] GROUP ["Website",[["lst","lst","text",["t"]]]]
person rows mixed WEB CARD [] GROUP ["Website",[["lst","lst","people",["p"],["u"]]]]
map true person WEB CARD [] GROUP ["Website",[["lst","lst","text",["p | t"]]]]
```

- Item 3 says "A row with no person ... is left out". The first line draws such a row, and the second leaves out the same kind of row as soon as another row names a person.
- The first line also disagrees with `drawnRow`'s comment, "a value that gives no person draws nothing".
- The third line draws a raw person key as text on a row whose items do name a person.

Failure scenario: a person list under `section: Website` shows its topics as lines while no row has a person, and they vanish when the first person is added. No hub row reaches it: `students` is Connections. Testing `personSubField(field, person) === undefined` in the condition settles the first two lines.

## 7. Declined to judge

- Case I and everything that needs a DOM: the look at landing. Whether a checkbox sub-field reading `x | false` in a group line should use the catalog word is outside item 4's words, and I raise no finding on it.
- `tests/checks/config/integrity.test.ts` reports 7 skipped in this run between the two files, and I did not trace which. So the effect of the tree on the unpatched hub (four manifests holding a `cv.min` the schema no longer names) is not exercised here. The report's sharp edge says the patches and the tree belong together, so the hub patch's order at landing is the orchestrator's.
- What the audit says about `_data/data.yml` before Write the website: not run. The website stays read-only.
- The past runs the report describes: the round's single run of the list, and its timing.
- Whether the worktree's head is the base: needs another git command.
- The scratch copy for each patch, the builder's `a` and `b` folders: gone, so judged only through the patches and the patched copy above.
- The file header line `diff --color -ruN` in both patches: `diff`'s own, no ESC character, and `patch` reads past it. Not a question of content.

## Closed

- S1: closed in round 1 by ruling 607 (a).
- S2: closed in round 1 for a list of maps; the rest is B2.
- St1 and P1: closed in round 1.
- B1: moot under ruling 607 (a).
- B2 and B3: fixed at landing in `groupRow`; the remainder is named in `O106-landing.md`.
