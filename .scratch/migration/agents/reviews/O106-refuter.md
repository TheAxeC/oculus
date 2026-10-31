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
