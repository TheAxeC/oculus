NOT done: verify item 1 did not print `every command passed`. Its last line is `test:quick: 349.9 s; failed: vitest slow`, and its only red rows are the 11 of `tests/server/edit/config-key.test.ts`, a file this step does not change, left for landing by the round's brief. No other file has a red row. Everything else in the brief and in round 1 is done.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md`, the section "Open items" (line 175), holds no item. Its text:

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## Repair round 1

### What changed

| Section | Finding | Change | Proof |
| --- | --- | --- | --- |
| 1 | B1 | `src/lib/state/sessions/source/website.svelte.ts`, `off()`: with the person known and the folder set, returns `t('career.website_no_cv_sections')` while `setting.cvSections` is empty, so the button is disabled with that sentence as its tip; the head comment says so. The refusal in `runs/website.ts` stays. | row 'is the sentence of the missing sections while website.cv_sections holds none' (`tests/state/sessions/source/website-store.test.ts`) |
| 2 | B2 | `src/lib/server/content/audit/publications.ts`, the finding that a file differs: `action: 'website'` only while `check.setting.cvSections` holds a section; the head comment says so. | row 'name a file that differs and offer no action while website.cv_sections holds no section' (`tests/routes/docs/audit.test.ts`), which also asserts the file does differ |
| 3 | B5 | `src/lib/data/sources/config/catalogs.ts`, the `once` key holds `problem.issue.row` for `problem.where === 'row'` (`catalogs.ts:340`), so two refused rows of one setting are two findings and one row with several issues stays one finding. | the run quoted below and the guarded row 'names a key the reader does not know' (`tests/server/core/reader/reader.test.ts`, unchanged); no row of `tests/data/hubs/website-files.test.ts` reads the catalog's findings, so none was added. |
| 4, ST1 | ST1 | `docs/templates.md:326-329`: in an employer CV the period is the period text, in the same field the row's `period` picks; a supervision entry's student is always in `duration`. | read against `src/lib/server/content/audit/website/cv.ts` `withPeriod` |
| 4, ST2 | ST2 | The help of `website.cv_sections` in `config/options/behavior.yml:144` and `docs/templates.md:330-332`: a key must start with a lower-case letter, hold only lower-case letters, digits, `_` and `-`, and not be `personal` (the code's `^[a-z][a-z0-9_-]*$` with its refusal of `personal`). | read against `cvSectionShape` in `src/lib/data/sources/config/settings/files.ts` |
| 4, ST3 | ST3 | `tests/data/hubs/website-files.test.ts:574`: the row is now titled 'a section only the setting names is written in its place with its own fields only'. | `grep -c "did not have\|a row of the setting names" .scratch/migration/agents/guarded.md` prints `0`: no line of `agents/guarded.md` names the old title, so no line there needs the new one (G139 names "every row" of that describe). |
| 5 | ruling 740 | `cv_hide` at `src/lib/data/model/model-entities.ts:249`, `src/lib/data/snapshot/normalise-parts/publication.ts:62`, `src/lib/server/content/audit/website/papers.ts:105`, `config/schemas/manifest-schema.yml:113`, `docs/data-map.md:372` (the only line of that file written), `docs/templates.md:1032`. | row 'cv_hide is written through, true and false alike, and absent when the manifest holds none' (`tests/data/hubs/website-files.test.ts:426`), its two manifests `off-cv` and `on-cv` in `tests/fixtures/hubs/website-hub.ts` |

Every place that lists a publication's fields carries `cv_hide`: `grep -rn "pub_last" src config docs tests utils README.md --exclude=local.yml` prints six lines, in the six files of section 5.

### First run of the new rows, on the tree before this round's code change

`npx vitest run tests/data/hubs/website-files.test.ts tests/routes/docs/audit.test.ts -t "cv_hide is written through|offer no action while website.cv_sections holds no section"` printed `Tests  2 failed | 99 skipped (101)`, and `npx vitest run tests/state/sessions/source/website-store.test.ts --reporter=verbose` printed `Tests  1 failed | 7 passed (8)`.

| Row | Line on the tree before the change |
| --- | --- |
| 'cv_hide is written through, ...' (website-files) | `AssertionError: expected undefined to be true // Object.is equality` |
| 'name a file that differs and offer no action ...' (audit) | `AssertionError: expected [ { scope: 'website', ...(8) }, ...(1) ] to deeply equal []`, both findings carrying `"action": "website"` |
| 'is the sentence of the missing sections ...' (website-store) | `AssertionError: expected 'Write _data/data.yml, _data/publicati...' to be 'The setting website.cv_sections is no...' // Object.is equality` |

The row of ST3 only changes a title. All three rows pass after the change (the runs under "Verify lines").

### The run for section 3

`node .agents/scratch/case-two-rows.ts` (removed before this report), after the change:

```ts
import { parse } from 'yaml';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import { settingFindings } from '../../src/lib/data/sources/config/catalogs.ts';

const engine = engineDir();
const { config, from } = loadConfig(engine);
const where = { engine, hub: null, from };
const website = {
    ...(config.website as Record<string, unknown>),
    cv_sections: [
        { key: 'personal', fields: ['title'] },
        { key: 'news', fields: ['title'] },
        { key: 'NOT_LOWER', fields: ['title'] }
    ]
};
const report = (name: string, key: string, held: Record<string, unknown>): void => {
    const found = settingFindings(where, { ...config, ...held }).filter((one) => one.key === key);
    console.log(`${name}: ${found.length} finding(s)`);
    for (const one of found) console.log(`  ${one.message}`);
};
const bad = (id: string): string =>
    `    - { key: ${id}, name: Mine, format: json, adress: "https://example.org/works", records: items }\n`;
report('two refused rows of website.cv_sections', 'website.cv_sections', { website });
report('one source row with two issues', 'literature.sources', parse(`literature:\n  sources:\n${bad('mine')}`));
report('two source rows with two issues each', 'literature.sources', parse(`literature:\n  sources:\n${bad('mine')}${bad('other')}`));
```

```
two refused rows of website.cv_sections: 2 finding(s)
  website.cv_sections holds a row website.cv_sections[0] that is not of the shape of a row; it is not read
  website.cv_sections holds a row website.cv_sections[2] that is not of the shape of a row; it is not read
one source row with two issues: 1 finding(s)
  the row mine of literature.sources holds adress, which is not a key a reader row takes; the row is read without it
two source rows with two issues each: 2 finding(s)
  the row mine of literature.sources holds adress, which is not a key a reader row takes; the row is read without it
  the row other of literature.sources holds adress, which is not a key a reader row takes; the row is read without it
```

Section 3 has no row, so this program has no line on the tree before the change. Read from the code, the former key was `row:website.cv_sections` for both rows, which keeps the first alone; that sentence is an inference from the code, not a run. Only the first issue of a row is named: the second issue of the row `mine`, its missing `address`, is not a finding of its own, as the guarded row expects.

### Verify lines

Run once after the last change, with `TMPDIR` unset for the npm commands.

| Item | Command | Last lines | State |
| --- | --- | --- | --- |
| 1 quick list | `npm run diagrams`, then `npm run test:quick` | `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok svelte-check (14.8 s): ... 591 FILES 0 ERRORS 0 WARNINGS`, `ok eslint`, `ok vitest checks`, `ok vitest (273.1 s)`; `FAILED vitest slow (346.7 s)`; `Tests  11 failed | 654 passed | 316 skipped (981)`; `test:quick: 349.9 s; failed: vitest slow` | NOT DONE: no `every command passed`; the red rows are named below |
| 2 the brief's test files | `npx vitest run tests/data/hubs/website-files.test.ts tests/routes/docs/audit.test.ts tests/routes/sessions/website.test.ts tests/checks/config/templates.test.ts --reporter=dot` | `Test Files  4 passed (4)`, `Tests  127 passed (127)` | DONE |
| the store's rows, the reader's rows and the config checks | `npx vitest run tests/state/sessions/source/website-store.test.ts tests/server/core/reader/reader.test.ts tests/checks/config/config.test.ts --reporter=dot` | `Test Files  3 passed (3)`, `Tests  122 passed (122)` | DONE |
| the guarded reader row alone | `npx vitest run tests/server/core/reader/reader.test.ts --reporter=dot` | `Test Files  1 passed (1)`, `Tests  72 passed (72)` | DONE |
| 3 removed names | `grep -n -E '\b(SECTIONS|TITLED|AWARDS|FROM_RECORD|MONTHS|OPEN_END|AWARD_TIME)\b' src/lib/server/content/audit/website/cv.ts` | prints nothing, exit 1 | DONE |
| 4 size | `wc -l src/lib/server/content/audit/website/cv.ts` | `561` | DONE |
| 5 hub file | the `python3 -B -c "import yaml;..."` of the brief | `10 ['references', 'experience', 'academic', 'students', 'news', 'education', 'grants', 'projects', 'awards', 'extracurricular'] 12 Current 15:59:00-0400` | DONE |
| 6 tests on the unchanged tree | the first-run tables of this report | every new row fails for the behaviour added, except the three rows named as pinning kept behaviour | DONE |
| 7 unused exports | `sh utils/unused-exports.sh` compared with `.agents/worktrees/O178-base/unused-exports.txt` | `diff` prints nothing, exit 0; no added line | DONE |
| ASCII, the 14 files this round changes | a Python scan of each file for a character above 127 | `lines with a non-ASCII character: 0 files: 14` | DONE |
| history words | `git diff -U0 -- src tests config docs \| grep -E "^\+.*(\/\/\|\* \|\/\*\*\|it\(\|rule:)" \| grep -iE "\b(before\|used to\|no longer\|still\|always has been\|always had\|as before\|previously\|the step adds\|after this package)\b"` | seven comment lines, judged below | DONE |

Red rows of the list:

- `tests/server/edit/config-key.test.ts`, 11 rows of the describe 'a write that names a hub': `AssertionError: expected true to be false` at line 458, `existsSync(join(made.hub, '..', 'x'))`. `ls -la /tmp/x` shows a file of that name, dated Nov 9 13:09, on this machine. The round's brief leaves these rows for landing; the file is not changed by this step (`git diff --stat -- tests/server/edit/config-key.test.ts tests/server/core/reader` prints nothing).

No other file has a red row in the list.

`npm run diagrams` changed no file under `docs/diagrams` (`git status --short docs` lists `docs/data-map.md` and `docs/templates.md` alone).

## The cases' first run (the step)

Run on the unchanged source tree, with only the test files and the fixture written: `npx vitest run tests/data/hubs/website-files.test.ts tests/routes/docs/audit.test.ts tests/routes/sessions/website.test.ts --reporter=verbose`. Last line of that run: `Tests  18 failed | 102 passed (120)`. The real hub case: `node .agents/scratch/case-real-hub.ts`, source and output below. No case's rule was found wrong.

| Case | Row (file) | Result on the unchanged tree |
| --- | --- | --- |
| The ten rows of item 6 over the test hub | "the settings' ten rows write the CV the hub gives: ..." (website-files) | passes: `<check mark> ... the settings' ten rows write the CV the hub gives`; it pins the output the unchanged code gives |
| A row `service` between `academic` and `students` | "a section only the setting names is written in its place with its own fields only" | `AssertionError: expected [ 'academic', 'students' ] to deeply equal [ 'academic', 'service', 'students' ]` |
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

The three passing rows pin behaviour the step moves into the settings without changing it, so the unchanged code passes them. Every other new row fails on the unchanged tree for the behaviour the step adds, as quoted.

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

Its output on the unchanged tree and after this round's last change is the same text:

```
CV _data/data.yml: same=true (9731 vs 9731 chars)
employer CVs _data/industry.yml: same=true (33821 vs 33821 chars)
base problems: 28, tree problems: 28
problems only in tree: []
problems only in base: []
```

The run after the change builds with the hub worktree's ten rows and words read by the worktree's code and the base's constants by the base copy, so `same=true` is the comparison the case asks for. It covers the CV's and the employer CVs' text from the hub worktree's tracked files; `self` is the people entry `axel-faes`, and `website.files.site` is read as absent.

## DONE / NOT DONE

| Item | Command | Output of the final run | State |
| --- | --- | --- | --- |
| Rounds' sections 1, 2, 4, 5 | the rows and greps of "Repair round 1" | as quoted there | DONE |
| Round's section 3 | `node .agents/scratch/case-two-rows.ts`; `npx vitest run tests/server/core/reader/reader.test.ts --reporter=dot` | `2 finding(s)` for two refused rows, `1 finding(s)` for one row with two issues; `Tests  72 passed (72)` | DONE |
| Verify item 1 | `npm run test:quick` | `test:quick: 349.9 s; failed: vitest slow` | NOT DONE, only the 11 rows of `tests/server/edit/config-key.test.ts`, left for landing |
| Verify items 2 to 7 | the table under "Verify lines" | as quoted there | DONE |
| Step: `CvInput` gains sections and words, each caller passes them | verify item 2 | `Tests  127 passed (127)` | DONE |
| Step: settings, reader, `cv.ts`, hub key lists, refusal, sentences, `docs/templates.md`, the hub lines | the rows of the test files of verify item 2 and the real-hub case | `Tests  127 passed (127)`; `same=true` twice | DONE |

## The terms

`docs/glossary.md` does not exist (`ls docs/glossary.md`: no such file); no term to list.

## Files with line counts

`diff -rq` against `.agents/worktrees/O178-base` over `src`, `tests`, `config`, `utils`, and `git status --short` for `docs`:

| Path | Lines | Outside the write list |
| --- | --- | --- |
| `src/lib/server/content/audit/website/cv.ts` | 561 | |
| `src/lib/server/content/audit/website/site.ts` | 126 | |
| `src/lib/server/content/audit/website/papers.ts` | 179 | named by round 1 |
| `src/lib/server/content/audit/publications.ts` | 139 | named by round 1 |
| `src/lib/server/machine/runs/website.ts` | 239 | |
| `src/lib/data/sources/config/settings/files.ts` | 355 | |
| `src/lib/data/sources/config/catalogs.ts` | 424 | named by round 1 |
| `src/lib/data/helpers/hub-names.ts` | 863 | |
| `src/lib/data/model/machine/model-machine.ts` | 853 | |
| `src/lib/data/model/model-entities.ts` | 810 | named by round 1 |
| `src/lib/data/snapshot/normalise-parts/publication.ts` | 83 | named by round 1 |
| `src/lib/state/sessions/source/website.svelte.ts` | 225 | |
| `config/text/views/academic/career.yml` | 43 | |
| `config/options/behavior.yml` | 1666 | |
| `config/defaults/behavior.yml` | 957 | |
| `config/text/views/system/audit.yml` | 77 | |
| `config/schemas/manifest-schema.yml` | 135 | named by round 1 |
| `docs/templates.md` | 1969 | |
| `docs/data-map.md` | 478 | named by round 1, line 372 alone (`git diff -U0 -- docs/data-map.md` shows one line removed and one added) |
| `tests/data/hubs/website-files.test.ts` | 880 | |
| `tests/routes/docs/audit.test.ts` | 854 | |
| `tests/routes/sessions/website.test.ts` | 451 | |
| `tests/state/sessions/source/website-store.test.ts` | 115 | yes: section 1 disables the button when no section is set, so its fixture `settingsOf` must hold a section, and the new outcome is one row of G140's describe 'the tip of Write the website' (`spec.md:60`, one row per input that gives a different outcome) |
| `tests/fixtures/hubs/website-hub.ts` (new) | 287 | yes: the round's section 5 names it; the file exists because the test file would otherwise pass the size rule (`spec.md:48`, refusal at 900 by `tests/checks/tree/size.test.ts`) |
| `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O178/.oculus/config.yml` (`git status --short`: ` M .oculus/config.yml`) | hub file | unchanged by this round |
| `.scratch/migration/agents/reviews/O178-report.md` | this report | |

`.scratch/migration/agents/guarded.md` shows as modified in `git status` and is the orchestrator's (the review's Spec S2); this round did not write it. `src/lib/server/content/audit/website/files.ts` is on the write list and needed no change: `WebsiteInput` is `PapersInput & CvInput & { paths }`, so it took the new fields through `CvInput`.

## Judgment calls the brief left open, each a decision the orchestrator may reverse

1. `Cv.add` takes the row's place and a function that makes the row's fields, called only when the section is listed. A row written nowhere needs no period word, so `cv_sections: []` gives one problem per row and no `msg_cv_no_word`. The `Row` type does not keep the place, since nothing reads it after the row is added.
2. A blank entry among twelve `months` counts as a word the setting does not hold (year alone, one problem), so a blank month word cannot print a leading space.
3. `printed` reads a field name only from the row's own properties, since field names now come from the setting and a name such as `constructor` must print nothing.
4. `open_end` and `award_time` are trimmed on reading, as the file's other texts are.
5. The refusal `website-no-cv-sections` is checked immediately after `website-no-folder`, so a hub with neither hears about the folder; `off()` tests in the same order.
6. The options file's `groups:` gained `website.cv_words`, and the `website` group's help line names the CV's sections and words; `tests/checks/config/config.test.ts` requires the group line.
7. The `website.cv_sections` entry has no `control`, as `website.kinds` has none: its `fields` make it a list of records.
8. The test rows build with literals from `TEN`, the parsed ten rows of the settings text.
9. Section 1 has no row named by the round's brief. The added row of `website-store.test.ts` is its proof, and the fixture line it needs is the only change to that file's existing text.
10. The manifests of the `cv_hide` row are of form conference, so the journal order the rank row lists stays as it is; the absent case reads the existing manifest `hidden`.

History-word grep: the seven comment lines it prints are "the command's last run still running", "before the website's own file is read and before an approval is asked", "the last run of the command still runs", "before the first is written", "a file the writer still refuses", "refused before it is sent" and "while the last run of the command still". Each is a statement of order or of the current state of a run, with no history in it.

`grep -rn -E "\bFROM_RECORD\b|\bTITLED\b|AWARD_TIME|OPEN_END\b|\bawardDate\b" src tests config docs README.md --exclude=local.yml` prints nothing.

Comments and documents re-read: the head comments of `src/lib/server/content/audit/website/cv.ts`, `src/lib/server/machine/runs/website.ts`, `src/lib/server/content/audit/publications.ts` and `src/lib/state/sessions/source/website.svelte.ts`; the doc comments of `withPeriod`, `periodText`, `add`, `printed`, `WEBSITE_REFUSALS`, `HUB_LIST`, `WebsiteSettings` and `websiteSettings`; the comment of `website:` in `config/defaults/behavior.yml`; the `website:` and `publication:` blocks of `docs/templates.md`; the head comments of the test files. `docs/data-map.md`: see "Doc text". `docs/HELP.md` and `docs/decks.md` name no CV section or word.

## Edits to existing tests

`diff <base copy file> <file> | grep -E '^<' | grep -E 'expect|toEqual|toBe|predicate'` prints nothing for each of the four test files (`tests/routes/docs/audit.test.ts`, `tests/data/hubs/website-files.test.ts`, `tests/routes/sessions/website.test.ts`, `tests/state/sessions/source/website-store.test.ts`): no existing assertion, allow list or predicate changed. Existing tests changed only in their fixtures: `tests/routes/sessions/website.test.ts` `worldOf` writes `cv_sections` (a parameter, default one row) and its head comment names the new refusal; `tests/routes/docs/audit.test.ts` `findingsOf` and `websiteFindings` take an optional `collections` and `generated` and `checkOf` pass the sections and words; `tests/data/hubs/website-files.test.ts` builds `input` with the sections and words and moved its fixtures to `tests/fixtures/hubs/website-hub.ts`; `tests/state/sessions/source/website-store.test.ts` `settingsOf` writes one CV section.

Every new row is a row of G139's, G140's or G125's test as `agents/guarded.md` names them.

## Every host- or user-visible change, before and after

- Settings view, Website section: before, the keys `website.kinds` and the paths. After, also a `website.cv_sections` list of records (key, fields, period, record_fields, each with its help), `website.cv_words.months`, `open_end` and `award_time`, and the group line of `website.cv_words`. State to look at: Settings, the Website section of the primary hub.
- Career view, Write the website, with no CV section set: before, the button was enabled and wrote a CV of its person block alone. After, the button is disabled and its tip is `The setting website.cv_sections is not set, so the website is not written.`; a press that still reaches the server is refused with that sentence and nothing is written. State to look at: a hub whose `.oculus/config.yml` sets no `cv_sections`.
- Audit, section Website: a file that differs while no CV section is set is still a finding, without the Write the website press. New findings: `the row <place> names the CV section <section>, which website.cv_sections does not list, so the row is written nowhere: add it to website.cv_sections or correct the row's section` and `a period of the CV needs a word the setting <key> does not hold, so it prints without it: set it`.
- Settings findings: before, a setting's refused rows gave one finding. After, each refused row of a list of records is its own finding, naming the row's first issue; a row with several issues stays one finding.
- The manifest form, section Website: a checkbox "Hidden on the CV" (`publication.cv_hide`). `_data/publications.yml`: an entry whose manifest holds `cv_hide` writes it, true or false.
- `website.files.cv` and `website.files.industry` of the real hub after the hub's rows land: the same texts as the base code gives (the real-hub case above).

The hub worktree holds the rows; the live hub does not until the orchestrator lands them. Until then a live hub with the step's code landed has Write the website disabled and one audit finding per CV row. The orchestrator lands the hub commit with the oculus commit.

## Wrong or impossible in the brief

Nothing in the brief or the round's brief, as it now stands, was found wrong.

A row is keyed by its `row` label: `cvSections` labels each row by its place, a reader row by its key, and an issue with an empty label (`read.ts:102`, and a value that is no list) is the only one of its setting. A reader row whose key an earlier row holds carries that row's label, so when the earlier row also has an issue the two give one finding, the earlier row's, and the `repeat` issue shows once that issue is corrected.

A key added to `HUB_LIST` must have a line under `groups:` for its dotted parent when the parent is a group of its own (`website.cv_words`); the brief did not name this, and it is under the judgment calls.

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

`/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O178/.oculus/config.yml`, unchanged by round 1. Every other line of the file is as on hub main.

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

Limitations and sharp edges: `.agents/scratch/` is gone (`ls -a .agents` shows `plan.yaml` alone) and no background command of the step still runs. The drawing of the "Hidden on the CV" checkbox and of the disabled button with its tip are not looked at here, since no page is opened. A row with several issues shows only its first in Settings, and the next appears once the first is corrected. The 11 rows of `tests/server/edit/config-key.test.ts` stay red on this machine while `/tmp/x` is there.
