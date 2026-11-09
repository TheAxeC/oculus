# Repair round 1 of O180

Read `agents/reviews/O180-refuter.md` and close these findings. The brief `agents/briefs/O180.md` and `agents/spec.md` stay in force. A shortcut is a finding: a narrower reading of an item, or work inside it called outside it, is done or handed back with the reason before the report. Git: only status, diff and show.

Paths written: the files of the brief's "Paths this step writes", and `src/lib/server/content/audit/website/cv.ts`, `config/schemas/manifest-schema.yml`, the `cv.*` line of `docs/data-map.md` (line 377, that line alone), `tests/data/website/cv-fields.test.ts` (new).

## 1. S1, the website's field names (rulings O180 scope and Hardcoding sweep)

After this item no field name, list key or word of the website's files or of the hub's records they are built from stands in `audit/website/`. The settings below are `website:` keys of the hub's `.oculus/config.yml`, default as `author_places` is (the empty text, or `[]` for a list) in `config/defaults/behavior.yml`, except `doi_origin`, each with its entry in `config/options/behavior.yml` and its row in the hub's list in `hub-names.ts`, as item 3 of the brief did for the paper settings. The shapes live in `settings/files.ts`.

`cv.ts`:

- `CAREER_LISTS` becomes the rows of `website.cv_lists`, each `{ list, section, reference? }`; `reference: true` marks the list whose rows `careerFields` builds from a person. Value for this hub: `{ list: references, section: references, reference: true }`, `{ list: positions, section: experience }`, `{ list: degrees, section: education }`, `{ list: awards, section: awards }`.
- `entryFields` reads the rows of `website.cv_entry_fields`, each `{ key, from, own? }`: the entry's `from` field, where it holds one, is written as `key`, and `own: false` leaves the entry's own `key` out. Value for this hub: `{ key: title, from: cv_title }`, `{ key: url, from: cv_url }`, `{ key: status, from: cv_status, own: false }`.
- Every other name reads the map `website.cv_fields`, one word per role. The roles, each with its value for this hub: `period: when`, `section: cv_section`, `rank: cv_rank`, `record_key: key`, `students: students`, `student_person: person`, `student_topic: topic`, `student_degree: degree`, `reference_person: person`, `reference_reason: reason`, `reference_name: name`, `reference_email: email`, `funding: funding`, `funding_title: title`, `funding_place: location`, `funding_about: about`, `records: records`, `record_place: location`, `period_text: duration`, `timestamp: date`, `row_title: title`, `row_place: location`, `award_title: award`, `award_place: location`, `award_content: content`, `rows: content`, `person_block: personal`, `first_name: first-name`, `last_name: last-name`, `person_links: links`, `link_email: email`, `link_orcid: orcid`, `link_place: location`, `profiles: profiles`, `profile_shared: shared`, `shared_place: location`, `shared_email: email`, `shared_links: links`, `students_section: students`, `projects_section: projects`.
- `studentShape` and `sharedShape` read through those words. `settings/files.ts` `CV_PERSON_BLOCK` reads `person_block` from the setting.
- A role whose word is empty reads nothing and writes nothing, and is one problem per build naming `website.cv_fields.<role>` through `audit.msg_cv_no_word`, while `website.cv_sections` holds a row.

`papers.ts`: `DEPOSITED` and `REVIEW_ANON` become `website.code_statuses.deposited: deposited` and `website.code_statuses.review_copy: review-anon`; `DOI_ORIGIN` becomes `website.doi_origin`, whose default in `config/defaults/behavior.yml` is `https://doi.org/`. A code status left empty gives no code link and one problem through `audit.msg_site_no_word`, as `code_link_name` does.

`site.ts:57`: `value.programs` reads `website.site_programs`, value for this hub `programs`.

`publication.ts`: `projectCv` keeps every key whose value is not null as the file gives it, an own key whatever it is called, as `publication()` does, with `title` and `rank` read in their shapes. `ProjectCv` in `model-entities.ts` types `title` and `rank` and holds any other key as `unknown`. Add `"cv.cv_hide"` to `config/schemas/manifest-schema.yml` beside `"cv.hide"`, label `Project hidden on the CV`, type `checkbox`, section `Website`, help saying that it keeps the project off the CV while it stays on the website, in the wording of `publication.cv_hide`. `docs/data-map.md:377` lists `cv_hide` after `hide` and says that any other key is held as written.

These stay, and the report says so with this reason: a field of a typed record of oculus's own model or schema (`Publication`'s `program`, `links`, `rank`, the `NamedLink` fields, `Person`'s fields), and a key of a setting's own row (`pub_pre`, `pub_post`, `order`, `key`, `fields`).

The hub's lines are not written by you. The fixture `tests/fixtures/hubs/website-hub.ts` holds them with the values above, so the existing rows of `tests/data/hubs/website-files.test.ts` show the three generated files unchanged byte for byte, and the report gives every line to add to the hub's `website:` block, in one fenced block.

`tests/data/website/cv-fields.test.ts`, its failing line on the unchanged tree quoted before the change: other words in `cv_lists`, `cv_entry_fields` and `cv_fields` read and write those fields; an empty role is one problem naming it; a manifest's `cv.cv_hide` and a key no setting names are held by `projectCv`; a code status set to another word links by that word.

Brief check 3 is run again over `audit/website/*.ts` with the names above added to its pattern; every hit is explained.

## 2. Report (P1, P2, P3, B1)

The report gains: the three greps `agents/spec.md` requires, each quoted with its hits judged (history words over added comments and titles; each changed name across `src`, `tests`, `config`, `docs`, `README.md`; each new helper, type and schema before writing it); the file table made from `diff -rq` against `../O180-base`, marking each path outside the write list; the run on the unchanged tree of each changed test input (`website-watch.test.ts`, `audit.test.ts`, `website.test.ts`, `website-store.test.ts`), quoted; before and after of the six help texts at `config/options/behavior.yml:130,134,138,1687` and `config/schemas/manifest-schema.yml:105,109`; what a record link already named as `website.code_link_name` does, from a run of a row holding one.

## 3. Standards

- S2: rewrap the paragraph at `src/lib/state/sessions/source/website.svelte.ts:10` to 100 columns.
- S3: `PAPER_SETTINGS` and `WebsiteWorld` in `tests/fixtures/hubs/website-hub.ts` become local unless this round imports them.
- S4: `src/lib/server/content/audit/website/site.ts:3-5` says what is true now: the website's words and field names stand in the hub's settings and in no code. The head comments of `cv.ts` and `papers.ts` are read for the same.
- S5: `docs/templates.md:1046` and the help of `website.paper_fields` at `config/options/behavior.yml:144` add that a key of `publication:` the manifest schema does not name needs a row in the hub's `manifest_fields`.

P4 needs no change.

## Verify

Run the brief's "Verify before you report" again, with `tests/data/website/cv-fields.test.ts` and `tests/checks/config` added. The two red rows of `tests/checks/source/keys.test.ts` over `audit/publications.ts` are not this step's, a fix for them being on main, and are named as such.

Append to `.scratch/migration/agents/reviews/O180-report.md` a section "Repair round 1": each finding with what changed, file and line, and the checks' output.
