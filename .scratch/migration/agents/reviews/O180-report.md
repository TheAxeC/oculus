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
