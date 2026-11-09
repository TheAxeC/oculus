Oculus main at 48b25ff64. Nothing changed. Two commands in the first turn failed on zsh's `=` expansion and were rerun. Every output quoted below is from the rerun.

Defects the brief should fix before dispatch, in order of cost: F1 to F6 under Names and Implied inputs, and C1 to C3 under Cases and checks.

## Names

Command (build folders excluded where a hit was only a built artefact, `.svelte-kit-app`, `build-app`):
`grep -rn ... -E "paper_fields|paperFields|PapersInput|entryOf|\bPublication\b|publication\(\)|WebsiteSettings|WEBSITE_REFUSALS|website-no-paper-fields|HUB_LIST|WebsiteInput|websiteSettings|websiteFiles|papersFile" -- .` (321 lines).
Also: `grep -rn ... -E "cvSections|cv_sections|website-no-cv|website_no_cv|website: *\{|^\s*website:" -- src tests config docs README.md utils`.

No hit for a new name:
- `grep -rn ... -E "paper_fields|paperFields|website-no-paper-fields|website_no_paper_fields" -- src tests config docs README.md utils` printed nothing, rc=1.

Hits outside the brief's write list, and whether the change makes them false or breaks them:
- `src/lib/data/model/index.ts:431` (`Publication`), `:685` (`WEBSITE_REFUSALS`), `:747` (`WebsiteRefusal`): re-exports. Not broken.
- `src/lib/data/snapshot/normalise.ts:22,305`: caller of `publication()`. Return type widens. Not broken. `grep -rn "normalise-parts/publication" src tests` gives that one importer.
- `src/lib/server/root/watch/portfolio/portfolio.ts:678,757`: `websiteSettings(config)` passed whole as `setting: website`. Carries `paperFields` with no change. Not broken.
- `src/lib/data/sources/config/settings/problems.ts:26,65`: lists the reader. Not broken.
- `entryOf`: every hit other than `papers.ts:86,170` and the helper `tests/data/hubs/website-files.test.ts:145` is an unrelated function of that name.
- `tests/data/hubs/website-files.test.ts:304`: writes a `website:` block with `files:` only and asserts `.files`. Needs no row.
- `docs/data-map.md:123,162,214` and `docs/HELP.md:528` become incomplete or false. `grep -n "thirty-one\|thirty-two" docs/data-map.md` gives lines 162 and 214 ("thirty-one keys"), which become thirty-two. The brief's Conventions has the report name these. Holds.

Constructions of `WebsiteSettings`, `PapersInput`, `WebsiteInput` or a `website:` block, all in the write list:
- `src/lib/data/sources/config/settings/files.ts:338`, `publications.ts:109`, `runs/website.ts:158`
- `tests/routes/docs/audit.test.ts:470,499`, `tests/data/hubs/website-files.test.ts:121-133`, `tests/fixtures/hubs/website-hub.ts:41`
- `tests/routes/sessions/website.test.ts:79,111`, `tests/server/root/watch/website-watch.test.ts:112`, `tests/state/sessions/source/website-store.test.ts:24`

Exhaustive map over `WEBSITE_REFUSALS`: `website.svelte.ts:85` (`Record<WebsiteRefusal, string>`) and `z.enum` at line 81. Both in the write list. No other exhaustive map exists.

Findings:
- **F1 (blocks the first sentence of "What to build").** `src/lib/server/content/audit/website/files.ts:75` holds a field name of the publications file in code: `path[path.length - 1] === 'links'`, the order rule of `differences`, described at lines 10-12. The step makes the links row's key configurable (`{ key: links, from: links_with_code }`). A row named anything else makes the audit stop counting that map's order, with no finding.
  - `grep -n -E "'links'|'papers'|papers:|'program'|'order'|'title'|'url'|'abstract'" src/lib/server/content/audit/website/*.ts` also gives `papers.ts:176`: `value[key] = { papers: ... }`, the file's own field name for a section's list.
  - `files.ts` is in the write list, but item 4 says only that `websiteFiles` passes the setting on. No item touches `differences` or line 176.
  - `CODE = 'Code'` (`papers.ts:26`) is a key written into the `links` map. It stays too.
  - Brief line 26 ("no field name of the website's publications file stands in `papers.ts`") is false for `papers` at line 176, and for `program` and `links` read in `programProblems` and `linksOf`. Decision 3 covers only the record keys.
  - The brief should state which of these stay and why, or name the change. Expected for `links`: `differences` takes the key from the row whose `from` is `links_with_code`.
- **F2.** `config/text/views/system/audit.yml:61-62` (`msg_site_differs_no_cv`, `msg_site_differs_whole_no_cv`) say "set website.cv_sections, then write the website". `publications.ts:123,137-145` selects them while `writable` is false. With `cv_sections` set and `paper_fields` empty the sentence names a setting that is already set. `audit.yml` is not in the write list, and item 5 and its case are silent on the sentence.
- **F3.** `tests/data/hubs/website-files.test.ts` is 880 lines today (`wc -l` printed 880). Spec.md:48 caps a file at 880, and about 18 cases go into it, so the split in item 7 is certain, not conditional.
  - `git ls-files tests/data/hubs | wc -l` printed 10, and `utils/folder-check.sh` refuses more than ten. The split cannot sit beside it. `tests/data` holds 8 items (`git ls-files tests/data | awk -F/ '{print $3}' | sort -u | wc -l`), so a new folder there is possible.
  - The destination is not named. It is not in the write list. Verify item 2 runs only the old file.
  - `guarded.md:227` names G139's test by that file, and spec.md:36 forbids the builder from editing `.scratch/`.
  - The brief should name the new path, add it to the write list and verify 2, and book the G139 edit as the orchestrator's.
- **F4.** Item 6 omits head and doc comments the change makes false, though all are in the write list: `publications.ts:4`, `website.svelte.ts:6-7`, `settings/files.ts:321-327`, `website/files.ts:10-12`, `config/defaults/behavior.yml:34`, `config/options/behavior.yml:1636`. Spec.md:72 obliges them anyway. A brief listing part invites a builder to stop at the list.

## The step line

Command: `sed -n 1727p .scratch/migration/plan.md`, ruling `sed -n 3703p` of the same file.

| Part of the step line | Brief item |
|---|---|
| `website.paper_fields`, rows `{ key, from }` in the written order | items 1, 4 |
| `from` left out for the record's field, else the six words | items 1, 4 |
| shipped default empty as for `website.kinds` | item 2 |
| refused while empty as for `website.cv_sections` | item 5 |
| reader keeps every key while the form schema names what is allowed | item 3 |
| 14 rows into the hub's `.oculus/config.yml` | item 8 |
| "a hub commit on Axel's word" | none |
| built by a builder agent | header, "Where you work" |
| Step 0 (`entryOf` 14 fields, `publication()` ten keys, form schema, `manifest_fields`) | premises |

- **F5.** The hub commit has no part. Item 8 leaves an uncommitted change in the hub worktree. The brief does not say the builder leaves it uncommitted, or that the commit waits for Axel's word and is the orchestrator's.
- Order of landing has a consequence the brief does not state. Oculus landing first refuses a press and raises the audit's "differs" on the live hub, with the wrong sentence (F2). The hub commit landing first gives a `findings.config.hub_key_unknown` finding (`hub-layer.ts:~620`).
- Parts with no requirement: none. Items 6 and 7 serve spec.md and guarded entries G83, G139, G140, G125.

## Premises

Each rerun:

| Claim | Check and output | Result |
|---|---|---|
| `papers.ts:90-108`, 14 `put` calls | `grep -n "put(" papers.ts` gives lines 92-105, 14 calls | Count holds. Range inexact: `entryOf` is lines 86-107. |
| `papersFile` is its one caller, called from `files.ts` | `papers.ts:170`, `files.ts:58` | Holds |
| `publication.ts:52-66`, ten keys | read lines 52-65, ten keys | Holds, off by one |
| `model-entities.ts:235` | read | Holds |
| `.publication` grep | Gives `papers.ts:79,87,136,157,169` and `normalise.ts:305` | Conclusion holds; the parenthetical does not: the model is no hit, `model-entities.ts:475` has no leading dot |
| `manifest.ts:120-140` | read; `additionalProperties: false` under prefix and top; `manifest_fields` laid in at `data/index.ts:242` (`withManifestFields`) | Holds |
| `settings/files.ts:227-243,305-320` | read | Holds |
| `config/defaults/behavior.yml` `website:` | read lines 35-44 | Holds; block form, not flow as the brief prints it |
| `options/behavior.yml:141`, `hub-names.ts:769-770` | read | Holds |
| `website.ts:143`, `model-machine.ts:364`, `career.yml:34`, `website.svelte.ts:89,123`, `publications.ts:123` | read | Holds |
| Hub config clean | `git -C <hub> status --short -- .oculus/config.yml` printed nothing, rc=0 | Holds |
| `docs/adr` absent | `ls docs/adr`: no such file; `find docs -iname '*adr*'` printed nothing | Holds |

Anything else that reads a paper's record:
- `grep -rn -E "\.publication\b|publication\?\." src`: only `papers.ts` and `normalise.ts:305`.
- Project form: `fieldValues` (`src/lib/state/forms/schema.ts:443-500`) lists no `publication.*` key, and `grep -rn "'publication\.\|publication\." src/lib/state src/lib/views src/lib/server/edit` printed nothing. So the form's Website controls read no saved value of the record. This exists on the tree and the step does not change it.
- Decks: `{{project.<field>}}` is filled from `project.facts` (`data/sources/deck/read.ts:457`).
- Feeds and exports: no hit.
- Generic walks: `grep -rn -E "Object\.(keys|entries|values)\((project|record...)|\.\.\.project\b|JSON\.stringify\(project" src` and `grep -rn -E "JSON\.stringify\((entities|snapshot|project)|structuredClone\((snapshot|entities)|deepWalk|walkValues|collectStrings|Object\.values\(project\b" src` show none over `publication`; the only `...project.*` hits are `board/items.ts` over other lists.
- What follows from `publication()` keeping every key: the snapshot carries extra keys to the page with no reader. No form spreads it. Judgment: payload size only.

**F6 (false premise of Decision 1 and item 3's head comment).** "The manifest check names a value of the wrong kind" is false for an integer under a `text` field. `src/lib/data/snapshot/schema/record.ts:5`: "A `text` field takes a text and the integer a year is written as".
- A record's `book: 2024` is dropped today (`publication.ts:55`, `textShape`). After item 3 it is held and written, with no finding.
- Every field also accepts null (`record.ts:9`).
- Item 3's comment and Decision 1 need the narrower wording, or the case decided.

## Cases and checks

Against spec.md:

- **C1.** Spec.md:69 requires "its failing line on the unchanged tree" for each test added. These cases pass on the unchanged tree, because the base ignores `paperFields` (vitest strips types): the 14 rows; `project_year`, `kind_pre`, `kind_post` under the unchanged keys; `hide: false`; `abstract:` null; `rank: '3'`; `links` shape. Brief line 57 handles only "a row that cannot compile". It should say what a row that passes at the base quotes.
- **C2.** The brief does not name the base copy's folder in "Where you work", though spec.md:33 says the brief names it. It appears only at verify 5 (`../O180-base/unused-exports.txt`). The real-hub case needs "the base copy's code". The worktree and base copy do not exist yet (`ls` of `.agents/worktrees/migration-O180`, `.agents/worktrees/O180-base` and the hub worktree: no such file), as expected before dispatch.
- **C3.** Verify 1 ("Run with `TMPDIR` set to a folder ... if a temporary-folder row goes red") contradicts spec.md:34, which says `npm run test:quick` runs with `TMPDIR` unset. Spec.md:3: nothing in a brief overrides it.
- Report order (brief line 130) puts open items and the cases' first run before the DONE / NOT DONE table. Spec.md:84 has the table right after the first line.
- Item 8 is a hand edit of a hub file with no script. Spec.md:107 allows hand edits for lines "a builder rewords", and adding lines is outside that wording. The report-lists-before-and-after requirement is met. Holds by its sense.
- Cases fall under existing entries: G139 (`guarded.md:225-227`), G140 (228-230), G125 (`guarded.md:191`). None needs a new entry.
- Cases asking the builder to check or explain a place the step does not change: none.

## The question

"Could this pass without the goal being reached", the goal being that no field name of the publications file stays in code and today's file is still written.

**Goal-level hole.** No case and no verify item checks the absence half. Verify should list:
`grep -n -E "'(authors|title|order|program|book|pub_pre|pub_post|pub_date|url|links|abstract|pub_last|hide|cv_hide|papers)'" src/lib/server/content/audit/website/*.ts`
quoted in the report, read per spec.md:72. An assertion over source text is banned by spec.md:67, so this stays a report line.

Items of "What to build":
- Items 1, 2, 5, 6, 7: yes alone; each is a means. Item 7 also passes with F1 unresolved.
- Item 3: yes, since it does not touch `files.ts:75` or `papers.ts:176`.
- Item 4: yes for the "no field name" half (F1). Yes for the "today's file" half only if rows are wrong in the fixture.
- Item 8: no for "today's file". The rows are correct against the real file (see Implied inputs). Yes for the names half.

Cases:
- 14 rows byte for byte: yes. Passes unchanged on the base, so it proves only that the rows do not change the output. It needs a pinned literal: no such text exists in the fixtures, the file's only expected file text is `TEN_ROWS_CV`. The brief does not say the literal comes from the base and lives in `website-hub.ts`. A literal copied after the change proves nothing.
- `[title, authors]` rows: no.
- `venue_note` held: no.
- `venue_note` absent: yes, passes with a plain `held[key]`. It does not exercise "an own property only".
- `paper_title` from `project_title`: no.
- `project_year`, `kind_pre`, `kind_post`: yes as written, since no row key is given and the unchanged keys pass at the base. It needs row keys other than `pub_date`, `pub_pre`, `pub_post`.
- `author_place` without `order: true`: no.
- `links_with_code`: yes under key `links`, passes at the base. It needs another key, which also exercises F1.
- `{ key: links }` with no `from`: no.
- `hide: false`, `from: nothing`, `__proto__`/`''`, repeated key, reader cases: not about the goal; each bites on its own rule except the base-passing ones in C1.
- Press with no row, button with no row: no for the refusal.
- Audit with no row: yes for the wrong sentence (F2). The case asks only that the file is named and no action offered.
- Real hub run: yes, in two ways. (a) Two empty texts compare the same; the program must print the byte length and entry count of each. (b) The brief does not require the worktree's run to read the rows through `websiteSettings(loadConfig(...))`; rows handed in directly would not exercise item 8 or `HUB_LIST`.

## Implied inputs

- **Fourteen rows against the real file.** `parse` of `side-projects/theaxec.github.io/_data/publications.yml` printed `{"sections":[8 sections],"entries":48,"outside":[],"outOfOrder":0,...}`. No entry holds a key outside the 14 and none out of their order. The rows hold, key order included.
- **Hub with `website.kinds` set and no `paper_fields`.** Default `[]`: press refused, no action, a whole-file differs finding, entries `{}`. Happened in effect on the live hub the day oculus lands first (F2, F5). Expected: refusal `website-no-paper-fields`, and an audit sentence naming `website.paper_fields`.
- **Project with no `publication:`.** `papers.ts:157` skips it, unchanged. No case needed.
- **Settings row with `from` left out.** `cardOf` (`editors/fields.ts:182`) holds no field and `checkedRows` (`reader.ts:141`) skips the check. The row reads as the own field. No case states it.
- **Settings row with `from` emptied.** `fromPick` returns `''` for a `choice` with `empty` (`editors/fields.ts:381-394`), so `from: ''` is a real written value. `checkedRows` passes it (`value-rule.ts:160`). `cvSectionShape` handles the analogue by `z.literal('').transform(() => undefined)` (`settings/files.ts:239`). A shape of `z.enum([...six]).optional()` refuses the row. Missing case. Expected: row kept, reads as the record's own field.
- **`{ key: x, from: }`** (YAML null). `reader.ts:141` checks null, and `choice` refuses it with a `field` problem and the row is left out, as for `period`. Cost small; the brief does not state it.
- **Value in the record that is a map or a list.** Held, and written as nested YAML by `new Document` (`files.ts:42`); `differs` handles it. The website's reading of it is the hub's concern, under Decision 1, limited by F6.
- **Value of an unexpected kind.** `hide: 'yes'` is quoted by `compat`, `book: 2024` is written as a number (F6). No Date or Map can arrive from `parse`.
- **`{ key: constructor }`** with a record lacking it: passes the regex. Without the own-property guard, `held[key]` writes the `Object` function. Missing case. Expected: no key. Spec.md:73 requires reserved-key collisions be checked.
- **A record key `__proto__`.** `yaml` defines it as an own property. A writer copying by assignment sets the prototype of one object. The row key cannot name it. Low cost; the reader should copy with `Object.fromEntries`.
- **Order of refusals.** `website-no-cv-sections` first. `website.test.ts:276` (sections `''`) and `website-store.test.ts:76-77` assume it. The bad-path and folder-missing rows of `website.test.ts` (`worldOf` default `CV_SECTIONS`) need the rows added to that constant, which item 7 covers by "holds what it needs".
- **Real hub run.** `self: axel-faes` is taken from the brief and not verified, since the people file was not readable under this brief. The hub worktree holds no `side-projects/theaxec.github.io` (`git check-ignore` printed the folder as ignored). The text does not depend on it, since `site` only feeds `programProblems`.

## ADRs

`ls docs/adr`: no such directory. `find docs -iname '*adr*'` printed nothing. None.

## Dictated text

The YAML rows of item 8 (`grep -n -F` of each line against the brief):

| Text | Line | Verdict |
|---|---|---|
| `paper_fields:` | 38 | holds |
| `{ key: authors }` | 39 | holds |
| `{ key: title, from: project_title }` | 40 (also 60) | holds |
| `{ key: order, from: author_place }` | 41 | holds |
| `{ key: program }` | 42 | holds |
| `{ key: book }` | 43 | holds |
| `{ key: pub_pre, from: kind_pre }` | 44 | holds |
| `{ key: pub_post, from: kind_post }` | 45 | holds |
| `{ key: pub_date, from: project_year }` | 46 | holds |
| `{ key: url }` | 47 | holds |
| `{ key: links, from: links_with_code }` | 48 | holds |
| `{ key: abstract }` | 49 | holds |
| `{ key: pub_last }` | 50 | holds |
| `{ key: hide }` | 51 (also 67) | holds |
| `{ key: cv_hide }` | 52 | holds |

Two-space indent matches the hub file's siblings and the tree's YAML. Spec.md:50 "Four-space indentation everywhere" read literally would break it, and `config/defaults/behavior.yml` uses two.

Other dictated words:
- Regex `/^[a-z][a-z0-9_-]*$/`, line 28: holds, as `settings/files.ts:236`.
- `paper_fields: []`, lines 29 and 33: holds.
- `website-no-paper-fields`, lines 32, 72, 105: holds.
- `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O180.md` printed nothing.

## Declined to judge

- Whether the "Code" link name and the order words (`first`, `senior`, `coauthor`) count as field names of the file under ruling 744. Axel's ruling does not say; F1 names them.
- Whether `axel-faes` is a people entry; not readable under this brief.

Usage: af5af1f8f126742f6, claude-opus-5-5, 269392 tokens, 39 tool uses, 696 s

## Closed

- F1: ruling 745 and items 2 and 5; `differences` takes the key of the `links_with_code` row (item 5); verify 3 quotes the absence.
- F2: item 7 and the audit case name the settings; `audit.yml` is in the write list.
- F3: the new file `tests/data/website/paper-fields.test.ts` is named, in the write list and in verify 2; G139 is extended in `agents/guarded.md`.
- F4: item 8 lists every comment.
- F5: "Where you work" says the hub change stays uncommitted and the commit is the orchestrator's.
- F6: Decision 1 is worded to what the check accepts.
- C1: the cases say what a row passing at the base quotes; the rows of `project_year`, `kind_pre`, `kind_post` and `links_with_code` use other keys; the 14-row literal comes from the first run.
- C2: the base copy is named.
- C3: verify 1 follows `agents/spec.md`; report order follows it too.
- Implied inputs: `from: ''`, `key: constructor`, a `__proto__` record key (item 4) and the real hub's byte length, entry count and settings read are in the cases.
- Premise wording corrected: `entryOf` range, `publication()` range, the `.publication` grep's result, the block form of the defaults.
