NOT done: verify item 1 did not print `every command passed`. Its last run ended with "test:quick: 370.3 s; failed: vitest, vitest slow"; the red lines are the three files `tests/routes/git/zenodo.test.ts`, `tests/server/edit/config-key.test.ts` and `tests/data/hubs/hub-portfolio.test.ts`, none of which the step changes. Everything else in the brief is done.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md`, the section "Open items", holds no item. Its text:

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first run

Run on the unchanged source tree, with only the test files and the fixture written: `npx vitest run tests/data/hubs/website-files.test.ts tests/routes/docs/audit.test.ts tests/routes/sessions/website.test.ts --reporter=verbose`. Last line of that run: `Tests  18 failed | 102 passed (120)`. The real hub case: `node .agents/scratch/case-real-hub.ts`, source and output below. No case's rule was found wrong, so nothing was handed back.

| Case | Row (file) | Result on the unchanged tree |
| --- | --- | --- |
| The ten rows of item 6 over the test hub | "the settings' ten rows write the CV the hub gives: ..." (website-files) | passes: `<check mark> ... the settings' ten rows write the CV the hub gives`; it pins the output the unchanged code gives |
| A row `service` between `academic` and `students` | "a row of the setting names a section the rows did not have, ..." | `AssertionError: expected [ 'academic', 'students' ] to deeply equal [ 'academic', 'service', 'students' ]` |
| `cv_section: servce` with no such row | "an entry naming a section no row holds is written nowhere ..." | `AssertionError: expected [] to deeply equal [ [ 'applications.an-entry', ...(1) ] ]` |
| A career row naming a missing section | "a career row naming a section no row holds ..." | `AssertionError: expected [] to deeply equal [ [ 'positions.0', 'nowhere' ] ]` |
| A manifest with `cv:` while `projects` has no row | "a manifest with a cv record while no row holds projects ..." | `AssertionError: expected [] to deeply equal [ [ 'projects.accepted', 'projects' ] ]` |
| A student while `students` has no row | "a student while no row holds students ..." | `AssertionError: expected [] to deeply equal [ [ 'an-entry.students.0', ...(1) ] ]` |
| A row other than `awards`, `date`, `period: timestamp` | "a row's period: timestamp writes the period in date ..." | `AssertionError: expected [ { title: 'A post', ...(1) } ] to deeply equal [ { title: 'A post', ...(1) } ]` (received `duration`) |
| `awards` with `duration`, without `period`, and `period: ''` | "a row of awards with no period, or the empty text ..." | `AssertionError: expected [ { ...(4) } ] to deeply equal [ { ...(2) } ]` (received `date`) |
| An employer CV's `awards` row under `period: timestamp` | "an employer CV's awards row under period: timestamp writes the period text in date" | passes; it pins the behaviour the settings keep |
| `record_fields: [url, when]` on `projects` | "a row's record_fields say what a profile row takes from its record" | first half holds; the row fails on its `record_fields: []` half, next line |
| `record_fields: []` on `projects` | same row | `AssertionError: expected [ { title: 'A tool', ...(2) } ] to deeply equal [ { title: 'A tool' } ]` |
| An employer CV's section `teaching` | "an employer CV's section no row names takes the place and the period ..." | passes; it pins the behaviour the settings keep |
| `website.cv_words` with other months and `open_end` | "a period prints the words of website.cv_words" | `AssertionError: expected [ { title: 'A post', ...(1) } ] to deeply equal [ { title: 'A post', ...(1) } ]` (received `Feb. 2023 - Current`) |
| `months: []` with a period holding a month | "months missing prints the year alone and one finding ..." | `AssertionError: expected [ 'Feb. 2023 - Current', ...(1) ] to deeply equal [ '2023 - Current', '2022' ]` |
| `open_end: ''` with an open period | "open_end empty prints the start of an open period alone ..." | `AssertionError: expected [ { title: 'A post', ...(1) } ] to deeply equal [ { title: 'A post', ...(1) } ]` (received `Feb. 2023 - Current`) |
| `award_time: ''` | "award_time empty prints the day alone and is no finding" | `AssertionError: expected '2018-01-01 15:59:00-0400' to be '2018-01-01'` |
| `cv_sections: []` | "no row of the setting writes the person block alone ..." | `AssertionError: expected [ 'personal', 'references', ...(9) ] to deeply equal [ 'personal' ]` |
| A row `key: personal`, `key: ''` and `key: __proto__` | "a row named personal, empty or __proto__ ..." | `AssertionError: expected undefined to deeply equal []` (the reader returns no `cvSections`) |
| A second row with `key: news` | "a key an earlier row holds is left out ..." | `AssertionError: expected undefined to deeply equal [ Array(1) ]` |
| A row with no `fields`, and `fields: []` | "a row with no fields is left out ..." | `AssertionError: expected undefined to deeply equal []` |
| A press with `cv_sections` unset | "writes nothing and asks no approval while website.cv_sections holds no section" (website.test.ts, describe 'a press of Write the website that is refused') | `AssertionError: expected { status: 200, body: { ...(2) } } to deeply equal { status: 409, body: { ...(2) } }` |
| The audit over an entry naming a missing section | "say the row and the section of an entry naming a section website.cv_sections lacks" (audit.test.ts, describe 'the website of the audit') | `AssertionError: expected [] to deeply equal [ [ 'website', 'site', ...(1) ] ]` |
| The real hub (a case-run, no test) | `node .agents/scratch/case-real-hub.ts` | on the unchanged tree, output below: both texts the same |

The three passing rows pin behaviour the step moves into the settings without changing it, so the unchanged code passes them. Every other new row fails on the unchanged tree for the behaviour the step adds, as quoted. No existing test was changed in its assertions; see "Edits to existing tests".

The real hub program, `.agents/scratch/case-real-hub.ts` (removed before this report):

```ts
const HUB = '/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O178';
const ROOTS = {
    base: '/Users/axelfaes/workspace/oculus/.agents/worktrees/O178-base',
    tree: '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O178'
};

async function filesOf(root: string): Promise<{ texts: Record<string, string>; problems: string[]; paths: { cv: string; industry: string } }> {
    const { engineDir, loadConfig } = await import(`${root}/src/lib/data/sources/config.ts`);
    const { portfolioConfigFrom } = await import(`${root}/src/lib/data/index.ts`);
    const { buildOneHub } = await import(`${root}/tests/fixtures/hubs/hub-build.ts`);
    const { websiteSettings } = await import(`${root}/src/lib/data/sources/config/settings/files.ts`);
    const { auditRules } = await import(`${root}/src/lib/server/content/audit/rules.ts`);
    const { websiteFiles } = await import(`${root}/src/lib/server/content/audit/website/files.ts`);
    const { readSite } = await import(`${root}/src/lib/server/content/audit/website/site.ts`);
    const { rootOf } = await import(`${root}/src/lib/data/helpers/hub-names.ts`);
    const config = loadConfig(engineDir(), { hub: HUB }).config;
    const { snapshot } = buildOneHub(HUB, portfolioConfigFrom(config));
    const { entities } = snapshot;
    const key = 'migration-O178';
    const ours = (all: Record<string, { root?: string }>): unknown[] =>
        Object.values(all).filter((one) => rootOf(one) === key);
    const people = Object.values(entities.people) as { id: string; name: string }[];
    const self = people.find((one) => one.id.endsWith(':axel-faes') || one.id === 'axel-faes');
    if (self === undefined) throw new Error('no people entry axel-faes');
    const setting = websiteSettings(config);
    const out = websiteFiles({
        projects: ours(entities.projects),
        collections: ours(entities.collections),
        people,
        career: entities.career,
        self: new Set([self.id]),
        kinds: setting.kinds,
        cvSections: setting.cvSections,
        cvWords: setting.cvWords,
        rules: auditRules(config),
        site: readSite(undefined, setting.files.site),
        paths: setting.files
    });
    return {
        texts: Object.fromEntries(out.files.map((file: { name: string; text: string }) => [file.name, file.text])),
        problems: out.problems.map((one: { key: string; args: unknown[] }) => `${one.key} ${one.args.join(' ')}`),
        paths: setting.files
    };
}

const base = await filesOf(ROOTS.base);
const tree = await filesOf(ROOTS.tree);
const same = (name: string): boolean => base.texts[name] === tree.texts[name];
const lengths = (name: string): string => `${base.texts[name]?.length ?? 'absent'} vs ${tree.texts[name]?.length ?? 'absent'} chars`;
console.log(`CV ${tree.paths.cv}: same=${same(tree.paths.cv)} (${lengths(tree.paths.cv)})`);
console.log(`employer CVs ${tree.paths.industry}: same=${same(tree.paths.industry)} (${lengths(tree.paths.industry)})`);
console.log(`base problems: ${base.problems.length}, tree problems: ${tree.problems.length}`);
const added = tree.problems.filter((one) => !base.problems.includes(one));
const gone = base.problems.filter((one) => !tree.problems.includes(one));
console.log(`problems only in tree: ${JSON.stringify(added)}`);
console.log(`problems only in base: ${JSON.stringify(gone)}`);
```

Its output on the unchanged tree and after the last change is the same text:

```
CV _data/data.yml: same=true (9731 vs 9731 chars)
employer CVs _data/industry.yml: same=true (33821 vs 33821 chars)
base problems: 28, tree problems: 28
problems only in tree: []
problems only in base: []
```

The run after the change builds with the hub worktree's ten rows and words read by the worktree's code and the base's constants by the base copy, so `same=true` is the comparison the case asks for. It is a run of the program that uses `buildOneHub`, so it covers the CV's and the employer CVs' text from the hub worktree's tracked files; `self` is the people entry `axel-faes`, and `website.files.site` is read as absent.

## DONE / NOT DONE

| Item | Command | Last line of the final run | State |
| --- | --- | --- | --- |
| 1 quick list | `npm run diagrams` then `npm run test:quick` with `TMPDIR` unset | `test:quick: 370.3 s; failed: vitest, vitest slow`; `ok prettier`, `ok ASCII gate`; svelte-check passed in this run | NOT DONE as worded: no `every command passed`, red lines only in three files the step does not change (below) |
| 2 three test files | `npx vitest run tests/data/hubs/website-files.test.ts tests/routes/docs/audit.test.ts tests/routes/sessions/website.test.ts --reporter=dot` | `Tests  120 passed (120)` | DONE |
| 3 removed names | `grep -n -E '\b(SECTIONS|TITLED|AWARDS|FROM_RECORD|MONTHS|OPEN_END|AWARD_TIME)\b' src/lib/server/content/audit/website/cv.ts` | prints nothing, exit 1 | DONE |
| 4 size | `wc -l src/lib/server/content/audit/website/cv.ts` | `561` | DONE |
| 5 hub file | the `python3 -B -c "import yaml;..."` of the brief | `10 ['references', 'experience', 'academic', 'students', 'news', 'education', 'grants', 'projects', 'awards', 'extracurricular'] 12 Current 15:59:00-0400` | DONE |
| 6 tests on the unchanged tree | the table above | 18 rows fail for the behaviour added; 3 rows pin kept behaviour | DONE |
| 7 unused exports | `sh utils/unused-exports.sh` against `.agents/worktrees/O178-base/unused-exports.txt` | `diff` prints nothing, exit 0; no added line | DONE |
| `CvInput` gains sections and words, each caller passes them | the verify run above | 120 passed | DONE |
| Settings, reader, `cv.ts`, hub key lists, refusal, sentences, `docs/templates.md`, the hub lines | the rows of the three test files above and `tests/checks/config/templates.test.ts`, in the run `npx vitest run tests/data/hubs/website-files.test.ts tests/routes/docs/audit.test.ts tests/routes/sessions/website.test.ts tests/checks/config/templates.test.ts --reporter=dot` after the last change | `Tests  125 passed (125)` | DONE |

Red lines of the last quick list, none in a file the step changes, each rerun alone with `npx vitest run tests/server/edit/config-key.test.ts tests/data/hubs/hub-portfolio.test.ts tests/routes/git/zenodo.test.ts --reporter=dot`, whose line is `Tests  4 failed | 99 passed (103)`:

- `tests/server/edit/config-key.test.ts`: 11 rows red in the list's slow pass (`AssertionError: expected true to be false` at line 458); all pass alone.
- `tests/routes/git/zenodo.test.ts`: one row red in the list by a timeout (`Test timed out in 5000ms`, the row "writes nothing and names the page when the read after the publish answers 502"); passes alone.
- `tests/data/hubs/hub-portfolio.test.ts`: two rows red in the list by a timeout and four other rows red alone, all `Test timed out in 5000ms` (or 20000ms in the list); nobody reran it further under `spec.md`'s rule on tests outside the step, so the timeouts stand as a line of this report.

The quick list ran twice: the first run found three things in files the step changes (the group help of `website.cv_words`, the comment wrap of `src/lib/data/helpers/hub-names.ts:705`, and a type in `tests/routes/docs/audit.test.ts`), which are fixed, and those files were rerun alone (`Tests 129 passed`). No whole-suite command was run. `npm run diagrams` changed no file under `docs/diagrams` (`git status --short docs` lists `docs/templates.md` alone).

## The terms

`docs/glossary.md` does not exist (`ls docs/glossary.md`: no such file); no term to list.

## Files with line counts

`diff -rq` against `.agents/worktrees/O178-base` over `src`, `tests`, `config`, `utils`:

| Path | Lines |
| --- | --- |
| `src/lib/server/content/audit/website/cv.ts` | 561 |
| `src/lib/server/content/audit/website/site.ts` | 126 |
| `src/lib/server/content/audit/publications.ts` | 139 |
| `src/lib/server/machine/runs/website.ts` | 239 |
| `src/lib/data/sources/config/settings/files.ts` | 355 |
| `src/lib/data/helpers/hub-names.ts` | 863 |
| `src/lib/data/model/machine/model-machine.ts` | 853 |
| `src/lib/state/sessions/source/website.svelte.ts` | 222 |
| `config/text/views/academic/career.yml` | 43 |
| `config/options/behavior.yml` | 1666 |
| `config/defaults/behavior.yml` | 957 |
| `config/text/views/system/audit.yml` | 77 |
| `docs/templates.md` | 1966 |
| `tests/data/hubs/website-files.test.ts` | 872 |
| `tests/routes/docs/audit.test.ts` | 836 |
| `tests/routes/sessions/website.test.ts` | 451 |
| `tests/fixtures/hubs/website-hub.ts` (new) | 273 |
| `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O178/.oculus/config.yml` (`git status --short`: ` M .oculus/config.yml`) | hub file |
| `.scratch/migration/agents/reviews/O178-report.md` | this report |

`src/lib/server/content/audit/website/files.ts` is on the write list and needed no change: `WebsiteInput` is `PapersInput & CvInput & { paths }`, so it took the new fields through `CvInput`.

`tests/fixtures/hubs/website-hub.ts` is outside the write list. `tests/data/hubs/website-files.test.ts` would have reached 1107 lines with the rows the brief asks for, past the size rule (`spec.md:48`, refusal at 900 by `tests/checks/tree/size.test.ts`); `spec.md` says such a file is split by concern in the step. The new file holds the rows' inputs (settings text, the CV the ten rows write, the manifests, the career file, the site text, the shipped paths) and the test file stays at the path `agents/guarded.md` names, 872 lines. `tests/data/hubs` already holds ten items, so the new file sits in `tests/fixtures/hubs` (nine items).

## Judgment calls the brief left open, each a decision the orchestrator may reverse

1. `Cv.add` takes the row's place and a function that makes the row's fields, called only when the section is listed. A row written nowhere needs no period word, so `cv_sections: []` gives one problem per row and no `msg_cv_no_word`. Each row is thus handed its place at `add`; the `Row` type itself does not keep it, since nothing reads the place after the row is added.
2. A blank entry among twelve `months` counts as a word the setting does not hold (year alone, one problem), so a blank month word cannot print a leading space.
3. `printed` reads a field name only from the row's own properties, since field names now come from the setting and a name such as `constructor` must print nothing.
4. `open_end` and `award_time` are trimmed on reading, as the file's other texts are.
5. The refusal `website-no-cv-sections` is checked immediately after `website-no-folder`, so a hub with neither hears about the folder.
6. `off()` in `src/lib/state/sessions/source/website.svelte.ts` is not changed: the button is not disabled while `cv_sections` is unset, and a press is answered with the refusal sentence. The brief names the sentence key and the refusal, and no disabling.
7. The options file's `groups:` gained `website.cv_words`, and the `website` group's help line now names the CV's sections and words; `tests/checks/config/config.test.ts` requires the group line.
8. The `website.cv_sections` entry has no `control`, as `website.kinds` has none: its `fields` make it a list of records.
9. The test rows build with literals from `TEN`, the parsed ten rows of the settings text.

Grep of the test titles and comments the diff adds for the history words of `spec.md`: `git diff -U0 | grep -E "^\+.*(\/\/|\* |\/\*\*|it\(|rule:)" | grep -iE "\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package)\b"` prints six comment lines (`src/lib/server/machine/runs/website.ts`, `src/lib/data/model/machine/model-machine.ts`, `tests/routes/sessions/website.test.ts`). Each is judged: every hit is "before the website's own file is read", "before the first is written" or "the last run of the command still runs", which are statements of order or of the current state of a run, unchanged sentences rewrapped with the new clause, with no history in them.

Grep after the names changed: `grep -rn -E "\bFROM_RECORD\b|\bTITLED\b|AWARD_TIME|OPEN_END\b|\bawardDate\b" src tests config docs README.md --exclude=local.yml` prints nothing, and `periodText` is named only in `src/lib/server/content/audit/website/cv.ts`.

Comments and documents re-read: `src/lib/server/content/audit/website/cv.ts` head comment rewritten; `withPeriod`, `periodText`, `add`, `printed` doc comments rewritten; `src/lib/server/machine/runs/website.ts` head comment rewritten; `src/lib/data/model/machine/model-machine.ts` doc comment of `WEBSITE_REFUSALS` rewritten; `src/lib/data/helpers/hub-names.ts` comment of `HUB_LIST` rewritten; `src/lib/data/sources/config/settings/files.ts` doc comments of `WebsiteSettings` and `websiteSettings` rewritten and head comment still true; `config/defaults/behavior.yml` comment of `website:` rewritten; `docs/templates.md` the `website:` block rewritten; the head comments of the three test files rewritten. `docs/data-map.md`: see "Doc text". `docs/HELP.md` and `docs/decks.md` name no CV section or word (`grep -n -i "cv section\|cv_words" docs/HELP.md docs/decks.md` prints nothing).

## Edits to existing tests

`diff <base copy file> <file> | grep -E '^<' | grep -E 'expect|toEqual|toBe|predicate'` prints nothing for each of the three test files: no existing assertion, allow list or predicate changed. Existing tests changed only in their fixtures: `tests/routes/sessions/website.test.ts` `worldOf` writes `cv_sections` (a parameter, default one row) and its head comment names the new refusal; `tests/routes/docs/audit.test.ts` `findingsOf` and `websiteFindings` take an optional `collections` and `generated`/`checkOf` pass the sections and words; `tests/data/hubs/website-files.test.ts` builds `input` with the sections and words and moved its fixtures to `tests/fixtures/hubs/website-hub.ts`.

The rows' test names failing on the unchanged tree are in the first-run table. Every new row is a row of G139's or G140's test or G125's test, as the brief names: `agents/guarded.md` still names `tests/data/hubs/website-files.test.ts` for G139, and the fixture file holds no test.

## Every host- or user-visible change, before and after

- Settings view, Website section, heading sources: before, the keys `website.kinds` and the paths. After, also a `website.cv_sections` list of records (key, fields, period, record_fields, each with its help), `website.cv_words.months`, `open_end` and `award_time`, and the new group line of `website.cv_words`. State to look at: Settings, the Website section of the primary hub.
- Write the website: before, a hub with no CV sections wrote a CV of its person block alone. After, a press with `website.cv_sections` unset answers the sentence `The setting website.cv_sections is not set, so the website is not written.` under the button, and nothing is written. State to look at: a hub whose `.oculus/config.yml` sets no `cv_sections`, Career view, Write the website.
- Audit, section Website: before, no such findings. After, `the row <place> names the CV section <section>, which website.cv_sections does not list, so the row is written nowhere: add it to website.cv_sections or correct the row's section` and `a period of the CV needs a word the setting <key> does not hold, so it prints without it: set it`.
- `website.files.cv` and `website.files.industry` of the real hub after the hub's rows land: the same texts as the base code gives (the real-hub case above).

The hub worktree holds the rows; the live hub does not until the orchestrator lands them. Until then a live hub with the step's code landed gets the refusal on Write the website and one audit finding per CV row. The orchestrator lands the hub commit with the oculus commit.

## Wrong or impossible in the brief

- The brief's statement that `docs/templates.md` is documented only in lines 315-345 holds, and the block was extended there; nothing in the brief was found wrong.
- A key added to `HUB_LIST` must have a line under `groups:` for its dotted parent when the parent is a group of its own (`website.cv_words`); the brief did not name this, and it is listed under the judgment calls.

## Doc text (for `docs/data-map.md`, not written by this step)

Line 122, as `grep -n` prints it:

```
122:website.kinds:            # the sections of the website's publications, by stage and form
```

Replacement, the same line with these four after it:

```
website.kinds:            # the sections of the website's publications, by stage and form
website.cv_sections:      # the CV's sections in order, each with its fields, period and record fields
website.cv_words.months:     # the twelve month words of the CV's periods
website.cv_words.open_end:   # the CV's word for a period with no end
website.cv_words.award_time: # the time and zone after the day of a CV timestamp
```

Line 158, as `grep -n` prints it:

```
158:Oculus reads twenty-seven keys from the primary hub's file alone: `portfolio_deck`, `career_file`, `bookmarks`, `schedules`, `apps_dir`, `app_settings`, `wallpaper.image`, `docs`, `counts`, `slurm.resource`, `clusters.key_type`, `clusters.key_file`, `connections.failures`, `sign_in`, `recover.node_download`, `lint.writing_skip`, `lint.writing_glyphs`, `literature.sources`, `literature.prefer`, `website.folder`, `website.cv`, `website.kinds`, `website.files.site`, `website.files.cv`, `website.files.papers`, `website.files.industry` and `links`. When another hub sets one of them, the primary's value stands and the key is a finding of that hub's file. Oculus reads the other 42 keys from each hub's own file, and a path among them resolves against the folder of that hub.
```

Replacement:

```
Oculus reads thirty-one keys from the primary hub's file alone: `portfolio_deck`, `career_file`, `bookmarks`, `schedules`, `apps_dir`, `app_settings`, `wallpaper.image`, `docs`, `counts`, `slurm.resource`, `clusters.key_type`, `clusters.key_file`, `connections.failures`, `sign_in`, `recover.node_download`, `lint.writing_skip`, `lint.writing_glyphs`, `literature.sources`, `literature.prefer`, `website.folder`, `website.cv`, `website.kinds`, `website.cv_sections`, `website.cv_words.months`, `website.cv_words.open_end`, `website.cv_words.award_time`, `website.files.site`, `website.files.cv`, `website.files.papers`, `website.files.industry` and `links`. When another hub sets one of them, the primary's value stands and the key is a finding of that hub's file. Oculus reads the other 42 keys from each hub's own file, and a path among them resolves against the folder of that hub.
```

Line 210, as `grep -n` prints it:

```
210:Without `primary:` the workspace has no primary hub. It then has no bookmarks file and no schedules, Settings refuses the twenty-seven keys of the primary and writes a hub's other keys only once a hub is picked, and an update task and an app's new record are refused.
```

Replacement:

```
Without `primary:` the workspace has no primary hub. It then has no bookmarks file and no schedules, Settings refuses the thirty-one keys of the primary and writes a hub's other keys only once a hub is picked, and an update task and an app's new record are refused.
```

## Each hub line before and after

`/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O178/.oculus/config.yml`, from `git diff -U0 -- .oculus/config.yml`. Every other line is unchanged.

Line 42, before:

```
# The website the hub's files are written into by the Career view's Write the website: its folder, the command that builds the CV's PDF there once the files are written, and the sections of its publications. A paper that carries a `publication:` record goes to the section of the first row whose stages and forms hold its own (a side left out holds every one); the sections come in the rows' order, and a row's `order`, `pub_pre` and `pub_post` say whether an entry gives your place among the authors and which words stand before and after the venue. The Audit compares the three files the hub gives with the website's files and is skipped while the folder is not checked out.
```

Line 42, after:

```
# The website the hub's files are written into by the Career view's Write the website: its folder, the command that builds the CV's PDF there once the files are written, and the sections of its publications. A paper that carries a `publication:` record goes to the section of the first row whose stages and forms hold its own (a side left out holds every one); the sections come in the rows' order, and a row's `order`, `pub_pre` and `pub_post` say whether an entry gives your place among the authors and which words stand before and after the venue; `cv_sections` are the CV's sections with the fields each prints and `cv_words` the words a CV's period prints. The Audit compares the three files the hub gives with the website's files and is skipped while the folder is not checked out.
```

Inserted directly under the block `kinds:` of `website:` (no line before them), the fifteen lines of item 6, in that order:

```yaml
  cv_sections:
    - { key: references, fields: [name, email, reason] }
    - { key: experience, fields: [title, location, duration, url, about, hide] }
    - { key: academic, fields: [title, location, duration, url, about, hide] }
    - { key: students, fields: [title, location, duration] }
    - { key: news, fields: [title, location, duration, url, about, hide] }
    - { key: education, fields: [title, location, duration, url, about, hide] }
    - { key: grants, fields: [title, url, duration, role, status, about, hide] }
    - { key: projects, fields: [title, url, duration, role, hide, about], record_fields: [url, when] }
    - { key: awards, fields: [award, event, date, location, content, hide], period: timestamp }
    - { key: extracurricular, fields: [title, location, duration, url, about, hide] }
  cv_words:
    months: [Jan., Feb., Mar., Apr., May, Jun., Jul., Aug., Sep., Oct., Nov., Dec.]
    open_end: Current
    award_time: '15:59:00-0400'
```

Limitations and sharp edges: the `.agents/scratch/` folder is gone (`ls -a .agents` shows `plan.yaml` alone), no background command of the step still runs, and the tests of `hub-portfolio` are red by timeout on this machine as named above.
