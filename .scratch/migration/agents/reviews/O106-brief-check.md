# Brief check of O106, read at main cccba492f (`git rev-parse --short HEAD`)

Nothing was changed. Hub: `~/workspace/research-hub`. The three hub files are clean (`git status --short` over them prints nothing).

Findings that need the orchestrator before dispatch:

1. No guarded entry covers the new test file, and this is a stop under the rules file.
2. `min`: the label, the row's help and the CV template disagree, and "a false checkbox is left out" hides the one state that acts.
3. Person.svelte:247 is a third caller of `EntryCard` and passes `page`.
4. Verify 2 is a git command the builder may not run.
5. The patch recipe gives flat paths, so `-p1` fails.
6. `docs/data-map.md:267` is made false and is not on the write list.
7. Cases A, E and G can pass with the rule built wrongly.
8. Case F drops a form the schema allows.

## Names

Commands:
- `git grep -n -E 'drawnFields|FieldKind|kindOf|\bDrawn\b|STATUS_FIELD' -- src tests config docs README.md ':!config/local.yml'`
- `git grep -n -E 'EntryCard|EntryFields' -- src tests docs README.md config ':!config/local.yml'`
- `git grep -n -E 'section: Website|Website' -- src tests config docs README.md ':!config/local.yml'`
- `git grep -n -w students -- src tests config docs README.md ':!config/local.yml'`
- `git grep -n -l 'section: Website' -- . ':!config/local.yml' ':!.scratch'`, which prints `config/options/behavior.yml`, `config/schemas/manifest-schema.yml`, `docs/templates.md`
- `git grep -n -E 'WEBSITE_SECTION|websiteFields' -- src tests`, which prints nothing

Hits outside "Paths this step writes":

| Hit | Does the change make it false? |
|---|---|
| `drawnFields`, `FieldKind`, `Drawn`, collection `kindOf`: only `collection/index.ts` and `EntryFields.svelte` | No hit outside the write list. Every other `kindOf` is an unrelated function. |
| `STATUS_FIELD`, `bar.ts:60,63,162,179` | No. |
| `views/boards/person/Person.svelte:23,58,247` | Not false, but the brief does not know this caller. See Premises. |
| `views/boards/entry/Entry.svelte:33` ("with every control it has there") | No. It speaks of controls. |
| `Collection.svelte:60,478`, `Grip.svelte:2`, `EntryLink.svelte:2`, `entry-actions.ts:1` | No. |
| `src/lib/server/content/audit/website/cv.ts:5,41,211,212,219,225` (`students`) | No. It reads `entry.fields`, and neither `label` nor the card touches it. |
| `config/options/behavior.yml:73,80,85`, `config/schemas/manifest-schema.yml:40,104-120` (`section: Website`) | No. Settings and manifest rows, not drawn by `drawnFields`. |
| `docs/data-map.md:267` ("`section` / the group of the editor the field is drawn in, on a top-level row: ...") | **Yes.** After the step, `section: Website` also decides what a card draws. The file is not on the write list. Add it. |
| `docs/data-map.md:259` ("`label` / the field's name on screen") | No. |
| `docs/templates.md:1088` (printed from `sed -n 1079,1095p`: `label: "Name"  # the label in the editor; the field name when absent`) | Already narrower than the code. It stays incomplete, and the brief's write list gives this file by line range, so widen it to this line. |
| `docs/HELP.md:273,275,304` | On the write list. Line 273 says "its card opened out", which item 2 makes short of the page. |

Write-list overlap: O105 is in flight (`orchestrator-state.md`) and its brief also writes `docs/HELP.md` and `docs/templates.md`. The line numbers O106 gives for `templates.md` shift if O105 lands first. The state entry for O106 has no `shared_paths`. The O105 brief names none of the three hub files (`grep -n -E 'education\.yml|events\.yml|funding\.yml' briefs/O105.md` prints nothing).

## The step line

| Part of the plan's line | Requirement |
|---|---|
| "collection cards and the entry page leave out every field of `section: Website`" | item 1, cases A, D |
| "the entry page gives a Website group" | item 2, cases B, C |
| "with plain labels" | items 2 and 4 |
| "a `students` field draws each student by name as a person control" | item 3, cases E to H |
| "the entry page adds each student's topic and degree" | item 3 second bullet, case E |
| "No new schema key" | **None named.** `grep -n -i 'schema key\|new key' briefs/O106.md` prints nothing. The items do keep to `section`, `label`, `foreign_key`, `fields` and `map`, but the brief should state it as a requirement, since ruling 603 (b) was the new key. |
| "A full step" | "Size: a full step" |

Ruling 603 (`plan.md:3365`) is option (a), and the brief quotes it as such.

## Premises

Commands: `git grep -n drawnFields`, `sed` of `index.ts`, `cat -n` of both components, `git grep -c 'section: Website' -- .oculus`, a `yaml.safe_load` listing of the three schemas, `ls docs/adr`.

- `docs/adr` does not exist: holds (`ls: docs/adr: No such file or directory`).
- `drawnFields` at `index.ts:354`, one caller at `EntryFields.svelte:116`, no test names it: holds.
- `drawnFields` draws every schema field an entry holds: holds, less the heading field and a `status` field's markup.
- A list of rows gives no words and no pairs: holds (`textOf` at `index.ts:262-268`; `isMap` from `guards.ts:20` is the guard in `mapPairs`).
- **"`EntryCard` is drawn by `Collection.svelte:478` and, with `page` and `more`, by `Entry.svelte:313`": incomplete.** `Person.svelte:247` also draws it, with `more`, `page` and `roles={false}`. `git grep -n EntryCard -- src/lib/views` shows the three. Item 2's "On the entry page only" is therefore not what passing `page` gives. People schemas carry no Website row today, so nothing is drawn differently, but a future row would show on the Person page. Also, the prop's doc at `EntryCard.svelte:123` ("Drawn on the entry's own page") is already narrower than its use.
- `EntryFields` is not handed `page` (`EntryCard.svelte:313`): holds.
- `SchemaField` holds `section`, `label`, `fields` (`model-collections.ts:213,239,247`): holds.
- Hub row counts and names (8, 8, 11): holds. `git grep -c` prints exactly education 8, events 8, funding 11. No Website row has a `label`.
- `docs/templates.md:1393-1403,1448-1455,1496-1503` print the same rows: holds for field, type and section. The help of `cv_section` differs from the hub's words in all three blocks.
- `education.yml:28` is `students`, `type: records`, fields `person` (`foreign_key: people`), `topic`, `degree`, under Connections: holds. 4 entries, 17 rows: holds. Every one of the 17 `person` keys is a key of `people.yml` (the listing printed `[]` for missing keys).
- `people.yml:16` and `data.yml:24`: these are the `type:` lines; the rows start at `:15` and `:23`. Neither names a person: holds. `grep -n foreign_key data.yml` gives `vocab.data_access` and `data` only.
- `career.yml` draws through the Career view: holds. It has no `key:` in `config/defaults/sources.yml` and is read through `career_file`. Its `references` row does have `person` with `foreign_key: people`, so it would match item 3's rule if it were ever a collection.
- A `records` sub-row's `foreign_key` arrives as a list: holds. `fieldOf` at `schema/field.ts` recurses through `fieldsOf`, and `foreignKeyShape` turns one string into `[one]`. The brief does not state this; the rule rests on it.
- Person control, `personName`, `openPerson`: holds (`EntryFields.svelte:154-163,97-100`). An unknown key draws as `keyOf(id)` (`person.ts:84-87`).
- `collection.person_glyph` is at `config/text/views/boards/collection.yml:34`: holds.
- No `docs/glossary.md`: holds (`ls docs`).
- Sizes: `EntryFields.svelte` 260, `EntryCard.svelte` 359, `index.ts` 659 (`wc -l`). All have room. `card/` holds 4 items, `tests/state/boards/` 2.

## Cases and checks

1. **The kept tests have no guarded entry: a stop.** `spec.md:59`: "A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled." `grep -n -i -E 'drawnFields|boards/collection|EntryFields|EntryCard|a card |...' guarded.md` hits only `:21` (G5, the sanitiser) and `:208` (G131, `joined.ts`). Neither covers `index.ts` or the drawing of a field. The last entry is G142. `grep -n -E 'self_rule|next_entry' orchestrator-state.md` prints nothing, so no self-rule covers it. The brief says "kept tests in a new test file" and "where a row is added", but a new file cannot be a row of an existing entry. It needs an open item (a new entry G143, or the cases made case-run programs) before dispatch.
2. **Verify 2 breaks `spec.md:33`.** `git grep` is not one of the three git commands a builder runs. The replacement is `grep -rnw students src/lib/state/boards src/lib/views/shared/forms/entry`. `git grep` also appears in the verify lists of O104 and O105, but the rules file says nothing in a brief overrides it. Today the check prints nothing (`rc=1`).
3. **Patch recipe, line 72:** "copying the three hub files into `<tmp>/a` and `<tmp>/b`". Flat copies give `a/education.yml`, and `-p1` in verify 3 then looks for `education.yml` at the hub root. O105's text has `<tmp>/a/<path>`. Dictate the same here.
4. Case I names Education and Events and leaves out Funding, the only file with `cv_status`, `role` and `min`, and the one with the most Website rows. Add one Funding collection and one entry page.
5. Case F against the schema: see Implied inputs item 1.
6. Item 2's heading against the rules file: see Dictated text.
7. `spec.md:36` says no agent edits under `.scratch/`, and the write list holds two paths there. O105 has the same two kinds of path, so this is the plan's standing form and not a new departure.
8. The brief names no worktree, base copy or base `unused-exports` output, which `spec.md` says a brief names (`grep -n -i -E 'worktree|base copy|unused-exports' briefs/O105.md` shows O105 does not either, so the launch prompt has to carry them).

Cases asking about a place the step does not change: none. D, G and H all go through `drawnFields`.

## The question

**Could it pass without the goal being reached?**

- **A: yes.** A list of the four names passes it. The goal is a rule on the row's `section`. The hub has the distinguishing input: `role` is `section: Core` on `events.yml` and `section: Website` on `funding.yml`. Add a row of the same name in another section, drawn as today. The trap of skipping before `named.add` (the field then comes back through the second loop as text) is caught by A.
- **B: partly.** It proves the state half only. Whether `EntryCard` hands `page` down and the group is drawn rests on the look, as the rules file requires. A row with no `label` is unasserted.
- **C: no** on its own terms, and B stops an always-empty group.
- **D: no**, if the expected values are written out. A comparison against a copy of the new code would prove nothing.
- **E: yes.** Code reading `row.person`, `row.topic` and `row.degree` passes it, and verify 2 greps only the word `students`. Add a fixture with other names (a field `mentees`, a person sub-field `who`), a row whose keys are in a different order from the schema, and a non-text sub-field that stays out of the line.
- **F: yes for a map.** Under `drawnFields` as it stands, a kind with no values falls through to `mapPairs`, so a map value draws as pairs unless guarded. The fixture must hold a string and a map, and the map's result depends on the ruling in Implied inputs item 1.
- **G: yes.** A `map: true` fixture whose rows name no person passes even with no map check. Its rows must have a `foreign_key` naming people.
- **H: no.** It fails if the target is ignored.
- **I: yes for Funding** (see above).
- **Item 1:** covered by A once strengthened.
- **Item 2:** `page` wiring by the look only. The Person page is unexamined.
- **Item 3:** see E. Page layout is by the look.
- **Item 4: yes.** Verify 3 proves that the patch applies, and a patch with three labels passes it. Add the count: 28 added lines holding `label:` (`grep -c '^+.*label:'`), plus the reviewer reading the words. Nothing checks `docs/templates.md` either: `tests/checks/config/templates.test.ts` reads the config, local and project blocks, not the collection schemas.
- **Item 5: yes.** See `docs/data-map.md:267` under Names.
- **Verify 1:** it covers the changed files' tests only.
- **Verify 2:** a fact check on one word, not on the rule.

## Implied inputs

1. **A `records` field holding one record as a map.** This form is valid: `schema/record.ts` comment "the one-record form", `type: ['array','object','null']`; `state/forms/record-values.ts:112` gives the shape `'one'`; `data-map.md` lists only the list and map forms. Case F says a value that is no list is left out. Today such a map draws as pairs, so the record would vanish from the card, the loss the brief gives as its reason for the tests. It has not happened: all 4 hub entries hold lists. `cv.ts:211` also takes only a list. Expected, my recommendation: a lone map is one row, and a scalar is left out. This needs a line in the brief either way.
2. **`min`.** The hub has `min: true` on one row (`funding.yml:210`). The website template reads `if ('min' in i) and (not i['min']) and is_minimal(): continue` (`_scripts/src/cv/projects.tex.template:6`), and `cv.ts:45` passes `min` through unchanged. So `true` keeps the row on the short CV and `false` leaves it off. The row's help (`funding.yml:32`, `docs/templates.md:1402`: "Left out of the short CV.") and `manifest-schema.yml:118` (label "Left out of the short CV", help "Tick to leave the project out of the short CV.") say the opposite. Under the brief's rule, `min: false` is left out of the group, and that is the state that acts. Decision 3's reason ("says nothing to a reader") is false for this row. Expected: a ruling on what `min` means before its label is fixed.
3. **Search.** `bar.ts:414` matches `haystack(entry.fields)`, not what is drawn. A collection card stays matched by a Website word it no longer shows, and by a student's topic or degree it does not show. A student's shown name does not match where the key differs: key `matteo` shows "Matteo Ramina", key `do` shows "Anh Phuong DO", and neither surname finds the entry. The same holds today for other person fields. Expected: search unchanged, stated in the report's before and after and in `docs/HELP.md`.
4. **Filter.** `grep -n -E 'filter: *true'` over the three files prints nothing, so no facet reads a Website field. `bar.ts:463` uses `field.label` only for such a field. Expected: no change.
5. **Columns and list.** `entryColumns` (`index.ts:167`) takes `select`, `text`, `tags`, `chips` and `date` rows, so the text Website rows stay in the Columns menu and in a saved list. The ruling names cards, so that stands. Expected: the rows stay, under their new labels.
6. **`label` reaches other surfaces.** `state/forms/record-fields.ts:39` (the editor's field names), `index.ts:192` (column headings), `schema/record.ts:286` (the generated schema's `title`). The brief's "before and after" should name them, and the look should open the editor once. Expected: every Website row reads its new label there.
7. **A test.** `git grep -n EntryCard -- tests` and `git grep -n drawnFields -- tests` print nothing. Expected: no test falls.
8. **Page layout gaps the brief leaves to the builder.** It does not say whether the page draws the field's label above the rows (it says so for the card only), or what joins the words. `JOIN` (`' | '`) is the existing form. Expected: the label over the rows and `JOIN`, listed as judgment calls.
9. **Value shapes in the hub.** `cv_rank` is always an int; `duration` is an int on 22 events, 1 education and 2 funding entries; every checkbox is a bool. `textOf` gives numbers a line, so `0` is filled. Not in the hub, each with its expected result: a non-boolean checkbox (only `true` draws), a list value in a Website row (as `textOf` gives it), a row with `foreign_key` of two targets or the picked map form (not the new kind, by the existing `keys.length === 1`), a row with two person sub-fields (the first, in schema order), a Website `records` row (no group line), a Website row that is the heading field (the heading wins, since `headingField` runs first).

## ADRs

`ls docs/adr`: "No such file or directory". The brief says the same. No ADR applies.

## Dictated text

`LC_ALL=C grep -n '[^ -~]' briefs/O106.md`: nothing (`rc=1`), so the brief is ASCII.

All at `briefs/O106.md:34` (`grep -n '`cv_section` "CV section"'`):

| Line | Result |
|---|---|
| "CV section", "CV status" | holds; no existing word for the thing |
| "CV title", "CV address" | holds; `manifest-schema.yml:113,114` use the same words |
| "CV rank" | breaks no synonym cycling: `manifest-schema.yml:120` calls the same thing "CV place" |
| "Period" | breaks the same rule: `:115` "CV period" |
| "About" | breaks the same rule: `:116` "CV text" |
| "Role" | breaks the same rule: `:117` "CV role" |
| "Off the CV" | breaks the same rule: `:119` "Hidden on the CV" |
| "Short CV" | breaks the same rule and contradicts the row's own help (`funding.yml:32`). It agrees with the template. See Implied inputs item 2. |
| "Location", "Students" | holds |

The manifest rows are the CV of a project and these rows are the CV of an entry, and one editor shows both. So I read them as one thing with one name. The short labels may be intended, since they sit under a Website heading; if so, the brief should say so.

Line 33 (item 2), "a group headed by that section's name", with line 28's constant: a literal printed from code breaks `spec.md`'s "A literal string ... anywhere a reader sees it is a defect". Dictate instead that the constant only selects, and that the heading prints the row's own `section`, as `record-fields.ts:64` does for the editor.

Line 72, `<tmp>/a`: breaks the `-p1` of line 102. Line 101: breaks `spec.md:33`. Both are under Cases and checks. Line 102 holds as a command.

Line 119 ("Doc text") holds once the guarded entry is ruled. The brief's own shape there is shorter than O105's ("the current line as `grep -n` prints it and its replacement").

## Declined to judge

- Whether a Website group belongs on the Person page. That is a design call for the orchestrator. I report only that `page` reaches it.
- Whether the short labels should give way to the manifest's words, beyond naming the clash.
- What `min` should mean. The template and the help disagree, and the data does not settle it, since all rows in the hub and in `_data/data.yml` are `true`.
- How the group reads on screen. Only the look can show that.
- Whether the O105 overlap on `docs/HELP.md` and `docs/templates.md` merges simply. That is the orchestrator's judgment.

Agent aff22675846d114fb, claude-opus-5-5, 200429 tokens, 18 tool uses, 462 s.

## Closed

Each finding is closed by a change to `agents/briefs/O106.md`:

- The guarded entry: no test is kept, since a card field's failure loses no work under the rules file's test rule; the cases are quoted runs.
- `min`: the words corrected to what the templates do, and a checkbox draws both states.
- Person.svelte: named; the group is drawn on a card handed `page`.
- Verify 2: a plain `grep`. The patch recipe: `<tmp>/a/<path>`.
- `docs/data-map.md:267`, `docs/templates.md:1088`, `manifest-schema.yml:118`: on the write list.
- Cases A, B, E, F, G, I strengthened; the label count added to verify 3; "No new schema key" stated.
- Dictated labels: the manifest's words used; the group's heading is the rows' own `section`.
- Search, Columns, filters: Decision 4, with `docs/HELP.md`.
- Spec 36 and the worktree note: standing practice; the launch prompt names the worktree.
