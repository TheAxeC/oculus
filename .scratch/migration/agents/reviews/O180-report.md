Everything in the brief is done, with one row outside it not run by this step: the real hub's run, which the brief gives to the orchestrator. Two reds remain in the list, in files this step does not change and for reasons outside it: the known keys.test.ts reds the brief names, and tests/server/edit/config-key.test.ts, red only with `TMPDIR` unset because the file `/tmp/x` exists (see below).

## DONE / NOT DONE

| Deliverable | Status | Proof (the last line of the final run) |
| --- | --- | --- |
| 1 to 7, the settings, default, Settings entries, hub list, reader, writer, a word not set, Empty | DONE | `npx vitest run tests/data/website/paper-fields.test.ts tests/data/hubs/website-files.test.ts tests/routes/docs/audit.test.ts tests/routes/sessions/website.test.ts tests/server/root/watch/website-watch.test.ts tests/state/sessions/source/website-store.test.ts tests/checks/config --reporter=dot`: `Tests  270 passed \| 9 skipped (279)` |
| 8, comments, the template page, tests | DONE | the same run; `docs/templates.md` by `tests/checks/config/templates.test.ts` in it |
| 9, the hub's lines, held by the test hub | DONE (hub write is the orchestrator's) | row 'the lines of the settings file write the publications file of the hub' in the same run |
| Verify 1: `npm run test:quick` (run twice, the second after the fixes) | DONE apart from the two reds named here | `test:quick: 315.4 s; failed: vitest checks, vitest slow` |
| Verify 2 | DONE | `Tests  270 passed \| 9 skipped (279)` |
| Verify 3: the grep | DONE | one hit, `site.ts:88 FILE_KEYS = ['site', 'cv', 'papers', 'industry']`: the keys of `website.files`, a setting's keys, in a file the rule covers but not a field of the publications file. No hit in `cv.ts`. |
| Verify 4: ASCII gate over the changed files | DONE | prints nothing |
| Verify 5: `sh utils/unused-exports.sh` against `../O180-base/unused-exports.txt` | DONE | `diff` prints nothing |
| The real hub run | NOT RUN, the orchestrator's by the brief | none |

Red rows of the list, each in a file the step does not change:

- `tests/checks/source/keys.test.ts`, 'uses literals except at the documented computed prefixes' and 'has a reader for every catalog key': the known red the brief names, over `audit.msg_site_differs*` in `audit/publications.ts`. Run alone: `Tests  2 failed | 9 passed (11)`, the same two rows.
- `tests/server/edit/config-key.test.ts`, describe 'a write that names a hub', eleven rows: `tests/server/edit/config-key.test.ts:458 expect(existsSync(join(made.hub, '..', 'x'))).toBe(false)` fails under the list's `TMPDIR` unset because `/tmp/x` exists (`ls -ld /tmp/x`: `-rw-r--r-- ... 6282 Nov  9 20:14 /tmp/x`), and the launch message says not to touch that file. Run alone with `TMPDIR` set to the step's folder: `Tests  36 passed (36)`.

No whole-suite command was run. `npm run test:quick` ran twice: the first found the formatting of `config/options/behavior.yml` and a duplicated helper across two test files (both fixed), the second is the one quoted.

## Open items of the state file, verbatim

The section "## Open items" of `orchestrator-state.md` holds no item (its only text is the sentence "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468)").

## The cases' first run, on the unchanged tree

Each row of `tests/data/website/paper-fields.test.ts` and the rows of the route, store and audit tests ran with only the test files and the fixture changed. The failing line of each, from `npx vitest run tests/data/website/paper-fields.test.ts --reporter=verbose`:

| Case | First run on the unchanged tree |
| --- | --- |
| Lines of item 9 over the test hub equal the literal `PAPERS_TEXT` (taken from a run of that case on the unchanged tree) | passed, a guard |
| `[title/project_title, authors]` keys, no other | `AssertionError: expected [ 'authors', 'title', 'order', ...(5) ] to deeply equal [ 'title', 'authors' ]` |
| `{ key: venue_note }` over a record holding it | `AssertionError: expected undefined to be 'x'` |
| A field the record does not own, and `{ key: constructor }` | `AssertionError: expected [ 'authors', 'title', 'order', ...(5) ] to deeply equal [ 'title' ]` |
| `{ key: paper_title, from: project_title }` | `AssertionError: expected [ 'authors', 'title', 'order', ...(5) ] to deeply equal [ 'paper_title' ]` |
| `project_year`, `kind_pre`, `kind_post` | `AssertionError: expected [ undefined, undefined, undefined ] to deeply equal [ 2024, '', '(Accepted)' ]` |
| `author_place` under a row without `order`, and `lead: main` | `AssertionError: expected [ 'authors', 'title', 'program', ...(2) ] to deeply equal [ 'title' ]` |
| `web_links`, `Repository` last, `differences` | `TypeError: Cannot convert undefined or null to object` (no such key on the tree) |
| `{ key: links }` with no `from` | `AssertionError: expected { ...(2) } to deeply equal [ { name: 'Slides', ...(1) } ]` |
| `paper_list: items` | `AssertionError: expected [ 'papers' ] to deeply equal [ 'items' ]` |
| `code_link_name` empty | `AssertionError: expected { ...(2) } to deeply equal { Object (Slides) }` |
| A word of `author_places` empty, two entries | `AssertionError: expected [ true, true, true, true ] to deeply equal [ false, false, false, false ]` |
| `from: ''` | `AssertionError: expected undefined to deeply equal [ { key: 'url' } ]` |
| `from: nothing` | `AssertionError: expected undefined to deeply equal []` |
| `key: __proto__`, `key: ''` | `AssertionError: expected undefined to deeply equal []` |
| Two rows of `key: url` | `AssertionError: expected undefined to deeply equal [ { key: 'url', ...(1) } ]` |
| The reader's null, `hide: 'yes'`, `book: 2024`, `rank: '3'`, `links` | `AssertionError: expected { Object (links, rank) } to deeply equal { hide: 'yes', book: 2024, ...(2) }` |
| A `__proto__` key of a record | `AssertionError: expected [] to deeply equal [ '__proto__' ]` |
| A press with no row, and one with `paper_list` empty | `AssertionError: expected { status: 200, body: { ...(2) } } to deeply equal { status: 409, body: { ...(2) } }` (each of the two rows) |
| The button with no row | `Error: text key not in the text catalog (config/text/): career.website_no_paper_fields` |
| The audit with no row | `AssertionError: expected '_data/publications.yml differs from w...' to contain 'website.paper_fields'` |
| The real hub | the orchestrator's, no first run |

The literal was taken by a program in `.agents/scratch/`, a vitest test that called `build(websiteWorld().input)` and printed `out.texts[PAPERS_PATH]`, run under a scratch vitest config including the svelte plugin; removed. It wrote nothing into the step's diff.

## Host- or user-visible changes

| What | Before | After |
| --- | --- | --- |
| Write the website with no `website.paper_fields` row or empty `website.paper_list` | press goes on | refused with `website-no-paper-fields`, sentence `career.website_no_paper_fields`; the button (Career view) disabled with the sentence; the audit offers no action |
| Audit sentences `audit.msg_site_differs_no_cv`, `_whole_no_cv` | name `website.cv_sections` | name `website.cv_sections`, `website.paper_fields` and `website.paper_list`; their keys are unchanged |
| New audit finding | none | `audit.msg_site_no_word` naming the setting key, one per key per build, about nothing |
| Settings (Website section, groups) | none | `website.paper_fields` (cards: key, from), `website.paper_list`, `website.code_link_name`, `website.author_places.lead/supervisor/collaborator`, a group `website.author_places` |
| A publication record | ten named keys | every key whose value is not null is held; `hide: 'yes'` and `book: 2024` are written as given when a row names them |
| The Career view | to look at: Website settings hold no rows on a hub without them: the button is off with the sentence naming both settings | look on landing, per spec |

For the look: open Settings > Website: the six new entries; Career view with a hub whose `website:` has `cv_sections` and a folder but no `paper_fields`: the button is off and says the sentence; set the settings, the button is on.

The hub's lines (item 9), written by the orchestrator under `cv_sections:` of `website:` in the hub's `.oculus/config.yml`:

```yaml
  paper_list: papers
  code_link_name: Code
  author_places: { lead: first, supervisor: senior, collaborator: coauthor }
  paper_fields:
    - { key: authors }
    - { key: title, from: project_title }
    - { key: order, from: author_place }
    - { key: program }
    - { key: book }
    - { key: pub_pre, from: kind_pre }
    - { key: pub_post, from: kind_post }
    - { key: pub_date, from: project_year }
    - { key: url }
    - { key: links, from: links_with_code }
    - { key: abstract }
    - { key: pub_last }
    - { key: hide }
    - { key: cv_hide }
```

## Comments and documents re-read

Rewritten: head of `papers.ts`, `publication.ts`, `audit/publications.ts:2-9`, `runs/website.ts:9-17`, `website.svelte.ts:6-10`, doc comment of `websiteSettings` and `WebsiteSettings` (`settings/files.ts`), `website/files.ts` head and `differences`, `WEBSITE_REFUSALS` doc, `model-entities.ts` `Publication`, `config/defaults/behavior.yml:34`, the group `website` and the `website.kinds` field helps in `config/options/behavior.yml`, `docs/templates.md` (`website:` sentence, defaults, example, the `publication:` comment and `links` line), test heads of `tests/routes/sessions/website.test.ts`, `tests/data/hubs/website-files.test.ts`, `tests/fixtures/hubs/website-hub.ts`. Still true: head of `website/site.ts`, head of `cv.ts`, `tests/routes/docs/audit.test.ts` head, `tests/state/sessions/source/website-store.test.ts` head, `tests/server/root/watch/website-watch.test.ts` head.

Outside the write list and needed: `config/schemas/manifest-schema.yml:105,109`, the form help of `publication.authors` and `publication.links`, reworded because 'the Code link' named a word that is now a setting; the form help is a catalog paragraph the change makes false.

Lines of `docs/HELP.md` and `docs/data-map.md` the step makes false or incomplete (not written, for the orchestrator to bring to Axel):

- `docs/data-map.md:123`: after `website.kinds`, add lines for `website.paper_fields` ("the fields an entry of the publications writes, in order"), `website.paper_list` ("the key a section holds its entries under"), `website.code_link_name` ("the name the code link prints with"), `website.author_places.lead`, `.supervisor`, `.collaborator` ("the words of the user's place among the authors").
- `docs/data-map.md:162`: "Oculus reads thirty-seven keys from the primary hub's file alone", the list gaining `website.paper_fields`, `website.paper_list`, `website.code_link_name`, `website.author_places.lead`, `website.author_places.supervisor`, `website.author_places.collaborator`.
- `docs/data-map.md:214`: "Settings refuses the thirty-seven keys of the primary".
- `docs/data-map.md:376`: the `publication.*` row: "the website's publications entry, every key of the record whose value is not null held as the file gives it; the rows of `website.paper_fields` say which are written".
- `docs/HELP.md:528`: "A Website finding of a generated file that differs offers Write the website while `website.cv_sections` holds a section, `website.paper_fields` a row and `website.paper_list` a word."

## Edits to existing tests

No existing assertion, allow list or predicate changed. Changed lines of existing test files, each input only:

| File | Line(s) | Before | After |
| --- | --- | --- | --- |
| `tests/routes/docs/audit.test.ts` | `generated()` input, `checkOf` setting | settings without the paper fields | `...paperSettings` added (the fixture's fields, the two words, the list key) |
| `tests/routes/sessions/website.test.ts` | `worldOf` default `sections` | `CV_SECTIONS` | `` `${CV_SECTIONS}${PAPER_LINES}` `` |
| `tests/server/root/watch/website-watch.test.ts` | the settings text | the `website:` block | the block with `paper_list` and one `paper_fields` row |
| `tests/state/sessions/source/website-store.test.ts` | `settingsOf` | the `website:` block | the block with `paper_list` and one `paper_fields` row |
| `tests/data/hubs/website-files.test.ts` | `beforeAll`, `build`, `Built`, `saying` | defined in the file | moved to `tests/fixtures/hubs/website-hub.ts` (`websiteWorld`, `build`, `Built`, `saying`) so the new file uses them; the rows are unchanged |

New rows: the 18 rows of `tests/data/website/paper-fields.test.ts`, the two rows of `tests/routes/sessions/website.test.ts`, one of `website-store.test.ts`, one of `audit.test.ts`. Each failing line is quoted above. `agents/guarded.md` G139's Test line and G140's are the orchestrator's; `tests/data/website/paper-fields.test.ts` and the new route and store rows belong under them.

## Judgment calls (each reversible)

1. `differences` takes the rows of `website.paper_fields` and applies the `links_with_code` keys to all three generated files. On the tree the key `links` counted for any file, so the CV's `personal.links` order is unaffected while a hub keeps a row of key `links`. A hub whose only links row is named otherwise no longer counts the order of the CV's `personal.links` map.
2. `cvSections` was folded with the new `paperFields` read into `keyedRows`, one function reading a list of keyed rows, the shape passed in; the key regex is `websiteRowKey`.
3. `from: nothing` is left out by `checkedRows` with its `field` problem at `website.paper_fields[0].from` (the option's `choice` values), one finding, and not by the row's own shape.
4. `Object.fromEntries` builds an entry and the links map, and `{ [paperList]: ... }` the list, so a name `__proto__` in `code_link_name` or `paper_list` is an own key. A name `__proto__` in `website.kinds` is outside this step and unchanged.
5. An empty `paper_list` in the audit gives a section `{ '': [...] }`: the file still differs from disk and the audit names it, with no action offered.
6. The audit's existing test hub `paperSettings` is the item 9 shape cut to the keys its projects use, kept in that test file.

## Limitations

- The press is refused and the audit offers no action on every hub until the hub's lines of item 9 are written, which is the orchestrator's at landing.
- `tests/data/website/paper-fields.test.ts` builds the demo hub copy in `beforeAll`, as `website-files.test.ts` does; under heavy load on this machine its hook timed out at 10 s in a first run with three other files and passed when run alone.
- Scratch folders `.agents/scratch/` and `.agents/worktrees/tmp-O180` are removed.

## Repair round 1

Everything in the round's brief is done. One input of the brief could not be read: `.scratch/migration/agents/reviews/O180-refuter.md` is not in this worktree (`ls` says no such file), so the findings were taken from the text of `agents/briefs/O180-round-1.md`. Two reds remain in `tests/checks/source/keys.test.ts`, over `audit/publications.ts`, named by the brief as not this step's.

Hazard for the landing: until the hub's lines below are written, every role of `website.cv_fields` is empty on the real hub, so the CV writes no fields and the audit has 40 findings. The hub's lines land with this step.

### DONE / NOT DONE

Each row of the runs is a run of that test file after the last source edit.

| Check | Status | Output |
| --- | --- | --- |
| `tests/data/website/cv-fields.test.ts` (new) | DONE | `Tests  21 passed (21)` |
| `tests/data/website/paper-fields.test.ts` | DONE | `Tests  18 passed (18)` |
| `tests/data/hubs/website-files.test.ts` | DONE, the three generated files byte for byte | `Tests  61 passed (61)` |
| `tests/routes/docs/audit.test.ts` | DONE | `Tests  41 passed (41)` |
| `tests/routes/sessions/website.test.ts` | DONE | `Tests  23 passed (23)` |
| `tests/server/root/watch/website-watch.test.ts` | DONE | `Tests  1 passed (1)` |
| `tests/state/sessions/source/website-store.test.ts` | DONE | `Tests  9 passed (9)` |
| `tests/checks/config/arrangements.test.ts` | DONE | `Tests  32 passed (32)` |
| `tests/checks/config/config-folder.test.ts` | DONE | `Tests  31 passed \| 2 skipped (33)` |
| `tests/checks/config/config.test.ts` | DONE | `Tests  42 passed (42)` |
| `tests/checks/config/integrity.test.ts` | DONE | `Tests  7 passed \| 7 skipped (14)` |
| `tests/checks/config/templates.test.ts` | DONE | `Tests  5 passed (5)` |
| `tests/checks/source/comment-width.test.ts` | DONE | `Tests  2 passed (2)` |
| `tests/checks/source/history.test.ts`, `catalog-file-keys.test.ts` | DONE | `Tests  6 passed (6)`, `Tests  1 passed (1)`; at the default 5 s each timed out on this machine |
| `tests/checks/tree/size.test.ts`, `duplication.test.ts`, `boundaries.test.ts` | DONE | `Tests  10 passed (10)`, `Tests  18 passed (18)`, `Tests  11 passed (11)` |
| `tests/checks/imports/cycles.test.ts`, `tests/data/helpers/hub-names.test.ts` | DONE | `Tests  7 passed (7)`, `Tests  34 passed (34)` |
| `tests/checks/source/keys.test.ts` | 2 RED, not this step's | `Tests  2 failed \| 9 passed (11)`: `audit/publications.ts: sentence(` twice, and the four keys `audit.msg_site_differs`, `_whole`, `_no_cv`, `_whole_no_cv` |
| `npx tsc --noEmit -p .` | DONE | prints nothing |
| ASCII gate over the changed files | DONE | prints nothing |
| `sh utils/unused-exports.sh` against `../O180-base/unused-exports.txt` | DONE | `diff` prints nothing, exit 0 |
| `npx prettier --check` over the written `.ts` and `.svelte` files | DONE | `All matched files use Prettier code style!` |
| `npm run test:quick` | not run, as the round's brief says | |

What the green runs do not cover: no real hub, no real website folder, and no page was opened; the hub's lines are exercised only through the fixture.

### S1, the website's field names

`tests/data/website/cv-fields.test.ts`, its first run on the tree before the change: `Tests  19 failed | 2 passed (21)`. The failing line of its first row:

```
FAIL tests/data/website/cv-fields.test.ts > ... > the rows of cv_lists say the lists read and their sections
AssertionError: expected undefined to deeply equal [ { ...(3) } ]
```

The other 18 fail the same way, each on the field or the section the changed word names (`expected [ 'other' ] to deeply equal [ 'federated' ]` for `site_programs`, `expected [] to deeply equal [ [ 'website.cv_fields.period' ] ]` for an empty role). The two that passed are the rows saying no problem is raised, which hold on any tree.

What changed:

- `src/lib/server/content/audit/website/cv.ts`: rewritten over `website.cv_lists` (`career`, line 415 on), `website.cv_entry_fields` (`entryFields`, line 154) and the roles of `website.cv_fields` (`held` and `written`, lines 83 and 91; `byRoles`, line 99, reading `studentShape` and `sharedShape` by role). `CAREER_LISTS`, `WHEN`, `DURATION`, `DATE`, `FROM_RECORD_ELSE`, `RECORDS` and `SHARED` are gone. An empty role is one problem per build naming `website.cv_fields.<role>`, raised in the `Cv` constructor while `website.cv_sections` holds a row. An empty `students_section` or `projects_section` writes no row and raises no second problem of an unknown section.
- `src/lib/data/sources/config/settings/files.ts`: shapes `cvListShape`, `cvEntryFieldShape`, types `CvList`, `CvEntryField`, `CvFields`, `CodeStatuses`; `cvSectionOf(personBlock)` replaces `CV_PERSON_BLOCK`, so a section may not take the word `person_block` holds; `keyedRows` became `namedRows`, which takes how a row is named, since a row of `cv_lists` is named by `list`.
- `src/lib/data/model/model-entities.ts`: `CV_FIELD_ROLES`, the forty roles, beside `ProjectCv`, imported by the reader and the hub list, as `COLLECTION_FLAGS` and `REGISTRY_WORDS` are. `hub-names.ts` adds each role by `CV_FIELD_ROLES.map`, because forty rows would pass the size rule; the file is at 880 lines.
- `papers.ts`: `website.code_statuses.deposited`, `.review_copy` and `website.doi_origin` read in `codeLink`. Either status empty gives no code link and one problem through `audit.msg_site_no_word`, so an anonymous review copy's DOI is never linked for want of its word.
- `site.ts`: `readSite(value, path, key)` reads the map under `website.site_programs`.
- `publication.ts`: `projectCv` keeps every non-null key as `publication()` does (`heldKeys`), `title` and `rank` in their shapes. `ProjectCv` types those two and holds any other key as `unknown`.
- `config/schemas/manifest-schema.yml:121`: `"cv.cv_hide"`. `docs/data-map.md:377`: lists `cv_hide` and says any other key is held as written. `docs/templates.md`: the `cv:` template holds `cv_hide`, as `tests/checks/config/templates.test.ts` requires of every schema field.
- `config/defaults/behavior.yml`, `config/options/behavior.yml`: the 46 new keys, each with an entry, and the groups `website.code_statuses` and `website.cv_fields`. `docs/templates.md`: the paragraph, the default block and the example.

Beyond the brief's text, each following from it:

- `website.site_programs` left empty is one problem through `audit.msg_site_no_word` where a paper names a line, in place of one false finding per line.
- `audit.msg_cv_no_word` no longer speaks only of a period: "the CV needs a word the setting {0} does not hold, so it is written without it: set it".
- `config/options/behavior.yml` help of `website.cv_sections`, `period` and `record_fields`, which named `personal`, `date`, `duration`, `location` and `when`, now names the roles.

Behaviour to know: a `cv:` key of the wrong shape (`hide: "x"`) was dropped when read and is now held and written as given, as the brief asks and as `publication()` does; the manifest schema check names it.

These stay, each a field of a typed record of oculus's own model or a key of a setting's own row: `Publication`'s `program`, `links`, `rank`; the `NamedLink` fields `name`, `url`; `Person`'s `name`, `family`, `email`, `orcid`, `links`, `handle`; `CodeAvailability`'s `status`, `doi`, `url`, `zenodoStatus`; `ProjectCv`'s `title`, `rank`; a setting's own `pub_pre`, `pub_post`, `order`, `key`, `fields`, `record_fields`, `period`.

Keys introduced, checked: an empty role word is the problem above; an empty code status and `site_programs` the same; `doi_origin` has no `empty: true`, so an empty value is refused and the default stands. A word two roles share (`location`) is allowed, since the roles name different records. A word `__proto__` lands as an own key (`written` builds through `Object.fromEntries`) and reads only an own field (`byKey`). A list or a key of the new rows is held to `websiteRowKey`, so neither is empty or `__proto__`. A repeated `list` or `key` is a `repeat` problem, the first standing. A section taking the person block's word is refused at its row.

Brief check 3, with the names of this round added to the pattern, `grep -n -E "'(<all names>)'|papers:|https://doi" src/lib/server/content/audit/website/*.ts`:

```
src/lib/server/content/audit/website/site.ts:90:const FILE_KEYS = ['site', 'cv', 'papers', 'industry'] as const;
```

The one hit is the four keys of `website.files`, a setting's own keys. `cv.ts` has none (`grep -c` prints 0). The same names as `\bname:` and `\.name\b` hit only TypeScript parameters and properties of oculus's own types (`key: string`, `about: null`, `projects: readonly`, `person.name`, `person.email`, `deposit.status`, `row.url`, `kind.order`, `site.programs`) and `words.<role>` reads, each a typed record or a role.

Every line for the hub's `website:` block (`doi_origin` is not among them, since the default is the hub's value):

```yaml
  cv_lists:
    - { list: references, section: references, reference: true }
    - { list: positions, section: experience }
    - { list: degrees, section: education }
    - { list: awards, section: awards }
  cv_entry_fields:
    - { key: title, from: cv_title }
    - { key: url, from: cv_url }
    - { key: status, from: cv_status, own: false }
  cv_fields:
    period: when
    section: cv_section
    rank: cv_rank
    record_key: key
    students: students
    student_person: person
    student_topic: topic
    student_degree: degree
    reference_person: person
    reference_reason: reason
    reference_name: name
    reference_email: email
    funding: funding
    funding_title: title
    funding_place: location
    funding_about: about
    records: records
    record_place: location
    period_text: duration
    timestamp: date
    row_title: title
    row_place: location
    award_title: award
    award_place: location
    award_content: content
    rows: content
    person_block: personal
    first_name: first-name
    last_name: last-name
    person_links: links
    link_email: email
    link_orcid: orcid
    link_place: location
    profiles: profiles
    profile_shared: shared
    shared_place: location
    shared_email: email
    shared_links: links
    students_section: students
    projects_section: projects
  code_statuses: { deposited: deposited, review_copy: review-anon }
  site_programs: programs
```

Lines of `docs/data-map.md` and `docs/HELP.md` not written, for the orchestrator: the count at `docs/data-map.md:162` and `:214` gains these 46 keys (`grep -c` over `CV_FIELD_ROLES` gives 40, plus `website.code_statuses.deposited`, `.review_copy`, `website.doi_origin`, `website.site_programs`, `website.cv_lists`, `website.cv_entry_fields`), and the settings list after `website.kinds` at `:123` gains them.

### Report items (P1, P2, P3, B1)

History words, over the comment lines and titles added or changed, `grep -i -E "\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package)\b"`:

```
help: the words the website prints before the venue of an entry of the row, ...
* not readable, the command's last run still running, and a file the writer cannot take. The page
// path of `website.files` cannot be used, which is refused before the website's own file is read
// and before an approval is asked, while the last run of the command still runs, and when the
// checks it before the first is written, and a file the writer still refuses puts the files of the
// before it is sent, as every write over such a file is (state/sessions/source/write-files.ts,
// of `website.files` cannot be used, while the last run of the command still runs, and when the
```

Each hit is a place in a line of print or the order of a press and a run happening now; none compares with an earlier state of the code.

Each changed name across `src`, `tests`, `config`, `docs`, `README.md`, `grep -rn`: `CV_PERSON_BLOCK`, `CAREER_LISTS`, `FROM_RECORD_ELSE`, `DEPOSITED`, `REVIEW_ANON`, `DOI_ORIGIN`, `CV_LISTS`, `CV_ENTRY_FIELDS` print nothing. `keyedRows` hits only `keyedRowsShape` of `shapes.ts` and `task-seed.ts`, another thing. `PAPER_SETTINGS` and `WebsiteWorld` hit only `tests/fixtures/hubs/website-hub.ts`, where they are now local. `readSite` is in `site.ts`, `publications.ts`, `runs/website.ts`, `website-hub.ts`, `website-files.test.ts`, `cv-fields.test.ts`, `audit.test.ts`, each with its third argument. `projectCv` is in `publication.ts`, `normalise.ts`, `cv-fields.test.ts`.

Each new helper, type and schema, by name, `grep -rl <name> ../O180-base/src ../O180-base/tests` (the tree before the step), run after writing them; the count of files holding the name: `heldKeys` 0, `byRoles` 0, `CvFields` 0, `CvList` 0, `CvEntryField` 0, `CodeStatuses` 0, `CV_FIELD_ROLES` 0, `cvSectionOf` 0, `cvListShape` 0, `cvEntryFieldShape` 0, `namedRows` 0, `FIELD_LINES` 0. `function held` 69, `written` 882 and `type Pair` 5 are local names and a common word, none a helper of this meaning. `paperSettings` 2 is the two files that held it. The key call of `held` and of the record reads, `Object.hasOwn`, has a helper, `byKey` of `guards.ts`, which `held`, `readSite` and `entryOf` use.

File table, `diff -rq ../O180-base/{src,tests,config}` and `git status` for `docs`:

| Path | In the write list |
| --- | --- |
| `src/lib/data/helpers/hub-names.ts` | yes |
| `src/lib/data/model/index.ts` | NO: exports `CV_FIELD_ROLES` and `CvFieldRole`, the facade every reader of the model imports through |
| `src/lib/data/model/machine/model-machine.ts` | yes |
| `src/lib/data/model/model-entities.ts` | yes |
| `src/lib/data/snapshot/normalise-parts/publication.ts` | yes |
| `src/lib/data/sources/config/settings/files.ts` | yes |
| `src/lib/server/content/audit/publications.ts` | yes |
| `src/lib/server/content/audit/website/cv.ts` | yes (round) |
| `src/lib/server/content/audit/website/files.ts` | yes |
| `src/lib/server/content/audit/website/papers.ts` | yes |
| `src/lib/server/content/audit/website/site.ts` | yes |
| `src/lib/server/machine/runs/website.ts` | yes |
| `src/lib/state/sessions/source/website.svelte.ts` | yes |
| `config/defaults/behavior.yml` | yes |
| `config/options/behavior.yml` | yes |
| `config/schemas/manifest-schema.yml` | yes (round) |
| `config/text/views/academic/career.yml` | yes |
| `config/text/views/system/audit.yml` | yes |
| `docs/data-map.md` | yes (round, line 377 alone) |
| `docs/templates.md` | yes |
| `tests/data/hubs/website-files.test.ts` | yes |
| `tests/data/website/cv-fields.test.ts` | yes (round) |
| `tests/data/website/paper-fields.test.ts` | yes |
| `tests/fixtures/hubs/website-hub.ts` | yes |
| `tests/routes/docs/audit.test.ts` | yes |
| `tests/routes/sessions/website.test.ts` | yes |
| `tests/server/root/watch/website-watch.test.ts` | yes |
| `tests/state/sessions/source/website-store.test.ts` | yes |

The run on the unchanged tree of each changed test input: `../O180-base` copied to a scratch folder, the four test files and the fixture of this tree laid over it, each run alone (the folder is removed):

```
tests/server/root/watch/website-watch.test.ts   Tests  1 passed (1)
tests/routes/docs/audit.test.ts                 Tests  1 failed | 40 passed (41)
  FAIL ... name a file that differs and offer no action while website.paper_fields holds no row
  AssertionError: expected '_data/publications.yml differs from w...' to contain 'website.paper_fields'
tests/routes/sessions/website.test.ts           Tests  2 failed | 21 passed (23)
  FAIL ... writes nothing and asks no approval while website.paper_fields holds no row
  FAIL ... writes nothing and asks no approval while website.paper_list is empty
  AssertionError: expected { status: 200, body: { ...(2) } } to deeply equal { status: 409, body: { ...(2) } }
tests/state/sessions/source/website-store.test.ts  Tests  1 failed | 8 passed (9)
  FAIL ... is the sentence of the missing fields while website.paper_fields holds no row
  Error: text key not in the text catalog (config/text/): career.website_no_paper_fields
```

The new rows fail there and the rest pass. `website-watch.test.ts` only had its settings extended so its case keeps building; it passes on both trees and proves nothing of this step by itself.

The six help texts, from `git show HEAD:` and the file now:

- `config/options/behavior.yml`, `order` of `website.kinds` (`:130`). Before: "whether an entry of the row says the user's place among the authors, first, senior or coauthor, read from the manifest's lead, supervisors and collaborators". After: "whether an entry of the row says the user's place among the authors, the word of website.author_places read from the manifest's lead, supervisors and collaborators".
- `pub_pre` (`:134`). Before: "the words the website prints before the venue of an entry of the row; a row without it writes no pub_pre". After: "the words the website prints before the venue of an entry of the row, written under the key of the website.paper_fields row whose from is kind_pre; a row without it writes no such key".
- `pub_post` (`:138`). Before: "the words the website prints after the venue of an entry of the row; a row without it writes no pub_post". After: "the words the website prints after the venue of an entry of the row, written under the key of the website.paper_fields row whose from is kind_post; a row without it writes no such key".
- group `website` (`:1687` of the first pass). Before: "The website the hub's files are written into: its folder, the command run in it once the files are written, the sections of its publications, the sections of its CV and the words a CV's period prints, and the paths of its four files." After: "The website the hub's files are written into: its folder, the command run in it once the files are written, the sections of its publications, the fields an entry of them writes with the name of the code link, the words of the user's place among the authors, the code statuses and the DOI address its code links use and the key of the research lines in its own file, the sections of its CV, the career lists and entry fields the CV reads, the word of each field the CV reads and writes, the words a CV's period prints, and the paths of its four files."
- `config/schemas/manifest-schema.yml:105`, `publication.authors`. Before: "... listed in the website's publications; its title, year, section, your place among the authors, the words around the venue and the Code link are taken from the rest of the manifest." After: "... listed in the website's publications; the rows of the hub's website.paper_fields say which fields an entry writes and which are taken from the rest of the manifest."
- `config/schemas/manifest-schema.yml:109`, `publication.links`. Before: "... The Code link is added after them from the code deposit: ...". After: "... The code link is added after them, under the name website.code_link_name holds, from the code deposit: ...". The rest of the sentence is unchanged.

A record link already named as `website.code_link_name`, from a run of `papersFile` over a project holding `links: [{ name: Code, url: https://example.org/own }, { name: Slides, ... }]` and a deposited DOI:

```
{"value":{"journal":{"papers":[{"links":{"Code":"https://doi.org/10.1/x","Slides":"https://example.org/slides"}}]}},"problems":[]}
```

The code link replaces the record's link of that name, at the record's place in the list, and no problem is raised.

### Standards

- S2: `src/lib/state/sessions/source/website.svelte.ts:9-15`, the paragraph rewrapped to 100 columns.
- S3: `PAPER_SETTINGS` and `WebsiteWorld` in `tests/fixtures/hubs/website-hub.ts` are local. New exports of the fixture are `CV_FIELDS`, `FIELD_LINES` and `paperSettings`, each imported by a test; `paperSettings` moved out of `audit.test.ts`, which would otherwise pass the size rule (874 lines now).
- S4: `site.ts:1-6` says the website's words and field names stand in the hub's settings and in no code. The head comment of `cv.ts` is rewritten to name roles, not fields; the head comment of `papers.ts` names the code statuses and the DOI address as settings.
- S5: `docs/templates.md` at the `publication:` comment and the help of `website.paper_fields` say a key of `publication:` the manifest schema does not name needs a row in the hub's `manifest_fields`.
- P4: no change, as the brief says.

Comments and documents re-read for this round: head of `cv.ts`, `papers.ts`, `site.ts`, `publication.ts` rewritten; `websiteSettings`, `WebsiteSettings` doc comments rewritten; `ProjectCv` doc comment rewritten; `website-hub.ts` head comment still true.

The scratch folder `.agents/scratch` is removed. `../tmp-O180-r` and `../migration-O180-round-1` stand beside the worktree, dated 22:08 to 22:32 by `ls -la`, ahead of this round's edits; they were left in place and their origin is not verified.
